/**
 * COACH ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for the official Coach Identity Card.
 *
 * Card Format:
 * - Native Artwork aspect ratio: 503 px width x 627 px height (1 : 1.2465).
 * - Standard Print Size: 54.0 mm width x 67.32 mm height (54.0 * 627 / 503).
 *
 * Units:
 * - PDF coordinates: Millimeters (mm) measured from top-left (0, 0) of the card.
 * - Web coordinates: Percentages (%) for responsive CSS absolute positioning.
 *
 * HOW TO ADJUST COORDINATES:
 * - To shift text Right: Increase `x` (PDF mm) or increase `left` % (Web).
 * - To shift text Left:  Decrease `x` (PDF mm) or decrease `left` % (Web).
 * - To shift text Down:  Increase `y` (PDF mm) or increase `top` % (Web).
 * - To shift text Up:    Decrease `y` (PDF mm) or decrease `top` % (Web).
 */

export interface CoachIdCardPdfField {
  x: number;
  y: number;
  fontSize: number;
  minFontSize?: number;
  fontStyle?: "normal" | "bold" | "italic";
  fontFamily?: "helvetica" | "courier" | "times";
  color: [number, number, number]; // RGB 0-255
  align?: "left" | "center" | "right";
  maxWidth?: number;
}

export interface CoachIdCardWebField {
  left: string;
  top: string;
  width?: string;
  transform?: string;
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
  align?: "left" | "center" | "right";
  maxWidth?: string;
}

