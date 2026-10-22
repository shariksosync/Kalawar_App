import { NextResponse } from "next/server";
import crypto from "crypto";
import { formatToDDMMYYYY } from "@/lib/utils";
import { getIdCards } from "@/lib/id-cards-store";
import { getCertificates } from "@/lib/certificates-store";
import { getAllDanApplications } from "@/lib/dan-grading-store";
import { getBeltExams } from "@/lib/belt-exams-store";
import { getRankingsData } from "@/lib/rankings-store";
import { getEvents } from "@/lib/events-store";

export type VerificationDomain =
  | "player"
  | "coach"
  | "referee"
  | "club"
  | "official"
  | "certificate"
  | "dan"
  | "belt_exam"
  | "ranking"
  | "tournament";

export type UnifiedVerificationResult = {
  id: string;
  recordNumber: string;
  domain: VerificationDomain;
  domainLabel: string;
  categoryGroup: "id_cards" | "certificates" | "dan_diplomas" | "belt_exams" | "rankings" | "tournaments";
  title: string;
  subtitle: string;
  status: "Active" | "Valid" | "Expired" | "Suspended" | "Cancelled" | "Revoked" | "Pending" | "Under Verification" | "Approved" | "Rejected";
  statusBadgeVariant: "success" | "warning" | "destructive" | "default" | "secondary";
  photo?: string;
  issueDate?: string;
  validUntil?: string;
  state?: string;
  district?: string;
  discipline?: string;
  rankOrBelt?: string;
  details: Record<string, string | number | boolean | undefined>;
  securityHash: string;
  verifiedAt: string;
  deepLinkUrl: string;
};

function generateSecurityHash(identifier: string, title: string, domain: string): string {
  const payload = `${identifier}|${title}|${domain}|KALAWAR-FEDERATION-INDIA-2026`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
  return `KALAWAR-SEC-${hash.slice(0, 12)}`;
}

