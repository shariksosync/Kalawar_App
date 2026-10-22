export type RefereeLevel =
  | "Level 0 – Trainee Referee"
  | "Level 1 – Junior Referee"
  | "Level 2 – State Referee"
  | "Level 3 – National Referee"
  | "International / Chief Referee";

export const REFEREE_LEVELS: RefereeLevel[] = [
  "Level 0 – Trainee Referee",
  "Level 1 – Junior Referee",
  "Level 2 – State Referee",
  "Level 3 – National Referee",
  "International / Chief Referee",
];

export function normalizeRefereeLevel(raw?: string): RefereeLevel {
  if (!raw) return "Level 0 – Trainee Referee";
  const s = raw.toLowerCase().trim();
  if (s.includes("chief") || s.includes("international") || s.includes("world")) {
    return "International / Chief Referee";
  }
  if (s.includes("national") || s.includes("level 3") || s.includes("level3") || s.includes("class a")) {
    return "Level 3 – National Referee";
  }
  if (s.includes("state") || s.includes("level 2") || s.includes("level2") || s.includes("class b") || s.includes("class c")) {
    return "Level 2 – State Referee";
  }
  if (s.includes("junior") || s.includes("level 1") || s.includes("level1")) {
    return "Level 1 – Junior Referee";
  }
  return "Level 0 – Trainee Referee";
}

export function getRefereeDesignation(level?: string): string {
  const norm = normalizeRefereeLevel(level);
  switch (norm) {
    case "International / Chief Referee":
      return "International Chief Referee";
    case "Level 3 – National Referee":
      return "National Referee (Level 3)";
    case "Level 2 – State Referee":
      return "State Referee (Level 2)";
    case "Level 1 – Junior Referee":
      return "Junior Referee (Level 1)";
    case "Level 0 – Trainee Referee":
    default:
      return "Trainee Referee (Level 0)";
  }
}

export type RefereeStatus =
  | "Application Submitted"
  | "Pending"
  | "Under Verification"
  | "Training Required"
  | "Exam Scheduled"
  | "Certified"
  | "Active"
  | "Expired"
  | "Suspended"
  | "Cancelled";

export const REFEREE_STATUSES: RefereeStatus[] = [
  "Application Submitted",
  "Pending",
  "Under Verification",
  "Training Required",
  "Exam Scheduled",
  "Certified",
  "Active",
  "Expired",
  "Suspended",
  "Cancelled",
];

export type DutyPosition =
  | "Chief Referee"
  | "Mat / Ring Referee"
  | "Corner Judge"
  | "Arbitrator / Jury"
  | "Timekeeper"
  | "Scorekeeper"
  | "Technical Delegate";

export const DUTY_POSITIONS: DutyPosition[] = [
  "Chief Referee",
  "Mat / Ring Referee",
  "Corner Judge",
  "Arbitrator / Jury",
  "Timekeeper",
  "Scorekeeper",
  "Technical Delegate",
];

export type TrainingRecord = {
  id: string;
  seminarName: string;
  date: string;
  trainerName: string;
  hours: number;
  location?: string;
  status: "Completed" | "Pending" | "Exempted";
};

export type ExamRecord = {
  id: string;
  examType: "Theory" | "Practical" | "Fitness";
  score: number;
  maxScore: number;
  date: string;
  examiner: string;
  result: "Passed" | "Failed";
  remarks?: string;
};

export type DutyAppointment = {
  id: string;
  championshipId: string;
  championshipName: string;
  eventDate: string;
  location?: string;
  category?: string;
  ringOrMatNumber: string; // e.g. "Mat 1", "Ring A"
  position: DutyPosition;
  appointedBy: string;
  appointedAt: string;
  status: "Nominated" | "Confirmed" | "Attended" | "Absent" | "Cancelled";
  performanceRating?: number; // 1 to 5 stars
  performanceNotes?: string;
};

export type EvaluationRecord = {
  id: string;
  date: string;
  evaluator: string;
  score: number; // 0 to 100
  category: string;
  remarks: string;
};

