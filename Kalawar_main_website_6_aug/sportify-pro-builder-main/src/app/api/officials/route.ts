import { NextResponse } from "next/server";
import { getOfficials, createOfficial, type CreateOfficialInput } from "@/lib/officials-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const state = searchParams.get("state") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const officialsList = await getOfficials({ category, status, state, includeAll });
    return NextResponse.json({
      success: true,
      count: officialsList.length,
      officials: officialsList,
    });
  } catch (error) {
    console.error("GET /api/officials error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch federation officials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOfficialInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Official name is required" },
        { status: 400 }
      );
    }
    if (!body.role || !body.role.trim()) {
      return NextResponse.json(
        { success: false, error: "Official designation/role is required" },
        { status: 400 }
      );
    }
    if (!body.category) {
      return NextResponse.json(
        { success: false, error: "Official governance category is required" },
        { status: 400 }
      );
    }

    const official = await createOfficial(body);

    return NextResponse.json(
      {
        success: true,
        message: "Federation official created successfully",
        official,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/officials error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create official",
      },
      { status: 400 }
    );
  }
}
