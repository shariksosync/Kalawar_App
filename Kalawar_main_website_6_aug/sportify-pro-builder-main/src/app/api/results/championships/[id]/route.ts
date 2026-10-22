import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipArchiveModel } from "@/models/ChampionshipArchive";
import type { DetailedTournamentResult } from "@/data/results-archive";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    let result = await ChampionshipArchiveModel.findOne({
      id: { $regex: new RegExp(`^${id}$`, "i") },
    }).lean();

    if (!result && id.includes("-")) {
      const lastDash = id.lastIndexOf("-");
      const potentialSlug = id.substring(0, lastDash);
      const potentialYear = parseInt(id.substring(lastDash + 1), 10);
      if (!isNaN(potentialYear)) {
        result = await ChampionshipArchiveModel.findOne({
          $or: [
            { slug: { $regex: new RegExp(`^${potentialSlug}$`, "i") }, year: potentialYear },
            { id: { $regex: new RegExp(`^${potentialSlug}`, "i") }, year: potentialYear },
          ],
        }).lean();
      }
    }

    if (!result) {
      return NextResponse.json({ success: false, error: "Result archive not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch result" },
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
    const body = (await request.json()) as Partial<DetailedTournamentResult>;
    await connectToDatabase();

    const updated = await ChampionshipArchiveModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id}$`, "i") } },
      { $set: body },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Result archive not found to update" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Championship results archive updated successfully",
      result: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update result" },
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
    const deleted = await ChampionshipArchiveModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${id}$`, "i") },
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Result archive not found to delete" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Championship results archive deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete result" },
      { status: 500 }
    );
  }
}
