import type { Player } from "@/data/people";
import type { RefereeItem } from "@/types/referee";
import type { DanApplication } from "@/data/dan-grading";
import type { ChampionshipApplication } from "@/types/championship";
import type { ExamCandidate, BeltExamSession, BeltLevel } from "@/data/belt-exams";

export type ReceiptCategory =
  | "all"
  | "member_registration"
  | "belt_exam"
  | "black_belt_dan"
  | "championship"
  | "referee";

export type ReceiptStatus =
  | "Paid"
  | "Verified"
  | "Approved"
  | "Active"
  | "Confirmed"
  | "Pending"
  | "Completed";

export interface RegistrationReceiptItem {
  id: string; // Unique ID
  receiptNumber: string; // e.g. REC-REG-KSM-PL-10240, KAC-BELT-REG-2026-001, KAC-DAN-APP-2026-001, CHAMP-2026-0001, REC-REF-KAC-ACT-REF-2026-011
  category: "member_registration" | "belt_exam" | "black_belt_dan" | "championship" | "referee";
  categoryLabel: string;
  title: string;
  description?: string;
  
  // Recipient details
  recipientName: string;
  memberId?: string;
  email?: string;
  phone?: string;
  state?: string;
  districtOrCity?: string;
  academyOrClub?: string;
  discipline?: string;
  
  // Metadata
  issuedAt: string; // ISO string or YYYY-MM-DD
  status: ReceiptStatus;
  
  metadata?: {
    beltRank?: string;
    currentRank?: string;
    targetRank?: string;
    level?: string;
    designation?: string;
    eventName?: string;
    eventVenue?: string;
    eventDate?: string;
    bibNumber?: string;
    ageDivision?: string;
    weightCategory?: string;
    chiefExaminer?: string;
    instructorName?: string;
    registrationSlipId?: string;
    sourceStore?: string;
    [key: string]: any;
  };
  
  // Verification
  qrVerificationUrl?: string;
  
  // Raw payloads for exact official slip viewers and PDF generators
  rawPlayer?: Player;
  rawBeltCandidate?: {
    candidate: ExamCandidate;
    exam: BeltExamSession;
    beltLevel?: BeltLevel;
  };
  rawDanApp?: DanApplication;
  rawChampApp?: ChampionshipApplication;
  rawReferee?: RefereeItem;
}

export interface UserReceiptsQuery {
  userId?: string;
  memberId?: string;
  email?: string;
  phone?: string;
  name?: string;
  category?: string;
  status?: string;
  search?: string;
  year?: string;
  role?: string;
}

export interface ReceiptsStatsSummary {
  totalCount: number;
  memberRegistrationCount: number;
  beltExamCount: number;
  blackBeltDanCount: number;
  championshipCount: number;
  refereeCount: number;
}
