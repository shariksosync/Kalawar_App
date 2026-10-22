import { NextRequest, NextResponse } from "next/server";
import { getRankingsData, updateRankingRules, setRankingFreezeState } from "@/lib/rankings-store";

export async function GET() {
  try {
    const data = await getRankingsData();
    return NextResponse.json({
      success: true,
      rules: data.rules,
      isFrozen: data.isFrozen,
      lastRecalculatedAt: data.lastRecalculatedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch ranking rules" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.isFrozen !== undefined) {
      const isFrozen = await setRankingFreezeState(Boolean(body.isFrozen));
      return NextResponse.json({
        success: true,
        message: isFrozen ? "Rankings frozen successfully." : "Rankings unfrozen.",
        isFrozen,
      });
    }

    if (body.rules) {
      const updatedRules = await updateRankingRules(body.rules);
      return NextResponse.json({
        success: true,
        message: "Ranking points rules updated and rankings recalculated.",
        rules: updatedRules,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update ranking rules" },
      { status: 500 }
    );
  }
}
