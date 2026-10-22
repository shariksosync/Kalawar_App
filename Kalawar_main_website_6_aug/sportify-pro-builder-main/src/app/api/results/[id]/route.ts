import { NextResponse } from "next/server";
import {
  getResultById,
  updateResult,
  deleteResult,
  type CreateResultInput,
} from "@/lib/results-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await getResultById(id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error(`GET /api/results/${id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch result" },
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
    const body = (await request.json()) as Partial<CreateResultInput>;
    const result = await updateResult(id, body);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tournament result updated successfully",
      result,
    });
  } catch (error) {
    console.error(`PUT /api/results/${id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update tournament result",
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
    const deleted = await deleteResult(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Tournament result deleted successfully",
    });
  } catch (error) {
    console.error(`DELETE /api/results/${id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tournament result" },
      { status: 500 }
    );
  }
}
