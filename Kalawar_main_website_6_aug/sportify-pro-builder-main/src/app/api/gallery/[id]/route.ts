import { NextResponse } from "next/server";
import { getGalleryItemById, updateGalleryItem, deleteGalleryItem, type CreateGalleryInput } from "@/lib/gallery-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getGalleryItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: `Media item "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("GET /api/gallery/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<CreateGalleryInput>;

    const updated = await updateGalleryItem(id, body);

    return NextResponse.json({
      success: true,
      message: "Media item updated successfully",
      item: updated,
    });
  } catch (error) {
    console.error("PUT /api/gallery/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update gallery item",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteGalleryItem(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Media item "${id}" not found or could not be deleted` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Media item "${id}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/gallery/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete gallery item",
      },
      { status: 500 }
    );
  }
}
