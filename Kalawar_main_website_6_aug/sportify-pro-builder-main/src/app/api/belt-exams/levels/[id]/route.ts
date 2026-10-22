import { NextRequest, NextResponse } from "next/server";
import {
  getBeltLevelById,
  updateBeltLevel,
  deleteBeltLevel,
} from "@/lib/belt-exams-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const level = await getBeltLevelById(id);

    if (!level) {
      return NextResponse.json(
        { success: false, error: "Belt level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, beltLevel: level });
  } catch (error: any) {
    console.error("GET /api/belt-exams/levels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch belt level" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateBeltLevel(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Belt level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Belt level ${updated.name} updated successfully`,
      beltLevel: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/belt-exams/levels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update belt level" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteBeltLevel(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Official standard belt ranks are static and non-deletable" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Belt level ${id} deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE /api/belt-exams/levels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete belt level" },
      { status: 500 }
    );
  }
}
