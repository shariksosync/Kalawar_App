import { NextResponse } from "next/server";
import { createOTP, getMaskedEmail, findActiveOTP } from "@/lib/otp-store";
import { send2FAOTPEmail } from "@/lib/email-service";
import { getPlayers } from "@/lib/players-store";
import { ADMIN_EMAIL } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let email = String(body.email || "").trim().toLowerCase();
    const identifier = String(body.identifier || "").trim();
    const tempToken = String(body.tempToken || body.token || "").trim();
    const action = (body.action as "login" | "register" | "verify" | "reset") || "login";
    let recipientName = String(body.name || "Member").trim();
    let targetUserData: any = null;

    // 1. If email not provided directly, try looking up via tempToken in OTP store
    if ((!email || !email.includes("@")) && tempToken) {
      const activeOTP = await findActiveOTP(tempToken);
      if (activeOTP && activeOTP.email) {
        email = activeOTP.email;
        targetUserData = activeOTP.userData;
        if (targetUserData?.name) {
          recipientName = targetUserData.name;
        }
      }
    }

    // 2. If email still not resolved, try looking up by identifier (Player ID, email, or name)
    if (!email || !email.includes("@")) {
      const searchKey = (identifier || email).toLowerCase();
      if (searchKey === ADMIN_EMAIL.toLowerCase()) {
        email = ADMIN_EMAIL.toLowerCase();
        recipientName = "Administrator";
        targetUserData = {
          id: "KSM-ADMIN-01",
          name: "Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
        };
      } else if (searchKey) {
        const players = await getPlayers();
        const player = players.find(
          (p) =>
            p.id.toLowerCase() === searchKey ||
            (p.email && p.email.toLowerCase() === searchKey) ||
            p.name.toLowerCase() === searchKey
        );
        if (player && player.email) {
          email = player.email.toLowerCase();
          recipientName = player.name;
          targetUserData = {
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

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email address or Player ID is required to resend verification code" },
        { status: 400 }
      );
    }

    // 3. Resolve user details if not yet populated
    if (!targetUserData) {
      if (email === ADMIN_EMAIL.toLowerCase()) {
        recipientName = "Administrator";
        targetUserData = {
          id: "KSM-ADMIN-01",
          name: "Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
        };
      } else {
        const players = await getPlayers();
        const player = players.find((p) => p.email && p.email.toLowerCase() === email);
        if (player) {
          recipientName = player.name;
          targetUserData = {
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

    const { code, tempToken: newTempToken, expiresAt } = createOTP(email, action, targetUserData);
    await send2FAOTPEmail(email, recipientName, code, action);

    return NextResponse.json({
      success: true,
      message: `A fresh 6-digit code has been sent to ${getMaskedEmail(email)}`,
      tempToken: newTempToken,
      maskedEmail: getMaskedEmail(email),
      expiresAt,
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend verification code" },
      { status: 500 }
    );
  }
}
