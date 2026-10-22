import { NextRequest, NextResponse } from "next/server";
import { incrementVideoViews } from "@/lib/video-store";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newViews = await incrementVideoViews(id);
    return NextResponse.json({ success: true, views: newViews });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to increment views" },
      { status: 500 }
    );
  }
}
