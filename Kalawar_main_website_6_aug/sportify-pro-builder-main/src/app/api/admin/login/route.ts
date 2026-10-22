import { NextResponse } from "next/server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, signSession, getSessionCookieOptions } from "@/lib/admin-auth";
import { verifyDistrictAdminLogin } from "@/lib/district-admin-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email/User ID and password are required" },
        { status: 400 }
      );
    }

    const cleanInput = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // 1. Check Super Admin Credentials
    const validSuperEmails = [ADMIN_EMAIL.toLowerCase(), "kalawarmartialartsindia@gmail.com", "admin@wsf.org"];
    if (validSuperEmails.includes(cleanInput) && cleanPassword === ADMIN_PASSWORD) {
      const token = await signSession({
        email: cleanInput,
        role: "super_admin",
      });

      const response = NextResponse.json({
        success: true,
        role: "super_admin",
        message: "National Super Admin logged in successfully",
      });

      response.cookies.set("admin_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 7));
      return response;
    }

    // 2. Check District Admin Credentials
    const districtAdmin = await verifyDistrictAdminLogin(cleanInput, cleanPassword);
    if (districtAdmin) {
      const token = await signSession({
        email: districtAdmin.userId,
        userId: districtAdmin.userId,
        role: "district_admin",
        state: districtAdmin.state,
        district: districtAdmin.district,
      });

      const response = NextResponse.json({
        success: true,
        role: "district_admin",
        district: districtAdmin.district,
        state: districtAdmin.state,
        userId: districtAdmin.userId,
        message: `Logged in as ${districtAdmin.district} District Administrator`,
      });

      response.cookies.set("admin_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 7));
      return response;
    }

    // Invalid Credentials
    return NextResponse.json(
      { success: false, error: "Invalid admin email/User ID or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
