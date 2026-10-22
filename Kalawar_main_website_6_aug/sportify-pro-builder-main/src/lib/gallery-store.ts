import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { GalleryModel, type GalleryItemType } from "@/models/Gallery";

export type GalleryItem = {
  id: string;
  type: GalleryItemType;
  title: string;
  category: string;
  src: string;
  thumb?: string;
  duration?: string;
  span?: "normal" | "tall" | "wide";
  status: "Published" | "Draft";
};

export type CreateGalleryInput = {
  id?: string;
  type?: GalleryItemType | string;
  title: string;
  category?: string;
  src: string;
  thumb?: string;
  duration?: string;
  span?: "normal" | "tall" | "wide" | string;
  status?: "Published" | "Draft" | string;
};

let cachedGallery: GalleryItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "gallery.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "gallery.json");

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

async function getFileGallery(): Promise<GalleryItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedGallery;
    const parsed = JSON.parse(raw) as GalleryItem[];
    if (Array.isArray(parsed)) {
      cachedGallery = parsed;
      return parsed;
    }
    return cachedGallery;
  } catch {
    return cachedGallery;
  }
}

async function saveFileGallery(items: GalleryItem[]): Promise<void> {
  cachedGallery = items;
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
    console.warn("Notice: Could not save to gallery.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

async function generateNextGalleryId(type: GalleryItemType): Promise<string> {
  const prefix = type === "video" ? "V" : "G";
  const regex = new RegExp(`^${prefix}(\\d+)$`, "i");
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await GalleryModel.find({ id: { $regex: new RegExp(`^${prefix}\\d+$`, "i") } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileGallery();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  return `${prefix}${highestNum + 1}`;
}

export async function getGalleryItems(options?: {
  type?: string;
  category?: string;
  status?: string;
  includeAll?: boolean;
}): Promise<GalleryItem[]> {
  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (!options?.includeAll && !options?.status) {
      filter.status = "Published";
    } else if (options?.status && options.status !== "All") {
      filter.status = options.status;
    }
    if (options?.type && options.type !== "All") {
      filter.type = options.type;
    }
    if (options?.category && options.category !== "All") {
      filter.category = options.category;
    }

    const docs = await GalleryModel.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      type: (d.type as GalleryItemType) || "photo",
      title: d.title,
      category: d.category || "General",
      src: d.src,
      thumb: d.thumb || (d.type === "photo" ? d.src : ""),
      duration: d.duration || "",
      span: d.span || "normal",
      status: (d.status as "Published" | "Draft") || "Published",
    }));
  } catch (error) {
    console.warn("MongoDB access note (gallery): Falling back to persistent file storage.", error instanceof Error ? error.message : "");
    const fileList = await getFileGallery();
    let filtered = fileList;
    if (!options?.includeAll && !options?.status) {
      filtered = filtered.filter((g) => !g.status || g.status === "Published");
    } else if (options?.status && options.status !== "All") {
      filtered = filtered.filter((g) => g.status === options.status);
    }
    if (options?.type && options.type !== "All") {
      filtered = filtered.filter((g) => g.type === options.type);
    }
    if (options?.category && options.category !== "All") {
      filtered = filtered.filter((g) => g.category === options.category);
    }
    return filtered;
  }
}

export async function getGalleryItemById(id: string): Promise<GalleryItem | null> {
  const cleanId = id.trim();
  try {
    await connectToDatabase();
    const d: any = await GalleryModel.findOne({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    }).lean();

    if (d) {
      return {
        id: d.id,
        type: (d.type as GalleryItemType) || "photo",
        title: d.title,
        category: d.category || "General",
        src: d.src,
        thumb: d.thumb || (d.type === "photo" ? d.src : ""),
        duration: d.duration || "",
        span: d.span || "normal",
        status: (d.status as "Published" | "Draft") || "Published",
      };
    }
  } catch {
    // Fallback
  }

  const fileList = await getFileGallery();
  return fileList.find((g) => g.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

export async function createGalleryItem(input: CreateGalleryInput): Promise<GalleryItem> {
  if (!input.title || !input.title.trim()) {
    throw new Error("Title or caption is required");
  }
  if (!input.src || !input.src.trim()) {
    throw new Error("Media source URL or image is required");
  }

  const type: GalleryItemType = input.type === "video" ? "video" : "photo";
  const id = input.id?.trim() || (await generateNextGalleryId(type));
  const category = input.category?.trim() || "General";
  const src = input.src.trim();
  const thumb = input.thumb?.trim() || (type === "photo" ? src : "");
  const duration = input.duration?.trim() || "";
  const span = (input.span as any) || "normal";
  const status: "Published" | "Draft" = input.status === "Draft" ? "Draft" : "Published";

  const galleryData: GalleryItem = {
    id,
    type,
    title: input.title.trim(),
    category,
    src,
    thumb,
    duration,
    span,
    status,
  };

  try {
    await connectToDatabase();
    await GalleryModel.create(galleryData);
  } catch (error) {
    console.warn("MongoDB create failed, writing to fallback file:", error);
    const fileList = await getFileGallery();
    fileList.unshift(galleryData);
    await saveFileGallery(fileList);
  }

  return galleryData;
}

export async function updateGalleryItem(
  id: string,
  input: Partial<CreateGalleryInput>
): Promise<GalleryItem> {
  const existing = await getGalleryItemById(id);
  if (!existing) {
    throw new Error(`Media item with ID "${id}" not found`);
  }

  const type: GalleryItemType = input.type !== undefined ? (input.type === "video" ? "video" : "photo") : existing.type;
  const src = input.src !== undefined ? input.src.trim() : existing.src;
  const thumb = input.thumb !== undefined ? input.thumb.trim() : (existing.thumb || (type === "photo" ? src : ""));

  const updatedData: GalleryItem = {
    ...existing,
    type,
    title: input.title !== undefined ? input.title.trim() : existing.title,
    category: input.category !== undefined ? input.category.trim() : existing.category,
    src,
    thumb,
    duration: input.duration !== undefined ? input.duration.trim() : (existing.duration || ""),
    span: (input.span as any) ?? existing.span,
    status: (input.status as any) || existing.status || "Published",
  };

  try {
    await connectToDatabase();
    await GalleryModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id.trim()}$`, "i") } },
      { $set: updatedData as any },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update failed, saving to fallback file:", error);
  }

  const fileList = await getFileGallery();
  const index = fileList.findIndex((g) => g.id.toLowerCase() === id.trim().toLowerCase());
  if (index >= 0) {
    fileList[index] = updatedData;
    await saveFileGallery(fileList);
  }

  return updatedData;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await GalleryModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    });
    if (res) deleted = true;
  } catch (error) {
    console.warn("MongoDB delete error:", error);
  }

  const fileList = await getFileGallery();
  const nextList = fileList.filter((g) => g.id.toLowerCase() !== cleanId.toLowerCase());
  if (nextList.length !== fileList.length) {
    await saveFileGallery(nextList);
    deleted = true;
  }

  return deleted;
}
