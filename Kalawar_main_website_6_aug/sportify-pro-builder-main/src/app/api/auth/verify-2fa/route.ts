import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp-store";
import { signMemberSession, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import { ADMIN_EMAIL, signSession } from "@/lib/admin-auth";
import { getPlayers } from "@/lib/players-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tokenOrId = String(body.tempToken || body.token || body.identifier || body.email || "").trim();
    const code = String(body.code || body.otp || "").trim();

    if (!tokenOrId) {
      return NextResponse.json(
        { success: false, error: "Session verification token missing or expired. Please sign in again." },
        { status: 400 }
      );
    }

    if (!code || code.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please enter the complete 6-digit verification code" },
        { status: 400 }
      );
    }

    // Verify the OTP asynchronously across shared memory and MongoDB
    const verification = await verifyOTP(tokenOrId, code, "login");
    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid or expired verification code",
        },
        { status: 400 }
      );
    }

    let authUser = verification.userData as AuthUser | undefined;

    // Fallback: If userData wasn't stored in OTP, restore from database
    if (!authUser && verification.email) {
      if (verification.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        authUser = {
          id: "KSM-ADMIN-01",
          name: "Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
        };
      } else {
        const players = await getPlayers();
        const player = players.find((p) => p.email && p.email.toLowerCase() === verification.email!.toLowerCase());
        if (player) {
          authUser = {
            id: player.id,
            name: player.name,
            email: player.email,
            role: "member",
            discipline: player.discipline,
            avatar: player.image,
          };
        }
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Could not retrieve authenticated user profile. Please sign in again." },
        { status: 400 }
      );
    }

    // Handle Admin Session
    if (
      authUser.role === "admin" ||
      (authUser.email && authUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    ) {
      const adminToken = await signSession(ADMIN_EMAIL);
      const response = NextResponse.json({
        success: true,
        message: "Admin authenticated successfully via 2FA",
        user: authUser,
        token: adminToken,
      });

      response.cookies.set("admin_session", adminToken, getSessionCookieOptions(request, 60 * 60 * 24 * 7));

      return response;
    }

    // Handle Member Session
    const token = await signMemberSession(authUser);
    const response = NextResponse.json({
      success: true,
      message: `2FA Verification Successful. Welcome back, ${authUser.name}!`,
      user: authUser,
      token,
    });

    response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));

    return response;
  } catch (error) {
    console.error("2FA Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal verification error",
      },
      { status: 500 }
    );
  }
}
