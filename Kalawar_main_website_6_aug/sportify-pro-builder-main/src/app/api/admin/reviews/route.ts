import { NextRequest, NextResponse } from "next/server";
import { getAllReviewsForAdmin } from "@/lib/reviews-store";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminRequest();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "All";
    const search = searchParams.get("search") || "";

    const { reviews, stats } = await getAllReviewsForAdmin({ status, search });

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch admin reviews" },
      { status: 500 }
    );
  }
}