export interface CoachIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (54.0 * 627 / 503 ≈ 67.3161)
  templateFront: string;
  templateFront2x: string;
  templateBack: string;
  templateBack2x: string;

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

  // Right Side 10 Form Fields (in mm)
  name: CoachIdCardPdfField;
  idNo: CoachIdCardPdfField;
  dob: CoachIdCardPdfField;
  bloodGroup: CoachIdCardPdfField;
  discipline: CoachIdCardPdfField;
  beltRank: CoachIdCardPdfField;
  academy: CoachIdCardPdfField;
  district: CoachIdCardPdfField;
  state: CoachIdCardPdfField;
  validity: CoachIdCardPdfField;

  // Back Side Overlays (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface CoachIdCardWebConfig {
  aspectRatio: string; // "aspect-[503/627]"
  templateFront: string;
  templateFront2x: string;
  templateBack: string;
  templateBack2x: string;

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

  // Right Side 10 Form Fields (in %)
  fieldsContainer: {
    left: string;
    width: string;
    transform: string;
  };
  name: CoachIdCardWebField;
  idNo: CoachIdCardWebField;
  dob: CoachIdCardWebField;
  bloodGroup: CoachIdCardWebField;
  discipline: CoachIdCardWebField;
  beltRank: CoachIdCardWebField;
  academy: CoachIdCardWebField;
  district: CoachIdCardWebField;
  state: CoachIdCardWebField;
  validity: CoachIdCardWebField;

  // Back Side Overlays (in %)
  qrCodeBack: {
    left: string;
    top: string;
    width: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// MASTER PDF COORDINATES (in Millimeters mm)
// ────────────────────────────────────────────────────────────────────────────
const CARD_WIDTH_MM = 54.0;
const CARD_HEIGHT_MM = 54.0 * (627 / 503); // ~67.3161 mm

const TEXT_X_MM = CARD_WIDTH_MM * (308 / 503); // ~33.0736 mm
const TEXT_MAX_WIDTH_MM = CARD_WIDTH_MM * (175 / 503); // ~18.7873 mm

export const COACH_ID_CARD_PDF_CONFIG: CoachIdCardPdfConfig = {
  cardWidth: CARD_WIDTH_MM,
  cardHeight: CARD_HEIGHT_MM,
  templateFront: "/id-card-templates/coach-id-front.png",
  templateFront2x: "/id-card-templates/coach-id-front-2x.png",
  templateBack: "/id-card-templates/coach-id-back.png",
  templateBack2x: "/id-card-templates/coach-id-back-2x.png",

  // Photo Box (strictly inside yellow frame)
  photo: {
    x: CARD_WIDTH_MM * (23 / 503),
    y: CARD_HEIGHT_MM * (235 / 627),
    width: CARD_WIDTH_MM * (144 / 503),
    height: CARD_HEIGHT_MM * (178 / 627),
    borderRadius: 1.0,
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    x: CARD_WIDTH_MM * (46 / 503),
    y: CARD_HEIGHT_MM * (426 / 627),
    size: CARD_WIDTH_MM * (90 / 503),
  },

  // 10 Dynamic Fields on Underlines (sitting right above each line with auto-fit)
  // Line 1: Coach Name
  name: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (249 / 627),
    fontSize: 4.8,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [15, 23, 42],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 2: ID No.
  idNo: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (273 / 627),
    fontSize: 5.0,
    minFontSize: 3.2,
    fontStyle: "bold",
    fontFamily: "courier",
    color: [180, 83, 9],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 3: Date of Birth / Experience
  dob: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (298 / 627),
    fontSize: 4.4,
    minFontSize: 3.0,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 4: Blood Group
  bloodGroup: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (323 / 627),
    fontSize: 4.4,
    minFontSize: 3.0,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [190, 18, 60],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 5: Discipline
  discipline: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (347 / 627),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 6: Belt / Rank / Qualification / Specialization
  beltRank: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (373 / 627),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [146, 64, 14],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 7: Club / Academy
  academy: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (398 / 627),
    fontSize: 4.2,
    minFontSize: 2.4,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 8: District
  district: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (423 / 627),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 9: State
  state: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (448 / 627),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 10: Validity
  validity: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (472 / 627),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [4, 120, 87],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Back Side Dynamic QR Code
  qrCodeBack: {
    x: CARD_WIDTH_MM * (405 / 505),
    y: CARD_HEIGHT_MM * (482 / 627),
    size: CARD_WIDTH_MM * (72 / 505),
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MASTER WEB DOM PREVIEW COORDINATES (in Percentages %)
// ────────────────────────────────────────────────────────────────────────────
export const COACH_ID_CARD_WEB_CONFIG: CoachIdCardWebConfig = {
  aspectRatio: "aspect-[503/627]",
  templateFront: "/id-card-templates/coach-id-front.png",
  templateFront2x: "/id-card-templates/coach-id-front-2x.png",
  templateBack: "/id-card-templates/coach-id-back.png",
  templateBack2x: "/id-card-templates/coach-id-back-2x.png",

  // Photo Box (strictly fitted inside yellow border frame)
  photo: {
    left: "4.57%",
    top: "37.48%",
    width: "28.63%",
    height: "28.39%",
    borderRadius: "8px",
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    left: "9.15%",
    top: "67.94%",
    width: "17.89%",
  },

  // Common Right Fields positioning
  fieldsContainer: {
    left: "61.0%",
    width: "35.5%",
    transform: "translateY(-92%)",
  },

  // Line 1: Coach Name
  name: {
    left: "61.0%",
    top: "40.35%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-sans font-extrabold uppercase",
    colorClass: "text-[#0f172a]",
  },

  // Line 2: ID No.
  idNo: {
    left: "61.0%",
    top: "44.18%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-mono font-black",
    colorClass: "text-[#b45309]",
  },

  // Line 3: Date of Birth / Experience
  dob: {
    left: "61.0%",
    top: "48.17%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 4: Blood Group
  bloodGroup: {
    left: "61.0%",
    top: "52.15%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#be123c]",
  },

  // Line 5: Discipline
  discipline: {
    left: "61.0%",
    top: "55.98%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 6: Belt / Rank / Qualification / Specialization
  beltRank: {
    left: "61.0%",
    top: "60.13%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#92400e]",
  },

  // Line 7: Club / Academy
  academy: {
    left: "61.0%",
    top: "64.11%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 8: District
  district: {
    left: "61.0%",
    top: "68.10%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 9: State
  state: {
    left: "61.0%",
    top: "72.09%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 10: Validity
  validity: {
    left: "61.0%",
    top: "75.92%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#047857]",
  },

  // Back Side Dynamic QR Code
  qrCodeBack: {
    left: "80.20%",
    top: "76.87%",
    width: "14.26%",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// HELPER GETTERS
// ────────────────────────────────────────────────────────────────────────────

export function getCoachIdCardPdfConfig(): CoachIdCardPdfConfig {
  return COACH_ID_CARD_PDF_CONFIG;
}

export function getCoachIdCardWebConfig(): CoachIdCardWebConfig {
  return COACH_ID_CARD_WEB_CONFIG;
}
