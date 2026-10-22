import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/players-store";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { createOTP, getMaskedEmail } from "@/lib/otp-store";
import { sendPasswordResetOTPEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.email || body.playerId || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please enter your Player ID or registered email address." },
        { status: 400 },
      );
    }

    const cleanId = identifier.toLowerCase();

    // 1. Check if Admin email
    if (cleanId === ADMIN_EMAIL.toLowerCase()) {
      const adminData = {
        id: "KSM-ADMIN-01",
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
      };

      const { code, tempToken, expiresAt } = createOTP(ADMIN_EMAIL, "reset", adminData);
      await sendPasswordResetOTPEmail(ADMIN_EMAIL, "Administrator", code);

      return NextResponse.json({
        success: true,
        tempToken,
        maskedEmail: getMaskedEmail(ADMIN_EMAIL),
        expiresAt,
        message: `A 6-digit password reset verification code has been sent to ${getMaskedEmail(ADMIN_EMAIL)}`,
      });
    }

    // 2. Lookup registered athlete / member / coach / referee / club
    const players = await getPlayers();
    const player = players.find(
      (p) =>
        p.id.toLowerCase() === cleanId ||
        (p.email && p.email.toLowerCase() === cleanId) ||
        p.name.toLowerCase() === cleanId,
    );

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          error: "No registered athlete or member profile found with this Player ID or Email. Please check your credentials.",
        },
        { status: 404 },
      );
    }

    if (!player.email) {
      return NextResponse.json(
        {
          success: false,
          error: "No email address is linked to this membership profile. Please contact the federation secretariat for assistance.",
        },
        { status: 400 },
      );
    }

    const userData = {
      id: player.id,
      name: player.name,
      email: player.email,
      role: "member",
      memberType: player.memberType || (player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL") ? "Club" : "Player"),
    };

    // 3. Generate secure 6-digit reset OTP
    const { code, tempToken, expiresAt } = createOTP(player.email, "reset", userData);
    await sendPasswordResetOTPEmail(player.email, player.name, code);

    return NextResponse.json({
      success: true,
      tempToken,
      maskedEmail: getMaskedEmail(player.email),
      expiresAt,
      message: `A 6-digit password reset verification code has been sent to ${getMaskedEmail(player.email)}`,
    });
  } catch (error) {
    console.error("Forgot Password Request Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initiate password reset",
      },
      { status: 500 },
    );
  }
}
