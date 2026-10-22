import { NextResponse } from "next/server";
import {
  getBeltExamById,
  updateBeltExam,
  deleteBeltExam,
  publishExamResultsAndPromote,
} from "@/lib/belt-exams-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = await getBeltExamById(id);

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Belt examination session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error("GET /api/belt-exams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Special action: publish results
    if (body.action === "publishResults") {
      const pubRes = await publishExamResultsAndPromote(id);
      if (!pubRes.success) {
        return NextResponse.json(
          { success: false, error: pubRes.error || "Failed to publish results" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Results published successfully! ${pubRes.promotedCount} candidates promoted.`,
        promotedCount: pubRes.promotedCount,
      });
    }

    const updated = await updateBeltExam(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Exam session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Belt examination updated successfully",
      exam: updated,
    });
  } catch (error) {
    console.error("PUT /api/belt-exams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exam session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteBeltExam(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Exam session not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Belt examination deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/belt-exams/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam session" },
      { status: 500 }
    );
  }
}
