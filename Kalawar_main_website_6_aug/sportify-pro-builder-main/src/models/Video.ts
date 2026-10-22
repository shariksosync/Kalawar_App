import mongoose, { Schema, Model, Document } from "mongoose";
import type { VideoCategory, VideoType } from "@/types/video";
export { VIDEO_CATEGORIES, type VideoCategory, type VideoType, type IVideo } from "@/types/video";

export interface IVideoDocument extends Document {
  id: string;
  title: string;
  slug: string;
  category: VideoCategory | string;
  videoUrl: string;
  videoType: VideoType;
  videoId?: string;
  thumbnailUrl: string;
  duration?: string;
  eventName?: string;
  eventLink?: string;
  date: string;
  venue?: string;
  state?: string;
  district?: string;
  description?: string;
  channelOrCredit?: string;
  status: "Published" | "Draft" | "Archived";
  pinned?: boolean;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const VideoSchema = new Schema<IVideoDocument>(
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
      default: "Championship Videos",
      index: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    videoType: {
      type: String,
      enum: ["youtube", "vimeo", "mp4", "other"],
      default: "youtube",
    },
    videoId: {
      type: String,
      default: "",
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: "00:00",
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
      default: "",
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
    description: {
      type: String,
      default: "",
      trim: true,
    },
    channelOrCredit: {
      type: String,
      default: "KALAWAR Official Media",
      trim: true,
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
    views: {
      type: Number,
      default: 0,
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

export const VideoModel: Model<IVideoDocument> =
  mongoose.models.Video || mongoose.model<IVideoDocument>("Video", VideoSchema);

export default VideoModel;
