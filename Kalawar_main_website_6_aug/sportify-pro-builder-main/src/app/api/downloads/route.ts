import { NextResponse } from "next/server";
import { getDownloads, createDownload } from "@/lib/downloads-store";
import { OFFICIAL_DOWNLOADS } from "@/data/downloads-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const year = searchParams.get("year") || undefined;
    const event = searchParams.get("event") || undefined;
    const query = searchParams.get("q") || searchParams.get("query") || undefined;
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const downloads = await getDownloads({
      category,
      year,
      event,
      query,
      status,
      includeAll,
    });

    return NextResponse.json(
      {
        success: true,
        total: downloads.length,
        downloads,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/downloads error:", error);
    return NextResponse.json({
      success: true,
      total: OFFICIAL_DOWNLOADS.length,
      downloads: OFFICIAL_DOWNLOADS,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Document title is required" },
        { status: 400 }
      );
    }
    if (!body.category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    const created = await createDownload(body);

    return NextResponse.json(
      { success: true, download: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/downloads error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create document entry" },
      { status: 500 }
    );
  }
}
