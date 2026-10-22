import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { KalawarEventModel } from "@/models/KalawarEvent";
import type { KalawarEvent } from "@/data/kalawar-events";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const orConditions: any[] = [
      { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
    ];

    if (isObjectId) {
      orConditions.push({ _id: id });
    }

    const event = await KalawarEventModel.findOne({
      $or: orConditions,
    }).lean();

    if (!event) {
      return NextResponse.json({ success: false, error: "Flagship discipline not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, event });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch event" },
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
    const body = (await request.json()) as Partial<KalawarEvent>;
    await connectToDatabase();

    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const orConditions: any[] = [
      { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
    ];
    if (isObjectId) orConditions.push({ _id: id });

    const updated = await KalawarEventModel.findOneAndUpdate(
      { $or: orConditions },
      { $set: body },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Flagship discipline not found to update" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Flagship discipline updated successfully",
      event: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const orConditions: any[] = [
      { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
    ];
    if (isObjectId) orConditions.push({ _id: id });

    const deleted = await KalawarEventModel.findOneAndDelete({
      $or: orConditions,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Flagship discipline not found to delete" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Flagship discipline deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete event" },
      { status: 500 }
    );
  }
}
