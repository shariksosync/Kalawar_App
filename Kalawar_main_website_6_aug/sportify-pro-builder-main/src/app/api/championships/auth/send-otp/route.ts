import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";
import { createOTP } from "@/lib/otp-store";
import { sendEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please enter your Application ID, Athlete ID, or Registered Email." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}$`, "i");

    // 1. Look up championship application or certificate
    let application = await ChampionshipApplicationModel.findOne({
      $or: [
        { id: regex },
        { applicationId: regex },
        { email: regex },
        { phone: regex },
        { athleteId: regex },
        { bibNumber: regex },
      ],
    }).lean();

    const certificate = await ChampionshipCertificateModel.findOne({
      $or: [
        { certificateNumber: regex },
        { athleteId: regex },
        { applicationId: regex },
      ],
    }).lean();

    if (!application && certificate) {
      application = await ChampionshipApplicationModel.findOne({
        $or: [
          { id: certificate.applicationId || certificate.athleteId },
          { athleteId: certificate.athleteId },
        ],
      }).lean();
    }

    if (!application && !certificate) {
      return NextResponse.json(
        {
          success: false,
          error: `No championship registration found matching "${identifier}". Please check your Application ID (e.g. CHAMP-2026-0001) or registered email.`,
        },
        { status: 404 }
      );
    }

    const candidateEmail = (application?.email || (certificate as any)?.email || "").trim().toLowerCase();
    const candidateName = application?.applicantName || application?.athleteName || certificate?.candidateName || "Competitor";
    const candidateAthleteId = application?.athleteId || certificate?.athleteId || identifier;
    const trackingId = application?.id || certificate?.certificateNumber || identifier;

    // 2. Generate 6-Digit OTP using otp-store
    const otpSession = createOTP(candidateEmail || identifier.toLowerCase(), "verify", {
      identifier,
      athleteId: candidateAthleteId,
      trackingId,
      candidateName,
      email: candidateEmail,
      applicationId: application?.id,
      certificateNumber: certificate?.certificateNumber,
    });

    // 3. Mask the email for user privacy
    let maskedEmail = candidateEmail || "registered email";
    if (candidateEmail.includes("@")) {
      const [local, domain] = candidateEmail.split("@");
      if (local.length <= 2) {
        maskedEmail = `${local[0]}*@${domain}`;
      } else {
        maskedEmail = `${local[0]}${"*".repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domain}`;
      }
    }

    // 4. Send verification email if valid address
    try {
      if (candidateEmail && candidateEmail.includes("@") && !candidateEmail.endsWith("@example.com")) {
        await sendEmail({
          to: candidateEmail,
          subject: "Championship Candidate Verification OTP - KALAWAR Sports & Martial Arts Federation",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f1117; color: #f3f4f6; border-radius: 16px; border: 1px solid #d97706;">
              <h2 style="color: #fbbf24; margin-bottom: 6px;">KALAWAR Sports & Martial Arts Federation</h2>
              <p style="font-size: 13px; color: #9ca3af; margin-top: 0;">National Championship Organizing Committee</p>
              <hr style="border: 0; border-top: 1px solid #374151; margin: 16px 0;" />
              <p style="font-size: 15px;">Hello <strong>${candidateName}</strong>,</p>
              <p style="font-size: 14px; color: #d1d5db;">You have requested to access your Official Championship Candidate Portal to track your tournament fixture status, assigned Bib number, weigh-in pass, and certificates.</p>
              <div style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #fbbf24; padding: 12px 28px; border-radius: 10px; font-family: monospace;">
                  ${otpSession.code}
                </span>
              </div>
              <p style="font-size: 12px; color: #9ca3af;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Application ID: <strong>${trackingId}</strong></p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch email notification:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Verification OTP dispatched to registered address (${maskedEmail}).`,
      tempToken: otpSession.tempToken,
      expiresAt: otpSession.expiresAt,
      maskedEmail,
      candidateName,
      candidateAthleteId,
      devOtp: process.env.NODE_ENV !== "production" ? otpSession.code : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/championships/auth/send-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send verification OTP" },
      { status: 500 }
    );
  }
}
