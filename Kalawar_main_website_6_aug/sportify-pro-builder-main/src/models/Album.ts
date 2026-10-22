import mongoose, { Schema, Model, Document } from "mongoose";
import type { AlbumCategory, IPhotoItem } from "@/types/album";
export { ALBUM_CATEGORIES, type AlbumCategory, type IPhotoItem } from "@/types/album";

export interface IAlbumDocument extends Document {
  id: string;
  title: string;
  slug: string;
  category: AlbumCategory | string;
  eventName?: string;
  eventLink?: string;
  date: string;
  venue: string;
  state?: string;
  district?: string;
  coverPhoto: string;
  description?: string;
  photographerCredit?: string;
  photos: IPhotoItem[];
  status: "Published" | "Draft" | "Archived";
  pinned?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PhotoItemSchema = new Schema<IPhotoItem>(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    photographer: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AlbumSchema = new Schema<IAlbumDocument>(
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
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "Championship Photos",
      index: true,
      trim: true,
    },
    eventName: {
      type: String,
      default: "",
      trim: true,
    },
    eventLink: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      default: "Maharashtra",
      trim: true,
    },
    district: {
      type: String,
      default: "Pune",
      trim: true,
    },
    coverPhoto: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    photographerCredit: {
      type: String,
      default: "KALAWAR Official Media Cell",
      trim: true,
    },
    photos: {
      type: [PhotoItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
      default: "Published",
      index: true,
    },
    pinned: {
      type: Boolean,
      default: false,
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

export const AlbumModel: Model<IAlbumDocument> =
  mongoose.models.Album || mongoose.model<IAlbumDocument>("Album", AlbumSchema);

export default AlbumModel;
