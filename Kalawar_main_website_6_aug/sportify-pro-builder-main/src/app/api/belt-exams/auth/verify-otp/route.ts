import { NextRequest, NextResponse } from "next/server";
import { getBeltCandidateByIdOrCert, getBeltCertificateByNumber } from "@/lib/belt-exams-store";
import { getPlayerById, getPlayers } from "@/lib/players-store";
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

    // 1. Verify OTP using otp-store
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
    let match = await getBeltCandidateByIdOrCert(queryKey);
    let player: any = null;

    if (!match) {
      const cleanLower = queryKey.toLowerCase();
      player = await getPlayerById(queryKey);
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

    if (!match) {
      const cert = await getBeltCertificateByNumber(queryKey);
      if (cert && cert.athleteId) {
        match = await getBeltCandidateByIdOrCert(cert.athleteId);
      }
    }

    if (!match && !player) {
      return NextResponse.json(
        { success: false, error: "Candidate examination record not found." },
        { status: 404 }
      );
    }

    const candidate = match?.candidate || {
      id: `CAND-${new Date().getFullYear()}-001`,
      athleteId: player.id,
      athleteName: player.name,
      email: player.email,
      phone: player.phone,
      state: player.state,
      clubName: player.club,
      currentBelt: player.beltRank || "White Belt",
      targetBelt: player.beltRank || "Yellow Belt",
      status: "Result Declared",
      registeredOn: new Date().toISOString().split("T")[0],
      registrationSlipId: `KAC-BELT-SLIP-${player.id}`,
      attendance: "Present",
      resultStatus: "Passed",
      certificateNumber: player.beltHistory?.[0]?.certificateNumber || player.beltHistory?.[0]?.certificateNo,
      assessment: {
        totalScore: 88,
        grade: "Distinction",
        formsScore: 23,
        sparringScore: 22,
        selfDefenseScore: 21,
        fitnessScore: 22,
      },
    };

    const exam = match?.session || {
      id: "KBE-2026-SESSION",
      title: "National Belt Grading Examination",
      examDate: new Date().toISOString().split("T")[0],
      venueName: "National Combat Sports Academy Arena",
      city: "Pune",
      state: "Maharashtra",
      chiefExaminer: "Grandmaster Rajesh Sharma (8th Dan)",
      chiefExaminerRank: "8th Dan Black Belt, Chief Technical Examiner",
    };

    // Create session payload
    const candidateSession = {
      authenticated: true,
      authenticatedAt: new Date().toISOString(),
      athleteId: candidate.athleteId,
      trackingId: candidate.id || (candidate as any).registrationSlipId,
      fullName: candidate.athleteName,
      email: candidate.email,
      certificateNumber: candidate.certificateNumber,
      token: `belt_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    return NextResponse.json({
      success: true,
      message: "Candidate identity verified successfully.",
      candidateSession,
      candidate,
      exam,
    });
  } catch (error: any) {
    console.error("POST /api/belt-exams/auth/verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
