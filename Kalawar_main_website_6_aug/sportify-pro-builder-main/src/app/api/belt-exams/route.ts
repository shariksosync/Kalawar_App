import { NextResponse } from "next/server";
import { getBeltExams, createBeltExam } from "@/lib/belt-exams-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") || "";
    const discipline = searchParams.get("discipline") || "";
    const status = searchParams.get("status") || "";
    const query = searchParams.get("query") || searchParams.get("q") || "";

    const allExams = await getBeltExams();

    const filtered = allExams.filter((exam) => {
      if (state && state !== "All" && exam.state.toLowerCase() !== state.toLowerCase()) {
        return false;
      }
      if (discipline && discipline !== "All" && exam.discipline.toLowerCase() !== discipline.toLowerCase()) {
        return false;
      }
      if (status && status !== "All" && exam.status !== status) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const mTitle = exam.title.toLowerCase().includes(q);
        const mCity = exam.city.toLowerCase().includes(q);
        const mVenue = exam.venueName.toLowerCase().includes(q);
        const mExaminer = exam.chiefExaminer.toLowerCase().includes(q);
        if (!mTitle && !mCity && !mVenue && !mExaminer) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      exams: filtered,
    });
  } catch (error) {
    console.error("GET /api/belt-exams error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch belt examinations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.examDate || !body.venueName) {
      return NextResponse.json(
        { success: false, error: "Title, exam date, and venue name are required" },
        { status: 400 }
      );
    }

    const created = await createBeltExam(body);
    return NextResponse.json(
      { success: true, message: "Belt examination session created", exam: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/belt-exams error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create exam" },
      { status: 500 }
    );
  }
}
