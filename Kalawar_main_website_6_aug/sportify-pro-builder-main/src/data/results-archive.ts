export type AcademyRankEntry = {
  rank: number;
  name: string;
  points: number;
  state: string;
};

export type AthletePodiumEntry = {
  place: 1 | 2 | 3;
  athlete: string;
  academy: string;
  state: string;
};

export type CategoryResults = {
  categoryTitle: string;
  divisionGroup: "Adult Male" | "Adult Female" | "Juvenile / Youth" | "Masters";
  podium: AthletePodiumEntry[];
};

export type DetailedTournamentResult = {
  id: string; // e.g. "kaya-yuddha-2026"
  slug: string; // "kaya-yuddha"
  year: number; // 2026
  title: string;
  discipline: string;
  category: string;
  date: string;
  venue: string;
  city: string;
  totalAthletes: number;
  totalAcademies: number;
  heroImage: string;
  topPodium?: {
    division: string;
    gold: { athlete: string; academy: string; state: string };
    silver: { athlete: string; academy: string; state: string };
    bronze: { athlete: string; academy: string; state: string };
  };
  academiesResults: {
    adultMale: AcademyRankEntry[];
    adultFemale: AcademyRankEntry[];
    juvenile: AcademyRankEntry[];
  };
  athletesResultsByCategory: CategoryResults[];
};

export const DETAILED_RESULTS_ARCHIVE: Record<string, DetailedTournamentResult> = {};

export function getDetailedResult(idOrSlug: string, year?: number): DetailedTournamentResult | null {
  if (DETAILED_RESULTS_ARCHIVE[idOrSlug]) {
    return DETAILED_RESULTS_ARCHIVE[idOrSlug];
  }
  if (year && DETAILED_RESULTS_ARCHIVE[`${idOrSlug}-${year}`]) {
    return DETAILED_RESULTS_ARCHIVE[`${idOrSlug}-${year}`];
  }
  return null;
}
