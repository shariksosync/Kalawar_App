import { NextRequest, NextResponse } from "next/server";
import { updateIdCardStatus, renewIdCard } from "@/lib/id-cards-store";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    if (body.action === "renew") {
      const renewed = await renewIdCard(params.id, body.validUntil);
      if (!renewed) {
        return NextResponse.json(
          { success: false, error: "ID card not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        card: renewed,
        message: "ID card renewed successfully",
      });
    }

    if (body.status) {
      const updated = await updateIdCardStatus(params.id, body.status, body.notes);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "ID card not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        card: updated,
        message: `ID card status changed to ${body.status}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid status update payload" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
