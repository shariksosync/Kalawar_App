import { NextResponse } from "next/server";
import { getPlayerById, updatePlayer, deletePlayer } from "@/lib/players-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "District Association ID is required" },
        { status: 400 }
      );
    }

    const association = await getPlayerById(id);
    if (!association) {
      return NextResponse.json(
        { success: false, error: "District Association not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      association,
    });
  } catch (error) {
    console.error("GET /api/district-associations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch district association" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "District Association ID is required" },
        { status: 400 }
      );
    }

    const updated = await updatePlayer(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "District Association not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      association: updated,
      message: "District Association profile updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/district-associations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update district association" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "District Association ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deletePlayer(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "District Association not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "District Association deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/district-associations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete district association" },
      { status: 500 }
    );
  }
}
