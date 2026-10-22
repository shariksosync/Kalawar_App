import { NextResponse } from "next/server";
import { updateCandidateAssessment } from "@/lib/belt-exams-store";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required for assessment" },
        { status: 400 }
      );
    }

    const res = await updateCandidateAssessment(id, body.candidateId, body);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Failed to update assessment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Candidate assessment saved successfully",
      candidate: res.candidate,
    });
  } catch (error) {
    console.error("PUT /api/belt-exams/[id]/assess error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save assessment" },
      { status: 500 }
    );
  }
}
