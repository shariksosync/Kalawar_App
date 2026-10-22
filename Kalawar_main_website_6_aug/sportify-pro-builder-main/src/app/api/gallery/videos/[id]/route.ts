import { NextRequest, NextResponse } from "next/server";
import {
  getVideoBySlugOrId,
  updateVideo,
  deleteVideo,
} from "@/lib/video-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await getVideoBySlugOrId(id);

    if (!video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: video,
    });
  } catch (error: any) {
    console.error("Error in GET /api/gallery/videos/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateVideo(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Video not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Video updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/gallery/videos/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteVideo(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Video not found or failed to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/gallery/videos/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
