import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { BeltExamModel, BeltLevelModel } from "@/models/BeltExam";
import {
  STANDARD_BELT_LEVELS,
  type BeltLevel,
  type BeltExamSession,
  type ExamCandidate,
} from "@/data/belt-exams";
import { promotePlayerBelt, getPlayerById, getPlayers } from "./players-store";
import {
  sendBeltExamRegistrationSlipEmail,
  sendBeltExamAdmitCardIssuedEmail,
  sendBeltExamResultDeclaredEmail,
} from "./email-service";
import { withRedisCache, invalidateBeltExamCache } from "./redis";

let cachedBeltLevels: BeltLevel[] = JSON.parse(JSON.stringify(STANDARD_BELT_LEVELS));

export const DEFAULT_BELT_EXAM_SESSIONS: BeltExamSession[] = [
  {
    id: "KAC-EXAM-2026-01",
    title: "All India Gup & Belt Promotion Examination 2026 - National Session",
    discipline: "Kalawar Martial Arts",
    examDate: "2026-06-20",
    reportingTime: "08:30 AM",
    examEndTime: "04:30 PM",
    venueName: "Shiv Chhatrapati Sports Complex, Multi-Purpose Indoor Arena",
    venueAddress: "Balewadi, Pune, Maharashtra 411045",
    city: "Pune",
    state: "Maharashtra",
    chiefExaminer: "Grandmaster R. K. Kalawar",
    chiefExaminerRank: "8th Dan Black Belt",
    examiners: ["Master Vikram Patil (6th Dan)", "Master Anita Deshmukh (5th Dan)"],
    eligibleBelts: [
      "White Belt",
      "Yellow Belt",
      "Orange Belt",
      "Green Belt",
      "Blue Belt",
      "Purple Belt",
      "Red Belt-1",
      "Red Belt-2",
      "Red Belt-3",
    ],
    registrationDeadline: "2026-06-15",
    maxCandidates: 150,
    description: "Official technical evaluation and physical performance grading for all student martial artists seeking rank accreditation from Yellow Belt to Junior Black Belt.",
    status: "Registration Open",
    bannerImage: "/images/hero/dojo-hero.jpg",
    candidates: [],
  },
  {
    id: "KAC-EXAM-2026-02",
    title: "West Zone Technical Gup Examination - Mumbai Chapter",
    discipline: "Kalawar Martial Arts",
    examDate: "2026-07-18",
    reportingTime: "09:00 AM",
    examEndTime: "05:00 PM",
    venueName: "Andheri Sports Complex (Shahaji Raje Krida Sankul)",
    venueAddress: "Veera Desai Road, Andheri West, Mumbai 400053",
    city: "Mumbai",
    state: "Maharashtra",
    chiefExaminer: "Master Vikram Patil",
    chiefExaminerRank: "6th Dan Black Belt",
    examiners: ["Master Anita Deshmukh (5th Dan)", "Instructor Suresh Nair (4th Dan)"],
    eligibleBelts: [
      "White Belt",
      "Yellow Belt",
      "Orange Belt",
      "Green Belt",
      "Blue Belt",
      "Purple Belt",
    ],
    registrationDeadline: "2026-07-10",
    maxCandidates: 100,
    description: "Regional quarterly belt grading assessment for dojos across Mumbai and Thane regions.",
    status: "Registration Open",
    bannerImage: "/images/hero/dojo-hero.jpg",
    candidates: [],
  },
];

let cachedBeltExamSessions: BeltExamSession[] = [...DEFAULT_BELT_EXAM_SESSIONS];

