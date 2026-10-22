import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { EventModel } from "@/models/Event";
import type { SportEvent } from "@/data/events";

export type CreateEventInput = {
  id?: string;
  title: string;
  discipline: string;
  category?: "Championship" | "League" | "Trials" | "Camp" | string;
  city: string;
  venue: string;
  address?: string;
  startDate: string;
  endDate: string;
  status?: "Upcoming" | "Ongoing" | "Completed" | string;
  entryFee?: string;
  slots?: number | string;
  image?: string;
  summary?: string;
  eventType?: "upcoming" | "calendar" | "my-first-championship" | "flagship" | "championship";
  registrationLive?: boolean;
  month?: string;
  year?: number;
  tier?: string;
  stars?: number;
  rules?: string[];
  equipment?: string[];
  topNotice?: {
    hotelInfo?: string;
    staffInfo?: string;
    staffLink?: string;
  };
  prices?: {
    earlyBird?: string;
    earlyBirdDeadline?: string;
    standard?: string;
    standardDeadline?: string;
    spectatorFee?: string;
    parkingFee?: string;
  };
  relevantDates?: {
    affiliationDeadline?: string;
    registrationDeadline?: string;
    athleteCorrectionDeadline?: string;
    professorCorrectionPeriod?: string;
    registrationCheckday?: string;
    scheduleReleaseDate?: string;
    bracketsReleaseDate?: string;
  };
  divisions?: {
    birthYear: string;
    ageDivision: string;
    belts: string;
    weightLimit?: string;
  }[];
  openClass?: {
    available: boolean;
    description: string;
  };
  awards?: {
    medalRules?: string;
    trophyCategories?: string[];
  };
  tshirtInfo?: {
    description?: string;
  };
  prohibitedItems?: string[];
  mediaAccreditation?: {
    description?: string;
    applicationLink?: string;
  };
  organization?: {
    organizer?: string;
    sanctioningBody?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  importantInfo?: {
    registrationPolicy?: string;
    refundPolicy?: string;
    competitionDayWeighIn?: string;
  };
  mapLocation?: {
    address?: string;
    embedUrl?: string;
    directions?: string;
  };
  quickLinks?: {
    athletesByTeamsUrl?: string;
    athletesByDivisionsUrl?: string;
    weightChartUrl?: string;
    weighInsUrl?: string;
  };
  participatingAcademies?: {
    id?: string;
    name: string;
    city?: string;
    logo?: string;
    athleteCount?: number;
  }[];
  schedule?: {
    schedulePdfUrl?: string;
    orderOfBoutsUrl?: string;
    timeline?: { time: string; activity: string; mat?: string }[];
  };
  drawFixtures?: {
    bracketsPdfUrl?: string;
    drawUrl?: string;
    liveScoreUrl?: string;
  };
  resultsArchiveId?: string;
  liveResults?: {
    status?: "Pending" | "Live" | "Concluded";
    liveStreamUrl?: string;
    topPodium?: { gold?: string; silver?: string; bronze?: string };
  };
  media?: {
    photos?: { src: string; title: string; category?: string }[];
    videos?: { title: string; videoUrl: string; duration?: string; thumb?: string; desc?: string }[];
  };
};

let cachedEvents: SportEvent[] = [];

// Fallback JSON file storage helpers
async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(process.cwd(), "src", "data", "storage", "events.json");
  const nestedPath = path.join(process.cwd(), "sportify-pro-builder-main", "src", "data", "storage", "events.json");

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

async function getFileEvents(): Promise<SportEvent[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (!raw || !raw.trim()) return cachedEvents;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedEvents = parsed as SportEvent[];
        return parsed as SportEvent[];
      }
      return cachedEvents;
    } catch {
      return cachedEvents;
    }
  } catch {
    return cachedEvents;
  }
}

async function saveFileEvents(items: SportEvent[]): Promise<void> {
  cachedEvents = items;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, JSON.stringify(items, null, 2), "utf-8");
    await fs.rename(tempFile, file);
  } catch {
    try {
      const file = await ensureFileStorage();
      await fs.writeFile(file, JSON.stringify(items, null, 2), "utf-8");
    } catch (err) {
      console.warn("Notice: Could not save to events.json fallback (read-only filesystem):", err instanceof Error ? err.message : "");
    }
  }
}

