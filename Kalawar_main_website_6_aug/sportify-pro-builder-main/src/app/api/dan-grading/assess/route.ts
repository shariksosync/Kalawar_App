import { NextRequest, NextResponse } from "next/server";
import { saveDanAssessment } from "@/lib/dan-grading-store";
import { sendDanCertificateIssuedEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, assessment, resultStatus } = body;

    if (!applicationId || !assessment || !resultStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID, assessment scores, and result status are required.",
        },
        { status: 400 }
      );
    }

    const result = await saveDanAssessment(applicationId, assessment, resultStatus);

    // If passed, dispatch official Dan Diploma Conferred email
    if (resultStatus === "Passed" && result.certificate && result.application?.email) {
      try {
        await sendDanCertificateIssuedEmail({
          email: result.application.email,
          candidateName: result.application.fullName,
          athleteId: result.application.athleteId,
          certificateNumber: result.certificate.certificateNumber,
          idCardNumber: result.certificate.idCardNumber,
          danRankTitle: result.application.appliedDanTitle,
          score: assessment.totalScore,
          grade: assessment.grade,
          issueDate: result.certificate.issueDate,
        });
        console.log(`[Dan Grading] Dispatched Certificate Conferred email to ${result.application.email} for Certificate No ${result.certificate.certificateNumber}`);
      } catch (certEmailErr) {
        console.error("[Dan Grading] Error sending certificate conferred email:", certEmailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dan Assessment saved and result published as " + resultStatus,
      application: result.application,
      certificate: result.certificate,
    });
  } catch (error: any) {
    console.error("API /api/dan-grading/assess Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save assessment" },
      { status: 500 }
    );
  }
}