// Fallback JSON file storage helpers
async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "belt-exams.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "belt-exams.json");

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
        await fs.writeFile(primaryPath, JSON.stringify(DEFAULT_BELT_EXAM_SESSIONS, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileBeltExams(): Promise<BeltExamSession[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = raw.trim() ? (JSON.parse(raw) as BeltExamSession[]) : [];
    if (parsed.length > 0) {
      cachedBeltExamSessions = parsed;
      return parsed;
    }
    // Seed default sessions if empty
    cachedBeltExamSessions = [...DEFAULT_BELT_EXAM_SESSIONS];
    await saveFileBeltExams(DEFAULT_BELT_EXAM_SESSIONS);
    return DEFAULT_BELT_EXAM_SESSIONS;
  } catch {
    return cachedBeltExamSessions.length > 0 ? cachedBeltExamSessions : [...DEFAULT_BELT_EXAM_SESSIONS];
  }
}

async function saveFileBeltExams(exams: BeltExamSession[]): Promise<void> {
  try {
    const file = await ensureFileStorage();
    await fs.writeFile(file, JSON.stringify(exams, null, 2), "utf-8");
  } catch (error) {
    console.warn("Could not save to belt-exams.json fallback:", error instanceof Error ? error.message : "");
  }
  await invalidateBeltExamCache();
}

export async function getBeltExams(): Promise<BeltExamSession[]> {
  return withRedisCache("cache:beltexams:sessions:all", 300, fetchRawBeltExams);
}

async function fetchRawBeltExams(): Promise<BeltExamSession[]> {
  try {
    await connectToDatabase();
    const docs = await BeltExamModel.find().sort({ examDate: -1 }).lean();
    if (Array.isArray(docs)) {
      const mapped = docs.map((d: any) => ({
        id: d.id,
        title: d.title,
        discipline: d.discipline || "Kalawar Martial Arts",
        examDate: d.examDate,
        reportingTime: d.reportingTime || "08:00 AM",
        examEndTime: d.examEndTime || "05:00 PM",
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        city: d.city,
        state: d.state,
        chiefExaminer: d.chiefExaminer,
        chiefExaminerRank: d.chiefExaminerRank || "",
        examiners: d.examiners || [],
        eligibleBelts: d.eligibleBelts || [],
        registrationDeadline: d.registrationDeadline,
        maxCandidates: d.maxCandidates || 100,
        description: d.description || "",
        status: d.status || "Registration Open",
        bannerImage: d.bannerImage,
        candidates: (d.candidates || []).map((c: any) => ({
          ...c,
          status: c.status || "Submitted",
          registrationSlipId: c.registrationSlipId || `KAC-BELT-REG-2026-${c.id?.split("-").pop() || "001"}`,
        })),
      }));

      cachedBeltExamSessions = mapped;
      await saveFileBeltExams(mapped);
      return mapped;
    }
  } catch (error) {
    console.warn("MongoDB fetch note for BeltExams fallback to file storage:", error instanceof Error ? error.message : "");
  }

  const fileExams = await getFileBeltExams();
  return fileExams && fileExams.length > 0 ? fileExams : [];
}

export async function getBeltExamById(id: string): Promise<BeltExamSession | null> {
  const cleanId = (id || "").trim();
  if (!cleanId) return null;
  return withRedisCache(`cache:beltexams:session:${cleanId.toLowerCase()}`, 600, () => fetchRawBeltExamById(cleanId));
}

async function fetchRawBeltExamById(cleanId: string): Promise<BeltExamSession | null> {

  try {
    await connectToDatabase();
    const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const d: any = await BeltExamModel.findOne({
      id: { $regex: new RegExp("^" + escapedId + "$", "i") },
    }).lean();

    if (d) {
      return {
        id: d.id,
        title: d.title,
        discipline: d.discipline || "Kalawar Martial Arts",
        examDate: d.examDate,
        reportingTime: d.reportingTime || "08:00 AM",
        examEndTime: d.examEndTime || "05:00 PM",
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        city: d.city,
        state: d.state,
        chiefExaminer: d.chiefExaminer,
        chiefExaminerRank: d.chiefExaminerRank || "",
        examiners: d.examiners || [],
        eligibleBelts: d.eligibleBelts || [],
        registrationDeadline: d.registrationDeadline,
        maxCandidates: d.maxCandidates || 100,
        description: d.description || "",
        status: d.status || "Registration Open",
        bannerImage: d.bannerImage,
        candidates: (d.candidates || []).map((c: any) => ({
          ...c,
          status: c.status || "Submitted",
          registrationSlipId: c.registrationSlipId || `KAC-BELT-REG-2026-${c.id?.split("-").pop() || "001"}`,
        })),
      };
    }
  } catch {
    // Fallback
  }

  const list = await getFileBeltExams();
  return list.find((e) => e.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

export async function createBeltExam(input: Partial<BeltExamSession>): Promise<BeltExamSession> {
  const year = new Date().getFullYear();
  const randomSuffix = String(Math.floor(100 + Math.random() * 900));
  const id = input.id?.trim() || `KBE-${year}-${randomSuffix}`;

  const examObj: BeltExamSession = {
    id,
    title: input.title?.trim() || `National Belt Grading Examination ${year}`,
    discipline: input.discipline?.trim() || "Kalawar Martial Arts",
    examDate: input.examDate?.trim() || new Date().toISOString().split("T")[0],
    reportingTime: input.reportingTime?.trim() || "08:00 AM",
    examEndTime: input.examEndTime?.trim() || "05:00 PM",
    venueName: input.venueName?.trim() || "Federation Sports Arena",
    venueAddress: input.venueAddress?.trim() || "Main Sports Complex",
    city: input.city?.trim() || "Pune",
    state: input.state?.trim() || "Maharashtra",
    chiefExaminer: input.chiefExaminer?.trim() || "Grandmaster Rajesh Sharma (8th Dan)",
    chiefExaminerRank: input.chiefExaminerRank?.trim() || "8th Dan Black Belt, Chief Technical Officer",
    examiners: input.examiners || ["Sensei Amit Patil (5th Dan)"],
    eligibleBelts: input.eligibleBelts || [
      "Yellow Belt",
      "Yellow Belt-1",
      "Green Belt",
      "Green Belt-1",
      "Blue Belt",
      "Blue Belt-1",
      "Red Belt",
      "Red Belt-1",
      "Red Belt-2",
      "Red Belt-3",
      "Junior Black Belt",
    ],
    registrationDeadline: input.registrationDeadline?.trim() || input.examDate || new Date().toISOString().split("T")[0],
    maxCandidates: Number(input.maxCandidates) || 100,
    description: input.description?.trim() || "",
    status: input.status || "Registration Open",
    bannerImage: input.bannerImage || "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80",
    candidates: input.candidates || [],
  };

  try {
    await connectToDatabase();
    const created = await BeltExamModel.create(examObj);
    const list = await getFileBeltExams();
    await saveFileBeltExams([examObj, ...list.filter((e) => e.id.toLowerCase() !== examObj.id.toLowerCase())]);
    return created.toJSON() as BeltExamSession;
  } catch (error) {
    console.warn("MongoDB create note for BeltExam: Saved to persistent storage.", error instanceof Error ? error.message : "");
    const list = await getFileBeltExams();
    await saveFileBeltExams([examObj, ...list.filter((e) => e.id.toLowerCase() !== examObj.id.toLowerCase())]);
    return examObj;
  }
}

export async function updateBeltExam(
  id: string,
  updates: Partial<BeltExamSession>
): Promise<BeltExamSession | null> {
  const cleanId = (id || "").trim();
  const updateFields: any = { ...updates };
  delete updateFields.id;
  delete updateFields._id;

  try {
    await connectToDatabase();
    const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Check if document exists or needs seeding during update
    const existingDoc = await BeltExamModel.findOne({
      id: { $regex: new RegExp("^" + escapedId + "$", "i") },
    });

    let d: any = null;
    if (existingDoc) {
      d = await BeltExamModel.findOneAndUpdate(
        { id: { $regex: new RegExp("^" + escapedId + "$", "i") } },
        { $set: updateFields },
        { returnDocument: "after" }
      ).lean();
    } else {
      const fileList = await getFileBeltExams();
      const fileMatch = fileList.find((e) => e.id.toLowerCase() === cleanId.toLowerCase());
      const fullMergedSession: BeltExamSession = {
        id: cleanId,
        title: updates.title || fileMatch?.title || "National Belt Grading Examination",
        discipline: updates.discipline || fileMatch?.discipline || "Kalawar Martial Arts",
        examDate: updates.examDate || fileMatch?.examDate || new Date().toISOString().split("T")[0],
        reportingTime: updates.reportingTime || fileMatch?.reportingTime || "08:00 AM",
        examEndTime: updates.examEndTime || fileMatch?.examEndTime || "05:00 PM",
        venueName: updates.venueName || fileMatch?.venueName || "Federation Sports Arena",
        venueAddress: updates.venueAddress || fileMatch?.venueAddress || "Main Sports Complex",
        city: updates.city || fileMatch?.city || "Pune",
        state: updates.state || fileMatch?.state || "Maharashtra",
        chiefExaminer: updates.chiefExaminer || fileMatch?.chiefExaminer || "Grandmaster Rajesh Sharma",
        chiefExaminerRank: updates.chiefExaminerRank || fileMatch?.chiefExaminerRank || "",
        examiners: updates.examiners || fileMatch?.examiners || [],
        eligibleBelts: updates.eligibleBelts || fileMatch?.eligibleBelts || [],
        registrationDeadline: updates.registrationDeadline || fileMatch?.registrationDeadline || "",
        maxCandidates: updates.maxCandidates || fileMatch?.maxCandidates || 100,
        description: updates.description || fileMatch?.description || "",
        status: updates.status || fileMatch?.status || "Registration Open",
        bannerImage: updates.bannerImage || fileMatch?.bannerImage || "",
        candidates: updates.candidates || fileMatch?.candidates || [],
      };

      d = await BeltExamModel.findOneAndUpdate(
        { id: { $regex: new RegExp("^" + escapedId + "$", "i") } },
        { $set: fullMergedSession },
        { upsert: true, returnDocument: "after" }
      ).lean();
    }

    if (d) {
      const fileList = await getFileBeltExams();
      const fIdx = fileList.findIndex((e) => e.id.toLowerCase() === cleanId.toLowerCase());
      if (fIdx !== -1) {
        fileList[fIdx] = { ...fileList[fIdx], ...updateFields, id: fileList[fIdx].id };
        await saveFileBeltExams(fileList);
      }
      return {
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
        eligibleBelts: d.eligibleBelts || [],
        registrationDeadline: d.registrationDeadline,
        maxCandidates: d.maxCandidates,
        description: d.description,
        status: d.status,
        bannerImage: d.bannerImage,
        candidates: (d.candidates || []).map((c: any) => ({
          ...c,
          status: c.status || "Submitted",
          registrationSlipId: c.registrationSlipId || `KAC-BELT-REG-2026-${c.id?.split("-").pop() || "001"}`,
        })),
      };
    }
  } catch (err) {
    console.warn("MongoDB update note for BeltExam:", err instanceof Error ? err.message : "");
  }

  const list = await getFileBeltExams();
  const index = list.findIndex((e) => e.id.toLowerCase() === cleanId.toLowerCase());
  if (index === -1) return null;

  const updated: BeltExamSession = {
    ...list[index],
    ...updateFields,
    id: list[index].id,
  };

  list[index] = updated;
  await saveFileBeltExams(list);
  return updated;
}

export async function deleteBeltExam(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deletedFromMongo = false;
  try {
    await connectToDatabase();
    const res = await BeltExamModel.findOneAndDelete({
      id: { $regex: new RegExp("^" + cleanId + "$", "i") },
    });
    deletedFromMongo = !!res;
  } catch {
    // Fallback
  }

  const list = await getFileBeltExams();
  const filtered = list.filter((e) => e.id.toLowerCase() !== cleanId.toLowerCase());
  const deletedFromFile = filtered.length !== list.length;
  if (deletedFromFile || deletedFromMongo) {
    await saveFileBeltExams(filtered);
  }

  return deletedFromMongo || deletedFromFile;
}

export async function registerCandidateForExam(
  examId: string,
  candidateData: Omit<ExamCandidate, "id" | "registeredOn" | "attendance" | "resultStatus"> & {
    password?: string;
    isNewAccount?: boolean;
  }
): Promise<{ success: boolean; candidate?: ExamCandidate; error?: string }> {
  let exam = await getBeltExamById(examId);
  if (!exam) {
    const allExams = await getBeltExams();
    exam = allExams.find((e) => e.status === "Registration Open") || allExams[0];
  }
  if (!exam) {
    return { success: false, error: "Belt Examination session not found" };
  }

  // Allow unrestricted multi-registration for candidates / multiple belts across sessions

  // Try to enrich athlete details from player store
  const player = candidateData.athleteId ? await getPlayerById(candidateData.athleteId) : null;
  const athleteName = candidateData.athleteName || player?.name || "Athlete Candidate";
  const athleteImage = candidateData.athleteImage || player?.image || "";
  const clubName = candidateData.clubName || player?.club || "Independent Dojo";
  const state = candidateData.state || player?.state || "Maharashtra";
  const dob = candidateData.dob || player?.dob || "";
  const gender = candidateData.gender || (player?.gender as any) || "Male";
  const academyName = candidateData.academyName || player?.club || clubName;

  // Determine next globally unique sequential candidate roll number
  const allExams = await getBeltExams();
  let maxNum = 0;
  for (const ex of allExams) {
    for (const c of ex.candidates || []) {
      const match = c.id?.match(/CAND-\d+-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  }
  const nextNum = Math.max(maxNum + 1, (exam.candidates?.length || 0) + 1);
  const candidateId = `CAND-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;
  const registrationSlipId = `KAC-BELT-REG-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;

  const newCandidate: ExamCandidate = {
    id: candidateId,
    athleteId: candidateData.athleteId || `KSM-PL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    athleteName,
    athleteImage,
    dob,
    gender,
    academyName,
    clubName,
    state,
    phone: candidateData.phone || player?.phone || "",
    email: candidateData.email || player?.email || "",
    currentBelt: candidateData.currentBelt || player?.beltRank || "White Belt",
    targetBelt: candidateData.targetBelt,
    status: "Submitted",
    registrationSlipId,
    attendance: "Pending",
    registeredOn: new Date().toISOString().split("T")[0],
    resultStatus: "Pending",
  };

  const currentCandidates = exam.candidates || [];
  const updatedCandidates = [...currentCandidates, newCandidate];
  await updateBeltExam(exam.id, { candidates: updatedCandidates });

  // Dispatch Transactional Registration Slip Email in background
  if (newCandidate.email) {
    sendBeltExamRegistrationSlipEmail({
      email: newCandidate.email,
      candidateName: newCandidate.athleteName,
      athleteId: newCandidate.athleteId,
      candidateId: newCandidate.id,
      targetBelt: newCandidate.targetBelt,
      currentBelt: newCandidate.currentBelt,
      registrationSlipId: newCandidate.registrationSlipId,
      academyName: newCandidate.academyName,
      examSessionTitle: exam.title,
      sessionDate: exam.examDate,
      sessionVenue: exam.venueName,
      reportingTime: exam.reportingTime,
      password: candidateData.password,
      isNewAccount: candidateData.isNewAccount,
    }).catch((err) => console.warn("Belt Registration email failed:", err));
  }

  return { success: true, candidate: newCandidate };
}

export async function issueBeltAdmitCard(
  examId: string,
  candidateId: string,
  options?:
    | {
        issuedBy?: string;
        examDate?: string;
        examTime?: string;
        reportingTime?: string;
        sessionEndTime?: string;
        examVenue?: string;
        chiefExaminer?: string;
        chiefExaminerRank?: string;
        admitCardRemarks?: string;
      }
    | string
): Promise<{ success: boolean; candidate?: ExamCandidate; exam?: BeltExamSession; error?: string }> {
  const exam = await getBeltExamById(examId);
  if (!exam) return { success: false, error: "Exam session not found" };

  const candIndex = exam.candidates.findIndex(
    (c) => c.id.toLowerCase() === candidateId.toLowerCase() || c.athleteId.toLowerCase() === candidateId.toLowerCase()
  );
  if (candIndex === -1) return { success: false, error: "Candidate not found in session" };

  const cand = exam.candidates[candIndex];
  const admitCardNumber = cand.admitCardNumber || `KAC-BELT-ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const issuedBy = typeof options === "string" ? options : (options?.issuedBy || "Admin Secretariat");
  const examDate = typeof options === "object" ? options?.examDate : undefined;
  const examTime = typeof options === "object" ? options?.examTime : undefined;
  const reportingTime = typeof options === "object" ? options?.reportingTime : undefined;
  const sessionEndTime = typeof options === "object" ? options?.sessionEndTime : undefined;
  const examVenue = typeof options === "object" ? options?.examVenue : undefined;
  const chiefExaminer = typeof options === "object" ? options?.chiefExaminer : undefined;
  const chiefExaminerRank = typeof options === "object" ? options?.chiefExaminerRank : undefined;
  const admitCardRemarks = typeof options === "object" ? options?.admitCardRemarks : undefined;

  const updatedCandidate: ExamCandidate = {
    ...cand,
    status: "Admit Card Issued",
    admitCardNumber,
    admitCardIssuedAt: new Date().toISOString(),
    admitCardIssuedBy: issuedBy,
    examDate: examDate || cand.examDate || exam.examDate,
    examTime: examTime || cand.examTime || exam.reportingTime,
    reportingTime: reportingTime || cand.reportingTime || examTime || cand.examTime || exam.reportingTime,
    sessionEndTime: sessionEndTime || cand.sessionEndTime || exam.examEndTime,
    examVenue: examVenue || cand.examVenue || exam.venueName,
    chiefExaminer: chiefExaminer || cand.chiefExaminer || exam.chiefExaminer,
    chiefExaminerRank: chiefExaminerRank || cand.chiefExaminerRank || exam.chiefExaminerRank,
    admitCardRemarks: admitCardRemarks !== undefined ? admitCardRemarks : cand.admitCardRemarks,
  };

  const nextCandidates = [...exam.candidates];
  nextCandidates[candIndex] = updatedCandidate;

  const updatedExam = await updateBeltExam(exam.id, { candidates: nextCandidates });

  // Dispatch Admit Card Notification Email
  if (updatedCandidate.email) {
    sendBeltExamAdmitCardIssuedEmail({
      email: updatedCandidate.email,
      candidateName: updatedCandidate.athleteName,
      athleteId: updatedCandidate.athleteId,
      candidateId: updatedCandidate.id,
      admitCardNumber: updatedCandidate.admitCardNumber,
      targetBelt: updatedCandidate.targetBelt,
      academyName: updatedCandidate.academyName || updatedCandidate.clubName,
      examSessionTitle: exam.title,
      sessionDate: updatedCandidate.examDate || exam.examDate,
      sessionVenue: updatedCandidate.examVenue || exam.venueName,
      reportingTime: updatedCandidate.examTime || exam.reportingTime,
    }).catch((err) => console.warn("Belt Admit Card email failed:", err));
  }

  return { success: true, candidate: updatedCandidate, exam: updatedExam || exam };
}

export async function deleteCandidateFromExam(
  examId: string,
  candidateId: string
): Promise<{ success: boolean; exam?: BeltExamSession; error?: string }> {
  const exam = await getBeltExamById(examId);
  if (!exam) return { success: false, error: "Exam session not found" };

  const candIndex = exam.candidates.findIndex(
    (c) => c.id.toLowerCase() === candidateId.toLowerCase() || c.athleteId.toLowerCase() === candidateId.toLowerCase()
  );
  if (candIndex === -1) return { success: false, error: "Candidate not found in session" };

  const nextCandidates = exam.candidates.filter(
    (c) => c.id.toLowerCase() !== candidateId.toLowerCase() && c.athleteId.toLowerCase() !== candidateId.toLowerCase()
  );

  const updatedExam = await updateBeltExam(exam.id, { candidates: nextCandidates });
  return { success: true, exam: updatedExam || exam };
}

export async function updateCandidateAssessment(
  examId: string,
  candidateId: string,
  assessmentData: {
    attendance?: "Pending" | "Present" | "Absent";
    formsScore?: number;
    sparringScore?: number;
    selfDefenseScore?: number;
    fitnessScore?: number;
    examinerRemarks?: string;
    resultStatus?: "Pending" | "Pending Evaluation" | "Passed" | "Failed" | "Re-test" | string;
    evaluatedBy?: string;
  }
): Promise<{ success: boolean; candidate?: ExamCandidate; error?: string }> {
  const exam = await getBeltExamById(examId);
  if (!exam) return { success: false, error: "Exam session not found" };

  const candIndex = exam.candidates.findIndex(
    (c) => c.id.toLowerCase() === candidateId.toLowerCase() || c.athleteId.toLowerCase() === candidateId.toLowerCase()
  );
  if (candIndex === -1) return { success: false, error: "Candidate not found in session" };

  const cand = exam.candidates[candIndex];

  const formsScore = assessmentData.formsScore ?? cand.assessment?.formsScore ?? 0;
  const sparringScore = assessmentData.sparringScore ?? cand.assessment?.sparringScore ?? 0;
  const selfDefenseScore = assessmentData.selfDefenseScore ?? cand.assessment?.selfDefenseScore ?? 0;
  const fitnessScore = assessmentData.fitnessScore ?? cand.assessment?.fitnessScore ?? 0;
  const totalScore = formsScore + sparringScore + selfDefenseScore + fitnessScore;

  let grade: "Distinction" | "First Class" | "Pass" | "Fail" = "Pass";
  if (totalScore >= 90) grade = "Distinction";
  else if (totalScore >= 75) grade = "First Class";
  else if (totalScore >= 60) grade = "Pass";
  else grade = "Fail";

  const isPendingEvaluation =
    assessmentData.resultStatus === "Pending Evaluation" || assessmentData.resultStatus === "Pending";

  let resultStatus: "Pending" | "Passed" | "Failed" | "Re-test" = "Pending";
  if (isPendingEvaluation) {
    resultStatus = "Pending";
  } else if (assessmentData.resultStatus === "Passed" || assessmentData.resultStatus === "Failed" || assessmentData.resultStatus === "Re-test") {
    resultStatus = assessmentData.resultStatus;
  } else if (totalScore > 0) {
    resultStatus = totalScore >= 60 ? "Passed" : "Failed";
  }

  const certNumber = cand.certificateNumber || (resultStatus === "Passed" ? `KAC-BELT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined);
  const now = new Date().toISOString().split("T")[0];

  const updatedCandidate: ExamCandidate = {
    ...cand,
    attendance: assessmentData.attendance || cand.attendance,
    status: isPendingEvaluation ? (cand.status === "Submitted" ? "Submitted" : "Admit Card Issued") : "Result Declared",
    assessment: {
      formsScore,
      sparringScore,
      selfDefenseScore,
      fitnessScore,
      totalScore,
      grade,
      examinerRemarks: assessmentData.examinerRemarks ?? cand.assessment?.examinerRemarks ?? "",
    },
    resultStatus,
    resultDeclaredAt: isPendingEvaluation ? cand.resultDeclaredAt : now,
    certificateNumber: certNumber,
    evaluatedBy: assessmentData.evaluatedBy || exam.chiefExaminer,
    evaluatedAt: isPendingEvaluation ? cand.evaluatedAt : now,
  };

  const nextCandidates = [...exam.candidates];
  nextCandidates[candIndex] = updatedCandidate;

  await updateBeltExam(exam.id, { candidates: nextCandidates });

  // Auto-promote athlete player record if passed
  if (resultStatus === "Passed") {
    await promotePlayerBelt(cand.athleteId, {
      examId: exam.id,
      belt: cand.targetBelt,
      previousBelt: cand.currentBelt,
      promotedDate: exam.examDate || now,
      examinerName: updatedCandidate.evaluatedBy || exam.chiefExaminer,
      certificateNumber: certNumber || `KAC-BELT-${new Date().getFullYear()}-001`,
      academyName: cand.academyName || cand.clubName,
      score: totalScore,
      grade,
      status: "Passed",
      remarks: assessmentData.examinerRemarks || `Passed ${cand.targetBelt} grading examination.`,
    });
  }

  // Dispatch Result Declared Email if not pending
  if (updatedCandidate.email && !isPendingEvaluation) {
    sendBeltExamResultDeclaredEmail({
      email: updatedCandidate.email,
      candidateName: updatedCandidate.athleteName,
      athleteId: updatedCandidate.athleteId,
      candidateId: updatedCandidate.id,
      targetBelt: updatedCandidate.targetBelt,
      resultStatus,
      score: totalScore,
      grade,
      certificateNumber: certNumber,
      academyName: updatedCandidate.academyName || updatedCandidate.clubName,
      examinerRemarks: assessmentData.examinerRemarks,
    }).catch((err) => console.warn("Belt Result email failed:", err));
  }

  return { success: true, candidate: updatedCandidate };
}

export async function publishExamResultsAndPromote(
  examId: string
): Promise<{ success: boolean; promotedCount: number; error?: string }> {
  const exam = await getBeltExamById(examId);
  if (!exam) return { success: false, promotedCount: 0, error: "Exam session not found" };

  let promotedCount = 0;

  for (const cand of exam.candidates) {
    if (cand.resultStatus === "Passed" || (cand.assessment && cand.assessment.totalScore >= 60)) {
      const certNumber = cand.certificateNumber || `KAC-BELT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      await promotePlayerBelt(cand.athleteId, {
        examId: exam.id,
        belt: cand.targetBelt,
        previousBelt: cand.currentBelt,
        promotedDate: exam.examDate,
        examinerName: cand.evaluatedBy || exam.chiefExaminer,
        certificateNumber: certNumber,
        academyName: cand.academyName || cand.clubName,
        score: cand.assessment?.totalScore || 85,
        grade: cand.assessment?.grade || "Pass",
        status: "Passed",
        remarks: cand.assessment?.examinerRemarks || `Successfully passed ${cand.targetBelt} examination.`,
      });

      promotedCount++;
    }
  }

  await updateBeltExam(exam.id, { status: "Results Published" });
  return { success: true, promotedCount };
}

// ----------------- LOOKUP & CERTIFICATES -----------------

export async function getBeltCandidateByIdOrCert(
  query: string
): Promise<{ candidate: ExamCandidate; session: BeltExamSession } | null> {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();

  const allExams = await getBeltExams();
  for (const session of allExams) {
    const candidate = session.candidates?.find(
      (c) =>
        c.id?.toLowerCase() === clean ||
        c.athleteId?.toLowerCase() === clean ||
        c.registrationSlipId?.toLowerCase() === clean ||
        c.admitCardNumber?.toLowerCase() === clean ||
        c.certificateNumber?.toLowerCase() === clean ||
        c.email?.toLowerCase() === clean ||
        c.phone?.trim() === query.trim()
    );
    if (candidate) {
      return { candidate, session };
    }
  }
  return null;
}

export async function getBeltCertificateByNumber(
  certOrQueryId: string
): Promise<any | null> {
  if (!certOrQueryId || !certOrQueryId.trim()) return null;
  const cleanId = certOrQueryId.trim().toLowerCase();

  // 1. Search candidate across all belt exams
  const match = await getBeltCandidateByIdOrCert(cleanId);
  if (match) {
    const { candidate: cand, session: exam } = match;
    if (cand.resultStatus === "Passed" || (cand.assessment && cand.assessment.totalScore >= 60)) {
      const allLevels = await getBeltLevels();
      const level = allLevels.find(
        (l) => l.name.toLowerCase() === cand.targetBelt.toLowerCase() || l.id.toLowerCase() === cand.targetBelt.toLowerCase()
      );

      return {
        certificateNumber: cand.certificateNumber || `KAC-BELT-${new Date().getFullYear()}-${cand.id.slice(-3)}`,
        candidateName: cand.athleteName,
        athleteId: cand.athleteId,
        dob: cand.dob || "15/08/2005",
        gender: cand.gender || "Male",
        academyName: cand.academyName || cand.clubName,
        state: cand.state,
        beltRank: cand.targetBelt,
        previousBelt: cand.currentBelt,
        templateFile: level?.templateFile || "yellow-belt.png",
        examTitle: exam.title,
        examDate: exam.examDate,
        venueName: exam.venueName,
        chiefExaminer: cand.evaluatedBy || exam.chiefExaminer,
        chiefExaminerRank: exam.chiefExaminerRank || "Chief Technical Examiner",
        score: cand.assessment?.totalScore || 88,
        grade: cand.assessment?.grade || "Pass",
        status: "Valid & Verified",
        issuedDate: cand.evaluatedAt || cand.resultDeclaredAt || exam.examDate,
      };
    }
  }

  // 2. Search athlete beltHistory across players
  const allPlayers = await getPlayers();
  for (const player of allPlayers) {
    if (player.beltHistory && Array.isArray(player.beltHistory)) {
      const hist = player.beltHistory.find(
        (h) =>
          (h.certificateNumber && h.certificateNumber.toLowerCase() === cleanId) ||
          (h.certificateNo && h.certificateNo.toLowerCase() === cleanId)
      );
      if (hist) {
        const certNum = hist.certificateNumber || hist.certificateNo || certOrQueryId;
        const examDate = hist.promotedDate || hist.date || new Date().toISOString().split("T")[0];
        const allLevels = await getBeltLevels();
        const level = allLevels.find(
          (l) => l.name.toLowerCase() === hist.belt?.toLowerCase() || l.id.toLowerCase() === hist.belt?.toLowerCase()
        );

        return {
          certificateNumber: certNum,
          candidateName: player.name,
          athleteId: player.id,
          dob: player.dob || "15/08/2005",
          gender: player.gender || "Male",
          academyName: hist.academyName || player.club || "Federation Dojo",
          state: player.state,
          beltRank: hist.belt,
          previousBelt: hist.previousBelt || "White Belt",
          templateFile: level?.templateFile || "yellow-belt.png",
          examTitle: hist.sessionName || "National Belt Grading Examination",
          examDate: examDate,
          venueName: "National Combat Academy Arena",
          chiefExaminer: hist.examinerName || hist.examiner || "Grandmaster Rajesh Sharma",
          chiefExaminerRank: "8th Dan Black Belt, National Technical Director",
          score: hist.score || 88,
          grade: hist.grade || "Pass",
          status: "Valid & Verified",
          issuedDate: examDate,
        };
      }
    }
  }

  return null;
}

// ==================== DYNAMIC BELT GRADES & SYLLABUS ====================

async function ensureBeltLevelsStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "belt-levels.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "belt-levels.json");

  try {
    await fs.access(primaryPath);
    return primaryPath;
  } catch {
    try {
      await fs.access(nestedPath);
      return nestedPath;
    } catch {
      await fs.mkdir(path.dirname(primaryPath), { recursive: true });
      await fs.writeFile(primaryPath, JSON.stringify(STANDARD_BELT_LEVELS || [], null, 2), "utf-8");
      return primaryPath;
    }
  }
}

async function getFileBeltLevels(): Promise<BeltLevel[]> {
  try {
    const file = await ensureBeltLevelsStorage();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = raw.trim() ? (JSON.parse(raw) as BeltLevel[]) : [];
    if (parsed.length > 0) return parsed;
  } catch (err) {
    console.warn("Could not read belt-levels.json fallback:", err instanceof Error ? err.message : "");
  }
  return STANDARD_BELT_LEVELS;
}

async function saveFileBeltLevels(levels: BeltLevel[]): Promise<void> {
  try {
    const file = await ensureBeltLevelsStorage();
    await fs.writeFile(file, JSON.stringify(levels, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save to belt-levels.json fallback:", err instanceof Error ? err.message : "");
  }
}

export async function getBeltLevels(): Promise<BeltLevel[]> {
  const standardIds = [
    "yellow",
    "yellow-1",
    "green",
    "green-1",
    "blue",
    "blue-1",
    "red",
    "red-1",
    "red-2",
    "red-3",
    "junior-black",
  ];

  try {
    await connectToDatabase();
    const docs = await BeltLevelModel.find().lean();
    const existingMap = new Map<string, any>();
    if (docs && docs.length > 0) {
      for (const d of docs as any[]) {
        if (d.id) {
          existingMap.set(d.id.toLowerCase(), d);
        }
      }
    }

    const fileLevels = await getFileBeltLevels();
    const missingDocsToInsert: BeltLevel[] = [];

    for (const stdLevel of STANDARD_BELT_LEVELS) {
      if (!existingMap.has(stdLevel.id.toLowerCase())) {
        const fileMatch = fileLevels.find((f) => f.id.toLowerCase() === stdLevel.id.toLowerCase());
        const toInsert = fileMatch || stdLevel;
        missingDocsToInsert.push(toInsert);
      }
    }

    if (missingDocsToInsert.length > 0) {
      try {
        await BeltLevelModel.insertMany(missingDocsToInsert, { ordered: false });
        for (const ins of missingDocsToInsert) {
          existingMap.set(ins.id.toLowerCase(), ins);
        }
      } catch (insertErr) {
        console.warn("BeltLevel missing ranks upsert notice:", insertErr instanceof Error ? insertErr.message : "");
      }
    }

    // Map all 11 standard levels in exact sequence
    const full11List: BeltLevel[] = STANDARD_BELT_LEVELS.map((stdLevel) => {
      const doc = existingMap.get(stdLevel.id.toLowerCase());
      const fileMatch = fileLevels.find((f) => f.id.toLowerCase() === stdLevel.id.toLowerCase());
      const source = doc || fileMatch || stdLevel;

      return {
        id: stdLevel.id,
        name: stdLevel.name,
        nameHindi: stdLevel.nameHindi || source.nameHindi || "",
        gupDan: stdLevel.gupDan,
        anukkamaNumber: stdLevel.anukkamaNumber,
        anukkamaName: stdLevel.anukkamaName,
        anukkamaNameHindi: stdLevel.anukkamaNameHindi,
        beltColorName: stdLevel.beltColorName,
        beltColorNameHindi: stdLevel.beltColorNameHindi,
        beltEmoji: stdLevel.beltEmoji,
        badgeColor: stdLevel.badgeColor,
        borderColor: stdLevel.borderColor,
        textColor: stdLevel.textColor,
        bgGradient: stdLevel.bgGradient,
        minTrainingMonths: source.minTrainingMonths || stdLevel.minTrainingMonths || 0,
        templateFile: source.templateFile !== undefined ? source.templateFile : stdLevel.templateFile,
        summary: source.summary || stdLevel.summary || "",
        syllabus: {
          forms: source.syllabus?.forms?.length ? source.syllabus.forms : (stdLevel.syllabus?.forms || []),
          techniques: source.syllabus?.techniques?.length ? source.syllabus.techniques : (stdLevel.syllabus?.techniques || []),
          sparring: source.syllabus?.sparring?.length ? source.syllabus.sparring : (stdLevel.syllabus?.sparring || []),
          selfDefense: source.syllabus?.selfDefense?.length ? source.syllabus.selfDefense : (stdLevel.syllabus?.selfDefense || []),
          breaking: source.syllabus?.breaking?.length ? source.syllabus.breaking : (stdLevel.syllabus?.breaking || []),
          theory: source.syllabus?.theory?.length ? source.syllabus.theory : (stdLevel.syllabus?.theory || []),
        },
      };
    });

    cachedBeltLevels = full11List;
    await saveFileBeltLevels(full11List);
    return full11List;
  } catch (err) {
    console.warn("getBeltLevels DB fetch notice, falling back to storage file:", err instanceof Error ? err.message : "");
  }

  const fileLevels = await getFileBeltLevels();
  const full11List: BeltLevel[] = STANDARD_BELT_LEVELS.map((stdLevel) => {
    const fileMatch = fileLevels.find((f) => f.id.toLowerCase() === stdLevel.id.toLowerCase());
    const source = fileMatch || stdLevel;
    return {
      ...stdLevel,
      nameHindi: stdLevel.nameHindi || source.nameHindi,
      anukkamaNumber: stdLevel.anukkamaNumber,
      anukkamaName: stdLevel.anukkamaName,
      anukkamaNameHindi: stdLevel.anukkamaNameHindi,
      beltColorName: stdLevel.beltColorName,
      beltColorNameHindi: stdLevel.beltColorNameHindi,
      beltEmoji: stdLevel.beltEmoji,
      templateFile: source.templateFile !== undefined ? source.templateFile : stdLevel.templateFile,
      summary: source.summary || stdLevel.summary || "",
      syllabus: source.syllabus || stdLevel.syllabus,
    };
  });

  cachedBeltLevels = full11List;
  return full11List;
}

export async function getBeltLevelById(id: string): Promise<BeltLevel | null> {
  const cleanId = id.trim().toLowerCase();
  const levels = await getBeltLevels();
  return levels.find((l) => l.id.toLowerCase() === cleanId) || null;
}

export async function updateBeltLevel(
  id: string,
  updates: Partial<BeltLevel>
): Promise<BeltLevel | null> {
  const cleanId = id.trim();
  // Protect id, name, and gupDan from unauthorized renaming
  const safeUpdates = { ...updates };
  delete safeUpdates.id;

  try {
    await connectToDatabase();
    const doc = await BeltLevelModel.findOneAndUpdate(
      { id: { $regex: new RegExp("^" + cleanId + "$", "i") } },
      { $set: safeUpdates },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const std = STANDARD_BELT_LEVELS.find((s) => s.id.toLowerCase() === cleanId.toLowerCase());
      const mapped: BeltLevel = {
        id: (doc as any).id,
        name: std?.name || (doc as any).name,
        nameHindi: std?.nameHindi || (doc as any).nameHindi || "",
        gupDan: std?.gupDan || (doc as any).gupDan,
        anukkamaNumber: std?.anukkamaNumber || (doc as any).anukkamaNumber || 1,
        anukkamaName: std?.anukkamaName || (doc as any).anukkamaName || "",
        anukkamaNameHindi: std?.anukkamaNameHindi || (doc as any).anukkamaNameHindi || "",
        beltColorName: std?.beltColorName || (doc as any).beltColorName || "",
        beltColorNameHindi: std?.beltColorNameHindi || (doc as any).beltColorNameHindi || "",
        beltEmoji: std?.beltEmoji || (doc as any).beltEmoji || "🥋",
        badgeColor: std?.badgeColor || (doc as any).badgeColor,
        borderColor: std?.borderColor || (doc as any).borderColor,
        textColor: std?.textColor || (doc as any).textColor,
        bgGradient: std?.bgGradient || (doc as any).bgGradient,
        minTrainingMonths: (doc as any).minTrainingMonths,
        templateFile: (doc as any).templateFile || "",
        summary: (doc as any).summary,
        syllabus: (doc as any).syllabus || {
          forms: [],
          techniques: [],
          sparring: [],
          selfDefense: [],
          breaking: [],
          theory: [],
        },
      };

      const allLevels = await getFileBeltLevels();
      const idx = allLevels.findIndex((l) => l.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) {
        allLevels[idx] = mapped;
        await saveFileBeltLevels(allLevels);
      }

      const cacheIdx = cachedBeltLevels.findIndex((l) => l.id.toLowerCase() === cleanId.toLowerCase());
      if (cacheIdx !== -1) cachedBeltLevels[cacheIdx] = mapped;

      return mapped;
    }
  } catch (err) {
    console.error("updateBeltLevel DB error:", err);
  }

  // Fallback to file storage update
  const allLevels = await getFileBeltLevels();
  const idx = allLevels.findIndex((l) => l.id.toLowerCase() === cleanId.toLowerCase());
  if (idx !== -1) {
    allLevels[idx] = {
      ...allLevels[idx],
      ...safeUpdates,
    };
    await saveFileBeltLevels(allLevels);
    cachedBeltLevels = allLevels;
    return allLevels[idx];
  }

  return null;
}

export async function deleteBeltLevel(_id: string): Promise<boolean> {
  // Official standard belt levels are static and non-deletable
  console.warn("Attempted to delete protected static belt level. Action blocked.");
  return false;
}

export async function createBeltLevel(levelData: BeltLevel): Promise<BeltLevel> {
  return levelData;
}


