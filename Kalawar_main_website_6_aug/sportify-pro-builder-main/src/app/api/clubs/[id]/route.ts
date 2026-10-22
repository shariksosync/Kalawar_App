import { NextResponse } from "next/server";
import { getClubById, updatePlayer, deletePlayer } from "@/lib/players-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { club, coaches, athletes } = await getClubById(id);

    if (!club) {
      try {
        const { getCertificateByNumberOrId } = await import("@/lib/certificates-store");
        const cert = await getCertificateByNumberOrId(id);
        if (cert && (cert.isAffiliationCert || cert.type?.includes("Club") || cert.type?.includes("Affiliation"))) {
          const syntheticClub = {
            id: cert.kalawarId || cert.id,
            name: cert.holder || cert.academy || "Official Martial Arts Club",
            memberType: "Club",
            state: cert.state || "Maharashtra",
            district: cert.district || "Pune",
            email: cert.email,
            phone: cert.phone,
            headCoachName: cert.headCoachName,
            presidentName: cert.presidentName,
            secretaryName: cert.secretaryName,
            levelOfAffiliation: cert.levelOfAffiliation || cert.position,
            levelsOfAffiliation: cert.levelsOfAffiliation || (cert.levelOfAffiliation ? [cert.levelOfAffiliation] : []),
            clubCategory: cert.clubCategory,
            affiliationCertificateId: cert.affiliationCertificateId || cert.number,
            validFrom: cert.issued,
            validUntil: cert.validUntil,
            status: cert.status === "Valid" ? "Affiliated" : cert.status,
          };
          return NextResponse.json({
            success: true,
            club: syntheticClub,
            coaches: [],
            athletes: [],
          });
        }
      } catch (certFallbackErr) {}

      return NextResponse.json(
        { success: false, error: "Club not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      club,
      coaches,
      athletes,
    });
  } catch (error) {
    console.error("GET /api/clubs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch club" },
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
    const body = await request.json();

    const updated = await updatePlayer(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Club not found" },
        { status: 404 }
      );
    }

    // Sync with central Certificate registry if affiliationCertificateId is present
    if (updated.affiliationCertificateId) {
      try {
        const { CertificateModel } = await import("@/models/Certificate");
        const { connectToDatabase } = await import("@/lib/mongodb");
        await connectToDatabase();
        await CertificateModel.findOneAndUpdate(
          {
            $or: [
              { number: updated.affiliationCertificateId },
              { kalawarId: updated.id },
            ],
          },
          {
            $set: {
              id: `CERT-AFF-${updated.id}`,
              number: updated.affiliationCertificateId,
              holder: updated.name,
              kalawarId: updated.id,
              email: updated.email,
              phone: updated.phone,
              state: updated.state,
              district: updated.district || updated.city,
              academy: updated.name,
              type: "Club Affiliation Certificate",
              event: "Official Federation Dojang & Academy Affiliation",
              position: updated.levelOfAffiliation || updated.discipline || "Accredited Martial Arts Academy",
              issued: updated.validFrom || new Date().toISOString().split("T")[0],
              validUntil: updated.validUntil || "2026-12-31",
              issuedBy: "Mr. Santosh Kasbe (Founder & President)",
              status: "Valid",
              levelOfAffiliation: updated.levelOfAffiliation,
              levelsOfAffiliation: updated.levelsOfAffiliation,
              clubCategory: updated.clubCategory,
              headCoachName: updated.headCoachName,
              presidentName: updated.presidentName || (updated as any).president || body.presidentName || "",
              secretaryName: updated.secretaryName || (updated as any).secretary || body.secretaryName || "",
              affiliationCertificateId: updated.affiliationCertificateId,
              isAffiliationCert: true,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        // Sync with local fallback file storage
        try {
          const fs = await import("fs");
          const path = await import("path");
          const storagePath = path.join(process.cwd(), "src/data/storage/certificates.json");
          if (fs.existsSync(storagePath)) {
            const raw = fs.readFileSync(storagePath, "utf-8");
            let list: any[] = [];
            try { list = JSON.parse(raw); } catch { list = []; }
            const entry = {
              id: `CERT-AFF-${updated.id}`,
              number: updated.affiliationCertificateId,
              holder: updated.name,
              kalawarId: updated.id,
              email: updated.email,
              phone: updated.phone,
              state: updated.state,
              district: updated.district || updated.city,
              academy: updated.name,
              type: "Club Affiliation Certificate",
              event: "Official Federation Dojang & Academy Affiliation",
              position: updated.levelOfAffiliation || updated.discipline || "Accredited Martial Arts Academy",
              issued: updated.validFrom || new Date().toISOString().split("T")[0],
              validUntil: updated.validUntil || "2026-12-31",
              issuedBy: "Mr. Santosh Kasbe (Founder & President)",
              status: "Valid",
              levelOfAffiliation: updated.levelOfAffiliation,
              levelsOfAffiliation: updated.levelsOfAffiliation,
              clubCategory: updated.clubCategory,
              headCoachName: updated.headCoachName,
              presidentName: updated.presidentName || (updated as any).president || body.presidentName || "",
              secretaryName: updated.secretaryName || (updated as any).secretary || body.secretaryName || "",
              affiliationCertificateId: updated.affiliationCertificateId,
              isAffiliationCert: true,
            };
            const idx = list.findIndex((c) => c.number === updated.affiliationCertificateId || c.kalawarId === updated.id);
            if (idx >= 0) { list[idx] = { ...list[idx], ...entry }; } else { list.push(entry); }
            fs.writeFileSync(storagePath, JSON.stringify(list, null, 2));
          }
        } catch (storageErr) {
          console.warn("Storage fallback sync note:", storageErr);
        }

        // Invalidate Redis Certificate Cache
        try {
          const { invalidateCertificateCache } = await import("@/lib/redis");
          await invalidateCertificateCache(updated.affiliationCertificateId);
          await invalidateCertificateCache(updated.id);
        } catch (redisErr) {}
      } catch (certErr) {
        console.warn("Certificate sync note:", certErr);
      }

      // Dispatch official certificate email notification to academy
      const recipientEmail = updated.email || body.email || "";
      if (recipientEmail && recipientEmail.includes("@")) {
        try {
          const { sendClubAffiliationCertificateEmail } = await import("@/lib/email-service");
          sendClubAffiliationCertificateEmail({
            to: recipientEmail,
            clubName: updated.name,
            clubId: updated.id,
            certificateNumber: updated.affiliationCertificateId,
            levelOfAffiliation:
              updated.levelOfAffiliation ||
              (Array.isArray(updated.levelsOfAffiliation)
                ? updated.levelsOfAffiliation.join(", ")
                : "Academy / Club Affiliation"),
            headCoachName:
              updated.headCoachName ||
              updated.coachName ||
              body.headCoachInstructor ||
              "",
            presidentName: updated.presidentName || "",
            secretaryName: updated.secretaryName || "",
            state: updated.state || "Maharashtra",
            district: updated.district || updated.city || "",
            validFrom: updated.validFrom || "2026-01-01",
            validUntil: updated.validUntil || "2026-12-31",
            contactNo: updated.phone || updated.alternatePhone || "",
            isReissue: Boolean(body.isReissue),
          }).catch((emailErr) =>
            console.warn("[Club Affiliation] Certificate email dispatch error:", emailErr)
          );
        } catch (emailImportErr) {
          console.warn("[Club Affiliation] Could not import email service:", emailImportErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Club affiliation updated successfully",
      club: updated,
    });
  } catch (error) {
    console.error("PUT /api/clubs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update club" },
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
    const deleted = await deletePlayer(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Club not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Club affiliation deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/clubs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete club" },
      { status: 500 }
    );
  }
}
