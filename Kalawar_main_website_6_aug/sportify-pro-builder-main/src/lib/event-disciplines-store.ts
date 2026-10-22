import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import mongoose, { Schema, Model, Document } from "mongoose";
import { EventModel } from "@/models/Event";
import { ChampionshipArchiveModel } from "@/models/ChampionshipArchive";

export type EventDiscipline = {
  id: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface IEventDisciplineDoc extends Document {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventDisciplineSchema = new Schema<IEventDisciplineDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const EventDisciplineModel: Model<IEventDisciplineDoc> =
  mongoose.models.EventDiscipline ||
  mongoose.model<IEventDisciplineDoc>("EventDiscipline", EventDisciplineSchema);

export const DEFAULT_EVENT_DISCIPLINES: EventDiscipline[] = [
  { id: "EVT-DISC-01", name: "Kalawar Kaya Yuddha", order: 1 },
  { id: "EVT-DISC-02", name: "Kalawar Charana Yuddha", order: 2 },
  { id: "EVT-DISC-03", name: "Kalawar Santulana", order: 3 },
  { id: "EVT-DISC-04", name: "Kalawar Sparsha Yuddha", order: 4 },
  { id: "EVT-DISC-05", name: "Kalawar Sangama Kala", order: 5 },
  { id: "EVT-DISC-06", name: "Kalawar Danda Yuddha", order: 6 },
  { id: "EVT-DISC-07", name: "Kalawar Malla Yuddha", order: 7 },
];

let cachedDisciplines: EventDiscipline[] = [...DEFAULT_EVENT_DISCIPLINES];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "event-disciplines.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "event-disciplines.json");

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
        await fs.writeFile(primaryPath, JSON.stringify(DEFAULT_EVENT_DISCIPLINES, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileDisciplines(): Promise<EventDiscipline[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedDisciplines;
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      cachedDisciplines = list;
      return list;
    }
    return cachedDisciplines;
  } catch {
    return cachedDisciplines;
  }
}

async function saveFileDisciplines(items: EventDiscipline[]): Promise<void> {
  cachedDisciplines = items;
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
    console.warn("Notice: Could not save to event-disciplines.json fallback:", error instanceof Error ? error.message : "");
  }
}

export async function getEventDisciplines(): Promise<EventDiscipline[]> {
  try {
    await connectToDatabase();
    const docs = await EventDisciplineModel.find({}).sort({ order: 1, createdAt: 1 }).lean();

    if (docs && docs.length > 0) {
      const dbList: EventDiscipline[] = docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        order: d.order,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      }));
      cachedDisciplines = dbList;
      return dbList;
    }

    // Seed default disciplines into MongoDB if empty
    try {
      await EventDisciplineModel.insertMany(DEFAULT_EVENT_DISCIPLINES, { ordered: false });
    } catch {
      // Ignore if duplicates exist
    }
    return DEFAULT_EVENT_DISCIPLINES;
  } catch (error) {
    console.warn("MongoDB event disciplines note: Falling back to local store.", error instanceof Error ? error.message : "");
    return getFileDisciplines();
  }
}

export async function createEventDiscipline(name: string, order?: number): Promise<EventDiscipline> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Discipline name is required");
  }

  const existing = await getEventDisciplines();
  const duplicate = existing.find((d) => d.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    return duplicate;
  }

  const newId = `EVT-DISC-${String(existing.length + 1).padStart(2, "0")}`;
  const newOrder = typeof order === "number" ? order : existing.length + 1;

  const newDisc: EventDiscipline = {
    id: newId,
    name: cleanName,
    order: newOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await connectToDatabase();
    await EventDisciplineModel.create({
      id: newId,
      name: cleanName,
      order: newOrder,
    });
  } catch (error) {
    console.warn("MongoDB createEventDiscipline error, using file fallback:", error);
  }

  const updated = [...existing, newDisc];
  await saveFileDisciplines(updated);
  return newDisc;
}

export async function updateEventDiscipline(
  oldName: string,
  newName: string,
  order?: number
): Promise<EventDiscipline | null> {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();

  if (!cleanOld || !cleanNew) {
    throw new Error("Both old and new discipline names are required");
  }

  try {
    await connectToDatabase();
    const doc = await EventDisciplineModel.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
      { $set: { name: cleanNew, ...(typeof order === "number" && { order }) } },
      { new: true }
    ).lean();

    // Cascade update to all events & championship archives in MongoDB
    try {
      await EventModel.updateMany(
        { discipline: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
        { $set: { discipline: cleanNew } }
      );
      await ChampionshipArchiveModel.updateMany(
        { discipline: { $regex: new RegExp(`^${cleanOld}$`, "i") } },
        { $set: { discipline: cleanNew } }
      );
    } catch (err) {
      console.warn("Cascade discipline update failed:", err);
    }

    if (doc) {
      const updatedList = await getEventDisciplines();
      await saveFileDisciplines(updatedList);
      return {
        id: (doc as any).id,
        name: (doc as any).name,
        order: (doc as any).order,
      };
    }
  } catch (error) {
    console.warn("MongoDB updateEventDiscipline error:", error);
  }

  const all = await getFileDisciplines();
  const idx = all.findIndex((d) => d.name.toLowerCase() === cleanOld.toLowerCase());
  if (idx !== -1) {
    all[idx].name = cleanNew;
    if (typeof order === "number") all[idx].order = order;
    await saveFileDisciplines(all);
    return all[idx];
  }

  return null;
}

export async function deleteEventDiscipline(name: string): Promise<boolean> {
  const cleanName = name.trim();
  try {
    await connectToDatabase();
    await EventDisciplineModel.deleteOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });
  } catch (error) {
    console.warn("MongoDB deleteEventDiscipline error:", error);
  }

  const all = await getFileDisciplines();
  const filtered = all.filter((d) => d.name.toLowerCase() !== cleanName.toLowerCase());
  await saveFileDisciplines(filtered);
  return true;
}
