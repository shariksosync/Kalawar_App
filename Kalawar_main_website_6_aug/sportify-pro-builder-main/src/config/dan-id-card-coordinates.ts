/**
 * DAN ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for all Black Belt / Dan ID cards.
 *
 * Card Format:
 * Native Artwork aspect ratio is 502 px width x 633 px height (1 : 1.261).
 * Standard print size: 54.0 mm width x 68.08 mm height.
 *
 * Units:
 * - PDF coordinates: Millimeters (mm) measured from top-left (0, 0) of the card.
 * - Web coordinates: Percentages (%) for responsive CSS absolute positioning.
 *
 * HOW TO ADJUST COORDINATES:
 * - To shift text Right: Increase `x` (PDF) or increase `left` % (Web).
 * - To shift text Left: Decrease `x` (PDF) or decrease `left` % (Web).
 * - To shift text Down: Increase `y` (PDF) or increase `top` % (Web).
 * - To shift text Up: Decrease `y` (PDF) or decrease `top` % (Web).
 */

export interface DanIdCardPdfField {
  x: number;
  y: number;
  fontSize: number;
  fontStyle?: "normal" | "bold" | "italic";
  color: [number, number, number]; // RGB 0-255
  align?: "left" | "center" | "right";
  maxWidth?: number;
}

export interface DanIdCardWebField {
  left: string;
  top: string;
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
  align?: "left" | "center" | "right";
  maxWidth?: string;
}

export interface DanIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (68.08 = 54.0 * 633 / 502)
  templateFront: string;
  templateBack: string;

  // Front Side Overlays (in mm)
  photo: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
  };
  qrCodeFront: {
    x: number;
    y: number;
    size: number;
  };

  // Right side 10 lines (baseline aligned in mm)
  name: DanIdCardPdfField;
  beltColor: DanIdCardPdfField;
  membershipNo: DanIdCardPdfField;
  dob: DanIdCardPdfField;
  bloodGroup: DanIdCardPdfField;
  discipline: DanIdCardPdfField;
  academy: DanIdCardPdfField;
  district: DanIdCardPdfField;
  state: DanIdCardPdfField;
  validity: DanIdCardPdfField;

  // Back Side Overlays (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface DanIdCardWebConfig {
  templateFront: string;
  templateBack: string;
  aspectRatio: string; // "aspect-[502/633]"

  // Front Side Overlays (in %)
  photo: {
    left: string;
    top: string;
    width: string;
    height: string;
    borderRadius?: string;
  };
  qrCodeFront: {
    left: string;
    top: string;
    width: string;
  };

  // Right side 10 lines
  name: DanIdCardWebField;
  beltColor: DanIdCardWebField;
  membershipNo: DanIdCardWebField;
  dob: DanIdCardWebField;
  bloodGroup: DanIdCardWebField;
  discipline: DanIdCardWebField;
  academy: DanIdCardWebField;
  district: DanIdCardWebField;
  state: DanIdCardWebField;
  validity: DanIdCardWebField;

  // Back Side Overlays (in %)
  qrCodeBack: {
    left: string;
    top: string;
    width: string;
  };
}

// Card standard dimensions in mm (matching 502x633 aspect ratio)
const CARD_WIDTH_MM = 54.0;
const CARD_HEIGHT_MM = 68.08; // 54.0 * (633 / 502)

