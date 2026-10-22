import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import {
  DanGradeLevelModel,
  DanExamSessionModel,
  DanApplicationModel,
  DanCertificateModel,
} from "@/models/DanGrading";
import PlayerModel from "@/models/Player";
import {
  INITIAL_DAN_EXAM_SESSIONS,
  INITIAL_DAN_APPLICATIONS,
  DAN_GRADES,
  type DanGradeLevel,
  type DanExamSession,
  type DanApplication,
  type DanCertificateData,
  type DanAssessmentScore,
  type DanApplicationStatus,
} from "@/data/dan-grading";
import { withRedisCache, invalidateDanGradingCache } from "./redis";


const STORAGE_FILE_PATH = path.join(process.cwd(), "src/data/storage/dan-grading.json");

interface DanStorageFile {
  grades?: DanGradeLevel[];
  sessions?: DanExamSession[];
  applications?: DanApplication[];
}

async function getFileDanData(): Promise<DanStorageFile> {
  try {
    const raw = await fs.promises.readFile(STORAGE_FILE_PATH, "utf-8");
    if (raw && raw.trim()) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback
  }
  return {
    grades: DAN_GRADES,
    sessions: [],
    applications: [],
  };
}

async function saveFileDanData(data: Partial<DanStorageFile>): Promise<void> {
  try {
    const current = await getFileDanData();
    const updated = { ...current, ...data };
    await fs.promises.mkdir(path.dirname(STORAGE_FILE_PATH), { recursive: true });
    const tempFile = `${STORAGE_FILE_PATH}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.promises.writeFile(tempFile, JSON.stringify(updated, null, 2), "utf-8");
    try {
      await fs.promises.rename(tempFile, STORAGE_FILE_PATH);
    } catch {
      await fs.promises.writeFile(STORAGE_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
      try { await fs.promises.unlink(tempFile); } catch {}
    }
  } catch (err) {
    console.error("DanGradingStore: Failed to write dan-grading.json", err);
  }
  await invalidateDanGradingCache();
}

// In-Memory Fallback Cache
let cachedGrades: DanGradeLevel[] = JSON.parse(JSON.stringify(DAN_GRADES));
let cachedSessions: DanExamSession[] = [];
let cachedApplications: DanApplication[] = [];

// Helper to check DB connection
async function safeConnect() {
  try {
    await connectToDatabase();
    return true;
  } catch (err) {
    console.warn("DanGradingStore: Running on in-memory cache mode (MongoDB not connected).");
    return false;
  }
}

// ----------------- DAN GRADES (1st to 10th Dan Syllabus & Fees Dynamic CRUD) -----------------

export async function getAllDanGrades(): Promise<DanGradeLevel[]> {
  return withRedisCache("cache:dangrading:grades:all", 600, fetchRawAllDanGrades);
}

async function fetchRawAllDanGrades(): Promise<DanGradeLevel[]> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const count = await DanGradeLevelModel.countDocuments();
      if (count === 0) {
        await DanGradeLevelModel.insertMany(DAN_GRADES);
      }
      const docs = await DanGradeLevelModel.find().sort({ dan: 1 }).lean();
      if (docs && docs.length > 0) {
        cachedGrades = docs.map((d: any) => ({
          dan: d.dan,
          rankName: d.rankName,
          titleJapanese: d.titleJapanese,
          titleKorean: d.titleKorean,
          designation: d.designation,
          minTrainingYears: d.minTrainingYears,
          timeInPreviousGradeYears: d.timeInPreviousGradeYears,
          minAge: d.minAge,
          beltColor: d.beltColor,
          fee: d.fee,
          kataForms: d.kataForms || [],
          sparringRequirements: d.sparringRequirements || [],
          selfDefenseWeapons: d.selfDefenseWeapons || [],
          breakingRequirements: d.breakingRequirements || [],
          aadhaarRequired: !!d.aadhaarRequired,
          currentCertRequired: !!d.currentCertRequired,
          medicalFitnessRequired: !!d.medicalFitnessRequired,
          theoryThesisRequired: !!d.theoryThesisRequired,
          thesisTopic: d.thesisTopic || "",
          technicalRequirements: d.technicalRequirements || [],
          eligibilityNotes: d.eligibilityNotes || "",
        }));
        return cachedGrades;
      }
    } catch (err) {
      console.error("DanGradingStore.getAllDanGrades error:", err);
    }
  }
  return [...cachedGrades].sort((a, b) => a.dan - b.dan);
}

export async function getDanGradeByDan(dan: number): Promise<DanGradeLevel | null> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const doc = await DanGradeLevelModel.findOne({ dan }).lean();
      if (doc) {
        return {
          dan: (doc as any).dan,
          rankName: (doc as any).rankName,
          titleJapanese: (doc as any).titleJapanese,
          titleKorean: (doc as any).titleKorean,
          designation: (doc as any).designation,
          minTrainingYears: (doc as any).minTrainingYears,
          timeInPreviousGradeYears: (doc as any).timeInPreviousGradeYears,
          minAge: (doc as any).minAge,
          beltColor: (doc as any).beltColor,
          fee: (doc as any).fee,
          kataForms: (doc as any).kataForms || [],
          sparringRequirements: (doc as any).sparringRequirements || [],
          selfDefenseWeapons: (doc as any).selfDefenseWeapons || [],
          breakingRequirements: (doc as any).breakingRequirements || [],
          aadhaarRequired: !!(doc as any).aadhaarRequired,
          currentCertRequired: !!(doc as any).currentCertRequired,
          medicalFitnessRequired: !!(doc as any).medicalFitnessRequired,
          theoryThesisRequired: !!(doc as any).theoryThesisRequired,
          thesisTopic: (doc as any).thesisTopic || "",
          technicalRequirements: (doc as any).technicalRequirements || [],
          eligibilityNotes: (doc as any).eligibilityNotes || "",
        };
      }
    } catch (err) {
      console.error("DanGradingStore.getDanGradeByDan error:", err);
    }
  }
  return cachedGrades.find((g) => g.dan === dan) || null;
}

export async function createDanGrade(gradeData: DanGradeLevel): Promise<DanGradeLevel> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanGradeLevelModel.findOneAndUpdate(
        { dan: gradeData.dan },
        { $set: gradeData },
        { upsert: true, returnDocument: "after" }
      );
    } catch (err) {
      console.error("DanGradingStore.createDanGrade DB error:", err);
    }
  }

  const idx = cachedGrades.findIndex((g) => g.dan === gradeData.dan);
  if (idx !== -1) {
    cachedGrades[idx] = { ...gradeData };
  } else {
    cachedGrades.push({ ...gradeData });
  }
  cachedGrades.sort((a, b) => a.dan - b.dan);
  return gradeData;
}

export async function updateDanGrade(
  dan: number,
  updates: Partial<DanGradeLevel>
): Promise<DanGradeLevel | null> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const doc = await DanGradeLevelModel.findOneAndUpdate(
        { dan },
        { $set: updates },
        { returnDocument: "after" }
      ).lean();
      if (doc) {
        const updated = doc as any;
        const mapped: DanGradeLevel = {
          dan: updated.dan,
          rankName: updated.rankName,
          titleJapanese: updated.titleJapanese,
          titleKorean: updated.titleKorean,
          designation: updated.designation,
          minTrainingYears: updated.minTrainingYears,
          timeInPreviousGradeYears: updated.timeInPreviousGradeYears,
          minAge: updated.minAge,
          beltColor: updated.beltColor,
          fee: updated.fee,
          kataForms: updated.kataForms || [],
          sparringRequirements: updated.sparringRequirements || [],
          selfDefenseWeapons: updated.selfDefenseWeapons || [],
          breakingRequirements: updated.breakingRequirements || [],
          aadhaarRequired: !!updated.aadhaarRequired,
          currentCertRequired: !!updated.currentCertRequired,
          medicalFitnessRequired: !!updated.medicalFitnessRequired,
          theoryThesisRequired: !!updated.theoryThesisRequired,
          thesisTopic: updated.thesisTopic || "",
          technicalRequirements: updated.technicalRequirements || [],
          eligibilityNotes: updated.eligibilityNotes || "",
        };
        const idx = cachedGrades.findIndex((g) => g.dan === dan);
        if (idx !== -1) cachedGrades[idx] = mapped;
        return mapped;
      }
    } catch (err) {
      console.error("DanGradingStore.updateDanGrade DB error:", err);
    }
  }

  const idx = cachedGrades.findIndex((g) => g.dan === dan);
  if (idx !== -1) {
    cachedGrades[idx] = { ...cachedGrades[idx], ...updates };
    return cachedGrades[idx];
  }
  return null;
}

export async function deleteDanGrade(dan: number): Promise<boolean> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanGradeLevelModel.deleteOne({ dan });
    } catch (err) {
      console.error("DanGradingStore.deleteDanGrade DB error:", err);
    }
  }
  cachedGrades = cachedGrades.filter((g) => g.dan !== dan);
  return true;
}

export async function resetDanGradesToDefault(): Promise<DanGradeLevel[]> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanGradeLevelModel.deleteMany({});
      await DanGradeLevelModel.insertMany(DAN_GRADES);
    } catch (err) {
      console.error("DanGradingStore.resetDanGradesToDefault DB error:", err);
    }
  }
  cachedGrades = JSON.parse(JSON.stringify(DAN_GRADES));
  return [...cachedGrades];
}

// ----------------- SESSIONS (Full CRUD) -----------------

export async function getAllDanExamSessions(): Promise<DanExamSession[]> {
  return withRedisCache("cache:dangrading:sessions:all", 300, fetchRawAllDanExamSessions);
}

async function fetchRawAllDanExamSessions(): Promise<DanExamSession[]> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const docs = await DanExamSessionModel.find().sort({ examDate: 1 }).lean();
      return docs.map((d: any) => ({
        id: d.id,
        title: d.title,
        discipline: d.discipline,
        examDate: d.examDate,
        reportingTime: d.reportingTime,
        examEndTime: d.examEndTime,
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        city: d.city,
        state: d.state,
        chiefExaminer: d.chiefExaminer,
        chiefExaminerRank: d.chiefExaminerRank,
        examiners: d.examiners || [],
        eligibleDans: d.eligibleDans || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        registrationDeadline: d.registrationDeadline,
        fee: d.fee,
        maxCandidates: d.maxCandidates,
        description: d.description,
        status: d.status,
        bannerImage: d.bannerImage,
        candidatesCount: d.candidatesCount || 0,
      }));
    } catch (err) {
      console.error("DanGradingStore.getAllDanExamSessions error:", err);
    }
  }
  return [...cachedSessions];
}

export async function getDanExamSessionById(id: string): Promise<DanExamSession | null> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const doc = await DanExamSessionModel.findOne({ id }).lean();
      if (doc) {
        return {
          id: (doc as any).id,
          title: (doc as any).title,
          discipline: (doc as any).discipline,
          examDate: (doc as any).examDate,
          reportingTime: (doc as any).reportingTime,
          examEndTime: (doc as any).examEndTime,
          venueName: (doc as any).venueName,
          venueAddress: (doc as any).venueAddress,
          city: (doc as any).city,
          state: (doc as any).state,
          chiefExaminer: (doc as any).chiefExaminer,
          chiefExaminerRank: (doc as any).chiefExaminerRank,
          examiners: (doc as any).examiners || [],
          eligibleDans: (doc as any).eligibleDans || [],
          registrationDeadline: (doc as any).registrationDeadline,
          fee: (doc as any).fee,
          maxCandidates: (doc as any).maxCandidates,
          description: (doc as any).description,
          status: (doc as any).status,
          bannerImage: (doc as any).bannerImage,
          candidatesCount: (doc as any).candidatesCount || 0,
        };
      }
    } catch (err) {
      console.error("DanGradingStore.getDanExamSessionById error:", err);
    }
  }
  return cachedSessions.find((s) => s.id === id) || null;
}

export async function createDanExamSession(
  sessionData: Omit<DanExamSession, "id"> & { id?: string }
): Promise<DanExamSession> {
  const id = sessionData.id || `KAC-DAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newSession: DanExamSession = {
    ...sessionData,
    id,
    candidatesCount: 0,
  };

  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanExamSessionModel.create(newSession);
    } catch (err) {
      console.error("DanGradingStore.createDanExamSession DB error:", err);
    }
  }

  cachedSessions.unshift(newSession);
  return newSession;
}

