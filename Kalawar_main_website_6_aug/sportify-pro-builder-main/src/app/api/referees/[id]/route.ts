import { NextResponse } from "next/server";
import {
  getRefereeById,
  updateReferee,
  deleteReferee,
  type RefereeItem,
} from "@/lib/referees-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const referee = await getRefereeById(id);

    if (!referee) {
      return NextResponse.json(
        { success: false, error: "Referee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      referee,
    });
  } catch (error: any) {
    console.error("GET /api/referees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve referee." },
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
    const updates = (await request.json()) as Partial<RefereeItem>;

    const updated = await updateReferee(id, updates);

    return NextResponse.json({
      success: true,
      message: "Referee record updated successfully",
      referee: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/referees/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update referee record",
      },
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
    const success = await deleteReferee(id);

    return NextResponse.json({
      success,
      message: "Referee removed successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/referees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete referee." },
      { status: 500 }
    );
  }
}
