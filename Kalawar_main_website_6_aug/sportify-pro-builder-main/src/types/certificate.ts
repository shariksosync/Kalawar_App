export const CERTIFICATE_TYPES = [
  "Belt Examination Certificate",
  "Black Belt / Dan Certificate",
  "Coach Certification Certificate",
  "Referee / Technical Official Certificate",
  "Championship / Achievement Certificate",
  "Participation Certificate",
  "Other Official KALAWAR Certificates",
] as const;

export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const CERTIFICATE_STATUSES = [
  "Valid",
  "Expired",
  "Suspended",
  "Cancelled",
  "Issued",
  "Revoked",
] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface CertificateAuditLog {
  action: string;
  timestamp: string;
  performedBy: string;
  notes?: string;
}

export interface CertificateItem {
  id: string;
  number: string;
  holder: string;
  kalawarId?: string;
  email?: string;
  phone?: string;
  state?: string;
  district?: string;
  academy?: string;
  club?: string;
  type: CertificateType | string;
  event: string;
  position?: string;
  rankOrBelt?: string;
  qualification?: string;
  discipline?: string;
  danRank?: string;
  beltRank?: string;
  dob?: string;
  examDate?: string;
  venue?: string;
  image?: string;
  photo?: string;
  issued: string;
  validUntil?: string;
  issuedBy?: string;
  certificateUrl?: string;
  status: CertificateStatus;
  auditHistory?: CertificateAuditLog[];
  levelOfAffiliation?: string;
  levelsOfAffiliation?: string[];
  clubCategory?: string;
  headCoachName?: string;
  affiliationCertificateId?: string;
  isAffiliationCert?: boolean;
  isDanCert?: boolean;
  isBeltCert?: boolean;
  isChampionshipCert?: boolean;
  level?: string;
  awardType?: string;
  bibNumber?: string;
  danRankNumber?: number;
  japaneseTitle?: string;
  koreanTitle?: string;
  grade?: string;
  score?: number;
  presidentName?: string;
  presidentRole?: string;
  secretaryName?: string;
  chiefExaminerRank?: string;
  templateFile?: string;
  category?: string;
  ageDivision?: string;
  weightCategory?: string;
  notes?: string;
}

export interface CreateCertificateInput {
  id?: string;
  number?: string;
  holder: string;
  kalawarId?: string;
  email?: string;
  phone?: string;
  state?: string;
  district?: string;
  academy?: string;
  club?: string;
  type?: CertificateType | string;
  event: string;
  position?: string;
  rankOrBelt?: string;
  qualification?: string;
  discipline?: string;
  danRank?: string;
  beltRank?: string;
  dob?: string;
  examDate?: string;
  venue?: string;
  image?: string;
  photo?: string;
  issued?: string;
  validUntil?: string;
  issuedBy?: string;
  certificateUrl?: string;
  status?: CertificateStatus | string;
  notes?: string;
  levelOfAffiliation?: string;
  levelsOfAffiliation?: string[];
  clubCategory?: string;
  headCoachName?: string;
  presidentName?: string;
  secretaryName?: string;
  affiliationCertificateId?: string;
  isChampionshipCert?: boolean;
  level?: string;
  awardType?: string;
  bibNumber?: string;
}

export const SIGNATORIES = {
  president: {
    name: "Mr. Santosh Kasabe",
    role: "Founder & President – India",
    title: "Head – National Technical Committee",
  },
  director: {
    name: "Ms. Ashwini Kasabe",
    role: "Director – India",
    title: "National Governing Council",
  },
  workingPresident: {
    name: "Mr. Ashish Doiphode",
    role: "Working President – India",
    title: "Championship & Affairs Board",
  },
};
