import { NextResponse } from "next/server";
import { getNewsBySlugOrId, updateNews, deleteNews, type CreateNewsInput } from "@/lib/news-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await getNewsBySlugOrId(id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: `Article "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("GET /api/news/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
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
    const body = (await request.json()) as Partial<CreateNewsInput>;

    const updated = await updateNews(id, body);

    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      article: updated,
    });
  } catch (error) {
    console.error("PUT /api/news/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update article",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteNews(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Article "${id}" not found or could not be deleted` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Article "${id}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/news/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete article",
      },
      { status: 500 }
    );
  }
}
