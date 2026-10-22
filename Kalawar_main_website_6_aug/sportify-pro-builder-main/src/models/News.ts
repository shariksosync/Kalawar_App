import mongoose, { Schema, Model, Document } from "mongoose";
import type { NewsItem } from "@/data/content";

export interface INewsDocument extends Omit<NewsItem, "id">, Document {
  id: string;
  status: "Published" | "Draft" | "Archived";
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
  location?: string;
  expiryDate?: string;
  actionLink?: string;
  actionText?: string;
  pinned?: boolean;
}

const NewsSchema = new Schema<INewsDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    slug: {
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
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "News",
      index: true,
    },
    tag: {
      type: String,
      default: "Latest",
    },
    author: {
      type: String,
      default: "Media Secretariat",
      trim: true,
    },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    expiryDate: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "National Headquarters, India",
    },
    readTime: {
      type: String,
      default: "3 min read",
      trim: true,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80",
    },
    documentUrl: {
      type: String,
      default: "",
    },
    documentName: {
      type: String,
      default: "",
    },
    documentSize: {
      type: String,
      default: "",
    },
    actionLink: {
      type: String,
      default: "",
    },
    actionText: {
      type: String,
      default: "",
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
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

export const NewsModel: Model<INewsDocument> =
  mongoose.models.News || mongoose.model<INewsDocument>("News", NewsSchema);

export default NewsModel;
