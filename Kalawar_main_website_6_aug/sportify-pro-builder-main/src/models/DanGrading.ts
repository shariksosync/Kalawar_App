import mongoose, { Schema, Model, Document } from "mongoose";
import type {
  DanGradeLevel as DanGradeLevelType,
  DanExamSession as DanExamSessionType,
  DanApplication as DanApplicationType,
  DanCertificateData as DanCertificateDataType,
} from "@/data/dan-grading";

export interface IDanGradeLevelDocument extends DanGradeLevelType, Document {}
export interface IDanExamSessionDocument extends DanExamSessionType, Document {}
export interface IDanApplicationDocument extends DanApplicationType, Document {}
export interface IDanCertificateDocument extends DanCertificateDataType, Document {}

// Dan Grade Level Schema (1st to 10th Dan Syllabus & Fees)
const DanGradeLevelSchema = new Schema<IDanGradeLevelDocument>(
  {
    dan: { type: Number, required: true, unique: true, index: true },
    rankName: { type: String, required: true, trim: true },
    titleJapanese: { type: String, required: true, trim: true },
    titleKorean: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    minTrainingYears: { type: Number, required: true, default: 3.5 },
    timeInPreviousGradeYears: { type: Number, required: true, default: 1 },
    minAge: { type: Number, required: true, default: 16 },
    beltColor: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, default: 3500 },
    kataForms: { type: [String], default: [] },
    sparringRequirements: { type: [String], default: [] },
    selfDefenseWeapons: { type: [String], default: [] },
    breakingRequirements: { type: [String], default: [] },
    aadhaarRequired: { type: Boolean, default: false },
    currentCertRequired: { type: Boolean, default: false },
    medicalFitnessRequired: { type: Boolean, default: false },
    theoryThesisRequired: { type: Boolean, default: false },
    thesisTopic: { type: String },
    technicalRequirements: { type: [String], default: [] },
    eligibilityNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Assessment Score Sub-schema
const DanAssessmentSchema = new Schema(
  {
    formsScore: { type: Number, default: 0 },
    sparringScore: { type: Number, default: 0 },
    selfDefenseScore: { type: Number, default: 0 },
    breakingScore: { type: Number, default: 0 },
    theoryThesisScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    grade: {
      type: String,
      enum: ["Distinction (90%+)", "First Class (75-89%)", "Pass (60-74%)", "Fail (<60%)"],
      default: "Pass (60-74%)",
    },
    examinerRemarks: { type: String },
    committeeApprovalDate: { type: String },
    technicalDirectorApproval: { type: Boolean, default: true },
    chiefExaminerSignature: { type: String },
  },
  { _id: false }
);

// Dan Application Schema
const DanApplicationSchema = new Schema<IDanApplicationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    examId: { type: String, index: true, trim: true },
    athleteId: { type: String, required: true, index: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    dob: { type: String, default: "2000-01-01" },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    academyName: { type: String, required: true, trim: true },
    athletePhoto: { type: String },

    currentDanGrade: { type: Number, default: 0 },
    currentBeltTitle: { type: String, default: "Brown Belt (1st Gup)" },
    appliedDanGrade: { type: Number, required: true },
    appliedDanTitle: { type: String, required: true },

    previousDanCertNo: { type: String },
    previousDanIssueDate: { type: String },
    previousDanIssuedBy: { type: String },
    instructorName: { type: String, default: "Chief Instructor" },
    instructorDanGrade: { type: String, default: "5th Dan" },

    aadhaarDoc: { type: String },
    aadhaarDocName: { type: String },
    currentCertDoc: { type: String },
    currentCertDocName: { type: String },
    medicalFitnessDoc: { type: String },
    medicalFitnessDocName: { type: String },
    thesisDoc: { type: String },
    thesisDocName: { type: String },
    paymentProofDoc: { type: String },
    paymentProofDocName: { type: String },
    paymentProofDocSize: { type: String },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Cash Verification Required"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Razorpay Online", "Cash Verification at Venue", "Direct Bank Transfer"],
      default: "Razorpay Online",
    },
    transactionId: { type: String },
    paymentAmount: { type: Number, default: 3500 },

    declarationAccepted: { type: Boolean, default: true },
    appliedDate: { type: String, required: true },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Verification",
        "Documents Required",
        "Payment Pending",
        "Payment Verified",
        "Eligible",
        "Exam Scheduled",
        "Exam Completed",
        "Result Pending",
        "Passed",
        "Failed",
        "Re-test",
      ],
      default: "Submitted",
      index: true,
    },
    adminVerificationRemarks: { type: String },
    attendance: {
      type: String,
      enum: ["Pending", "Present", "Absent"],
      default: "Pending",
    },
    assessment: { type: DanAssessmentSchema },
    examDate: { type: String },
    examVenue: { type: String },
    examTime: { type: String },
    admitCardIssued: { type: Boolean, default: false },
    admitCardIssuedAt: { type: String },
    certificateNumber: { type: String, index: true },
    certificateIssuedDate: { type: String },
    idCardNumber: { type: String, index: true },
  },
  { timestamps: true }
);

