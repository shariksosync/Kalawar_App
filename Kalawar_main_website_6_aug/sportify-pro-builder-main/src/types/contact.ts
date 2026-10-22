export type ContactStatus =
  | "Submitted"
  | "Under Review"
  | "Replied"
  | "Closed"
  | "New"
  | "In Progress"
  | "Resolved";

export type ContactCategory =
  | "Event Registration"
  | "General Enquiry"
  | "Athlete / Player"
  | "Academy / Club Affiliation"
  | "Coach"
  | "Referee / Technical Official"
  | "Championship / Event"
  | "Belt Examination"
  | "Certificate / ID Verification"
  | "Payment"
  | "Website / Technical Support"
  | "Other";

export const CONTACT_CATEGORIES: ContactCategory[] = [
  "Event Registration",
  "General Enquiry",
  "Athlete / Player",
  "Academy / Club Affiliation",
  "Coach",
  "Referee / Technical Official",
  "Championship / Event",
  "Belt Examination",
  "Certificate / ID Verification",
  "Payment",
  "Website / Technical Support",
  "Other",
];

export type EnquiryCategory = ContactCategory;
export const ENQUIRY_CATEGORIES = CONTACT_CATEGORIES;

export type ContactRequest = {
  id: string; // e.g. KAC-ENQ-2026-001
  name: string;
  email: string;
  phone: string;
  state?: string;
  district?: string;
  subject: string;
  category: ContactCategory | string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  status: ContactStatus;
  assignedTo?: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  internalNotes?: string;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  division?: string;
  beltRank?: string;
  academyName?: string;
  tag?: string;
  history?: Array<{
    action: string;
    date: string;
    by: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
};

export type CreateContactInput = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  district?: string;
  subject: string;
  category?: ContactCategory | string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  status?: ContactStatus | string;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  division?: string;
  beltRank?: string;
  academyName?: string;
  tag?: string;
};
