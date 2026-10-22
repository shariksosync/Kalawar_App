import { NextRequest, NextResponse } from "next/server";
import { voteHelpfulReview } from "@/lib/reviews-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const votes = await voteHelpfulReview(reviewId);

    return NextResponse.json({
      success: true,
      helpfulVotes: votes,
    });
  } catch (error: any) {
    console.error("POST /api/shop/reviews/[reviewId]/helpful error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record vote" },
      { status: 500 }
    );
  }
}
