import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set("admin_session", "", getSessionCookieOptions(request, 0));

  return response;
}

