import { NextRequest, NextResponse } from "next/server";
import { deleteCandidateFromExam } from "@/lib/belt-exams-store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const { id, candidateId } = await params;
    if (!id || !candidateId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const result = await deleteCandidateFromExam(id, candidateId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to delete candidate" }, { status: 400 });
    }

    return NextResponse.json({ success: true, exam: result.exam });
  } catch (error: any) {
    console.error("Candidate deletion API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
