import { NextResponse } from "next/server";
import { getStateAssociations, updatePlayer, deletePlayer } from "@/lib/players-store";
import { getAuthUserFromRequest } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getStateAssociations();
    return NextResponse.json(
      {
        success: true,
        count: list.length,
        associations: list,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/state-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch state associations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "State Association ID is required" },
        { status: 400 }
      );
    }

    const updated = await updatePlayer(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "State Association not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      association: updated,
      message: "State Association profile updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/state-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update state association" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "State Association ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deletePlayer(id);
    return NextResponse.json({
      success: true,
      deleted,
      message: "State Association deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/state-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete state association" },
      { status: 500 }
    );
  }
}
