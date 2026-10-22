import { NextResponse } from "next/server";
import { getBeltCertificateByNumber } from "@/lib/belt-exams-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    const certificate = await getBeltCertificateByNumber(id);
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: "Belt Grading Certificate not found or pending publication" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("GET /api/certificates/belt/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch belt certificate" },
      { status: 500 }
    );
  }
}

