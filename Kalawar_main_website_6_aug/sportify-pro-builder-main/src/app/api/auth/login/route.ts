import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/players-store";
import { verifyPassword, signMemberSession, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD, signSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.email || body.playerId || "").trim();
    const password = String(body.password || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please provide your Username or Email Address" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Please enter your account password" },
        { status: 400 },
      );
    }

    // 1. Check if admin credentials
    if (
      identifier.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      const adminUser: AuthUser = {
        id: "KSM-ADMIN-01",
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
      };

      const adminToken = await signSession(ADMIN_EMAIL);
      const response = NextResponse.json({
        success: true,
        user: adminUser,
        token: adminToken,
        message: "Admin sign in successful",
      });

      response.cookies.set("admin_session", adminToken, getSessionCookieOptions(request, 60 * 60 * 24 * 7));
      return response;
    }

    // 2. Check registered athletes in player database
    const players = await getPlayers();
    const cleanId = identifier.toLowerCase();
    const player = players.find((p) => {
      const isPlayer = (p.memberType || "Player") === "Player";
      if (isPlayer) {
        // Player accounts can ONLY log in with Username or Email. NO login with official Player ID.
        const matchesEmail = Boolean(p.email && p.email.toLowerCase() === cleanId);
        const matchesUsername = Boolean(p.username && p.username.toLowerCase() === cleanId);
        return matchesEmail || matchesUsername;
      }
      return (
        p.id.toLowerCase() === cleanId ||
        (p.email && p.email.toLowerCase() === cleanId) ||
        (p.username && p.username.toLowerCase() === cleanId) ||
        p.name.toLowerCase() === cleanId
      );
    });

    if (!player) {
      if (cleanId.startsWith("ksm-pl") || cleanId.startsWith("wsf-pl")) {
        return NextResponse.json(
          {
            success: false,
            error: "Player login with Member ID is disabled. Please sign in using your Username or Registered Email.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "No registered athlete found with this Username or Email. Please check your credentials or register as a new athlete.",
        },
        { status: 404 },
      );
    }

    // 3. Verify member password if set
    if (player.password) {
      const isValidPassword = await verifyPassword(password, player.password);
      if (!isValidPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Incorrect password. Please verify your password and try again.",
          },
          { status: 401 },
        );
      }
    }

    if (!player.email) {
      return NextResponse.json(
        {
          success: false,
          error: "No email address linked to this profile. Please contact the secretariat.",
        },
        { status: 400 },
      );
    }

    // Create member auth user object with full profile details
    const authUser: AuthUser = {
      id: player.id,
      name: player.name,
      email: player.email,
      phone: player.phone,
      dob: player.dob,
      gender: player.gender as any,
      beltRank: player.beltRank,
      club: player.club,
      state: player.state,
      district: player.district || (player as any).city,
      city: (player as any).city || player.district,
      status: player.status,
      role: "member",
      memberType: (player.memberType as any) || (player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL") ? "Club" : "Player"),
      discipline: player.discipline,
      avatar: player.image,
    };

    // Direct Sign In without 2FA OTP for the Member Sign In page
    const token = await signMemberSession(authUser);
    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
      message: `Sign in successful. Welcome back, ${authUser.name}!`,
    });

    response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));
    return response;
  } catch (error) {
    console.error("Member Login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal authentication error",
      },
      { status: 500 },
    );
  }
}
