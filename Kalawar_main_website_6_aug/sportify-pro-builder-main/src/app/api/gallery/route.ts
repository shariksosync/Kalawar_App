import { NextResponse } from "next/server";
import { getGalleryItems, createGalleryItem, type CreateGalleryInput } from "@/lib/gallery-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const items = await getGalleryItems({ type, category, status, includeAll });
    return NextResponse.json(
      {
        success: true,
        count: items.length,
        items,
        photos: items.filter((i) => i.type === "photo"),
        videos: items.filter((i) => i.type === "video"),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/gallery error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGalleryInput;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Media title / caption is required" },
        { status: 400 }
      );
    }
    if (!body.src || !body.src.trim()) {
      return NextResponse.json(
        { success: false, error: body.type === "video" ? "Video URL or stream link is required" : "Photo image is required" },
        { status: 400 }
      );
    }

    const item = await createGalleryItem(body);

    return NextResponse.json(
      {
        success: true,
        message: "Media item added successfully",
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/gallery error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create gallery item",
      },
      { status: 400 }
    );
  }
}