export async function updateDanExamSession(
  id: string,
  updates: Partial<DanExamSession>
): Promise<DanExamSession | null> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const doc = await DanExamSessionModel.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: "after" }).lean();
      if (doc) {
        return doc as any;
      }
    } catch (err) {
      console.error("DanGradingStore.updateDanExamSession DB error:", err);
    }
  }

  const idx = cachedSessions.findIndex((s) => s.id === id);
  if (idx !== -1) {
    cachedSessions[idx] = { ...cachedSessions[idx], ...updates };
    return cachedSessions[idx];
  }
  return null;
}

export async function deleteDanExamSession(id: string): Promise<boolean> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanExamSessionModel.deleteOne({ id });
    } catch (err) {
      console.error("DanGradingStore.deleteDanExamSession DB error:", err);
    }
  }
  cachedSessions = cachedSessions.filter((s) => s.id !== id);
  return true;
}

// ----------------- APPLICATIONS -----------------

export async function getAllDanApplications(): Promise<DanApplication[]> {
  return withRedisCache("cache:dangrading:candidates:all", 300, fetchRawAllDanApplications);
}

async function fetchRawAllDanApplications(): Promise<DanApplication[]> {
  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const docs = await DanApplicationModel.find().sort({ createdAt: -1 }).lean();
      if (Array.isArray(docs)) {
        return docs.map((d: any) => ({
          id: d.id,
          examId: d.examId,
          athleteId: d.athleteId,
          fullName: d.fullName,
          dob: d.dob,
          gender: d.gender,
          email: d.email,
          phone: d.phone,
          state: d.state,
          academyName: d.academyName,
          athletePhoto: d.athletePhoto,
          currentDanGrade: d.currentDanGrade,
          currentBeltTitle: d.currentBeltTitle,
          appliedDanGrade: d.appliedDanGrade,
          appliedDanTitle: d.appliedDanTitle,
          previousDanCertNo: d.previousDanCertNo,
          previousDanIssueDate: d.previousDanIssueDate,
          previousDanIssuedBy: d.previousDanIssuedBy,
          instructorName: d.instructorName,
          instructorDanGrade: d.instructorDanGrade,
          aadhaarDoc: d.aadhaarDoc,
          aadhaarDocName: d.aadhaarDocName,
          currentCertDoc: d.currentCertDoc,
          currentCertDocName: d.currentCertDocName,
          medicalFitnessDoc: d.medicalFitnessDoc,
          medicalFitnessDocName: d.medicalFitnessDocName,
          thesisDoc: d.thesisDoc,
          thesisDocName: d.thesisDocName,
          paymentProofDoc: d.paymentProofDoc,
          paymentProofDocName: d.paymentProofDocName,
          paymentProofDocSize: d.paymentProofDocSize,
          paymentStatus: d.paymentStatus,
          paymentMethod: d.paymentMethod,
          transactionId: d.transactionId,
          paymentAmount: d.paymentAmount,
          declarationAccepted: d.declarationAccepted,
          appliedDate: d.appliedDate,
          status: d.status,
          adminVerificationRemarks: d.adminVerificationRemarks,
          attendance: d.attendance,
          examDate: d.examDate,
          examVenue: d.examVenue,
          examTime: d.examTime,
          admitCardIssued: d.admitCardIssued ?? false,
          admitCardIssuedAt: d.admitCardIssuedAt,
          assessment: d.assessment,
          certificateNumber: d.certificateNumber,
          certificateIssuedDate: d.certificateIssuedDate,
          idCardNumber: d.idCardNumber,
        }));
      }
    } catch (err) {
      console.error("DanGradingStore.getAllDanApplications error:", err);
    }
  }
  const fileData = await getFileDanData();
  return fileData.applications || [...cachedApplications];
}

