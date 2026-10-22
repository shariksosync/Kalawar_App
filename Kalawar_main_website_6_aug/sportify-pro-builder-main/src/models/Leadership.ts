import mongoose, { Schema, Model, Document } from "mongoose";

export interface ILeadershipDocument extends Document {
  id: string;
  name: string;
  role: string;
  tag?: string;
  addressTitle?: string;
  quote?: string;
  message: string;
  organization?: string;
  image?: string;
  order: number;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const LeadershipSchema = new Schema<ILeadershipDocument>(
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
    tag: {
      type: String,
      default: "Leadership Vision",
      trim: true,
    },
    addressTitle: {
      type: String,
      default: "President's Address",
      trim: true,
    },
    quote: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      default: "",
    },
    organization: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
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
  },
  {
    timestamps: true,
  }
);

LeadershipSchema.index({ status: 1, order: 1 });

export const LeadershipModel: Model<ILeadershipDocument> =
  mongoose.models.Leadership || mongoose.model<ILeadershipDocument>("Leadership", LeadershipSchema);
