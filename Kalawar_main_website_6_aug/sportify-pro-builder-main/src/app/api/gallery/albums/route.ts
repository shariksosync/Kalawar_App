import { NextRequest, NextResponse } from "next/server";
import { getAlbums, createAlbum } from "@/lib/album-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const year = searchParams.get("year") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const includeAll = searchParams.get("includeAll") === "true";

    const albums = await getAlbums({ category, year, status, search, includeAll });
    return NextResponse.json({ success: true, count: albums.length, albums });
  } catch (error: any) {
    console.error("GET /api/gallery/albums error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch photo albums" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Album title is required" },
        { status: 400 }
      );
    }

    if (!body.venue || !body.venue.trim()) {
      return NextResponse.json(
        { success: false, error: "Venue is required" },
        { status: 400 }
      );
    }

    if (!body.coverPhoto || !body.coverPhoto.trim()) {
      return NextResponse.json(
        { success: false, error: "Cover photo is required" },
        { status: 400 }
      );
    }

    const created = await createAlbum(body);
    return NextResponse.json({ success: true, album: created }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/gallery/albums error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create album" },
      { status: 500 }
    );
  }
}
