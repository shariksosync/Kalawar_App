import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionData } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  const sessionData = await getAdminSessionData(token);

  if (!sessionData) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: sessionData.role || "super_admin",
    email: sessionData.email,
    userId: sessionData.userId || sessionData.email,
    state: sessionData.state || "",
    district: sessionData.district || "",
  });
}
