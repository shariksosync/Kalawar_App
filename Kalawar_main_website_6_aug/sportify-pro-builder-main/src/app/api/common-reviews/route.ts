import { NextResponse } from "next/server";
import {
  getApprovedCommonReviews,
  createCommonReview,
} from "@/lib/common-reviews-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getApprovedCommonReviews();
    return NextResponse.json({
      success: true,
      reviews: data.reviews,
      summary: data.summary,
    });
  } catch (error: any) {
    console.error("GET /api/common-reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch approved reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rating, comment, photo } = body;

    // Validate mandatory fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Reviewer Name is required." },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { success: false, error: "Review Comment is required." },
        { status: 400 }
      );
    }

    const review = await createCommonReview({
      name: name.trim(),
      rating: numericRating,
      comment: comment.trim(),
      photo: typeof photo === "string" ? photo.trim() : "",
    });

    return NextResponse.json({
      success: true,
      review,
      message:
        "Thank you! Your review has been submitted successfully and will appear publicly once approved by the federation administrator.",
    });
  } catch (error: any) {
    console.error("POST /api/common-reviews error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit review",
      },
      { status: 500 }
    );
  }
}
