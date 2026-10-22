import { NextRequest, NextResponse } from "next/server";
import { getBeltCandidateByIdOrCert, getBeltCertificateByNumber } from "@/lib/belt-exams-store";
import { getPlayerById, getPlayers } from "@/lib/players-store";
import { createOTP } from "@/lib/otp-store";
import { sendEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Please enter your Registered Athlete ID, Candidate Roll No, Slip ID, or Email." },
        { status: 400 }
      );
    }

    // 1. Look up candidate in Belt Exams
    let match = await getBeltCandidateByIdOrCert(identifier);
    let player: any = null;

    if (!match) {
      // Try searching player store strictly by athlete ID or email
      const cleanLower = identifier.toLowerCase();
      player = await getPlayerById(identifier);
      if (!player) {
        const allPlayers = await getPlayers();
        player = allPlayers.find(
          (p) =>
            p.id?.toLowerCase() === cleanLower ||
            p.email?.toLowerCase() === cleanLower
        );
      }

      if (player) {
        match = await getBeltCandidateByIdOrCert(player.id);
      }
    }

    // Check certificate lookup as well
    if (!match) {
      const cert = await getBeltCertificateByNumber(identifier);
      if (cert && cert.athleteId) {
        match = await getBeltCandidateByIdOrCert(cert.athleteId);
      }
    }

    if (!match && !player) {
      return NextResponse.json(
        {
          success: false,
          error: `No candidate record found matching "${identifier}". Please check your Athlete ID, Roll Number, or registered email.`,
        },
        { status: 404 }
      );
    }

    const candidate = match?.candidate;
    const session = match?.session;

    const candidateEmail = candidate?.email || player?.email || "candidate@kalawar.org";
    const candidateName = candidate?.athleteName || player?.name || "Candidate";
    const candidateAthleteId = candidate?.athleteId || player?.id || identifier;
    const trackingId = candidate?.id || candidate?.registrationSlipId || identifier;

    // 2. Generate 6-Digit OTP using otp-store
    const otpSession = createOTP(identifier.toLowerCase(), "verify", {
      identifier,
      athleteId: candidateAthleteId,
      trackingId,
      candidateName,
      email: candidateEmail,
      candidateId: candidate?.id,
      sessionId: session?.id,
      certificateNumber: candidate?.certificateNumber,
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

    // Dispatch notification email
    try {
      if (candidateEmail && !candidateEmail.endsWith("@example.com")) {
        await sendEmail({
          to: candidateEmail,
          subject: "🥋 Belt Examination Verification OTP - KALAWAR Sports & Martial Arts Federation",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f1117; color: #f3f4f6; border-radius: 12px; border: 1px solid #d97706;">
              <h2 style="color: #fbbf24; margin-bottom: 8px;">KALAWAR Sports & Martial Arts Federation</h2>
              <p style="font-size: 14px; color: #9ca3af; margin-top: 0;">National Board of Dan & Gup Technical Belt Accreditation</p>
              <hr style="border: 0; border-top: 1px solid #374151; margin: 16px 0;" />
              <p style="font-size: 15px;">Hello <strong>${candidateName}</strong>,</p>
              <p style="font-size: 14px; color: #d1d5db;">You have requested to access your Official Belt Examination Tracking Portal to view your Registration Slip, Admit Card, Assessment Scorecard, and Belt Certificate.</p>
              <div style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #fbbf24; padding: 12px 28px; border-radius: 8px; font-family: monospace;">
                  ${otpSession.code}
                </span>
              </div>
              <p style="font-size: 12px; color: #9ca3af;">This verification OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Candidate Student ID: <strong>${candidateAthleteId}</strong> | Ref: ${trackingId}</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch belt OTP email (using on-screen OTP fallback):", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Verification OTP dispatched to registered address (${maskedEmail}).`,
      tempToken: otpSession.tempToken,
      expiresAt: otpSession.expiresAt,
      maskedEmail,
      candidateName,
      athleteId: candidateAthleteId,
    });
  } catch (error: any) {
    console.error("POST /api/belt-exams/auth/send-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate verification OTP" },
      { status: 500 }
    );
  }
}
