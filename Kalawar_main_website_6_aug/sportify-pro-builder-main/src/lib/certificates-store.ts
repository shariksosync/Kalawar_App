import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { CertificateModel } from "@/models/Certificate";
import { PlayerModel } from "@/models/Player";
import { DanCertificateModel, DanApplicationModel } from "@/models/DanGrading";
import { BeltExamModel } from "@/models/BeltExam";
import { ChampionshipCertificateModel } from "@/models/ChampionshipCertificate";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import { getAllDanApplications, getDanCertificateByNumber } from "./dan-grading-store";
import { getBeltExams, getBeltCertificateByNumber } from "./belt-exams-store";
import { getPlayers } from "./players-store";
import { players } from "@/data/people";
import { withRedisCache, invalidateCertificateCache } from "./redis";
import type {
  CertificateItem,
  CreateCertificateInput,
  CertificateStatus,
} from "@/types/certificate";

export { type CertificateItem, type CreateCertificateInput } from "@/types/certificate";

const DEFAULT_CERTIFICATES: CertificateItem[] = [
  {
    id: "CERT-2026-001",
    number: "KAC-CERT-2026-1001",
    holder: "Aarav Mehra",
    kalawarId: "KSM-PL-2026-7251",
    email: "aarav.mehra@example.com",
    state: "Maharashtra",
    district: "Pune",
    academy: "Shogun Martial Arts Academy",
    type: "Championship / Achievement Certificate",
    event: "All-India National KALAWAR Championship 2026",
    position: "1st Place - Gold Medal (Senior Kumite -65kg)",
    rankOrBelt: "1st Dan Black Belt",
    issued: "2026-01-20",
    validUntil: "Perpetual",
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-01-20T10:00:00.000Z",
        performedBy: "National Technical Committee",
        notes: "Official championship achievement validated.",
      },
    ],
  },
  {
    id: "CERT-2026-002",
    number: "KAC-CERT-2026-1002",
    holder: "Rohan V. Shinde",
    kalawarId: "KAC-DAN-2026-1001",
    email: "rohan.shinde@example.com",
    state: "Maharashtra",
    district: "Mumbai",
    academy: "Tiger Claw Martial Dojo",
    type: "Black Belt / Dan Certificate",
    event: "National Dan Examination & Thesis Defense",
    position: "Conferred 3rd Dan Black Belt",
    rankOrBelt: "3rd Dan Black Belt",
    issued: "2026-02-14",
    validUntil: "Perpetual",
    issuedBy: "Mr. Santosh Kasbe (Head, Dan Grading Board)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-02-14T11:30:00.000Z",
        performedBy: "Supreme Dan Examination Board",
        notes: "Passed Kata & Bunkai Thesis with Grade A.",
      },
    ],
  },
  {
    id: "CERT-2026-003",
    number: "KAC-CERT-2026-1003",
    holder: "Pooja K. Sharma",
    kalawarId: "KAC-ACT-REF-2026-003",
    email: "pooja.sharma@example.com",
    state: "Delhi",
    district: "South Delhi",
    academy: "Delhi Combat Club",
    type: "Referee / Technical Official Certificate",
    event: "National Referee Accreditation & Clinic",
    position: "Level 2 – State Referee",
    rankOrBelt: "3rd Dan Black Belt",
    issued: "2026-02-28",
    validUntil: "2028-02-28",
    issuedBy: "Mr. Santosh Kasbe (Head, Technical Committee)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-02-28T14:00:00.000Z",
        performedBy: "Technical Officials Board",
        notes: "Theory 92/100, Practical 88/100 passed.",
      },
    ],
  },
  {
    id: "CERT-2026-004",
    number: "KAC-CERT-2026-1004",
    holder: "Vikramaditya Patil",
    kalawarId: "CAND-2026-001",
    email: "vikram.patil@example.com",
    state: "Maharashtra",
    district: "Satara",
    academy: "Warrior Sports Academy",
    type: "Belt Examination Certificate",
    event: "Quarterly Belt Promotion Grading 2026",
    position: "Passed with Distinction",
    rankOrBelt: "Brown Belt (1st Kyu)",
    issued: "2026-03-01",
    validUntil: "Perpetual",
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-03-01T09:00:00.000Z",
        performedBy: "Examination Committee",
        notes: "Promoted from Blue Belt to Brown Belt.",
      },
    ],
  },
  {
    id: "CERT-2026-005",
    number: "KAC-CERT-2026-1005",
    holder: "Master Deepak Jadhav",
    kalawarId: "KSM-CO-2026-5510",
    email: "deepak.jadhav@example.com",
    state: "Karnataka",
    district: "Bengaluru",
    academy: "Zenith Martial Arts Center",
    type: "Coach Certification Certificate",
    event: "National Elite Coaches Certification Camp",
    position: "Accredited Senior National Coach",
    rankOrBelt: "5th Dan Black Belt",
    issued: "2026-01-10",
    validUntil: "2028-01-10",
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-01-10T12:00:00.000Z",
        performedBy: "National Coaching Committee",
        notes: "Level-A Coach accreditation renewed.",
      },
    ],
  },
  {
    id: "CERT-2026-006",
    number: "KAC-CERT-2026-1006",
    holder: "Ananya Deshmukh",
    kalawarId: "KSM-PL-2026-9042",
    email: "ananya.deshmukh@example.com",
    state: "Maharashtra",
    district: "Kolhapur",
    academy: "Shivaji Martial Arts Club",
    type: "Participation Certificate",
    event: "Maharashtra State KALAWAR Championship 2026",
    position: "Official Participant (Junior Girls)",
    rankOrBelt: "Green Belt",
    issued: "2026-02-22",
    validUntil: "Perpetual",
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    status: "Valid",
    auditHistory: [
      {
        action: "Issued",
        timestamp: "2026-02-22T17:00:00.000Z",
        performedBy: "Organizing Committee",
        notes: "Participation certificate logged.",
      },
    ],
  },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let cachedCertificates: CertificateItem[] = [...DEFAULT_CERTIFICATES];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "certificates.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "certificates.json");

  try {
    await fs.access(primaryPath);
    return primaryPath;
  } catch {
    try {
      await fs.access(nestedPath);
      return nestedPath;
    } catch {
      try {
        await fs.mkdir(path.dirname(primaryPath), { recursive: true });
        await fs.writeFile(primaryPath, JSON.stringify(DEFAULT_CERTIFICATES, null, 2), "utf-8");
      } catch (writeErr) {
        // Read-only filesystem in serverless environments (e.g., Vercel / AWS Lambda)
        console.warn("Notice: File system is read-only, using in-memory certificate cache fallback.");
      }
      return primaryPath;
    }
  }
}

