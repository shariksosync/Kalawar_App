import { NextRequest, NextResponse } from "next/server";
import { getRankingsData } from "@/lib/rankings-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const state = searchParams.get("state") || "";

    const data = await getRankingsData();
    let academies = [...data.academies];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      academies = academies.filter(
        (a) =>
          a.academyName.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q)
      );
    }

    if (state && state !== "All States" && state !== "All") {
      academies = academies.filter(
        (a) => a.state.toLowerCase() === state.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      academies,
      totalAcademies: academies.length,
      lastRecalculatedAt: data.lastRecalculatedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch academy rankings" },
      { status: 500 }
    );
  }
}
