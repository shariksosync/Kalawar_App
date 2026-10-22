import { NextRequest, NextResponse } from "next/server";
import { getAlbumBySlugOrId, updateAlbum, deleteAlbum } from "@/lib/album-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const album = await getAlbumBySlugOrId(id);

    if (!album) {
      return NextResponse.json(
        { success: false, error: "Photo album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    console.error("GET /api/gallery/albums/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch album" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateAlbum(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Photo album not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, album: updated });
  } catch (error: any) {
    console.error("PUT /api/gallery/albums/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update album" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteAlbum(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Photo album not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Photo album deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/gallery/albums/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete album" },
      { status: 500 }
    );
  }
}
