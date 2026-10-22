import mongoose, { Schema, Model, Document } from "mongoose";
import type { KalawarEvent } from "@/data/kalawar-events";

export interface IKalawarEventDocument extends KalawarEvent, Document {}

const KalawarEventSchema = new Schema(
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
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    marathiName: {
      type: String,
      default: "",
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Combat Striking",
      trim: true,
    },
    badge: {
      type: String,
      default: "Flagship Event",
      trim: true,
    },
    heroImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    },
    registrationLive: {
      type: Boolean,
      default: true,
    },
    nextTournamentName: {
      type: String,
      default: "All-India Championship",
      trim: true,
    },
    introduction: {
      type: Schema.Types.Mixed,
      default: {},
    },
    rules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    scoring: {
      type: Schema.Types.Mixed,
      default: {},
    },
    categories: {
      type: Schema.Types.Mixed,
      default: {},
    },
    equipment: {
      type: Schema.Types.Mixed,
      default: {},
    },
    historicalLineage: {
      type: Schema.Types.Mixed,
      default: {},
    },
    faq: {
      type: Schema.Types.Mixed,
      default: [],
    },
    mediaGallery: {
      type: Schema.Types.Mixed,
      default: [],
    },
    subDisciplines: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const KalawarEventModel: Model<IKalawarEventDocument> =
  mongoose.models.KalawarEvent ||
  mongoose.model<IKalawarEventDocument>("KalawarEvent", KalawarEventSchema);

export default KalawarEventModel;
