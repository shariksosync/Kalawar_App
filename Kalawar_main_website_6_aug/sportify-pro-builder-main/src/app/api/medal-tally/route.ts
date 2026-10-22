import { NextResponse } from "next/server";
import {
  getMedalTally,
  createMedalTallyEntry,
  type CreateMedalTallyInput,
} from "@/lib/medal-tally-store";

export async function GET() {
  try {
    const tally = await getMedalTally();
    return NextResponse.json(
      {
        success: true,
        count: tally.length,
        tally,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/medal-tally error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch medal tally" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateMedalTallyInput;

    if (!body.state || !body.state.trim()) {
      return NextResponse.json(
        { success: false, error: "State / Association name is required" },
        { status: 400 }
      );
    }

    const entry = await createMedalTallyEntry(body);

    return NextResponse.json(
      {
        success: true,
        message: "Medal tally entry created successfully",
        entry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/medal-tally error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create medal tally entry",
      },
      { status: 400 }
    );
  }
}
