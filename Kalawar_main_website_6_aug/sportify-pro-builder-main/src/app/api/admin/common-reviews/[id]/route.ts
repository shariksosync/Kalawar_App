import { NextResponse } from "next/server";
import {
  updateCommonReviewStatus,
  deleteCommonReview,
} from "@/lib/common-reviews-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value provided" },
        { status: 400 }
      );
    }

    const updated = await updateCommonReviewStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Review not found or could not be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updated,
      message: `Review status updated to ${status}`,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/common-reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update review status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCommonReview(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Review not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review permanently deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/common-reviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
