import mongoose, { Schema, Model, Document } from "mongoose";
import type {
  BeltExamSession as BeltExamSessionType,
  ExamCandidate as ExamCandidateType,
  BeltLevel as BeltLevelType,
} from "@/data/belt-exams";

export interface IBeltExamDocument extends BeltExamSessionType, Document {}
export interface IBeltLevelDocument extends BeltLevelType, Document {}

const BeltLevelSchema = new Schema<IBeltLevelDocument>(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameHindi: { type: String, trim: true },
    gupDan: { type: String, required: true, trim: true },
    anukkamaNumber: { type: Number, default: 1 },
    anukkamaName: { type: String, default: "" },
    anukkamaNameHindi: { type: String, default: "" },
    beltColorName: { type: String, default: "" },
    beltColorNameHindi: { type: String, default: "" },
    beltEmoji: { type: String, default: "🥋" },
    badgeColor: { type: String, default: "bg-amber-400 text-stone-950" },
    borderColor: { type: String, default: "border-amber-400" },
    textColor: { type: String, default: "text-amber-400" },
    bgGradient: { type: String, default: "from-amber-400 to-yellow-600" },
    minTrainingMonths: { type: Number, default: 3 },
    templateFile: { type: String, default: "" },
    summary: { type: String, default: "" },
    syllabus: {
      forms: { type: [String], default: [] },
      techniques: { type: [String], default: [] },
      sparring: { type: [String], default: [] },
      selfDefense: { type: [String], default: [] },
      breaking: { type: [String], default: [] },
      theory: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

export const BeltLevelModel: Model<IBeltLevelDocument> =
  mongoose.models.BeltLevel ||
  mongoose.model<IBeltLevelDocument>("BeltLevel", BeltLevelSchema);

const ExamCandidateSchema = new Schema<ExamCandidateType>(
  {
    id: { type: String, required: true },
    athleteId: { type: String, required: true },
    athleteName: { type: String, required: true },
    athleteImage: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "Male" },
    academyName: { type: String, default: "" },
    clubName: { type: String, default: "Independent Dojo" },
    state: { type: String, default: "Maharashtra" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    currentBelt: { type: String, default: "White Belt" },
    targetBelt: { type: String, required: true },
    status: {
      type: String,
      default: "Submitted",
    },
    registrationSlipId: { type: String, default: "" },
    admitCardNumber: { type: String, default: "" },
    admitCardIssuedAt: { type: String, default: "" },
    admitCardIssuedBy: { type: String, default: "" },
    examDate: { type: String, default: "" },
    examTime: { type: String, default: "" },
    reportingTime: { type: String, default: "" },
    sessionEndTime: { type: String, default: "" },
    examVenue: { type: String, default: "" },
    chiefExaminer: { type: String, default: "" },
    chiefExaminerRank: { type: String, default: "" },
    admitCardRemarks: { type: String, default: "" },
    attendance: {
      type: String,
      default: "Pending",
    },
    registeredOn: { type: String, default: () => new Date().toISOString().split("T")[0] },
    assessment: {
      formsScore: { type: Number, default: 0 },
      sparringScore: { type: Number, default: 0 },
      selfDefenseScore: { type: Number, default: 0 },
      fitnessScore: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      grade: { type: String, default: "" },
      examinerRemarks: { type: String, default: "" },
    },
    resultStatus: {
      type: String,
      default: "Pending",
    },
    resultDeclaredAt: { type: String, default: "" },
    certificateNumber: { type: String, default: "" },
    evaluatedBy: { type: String, default: "" },
    evaluatedAt: { type: String, default: "" },
  },
  { _id: false, strict: false }
);

const BeltExamSchema = new Schema<IBeltExamDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    discipline: { type: String, default: "Kalawar Martial Arts", trim: true },
    examDate: { type: String, required: true },
    reportingTime: { type: String, default: "08:00 AM" },
    examEndTime: { type: String, default: "05:00 PM" },
    venueName: { type: String, required: true },
    venueAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    chiefExaminer: { type: String, default: "Grandmaster Rajesh Sharma" },
    chiefExaminerRank: { type: String, default: "" },
    examiners: { type: [String], default: [] },
    eligibleBelts: { type: [String], default: [] },
    registrationDeadline: { type: String, default: "" },
    maxCandidates: { type: Number, default: 100 },
    description: { type: String, default: "" },
    status: {
      type: String,
      default: "Registration Open",
    },
    bannerImage: { type: String, default: "" },
    candidates: { type: [ExamCandidateSchema], default: [] },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const BeltExamModel: Model<IBeltExamDocument> =
  mongoose.models.BeltExam ||
  mongoose.model<IBeltExamDocument>("BeltExam", BeltExamSchema);

