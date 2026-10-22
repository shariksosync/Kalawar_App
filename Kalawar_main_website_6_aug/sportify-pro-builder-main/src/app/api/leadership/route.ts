import { NextResponse } from "next/server";
import { getLeadershipList, createLeadership, type CreateLeadershipInput } from "@/lib/leadership-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const leadership = await getLeadershipList({ status, includeAll });
    return NextResponse.json(
      {
        success: true,
        count: leadership.length,
        leadership,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/leadership error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch visionary leadership" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateLeadershipInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Leader name is required" },
        { status: 400 }
      );
    }
    if (!body.role || !body.role.trim()) {
      return NextResponse.json(
        { success: false, error: "Leader designation/role is required" },
        { status: 400 }
      );
    }

    const leader = await createLeadership(body);

    return NextResponse.json(
      {
        success: true,
        message: "Visionary leadership entry created successfully",
        leader,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/leadership error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create visionary leadership entry" },
      { status: 500 }
    );
  }
}
