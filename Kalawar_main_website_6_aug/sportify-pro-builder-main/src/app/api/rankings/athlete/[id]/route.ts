import { NextRequest, NextResponse } from "next/server";
import { getAthleteRankingById } from "@/lib/rankings-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const athlete = await getAthleteRankingById(params.id);

    if (!athlete) {
      return NextResponse.json(
        { success: false, error: "Athlete ranking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      athlete,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch athlete ranking" },
      { status: 500 }
    );
  }
}
