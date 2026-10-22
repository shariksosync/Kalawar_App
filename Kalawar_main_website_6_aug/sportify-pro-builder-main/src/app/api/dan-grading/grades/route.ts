import { NextRequest, NextResponse } from "next/server";
import {
  getAllDanGrades,
  createDanGrade,
  resetDanGradesToDefault,
} from "@/lib/dan-grading-store";

export async function GET(request: NextRequest) {
  try {
    const grades = await getAllDanGrades();
    return NextResponse.json({ success: true, grades });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Dan grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "reset") {
      const resetGrades = await resetDanGradesToDefault();
      return NextResponse.json({
        success: true,
        message: "Dan grades successfully reset to official federation defaults.",
        grades: resetGrades,
      });
    }

    if (!body.dan || !body.rankName) {
      return NextResponse.json(
        { success: false, error: "Dan level number and rank title are required." },
        { status: 400 }
      );
    }

    const created = await createDanGrade(body);
    return NextResponse.json({ success: true, grade: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save Dan grade" },
      { status: 500 }
    );
  }
}
