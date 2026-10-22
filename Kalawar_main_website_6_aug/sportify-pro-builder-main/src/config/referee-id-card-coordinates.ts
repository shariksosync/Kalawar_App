/**
 * REFEREE ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for official Referee / Technical Official
 * Identity Cards (Trainee, Junior, State, National / Chief Referees).
 *
 * Card Format:
 * - Native Artwork aspect ratio: 498 px width x 622 px height (1 : 1.2489959).
 * - Standard Print Size: 54.0 mm width x 67.4458 mm height (54.0 * 622 / 498).
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

export interface RefereeIdCardPdfField {
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

export interface RefereeIdCardWebField {
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

export interface RefereeIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (54.0 * 622 / 498 ≈ 67.4458)
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
  name: RefereeIdCardPdfField;
  idNo: RefereeIdCardPdfField;
  dob: RefereeIdCardPdfField;
  bloodGroup: RefereeIdCardPdfField;
  discipline: RefereeIdCardPdfField;
  beltRank: RefereeIdCardPdfField;
  academy: RefereeIdCardPdfField;
  district: RefereeIdCardPdfField;
  state: RefereeIdCardPdfField;
  validity: RefereeIdCardPdfField;

  // Back Side Overlays (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface RefereeIdCardWebConfig {
  aspectRatio: string; // "aspect-[498/622]"
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
  name: RefereeIdCardWebField;
  idNo: RefereeIdCardWebField;
  dob: RefereeIdCardWebField;
  bloodGroup: RefereeIdCardWebField;
  discipline: RefereeIdCardWebField;
  beltRank: RefereeIdCardWebField;
  academy: RefereeIdCardWebField;
  district: RefereeIdCardWebField;
  state: RefereeIdCardWebField;
  validity: RefereeIdCardWebField;

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
const CARD_HEIGHT_MM = 54.0 * (622 / 498); // ~67.44578 mm

const TEXT_X_MM = CARD_WIDTH_MM * (306 / 498); // ~33.1807 mm
const TEXT_MAX_WIDTH_MM = CARD_WIDTH_MM * (171 / 498); // ~18.542 mm

export const REFEREE_ID_CARD_PDF_CONFIG: RefereeIdCardPdfConfig = {
  cardWidth: CARD_WIDTH_MM,
  cardHeight: CARD_HEIGHT_MM,
  templateFront: "/id-card-templates/referee-trainee-front.png",
  templateFront2x: "/id-card-templates/referee-trainee-front-2x.png",
  templateBack: "/id-card-templates/referee-trainee-back.png",
  templateBack2x: "/id-card-templates/referee-trainee-back-2x.png",

  // Photo Box (strictly inside yellow frame)
  photo: {
    x: CARD_WIDTH_MM * (22 / 498), // ~2.3855 mm
    y: CARD_HEIGHT_MM * (223 / 622), // ~24.180 mm
    width: CARD_WIDTH_MM * (142 / 498), // ~15.4016 mm
    height: CARD_HEIGHT_MM * (170 / 622), // ~18.4325 mm
    borderRadius: 1.0,
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    x: CARD_WIDTH_MM * (53 / 498), // ~5.7469 mm
    y: CARD_HEIGHT_MM * (406 / 622), // ~44.0225 mm
    size: CARD_WIDTH_MM * (78 / 498), // ~8.4578 mm
  },

  // Right 10 Form Fields (y positioned right on top of printed underlines)
  name: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (228 / 622), // ~24.7218 mm
    fontSize: 4.8,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [15, 23, 42],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  idNo: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (251 / 622), // ~27.2154 mm
    fontSize: 5.0,
    minFontSize: 3.2,
    fontStyle: "bold",
    fontFamily: "courier",
    color: [180, 83, 9],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  dob: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (275 / 622), // ~29.8175 mm
    fontSize: 4.4,
    minFontSize: 3.0,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  bloodGroup: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (298 / 622), // ~32.311 mm
    fontSize: 4.4,
    minFontSize: 3.0,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [190, 18, 60],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  discipline: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (322 / 622), // ~34.913 mm
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  beltRank: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (345 / 622), // ~37.4067 mm
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [146, 64, 14],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  academy: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (369 / 622), // ~40.0088 mm
    fontSize: 4.2,
    minFontSize: 2.4,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  district: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (394 / 622), // ~42.7194 mm
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  state: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (418 / 622), // ~45.3215 mm
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [30, 41, 59],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },
  validity: {
    x: TEXT_X_MM,
    y: CARD_HEIGHT_MM * (442 / 622), // ~47.9236 mm
    fontSize: 4.4,
    minFontSize: 2.8,
    fontStyle: "bold",
    fontFamily: "helvetica",
    color: [4, 120, 87],
    maxWidth: TEXT_MAX_WIDTH_MM,
  },

  // Back Side Live Dynamic QR Code
  qrCodeBack: {
    x: CARD_WIDTH_MM * (405 / 498), // ~43.9156 mm
    y: CARD_HEIGHT_MM * (486 / 622), // ~52.6945 mm
    size: CARD_WIDTH_MM * (72 / 498), // ~7.8072 mm
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MASTER WEB OVERLAY COORDINATES (in Percentages %)
// ────────────────────────────────────────────────────────────────────────────
export const REFEREE_ID_CARD_WEB_CONFIG: RefereeIdCardWebConfig = {
  aspectRatio: "aspect-[498/622]",
  templateFront: "/id-card-templates/referee-trainee-front.png",
  templateFront2x: "/id-card-templates/referee-trainee-front-2x.png",
  templateBack: "/id-card-templates/referee-trainee-back.png",
  templateBack2x: "/id-card-templates/referee-trainee-back-2x.png",

  // Photo Box (strictly inside yellow frame)
  photo: {
    left: "4.42%",
    top: "35.85%",
    width: "28.51%",
    height: "27.33%",
    borderRadius: "8px",
  },

  // Front Live Dynamic QR Code
  qrCodeFront: {
    left: "10.64%",
    top: "65.27%",
    width: "15.66%",
  },

  // Right Side 10 Form Fields (Percentages aligned above printed baseline tracks)
  fieldsContainer: {
    left: "61.45%",
    width: "35.5%",
    transform: "translateY(-92%)",
  },

  name: {
    left: "61.45%",
    top: "37.46%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-extrabold uppercase",
    colorClass: "text-[#0f172a]",
  },
  idNo: {
    left: "61.45%",
    top: "41.16%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[9.5px] sm:text-[11px] md:text-[12px]",
    fontWeightClass: "font-mono font-black",
    colorClass: "text-[#b45309]",
  },
  dob: {
    left: "61.45%",
    top: "45.02%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
  },
  bloodGroup: {
    left: "61.45%",
    top: "48.71%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-black",
    colorClass: "text-[#be123c]",
  },
  discipline: {
    left: "61.45%",
    top: "52.57%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
  },
  beltRank: {
    left: "61.45%",
    top: "56.27%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-black",
    colorClass: "text-[#92400e]",
  },
  academy: {
    left: "61.45%",
    top: "60.13%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8px] sm:text-[9.5px] md:text-[10.5px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
  },
  district: {
    left: "61.45%",
    top: "64.15%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
  },
  state: {
    left: "61.45%",
    top: "68.01%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-bold",
    colorClass: "text-[#1e293b]",
  },
  validity: {
    left: "61.45%",
    top: "71.86%",
    width: "35.5%",
    transform: "translateY(-92%)",
    fontSizeClass: "text-[8.5px] sm:text-[10px] md:text-[11px]",
    fontWeightClass: "font-black",
    colorClass: "text-[#047857]",
  },

  // Back Side Live Dynamic QR Code
  qrCodeBack: {
    left: "81.25%",
    top: "77.2%",
    width: "14.75%",
  },
};

/**
 * Returns the template paths for a specific referee tier:
 * "trainee" | "junior" | "state" | "national"
 */
