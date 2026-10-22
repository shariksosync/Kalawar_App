import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipArchiveModel } from "@/models/ChampionshipArchive";
import type { DetailedTournamentResult } from "@/data/results-archive";

export async function GET() {
  try {
    await connectToDatabase();
    const results = await ChampionshipArchiveModel.find({}).sort({ year: -1 }).lean();
    return NextResponse.json({
      success: true,
      results: results || [],
    });
  } catch (error) {
    console.error("GET /api/results/championships error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch championship results", results: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DetailedTournamentResult>;
    if (!body.id || !body.title || !body.year) {
      return NextResponse.json(
        { success: false, error: "ID, Title, and Year are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await ChampionshipArchiveModel.findOne({ id: body.id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Championship archive with this ID already exists." },
        { status: 400 }
      );
    }

    const created = await ChampionshipArchiveModel.create(body);
    return NextResponse.json(
      { success: true, message: "Championship results archive created successfully", result: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/results/championships error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create result archive" },
      { status: 500 }
    );
  }
}
