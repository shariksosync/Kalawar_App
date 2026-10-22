import mongoose, { Schema, Model, Document } from "mongoose";

export interface ITournamentResult {
  id: string;
  tournament: string;
  discipline: string;
  season: string;
  winner: string;
  runnerUp: string;
  thirdPlace: string;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  mvp: string;
  image: string;
  status: "Verified" | "Pending";
}

export interface IResultDocument extends ITournamentResult, Document {}

const ResultSchema = new Schema<IResultDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    tournament: {
      type: String,
      required: true,
      trim: true,
    },
    discipline: {
      type: String,
      required: true,
      trim: true,
    },
    season: {
      type: String,
      required: true,
      trim: true,
    },
    winner: {
      type: String,
      required: true,
      trim: true,
    },
    runnerUp: {
      type: String,
      default: "",
      trim: true,
    },
    thirdPlace: {
      type: String,
      default: "",
      trim: true,
    },
    medals: {
      gold: { type: Number, default: 0 },
      silver: { type: Number, default: 0 },
      bronze: { type: Number, default: 0 },
    },
    mvp: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    },
    status: {
      type: String,
      enum: ["Verified", "Pending"],
      default: "Verified",
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

export const ResultModel: Model<IResultDocument> =
  mongoose.models.Result ||
  mongoose.model<IResultDocument>("Result", ResultSchema);

export default ResultModel;
