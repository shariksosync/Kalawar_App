export type ChampionshipAwardType =
  | "Gold Medal"
  | "Silver Medal"
  | "Bronze Medal"
  | "Participation & Merit"
  | "Champion Trophy"
  | "Special Recognition";

export type ChampionshipPodiumPlace =
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Participant"
  | "Quarterfinalist"
  | "Semifinalist"
  | "Champion"
  | "Pending"
  | "None";

export type ChampionshipPaymentStatus = "Pending" | "Paid" | "Exempt" | "Failed" | "pending" | "submitted" | "verified" | "exempted";

export type ChampionshipApplicationStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "pending_review"
  | "approved"
  | "rejected";

export interface ChampionshipApplication {
  id?: string; // e.g. "CHAMP-2026-0001"
  applicationId?: string; // e.g. "CHAMP-2026-0001"
  eventId: string;
  eventTitle: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  eventLocation?: string;
  eventCity?: string;

  // Applicant Personal Details
  applicantName: string;
  athleteName?: string;
  athletePhoto?: string;
  dob: string;
  age?: number;
  gender: "Male" | "Female" | "Other" | string;
  email: string;
  phone: string;
  whatsapp?: string;
  aadhaarNumber?: string;
  idProofDocument?: string;
  idProofDoc?: string;
  city?: string;
  state: string;
  residentialAddress?: string;

  emergencyContact?: {
    name: string;
    phone: string;
    relation?: string;
  };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  athleteId?: string; // e.g. "KSM-PL-2026-XXXX"

  // Affiliation Details
  clubName: string;
  club?: string;
  coachName?: string;
  previousAchievements?: string;

  // Competition Specifications
  discipline: string;
  ageDivision: string; // e.g. "Junior (Under 13)"
  weightCategory: string; // e.g. "-45.0 kg"
  weightKg?: number;
  beltRank: string; // e.g. "Yellow Belt"
  openClass?: boolean;

  // Uploads
  photo?: string;

  // Payment Details
  entryFee?: string;
  paymentStatus?: ChampionshipPaymentStatus | string;
  paymentAmount?: number;
  paymentReference?: string; // UTR or Txn ID
  paymentUtrNumber?: string;
  paymentProofUrl?: string;
  paymentMode?: string;

  // Administrative Status
  status: ChampionshipApplicationStatus;
  bibNumber?: string; // Assigned competitor number e.g. "BIB-104"
  approvalDate?: string;
  rejectionReason?: string;

  // Competition Results
  result?: {
    place: ChampionshipPodiumPlace;
    level?: "District" | "State" | "National" | "International" | string;
    points?: number;
    notes?: string;
    publishedAt?: string;
  };
  level?: "District" | "State" | "National" | "International" | string;
  podiumPlace?: ChampionshipPodiumPlace | string;
  awardType?: ChampionshipAwardType | string;

  // Certificate Issuance
  certificateNumber?: string; // e.g. "KAL-2026-0001"
  certificateIssuedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface ChampionshipCertificate {
  id?: string; // e.g. "KAL-2026-0001"
  certificateNumber: string;
  applicationId: string;
  eventId?: string;
  championshipTitle: string;
  level?: "District" | "State" | "National" | "International" | string;
  eventName?: string;
  eventLocation?: string;
  discipline: string;
  candidateName: string;
  athleteName?: string;
  athleteId?: string;
  email?: string;
  phone?: string;
  clubName: string;
  club?: string;
  state: string;
  ageDivision: string;
  weightCategory: string;
  beltRank: string;
  awardType: ChampionshipAwardType | string;
  place?: ChampionshipPodiumPlace | string;
  podiumPlace?: ChampionshipPodiumPlace | string;
  bibNumber?: string;
  issueDate: string;
  issuedBy?: string;
  presidentSignature?: string;
  secretarySignature?: string;
  qrVerificationUrl?: string;
  notes?: string;
  adminNotes?: string;
  createdAt?: string;
}
