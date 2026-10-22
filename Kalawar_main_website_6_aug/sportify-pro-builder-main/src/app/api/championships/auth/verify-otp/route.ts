import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";
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

    await connectToDatabase();

    const queryKey = verification.userData?.identifier || identifier;
    const escaped = queryKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}$`, "i");

    // Fetch all matching applications for this candidate
    let applications = await ChampionshipApplicationModel.find({
      $or: [
        { id: regex },
        { applicationId: regex },
        { email: regex },
        { phone: regex },
        { athleteId: regex },
      ],
    }).sort({ createdAt: -1 }).lean();

    // Fetch any matching issued certificates
    const certificates = await ChampionshipCertificateModel.find({
      $or: [
        { certificateNumber: regex },
        { athleteId: regex },
        { applicationId: regex },
      ],
    }).sort({ createdAt: -1 }).lean();

    // If searched by cert number, look up application
    if (applications.length === 0 && certificates.length > 0) {
      const certAppId = certificates[0].applicationId || certificates[0].athleteId;
      if (certAppId) {
        applications = await ChampionshipApplicationModel.find({
          $or: [
            { id: certAppId },
            { athleteId: certAppId },
          ],
        }).lean();
      }
    }

    if (applications.length === 0 && certificates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Championship candidate record not found." },
        { status: 404 }
      );
    }

    const primaryApp = applications[0];
    const primaryCert = certificates[0];

    const candidateSession = {
      authenticated: true,
      authenticatedAt: new Date().toISOString(),
      athleteId: primaryApp?.athleteId || primaryCert?.athleteId || queryKey,
      trackingId: primaryApp?.id || primaryCert?.certificateNumber || queryKey,
      fullName: primaryApp?.applicantName || primaryApp?.athleteName || primaryCert?.candidateName || "Competitor",
      email: primaryApp?.email || (primaryCert as any)?.email || "",
      phone: primaryApp?.phone || "",
      token: `champ_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    return NextResponse.json({
      success: true,
      message: "Candidate identity verified successfully.",
      candidateSession,
      applications: applications || [],
      certificates: certificates || [],
    });
  } catch (error: any) {
    console.error("POST /api/championships/auth/verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
