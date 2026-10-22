import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { RefereeModel } from "@/models/Referee";
export * from "@/types/referee";
import {
  normalizeRefereeLevel,
  type RefereeItem,
  type CreateRefereeInput,
  type DutyAppointment,
  type RefereeStatus,
  type RefereeLevel,
} from "@/types/referee";
import { getPlayers } from "./players-store";

const SEED_REFEREES: RefereeItem[] = [
  {
    id: "KAC-REF-2026-001",
    name: "Santosh Kasabe",
    dob: "1980-05-15",
    gender: "Male",
    email: "santosh.kasabe@kalawarfederation.org",
    phone: "7083314435",
    state: "Maharashtra",
    district: "Pune",
    academy: "KALAWAR National Hombu Dojo",
    kalawarId: "KAC-OFF-001",
    currentRank: "7th Dan Black Belt",
    martialArtsExperience: "25+ Years",
    level: "International / Chief Referee",
    status: "Active",
    licenseNumber: "KAC-ACT-REF-2026-001",
    licenseIssuedDate: "2026-01-01T00:00:00.000Z",
    licenseValidUntil: "2028-12-31T23:59:59.000Z",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    documents: [],
    previousCertificates: ["National Chief Referee Diploma 2024", "Asian Martial Arts Technical Delegate"],
    bio: "Founder & President – India, Head of Technical Committee. Over 25 years of international tournament adjudication.",
    matchesOfficiated: 450,
    trainingRecords: [
      {
        id: "TRN-001",
        seminarName: "All-India National Referee Standards Clinic 2026",
        date: "2026-01-10",
        trainerName: "Grandmaster S. Kasabe",
        hours: 16,
        location: "Pune, Maharashtra",
        status: "Completed",
      },
    ],
    examRecords: [
      {
        id: "EX-001",
        examType: "Theory",
        score: 50,
        maxScore: 50,
        date: "2026-01-10",
        examiner: "Technical Committee Board",
        result: "Passed",
        remarks: "Mastery of World & National Statutory Competition Rules",
      },
      {
        id: "EX-002",
        examType: "Practical",
        score: 50,
        maxScore: 50,
        date: "2026-01-10",
        examiner: "Technical Committee Board",
        result: "Passed",
      },
    ],
    dutyAppointments: [
      {
        id: "DUTY-001",
        championshipId: "EVT-2026-001",
        championshipName: "KALAWAR National Martial Arts Championship 2026",
        eventDate: "2026-03-20",
        location: "Balewadi Stadium, Pune",
        ringOrMatNumber: "Center Mat 1",
        position: "Chief Referee",
        appointedBy: "National Executive Board",
        appointedAt: "2026-01-15T00:00:00.000Z",
        status: "Confirmed",
        performanceRating: 5,
        performanceNotes: "Exemplary adjudication and fair dispute resolution.",
      },
    ],
    evaluations: [
      {
        id: "EV-001",
        date: "2026-01-10",
        evaluator: "Technical Committee Board",
        score: 100,
        category: "Rules & Decorum",
        remarks: "Supreme Adjudicator & Chief Examiner.",
      },
    ],
    internalNotes: "Head of Technical Committee. Permanent Master License.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "KAC-REF-2026-002",
    name: "Vikram R. Deshmukh",
    dob: "1988-08-22",
    gender: "Male",
    email: "vikram.deshmukh@example.com",
    phone: "9822014455",
    state: "Maharashtra",
    district: "Mumbai",
    academy: "Shivaji Martial Arts Club",
    kalawarId: "KAC-PL-2026-1044",
    currentRank: "4th Dan Black Belt",
    martialArtsExperience: "14 Years",
    level: "Level 3 – National Referee",
    status: "Active",
    licenseNumber: "KAC-ACT-REF-2026-002",
    licenseIssuedDate: "2026-01-15T00:00:00.000Z",
    licenseValidUntil: "2027-12-31T23:59:59.000Z",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    documents: [],
    previousCertificates: ["State Referee Class A 2024"],
    bio: "Senior National Referee with deep expertise in Kumite and Kata scoring.",
    matchesOfficiated: 185,
    trainingRecords: [
      {
        id: "TRN-002",
        seminarName: "National Referee Certification Workshop 2026",
        date: "2026-01-12",
        trainerName: "Mr. Santosh Kasbe",
        hours: 12,
        status: "Completed",
      },
    ],
    examRecords: [
      {
        id: "EX-003",
        examType: "Theory",
        score: 47,
        maxScore: 50,
        date: "2026-01-12",
        examiner: "Mr. Santosh Kasbe",
        result: "Passed",
      },
      {
        id: "EX-004",
        examType: "Practical",
        score: 48,
        maxScore: 50,
        date: "2026-01-12",
        examiner: "Mr. Santosh Kasbe",
        result: "Passed",
      },
    ],
    dutyAppointments: [
      {
        id: "DUTY-002",
        championshipId: "EVT-2026-001",
        championshipName: "KALAWAR National Martial Arts Championship 2026",
        eventDate: "2026-03-20",
        location: "Balewadi Stadium, Pune",
        ringOrMatNumber: "Mat 2",
        position: "Mat / Ring Referee",
        appointedBy: "Technical Committee",
        appointedAt: "2026-01-20T00:00:00.000Z",
        status: "Confirmed",
        performanceRating: 5,
      },
    ],
    evaluations: [],
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "KAC-REF-2026-003",
    name: "Pooja K. Sharma",
    dob: "1994-11-04",
    gender: "Female",
    email: "pooja.sharma@example.com",
    phone: "9871144332",
    state: "Delhi",
    district: "New Delhi",
    academy: "Tiger Claw Martial Academy",
    kalawarId: "KAC-PL-2026-3081",
    currentRank: "3rd Dan Black Belt",
    martialArtsExperience: "9 Years",
    level: "Level 2 – State Referee",
    status: "Active",
    licenseNumber: "KAC-ACT-REF-2026-003",
    licenseIssuedDate: "2026-02-01T00:00:00.000Z",
    licenseValidUntil: "2027-12-31T23:59:59.000Z",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
    certificationDocument: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80",
    certificationDocumentName: "Delhi_State_Referee_Credential_2024.pdf",
    certificationDocumentSize: "1.42 MB",
    documents: [],
    previousCertificates: ["Delhi State Official Badge"],
    bio: "State Official specializing in Cadet & Junior tournament ring control.",
    matchesOfficiated: 92,
    trainingRecords: [],
    examRecords: [
      {
        id: "EX-005",
        examType: "Theory",
        score: 44,
        maxScore: 50,
        date: "2026-01-25",
        examiner: "Technical Committee",
        result: "Passed",
      },
    ],
    dutyAppointments: [],
    evaluations: [],
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "KAC-REF-2026-004",
    name: "Arunachalam Murugan",
    dob: "1986-04-12",
    gender: "Male",
    email: "arun.murugan@tn-martialarts.in",
    phone: "9840155231",
    state: "Tamil Nadu",
    district: "Chennai",
    discipline: "Kalawar Martial Arts",
    academy: "Chola Martial Arts Academy",
    kalawarId: "KAC-PL-2026-8921",
    currentRank: "3rd Dan Black Belt",
    martialArtsExperience: "11 Years",
    level: "Level 3 – National Referee",
    status: "Application Submitted",
    photo: "",
    certificationDocument: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&auto=format&fit=crop&q=80",
    certificationDocumentName: "National_Ref_Accreditation_Proof_Murugan.pdf",
    certificationDocumentSize: "1.85 MB",
    specialization: "Chief Mat Referee & Jury Arbitrator",
    emergencyContact: "9840155230",
    bloodGroup: "O+",
    address: "Plot 42, Anna Nagar West, Chennai",
    pincode: "600040",
    documents: [],
    previousCertificates: ["South India State Adjudicator 2023", "3rd Dan Black Belt Diploma"],
    bio: "Established senior referee with 11+ years officiating experience in South Zone championships.",
    matchesOfficiated: 140,
    trainingRecords: [],
    examRecords: [],
    dutyAppointments: [],
    evaluations: [],
    internalNotes: "Incoming application from established South India Chief Referee. Dan Diploma and credential proof attached.",
    createdAt: "2026-03-01T09:30:00.000Z",
    updatedAt: "2026-03-01T09:30:00.000Z",
  },
  {
    id: "KAC-REF-2026-005",
    name: "Meenakshi Sundaram",
    dob: "1992-09-18",
    gender: "Female",
    email: "meenakshi.sundaram@kerala-sports.org",
    phone: "9447123987",
    state: "Kerala",
    district: "Ernakulam",
    discipline: "Kalawar Martial Arts",
    academy: "Cochin Martial Club",
    kalawarId: "KAC-PL-2026-4402",
    currentRank: "2nd Dan Black Belt",
    martialArtsExperience: "7 Years",
    level: "Level 2 – State Referee",
    status: "Under Verification",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    certificationDocument: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80",
    certificationDocumentName: "Kerala_State_Ref_Credentials_2025.jpg",
    certificationDocumentSize: "920 KB",
    specialization: "Mat / Ring Referee",
    emergencyContact: "9447123980",
    bloodGroup: "B+",
    address: "22/4B MG Road, Kochi",
    pincode: "682016",
    documents: [],
    previousCertificates: ["Kerala State Martial Arts Federation Class B"],
    bio: "Experienced ring referee for Cadet and Junior state bouts.",
    matchesOfficiated: 64,
    trainingRecords: [],
    examRecords: [],
    dutyAppointments: [],
    evaluations: [],
    internalNotes: "Credential verification in progress with Kerala State Association.",
    createdAt: "2026-03-03T11:15:00.000Z",
    updatedAt: "2026-03-03T11:15:00.000Z",
  },
  {
    id: "KAC-REF-2026-006",
    name: "Gurpreet Singh Gill",
    dob: "1989-12-05",
    gender: "Male",
    email: "gurpreet.gill@punjab-martialarts.in",
    phone: "9814022881",
    state: "Punjab",
    district: "Ludhiana",
    discipline: "Kalawar Martial Arts",
    academy: "Sher-e-Punjab Akhada",
    kalawarId: "KAC-PL-2026-6619",
    currentRank: "2nd Dan Black Belt",
    martialArtsExperience: "8 Years",
    level: "Level 2 – State Referee",
    status: "Training Required",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
    certificationDocument: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&auto=format&fit=crop&q=80",
    certificationDocumentName: "Punjab_BlackBelt_Certificate_Gill.pdf",
    certificationDocumentSize: "1.12 MB",
    specialization: "Corner Judge & Scorekeeper",
    emergencyContact: "9814022880",
    bloodGroup: "A+",
    address: "GT Road, Near Clock Tower, Ludhiana",
    pincode: "141001",
    documents: [],
    previousCertificates: ["North Zone Referee Seminar Attendee"],
    bio: "Aspiring State Official with extensive tournament judging background.",
    matchesOfficiated: 48,
    trainingRecords: [],
    examRecords: [],
    dutyAppointments: [],
    evaluations: [],
    internalNotes: "Nominated for next Technical Committee Refresher Clinic.",
    createdAt: "2026-03-05T14:20:00.000Z",
    updatedAt: "2026-03-05T14:20:00.000Z",
  },
];

