import { NextResponse } from "next/server";
import { getSettings, updateSettings, type WebsiteSettings } from "@/lib/settings-store";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch website settings" },
      { status: 500 }
    );
  }
}

async function handleUpdate(request: Request) {
  try {
    let body: Partial<WebsiteSettings> = {};
    const text = await request.text();
    if (text.trim()) {
      try {
        body = JSON.parse(text) as Partial<WebsiteSettings>;
      } catch (parseErr) {
        console.warn("Invalid JSON payload in /api/settings:", parseErr);
        return NextResponse.json(
          { success: false, error: "Invalid JSON format" },
          { status: 400 }
        );
      }
    }

    const settings = await updateSettings(body);
    return NextResponse.json({
      success: true,
      message: "Website settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("PUT/POST /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update website settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return handleUpdate(request);
}

export async function POST(request: Request) {
  return handleUpdate(request);
}

