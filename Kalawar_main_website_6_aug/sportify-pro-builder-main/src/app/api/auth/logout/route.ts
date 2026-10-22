import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/user-auth";

export async function POST(request: Request) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  const clearOptions = getSessionCookieOptions(request, 0);

  response.cookies.set("member_session", "", clearOptions);
  response.cookies.set("admin_session", "", clearOptions);

  return response;
}

