import mongoose, { Schema, Model, Document } from "mongoose";

export interface IDownloadDocument extends Document {
  id: string;
  title: string;
  category: "Rule Book & Regulations" | "Registration Forms" | "Official Forms" | "Certificates & Documents";
  description: string;
  version: string;
  publishedDate: string;
  updatedDate: string;
  year: string;
  event: string;
  type: "PDF" | "DOCX" | "ZIP";
  size: string;
  docCode: string;
  fileUrl?: string;
  status: "Published" | "Draft" | "Archived";
  order: number;
  officialStamp: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DownloadSchema = new Schema<IDownloadDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Rule Book & Regulations",
        "Registration Forms",
        "Official Forms",
        "Certificates & Documents",
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: "v2026.1",
      trim: true,
    },
    publishedDate: {
      type: String,
      required: true,
      trim: true,
    },
    updatedDate: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      default: "2026",
      index: true,
      trim: true,
    },
    event: {
      type: String,
      default: "Federation Direct / General",
      trim: true,
    },
    type: {
      type: String,
      enum: ["PDF", "DOCX", "ZIP"],
      default: "PDF",
    },
    size: {
      type: String,
      default: "1.0 MB",
      trim: true,
    },
    docCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
      default: "Published",
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    officialStamp: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
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

export const DownloadModel: Model<IDownloadDocument> =
  mongoose.models.Download ||
  mongoose.model<IDownloadDocument>("Download", DownloadSchema);

export default DownloadModel;
