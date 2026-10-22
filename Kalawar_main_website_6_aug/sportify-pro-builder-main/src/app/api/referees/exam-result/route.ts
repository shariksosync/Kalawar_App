import { NextResponse } from "next/server";
import { sendRefereeExamResultEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || body.candidateEmail || "").trim();
    const name = (body.name || body.candidateName || "").trim();
    const refereeId = (body.refereeId || body.id || "").trim();
    const level = body.level || "Level 1 – Junior Referee";
    const currentRank = body.currentRank || "";
    const discipline = body.discipline || "Kalawar Martial Arts";
    const theoryScore = Number(body.theoryScore) || 0;
    const theoryMaxScore = Number(body.theoryMaxScore ?? body.theoryMax) || 50;
    const practicalScore = Number(body.practicalScore) || 0;
    const practicalMaxScore = Number(body.practicalMaxScore ?? body.practicalMax) || 50;
    const examDate = body.examDate || body.date || new Date().toISOString().split("T")[0];
    const examiner = body.examiner || "Technical Committee Examination Board";
    const remarks = body.remarks || "";
    const isPassed =
      body.isPassed !== undefined
        ? Boolean(body.isPassed)
        : body.overallResult
        ? String(body.overallResult).toUpperCase().includes("PASSED")
        : theoryScore >= theoryMaxScore * 0.6 && practicalScore >= practicalMaxScore * 0.6;

    if (!email || !name || !refereeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Candidate email, name, and refereeId are required to dispatch result email.",
        },
        { status: 400 }
      );
    }

    const emailResult = await sendRefereeExamResultEmail({
      email,
      name,
      refereeId,
      level,
      currentRank,
      discipline,
      theoryScore,
      theoryMaxScore,
      practicalScore,
      practicalMaxScore,
      examDate,
      examiner,
      remarks,
      isPassed,
    });

    return NextResponse.json({
      success: true,
      message: `Official exam result notification dispatched to ${email}`,
      simulated: emailResult?.simulated || false,
    });
  } catch (error: any) {
    console.error("POST /api/referees/exam-result error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send exam result email",
      },
      { status: 500 }
    );
  }
}


