import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { PlayerModel } from "@/models/Player";
import { PORTRAITS } from "@/data/images";
import { PLAYERS, type Player, type Discipline, type MemberType, type AcademicHistoryEntry, type BatchScheduleEntry, type BeltHistoryEntry } from "@/data/people";
import { DEFAULT_AFFILIATED_CLUBS } from "@/data/clubs-seed";
import { hashPassword } from "./user-auth";
import { normalizeRefereeLevel } from "./referees-store";
import { withRedisCache, invalidateAssociationCache } from "./redis";

export type CreatePlayerInput = {
  id?: string;
  name: string;
  memberType?: MemberType | string;
  discipline?: Discipline | string;
  state?: string;
  club?: string;
  age?: number;
  dob?: string;
  gender?: string;
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  rawPassword?: string;
  coachName?: string;
  idNumber?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  tempStateAssociation?: string;
  tempDistrictAssociation?: string;
  pincode?: string;
  beltRank?: string;
  ageGroup?: string;
  weightCategory?: string;
  bio?: string;
  academicHistory?: AcademicHistoryEntry[];
  qualification?: string;
  experienceYears?: number | string;
  specialization?: string;
  officiatingGrade?: string;
  matchesOfficiated?: number | string;
  yearFounded?: number | string;
  registrationNumber?: string;
  registeredAddress?: string;
  presidentName?: string;
  secretaryName?: string;
  memberCount?: number | string;
  registrationType?: string;
  levelOfAffiliation?: string;
  levelsOfAffiliation?: string[];
  clubCategory?: string;
  affiliationDocument?: string;
  affiliationDocumentName?: string;
  affiliationDocumentSize?: string;
  certificationDocument?: string;
  certificationDocumentName?: string;
  certificationDocumentSize?: string;
  logo?: string;
  district?: string;
  disciplines?: string[];
  headCoachName?: string;
  timings?: string;
  validFrom?: string;
  validUntil?: string;
  paymentStatus?: "Paid" | "Pending" | "Cash Verification Required" | string;
  paymentMethod?: "Razorpay" | "Cash" | "Bank Transfer" | string;
  affiliationCertificateId?: string;
  affiliationNumber?: string;
  certificateNumber?: string;
  photos?: string[];
  achievements?: string[];
  contactPerson?: string;
  alternatePhone?: string;
  website?: string;
  facilities?: string[];
  coachIds?: string[];
  batches?: BatchScheduleEntry[];
  beltHistory?: BeltHistoryEntry[];
  clubApprovalStatus?: "pending" | "confirmed" | "rejected";
  coachApprovalStatus?: "pending" | "confirmed" | "rejected";
  rank?: number;
  points?: number | string;
  status?: "Active" | "Pending" | "Suspended" | "Incomplete" | "Verified" | "Affiliated" | "Under Review" | string;
  image?: string;
  registeredOn?: string;
};

function calculateAge(dobString?: string): number {
  if (!dobString) return 20;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 20;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(10, Math.min(60, age));
}

