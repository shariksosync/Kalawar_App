export const VIDEO_CATEGORIES = [
  "Championship Videos",
  "KALAWAR Event Videos",
  "Training Videos",
  "Belt Exam Videos",
  "Seminar Videos",
  "Federation Videos",
  "Coach / Referee Workshops",
  "Athlete & Match Highlights",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export type VideoType = "youtube" | "vimeo" | "drive" | "mp4" | "other";

export interface IVideo {
  id: string;
  title: string;
  slug: string;
  category: VideoCategory | string;
  videoUrl: string;
  videoType: VideoType;
  videoId?: string;
  thumbnailUrl: string;
  duration?: string;
  eventName?: string;
  eventLink?: string;
  date: string;
  venue?: string;
  state?: string;
  district?: string;
  description?: string;
  channelOrCredit?: string;
  status: "Published" | "Draft" | "Archived";
  pinned?: boolean;
  views?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