export type RefereeItem = {
  id: string; // e.g. KAC-REF-2026-001
  name: string;
  username?: string;
  password?: string;
  rawPassword?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  state: string;
  district: string;
  tempStateAssociation?: string;
  tempDistrictAssociation?: string;
  discipline?: string;
  academy?: string;
  kalawarId?: string; // e.g. KAC-2026-7251
  currentRank: string; // e.g. "3rd Dan Black Belt"
  martialArtsExperience: string; // e.g. "8 Years"
  level: RefereeLevel;
  status: RefereeStatus;
  licenseNumber?: string; // e.g. KAC-ACT-REF-2026-012 (Active Certified Official ID)
  licenseIssuedDate?: string;
  licenseValidUntil?: string;
  photo?: string;
  certificationDocument?: string;
  certificationDocumentName?: string;
  certificationDocumentSize?: string;
  aadhaarDoc?: string;
  aadhaarDocName?: string;
  aadhaarDocSize?: string;
  specialization?: string;
  danCertificationYear?: string;
  danGradingAuthority?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
  pincode?: string;
  documents?: string[];
  previousCertificates?: string[];
  bio?: string;
  matchesOfficiated: number;
  trainingRecords: TrainingRecord[];
  examRecords: ExamRecord[];
  dutyAppointments: DutyAppointment[];
  evaluations: EvaluationRecord[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRefereeInput = {
  id?: string;
  name: string;
  username?: string;
  password?: string;
  rawPassword?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  state: string;
  district: string;
  discipline?: string;
  academy?: string;
  kalawarId?: string;
  currentRank: string;
  martialArtsExperience: string;
  level?: RefereeLevel;
  status?: RefereeStatus;
  licenseNumber?: string;
  licenseIssuedDate?: string;
  licenseValidUntil?: string;
  photo?: string;
  certificationDocument?: string;
  certificationDocumentName?: string;
  certificationDocumentSize?: string;
  aadhaarDoc?: string;
  aadhaarDocName?: string;
  aadhaarDocSize?: string;
  specialization?: string;
  danCertificationYear?: string;
  danGradingAuthority?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
  pincode?: string;
  documents?: string[];
  previousCertificates?: string[];
  bio?: string;
  matchesOfficiated?: number;
  internalNotes?: string;
};

export const TECHNICAL_AUTHORITY = {
  name: "MR. SANTOSH KASBE",
  role: "Founder & President – India",
  committeeRole: "Head – Technical Committee, India",
  experience: "25+ Years Grandmaster & International Adjudicator",
  jurisdiction: "All-India Martial Arts & Sports Adjudication Standards",
};

export const LEVEL_CRITERIA: Record<
  RefereeLevel,
  {
    minAge: number;
    minRank: string;
    minExpYears: number;
    description: string;
    duties: string[];
    certificationFee?: string;
  }
> = {
  "Level 0 – Trainee Referee": {
    minAge: 16,
    minRank: "Brown Belt / 1st Dan Aspirant",
    minExpYears: 1,
    description: "Entry-level trainee official eligible for club-level sparring, preliminary bouts, timekeeping, and assisting certified licensed referees.",
    duties: ["Scorekeeping & Timekeeping Assistant", "Club Sparring Marshall", "Table Official Trainee", "Ring Marshall Assistant"],
  },
  "Level 1 – Junior Referee": {
    minAge: 18,
    minRank: "1st Dan Black Belt (or equivalent Brown/Black)",
    minExpYears: 2,
    description: "Eligible for district tournaments, inter-school bouts, and auxiliary table duties (Timekeeper / Scorekeeper / Corner Judge).",
    duties: ["Corner Judge (Kyu bouts)", "Timekeeper & Scorekeeper", "Junior Mat Marshall"],
  },
  "Level 2 – State Referee": {
    minAge: 21,
    minRank: "2nd Dan Black Belt",
    minExpYears: 4,
    description: "Authorized for State Championships, Open Tournaments, and Center Mat refereeing for Cadets, Juniors & Seniors.",
    duties: ["Center Mat Referee (State events)", "Corner Judge (All categories)", "Weigh-in & Gear Inspection Official"],
  },
  "Level 3 – National Referee": {
    minAge: 25,
    minRank: "3rd Dan Black Belt or higher",
    minExpYears: 7,
    description: "Empowered for All-India National Championships, Title Fights, and Jury / Chief Referee positions on competition rings.",
    duties: ["Chief Mat Referee", "Jury & Arbitrator", "National Title Bout Adjudicator", "Protest Committee Member"],
  },
  "International / Chief Referee": {
    minAge: 30,
    minRank: "4th Dan Black Belt & Above",
    minExpYears: 12,
    description: "Supreme Technical Official appointed for International Matches, National Championship Supervision, and Referee Training Seminars.",
    duties: ["Technical Delegate", "Tournament Chief Referee", "Referee Examination Board Head", "International Bout Adjudication"],
  },
};
