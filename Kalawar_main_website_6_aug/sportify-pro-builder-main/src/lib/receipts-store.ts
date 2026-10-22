import { getPlayers } from "./players-store";
import { getReferees } from "./referees-store";
import { getAllDanApplications } from "./dan-grading-store";
import { getBeltExams } from "./belt-exams-store";
import { connectToDatabase } from "./mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import type {
  RegistrationReceiptItem,
  UserReceiptsQuery,
  ReceiptsStatsSummary,
} from "@/types/receipt";

function cleanString(str?: string | null): string {
  return (str || "").trim().toLowerCase();
}

function cleanPhone(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Checks if a candidate record strictly matches the queried user credentials
 */
function isUserMatch(
  record: {
    id?: string;
    athleteId?: string;
    kalawarId?: string;
    userId?: string;
    email?: string;
    phone?: string;
    name?: string;
    holderName?: string;
    applicantName?: string;
    fullName?: string;
    athleteName?: string;
  },
  query: UserReceiptsQuery
): boolean {
  const qIds = [query.userId, query.memberId].filter(Boolean).map(cleanString);
  const qEmail = cleanString(query.email);
  const qPhone = cleanPhone(query.phone);

  const hasExplicitFilter = qIds.length > 0 || !!qEmail || (!!qPhone && qPhone.length >= 10);

  // If admin explicitly requested all records without targeting a specific user ID/email
  if (query.role === "admin" && !hasExplicitFilter) {
    return true;
  }

  // If no user identifier was provided, do not match any records
  if (!hasExplicitFilter) {
    return false;
  }

  // 1. Strict ID Match (exact equality)
  const recordIds = [record.id, record.athleteId, record.kalawarId, record.userId]
    .filter(Boolean)
    .map(cleanString);

  for (const qId of qIds) {
    if (qId && recordIds.some((rId) => rId === qId)) {
      return true;
    }
  }

  // 2. Strict Email Match (exact equality)
  const recordEmail = cleanString(record.email);
  if (qEmail && recordEmail && recordEmail === qEmail) {
    return true;
  }

  // 3. Strict Phone Match (exact 10 digits equality)
  const recordPhone = cleanPhone(record.phone);
  if (qPhone && qPhone.length >= 10 && recordPhone && recordPhone.length >= 10 && recordPhone === qPhone) {
    return true;
  }

  return false;
}

/**
 * Aggregates all authentic registration receipts matching the user account
 */
export async function getUserRegistrationReceipts(
  query: UserReceiptsQuery = {}
): Promise<{ receipts: RegistrationReceiptItem[]; stats: ReceiptsStatsSummary }> {
  const allReceipts: RegistrationReceiptItem[] = [];

  // 1. Member Registration Receipts (from players-store)
  try {
    const players = await getPlayers();
    for (const p of players) {
      if (isUserMatch(p, query)) {
        const rawP = p as any;
        const slipId = rawP.registrationSlipId || `REC-REG-${p.id}`;
        allReceipts.push({
          id: `mbr-${p.id}`,
          receiptNumber: slipId,
          category: "member_registration",
          categoryLabel: `${p.memberType || "Member"} Registration`,
          title: `Official ${p.memberType || "Member"} Registration Receipt`,
          description: `Official digital registration receipt & ledger record for ${p.name} (${p.id}).`,
          recipientName: p.name,
          memberId: p.id,
          email: p.email,
          phone: p.phone,
          state: p.state,
          districtOrCity: p.city,
          academyOrClub: p.club,
          discipline: p.discipline || "Kalawar Martial Arts",
          issuedAt: p.registeredOn || rawP.createdAt || "2026-01-01",
          status: "Confirmed",
          metadata: {
            beltRank: p.beltRank,
            level: p.level,
            designation: rawP.designation || `${p.memberType || "Registered"} Member`,
            registrationSlipId: slipId,
            sourceStore: "players-store",
          },
          qrVerificationUrl: `/id-cards/${encodeURIComponent(p.id)}`,
          rawPlayer: p,
        });
      }
    }
  } catch (err) {
    console.error("ReceiptsStore: Failed to fetch player receipts:", err);
  }

  // 2. Kyu Belt Examination Registration Slips (from belt-exams-store)
  try {
    const exams = await getBeltExams();
    for (const exam of exams) {
      if (exam.candidates && Array.isArray(exam.candidates)) {
        for (const c of exam.candidates) {
          const candRecord = {
            id: c.id,
            athleteId: c.athleteId,
            name: c.athleteName,
            email: c.email,
            phone: c.phone,
          };
          if (isUserMatch(candRecord, query)) {
            const slipNo = c.registrationSlipId || `KAC-BELT-REG-${c.id}`;
            allReceipts.push({
              id: `belt-${c.id}`,
              receiptNumber: slipNo,
              category: "belt_exam",
              categoryLabel: "Belt Exam Slip",
              title: `${c.targetBelt} Examination Candidate Registration Slip`,
              description: `Official candidate registration slip for belt examination from ${c.currentBelt} to ${c.targetBelt}.`,
              recipientName: c.athleteName,
              memberId: c.athleteId || c.id,
              email: c.email,
              phone: c.phone,
              state: c.state,
              academyOrClub: c.clubName,
              discipline: "Martial Arts Belt Grading",
              issuedAt: c.registeredOn || exam.examDate || "2026-02-01",
              status: "Confirmed",
              metadata: {
                targetRank: c.targetBelt,
                currentRank: c.currentBelt,
                chiefExaminer: c.chiefExaminer || exam.chiefExaminer,
                examVenue: c.examVenue || exam.venueName,
                sessionTitle: exam.title,
                registrationSlipId: slipNo,
                sourceStore: "belt-exams",
              },
              qrVerificationUrl: `/belt-exams`,
              rawBeltCandidate: {
                candidate: c,
                exam: exam,
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("ReceiptsStore: Failed to fetch belt exam receipts:", err);
  }

  // 3. Black Belt / Dan Grading Registration Confirmation Slips (from dan-grading-store)
  try {
    const danApps = await getAllDanApplications();
    for (const d of danApps) {
      const danRecord = {
        id: d.id,
        athleteId: d.athleteId,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
      };
      if (isUserMatch(danRecord, query)) {
        allReceipts.push({
          id: `dan-${d.id}`,
          receiptNumber: d.id,
          category: "black_belt_dan",
          categoryLabel: "Black Belt Exam Slip",
          title: `Dan Black Belt Registration Confirmation Slip`,
          description: `Official candidate registration confirmation slip for ${d.appliedDanTitle || "Dan Black Belt"} examination.`,
          recipientName: d.fullName,
          memberId: d.athleteId || d.id,
          email: d.email,
          phone: d.phone,
          state: d.state,
          academyOrClub: d.academyName,
          discipline: "National Black Belt Council",
          issuedAt: d.appliedDate || "2026-01-10",
          status: "Confirmed",
          metadata: {
            targetRank: d.appliedDanTitle,
            currentRank: d.currentBeltTitle,
            instructorName: d.instructorName,
            examVenue: d.examVenue,
            registrationSlipId: d.id,
            sourceStore: "dan-grading",
          },
          qrVerificationUrl: `/dan-grading?track=${encodeURIComponent(d.id)}&tab=tracker`,
          rawDanApp: d,
        });
      }
    }
  } catch (err) {
    console.error("ReceiptsStore: Failed to fetch dan receipts:", err);
  }

  // 4. Championship Registration Receipts & Competitor Passes (from ChampionshipApplicationModel)
  try {
    await connectToDatabase();
    const champApps = await ChampionshipApplicationModel.find({}).sort({ createdAt: -1 }).lean();
    for (const app of champApps) {
      const rawApp = app as any;
      const champRecord = {
        id: app.id,
        athleteId: app.athleteId,
        name: app.applicantName,
        email: app.email,
        phone: app.phone,
      };
      if (isUserMatch(champRecord, query)) {
        const appIdStr = app.id || rawApp.applicationId || "CHAMP-APP";
        const receiptNo = app.bibNumber ? `BIB-${app.bibNumber}` : appIdStr;
        allReceipts.push({
          id: `champ-${appIdStr}`,
          receiptNumber: receiptNo,
          category: "championship",
          categoryLabel: "Championship Receipt",
          title: `Championship Registration Receipt & Competitor Pass`,
          description: `Official competitor entry pass & registration receipt for ${app.eventTitle || "National Championship"}.`,
          recipientName: app.applicantName,
          memberId: app.athleteId || appIdStr,
          email: app.email,
          phone: app.phone,
          state: app.state,
          districtOrCity: app.city || rawApp.eventCity,
          academyOrClub: app.clubName,
          discipline: app.discipline,
          issuedAt: rawApp.createdAt ? new Date(rawApp.createdAt).toISOString() : "2026-01-15",
          status: app.status === "Approved" ? "Approved" : "Confirmed",
          metadata: {
            eventName: app.eventTitle,
            eventVenue: app.eventVenue || app.eventLocation,
            bibNumber: app.bibNumber,
            ageDivision: app.ageDivision,
            weightCategory: app.weightCategory,
            beltRank: app.beltRank,
            registrationSlipId: appIdStr,
            sourceStore: "championship-applications",
          },
          qrVerificationUrl: `/id-cards/championship/${encodeURIComponent(appIdStr)}`,
          rawChampApp: app as any,
        });
      }
    }
  } catch (err) {
    // Non-fatal if DB not connected
  }

  // 5. Referee Registration Slips & License Receipts (from referees-store)
  try {
    const referees = await getReferees();
    for (const r of referees) {
      if (isUserMatch(r, query)) {
        const rawR = r as any;
        const refSlipNo = r.licenseNumber || `KAC-REF-REG-${r.id}`;
        allReceipts.push({
          id: `ref-${r.id}`,
          receiptNumber: refSlipNo,
          category: "referee",
          categoryLabel: "Referee Registration Slip",
          title: "Official Referee Registration Slip & License Receipt",
          description: `Official registration confirmation & technical license slip for ${r.name} (${r.level || "Licensed Referee"}).`,
          recipientName: r.name,
          memberId: r.kalawarId || r.id,
          email: r.email,
          phone: r.phone,
          state: r.state,
          districtOrCity: r.district,
          academyOrClub: r.academy,
          discipline: r.discipline || "Kalawar Martial Arts",
          issuedAt: r.licenseIssuedDate || r.createdAt || "2026-01-01",
          status: "Confirmed",
          metadata: {
            level: r.level,
            currentRank: r.currentRank,
            designation: "Licensed Referee",
            registrationSlipId: refSlipNo,
            sourceStore: "referees-store",
          },
          qrVerificationUrl: `/referees?verify=${encodeURIComponent(r.licenseNumber || r.id)}`,
          rawReferee: r,
        });
      }
    }
  } catch (err) {
    console.error("ReceiptsStore: Failed to fetch referee receipts:", err);
  }

  // Deduplicate by receiptNumber if any duplicate is present
  const uniqueMap = new Map<string, RegistrationReceiptItem>();
  for (const item of allReceipts) {
    if (!uniqueMap.has(item.receiptNumber)) {
      uniqueMap.set(item.receiptNumber, item);
    }
  }
  let resultList = Array.from(uniqueMap.values());

  // Apply Category Filter
  if (query.category && query.category !== "all") {
    resultList = resultList.filter((r) => r.category === query.category);
  }

  // Apply Status Filter
  if (query.status && query.status !== "all") {
    const sLower = query.status.toLowerCase();
    resultList = resultList.filter((r) => r.status.toLowerCase() === sLower);
  }

  // Apply Year Filter
  if (query.year && query.year !== "all") {
    resultList = resultList.filter((r) => r.issuedAt.includes(query.year!));
  }

  // Apply Search Query
  if (query.search && query.search.trim()) {
    const qLower = query.search.trim().toLowerCase();
    resultList = resultList.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(qLower) ||
        r.title.toLowerCase().includes(qLower) ||
        r.recipientName.toLowerCase().includes(qLower) ||
        (r.memberId && r.memberId.toLowerCase().includes(qLower)) ||
        (r.discipline && r.discipline.toLowerCase().includes(qLower)) ||
        (r.metadata?.eventName && r.metadata.eventName.toLowerCase().includes(qLower)) ||
        (r.metadata?.bibNumber && r.metadata.bibNumber.toLowerCase().includes(qLower)) ||
        (r.categoryLabel && r.categoryLabel.toLowerCase().includes(qLower))
    );
  }

  // Sort newest first
  resultList.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  // Compute stats across all user receipts (before category filter)
  const allUserReceipts = Array.from(uniqueMap.values());
  const stats: ReceiptsStatsSummary = {
    totalCount: allUserReceipts.length,
    memberRegistrationCount: allUserReceipts.filter((r) => r.category === "member_registration").length,
    beltExamCount: allUserReceipts.filter((r) => r.category === "belt_exam").length,
    blackBeltDanCount: allUserReceipts.filter((r) => r.category === "black_belt_dan").length,
    championshipCount: allUserReceipts.filter((r) => r.category === "championship").length,
    refereeCount: allUserReceipts.filter((r) => r.category === "referee").length,
  };

  return {
    receipts: resultList,
    stats,
  };
}
