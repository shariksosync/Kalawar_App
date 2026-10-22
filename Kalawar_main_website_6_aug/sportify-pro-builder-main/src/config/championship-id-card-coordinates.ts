/**
 * CHAMPIONSHIP PARTICIPANT ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for the official Kalawar Sports &
 * Martial Arts Championship Participant ID Card (Artwork Template).
 *
 * Artwork Format:
 * - Native Aspect Ratio: 501 px width x 621 px height (1 : 1.2395).
 * - Standard Print Size: 54.0 mm width x 66.93 mm height (CR80 Portrait).
 *
 * Printed Template Layout (Front):
 * - Left Column:
 *   • Athlete Photo Box (Gold framed): x ≈ 4.8%, y ≈ 35.3%, width ≈ 25.0%, height ≈ 28.5%
 *   • Scannable QR Code Box ("SCAN FOR EVENT DETAILS"): x ≈ 9.4%, y ≈ 66.8%, size ≈ 18.2%
 * - Right Column (8 Fields baseline aligned after colons ':' on printed underlines):
 *   1. Participant Name :
 *   2. Team / Dojo Name :
 *   3. Category :
 *   4. Age Group :
 *   5. Gender :
 *   6. Event(s) :
 *   7. ID No. :
 *   8. Blood Group :
 *
 * HOW TO MANUALLY ADJUST COORDINATES:
 * - Shift text Right: Increase `x` (PDF mm) or increase `left` % (Web).
 * - Shift text Left:  Decrease `x` (PDF mm) or decrease `left` % (Web).
 * - Shift text Down:  Increase `y` (PDF mm) or increase `top` % (Web).
 * - Shift text Up:    Decrease `y` (PDF mm) or decrease `top` % (Web).
 */

export interface ChampionshipIdCardPdfField {
  x: number;
  y: number;
  fontSize: number;
  fontStyle?: "normal" | "bold" | "italic";
  color: [number, number, number]; // RGB 0-255
  align?: "left" | "center" | "right";
  maxWidth?: number;
}

export interface ChampionshipIdCardWebField {
  left: string;
  top: string;
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
  align?: "left" | "center" | "right";
  maxWidth?: string;
}

