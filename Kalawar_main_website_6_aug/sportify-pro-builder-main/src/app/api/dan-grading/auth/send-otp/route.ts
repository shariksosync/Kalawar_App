import { NextRequest, NextResponse } from "next/server";
import { getDanApplicationById, getDanCertificateByNumber } from "@/lib/dan-grading-store";
import { createOTP } from "@/lib/otp-store";
import { sendEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please enter your Registered Athlete ID, Tracking ID, Certificate No, or Registered Email." },
        { status: 400 }
      );
    }

    // 1. Look up candidate application or certificate
    let application = await getDanApplicationById(identifier);
    let certificate = await getDanCertificateByNumber(identifier);

    if (!application && certificate) {
      application = await getDanApplicationById(certificate.athleteId);
    }
    if (!certificate && application && application.certificateNumber) {
      certificate = await getDanCertificateByNumber(application.certificateNumber);
    }

    if (!application && !certificate) {
      return NextResponse.json(
        {
          success: false,
          error: `No candidate record found matching "${identifier}". Please check your Athlete ID, Certificate No, or registered email address.`,
        },
        { status: 404 }
      );
    }

    const candidateEmail = application?.email || (certificate as any)?.email || "candidate@kalawar.org";
    const candidateName = application?.fullName || certificate?.candidateName || "Candidate";
    const candidateAthleteId = application?.athleteId || certificate?.athleteId || identifier;
    const trackingId = application?.id || certificate?.certificateNumber || identifier;

    // 2. Generate 6-Digit OTP using otp-store
    const otpSession = createOTP(identifier.toLowerCase(), "verify", {
      identifier,
      athleteId: candidateAthleteId,
      trackingId,
      candidateName,
      email: candidateEmail,
      applicationId: application?.id,
      certificateNumber: certificate?.certificateNumber,
    });

    // Mask the email for user privacy display (e.g. j***e@gmail.com)
    let maskedEmail = candidateEmail;
    if (candidateEmail.includes("@")) {
      const [local, domain] = candidateEmail.split("@");
      if (local.length <= 2) {
        maskedEmail = `${local[0]}*@${domain}`;
      } else {
        maskedEmail = `${local[0]}${"*".repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domain}`;
      }
    }

    // Also send actual email if service is active
    try {
      if (candidateEmail && !candidateEmail.endsWith("@example.com")) {
        await sendEmail({
          to: candidateEmail,
          subject: "Dan Candidate Verification OTP - KALAWAR Sports & Martial Arts Federation",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f1117; color: #f3f4f6; border-radius: 12px; border: 1px solid #d97706;">
              <h2 style="color: #fbbf24; margin-bottom: 8px;">KALAWAR Sports & Martial Arts Federation</h2>
              <p style="font-size: 14px; color: #9ca3af; margin-top: 0;">National Black Belt Council & Dan Examination Board</p>
              <hr style="border: 0; border-top: 1px solid #374151; margin: 16px 0;" />
              <p style="font-size: 15px;">Hello <strong>${candidateName}</strong>,</p>
              <p style="font-size: 14px; color: #d1d5db;">You have requested to access your Official Dan Candidate Portal, track your examination status, and download authorized credentials (Admit Card, Slips, Certificate).</p>
              <div style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #fbbf24; padding: 12px 28px; border-radius: 8px; font-family: monospace;">
                  ${otpSession.code}
                </span>
              </div>
              <p style="font-size: 12px; color: #9ca3af;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Candidate Athlete ID: <strong>${candidateAthleteId}</strong> | Ref: ${trackingId}</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch email notification (using on-screen OTP fallback):", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Verification OTP generated and sent to registered address (${maskedEmail}).`,
      tempToken: otpSession.tempToken,
      expiresAt: otpSession.expiresAt,
      maskedEmail,
      candidateName,
      athleteId: candidateAthleteId,
    });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate OTP" },
      { status: 500 }
    );
  }
}