function cleanQuery(input: string): string {
  let q = input.trim();
  if (q.includes("/id-cards/")) {
    q = q.split("/id-cards/").pop() || q;
  } else if (q.includes("/certificates/")) {
    q = q.split("/certificates/").pop() || q;
  } else if (q.includes("verify=")) {
    const match = q.match(/verify=([^&]+)/);
    if (match && match[1]) q = match[1];
  } else if (q.includes("q=")) {
    const match = q.match(/q=([^&]+)/);
    if (match && match[1]) q = match[1];
  }
  return decodeURIComponent(q).trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const categoryFilter = searchParams.get("category") || "all";
    const statusFilter = searchParams.get("status") || "all";

    const query = cleanQuery(rawQuery);

    if (!query) {
      return NextResponse.json({
        success: true,
        query: "",
        total: 0,
        results: [],
        message: "Please enter a search query or scan a QR code.",
      });
    }

    const qLower = query.toLowerCase();
    const verifiedAt = new Date().toISOString();
    const results: UnifiedVerificationResult[] = [];

    // Detect if user searched an exact ID code pattern
    const isIdCardCode = /^(KSM|WSF)-(PL|CO|RF|CL)-/i.test(query) || /^(OFF|KAC-OFF)-/i.test(query);
    const isCertCode = /^(KALAWAR-CERT|KSM-CERT|WSF-CERT|CERT)-/i.test(query);
    const isDanCode = /^(KAC-DAN|DAN)-/i.test(query);
    const isCandidateCode = /^CAND-/i.test(query);
    const isRankingCode = /^RNK-/i.test(query);
    const isTournamentCode = /^EVT-/i.test(query);

    // Parallel fetch from all data stores
    const [idCards, certificates, danApps, beltExams, rankingsData, events] = await Promise.all([
      getIdCards().catch(() => []),
      getCertificates({ includeAll: true }).catch(() => []),
      getAllDanApplications().catch(() => []),
      getBeltExams().catch(() => []),
      getRankingsData().catch(() => ({ athletes: [], academies: [] })),
      getEvents().catch(() => []),
    ]);

    // 1. ID Cards & Profiles (Athletes, Coaches, Referees, Clubs, Officials)
    const shouldSearchIdCards =
      categoryFilter === "all" || categoryFilter === "id_cards" || isIdCardCode;
    
    if (shouldSearchIdCards && (!isCertCode && !isDanCode && !isCandidateCode && !isRankingCode && !isTournamentCode)) {
      for (const card of idCards) {
        const matches = isIdCardCode
          ? card.id.toLowerCase() === qLower || (card.barcodeNumber && card.barcodeNumber.toLowerCase() === qLower)
          : card.id.toLowerCase().includes(qLower) ||
            card.holderName.toLowerCase().includes(qLower) ||
            (card.phone && card.phone.toLowerCase().includes(qLower)) ||
            (card.email && card.email.toLowerCase().includes(qLower)) ||
            (card.academyName && card.academyName.toLowerCase().includes(qLower)) ||
            (card.barcodeNumber && card.barcodeNumber.toLowerCase().includes(qLower));

        if (matches) {
          let domain: VerificationDomain = "player";
          let domainLabel = "Athlete / Player ID";

          if (card.cardType === "Coach") {
            domain = "coach";
            domainLabel = "Accredited Coach ID";
          } else if (card.cardType === "Referee") {
            domain = "referee";
            domainLabel = "Technical Official / Referee ID";
          } else if (card.cardType === "Club") {
            domain = "club";
            domainLabel = "Affiliated Club / Academy Dojo";
          } else if (card.cardType === "Official") {
            domain = "official";
            domainLabel = "Federation Official ID";
          }

          let badgeVariant: "success" | "warning" | "destructive" | "default" | "secondary" = "success";
          if (card.status === "Expired" || card.status === "Suspended" || card.status === "Cancelled" || card.status === "Rejected") {
            badgeVariant = "destructive";
          } else if (card.status === "Under Verification" || card.status === "Pending") {
            badgeVariant = "warning";
          }

          results.push({
            id: card.id,
            recordNumber: card.id,
            domain,
            domainLabel,
            categoryGroup: "id_cards",
            title: card.holderName,
            subtitle: `${card.designation} • ${card.academyName}`,
            status: card.status,
            statusBadgeVariant: badgeVariant,
            photo: card.holderPhoto,
            issueDate: formatToDDMMYYYY(card.issueDate, card.issueDate),
            validUntil: formatToDDMMYYYY(card.validUntil, card.validUntil),
            state: card.state,
            district: card.district,
            discipline: card.discipline,
            rankOrBelt: card.beltRank,
            details: {
              "KALAWAR ID": card.id,
              "Category": card.cardType,
              "Designation": card.designation,
              ...(card.refereeLevel ? { "Referee Level": card.refereeLevel } : {}),
              "Academy / Club": card.academyName,
              "Discipline": card.discipline,
              "Belt Rank / Grade": card.beltRank || "N/A",
              "State Association": card.state,
              "District Unit": card.district,
              "Blood Group": card.bloodGroup || "N/A",
              "Issue Date": formatToDDMMYYYY(card.issueDate, card.issueDate),
              "Validity": formatToDDMMYYYY(card.validUntil, card.validUntil),
              "Barcode / UID": card.barcodeNumber,
              "Authorized Signatory": card.authorizedSignatory,
            },
            securityHash: generateSecurityHash(card.id, card.holderName, domain),
            verifiedAt,
            deepLinkUrl: `/id-cards/${encodeURIComponent(card.id)}`,
          });
        }
      }
    }

    // 2. Official Certificates
    const shouldSearchCerts =
      categoryFilter === "all" || categoryFilter === "certificates" || isCertCode;

    if (shouldSearchCerts && (!isIdCardCode && !isDanCode && !isCandidateCode && !isRankingCode && !isTournamentCode)) {
      for (const cert of certificates) {
        const matches = isCertCode
          ? cert.number.toLowerCase() === qLower || cert.id.toLowerCase() === qLower
          : cert.number.toLowerCase().includes(qLower) ||
            cert.holder.toLowerCase().includes(qLower) ||
            cert.id.toLowerCase().includes(qLower) ||
            (cert.event && cert.event.toLowerCase().includes(qLower)) ||
            (cert.type && cert.type.toLowerCase().includes(qLower));

        if (matches) {
          const isValid = cert.status === "Issued";
          results.push({
            id: cert.id,
            recordNumber: cert.number,
            domain: "certificate",
            domainLabel: "Official Championship Certificate",
            categoryGroup: "certificates",
            title: cert.holder,
            subtitle: `${cert.type} — ${cert.event}`,
            status: isValid ? "Valid" : "Revoked",
            statusBadgeVariant: isValid ? "success" : "destructive",
            issueDate: formatToDDMMYYYY(cert.issued, cert.issued),
            state: cert.state,
            details: {
              "Certificate No": cert.number,
              "Recipient Name": cert.holder,
              "Award Type": cert.type,
              "Championship / Event": cert.event,
              "Achievement / Position": cert.position,
              "State Association": cert.state || "National Unit",
              "Issue Date": formatToDDMMYYYY(cert.issued, cert.issued),
              "Registry Status": cert.status,
            },
            securityHash: generateSecurityHash(cert.number, cert.holder, "certificate"),
            verifiedAt,
            deepLinkUrl: `/certificates?verify=${encodeURIComponent(cert.number)}`,
          });
        }
      }
    }

    // 3. Black Belt & Dan Grading Diplomas / Applications
    const shouldSearchDan =
      categoryFilter === "all" || categoryFilter === "dan_diplomas" || isDanCode;

    if (shouldSearchDan && (!isCertCode && !isCandidateCode && !isRankingCode && !isTournamentCode)) {
      for (const dan of danApps) {
        const matches = isDanCode
          ? (dan.certificateNumber && dan.certificateNumber.toLowerCase() === qLower) ||
            dan.id.toLowerCase() === qLower ||
            (dan.idCardNumber && dan.idCardNumber.toLowerCase() === qLower) ||
            (dan.athleteId && dan.athleteId.toLowerCase() === qLower)
          : dan.id.toLowerCase().includes(qLower) ||
            (dan.athleteId && dan.athleteId.toLowerCase().includes(qLower)) ||
            dan.fullName.toLowerCase().includes(qLower) ||
            (dan.certificateNumber && dan.certificateNumber.toLowerCase().includes(qLower)) ||
            (dan.idCardNumber && dan.idCardNumber.toLowerCase().includes(qLower)) ||
            dan.appliedDanTitle.toLowerCase().includes(qLower);

        if (matches) {
          const isPassed = dan.status === "Passed";
          const isUnderReview = dan.status === "Submitted" || dan.status === "Under Verification" || dan.status === "Eligible" || dan.status === "Payment Verified";

          let statusLabel: any = "Valid";
          let badgeVariant: "success" | "warning" | "destructive" | "default" = "success";

          if (isPassed) {
            statusLabel = "Valid";
            badgeVariant = "success";
          } else if (isUnderReview) {
            statusLabel = "Under Verification";
            badgeVariant = "warning";
          } else {
            statusLabel = "Suspended";
            badgeVariant = "destructive";
          }

          const certNum = dan.certificateNumber || dan.id;

          results.push({
            id: dan.id,
            recordNumber: certNum,
            domain: "dan",
            domainLabel: "Black Belt & Dan Diploma",
            categoryGroup: "dan_diplomas",
            title: dan.fullName,
            subtitle: `${dan.appliedDanTitle} • ${dan.academyName}`,
            status: statusLabel,
            statusBadgeVariant: badgeVariant,
            photo: dan.athletePhoto,
            issueDate: formatToDDMMYYYY(dan.certificateIssuedDate || dan.appliedDate, "04/09/2026"),
            state: dan.state,
            discipline: "Kalawar Martial Arts",
            rankOrBelt: dan.appliedDanTitle,
            details: {
              "Diploma / Tracking ID": certNum,
              "Candidate Name": dan.fullName,
              "Dan Grade": `${dan.appliedDanGrade}th Dan (${dan.appliedDanTitle})`,
              "Current Belt": dan.currentBeltTitle,
              "Academy / Dojo": dan.academyName,
              "State Association": dan.state,
              "Master / Instructor": `${dan.instructorName} (${dan.instructorDanGrade})`,
              "Registration Date": formatToDDMMYYYY(dan.appliedDate, "04/09/2026"),
              "Assessment Grade": dan.assessment?.grade || "Pending Ratification",
              "Grandmaster Score": dan.assessment?.totalScore ? `${dan.assessment.totalScore}/100` : "Pending",
              "Application Status": dan.status,
            },
            securityHash: generateSecurityHash(certNum, dan.fullName, "dan"),
            verifiedAt,
            deepLinkUrl: `/dan-grading`,
          });
        }
      }
    }

    // 4. Belt Examination Candidates & Admit Cards
    const shouldSearchBeltCandidates =
      categoryFilter === "all" || categoryFilter === "belt_exams" || isCandidateCode;

    if (shouldSearchBeltCandidates && (!isIdCardCode && !isCertCode && !isDanCode && !isRankingCode && !isTournamentCode)) {
      for (const session of beltExams) {
        for (const cand of session.candidates || []) {
          const matches = isCandidateCode
            ? cand.id.toLowerCase() === qLower
            : cand.id.toLowerCase().includes(qLower) ||
              cand.athleteName.toLowerCase().includes(qLower) ||
              (cand.targetBelt && cand.targetBelt.toLowerCase().includes(qLower)) ||
              session.title.toLowerCase().includes(qLower);

          if (matches) {
            const isApproved = cand.status === "Admit Card Issued" || cand.status === "Result Declared";
            const statusLabel: "Active" | "Under Verification" | "Pending" = isApproved ? "Active" : "Under Verification";
            const badgeVariant = isApproved ? "success" : "warning";

            results.push({
              id: cand.id,
              recordNumber: cand.id,
              domain: "belt_exam",
              domainLabel: "Belt Exam Candidate / Admit Card",
              categoryGroup: "belt_exams",
              title: cand.athleteName,
              subtitle: `Target: ${cand.targetBelt} • ${session.title}`,
              status: statusLabel,
              statusBadgeVariant: badgeVariant,
              photo: cand.athleteImage,
              issueDate: formatToDDMMYYYY(cand.registeredOn, "28/09/2026"),
              state: cand.state,
              rankOrBelt: cand.targetBelt,
              discipline: session.discipline,
              details: {
                "Roll / Candidate Number": cand.id,
                "Candidate Name": cand.athleteName,
                "Examination Session": session.title,
                "Exam Date": formatToDDMMYYYY(cand.examDate || session.examDate, "28/09/2026"),
                "Venue": `${session.venueName}, ${session.city}`,
                "Current Belt": cand.currentBelt,
                "Target Belt": cand.targetBelt,
                "Academy / Club": cand.academyName || cand.clubName,
                "State Unit": cand.state,
                "Candidate Status": cand.status || "Submitted",
                "Admit Card No": cand.admitCardNumber || "Under Scrutiny",
                "Chief Examiner": session.chiefExaminer,
              },
              securityHash: generateSecurityHash(cand.id, cand.athleteName, "belt_exam"),
              verifiedAt,
              deepLinkUrl: `/belt-exams`,
            });
          }
        }
      }
    }

    // 5. Official Rankings (Athletes and Academies)
    const shouldSearchRankings =
      categoryFilter === "all" || categoryFilter === "rankings" || isRankingCode;

    if (shouldSearchRankings && (!isIdCardCode && !isCertCode && !isDanCode && !isCandidateCode && !isTournamentCode)) {
      for (const athlete of rankingsData.athletes || []) {
        const matches = isRankingCode
          ? athlete.rankingId.toLowerCase() === qLower
          : athlete.rankingId.toLowerCase().includes(qLower) ||
            athlete.athleteName.toLowerCase().includes(qLower) ||
            athlete.clubName.toLowerCase().includes(qLower);

        if (matches) {
          results.push({
            id: athlete.rankingId,
            recordNumber: athlete.rankingId,
            domain: "ranking",
            domainLabel: "Official Verified Ranking Standings",
            categoryGroup: "rankings",
            title: athlete.athleteName,
            subtitle: `Rank #${athlete.currentRank} (${athlete.totalPoints} Pts) • ${athlete.clubName}`,
            status: "Active",
            statusBadgeVariant: "success",
            photo: athlete.photo,
            issueDate: athlete.verifiedAt,
            state: athlete.state,
            district: athlete.district,
            discipline: athlete.discipline,
            rankOrBelt: athlete.beltRank || athlete.weightCategory,
            details: {
              "Ranking UID": athlete.rankingId,
              "Athlete Name": athlete.athleteName,
              "National Rank": `#${athlete.currentRank}`,
              "Total Official Points": `${athlete.totalPoints} Pts`,
              "Match Points": `${athlete.matchPoints} Pts`,
              "Medal Points": `${athlete.medalPoints} Pts`,
              "Medal Tally": `Gold: ${athlete.medals.gold} | Silver: ${athlete.medals.silver} | Bronze: ${athlete.medals.bronze}`,
              "Win Ratio": `${athlete.winRatio}%`,
              "Club / Dojo": athlete.clubName,
              "State Association": athlete.state,
              "Category / Weight": `${athlete.ageGroup} / ${athlete.weightCategory}`,
              "Audit Status": athlete.status,
            },
            securityHash: generateSecurityHash(athlete.rankingId, athlete.athleteName, "ranking"),
            verifiedAt,
            deepLinkUrl: `/ranking?search=${encodeURIComponent(athlete.athleteName)}`,
          });
        }
      }
    }

    // 6. Tournaments & Events
    const shouldSearchTournaments =
      categoryFilter === "all" || categoryFilter === "tournaments" || isTournamentCode;

    if (shouldSearchTournaments && (!isIdCardCode && !isCertCode && !isDanCode && !isCandidateCode && !isRankingCode)) {
      for (const ev of events) {
        const matches = isTournamentCode
          ? ev.id.toLowerCase() === qLower
          : ev.id.toLowerCase().includes(qLower) ||
            ev.title.toLowerCase().includes(qLower) ||
            ev.city.toLowerCase().includes(qLower) ||
            ev.venue.toLowerCase().includes(qLower);

        if (matches) {
          results.push({
            id: ev.id,
            recordNumber: ev.id,
            domain: "tournament",
            domainLabel: "Official Tournament / Championship",
            categoryGroup: "tournaments",
            title: ev.title,
            subtitle: `${ev.discipline} • ${ev.city} (${ev.startDate} to ${ev.endDate})`,
            status: "Active",
            statusBadgeVariant: "success",
            photo: ev.image,
            issueDate: ev.startDate,
            state: ev.city,
            discipline: ev.discipline,
            details: {
              "Sanctioned Event ID": ev.id,
              "Tournament Title": ev.title,
              "Discipline / Sport": ev.discipline,
              "Category": ev.category || "Championship",
              "Location / Venue": `${ev.venue}, ${ev.city}`,
              "Event Dates": `${ev.startDate} to ${ev.endDate}`,
              "Status": ev.status || "Active",
            },
            securityHash: generateSecurityHash(ev.id, ev.title, "tournament"),
            verifiedAt,
            deepLinkUrl: `/events`,
          });
        }
      }
    }

    // Deduplicate by recordNumber + domain
    const seen = new Set<string>();
    const deduplicatedResults: UnifiedVerificationResult[] = [];
    for (const r of results) {
      const key = `${r.domain}_${r.recordNumber.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedResults.push(r);
      }
    }

    // Filter by status if specified
    let finalResults = deduplicatedResults;
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        finalResults = finalResults.filter((r) => r.status === "Active" || r.status === "Valid");
      } else if (statusFilter === "verification") {
        finalResults = finalResults.filter((r) => r.status === "Under Verification" || r.status === "Pending");
      } else if (statusFilter === "invalid") {
        finalResults = finalResults.filter((r) => r.status === "Expired" || r.status === "Suspended" || r.status === "Cancelled" || r.status === "Revoked");
      }
    }

    return NextResponse.json({
      success: true,
      query,
      total: finalResults.length,
      results: finalResults,
    });
  } catch (err: any) {
    console.error("GET /api/search/verify error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "An error occurred while performing verification.",
      },
      { status: 500 }
    );
  }
}
