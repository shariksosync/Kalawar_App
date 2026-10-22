import mongoose, { Schema, Model, Document } from "mongoose";
import type { ChampionshipApplication } from "@/types/championship";

export interface IChampionshipApplicationDocument
  extends Omit<ChampionshipApplication, "_id">,
    Document {}

const ChampionshipApplicationSchema = new Schema<IChampionshipApplicationDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: String,
      default: "",
    },
    eventVenue: {
      type: String,
      default: "",
    },
    eventCity: {
      type: String,
      default: "",
    },

    // Applicant Personal Details
    applicantName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dob: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      default: "Male",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    whatsapp: {
      type: String,
      default: "",
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },
    athleteId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    // Affiliation Details
    clubName: {
      type: String,
      required: true,
      default: "Independent / Direct Entry",
    },
    coachName: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      required: true,
      default: "Maharashtra",
      index: true,
    },

    // Competition Specifications
    discipline: {
      type: String,
      required: true,
      index: true,
    },
    ageDivision: {
      type: String,
      required: true,
    },
    weightCategory: {
      type: String,
      required: true,
    },
    beltRank: {
      type: String,
      required: true,
      default: "White Belt",
    },
    openClass: {
      type: Boolean,
      default: false,
    },

    // Uploads
    photo: {
      type: String,
      default: "",
    },
    idProofDoc: {
      type: String,
      default: "",
    },

    // Payment Details
    entryFee: {
      type: String,
      default: "Free",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Exempt", "Failed"],
      default: "Pending",
    },
    paymentReference: {
      type: String,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "UPI",
    },

    // Administrative Status
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    bibNumber: {
      type: String,
      default: "",
      index: true,
    },
    approvalDate: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // Competition Results
    result: {
      place: {
        type: String,
        enum: ["Gold", "Silver", "Bronze", "Participant", "Quarterfinalist", "Semifinalist", "Champion", "Pending"],
        default: "Pending",
      },
      level: { type: String, default: "" },
      points: { type: Number, default: 0 },
      notes: { type: String, default: "" },
      publishedAt: { type: String, default: "" },
    },
    level: { type: String, default: "District" },

    // Certificate Issuance
    certificateNumber: {
      type: String,
      default: "",
      index: true,
    },
    certificateIssuedAt: {
      type: String,
      default: "",
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

export const ChampionshipApplicationModel: Model<IChampionshipApplicationDocument> =
  mongoose.models.ChampionshipApplication ||
  mongoose.model<IChampionshipApplicationDocument>(
    "ChampionshipApplication",
    ChampionshipApplicationSchema
  );