export function getRefereeTemplates(tier?: string | null) {
  const t = (tier || "trainee").toLowerCase();
  const validTier =
    t.includes("national") || t.includes("chief") || t.includes("international") || t.includes("level 3")
      ? "national"
      : t.includes("state") || t.includes("level 2")
      ? "state"
      : t.includes("junior") || t.includes("level 1")
      ? "junior"
      : "trainee";

  return {
    tier: validTier,
    front: `/id-card-templates/referee-${validTier}-front.png`,
    front2x: `/id-card-templates/referee-${validTier}-front-2x.png`,
    back: `/id-card-templates/referee-${validTier}-back.png`,
    back2x: `/id-card-templates/referee-${validTier}-back-2x.png`,
  };
}

/**
 * Helper function to retrieve PDF config with appropriate template artwork for a given tier.
 */
export function getRefereeIdCardPdfConfig(tier?: string | null): RefereeIdCardPdfConfig {
  const templates = getRefereeTemplates(tier);
  return {
    ...REFEREE_ID_CARD_PDF_CONFIG,
    templateFront: templates.front,
    templateFront2x: templates.front2x,
    templateBack: templates.back,
    templateBack2x: templates.back2x,
  };
}

/**
 * Helper function to retrieve Web config with appropriate template artwork for a given tier.
 */
export function getRefereeIdCardWebConfig(tier?: string | null): RefereeIdCardWebConfig {
  const templates = getRefereeTemplates(tier);
  return {
    ...REFEREE_ID_CARD_WEB_CONFIG,
    templateFront: templates.front,
    templateFront2x: templates.front2x,
    templateBack: templates.back,
    templateBack2x: templates.back2x,
  };
}
