import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { ReviewModel, IReview } from "@/models/Review";
import { ProductModel } from "@/models/Product";

export interface ReviewItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productImage?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: "Pending" | "Approved" | "Rejected";
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistributionItem {
  count: number;
  percentage: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: RatingDistributionItem;
    4: RatingDistributionItem;
    3: RatingDistributionItem;
    2: RatingDistributionItem;
    1: RatingDistributionItem;
  };
}

async function getStorageFilePath(filename: string): Promise<string> {
  const primary = path.join(process.cwd(), "src", "data", "storage", filename);
  const nested = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    filename
  );

  try {
    await fs.access(primary);
    return primary;
  } catch {
    try {
      await fs.access(nested);
      return nested;
    } catch {
      try {
        await fs.mkdir(path.dirname(primary), { recursive: true });
      } catch {
        // Read-only filesystem
      }
      return primary;
    }
  }
}

async function readReviewsFromFile(): Promise<ReviewItem[]> {
  try {
    const file = await getStorageFilePath("reviews.json");
    const content = await fs.readFile(file, "utf-8");
    return content.trim() ? JSON.parse(content) : [];
  } catch {
    return [];
  }
}

async function writeReviewsToFile(reviews: ReviewItem[]): Promise<void> {
  try {
    const file = await getStorageFilePath("reviews.json");
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(reviews, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(reviews, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (err) {
    console.warn("Notice: Could not save reviews to file fallback (read-only filesystem):", err instanceof Error ? err.message : "");
  }
}

function formatReviewDoc(doc: any): ReviewItem {
  return {
    id: doc._id ? doc._id.toString() : doc.id || `rev-${Date.now()}`,
    productId: doc.productId || "",
    productCode: (doc.productCode || "").toUpperCase(),
    productName: doc.productName || "Federation Gear",
    productImage: doc.productImage || "",
    userId: doc.userId || "",
    userName: doc.userName || "Federation Athlete",
    userEmail: doc.userEmail || "",
    userRole: doc.userRole || "Athlete",
    rating: Number(doc.rating) || 5,
    title: doc.title || "",
    comment: doc.comment || "",
    verifiedPurchase: Boolean(doc.verifiedPurchase),
    status: (doc.status as "Pending" | "Approved" | "Rejected") || "Pending",
    helpfulVotes: Number(doc.helpfulVotes) || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function computeRatingSummary(approvedReviews: ReviewItem[]): RatingSummary {
  const totalReviews = approvedReviews.length;
  if (totalReviews === 0) {
    return {
      averageRating: 0.0,
      totalReviews: 0,
      distribution: {
        5: { count: 0, percentage: 0 },
        4: { count: 0, percentage: 0 },
        3: { count: 0, percentage: 0 },
        2: { count: 0, percentage: 0 },
        1: { count: 0, percentage: 0 },
      },
    };
  }

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const rev of approvedReviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
    counts[r] = (counts[r] || 0) + 1;
    sum += rev.rating;
  }

  const rawAvg = sum / totalReviews;
  const averageRating = Math.round(rawAvg * 10) / 10;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
    distribution: {
      5: {
        count: counts[5] || 0,
        percentage: Math.round(((counts[5] || 0) / totalReviews) * 100),
      },
      4: {
        count: counts[4] || 0,
        percentage: Math.round(((counts[4] || 0) / totalReviews) * 100),
      },
      3: {
        count: counts[3] || 0,
        percentage: Math.round(((counts[3] || 0) / totalReviews) * 100),
      },
      2: {
        count: counts[2] || 0,
        percentage: Math.round(((counts[2] || 0) / totalReviews) * 100),
      },
      1: {
        count: counts[1] || 0,
        percentage: Math.round(((counts[1] || 0) / totalReviews) * 100),
      },
    },
  };
}

/**
 * Recalculates and synchronizes the product's global rating and reviewsCount
 * across MongoDB ProductModel and products.json storage.
 */
export async function syncProductGlobalRating(productCode: string): Promise<{
  rating: number;
  reviewsCount: number;
}> {
  const code = productCode.trim().toUpperCase();
  let approvedReviews: ReviewItem[] = [];

  try {
    await connectToDatabase();
    const docs = await ReviewModel.find({
      productCode: code,
      status: "Approved",
    }).lean();
    approvedReviews = docs.map(formatReviewDoc);
  } catch {
    const fileReviews = await readReviewsFromFile();
    approvedReviews = fileReviews.filter(
      (r) => r.productCode.toUpperCase() === code && r.status === "Approved"
    );
  }

  const summary = computeRatingSummary(approvedReviews);
  const ratingToSet = summary.totalReviews > 0 ? summary.averageRating : 0;
  const countToSet = summary.totalReviews;

  // 1. Update in MongoDB ProductModel
  try {
    await connectToDatabase();
    await ProductModel.updateOne(
      { code },
      { $set: { rating: ratingToSet, reviewsCount: countToSet } }
    );
  } catch (err) {
    console.warn("Could not sync product rating to MongoDB:", err);
  }

  // 2. Update in products.json fallback
  try {
    const prodFile = await getStorageFilePath("products.json");
    const content = await fs.readFile(prodFile, "utf-8");
    if (content.trim()) {
      const prods = JSON.parse(content);
      let updated = false;
      for (const p of prods) {
        if (p.code && p.code.toUpperCase() === code) {
          p.rating = ratingToSet;
          p.reviewsCount = countToSet;
          updated = true;
        }
      }
      if (updated) {
        await fs.writeFile(prodFile, JSON.stringify(prods, null, 2), "utf-8");
      }
    }
  } catch (err) {
    console.warn("Could not sync product rating to products.json:", err);
  }

  return { rating: ratingToSet, reviewsCount: countToSet };
}

/**
 * Fetch approved reviews and global aggregate stats for a product
 */
export async function getProductApprovedReviews(identifier: string): Promise<{
  reviews: ReviewItem[];
  summary: RatingSummary;
}> {
  const clean = decodeURIComponent(identifier).trim().toUpperCase();
  let reviews: ReviewItem[] = [];

  try {
    await connectToDatabase();
    const docs = await ReviewModel.find({
      $or: [
        { productCode: clean },
        { productId: clean },
        ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ productId: identifier }] : []),
      ],
      status: "Approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    reviews = docs.map(formatReviewDoc);
  } catch (dbErr) {
    console.warn("Falling back to local reviews storage:", dbErr);
    const fileReviews = await readReviewsFromFile();
    reviews = fileReviews.filter(
      (r) =>
        (r.productCode.toUpperCase() === clean ||
          r.productId === clean ||
          r.productCode.toLowerCase() === identifier.toLowerCase()) &&
        r.status === "Approved"
    );
  }

  const summary = computeRatingSummary(reviews);
  return { reviews, summary };
}

/**
 * Create a new review from a user in "Pending" status (awaiting Admin approval)
 */
export async function createProductReview(data: {
  productId: string;
  productCode: string;
  productName: string;
  productImage?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase?: boolean;
}): Promise<ReviewItem> {
  const reviewPayload = {
    productId: data.productId,
    productCode: data.productCode.toUpperCase().trim(),
    productName: data.productName.trim(),
    productImage: data.productImage || "",
    userId: data.userId || "",
    userName: data.userName.trim(),
    userEmail: data.userEmail.trim().toLowerCase(),
    userRole: data.userRole || "Athlete",
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    title: data.title.trim(),
    comment: data.comment.trim(),
    verifiedPurchase: Boolean(data.verifiedPurchase),
    status: "Pending" as const,
    helpfulVotes: 0,
  };

  let createdReview: ReviewItem;

  try {
    await connectToDatabase();
    const doc = await ReviewModel.create(reviewPayload);
    createdReview = formatReviewDoc(doc.toObject());
  } catch (dbErr) {
    console.warn("Database failed during review creation, saving to file:", dbErr);
    createdReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...reviewPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Sync to local fallback file
  try {
    const fileReviews = await readReviewsFromFile();
    fileReviews.unshift(createdReview);
    await writeReviewsToFile(fileReviews);
  } catch {}

  return createdReview;
}

/**
 * Fetch all reviews for admin moderation with filtering and summary metrics
 */
export async function getAllReviewsForAdmin(options?: {
  status?: string;
  search?: string;
}): Promise<{
  reviews: ReviewItem[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageScore: number;
  };
}> {
  let allReviews: ReviewItem[] = [];

  try {
    await connectToDatabase();
    const docs = await ReviewModel.find({}).sort({ createdAt: -1 }).lean();
    allReviews = docs.map(formatReviewDoc);
  } catch (dbErr) {
    console.warn("DB failed for admin reviews, reading file fallback:", dbErr);
    allReviews = await readReviewsFromFile();
  }

  // Calculate stats
  let totalApprovedScore = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  for (const r of allReviews) {
    if (r.status === "Approved") {
      approvedCount++;
      totalApprovedScore += r.rating;
    } else if (r.status === "Pending") {
      pendingCount++;
    } else if (r.status === "Rejected") {
      rejectedCount++;
    }
  }

  const averageScore =
    approvedCount > 0 ? Math.round((totalApprovedScore / approvedCount) * 10) / 10 : 5.0;

  // Filter reviews
  let filtered = allReviews;

  if (options?.status && options.status !== "All") {
    filtered = filtered.filter((r) => r.status === options.status);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.productCode.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );
  }

  return {
    reviews: filtered,
    stats: {
      total: allReviews.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      averageScore,
    },
  };
}

/**
 * Helper to build safe ID query for both ObjectId and string ID
 */
function buildReviewIdQuery(rawId: string) {
  const clean = rawId.trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(clean) && clean.length === 24;
  if (isObjectId) {
    return {
      $or: [{ _id: new mongoose.Types.ObjectId(clean) }, { id: clean }],
    };
  }
  return { id: clean };
}

/**
 * Update review status (Approve or Reject) and re-sync product global rating
 */
export async function updateReviewStatus(
  reviewId: string,
  newStatus: "Approved" | "Rejected" | "Pending"
): Promise<ReviewItem | null> {
  const cleanId = reviewId.trim();
  let updatedDoc: ReviewItem | null = null;
  let targetProductCode = "";

  try {
    await connectToDatabase();
    const query = buildReviewIdQuery(cleanId);
    const doc = await ReviewModel.findOneAndUpdate(
      query,
      { $set: { status: newStatus } },
      { returnDocument: "after" }
    );
    if (doc) {
      updatedDoc = formatReviewDoc(doc.toObject());
      targetProductCode = doc.productCode;
    }
  } catch (err) {
    console.warn("DB update failed for review status:", err);
  }

  // Update in file storage fallback
  try {
    const fileReviews = await readReviewsFromFile();
    const idx = fileReviews.findIndex(
      (r) => r.id === cleanId || (r as any)._id?.toString() === cleanId
    );
    if (idx !== -1) {
      fileReviews[idx].status = newStatus;
      fileReviews[idx].updatedAt = new Date().toISOString();
      targetProductCode = targetProductCode || fileReviews[idx].productCode;
      if (!updatedDoc) updatedDoc = fileReviews[idx];
      await writeReviewsToFile(fileReviews);
    }
  } catch {}

  // If review status was altered, recompute and update the product's global rating
  if (targetProductCode) {
    await syncProductGlobalRating(targetProductCode);
  }

  return updatedDoc;
}

/**
 * Delete review permanently and re-sync product global rating
 */
export async function deleteReview(reviewId: string): Promise<boolean> {
  const cleanId = reviewId.trim();
  let deleted = false;
  let targetProductCode = "";

  try {
    await connectToDatabase();
    const query = buildReviewIdQuery(cleanId);
    const doc = await ReviewModel.findOne(query);
    if (doc) {
      targetProductCode = doc.productCode;
      await ReviewModel.deleteOne({ _id: doc._id });
      deleted = true;
    }
  } catch (err) {
    console.warn("DB delete failed for review:", err);
  }

  try {
    const fileReviews = await readReviewsFromFile();
    const found = fileReviews.find(
      (r) => r.id === cleanId || (r as any)._id?.toString() === cleanId
    );
    if (found) {
      targetProductCode = targetProductCode || found.productCode;
      const filtered = fileReviews.filter(
        (r) => r.id !== cleanId && (r as any)._id?.toString() !== cleanId
      );
      await writeReviewsToFile(filtered);
      deleted = true;
    }
  } catch {}

  if (targetProductCode) {
    await syncProductGlobalRating(targetProductCode);
  }

  return deleted;
}

/**
 * Increment helpful votes for an approved review
 */
export async function voteHelpfulReview(reviewId: string): Promise<number> {
  const cleanId = reviewId.trim();
  let newVotes = 0;

  try {
    await connectToDatabase();
    const query = buildReviewIdQuery(cleanId);
    const doc = await ReviewModel.findOneAndUpdate(
      query,
      { $inc: { helpfulVotes: 1 } },
      { returnDocument: "after" }
    );
    if (doc) newVotes = doc.helpfulVotes;
  } catch {}

  try {
    const fileReviews = await readReviewsFromFile();
    const r = fileReviews.find(
      (x) => x.id === cleanId || (x as any)._id?.toString() === cleanId
    );
    if (r) {
      r.helpfulVotes = (r.helpfulVotes || 0) + 1;
      newVotes = r.helpfulVotes;
      await writeReviewsToFile(fileReviews);
    }
  } catch {}

  return newVotes;
}

/**
 * Check if a user (by email or userId) has already submitted a review for a product (Pending or Approved)
 */
export async function hasUserReviewedProduct(
  userEmail: string,
  userId: string | undefined,
  productCodeOrId: string
): Promise<{
  hasReviewed: boolean;
  reviewStatus?: "Pending" | "Approved" | "Rejected";
  existingReview?: ReviewItem;
}> {
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanId = (userId || "").trim();
  const cleanProduct = (productCodeOrId || "").trim().toUpperCase();

  if (!cleanEmail && !cleanId) {
    return { hasReviewed: false };
  }

  // 1. Check MongoDB
  try {
    await connectToDatabase();
    const userConditions: any[] = [];
    if (cleanEmail) userConditions.push({ userEmail: cleanEmail });
    if (cleanId) userConditions.push({ userId: cleanId });

    if (userConditions.length > 0) {
      const doc = await ReviewModel.findOne({
        $and: [
          {
            $or: [
              { productCode: cleanProduct },
              { productId: productCodeOrId },
              { productCode: productCodeOrId },
            ],
          },
          { $or: userConditions },
          { status: { $in: ["Pending", "Approved"] } },
        ],
      }).lean();

      if (doc) {
        const formatted = formatReviewDoc(doc);
        return {
          hasReviewed: true,
          reviewStatus: formatted.status,
          existingReview: formatted,
        };
      }
    }
  } catch (err) {
    console.warn("DB check for existing user review failed:", err);
  }

  // 2. Check File Storage Fallback
  try {
    const fileReviews = await readReviewsFromFile();
    const found = fileReviews.find((r) => {
      const matchesProduct =
        r.productCode.toUpperCase() === cleanProduct ||
        r.productId === productCodeOrId ||
        r.productCode.toLowerCase() === productCodeOrId.toLowerCase();
      const matchesUser =
        (cleanEmail && r.userEmail.toLowerCase() === cleanEmail) ||
        (cleanId && r.userId === cleanId);
      const isNotRejected = r.status === "Pending" || r.status === "Approved";
      return matchesProduct && matchesUser && isNotRejected;
    });

    if (found) {
      return {
        hasReviewed: true,
        reviewStatus: found.status,
        existingReview: found,
      };
    }
  } catch {}

  return { hasReviewed: false };
}