// Dan Exam Session Schema
const DanExamSessionSchema = new Schema<IDanExamSessionDocument>(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    discipline: { type: String, default: "Kalawar Martial Arts", trim: true },
    examDate: { type: String, required: true },
    reportingTime: { type: String, default: "07:30 AM" },
    examEndTime: { type: String, default: "06:30 PM" },
    venueName: { type: String, required: true },
    venueAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    chiefExaminer: { type: String, required: true },
    chiefExaminerRank: { type: String, required: true },
    examiners: { type: [String], default: [] },
    eligibleDans: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    registrationDeadline: { type: String, required: true },
    fee: { type: Number, default: 3500 },
    maxCandidates: { type: Number, default: 75 },
    description: { type: String },
    status: {
      type: String,
      enum: ["Draft", "Registration Open", "In Progress", "Completed", "Results Published"],
      default: "Registration Open",
      index: true,
    },
    bannerImage: { type: String },
    candidatesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Dan Certificate Schema
const DanCertificateSchema = new Schema<IDanCertificateDocument>(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true, trim: true },
    idCardNumber: { type: String, required: true, index: true, trim: true },
    candidateName: { type: String, required: true },
    athleteId: { type: String, required: true, index: true },
    danRank: { type: Number, required: true },
    danRankTitle: { type: String, required: true },
    japaneseTitle: { type: String, required: true },
    koreanTitle: { type: String, required: true },
    discipline: { type: String, default: "Kalawar Martial Arts" },
    academyName: { type: String, required: true },
    state: { type: String, required: true },
    photoUrl: { type: String },
    dob: { type: String },
    issueDate: { type: String, required: true },
    examDate: { type: String, required: true },
    score: { type: Number, default: 90 },
    grade: { type: String, default: "Distinction (90%+)" },
    presidentName: { type: String, default: "MR. SANTOSH KASBE" },
    presidentRole: {
      type: String,
      default: "Founder & President – India | Head – Technical Committee, India",
    },
    chiefExaminer: { type: String, required: true },
    chiefExaminerRank: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Valid", "Suspended", "Revoked"],
      default: "Valid",
    },
  },
  { timestamps: true }
);

export const DanGradeLevelModel: Model<IDanGradeLevelDocument> =
  mongoose.models.DanGradeLevel ||
  mongoose.model<IDanGradeLevelDocument>("DanGradeLevel", DanGradeLevelSchema);

export const DanExamSessionModel: Model<IDanExamSessionDocument> =
  mongoose.models.DanExamSession ||
  mongoose.model<IDanExamSessionDocument>("DanExamSession", DanExamSessionSchema);

export const DanApplicationModel: Model<IDanApplicationDocument> =
  mongoose.models.DanApplication ||
  mongoose.model<IDanApplicationDocument>("DanApplication", DanApplicationSchema);

export const DanCertificateModel: Model<IDanCertificateDocument> =
  mongoose.models.DanCertificate ||
  mongoose.model<IDanCertificateDocument>("DanCertificate", DanCertificateSchema);