export async function getDanApplicationById(queryId: string): Promise<DanApplication | null> {
  if (!queryId || !queryId.trim()) return null;
  const clean = queryId.trim();
  const qLower = clean.toLowerCase();

  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escaped}$`, "i");
      const doc = await DanApplicationModel.findOne({
        $or: [
          { id: regex },
          { athleteId: regex },
          { certificateNumber: regex },
          { idCardNumber: regex },
          { email: regex },
          { phone: clean },
        ],
      })
        .sort({ appliedDate: -1, _id: -1 })
        .lean();
      if (doc) return doc as any;
    } catch (err) {
      console.error("DanGradingStore.getDanApplicationById error:", err);
    }
  }

  // Comprehensive fallback in JSON storage and memory
  const allApps = await getAllDanApplications();
  return (
    allApps.find(
      (a) =>
        a.id?.toLowerCase() === qLower ||
        a.athleteId?.toLowerCase() === qLower ||
        a.certificateNumber?.toLowerCase() === qLower ||
        a.idCardNumber?.toLowerCase() === qLower ||
        a.email?.toLowerCase() === qLower ||
        a.phone?.trim() === clean
    ) || null
  );
}

/**
 * Safely converts Base64 Data URL to local static file path in public/uploads/dan-docs
 * to avoid MongoDB 16MB BSON document size overflow (ERR_OUT_OF_RANGE).
 */
export async function normalizeAndSaveDanDoc(
  dataUrlOrPath: string | undefined,
  prefix: string,
  originalName?: string
): Promise<string | undefined> {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== "string") return dataUrlOrPath;

  // If already saved as URL or path, return as is
  if (!dataUrlOrPath.startsWith("data:")) {
    return dataUrlOrPath;
  }

  try {
    const commaIndex = dataUrlOrPath.indexOf(",");
    if (commaIndex === -1) {
      return dataUrlOrPath;
    }

    const header = dataUrlOrPath.slice(0, commaIndex); // e.g. "data:image/png;base64" or "data:application/pdf;base64"
    const base64Data = dataUrlOrPath.slice(commaIndex + 1);

    if (!header.includes(";base64")) {
      return dataUrlOrPath;
    }

    const mimeType = header.replace(/^data:/, "").split(";")[0]?.toLowerCase() || "";
    let buffer = Buffer.from(base64Data, "base64");

    // Determine extension
    let ext = ".pdf";
    if (mimeType.includes("png")) ext = ".png";
    else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg";
    else if (mimeType.includes("webp")) ext = ".webp";
    else if (mimeType.includes("pdf")) ext = ".pdf";
    else if (originalName && originalName.includes(".")) {
      ext = path.extname(originalName);
    }

    // Optimize images on the fly with Sharp to save bandwidth
    if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].some((t) => mimeType.includes(t))) {
      try {
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default || sharpModule;
        const compressed = await (sharp as any)(buffer)
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        buffer = Buffer.from(compressed);
        ext = ".webp";
      } catch (err) {
        // Fallback to original uncompressed buffer
      }
    }

    const cleanName = (originalName || prefix)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 35);
    const fileName = `${Date.now()}_${prefix}_${cleanName}${ext.startsWith(".") ? ext : "." + ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "dan-docs");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    return `/uploads/dan-docs/${fileName}`;
  } catch (err) {
    console.error(`DanGradingStore: Failed to normalize base64 doc for ${prefix}:`, err);
    return dataUrlOrPath;
  }
}

