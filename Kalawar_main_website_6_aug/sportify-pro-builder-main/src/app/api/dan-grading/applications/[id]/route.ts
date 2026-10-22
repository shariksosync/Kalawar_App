import { NextRequest, NextResponse } from "next/server";
import { deleteDanApplication } from "@/lib/dan-grading-store";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Application ID is required" }, { status: 400 });
    }

    const success = await deleteDanApplication(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "Application not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Application ${id} deleted successfully` });
  } catch (error: any) {
    console.error("API /api/dan-grading/applications/[id] DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete application" }, { status: 500 });
  }
}
