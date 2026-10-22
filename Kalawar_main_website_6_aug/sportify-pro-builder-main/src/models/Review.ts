import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  productId: string; // Product ObjectId or ID
  productCode: string; // e.g. "PRD-2026-0001"
  productName: string;
  productImage?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userRole?: string; // "Athlete" | "Coach" | "Referee" | "Member" | "Admin"
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: "Pending" | "Approved" | "Rejected";
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    productCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    userId: {
      type: String,
      default: "",
      index: true,
    },
    userName: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, "Reviewer email is required"],
      trim: true,
      lowercase: true,
    },
    userRole: {
      type: String,
      default: "Athlete",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    title: {
      type: String,
      required: [true, "Review headline is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
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

// Prevent mongoose model overwrite during Next.js hot reload
export const ReviewModel: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
