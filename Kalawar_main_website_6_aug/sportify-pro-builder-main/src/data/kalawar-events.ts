export type SangamaKalaSubDiscipline = {
  id: "malla-yuddha" | "danda-yuddha" | "anukkama";
  name: string;
  marathiName?: string;
  tagline: string;
  description: string;
  rules: string[];
  scoring: string[];
  equipment: string[];
  image: string;
};

export type AgeWeightCategory = {
  group: string; // e.g. "U-8", "U-10", "U-12", "U-14", "U-17", "U-19", "Masters"
  ageLimit: string;
  weightClassesMale: string[];
  weightClassesFemale: string[];
  matchDuration?: string;
  active?: boolean;
};

export type KalawarVideo = {
  title: string;
  duration: string;
  thumb: string;
  desc: string;
  videoUrl?: string; // YouTube, Vimeo, Drive, Dailymotion, Instagram, or direct MP4/WebM URL
};

export type KalawarEvent = {
  id: string;
  slug: string;
  name: string;
  marathiName?: string;
  subtitle: string;
  tagline: string;
  category: "Combat Striking" | "Agility & Form" | "Point Sparring" | "Combined Heritage" | string;
  heroImage: string;
  badge: string;
  registrationLive?: boolean;
  nextTournamentName?: string;
  skills?: string[];
  objective?: string;
  hasWeightCategories?: boolean; // false for Santulana
  evaluationCriteria?: string[]; // for Santulana
  introduction: {
    overview: string;
    philosophy: string;
    historicalRoots: string;
    keyHighlights: string[];
  };
  rules: {
    format: string;
    rounds: string;
    legalTargets: string[];
    prohibitedTechniques: string[];
    foulsAndPenalties: string[];
    judgingProtocol: string;
  };
  scoring: {
    system: string;
    pointMatrix: { action: string; points: string; description: string }[];
    criteria: string[];
    winConditions: string[];
  };
  categories: {
    division: string;
    description: string;
    genders: string;
  }[];
  ageWeight: AgeWeightCategory[];
  equipment: {
    mandatory: string[];
    optional: string[];
    prohibited: string[];
    uniformStandards: string;
  };
  media: {
    photos: { src: string; title: string; category: string }[];
    videos: KalawarVideo[];
  };
  results: {
    season: string;
    championship: string;
    podium: { position: "Gold" | "Silver" | "Bronze"; athlete: string; state: string; academy: string }[];
  }[];
  sangamaKalaSubDisciplines?: SangamaKalaSubDiscipline[];
  relatedEventSlugs: string[];
};

export const KALAWAR_EVENTS: KalawarEvent[] = [];

export function getKalawarEventBySlug(slug: string): KalawarEvent | undefined {
  return KALAWAR_EVENTS.find((e) => e.slug === slug || e.id.toLowerCase() === slug.toLowerCase());
}