// Fallback JSON file storage helpers
let cachedPlayers: Player[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "players.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "players.json");

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
        await fs.writeFile(primaryPath, JSON.stringify([], null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFilePlayers(): Promise<Player[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    let parsed = raw.trim() ? (JSON.parse(raw) as Player[]) : [];
    if (!parsed || parsed.length === 0) { parsed = [...DEFAULT_AFFILIATED_CLUBS]; }
    cachedPlayers = parsed;
    return parsed;
  } catch {
    return cachedPlayers;
  }
}

async function saveFilePlayers(players: Player[]): Promise<void> {
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(players, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(players, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Could not save to players.json fallback:", error instanceof Error ? error.message : "");
  }
}

export async function getPlayers(): Promise<Player[]> {
  if (process.env.MOCK_DATA === "true" || !process.env.MONGODB_URI) { return await getFilePlayers(); }
  try {
    await connectToDatabase();
    const docs = await PlayerModel.find().sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        memberType: (d.memberType as MemberType) || "Player",
        discipline: d.discipline as Discipline,
        state: d.state,
        club: d.club,
        age: d.age,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        coachName: d.coachName,
        idNumber: d.idNumber,
        emergencyContact: d.emergencyContact,
        bloodGroup: d.bloodGroup,
        address: d.address,
        city: d.city || d.district,
        pincode: d.pincode,
        beltRank: d.beltRank,
        ageGroup: d.ageGroup,
        weightCategory: d.weightCategory,
        bio: d.bio,
        academicHistory: d.academicHistory || [],
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        specialization: d.specialization,
        officiatingGrade: d.officiatingGrade,
        matchesOfficiated: d.matchesOfficiated,
        yearFounded: d.yearFounded,
        registeredAddress: d.registeredAddress,
        presidentName: d.presidentName,
        secretaryName: d.secretaryName,
        memberCount: d.memberCount,
        registrationType: d.registrationType || (d.affiliationDocument ? "Already Affiliated" : "Apply for Affiliation"),
        levelOfAffiliation: d.levelOfAffiliation,
        levelsOfAffiliation: d.levelsOfAffiliation || [],
        clubCategory: d.clubCategory,
        affiliationDocument: d.affiliationDocument || d.certificationDocument,
        affiliationDocumentName: d.affiliationDocumentName || d.certificationDocumentName,
        affiliationDocumentSize: d.affiliationDocumentSize || d.certificationDocumentSize,
        certificationDocument: d.certificationDocument || d.affiliationDocument,
        certificationDocumentName: d.certificationDocumentName || d.affiliationDocumentName,
        certificationDocumentSize: d.certificationDocumentSize || d.affiliationDocumentSize,
        logo: d.logo,
        district: d.district || d.city,
        tempStateAssociation: d.tempStateAssociation,
        tempDistrictAssociation: d.tempDistrictAssociation,
        disciplines: d.disciplines || [],
        headCoachName: d.headCoachName,
        timings: d.timings,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        affiliationCertificateId: d.affiliationCertificateId,
        photos: d.photos || [],
        achievements: d.achievements || [],
        contactPerson: d.contactPerson,
        alternatePhone: d.alternatePhone,
        website: d.website,
        facilities: d.facilities || [],
        coachIds: d.coachIds || [],
        batches: d.batches || [],
        beltHistory: d.beltHistory || [],
        clubApprovalStatus: d.clubApprovalStatus,
        coachApprovalStatus: d.coachApprovalStatus,
        rank: d.rank,
        points: d.points,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: d.status,
        image: d.image,
        registeredOn: d.registeredOn,
        level: d.level || d.officiatingGrade,
      }));
    }
  } catch (error) {
    console.warn("MongoDB fetch note: Falling back to local storage.", error instanceof Error ? error.message : "");
  }

  const filePlayers = await getFilePlayers();
  return filePlayers || [];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const cleanId = id.trim();
  try {
    await connectToDatabase();
    const d: any = await PlayerModel.findOne({
      id: { $regex: new RegExp("^" + cleanId + "$", "i") },
    }).lean();

    if (d) {
      let resolvedStatus = d.status;
      if (
        ((d.memberType as string) === "Referee" || cleanId.toUpperCase().startsWith("KSM-RF-") || cleanId.toUpperCase().startsWith("WSF-RF-")) &&
        resolvedStatus !== "Active"
      ) {
        try {
          const { getFileReferees } = await import("./referees-store");
          const refList = await getFileReferees();
          const ref = refList.find(
            (r) =>
              r.id.toLowerCase() === cleanId.toLowerCase() ||
              (d.email && r.email && r.email.toLowerCase() === d.email.toLowerCase())
          );
          if (ref && (ref.status === "Active" || ref.status === "Certified" || ref.licenseNumber)) {
            resolvedStatus = "Active";
          }
        } catch {}
      }

      return {
        id: d.id,
        name: d.name,
        memberType: (d.memberType as MemberType) || "Player",
        discipline: d.discipline as Discipline,
        state: d.state,
        club: d.club,
        age: d.age,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        coachName: d.coachName,
        idNumber: d.idNumber,
        emergencyContact: d.emergencyContact,
        bloodGroup: d.bloodGroup,
        address: d.address,
        city: d.city || d.district,
        district: d.district || d.city,
        tempStateAssociation: d.tempStateAssociation,
        tempDistrictAssociation: d.tempDistrictAssociation,
        pincode: d.pincode,
        beltRank: d.beltRank,
        ageGroup: d.ageGroup,
        weightCategory: d.weightCategory,
        bio: d.bio,
        academicHistory: d.academicHistory || [],
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        specialization: d.specialization,
        officiatingGrade: d.officiatingGrade,
        matchesOfficiated: d.matchesOfficiated,
        yearFounded: d.yearFounded,
        registeredAddress: d.registeredAddress,
        presidentName: d.presidentName,
        secretaryName: d.secretaryName,
        memberCount: d.memberCount,
        registrationType: d.registrationType || (d.affiliationDocument ? "Already Affiliated" : "Apply for Affiliation"),
        levelOfAffiliation: d.levelOfAffiliation,
        levelsOfAffiliation: d.levelsOfAffiliation || [],
        clubCategory: d.clubCategory,
        affiliationDocument: d.affiliationDocument || d.certificationDocument,
        affiliationDocumentName: d.affiliationDocumentName || d.certificationDocumentName,
        affiliationDocumentSize: d.affiliationDocumentSize || d.certificationDocumentSize,
        certificationDocument: d.certificationDocument || d.affiliationDocument,
        certificationDocumentName: d.certificationDocumentName || d.affiliationDocumentName,
        certificationDocumentSize: d.certificationDocumentSize || d.affiliationDocumentSize,
        logo: d.logo,
        disciplines: d.disciplines || [],
        headCoachName: d.headCoachName,
        timings: d.timings,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        affiliationCertificateId: d.affiliationCertificateId,
        photos: d.photos || [],
        achievements: d.achievements || [],
        contactPerson: d.contactPerson,
        alternatePhone: d.alternatePhone,
        website: d.website,
        facilities: d.facilities || [],
        coachIds: d.coachIds || [],
        batches: d.batches || [],
        beltHistory: d.beltHistory || [],
        clubApprovalStatus: d.clubApprovalStatus,
        coachApprovalStatus: d.coachApprovalStatus,
        rank: d.rank,
        points: d.points,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: resolvedStatus,
        image: d.image,
        registeredOn: d.registeredOn,
        level: d.level || d.officiatingGrade,
      };
    }
  } catch {
    // Fallback
  }

  const list = await getPlayers();
  const matched = list.find((p) => p.id.toLowerCase() === cleanId.toLowerCase());
  if (matched) {
    if (
      ((matched.memberType as string) === "Referee" || cleanId.toUpperCase().startsWith("KSM-RF-") || cleanId.toUpperCase().startsWith("WSF-RF-")) &&
      matched.status !== "Active"
    ) {
      try {
        const { getFileReferees } = await import("./referees-store");
        const refList = await getFileReferees();
        const ref = refList.find(
          (r) =>
            r.id.toLowerCase() === cleanId.toLowerCase() ||
            (matched.email && r.email && r.email.toLowerCase() === matched.email.toLowerCase())
        );
        if (ref && (ref.status === "Active" || ref.status === "Certified" || ref.licenseNumber)) {
          return { ...matched, status: "Active" as any };
        }
      } catch {}
    }
    return matched;
  }

  // If not found in players list, check referees store as fallback
  try {
    const { getFileReferees } = await import("./referees-store");
    const refList = await getFileReferees();
    const ref = refList.find((r) => r.id.toLowerCase() === cleanId.toLowerCase());
    if (ref) {
      const refStatus =
        ref.status === "Active" || ref.status === "Certified" || ref.licenseNumber
          ? "Active"
          : ref.status === "Suspended"
          ? "Suspended"
          : "Pending";

      return {
        id: ref.id,
        name: ref.name,
        memberType: "Referee",
        discipline: (ref.discipline as Discipline) || "Kalawar Martial Arts",
        state: ref.state || "Maharashtra",
        club: ref.academy || "Independent / No Affiliated Club",
        age: 25,
        dob: ref.dob || "",
        gender: ref.gender || "Male",
        email: ref.email,
        phone: ref.phone,
        emergencyContact: ref.emergencyContact || ref.phone,
        bloodGroup: ref.bloodGroup || "",
        address: ref.address || "",
        city: ref.district || "Pune",
        pincode: ref.pincode || "",
        beltRank: ref.currentRank && ref.currentRank !== "None / Unranked" ? ref.currentRank : undefined,
        status: refStatus as any,
        image: ref.photo || "",
        registeredOn: ref.createdAt ? ref.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        rank: 1,
        points: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
      };
    }
  } catch {}

  return null;
}

export async function getCoaches(): Promise<Player[]> {
  const all = await getPlayers();
  return all.filter((p) => p.memberType === "Coach" || p.id.startsWith("KSM-CO") || p.id.startsWith("WSF-CO"));
}

export async function getReferees(): Promise<Player[]> {
  const all = await getPlayers();
  return all.filter((p) => p.memberType === "Referee" || p.id.startsWith("KSM-RF") || p.id.startsWith("WSF-RF"));
}

export async function getClubs(): Promise<Player[]> {
  if (process.env.MOCK_DATA === "true" || !process.env.MONGODB_URI) { const all = await getPlayers(); const c = all.filter((p) => p.memberType === "Club" || p.id.startsWith("KSM-CL") || p.id.startsWith("WSF-CL")); return c.length > 0 ? c : DEFAULT_AFFILIATED_CLUBS; }
  try {
    await connectToDatabase();
    const docs = await PlayerModel.find({
      $or: [
        { memberType: "Club" },
        { id: { $regex: /^(KSM|WSF)-CL/i } },
      ],
    }).sort({ createdAt: -1 }).lean();

    if (docs) {
      return docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        memberType: "Club",
        discipline: (d.discipline as Discipline) || "Kalawar Martial Arts",
        state: d.state || "Maharashtra",
        club: d.club || d.name,
        age: d.age || 0,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        coachName: d.coachName,
        idNumber: d.idNumber,
        emergencyContact: d.emergencyContact,
        bloodGroup: d.bloodGroup,
        address: d.address,
        city: d.city,
        tempStateAssociation: d.tempStateAssociation,
        tempDistrictAssociation: d.tempDistrictAssociation,
        pincode: d.pincode,
        beltRank: d.beltRank,
        ageGroup: d.ageGroup,
        weightCategory: d.weightCategory,
        bio: d.bio,
        academicHistory: d.academicHistory || [],
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        specialization: d.specialization,
        officiatingGrade: d.officiatingGrade,
        matchesOfficiated: d.matchesOfficiated,
        yearFounded: d.yearFounded,
        registeredAddress: d.registeredAddress,
        presidentName: d.presidentName,
        secretaryName: d.secretaryName,
        memberCount: d.memberCount,
        registrationType: d.registrationType || (d.affiliationDocument ? "Already Affiliated" : "Apply for Affiliation"),
        levelOfAffiliation: d.levelOfAffiliation,
        levelsOfAffiliation: d.levelsOfAffiliation || [],
        clubCategory: d.clubCategory,
        affiliationDocument: d.affiliationDocument || d.certificationDocument,
        affiliationDocumentName: d.affiliationDocumentName || d.certificationDocumentName,
        affiliationDocumentSize: d.affiliationDocumentSize || d.certificationDocumentSize,
        certificationDocument: d.certificationDocument || d.affiliationDocument,
        certificationDocumentName: d.certificationDocumentName || d.affiliationDocumentName,
        certificationDocumentSize: d.certificationDocumentSize || d.affiliationDocumentSize,
        logo: d.logo,
        district: d.district,
        disciplines: d.disciplines || [],
        headCoachName: d.headCoachName,
        timings: d.timings,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        affiliationCertificateId: d.affiliationCertificateId,
        photos: d.photos || [],
        achievements: d.achievements || [],
        contactPerson: d.contactPerson,
        alternatePhone: d.alternatePhone,
        website: d.website,
        facilities: d.facilities || [],
        coachIds: d.coachIds || [],
        batches: d.batches || [],
        beltHistory: d.beltHistory || [],
        clubApprovalStatus: d.clubApprovalStatus,
        coachApprovalStatus: d.coachApprovalStatus,
        rank: d.rank || 1,
        points: d.points || 0,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: d.status || "Affiliated",
        image: d.image || d.logo || "",
        registeredOn: d.registeredOn,
      }));
    }
  } catch (error) {
    console.warn("MongoDB fetch clubs note: Falling back to local storage.", error instanceof Error ? error.message : "");
  }

  const all = await getPlayers();
  return all.filter((p) => p.memberType === "Club" || p.id.startsWith("KSM-CL") || p.id.startsWith("WSF-CL"));
}

