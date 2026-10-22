import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo } from "@/lib/video-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";
    const status = searchParams.get("status") || "All";
    const search = searchParams.get("search") || "";
    const pinnedOnly = searchParams.get("pinned") === "true";

    const videos = await getVideos({
      category,
      status,
      search,
      pinnedOnly,
    });

    return NextResponse.json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error: any) {
    console.error("Error in GET /api/gallery/videos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Video title is required" },
        { status: 400 }
      );
    }

    if (!body.videoUrl || !body.videoUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Video URL / Link is required" },
        { status: 400 }
      );
    }

    const created = await createVideo({
      id: body.id,
      title: body.title,
      slug: body.slug,
      category: body.category,
      videoUrl: body.videoUrl,
      videoType: body.videoType,
      videoId: body.videoId,
      thumbnailUrl: body.thumbnailUrl,
      duration: body.duration,
      eventName: body.eventName,
      eventLink: body.eventLink,
      date: body.date,
      venue: body.venue,
      state: body.state,
      district: body.district,
      description: body.description,
      channelOrCredit: body.channelOrCredit,
      status: body.status,
      pinned: body.pinned,
      views: body.views,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Video created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/gallery/videos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create video" },
      { status: 500 }
    );
  }
}
