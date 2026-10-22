import { NextResponse } from "next/server";
import {
  getOfficialById,
  updateOfficial,
  deleteOfficial,
  type CreateOfficialInput,
} from "@/lib/officials-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const official = await getOfficialById(id);

    if (!official) {
      return NextResponse.json(
        { success: false, error: "Official not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      official,
    });
  } catch (error) {
    console.error("GET /api/officials/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch official" },
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
    const body = (await request.json()) as Partial<CreateOfficialInput>;

    const updated = await updateOfficial(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Official not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Official updated successfully",
      official: updated,
    });
  } catch (error) {
    console.error("PUT /api/officials/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update official",
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
    const deleted = await deleteOfficial(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Official not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Official deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/officials/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete official" },
      { status: 500 }
    );
  }
}
