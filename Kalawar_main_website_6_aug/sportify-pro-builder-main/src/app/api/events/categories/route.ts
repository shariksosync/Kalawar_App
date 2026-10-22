import { NextResponse } from "next/server";
import {
  getEventCategories,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
} from "@/lib/event-categories-store";

export async function GET() {
  try {
    const tiers = await getEventCategories();
    const categories = tiers.map((t) => t.name);

    return NextResponse.json({
      success: true,
      count: tiers.length,
      tiers,
      categories,
    });
  } catch (error) {
    console.error("GET /api/events/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event categories" },
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
        { success: false, error: "Category / Competition Level name is required" },
        { status: 400 }
      );
    }

    const tier = await createEventCategory(name, typeof order === "number" ? order : undefined);

    return NextResponse.json(
      {
        success: true,
        message: "Event category created successfully",
        tier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/events/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create event category",
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
        { success: false, error: "Current category name (oldName) is required" },
        { status: 400 }
      );
    }

    if (!newName || typeof newName !== "string" || !newName.trim()) {
      return NextResponse.json(
        { success: false, error: "New category name (newName) is required" },
        { status: 400 }
      );
    }

    const updatedCategory = await updateEventCategory(
      oldName,
      newName,
      typeof order === "number" ? order : undefined
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: `Event category '${oldName}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event category updated successfully and cascaded to events",
      tier: updatedCategory,
    });
  } catch (error) {
    console.error("PUT /api/events/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update event category",
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
        { success: false, error: "Category name is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await deleteEventCategory(name);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Event category '${name}' could not be deleted` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/events/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete event category",
      },
      { status: 400 }
    );
  }
}
