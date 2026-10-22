import { NextResponse } from "next/server";
import { getDistrictAssociations, updatePlayer, deletePlayer } from "@/lib/players-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getDistrictAssociations();
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
    console.error("GET /api/district-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch district associations" },
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
    console.error("PUT /api/district-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update district association" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

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
    console.error("DELETE /api/district-associations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete district association" },
      { status: 500 }
    );
  }
}
