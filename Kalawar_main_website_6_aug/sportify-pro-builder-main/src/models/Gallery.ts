import mongoose, { Schema, Model, Document } from "mongoose";

export type GalleryItemType = "photo" | "video";

export interface IGalleryDocument extends Document {
  id: string;
  type: GalleryItemType;
  title: string;
  category: string;
  src: string;
  thumb?: string;
  duration?: string;
  span?: "normal" | "tall" | "wide";
  status: "Published" | "Draft";
}

const GallerySchema = new Schema<IGalleryDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["photo", "video"],
      required: true,
      default: "photo",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      index: true,
      trim: true,
    },
    src: {
      type: String,
      required: true,
      trim: true,
    },
    thumb: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: String,
      default: "",
      trim: true,
    },
    span: {
      type: String,
      enum: ["normal", "tall", "wide"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
      index: true,
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

export const GalleryModel: Model<IGalleryDocument> =
  mongoose.models.Gallery || mongoose.model<IGalleryDocument>("Gallery", GallerySchema);

export default GalleryModel;
