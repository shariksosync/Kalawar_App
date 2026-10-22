import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import type { ChampionshipCertificate, ChampionshipAwardType } from "@/types/championship";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awardType = searchParams.get("awardType");
    const eventId = searchParams.get("eventId");
    const query = searchParams.get("q") || searchParams.get("search");

    await connectToDatabase();

    const filter: any = {};

    if (awardType && awardType !== "All") {
      filter.awardType = awardType;
    }

    if (eventId && eventId !== "All") {
      filter.eventId = eventId;
    }

    if (query && query.trim()) {
      const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { id: { $regex: regex } },
        { certificateNumber: { $regex: regex } },
        { candidateName: { $regex: regex } },
        { athleteId: { $regex: regex } },
        { championshipTitle: { $regex: regex } },
        { discipline: { $regex: regex } },
        { clubName: { $regex: regex } },
      ];
    }

    const certificates = await ChampionshipCertificateModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: certificates.length,
      certificates: certificates || [],
    });
  } catch (error) {
    console.error("GET /api/championships/certificates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch championship certificates", certificates: [] },
      { status: 500 }
    );
  }
}

import { sendChampionshipCertificateIssuedEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      applicationId: string;
      level?: "District" | "State" | "National" | "International" | string;
      awardType?: ChampionshipAwardType | string;
      place?: string;
      customCertNumber?: string;
      notes?: string;
      adminNotes?: string;
    };

    if (!body.applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required to issue certificate" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const application = await ChampionshipApplicationModel.findOne({
      id: { $regex: new RegExp(`^${body.applicationId}$`, "i") },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Registered applicant not found" },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    // Tier-aware prefix based on explicit level or event title
    const chosenLevel = body.level || (application.result as any)?.level || application.level || "District";
    const levelLower = chosenLevel.toLowerCase();
    let prefix = `KAL-${currentYear}-`;
    if (levelLower.includes("international") || levelLower.includes("world")) {
      prefix = `KAL-${currentYear}-I-`;
    } else if (levelLower.includes("national") || levelLower.includes("all india") || levelLower.includes("india")) {
      prefix = `KAL-${currentYear}-N-`;
    } else if (levelLower.includes("state") || levelLower.includes("maharashtra")) {
      prefix = `KAL-${currentYear}-S-`;
    }

    let certNumber = body.customCertNumber?.trim();
    if (!certNumber) {
      let maxCertSeq = 0;
      try {
        const existingCerts = await ChampionshipCertificateModel.find(
          { certificateNumber: { $regex: new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\d+$`, "i") } },
          "certificateNumber"
        ).lean();
        const seqRegex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`, "i");
        for (const c of existingCerts) {
          const m = c.certificateNumber?.match(seqRegex);
          if (m && m[1]) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num > maxCertSeq) maxCertSeq = num;
          }
        }
      } catch {}

      let nextSeqNum = maxCertSeq + 1;
      certNumber = `${prefix}${String(nextSeqNum).padStart(4, "0")}`;
      while (await ChampionshipCertificateModel.exists({ certificateNumber: certNumber })) {
        nextSeqNum++;
        certNumber = `${prefix}${String(nextSeqNum).padStart(4, "0")}`;
      }
    }

    // Determine clean award type (Gold, Silver, Bronze, Participant)
    const awardType = body.awardType || "Participant";
    const place = body.place || application.result?.place || "Participant";

    const qrUrl = `/certificates/championship/${encodeURIComponent(certNumber)}`;

    // Create or update certificate in registry
    const certificate = await ChampionshipCertificateModel.findOneAndUpdate(
      { certificateNumber: certNumber },
      {
        $set: {
          id: certNumber,
          certificateNumber: certNumber,
          applicationId: application.id,
          eventId: application.eventId,
          championshipTitle: application.eventTitle,
          level: chosenLevel,
          discipline: application.discipline,
          candidateName: application.applicantName,
          athleteId: application.athleteId || "",
          email: application.email,
          phone: application.phone,
          clubName: application.clubName,
          state: application.state,
          ageDivision: application.ageDivision,
          weightCategory: application.weightCategory,
          beltRank: application.beltRank,
          awardType,
          place,
          bibNumber: application.bibNumber || "",
          issueDate: new Date().toISOString(),
          issuedBy: "KALAWAR Sports & Martial Arts Federation of India",
          presidentSignature: "Authorized Federation Signatory",
          secretarySignature: "Secretary General",
          qrVerificationUrl: qrUrl,
          notes: body.notes || "",
          adminNotes: body.adminNotes || body.notes || "",
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // Update application with issued certificate number and level
    application.certificateNumber = certNumber;
    application.certificateIssuedAt = new Date().toISOString();
    if (chosenLevel) application.level = chosenLevel;
    await application.save();

    // Send email notification to user
    if (application.email) {
      sendChampionshipCertificateIssuedEmail({
        to: application.email,
        candidateName: application.applicantName || (application as any).athleteName || "Competitor",
        eventTitle: application.eventTitle || (application as any).eventName || "Championship",
        level: chosenLevel,
        awardType: String(awardType),
        certificateNumber: certNumber,
      }).catch((err) => console.error("Failed to send certificate issue email:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: `Official Certificate ${certNumber} issued successfully!`,
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/championships/certificates error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
