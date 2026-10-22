import { NextResponse } from "next/server";
import { getBeltLevels } from "@/lib/belt-exams-store";

export async function GET() {
  try {
    const levels = await getBeltLevels();
    return NextResponse.json({
      success: true,
      count: levels.length,
      beltLevels: levels,
      levels: levels,
    });
  } catch (error: any) {
    console.error("GET /api/belt-exams/levels error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch belt levels" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Belt hierarchy is locked to the official 11 ranks and cannot be modified." },
    { status: 400 }
  );
}
