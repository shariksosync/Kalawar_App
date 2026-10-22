import mongoose, { Schema, Model, Document } from "mongoose";
import type { SportEvent } from "@/data/events";

export interface IEventDocument extends SportEvent, Document {}

const EventSchema = new Schema<IEventDocument>(
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
    discipline: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "National Championship",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed"],
      default: "Upcoming",
    },
    entryFee: {
      type: String,
      default: "Free",
      trim: true,
    },
    slots: {
      type: Number,
      default: 64,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    eventType: {
      type: String,
      enum: ["upcoming", "calendar", "my-first-championship", "flagship", "championship"],
      default: "upcoming",
      index: true,
    },
    registrationLive: {
      type: Boolean,
      default: true,
    },
    month: {
      type: String,
      default: "APR",
      trim: true,
    },
    year: {
      type: Number,
      default: 2026,
    },
    tier: {
      type: String,
      default: "National Championship",
      trim: true,
    },
    rules: {
      type: [String],
      default: [],
    },
    equipment: {
      type: [String],
      default: [],
    },
  },
  {
    strict: false,
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

export const EventModel: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>("Event", EventSchema);

export default EventModel;
