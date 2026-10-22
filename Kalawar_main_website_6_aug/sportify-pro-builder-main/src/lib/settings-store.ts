import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { SettingsModel } from "@/models/Settings";
import { type WebsiteSettings, defaultSettings } from "@/types/settings";
import { withRedisCache, invalidateSettingsAndIntroVideoCache } from "./redis";
export type { WebsiteSettings };
export { defaultSettings };

let cachedSettings: WebsiteSettings = { ...defaultSettings };

async function ensureSettingsFile(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "settings.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "settings.json");

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
        await fs.writeFile(primaryPath, JSON.stringify(defaultSettings, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

async function getFileSettings(): Promise<WebsiteSettings> {
  try {
    const file = await ensureSettingsFile();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return cachedSettings;
    const parsed = JSON.parse(raw) as Partial<WebsiteSettings>;
    cachedSettings = { ...defaultSettings, ...parsed };
    return cachedSettings;
  } catch {
    return cachedSettings;
  }
}

async function saveFileSettings(settings: WebsiteSettings): Promise<void> {
  cachedSettings = settings;
  try {
    const file = await ensureSettingsFile();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(settings, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(settings, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (err) {
    console.warn("Notice: Could not save settings to local file fallback (read-only filesystem):", err instanceof Error ? err.message : "");
  }
}

async function fetchRawSettings(): Promise<WebsiteSettings> {
  try {
    await connectToDatabase();
    let doc = await SettingsModel.findOne();
    if (!doc) {
      // Initialize default settings document in DB
      doc = await SettingsModel.create(defaultSettings);
    }
    const settings: WebsiteSettings = {
      federationName: doc.federationName || defaultSettings.federationName,
      contactEmail: doc.contactEmail || defaultSettings.contactEmail,
      contactPhone: doc.contactPhone || defaultSettings.contactPhone,
      activeSeason: doc.activeSeason || defaultSettings.activeSeason,
      address: doc.address || defaultSettings.address,
      googleMapsUrl: doc.googleMapsUrl || defaultSettings.googleMapsUrl,
      acceptRegistrations: true,
      publishResults: true,
      maintenanceMode: doc.maintenanceMode ?? defaultSettings.maintenanceMode,
      enableShop: true,
      announcementBanner: doc.announcementBanner || defaultSettings.announcementBanner || "",
      announcementBannerEnabled: doc.announcementBannerEnabled ?? defaultSettings.announcementBannerEnabled ?? true,
      introVideoEnabled: doc.introVideoEnabled ?? defaultSettings.introVideoEnabled,
      introVideoUrl: doc.introVideoUrl || defaultSettings.introVideoUrl,
      introVideoFrequency: (doc.introVideoFrequency as any) || defaultSettings.introVideoFrequency,
      introVideoTitle: doc.introVideoTitle || defaultSettings.introVideoTitle,
      introVideoTagline: doc.introVideoTagline || defaultSettings.introVideoTagline,
      bannerSlides: Array.isArray(doc.bannerSlides) && doc.bannerSlides.length > 0 ? (doc.bannerSlides as any) : defaultSettings.bannerSlides,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    };
    // Keep local cache in sync
    await saveFileSettings(settings);
    return settings;
  } catch (dbErr) {
    console.warn("Falling back to local settings storage:", dbErr);
    const s = await getFileSettings();
    return { ...defaultSettings, ...s, acceptRegistrations: true, publishResults: true, enableShop: true };
  }
}

export async function getSettings(): Promise<WebsiteSettings> {
  return withRedisCache<WebsiteSettings>("cache:settings", 300, fetchRawSettings);
}

export async function updateSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  let updated: WebsiteSettings;

  try {
    await connectToDatabase();
    let doc = await SettingsModel.findOne();
    if (!doc) {
      doc = new SettingsModel({ ...defaultSettings, ...data, acceptRegistrations: true, publishResults: true, enableShop: true });
    } else {
      if (data.federationName !== undefined) doc.federationName = data.federationName.trim();
      if (data.contactEmail !== undefined) doc.contactEmail = data.contactEmail.trim();
      if (data.contactPhone !== undefined) doc.contactPhone = data.contactPhone.trim();
      if (data.activeSeason !== undefined) doc.activeSeason = data.activeSeason.trim();
      if (data.address !== undefined) doc.address = data.address.trim();
      if (data.googleMapsUrl !== undefined) doc.googleMapsUrl = data.googleMapsUrl.trim();
      doc.acceptRegistrations = true;
      doc.publishResults = true;
      if (data.maintenanceMode !== undefined) doc.maintenanceMode = Boolean(data.maintenanceMode);
      doc.enableShop = true;
      if (data.announcementBanner !== undefined) doc.announcementBanner = data.announcementBanner.trim();
      if (data.announcementBannerEnabled !== undefined) doc.announcementBannerEnabled = Boolean(data.announcementBannerEnabled);
      if (data.introVideoEnabled !== undefined) doc.introVideoEnabled = Boolean(data.introVideoEnabled);
      if (data.introVideoUrl !== undefined) doc.introVideoUrl = data.introVideoUrl.trim();
      if (data.introVideoFrequency !== undefined) doc.introVideoFrequency = data.introVideoFrequency;
      if (data.introVideoTitle !== undefined) doc.introVideoTitle = data.introVideoTitle.trim();
      if (data.introVideoTagline !== undefined) doc.introVideoTagline = data.introVideoTagline.trim();
      if (data.bannerSlides !== undefined) (doc as any).bannerSlides = data.bannerSlides;
    }
    await doc.save();

    updated = {
      federationName: doc.federationName,
      contactEmail: doc.contactEmail,
      contactPhone: doc.contactPhone,
      activeSeason: doc.activeSeason,
      address: doc.address,
      googleMapsUrl: doc.googleMapsUrl || defaultSettings.googleMapsUrl,
      acceptRegistrations: true,
      publishResults: true,
      maintenanceMode: doc.maintenanceMode,
      enableShop: true,
      announcementBanner: doc.announcementBanner,
      announcementBannerEnabled: doc.announcementBannerEnabled ?? true,
      introVideoEnabled: doc.introVideoEnabled,
      introVideoUrl: doc.introVideoUrl,
      introVideoFrequency: doc.introVideoFrequency as any,
      introVideoTitle: doc.introVideoTitle,
      introVideoTagline: doc.introVideoTagline,
      bannerSlides: Array.isArray((doc as any).bannerSlides) && (doc as any).bannerSlides.length > 0 ? (doc as any).bannerSlides : defaultSettings.bannerSlides,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    };
  } catch (dbErr) {
    console.warn("Database unavailable during settings update, saving to local storage:", dbErr);
    const existing = await getFileSettings();
    updated = {
      ...defaultSettings,
      ...existing,
      ...data,
      acceptRegistrations: true,
      publishResults: true,
      enableShop: true,
      updatedAt: new Date().toISOString(),
    };
  }

  await saveFileSettings(updated);
  // Auto-invalidate Redis and in-memory caches
  await invalidateSettingsAndIntroVideoCache();
  return updated;
}
