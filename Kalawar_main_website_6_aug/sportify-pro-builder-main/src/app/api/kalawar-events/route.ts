import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { KalawarEventModel } from "@/models/KalawarEvent";
import type { KalawarEvent } from "@/data/kalawar-events";

export async function GET() {
  try {
    await connectToDatabase();
    const events = await KalawarEventModel.find({}).sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      success: true,
      events: events || [],
    });
  } catch (error) {
    console.error("GET /api/kalawar-events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flagship disciplines", events: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<KalawarEvent>;
    if (!body.id || !body.name || !body.subtitle) {
      return NextResponse.json(
        { success: false, error: "ID, Name, and Subtitle are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await KalawarEventModel.findOne({ id: body.id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Event with this ID already exists." },
        { status: 400 }
      );
    }

    const created = await KalawarEventModel.create(body);
    return NextResponse.json(
      { success: true, message: "Flagship discipline created successfully", event: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/kalawar-events error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
