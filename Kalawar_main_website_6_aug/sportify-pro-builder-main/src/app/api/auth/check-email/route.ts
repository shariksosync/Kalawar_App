import { NextRequest, NextResponse } from "next/server";
import { isEmailAlreadyRegistered } from "@/lib/players-store";
import { validateEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!email || !email.trim()) {
      return NextResponse.json({ available: false, error: "Email address is required" }, { status: 400 });
    }

    const emailVal = validateEmail(email, { required: true });
    if (!emailVal.isValid) {
      return NextResponse.json({ available: false, error: "Wrong email ID" }, { status: 400 });
    }

    const check = await isEmailAlreadyRegistered(emailVal.cleaned, excludeId);
    if (check.isRegistered) {
      return NextResponse.json({
        available: false,
        error: `This email ID is already registered as a ${check.existingRecord?.memberType || "member"}. Please sign in or use a different email address.`,
        existingRecord: check.existingRecord,
      });
    }

    return NextResponse.json({ available: true, email: emailVal.cleaned });
  } catch (error) {
    console.error("GET /api/auth/check-email error:", error);
    return NextResponse.json({ available: false, error: "Failed to verify email availability" }, { status: 500 });
  }
}
