import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp-store";
import { getPlayers, updatePlayer } from "@/lib/players-store";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { sendPasswordResetSuccessEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tempToken = String(body.tempToken || body.token || "").trim();
    const code = String(body.code || body.otp || "").trim();
    const newPassword = String(body.newPassword || body.password || "").trim();

    if (!tempToken) {
      return NextResponse.json(
        { success: false, error: "Reset session has expired. Please request a new password reset link." },
        { status: 400 },
      );
    }

    if (!code || code.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please enter the complete 6-digit verification code." },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    // Verify OTP with action "reset"
    const verification = await verifyOTP(tempToken, code, "reset");
    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid or expired verification code.",
        },
        { status: 400 },
      );
    }

    const email = verification.email || verification.userData?.email;
    const userId = verification.userData?.id;
    const userName = verification.userData?.name || "Member";

    // 1. Handle Admin reset notice
    if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (email) {
        await sendPasswordResetSuccessEmail(email, "Administrator");
      }
      return NextResponse.json({
        success: true,
        message: "Admin password verification completed successfully.",
      });
    }

    // 2. Update Member / Athlete / Coach / Referee / Club password
    let targetPlayerId = userId;
    let targetPlayerName = userName;

    if (!targetPlayerId && email) {
      const players = await getPlayers();
      const player = players.find(
        (p) => p.email && p.email.toLowerCase() === email.toLowerCase(),
      );
      if (player) {
        targetPlayerId = player.id;
        targetPlayerName = player.name;
      }
    }

    if (!targetPlayerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not locate the associated athlete profile. Please contact the federation secretariat.",
        },
        { status: 404 },
      );
    }

    // updatePlayer automatically hashes the password with SHA-256 and salt
    const updated = await updatePlayer(targetPlayerId, { password: newPassword });
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update password in database. Please try again.",
        },
        { status: 500 },
      );
    }

    // Send confirmation email
    if (email) {
      await sendPasswordResetSuccessEmail(email, targetPlayerName);
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been changed successfully. You can now sign in with your new credentials.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error occurred while resetting password",
      },
      { status: 500 },
    );
  }
}
