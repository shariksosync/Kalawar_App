import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { CommonReviewModel, ICommonReview } from "@/models/CommonReview";

export interface CommonReviewItem {
  id: string;
  name: string;
  rating: number;
  comment: string;
  photo?: string;
  status: "Pending" | "Approved" | "Rejected";
  helpfulVotes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommonRatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
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
      } catch {}
      return primary;
    }
  }
}

async function readCommonReviewsFromFile(): Promise<CommonReviewItem[]> {
  try {
    const file = await getStorageFilePath("common-reviews.json");
    const content = await fs.readFile(file, "utf-8");
    return content.trim() ? JSON.parse(content) : [];
  } catch {
    return [];
  }
}

async function writeCommonReviewsToFile(reviews: CommonReviewItem[]): Promise<void> {
  try {
    const file = await getStorageFilePath("common-reviews.json");
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(reviews, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(reviews, null, 2), "utf-8");
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
  } catch (err) {
    console.warn("Notice: Could not save common reviews to file fallback:", err instanceof Error ? err.message : "");
  }
}

function formatCommonReviewDoc(doc: any): CommonReviewItem {
  return {
    id: doc._id ? doc._id.toString() : doc.id || `crev-${Date.now()}`,
    name: doc.name || "Federation Member",
    rating: Number(doc.rating) || 5,
    comment: doc.comment || "",
    photo: doc.photo || "",
    status: (doc.status as "Pending" | "Approved" | "Rejected") || "Pending",
    helpfulVotes: Number(doc.helpfulVotes) || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function computeCommonRatingSummary(approvedReviews: CommonReviewItem[]): CommonRatingSummary {
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
      5: { count: counts[5] || 0, percentage: Math.round(((counts[5] || 0) / totalReviews) * 100) },
      4: { count: counts[4] || 0, percentage: Math.round(((counts[4] || 0) / totalReviews) * 100) },
      3: { count: counts[3] || 0, percentage: Math.round(((counts[3] || 0) / totalReviews) * 100) },
      2: { count: counts[2] || 0, percentage: Math.round(((counts[2] || 0) / totalReviews) * 100) },
      1: { count: counts[1] || 0, percentage: Math.round(((counts[1] || 0) / totalReviews) * 100) },
    },
  };
}

/**
 * Fetch approved reviews for frontend display
 */
export async function getApprovedCommonReviews(): Promise<{
  reviews: CommonReviewItem[];
  summary: CommonRatingSummary;
}> {
  let reviews: CommonReviewItem[] = [];

  try {
    await connectToDatabase();
    const docs = await CommonReviewModel.find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .lean();
    reviews = docs.map(formatCommonReviewDoc);
  } catch (dbErr) {
    console.warn("Falling back to local common reviews storage:", dbErr);
    const fileReviews = await readCommonReviewsFromFile();
    reviews = fileReviews.filter((r) => r.status === "Approved");
  }

  const summary = computeCommonRatingSummary(reviews);
  return { reviews, summary };
}

/**
 * Create a new user review in "Pending" status awaiting Admin approval
 */
export async function createCommonReview(data: {
  name: string;
  rating: number;
  comment: string;
  photo?: string;
}): Promise<CommonReviewItem> {
  const payload = {
    name: data.name.trim(),
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    comment: data.comment.trim(),
    photo: data.photo || "",
    status: "Pending" as const,
    helpfulVotes: 0,
  };

  let createdReview: CommonReviewItem;

  try {
    await connectToDatabase();
    const doc = await CommonReviewModel.create(payload);
    createdReview = formatCommonReviewDoc(doc.toObject());
  } catch (dbErr) {
    console.warn("Database failed during common review creation, saving to file:", dbErr);
    createdReview = {
      id: `crev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Sync to local fallback file
  try {
    const fileReviews = await readCommonReviewsFromFile();
    fileReviews.unshift(createdReview);
    await writeCommonReviewsToFile(fileReviews);
  } catch {}

  return createdReview;
}

/**
 * Helper to build safe ID query
 */
function buildIdQuery(rawId: string) {
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
 * Fetch all common reviews for Admin moderation
 */
export async function getAllCommonReviewsForAdmin(options?: {
  status?: string;
  search?: string;
}): Promise<{
  reviews: CommonReviewItem[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageScore: number;
  };
}> {
  let allReviews: CommonReviewItem[] = [];

  try {
    await connectToDatabase();
    const docs = await CommonReviewModel.find({}).sort({ createdAt: -1 }).lean();
    allReviews = docs.map(formatCommonReviewDoc);
  } catch (dbErr) {
    console.warn("DB failed for admin common reviews, reading file fallback:", dbErr);
    allReviews = await readCommonReviewsFromFile();
  }

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

  let filtered = allReviews;

  if (options?.status && options.status !== "All") {
    filtered = filtered.filter((r) => r.status === options.status);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
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
 * Update review status (Approve, Reject, Pending)
 */
export async function updateCommonReviewStatus(
  reviewId: string,
  newStatus: "Approved" | "Rejected" | "Pending"
): Promise<CommonReviewItem | null> {
  const cleanId = reviewId.trim();
  let updatedDoc: CommonReviewItem | null = null;

  try {
    await connectToDatabase();
    const query = buildIdQuery(cleanId);
    const doc = await CommonReviewModel.findOneAndUpdate(
      query,
      { $set: { status: newStatus } },
      { returnDocument: "after" }
    );
    if (doc) {
      updatedDoc = formatCommonReviewDoc(doc.toObject());
    }
  } catch (err) {
    console.warn("DB update failed for common review status:", err);
  }

  try {
    const fileReviews = await readCommonReviewsFromFile();
    const idx = fileReviews.findIndex(
      (r) => r.id === cleanId || (r as any)._id?.toString() === cleanId
    );
    if (idx !== -1) {
      fileReviews[idx].status = newStatus;
      fileReviews[idx].updatedAt = new Date().toISOString();
      if (!updatedDoc) updatedDoc = fileReviews[idx];
      await writeCommonReviewsToFile(fileReviews);
    }
  } catch {}

  return updatedDoc;
}

/**
 * Permanently delete a common review
 */
export async function deleteCommonReview(reviewId: string): Promise<boolean> {
  const cleanId = reviewId.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const query = buildIdQuery(cleanId);
    const doc = await CommonReviewModel.findOne(query);
    if (doc) {
      await CommonReviewModel.deleteOne({ _id: doc._id });
      deleted = true;
    }
  } catch (err) {
    console.warn("DB delete failed for common review:", err);
  }

  try {
    const fileReviews = await readCommonReviewsFromFile();
    const found = fileReviews.find(
      (r) => r.id === cleanId || (r as any)._id?.toString() === cleanId
    );
    if (found) {
      const filtered = fileReviews.filter(
        (r) => r.id !== cleanId && (r as any)._id?.toString() !== cleanId
      );
      await writeCommonReviewsToFile(filtered);
      deleted = true;
    }
  } catch {}

  return deleted;
}
