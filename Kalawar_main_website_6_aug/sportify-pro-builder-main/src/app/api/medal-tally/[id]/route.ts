import { NextResponse } from "next/server";
import {
  getMedalTallyById,
  updateMedalTallyEntry,
  deleteMedalTallyEntry,
  type CreateMedalTallyInput,
} from "@/lib/medal-tally-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const entry = await getMedalTallyById(id);
    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Medal tally entry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error(`GET /api/medal-tally/${id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch medal tally entry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Partial<CreateMedalTallyInput>;
    const entry = await updateMedalTallyEntry(id, body);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Medal tally entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medal tally entry updated successfully",
      entry,
    });
  } catch (error) {
    console.error(`PUT /api/medal-tally/${id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update medal tally entry",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = await deleteMedalTallyEntry(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Medal tally entry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Medal tally entry deleted successfully",
    });
  } catch (error) {
    console.error(`DELETE /api/medal-tally/${id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to delete medal tally entry" },
      { status: 500 }
    );
  }
}
