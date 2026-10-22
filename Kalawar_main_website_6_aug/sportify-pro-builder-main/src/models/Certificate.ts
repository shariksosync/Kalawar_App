import mongoose, { Schema, Model, Document } from "mongoose";
import type { CertificateStatus, CertificateAuditLog } from "@/types/certificate";

export interface ICertificateDocument extends Document {
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
  type: string;
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
  presidentName?: string;
  secretaryName?: string;
  affiliationCertificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<CertificateAuditLog>(
  {
    action: { type: String, required: true },
    timestamp: { type: String, required: true },
    performedBy: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const CertificateSchema = new Schema<ICertificateDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    holder: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    kalawarId: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
    },
    academy: {
      type: String,
      trim: true,
    },
    club: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: "Championship / Achievement Certificate",
      trim: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      default: "Gold Medal",
      trim: true,
    },
    rankOrBelt: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    discipline: {
      type: String,
      default: "Kalawar Martial Arts",
      trim: true,
    },
    danRank: {
      type: String,
      trim: true,
    },
    beltRank: {
      type: String,
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    examDate: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    issued: {
      type: String,
      required: true,
      trim: true,
    },
    validUntil: {
      type: String,
      trim: true,
    },
    issuedBy: {
      type: String,
      trim: true,
      default: "Mr. Santosh Kasabe (Founder & President)",
    },
    certificateUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Valid", "Expired", "Suspended", "Cancelled", "Issued", "Revoked"],
      default: "Valid",
      index: true,
    },
    levelOfAffiliation: { type: String, trim: true },
    levelsOfAffiliation: [{ type: String, trim: true }],
    clubCategory: { type: String, trim: true },
    headCoachName: { type: String, trim: true },
    presidentName: { type: String, trim: true },
    secretaryName: { type: String, trim: true },
    affiliationCertificateId: { type: String, trim: true },
    auditHistory: [AuditLogSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CertificateModel: Model<ICertificateDocument> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificateDocument>("Certificate", CertificateSchema);

export default CertificateModel;
