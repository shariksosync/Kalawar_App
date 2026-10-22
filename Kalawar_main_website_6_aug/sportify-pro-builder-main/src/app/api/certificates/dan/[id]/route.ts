import { NextRequest, NextResponse } from "next/server";
import { getDanCertificateByNumber } from "@/lib/dan-grading-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cert = await getDanCertificateByNumber(id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: "Dan Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load certificate" },
      { status: 500 }
    );
  }
}