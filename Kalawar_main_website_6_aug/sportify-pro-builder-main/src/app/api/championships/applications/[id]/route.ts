import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import {
  sendChampionshipResultPublishedEmail,
  sendChampionshipApplicationApprovedEmail,
  sendChampionshipApplicationRejectedEmail,
} from "@/lib/email-service";
import type { ChampionshipApplication } from "@/types/championship";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const application = await ChampionshipApplicationModel.findOne({
      id: { $regex: new RegExp(`^${id}$`, "i") },
    }).lean();

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch application" },
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
    const body = (await request.json()) as Partial<ChampionshipApplication>;

    await connectToDatabase();

    const existing = await ChampionshipApplicationModel.findOne({
      id: { $regex: new RegExp(`^${id}$`, "i") },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found to update" },
        { status: 404 }
      );
    }

    // Auto-generate Bib number if approving and candidate has no bib number
    if (body.status === "Approved" && !existing.bibNumber && !body.bibNumber) {
      let maxBibNum = 0;
      try {
        const approvedWithBib = await ChampionshipApplicationModel.find(
          { bibNumber: { $regex: /^BIB-\d+$/i } },
          "bibNumber"
        ).lean();
        for (const doc of approvedWithBib) {
          const match = doc.bibNumber?.match(/^BIB-(\d+)$/i);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n > maxBibNum) maxBibNum = n;
          }
        }
      } catch {}
      let nextBibSeq = maxBibNum + 1;
      let candidateBib = `BIB-${String(nextBibSeq).padStart(3, "0")}`;
      while (await ChampionshipApplicationModel.exists({ bibNumber: candidateBib })) {
        nextBibSeq++;
        candidateBib = `BIB-${String(nextBibSeq).padStart(3, "0")}`;
      }
      body.bibNumber = candidateBib;
      body.approvalDate = new Date().toISOString();
    }

    body.updatedAt = new Date().toISOString();

    const updated = await ChampionshipApplicationModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id}$`, "i") } },
      { $set: body },
      { returnDocument: "after" }
    );

    // Auto-issue official Championship ID Card & send Approval Email if approved
    if (updated && (updated.status === "Approved" || body.status === "Approved")) {
      try {
        const { syncChampionshipApplicationToIdCard } = await import("@/lib/id-cards-store");
        await syncChampionshipApplicationToIdCard(updated);
      } catch (idCardErr) {
        console.warn("Could not auto-generate Championship ID Card on approval:", idCardErr);
      }

      if (updated.email) {
        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarindia.org";
        sendChampionshipApplicationApprovedEmail({
          to: updated.email,
          applicantName: updated.applicantName || (updated as any).athleteName || "Competitor",
          athleteId: updated.athleteId || updated.id || "CHAMP-2026-0001",
          bibNumber: updated.bibNumber || body.bibNumber || "BIB-001",
          eventTitle: updated.eventTitle || "Championship 2026",
          eventDate: updated.eventDate || "",
          eventVenue: updated.eventVenue || "",
          eventCity: updated.eventCity || "",
          discipline: updated.discipline || "",
          ageDivision: updated.ageDivision || "",
          weightCategory: updated.weightCategory || "",
          beltRank: updated.beltRank || "",
          clubName: updated.clubName || "",
          level: updated.level || "District",
          idCardUrl: `${origin}/my-id-card`,
        }).catch((err) => console.error("Failed to send championship approval email:", err));
      }
    }

    // Send Rejection Email notification if status is Rejected
    if (updated && (updated.status === "Rejected" || body.status === "Rejected") && updated.email) {
      sendChampionshipApplicationRejectedEmail({
        to: updated.email,
        applicantName: updated.applicantName || (updated as any).athleteName || "Competitor",
        athleteId: updated.athleteId || updated.id,
        trackingId: updated.id,
        eventTitle: updated.eventTitle || "Championship 2026",
        rejectionReason:
          body.rejectionReason ||
          updated.rejectionReason ||
          "Document verification incomplete or qualification criteria not met.",
        discipline: updated.discipline || "",
        level: updated.level || "District",
      }).catch((err) => console.error("Failed to send championship rejection email:", err));
    }

    // Send email notification if competition result was published
    if (body.result && body.result.place && updated && updated.email) {
      const champLevel = (body.result as any).level || updated.level || "District";
      sendChampionshipResultPublishedEmail({
        to: updated.email,
        candidateName: updated.applicantName || (updated as any).athleteName || "Competitor",
        eventTitle: updated.eventTitle || (updated as any).eventName || "Championship",
        level: champLevel,
        place: body.result.place,
        points: body.result.points || 0,
        notes: body.result.notes || "",
      }).catch((emailErr) => console.error("Failed to send result publish email:", emailErr));
    }

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      application: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update application" },
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

    const deleted = await ChampionshipApplicationModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${id}$`, "i") },
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Application not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete application" },
      { status: 500 }
    );
  }
}
