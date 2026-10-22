import { NextResponse } from "next/server";
import { getCertificateByNumberOrId } from "@/lib/certificates-store";
import { sendCertificateEmail } from "@/lib/email-service";
import { getPlayers } from "@/lib/players-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const certNumber = String(body.certificateNumber || body.number || "").trim();
    let recipientEmail = String(body.email || "").trim().toLowerCase();
    let recipientName = String(body.name || "").trim();

    if (!certNumber) {
      return NextResponse.json(
        { success: false, error: "Certificate number is required" },
        { status: 400 }
      );
    }

    const cert = await getCertificateByNumberOrId(certNumber);
    if (!cert) {
      return NextResponse.json(
        { success: false, error: "Certificate record not found" },
        { status: 404 }
      );
    }

    // Resolve recipient name & email if not provided
    if (!recipientName) {
      recipientName = cert.holder;
    }

    // Find athlete in players database to enrich certificate email
    const players = await getPlayers();
    const player = players.find(
      (p) =>
        p.name.toLowerCase() === cert.holder.toLowerCase() ||
        p.id.toLowerCase() === cert.holder.toLowerCase()
    );

    if (!recipientEmail && cert.email) {
      recipientEmail = cert.email.toLowerCase();
    }
    if (!recipientEmail && player && player.email) {
      recipientEmail = player.email.toLowerCase();
    }

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient email address is required. Please specify the email to receive the certificate.",
        },
        { status: 400 }
      );
    }

    const sendRes = await sendCertificateEmail(recipientEmail, recipientName, {
      number: cert.number,
      type: cert.type,
      event: cert.event,
      position: cert.position || "Distinction",
      issued: cert.issued,
      discipline: player?.discipline,
      state: player?.state,
      club: player?.club,
      memberId: player?.id,
    });

    if (!sendRes.success) {
      return NextResponse.json(
        { success: false, error: "Failed to dispatch certificate email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Official certificate ${cert.number} has been dispatched to ${recipientEmail}`,
    });
  } catch (error: any) {
    console.error("Certificate email error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process certificate delivery" },
      { status: 500 }
    );
  }
}
