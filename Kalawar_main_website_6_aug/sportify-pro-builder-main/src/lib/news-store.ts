import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { NewsModel } from "@/models/News";
import type { NewsItem, NewsCategory } from "@/data/content";
import { withRedisCache, invalidateNewsAndEventsCache } from "./redis";

export type CreateNewsInput = {
  id?: string;
  slug?: string;
  title: string;
  excerpt: string;
  body?: string[] | string;
  category?: NewsCategory | string;
  tag?: "Latest" | "Trending" | "Featured" | "Pinned" | "Urgent" | string;
  author?: string;
  date?: string;
  expiryDate?: string;
  location?: string;
  readTime?: string;
  image?: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
  actionLink?: string;
  actionText?: string;
  pinned?: boolean;
  status?: "Published" | "Draft" | "Archived" | string;
};

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function calculateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

let cachedNews: (NewsItem & { status?: string })[] = [];

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "news.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "news.json");

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

async function getFileNews(): Promise<(NewsItem & { status?: string })[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      cachedNews = parsed;
      return parsed;
    }
    return [];
  } catch {
    return cachedNews;
  }
}

async function saveFileNews(items: (NewsItem & { status?: string })[]): Promise<void> {
  cachedNews = items;
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
    console.warn("Notice: Could not save to news.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

async function generateNextNewsId(): Promise<string> {
  const regex = /^N(\d+)$/i;
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await NewsModel.find({ id: { $regex: /^N\d+$/i } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileNews();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  return `N${highestNum + 1}`;
}

export async function getNews(options?: {
  category?: string;
  status?: string;
  includeAll?: boolean;
}): Promise<(NewsItem & { status: string })[]> {
  const cacheKey = `cache:news:list:${options?.category || "all"}:${options?.status || "all"}:${options?.includeAll ? "1" : "0"}`;
  return withRedisCache(cacheKey, 180, () => fetchRawNews(options));
}

async function fetchRawNews(options?: {
  category?: string;
  status?: string;
  includeAll?: boolean;
}): Promise<(NewsItem & { status: string })[]> {
  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (!options?.includeAll && !options?.status) {
      filter.status = "Published";
    } else if (options?.status && options.status !== "All") {
      filter.status = options.status;
    }
    if (options?.category && options.category !== "All") {
      filter.category = options.category;
    }

    const docs = await NewsModel.find(filter)
      .sort({ pinned: -1, date: -1, createdAt: -1 })
      .lean();

    return docs.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      body: Array.isArray(d.body) ? d.body : [d.body || d.excerpt],
      category: d.category || "News",
      tag: d.tag || "Latest",
      author: d.author || "Media Secretariat",
      date: d.date || new Date().toISOString().split("T")[0],
      expiryDate: d.expiryDate || "",
      location: d.location || "National Headquarters, India",
      readTime: d.readTime || "3 min read",
      image:
        d.image ||
        "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80",
      documentUrl: d.documentUrl || "",
      documentName: d.documentName || "",
      documentSize: d.documentSize || "",
      actionLink: d.actionLink || "",
      actionText: d.actionText || "",
      pinned: Boolean(d.pinned),
      status: d.status || "Published",
    }));
  } catch (error) {
    console.warn("MongoDB access note (news): Falling back to persistent file storage.", error instanceof Error ? error.message : "");
    const fileList = await getFileNews();
    let filtered = fileList;
    if (!options?.includeAll && !options?.status) {
      filtered = filtered.filter((n) => !n.status || n.status === "Published");
    } else if (options?.status && options.status !== "All") {
      filtered = filtered.filter((n) => n.status === options.status);
    }
    if (options?.category && options.category !== "All") {
      filtered = filtered.filter((n) => n.category === options.category);
    }

    // Sort: pinned first, then date descending
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return filtered.map((n) => ({
      ...n,
      status: n.status || "Published",
      body: Array.isArray(n.body) ? n.body : [n.body || n.excerpt],
    }));
  }
}

export async function getNewsBySlugOrId(identifier: string): Promise<(NewsItem & { status: string }) | null> {
  const clean = identifier.trim();
  return withRedisCache(`cache:news:single:${clean.toLowerCase()}`, 180, () => fetchRawNewsBySlugOrId(clean));
}

async function fetchRawNewsBySlugOrId(clean: string): Promise<(NewsItem & { status: string }) | null> {
  try {
    await connectToDatabase();
    const d: any = await NewsModel.findOne({
      $or: [
        { slug: { $regex: new RegExp(`^${clean}$`, "i") } },
        { id: { $regex: new RegExp(`^${clean}$`, "i") } },
      ],
    }).lean();

    if (d) {
      return {
        id: d.id,
        slug: d.slug,
        title: d.title,
        excerpt: d.excerpt,
        body: Array.isArray(d.body) ? d.body : [d.body || d.excerpt],
        category: d.category || "News",
        tag: d.tag || "Latest",
        author: d.author || "Media Secretariat",
        date: d.date || new Date().toISOString().split("T")[0],
        expiryDate: d.expiryDate || "",
        location: d.location || "National Headquarters, India",
        readTime: d.readTime || "3 min read",
        image:
          d.image ||
          "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80",
        documentUrl: d.documentUrl || "",
        documentName: d.documentName || "",
        documentSize: d.documentSize || "",
        actionLink: d.actionLink || "",
        actionText: d.actionText || "",
        pinned: Boolean(d.pinned),
        status: d.status || "Published",
      };
    }
  } catch {
    // Fallback
  }

  const fileList = await getFileNews();
  const found = fileList.find(
    (n) => n.slug.toLowerCase() === clean.toLowerCase() || n.id.toLowerCase() === clean.toLowerCase()
  );
  if (found) {
    return {
      ...found,
      status: found.status || "Published",
      body: Array.isArray(found.body) ? found.body : [found.body || found.excerpt],
    };
  }
  return null;
}

