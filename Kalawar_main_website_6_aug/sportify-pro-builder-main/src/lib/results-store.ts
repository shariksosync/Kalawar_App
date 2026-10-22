import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { ResultModel } from "@/models/Result";
import type { ITournamentResult } from "@/models/Result";

export type CreateResultInput = {
  id?: string;
  tournament: string;
  discipline: string;
  season: string;
  winner: string;
  runnerUp?: string;
  thirdPlace?: string;
  medals?: { gold?: number; silver?: number; bronze?: number };
  mvp?: string;
  image?: string;
  status?: "Verified" | "Pending" | string;
};

// ── Fallback JSON file storage ───────────────────────────────────────────────

let cachedResults: ITournamentResult[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(
    process.cwd(),
    "src",
    "data",
    "storage",
    "results.json"
  );
  const nestedPath = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    "results.json"
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

async function getFileResults(): Promise<ITournamentResult[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedResults;
    const parsed = JSON.parse(raw) as ITournamentResult[];
    if (Array.isArray(parsed)) {
      cachedResults = parsed;
      return parsed;
    }
    return cachedResults;
  } catch {
    return cachedResults;
  }
}

async function saveFileResults(items: ITournamentResult[]): Promise<void> {
  cachedResults = items;
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
    console.warn("Notice: Could not save to results.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function generateNextResultId(): Promise<string> {
  const regex = /^RES-(\d+)/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await ResultModel.find({ id: { $regex: /^RES-/i } }, "id").lean();
    for (const doc of docs) {
      const match = (doc.id as string).match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileResults();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = String(highestNum + 1).padStart(2, "0");
  return `RES-${nextNum}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getResults(opts?: {
  status?: string;
  includeAll?: boolean;
}): Promise<ITournamentResult[]> {
  const { status, includeAll = false } = opts || {};

  try {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (!includeAll) query.status = "Verified";
    if (status && status !== "All") query.status = status;

    const docs = await ResultModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map((d) => d as unknown as ITournamentResult);
  } catch {
    // MongoDB unavailable — fall back to JSON file
    const fileResults = await getFileResults();

    if (!includeAll) {
      return fileResults.filter(
        (r) => !status || status === "All" || r.status === status || r.status === "Verified"
      );
    }
    return fileResults;
  }
}

export async function getResultById(
  id: string
): Promise<ITournamentResult | null> {
  try {
    await connectToDatabase();
    const doc = await ResultModel.findOne({ id }).lean();
    return doc ? (doc as unknown as ITournamentResult) : null;
  } catch {
    const items = await getFileResults();
    return items.find((r) => r.id === id) || null;
  }
}

export async function createResult(
  input: CreateResultInput
): Promise<ITournamentResult> {
  const newId = input.id || (await generateNextResultId());

  const data: ITournamentResult = {
    id: newId,
    tournament: input.tournament.trim(),
    discipline: input.discipline.trim(),
    season: input.season?.trim() || new Date().getFullYear().toString(),
    winner: input.winner.trim(),
    runnerUp: input.runnerUp?.trim() || "",
    thirdPlace: input.thirdPlace?.trim() || "",
    medals: {
      gold: Number(input.medals?.gold) || 0,
      silver: Number(input.medals?.silver) || 0,
      bronze: Number(input.medals?.bronze) || 0,
    },
    mvp: input.mvp?.trim() || "",
    image:
      input.image?.trim() ||
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    status: (input.status as "Verified" | "Pending") || "Verified",
  };

  try {
    await connectToDatabase();
    const doc = await ResultModel.create(data);
    return doc.toJSON() as ITournamentResult;
  } catch {
    const items = await getFileResults();
    if (items.find((r) => r.id === newId)) {
      throw new Error(`Result with id ${newId} already exists`);
    }
    items.unshift(data);
    await saveFileResults(items);
    return data;
  }
}

export async function updateResult(
  id: string,
  input: Partial<CreateResultInput>
): Promise<ITournamentResult | null> {
  const updates: Partial<ITournamentResult> = {};

  if (input.tournament !== undefined)
    updates.tournament = input.tournament.trim();
  if (input.discipline !== undefined)
    updates.discipline = input.discipline.trim();
  if (input.season !== undefined) updates.season = input.season.trim();
  if (input.winner !== undefined) updates.winner = input.winner.trim();
  if (input.runnerUp !== undefined) updates.runnerUp = input.runnerUp.trim();
  if (input.thirdPlace !== undefined)
    updates.thirdPlace = input.thirdPlace.trim();
  if (input.mvp !== undefined) updates.mvp = input.mvp.trim();
  if (input.image !== undefined) updates.image = input.image.trim();
  if (input.status !== undefined)
    updates.status = input.status as "Verified" | "Pending";
  if (input.medals !== undefined) {
    updates.medals = {
      gold: Number(input.medals.gold) || 0,
      silver: Number(input.medals.silver) || 0,
      bronze: Number(input.medals.bronze) || 0,
    };
  }

  try {
    await connectToDatabase();
    const doc = await ResultModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).lean();
    return doc ? (doc as unknown as ITournamentResult) : null;
  } catch {
    const items = await getFileResults();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    await saveFileResults(items);
    return items[idx];
  }
}

export async function deleteResult(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await ResultModel.findOneAndDelete({ id });
    return !!res;
  } catch {
    const items = await getFileResults();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await saveFileResults(items);
    return true;
  }
}