export async function generateNextEventId(prefix: string = "EVT"): Promise<string> {
  const cleanPrefix = (prefix || "EVT").toUpperCase();
  const regex = new RegExp(`^${cleanPrefix}-(\\d{4})-(\\d+)`, "i");
  const currentYear = new Date().getFullYear();
  let highestNum = 0;

  try {
    await connectToDatabase();
    const docs = await EventModel.find({ id: { $regex: new RegExp(`^${cleanPrefix}-`, "i") } }, "id").lean();
    for (const doc of docs) {
      const match = doc.id.match(regex);
      if (match && match[2]) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  } catch {
    const fileList = await getFileEvents();
    for (const item of fileList) {
      const match = item.id.match(regex);
      if (match && match[2]) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    }
  }

  const nextNum = String(highestNum + 1).padStart(2, "0");
  return `${cleanPrefix}-${currentYear}-${nextNum}`;
}

export function computeEventStatus(startDateStr: string, endDateStr: string): "Upcoming" | "Ongoing" | "Completed" {
  const today = new Date().toISOString().split("T")[0];
  if (startDateStr > today) {
    return "Upcoming";
  } else if (endDateStr < today) {
    return "Completed";
  } else {
    return "Ongoing";
  }
}

export function validateEventDates(startDateStr: string, endDateStr: string, _status?: string): void {
  if (!startDateStr || !endDateStr) {
    throw new Error("Start date and end date are required");
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime())) {
    throw new Error("Invalid start date format");
  }
  if (isNaN(end.getTime())) {
    throw new Error("Invalid end date format");
  }

  // Base rule: Ending date must be on or after start date
  if (end < start) {
    throw new Error("Ending date must be on or after the starting date");
  }
}

export async function getEvents(): Promise<SportEvent[]> {
  try {
    await connectToDatabase();
    const docs = await EventModel.find({}).sort({ startDate: 1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      title: d.title,
      discipline: d.discipline,
      category: d.category || "Championship",
      city: d.city,
      venue: d.venue,
      address: d.address,
      startDate: d.startDate,
      endDate: d.endDate,
      status: d.status || computeEventStatus(d.startDate, d.endDate),
      entryFee: d.entryFee || "Free",
      slots: Number(d.slots) || 64,
      image: d.image || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
      summary: d.summary || "",
      eventType: d.eventType || "upcoming",
      registrationLive: d.registrationLive !== undefined ? d.registrationLive : true,
      month: d.month || "APR",
      year: d.year || 2026,
      tier: d.tier || "National Championship",
      stars: d.stars || 5,
      rules: d.rules || [],
      equipment: d.equipment || [],
      topNotice: d.topNotice,
      prices: d.prices,
      relevantDates: d.relevantDates,
      divisions: d.divisions,
      openClass: d.openClass,
      awards: d.awards,
      tshirtInfo: d.tshirtInfo,
      prohibitedItems: d.prohibitedItems,
      mediaAccreditation: d.mediaAccreditation,
      organization: d.organization,
      importantInfo: d.importantInfo,
      mapLocation: d.mapLocation,
      quickLinks: d.quickLinks,
      participatingAcademies: d.participatingAcademies || [],
      schedule: d.schedule,
      drawFixtures: d.drawFixtures,
      resultsArchiveId: d.resultsArchiveId,
      liveResults: d.liveResults,
      media: d.media,
    }));
  } catch (error) {
    console.warn("MongoDB access note (events): Falling back to persistent file storage.", error instanceof Error ? error.message : "");
    return getFileEvents();
  }
}

