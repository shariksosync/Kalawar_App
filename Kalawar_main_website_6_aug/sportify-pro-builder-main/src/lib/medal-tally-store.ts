import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { MedalTallyModel } from "@/models/MedalTally";
import type { IMedalTallyEntry } from "@/models/MedalTally";

export type CreateMedalTallyInput = {
  id?: string;
  state: string;
  gold?: number | string;
  silver?: number | string;
  bronze?: number | string;
};

// ── Fallback JSON file storage ───────────────────────────────────────────────

let cachedTally: IMedalTallyEntry[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(
    process.cwd(),
    "src",
    "data",
    "storage",
    "medal-tally.json"
  );
  const nestedPath = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    "medal-tally.json"
  );

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
        await fs.writeFile(primaryPath, JSON.stringify([], null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileTally(): Promise<IMedalTallyEntry[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedTally;
    const parsed = JSON.parse(raw) as IMedalTallyEntry[];
    if (Array.isArray(parsed)) {
      cachedTally = parsed;
      return parsed;
    }
    return cachedTally;
  } catch {
    return cachedTally;
  }
}

async function saveFileTally(items: IMedalTallyEntry[]): Promise<void> {
  cachedTally = items;
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
    console.warn("Notice: Could not save to medal-tally.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function generateNextTallyId(): Promise<string> {
  const regex = /^MT-(\d+)/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await MedalTallyModel.find(
      { id: { $regex: /^MT-/i } },
      "id"
    ).lean();
    for (const doc of docs) {
      const match = (doc.id as string).match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileTally();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = String(highestNum + 1).padStart(2, "0");
  return `MT-${nextNum}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getMedalTally(): Promise<IMedalTallyEntry[]> {
  try {
    await connectToDatabase();
    const docs = await MedalTallyModel.find({})
      .sort({ gold: -1, silver: -1, bronze: -1 })
      .lean();
    return docs.map((d) => d as unknown as IMedalTallyEntry);
  } catch {
    // MongoDB unavailable — fall back to JSON file
    const fileTally = await getFileTally();
    return fileTally.sort((a, b) => b.gold - a.gold || b.silver - a.silver);
  }
}

export async function getMedalTallyById(
  id: string
): Promise<IMedalTallyEntry | null> {
  try {
    await connectToDatabase();
    const doc = await MedalTallyModel.findOne({ id }).lean();
    return doc ? (doc as unknown as IMedalTallyEntry) : null;
  } catch {
    const items = await getFileTally();
    return items.find((r) => r.id === id) || null;
  }
}

export async function createMedalTallyEntry(
  input: CreateMedalTallyInput
): Promise<IMedalTallyEntry> {
  const newId = input.id || (await generateNextTallyId());

  const data: IMedalTallyEntry = {
    id: newId,
    state: input.state.trim(),
    gold: Number(input.gold) || 0,
    silver: Number(input.silver) || 0,
    bronze: Number(input.bronze) || 0,
  };

  try {
    await connectToDatabase();
    const doc = await MedalTallyModel.create(data);
    return doc.toJSON() as IMedalTallyEntry;
  } catch {
    const items = await getFileTally();
    if (items.find((r) => r.id === newId)) {
      throw new Error(`Medal tally entry with id ${newId} already exists`);
    }
    items.push(data);
    await saveFileTally(items);
    return data;
  }
}

export async function updateMedalTallyEntry(
  id: string,
  input: Partial<CreateMedalTallyInput>
): Promise<IMedalTallyEntry | null> {
  const updates: Partial<IMedalTallyEntry> = {};

  if (input.state !== undefined) updates.state = input.state.trim();
  if (input.gold !== undefined) updates.gold = Number(input.gold) || 0;
  if (input.silver !== undefined) updates.silver = Number(input.silver) || 0;
  if (input.bronze !== undefined) updates.bronze = Number(input.bronze) || 0;

  try {
    await connectToDatabase();
    const doc = await MedalTallyModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).lean();
    return doc ? (doc as unknown as IMedalTallyEntry) : null;
  } catch {
    const items = await getFileTally();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    await saveFileTally(items);
    return items[idx];
  }
}

export async function deleteMedalTallyEntry(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await MedalTallyModel.findOneAndDelete({ id });
    return !!res;
  } catch {
    const items = await getFileTally();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await saveFileTally(items);
    return true;
  }
}
