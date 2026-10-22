import { NextRequest, NextResponse } from "next/server";
import { verifyMemberSession, getSessionCookieOptions } from "@/lib/user-auth";
import { verifySession, ADMIN_EMAIL } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  try {
    // 1. Check member session cookie or authorization header fallback
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    const customHeaderToken = request.headers.get("x-member-token") || undefined;
    const memberToken = request.cookies.get("member_session")?.value || bearerToken || customHeaderToken;

    if (memberToken) {
      const user = await verifyMemberSession(memberToken);
      if (user) {
        // Enrich from player database if available
        try {
          const { getPlayers } = await import("@/lib/players-store");
          const players = await getPlayers();
          const cleanEmail = user.email?.toLowerCase();
          const matched = players.find(
            (p) =>
              (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) ||
              (user.id && p.id.toLowerCase() === user.id.toLowerCase())
          );
          if (matched) {
            user.name = matched.name || user.name;
            user.phone = matched.phone || user.phone;
            user.dob = matched.dob || user.dob;
            user.gender = (matched.gender as any) || user.gender;
            user.beltRank = matched.beltRank || user.beltRank;
            user.club = matched.club || user.club;
            user.state = matched.state || user.state;
            user.district = matched.district || (matched as any).city || user.district;
            user.city = (matched as any).city || matched.district || user.city;
            user.memberType = (matched.memberType as any) || user.memberType;
            user.status = matched.status || user.status;
            user.avatar = matched.image || user.avatar;
          }
        } catch {}

        // Always generate a fresh, clean, sanitized JWT token (< 500 bytes) to prevent HTTP 431 header overflow
        const { signMemberSession } = await import("@/lib/user-auth");
        const freshToken = await signMemberSession(user);

        const response = NextResponse.json(
          {
            authenticated: true,
            user,
            token: freshToken,
          },
          { headers: NO_CACHE_HEADERS }
        );

        // Ensure session cookie is always synchronized with a clean < 500 bytes token
        response.cookies.set("member_session", freshToken, getSessionCookieOptions(request, 60 * 60 * 24 * 30));

        return response;
      }
    }

    // 2. Check admin session cookie
    const adminToken = request.cookies.get("admin_session")?.value;
    if (adminToken) {
      const isAdminValid = await verifySession(adminToken);
      if (isAdminValid) {
        return NextResponse.json(
          {
            authenticated: true,
            user: {
              id: "KSM-ADMIN-01",
              name: "Administrator",
              email: ADMIN_EMAIL,
              role: "admin",
            },
            token: adminToken,
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Auth session check error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
