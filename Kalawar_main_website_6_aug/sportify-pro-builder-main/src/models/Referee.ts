import mongoose, { Schema, Document, Model } from "mongoose";
import { type RefereeItem } from "@/types/referee";

export interface IRefereeDocument extends Omit<RefereeItem, "id">, Document {
  id: string;
}

const TrainingRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    seminarName: { type: String, required: true },
    date: { type: String, required: true },
    trainerName: { type: String, required: true },
    hours: { type: Number, default: 0 },
    location: { type: String, default: "" },
    status: { type: String, default: "Completed" },
  },
  { _id: false }
);

const ExamRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    examType: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, default: 50 },
    date: { type: String, required: true },
    examiner: { type: String, required: true },
    result: { type: String, default: "Passed" },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const DutyAppointmentSchema = new Schema(
  {
    id: { type: String, required: true },
    championshipId: { type: String, default: "" },
    championshipName: { type: String, required: true },
    eventDate: { type: String, required: true },
    location: { type: String, default: "" },
    category: { type: String, default: "" },
    ringOrMatNumber: { type: String, default: "Mat 1" },
    position: { type: String, required: true },
    appointedBy: { type: String, default: "Technical Committee" },
    appointedAt: { type: String, default: () => new Date().toISOString() },
    status: { type: String, default: "Nominated" },
    performanceRating: { type: Number, default: 5 },
    performanceNotes: { type: String, default: "" },
  },
  { _id: false }
);

const EvaluationSchema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    evaluator: { type: String, required: true },
    score: { type: Number, default: 100 },
    category: { type: String, default: "Rules Application" },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const RefereeSchema = new Schema<IRefereeDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    username: { type: String, default: '', index: true },
    password: { type: String, default: '' },
    rawPassword: { type: String, default: '' },
    dob: { type: String, default: "" },
    gender: { type: String, default: "Male" },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    state: { type: String, default: "", index: true },
    district: { type: String, default: "" },
    tempStateAssociation: { type: String, default: "" },
    tempDistrictAssociation: { type: String, default: "" },
    discipline: { type: String, default: "Kalawar Martial Arts" },
    academy: { type: String, default: "" },
    kalawarId: { type: String, default: "", index: true },
    currentRank: { type: String, default: "1st Dan Black Belt" },
    martialArtsExperience: { type: String, default: "3 Years" },
    level: { type: String, default: "Level 1 – Junior Referee", index: true },
    status: { type: String, default: "Application Submitted", index: true },
    licenseNumber: { type: String, default: "", index: true },
    licenseIssuedDate: { type: String, default: "" },
    licenseValidUntil: { type: String, default: "" },
    photo: { type: String, default: "" },
    certificationDocument: { type: String, default: "" },
    certificationDocumentName: { type: String, default: "" },
    certificationDocumentSize: { type: String, default: "" },
    aadhaarDoc: { type: String, default: "" },
    aadhaarDocName: { type: String, default: "" },
    aadhaarDocSize: { type: String, default: "" },
    specialization: { type: String, default: "" },
    danCertificationYear: { type: String, default: "" },
    danGradingAuthority: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    address: { type: String, default: "" },
    pincode: { type: String, default: "" },
    documents: [{ type: String }],
    previousCertificates: [{ type: String }],
    bio: { type: String, default: "" },
    matchesOfficiated: { type: Number, default: 0 },
    trainingRecords: [TrainingRecordSchema],
    examRecords: [ExamRecordSchema],
    dutyAppointments: [DutyAppointmentSchema],
    evaluations: [EvaluationSchema],
    internalNotes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const RefereeModel: Model<IRefereeDocument> =
  mongoose.models.Referee || mongoose.model<IRefereeDocument>("Referee", RefereeSchema);
