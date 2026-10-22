import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { OfficialModel, type OfficialCategory } from "@/models/Official";
import { ensureGovernanceTier } from "./governance-tiers-store";

export type OfficialItem = {
  id: string;
  name: string;
  role: string;
  category: OfficialCategory;
  state?: string;
  district?: string;
  image?: string;
  bio?: string;
  order: number;
  status: "Active" | "Inactive";
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateOfficialInput = {
  id?: string;
  name: string;
  role: string;
  category: OfficialCategory;
  state?: string;
  district?: string;
  image?: string;
  bio?: string;
  order?: number;
  status?: "Active" | "Inactive";
  email?: string;
  phone?: string;
};

let cachedOfficials: OfficialItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "officials.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "officials.json");

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

async function getFileOfficials(): Promise<OfficialItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedOfficials;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedOfficials = parsed;
      return parsed;
    }
    return cachedOfficials;
  } catch {
    return cachedOfficials;
  }
}

async function saveFileOfficials(items: OfficialItem[]): Promise<void> {
  cachedOfficials = items;
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
    console.warn("Notice: Could not save to officials.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

export async function generateNextOfficialId(): Promise<string> {
  const regex = /^OFF-(\d+)$/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await OfficialModel.find({ id: { $regex: /^OFF-\d+$/i } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileOfficials();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = highestNum + 1;
  return `OFF-${String(nextNum).padStart(3, "0")}`;
}

export async function getOfficials(options?: {
  category?: string;
  status?: string;
  state?: string;
  includeAll?: boolean;
}): Promise<OfficialItem[]> {
  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (!options?.includeAll && !options?.status) {
      filter.status = "Active";
    } else if (options?.status && options.status !== "All") {
      filter.status = options.status;
    }

    if (options?.category && options.category !== "All") {
      filter.category = options.category;
    }

    if (options?.state && options.state !== "All") {
      filter.state = options.state;
    }

    const docs = await OfficialModel.find(filter).sort({ order: 1, createdAt: 1 }).lean();

    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      role: d.role,
      category: d.category,
      state: d.state || "",
      district: d.district || "",
      image: d.image || "",
      bio: d.bio || "",
      order: d.order ?? 0,
      status: d.status || "Active",
      email: d.email || "",
      phone: d.phone || "",
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.warn("MongoDB access note (officials): Falling back to persistent file storage.", error instanceof Error ? error.message : "");
    const fileList = await getFileOfficials();
    let filtered = fileList;

    if (!options?.includeAll && !options?.status) {
      filtered = filtered.filter((item) => item.status === "Active");
    } else if (options?.status && options.status !== "All") {
      filtered = filtered.filter((item) => item.status === options.status);
    }

    if (options?.category && options.category !== "All") {
      filtered = filtered.filter((item) => item.category === options.category);
    }

    if (options?.state && options.state !== "All") {
      filtered = filtered.filter((item) => item.state === options.state);
    }

    filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return filtered;
  }
}

export async function getOfficialById(id: string): Promise<OfficialItem | null> {
  try {
    await connectToDatabase();
    const doc = await OfficialModel.findOne({ id }).lean();
    if (doc) {
      const d: any = doc;
      return {
        id: d.id,
        name: d.name,
        role: d.role,
        category: d.category,
        state: d.state || "",
        district: d.district || "",
        image: d.image || "",
        bio: d.bio || "",
        order: d.order ?? 0,
        status: d.status || "Active",
        email: d.email || "",
        phone: d.phone || "",
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      };
    }
  } catch {
    // fallback
  }

  const fileList = await getFileOfficials();
  return fileList.find((item) => item.id === id) || null;
}

export async function createOfficial(input: CreateOfficialInput): Promise<OfficialItem> {
  const officialId = input.id || (await generateNextOfficialId());
  const now = new Date().toISOString();

  const newOfficial: OfficialItem = {
    id: officialId,
    name: input.name.trim(),
    role: input.role.trim(),
    category: input.category,
    state: input.state?.trim() || "",
    district: input.district?.trim() || "",
    image: input.image?.trim() || "",
    bio: input.bio?.trim() || "",
    order: input.order ?? 0,
    status: input.status || "Active",
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  if (newOfficial.category) {
    try {
      await ensureGovernanceTier(newOfficial.category);
    } catch {}
  }

  // 1. File Storage
  try {
    const fileList = await getFileOfficials();
    const existingIdx = fileList.findIndex((item) => item.id === officialId);
    if (existingIdx >= 0) {
      fileList[existingIdx] = newOfficial;
    } else {
      fileList.push(newOfficial);
    }
    await saveFileOfficials(fileList);
  } catch (err) {
    console.error("File save error for official:", err);
  }

  // 2. MongoDB
  try {
    await connectToDatabase();
    await OfficialModel.findOneAndUpdate(
      { id: officialId },
      { $set: newOfficial },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.warn("Mongo save note for official:", err instanceof Error ? err.message : err);
  }

  return newOfficial;
}

export async function updateOfficial(
  id: string,
  input: Partial<CreateOfficialInput>
): Promise<OfficialItem | null> {
  const now = new Date().toISOString();

  // 1. Update File Storage
  let updatedOfficial: OfficialItem | null = null;
  try {
    const fileList = await getFileOfficials();
    const idx = fileList.findIndex((item) => item.id === id);
    if (idx >= 0) {
      fileList[idx] = {
        ...fileList[idx],
        ...input,
        name: input.name !== undefined ? input.name.trim() : fileList[idx].name,
        role: input.role !== undefined ? input.role.trim() : fileList[idx].role,
        category: input.category || fileList[idx].category,
        state: input.state !== undefined ? input.state.trim() : fileList[idx].state,
        district: input.district !== undefined ? input.district.trim() : fileList[idx].district,
        image: input.image !== undefined ? input.image.trim() : fileList[idx].image,
        bio: input.bio !== undefined ? input.bio.trim() : fileList[idx].bio,
        order: input.order !== undefined ? Number(input.order) : fileList[idx].order,
        status: input.status || fileList[idx].status,
        email: input.email !== undefined ? input.email.trim() : fileList[idx].email,
        phone: input.phone !== undefined ? input.phone.trim() : fileList[idx].phone,
        updatedAt: now,
      };
      updatedOfficial = fileList[idx];
      await saveFileOfficials(fileList);
    }
  } catch (err) {
    console.error("File update error for official:", err);
  }

  if (input.category) {
    try {
      await ensureGovernanceTier(input.category);
    } catch {}
  }

  // 2. Update MongoDB
  try {
    await connectToDatabase();
    const updatePayload: Record<string, any> = { ...input, updatedAt: new Date() };
    if (updatePayload.name) updatePayload.name = updatePayload.name.trim();
    if (updatePayload.role) updatePayload.role = updatePayload.role.trim();
    if (updatePayload.order !== undefined) updatePayload.order = Number(updatePayload.order);

    const doc = await OfficialModel.findOneAndUpdate(
      { id },
      { $set: updatePayload },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const d: any = doc;
      updatedOfficial = {
        id: d.id,
        name: d.name,
        role: d.role,
        category: d.category,
        state: d.state || "",
        district: d.district || "",
        image: d.image || "",
        bio: d.bio || "",
        order: d.order ?? 0,
        status: d.status || "Active",
        email: d.email || "",
        phone: d.phone || "",
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.warn("Mongo update note for official:", err instanceof Error ? err.message : err);
  }

  return updatedOfficial;
}

export async function deleteOfficial(id: string): Promise<boolean> {
  const cleanId = (id || "").trim();
  if (!cleanId) return false;
  let deleted = false;

  // 1. File Storage
  try {
    const fileList = await getFileOfficials();
    const nextList = fileList.filter((item) => item.id.toLowerCase() !== cleanId.toLowerCase());
    if (nextList.length !== fileList.length) {
      await saveFileOfficials(nextList);
      deleted = true;
    }
  } catch (err) {
    console.error("File delete error for official:", err);
  }

  // 2. MongoDB
  try {
    await connectToDatabase();
    const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const res = await OfficialModel.deleteOne({ id: { $regex: new RegExp("^" + escaped + "$", "i") } });
    if (res.deletedCount && res.deletedCount > 0) {
      deleted = true;
    }
  } catch (err) {
    console.warn("Mongo delete note for official:", err instanceof Error ? err.message : err);
  }

  return deleted;
}
