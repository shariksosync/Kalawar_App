import { NextResponse } from "next/server";
import { createOTP, getMaskedEmail } from "@/lib/otp-store";
import { send2FAOTPEmail } from "@/lib/email-service";
import { isEmailAlreadyRegistered } from "@/lib/players-store";
import { validateEmail, validateFullName } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = String(body.email || "").trim().toLowerCase();
    const rawName = String(body.name || "Member").trim();

    const emailVal = validateEmail(rawEmail, { required: true });
    if (!emailVal.isValid) {
      return NextResponse.json(
        { success: false, error: emailVal.error || "Please provide a valid email address for 2FA verification" },
        { status: 400 }
      );
    }
    const email = emailVal.cleaned;

    // Duplicate email guard: 1 email = 1 account across any user role
    const emailCheck = await isEmailAlreadyRegistered(email);
    if (emailCheck.isRegistered) {
      return NextResponse.json(
        {
          success: false,
          error: `This email ID is already registered as a ${emailCheck.existingRecord?.memberType || "member"}. Please sign in or use a different email address.`,
        },
        { status: 409 }
      );
    }

    const nameVal = validateFullName(rawName, { required: true, fieldName: "Name", minLength: 2 });
    const name = nameVal.isValid ? nameVal.cleaned : rawName;

    // Generate 2FA Registration OTP
    const { code, tempToken, expiresAt } = createOTP(email, "register", { name, email });
    await send2FAOTPEmail(email, name, code, "register");

    return NextResponse.json({
      success: true,
      require2FA: true,
      tempToken,
      maskedEmail: getMaskedEmail(email),
      expiresAt,
      message: `A 6-digit registration verification code has been sent to ${getMaskedEmail(email)}`,
    });
  } catch (error) {
    console.error("Register OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate registration verification code" },
      { status: 500 }
    );
  }
}
