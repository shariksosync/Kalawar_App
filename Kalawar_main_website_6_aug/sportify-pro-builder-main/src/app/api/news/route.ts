import { NextResponse } from "next/server";
import { getNews, createNews, type CreateNewsInput } from "@/lib/news-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const newsList = await getNews({ category, status, includeAll });
    return NextResponse.json(
      {
        success: true,
        count: newsList.length,
        news: newsList,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/news error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateNewsInput;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Article headline is required" },
        { status: 400 }
      );
    }
    if (!body.excerpt || !body.excerpt.trim()) {
      return NextResponse.json(
        { success: false, error: "Article excerpt is required" },
        { status: 400 }
      );
    }

    const article = await createNews(body);

    return NextResponse.json(
      {
        success: true,
        message: "Article published successfully",
        article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/news error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create article",
      },
      { status: 400 }
    );
  }
}