export async function createDanApplication(
  appData: Omit<DanApplication, "id" | "appliedDate" | "status"> & { id?: string }
): Promise<DanApplication> {
  const allApps = await getAllDanApplications();

  // Allow unrestricted multi-registration for Dan gradings (e.g. multiple sessions, retakes, or promotions)

  // Calculate globally unique sequential tracking ID
  let maxNum = 0;
  for (const app of allApps) {
    const match = app.id?.match(/KAC-DAN-APP-\d+-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const nextNum = Math.max(maxNum + 1, allApps.length + 1);
  const id = appData.id || `KAC-DAN-APP-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;
  const appliedDate = new Date().toISOString().split("T")[0];

  // Safely normalize all Base64 documents to static file URLs to prevent MongoDB 16MB BSON limit errors
  const [
    aadhaarDocUrl,
    currentCertDocUrl,
    medicalFitnessDocUrl,
    thesisDocUrl,
    paymentProofDocUrl,
    athletePhotoUrl,
  ] = await Promise.all([
    normalizeAndSaveDanDoc(appData.aadhaarDoc, "aadhaar", appData.aadhaarDocName),
    normalizeAndSaveDanDoc(appData.currentCertDoc, "currentCert", appData.currentCertDocName),
    normalizeAndSaveDanDoc(appData.medicalFitnessDoc, "medicalFitness", appData.medicalFitnessDocName),
    normalizeAndSaveDanDoc(appData.thesisDoc, "thesis", appData.thesisDocName),
    normalizeAndSaveDanDoc(appData.paymentProofDoc, "paymentProof", appData.paymentProofDocName),
    normalizeAndSaveDanDoc(appData.athletePhoto, "photo", appData.athletePhotoName),
  ]);

  const newApp: DanApplication = {
    ...appData,
    aadhaarDoc: aadhaarDocUrl || appData.aadhaarDoc || undefined,
    aadhaarDocName: (aadhaarDocUrl || appData.aadhaarDoc) ? appData.aadhaarDocName : undefined,
    currentCertDoc: currentCertDocUrl || appData.currentCertDoc || undefined,
    currentCertDocName: (currentCertDocUrl || appData.currentCertDoc) ? appData.currentCertDocName : undefined,
    medicalFitnessDoc: medicalFitnessDocUrl || appData.medicalFitnessDoc || undefined,
    medicalFitnessDocName: (medicalFitnessDocUrl || appData.medicalFitnessDoc) ? appData.medicalFitnessDocName : undefined,
    thesisDoc: thesisDocUrl || appData.thesisDoc || undefined,
    thesisDocName: (thesisDocUrl || appData.thesisDoc) ? appData.thesisDocName : undefined,
    paymentProofDoc: paymentProofDocUrl || appData.paymentProofDoc || undefined,
    paymentProofDocName: (paymentProofDocUrl || appData.paymentProofDoc) ? appData.paymentProofDocName : undefined,
    athletePhoto: athletePhotoUrl || appData.athletePhoto || undefined,
    id,
    appliedDate,
    status: "Submitted",
    attendance: "Pending",
  };

  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      await DanApplicationModel.create(newApp);
      if (newApp.examId) {
        await DanExamSessionModel.updateOne(
          { id: newApp.examId },
          { $inc: { candidatesCount: 1 } }
        );
      }
    } catch (err) {
      console.error("DanGradingStore.createDanApplication DB error:", err);
    }
  }

  const updatedApps = [newApp, ...allApps.filter((a) => a.id !== newApp.id)];
  await saveFileDanData({ applications: updatedApps });
  cachedApplications = updatedApps;

  return newApp;
}

export async function deleteDanApplication(id: string): Promise<boolean> {
  const cleanId = id.trim();
  const isConnected = await safeConnect();
  let deletedFromMongo = false;

  if (isConnected) {
    try {
      const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const targetDoc = await DanApplicationModel.findOne({
        $or: [
          { id: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { athleteId: { $regex: new RegExp(`^${escaped}$`, "i") } },
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
        ],
      });

      if (targetDoc) {
        if (targetDoc.examId) {
          await DanExamSessionModel.updateOne(
            { id: targetDoc.examId, candidatesCount: { $gt: 0 } },
            { $inc: { candidatesCount: -1 } }
          );
        }
        await DanApplicationModel.deleteOne({ _id: targetDoc._id });
        deletedFromMongo = true;

        // Cascade delete any linked ID card & certificate
        try {
          const { deleteIdCard } = await import("@/lib/id-cards-store");
          if (targetDoc.idCardNumber) await deleteIdCard(targetDoc.idCardNumber);
          await deleteIdCard(targetDoc.id);
        } catch {}

        try {
          await DanCertificateModel.deleteMany({
            $or: [
              { athleteId: targetDoc.athleteId },
              { idCardNumber: targetDoc.idCardNumber },
              { certificateNumber: targetDoc.certificateNumber },
            ].filter((f: any) => Object.values(f)[0]),
          });
        } catch {}
      }
    } catch (err) {
      console.error("DanGradingStore.deleteDanApplication DB error:", err);
    }
  }

  const allApps = await getFileDanData().then((f) => f.applications || []).catch(() => []);
  const filtered = allApps.filter(
    (a) =>
      a.id.toLowerCase() !== cleanId.toLowerCase() &&
      a.athleteId.toLowerCase() !== cleanId.toLowerCase()
  );
  await saveFileDanData({ applications: filtered });
  cachedApplications = cachedApplications.filter(
    (a) =>
      a.id.toLowerCase() !== cleanId.toLowerCase() &&
      a.athleteId.toLowerCase() !== cleanId.toLowerCase()
  );

  return isConnected ? deletedFromMongo : true;
}

export const registerDanApplication = createDanApplication;

export async function updateDanApplicationStatus(
  id: string,
  status: DanApplicationStatus,
  remarks?: string,
  extraUpdates: Partial<DanApplication> = {}
): Promise<DanApplication | null> {
  const cleanId = id?.trim() || "";
  const isConnected = await safeConnect();

  // Normalize any uploaded Base64 docs in extraUpdates
  const processedExtra = { ...extraUpdates };
  if (processedExtra.aadhaarDoc) {
    processedExtra.aadhaarDoc = await normalizeAndSaveDanDoc(processedExtra.aadhaarDoc, "aadhaar", processedExtra.aadhaarDocName);
  }
  if (processedExtra.currentCertDoc) {
    processedExtra.currentCertDoc = await normalizeAndSaveDanDoc(processedExtra.currentCertDoc, "currentCert", processedExtra.currentCertDocName);
  }
  if (processedExtra.medicalFitnessDoc) {
    processedExtra.medicalFitnessDoc = await normalizeAndSaveDanDoc(processedExtra.medicalFitnessDoc, "medicalFitness", processedExtra.medicalFitnessDocName);
  }
  if (processedExtra.thesisDoc) {
    processedExtra.thesisDoc = await normalizeAndSaveDanDoc(processedExtra.thesisDoc, "thesis", processedExtra.thesisDocName);
  }
  if (processedExtra.paymentProofDoc) {
    processedExtra.paymentProofDoc = await normalizeAndSaveDanDoc(processedExtra.paymentProofDoc, "paymentProof", processedExtra.paymentProofDocName);
  }
  if (processedExtra.athletePhoto) {
    processedExtra.athletePhoto = await normalizeAndSaveDanDoc(processedExtra.athletePhoto, "photo", processedExtra.athletePhotoName);
  }

  const updates: Partial<DanApplication> = {
    status,
    ...(remarks !== undefined && { adminVerificationRemarks: remarks }),
    ...processedExtra,
  };

  if (isConnected) {
    try {
      const doc = await DanApplicationModel.findOneAndUpdate(
        {
          $or: [
            { id: { $regex: new RegExp(`^${cleanId}$`, "i") } },
            { athleteId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
          ],
        },
        { $set: updates },
        { returnDocument: "after" }
      ).lean();
      if (doc) return doc as any;
    } catch (err) {
      console.error("DanGradingStore.updateDanApplicationStatus DB error:", err);
    }
  }

  const allApps = await getAllDanApplications();
  const idx = allApps.findIndex(
    (a) =>
      a.id.toLowerCase() === cleanId.toLowerCase() ||
      a.athleteId.toLowerCase() === cleanId.toLowerCase()
  );
  if (idx !== -1) {
    allApps[idx] = { ...allApps[idx], ...updates };
    await saveFileDanData({ applications: allApps });
    cachedApplications = allApps;
    return allApps[idx];
  }
  return null;
}

// ----------------- ASSESSMENT & CERTIFICATION -----------------

export async function saveDanAssessment(
  appId: string,
  assessmentData: DanAssessmentScore,
  resultStatus: "Passed" | "Failed" | "Re-test"
): Promise<{ application: DanApplication; certificate?: DanCertificateData }> {
  let certNumber = "";
  let idCardNumber = "";
  const now = new Date().toISOString().split("T")[0];

  if (resultStatus === "Passed") {
    const certSuffix = Math.floor(1000 + Math.random() * 9000);
    certNumber = `KAC-DAN-${new Date().getFullYear()}-${certSuffix}`;
    idCardNumber = `KAC-DAN-ID-${certSuffix}`;
  }

  const updates: Partial<DanApplication> = {
    status: resultStatus,
    assessment: assessmentData,
    ...(resultStatus === "Passed" && {
      certificateNumber: certNumber,
      certificateIssuedDate: now,
      idCardNumber,
    }),
  };

  const updatedApp = await updateDanApplicationStatus(appId, resultStatus, undefined, updates);
  if (!updatedApp) {
    throw new Error(`Dan application ${appId} not found`);
  }

  let certData: DanCertificateData | undefined;

  if (resultStatus === "Passed") {
    const danInfo = await getDanGradeByDan(updatedApp.appliedDanGrade) || DAN_GRADES[0];
    const session = updatedApp.examId ? await getDanExamSessionById(updatedApp.examId) : null;

    certData = {
      certificateNumber: certNumber,
      idCardNumber,
      candidateName: updatedApp.fullName,
      athleteId: updatedApp.athleteId,
      danRank: updatedApp.appliedDanGrade,
      danRankTitle: updatedApp.appliedDanTitle,
      japaneseTitle: danInfo.titleJapanese,
      koreanTitle: danInfo.titleKorean,
      discipline: session?.discipline || "Kalawar Martial Arts",
      academyName: updatedApp.academyName,
      state: updatedApp.state,
      photoUrl: updatedApp.athletePhoto,
      dob: updatedApp.dob,
      issueDate: now,
      examDate: updatedApp.examDate || session?.examDate || now,
      score: assessmentData.totalScore,
      grade: assessmentData.grade,
      presidentName: "MR. SANTOSH KASBE",
      presidentRole: "Founder & President – India | Head – Technical Committee, India",
      chiefExaminer: session?.chiefExaminer || "Grandmaster Santosh Kasbe (9th Dan)",
      chiefExaminerRank:
        session?.chiefExaminerRank || "Founder & President – India | Head – Technical Committee, India",
      qrCodeUrl: `/certificates/dan/${certNumber}`,
      status: "Valid",
    };

    const isConnected = await safeConnect();
    if (isConnected) {
      try {
        await DanCertificateModel.create(certData);

        // Update Athlete's PlayerModel beltHistory
        await PlayerModel.updateOne(
          { id: updatedApp.athleteId },
          {
            $set: {
              beltRank: updatedApp.appliedDanTitle,
            },
            $push: {
              beltHistory: {
                id: `BH-${Date.now()}`,
                examId: updatedApp.examId,
                belt: updatedApp.appliedDanTitle,
                previousBelt: updatedApp.currentBeltTitle,
                promotedDate: now,
                examinerName: certData.chiefExaminer,
                certificateNumber: certNumber,
                academyName: updatedApp.academyName,
                score: assessmentData.totalScore,
                grade: assessmentData.grade,
                status: "Passed",
                remarks: assessmentData.examinerRemarks || "Official Dan promotion ratified by Technical Committee.",
              },
            },
          }
        );

        // Auto-issue Dan ID card in ID Cards Governance Center
        try {
          const { upsertDanIdCard } = await import("./id-cards-store");
          await upsertDanIdCard(updatedApp, certData, "Active");
        } catch (idCardErr) {
          console.error("DanGradingStore.saveDanAssessment ID Card auto-issue error:", idCardErr);
        }
      } catch (err) {
        console.error("DanGradingStore.saveDanAssessment DB Sync error:", err);
      }
    } else {
      // Offline fallback: Still upsert Dan ID card to local store
      try {
        const { upsertDanIdCard } = await import("./id-cards-store");
        await upsertDanIdCard(updatedApp, certData, "Active");
      } catch (idCardErr) {
        console.error("DanGradingStore.saveDanAssessment local ID Card auto-issue error:", idCardErr);
      }
    }
  }

  return { application: updatedApp, certificate: certData };
}

// ----------------- CERTIFICATE & ID CARD LOOKUP -----------------

export async function getDanCertificateByNumber(
  certOrAppId: string
): Promise<DanCertificateData | null> {
  if (!certOrAppId || !certOrAppId.trim()) return null;
  const clean = certOrAppId.trim();
  const qLower = clean.toLowerCase();

  const isConnected = await safeConnect();
  if (isConnected) {
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escaped}$`, "i");
      const cert = await DanCertificateModel.findOne({
        $or: [
          { certificateNumber: regex },
          { idCardNumber: regex },
          { athleteId: regex },
        ],
      })
        .sort({ issueDate: -1, _id: -1 })
        .lean();
      if (cert) return cert as any;
    } catch (err) {
      console.error("DanGradingStore.getDanCertificateByNumber error:", err);
    }
  }

  // Fallback find in application
  const allApps = await getAllDanApplications();
  const app = allApps.find(
    (a) =>
      a.certificateNumber?.toLowerCase() === qLower ||
      a.idCardNumber?.toLowerCase() === qLower ||
      a.athleteId?.toLowerCase() === qLower ||
      a.id?.toLowerCase() === qLower
  );

  if (app && (app.certificateNumber || app.status === "Passed")) {
    const allGrades = await getAllDanGrades();
    const danInfo = allGrades.find((d) => d.dan === app.appliedDanGrade) || DAN_GRADES[0];
    const certNum = app.certificateNumber || `KAC-DAN-2026-${app.id.split("-").pop() || "1001"}`;
    const idCardNum = app.idCardNumber || `KAC-DAN-ID-${certNum.split("-").pop()}`;

    return {
      certificateNumber: certNum,
      idCardNumber: idCardNum,
      candidateName: app.fullName,
      athleteId: app.athleteId,
      danRank: app.appliedDanGrade,
      danRankTitle: app.appliedDanTitle,
      japaneseTitle: danInfo.titleJapanese,
      koreanTitle: danInfo.titleKorean,
      discipline: "Kalawar Martial Arts",
      academyName: app.academyName,
      state: app.state,
      photoUrl: app.athletePhoto,
      dob: app.dob,
      issueDate: app.certificateIssuedDate || app.appliedDate || "2026-09-04",
      examDate: app.examDate || "2026-09-28",
      score: app.assessment?.totalScore || 92,
      grade: app.assessment?.grade || "Distinction (90%+)",
      presidentName: "MR. SANTOSH KASBE",
      presidentRole: "Founder & President – India | Head – Technical Committee, India",
      chiefExaminer: "Grandmaster Santosh Kasbe (9th Dan)",
      chiefExaminerRank: "Founder & President – India | Head – Technical Committee, India",
      qrCodeUrl: `/certificates/dan/${certNum}`,
      status: "Valid",
    };
  }

  return null;
}
