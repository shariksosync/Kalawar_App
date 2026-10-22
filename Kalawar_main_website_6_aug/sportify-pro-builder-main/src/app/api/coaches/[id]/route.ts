import { NextResponse } from "next/server";
import { getPlayerById, updatePlayer, deletePlayer } from "@/lib/players-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const coach = await getPlayerById(id);

    if (!coach) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, coach });
  } catch (error) {
    console.error("GET /api/coaches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updatePlayer(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coach updated successfully",
      coach: updated,
    });
  } catch (error) {
    console.error("PUT /api/coaches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update coach" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await deletePlayer(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Coach not found or could not be deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coach deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/coaches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coach" },
      { status: 500 },
    );
  }
}