const BASE_PDF_FIELDS = {
  cardWidth: CARD_WIDTH_MM,
  cardHeight: CARD_HEIGHT_MM,

  photo: {
    x: 2.80,
    y: 20.98,
    width: 14.09,
    height: 16.56,
    borderRadius: 1.0,
  },
  qrCodeFront: {
    x: 5.3,
    y: 39.1,
    size: 8.5,
  },

  // 10 Form Lines (Baseline aligned with printed underlines with clean breathing gap)
  name: {
    x: 31.8,
    y: 22.20,
    fontSize: 5.0,
    fontStyle: "bold" as const,
    color: [15, 23, 42] as [number, number, number],
    maxWidth: 19.4,
  },
  beltColor: {
    x: 31.8,
    y: 24.80,
    fontSize: 4.4,
    fontStyle: "bold" as const,
    color: [146, 64, 14] as [number, number, number],
    maxWidth: 19.4,
  },
  membershipNo: {
    x: 31.8,
    y: 27.38,
    fontSize: 4.4,
    fontStyle: "bold" as const,
    color: [180, 83, 9] as [number, number, number],
    maxWidth: 19.4,
  },
  dob: {
    x: 31.8,
    y: 30.00,
    fontSize: 4.3,
    fontStyle: "bold" as const,
    color: [30, 41, 59] as [number, number, number],
    maxWidth: 19.4,
  },
  bloodGroup: {
    x: 31.8,
    y: 32.60,
    fontSize: 4.5,
    fontStyle: "bold" as const,
    color: [190, 18, 60] as [number, number, number],
    maxWidth: 19.4,
  },
  discipline: {
    x: 31.8,
    y: 35.18,
    fontSize: 4.1,
    fontStyle: "bold" as const,
    color: [30, 41, 59] as [number, number, number],
    maxWidth: 19.4,
  },
  academy: {
    x: 31.8,
    y: 37.75,
    fontSize: 3.9,
    fontStyle: "bold" as const,
    color: [30, 41, 59] as [number, number, number],
    maxWidth: 19.4,
  },
  district: {
    x: 31.8,
    y: 40.55,
    fontSize: 4.3,
    fontStyle: "bold" as const,
    color: [30, 41, 59] as [number, number, number],
    maxWidth: 19.4,
  },
  state: {
    x: 31.8,
    y: 43.12,
    fontSize: 4.0,
    fontStyle: "bold" as const,
    color: [30, 41, 59] as [number, number, number],
    maxWidth: 19.4,
  },
  validity: {
    x: 31.8,
    y: 45.82,
    fontSize: 4.3,
    fontStyle: "bold" as const,
    color: [4, 120, 87] as [number, number, number],
    maxWidth: 19.4,
  },

  qrCodeBack: {
    x: 43.85,
    y: 53.1,
    size: 6.4,
  },
};

// ============================================================================
// MASTER PDF COORDINATES (in Millimeters)
// ============================================================================
export const DAN_PDF_CONFIGS: Record<string, DanIdCardPdfConfig> = {
  "dan-1": {
    ...BASE_PDF_FIELDS,
    templateFront: "/id-card-templates/dan/dan-1st-front.png",
    templateBack: "/id-card-templates/dan/dan-1st-back.png",
  },
  "dan-2": {
    ...BASE_PDF_FIELDS,
    templateFront: "/id-card-templates/dan/dan-2nd-front.png",
    templateBack: "/id-card-templates/dan/dan-2nd-back.png",
  },
  "dan-3": {
    ...BASE_PDF_FIELDS,
    templateFront: "/id-card-templates/dan/dan-3rd-front.png",
    templateBack: "/id-card-templates/dan/dan-3rd-back.png",
  },
  "dan-4": {
    ...BASE_PDF_FIELDS,
    templateFront: "/id-card-templates/dan/dan-4th-front.png",
    templateBack: "/id-card-templates/dan/dan-4th-back.png",
  },
  "dan-default": {
    ...BASE_PDF_FIELDS,
    templateFront: "/id-card-templates/dan/dan-default-front.png",
    templateBack: "/id-card-templates/dan/dan-default-back.png",
  },
};

