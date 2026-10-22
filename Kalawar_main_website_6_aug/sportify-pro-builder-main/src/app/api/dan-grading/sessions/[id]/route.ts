import { NextRequest, NextResponse } from "next/server";
import {
  getDanExamSessionById,
  updateDanExamSession,
  deleteDanExamSession,
} from "@/lib/dan-grading-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getDanExamSessionById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Dan Exam session not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateDanExamSession(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Dan Exam session not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteDanExamSession(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
