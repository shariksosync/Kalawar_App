import { NextResponse } from "next/server";
import { getCertificates, createCertificate, type CreateCertificateInput } from "@/lib/certificates-store";
import { sendCertificateEmail } from "@/lib/email-service";
import { getPlayers } from "@/lib/players-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get("number") || undefined;
    const kalawarId = searchParams.get("kalawarId") || undefined;
    const holder = searchParams.get("holder") || undefined;
    const type = searchParams.get("type") || undefined;
    const state = searchParams.get("state") || undefined;
    const status = searchParams.get("status") || undefined;
    const includeAll = searchParams.get("all") === "true";

    const certificates = await getCertificates({
      number,
      kalawarId,
      holder,
      type,
      state,
      status,
      includeAll,
    });

    // Auto-enrich Club Affiliation Certificates with active club profile details if missing
    try {
      const clubCerts = certificates.filter(
        (c) =>
          c.type === "Club Affiliation Certificate" ||
          c.type === "Affiliation Certificate" ||
          c.event?.toLowerCase().includes("affiliation") ||
          c.number?.startsWith("KAC-AFF") ||
          c.kalawarId?.startsWith("KSM-CL") ||
          c.kalawarId?.startsWith("WSF-CL")
      );

      if (clubCerts.length > 0) {
        const clubs = await getPlayers();
        const clubMap = new Map<string, any>();
        clubs.forEach((club) => {
          if (club.id) clubMap.set(club.id.toLowerCase(), club);
          if (club.affiliationCertificateId) clubMap.set(club.affiliationCertificateId.toLowerCase(), club);
          if (club.name) clubMap.set(club.name.toLowerCase(), club);
        });

        for (let i = 0; i < certificates.length; i++) {
          const cert = certificates[i];
          const isClubCert =
            cert.type === "Club Affiliation Certificate" ||
            cert.type === "Affiliation Certificate" ||
            cert.event?.toLowerCase().includes("affiliation") ||
            cert.number?.startsWith("KAC-AFF") ||
            cert.kalawarId?.startsWith("KSM-CL") ||
            cert.kalawarId?.startsWith("WSF-CL");

          if (isClubCert) {
            const matchedClub =
              (cert.kalawarId && clubMap.get(cert.kalawarId.toLowerCase())) ||
              (cert.number && clubMap.get(cert.number.toLowerCase())) ||
              (cert.holder && clubMap.get(cert.holder.toLowerCase()));

            if (matchedClub) {
              const clubLevels = Array.isArray(matchedClub.levelsOfAffiliation) && matchedClub.levelsOfAffiliation.length > 0
                ? matchedClub.levelsOfAffiliation
                : typeof matchedClub.levelOfAffiliation === "string" && matchedClub.levelOfAffiliation.trim()
                ? matchedClub.levelOfAffiliation.split(",").map((s: string) => s.trim())
                : [];

              certificates[i] = {
                ...cert,
                levelOfAffiliation:
                  cert.levelOfAffiliation ||
                  matchedClub.levelOfAffiliation ||
                  matchedClub.clubCategory ||
                  matchedClub.level,
                levelsOfAffiliation:
                  cert.levelsOfAffiliation && cert.levelsOfAffiliation.length > 0
                    ? cert.levelsOfAffiliation
                    : clubLevels,
                clubCategory: cert.clubCategory || matchedClub.clubCategory,
                headCoachName:
                  cert.headCoachName ||
                  matchedClub.headCoachName ||
                  matchedClub.coachName,
                phone: cert.phone || matchedClub.phone || matchedClub.alternatePhone,
                state: cert.state || matchedClub.state,
                district: cert.district || matchedClub.district || matchedClub.city,
              };
            }
          }
        }
      }
    } catch (enrichErr) {
      console.warn("Certificate enrichment note:", enrichErr);
    }

    return NextResponse.json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCertificateInput;

    if (!body.holder || !body.holder.trim()) {
      return NextResponse.json(
        { success: false, error: "Certificate holder name is required" },
        { status: 400 }
      );
    }
    if (!body.event || !body.event.trim()) {
      return NextResponse.json(
        { success: false, error: "Event or tournament title is required" },
        { status: 400 }
      );
    }

    let recipientEmail = body.email ? body.email.trim().toLowerCase() : "";
    let matchedPlayer: any = null;

    // Lookup matching athlete in player database to enrich certificate details if email is not provided
    const players = await getPlayers();
    matchedPlayer = players.find(
      (p) =>
        p.name.toLowerCase() === body.holder.trim().toLowerCase() ||
        p.id.toLowerCase() === body.holder.trim().toLowerCase()
    );

    if (!recipientEmail && matchedPlayer && matchedPlayer.email) {
      recipientEmail = matchedPlayer.email.toLowerCase();
    }

    if (recipientEmail) {
      body.email = recipientEmail;
    }

    const certificate = await createCertificate({
      ...body,
      state: body.state?.trim() || undefined,
    });

    // Automatically send a single certificate email in the background without blocking the HTTP response
    if (recipientEmail && recipientEmail.includes("@")) {
      sendCertificateEmail(recipientEmail, certificate.holder, {
        number: certificate.number,
        type: certificate.type,
        event: certificate.event,
        position: certificate.position || "Distinction",
        issued: certificate.issued,
        state: body.state?.trim() || certificate.state || matchedPlayer?.state,
        discipline: matchedPlayer?.discipline,
        club: matchedPlayer?.club,
        memberId: matchedPlayer?.id,
      }).catch((emailErr) => {
        console.warn("Auto certificate email delivery note:", emailErr);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: recipientEmail
          ? `Certificate generated and notification dispatched to ${recipientEmail}`
          : "Certificate generated successfully",
        certificate,
        emailDelivered: Boolean(recipientEmail),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create certificate",
      },
      { status: 400 }
    );
  }
}
