import { NextRequest, NextResponse } from "next/server";
import { issueBeltAdmitCard } from "@/lib/belt-exams-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const { id, candidateId } = await params;
    const body = await request.json().catch(() => ({}));
    const issuedBy = body.approvedBy || body.issuedBy || "Admin Secretariat";

    if (!id || !candidateId) {
      return NextResponse.json(
        { success: false, error: "Exam ID and Candidate ID are required" },
        { status: 400 }
      );
    }

    const result = await issueBeltAdmitCard(id, candidateId, issuedBy);

    if (!result.success || !result.candidate) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to issue admit card" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${result.candidate.id} (${result.candidate.athleteName}) approved and Admit Card generated.`,
      candidate: result.candidate,
      exam: result.exam,
    });
  } catch (error: any) {
    console.error("POST /api/belt-exams/[id]/candidates/[candidateId]/approve-cash error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
