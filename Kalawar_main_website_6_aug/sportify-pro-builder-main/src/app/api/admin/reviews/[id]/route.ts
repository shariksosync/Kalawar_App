import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus, deleteReview } from "@/lib/reviews-store";
import { isAdminRequest } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminRequest();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reviewId = decodeURIComponent(id || "");
    const body = await request.json();
    const status = body.status;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid review status value" },
        { status: 400 }
      );
    }

    const updated = await updateReviewStatus(reviewId, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review marked as ${status} successfully. Product global rating updated.`,
      review: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update review status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminRequest();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reviewId = decodeURIComponent(id || "");
    const deleted = await deleteReview(reviewId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Review not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review permanently deleted and product global rating updated.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
