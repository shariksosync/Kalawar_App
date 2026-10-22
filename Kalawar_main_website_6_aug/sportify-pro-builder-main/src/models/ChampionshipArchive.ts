import mongoose, { Schema, Model, Document } from "mongoose";
import type { DetailedTournamentResult } from "@/data/results-archive";

export interface IChampionshipArchiveDocument extends DetailedTournamentResult, Document {}

const ChampionshipArchiveSchema = new Schema<IChampionshipArchiveDocument>(
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
      index: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
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
    city: {
      type: String,
      required: true,
      trim: true,
    },
    totalAthletes: {
      type: Number,
      default: 400,
    },
    totalAcademies: {
      type: Number,
      default: 30,
    },
    heroImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
    },
    topPodium: {
      division: { type: String, default: "National Open Champions" },
      gold: {
        athlete: { type: String, default: "" },
        academy: { type: String, default: "" },
        state: { type: String, default: "" },
      },
      silver: {
        athlete: { type: String, default: "" },
        academy: { type: String, default: "" },
        state: { type: String, default: "" },
      },
      bronze: {
        athlete: { type: String, default: "" },
        academy: { type: String, default: "" },
        state: { type: String, default: "" },
      },
    },
    academiesResults: {
      adultMale: [
        {
          rank: { type: Number, required: true },
          name: { type: String, required: true },
          points: { type: Number, required: true },
          state: { type: String, required: true },
        },
      ],
      adultFemale: [
        {
          rank: { type: Number, required: true },
          name: { type: String, required: true },
          points: { type: Number, required: true },
          state: { type: String, required: true },
        },
      ],
      juvenile: [
        {
          rank: { type: Number, required: true },
          name: { type: String, required: true },
          points: { type: Number, required: true },
          state: { type: String, required: true },
        },
      ],
    },
    athletesResultsByCategory: [
      {
        categoryTitle: { type: String, required: true },
        divisionGroup: {
          type: String,
          enum: ["Adult Male", "Adult Female", "Juvenile / Youth", "Masters"],
          default: "Adult Male",
        },
        podium: [
          {
            place: { type: Number, required: true },
            athlete: { type: String, required: true },
            academy: { type: String, required: true },
            state: { type: String, required: true },
          },
        ],
      },
    ],
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

export const ChampionshipArchiveModel: Model<IChampionshipArchiveDocument> =
  mongoose.models.ChampionshipArchive ||
  mongoose.model<IChampionshipArchiveDocument>(
    "ChampionshipArchive",
    ChampionshipArchiveSchema
  );

export default ChampionshipArchiveModel;
