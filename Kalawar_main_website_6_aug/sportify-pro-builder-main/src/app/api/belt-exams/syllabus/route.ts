import { NextResponse } from "next/server";
import { getBeltLevels } from "@/lib/belt-exams-store";

export async function GET() {
  try {
    const beltLevels = await getBeltLevels();
    return NextResponse.json({
      success: true,
      count: beltLevels.length,
      beltLevels,
      levels: beltLevels,
    });
  } catch (error) {
    console.error("GET /api/belt-exams/syllabus error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch syllabus" },
      { status: 500 }
    );
  }
}

