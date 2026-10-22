import { NextRequest, NextResponse } from "next/server";
import {
  getAllDanExamSessions,
  createDanExamSession,
  getAllDanApplications,
  getAllDanGrades,
} from "@/lib/dan-grading-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "grades") {
      const grades = await getAllDanGrades();
      return NextResponse.json({ success: true, grades });
    }

    if (type === "applications") {
      const applications = await getAllDanApplications();
      return NextResponse.json({ success: true, applications });
    }

    const sessions = await getAllDanExamSessions();
    const applications = await getAllDanApplications();
    const grades = await getAllDanGrades();

    return NextResponse.json({
      success: true,
      sessions,
      applications,
      grades,
      stats: {
        totalSessions: sessions.length,
        totalApplications: applications.length,
        passedDanHolders: applications.filter((a) => a.status === "Passed").length,
        pendingVerification: applications.filter((a) => a.status === "Submitted" || a.status === "Under Verification").length,
      },
    });
  } catch (error: any) {
    console.error("API /api/dan-grading GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Dan grading data" },
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
    console.error("API /api/dan-grading POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Dan session" },
      { status: 500 }
    );
  }
}