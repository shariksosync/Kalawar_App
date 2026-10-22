import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { AlbumModel, type IPhotoItem } from "@/models/Album";
import type { AlbumItem } from "@/data/albums";
import { slugify } from "./utils";

export type CreateAlbumInput = {
  id?: string;
  title: string;
  slug?: string;
  category?: string;
  eventName?: string;
  eventLink?: string;
  date?: string;
  venue: string;
  state?: string;
  district?: string;
  coverPhoto: string;
  description?: string;
  photographerCredit?: string;
  photos?: IPhotoItem[];
  status?: "Published" | "Draft" | "Archived" | string;
  pinned?: boolean;
};

let cachedAlbums: AlbumItem[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "albums.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "albums.json");

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

async function getFileAlbums(): Promise<AlbumItem[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedAlbums;
    const parsed = JSON.parse(raw) as AlbumItem[];
    if (Array.isArray(parsed)) {
      cachedAlbums = parsed;
      return parsed;
    }
    return cachedAlbums;
  } catch {
    return cachedAlbums;
  }
}

async function saveFileAlbums(albums: AlbumItem[]): Promise<void> {
  cachedAlbums = albums;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(albums, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(albums, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not save to albums.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

async function generateNextAlbumId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ALB-${currentYear}-`;
  const regex = new RegExp(`^ALB-${currentYear}-(\\d+)$`, "i");
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await AlbumModel.find({ id: { $regex: `^ALB-${currentYear}-` } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileAlbums();
    for (const album of fileList) {
      const match = album.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = (highestNum + 1).toString().padStart(2, "0");
  return `${prefix}${nextNum}`;
}

export async function getAlbums(options?: {
  category?: string;
  year?: string;
  status?: string;
  search?: string;
  includeAll?: boolean;
}): Promise<AlbumItem[]> {
  try {
    await connectToDatabase();

    const query: Record<string, any> = {};

    if (!options?.includeAll) {
      if (options?.status) {
        query.status = options.status;
      } else {
        query.status = "Published";
      }
    }

    if (options?.category && options.category !== "All") {
      query.category = { $regex: new RegExp(`^${options.category}$`, "i") };
    }

    if (options?.year && options.year !== "All Years") {
      query.date = { $regex: `^${options.year}` };
    }

    if (options?.search && options.search.trim()) {
      const s = options.search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { eventName: { $regex: s, $options: "i" } },
        { venue: { $regex: s, $options: "i" } },
        { state: { $regex: s, $options: "i" } },
        { district: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const docs = await AlbumModel.find(query)
      .sort({ pinned: -1, date: -1, createdAt: -1 })
      .lean();

    if (docs && docs.length > 0) {
      return docs.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        category: (doc.category as any) || "Championship Photos",
        eventName: doc.eventName || "",
        eventLink: doc.eventLink || "",
        date: doc.date,
        venue: doc.venue,
        state: doc.state || "",
        district: doc.district || "",
        coverPhoto: doc.coverPhoto,
        description: doc.description || "",
        photographerCredit: doc.photographerCredit || "KALAWAR Official Media Cell",
        photos: Array.isArray(doc.photos) ? doc.photos : [],
        status: (doc.status as any) || "Published",
        pinned: Boolean(doc.pinned),
      }));
    }

    return [];
  } catch (error) {
    console.warn("MongoDB getAlbums failed, using file storage fallback:", error);
    let list = await getFileAlbums();

    if (!options?.includeAll) {
      if (options?.status) {
        list = list.filter((a) => a.status === options.status);
      } else {
        list = list.filter((a) => a.status === "Published");
      }
    }

    if (options?.category && options.category !== "All") {
      list = list.filter((a) => a.category.toLowerCase() === options.category!.toLowerCase());
    }

    if (options?.year && options.year !== "All Years") {
      list = list.filter((a) => a.date && a.date.startsWith(options.year!));
    }

    if (options?.search && options.search.trim()) {
      const s = options.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          (a.eventName && a.eventName.toLowerCase().includes(s)) ||
          a.venue.toLowerCase().includes(s) ||
          (a.state && a.state.toLowerCase().includes(s)) ||
          (a.district && a.district.toLowerCase().includes(s))
      );
    }

    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
}

export async function getAlbumBySlugOrId(identifier: string): Promise<AlbumItem | null> {
  const decoded = decodeURIComponent(identifier).trim();

  try {
    await connectToDatabase();
    const doc = await AlbumModel.findOne({
      $or: [{ slug: decoded }, { id: decoded }, { slug: slugify(decoded) }],
    }).lean();

    if (doc) {
      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        category: (doc.category as any) || "Championship Photos",
        eventName: doc.eventName || "",
        eventLink: doc.eventLink || "",
        date: doc.date,
        venue: doc.venue,
        state: doc.state || "",
        district: doc.district || "",
        coverPhoto: doc.coverPhoto,
        description: doc.description || "",
        photographerCredit: doc.photographerCredit || "KALAWAR Official Media Cell",
        photos: Array.isArray(doc.photos) ? doc.photos : [],
        status: (doc.status as any) || "Published",
        pinned: Boolean(doc.pinned),
      };
    }
  } catch (error) {
    console.warn("MongoDB getAlbumBySlugOrId failed, fallback to file:", error);
  }

  const list = await getFileAlbums();
  const match = list.find(
    (a) => a.slug === decoded || a.id === decoded || a.slug === slugify(decoded)
  );
  return match || null;
}

export async function createAlbum(input: CreateAlbumInput): Promise<AlbumItem> {
  const id = input.id || (await generateNextAlbumId());
  const slug = input.slug ? slugify(input.slug) : slugify(`${input.title}-${id}`);
  const date = input.date || new Date().toISOString().split("T")[0];

  const newAlbum: AlbumItem = {
    id,
    title: input.title.trim(),
    slug,
    category: (input.category as any) || "Championship Photos",
    eventName: input.eventName?.trim() || "",
    eventLink: input.eventLink?.trim() || "",
    date,
    venue: input.venue.trim(),
    state: input.state?.trim() || "Maharashtra",
    district: input.district?.trim() || "Pune",
    coverPhoto: input.coverPhoto.trim(),
    description: input.description?.trim() || "",
    photographerCredit: input.photographerCredit?.trim() || "KALAWAR Official Media Cell",
    photos: Array.isArray(input.photos) ? input.photos : [],
    status: (input.status as any) || "Published",
    pinned: Boolean(input.pinned),
  };

  try {
    await connectToDatabase();
    await AlbumModel.create(newAlbum);
  } catch (error) {
    console.warn("MongoDB createAlbum failed, saving to file:", error);
  }

  const list = await getFileAlbums();
  list.unshift(newAlbum);
  await saveFileAlbums(list);

  return newAlbum;
}

export async function updateAlbum(
  identifier: string,
  updates: Partial<CreateAlbumInput>
): Promise<AlbumItem | null> {
  const decoded = decodeURIComponent(identifier).trim();

  try {
    await connectToDatabase();
    const updated = await AlbumModel.findOneAndUpdate(
      { $or: [{ id: decoded }, { slug: decoded }] },
      { $set: updates },
      { returnDocument: "after" }
    ).lean();

    if (updated) {
      const fileList = await getFileAlbums();
      const idx = fileList.findIndex((a) => a.id === updated.id || a.slug === updated.slug);
      if (idx !== -1) {
        fileList[idx] = { ...fileList[idx], ...updates } as AlbumItem;
        await saveFileAlbums(fileList);
      }
      return updated as unknown as AlbumItem;
    }
  } catch (error) {
    console.warn("MongoDB updateAlbum failed, applying to file:", error);
  }

  const fileList = await getFileAlbums();
  const idx = fileList.findIndex((a) => a.id === decoded || a.slug === decoded);
  if (idx === -1) return null;

  fileList[idx] = { ...fileList[idx], ...updates } as AlbumItem;
  await saveFileAlbums(fileList);
  return fileList[idx];
}

export async function deleteAlbum(identifier: string): Promise<boolean> {
  const decoded = decodeURIComponent(identifier).trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await AlbumModel.deleteOne({ $or: [{ id: decoded }, { slug: decoded }] });
    if (res.deletedCount > 0) deleted = true;
  } catch (error) {
    console.warn("MongoDB deleteAlbum failed:", error);
  }

  const fileList = await getFileAlbums();
  const filtered = fileList.filter((a) => a.id !== decoded && a.slug !== decoded);
  if (filtered.length !== fileList.length) {
    await saveFileAlbums(filtered);
    deleted = true;
  }

  return deleted;
}
