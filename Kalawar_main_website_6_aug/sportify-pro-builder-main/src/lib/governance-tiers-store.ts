import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import mongoose, { Schema, Model, Document } from "mongoose";
import { OfficialModel } from "@/models/Official";

export type GovernanceTier = {
  id: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface IGovernanceTierDoc extends Document {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GovernanceTierSchema = new Schema<IGovernanceTierDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const GovernanceTierModel: Model<IGovernanceTierDoc> =
  mongoose.models.GovernanceTier ||
  mongoose.model<IGovernanceTierDoc>("GovernanceTier", GovernanceTierSchema);

const DEFAULT_TIERS: GovernanceTier[] = [
  { id: "TIER-001", name: "Founder & President", order: 1 },
  { id: "TIER-002", name: "Director / Working President", order: 2 },
  { id: "TIER-003", name: "National Officials", order: 3 },
  { id: "TIER-004", name: "Technical Committee", order: 4 },
  { id: "TIER-005", name: "State Officials", order: 5 },
  { id: "TIER-006", name: "District Officials", order: 6 },
];

let cachedTiers: GovernanceTier[] = [...DEFAULT_TIERS];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "governance-tiers.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "governance-tiers.json");

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
        await fs.writeFile(primaryPath, JSON.stringify(DEFAULT_TIERS, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileTiers(): Promise<GovernanceTier[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedTiers;
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      cachedTiers = list;
      return list;
    }
    return cachedTiers;
  } catch {
    return cachedTiers;
  }
}

async function saveFileTiers(items: GovernanceTier[]): Promise<void> {
  cachedTiers = items;
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
    console.warn("Notice: Could not save to governance-tiers.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

export async function getGovernanceTiers(): Promise<GovernanceTier[]> {
  try {
    await connectToDatabase();
    const docs = await GovernanceTierModel.find({}).sort({ order: 1, createdAt: 1 }).lean();
    if (docs && docs.length > 0) {
      return docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        order: d.order ?? 0,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      }));
    }

    // Seed into MongoDB from file
    const fileList = await getFileTiers();
    if (fileList.length > 0) {
      try {
        await GovernanceTierModel.insertMany(fileList);
      } catch {}
    }
    return fileList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    const fileList = await getFileTiers();
    return fileList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}

export async function generateNextTierId(): Promise<string> {
  const tiers = await getGovernanceTiers();
  let maxNum = 0;
  for (const t of tiers) {
    const m = t.id.match(/^TIER-(\d+)$/i);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `TIER-${String(maxNum + 1).padStart(3, "0")}`;
}

/**
 * Ensures a governance tier exists in the storage.
 * Called automatically when an official is saved with a custom level.
 */
export async function ensureGovernanceTier(name: string): Promise<GovernanceTier> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Tier name cannot be empty");
  }

  const existingTiers = await getGovernanceTiers();
  const found = existingTiers.find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (found) {
    return found;
  }

  return await createGovernanceTier(trimmed);
}

export async function createGovernanceTier(
  name: string,
  order?: number
): Promise<GovernanceTier> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Tier name cannot be empty");
  }

  const existingTiers = await getGovernanceTiers();
  const duplicate = existingTiers.find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return duplicate;
  }

  const nextId = await generateNextTierId();
  const nextOrder = order !== undefined ? order : existingTiers.length + 1;
  const now = new Date().toISOString();

  const newTier: GovernanceTier = {
    id: nextId,
    name: trimmed,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  };

  // 1. File storage
  try {
    const fileList = await getFileTiers();
    fileList.push(newTier);
    await saveFileTiers(fileList);
  } catch (err) {
    console.error("Failed to save tier to file:", err);
  }

  // 2. MongoDB
  try {
    await connectToDatabase();
    await GovernanceTierModel.findOneAndUpdate(
      { id: nextId },
      { $set: newTier },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB tier save notice:", err);
  }

  return newTier;
}

export async function updateGovernanceTier(
  oldName: string,
  newName: string,
  newOrder?: number
): Promise<GovernanceTier | null> {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();

  if (!trimmedNew) {
    throw new Error("New tier name cannot be empty");
  }

  let updated: GovernanceTier | null = null;
  const now = new Date().toISOString();

  // 1. Update in file tiers
  try {
    const fileList = await getFileTiers();
    const idx = fileList.findIndex(
      (t) => t.name.toLowerCase() === trimmedOld.toLowerCase()
    );
    if (idx >= 0) {
      fileList[idx] = {
        ...fileList[idx],
        name: trimmedNew,
        order: newOrder !== undefined ? newOrder : fileList[idx].order,
        updatedAt: now,
      };
      updated = fileList[idx];
      await saveFileTiers(fileList);
    }
  } catch (err) {
    console.error("File update error for tier:", err);
  }

  // 2. Update in MongoDB
  try {
    await connectToDatabase();
    const doc = await GovernanceTierModel.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${trimmedOld.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
      {
        $set: {
          name: trimmedNew,
          ...(newOrder !== undefined ? { order: newOrder } : {}),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const d: any = doc;
      updated = {
        id: d.id,
        name: d.name,
        order: d.order,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.warn("Mongo tier update notice:", err);
  }

  // 3. Cascade update across all existing officials that used oldName!
  if (trimmedOld.toLowerCase() !== trimmedNew.toLowerCase()) {
    try {
      // Cascade file officials
      const officialsFilePath = path.join(process.cwd(), "src", "data", "storage", "officials.json");
      try {
        const raw = await fs.readFile(officialsFilePath, "utf-8");
        if (raw.trim()) {
          const officials = JSON.parse(raw);
          let changed = false;
          for (const off of officials) {
            if (off.category && off.category.trim().toLowerCase() === trimmedOld.toLowerCase()) {
              off.category = trimmedNew;
              off.updatedAt = now;
              changed = true;
            }
          }
          if (changed) {
            await fs.writeFile(officialsFilePath, JSON.stringify(officials, null, 2), "utf-8");
          }
        }
      } catch {}

      // Cascade MongoDB officials
      await connectToDatabase();
      await OfficialModel.updateMany(
        { category: { $regex: new RegExp(`^${trimmedOld.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { $set: { category: trimmedNew, updatedAt: new Date() } }
      );
    } catch (err) {
      console.warn("Cascade update notice for officials category:", err);
    }
  }

  return updated;
}

export async function deleteGovernanceTier(name: string): Promise<boolean> {
  const trimmed = name.trim();
  let deleted = false;

  // 1. File storage
  try {
    const fileList = await getFileTiers();
    const nextList = fileList.filter(
      (t) => t.name.toLowerCase() !== trimmed.toLowerCase()
    );
    if (nextList.length !== fileList.length) {
      await saveFileTiers(nextList);
      deleted = true;
    }
  } catch (err) {
    console.error("File delete error for tier:", err);
  }

  // 2. MongoDB
  try {
    await connectToDatabase();
    const res = await GovernanceTierModel.deleteOne({
      name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (res.deletedCount && res.deletedCount > 0) {
      deleted = true;
    }
  } catch (err) {
    console.warn("Mongo tier delete notice:", err);
  }

  return deleted;
}
