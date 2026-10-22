import { NextRequest, NextResponse } from "next/server";
import { isUsernameAlreadyRegistered } from "@/lib/players-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get("username");
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!rawUsername || !rawUsername.trim()) {
      return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 });
    }

    const cleanUsername = rawUsername.trim().toLowerCase().replace(/\s+/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { available: false, error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { available: false, error: "Username can only contain letters, numbers, underscores, dots, or hyphens" },
        { status: 400 }
      );
    }

    const check = await isUsernameAlreadyRegistered(cleanUsername, excludeId);
    if (check.isRegistered) {
      return NextResponse.json({
        available: false,
        error: `This username is already taken by a registered ${check.existingRecord?.memberType || "member"}. Please choose another username.`,
        existingRecord: check.existingRecord,
      });
    }

    return NextResponse.json({ available: true, username: cleanUsername });
  } catch (error) {
    console.error("GET /api/auth/check-username error:", error);
    return NextResponse.json({ available: false, error: "Failed to verify username availability" }, { status: 500 });
  }
}
