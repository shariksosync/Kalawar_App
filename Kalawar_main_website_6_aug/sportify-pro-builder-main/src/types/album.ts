export const ALBUM_CATEGORIES = [
  "Championship Photos",
  "Tournament Photos",
  "Training Camps",
  "Belt Examination",
  "Coach / Referee Programs",
  "Award & Felicitation",
  "Academy Activities",
  "Federation Events",
] as const;

export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];

export interface IPhotoItem {
  id: string;
  url: string;
  caption?: string;
  photographer?: string;
  order: number;
}

export interface IAlbum {
  id: string;
  title: string;
  slug: string;
  category: AlbumCategory | string;
  eventName?: string;
  eventLink?: string;
  date: string;
  venue: string;
  state?: string;
  district?: string;
  coverPhoto: string;
  description?: string;
  photographerCredit?: string;
  photos: IPhotoItem[];
  status: "Published" | "Draft" | "Archived";
  pinned?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

