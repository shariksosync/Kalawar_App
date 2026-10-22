import { NextResponse } from "next/server";
import { getPlayersByCoach } from "@/lib/players-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId") || "";
    const coachName = searchParams.get("coachName") || "";

    if (!coachId && !coachName) {
      return NextResponse.json(
        { success: false, error: "Coach ID or Coach Name is required" },
        { status: 400 }
      );
    }

    const { pending, confirmed, all } = await getPlayersByCoach(coachId, coachName);

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
    console.error("GET /api/coach/players error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach players" },
      { status: 500 }
    );
  }
}
