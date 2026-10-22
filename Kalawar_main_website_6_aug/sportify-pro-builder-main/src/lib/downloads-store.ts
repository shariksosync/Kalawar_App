import { connectToDatabase } from "./mongodb";
import { DownloadModel } from "@/models/Download";
import { OFFICIAL_DOWNLOADS, DownloadItem } from "@/data/downloads-data";

export interface GetDownloadsOptions {
  category?: string;
  year?: string;
  event?: string;
  query?: string;
  status?: string;
  includeAll?: boolean;
}

let inMemoryDownloads: DownloadItem[] = [...OFFICIAL_DOWNLOADS];

async function seedIfEmpty() {
  try {
    const conn = await connectToDatabase();
    if (!conn) return;

    const count = await DownloadModel.countDocuments();
    if (count === 0) {
      await DownloadModel.insertMany(OFFICIAL_DOWNLOADS);
    }
  } catch (err) {
    console.error("Failed to seed downloads collection:", err);
  }
}

export async function getDownloads(options: GetDownloadsOptions = {}): Promise<DownloadItem[]> {
  const { category, year, event, query, status, includeAll } = options;

  try {
    const conn = await connectToDatabase();
    if (conn) {
      await seedIfEmpty();

      const filter: Record<string, any> = {};
      if (category && category !== "All") {
        filter.category = category;
      }
      if (year && year !== "All Years") {
        filter.year = year;
      }
      if (event && event !== "All Events") {
        filter.event = event;
      }
      if (!includeAll) {
        if (status) {
          filter.status = status;
        } else {
          filter.status = "Published";
        }
      }

      if (query && query.trim()) {
        const regex = new RegExp(query.trim(), "i");
        filter.$or = [
          { title: regex },
          { description: regex },
          { docCode: regex },
          { category: regex },
        ];
      }

      const docs = await DownloadModel.find(filter).sort({ order: 1, updatedAt: -1 }).lean();
      return docs as unknown as DownloadItem[];
    }
  } catch (err) {
    console.warn("MongoDB getDownloads fallback to in-memory store:", err);
  }

  // Fallback in-memory filtering
  let result = [...inMemoryDownloads];

  if (category && category !== "All") {
    result = result.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }
  if (year && year !== "All Years") {
    result = result.filter((d) => d.year === year);
  }
  if (event && event !== "All Events") {
    result = result.filter((d) => d.event.toLowerCase() === event.toLowerCase());
  }
  if (!includeAll) {
    if (status) {
      result = result.filter((d) => d.status.toLowerCase() === status.toLowerCase());
    } else {
      result = result.filter((d) => d.status === "Published");
    }
  }
  if (query && query.trim()) {
    const qLower = query.trim().toLowerCase();
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(qLower) ||
        d.description.toLowerCase().includes(qLower) ||
        d.docCode.toLowerCase().includes(qLower)
    );
  }

  return result.sort((a, b) => a.order - b.order);
}

export async function getDownloadById(id: string): Promise<DownloadItem | null> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await DownloadModel.findOne({ id }).lean();
      if (doc) return doc as unknown as DownloadItem;
    }
  } catch (err) {
    console.warn("MongoDB getDownloadById fallback:", err);
  }

  return inMemoryDownloads.find((d) => d.id === id) || null;
}

export async function createDownload(data: Partial<DownloadItem>): Promise<DownloadItem> {
  const newItem: DownloadItem = {
    id: data.id || `DL-${Date.now().toString(36).toUpperCase()}`,
    title: data.title || "Untitled Document",
    category: data.category || "Rule Book & Regulations",
    description: data.description || "",
    version: data.version || "v2026.1",
    publishedDate: data.publishedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    updatedDate: data.updatedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    year: data.year || "2026",
    event: data.event || "Federation Direct / General",
    type: data.type || "PDF",
    size: data.size || "1.0 MB",
    docCode: data.docCode || `K-DOC-${Date.now().toString(36).toUpperCase()}`,
    status: data.status || "Published",
    order: data.order ?? (inMemoryDownloads.length + 1),
    officialStamp: Boolean(data.officialStamp),
    featured: Boolean(data.featured),
  };

  try {
    const conn = await connectToDatabase();
    if (conn) {
      await DownloadModel.create(newItem);
    }
  } catch (err) {
    console.warn("MongoDB createDownload fallback:", err);
  }

  inMemoryDownloads.push(newItem);
  return newItem;
}

export async function updateDownload(id: string, updates: Partial<DownloadItem>): Promise<DownloadItem | null> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const updatedDoc = await DownloadModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: "after" }
      ).lean();
      if (updatedDoc) return updatedDoc as unknown as DownloadItem;
    }
  } catch (err) {
    console.warn("MongoDB updateDownload fallback:", err);
  }

  const index = inMemoryDownloads.findIndex((d) => d.id === id);
  if (index !== -1) {
    inMemoryDownloads[index] = { ...inMemoryDownloads[index], ...updates };
    return inMemoryDownloads[index];
  }
  return null;
}

export async function deleteDownload(id: string): Promise<boolean> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const res = await DownloadModel.deleteOne({ id });
      if (res.deletedCount > 0) {
        inMemoryDownloads = inMemoryDownloads.filter((d) => d.id !== id);
        return true;
      }
    }
  } catch (err) {
    console.warn("MongoDB deleteDownload fallback:", err);
  }

  const initialLen = inMemoryDownloads.length;
  inMemoryDownloads = inMemoryDownloads.filter((d) => d.id !== id);
  return inMemoryDownloads.length < initialLen;
}
