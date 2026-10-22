import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import { IdCardModel } from "@/models/IdCard";
import { syncChampionshipApplicationToIdCard, getIdCards } from "@/lib/id-cards-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();

    if (!cleanId) {
      return NextResponse.json(
        { success: false, error: "Identifier is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Direct search in IdCard collection
    const idRegex = new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
    const containsRegex = new RegExp(cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    let card = await IdCardModel.findOne({
      $and: [
        { cardType: "Championship" },
        {
          $or: [
            { id: idRegex },
            { championshipApplicationId: idRegex },
            { bibNumber: idRegex },
            { email: idRegex },
            { id: containsRegex },
          ],
        },
      ],
    }).lean();

    // 2. If not found in IdCard collection, check in ChampionshipApplicationModel
    if (!card) {
      const app = await ChampionshipApplicationModel.findOne({
        $or: [
          { id: idRegex },
          { applicationId: idRegex },
          { athleteId: idRegex },
          { email: idRegex },
          { bibNumber: idRegex },
        ],
      }).lean();

      if (app) {
        const isApproved = app.status === "Approved";
        if (isApproved) {
          // Auto sync to IdCard store and retrieve
          const synced = await syncChampionshipApplicationToIdCard(app);
          if (synced) {
            return NextResponse.json({
              success: true,
              card: synced,
              isApproved: true,
            });
          }
        }

        // Return application data formatted as preview if pending
        const bibNumber = app.bibNumber || "BIB-PENDING";
        const tier = app.level || (app.result as any)?.level || "District";
        return NextResponse.json({
          success: true,
          isApproved: false,
          card: {
            id: app.id || "CHAMP-" + cleanId,
            cardType: "Championship",
            holderName: app.applicantName || (app as any).athleteName || "Competitor",
            holderPhoto: app.photo || app.athletePhoto,
            designation: `Competitor (${bibNumber})`,
            championshipApplicationId: app.id,
            bibNumber: bibNumber,
            eventTitle: app.eventTitle || (app as any).eventName || "Championship",
            tournamentTier: tier,
            ageDivision: app.ageDivision,
            weightCategory: app.weightCategory,
            discipline: app.discipline || "Kalawar Martial Arts",
            beltRank: app.beltRank || "Competitor",
            academyName: app.clubName || app.club || "Independent Athlete",
            state: app.state || "Maharashtra",
            district: (app as any).district || app.city || "Pune",
            bloodGroup: (app as any).bloodGroup || "",
            emergencyContact: (app as any).emergencyContactPhone || app.phone,
            phone: app.phone || "",
            email: app.email || "",
            issueDate: app.approvalDate ? String(app.approvalDate).split("T")[0] : new Date().toISOString().split("T")[0],
            validUntil: app.eventDate || "2026-12-31",
            status: isApproved ? "Active" : app.status || "Pending",
            qrCodeUrl: `/id-cards/championship/${encodeURIComponent(app.id || cleanId)}`,
            barcodeNumber: `8902026${Math.floor(10000 + Math.random() * 90000)}`,
            authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
            authorizedSignatoryRole: "Founder & President – India",
            cardVersion: "2026.1",
          },
        });
      }
    }

    // 3. Check JSON file storage fallback
    if (!card) {
      const allCards = await getIdCards();
      const match = allCards.find(
        (c) =>
          c.cardType === "Championship" &&
          (c.id.toLowerCase() === cleanId.toLowerCase() ||
            (c.championshipApplicationId && c.championshipApplicationId.toLowerCase() === cleanId.toLowerCase()) ||
            (c.email && c.email.toLowerCase() === cleanId.toLowerCase()) ||
            (c.bibNumber && c.bibNumber.toLowerCase() === cleanId.toLowerCase()))
      );
      if (match) {
        card = match as any;
      }
    }

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Championship ID Card credentials not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card,
      isApproved: card.status === "Active" || card.status === "Approved",
    });
  } catch (error: any) {
    console.error("GET /api/id-cards/championship/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Championship ID Card" },
      { status: 500 }
    );
  }
}