// ============================================================================
// MASTER WEB DOM PREVIEW COORDINATES (in Percentages %)
// ============================================================================
const BASE_WEB_FIELDS = {
  aspectRatio: "aspect-[502/633]",

  photo: {
    left: "5.18%",
    top: "30.81%",
    width: "26.09%",
    height: "24.33%",
    borderRadius: "6px",
  },
  qrCodeFront: {
    left: "9.8%",
    top: "57.75%",
    width: "15.53%",
  },

  name: {
    left: "59.0%",
    top: "32.86%",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-black uppercase",
    colorClass: "text-[#0f172a]",
    maxWidth: "38%",
  },
  beltColor: {
    left: "59.0%",
    top: "36.81%",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#92400e]",
    maxWidth: "38%",
  },
  membershipNo: {
    left: "59.0%",
    top: "40.60%",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-mono font-black",
    colorClass: "text-[#b45309]",
    maxWidth: "38%",
  },
  dob: {
    left: "59.0%",
    top: "44.55%",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
    maxWidth: "38%",
  },
  bloodGroup: {
    left: "59.0%",
    top: "48.34%",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-black",
    colorClass: "text-[#be123c]",
    maxWidth: "38%",
  },
  discipline: {
    left: "59.0%",
    top: "52.13%",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-semibold",
    colorClass: "text-[#1e293b]",
    maxWidth: "38%",
  },
  academy: {
    left: "59.0%",
    top: "55.92%",
    fontSizeClass: "text-[7.5px] sm:text-[9px] md:text-[10px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
    maxWidth: "38%",
  },
  district: {
    left: "59.0%",
    top: "60.03%",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-semibold",
    colorClass: "text-[#1e293b]",
    maxWidth: "38%",
  },
  state: {
    left: "59.0%",
    top: "63.82%",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
    maxWidth: "38%",
  },
  validity: {
    left: "59.0%",
    top: "67.77%",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-black",
    colorClass: "text-[#047857]",
    maxWidth: "38%",
  },

  qrCodeBack: {
    left: "81.0%",
    top: "77.9%",
    width: "12%",
  },
};

export const DAN_WEB_CONFIGS: Record<string, DanIdCardWebConfig> = {
  "dan-1": {
    ...BASE_WEB_FIELDS,
    templateFront: "/id-card-templates/dan/dan-1st-front.png",
    templateBack: "/id-card-templates/dan/dan-1st-back.png",
  },
  "dan-2": {
    ...BASE_WEB_FIELDS,
    templateFront: "/id-card-templates/dan/dan-2nd-front.png",
    templateBack: "/id-card-templates/dan/dan-2nd-back.png",
  },
  "dan-3": {
    ...BASE_WEB_FIELDS,
    templateFront: "/id-card-templates/dan/dan-3rd-front.png",
    templateBack: "/id-card-templates/dan/dan-3rd-back.png",
  },
  "dan-4": {
    ...BASE_WEB_FIELDS,
    templateFront: "/id-card-templates/dan/dan-4th-front.png",
    templateBack: "/id-card-templates/dan/dan-4th-back.png",
  },
  "dan-default": {
    ...BASE_WEB_FIELDS,
    templateFront: "/id-card-templates/dan/dan-default-front.png",
    templateBack: "/id-card-templates/dan/dan-default-back.png",
  },
};

// ============================================================================
// HELPER GETTERS
// ============================================================================

export function getDanKey(danRank?: number | string): string {
  const num = typeof danRank === "string" ? parseInt(danRank, 10) || 1 : danRank || 1;
  if (num === 1) return "dan-1";
  if (num === 2) return "dan-2";
  if (num === 3) return "dan-3";
  if (num === 4) return "dan-4";
  return "dan-default";
}

export function getDanIdCardPdfConfig(danRank?: number | string): DanIdCardPdfConfig {
  const key = getDanKey(danRank);
  return DAN_PDF_CONFIGS[key] || DAN_PDF_CONFIGS["dan-1"];
}

export function getDanIdCardWebConfig(danRank?: number | string): DanIdCardWebConfig {
  const key = getDanKey(danRank);
  return DAN_WEB_CONFIGS[key] || DAN_WEB_CONFIGS["dan-1"];
}
