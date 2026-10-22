import { NextRequest, NextResponse } from "next/server";
import {
  getProductApprovedReviews,
  createProductReview,
  hasUserReviewedProduct,
} from "@/lib/reviews-store";
import { getProductByIdOrCode } from "@/lib/products-store";
import { getAuthUserFromRequest } from "@/lib/user-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUserFromRequest(request);
    const { reviews, summary } = await getProductApprovedReviews(id);

    let userReviewInfo: {
      hasReviewed: boolean;
      reviewStatus?: "Pending" | "Approved" | "Rejected";
      existingReview?: any;
    } = {
      hasReviewed: false,
    };

    if (authUser?.email || authUser?.id) {
      userReviewInfo = await hasUserReviewedProduct(
        authUser.email || "",
        authUser.id,
        id
      );
    }

    return NextResponse.json({
      success: true,
      reviews,
      summary,
      hasUserReviewed: userReviewInfo.hasReviewed,
      userReviewStatus: userReviewInfo.reviewStatus,
    });
  } catch (error: any) {
    console.error("GET /api/shop/products/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch product reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is authenticated
    const authUser = await getAuthUserFromRequest(request);
    const body = await request.json();

    // Verify product exists
    const product = await getProductByIdOrCode(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5 stars" },
        { status: 400 }
      );
    }

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Review title/headline is required" },
        { status: 400 }
      );
    }

    const comment = (body.comment || "").trim();
    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Review feedback comment is required" },
        { status: 400 }
      );
    }

    // Determine user info
    const userName = (authUser?.name || body.userName || "").trim();
    const userEmail = (authUser?.email || body.userEmail || "").trim();

    if (!userName || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in to submit a product review",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // Enforce one review per user per product
    const { hasReviewed, reviewStatus } = await hasUserReviewedProduct(
      userEmail,
      authUser?.id,
      product.code
    );

    if (hasReviewed) {
      return NextResponse.json(
        {
          success: false,
          error:
            reviewStatus === "Pending"
              ? "You have already submitted a review for this product that is awaiting administrator approval."
              : "You have already submitted a review for this product.",
          alreadyReviewed: true,
        },
        { status: 400 }
      );
    }

    const newReview = await createProductReview({
      productId: product.id || product.code,
      productCode: product.code,
      productName: product.name,
      productImage: product.images?.[0] || "",
      userId: authUser?.id || "",
      userName,
      userEmail,
      userRole: authUser?.role === "admin" ? "Admin" : "Athlete",
      rating,
      title,
      comment,
      verifiedPurchase: Boolean(body.verifiedPurchase || authUser),
    });

    return NextResponse.json({
      success: true,
      message:
        "Your review has been submitted successfully! It will appear on the store once approved by the administrator.",
      review: newReview,
    });
  } catch (error: any) {
    console.error("POST /api/shop/products/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit product review" },
      { status: 500 }
    );
  }
}
