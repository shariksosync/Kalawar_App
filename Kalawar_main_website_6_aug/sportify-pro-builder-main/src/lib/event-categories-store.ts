import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import mongoose, { Schema, Model, Document } from "mongoose";
import { EventModel } from "@/models/Event";
import { ChampionshipArchiveModel } from "@/models/ChampionshipArchive";

export type EventCategory = {
  id: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface IEventCategoryDoc extends Document {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventCategorySchema = new Schema<IEventCategoryDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const EventCategoryModel: Model<IEventCategoryDoc> =
  mongoose.models.EventCategory ||
  mongoose.model<IEventCategoryDoc>("EventCategory", EventCategorySchema);

export const DEFAULT_EVENT_CATEGORIES: EventCategory[] = [
  { id: "EVT-CAT-01", name: "National Championship", order: 1 },
  { id: "EVT-CAT-02", name: "State Championship & Qualifiers", order: 2 },
  { id: "EVT-CAT-03", name: "District & Club Tournament", order: 3 },
  { id: "EVT-CAT-04", name: "Selection Trials", order: 4 },
  { id: "EVT-CAT-05", name: "Belt & Dan Examination", order: 5 },
  { id: "EVT-CAT-06", name: "National Training Camp & Seminar", order: 6 },
  { id: "EVT-CAT-07", name: "Referee & Officials Clinic", order: 7 },
];

let cachedCategories: EventCategory[] = [...DEFAULT_EVENT_CATEGORIES];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "event-categories.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "event-categories.json");

  try {
    await fs.access(primaryPath);
    return primaryPath;
  } catch {
    try {
      await fs.access(nestedPath);
      return nestedPath;
    } catch {
      try {
        await fs.mkdir(path.dirname(primaryPath), { recursive: true });
        await fs.writeFile(primaryPath, JSON.stringify(DEFAULT_EVENT_CATEGORIES, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileCategories(): Promise<EventCategory[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedCategories;
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      cachedCategories = list;
      return list;
    }
    return cachedCategories;
  } catch {
    return cachedCategories;
  }
}

async function saveFileCategories(items: EventCategory[]): Promise<void> {
  cachedCategories = items;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(items, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(items, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not save to event-categories.json fallback:", error instanceof Error ? error.message : "");
  }
}

export async function getEventCategories(): Promise<EventCategory[]> {
  try {
    await connectToDatabase();
    const docs = await EventCategoryModel.find({}).sort({ order: 1, createdAt: 1 }).lean();

    if (docs && docs.length > 0) {
      const dbList: EventCategory[] = docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        order: d.order,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      }));
      cachedCategories = dbList;
      return dbList;
    }

    // Seed default categories into MongoDB if empty
    try {
      await EventCategoryModel.insertMany(DEFAULT_EVENT_CATEGORIES, { ordered: false });
    } catch {
      // Ignore if duplicates exist
    }
    return DEFAULT_EVENT_CATEGORIES;
  } catch (error) {
    console.warn("MongoDB event categories note: Falling back to local store.", error instanceof Error ? error.message : "");
    return getFileCategories();
  }
}

export async function createEventCategory(name: string, order?: number): Promise<EventCategory> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Event category name is required");
  }

  const existing = await getEventCategories();
  const duplicate = existing.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    return duplicate;
  }

  const newId = `EVT-CAT-${String(existing.length + 1).padStart(2, "0")}`;
  const newOrder = typeof order === "number" ? order : existing.length + 1;

  const newCat: EventCategory = {
    id: newId,
    name: cleanName,
    order: newOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await connectToDatabase();
    await EventCategoryModel.create({
      id: newId,
      name: cleanName,
      order: newOrder,
    });
  } catch (error) {
    console.warn("MongoDB createEventCategory error, using file fallback:", error);
  }

  const updated = [...existing, newCat];
  await saveFileCategories(updated);
  return newCat;
}

export async function updateEventCategory(
  oldName: string,
  newName: string,
  order?: number
): Promise<EventCategory | null> {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();

  if (!cleanOld || !cleanNew) {
    throw new Error("Both old and new category names are required");
  }

  try {
    await connectToDatabase();
    const doc = await EventCategoryModel.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
      { $set: { name: cleanNew, ...(typeof order === "number" && { order }) } },
      { new: true }
    ).lean();

    // Cascade update to all events & championship archives in MongoDB
    try {
      await EventModel.updateMany(
        { category: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
        { $set: { category: cleanNew } }
      );
      await ChampionshipArchiveModel.updateMany(
        { category: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
        { $set: { category: cleanNew } }
      );
    } catch (err) {
      console.warn("Cascade category update failed:", err);
    }

    if (doc) {
      const updatedList = await getEventCategories();
      await saveFileCategories(updatedList);
      return {
        id: (doc as any).id,
        name: (doc as any).name,
        order: (doc as any).order,
      };
    }
  } catch (error) {
    console.warn("MongoDB updateEventCategory error:", error);
  }

  const all = await getFileCategories();
  const idx = all.findIndex((c) => c.name.toLowerCase() === cleanOld.toLowerCase());
  if (idx !== -1) {
    all[idx].name = cleanNew;
    if (typeof order === "number") all[idx].order = order;
    await saveFileCategories(all);
    return all[idx];
  }

  return null;
}

export async function deleteEventCategory(name: string): Promise<boolean> {
  const cleanName = name.trim();
  try {
    await connectToDatabase();
    await EventCategoryModel.deleteOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });
  } catch (error) {
    console.warn("MongoDB deleteEventCategory error:", error);
  }

  const all = await getFileCategories();
  const filtered = all.filter((c) => c.name.toLowerCase() !== cleanName.toLowerCase());
  await saveFileCategories(filtered);
  return true;
}
