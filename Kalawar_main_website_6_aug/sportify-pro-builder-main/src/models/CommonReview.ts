import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommonReview extends Document {
  name: string;
  rating: number; // 1 to 5
  comment: string;
  photo?: string; // Image URL or Base64
  status: "Pending" | "Approved" | "Rejected";
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommonReviewSchema = new Schema<ICommonReview>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const CommonReviewModel: Model<ICommonReview> =
  mongoose.models.CommonReview ||
  mongoose.model<ICommonReview>("CommonReview", CommonReviewSchema);
