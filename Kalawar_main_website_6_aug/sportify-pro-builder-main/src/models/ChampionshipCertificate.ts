import mongoose, { Schema, Model, Document } from "mongoose";
import type { ChampionshipCertificate } from "@/types/championship";

export interface IChampionshipCertificateDocument
  extends Omit<ChampionshipCertificate, "_id">,
    Document {}

const ChampionshipCertificateSchema = new Schema<IChampionshipCertificateDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    championshipTitle: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      default: "District",
      index: true,
    },
    discipline: {
      type: String,
      required: true,
      trim: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    athleteId: {
      type: String,
      default: "",
      index: true,
    },
    email: {
      type: String,
      default: "",
      index: true,
    },
    phone: {
      type: String,
      default: "",
    },
    clubName: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    ageDivision: {
      type: String,
      default: "",
    },
    weightCategory: {
      type: String,
      default: "",
    },
    beltRank: {
      type: String,
      default: "",
    },
    awardType: {
      type: String,
      default: "Participation & Merit",
      index: true,
    },
    place: {
      type: String,
      default: "Participant",
    },
    bibNumber: {
      type: String,
      default: "",
    },
    issueDate: {
      type: String,
      required: true,
    },
    issuedBy: {
      type: String,
      default: "KALAWAR Sports & Martial Arts Federation of India",
    },
    presidentSignature: {
      type: String,
      default: "Authorized Federation Signatory",
    },
    secretarySignature: {
      type: String,
      default: "Secretary General",
    },
    qrVerificationUrl: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

export const ChampionshipCertificateModel: Model<IChampionshipCertificateDocument> =
  mongoose.models.ChampionshipCertificate ||
  mongoose.model<IChampionshipCertificateDocument>(
    "ChampionshipCertificate",
    ChampionshipCertificateSchema
  );
