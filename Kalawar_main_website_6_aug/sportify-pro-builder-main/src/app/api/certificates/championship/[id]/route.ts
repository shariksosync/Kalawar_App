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
        { applicationId: { $regex: new RegExp(`^${id}$`, "i") } },
      ],
    }).lean();

    if (cert) {
      return NextResponse.json({
        success: true,
        certificate: cert,
      });
    }

    // Fallback search in applications if certificate is linked
    const app = await ChampionshipApplicationModel.findOne({
      $or: [
        { id: { $regex: new RegExp(`^${id}$`, "i") } },
        { certificateNumber: { $regex: new RegExp(`^${id}$`, "i") } },
      ],
    }).lean();

    if (app && app.certificateNumber) {
      const level = (app as any).level || (app.result as any)?.level || "District";
      const isDistrict = String(level).toLowerCase() === "district";
      const rawVenue = app.eventLocation || app.eventVenue;
      const districtVenue = (app as any).eventCity || app.city || (app as any).district || app.state || "District Sports Complex";
      const eventLocation = isDistrict
        ? (rawVenue && !rawVenue.toLowerCase().includes("national") ? rawVenue : districtVenue)
        : (rawVenue || "National Tournament Arena");

      const fallbackCert = {
        id: app.certificateNumber,
        certificateNumber: app.certificateNumber,
        applicationId: app.id,
        eventId: app.eventId,
        championshipTitle: app.eventTitle,
        eventName: app.eventName || app.eventTitle,
        eventLocation,
        level,
        discipline: app.discipline,
        category: (app as any).category || "",
        candidateName: app.applicantName,
        athleteId: app.athleteId || "",
        email: app.email,
        phone: app.phone,
        clubName: app.clubName,
        state: app.state,
        ageDivision: app.ageDivision,
        weightCategory: app.weightCategory,
        beltRank: app.beltRank,
        awardType: app.result?.place === "Gold" ? "Gold Medal" : app.result?.place === "Silver" ? "Silver Medal" : app.result?.place === "Bronze" ? "Bronze Medal" : "Participation & Merit",
        place: app.result?.place || "Participant",
        podiumPlace: app.result?.place || "Participant",
        bibNumber: app.bibNumber || "",
        issueDate: app.certificateIssuedAt || app.createdAt,
        issuedBy: "KALAWAR Sports & Martial Arts Federation of India",
        presidentSignature: "Authorized Federation Signatory",
        secretarySignature: "Secretary General",
        qrVerificationUrl: `/certificates/championship/${encodeURIComponent(app.certificateNumber)}`,
        notes: app.result?.notes || "",
        createdAt: app.createdAt,
      };

      return NextResponse.json({
        success: true,
        certificate: fallbackCert,
      });
    }

    return NextResponse.json(
      { success: false, error: "Official championship certificate not found or not yet declared." },
      { status: 404 }
    );
  } catch (error) {
    console.error("GET /api/certificates/championship/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load certificate" },
      { status: 500 }
    );
  }
}
