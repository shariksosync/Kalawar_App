import mongoose, { Schema, Model, Document } from "mongoose";

export type OfficialCategory = string;

export interface IOfficialDocument extends Document {
  id: string;
  name: string;
  role: string;
  category: string;
  state?: string;
  district?: string;
  image?: string;
  bio?: string;
  order: number;
  status: "Active" | "Inactive";
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OfficialSchema = new Schema<IOfficialDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "National Officials",
      index: true,
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
    image: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const OfficialModel: Model<IOfficialDocument> =
  mongoose.models.Official || mongoose.model<IOfficialDocument>("Official", OfficialSchema);
