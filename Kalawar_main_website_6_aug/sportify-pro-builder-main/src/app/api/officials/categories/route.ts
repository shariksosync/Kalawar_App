import { NextResponse } from "next/server";
import {
  getGovernanceTiers,
  createGovernanceTier,
  updateGovernanceTier,
  deleteGovernanceTier,
} from "@/lib/governance-tiers-store";

export async function GET() {
  try {
    const tiers = await getGovernanceTiers();
    const categories = tiers.map((t) => t.name);

    return NextResponse.json({
      success: true,
      count: tiers.length,
      tiers,
      categories,
    });
  } catch (error) {
    console.error("GET /api/officials/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch governance categories" },
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
        { success: false, error: "Category / Tier name is required" },
        { status: 400 }
      );
    }

    const tier = await createGovernanceTier(name, typeof order === "number" ? order : undefined);

    return NextResponse.json(
      {
        success: true,
        message: "Governance tier created successfully",
        tier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/officials/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create governance tier",
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

    const updatedTier = await updateGovernanceTier(
      oldName,
      newName,
      typeof order === "number" ? order : undefined
    );

    if (!updatedTier) {
      return NextResponse.json(
        { success: false, error: `Governance tier '${oldName}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Governance tier updated successfully and cascaded to officials",
      tier: updatedTier,
    });
  } catch (error) {
    console.error("PUT /api/officials/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update governance tier",
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
        { success: false, error: "Category / Tier name is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await deleteGovernanceTier(name);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Governance tier '${name}' could not be deleted` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Governance tier deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/officials/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete governance tier",
      },
      { status: 400 }
    );
  }
}
