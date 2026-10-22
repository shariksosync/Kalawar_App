import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { LeadershipModel } from "@/models/Leadership";

export type LeadershipItem = {
  id: string;
  name: string;
  role: string;
  tag?: string;
  addressTitle?: string;
  quote?: string;
  message: string;
  organization?: string;
  image?: string;
  order: number;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
};

export type CreateLeadershipInput = {
  id?: string;
  name: string;
  role: string;
  tag?: string;
  addressTitle?: string;
  quote?: string;
  message: string;
  organization?: string;
  image?: string;
  order?: number;
  status?: "Active" | "Inactive";
};

let cachedLeadership: LeadershipItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "leadership.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "leadership.json");

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

async function getFileLeadership(): Promise<LeadershipItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedLeadership;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedLeadership = parsed;
      return parsed;
    }
    return cachedLeadership;
  } catch {
    return cachedLeadership;
  }
}

async function saveFileLeadership(items: LeadershipItem[]): Promise<void> {
  cachedLeadership = items;
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
    console.warn("Notice: Could not save to leadership.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

export async function generateNextLeadershipId(): Promise<string> {
  const regex = /^LDR-(\d+)$/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await LeadershipModel.find({ id: { $regex: /^LDR-\d+$/i } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileLeadership();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = highestNum + 1;
  return `LDR-${String(nextNum).padStart(3, "0")}`;
}

export async function getLeadershipList(options?: {
  status?: string;
  includeAll?: boolean;
}): Promise<LeadershipItem[]> {
  try {
    await connectToDatabase();
    const query: Record<string, any> = {};

    if (!options?.includeAll) {
      query.status = options?.status || "Active";
    } else if (options?.status && options.status !== "All") {
      query.status = options.status;
    }

    const docs = await LeadershipModel.find(query).sort({ order: 1, createdAt: 1 }).lean();

    if (docs.length > 0) {
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        role: doc.role,
        tag: doc.tag || "Leadership Vision",
        addressTitle: doc.addressTitle || "President's Address",
        quote: doc.quote || "",
        message: doc.message || "",
        organization: doc.organization || "",
        image: doc.image || "",
        order: doc.order ?? 0,
        status: (doc.status as "Active" | "Inactive") || "Active",
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      }));
    }
  } catch (err) {
    console.warn("MongoDB getLeadershipList fallback to file storage:", err);
  }

  // File fallback
  let items = await getFileLeadership();
  if (!options?.includeAll) {
    const targetStatus = options?.status || "Active";
    items = items.filter((i) => i.status === targetStatus);
  } else if (options?.status && options.status !== "All") {
    items = items.filter((i) => i.status === options.status);
  }
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getLeadershipById(id: string): Promise<LeadershipItem | null> {
  const cleanId = id.trim();

  try {
    await connectToDatabase();
    const doc = await LeadershipModel.findOne({
      $or: [{ id: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : undefined }],
    }).lean();

    if (doc) {
      return {
        id: doc.id,
        name: doc.name,
        role: doc.role,
        tag: doc.tag || "Leadership Vision",
        addressTitle: doc.addressTitle || "President's Address",
        quote: doc.quote || "",
        message: doc.message || "",
        organization: doc.organization || "",
        image: doc.image || "",
        order: doc.order ?? 0,
        status: (doc.status as "Active" | "Inactive") || "Active",
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      };
    }
  } catch (err) {
    console.warn("MongoDB getLeadershipById fallback to file storage:", err);
  }

  const items = await getFileLeadership();
  return items.find((i) => i.id === cleanId) || null;
}

export async function createLeadership(input: CreateLeadershipInput): Promise<LeadershipItem> {
  const id = input.id || (await generateNextLeadershipId());
  const now = new Date().toISOString();

  const newItem: LeadershipItem = {
    id,
    name: input.name.trim(),
    role: input.role.trim(),
    tag: input.tag?.trim() || "Leadership Vision",
    addressTitle: input.addressTitle?.trim() || "President's Address",
    quote: input.quote?.trim() || "",
    message: input.message?.trim() || "",
    organization: input.organization?.trim() || "",
    image: input.image?.trim() || "",
    order: input.order ?? 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await connectToDatabase();
    await LeadershipModel.findOneAndUpdate(
      { id },
      { ...newItem, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("MongoDB createLeadership fallback to file storage only:", err);
  }

  const items = await getFileLeadership();
  const existingIdx = items.findIndex((i) => i.id === id);
  if (existingIdx >= 0) {
    items[existingIdx] = newItem;
  } else {
    items.push(newItem);
  }
  await saveFileLeadership(items);

  return newItem;
}

export async function updateLeadership(
  id: string,
  input: Partial<CreateLeadershipInput>
): Promise<LeadershipItem | null> {
  const cleanId = id.trim();
  const now = new Date().toISOString();

  let updatedItem: LeadershipItem | null = null;

  try {
    await connectToDatabase();
    const doc = await LeadershipModel.findOneAndUpdate(
      { id: cleanId },
      {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.role !== undefined ? { role: input.role.trim() } : {}),
        ...(input.tag !== undefined ? { tag: input.tag.trim() } : {}),
        ...(input.addressTitle !== undefined ? { addressTitle: input.addressTitle.trim() } : {}),
        ...(input.quote !== undefined ? { quote: input.quote.trim() } : {}),
        ...(input.message !== undefined ? { message: input.message.trim() } : {}),
        ...(input.organization !== undefined ? { organization: input.organization.trim() } : {}),
        ...(input.image !== undefined ? { image: input.image.trim() } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (doc) {
      updatedItem = {
        id: doc.id,
        name: doc.name,
        role: doc.role,
        tag: doc.tag,
        addressTitle: doc.addressTitle,
        quote: doc.quote,
        message: doc.message,
        organization: doc.organization,
        image: doc.image,
        order: doc.order,
        status: doc.status as "Active" | "Inactive",
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      };
    }
  } catch (err) {
    console.warn("MongoDB updateLeadership fallback to file storage only:", err);
  }

  const items = await getFileLeadership();
  const idx = items.findIndex((i) => i.id === cleanId);
  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.role !== undefined ? { role: input.role.trim() } : {}),
      ...(input.tag !== undefined ? { tag: input.tag.trim() } : {}),
      ...(input.addressTitle !== undefined ? { addressTitle: input.addressTitle.trim() } : {}),
      ...(input.quote !== undefined ? { quote: input.quote.trim() } : {}),
      ...(input.message !== undefined ? { message: input.message.trim() } : {}),
      ...(input.organization !== undefined ? { organization: input.organization.trim() } : {}),
      ...(input.image !== undefined ? { image: input.image.trim() } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: now,
    };
    await saveFileLeadership(items);
    if (!updatedItem) updatedItem = items[idx];
  }

  return updatedItem;
}

export async function deleteLeadership(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await LeadershipModel.findOneAndDelete({ id: cleanId });
    if (res) deleted = true;
  } catch (err) {
    console.warn("MongoDB deleteLeadership fallback to file storage:", err);
  }

  const items = await getFileLeadership();
  const filtered = items.filter((i) => i.id !== cleanId);
  if (filtered.length !== items.length) {
    await saveFileLeadership(filtered);
    deleted = true;
  }

  return deleted;
}
