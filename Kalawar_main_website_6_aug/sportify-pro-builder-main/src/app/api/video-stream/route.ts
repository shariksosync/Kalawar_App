import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Offloads Google Drive video streaming directly to Google's CDN via 307 Redirect
 * instead of proxying large binary video payloads through Vercel Serverless compute.
 * Eliminates Fast Origin Transfer bandwidth consumption completely.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing file id parameter", { status: 400 });
  }

  // Sanitize Google Drive file ID
  const fileId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const directGoogleStreamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;

  const response = NextResponse.redirect(directGoogleStreamUrl, 307);
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800"
  );

  return response;
}
