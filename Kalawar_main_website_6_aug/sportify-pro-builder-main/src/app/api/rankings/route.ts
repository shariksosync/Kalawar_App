import { NextRequest, NextResponse } from "next/server";
import { getFilteredRankings, RankingPeriod } from "@/lib/rankings-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const discipline = searchParams.get("discipline") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const ageGroup = searchParams.get("ageGroup") || undefined;
    const weightCategory = searchParams.get("weightCategory") || undefined;
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const clubName = searchParams.get("clubName") || undefined;
    const period = (searchParams.get("period") as RankingPeriod) || undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const data = await getFilteredRankings({
      category,
      discipline,
      gender,
      ageGroup,
      weightCategory,
      state,
      district,
      clubName,
      period,
      year,
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    console.error("GET /api/rankings error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
