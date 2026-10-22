import { NextRequest, NextResponse } from "next/server";
import {
  getAllDanExamSessions,
  createDanExamSession,
} from "@/lib/dan-grading-store";

export async function GET(request: NextRequest) {
  try {
    const sessions = await getAllDanExamSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Dan exam sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.examDate || !body.venueName || !body.chiefExaminer) {
      return NextResponse.json(
        { success: false, error: "Title, exam date, venue, and chief examiner are required." },
        { status: 400 }
      );
    }

    const created = await createDanExamSession(body);
    return NextResponse.json({ success: true, session: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Dan session" },
      { status: 500 }
    );
  }
}
