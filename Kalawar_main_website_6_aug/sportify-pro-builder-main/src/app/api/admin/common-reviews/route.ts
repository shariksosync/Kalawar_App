import { NextResponse } from "next/server";
import { getAllCommonReviewsForAdmin } from "@/lib/common-reviews-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "All";
    const search = searchParams.get("search") || "";

    const data = await getAllCommonReviewsForAdmin({ status, search });
    return NextResponse.json({
      success: true,
      reviews: data.reviews,
      stats: data.stats,
    });
  } catch (error: any) {
    console.error("GET /api/admin/common-reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin reviews dataset" },
      { status: 500 }
    );
  }
}
