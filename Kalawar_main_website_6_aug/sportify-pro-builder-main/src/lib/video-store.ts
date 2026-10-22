import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { VideoModel } from "@/models/Video";
import type { VideoItem } from "@/data/videos";
import type { VideoCategory, VideoType } from "@/types/video";
import { slugify } from "./utils";
import { parseVideoUrl, type ParsedVideoInfo } from "./video-utils";
import { withRedisCache, invalidateVideoCache } from "./redis";
export { parseVideoUrl, type ParsedVideoInfo } from "./video-utils";


export type CreateVideoInput = {
  id?: string;
  title: string;
  slug?: string;
  category?: VideoCategory | string;
  videoUrl: string;
  videoType?: VideoType;
  videoId?: string;
  thumbnailUrl?: string;
  duration?: string;
  eventName?: string;
  eventLink?: string;
  date?: string;
  venue?: string;
  state?: string;
  district?: string;
  description?: string;
  channelOrCredit?: string;
  status?: "Published" | "Draft" | "Archived" | string;
  pinned?: boolean;
  views?: number;
};

const STORAGE_FILE = path.join(process.cwd(), "src/data/storage/videos.json");
let cachedVideos: VideoItem[] = [];

async function ensureFileStorage(): Promise<VideoItem[]> {
  try {
    const dir = path.dirname(STORAGE_FILE);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
    try {
      const data = await fs.readFile(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        cachedVideos = parsed;
        return parsed;
      }
    } catch {
      // File doesn't exist yet
    }
    try {
      await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch {}
    return cachedVideos;
  } catch (error) {
    return cachedVideos;
  }
}

async function saveFileStorage(videos: VideoItem[]): Promise<void> {
  cachedVideos = videos;
  try {
    const dir = path.dirname(STORAGE_FILE);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
    const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(videos, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, STORAGE_FILE);
    } catch {
      await fs.writeFile(STORAGE_FILE, JSON.stringify(videos, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not write video file storage (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

async function fetchRawVideos(options?: {
  category?: string;
  status?: string;
  search?: string;
  pinnedOnly?: boolean;
}): Promise<VideoItem[]> {
  try {
    await connectToDatabase();
    const query: Record<string, unknown> = {};

    if (options?.category && options.category !== "All") {
      query.category = options.category;
    }

    if (options?.status && options.status !== "All") {
      query.status = options.status;
    }

    if (options?.pinnedOnly) {
      query.pinned = true;
    }

    if (options?.search) {
      const regex = new RegExp(options.search, "i");
      query.$or = [
        { title: regex },
        { eventName: regex },
        { venue: regex },
        { description: regex },
        { channelOrCredit: regex },
        { state: regex },
        { district: regex },
      ];
    }

    const docs = await VideoModel.find(query).sort({ pinned: -1, date: -1, createdAt: -1 }).lean();

    return docs.map((doc: any) => ({
      id: doc.id || doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      category: doc.category as VideoCategory,
      videoUrl: doc.videoUrl,
      videoType: doc.videoType || "youtube",
      videoId: doc.videoId || "",
      thumbnailUrl: doc.thumbnailUrl,
      duration: doc.duration || "00:00",
      eventName: doc.eventName || "",
      eventLink: doc.eventLink || "",
      date: doc.date,
      venue: doc.venue || "",
      state: doc.state || "",
      district: doc.district || "",
      description: doc.description || "",
      channelOrCredit: doc.channelOrCredit || "KALAWAR Official",
      status: (doc.status as "Published" | "Draft" | "Archived") || "Published",
      pinned: !!doc.pinned,
      views: doc.views || 0,
      createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
    }));
  } catch (error) {
    console.warn("MongoDB getVideos error, falling back to file storage:", error);
    const fileVideos = await ensureFileStorage();
    return filterVideosArray(fileVideos, options);
  }
}

export async function getVideos(options?: {
  category?: string;
  status?: string;
  search?: string;
  pinnedOnly?: boolean;
}): Promise<VideoItem[]> {
  const cacheKey = `cache:videos:list:${options?.category || "all"}:${options?.status || "all"}:${options?.search || "none"}:${options?.pinnedOnly ? "1" : "0"}`;
  return withRedisCache(cacheKey, 300, () => fetchRawVideos(options));
}

function filterVideosArray(videos: VideoItem[], options?: {
  category?: string;
  status?: string;
  search?: string;
  pinnedOnly?: boolean;
}): VideoItem[] {
  return videos.filter((vid) => {
    if (options?.category && options.category !== "All" && vid.category !== options.category) {
      return false;
    }
    if (options?.status && options.status !== "All" && vid.status !== options.status) {
      return false;
    }
    if (options?.pinnedOnly && !vid.pinned) {
      return false;
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      const matchTitle = vid.title.toLowerCase().includes(q);
      const matchEvent = vid.eventName?.toLowerCase().includes(q);
      const matchVenue = vid.venue?.toLowerCase().includes(q);
      const matchDesc = vid.description?.toLowerCase().includes(q);
      const matchCredit = vid.channelOrCredit?.toLowerCase().includes(q);
      if (!matchTitle && !matchEvent && !matchVenue && !matchDesc && !matchCredit) {
        return false;
      }
    }
    return true;
  });
}

async function fetchRawVideoBySlugOrId(slugOrId: string): Promise<VideoItem | null> {
  try {
    await connectToDatabase();
    const doc = await VideoModel.findOne({
      $or: [{ id: slugOrId }, { slug: slugOrId }],
    }).lean();

    if (doc) {
      const d: any = doc;
      return {
        id: d.id || d._id.toString(),
        title: d.title,
        slug: d.slug,
        category: d.category as VideoCategory,
        videoUrl: d.videoUrl,
        videoType: d.videoType,
        videoId: d.videoId,
        thumbnailUrl: d.thumbnailUrl,
        duration: d.duration,
        eventName: d.eventName,
        eventLink: d.eventLink,
        date: d.date,
        venue: d.venue,
        state: d.state,
        district: d.district,
        description: d.description,
        channelOrCredit: d.channelOrCredit,
        status: (d.status as "Published" | "Draft" | "Archived") || "Published",
        pinned: !!d.pinned,
        views: d.views || 0,
        createdAt: d.createdAt?.toISOString?.() || d.createdAt,
        updatedAt: d.updatedAt?.toISOString?.() || d.updatedAt,
      };
    }
  } catch (error) {
    console.warn("MongoDB getVideoBySlugOrId fallback to file:", error);
  }

  const fileVideos = await ensureFileStorage();
  return fileVideos.find((v) => v.id === slugOrId || v.slug === slugOrId) || null;
}

export async function getVideoBySlugOrId(slugOrId: string): Promise<VideoItem | null> {
  return withRedisCache(`cache:videos:single:${slugOrId}`, 300, () => fetchRawVideoBySlugOrId(slugOrId));
}

export async function createVideo(input: CreateVideoInput): Promise<VideoItem> {
  const generatedId = input.id || `VID-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const generatedSlug = input.slug || slugify(input.title) || generatedId.toLowerCase();
  
  const parsed = parseVideoUrl(input.videoUrl);
  const videoType = input.videoType || parsed.videoType;
  const videoId = input.videoId || parsed.videoId;
  const thumbnailUrl = input.thumbnailUrl?.trim() ? input.thumbnailUrl.trim() : parsed.defaultThumbnail;

  const newVideo: VideoItem = {
    id: generatedId,
    title: input.title.trim(),
    slug: generatedSlug,
    category: (input.category as VideoCategory) || "Championship Videos",
    videoUrl: input.videoUrl.trim(),
    videoType,
    videoId,
    thumbnailUrl,
    duration: input.duration?.trim() || "00:00",
    eventName: input.eventName?.trim() || "",
    eventLink: input.eventLink?.trim() || "",
    date: input.date || new Date().toISOString().split("T")[0],
    venue: input.venue?.trim() || "",
    state: input.state?.trim() || "Maharashtra",
    district: input.district?.trim() || "Pune",
    description: input.description?.trim() || "",
    channelOrCredit: input.channelOrCredit?.trim() || "KALAWAR Official",
    status: (input.status as "Published" | "Draft" | "Archived") || "Published",
    pinned: !!input.pinned,
    views: input.views || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to MongoDB
  try {
    await connectToDatabase();
    await VideoModel.findOneAndUpdate(
      { id: newVideo.id },
      { $set: newVideo },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error("Error saving video to MongoDB:", error);
  }

  // 2. Save to JSON File
  try {
    const fileVideos = await ensureFileStorage();
    const existingIndex = fileVideos.findIndex((v) => v.id === newVideo.id);
    if (existingIndex >= 0) {
      fileVideos[existingIndex] = newVideo;
    } else {
      fileVideos.unshift(newVideo);
    }
    await saveFileStorage(fileVideos);
  } catch (error) {
    console.error("Error saving video to JSON storage:", error);
  }

  // Invalidate Redis video cache
  await invalidateVideoCache(newVideo.slug);
  return newVideo;
}

export async function updateVideo(id: string, input: Partial<CreateVideoInput>): Promise<VideoItem | null> {
  const updates: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };

  if (input.title && !input.slug) {
    updates.slug = slugify(input.title);
  }

  if (input.videoUrl) {
    const parsed = parseVideoUrl(input.videoUrl);
    if (!input.videoType) updates.videoType = parsed.videoType;
    if (!input.videoId) updates.videoId = parsed.videoId;
    if (!input.thumbnailUrl || !input.thumbnailUrl.trim()) {
      updates.thumbnailUrl = parsed.defaultThumbnail;
    }
  }

  let updatedVideo: VideoItem | null = null;

  try {
    await connectToDatabase();
    const doc = await VideoModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      const d: any = doc;
      updatedVideo = {
        id: d.id,
        title: d.title,
        slug: d.slug,
        category: d.category as VideoCategory,
        videoUrl: d.videoUrl,
        videoType: d.videoType,
        videoId: d.videoId,
        thumbnailUrl: d.thumbnailUrl,
        duration: d.duration,
        eventName: d.eventName,
        eventLink: d.eventLink,
        date: d.date,
        venue: d.venue,
        state: d.state,
        district: d.district,
        description: d.description,
        channelOrCredit: d.channelOrCredit,
        status: d.status,
        pinned: !!d.pinned,
        views: d.views || 0,
        createdAt: d.createdAt?.toISOString?.() || d.createdAt,
        updatedAt: d.updatedAt?.toISOString?.() || d.updatedAt,
      };
    }
  } catch (error) {
    console.error("Error updating video in MongoDB:", error);
  }

  // Sync with file storage
  try {
    const fileVideos = await ensureFileStorage();
    const idx = fileVideos.findIndex((v) => v.id === id);
    if (idx >= 0) {
      fileVideos[idx] = {
        ...fileVideos[idx],
        ...updates,
      } as VideoItem;
      if (!updatedVideo) {
        updatedVideo = fileVideos[idx];
      }
      await saveFileStorage(fileVideos);
    }
  } catch (error) {
    console.error("Error updating video in JSON storage:", error);
  }

  // Invalidate Redis video cache
  await invalidateVideoCache(id);
  return updatedVideo;
}

export async function incrementVideoViews(id: string): Promise<number> {
  let views = 0;
  try {
    await connectToDatabase();
    const doc = await VideoModel.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );
    if (doc) views = doc.views || 0;
  } catch (error) {
    console.error("Error incrementing video views in MongoDB:", error);
  }

  try {
    const fileVideos = await ensureFileStorage();
    const v = fileVideos.find((item) => item.id === id || item.slug === id);
    if (v) {
      v.views = (v.views || 0) + 1;
      views = v.views;
      await saveFileStorage(fileVideos);
    }
  } catch (error) {
    console.error("Error incrementing video views in JSON storage:", error);
  }

  return views;
}

export async function deleteVideo(id: string): Promise<boolean> {
  let deletedFromMongo = false;
  try {
    await connectToDatabase();
    const result = await VideoModel.deleteOne({ id });
    deletedFromMongo = result.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting video from MongoDB:", error);
  }

  try {
    const fileVideos = await ensureFileStorage();
    const filtered = fileVideos.filter((v) => v.id !== id);
    const deletedFromFile = filtered.length !== fileVideos.length;
    await saveFileStorage(filtered);
    // Invalidate Redis video cache
    await invalidateVideoCache(id);
    return deletedFromMongo || deletedFromFile;
  } catch (error) {
    console.error("Error deleting video from file storage:", error);
    await invalidateVideoCache(id);
    return deletedFromMongo;
  }
}