export async function getClubById(idOrSlug: string): Promise<{
  club: Player | null;
  coaches: Player[];
  athletes: Player[];
}> {
  const clean = (idOrSlug || "").trim().toLowerCase();
  if (!clean) {
    return { club: null, coaches: [], athletes: [] };
  }

  const allClubs = await getClubs();
  
  let club =
    allClubs.find(
      (c) =>
        c.id.toLowerCase() === clean ||
        (c.affiliationCertificateId && c.affiliationCertificateId.toLowerCase() === clean) ||
        (c.affiliationNumber && (c as any).affiliationNumber.toLowerCase() === clean) ||
        (c.certificateNumber && (c as any).certificateNumber.toLowerCase() === clean) ||
        c.name.toLowerCase().replace(/\s+/g, "-") === clean ||
        c.name.toLowerCase() === clean
    ) || null;

  if (!club) {
    const allPlayers = await getPlayers();
    club =
      allPlayers.find(
        (p) =>
          (p.memberType === "Club" || p.id.startsWith("KSM-CL") || p.id.startsWith("WSF-CL") || p.id.startsWith("KAC-AFF") || p.id.startsWith("KAL-AFF")) &&
          (p.id.toLowerCase() === clean ||
            (p.affiliationCertificateId && p.affiliationCertificateId.toLowerCase() === clean) ||
            (p.affiliationNumber && (p as any).affiliationNumber.toLowerCase() === clean) ||
            (p.certificateNumber && (p as any).certificateNumber.toLowerCase() === clean) ||
            p.name.toLowerCase().replace(/\s+/g, "-") === clean ||
            p.name.toLowerCase() === clean)
      ) || null;
  }

  if (!club) {
    return { club: null, coaches: [], athletes: [] };
  }

  const { all: coachesByAffiliation } = await getCoachesByClub(club.id, club.name);
  const finalCoaches = [...coachesByAffiliation];

  if (club.coachIds && Array.isArray(club.coachIds) && club.coachIds.length > 0) {
    const allRegistered = await getPlayers();
    const explicitCoaches = allRegistered.filter((c) =>
      club.coachIds?.some((id) => id.trim().toLowerCase() === c.id.trim().toLowerCase())
    );
    for (const ec of explicitCoaches) {
      if (!finalCoaches.some((fc) => fc.id.toLowerCase() === ec.id.toLowerCase())) {
        finalCoaches.push(ec);
      }
    }
  }

  const allPlayers = await getPlayers();
  const athletes = allPlayers.filter((p) => {
    if (p.memberType && p.memberType !== "Player") return false;
    if (!p.club) return false;
    const pClub = p.club.toLowerCase();
    return pClub.includes(club.id.toLowerCase()) || pClub.includes(club.name.toLowerCase());
  });

  return { club, coaches: finalCoaches, athletes };
}

export async function getCoachesByClub(
  clubIdOrName: string,
  altIdentifier?: string
): Promise<{ pending: Player[]; confirmed: Player[]; all: Player[] }> {
  const coaches = await getCoaches();
  const q1 = (clubIdOrName || "").trim().toLowerCase();
  const q2 = (altIdentifier || "").trim().toLowerCase();
  if (!q1 && !q2) {
    return { pending: [], confirmed: [], all: [] };
  }

  const queries = [q1, q2].filter(Boolean);

  const affiliated = coaches.filter((c) => {
    if (!c.club || c.club === "Independent" || c.club.toLowerCase().includes("independent")) {
      return false;
    }
    const cClub = c.club.trim().toLowerCase();
    const cClubWithoutId = cClub.replace(/\s*\([^)]*\)$/, "").trim();

    return queries.some((q) => {
      const qWithoutId = q.replace(/\s*\([^)]*\)$/, "").trim();
      const idMatch = q.match(/\(((?:ksm|wsf)-cl-[^)]+)\)/i);
      const targetId = idMatch ? idMatch[1].toLowerCase() : (q.startsWith("ksm-cl-") || q.startsWith("wsf-cl-")) ? q : "";

      if (targetId && cClub.includes(targetId)) return true;
      if (cClub === q || cClubWithoutId === qWithoutId) return true;
      if (qWithoutId && (cClub.includes(qWithoutId) || qWithoutId.includes(cClubWithoutId))) return true;
      return false;
    });
  });

  const pending = affiliated.filter((c) => !c.clubApprovalStatus || c.clubApprovalStatus === "pending");
  const confirmed = affiliated.filter((c) => c.clubApprovalStatus === "confirmed");

  return {
    pending,
    confirmed,
    all: affiliated,
  };
}

export async function getPlayersByCoach(
  coachIdOrName: string,
  altIdentifier?: string
): Promise<{ pending: Player[]; confirmed: Player[]; all: Player[] }> {
  const all = await getPlayers();
  const playersOnly = all.filter((p) => p.memberType === "Player" || !p.memberType || p.id.startsWith("KSM-PL-") || p.id.startsWith("WSF-PL-") || p.id.startsWith("WSF-0"));
  const q1 = (coachIdOrName || "").trim().toLowerCase();
  const q2 = (altIdentifier || "").trim().toLowerCase();
  if (!q1 && !q2) {
    return { pending: [], confirmed: [], all: [] };
  }

  const queries = [q1, q2].filter(Boolean);

  const coached = playersOnly.filter((p) => {
    if (!p.coachName || p.coachName === "Independent" || p.coachName.toLowerCase().includes("independent")) {
      return false;
    }
    const cName = p.coachName.trim().toLowerCase();
    const cNameWithoutId = cName.replace(/\s*\([^)]*\)$/, "").trim();

    return queries.some((q) => {
      const qWithoutId = q.replace(/\s*\([^)]*\)$/, "").trim();
      const idMatch = q.match(/\(((?:ksm|wsf)-co-[^)]+)\)/i);
      const targetId = idMatch ? idMatch[1].toLowerCase() : (q.startsWith("ksm-co-") || q.startsWith("wsf-co-")) ? q : "";

      if (targetId && cName.includes(targetId)) return true;
      if (cName === q || cNameWithoutId === qWithoutId) return true;
      if (qWithoutId && (cName.includes(qWithoutId) || qWithoutId.includes(cNameWithoutId))) return true;
      return false;
    });
  });

  const pending = coached.filter((p) => !p.coachApprovalStatus || p.coachApprovalStatus === "pending");
  const confirmed = coached.filter((p) => p.coachApprovalStatus === "confirmed");

  return {
    pending,
    confirmed,
    all: coached,
  };
}