let cachedReferees: RefereeItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "referees.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "referees.json");

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

function SEED_REFEREE_DATA(): RefereeItem[] {
  return [];
}

export async function getFileReferees(): Promise<RefereeItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) {
      cachedReferees = [];
      return [];
    }
    const parsed = JSON.parse(raw) as RefereeItem[];
    cachedReferees = parsed;
    return parsed;
  } catch {
    return cachedReferees;
  }
}

export async function saveFileReferees(items: RefereeItem[]): Promise<void> {
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
    console.warn("Could not save to referees.json fallback:", error instanceof Error ? error.message : "");
  }
}

export async function generateNextRefereeId(): Promise<string> {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^KAC-REF-${year}-(\\d+)$`, "i");
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await RefereeModel.find({ id: { $regex: new RegExp(`^KAC-REF-${year}-\\d+$`, "i") } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    // fallback
  }

  const fileList = await getFileReferees();
  for (const item of fileList) {
    const match = item.id.match(regex) || item.id.match(/^REF-(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highestNum) highestNum = num;
    }
  }

  const nextNum = String(highestNum + 1).padStart(3, "0");
  return `KAC-REF-${year}-${nextNum}`;
}

export async function generateNextLicenseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^KAC-ACT-REF-${year}-(\\d+)$`, "i");
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await RefereeModel.find({ licenseNumber: { $regex: new RegExp(`^KAC-ACT-REF-${year}-\\d+$`, "i") } }, "licenseNumber").lean();
    for (const doc of docs) {
      if (doc.licenseNumber) {
        const match = doc.licenseNumber.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > highestNum) highestNum = num;
        }
      }
    }
  } catch {
    // fallback
  }

  const fileList = await getFileReferees();
  for (const item of fileList) {
    if (item.licenseNumber) {
      const match = item.licenseNumber.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = String(highestNum + 1).padStart(3, "0");
  return `KAC-ACT-REF-${year}-${nextNum}`;
}

export async function syncRegisteredReferees(): Promise<void> {
  try {
    let mongoReferees: RefereeItem[] = [];
    try {
      await connectToDatabase();
      const docs = await RefereeModel.find().lean();
      if (docs && docs.length > 0) {
        mongoReferees = docs.map((d: any) => sanitizeRefereeDoc(d));
      }
    } catch {
      // ignore
    }

    const [players, fileReferees] = await Promise.all([
      getPlayers().catch(() => []),
      getFileReferees().catch(() => []),
    ]);

    // Build master referee map starting with MongoDB (source of truth on live)
    // and falling back to fileReferees
    const masterList = mongoReferees.length > 0 ? mongoReferees : fileReferees;
    const refereeMap = new Map<string, RefereeItem>();
    masterList.forEach((r) => refereeMap.set(r.id.toLowerCase(), r));

    const emailMap = new Map<string, RefereeItem>();
    masterList.forEach((r) => {
      if (r.email) emailMap.set(r.email.trim().toLowerCase(), r);
    });

    const phoneMap = new Map<string, RefereeItem>();
    masterList.forEach((r) => {
      if (r.phone) {
        const cleanPhone = r.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 10) phoneMap.set(cleanPhone.slice(-10), r);
      }
    });

    const kalawarIdMap = new Map<string, RefereeItem>();
    masterList.forEach((r) => {
      if (r.kalawarId) kalawarIdMap.set(r.kalawarId.trim().toLowerCase(), r);
    });

    // Scan players registered with memberType === "Referee" or KSM-RF- / WSF-RF- id
    const refereePlayers = players.filter(
      (p) => p.memberType === "Referee" || (p.id && (p.id.toUpperCase().startsWith("KSM-RF-") || p.id.toUpperCase().startsWith("WSF-RF-")))
    );

    for (const p of refereePlayers) {
      const cleanPlayerPhone = (p.phone || "").replace(/\D/g, "");
      const last10 = cleanPlayerPhone.length >= 10 ? cleanPlayerPhone.slice(-10) : "";
      const cleanEmail = (p.email || "").trim().toLowerCase();

      const existing =
        refereeMap.get(p.id.toLowerCase()) ||
        (p.id ? kalawarIdMap.get(p.id.toLowerCase()) : undefined) ||
        (cleanEmail ? emailMap.get(cleanEmail) : undefined) ||
        (last10 ? phoneMap.get(last10) : undefined);

      if (!existing) {
        // Fresh applicant: create initial referee official record
        const cleanRank =
          p.beltRank && p.beltRank.toUpperCase() !== "NONE" && p.beltRank.trim() !== ""
            ? p.beltRank
            : "None / Unranked";

        const pLevel = normalizeRefereeLevel(
          (p as any).level ||
          p.officiatingGrade ||
          ((p as any).designation ? (
            (p as any).designation.toLowerCase().includes("national") || (p as any).designation.toLowerCase().includes("level 3")
              ? "Level 3 – National Referee"
              : (p as any).designation.toLowerCase().includes("state") || (p as any).designation.toLowerCase().includes("level 2")
              ? "Level 2 – State Referee"
              : (p as any).designation.toLowerCase().includes("junior") || (p as any).designation.toLowerCase().includes("level 1")
              ? "Level 1 – Junior Referee"
              : "Level 0 – Trainee Referee"
          ) : "Level 0 – Trainee Referee")
        );

        const aadhaar = (p as any).aadhaarDoc || (p as any).idProofDoc || (p as any).idProof || "";
        const aadhaarName = (p as any).aadhaarDocName || (p as any).idProofDocName || (aadhaar ? "Government_ID_Proof.pdf" : "");
        const aadhaarSize = (p as any).aadhaarDocSize || (p as any).idProofDocSize || "";

        const newRef: RefereeItem = {
          id: p.id,
          name: p.name,
          dob: p.dob || "",
          gender: (p.gender as any) || "Male",
          email: (p.email || "").toLowerCase(),
          phone: p.phone || "",
          state: p.state || "National",
          district: p.district || p.city || "",
          tempStateAssociation: p.tempStateAssociation || "",
          tempDistrictAssociation: p.tempDistrictAssociation || "",
          discipline: p.discipline || "Kalawar Martial Arts",
          academy: p.club || "Independent",
          kalawarId: p.id,
          currentRank: cleanRank,
          martialArtsExperience: p.experienceYears ? `${p.experienceYears} Years` : "Registered Official",
          level: pLevel,
          status: p.status === "Active" ? "Active" : (p.status === "Pending" ? "Pending" : "Application Submitted"),
          licenseNumber: (p as any).licenseNumber || "",
          licenseIssuedDate: (p as any).licenseIssuedDate || "",
          licenseValidUntil: (p as any).licenseValidUntil || "",
          photo: p.image || "",
          certificationDocument: (p as any).certificationDocument || (p as any).affiliationDocument || "",
          certificationDocumentName: (p as any).certificationDocumentName || (p as any).affiliationDocumentName || "",
          certificationDocumentSize: (p as any).certificationDocumentSize || (p as any).affiliationDocumentSize || "",
          aadhaarDoc: aadhaar,
          aadhaarDocName: aadhaarName,
          aadhaarDocSize: aadhaarSize,
          specialization: (p as any).specialization || "",
          emergencyContact: p.emergencyContact || "",
          bloodGroup: p.bloodGroup || "",
          address: p.address || "",
          pincode: p.pincode || "",
          documents: aadhaar ? [aadhaar] : [],
          previousCertificates: [],
          bio: p.bio || "",
          matchesOfficiated: Number(p.matchesOfficiated) || 0,
          trainingRecords: [],
          examRecords: [],
          dutyAppointments: [],
          evaluations: [],
          internalNotes: "Registered via Member Portal.",
          createdAt: (p as any).registeredOn ? new Date((p as any).registeredOn).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        refereeMap.set(newRef.id.toLowerCase(), newRef);
        if (newRef.email) emailMap.set(newRef.email.toLowerCase(), newRef);
        if (newRef.kalawarId) kalawarIdMap.set(newRef.kalawarId.toLowerCase(), newRef);

        try {
          await connectToDatabase();
          await RefereeModel.findOneAndUpdate(
            { id: { $regex: new RegExp("^" + newRef.id.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
            { $set: newRef },
            { upsert: true, returnDocument: "after" }
          );
        } catch {
          // ignore
        }
      } else {
        // Existing referee record: sync updated profile fields if present
        let changed = false;
        if (p.image && existing.photo !== p.image) {
          existing.photo = p.image;
          changed = true;
        }
        if (p.name && existing.name !== p.name) {
          existing.name = p.name;
          changed = true;
        }
        if (p.phone && existing.phone !== p.phone) {
          existing.phone = p.phone;
          changed = true;
        }
        if (p.id && existing.kalawarId !== p.id) {
          existing.kalawarId = p.id;
          changed = true;
        }
        if (p.state && existing.state !== p.state) {
          existing.state = p.state;
          changed = true;
        }
        if (p.district && existing.district !== p.district) {
          existing.district = p.district;
          changed = true;
        }
        if (p.club && existing.academy !== p.club) {
          existing.academy = p.club;
          changed = true;
        }
        if (p.beltRank && p.beltRank.toUpperCase() !== "NONE" && p.beltRank.trim() !== "" && existing.currentRank !== p.beltRank) {
          existing.currentRank = p.beltRank;
          changed = true;
        }
        const resolvedPlayerLevel = normalizeRefereeLevel((p as any).level || p.officiatingGrade || (p as any).designation);
        if (resolvedPlayerLevel && resolvedPlayerLevel !== "Level 0 – Trainee Referee" && existing.level !== resolvedPlayerLevel) {
          existing.level = resolvedPlayerLevel;
          changed = true;
        }
        if ((p as any).specialization && existing.specialization !== (p as any).specialization) {
          existing.specialization = (p as any).specialization;
          changed = true;
        }
        const docProof = (p as any).certificationDocument || (p as any).affiliationDocument;
        const docName = (p as any).certificationDocumentName || (p as any).affiliationDocumentName;
        const docSize = (p as any).certificationDocumentSize || (p as any).affiliationDocumentSize;
        if (docProof && existing.certificationDocument !== docProof) {
          existing.certificationDocument = docProof;
          if (docName) existing.certificationDocumentName = docName;
          if (docSize) existing.certificationDocumentSize = docSize;
          changed = true;
        }

        const aadhaarProof = (p as any).aadhaarDoc || (p as any).idProofDoc || (p as any).idProof;
        const aadhaarName = (p as any).aadhaarDocName || (p as any).idProofDocName;
        const aadhaarSize = (p as any).aadhaarDocSize || (p as any).idProofDocSize;
        if (aadhaarProof && existing.aadhaarDoc !== aadhaarProof) {
          existing.aadhaarDoc = aadhaarProof;
          if (aadhaarName) existing.aadhaarDocName = aadhaarName;
          if (aadhaarSize) existing.aadhaarDocSize = aadhaarSize;
          if (!existing.documents || existing.documents.length === 0) {
            existing.documents = [aadhaarProof];
          }
          changed = true;
        }

        if (p.status === "Active" && existing.status !== "Active") {
          existing.status = "Active";
          changed = true;
        }

        if (changed) {
          existing.updatedAt = new Date().toISOString();
          try {
            await connectToDatabase();
            await RefereeModel.findOneAndUpdate(
              { id: { $regex: new RegExp("^" + existing.id.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } },
              { $set: existing },
              { upsert: true, returnDocument: "after" }
            );
          } catch {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    console.warn("syncRegisteredReferees warning:", err);
  }
}

/**
 * Deduplicates referee records to guarantee 1 applicant = 1 record.
 * Prioritizes canonical official IDs (KAC-REF-2026-XXX) and merges latest applicant data.
 */
export function deduplicateRefereesList(list: RefereeItem[]): RefereeItem[] {
  const seenIds = new Set<string>();
  const emailToReferee = new Map<string, RefereeItem>();
  const phoneToReferee = new Map<string, RefereeItem>();
  const kalawarIdToReferee = new Map<string, RefereeItem>();
  const result: RefereeItem[] = [];

  for (const item of list) {
    const cleanEmail = (item.email || "").trim().toLowerCase();
    const cleanPhone = (item.phone || "").replace(/\D/g, "");
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : "";
    const cleanKalawarId = (item.kalawarId || "").trim().toLowerCase();

    // Check if we already have an entry for this applicant
    const existing =
      (cleanEmail ? emailToReferee.get(cleanEmail) : undefined) ||
      (last10 ? phoneToReferee.get(last10) : undefined) ||
      (cleanKalawarId ? kalawarIdToReferee.get(cleanKalawarId) : undefined);

    if (existing) {
      const idx = result.indexOf(existing);
      if (idx !== -1) {
        // Determine canonical ID (prefer KAC-REF- over KSM-RF- / WSF-RF-)
        const itemIsOfficial = item.id.toUpperCase().startsWith("KAC-REF-");
        const existingIsOfficial = existing.id.toUpperCase().startsWith("KAC-REF-");
        const canonicalId = itemIsOfficial ? item.id : existing.id;
        const kalawarId = item.kalawarId || existing.kalawarId || (item.id.startsWith("KSM-") || item.id.startsWith("WSF-") ? item.id : existing.id);

        // Overwrite fields preferring latest/most complete values
        const merged: RefereeItem = {
          ...existing,
          ...item,
          id: canonicalId,
          name: item.name || existing.name,
          currentRank: item.currentRank && item.currentRank !== "None / Unranked" ? item.currentRank : existing.currentRank,
          level: item.level && item.level !== "Level 0 – Trainee Referee" ? item.level : existing.level,
          state: item.state && item.state !== "National" ? item.state : existing.state,
          district: item.district || existing.district,
          academy: item.academy || existing.academy,
          photo: item.photo || existing.photo || "",
          certificationDocument: item.certificationDocument || existing.certificationDocument || "",
          certificationDocumentName: item.certificationDocumentName || existing.certificationDocumentName || "",
          certificationDocumentSize: item.certificationDocumentSize || existing.certificationDocumentSize || "",
          aadhaarDoc: item.aadhaarDoc || existing.aadhaarDoc || "",
          aadhaarDocName: item.aadhaarDocName || existing.aadhaarDocName || "",
          aadhaarDocSize: item.aadhaarDocSize || existing.aadhaarDocSize || "",
          kalawarId,
          status: existing.status === "Active" || item.status === "Active" ? "Active" : item.status || existing.status,
          updatedAt: item.updatedAt || existing.updatedAt || new Date().toISOString(),
        };

        result[idx] = merged;
        if (cleanEmail) emailToReferee.set(cleanEmail, merged);
        if (last10) phoneToReferee.set(last10, merged);
        if (cleanKalawarId) kalawarIdToReferee.set(cleanKalawarId, merged);
        seenIds.delete(existing.id.toLowerCase());
        seenIds.add(merged.id.toLowerCase());

        // Clean up any non-canonical duplicate ID from MongoDB in the background
        const duplicateIdToDelete =
          itemIsOfficial && !existingIsOfficial
            ? existing.id
            : !itemIsOfficial && existingIsOfficial
            ? item.id
            : item.id !== existing.id
            ? item.id
            : null;
        if (duplicateIdToDelete) {
          connectToDatabase()
            .then(() => RefereeModel.deleteOne({ id: duplicateIdToDelete }))
            .catch(() => {});
        }
      }
      continue;
    }

    if (!seenIds.has(item.id.toLowerCase())) {
      seenIds.add(item.id.toLowerCase());
      result.push(item);
      if (cleanEmail) emailToReferee.set(cleanEmail, item);
      if (last10) phoneToReferee.set(last10, item);
      if (cleanKalawarId) kalawarIdToReferee.set(cleanKalawarId, item);
    }
  }

  return result;
}

export async function getReferees(options?: {
  level?: string;
  status?: string;
  state?: string;
  q?: string;
  activeLicenseOnly?: boolean;
}): Promise<RefereeItem[]> {
  // Always trigger background sync of registered referee accounts
  await syncRegisteredReferees();

  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (options?.level && options.level !== "All") {
      filter.level = options.level;
    }
    if (options?.status && options.status !== "All") {
      filter.status = options.status;
    }
    if (options?.state && options.state !== "All") {
      filter.state = options.state;
    }
    if (options?.activeLicenseOnly) {
      filter.status = "Active";
      filter.licenseNumber = { $exists: true, $ne: "" };
    }
    if (options?.q && options.q.trim()) {
      const qRegex = new RegExp(options.q.trim(), "i");
      filter.$or = [
        { id: qRegex },
        { name: qRegex },
        { email: qRegex },
        { phone: qRegex },
        { state: qRegex },
        { district: qRegex },
        { licenseNumber: qRegex },
        { kalawarId: qRegex },
        { academy: qRegex },
      ];
    }

    const docs = await RefereeModel.find(filter).sort({ createdAt: -1 }).lean();
    const sanitized = (docs || []).map((d: any) => sanitizeRefereeDoc(d));
    const deduped = deduplicateRefereesList(sanitized);
    return filterRefereesList(deduped, options);
  } catch (error) {
    console.warn("MongoDB note (referees):", error instanceof Error ? error.message : "");
    const fileList = await getFileReferees();
    const deduped = deduplicateRefereesList(fileList);
    return filterRefereesList(deduped, options);
  }
}

function sanitizeRefereeDoc(d: any): RefereeItem {
  return {
    id: d.id,
    name: d.name,
    username: d.username || "",
    password: d.password || "",
    rawPassword: d.rawPassword || "",
    dob: d.dob || "",
    gender: d.gender || "Male",
    email: d.email,
    phone: d.phone,
    state: d.state,
    district: d.district,
    tempStateAssociation: d.tempStateAssociation || "",
    tempDistrictAssociation: d.tempDistrictAssociation || "",
    discipline: d.discipline || "Kalawar Martial Arts",
    academy: d.academy || "",
    kalawarId: d.kalawarId || "",
    currentRank: d.currentRank || "1st Dan Black Belt",
    martialArtsExperience: d.martialArtsExperience || "",
    level: d.level || "Level 1 – Junior Referee",
    status: d.status || "Application Submitted",
    licenseNumber: d.licenseNumber || "",
    licenseIssuedDate: d.licenseIssuedDate || "",
    licenseValidUntil: d.licenseValidUntil || "",
    photo: d.photo || "",
    certificationDocument: d.certificationDocument || "",
    certificationDocumentName: d.certificationDocumentName || "",
    certificationDocumentSize: d.certificationDocumentSize || "",
    aadhaarDoc: d.aadhaarDoc || (Array.isArray(d.documents) && d.documents.length > 0 ? d.documents[0] : "") || "",
    aadhaarDocName: d.aadhaarDocName || (d.aadhaarDoc ? "Government_ID_Proof.pdf" : "") || "",
    aadhaarDocSize: d.aadhaarDocSize || "",
    specialization: d.specialization || "",
    emergencyContact: d.emergencyContact || "",
    bloodGroup: d.bloodGroup || "",
    address: d.address || "",
    pincode: d.pincode || "",
    documents: d.documents || [],
    previousCertificates: d.previousCertificates || [],
    bio: d.bio || "",
    matchesOfficiated: d.matchesOfficiated || 0,
    trainingRecords: d.trainingRecords || [],
    examRecords: d.examRecords || [],
    dutyAppointments: d.dutyAppointments || [],
    evaluations: d.evaluations || [],
    internalNotes: d.internalNotes || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function filterRefereesList(list: RefereeItem[], options?: {
  level?: string;
  status?: string;
  state?: string;
  q?: string;
  activeLicenseOnly?: boolean;
}): RefereeItem[] {
  let filtered = list;

  if (options?.level && options.level !== "All") {
    filtered = filtered.filter((r) => r.level === options.level);
  }
  if (options?.status && options.status !== "All") {
    filtered = filtered.filter((r) => r.status === options.status);
  }
  if (options?.state && options.state !== "All") {
    filtered = filtered.filter((r) => r.state === options.state);
  }
  if (options?.activeLicenseOnly) {
    const now = new Date().toISOString();
    filtered = filtered.filter(
      (r) =>
        r.status === "Active" &&
        r.licenseNumber &&
        (!r.licenseValidUntil || r.licenseValidUntil >= now)
    );
  }
  if (options?.q && options.q.trim()) {
    const qLower = options.q.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(qLower) ||
        r.name.toLowerCase().includes(qLower) ||
        r.email.toLowerCase().includes(qLower) ||
        r.phone.toLowerCase().includes(qLower) ||
        r.state.toLowerCase().includes(qLower) ||
        r.district.toLowerCase().includes(qLower) ||
        (r.licenseNumber && r.licenseNumber.toLowerCase().includes(qLower)) ||
        (r.kalawarId && r.kalawarId.toLowerCase().includes(qLower)) ||
        (r.academy && r.academy.toLowerCase().includes(qLower))
    );
  }

  return filtered;
}

export async function getRefereeById(id: string): Promise<RefereeItem | null> {
  const cleanId = (id || "").trim();
  if (!cleanId) return null;
  const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    await connectToDatabase();
    const doc = await RefereeModel.findOne({
      $or: [
        { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { kalawarId: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { licenseNumber: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    }).lean();
    if (doc) return sanitizeRefereeDoc(doc);
  } catch {
    // fallback
  }

  const fileList = await getFileReferees();
  const cleanLower = cleanId.toLowerCase();
  return (
    fileList.find(
      (r) =>
        r.id.toLowerCase() === cleanLower ||
        (r.kalawarId && r.kalawarId.toLowerCase() === cleanLower) ||
        (r.licenseNumber && r.licenseNumber.toLowerCase() === cleanLower)
    ) || null
  );
}

export async function getRefereeByLicenseOrId(query: string): Promise<RefereeItem | null> {
  const cleanQuery = query.trim().toUpperCase().replace(/[\s\-_.:]/g, "");
  if (!cleanQuery) return null;

  const referees = await getReferees();
  return (
    referees.find((r) => {
      const normId = (r.id || "").toUpperCase().replace(/[\s\-_.:]/g, "");
      const normLic = (r.licenseNumber || "").toUpperCase().replace(/[\s\-_.:]/g, "");
      const normKid = (r.kalawarId || "").toUpperCase().replace(/[\s\-_.:]/g, "");
      return normId === cleanQuery || normLic === cleanQuery || normKid === cleanQuery;
    }) || null
  );
}

export async function createReferee(input: CreateRefereeInput): Promise<RefereeItem> {
  if (!input.name || !input.name.trim()) {
    throw new Error("Full name is required");
  }
  if (!input.email || !input.email.trim()) {
    throw new Error("Email address is required");
  }
  if (!input.phone || !input.phone.trim()) {
    throw new Error("Phone number is required");
  }
  if (!input.state || !input.state.trim()) {
    throw new Error("State is required");
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.trim().replace(/\D/g, "");
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : "";
  const cleanKalawarId = (input.kalawarId || "").trim();
  const cleanId = (input.id || "").trim();

  // Check if a referee record already exists by ID, Kalawar ID, email, or phone
  let existing: RefereeItem | null = null;
  if (cleanId) {
    existing = await getRefereeById(cleanId);
  }
  if (!existing && cleanKalawarId) {
    existing = await getRefereeById(cleanKalawarId);
  }
  if (!existing) {
    const all = await getReferees();
    existing =
      all.find(
        (r) =>
          (r.email && r.email.toLowerCase() === cleanEmail) ||
          (last10 && r.phone && r.phone.replace(/\D/g, "").endsWith(last10)) ||
          (cleanKalawarId && r.kalawarId && r.kalawarId.toLowerCase() === cleanKalawarId.toLowerCase())
      ) || null;
  }

  const now = new Date().toISOString();

  if (existing) {
    // Overwrite existing record with latest submitted applicant payload
    const updatedRecord: RefereeItem = {
      ...existing,
      name: input.name.trim(),
      username: input.username ? input.username.trim().toLowerCase() : existing.username || "",
      password: input.password || existing.password || "",
      rawPassword: input.rawPassword || input.password || existing.rawPassword || "",
      dob: input.dob?.trim() || existing.dob || "",
      gender: input.gender || existing.gender || "Male",
      email: cleanEmail,
      phone: input.phone.trim(),
      state: input.state.trim(),
      district: input.district?.trim() || existing.district || "",
      discipline: input.discipline || existing.discipline || "Kalawar Martial Arts",
      academy: input.academy?.trim() || existing.academy || "",
      kalawarId: cleanKalawarId || existing.kalawarId || existing.id,
      currentRank: input.currentRank?.trim() || existing.currentRank || "1st Dan Black Belt",
      martialArtsExperience: input.martialArtsExperience?.trim() || existing.martialArtsExperience || "3 Years",
      level: input.level || existing.level || "Level 1 – Junior Referee",
      status: existing.status === "Active" || existing.status === "Certified" ? existing.status : input.status || "Application Submitted",
      photo: input.photo || existing.photo || "",
      certificationDocument: input.certificationDocument || existing.certificationDocument || "",
      certificationDocumentName: input.certificationDocumentName || existing.certificationDocumentName || "",
      certificationDocumentSize: input.certificationDocumentSize || existing.certificationDocumentSize || "",
      aadhaarDoc: input.aadhaarDoc || existing.aadhaarDoc || (Array.isArray(input.documents) && input.documents.length > 0 ? input.documents[0] : "") || "",
      aadhaarDocName: input.aadhaarDocName || existing.aadhaarDocName || "",
      aadhaarDocSize: input.aadhaarDocSize || existing.aadhaarDocSize || "",
      specialization: input.specialization || existing.specialization || "",
      emergencyContact: input.emergencyContact || existing.emergencyContact || "",
      bloodGroup: input.bloodGroup || existing.bloodGroup || "",
      address: input.address || existing.address || "",
      pincode: input.pincode || existing.pincode || "",
      documents: input.documents && input.documents.length > 0 ? input.documents : existing.documents || [],
      bio: input.bio?.trim() || existing.bio || "",
      matchesOfficiated: input.matchesOfficiated !== undefined ? input.matchesOfficiated : existing.matchesOfficiated || 0,
      internalNotes: input.internalNotes || existing.internalNotes || "Application updated via online portal.",
      updatedAt: now,
    };

    try {
      await connectToDatabase();
      const escapedExistingId = existing.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      await RefereeModel.findOneAndUpdate(
        {
          $or: [
            { id: { $regex: new RegExp(`^${escapedExistingId}$`, "i") } },
            { email: cleanEmail },
          ],
        },
        { $set: updatedRecord },
        { upsert: true, returnDocument: "after" }
      );
      // Clean up any other duplicates with same email
      if (cleanEmail) {
        await RefereeModel.deleteMany({
          id: { $ne: existing.id },
          email: cleanEmail,
        }).catch(() => {});
      }
    } catch (error) {
      console.warn("MongoDB update note (createReferee existing): writing to fallback file.");
    }

    const fileList = await getFileReferees();
    const nextList = fileList.map((r) =>
      r.id === existing!.id || (r.email && r.email.toLowerCase() === cleanEmail) ? updatedRecord : r
    );
    if (!nextList.some((r) => r.id === updatedRecord.id)) {
      nextList.unshift(updatedRecord);
    }
    await saveFileReferees(nextList);

    return updatedRecord;
  }

  const id = input.id?.trim() || (await generateNextRefereeId());

  const refereeData: RefereeItem = {
    id,
    name: input.name.trim(),
    username: input.username ? input.username.trim().toLowerCase() : "",
    password: input.password || "",
    rawPassword: input.rawPassword || input.password || "",
    dob: input.dob?.trim() || "",
    gender: input.gender || "Male",
    email: cleanEmail,
    phone: input.phone.trim(),
    state: input.state.trim(),
    district: input.district?.trim() || "",
    discipline: input.discipline || "Kalawar Martial Arts",
    academy: input.academy?.trim() || "",
    kalawarId: cleanKalawarId || id,
    currentRank: input.currentRank?.trim() || "1st Dan Black Belt",
    martialArtsExperience: input.martialArtsExperience?.trim() || "3 Years",
    level: input.level || "Level 1 – Junior Referee",
    status: input.status || "Application Submitted",
    licenseNumber: input.licenseNumber?.trim() || "",
    licenseIssuedDate: input.licenseIssuedDate || "",
    licenseValidUntil: input.licenseValidUntil || "",
    photo: input.photo || "",
    certificationDocument: input.certificationDocument || "",
    certificationDocumentName: input.certificationDocumentName || "",
    certificationDocumentSize: input.certificationDocumentSize || "",
    aadhaarDoc: input.aadhaarDoc || (Array.isArray(input.documents) && input.documents.length > 0 ? input.documents[0] : "") || "",
    aadhaarDocName: input.aadhaarDocName || "",
    aadhaarDocSize: input.aadhaarDocSize || "",
    specialization: input.specialization || "",
    emergencyContact: input.emergencyContact || "",
    bloodGroup: input.bloodGroup || "",
    address: input.address || "",
    pincode: input.pincode || "",
    documents: input.documents || [],
    previousCertificates: input.previousCertificates || [],
    bio: input.bio?.trim() || "",
    matchesOfficiated: input.matchesOfficiated || 0,
    trainingRecords: [],
    examRecords: [],
    dutyAppointments: [],
    evaluations: [],
    internalNotes: input.internalNotes || "Application submitted via online portal.",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await connectToDatabase();
    await RefereeModel.create(refereeData);
  } catch (error) {
    console.warn("MongoDB create note (referee): writing to fallback file.");
  }

  const fileList = await getFileReferees();
  const nextList = [refereeData, ...fileList.filter((r) => r.id !== id)];
  await saveFileReferees(nextList);

  return refereeData;
}

export async function updateReferee(
  id: string,
  updates: Partial<RefereeItem>
): Promise<RefereeItem> {
  const cleanId = (id || "").trim();
  let existing = await getRefereeById(cleanId);
  if (!existing) {
    const { getPlayerById } = await import("./players-store");
    const player = await getPlayerById(cleanId);
    if (player) {
      existing = {
        id: player.id,
        name: player.name,
        username: player.username || "",
        password: player.password || "",
        rawPassword: player.rawPassword || player.password || "",
        dob: player.dob || "",
        gender: (player.gender as any) || "Male",
        email: (player.email || "").toLowerCase(),
        phone: player.phone || "",
        state: player.state || "National",
        district: player.district || player.city || "",
        discipline: player.discipline || "Kalawar Martial Arts",
        academy: player.club || "Independent",
        kalawarId: player.id,
        currentRank: updates.currentRank || player.beltRank || "None / Unranked",
        martialArtsExperience: player.experienceYears ? `${player.experienceYears} Years` : "Registered Official",
        level: updates.level || (player as any).level || "Level 1 – Junior Referee",
        status: player.status === "Active" ? "Active" : "Application Submitted",
        licenseNumber: (player as any).licenseNumber || "",
        licenseIssuedDate: (player as any).licenseIssuedDate || "",
        licenseValidUntil: (player as any).licenseValidUntil || "",
        photo: player.image || "",
        certificationDocument: updates.certificationDocument || (player as any).certificationDocument || (player as any).affiliationDocument || "",
        certificationDocumentName: updates.certificationDocumentName || (player as any).certificationDocumentName || (player as any).affiliationDocumentName || "",
        certificationDocumentSize: updates.certificationDocumentSize || (player as any).certificationDocumentSize || (player as any).affiliationDocumentSize || "",
        specialization: (player as any).specialization || "",
        emergencyContact: player.emergencyContact || "",
        bloodGroup: player.bloodGroup || "",
        address: player.address || "",
        pincode: player.pincode || "",
        documents: [],
        previousCertificates: [],
        bio: player.bio || "",
        matchesOfficiated: Number(player.matchesOfficiated) || 0,
        trainingRecords: [],
        examRecords: [],
        dutyAppointments: [],
        evaluations: [],
        internalNotes: "Registered via Member Portal.",
        createdAt: player.registeredOn ? new Date(player.registeredOn).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      existing = {
        id: cleanId,
        name: updates.name || "Referee",
        username: updates.username || "",
        password: updates.password || "",
        rawPassword: updates.rawPassword || updates.password || "",
        dob: "",
        gender: "Male",
        email: (updates.email || "").toLowerCase(),
        phone: updates.phone || "",
        state: updates.state || "National",
        district: updates.district || "",
        discipline: updates.discipline || "Kalawar Martial Arts",
        academy: updates.academy || "Independent",
        kalawarId: cleanId,
        currentRank: updates.currentRank || "None / Unranked",
        martialArtsExperience: "Registered Official",
        level: updates.level || "Level 1 – Junior Referee",
        status: updates.status || "Active",
        licenseNumber: updates.licenseNumber || "",
        licenseIssuedDate: updates.licenseIssuedDate || "",
        licenseValidUntil: updates.licenseValidUntil || "",
        photo: updates.photo || "",
        certificationDocument: "",
        certificationDocumentName: "",
        certificationDocumentSize: "",
        specialization: "",
        emergencyContact: updates.emergencyContact || "",
        bloodGroup: updates.bloodGroup || "",
        address: "",
        pincode: "",
        documents: [],
        previousCertificates: [],
        bio: "",
        matchesOfficiated: 0,
        trainingRecords: [],
        examRecords: [],
        dutyAppointments: [],
        evaluations: [],
        internalNotes: "Created via Referee Update.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const now = new Date().toISOString();
  const updatedItem: RefereeItem = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  // If status changed to "Active" or "Certified" and no licenseNumber exists, auto-generate license
  if (
    (updatedItem.status === "Active" || updatedItem.status === "Certified") &&
    !updatedItem.licenseNumber
  ) {
    updatedItem.licenseNumber = await generateNextLicenseNumber();
    if (!updatedItem.licenseIssuedDate) {
      updatedItem.licenseIssuedDate = now;
    }
    if (!updatedItem.licenseValidUntil) {
      // 2 years validity
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 2);
      updatedItem.licenseValidUntil = expiry.toISOString();
    }
  }

  const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedExistingId = (existing.id || cleanId).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  try {
    await connectToDatabase();
    await RefereeModel.findOneAndUpdate(
      {
        $or: [
          { id: { $regex: new RegExp(`^${escapedId}$`, "i") } },
          { id: { $regex: new RegExp(`^${escapedExistingId}$`, "i") } },
        ],
      },
      { $set: updatedItem },
      { upsert: true, returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update note (referee): saving to fallback file.");
  }

  const fileList = await getFileReferees();
  const idx = fileList.findIndex(
    (r) =>
      r.id.toLowerCase() === cleanId.toLowerCase() ||
      r.id.toLowerCase() === existing.id.toLowerCase()
  );
  if (idx !== -1) {
    fileList[idx] = updatedItem;
  } else {
    fileList.unshift(updatedItem);
  }
  await saveFileReferees(fileList);

  // Sync status, level, rank, etc. to Player store
  try {
    const { updatePlayer } = await import("./players-store");
    const playerStatus =
      updatedItem.status === "Active" || updatedItem.status === "Certified"
        ? "Active"
        : updatedItem.status === "Suspended"
        ? "Suspended"
        : "Pending";

    const playerUpdates: Record<string, any> = {
      status: playerStatus,
      level: updatedItem.level,
      officiatingGrade: updatedItem.level,
      memberType: "Referee",
      ...(updatedItem.photo ? { image: updatedItem.photo } : {}),
      ...(updatedItem.username ? { username: updatedItem.username } : {}),
      ...(updatedItem.password ? { password: updatedItem.password, rawPassword: updatedItem.rawPassword || updatedItem.password } : {}),
      ...(updatedItem.name ? { name: updatedItem.name } : {}),
      ...(updatedItem.email ? { email: updatedItem.email } : {}),
      ...(updatedItem.phone ? { phone: updatedItem.phone } : {}),
      ...(updatedItem.state ? { state: updatedItem.state } : {}),
      ...(updatedItem.district ? { district: updatedItem.district, city: updatedItem.district } : {}),
      ...(updatedItem.currentRank && updatedItem.currentRank !== "None / Unranked"
        ? { beltRank: updatedItem.currentRank }
        : {}),
      ...(updatedItem.certificationDocument
        ? {
            certificationDocument: updatedItem.certificationDocument,
            certificationDocumentName: updatedItem.certificationDocumentName,
            certificationDocumentSize: updatedItem.certificationDocumentSize,
            affiliationDocument: updatedItem.certificationDocument,
            affiliationDocumentName: updatedItem.certificationDocumentName,
            affiliationDocumentSize: updatedItem.certificationDocumentSize,
          }
        : {}),
    };

    if (updatedItem.kalawarId) {
      await updatePlayer(updatedItem.kalawarId, playerUpdates);
    }
    if (cleanId && cleanId.toLowerCase() !== (updatedItem.kalawarId || "").toLowerCase()) {
      await updatePlayer(cleanId, playerUpdates);
    }
    if (updatedItem.id && updatedItem.id.toLowerCase() !== cleanId.toLowerCase()) {
      await updatePlayer(updatedItem.id, playerUpdates);
    }
  } catch (playerErr) {
    console.warn("Could not sync referee update to player store:", playerErr);
  }

  // Also sync directly to ID Cards store
  try {
    const { upsertRefereeIdCard } = await import("./id-cards-store");
    const idCardStatus =
      updatedItem.status === "Suspended"
        ? "Suspended"
        : updatedItem.status === "Cancelled"
        ? "Cancelled"
        : "Active";

    await upsertRefereeIdCard(updatedItem, idCardStatus);
  } catch (idCardErr) {
    console.warn("Could not sync referee update to ID cards store:", idCardErr);
  }

  return updatedItem;
}

export async function deleteReferee(id: string): Promise<boolean> {
  const cleanId = (id || "").trim();
  if (!cleanId) return false;

  // 1. Find existing referee to capture all matching keys (id, kalawarId, email, phone)
  let existing: RefereeItem | null = null;
  try {
    existing = await getRefereeById(cleanId);
  } catch {}

  const idsToDelete = new Set<string>();
  idsToDelete.add(cleanId.toLowerCase());
  if (existing) {
    if (existing.id) idsToDelete.add(existing.id.toLowerCase());
    if (existing.kalawarId) idsToDelete.add(existing.kalawarId.toLowerCase());
  }

  // 2. Build MongoDB query to delete all matching referee documents
  try {
    await connectToDatabase();
    const orClauses: any[] = [];
    idsToDelete.forEach((ident) => {
      const escaped = ident.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      orClauses.push({ id: { $regex: new RegExp(`^${escaped}$`, "i") } });
      orClauses.push({ kalawarId: { $regex: new RegExp(`^${escaped}$`, "i") } });
    });
    if (existing?.email) {
      orClauses.push({ email: existing.email.toLowerCase() });
    }
    await RefereeModel.deleteMany({ $or: orClauses });
  } catch (mongoErr) {
    console.warn("MongoDB deleteReferee error:", mongoErr);
  }

  // 3. Remove from local referees.json file
  try {
    const fileList = await getFileReferees();
    const nextList = fileList.filter(
      (r) =>
        !idsToDelete.has(r.id.toLowerCase()) &&
        (!r.kalawarId || !idsToDelete.has(r.kalawarId.toLowerCase())) &&
        (!existing?.email || r.email?.toLowerCase() !== existing.email.toLowerCase())
    );
    await saveFileReferees(nextList);
  } catch (fileErr) {
    console.warn("deleteReferee file error:", fileErr);
  }

  // 4. CASCADE DELETE or unlink from PlayerModel / players.json
  // If the referee is also stored as a Player with memberType: "Referee" or WSF-RF- ID,
  // we MUST delete or remove memberType so syncRegisteredReferees DOES NOT resurrect it!
  try {
    const { deletePlayer, getPlayers } = await import("./players-store");
    for (const ident of idsToDelete) {
      await deletePlayer(ident);
    }
    if (existing?.email) {
      const allPlayers = await getPlayers();
      const matchingPlayer = allPlayers.find(
        (p) => p.email && p.email.toLowerCase() === existing!.email!.toLowerCase()
      );
      if (matchingPlayer && (matchingPlayer.memberType === "Referee" || matchingPlayer.id.startsWith("KSM-RF-") || matchingPlayer.id.startsWith("WSF-RF-"))) {
        await deletePlayer(matchingPlayer.id);
      }
    }
  } catch (playerErr) {
    console.warn("deleteReferee player cascade note:", playerErr);
  }

  // 5. Cascade delete from ID cards
  try {
    const { deleteIdCard } = await import("./id-cards-store");
    for (const ident of idsToDelete) {
      await deleteIdCard(ident);
    }
  } catch (idCardErr) {
    console.warn("deleteReferee idCard cascade note:", idCardErr);
  }

  return true;
}

export async function appointRefereeToDuty(
  refereeId: string,
  appointment: Omit<DutyAppointment, "id" | "appointedAt">
): Promise<RefereeItem> {
  const referee = await getRefereeById(refereeId);
  if (!referee) {
    throw new Error(`Referee with ID "${refereeId}" not found`);
  }

  // Strict check: Only active licensed referees can be appointed
  if (referee.status !== "Active" || !referee.licenseNumber) {
    throw new Error(
      `Cannot assign ${referee.name}: Only active, certified licensed referees can be appointed to tournament duty.`
    );
  }

  const now = new Date().toISOString();
  const newDuty: DutyAppointment = {
    ...appointment,
    id: `DUTY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    appointedAt: now,
  };

  const nextDuties = [newDuty, ...referee.dutyAppointments];
  return await updateReferee(refereeId, {
    dutyAppointments: nextDuties,
    matchesOfficiated: (referee.matchesOfficiated || 0) + 1,
  });
}