async function getFileCertificates(): Promise<CertificateItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedCertificates;
    const parsed = JSON.parse(raw) as CertificateItem[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedCertificates = parsed;
      return parsed;
    }
    return cachedCertificates;
  } catch {
    return cachedCertificates;
  }
}

async function saveFileCertificates(items: CertificateItem[]): Promise<void> {
  cachedCertificates = items;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(items, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(items, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not save to certificates.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

async function generateNextCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const regex = /^CERT-\d{4}-(\d+)$/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await CertificateModel.find({ id: { $regex: /^CERT-/i } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileCertificates();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextSeq = String(highestNum + 1).padStart(3, "0");
  return `CERT-${year}-${nextSeq}`;
}

export async function generateUniqueCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let candidate = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 50) {
    attempts++;
    const rand = Math.floor(1000 + Math.random() * 9000);
    candidate = `KAC-CERT-${year}-${rand}`;
    const existing = await getCertificateByNumberOrId(candidate);
    if (!existing) {
      isUnique = true;
    }
  }

  return candidate || `KAC-CERT-${year}-${Date.now().toString().slice(-4)}`;
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KAC-CERT-${year}-${rand}`;
}

async function enrichCertificateWithCoachPhoto(d: any): Promise<CertificateItem> {
  let photo = d.photo || d.image;
  let dob = d.dob;
  let discipline = d.discipline;
  let qualification = d.qualification;
  let danBelt = d.danBelt || d.danRank || d.specialization || d.rankOrBelt;
  const venue = d.venue;
  const examDate = d.examDate;
  let club = d.club || d.academy;
  let headCoachName = d.headCoachName;
  let presidentName = d.presidentName;
  let secretaryName = d.secretaryName;

  if (d.kalawarId || d.holder || d.number) {
    try {
      await connectToDatabase();
      const pDoc: any = await PlayerModel.findOne({
        $or: [
          ...(d.kalawarId ? [{ id: d.kalawarId }, { memberId: d.kalawarId }] : []),
          ...(d.number ? [{ affiliationCertificateId: d.number }] : []),
          ...(d.affiliationCertificateId ? [{ affiliationCertificateId: d.affiliationCertificateId }] : []),
          ...(d.holder ? [{ name: { $regex: new RegExp(`^${escapeRegex(d.holder)}$`, "i") } }] : []),
        ],
      }).lean();
      if (pDoc) {
        if (!photo) photo = pDoc.image || pDoc.photo;
        if (!dob && pDoc.dob) dob = pDoc.dob;
        if (!discipline && pDoc.discipline) discipline = pDoc.discipline;
        if (!qualification && pDoc.qualification) qualification = pDoc.qualification;
        if (!danBelt && pDoc.specialization) danBelt = pDoc.specialization;
        if (!club && pDoc.club) club = pDoc.club;
        if (!headCoachName) headCoachName = pDoc.headCoachName || pDoc.coachName;
        if (!presidentName) presidentName = pDoc.presidentName || pDoc.president;
        if (!secretaryName) secretaryName = pDoc.secretaryName || pDoc.secretary;
      }
    } catch {}

    if (!photo || !presidentName || !secretaryName) {
      const staticP = players.find(
        (p) =>
          (d.kalawarId && (p.id === d.kalawarId || (p as any).memberId === d.kalawarId)) ||
          (d.number && (p as any).affiliationCertificateId === d.number) ||
          p.name.toLowerCase() === (d.holder || "").toLowerCase()
      );
      if (staticP) {
        if (!photo) photo = staticP.image;
        if (!dob && staticP.dob) dob = staticP.dob;
        if (!discipline && staticP.discipline) discipline = staticP.discipline;
        if (!qualification && staticP.qualification) qualification = staticP.qualification;
        if (!danBelt && (staticP as any).specialization) danBelt = (staticP as any).specialization;
        if (!club && staticP.club) club = staticP.club;
        if (!headCoachName) headCoachName = (staticP as any).headCoachName || (staticP as any).coachName;
        if (!presidentName) presidentName = (staticP as any).presidentName || (staticP as any).president;
        if (!secretaryName) secretaryName = (staticP as any).secretaryName || (staticP as any).secretary;
      }
    }
  }

  return {
    id: d.id || (d._id ? d._id.toString() : d.number),
    number: d.number,
    holder: d.holder,
    kalawarId: d.kalawarId,
    email: d.email,
    phone: d.phone,
    state: d.state,
    district: d.district,
    academy: d.academy || club,
    club: club || d.academy,
    type: d.type || "Championship / Achievement Certificate",
    event: d.event,
    position: d.position || "Distinction",
    rankOrBelt: d.rankOrBelt || danBelt,
    qualification: qualification || d.qualification,
    discipline: discipline || d.discipline || "Kalawar Martial Arts",
    danRank: danBelt || d.danRank,
    beltRank: d.beltRank || danBelt || d.rankOrBelt,
    dob: dob || d.dob,
    examDate: examDate || d.examDate,
    venue: venue || d.venue,
    image: photo || d.image || d.photo,
    photo: photo || d.photo || d.image,
    issued: d.issued,
    validUntil: d.validUntil || "Perpetual",
    issuedBy: d.issuedBy || "Mr. Santosh Kasbe (Founder & President)",
    certificateUrl: d.certificateUrl,
    status: (d.status as CertificateStatus) || "Valid",
    auditHistory: d.auditHistory || [],
    levelOfAffiliation: d.levelOfAffiliation,
    levelsOfAffiliation: d.levelsOfAffiliation || [],
    clubCategory: d.clubCategory,
    headCoachName: headCoachName || d.headCoachName,
    presidentName: presidentName || d.presidentName || undefined,
    secretaryName: secretaryName || d.secretaryName || undefined,
    affiliationCertificateId: d.affiliationCertificateId || d.number,
    isAffiliationCert:
      d.isAffiliationCert !== undefined
        ? d.isAffiliationCert
        : Boolean(d.type === "Club Affiliation Certificate" || (d.number && d.number.startsWith("KAC-AFF"))),
  };
}

export function convertDanToCertificateItem(certOrApp: any): CertificateItem {
  const certNumber =
    certOrApp.certificateNumber ||
    (certOrApp.id?.startsWith("KAC-DAN") ? certOrApp.id : `KAC-DAN-2026-${certOrApp.id?.split("-").pop() || "1001"}`);
  const danRankNum = certOrApp.danRank || certOrApp.appliedDanGrade || 1;
  const rankTitle =
    certOrApp.danRankTitle ||
    certOrApp.appliedDanTitle ||
    `${danRankNum} Dan Black Belt`;
  const issued =
    certOrApp.issueDate ||
    certOrApp.certificateIssuedDate ||
    certOrApp.appliedDate ||
    new Date().toISOString().split("T")[0];

  return {
    id: certNumber,
    number: certNumber,
    holder: certOrApp.candidateName || certOrApp.fullName || "Black Belt Athlete",
    kalawarId: certOrApp.athleteId,
    email: certOrApp.email,
    phone: certOrApp.phone,
    state: certOrApp.state,
    district: certOrApp.district,
    academy: certOrApp.academyName,
    club: certOrApp.academyName,
    type: "Black Belt / Dan Certificate",
    event: certOrApp.discipline || "National Dan Examination & Black Belt Accreditation",
    position: `Conferred ${rankTitle}`,
    rankOrBelt: rankTitle,
    danRank: rankTitle,
    beltRank: rankTitle,
    dob: certOrApp.dob,
    examDate: certOrApp.examDate,
    venue: certOrApp.examVenue || "National Dan Grading Arena",
    image: certOrApp.photoUrl || certOrApp.athletePhoto,
    photo: certOrApp.photoUrl || certOrApp.athletePhoto,
    issued,
    validUntil: "Perpetual",
    issuedBy:
      certOrApp.chiefExaminer ||
      certOrApp.presidentName ||
      "Mr. Santosh Kasbe (Head, Dan Grading Board)",
    certificateUrl: `/certificates/dan/${certNumber}`,
    status: "Valid",
    isDanCert: true,
    danRankNumber: danRankNum,
    japaneseTitle: certOrApp.japaneseTitle,
    koreanTitle: certOrApp.koreanTitle,
    grade: certOrApp.grade || certOrApp.assessment?.grade || "Distinction",
    score: certOrApp.score || certOrApp.assessment?.totalScore,
    presidentName: certOrApp.presidentName || "MR. SANTOSH KASBE",
    presidentRole:
      certOrApp.presidentRole || "Founder & President – India | Head – Technical Committee, India",
    chiefExaminerRank:
      certOrApp.chiefExaminerRank || "Founder & President – India | Head – Technical Committee, India",
    auditHistory: [
      {
        action: "Issued",
        timestamp: new Date().toISOString(),
        performedBy: "Supreme Dan Examination Board",
        notes: `Black Belt Dan Diploma conferred.`,
      },
    ],
  };
}

export function convertBeltCandidateToCertificateItem(cand: any, exam?: any): CertificateItem {
  const certNumber =
    cand.certificateNumber ||
    (cand.id?.startsWith("KAC-BELT") ? cand.id : `KAC-BELT-${new Date().getFullYear()}-${cand.id?.split("-").pop() || "1001"}`);
  const beltRank = cand.targetBelt || cand.beltRank || cand.belt || "Color Belt";
  const grade = cand.assessment?.grade || cand.grade || "Pass";
  const score = cand.assessment?.totalScore || cand.score;
  const issued =
    cand.evaluatedAt ||
    cand.resultDeclaredAt ||
    cand.issuedDate ||
    cand.promotedDate ||
    exam?.examDate ||
    new Date().toISOString().split("T")[0];

  return {
    id: certNumber,
    number: certNumber,
    holder: cand.athleteName || cand.candidateName || "Martial Arts Athlete",
    kalawarId: cand.athleteId,
    email: cand.email,
    phone: cand.phone,
    state: cand.state,
    academy: cand.academyName || cand.clubName,
    club: cand.clubName || cand.academyName,
    type: "Belt Examination Certificate",
    event: exam?.title || cand.examTitle || "National Belt Grading Examination",
    position: `Passed ${beltRank} Grading (${grade})`,
    rankOrBelt: beltRank,
    beltRank: beltRank,
    dob: cand.dob,
    examDate: cand.examDate || exam?.examDate || issued,
    venue: cand.examVenue || exam?.venueName || "National Combat Academy Arena",
    image: cand.athleteImage || cand.photo,
    photo: cand.athleteImage || cand.photo,
    issued,
    validUntil: "Perpetual",
    issuedBy:
      cand.evaluatedBy ||
      cand.chiefExaminer ||
      exam?.chiefExaminer ||
      "Grandmaster Rajesh Sharma (8th Dan)",
    certificateUrl: `/certificates/belt/${certNumber}`,
    status: "Valid",
    isBeltCert: true,
    grade,
    score,
    templateFile: cand.templateFile,
    auditHistory: [
      {
        action: "Issued",
        timestamp: new Date().toISOString(),
        performedBy: "National Belt Examination Committee",
        notes: `Promoted to ${beltRank}.`,
      },
    ],
  };
}

export function convertChampionshipToCertificateItem(certOrApp: any): CertificateItem {
  const certNumber =
    certOrApp.certificateNumber ||
    (certOrApp.id?.startsWith("KAL-") ? certOrApp.id : `KAL-${new Date().getFullYear()}-${certOrApp.id?.split("-").pop() || "0001"}`);

  const level = certOrApp.level || (certOrApp.result as any)?.level || "District";
  const awardType = certOrApp.awardType || certOrApp.result?.place || "Participant";
  const issued =
    certOrApp.issueDate ||
    certOrApp.certificateIssuedAt ||
    certOrApp.createdAt ||
    new Date().toISOString().split("T")[0];

  const isDistrict = String(level).toLowerCase() === "district";
  const rawVenue = certOrApp.eventLocation || certOrApp.eventVenue;
  const districtVenue = certOrApp.city || certOrApp.district || certOrApp.eventCity || certOrApp.state || "District Sports Complex";
  const venue = isDistrict
    ? (rawVenue && !rawVenue.toLowerCase().includes("national") ? rawVenue : districtVenue)
    : (rawVenue || "National Tournament Arena");

  return {
    id: certNumber,
    number: certNumber,
    holder: certOrApp.candidateName || certOrApp.applicantName || certOrApp.athleteName || "Competitor",
    kalawarId: certOrApp.athleteId || certOrApp.applicationId || certOrApp.id,
    email: certOrApp.email,
    phone: certOrApp.phone,
    state: certOrApp.state,
    district: certOrApp.city || certOrApp.district,
    academy: certOrApp.clubName || certOrApp.club || "Independent",
    club: certOrApp.clubName || certOrApp.club || "Independent",
    type: "Championship / Achievement Certificate",
    event: certOrApp.championshipTitle || certOrApp.eventTitle || certOrApp.eventName || "Championship",
    position: `${level} Championship ${awardType}`,
    rankOrBelt: certOrApp.beltRank || "Martial Arts",
    beltRank: certOrApp.beltRank || "Martial Arts",
    discipline: certOrApp.discipline || "Kalawar Martial Arts",
    category: certOrApp.category || "",
    ageDivision: certOrApp.ageDivision || certOrApp.ageGroup || "Junior (Under 14)",
    weightCategory: certOrApp.weightCategory || "-50.0 kg",
    dob: certOrApp.dob,
    examDate: certOrApp.eventDate || issued,
    venue,
    image: certOrApp.photo || certOrApp.athletePhoto,
    photo: certOrApp.photo || certOrApp.athletePhoto,
    issued,
    validUntil: "Perpetual",
    issuedBy: certOrApp.issuedBy || "KALAWAR Sports & Martial Arts Federation of India",
    certificateUrl: `/certificates/championship/${encodeURIComponent(certNumber)}`,
    status: "Valid",
    isChampionshipCert: true,
    level,
    awardType,
    bibNumber: certOrApp.bibNumber,
    notes: certOrApp.notes || "",
    auditHistory: [
      {
        action: "Issued",
        timestamp: new Date().toISOString(),
        performedBy: "National Championship Board",
        notes: `${level} Championship ${awardType} Diploma conferred.`,
      },
    ],
  };
}

export function convertClubToCertificateItem(club: any): CertificateItem {
  const certNumber =
    club.affiliationCertificateId ||
    club.affiliationNumber ||
    club.certificateNumber ||
    club.number ||
    (club.id && club.id.startsWith("KAC-AFF") ? club.id : "");

  const issued =
    club.validFrom ||
    club.issued ||
    club.registeredOn ||
    club.createdAt ||
    "2026-01-01";
  const validUntil = club.validUntil || "2026-12-31";

  const rawLevel = club.levelOfAffiliation || club.clubCategory || club.position || "Club Affiliation";

  return {
    id: certNumber || club.id,
    number: certNumber,
    holder: club.name || club.academyName || "Official Martial Arts Club",
    kalawarId: club.id,
    email: club.email,
    phone: club.phone || club.contactNo,
    state: club.state || "Maharashtra",
    district: club.district || club.city || "Pune",
    academy: club.name || club.academyName || "Official Martial Arts Club",
    club: club.name || club.academyName || "Official Martial Arts Club",
    type: "Club Affiliation Certificate",
    event: "National Federation Institutional Club & Dojo Accreditation",
    position: rawLevel,
    rankOrBelt: rawLevel,
    issued,
    validUntil,
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    certificateUrl: `/clubs/${encodeURIComponent(club.id || certNumber)}/certificate`,
    status: "Valid",
    isAffiliationCert: true,
    affiliationCertificateId: certNumber,
    headCoachName: club.headCoachName || club.coachName || club.presidentName,
    presidentName: club.presidentName || club.president || "",
    secretaryName: club.secretaryName || club.secretary || "",
    levelsOfAffiliation: club.levelsOfAffiliation || [rawLevel],
    levelOfAffiliation: club.levelOfAffiliation || rawLevel,
    clubCategory: club.clubCategory || rawLevel,
    auditHistory: [
      {
        action: "Issued",
        timestamp: new Date().toISOString(),
        performedBy: "National Technical Committee",
        notes: "Official institutional club affiliation verified.",
      },
    ],
  };
}

export interface GetCertificatesOptions {
  status?: string;
  holder?: string;
  number?: string;
  type?: string;
  kalawarId?: string;
  state?: string;
  includeAll?: boolean;
}

export async function getCertificates(options?: GetCertificatesOptions): Promise<CertificateItem[]> {
  const cacheKey = `cache:cert:list:${options?.status || "all"}:${options?.type || "all"}:${options?.state || "all"}:${options?.holder || "none"}:${options?.kalawarId || "none"}:${options?.number || "none"}:${options?.includeAll ? "1" : "0"}`;
  return withRedisCache(cacheKey, 300, () => fetchRawCertificates(options));
}

async function fetchRawCertificates(options?: GetCertificatesOptions): Promise<CertificateItem[]> {
  const allCertsMap = new Map<string, CertificateItem>();

  // 1. General Certificates from MongoDB or fallback
  try {
    await connectToDatabase();
    const docs = await CertificateModel.find().sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      for (const d of docs) {
        const enriched = await enrichCertificateWithCoachPhoto(d);
        if (enriched.number) {
          allCertsMap.set(enriched.number.toLowerCase(), enriched);
        }
      }
    }
  } catch (error) {
    console.warn("MongoDB access note (certificates): Falling back to persistent file storage.");
    const fileList = await getFileCertificates();
    for (const d of fileList) {
      const enriched = await enrichCertificateWithCoachPhoto(d);
      if (enriched.number) {
        allCertsMap.set(enriched.number.toLowerCase(), enriched);
      }
    }
  }

  // 2. Dan Black Belt Certificates
  try {
    await connectToDatabase();
    const danDocs = await DanCertificateModel.find().lean();
    if (danDocs && danDocs.length > 0) {
      for (const dc of danDocs) {
        const item = convertDanToCertificateItem(dc);
        if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
          allCertsMap.set(item.number.toLowerCase(), item);
        }
      }
    }

    const passedDanApps = await DanApplicationModel.find({
      $or: [
        { status: "Passed" },
        { certificateNumber: { $exists: true, $ne: "" } },
      ],
    }).lean();
    if (passedDanApps && passedDanApps.length > 0) {
      for (const app of passedDanApps) {
        if (app.certificateNumber || app.status === "Passed") {
          const item = convertDanToCertificateItem(app);
          if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
            allCertsMap.set(item.number.toLowerCase(), item);
          }
        }
      }
    }
  } catch (danErr) {
    // Fallback using getAllDanApplications
    try {
      const allApps = await getAllDanApplications();
      for (const app of allApps) {
        if (app.status === "Passed" || app.certificateNumber) {
          const item = convertDanToCertificateItem(app);
          if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
            allCertsMap.set(item.number.toLowerCase(), item);
          }
        }
      }
    } catch {}
  }

  // 3. Belt Examination Certificates
  try {
    await connectToDatabase();
    const beltExams = await BeltExamModel.find().lean();
    if (beltExams && beltExams.length > 0) {
      for (const session of beltExams) {
        for (const cand of session.candidates || []) {
          if (cand.resultStatus === "Passed" || cand.certificateNumber) {
            const item = convertBeltCandidateToCertificateItem(cand, session);
            if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
              allCertsMap.set(item.number.toLowerCase(), item);
            }
          }
        }
      }
    }
  } catch (beltErr) {
    try {
      const allExams = await getBeltExams();
      for (const session of allExams) {
        for (const cand of session.candidates || []) {
          if (cand.resultStatus === "Passed" || cand.certificateNumber) {
            const item = convertBeltCandidateToCertificateItem(cand, session);
            if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
              allCertsMap.set(item.number.toLowerCase(), item);
            }
          }
        }
      }
    } catch {}
  }

  // 4. Belt History from Player records
  try {
    const playersList = await getPlayers();
    for (const player of playersList) {
      if (player.beltHistory && Array.isArray(player.beltHistory)) {
        for (const bh of player.beltHistory) {
          if (bh.certificateNumber || bh.certificateNo) {
            const certNum = (bh.certificateNumber || bh.certificateNo) as string;
            if (!allCertsMap.has(certNum.toLowerCase())) {
              const item = convertBeltCandidateToCertificateItem({
                athleteId: player.id,
                athleteName: player.name,
                email: player.email,
                phone: player.phone,
                state: player.state,
                academyName: bh.academyName || player.club,
                clubName: player.club,
                targetBelt: bh.belt,
                grade: bh.grade || "Pass",
                score: bh.score,
                certificateNumber: certNum,
                evaluatedAt: bh.promotedDate || bh.date,
                evaluatedBy: bh.examinerName || bh.examiner,
                examTitle: bh.sessionName || "National Belt Grading Examination",
                dob: player.dob,
                athleteImage: player.image,
              });
              allCertsMap.set(certNum.toLowerCase(), item);
            }
          }
        }
      }
    }
  } catch (pErr) {}

  // 5. Championship Certificates
  try {
    await connectToDatabase();
    const champCerts = await ChampionshipCertificateModel.find().lean();
    if (champCerts && champCerts.length > 0) {
      for (const cc of champCerts) {
        const item = convertChampionshipToCertificateItem(cc);
        if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
          allCertsMap.set(item.number.toLowerCase(), item);
        }
      }
    }

    const champApps = await ChampionshipApplicationModel.find({
      certificateNumber: { $exists: true, $ne: "" },
    }).lean();
    if (champApps && champApps.length > 0) {
      for (const app of champApps) {
        const item = convertChampionshipToCertificateItem(app);
        if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
          allCertsMap.set(item.number.toLowerCase(), item);
        }
      }
    }
  } catch (champErr) {}

  // 6. Club Affiliation Certificates from Player/Club collection (ONLY Issued Certificates)
  try {
    const playersList = await getPlayers();
    for (const p of playersList) {
      // Strictly require an officially assigned affiliation certificate number
      const certId =
        (p.affiliationCertificateId && p.affiliationCertificateId.trim()) ||
        ((p as any).affiliationNumber && (p as any).affiliationNumber.trim()) ||
        ((p as any).certificateNumber && (p as any).certificateNumber.trim()) ||
        (p.id && p.id.startsWith("KAC-AFF") ? p.id : "");

      if (certId) {
        const item = convertClubToCertificateItem(p);
        if (item.number && !allCertsMap.has(item.number.toLowerCase())) {
          allCertsMap.set(item.number.toLowerCase(), item);
        }
        if (item.id && !allCertsMap.has(item.id.toLowerCase())) {
          allCertsMap.set(item.id.toLowerCase(), item);
        }
      }
    }
  } catch (clubErr) {}

  let allList = Array.from(allCertsMap.values());

  // Apply filters
  if (!options?.includeAll && !options?.status) {
    allList = allList.filter((c) => c.status === "Valid" || c.status === "Issued");
  } else if (options?.status && options.status !== "All") {
    allList = allList.filter((c) => c.status === options.status);
  }

  if (options?.type && options.type !== "All") {
    const qType = options.type.toLowerCase();
    allList = allList.filter((c) => (c.type || "").toLowerCase().includes(qType));
  }

  if (options?.state && options.state !== "All") {
    const qState = options.state.toLowerCase();
    allList = allList.filter((c) => (c.state || "").toLowerCase() === qState);
  }

  if (options?.holder) {
    const qHolder = options.holder.toLowerCase();
    allList = allList.filter((c) => (c.holder || "").toLowerCase().includes(qHolder));
  }

  if (options?.kalawarId) {
    const qId = options.kalawarId.toLowerCase();
    allList = allList.filter((c) => (c.kalawarId || "").toLowerCase() === qId);
  }

  if (options?.number) {
    const qNum = options.number.trim().toLowerCase();
    allList = allList.filter((c) => (c.number || "").toLowerCase() === qNum);
  }

  // Sort newest first
  return allList.sort((a, b) => {
    const dateA = new Date(a.issued || "").getTime() || 0;
    const dateB = new Date(b.issued || "").getTime() || 0;
    return dateB - dateA;
  });
}

export async function getCertificateByNumberOrId(identifier: string): Promise<CertificateItem | null> {
  if (!identifier) return null;
  const clean = decodeURIComponent(identifier).trim();
  return withRedisCache(`cache:cert:lookup:${clean.toLowerCase()}`, 1800, () => fetchRawCertificateByNumberOrId(clean));
}

async function fetchRawCertificateByNumberOrId(clean: string): Promise<CertificateItem | null> {
  const escaped = escapeRegex(clean);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(clean);

  // 1. Direct CertificateModel check
  try {
    await connectToDatabase();
    const d: any = await CertificateModel.findOne({
      $or: [
        { number: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { kalawarId: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ...(isMongoId ? [{ _id: clean }] : []),
      ],
    }).lean();

    if (d) {
      return await enrichCertificateWithCoachPhoto(d);
    }
  } catch (error) {
    console.warn("MongoDB findOne note (certificate):", error instanceof Error ? error.message : "");
  }

  // 2. Dan Certificate check
  try {
    const danCert = await getDanCertificateByNumber(clean);
    if (danCert) {
      return convertDanToCertificateItem(danCert);
    }
  } catch (danErr) {}

  // 3. Belt Certificate check
  try {
    const beltCert = await getBeltCertificateByNumber(clean);
    if (beltCert) {
      return convertBeltCandidateToCertificateItem(beltCert);
    }
  } catch (beltErr) {}

  // 4. Championship Certificate check
  try {
    await connectToDatabase();
    const champCert = await ChampionshipCertificateModel.findOne({
      $or: [
        { certificateNumber: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { athleteId: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ...(isMongoId ? [{ _id: clean }] : []),
      ],
    }).lean();
    if (champCert) {
      return convertChampionshipToCertificateItem(champCert);
    }

    const champApp = await ChampionshipApplicationModel.findOne({
      $or: [
        { certificateNumber: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { athleteId: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ...(isMongoId ? [{ _id: clean }] : []),
      ],
    }).lean();
    if (champApp && champApp.certificateNumber) {
      return convertChampionshipToCertificateItem(champApp);
    }
  } catch (champErr) {}

  // 5. Club Affiliation Certificate check (via Player/Club Store)
  try {
    const playersList = await getPlayers();
    const clubMatch = playersList.find(
      (p) =>
        ((p.affiliationCertificateId && p.affiliationCertificateId.toLowerCase() === clean.toLowerCase()) ||
          ((p as any).affiliationNumber && (p as any).affiliationNumber.toLowerCase() === clean.toLowerCase()) ||
          ((p as any).certificateNumber && (p as any).certificateNumber.toLowerCase() === clean.toLowerCase()) ||
          (p.id && p.id.toLowerCase() === clean.toLowerCase() && (p.affiliationCertificateId || (p as any).affiliationNumber || (p as any).certificateNumber)))
    );
    if (clubMatch) {
      return convertClubToCertificateItem(clubMatch);
    }
  } catch (clubErr) {}

  // 6. File storage check
  const fileList = await getFileCertificates();
  const matched = fileList.find(
    (c) =>
      (c.number && c.number.toLowerCase() === clean.toLowerCase()) ||
      (c.id && c.id.toLowerCase() === clean.toLowerCase()) ||
      (c.kalawarId && c.kalawarId.toLowerCase() === clean.toLowerCase())
  );
  if (matched) {
    return await enrichCertificateWithCoachPhoto(matched);
  }

  return null;
}

export async function createCertificate(input: CreateCertificateInput): Promise<CertificateItem> {
  if (!input.holder || !input.holder.trim()) {
    throw new Error("Certificate holder name is required");
  }
  if (!input.event || !input.event.trim()) {
    throw new Error("Event or competition title is required");
  }

  const id = input.id?.trim() || (await generateNextCertificateId());
  let number = input.number?.trim().toUpperCase();
  if (!number || number.includes("AUTO") || number === "" || number.toLowerCase() === "undefined") {
    number = await generateUniqueCertificateNumber();
  }

  const type = input.type?.trim() || "Championship / Achievement Certificate";
  const position = input.position?.trim() || "Distinction";
  const rankOrBelt = input.rankOrBelt?.trim();
  const issued = input.issued?.trim() || new Date().toISOString().split("T")[0];
  const validUntil = input.validUntil?.trim() || "Perpetual";
  const status: CertificateStatus = (input.status as CertificateStatus) || "Valid";
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const state = input.state?.trim();
  const district = input.district?.trim();
  const academy = input.academy?.trim();
  const club = input.club?.trim();
  const kalawarId = input.kalawarId?.trim();
  const qualification = input.qualification?.trim();
  const discipline = input.discipline?.trim();
  const danRank = input.danRank?.trim();
  const beltRank = input.beltRank?.trim();
  const dob = input.dob?.trim();
  const examDate = input.examDate?.trim();
  const venue = input.venue?.trim();
  const image = input.image?.trim() || input.photo?.trim();
  const photo = input.photo?.trim() || input.image?.trim();
  const issuedBy = input.issuedBy?.trim() || "Mr. Santosh Kasbe (Founder & President)";
  const certificateUrl = input.certificateUrl?.trim();

  const auditHistory = [
    {
      action: "Created",
      timestamp: new Date().toISOString(),
      performedBy: "National Technical Committee",
      notes: input.notes || "Certificate created and registered in database.",
    },
  ];

  const certData: CertificateItem = {
    id,
    number,
    holder: input.holder.trim(),
    kalawarId: kalawarId || undefined,
    email: email || undefined,
    phone: phone || undefined,
    state: state || undefined,
    district: district || undefined,
    academy: academy || club || undefined,
    club: club || academy || undefined,
    type,
    event: input.event.trim(),
    position,
    rankOrBelt: rankOrBelt || undefined,
    qualification: qualification || undefined,
    discipline: discipline || undefined,
    danRank: danRank || undefined,
    beltRank: beltRank || undefined,
    dob: dob || undefined,
    examDate: examDate || undefined,
    venue: venue || undefined,
    image: image || undefined,
    photo: photo || undefined,
    issued,
    validUntil,
    issuedBy,
    certificateUrl: certificateUrl || undefined,
    status,
    auditHistory,
    levelOfAffiliation: input.levelOfAffiliation || undefined,
    levelsOfAffiliation: input.levelsOfAffiliation || undefined,
    clubCategory: input.clubCategory || undefined,
    headCoachName: input.headCoachName?.trim() || undefined,
    presidentName: input.presidentName?.trim() || undefined,
    secretaryName: input.secretaryName?.trim() || undefined,
    affiliationCertificateId: input.affiliationCertificateId?.trim() || undefined,
    isAffiliationCert:
      input.type === "Club Affiliation Certificate" ||
      (number && number.startsWith("KAC-AFF")) ||
      false,
  };

  try {
    await connectToDatabase();
    await CertificateModel.create(certData);
  } catch (error) {
    console.warn("MongoDB create note (certificate): writing to fallback file.", error);
  }

  const fileList = await getFileCertificates();
  fileList.unshift(certData);
  await saveFileCertificates(fileList);

  // Invalidate Redis Certificate cache
  await invalidateCertificateCache(certData.number);
  await invalidateCertificateCache(certData.id);

  return certData;
}

export async function updateCertificate(
  identifier: string,
  updates: Partial<CreateCertificateInput> & { statusReason?: string; actionType?: string }
): Promise<CertificateItem | null> {
  const existing = await getCertificateByNumberOrId(identifier);
  if (!existing) return null;

  const currentHistory = existing.auditHistory || [];
  if (updates.status && updates.status !== existing.status) {
    currentHistory.push({
      action: updates.actionType || `Status changed to ${updates.status}`,
      timestamp: new Date().toISOString(),
      performedBy: "National Technical Committee",
      notes: updates.statusReason || `Updated certificate lifecycle status.`,
    });
  } else if (updates.actionType) {
    currentHistory.push({
      action: updates.actionType,
      timestamp: new Date().toISOString(),
      performedBy: "National Technical Committee",
      notes: updates.statusReason || "Certificate records updated.",
    });
  }

  const updatedData: CertificateItem = {
    ...existing,
    holder: updates.holder !== undefined ? updates.holder.trim() : existing.holder,
    kalawarId: updates.kalawarId !== undefined ? updates.kalawarId.trim() : existing.kalawarId,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : existing.email,
    phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
    state: updates.state !== undefined ? updates.state.trim() : existing.state,
    district: updates.district !== undefined ? updates.district.trim() : existing.district,
    academy: updates.academy !== undefined ? updates.academy.trim() : existing.academy,
    club: updates.club !== undefined ? updates.club.trim() : existing.club,
    type: updates.type !== undefined ? updates.type.trim() : existing.type,
    event: updates.event !== undefined ? updates.event.trim() : existing.event,
    position: updates.position !== undefined ? updates.position.trim() : existing.position,
    rankOrBelt: updates.rankOrBelt !== undefined ? updates.rankOrBelt.trim() : existing.rankOrBelt,
    qualification: updates.qualification !== undefined ? updates.qualification.trim() : existing.qualification,
    discipline: updates.discipline !== undefined ? updates.discipline.trim() : existing.discipline,
    danRank: updates.danRank !== undefined ? updates.danRank.trim() : existing.danRank,
    beltRank: updates.beltRank !== undefined ? updates.beltRank.trim() : existing.beltRank,
    dob: updates.dob !== undefined ? updates.dob.trim() : existing.dob,
    examDate: updates.examDate !== undefined ? updates.examDate.trim() : existing.examDate,
    venue: updates.venue !== undefined ? updates.venue.trim() : existing.venue,
    image: updates.image !== undefined ? updates.image.trim() : updates.photo !== undefined ? updates.photo.trim() : existing.image,
    photo: updates.photo !== undefined ? updates.photo.trim() : updates.image !== undefined ? updates.image.trim() : existing.photo,
    issued: updates.issued !== undefined ? updates.issued.trim() : existing.issued,
    validUntil: updates.validUntil !== undefined ? updates.validUntil.trim() : existing.validUntil,
    issuedBy: updates.issuedBy !== undefined ? updates.issuedBy.trim() : existing.issuedBy,
    certificateUrl: updates.certificateUrl !== undefined ? updates.certificateUrl.trim() : existing.certificateUrl,
    status: (updates.status as CertificateStatus) || existing.status,
    auditHistory: currentHistory,
  };

  try {
    await connectToDatabase();
    await CertificateModel.findOneAndUpdate(
      { $or: [{ id: existing.id }, { number: existing.number }] },
      { $set: updatedData },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update note (certificate): saving to fallback file.");
  }

  const fileList = await getFileCertificates();
  const idx = fileList.findIndex((c) => c.id === existing.id || c.number === existing.number);
  if (idx !== -1) {
    fileList[idx] = updatedData;
    await saveFileCertificates(fileList);
  }

  // Invalidate Redis Certificate cache
  await invalidateCertificateCache(existing.number);
  await invalidateCertificateCache(existing.id);

  return updatedData;
}

export async function deleteCertificate(identifier: string): Promise<boolean> {
  const existing = await getCertificateByNumberOrId(identifier);
  if (!existing) return false;

  try {
    await connectToDatabase();
    await CertificateModel.deleteOne({ $or: [{ id: existing.id }, { number: existing.number }] });
  } catch (error) {
    console.warn("MongoDB delete note (certificate): removing from fallback file.");
  }

  const fileList = await getFileCertificates();
  const filtered = fileList.filter((c) => c.id !== existing.id && c.number !== existing.number);
  await saveFileCertificates(filtered);

  // Invalidate Redis Certificate cache
  await invalidateCertificateCache(existing.number);
  await invalidateCertificateCache(existing.id);

  return true;
}
