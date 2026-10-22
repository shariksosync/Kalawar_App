import mongoose, { Schema, Model, Document } from "mongoose";

export interface IContactDocument extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  state?: string;
  district?: string;
  subject: string;
  category: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  status: string;
  assignedTo?: string;
  adminReply?: string;
  repliedAt?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContactDocument>(
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    district: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General Enquiry",
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      default: "",
    },
    attachmentSize: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Submitted",
      index: true,
    },
    assignedTo: {
      type: String,
      default: "",
    },
    adminReply: {
      type: String,
      default: "",
    },
    repliedAt: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
    eventId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    eventName: {
      type: String,
      default: "",
      trim: true,
    },
    eventDate: {
      type: String,
      default: "",
      trim: true,
    },
    division: {
      type: String,
      default: "",
      trim: true,
    },
    beltRank: {
      type: String,
      default: "",
      trim: true,
    },
    academyName: {
      type: String,
      default: "",
      trim: true,
    },
    tag: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    history: [
      {
        action: String,
        date: String,
        by: String,
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ContactModel: Model<IContactDocument> =
  mongoose.models.Contact || mongoose.model<IContactDocument>("Contact", ContactSchema);