export async function getPlayersByClub(
  clubIdOrName: string,
  altIdentifier?: string
): Promise<{ pending: Player[]; confirmed: Player[]; all: Player[] }> {
  const all = await getPlayers();
  const playersOnly = all.filter(
    (p) =>
      p.memberType === "Player" ||
      !p.memberType ||
      p.id.startsWith("KSM-PL-") ||
      p.id.startsWith("WSF-PL-") ||
      p.id.startsWith("WSF-0")
  );
  const q1 = (clubIdOrName || "").trim().toLowerCase();
  const q2 = (altIdentifier || "").trim().toLowerCase();
  if (!q1 && !q2) {
    return { pending: [], confirmed: [], all: [] };
  }

  const queries = [q1, q2].filter(Boolean);

  const affiliated = playersOnly.filter((p) => {
    if (!p.club || p.club === "Independent" || p.club.toLowerCase().includes("independent")) {
      return false;
    }
    const pClub = p.club.trim().toLowerCase();
    const pClubWithoutId = pClub.replace(/\s*\([^)]*\)$/, "").trim();

    return queries.some((q) => {
      const qWithoutId = q.replace(/\s*\([^)]*\)$/, "").trim();
      const idMatch = q.match(/\(((?:ksm|wsf)-cl-[^)]+)\)/i);
      const targetId = idMatch ? idMatch[1].toLowerCase() : (q.startsWith("ksm-cl-") || q.startsWith("wsf-cl-")) ? q : "";

      if (targetId && pClub.includes(targetId)) return true;
      if (pClub === q || pClubWithoutId === qWithoutId) return true;
      if (qWithoutId && (pClub.includes(qWithoutId) || qWithoutId.includes(pClubWithoutId))) return true;
      return false;
    });
  });

  const pending = affiliated.filter((p) => !p.clubApprovalStatus || p.clubApprovalStatus === "pending");
  const confirmed = affiliated.filter((p) => p.clubApprovalStatus === "confirmed");

  return {
    pending,
    confirmed,
    all: affiliated,
  };
}

export function isPlayerProfileComplete(player: {
  memberType?: MemberType | string;
  city?: string;
  address?: string;
  registeredAddress?: string;
  pincode?: string;
  academicHistory?: AcademicHistoryEntry[];
  image?: string;
  [key: string]: any;
}): boolean {
  const isPlayer = !player.memberType || player.memberType === "Player";
  if (!isPlayer) return true;

  const hasPhoto = Boolean(player.image && player.image.trim().length > 0);

  const hasAddress = Boolean(
    player.city && player.city.trim().length >= 2 &&
    (player.address || player.registeredAddress) && (player.address || player.registeredAddress)!.trim().length >= 4 &&
    player.pincode && /^\d{6}$/.test(player.pincode.trim().replace(/\D/g, ""))
  );

  const hasAcademicHistory = Boolean(
    player.academicHistory &&
    Array.isArray(player.academicHistory) &&
    player.academicHistory.length > 0 &&
    player.academicHistory.some((a) => a.academy && a.academy.trim().length >= 2)
  );

  return hasPhoto && hasAddress && hasAcademicHistory;
}

export async function getStateAssociations(): Promise<Player[]> {
  return withRedisCache("cache:state-associations", 300, fetchRawStateAssociations);
}

async function fetchRawStateAssociations(): Promise<Player[]> {
  try {
    await connectToDatabase();
    const docs = await PlayerModel.find({
      $or: [
        { memberType: "StateAssociation" },
        { id: { $regex: /^(KSM|WSF)-SA/i } },
      ],
    }).sort({ createdAt: -1 }).lean();

    if (docs && docs.length > 0) {
      return docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        memberType: "StateAssociation",
        discipline: (d.discipline as Discipline) || "Kalawar Martial Arts",
        state: d.state || "National",
        club: d.club || d.name,
        age: d.age || 0,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        emergencyContact: d.emergencyContact,
        idNumber: d.idNumber,
        address: d.address,
        district: d.district,
        city: d.city,
        pincode: d.pincode,
        rank: d.rank || 0,
        points: d.points || 0,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: d.status || "Pending",
        image: d.image || "",
        registeredOn: d.registeredOn,
      }));
    }
  } catch (error) {
    console.warn("MongoDB fetch state associations note: Falling back to local storage.", error instanceof Error ? error.message : "");
  }

  const all = await getPlayers();
  return all.filter((p) => p.memberType === "StateAssociation" || p.id.startsWith("KSM-SA") || p.id.startsWith("WSF-SA"));
}

export async function getDistrictAssociations(): Promise<Player[]> {
  return withRedisCache("cache:district-associations", 300, fetchRawDistrictAssociations);
}

async function fetchRawDistrictAssociations(): Promise<Player[]> {
  try {
    await connectToDatabase();
    const docs = await PlayerModel.find({
      $or: [
        { memberType: "DistrictAssociation" },
        { id: { $regex: /^(KSM|WSF)-DA/i } },
      ],
    }).sort({ createdAt: -1 }).lean();

    if (docs && docs.length > 0) {
      return docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        memberType: "DistrictAssociation",
        discipline: (d.discipline as Discipline) || "Kalawar Martial Arts",
        state: d.state || "National",
        district: d.district || d.city || "",
        club: d.club || d.name,
        age: d.age || 0,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        emergencyContact: d.emergencyContact,
        idNumber: d.idNumber,
        address: d.address,
        city: d.city || d.district || "",
        pincode: d.pincode,
        rank: d.rank || 0,
        points: d.points || 0,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: d.status || "Pending",
        image: d.image || "",
        registeredOn: d.registeredOn,
      }));
    }
  } catch (error) {
    console.warn("MongoDB fetch district associations note: Falling back to local storage.", error instanceof Error ? error.message : "");
  }

  const all = await getPlayers();
  return all.filter((p) => p.memberType === "DistrictAssociation" || p.id.startsWith("KSM-DA") || p.id.startsWith("WSF-DA"));
}

export type EmailCheckResult = {
  isRegistered: boolean;
  existingRecord?: {
    id: string;
    name: string;
    memberType: string;
  };
};

