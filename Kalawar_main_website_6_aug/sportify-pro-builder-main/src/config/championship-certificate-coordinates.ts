/**
 * CHAMPIONSHIP CERTIFICATE MASTER COORDINATES CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for all 4 Championship tiers:
 *  1. District Championship
 *  2. State Championship
 *  3. National Championship
 *  4. International Championship
 * 
 * Format: Standard A4 Landscape (297 mm width x 210 mm height)
 * 
 * Units:
 *  - PDF coordinates: Millimeters (mm) measured from top-left (0, 0).
 *  - Web coordinates: Percentages (%) for responsive CSS absolute positioning.
 * 
 * HOW TO ADJUST COORDINATES MANUALLY:
 *  - Shift Right: Increase `x` (PDF) or increase `left` % (Web).
 *  - Shift Left:  Decrease `x` (PDF) or decrease `left` % (Web).
 *  - Shift Down:  Increase `y` (PDF) or increase `top` % (Web).
 *  - Shift Up:    Decrease `y` (PDF) or decrease `top` % (Web).
 */

export type ChampionshipLevelTier = "district" | "state" | "national" | "international";

export interface ChampPdfFieldCoord {
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  fontFamily?: "helvetica" | "times" | "courier";
  fontStyle?: "normal" | "bold" | "italic";
  textColor?: [number, number, number];
}

export interface ChampPdfQrCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChampionshipPdfConfig {
  pageWidth: number; // 297 mm
  pageHeight: number; // 210 mm
  templateImage: string;
  templateImageFallback?: string;

  // Candidate Name on "Mr. / Ms. ___________________"
  candidateName: ChampPdfFieldCoord;

  // Form lines after colons
  eventDiscipline: ChampPdfFieldCoord;
  category: ChampPdfFieldCoord;
  ageGroup: ChampPdfFieldCoord;
  weightCategory: ChampPdfFieldCoord;

  // Award Checkboxes (Checkmark tick / badge at box)
  awardBoxes: {
    gold: { x: number; y: number };
    silver: { x: number; y: number };
    bronze: { x: number; y: number };
    participation: { x: number; y: number };
  };

  // Bottom Line Metadata
  certNumberSuffix: ChampPdfFieldCoord;
  eventDate?: ChampPdfFieldCoord;
  eventDay: ChampPdfFieldCoord;
  eventMonth: ChampPdfFieldCoord;
  eventPlace: ChampPdfFieldCoord;

  // QR Code
  qrCode: ChampPdfQrCoord;
}

export interface ChampWebFieldCoord {
  top: string;
  left?: string;
  right?: string;
  textAlign?: "left" | "center" | "right";
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
  maxWidth?: string;
  transform?: string;
}

export interface ChampionshipWebConfig {
  templateWebp: string;
  templateFallback: string;
  aspectRatio: string;

  candidateName: ChampWebFieldCoord;
  eventDiscipline: ChampWebFieldCoord;
  category: ChampWebFieldCoord;
  ageGroup: ChampWebFieldCoord;
  weightCategory: ChampWebFieldCoord;

  awardBoxes: {
    gold: { top: string; left: string };
    silver: { top: string; left: string };
    bronze: { top: string; left: string };
    participation: { top: string; left: string };
  };

  certNumberSuffix: ChampWebFieldCoord;
  eventDate?: ChampWebFieldCoord;
  eventDay: ChampWebFieldCoord;
  eventMonth: ChampWebFieldCoord;
  eventPlace: ChampWebFieldCoord;

  qrCode: {
    top: string;
    left?: string;
    right?: string;
    width: string;
    height: string;
  };
}

/* ============================================================================
 * 1. DISTRICT CHAMPIONSHIP COORDINATES
 * ============================================================================ */
