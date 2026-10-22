import mongoose, { Schema, Model, Document } from "mongoose";

export interface IOTPDocument extends Document {
  email: string;
  code: string;
  action: "login" | "register" | "verify" | "reset";
  tempToken: string;
  expiresAt: Date;
  attempts: number;
  userData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTPDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      enum: ["login", "register", "verify", "reset"],
      default: "login",
      index: true,
    },
    tempToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-delete when expiresAt timestamp is reached
    },
    attempts: {
      type: Number,
      default: 0,
    },
    userData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast query resolution
OTPSchema.index({ email: 1, action: 1 });
OTPSchema.index({ tempToken: 1, action: 1 });

export const OTPModel: Model<IOTPDocument> =
  mongoose.models.OTP || mongoose.model<IOTPDocument>("OTP", OTPSchema);

export default OTPModel;