export async function isEmailAlreadyRegistered(
  email: string,
  excludeId?: string
): Promise<EmailCheckResult> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return { isRegistered: false };

  const cleanExcludeId = (excludeId || "").trim().toLowerCase();

  try {
    await connectToDatabase();
    const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`^${escaped}$`, "i");

    const query: any = { email: emailRegex };
    if (cleanExcludeId) {
      query.id = { $not: new RegExp(`^${cleanExcludeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
    }

    const foundPlayer: any = await PlayerModel.findOne(query, "id name memberType email").lean();
    if (foundPlayer) {
      return {
        isRegistered: true,
        existingRecord: {
          id: foundPlayer.id,
          name: foundPlayer.name,
          memberType: foundPlayer.memberType || "Player",
        },
      };
    }

    try {
      const { RefereeModel } = await import("@/models/Referee");
      const refQuery: any = { email: emailRegex };
      if (cleanExcludeId) {
        refQuery.id = { $not: new RegExp(`^${cleanExcludeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
      }
      const foundRef: any = await RefereeModel.findOne(refQuery, "id name email").lean();
      if (foundRef) {
        return {
          isRegistered: true,
          existingRecord: {
            id: foundRef.id,
            name: foundRef.name,
            memberType: "Referee",
          },
        };
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn("MongoDB check email note: falling back to local list.", err instanceof Error ? err.message : "");
  }

  // Fallback to local players array
  const all = await getPlayers();
  const match = all.find((p) => {
    if (cleanExcludeId && p.id && p.id.toLowerCase() === cleanExcludeId) return false;
    return Boolean(p.email && p.email.trim().toLowerCase() === cleanEmail);
  });

  if (match) {
    return {
      isRegistered: true,
      existingRecord: {
        id: match.id,
        name: match.name,
        memberType: match.memberType || "Player",
      },
    };
  }

  return { isRegistered: false };
}

export type UsernameCheckResult = {
  isRegistered: boolean;
  existingRecord?: {
    id: string;
    name: string;
    memberType: string;
  };
};

export async function isUsernameAlreadyRegistered(
  username: string,
  excludeId?: string
): Promise<UsernameCheckResult> {
  const cleanUsername = (username || "").trim().toLowerCase();
  if (!cleanUsername) return { isRegistered: false };

  const cleanExcludeId = (excludeId || "").trim().toLowerCase();

  try {
    await connectToDatabase();
    const escaped = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const usernameRegex = new RegExp(`^${escaped}$`, "i");

    const query: any = { username: usernameRegex };
    if (cleanExcludeId) {
      const escapedExclude = cleanExcludeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.id = { $not: new RegExp(`^${escapedExclude}$`, "i") };
    }

    const foundPlayer: any = await PlayerModel.findOne(query, "id name memberType username").lean();
    if (foundPlayer) {
      return {
        isRegistered: true,
        existingRecord: {
          id: foundPlayer.id,
          name: foundPlayer.name,
          memberType: foundPlayer.memberType || "Member",
        },
      };
    }

    try {
      const { RefereeModel } = await import("@/models/Referee");
      const refQuery: any = { username: usernameRegex };
      if (cleanExcludeId) {
        const escapedExclude = cleanExcludeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        refQuery.id = { $not: new RegExp(`^${escapedExclude}$`, "i") };
      }
      const foundRef: any = await RefereeModel.findOne(refQuery, "id name username").lean();
      if (foundRef) {
        return {
          isRegistered: true,
          existingRecord: {
            id: foundRef.id,
            name: foundRef.name,
            memberType: "Referee",
          },
        };
      }
    } catch {
      // ignore
    }

    try {
      const { DistrictAdminModel } = await import("@/models/DistrictAdmin");
      const adminQuery: any = { userId: usernameRegex };
      if (cleanExcludeId) {
        const escapedExclude = cleanExcludeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        adminQuery.id = { $not: new RegExp(`^${escapedExclude}$`, "i") };
      }
      const foundAdmin: any = await DistrictAdminModel.findOne(adminQuery, "id district userId").lean();
      if (foundAdmin) {
        return {
          isRegistered: true,
          existingRecord: {
            id: foundAdmin.id,
            name: `${foundAdmin.district} District Admin`,
            memberType: "District Admin",
          },
        };
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn("MongoDB check username note: falling back to local list.", err instanceof Error ? err.message : "");
  }

  // Fallback to local players array
  const all = await getPlayers();
  const match = all.find((p) => {
    if (cleanExcludeId && p.id && p.id.toLowerCase() === cleanExcludeId) return false;
    return Boolean(p.username && p.username.trim().toLowerCase() === cleanUsername);
  });

  if (match) {
    return {
      isRegistered: true,
      existingRecord: {
        id: match.id,
        name: match.name,
        memberType: match.memberType || "Member",
      },
    };
  }

  return { isRegistered: false };
}


export async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const memberType = (input.memberType as MemberType) || "Player";

  if (input.username && typeof input.username === "string" && input.username.trim()) {
    const cleanUsername = input.username.trim().toLowerCase();
    const usernameCheck = await isUsernameAlreadyRegistered(cleanUsername);
    if (usernameCheck.isRegistered) {
      throw new Error(
        `This username is already taken (${usernameCheck.existingRecord?.memberType || "Member"}: ${usernameCheck.existingRecord?.name}). Please choose a different username.`
      );
    }
    input.username = cleanUsername;
  }

  if (input.email && typeof input.email === "string" && input.email.trim()) {
    const emailCheck = await isEmailAlreadyRegistered(input.email);
    if (emailCheck.isRegistered) {
      throw new Error(
        `This email address is already registered (${emailCheck.existingRecord?.memberType || "Member"}: ${emailCheck.existingRecord?.name}). Please sign in or use a different email address.`
      );
    }
  }

  let prefix = "KSM-PL-2026-";
  if (memberType === "Coach") prefix = "KSM-CO-2026-";
  else if (memberType === "Referee") prefix = "KSM-RF-2026-";
  else if (memberType === "Club") prefix = "KSM-CL-2026-";
  else if (memberType === "StateAssociation") prefix = "KSM-SA-2026-";
  else if (memberType === "DistrictAssociation") prefix = "KSM-DA-2026-";

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const id = input.id?.trim() || prefix + randomNum;

  const age =
    input.age !== undefined
      ? input.age
      : input.dob
      ? calculateAge(input.dob)
      : memberType === "Club" || memberType === "StateAssociation" || memberType === "DistrictAssociation"
      ? 0
      : 22;

  const points = Number(input.points) || 0;
  const defaultStatus =
    memberType === "Club"
      ? "Affiliated"
      : memberType === "StateAssociation" || memberType === "DistrictAssociation"
      ? "Pending"
      : memberType === "Player"
      ? isPlayerProfileComplete({ ...input, memberType })
        ? "Pending"
        : "Incomplete"
      : "Pending";
  const status = input.status || defaultStatus;
  const registeredOn =
    input.registeredOn || new Date().toISOString().split("T")[0];
  const image = input.image || "";

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  const playerObj: Player = {
    id,
    name: input.name.trim(),
    memberType,
    discipline: (input.discipline as Discipline) || "Kalawar Martial Arts",
    state: input.state?.trim() || "National",
    club: input.club?.trim() || input.coachName?.trim() || "Independent",
    age,
    rank: input.rank ?? 1,
    points,
    medals: { gold: 0, silver: 0, bronze: 0 },
    status: status as any,
    image,
    registeredOn,
    ...(input.academicHistory && Array.isArray(input.academicHistory) ? { academicHistory: input.academicHistory } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.username ? { username: input.username.trim().toLowerCase() } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(passwordHash ? { password: passwordHash } : {}),
    ...(input.password ? { rawPassword: input.password } : {}),
    ...(input.dob ? { dob: input.dob } : {}),
    ...(input.gender ? { gender: input.gender } : {}),
    ...(input.coachName ? { coachName: input.coachName } : {}),
    ...(input.idNumber ? { idNumber: input.idNumber } : {}),
    ...(input.emergencyContact ? { emergencyContact: input.emergencyContact } : {}),
    ...(input.bloodGroup ? { bloodGroup: input.bloodGroup } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.pincode ? { pincode: input.pincode } : {}),
    ...((input.beltRank || (input as any).currentRank || memberType === "Referee")
      ? { beltRank: input.beltRank || (input as any).currentRank || "1st Dan Black Belt" }
      : {}),
    ...(input.ageGroup ? { ageGroup: input.ageGroup } : {}),
    ...(input.weightCategory ? { weightCategory: input.weightCategory } : {}),
    ...(input.bio ? { bio: input.bio } : {}),
    ...(input.qualification ? { qualification: input.qualification } : {}),
    ...(input.experienceYears ? { experienceYears: input.experienceYears } : {}),
    ...(input.specialization ? { specialization: input.specialization } : {}),
    ...(input.officiatingGrade || (input as any).level || memberType === "Referee"
      ? {
          officiatingGrade: normalizeRefereeLevel(input.officiatingGrade || (input as any).level),
          level: normalizeRefereeLevel((input as any).level || input.officiatingGrade),
        }
      : {}),
    ...(input.matchesOfficiated ? { matchesOfficiated: input.matchesOfficiated } : {}),
    ...(input.yearFounded ? { yearFounded: input.yearFounded } : {}),
    ...(input.registeredAddress ? { registeredAddress: input.registeredAddress } : {}),
    ...(input.presidentName ? { presidentName: input.presidentName } : {}),
    ...(input.secretaryName ? { secretaryName: input.secretaryName } : {}),
    ...(input.memberCount ? { memberCount: input.memberCount } : {}),
    ...(input.registrationType ? { registrationType: input.registrationType } : input.affiliationDocument ? { registrationType: "Already Affiliated" } : {}),
    ...(input.levelOfAffiliation ? { levelOfAffiliation: input.levelOfAffiliation } : {}),
    ...(input.levelsOfAffiliation ? { levelsOfAffiliation: input.levelsOfAffiliation } : {}),
    ...(input.clubCategory ? { clubCategory: input.clubCategory } : {}),
    ...(input.affiliationDocument || (input as any).certificationDocument
      ? {
          affiliationDocument: input.affiliationDocument || (input as any).certificationDocument,
          certificationDocument: (input as any).certificationDocument || input.affiliationDocument,
        }
      : {}),
    ...(input.affiliationDocumentName || (input as any).certificationDocumentName
      ? {
          affiliationDocumentName: input.affiliationDocumentName || (input as any).certificationDocumentName,
          certificationDocumentName: (input as any).certificationDocumentName || input.affiliationDocumentName,
        }
      : {}),
    ...(input.affiliationDocumentSize || (input as any).certificationDocumentSize
      ? {
          affiliationDocumentSize: input.affiliationDocumentSize || (input as any).certificationDocumentSize,
          certificationDocumentSize: (input as any).certificationDocumentSize || input.affiliationDocumentSize,
        }
      : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.district ? { district: input.district } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.headCoachName ? { headCoachName: input.headCoachName } : {}),
    ...(input.timings ? { timings: input.timings } : {}),
    ...(input.validFrom ? { validFrom: input.validFrom } : {}),
    ...(input.validUntil ? { validUntil: input.validUntil } : {}),
    ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
    ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
    ...(input.affiliationCertificateId ? { affiliationCertificateId: input.affiliationCertificateId } : {}),
    ...(input.photos ? { photos: input.photos } : {}),
    ...(input.achievements ? { achievements: input.achievements } : {}),
    ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
    ...(input.alternatePhone ? { alternatePhone: input.alternatePhone } : {}),
    ...(input.website ? { website: input.website } : {}),
    ...(input.facilities ? { facilities: input.facilities } : {}),
    ...(input.coachIds ? { coachIds: input.coachIds } : {}),
    ...(input.batches ? { batches: input.batches } : {}),
    ...(input.beltHistory ? { beltHistory: input.beltHistory } : {}),
    ...(input.clubApprovalStatus ? { clubApprovalStatus: input.clubApprovalStatus } : {}),
    ...(input.coachApprovalStatus ? { coachApprovalStatus: input.coachApprovalStatus } : {}),
    ...(memberType === "Coach" && input.club && !input.club.toLowerCase().includes("independent")
      ? { clubApprovalStatus: input.clubApprovalStatus || "pending" }
      : input.clubApprovalStatus ? { clubApprovalStatus: input.clubApprovalStatus } : {}),
  };

    let resultPlayer = playerObj;
    try {
      await connectToDatabase();
      const created = await PlayerModel.create(playerObj);
      const d = created.toJSON();
      resultPlayer = { ...playerObj, ...d };
    } catch (error) {
      console.warn("MongoDB create note: Saved to persistent storage.", error instanceof Error ? error.message : "");
      const list = await getFilePlayers();
      await saveFilePlayers([playerObj, ...list]);
    }

    if (memberType === "Referee" || id.toUpperCase().startsWith("KSM-RF-") || id.toUpperCase().startsWith("WSF-RF-")) {
      try {
        const { syncRegisteredReferees } = await import("./referees-store");
        await syncRegisteredReferees();
      } catch (refErr) {
        console.warn("Could not sync fresh referee to Referee model:", refErr);
      }
    }

    if (memberType === "StateAssociation" || memberType === "DistrictAssociation") {
      await invalidateAssociationCache();
    }

    return resultPlayer;
  }

export async function updatePlayer(
  id: string,
  updates: Partial<Player> & Record<string, unknown>,
): Promise<Player | null> {
  const cleanId = id.trim();
  const existingPlayer = await getPlayerById(cleanId);
  const updateFields: Record<string, unknown> = { ...updates };

  if (updates.points !== undefined) updateFields.points = Number(updates.points) || 0;
  if (updates.age !== undefined) updateFields.age = Number(updates.age);
  else if (updates.dob) updateFields.age = calculateAge(String(updates.dob));
  if (updates.username !== undefined && typeof updates.username === "string" && updates.username.trim()) {
    const cleanUsername = updates.username.trim().toLowerCase();
    if (!existingPlayer?.username || existingPlayer.username.trim().toLowerCase() !== cleanUsername) {
      const usernameCheck = await isUsernameAlreadyRegistered(cleanUsername, cleanId);
      if (usernameCheck.isRegistered) {
        throw new Error(
          `This username is already taken (${usernameCheck.existingRecord?.memberType || "Member"}: ${usernameCheck.existingRecord?.name}). Please choose a different username.`
        );
      }
    }
    updateFields.username = cleanUsername;
  }
  if (updates.email !== undefined && typeof updates.email === "string" && updates.email.trim()) {
    const cleanEmail = updates.email.trim().toLowerCase();
    if (!existingPlayer?.email || existingPlayer.email.trim().toLowerCase() !== cleanEmail) {
      const emailCheck = await isEmailAlreadyRegistered(cleanEmail, cleanId);
      if (emailCheck.isRegistered) {
        throw new Error(
          `This email address is already registered to another member (${emailCheck.existingRecord?.name}).`
        );
      }
    }
    updateFields.email = cleanEmail;
  }
  if (updates.password && typeof updates.password === "string") {
    updateFields.rawPassword = updates.password;
    if (!updates.password.startsWith("$")) {
      updateFields.password = await hashPassword(updates.password);
    }
  }
  if (updates.academicHistory !== undefined) {
    updateFields.academicHistory = updates.academicHistory;
  }
  if (updates.beltHistory !== undefined) {
    updateFields.beltHistory = updates.beltHistory;
  }

  // Dynamic status transition evaluation for Players
  const mergedForCheck: Partial<Player> = {
    ...(existingPlayer || {}),
    ...updateFields,
  };
  const isPlayer = (mergedForCheck.memberType || "Player") === "Player";
  if (isPlayer && updates.status === undefined) {
    const isComplete = isPlayerProfileComplete(mergedForCheck);
    if (existingPlayer) {
      if (existingPlayer.status === "Incomplete" && isComplete) {
        updateFields.status = "Pending";
      } else if (
        existingPlayer.status !== "Active" &&
        existingPlayer.status !== "Verified" &&
        existingPlayer.status !== "Affiliated" &&
        existingPlayer.status !== "Pending" &&
        !isComplete
      ) {
        updateFields.status = "Incomplete";
      }
    } else {
      updateFields.status = isComplete ? "Pending" : "Incomplete";
    }
  }

  delete updateFields.id;
  delete updateFields._id;
  delete updateFields.__v;
  delete updateFields.createdAt;
  delete updateFields.updatedAt;

  const targetId = existingPlayer?.id || cleanId;

  try {
    await connectToDatabase();
    const d: any = await PlayerModel.findOneAndUpdate(
      {
        $or: [
          { id: { $regex: new RegExp("^" + targetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          { id: { $regex: new RegExp("^" + cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
          ...(updateFields.email ? [{ email: { $regex: new RegExp("^" + String(updateFields.email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } }] : []),
        ],
      },
      { $set: updateFields },
      { returnDocument: "after" },
    ).lean();

    if (d) {
      return {
        id: d.id,
        name: d.name,
        memberType: (d.memberType as MemberType) || "Player",
        discipline: d.discipline as Discipline,
        state: d.state,
        club: d.club,
        age: d.age,
        dob: d.dob,
        gender: d.gender,
        email: d.email,
        username: d.username,
        phone: d.phone,
        password: d.password,
        rawPassword: d.rawPassword,
        coachName: d.coachName,
        idNumber: d.idNumber,
        emergencyContact: d.emergencyContact,
        bloodGroup: d.bloodGroup,
        address: d.address,
        city: d.city,
        pincode: d.pincode,
        beltRank: d.beltRank,
        weightCategory: d.weightCategory,
        bio: d.bio,
        academicHistory: d.academicHistory || [],
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        specialization: d.specialization,
        officiatingGrade: d.officiatingGrade,
        matchesOfficiated: d.matchesOfficiated,
        yearFounded: d.yearFounded,
        registeredAddress: d.registeredAddress,
        presidentName: d.presidentName,
        secretaryName: d.secretaryName,
        memberCount: d.memberCount,
        registrationType: d.registrationType || (updates.registrationType as string) || (d.affiliationDocument ? "Already Affiliated" : "Apply for Affiliation"),
        levelOfAffiliation: d.levelOfAffiliation,
        clubCategory: d.clubCategory,
        affiliationDocument: d.affiliationDocument || d.certificationDocument,
        affiliationDocumentName: d.affiliationDocumentName || d.certificationDocumentName,
        affiliationDocumentSize: d.affiliationDocumentSize || d.certificationDocumentSize,
        certificationDocument: d.certificationDocument || d.affiliationDocument,
        certificationDocumentName: d.certificationDocumentName || d.affiliationDocumentName,
        certificationDocumentSize: d.certificationDocumentSize || d.affiliationDocumentSize,
        logo: d.logo,
        district: d.district || d.city,
        tempStateAssociation: d.tempStateAssociation,
        tempDistrictAssociation: d.tempDistrictAssociation,
        disciplines: d.disciplines || [],
        headCoachName: d.headCoachName,
        timings: d.timings,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        affiliationCertificateId: d.affiliationCertificateId,
        photos: d.photos || [],
        achievements: d.achievements || [],
        contactPerson: d.contactPerson,
        alternatePhone: d.alternatePhone,
        website: d.website,
        facilities: d.facilities || [],
        coachIds: d.coachIds || (updates.coachIds as string[]) || [],
        batches: d.batches || (updates.batches as BatchScheduleEntry[]) || [],
        beltHistory: d.beltHistory || (updates.beltHistory as BeltHistoryEntry[]) || [],
        clubApprovalStatus: d.clubApprovalStatus,
        coachApprovalStatus: d.coachApprovalStatus,
        rank: d.rank,
        points: d.points,
        medals: d.medals || { gold: 0, silver: 0, bronze: 0 },
        status: d.status,
        image: d.image,
        registeredOn: d.registeredOn,
        level: d.level || (updateFields as any).level,
      };
    }
  } catch {
    // Fallback to local file
  }

  const fileList = await getFilePlayers();
  let index = fileList.findIndex(
    (p) =>
      p.id.toLowerCase() === targetId.toLowerCase() ||
      p.id.toLowerCase() === cleanId.toLowerCase() ||
      (updateFields.email && p.email && p.email.toLowerCase() === String(updateFields.email).toLowerCase())
  );
  if (index === -1) {
    const seed = PLAYERS.find(
      (p) =>
        p.id.toLowerCase() === targetId.toLowerCase() ||
        p.id.toLowerCase() === cleanId.toLowerCase()
    );
    if (seed) {
      fileList.push(seed);
      index = fileList.length - 1;
    } else {
      return null;
    }
  }

  const existing = fileList[index];
  const updatedPlayer: Player = {
    ...existing,
    ...updateFields,
    id: existing.id,
    coachIds: (updateFields.coachIds as string[]) || existing.coachIds || [],
    batches: (updateFields.batches as BatchScheduleEntry[]) || existing.batches || [],
    beltHistory: (updateFields.beltHistory as BeltHistoryEntry[]) || existing.beltHistory || [],
    medals: (updateFields.medals as any) || existing.medals || { gold: 0, silver: 0, bronze: 0 },
    status: (updateFields.status as any) || existing.status,
    discipline: (updateFields.discipline as Discipline) || existing.discipline,
    academicHistory: (updateFields.academicHistory as any) || existing.academicHistory || [],
  };

  fileList[index] = updatedPlayer;
  await saveFilePlayers(fileList);

  // Synchronize relevant profile updates to corresponding ID Card(s)
  try {
    const idCardUpdates: Record<string, any> = {};
    if (updateFields.bloodGroup !== undefined) idCardUpdates.bloodGroup = updateFields.bloodGroup || "";
    if (updateFields.name) idCardUpdates.holderName = updateFields.name;
    if (updateFields.image || updateFields.logo) idCardUpdates.holderPhoto = updateFields.logo || updateFields.image;
    if (updateFields.dob) idCardUpdates.dob = updateFields.dob;
    if (updateFields.phone) idCardUpdates.phone = updateFields.phone;
    if (updateFields.email) idCardUpdates.email = updateFields.email;
    if (updateFields.emergencyContact) idCardUpdates.emergencyContact = updateFields.emergencyContact;
    if (updateFields.state) idCardUpdates.state = updateFields.state;
    if (updateFields.city || updateFields.district) idCardUpdates.district = updateFields.city || updateFields.district;
    if (updateFields.beltRank) idCardUpdates.beltRank = updateFields.beltRank;
    if (updateFields.club) idCardUpdates.academyName = updateFields.club;
    if (updateFields.level) idCardUpdates.refereeLevel = updateFields.level;

    if (Object.keys(idCardUpdates).length > 0) {
      const { updateIdCardByMemberId } = await import("./id-cards-store");
      await updateIdCardByMemberId(targetId, idCardUpdates);
      if (cleanId.toLowerCase() !== targetId.toLowerCase()) {
        await updateIdCardByMemberId(cleanId, idCardUpdates);
      }
    }
  } catch (syncErr) {
    console.warn("Could not sync player updates to ID cards:", syncErr);
  }

  // Synchronize referee profile updates directly to RefereeModel
  if (
    existingPlayer?.memberType === "Referee" ||
    targetId.toUpperCase().startsWith("KSM-RF-") ||
    targetId.toUpperCase().startsWith("WSF-RF-") ||
    cleanId.toUpperCase().startsWith("KSM-RF-") ||
    cleanId.toUpperCase().startsWith("WSF-RF-") ||
    (updateFields.memberType as string) === "Referee"
  ) {
    try {
      const { updateReferee } = await import("./referees-store");
      const refUpdates: Record<string, any> = {};
      if (updateFields.level || updateFields.officiatingGrade) {
        refUpdates.level = normalizeRefereeLevel((updateFields.level as string) || (updateFields.officiatingGrade as string));
      }
      if (updateFields.beltRank || (updateFields as any).currentRank) {
        refUpdates.currentRank = (updateFields.beltRank as string) || ((updateFields as any).currentRank as string);
      }
      if (updateFields.name) refUpdates.name = updateFields.name;
      if (updateFields.email) refUpdates.email = updateFields.email;
      if (updateFields.phone) refUpdates.phone = updateFields.phone;
      if (updateFields.state) refUpdates.state = updateFields.state;
      if (updateFields.city || updateFields.district) refUpdates.district = updateFields.city || updateFields.district;
      if (updateFields.club) refUpdates.academy = updateFields.club;
      if (updateFields.specialization) refUpdates.specialization = updateFields.specialization;
      if (updateFields.experienceYears !== undefined) refUpdates.martialArtsExperience = `${updateFields.experienceYears} Years`;
      if (updateFields.matchesOfficiated !== undefined) refUpdates.matchesOfficiated = Number(updateFields.matchesOfficiated);
      if (updateFields.image) refUpdates.photo = updateFields.image;
      if (updateFields.dob) refUpdates.dob = updateFields.dob;
      if (updateFields.gender) refUpdates.gender = updateFields.gender;
      if (updateFields.address) refUpdates.address = updateFields.address;
      if (updateFields.pincode) refUpdates.pincode = updateFields.pincode;
      if (updateFields.emergencyContact) refUpdates.emergencyContact = updateFields.emergencyContact;
      if (updateFields.bloodGroup) refUpdates.bloodGroup = updateFields.bloodGroup;
      if (updateFields.bio) refUpdates.bio = updateFields.bio;
      if (updateFields.affiliationDocument || (updateFields as any).certificationDocument) {
        refUpdates.certificationDocument = updateFields.affiliationDocument || (updateFields as any).certificationDocument;
      }
      if (updateFields.affiliationDocumentName || (updateFields as any).certificationDocumentName) {
        refUpdates.certificationDocumentName = updateFields.affiliationDocumentName || (updateFields as any).certificationDocumentName;
      }
      if (updateFields.affiliationDocumentSize || (updateFields as any).certificationDocumentSize) {
        refUpdates.certificationDocumentSize = updateFields.affiliationDocumentSize || (updateFields as any).certificationDocumentSize;
      }

      if (Object.keys(refUpdates).length > 0) {
        await updateReferee(targetId, refUpdates);
      }
    } catch (refErr) {
      console.warn("Could not sync player updates to Referee model:", refErr);
    }
  }

  await invalidateAssociationCache();
  return updatedPlayer;
}

export async function promotePlayerBelt(
  playerId: string,
  promotion: BeltHistoryEntry
): Promise<Player | null> {
  const cleanId = playerId.trim();
  const player = await getPlayerById(cleanId);
  if (!player) return null;

  const existingHistory = player.beltHistory || [];
  const nextHistory = [
    ...existingHistory.filter((h) => h.certificateNumber !== promotion.certificateNumber),
    promotion,
  ];

  return await updatePlayer(cleanId, {
    beltRank: promotion.belt,
    beltHistory: nextHistory,
  });
}

export async function deletePlayer(id: string): Promise<boolean> {
  const cleanId = (id || "").trim();
  if (!cleanId) return false;

  // 1. Retrieve existing player/member to capture all associated IDs and metadata
  let existing: Player | null = null;
  try {
    existing = await getPlayerById(cleanId);
  } catch {}

  const idsToDelete = new Set<string>();
  idsToDelete.add(cleanId.toLowerCase());
  if (existing) {
    if (existing.id) idsToDelete.add(existing.id.toLowerCase());
    if (existing.idNumber) idsToDelete.add(existing.idNumber.toLowerCase());
    if (existing.affiliationCertificateId) idsToDelete.add(existing.affiliationCertificateId.toLowerCase());
  }

  // 2. Delete matching documents from PlayerModel in MongoDB
  let deletedFromMongo = false;
  try {
    await connectToDatabase();
    const orClauses: any[] = [];
    idsToDelete.forEach((ident) => {
      const escaped = ident.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      orClauses.push({ id: { $regex: new RegExp(`^${escaped}$`, "i") } });
      orClauses.push({ idNumber: { $regex: new RegExp(`^${escaped}$`, "i") } });
    });
    if (existing?.email) {
      orClauses.push({ email: existing.email.toLowerCase() });
    }
    const res = await PlayerModel.deleteMany({ $or: orClauses });
    deletedFromMongo = (res?.deletedCount ?? 0) > 0;
  } catch (err) {
    console.warn("MongoDB deletePlayer error:", err);
  }

  // 3. Remove from local players.json fallback
  let deletedFromFile = false;
  try {
    const fileList = await getFilePlayers();
    const nextList = fileList.filter(
      (p) =>
        !idsToDelete.has(p.id.toLowerCase()) &&
        (!p.idNumber || !idsToDelete.has(p.idNumber.toLowerCase())) &&
        (!existing?.email || p.email?.toLowerCase() !== existing.email.toLowerCase())
    );
    if (nextList.length !== fileList.length) {
      await saveFilePlayers(nextList);
      deletedFromFile = true;
    }
  } catch (fileErr) {
    console.warn("deletePlayer file storage error:", fileErr);
  }

  // 4. Cascade delete associated ID Card from registry
  try {
    const { deleteIdCard } = await import("./id-cards-store");
    for (const ident of idsToDelete) {
      await deleteIdCard(ident);
    }
  } catch (idErr) {
    console.warn("Cascade ID card deletion note:", idErr);
  }

  // 5. Cascade delete associated Club Affiliation Certificate or Athlete/Coach Certificates
  try {
    const { deleteCertificate } = await import("./certificates-store");
    const { CertificateModel } = await import("@/models/Certificate");
    if (existing?.affiliationCertificateId) {
      await deleteCertificate(existing.affiliationCertificateId);
    }
    for (const ident of idsToDelete) {
      await deleteCertificate(ident);
    }
    // Clean up certificates by kalawarId in MongoDB
    try {
      await connectToDatabase();
      const certOrs: any[] = [];
      idsToDelete.forEach((ident) => {
        const escaped = ident.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        certOrs.push({ kalawarId: { $regex: new RegExp(`^${escaped}$`, "i") } });
        certOrs.push({ number: { $regex: new RegExp(`^${escaped}$`, "i") } });
      });
      await CertificateModel.deleteMany({ $or: certOrs });
    } catch {}
  } catch (certErr) {
    console.warn("Cascade certificate deletion note:", certErr);
  }

  // 6. Cascade delete from Referee registry if entity is a Referee
  if (
    existing?.memberType === "Referee" ||
    cleanId.toUpperCase().startsWith("KSM-RF-") ||
    cleanId.toUpperCase().startsWith("WSF-RF-") ||
    (existing?.id && (existing.id.toUpperCase().startsWith("KSM-RF-") || existing.id.toUpperCase().startsWith("WSF-RF-")))
  ) {
    try {
      const { RefereeModel } = await import("@/models/Referee");
      await connectToDatabase();
      const refOrs: any[] = [];
      idsToDelete.forEach((ident) => {
        const escaped = ident.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        refOrs.push({ id: { $regex: new RegExp(`^${escaped}$`, "i") } });
        refOrs.push({ kalawarId: { $regex: new RegExp(`^${escaped}$`, "i") } });
      });
      if (existing?.email) {
        refOrs.push({ email: existing.email.toLowerCase() });
      }
      await RefereeModel.deleteMany({ $or: refOrs });
    } catch (refErr) {
      console.warn("Cascade referee deletion note:", refErr);
    }
  }

  await invalidateAssociationCache();
  return deletedFromMongo || deletedFromFile;
}
