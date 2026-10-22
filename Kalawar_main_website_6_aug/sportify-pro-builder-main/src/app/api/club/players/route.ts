import { NextResponse } from "next/server";
import { getPlayersByClub } from "@/lib/players-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId") || "";
    const clubName = searchParams.get("clubName") || "";

    if (!clubId && !clubName) {
      return NextResponse.json(
        { success: false, error: "Club ID or Club Name is required" },
        { status: 400 }
      );
    }

    const { pending, confirmed, all } = await getPlayersByClub(clubId, clubName);

    return NextResponse.json({
      success: true,
      pending,
      confirmed,
      all,
      counts: {
        pending: pending.length,
        confirmed: confirmed.length,
        total: all.length,
      },
    });
  } catch (error) {
    console.error("GET /api/club/players error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch club players" },
      { status: 500 }
    );
  }
}
