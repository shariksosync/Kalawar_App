import { NextResponse } from "next/server";
import {
  getEventDisciplines,
  createEventDiscipline,
  updateEventDiscipline,
  deleteEventDiscipline,
} from "@/lib/event-disciplines-store";

export async function GET() {
  try {
    const tiers = await getEventDisciplines();
    const disciplines = tiers.map((t) => t.name);

    return NextResponse.json({
      success: true,
      count: tiers.length,
      tiers,
      disciplines,
    });
  } catch (error) {
    console.error("GET /api/events/disciplines error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event disciplines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, order } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Discipline name is required" },
        { status: 400 }
      );
    }

    const tier = await createEventDiscipline(name, typeof order === "number" ? order : undefined);

    return NextResponse.json(
      {
        success: true,
        message: "Event discipline created successfully",
        tier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/events/disciplines error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create event discipline",
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { oldName, newName, order } = body;

    if (!oldName || typeof oldName !== "string" || !oldName.trim()) {
      return NextResponse.json(
        { success: false, error: "Current discipline name (oldName) is required" },
        { status: 400 }
      );
    }

    if (!newName || typeof newName !== "string" || !newName.trim()) {
      return NextResponse.json(
        { success: false, error: "New discipline name (newName) is required" },
        { status: 400 }
      );
    }

    const updatedDiscipline = await updateEventDiscipline(
      oldName,
      newName,
      typeof order === "number" ? order : undefined
    );

    if (!updatedDiscipline) {
      return NextResponse.json(
        { success: false, error: `Event discipline '${oldName}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event discipline updated successfully and cascaded to events",
      tier: updatedDiscipline,
    });
  } catch (error) {
    console.error("PUT /api/events/disciplines error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update event discipline",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Discipline name is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await deleteEventDiscipline(name);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Event discipline '${name}' could not be deleted` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event discipline deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/events/disciplines error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete event discipline",
      },
      { status: 400 }
    );
  }
}
