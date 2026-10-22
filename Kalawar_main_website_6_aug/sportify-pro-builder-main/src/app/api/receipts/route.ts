import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/user-auth";
import { getUserRegistrationReceipts } from "@/lib/receipts-store";
import type { UserReceiptsQuery } from "@/types/receipt";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);

    const paramUserId = searchParams.get("userId") || searchParams.get("memberId") || searchParams.get("id");
    const paramEmail = searchParams.get("email");
    const paramPhone = searchParams.get("phone");
    const paramName = searchParams.get("name");
    const paramCategory = searchParams.get("category") || "all";
    const paramStatus = searchParams.get("status") || "all";
    const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
    const paramYear = searchParams.get("year") || "all";
    const all = searchParams.get("all") === "true";

    const isExplicitAdminAll = user?.role === "admin" && all && !paramUserId && !paramEmail;

    const query: UserReceiptsQuery = {
      userId: paramUserId || (all && user?.role === "admin" ? undefined : (user?.id || undefined)),
      memberId: paramUserId || (all && user?.role === "admin" ? undefined : (user?.id || undefined)),
      email: paramEmail || (all && user?.role === "admin" ? undefined : (user?.email || undefined)),
      phone: paramPhone || undefined,
      name: paramName || undefined,
      category: paramCategory,
      status: paramStatus,
      search: paramSearch,
      year: paramYear,
      role: isExplicitAdminAll ? "admin" : "member",
    };

    // If unauthenticated and no explicit query params provided
    if (!user && !paramUserId && !paramEmail && !paramPhone && !paramName && !all) {
      return NextResponse.json(
        {
          success: true,
          receipts: [],
          stats: {
            totalCount: 0,
            memberRegistrationCount: 0,
            beltExamCount: 0,
            blackBeltDanCount: 0,
            championshipCount: 0,
            refereeCount: 0,
          },
          message: "No authenticated session or query parameters provided.",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const { receipts, stats } = await getUserRegistrationReceipts(query);

    return NextResponse.json(
      {
        success: true,
        receipts,
        stats,
        count: receipts.length,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              memberType: user.memberType,
            }
          : null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/receipts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve receipts",
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
