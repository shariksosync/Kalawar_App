import mongoose, { Schema, Model, Document } from "mongoose";

export interface IMedalTallyEntry {
  id: string;
  state: string;
  gold: number;
  silver: number;
  bronze: number;
}

export interface IMedalTallyDocument extends IMedalTallyEntry, Document {}

const MedalTallySchema = new Schema<IMedalTallyDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    gold: {
      type: Number,
      default: 0,
      min: 0,
    },
    silver: {
      type: Number,
      default: 0,
      min: 0,
    },
    bronze: {
      type: Number,
      default: 0,
      min: 0,
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

export const MedalTallyModel: Model<IMedalTallyDocument> =
  mongoose.models.MedalTally ||
  mongoose.model<IMedalTallyDocument>("MedalTally", MedalTallySchema);

export default MedalTallyModel;
