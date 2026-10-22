import { NextResponse } from "next/server";
import {
  getLeadershipById,
  updateLeadership,
  deleteLeadership,
  type CreateLeadershipInput,
} from "@/lib/leadership-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leader = await getLeadershipById(id);

    if (!leader) {
      return NextResponse.json(
        { success: false, error: "Visionary leadership entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      leader,
    });
  } catch (error) {
    console.error("GET /api/leadership/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leadership entry" },
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
    const body = (await request.json()) as Partial<CreateLeadershipInput>;

    const updated = await updateLeadership(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Visionary leadership entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Visionary leadership entry updated successfully",
      leader: updated,
    });
  } catch (error) {
    console.error("PUT /api/leadership/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update visionary leadership entry" },
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
    const success = await deleteLeadership(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Visionary leadership entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Visionary leadership entry deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/leadership/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete visionary leadership entry" },
      { status: 500 }
    );
  }
}
