import mongoose, { Schema, Model, Document } from "mongoose";

export type IdCardType =
  | "Athlete"
  | "Student"
  | "Coach"
  | "Referee"
  | "Club"
  | "Official"
  | "Dan"
  | "Championship";

export type IdCardStatus =
  | "Active"
  | "Pending"
  | "Under Verification"
  | "Approved"
  | "Expired"
  | "Suspended"
  | "Cancelled"
  | "Rejected";

export type IdCardRequestEntry = {
  id: string; // Member / Athlete ID e.g. "KSM-PL-10240" or Dan App ID
  athleteId?: string;
  name: string;
  memberType: string;
  cardType?: IdCardType;
  discipline: string;
  beltRank?: string;
  club?: string;
  state?: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  image?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  dob?: string;
  age?: number;
  gender?: string;
  address?: string;
  registeredOn?: string;
  requestStatus: "Pending" | "Under Review" | "Rejected";
  rejectionReason?: string;
  danRank?: number;
  danRankTitle?: string;
  danApplicationId?: string;
  currentBeltTitle?: string;
  instructorName?: string;
  aadhaarDoc?: string;
  currentCertDoc?: string;
  medicalFitnessDoc?: string;
  thesisDoc?: string;
  paymentProofDoc?: string;
};

export type IdCardHistoryEntry = {
  action: string;
  date: string;
  by: string;
  notes?: string;
};

export type IdCardEntry = {
  id: string; // KALAWAR ID e.g. "KSM-PL-2026-7251" or Dan ID or Championship Pass ID
  cardType: IdCardType;
  source?: "account" | "manual"; // "account" = registered profile card; "manual" = custom issued card
  holderName: string;
  holderPhoto?: string;
  designation: string;
  /** Authoritative referee level — stored explicitly, never inferred from keyword matching */
  refereeLevel?: string;
  danRank?: number;
  danRankTitle?: string;
  danApplicationId?: string;
  certificateNumber?: string;
  idCardNumber?: string;
  championshipApplicationId?: string;
  bibNumber?: string;
  eventTitle?: string;
  tournamentTier?: string;
  ageDivision?: string;
  weightCategory?: string;
  discipline: string;
  beltRank?: string;
  academyName: string;
  state: string;
  district: string;
  dob?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  phone?: string;
  email?: string;
  issueDate: string;
  validUntil: string;
  status: IdCardStatus;
  qrCodeUrl: string;
  barcodeNumber: string;
  authorizedSignatory: string;
  authorizedSignatoryRole: string;
  cardVersion: string;
  history: IdCardHistoryEntry[];
};

export interface IIdCardDocument extends Omit<IdCardEntry, "">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const IdCardHistorySchema = new Schema<IdCardHistoryEntry>(
  {
    action: { type: String, required: true },
    date: { type: String, required: true },
    by: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const IdCardSchema = new Schema<IIdCardDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    cardType: {
      type: String,
      enum: ["Athlete", "Student", "Coach", "Referee", "Club", "Official", "Dan", "Championship"],
      default: "Athlete",
      index: true,
    },
    source: {
      type: String,
      enum: ["account", "manual"],
      default: "manual",
      index: true,
    },
    holderName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    holderPhoto: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    refereeLevel: {
      type: String,
      trim: true,
    },
    danRank: {
      type: Number,
      index: true,
    },
    danRankTitle: {
      type: String,
      trim: true,
    },
    danApplicationId: {
      type: String,
      trim: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      trim: true,
      index: true,
    },
    idCardNumber: {
      type: String,
      trim: true,
    },
    championshipApplicationId: {
      type: String,
      trim: true,
      index: true,
    },
    bibNumber: {
      type: String,
      trim: true,
      index: true,
    },
    eventTitle: {
      type: String,
      trim: true,
    },
    tournamentTier: {
      type: String,
      trim: true,
    },
    ageDivision: {
      type: String,
      trim: true,
    },
    weightCategory: {
      type: String,
      trim: true,
    },
    discipline: {
      type: String,
      default: "Kalawar Martial Arts",
      trim: true,
    },
    beltRank: {
      type: String,
      trim: true,
    },
    academyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    issueDate: {
      type: String,
      required: true,
      trim: true,
    },
    validUntil: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Active",
        "Pending",
        "Under Verification",
        "Approved",
        "Expired",
        "Suspended",
        "Cancelled",
        "Rejected",
      ],
      default: "Active",
      index: true,
    },
    qrCodeUrl: {
      type: String,
      required: true,
      trim: true,
    },
    barcodeNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    authorizedSignatory: {
      type: String,
      required: true,
      trim: true,
      default: "Mr. Santosh Uddhav Kasabe",
    },
    authorizedSignatoryRole: {
      type: String,
      required: true,
      trim: true,
      default: "Founder & President – India",
    },
    cardVersion: {
      type: String,
      default: "2026.1",
    },
    history: {
      type: [IdCardHistorySchema],
      default: [],
    },
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

export const IdCardModel: Model<IIdCardDocument> =
  mongoose.models.IdCard || mongoose.model<IIdCardDocument>("IdCard", IdCardSchema);

export default IdCardModel;