export interface ChampionshipIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (66.93)
  templateFront: string;
  templateBack: string;

  // Front Side Elements (in mm)
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

  // 8 Right-side Form Fields (in mm)
  participantName: ChampionshipIdCardPdfField;
  teamDojoName: ChampionshipIdCardPdfField;
  category: ChampionshipIdCardPdfField;
  ageGroup: ChampionshipIdCardPdfField;
  gender: ChampionshipIdCardPdfField;
  events: ChampionshipIdCardPdfField;
  idNo: ChampionshipIdCardPdfField;
  bloodGroup: ChampionshipIdCardPdfField;

  // Back Side Elements (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface ChampionshipIdCardWebConfig {
  templateFront: string;
  templateBack: string;
  aspectRatio: string; // "aspect-[501/621]"

  // Front Side Elements (in %)
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

  // 8 Right-side Form Fields (in %)
  participantName: ChampionshipIdCardWebField;
  teamDojoName: ChampionshipIdCardWebField;
  category: ChampionshipIdCardWebField;
  ageGroup: ChampionshipIdCardWebField;
  gender: ChampionshipIdCardWebField;
  events: ChampionshipIdCardWebField;
  idNo: ChampionshipIdCardWebField;
  bloodGroup: ChampionshipIdCardWebField;

  // Back Side Elements (in %)
  qrCodeBack: {
    left: string;
    top: string;
    width: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// PDF COORDINATES (Millimeters mm)
// ────────────────────────────────────────────────────────────────────────────
export const CHAMPIONSHIP_ID_CARD_PDF_CONFIG: ChampionshipIdCardPdfConfig = {
  cardWidth: 54.0,
  cardHeight: 66.93,
  templateFront: "/id-card-templates/championship/front.png",
  templateBack: "/id-card-templates/championship/back.png",

  photo: {
    x: 2.7,
    y: 23.6,
    width: 14.5,
    height: 19,
    borderRadius: 100.0,
  },
  qrCodeFront: {
    x: 5.5,
    y: 45.2,
    size: 8.9,
  },

  // 1. Participant Name :
  participantName: {
    x: 33.0,
    y: 25.2,
    fontSize: 5.5,
    fontStyle: "bold",
    color: [15, 23, 42],
    maxWidth: 18.5,
  },

  // 2. Team / Dojo Name :
  teamDojoName: {
    x: 33.0,
    y: 28.3,
    fontSize: 5.0,
    fontStyle: "bold",
    color: [15, 23, 42],
    maxWidth: 18.5,
  },

  // 3. Category :
  category: {
    x: 33.0,
    y: 31.3,
    fontSize: 4.8,
    fontStyle: "bold",
    color: [146, 64, 14],
    maxWidth: 18.5,
  },

  // 4. Age Group :
  ageGroup: {
    x: 33.0,
    y: 34.3,
    fontSize: 4.8,
    fontStyle: "bold",
    color: [15, 23, 42],
    maxWidth: 18.5,
  },

  // 5. Gender :
  gender: {
    x: 33.0,
    y: 37.3,
    fontSize: 4.8,
    fontStyle: "bold",
    color: [15, 23, 42],
    maxWidth: 18.5,
  },

  // 6. Event(s) :
  events: {
    x: 33.0,
    y: 40.3,
    fontSize: 4.8,
    fontStyle: "bold",
    color: [15, 23, 42],
    maxWidth: 18.5,
  },

  // 7. ID No. :
  idNo: {
    x: 33.0,
    y: 43.3,
    fontSize: 4.8,
    fontStyle: "bold",
    color: [180, 83, 9],
    maxWidth: 18.5,
  },

  // 8. Blood Group :
  bloodGroup: {
    x: 33.0,
    y: 46.3,
    fontSize: 5.2,
    fontStyle: "bold",
    color: [190, 18, 60],
    maxWidth: 18.5,
  },

  // Back QR Code
  qrCodeBack: {
    x: 43.8,
    y: 54.6,
    size: 5.7,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// WEB DOM PREVIEW COORDINATES (Responsive CSS %)
// ────────────────────────────────────────────────────────────────────────────
export const CHAMPIONSHIP_ID_CARD_WEB_CONFIG: ChampionshipIdCardWebConfig = {
  aspectRatio: "aspect-[501/621]",
  templateFront: "/id-card-templates/championship/front.png",
  templateBack: "/id-card-templates/championship/back.png",

  photo: {
    left: "4.9%",
    top: "35.2%",
    width: "27.0%",
    height: "28.5%",
    borderRadius: "6px",
  },
  qrCodeFront: {
    left: "10.6%",
    top: "67.8%",
    width: "16.2%",
  },

  // 1. Participant Name : (underline y = 239px / 621 = 38.5%)
  participantName: {
    left: "61.2%",
    top: "38.5%",
    fontSizeClass: "text-[8.5px] sm:text-[9.5px] md:text-[10px]",
    fontWeightClass: "font-black uppercase tracking-tight",
    colorClass: "text-[#0f172a]",
    maxWidth: "34%",
  },

  // 2. Team / Dojo Name : (underline y = 268px / 621 = 43.1%)
  teamDojoName: {
    left: "61.2%",
    top: "43.1%",
    fontSizeClass: "text-[8px] sm:text-[9px] md:text-[9.5px]",
    fontWeightClass: "font-bold tracking-tight",
    colorClass: "text-[#0f172a]",
    maxWidth: "34%",
  },

  // 3. Category : (underline y = 296px / 621 = 47.6%)
  category: {
    left: "61.2%",
    top: "47.6%",
    fontSizeClass: "text-[7.5px] sm:text-[8.5px] md:text-[9px]",
    fontWeightClass: "font-bold tracking-tight",
    colorClass: "text-[#92400e]",
    maxWidth: "34%",
  },

  // 4. Age Group : (underline y = 324px / 621 = 52.1%)
  ageGroup: {
    left: "61.2%",
    top: "52.1%",
    fontSizeClass: "text-[8px] sm:text-[9px] md:text-[9.5px]",
    fontWeightClass: "font-bold tracking-tight",
    colorClass: "text-[#0f172a]",
    maxWidth: "34%",
  },

  // 5. Gender : (underline y = 352px / 621 = 56.6%)
  gender: {
    left: "61.2%",
    top: "56.6%",
    fontSizeClass: "text-[8px] sm:text-[9px] md:text-[9.5px]",
    fontWeightClass: "font-bold tracking-tight",
    colorClass: "text-[#0f172a]",
    maxWidth: "34%",
  },

  // 6. Event(s) : (underline y = 380px / 621 = 61.1%)
  events: {
    left: "61.2%",
    top: "61.1%",
    fontSizeClass: "text-[7.5px] sm:text-[8.5px] md:text-[9px]",
    fontWeightClass: "font-bold tracking-tight",
    colorClass: "text-[#0f172a]",
    maxWidth: "34%",
  },

  // 7. ID No. : (underline y = 408px / 621 = 65.6%)
  idNo: {
    left: "61.2%",
    top: "65.6%",
    fontSizeClass: "text-[7.5px] sm:text-[8.5px] md:text-[9px]",
    fontWeightClass: "font-mono font-black tracking-tighter",
    colorClass: "text-[#b45309]",
    maxWidth: "34%",
  },

  // 8. Blood Group : (underline y = 436px / 621 = 70.1%)
  bloodGroup: {
    left: "61.2%",
    top: "70.1%",
    fontSizeClass: "text-[8px] sm:text-[9px] md:text-[9.5px]",
    fontWeightClass: "font-black tracking-tight",
    colorClass: "text-[#be123c]",
    maxWidth: "34%",
  },

  // Back QR Code
  qrCodeBack: {
    left: "81%",
    top: "81.5%",
    width: "10.5%",
  },
};

/**
 * Accessor helpers for PDF and Web configurations
 */
export function getChampionshipIdCardPdfConfig(): ChampionshipIdCardPdfConfig {
  return CHAMPIONSHIP_ID_CARD_PDF_CONFIG;
}

export function getChampionshipIdCardWebConfig(): ChampionshipIdCardWebConfig {
  return CHAMPIONSHIP_ID_CARD_WEB_CONFIG;
}
