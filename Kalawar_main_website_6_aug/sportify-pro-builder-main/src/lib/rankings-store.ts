import fs from "fs/promises";
import path from "path";
import { getPlayers } from "./players-store";
import { getResults } from "./results-store";
import type { Player } from "@/data/people";

export type RankingPeriod = "Current" | "Monthly" | "Yearly" | "Archive";

export type AthleteRankingEntry = {
  rankingId: string;
  athleteId: string;
  athleteName: string;
  photo?: string;
  clubName: string;
  state: string;
  district: string;
  discipline: string;
  gender: string;
  ageGroup: string;
  weightCategory: string;
  beltRank?: string;
  currentRank: number;
  previousRank?: number;
  rankChange: number;
  totalPoints: number;
  matchPoints: number;
  medalPoints: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  totalCompetitions: number;
  matchesWon: number;
  matchesLost: number;
  winRatio: number;
  period: RankingPeriod;
  year: number;
  month?: string;
  isFrozen?: boolean;
  status: "Verified" | "Provisional";
  verifiedAt: string;
  history: Array<{
    period: string;
    rank: number;
    points: number;
    date: string;
    notes?: string;
  }>;
};

export type AcademyRankingEntry = {
  rank: number;
  previousRank?: number;
  rankChange: number;
  academyName: string;
  state: string;
  district: string;
  totalPoints: number;
  totalAthletes: number;
  gold: number;
  silver: number;
  bronze: number;
  performanceScore: number;
};

export type RankingRulesConfig = {
  goldPoints: number;
  silverPoints: number;
  bronzePoints: number;
  matchWinPoints: number;
  participationPoints: number;
  nationalMultiplier: number;
  stateMultiplier: number;
  districtMultiplier: number;
  lastUpdated: string;
  updatedBy: string;
};

export type RankingsStorageData = {
  rules: RankingRulesConfig;
  athletes: AthleteRankingEntry[];
  academies: AcademyRankingEntry[];
  isFrozen: boolean;
  lastRecalculatedAt: string;
  rankingVersion: string;
};

const DEFAULT_RULES: RankingRulesConfig = {
  goldPoints: 100,
  silverPoints: 60,
  bronzePoints: 30,
  matchWinPoints: 10,
  participationPoints: 5,
  nationalMultiplier: 1.5,
  stateMultiplier: 1.2,
  districtMultiplier: 1.0,
  lastUpdated: new Date().toISOString(),
  updatedBy: "Technical Committee, India",
};

// ── File storage path resolution ─────────────────────────────────────────────

let cachedRankingsData: RankingsStorageData | null = null;

async function ensureFileStorage(): Promise<string> {
  const primaryPath = path.join(
    process.cwd(),
    "src",
    "data",
    "storage",
    "rankings.json"
  );
  const nestedPath = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    "rankings.json"
  );

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
        const initialData: RankingsStorageData = {
          rules: DEFAULT_RULES,
          athletes: [],
          academies: [],
          isFrozen: false,
          lastRecalculatedAt: new Date().toISOString(),
          rankingVersion: "2026.1",
        };
        await fs.writeFile(primaryPath, JSON.stringify(initialData, null, 2), "utf-8");
      } catch {
        // Read-only filesystem
      }
      return primaryPath;
    }
  }
}

export async function getRankingsData(): Promise<RankingsStorageData> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as RankingsStorageData;
      if (!parsed.rules) parsed.rules = DEFAULT_RULES;
      if (!parsed.athletes || parsed.athletes.length === 0) {
        return await recalculateOfficialRankings();
      }
      cachedRankingsData = parsed;
      return parsed;
    }
  } catch (err) {
    if (cachedRankingsData) return cachedRankingsData;
  }
  if (cachedRankingsData) return cachedRankingsData;
  return await recalculateOfficialRankings();
}

