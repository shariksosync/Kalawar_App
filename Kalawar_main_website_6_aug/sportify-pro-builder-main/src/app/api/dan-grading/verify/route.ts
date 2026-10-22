import { NextRequest, NextResponse } from "next/server";
import { getDanCertificateByNumber, getDanApplicationById } from "@/lib/dan-grading-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("id") || "";

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide an Application Tracking ID, Athlete ID, Certificate Number, or ID Card Number." },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();
    let app = await getDanApplicationById(cleanQuery);
    let cert = await getDanCertificateByNumber(cleanQuery);

    if (app && !cert && (app.certificateNumber || app.status === "Passed")) {
      cert = await getDanCertificateByNumber(app.certificateNumber || app.athleteId || app.id);
    }

    if (cert && !app) {
      app = await getDanApplicationById(cert.athleteId || cert.certificateNumber);
    }

    if (app && cert) {
      return NextResponse.json({
        success: true,
        application: app,
        certificate: cert,
        type: "both",
      });
    }

    if (app) {
      return NextResponse.json({
        success: true,
        application: app,
        type: "application",
      });
    }

    if (cert) {
      return NextResponse.json({
        success: true,
        certificate: cert,
        type: "certificate",
      });
    }

    return NextResponse.json(
      { success: false, error: `No Dan Examination application or credential found for ID "${cleanQuery}".` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}