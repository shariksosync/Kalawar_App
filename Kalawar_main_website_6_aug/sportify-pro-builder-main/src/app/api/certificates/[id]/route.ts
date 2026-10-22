import { NextResponse } from "next/server";
import {
  getCertificateByNumberOrId,
  updateCertificate,
  deleteCertificate,
  type CreateCertificateInput,
} from "@/lib/certificates-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificate = await getCertificateByNumberOrId(id);

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: `Certificate "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, certificate },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/certificates/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<CreateCertificateInput>;

    const updated = await updateCertificate(id, body);

    return NextResponse.json({
      success: true,
      message: "Certificate updated successfully",
      certificate: updated,
    });
  } catch (error) {
    console.error("PUT /api/certificates/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update certificate",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCertificate(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Certificate "${id}" not found or could not be deleted` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Certificate "${id}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/certificates/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete certificate",
      },
      { status: 500 }
    );
  }
}