export async function createNews(input: CreateNewsInput): Promise<NewsItem & { status: string }> {
  if (!input.title || !input.title.trim()) {
    throw new Error("Article headline is required");
  }
  if (!input.excerpt || !input.excerpt.trim()) {
    throw new Error("Article excerpt is required");
  }

  const id = input.id?.trim() || (await generateNextNewsId());
  let slug = input.slug?.trim() || slugify(input.title);
  if (!slug) slug = `article-${id.toLowerCase()}`;

  // Process body
  let bodyArray: string[] = [];
  if (Array.isArray(input.body)) {
    bodyArray = input.body.filter((p) => p.trim());
  } else if (typeof input.body === "string" && input.body.trim()) {
    bodyArray = input.body
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (bodyArray.length === 0) {
    bodyArray = [input.excerpt.trim()];
  }

  const category = (input.category as any) || "News";
  const tag = (input.tag as any) || "Latest";
  const author = input.author?.trim() || "Media Secretariat";
  const date = input.date?.trim() || new Date().toISOString().split("T")[0];
  const readTime = input.readTime?.trim() || calculateReadTime(bodyArray.join(" "));
  const image =
    input.image?.trim() ||
    "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80";
  const status = (input.status as any) || "Published";

  const newsData: NewsItem & { status: "Published" | "Draft" | "Archived" } = {
    id,
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    body: bodyArray,
    category,
    tag,
    author,
    date,
    expiryDate: input.expiryDate?.trim() || "",
    location: input.location?.trim() || "National Headquarters, India",
    readTime,
    image,
    documentUrl: input.documentUrl?.trim() || "",
    documentName: input.documentName?.trim() || "",
    documentSize: input.documentSize?.trim() || "",
    actionLink: input.actionLink?.trim() || "",
    actionText: input.actionText?.trim() || "",
    pinned: Boolean(input.pinned),
    status,
  };

  try {
    await connectToDatabase();
    await NewsModel.create(newsData);
  } catch (error) {
    console.warn("MongoDB create failed, writing to fallback file:", error);
    const fileList = await getFileNews();
    fileList.unshift(newsData);
    await saveFileNews(fileList);
  }

  await invalidateNewsAndEventsCache(newsData.slug);
  return newsData;
}

export async function updateNews(
  id: string,
  input: Partial<CreateNewsInput>
): Promise<NewsItem & { status: string }> {
  const existing = await getNewsBySlugOrId(id);
  if (!existing) {
    throw new Error(`Article with ID "${id}" not found`);
  }

  let bodyArray: string[] = existing.body;
  if (input.body !== undefined) {
    if (Array.isArray(input.body)) {
      bodyArray = input.body.filter((p) => p.trim());
    } else if (typeof input.body === "string") {
      bodyArray = input.body
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const excerpt = input.excerpt !== undefined ? input.excerpt.trim() : existing.excerpt;
  const slug = input.slug !== undefined ? input.slug.trim() : existing.slug;
  const readTime = input.readTime !== undefined ? input.readTime.trim() : calculateReadTime(bodyArray.join(" "));

  const updatedData: NewsItem & { status: "Published" | "Draft" | "Archived" } = {
    ...existing,
    title,
    excerpt,
    slug,
    body: bodyArray,
    category: (input.category as any) ?? existing.category,
    tag: (input.tag as any) ?? existing.tag,
    author: input.author !== undefined ? input.author.trim() : existing.author,
    date: input.date !== undefined ? input.date.trim() : existing.date,
    expiryDate: input.expiryDate !== undefined ? input.expiryDate.trim() : (existing.expiryDate || ""),
    location: input.location !== undefined ? input.location.trim() : (existing.location || "National Headquarters, India"),
    readTime,
    image: input.image !== undefined ? input.image.trim() : existing.image,
    documentUrl: input.documentUrl !== undefined ? input.documentUrl.trim() : (existing.documentUrl || ""),
    documentName: input.documentName !== undefined ? input.documentName.trim() : (existing.documentName || ""),
    documentSize: input.documentSize !== undefined ? input.documentSize.trim() : (existing.documentSize || ""),
    actionLink: input.actionLink !== undefined ? input.actionLink.trim() : (existing.actionLink || ""),
    actionText: input.actionText !== undefined ? input.actionText.trim() : (existing.actionText || ""),
    pinned: input.pinned !== undefined ? Boolean(input.pinned) : Boolean(existing.pinned),
    status: (input.status as any) || existing.status || "Published",
  };

  try {
    await connectToDatabase();
    await NewsModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id.trim()}$`, "i") } },
      { $set: updatedData as any },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update failed, saving to fallback file:", error);
  }

  const fileList = await getFileNews();
  const index = fileList.findIndex((n) => n.id.toLowerCase() === id.trim().toLowerCase());
  if (index >= 0) {
    fileList[index] = updatedData;
    await saveFileNews(fileList);
  }

  await invalidateNewsAndEventsCache(existing.slug);
  return updatedData;
}

export async function deleteNews(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await NewsModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    });
    if (res) deleted = true;
  } catch (error) {
    console.warn("MongoDB delete error:", error);
  }

  const fileList = await getFileNews();
  const nextList = fileList.filter((n) => n.id.toLowerCase() !== cleanId.toLowerCase());
  if (nextList.length !== fileList.length) {
    await saveFileNews(nextList);
    deleted = true;
  }

  await invalidateNewsAndEventsCache(cleanId);
  return deleted;
}

