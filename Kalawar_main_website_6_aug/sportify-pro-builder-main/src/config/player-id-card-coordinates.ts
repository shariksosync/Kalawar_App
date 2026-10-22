/**
 * PLAYER ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for the official Player / Athlete ID Card.
 *
 * Card Format:
 * - Native Artwork aspect ratio: 472 px width x 566 px height (1 : 1.199).
 * - Standard Print Size: 54.0 mm width x 64.75 mm height (54.0 * 566 / 472).
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

export interface PlayerIdCardPdfField {
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

export interface PlayerIdCardWebField {
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

export interface PlayerIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (54.0 * 566 / 472 ≈ 64.7542)
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
  name: PlayerIdCardPdfField;
  idNo: PlayerIdCardPdfField;
  dob: PlayerIdCardPdfField;
  bloodGroup: PlayerIdCardPdfField;
  discipline: PlayerIdCardPdfField;
  beltRank: PlayerIdCardPdfField;
  academy: PlayerIdCardPdfField;
  district: PlayerIdCardPdfField;
  state: PlayerIdCardPdfField;
  validity: PlayerIdCardPdfField;

  // Back Side Overlays (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface PlayerIdCardWebConfig {
  aspectRatio: string; // "aspect-[472/566]"
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
  name: PlayerIdCardWebField;
  idNo: PlayerIdCardWebField;
  dob: PlayerIdCardWebField;
  bloodGroup: PlayerIdCardWebField;
  discipline: PlayerIdCardWebField;
  beltRank: PlayerIdCardWebField;
  academy: PlayerIdCardWebField;
  district: PlayerIdCardWebField;
  state: PlayerIdCardWebField;
  validity: PlayerIdCardWebField;

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
const CARD_HEIGHT_MM = 54.0 * (566 / 472); // ~64.7542 mm

const TEXT_X_MM = CARD_WIDTH_MM * (285 / 472); // ~32.574 mm
const TEXT_MAX_WIDTH_MM = CARD_WIDTH_MM * (172 / 472); // ~19.661 mm

export const PLAYER_ID_CARD_PDF_CONFIG: PlayerIdCardPdfConfig = {
  cardWidth: CARD_WIDTH_MM,
  cardHeight: CARD_HEIGHT_MM,
  templateFront: "/id-card-templates/player-id-front.png",
  templateFront2x: "/id-card-templates/player-id-front-2x.png",
  templateBack: "/id-card-templates/player-id-back.png",
  templateBack2x: "/id-card-templates/player-id-back-2x.png",

  // Photo Box (strictly inside yellow frame)
  photo: {
    x: CARD_WIDTH_MM * (17 / 472),
    y: CARD_HEIGHT_MM * (210 / 566),
    width: CARD_WIDTH_MM * (138 / 472),
    height: CARD_HEIGHT_MM * (178 / 566),
    borderRadius: 1.0,
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    x: CARD_WIDTH_MM * (46 / 472),
    y: CARD_HEIGHT_MM * (395 / 566),
    size: CARD_WIDTH_MM * (82 / 472),
  },

  // 10 Dynamic Fields on Underlines (sitting right above each line with auto-fit)
  // Line 1: Player Name
  name: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (228 / 566),
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
    y: CARD_HEIGHT_MM * (251 / 566),
    fontSize: 5.0,
    minFontSize: 3.2,
    fontStyle: "bold",
    fontFamily: "courier",
    color: [180, 83, 9],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 3: Date of Birth
  dob: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (275 / 566),
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
    y: CARD_HEIGHT_MM * (298 / 566),
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
    y: CARD_HEIGHT_MM * (323 / 566),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Line 6: Belt / Rank / Level
  beltRank: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (345 / 566),
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
    y: CARD_HEIGHT_MM * (369 / 566),
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
    y: CARD_HEIGHT_MM * (393 / 566),
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
    y: CARD_HEIGHT_MM * (416 / 566),
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
    y: CARD_HEIGHT_MM * (440 / 566),
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [4, 120, 87],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Back Side Dynamic QR Code
  qrCodeBack: {
    x: CARD_WIDTH_MM * (387 / 473),
    y: CARD_HEIGHT_MM * (450 / 568),
    size: CARD_WIDTH_MM * (58 / 473),
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MASTER WEB DOM PREVIEW COORDINATES (in Percentages %)
// ────────────────────────────────────────────────────────────────────────────
export const PLAYER_ID_CARD_WEB_CONFIG: PlayerIdCardWebConfig = {
  aspectRatio: "aspect-[472/566]",
  templateFront: "/id-card-templates/player-id-front.png",
  templateFront2x: "/id-card-templates/player-id-front-2x.png",
  templateBack: "/id-card-templates/player-id-back.png",
  templateBack2x: "/id-card-templates/player-id-back-2x.png",

  // Photo Box (strictly fitted inside yellow border frame)
  photo: {
    left: "3.60%",
    top: "37.10%",
    width: "29.24%",
    height: "31.45%",
    borderRadius: "8px",
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    left: "9.5%",
    top: "69.6%",
    width: "17.7%",
  },

  // Common Right Fields positioning
  fieldsContainer: {
    left: "60.4%",
    width: "35.5%",
    transform: "translateY(-88%)",
  },

  // Line 1: Player Name
  name: {
    left: "60.4%",
    top: "40.35%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-sans font-extrabold uppercase",
    colorClass: "text-[#0f172a]",
  },

  // Line 2: ID No.
  idNo: {
    left: "60.4%",
    top: "44.42%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-mono font-black",
    colorClass: "text-[#b45309]",
  },

  // Line 3: Date of Birth
  dob: {
    left: "60.4%",
    top: "48.67%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 4: Blood Group
  bloodGroup: {
    left: "60.4%",
    top: "52.74%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#be123c]",
  },

  // Line 5: Discipline
  discipline: {
    left: "60.4%",
    top: "57.17%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 6: Belt / Rank / Level
  beltRank: {
    left: "60.4%",
    top: "61.06%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#92400e]",
  },

  // Line 7: Club / Academy
  academy: {
    left: "60.4%",
    top: "65.31%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 8: District
  district: {
    left: "60.4%",
    top: "69.56%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 9: State
  state: {
    left: "60.4%",
    top: "73.63%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-bold",
    colorClass: "text-[#1e293b]",
  },

  // Line 10: Validity
  validity: {
    left: "60.4%",
    top: "77.88%",
    width: "35.5%",
    transform: "translateY(-88%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-sans font-black",
    colorClass: "text-[#047857]",
  },

  // Back Side Dynamic QR Code
  qrCodeBack: {
    left: "82.1%",
    top: "79.23%",
    width: "12%",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// HELPER GETTERS
// ────────────────────────────────────────────────────────────────────────────

export function getPlayerIdCardPdfConfig(): PlayerIdCardPdfConfig {
  return PLAYER_ID_CARD_PDF_CONFIG;
}

export function getPlayerIdCardWebConfig(): PlayerIdCardWebConfig {
  return PLAYER_ID_CARD_WEB_CONFIG;
}
