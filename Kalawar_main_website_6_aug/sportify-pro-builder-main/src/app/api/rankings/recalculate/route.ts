import { NextRequest, NextResponse } from "next/server";
import { recalculateOfficialRankings } from "@/lib/rankings-store";

export async function POST(request: NextRequest) {
  try {
    let customRules;
    try {
      const body = await request.json();
      if (body?.rules) {
        customRules = body.rules;
      }
    } catch {
      // Body is optional
    }

    const data = await recalculateOfficialRankings(customRules);

    return NextResponse.json({
      success: true,
      message: "Official rankings recalculated successfully from verified competition results.",
      lastRecalculatedAt: data.lastRecalculatedAt,
      rankingVersion: data.rankingVersion,
      totalAthletesRanked: data.athletes.length,
      totalAcademiesRanked: data.academies.length,
    });
  } catch (err: any) {
    console.error("POST /api/rankings/recalculate error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to recalculate rankings" },
      { status: 500 }
    );
  }
}
