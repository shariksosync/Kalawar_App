import { NextResponse } from "next/server";
import {
  getResults,
  createResult,
  type CreateResultInput,
} from "@/lib/results-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const results = await getResults({ status, includeAll });
    return NextResponse.json(
      {
        success: true,
        count: results.length,
        results,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/results error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournament results" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateResultInput;

    if (!body.tournament || !body.tournament.trim()) {
      return NextResponse.json(
        { success: false, error: "Tournament name is required" },
        { status: 400 }
      );
    }
    if (!body.discipline || !body.discipline.trim()) {
      return NextResponse.json(
        { success: false, error: "Discipline is required" },
        { status: 400 }
      );
    }
    if (!body.winner || !body.winner.trim()) {
      return NextResponse.json(
        { success: false, error: "Winner is required" },
        { status: 400 }
      );
    }

    const result = await createResult(body);

    return NextResponse.json(
      {
        success: true,
        message: "Tournament result created successfully",
        result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/results error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create tournament result",
      },
      { status: 400 }
    );
  }
}
