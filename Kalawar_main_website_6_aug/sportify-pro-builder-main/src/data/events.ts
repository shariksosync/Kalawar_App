import { IMAGES } from "./images";

export type SportEvent = {
  id: string;
  slug?: string;
  title: string;
  discipline: string;
  category: "Championship" | "League" | "Trials" | "Camp" | string;
  city: string;
  state?: string;
  venue: string;
  address?: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Ongoing" | "Completed" | string;
  entryFee: string;
  slots: number;
  image: string;
  summary: string;
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
  participatingAcademies?: {
    id?: string;
    name: string;
    city?: string;
    logo?: string;
    athleteCount?: number;
  }[];
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

export const events: SportEvent[] = [];

export type TournamentResult = {
  id: string;
  tournament: string;
  discipline: string;
  season: string;
  winner: string;
  runnerUp: string;
  thirdPlace: string;
  medals: { gold: number; silver: number; bronze: number };
  mvp: string;
  image: string;
};

export const results: TournamentResult[] = [
  {
    id: "RES-01",
    tournament: "Continental Football Cup",
    discipline: "Football",
    season: "2025–26",
    winner: "Titan Athletic Club",
    runnerUp: "Royal Crest Club",
    thirdPlace: "Northline Academy",
    medals: { gold: 12, silver: 12, bronze: 24 },
    mvp: "Aarav Mehra",
    image: IMAGES.football,
  },
  {
    id: "RES-02",
    tournament: "National Athletics Grand Prix",
    discipline: "Athletics",
    season: "2025–26",
    winner: "Maharashtra Federation",
    runnerUp: "Karnataka Federation",
    thirdPlace: "Punjab Federation",
    medals: { gold: 18, silver: 18, bronze: 18 },
    mvp: "Amara Okafor",
    image: IMAGES.athletics,
  },
  {
    id: "RES-03",
    tournament: "Junior Cricket Championship",
    discipline: "Cricket",
    season: "2025–26",
    winner: "Meridian Sports Academy",
    runnerUp: "Apex Performance Club",
    thirdPlace: "Vanguard Institute",
    medals: { gold: 15, silver: 15, bronze: 30 },
    mvp: "Rohan Kapoor",
    image: IMAGES.cricket,
  },
  {
    id: "RES-04",
    tournament: "Aquatics National Meet",
    discipline: "Swimming",
    season: "2025–26",
    winner: "Kerala Aquatics",
    runnerUp: "Delhi Aquatics",
    thirdPlace: "Gujarat Aquatics",
    medals: { gold: 22, silver: 22, bronze: 22 },
    mvp: "Sofia Alvarez",
    image: IMAGES.swimming,
  },
];

export const medalTally = [
  { state: "Maharashtra", gold: 42, silver: 31, bronze: 28 },
  { state: "Karnataka", gold: 36, silver: 34, bronze: 30 },
  { state: "Delhi", gold: 31, silver: 27, bronze: 33 },
  { state: "Punjab", gold: 28, silver: 25, bronze: 21 },
  { state: "Kerala", gold: 24, silver: 29, bronze: 26 },
  { state: "Tamil Nadu", gold: 22, silver: 20, bronze: 24 },
];

export const performanceTrend = [
  { year: "2020", players: 68000, events: 420 },
  { year: "2021", players: 84000, events: 510 },
  { year: "2022", players: 106000, events: 640 },
  { year: "2023", players: 132000, events: 790 },
  { year: "2024", players: 158000, events: 960 },
  { year: "2025", players: 178000, events: 1120 },
  { year: "2026", players: 197400, events: 1284 },
];
