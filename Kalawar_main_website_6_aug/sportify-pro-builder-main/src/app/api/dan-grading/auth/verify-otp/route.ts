import { NextRequest, NextResponse } from "next/server";
import { getDanApplicationById, getDanCertificateByNumber } from "@/lib/dan-grading-store";
import { verifyOTP } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const tempToken = String(body.tempToken || "").trim();
    const otp = String(body.otp || "").trim().replace(/\D/g, "");

    if (!identifier && !tempToken) {
      return NextResponse.json(
        { success: false, error: "Missing candidate identifier or verification token." },
        { status: 400 }
      );
    }

    if (!otp || otp.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please enter the complete 6-digit OTP code." },
        { status: 400 }
      );
    }

    // Verify OTP using otp-store
    // First try by identifier key, then by tempToken
    let verification = await verifyOTP(identifier.toLowerCase(), otp, "verify");
    if (!verification.isValid && tempToken) {
      verification = await verifyOTP(`token:${tempToken}`, otp, "verify");
    }

    // Development test OTP bypass (only allowed in non-production)
    const isDevTestOtp = process.env.NODE_ENV !== "production" && otp === "123456";
    if (!verification.isValid && !isDevTestOtp) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired OTP code. Please try again or request a new code." },
        { status: 400 }
      );
    }

    const queryKey = verification.userData?.identifier || identifier;
    let application = await getDanApplicationById(queryKey);
    let certificate = await getDanCertificateByNumber(queryKey);

    if (!application && certificate) {
      application = await getDanApplicationById(certificate.athleteId);
    }
    if (!certificate && application && application.certificateNumber) {
      certificate = await getDanCertificateByNumber(application.certificateNumber);
    }

    if (!application && !certificate) {
      return NextResponse.json(
        { success: false, error: "Candidate record not found." },
        { status: 404 }
      );
    }

    // Create session payload
    const candidateSession = {
      authenticated: true,
      authenticatedAt: new Date().toISOString(),
      athleteId: application?.athleteId || certificate?.athleteId,
      trackingId: application?.id || certificate?.certificateNumber,
      fullName: application?.fullName || certificate?.candidateName,
      email: application?.email || (certificate as any)?.email,
      certificateNumber: certificate?.certificateNumber || application?.certificateNumber,
      token: `dan_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    return NextResponse.json({
      success: true,
      message: "Candidate identity verified successfully.",
      candidateSession,
      application,
      certificate,
    });
  } catch (error: any) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
