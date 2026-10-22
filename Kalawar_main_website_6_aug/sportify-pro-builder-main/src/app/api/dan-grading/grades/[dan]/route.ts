import { NextRequest, NextResponse } from "next/server";
import {
  getDanGradeByDan,
  updateDanGrade,
  deleteDanGrade,
} from "@/lib/dan-grading-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dan: string }> }
) {
  try {
    const { dan: danStr } = await params;
    const dan = Number(danStr);
    const grade = await getDanGradeByDan(dan);

    if (!grade) {
      return NextResponse.json(
        { success: false, error: `Dan grade ${dan} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, grade });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Dan grade" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dan: string }> }
) {
  try {
    const { dan: danStr } = await params;
    const dan = Number(danStr);
    const body = await request.json();

    const updated = await updateDanGrade(dan, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Dan grade ${dan} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dan grade ${dan} (${updated.rankName}) updated successfully.`,
      grade: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update Dan grade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dan: string }> }
) {
  try {
    const { dan: danStr } = await params;
    const dan = Number(danStr);
    const deleted = await deleteDanGrade(dan);

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete Dan grade" },
      { status: 500 }
    );
  }
}
