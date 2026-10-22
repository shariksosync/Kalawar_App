import mongoose, { Schema, Model, Document } from "mongoose";
import type { Player as PlayerType } from "@/data/people";

export interface IPlayerDocument extends Omit<PlayerType, "medals">, Document {
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

const PlayerSchema = new Schema<IPlayerDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    memberType: {
      type: String,
      enum: ["Player", "Coach", "Referee", "Club", "StateAssociation", "DistrictAssociation"],
      default: "Player",
      index: true,
    },
    discipline: {
      type: String,
      default: "Kalawar Martial Arts",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    club: {
      type: String,
      default: "Independent",
      trim: true,
    },
    age: {
      type: Number,
      default: 18,
    },
    dob: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      default: "Male",
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    rawPassword: {
      type: String,
    },
    coachName: {
      type: String,
      trim: true,
    },
    idNumber: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    tempStateAssociation: {
      type: String,
      trim: true,
      default: "",
    },
    tempDistrictAssociation: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    beltRank: {
      type: String,
      trim: true,
    },
    ageGroup: {
      type: String,
      trim: true,
    },
    weightCategory: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    academicHistory: [
      {
        id: { type: String, trim: true },
        academy: { type: String, required: true, trim: true },
        degree: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startDate: { type: String, trim: true },
        endDate: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    qualification: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Schema.Types.Mixed,
    },
    specialization: {
      type: String,
      trim: true,
    },
    officiatingGrade: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      trim: true,
    },
    matchesOfficiated: {
      type: Schema.Types.Mixed,
    },
    yearFounded: {
      type: String,
      trim: true,
    },
    registeredAddress: {
      type: String,
      trim: true,
    },
    presidentName: {
      type: String,
      trim: true,
    },
    secretaryName: {
      type: String,
      trim: true,
    },
    memberCount: {
      type: Schema.Types.Mixed,
    },
    registrationType: {
      type: String,
      trim: true,
    },
    affiliationDocument: {
      type: String,
      trim: true,
    },
    affiliationDocumentName: {
      type: String,
      trim: true,
    },
    affiliationDocumentSize: {
      type: String,
      trim: true,
    },
    certificationDocument: {
      type: String,
      trim: true,
    },
    certificationDocumentName: {
      type: String,
      trim: true,
    },
    certificationDocumentSize: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    disciplines: {
      type: [String],
      default: [],
    },
    headCoachName: {
      type: String,
      trim: true,
    },
    timings: {
      type: String,
      trim: true,
    },
    validFrom: {
      type: String,
      trim: true,
    },
    validUntil: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "Online",
      trim: true,
    },
    affiliationCertificateId: {
      type: String,
      trim: true,
    },
    levelOfAffiliation: {
      type: String,
      trim: true,
    },
    clubCategory: {
      type: String,
      trim: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    facilities: {
      type: [String],
      default: [],
    },
    coachIds: {
      type: [String],
      default: [],
    },
    batches: {
      type: [
        {
          name: { type: String, trim: true },
          time: { type: String, trim: true },
        },
      ],
      default: [],
    },
    beltHistory: {
      type: [
        {
          id: { type: String },
          examId: { type: String },
          belt: { type: String, required: true },
          previousBelt: { type: String },
          promotedDate: { type: String, required: true },
          examinerName: { type: String, required: true },
          certificateNumber: { type: String, required: true },
          academyName: { type: String },
          score: { type: Number },
          grade: { type: String },
          status: { type: String, default: "Passed" },
          remarks: { type: String },
        },
      ],
      default: [],
    },
    clubApprovalStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
      trim: true,
    },
    coachApprovalStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
      trim: true,
    },
    rank: {
      type: Number,
      default: 1,
    },
    points: {
      type: Number,
      default: 0,
    },
    medals: {
      gold: { type: Number, default: 0 },
      silver: { type: Number, default: 0 },
      bronze: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Suspended", "Incomplete", "Verified", "Affiliated", "Under Review"],
      default: "Incomplete",
    },
    image: {
      type: String,
    },
    registeredOn: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
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
  },
);

// Prevent recompilation in Next.js dev hot-reload
export const PlayerModel: Model<IPlayerDocument> =
  mongoose.models.Player || mongoose.model<IPlayerDocument>("Player", PlayerSchema);

export default PlayerModel;