export async function getEventById(id: string): Promise<SportEvent | null> {
  const cleanId = id.trim();
  try {
    await connectToDatabase();
    const d: any = await EventModel.findOne({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    }).lean();

    if (d) {
      return {
        id: d.id,
        title: d.title,
        discipline: d.discipline,
        category: d.category || "Championship",
        city: d.city,
        venue: d.venue,
        address: d.address,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status || computeEventStatus(d.startDate, d.endDate),
        entryFee: d.entryFee || "Free",
        slots: Number(d.slots) || 64,
        image: d.image || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
        summary: d.summary || "",
        eventType: d.eventType || "upcoming",
        registrationLive: d.registrationLive !== undefined ? d.registrationLive : true,
        month: d.month || "APR",
        year: d.year || 2026,
        tier: d.tier || "National Championship",
        stars: d.stars || 5,
        rules: d.rules || [],
        equipment: d.equipment || [],
        topNotice: d.topNotice,
        prices: d.prices,
        relevantDates: d.relevantDates,
        divisions: d.divisions,
        openClass: d.openClass,
        awards: d.awards,
        tshirtInfo: d.tshirtInfo,
        prohibitedItems: d.prohibitedItems,
        mediaAccreditation: d.mediaAccreditation,
        organization: d.organization,
        importantInfo: d.importantInfo,
        mapLocation: d.mapLocation,
        quickLinks: d.quickLinks,
        participatingAcademies: d.participatingAcademies || [],
        schedule: d.schedule,
        drawFixtures: d.drawFixtures,
        resultsArchiveId: d.resultsArchiveId,
        liveResults: d.liveResults,
        media: d.media,
      };
    }
  } catch {
    // Fallback
  }

  const fileList = await getFileEvents();
  return fileList.find((e) => e.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

export async function createEvent(input: CreateEventInput): Promise<SportEvent> {
  const status = (input.status as any) || computeEventStatus(input.startDate, input.endDate);
  validateEventDates(input.startDate, input.endDate, status);

  const defaultPrefix = input.eventType === "championship" ? "CHAMP" : "EVT";
  const id = input.id?.trim() || (await generateNextEventId(defaultPrefix));
  const category = (input.category as any) || "Championship";
  const slots = Number(input.slots) || 64;
  const entryFee = input.entryFee?.trim() || "Free";
  const image = input.image?.trim() || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80";

  const eventData: SportEvent = {
    id,
    title: input.title.trim(),
    discipline: input.discipline.trim(),
    category,
    city: input.city.trim(),
    venue: input.venue.trim(),
    address: input.address?.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    status,
    entryFee,
    slots,
    image,
    summary: input.summary?.trim() || "",
    eventType: input.eventType || "upcoming",
    registrationLive: input.registrationLive !== undefined ? input.registrationLive : true,
    month: input.month || "APR",
    year: input.year || 2026,
    tier: input.tier || "National Championship",
    stars: input.stars || 5,
    rules: input.rules || [],
    equipment: input.equipment || [],
    topNotice: input.topNotice,
    prices: input.prices,
    relevantDates: input.relevantDates,
    divisions: input.divisions,
    openClass: input.openClass,
    awards: input.awards,
    tshirtInfo: input.tshirtInfo,
    prohibitedItems: input.prohibitedItems,
    mediaAccreditation: input.mediaAccreditation,
    organization: input.organization,
    importantInfo: input.importantInfo,
    mapLocation: input.mapLocation,
    quickLinks: input.quickLinks,
    participatingAcademies: input.participatingAcademies || [],
    schedule: input.schedule,
    drawFixtures: input.drawFixtures,
    resultsArchiveId: input.resultsArchiveId,
    liveResults: input.liveResults,
    media: input.media,
  };

  try {
    await connectToDatabase();
    await EventModel.create(eventData);
  } catch (error) {
    console.warn("MongoDB create failed, writing to fallback file:", error);
    const fileList = await getFileEvents();
    fileList.unshift(eventData);
    await saveFileEvents(fileList);
  }

  return eventData;
}

export async function updateEvent(id: string, input: Partial<CreateEventInput>): Promise<SportEvent> {
  const existing = await getEventById(id);
  if (!existing) {
    throw new Error(`Event with ID "${id}" not found`);
  }

  const startDate = input.startDate ?? existing.startDate;
  const endDate = input.endDate ?? existing.endDate;
  const status = input.status ?? existing.status;
  validateEventDates(startDate, endDate, status);

  const updatedData: SportEvent = {
    ...existing,
    ...(input.title !== undefined && { title: input.title.trim() }),
    ...(input.discipline !== undefined && { discipline: input.discipline.trim() }),
    ...(input.category !== undefined && { category: input.category as any }),
    ...(input.city !== undefined && { city: input.city.trim() }),
    ...(input.venue !== undefined && { venue: input.venue.trim() }),
    ...(input.address !== undefined && { address: input.address?.trim() }),
    ...(input.startDate !== undefined && { startDate: input.startDate.trim() }),
    ...(input.endDate !== undefined && { endDate: input.endDate.trim() }),
    ...(input.status !== undefined && { status: input.status as any }),
    ...(input.entryFee !== undefined && { entryFee: input.entryFee.trim() }),
    ...(input.slots !== undefined && { slots: Number(input.slots) || existing.slots }),
    ...(input.image !== undefined && { image: input.image.trim() }),
    ...(input.summary !== undefined && { summary: input.summary.trim() }),
    ...(input.eventType !== undefined && { eventType: input.eventType }),
    ...(input.registrationLive !== undefined && { registrationLive: input.registrationLive }),
    ...(input.month !== undefined && { month: input.month }),
    ...(input.year !== undefined && { year: input.year }),
    ...(input.tier !== undefined && { tier: input.tier }),
    ...(input.stars !== undefined && { stars: input.stars }),
    ...(input.rules !== undefined && { rules: input.rules }),
    ...(input.equipment !== undefined && { equipment: input.equipment }),
    ...(input.topNotice !== undefined && { topNotice: input.topNotice }),
    ...(input.prices !== undefined && { prices: input.prices }),
    ...(input.relevantDates !== undefined && { relevantDates: input.relevantDates }),
    ...(input.divisions !== undefined && { divisions: input.divisions }),
    ...(input.openClass !== undefined && { openClass: input.openClass }),
    ...(input.awards !== undefined && { awards: input.awards }),
    ...(input.tshirtInfo !== undefined && { tshirtInfo: input.tshirtInfo }),
    ...(input.prohibitedItems !== undefined && { prohibitedItems: input.prohibitedItems }),
    ...(input.mediaAccreditation !== undefined && { mediaAccreditation: input.mediaAccreditation }),
    ...(input.organization !== undefined && { organization: input.organization }),
    ...(input.importantInfo !== undefined && { importantInfo: input.importantInfo }),
    ...(input.mapLocation !== undefined && { mapLocation: input.mapLocation }),
    ...(input.quickLinks !== undefined && { quickLinks: input.quickLinks }),
    ...(input.participatingAcademies !== undefined && { participatingAcademies: input.participatingAcademies }),
    ...(input.schedule !== undefined && { schedule: input.schedule }),
    ...(input.drawFixtures !== undefined && { drawFixtures: input.drawFixtures }),
    ...(input.resultsArchiveId !== undefined && { resultsArchiveId: input.resultsArchiveId }),
    ...(input.liveResults !== undefined && { liveResults: input.liveResults }),
    ...(input.media !== undefined && { media: input.media }),
  };

  try {
    await connectToDatabase();
    await EventModel.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${id.trim()}$`, "i") } },
      { $set: updatedData },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.warn("MongoDB update failed, saving to fallback file:", error);
  }

  // Always update file store as well
  const fileList = await getFileEvents();
  const index = fileList.findIndex((e) => e.id.toLowerCase() === id.trim().toLowerCase());
  if (index >= 0) {
    fileList[index] = updatedData;
    await saveFileEvents(fileList);
  }

  return updatedData;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const cleanId = id.trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await EventModel.findOneAndDelete({
      id: { $regex: new RegExp(`^${cleanId}$`, "i") },
    });
    if (res) deleted = true;
  } catch (error) {
    console.warn("MongoDB delete error:", error);
  }

  const fileList = await getFileEvents();
  const nextList = fileList.filter((e) => e.id.toLowerCase() !== cleanId.toLowerCase());
  if (nextList.length !== fileList.length) {
    await saveFileEvents(nextList);
    deleted = true;
  }

  return deleted;
}