export const DISTRICT_CHAMPIONSHIP_PDF_CONFIG: ChampionshipPdfConfig = {
  pageWidth: 297,
  pageHeight: 210,
  templateImage: "/certificates/championship-templates/district-template.png",
  templateImageFallback: "/certificates/championship-templates/district-template.jpg",

  // Candidate Name on top of underline after "Mr. / Ms."
  candidateName: { x: 155, y: 89, fontSize: 16, align: "center", fontStyle: "bold", textColor: [15, 23, 42] },

  // Form lines after colons
  eventDiscipline: { x: 110, y: 113.5, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  category: { x: 110, y: 119.7, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  ageGroup: { x: 110, y: 125.8, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  weightCategory: { x: 110, y: 132.5, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },

  // Award Checkboxes
  awardBoxes: {
    gold: { x: 110.2, y: 138.2 },
    silver: { x: 129.5, y: 137.8 },
    bronze: { x: 150.3, y: 137.9 },
    participation: { x: 173.7, y: 137.8 },
  },

  // Bottom Line Metadata
  certNumberSuffix: { x: 105, y: 160.5, fontSize: 10, align: "left", fontStyle: "bold", textColor: [180, 20, 20] },
  eventDay: { x: 153.5, y: 160.5, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventMonth: { x: 164.8, y: 160.5, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventPlace: { x: 203.8, y: 160.5, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },

  // Bottom Right QR Code
  qrCode: { x: 260.5, y: 169.5, width: 20, height: 20.9 },
};

export const DISTRICT_CHAMPIONSHIP_WEB_CONFIG: ChampionshipWebConfig = {
  templateWebp: "/certificates/championship-templates/district-template.png",
  templateFallback: "/certificates/championship-templates/district-template.jpg",
  aspectRatio: "297/210",

  candidateName: {
    top: "39.2%",
    left: "52%",
    transform: "translateX(-50%)",
    textAlign: "center",
    fontSizeClass: "text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-wide font-serif",
  },
  eventDiscipline: {
    top: "51.7%",
    left: "37%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  category: {
    top: "54.6%",
    left: "37%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  ageGroup: {
    top: "57.5%",
    left: "37%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  weightCategory: {
    top: "60.7%",
    left: "37%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },

  awardBoxes: {
    gold: { top: "65.3%", left: "37.4%" },
    silver: { top: "65.3%", left: "43.85%" },
    bronze: { top: "65.3%", left: "50.85%" },
    participation: { top: "65.5%", left: "58.6%" },
  },

  certNumberSuffix: {
    top: "74.7%",
    left: "35.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-red-700 font-mono",
  },
  eventDay: {
    top: "74.7%",
    left: "51.6%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventMonth: {
    top: "74.7%",
    left: "55.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventPlace: {
    top: "74.7%",
    left: "68.4%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },

  qrCode: {
    top: "80.6%",
    left: "87.8%",
    width: "7.2%",
    height: "auto",
  },
};

/* ============================================================================
 * 2. STATE CHAMPIONSHIP COORDINATES
 * ============================================================================ */
export const STATE_CHAMPIONSHIP_PDF_CONFIG: ChampionshipPdfConfig = {
  pageWidth: 297,
  pageHeight: 210,
  templateImage: "/certificates/championship-templates/state-template.png",
  templateImageFallback: "/certificates/championship-templates/state-template.jpg",

  // Candidate Name on top of underline after "Mr. / Ms."
  candidateName: { x: 155, y: 87.3, fontSize: 16, align: "center", fontStyle: "bold", textColor: [15, 23, 42] },

  // Form lines after colons
  eventDiscipline: { x: 116.8, y: 114, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  category: { x: 116.8, y: 120, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  ageGroup: { x: 116.8, y: 126.5, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  weightCategory: { x: 116.8, y: 133, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },

  // Award Checkboxes
  awardBoxes: {
    gold: { x: 116.7, y: 138 },
    silver: { x: 136.9, y: 137.8 },
    bronze: { x: 156.7, y: 137.9 },
    participation: { x: 179.3, y: 138 },
  },

  // Bottom Line Metadata
  certNumberSuffix: { x: 112.7, y: 163.2, fontSize: 10, align: "left", fontStyle: "bold", textColor: [180, 20, 20] },
  eventDay: { x: 152.7, y: 163.2, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventMonth: { x: 163.4, y: 163.2, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventPlace: { x: 203, y: 163.15, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },

  // Bottom Right QR Code
  qrCode: { x: 215, y: 169, width: 20, height: 20 },
};

export const STATE_CHAMPIONSHIP_WEB_CONFIG: ChampionshipWebConfig = {
  templateWebp: "/certificates/championship-templates/state-template.png",
  templateFallback: "/certificates/championship-templates/state-template.jpg",
  aspectRatio: "297/210",

  candidateName: {
    top: "38.5%",
    left: "52%",
    transform: "translateX(-50%)",
    textAlign: "center",
    fontSizeClass: "text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-wide font-serif",
  },
  eventDiscipline: {
    top: "52.1%",
    left: "39%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  category: {
    top: "54.9%",
    left: "39%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  ageGroup: {
    top: "57.9%",
    left: "39%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  weightCategory: {
    top: "60.6%",
    left: "38.9%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },

  awardBoxes: {
    gold: { top: "65.3%", left: "39.6%" },
    silver: { top: "65.3%", left: "46.5%" },
    bronze: { top: "65.3%", left: "53.1%" },
    participation: { top: "65.3%", left: "60.5%" },
  },

  certNumberSuffix: {
    top: "75.9%",
    left: "38.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-red-700 font-mono",
  },
  eventDay: {
    top: "75.9%",
    left: "51.5%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventMonth: {
    top: "75.9%",
    left: "54.9%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventPlace: {
    top: "75.9%",
    left: "68.4%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },

  qrCode: {
    top: "78.5%",
    left: "73.6%",
    width: "6.8%",
    height: "auto",
  },
};

/* ============================================================================
 * 3. NATIONAL CHAMPIONSHIP COORDINATES
 * ============================================================================ */
export const NATIONAL_CHAMPIONSHIP_PDF_CONFIG: ChampionshipPdfConfig = {
  pageWidth: 297,
  pageHeight: 210,
  templateImage: "/certificates/championship-templates/national-template.png",
  templateImageFallback: "/certificates/championship-templates/national-template.jpg",

  // Candidate Name on top of underline after "Mr. / Ms."
  candidateName: { x: 148, y: 85.5, fontSize: 16, align: "center", fontStyle: "bold", textColor: [15, 23, 42] },

  // Form lines after colons
  eventDiscipline: { x: 111.5, y: 113.2, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  category: { x: 111.5, y: 119.0, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  ageGroup: { x: 111.5, y: 124.8, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  weightCategory: { x: 111.5, y: 131.3, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },

  // Award Checkboxes
  awardBoxes: {
    gold: { x: 112, y: 137.2 },
    silver: { x: 132, y: 137.2 },
    bronze: { x: 153.6, y: 137.2 },
    participation: { x: 176.75, y: 137 },
  },

  // Bottom Line Metadata
  certNumberSuffix: { x: 104.5, y: 160.3, fontSize: 10, align: "left", fontStyle: "bold", textColor: [180, 20, 20] },
  eventDay: { x: 153.0, y: 160.9, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventMonth: { x: 163.2, y: 160.9, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventPlace: { x: 203.7, y: 160.4, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },

  // Bottom Right QR Code
  qrCode: { x: 224.3, y: 165.1, width: 20.2, height: 20.2 },
};

export const NATIONAL_CHAMPIONSHIP_WEB_CONFIG: ChampionshipWebConfig = {
  templateWebp: "/certificates/championship-templates/national-template.png",
  templateFallback: "/certificates/championship-templates/national-template.jpg",
  aspectRatio: "297/210",

  candidateName: {
    top: "37.5%",
    left: "52%",
    transform: "translateX(-50%)",
    textAlign: "center",
    fontSizeClass: "text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-wide font-serif",
  },
  eventDiscipline: {
    top: "51.6%",
    left: "37.5%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  category: {
    top: "54.3%",
    left: "37.5%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  ageGroup: {
    top: "57.1%",
    left: "37.5%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  weightCategory: {
    top: "60.1%",
    left: "37.5%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },

  awardBoxes: {
    gold: { top: "64.9%", left: "37.9%" },
    silver: { top: "64.9%", left: "44.6%" },
    bronze: { top: "64.9%", left: "51.9%" },
    participation: { top: "65.05%", left: "59.7%" },
  },

  certNumberSuffix: {
    top: "74.6%",
    left: "35.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-red-700 font-mono",
  },
  eventDay: {
    top: "74.5%",
    left: "51.5%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventMonth: {
    top: "74.5%",
    left: "55.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventPlace: {
    top: "74.5%",
    left: "68.7%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },

  qrCode: {
    top: "78.6%",
    left: "73.5%",
    width: "6.8%",
    height: "auto",
  },
};

/* ============================================================================
 * 4. INTERNATIONAL CHAMPIONSHIP COORDINATES
 * ============================================================================ */
export const INTERNATIONAL_CHAMPIONSHIP_PDF_CONFIG: ChampionshipPdfConfig = {
  pageWidth: 297,
  pageHeight: 210,
  templateImage: "/certificates/championship-templates/international-template.png",
  templateImageFallback: "/certificates/championship-templates/international-template.jpg",

  // Candidate Name on top of underline after "Mr. / Ms."
  candidateName: { x: 148, y: 88, fontSize: 16, align: "center", fontStyle: "bold", textColor: [15, 23, 42] },

  // Form lines after colons
  eventDiscipline: { x: 111, y: 115.4, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  category: { x: 111, y: 121, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  ageGroup: { x: 111, y: 126.4, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },
  weightCategory: { x: 111, y: 132.4, fontSize: 11, align: "left", fontStyle: "bold", textColor: [20, 20, 30] },

  // Award Checkboxes
  awardBoxes: {
    gold: { x: 111.9, y: 138.7 },
    silver: { x: 131.7, y: 138.7 },
    bronze: { x: 153.3, y: 138.7 },
    participation: { x: 176.6, y: 138.7 },
  },

  // Bottom Line Metadata
  certNumberSuffix: { x: 105.4, y: 161.4, fontSize: 10, align: "left", fontStyle: "bold", textColor: [180, 20, 20] },
  eventDay: { x: 152.5, y: 161.4, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventMonth: { x: 163.5, y: 161.4, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },
  eventPlace: { x: 205, y: 161.4, fontSize: 10, align: "left", fontStyle: "bold", textColor: [30, 30, 30] },

  // Bottom Right QR Code
  qrCode: { x: 227, y: 169, width: 20, height: 20 },
};

export const INTERNATIONAL_CHAMPIONSHIP_WEB_CONFIG: ChampionshipWebConfig = {
  templateWebp: "/certificates/championship-templates/international-template.png",
  templateFallback: "/certificates/championship-templates/international-template.jpg",
  aspectRatio: "297/210",

  candidateName: {
    top: "38.9%",
    left: "51%",
    transform: "translateX(-50%)",
    textAlign: "center",
    fontSizeClass: "text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-wide font-serif",
  },
  eventDiscipline: {
    top: "52.5%",
    left: "37.8%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  category: {
    top: "55.2%",
    left: "37.8%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  ageGroup: {
    top: "57.9%",
    left: "37.8%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },
  weightCategory: {
    top: "60.8%",
    left: "37.8%",
    textAlign: "left",
    fontSizeClass: "text-xs sm:text-sm font-bold text-slate-900",
  },

  awardBoxes: {
    gold: { top: "65.7%", left: "38%" },
    silver: { top: "65.7%", left: "44.65%" },
    bronze: { top: "65.7%", left: "51.9%" },
    participation: { top: "65.6%", left: "59.7%" },
  },

  certNumberSuffix: {
    top: "75.1%",
    left: "35.7%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-red-700 font-mono",
  },
  eventDay: {
    top: "75%",
    left: "51.5%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventMonth: {
    top: "75%",
    left: "55.2%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },
  eventPlace: {
    top: "75%",
    left: "69.0%",
    textAlign: "left",
    fontSizeClass: "text-[11px] sm:text-xs font-bold text-slate-900",
  },

  qrCode: {
    top: "79%",
    left: "75.8%",
    width: "6.8%",
    height: "auto",
  },
};

/* ============================================================================
 * RESOLVERS
 * ============================================================================ */
export function normalizeChampTier(input?: string): ChampionshipLevelTier {
  if (!input) return "district";
  const s = input.toLowerCase();
  if (s.includes("international") || s.includes("world") || s.includes("global")) return "international";
  if (s.includes("national") || s.includes("all india") || s.includes("india")) return "national";
  if (s.includes("state") || s.includes("maharashtra")) return "state";
  return "district";
}

export function getChampionshipPdfConfig(levelOrTier?: string): ChampionshipPdfConfig {
  const tier = normalizeChampTier(levelOrTier);
  switch (tier) {
    case "international":
      return INTERNATIONAL_CHAMPIONSHIP_PDF_CONFIG;
    case "national":
      return NATIONAL_CHAMPIONSHIP_PDF_CONFIG;
    case "state":
      return STATE_CHAMPIONSHIP_PDF_CONFIG;
    case "district":
    default:
      return DISTRICT_CHAMPIONSHIP_PDF_CONFIG;
  }
}

export function getChampionshipWebConfig(levelOrTier?: string): ChampionshipWebConfig {
  const tier = normalizeChampTier(levelOrTier);
  switch (tier) {
    case "international":
      return INTERNATIONAL_CHAMPIONSHIP_WEB_CONFIG;
    case "national":
      return NATIONAL_CHAMPIONSHIP_WEB_CONFIG;
    case "state":
      return STATE_CHAMPIONSHIP_WEB_CONFIG;
    case "district":
    default:
      return DISTRICT_CHAMPIONSHIP_WEB_CONFIG;
  }
}
