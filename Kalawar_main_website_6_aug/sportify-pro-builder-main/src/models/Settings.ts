import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISettingsDocument extends Document {
  federationName: string;
  contactEmail: string;
  contactPhone: string;
  activeSeason: string;
  address: string;
  googleMapsUrl?: string;
  acceptRegistrations: boolean;
  publishResults: boolean;
  maintenanceMode: boolean;
  enableShop: boolean;
  announcementBanner?: string;
  announcementBannerEnabled?: boolean;
  // Intro video fields
  introVideoEnabled?: boolean;
  introVideoUrl?: string;
  introVideoFrequency?: string;
  introVideoTitle?: string;
  introVideoTagline?: string;
  // Banner slides
  bannerSlides?: Array<{
    id: string;
    image: string;
    alt?: string;
    title?: string;
    link?: string;
    active?: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    federationName: {
      type: String,
      default: "KALAWAR Sports & Martial Arts Federation of India",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "kalawarmartialartsindia@gmail.com",
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: "+91 70833 14435 / +91 95614 27125",
      trim: true,
    },
    activeSeason: {
      type: String,
      default: "2026",
      trim: true,
    },
    address: {
      type: String,
      default: "National Headquarters, India",
      trim: true,
    },
    googleMapsUrl: {
      type: String,
      default: "https://share.google/31PQfjzetEDIADnHy",
      trim: true,
    },
    acceptRegistrations: {
      type: Boolean,
      default: true,
    },
    publishResults: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    enableShop: {
      type: Boolean,
      default: true,
    },
    announcementBanner: {
      type: String,
      default: "🏆 National Championship 2026 Registrations Open • Join KALAWAR Sports Federation",
      trim: true,
    },
    announcementBannerEnabled: {
      type: Boolean,
      default: true,
    },
    introVideoEnabled: {
      type: Boolean,
      default: true,
    },
    introVideoUrl: {
      type: String,
      default: "https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-training-in-a-dojo-42866-large.mp4",
      trim: true,
    },
    introVideoFrequency: {
      type: String,
      default: "once_per_session",
      trim: true,
    },
    introVideoTitle: {
      type: String,
      default: "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA",
      trim: true,
    },
    introVideoTagline: {
      type: String,
      default: "Indian Martial Arts • Sports • Skill • Discipline • Excellence",
      trim: true,
    },
    bannerSlides: {
      type: [
        {
          id: { type: String, default: "" },
          image: { type: String, default: "" },
          alt: { type: String, default: "" },
          title: { type: String, default: "" },
          link: { type: String, default: "" },
          active: { type: Boolean, default: true },
        },
      ],
      default: undefined,
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

export const SettingsModel: Model<ISettingsDocument> =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>("Settings", SettingsSchema);
