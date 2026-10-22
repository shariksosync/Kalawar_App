import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  code: string; // Unique SKU e.g. PRD-2026-0001
  name: string;
  slug: string;
  category: string; // e.g. "Uniforms & Dobok", "Belts & Ranks", "Protective Gear", "Weapons & Training", "Merchandise"
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  availabilityStatus: "In Stock" | "Out of Stock" | "Pre-order";
  images: string[];
  status: "Active" | "Draft" | "Hidden";
  featured: boolean;
  tags?: string[];
  rating?: number;
  reviewsCount?: number;
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Original price cannot be negative"],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    availabilityStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Pre-order"],
      default: "In Stock",
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Hidden"],
      default: "Active",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 12,
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose model overwrite error during Next.js hot reload
export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
