import { NextResponse } from "next/server";
import {
  getDownloadById,
  updateDownload,
  deleteDownload,
} from "@/lib/downloads-store";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const item = await getDownloadById(params.id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, download: item });
  } catch (error) {
    console.error("GET /api/downloads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await request.json();

    const updated = await updateDownload(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Document not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, download: updated });
  } catch (error) {
    console.error("PUT /api/downloads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const success = await deleteDownload(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Document not found or deletion failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/downloads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
