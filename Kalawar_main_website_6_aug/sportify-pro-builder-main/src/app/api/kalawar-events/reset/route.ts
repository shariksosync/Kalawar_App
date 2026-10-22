import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Static seed reset is disabled. Manage disciplines dynamically through the Admin Portal.",
  }, { status: 400 });
}
