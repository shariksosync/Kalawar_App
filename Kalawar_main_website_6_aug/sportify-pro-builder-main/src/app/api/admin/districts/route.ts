import { NextResponse } from "next/server";
import {
  getOrCreateDistrictAdmin,
  getAllDistrictAdmins,
  updateDistrictAdmin,
} from "@/lib/district-admin-store";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const isAuth = await isAdminRequest();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    // If both state and district are provided, fetch or create specific district credentials
    if (state && district) {
      const admin = await getOrCreateDistrictAdmin(state, district);
      return NextResponse.json({
        success: true,
        admin,
      });
    }

    // Otherwise list all
    const stateFilter = searchParams.get("stateFilter") || undefined;
    const allAdmins = await getAllDistrictAdmins(stateFilter);

    return NextResponse.json({
      success: true,
      count: allAdmins.length,
      admins: allAdmins,
    });
  } catch (error) {
    console.error("GET /api/admin/districts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch district admin details" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await isAdminRequest();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, password, status } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateDistrictAdmin(userId, {
      ...(password ? { password: String(password).trim() } : {}),
      ...(status ? { status } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "District Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "District Admin credentials updated successfully",
      admin: updated,
    });
  } catch (error) {
    console.error("POST /api/admin/districts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update district admin credentials" },
      { status: 500 }
    );
  }
}
