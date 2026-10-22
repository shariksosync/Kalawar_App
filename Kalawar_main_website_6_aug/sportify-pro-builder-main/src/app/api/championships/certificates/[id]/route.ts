import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const cert = await ChampionshipCertificateModel.findOne({
      $or: [
        { id: { $regex: new RegExp(`^${id}$`, "i") } },
        { certificateNumber: { $regex: new RegExp(`^${id}$`, "i") } },
      ],
    }).lean();

    if (!cert) {
      return NextResponse.json(
        { success: false, error: "Championship certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await ChampionshipCertificateModel.findOneAndDelete({
      $or: [
        { id: { $regex: new RegExp(`^${id}$`, "i") } },
        { certificateNumber: { $regex: new RegExp(`^${id}$`, "i") } },
      ],
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Certificate not found to revoke" },
        { status: 404 }
      );
    }

    // Unlink from application
    if (deleted.applicationId) {
      await ChampionshipApplicationModel.findOneAndUpdate(
        { id: deleted.applicationId },
        { $unset: { certificateNumber: "", certificateIssuedAt: "" } }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Certificate revoked successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to revoke certificate" },
      { status: 500 }
    );
  }
}
