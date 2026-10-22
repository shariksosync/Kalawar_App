import type { VideoType } from "@/types/video";

export interface ParsedVideoInfo {
  type: "youtube" | "vimeo" | "drive" | "direct" | "other";
  videoType: VideoType;
  videoId: string;
  embedUrl: string;
  directUrl?: string;
  thumbnailUrl: string;
  defaultThumbnail: string;
  platformLabel: string;
}

export function parseVideoUrl(url: string): ParsedVideoInfo {
  const cleanUrl = (url || "").trim();

  // YouTube matchers: youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /v/ID, /shorts/ID, /live/ID
  const youtubeMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );

  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return {
      type: "youtube",
      videoType: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      directUrl: cleanUrl,
      thumbnailUrl: thumb,
      defaultThumbnail: thumb,
      platformLabel: "YouTube",
    };
  }

  // Universal Google Drive matchers: covers /file/d/ID, /file/u/0/d/ID, /u/0/file/d/ID, /open?id=ID, /uc?id=ID, /uc?export=download&id=ID, docs.google.com/file/d/ID, drive.usercontent.google.com/download?id=ID
  const driveMatch = cleanUrl.match(
    /(?:drive\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|(?:u\/\d+\/)?file\/d\/|open\?id=|uc\?id=|uc\?export=download&id=|drive\/folders\/)|docs\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|(?:u\/\d+\/)?file\/d\/)|drive\.usercontent\.google\.com\/download\?id=)([a-zA-Z0-9_-]{20,})/i
  ) || (
    /(?:drive\.google\.com|docs\.google\.com|googleusercontent\.com)/i.test(cleanUrl)
      ? cleanUrl.match(/([a-zA-Z0-9_-]{25,})/)
      : null
  );

  if (driveMatch) {
    const fileId = driveMatch[1];
    if (fileId) {
      const thumb = `https://lh3.googleusercontent.com/d/${fileId}`;
      return {
        type: "drive",
        videoType: "drive",
        videoId: fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `/api/video-stream?id=${fileId}`,
        thumbnailUrl: thumb,
        defaultThumbnail: thumb,
        platformLabel: "Google Drive",
      };
    }
  }

  // Vimeo matchers
  const vimeoMatch = cleanUrl.match(
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+))/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    const thumb = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop";
    return {
      type: "vimeo",
      videoType: "vimeo",
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      directUrl: cleanUrl,
      thumbnailUrl: thumb,
      defaultThumbnail: thumb,
      platformLabel: "Vimeo",
    };
  }

  // Direct MP4 / WebM / Streaming
  if (/\.(mp4|webm|ogv|mov|m3u8)(\?.*)?$/i.test(cleanUrl)) {
    const thumb = "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1200&auto=format&fit=crop";
    return {
      type: "direct",
      videoType: "mp4",
      videoId: "",
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
      thumbnailUrl: thumb,
      defaultThumbnail: thumb,
      platformLabel: "Direct Stream",
    };
  }

  const thumb = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop";
  return {
    type: "other",
    videoType: "other",
    videoId: "",
    embedUrl: cleanUrl,
    directUrl: cleanUrl,
    thumbnailUrl: thumb,
    defaultThumbnail: thumb,
    platformLabel: "External Video",
  };
}

export const parseVideoSource = parseVideoUrl;


