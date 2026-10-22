import mongoose, { Schema, Model, Document } from "mongoose";

export interface IDistrictAdminDocument extends Document {
  id: string;
  userId: string;
  password: string;
  state: string;
  district: string;
  role: "district_admin";
  status: "Active" | "Disabled";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictAdminSchema = new Schema<IDistrictAdminDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
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
    role: {
      type: String,
      enum: ["district_admin"],
      default: "district_admin",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
      index: true,
    },
    lastLogin: {
      type: Date,
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

// Compound index on state and district for fast unique lookups
DistrictAdminSchema.index({ state: 1, district: 1 }, { unique: true });

export const DistrictAdminModel: Model<IDistrictAdminDocument> =
  mongoose.models.DistrictAdmin ||
  mongoose.model<IDistrictAdminDocument>("DistrictAdmin", DistrictAdminSchema);