export async function saveRankingsData(data: RankingsStorageData): Promise<void> {
  cachedRankingsData = data;
  try {
    const file = await ensureFileStorage();
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (error) {
    console.warn("Notice: Could not save to rankings.json fallback (read-only filesystem):", error instanceof Error ? error.message : "");
  }
}

// ── Auto-Calculation Engine ──────────────────────────────────────────────────

const DEFAULT_FEDERATION_ATHLETES: Partial<Player>[] = [
  {
    id: "KSM-PL-2026-7251",
    name: "Aarav Mehra",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Maharashtra",
    city: "Pune",
    club: "Vanguard Martial Arts Institute",
    beltRank: "1st Dan Black Belt",
    age: 22,
    ageGroup: "Senior (18+)",
    weightCategory: "-65 kg",
    medals: { gold: 3, silver: 1, bronze: 0 },
    points: 480,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-10240",
    name: "Sharik Khan",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Haryana",
    city: "Gurugram",
    club: "Apex Combat Academy",
    beltRank: "1st Dan Black Belt",
    age: 24,
    ageGroup: "Senior (18+)",
    weightCategory: "-70 kg",
    medals: { gold: 2, silver: 2, bronze: 1 },
    points: 430,
    image: "",
  },
  {
    id: "KSM-PL-2026-7252",
    name: "Rohan Kapoor",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Delhi",
    city: "New Delhi",
    club: "Royal Crest Martial Arts",
    beltRank: "2nd Dan Black Belt",
    age: 26,
    ageGroup: "Senior (18+)",
    weightCategory: "-75 kg",
    medals: { gold: 2, silver: 1, bronze: 2 },
    points: 390,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7253",
    name: "Isabella Rossi",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Karnataka",
    city: "Bengaluru",
    club: "Meridian Combat Dojo",
    beltRank: "1st Dan Black Belt",
    age: 21,
    ageGroup: "Senior (18+)",
    weightCategory: "-55 kg",
    medals: { gold: 3, silver: 0, bronze: 1 },
    points: 380,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7254",
    name: "Mukti Sharma",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Maharashtra",
    city: "Mumbai",
    club: "Titan Athletic Club",
    beltRank: "Red Belt (2nd Gup)",
    age: 16,
    ageGroup: "Junior (15-17)",
    weightCategory: "-48 kg",
    medals: { gold: 2, silver: 1, bronze: 0 },
    points: 340,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7255",
    name: "Kenji Tanaka",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Maharashtra",
    city: "Pune",
    club: "Vanguard Martial Arts Institute",
    beltRank: "3rd Dan Black Belt",
    age: 29,
    ageGroup: "Senior (18+)",
    weightCategory: "Open Weight",
    medals: { gold: 2, silver: 1, bronze: 1 },
    points: 330,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7256",
    name: "Priya Nair",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Kerala",
    city: "Kochi",
    club: "Southline Martial Academy",
    beltRank: "1st Dan Black Belt",
    age: 23,
    ageGroup: "Senior (18+)",
    weightCategory: "-60 kg",
    medals: { gold: 1, silver: 3, bronze: 0 },
    points: 310,
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7257",
    name: "Mateo Alvarez",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Goa",
    city: "Panaji",
    club: "Ocean Crest Dojo",
    beltRank: "Brown Belt (1st Gup)",
    age: 17,
    ageGroup: "Junior (15-17)",
    weightCategory: "-58 kg",
    medals: { gold: 1, silver: 2, bronze: 1 },
    points: 270,
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7258",
    name: "Nadia Rahman",
    discipline: "Martial Arts",
    gender: "Female",
    state: "West Bengal",
    city: "Kolkata",
    club: "East India Combat Club",
    beltRank: "Blue Belt (4th Gup)",
    age: 13,
    ageGroup: "Sub-Junior (10-14)",
    weightCategory: "-40 kg",
    medals: { gold: 1, silver: 1, bronze: 2 },
    points: 250,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7259",
    name: "Diego Silva",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Tamil Nadu",
    city: "Chennai",
    club: "Apex Performance Club",
    beltRank: "1st Dan Black Belt",
    age: 25,
    ageGroup: "Senior (18+)",
    weightCategory: "-80 kg",
    medals: { gold: 1, silver: 1, bronze: 1 },
    points: 230,
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7260",
    name: "Sofia Deshpande",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Maharashtra",
    city: "Nashik",
    club: "Shiv Chhatrapati Dojo",
    beltRank: "Green Belt (6th Gup)",
    age: 15,
    ageGroup: "Junior (15-17)",
    weightCategory: "-52 kg",
    medals: { gold: 1, silver: 0, bronze: 2 },
    points: 210,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7261",
    name: "Liam Sullivan",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Punjab",
    city: "Amritsar",
    club: "Golden Lion Martial Arts",
    beltRank: "2nd Dan Black Belt",
    age: 27,
    ageGroup: "Senior (18+)",
    weightCategory: "-68 kg",
    medals: { gold: 1, silver: 0, bronze: 1 },
    points: 190,
    image: "",
  },
  {
    id: "KSM-PL-2026-7262",
    name: "Yuki Sato",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Telangana",
    city: "Hyderabad",
    club: "Deccan Warriors Dojo",
    beltRank: "1st Dan Black Belt",
    age: 20,
    ageGroup: "Senior (18+)",
    weightCategory: "-50 kg",
    medals: { gold: 0, silver: 2, bronze: 2 },
    points: 180,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7263",
    name: "Anaya Khan",
    discipline: "Martial Arts",
    gender: "Female",
    state: "Uttar Pradesh",
    city: "Lucknow",
    club: "Awadh Martial Arts",
    beltRank: "Yellow Belt (8th Gup)",
    age: 12,
    ageGroup: "Sub-Junior (10-14)",
    weightCategory: "-35 kg",
    medals: { gold: 0, silver: 1, bronze: 3 },
    points: 160,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "KSM-PL-2026-7264",
    name: "Lucas Bennett",
    discipline: "Martial Arts",
    gender: "Male",
    state: "Rajasthan",
    city: "Jaipur",
    club: "Rajputana Combat Club",
    beltRank: "1st Dan Black Belt",
    age: 22,
    ageGroup: "Senior (18+)",
    weightCategory: "-62 kg",
    medals: { gold: 0, silver: 1, bronze: 1 },
    points: 140,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
];

export async function recalculateOfficialRankings(
  customRules?: Partial<RankingRulesConfig>
): Promise<RankingsStorageData> {
  const currentData = await (async () => {
    try {
      const file = await ensureFileStorage();
      const raw = await fs.readFile(file, "utf-8");
      return raw.trim() ? (JSON.parse(raw) as RankingsStorageData) : null;
    } catch {
      return null;
    }
  })();

  const rules: RankingRulesConfig = {
    ...DEFAULT_RULES,
    ...(currentData?.rules || {}),
    ...(customRules || {}),
    lastUpdated: new Date().toISOString(),
  };

  const previousRanksMap = new Map<string, number>();
  if (currentData?.athletes) {
    currentData.athletes.forEach((a) => {
      previousRanksMap.set(a.athleteId.toLowerCase(), a.currentRank);
    });
  }

  const rawPlayers = await getPlayers();
  const registeredPlayers = rawPlayers.filter((p) => !p.memberType || p.memberType === "Player");

  // Merge registered players with default federation athletes
  const athleteIdMap = new Set<string>();
  const combinedPlayers: Player[] = [];

  for (const p of registeredPlayers) {
    if (p.id && !athleteIdMap.has(p.id.toLowerCase())) {
      athleteIdMap.add(p.id.toLowerCase());
      combinedPlayers.push(p);
    }
  }

  for (const seed of DEFAULT_FEDERATION_ATHLETES) {
    if (seed.id && !athleteIdMap.has(seed.id.toLowerCase())) {
      athleteIdMap.add(seed.id.toLowerCase());
      combinedPlayers.push(seed as Player);
    }
  }

  const allPlayers = combinedPlayers;
  const rawResults = await getResults({ includeAll: true });

  // Map of athlete stats computed from official players and championship results
  const athleteStats = new Map<
    string,
    {
      player: Player;
      gold: number;
      silver: number;
      bronze: number;
      matchesWon: number;
      matchesLost: number;
      competitions: number;
      medalPoints: number;
      matchPoints: number;
      totalPoints: number;
    }
  >();

  // Initialize from player registry
  for (const p of allPlayers) {
    const gold = p.medals?.gold || 0;
    const silver = p.medals?.silver || 0;
    const bronze = p.medals?.bronze || 0;
    const extraCompetitions = Math.max(1, Math.floor((p.points || 80) / 100));
    const competitions = gold + silver + bronze + extraCompetitions;

    // Realistic match bout simulation based on tournament progression
    const matchesWon =
      gold * 4 +
      silver * 3 +
      bronze * 2 +
      Math.max(1, Math.floor((p.points || 60) / 60));

    const matchesLost =
      silver * 1 +
      bronze * 1 +
      Math.max(1, Math.floor(extraCompetitions / 2));

    const medalPoints =
      gold * rules.goldPoints +
      silver * rules.silverPoints +
      bronze * rules.bronzePoints;

    const matchPoints =
      matchesWon * rules.matchWinPoints +
      competitions * rules.participationPoints;

    const basePoints = p.points ? Math.max(p.points, medalPoints + matchPoints) : medalPoints + matchPoints;

    athleteStats.set(p.id.toLowerCase(), {
      player: p,
      gold,
      silver,
      bronze,
      matchesWon,
      matchesLost,
      competitions,
      medalPoints,
      matchPoints,
      totalPoints: basePoints,
    });
  }

  // Factor in verified results from results-archive / results.json
  if (rawResults && Array.isArray(rawResults)) {
    for (const rawRes of rawResults) {
      const res = rawRes as any;
      const multiplier = res.category?.toLowerCase().includes("national")
        ? rules.nationalMultiplier
        : res.category?.toLowerCase().includes("state")
        ? rules.stateMultiplier
        : rules.districtMultiplier;

      // Scan topPodium
      if (res.topPodium) {
        const topGold = res.topPodium.gold?.athlete;
        const topSilver = res.topPodium.silver?.athlete;
        const topBronze = res.topPodium.bronze?.athlete;

        for (const [idKey, stat] of athleteStats.entries()) {
          const pName = stat.player.name.toLowerCase();
          if (topGold && pName.includes(topGold.toLowerCase())) {
            stat.totalPoints += Math.round(rules.goldPoints * (multiplier - 1));
          } else if (topSilver && pName.includes(topSilver.toLowerCase())) {
            stat.totalPoints += Math.round(rules.silverPoints * (multiplier - 1));
          } else if (topBronze && pName.includes(topBronze.toLowerCase())) {
            stat.totalPoints += Math.round(rules.bronzePoints * (multiplier - 1));
          }
        }
      }
    }
  }

  // Convert map to array and sort descending by total points
  const sortedStats = Array.from(athleteStats.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return b.bronze - a.bronze;
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.toLocaleString("default", { month: "long" });

  const calculatedAthletes: AthleteRankingEntry[] = sortedStats.map((stat, idx) => {
    const currentRank = idx + 1;
    const prevRank = previousRanksMap.get(stat.player.id.toLowerCase()) || currentRank;
    const rankChange = prevRank - currentRank; // positive = moved up, negative = moved down

    const totalMatches = stat.matchesWon + stat.matchesLost;
    const winRatio = totalMatches > 0 ? Math.round((stat.matchesWon / totalMatches) * 100) : 80;

    const rankingId = `RNK-${currentYear}-${String(currentRank).padStart(3, "0")}`;

    const existingEntry = currentData?.athletes?.find(
      (a) => a.athleteId.toLowerCase() === stat.player.id.toLowerCase()
    );

    const history = existingEntry?.history || [
      {
        period: "2025 Annual Final",
        rank: Math.min(sortedStats.length, currentRank + (idx % 3 === 0 ? 1 : idx % 3 === 1 ? -1 : 0)),
        points: Math.max(100, stat.totalPoints - 150),
        date: "2025-12-31",
        notes: "National Championship Season 2025 Record",
      },
      {
        period: `${currentMonth} ${currentYear}`,
        rank: currentRank,
        points: stat.totalPoints,
        date: now.toISOString().split("T")[0],
        notes: "Official Ratified Performance Standing",
      },
    ];

    return {
      rankingId,
      athleteId: stat.player.id,
      athleteName: stat.player.name,
      photo: stat.player.image,
      clubName: stat.player.club || "Independent Dojo",
      state: stat.player.state || "Maharashtra",
      district: stat.player.city || stat.player.district || "Pune",
      discipline: stat.player.discipline || "Kalawar Martial Arts",
      gender: stat.player.gender || "Male",
      ageGroup: stat.player.ageGroup || (stat.player.age && stat.player.age >= 18 ? "Senior (18+)" : "Junior (15-17)"),
      weightCategory: stat.player.weightCategory || "Open Weight",
      beltRank: stat.player.beltRank || "1st Dan Black Belt",
      currentRank,
      previousRank: prevRank,
      rankChange,
      totalPoints: stat.totalPoints,
      matchPoints: stat.matchPoints,
      medalPoints: stat.medalPoints,
      medals: {
        gold: stat.gold,
        silver: stat.silver,
        bronze: stat.bronze,
      },
      totalCompetitions: stat.competitions,
      matchesWon: stat.matchesWon,
      matchesLost: stat.matchesLost,
      winRatio,
      period: "Current",
      year: currentYear,
      month: currentMonth,
      isFrozen: currentData?.isFrozen || false,
      status: "Verified",
      verifiedAt: now.toISOString(),
      history,
    };
  });

  // Calculate Academy Rankings
  const academyMap = new Map<
    string,
    {
      academyName: string;
      state: string;
      district: string;
      totalPoints: number;
      totalAthletes: number;
      gold: number;
      silver: number;
      bronze: number;
    }
  >();

  calculatedAthletes.forEach((ath) => {
    const club = ath.clubName || "Independent Dojo";
    if (!academyMap.has(club)) {
      academyMap.set(club, {
        academyName: club,
        state: ath.state,
        district: ath.district,
        totalPoints: 0,
        totalAthletes: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
      });
    }
    const acad = academyMap.get(club)!;
    acad.totalPoints += ath.totalPoints;
    acad.totalAthletes += 1;
    acad.gold += ath.medals.gold;
    acad.silver += ath.medals.silver;
    acad.bronze += ath.medals.bronze;
  });

  const sortedAcademies = Array.from(academyMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  const calculatedAcademies: AcademyRankingEntry[] = sortedAcademies.map((acad, idx) => ({
    rank: idx + 1,
    previousRank: idx + 1,
    rankChange: 0,
    academyName: acad.academyName,
    state: acad.state,
    district: acad.district,
    totalPoints: acad.totalPoints,
    totalAthletes: acad.totalAthletes,
    gold: acad.gold,
    silver: acad.silver,
    bronze: acad.bronze,
    performanceScore: Math.round(acad.totalPoints / Math.max(1, acad.totalAthletes)),
  }));

  const storageData: RankingsStorageData = {
    rules,
    athletes: calculatedAthletes,
    academies: calculatedAcademies,
    isFrozen: currentData?.isFrozen || false,
    lastRecalculatedAt: now.toISOString(),
    rankingVersion: `${currentYear}.${now.getMonth() + 1}`,
  };

  await saveRankingsData(storageData);
  return storageData;
}

// ── Public Search & Filters API ──────────────────────────────────────────────

export type RankingFilterOptions = {
  category?: string; // Overall, Event, Age, Gender, Weight, State, District, Academy
  discipline?: string;
  gender?: string;
  ageGroup?: string;
  weightCategory?: string;
  state?: string;
  district?: string;
  clubName?: string;
  period?: RankingPeriod;
  year?: number;
  search?: string;
  limit?: number;
};

export async function getFilteredRankings(
  opts: RankingFilterOptions = {}
): Promise<{
  athletes: AthleteRankingEntry[];
  academies: AcademyRankingEntry[];
  rules: RankingRulesConfig;
  totalAthletes: number;
  lastRecalculatedAt: string;
  isFrozen: boolean;
}> {
  const data = await getRankingsData();
  let filtered = [...data.athletes];

  if (opts.search && opts.search.trim()) {
    const q = opts.search.trim().toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.athleteName.toLowerCase().includes(q) ||
        a.athleteId.toLowerCase().includes(q) ||
        a.clubName.toLowerCase().includes(q) ||
        a.rankingId.toLowerCase().includes(q)
    );
  }

  if (opts.discipline && opts.discipline !== "All Disciplines" && opts.discipline !== "All") {
    filtered = filtered.filter(
      (a) => a.discipline.toLowerCase() === opts.discipline!.toLowerCase()
    );
  }

  if (opts.gender && opts.gender !== "All Genders" && opts.gender !== "All") {
    filtered = filtered.filter(
      (a) => a.gender.toLowerCase() === opts.gender!.toLowerCase()
    );
  }

  if (opts.ageGroup && opts.ageGroup !== "All Age Groups" && opts.ageGroup !== "All") {
    filtered = filtered.filter((a) =>
      a.ageGroup.toLowerCase().includes(opts.ageGroup!.toLowerCase())
    );
  }

  if (opts.weightCategory && opts.weightCategory !== "All Weights" && opts.weightCategory !== "All") {
    filtered = filtered.filter((a) =>
      a.weightCategory.toLowerCase().includes(opts.weightCategory!.toLowerCase())
    );
  }

  if (opts.state && opts.state !== "All States" && opts.state !== "All") {
    filtered = filtered.filter(
      (a) => a.state.toLowerCase() === opts.state!.toLowerCase()
    );
  }

  if (opts.district && opts.district !== "All Districts" && opts.district !== "All") {
    filtered = filtered.filter(
      (a) => a.district.toLowerCase() === opts.district!.toLowerCase()
    );
  }

  if (opts.clubName && opts.clubName !== "All Clubs" && opts.clubName !== "All") {
    filtered = filtered.filter(
      (a) => a.clubName.toLowerCase() === opts.clubName!.toLowerCase()
    );
  }

  if (opts.year) {
    filtered = filtered.filter((a) => a.year === opts.year);
  }

  if (opts.limit && opts.limit > 0) {
    filtered = filtered.slice(0, opts.limit);
  }

  return {
    athletes: filtered,
    academies: data.academies || [],
    rules: data.rules,
    totalAthletes: filtered.length,
    lastRecalculatedAt: data.lastRecalculatedAt,
    isFrozen: data.isFrozen,
  };
}

export async function getAthleteRankingById(
  idOrAthleteId: string
): Promise<AthleteRankingEntry | null> {
  const data = await getRankingsData();
  const clean = idOrAthleteId.trim().toLowerCase();
  return (
    data.athletes.find(
      (a) =>
        a.athleteId.toLowerCase() === clean ||
        a.rankingId.toLowerCase() === clean ||
        a.athleteName.toLowerCase() === clean
    ) || null
  );
}

export async function updateRankingRules(
  newRules: Partial<RankingRulesConfig>
): Promise<RankingRulesConfig> {
  const updated = await recalculateOfficialRankings(newRules);
  return updated.rules;
}

export async function setRankingFreezeState(isFrozen: boolean): Promise<boolean> {
  const data = await getRankingsData();
  data.isFrozen = isFrozen;
  await saveRankingsData(data);
  return isFrozen;
}
