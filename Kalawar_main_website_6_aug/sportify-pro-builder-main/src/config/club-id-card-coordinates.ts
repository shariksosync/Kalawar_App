/**
 * CLUB ID CARD COORDINATE CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized coordinate mappings for the official Club / Academy Identity Card.
 *
 * Card Format:
 * - Native Artwork aspect ratio: 498 px width x 670 px height (1 : 1.34538).
 * - Standard Print Size: 54.0 mm width x 72.6506 mm height (54.0 * 670 / 498).
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

export interface ClubIdCardPdfField {
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

export interface ClubIdCardWebField {
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

export interface ClubIdCardPdfConfig {
  cardWidth: number; // mm (54.0)
  cardHeight: number; // mm (54.0 * 670 / 498 ≈ 72.6506)
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
    isCircular: boolean;
  };
  idBadge: {
    x: number;
    centerY: number;
    width: number;
    fontSize: number;
    minFontSize: number;
    align: "center";
    baseline: "middle";
    color: [number, number, number];
  };

  // Right Side 9 Dynamic Club Fields (in mm)
  clubName: ClubIdCardPdfField;
  registrationNo: ClubIdCardPdfField;
  headCoach: ClubIdCardPdfField;
  contactNo: ClubIdCardPdfField;
  address: ClubIdCardPdfField;
  district: ClubIdCardPdfField;
  state: ClubIdCardPdfField;
  validity: ClubIdCardPdfField;
  clubCategory: ClubIdCardPdfField;

  // Optional Coach Signature (in mm)
  signature: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Back Side Overlays (in mm)
  qrCodeBack: {
    x: number;
    y: number;
    size: number;
  };
}

export interface ClubIdCardWebConfig {
  aspectRatio: string; // "aspect-[498/670]"
  templateFront: string;
  templateFront2x: string;
  templateBack: string;
  templateBack2x: string;

  // Front Side Overlays (in %)
  photo: {
    left: string;
    top: string;
    width: string;
    aspectRatio: string;
    borderRadius: string;
  };
  idBadge: {
    left: string;
    top: string;
    width: string;
    height: string;
  };

  // Right Side 9 Dynamic Club Fields (in %)
  clubName: ClubIdCardWebField;
  registrationNo: ClubIdCardWebField;
  headCoach: ClubIdCardWebField;
  contactNo: ClubIdCardWebField;
  address: ClubIdCardWebField;
  district: ClubIdCardWebField;
  state: ClubIdCardWebField;
  validity: ClubIdCardWebField;
  clubCategory: ClubIdCardWebField;

  // Optional Coach Signature (in %)
  signature: {
    left: string;
    top: string;
    width: string;
    height: string;
  };

  // Back Side Overlays (in %)
  qrCodeBack: {
    left: string;
    top: string;
    width: string;
    aspectRatio: string;
  };
}

const CARD_W = 54.0;
const CARD_H = 54.0 * (670 / 498); // ≈ 72.6506 mm

// ============================================================================
// MASTER PDF COORDINATES (in Millimeters mm)
// ============================================================================
export const CLUB_ID_CARD_PDF_CONFIG: ClubIdCardPdfConfig = {
  cardWidth: CARD_W,
  cardHeight: CARD_H,
  templateFront: "/id-card-templates/club-id-front.png",
  templateFront2x: "/id-card-templates/club-id-front-2x.png",
  templateBack: "/id-card-templates/club-id-back.png",
  templateBack2x: "/id-card-templates/club-id-back-2x.png",

  // 1. Circular Club Logo / Coach Photo
  photo: {
    x: CARD_W * (34 / 498), // ≈ 3.687 mm
    y: CARD_H * (281 / 670), // ≈ 30.470 mm
    width: CARD_W * (138 / 498), // ≈ 14.964 mm
    height: CARD_H * (138 / 670), // ≈ 14.964 mm
    isCircular: true,
  },

  // 2. Club ID No. inside White Pill Badge
  idBadge: {
    x: CARD_W * (24 / 498), // ≈ 2.602 mm
    centerY: CARD_H * (513.5 / 670), // ≈ 55.676 mm
    width: CARD_W * (124 / 498), // ≈ 13.446 mm
    fontSize: 2.7,
    minFontSize: 1.6,
    align: "center",
    baseline: "middle",
    color: [15, 23, 42],
  },

  // 3. Right 9 Dynamic Club Fields
  // Line 1: Club Name
  clubName: {
    x: CARD_W * (334 / 498), // ≈ 36.217 mm
    y: CARD_H * (272 / 670), // ≈ 29.494 mm
    maxWidth: CARD_W * (142 / 498), // ≈ 15.398 mm
    fontSize: 4.2,
    minFontSize: 2.4,
    fontStyle: "bold",
    color: [15, 23, 42],
    align: "left",
  },

  // Line 2: Registration No.
  registrationNo: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (302 / 670), // ≈ 32.747 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontFamily: "courier",
    fontStyle: "bold",
    color: [146, 64, 14],
    align: "left",
  },

  // Line 3: Head Coach
  headCoach: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (334 / 670), // ≈ 36.216 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [30, 41, 59],
    align: "left",
  },

  // Line 4: Contact No.
  contactNo: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (365 / 670), // ≈ 39.577 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [30, 41, 59],
    align: "left",
  },

  // Line 5: Address
  address: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (398 / 670), // ≈ 43.155 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 3.6,
    minFontSize: 2.0,
    fontStyle: "normal",
    color: [30, 41, 59],
    align: "left",
  },

  // Line 6: District
  district: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (452 / 670), // ≈ 49.010 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [30, 41, 59],
    align: "left",
  },

  // Line 7: State
  state: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (484 / 670), // ≈ 52.480 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [30, 41, 59],
    align: "left",
  },

  // Line 8: Validity
  validity: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (515 / 670), // ≈ 55.841 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [4, 120, 87],
    align: "left",
  },

  // Line 9: Club Category
  clubCategory: {
    x: CARD_W * (334 / 498),
    y: CARD_H * (547 / 670), // ≈ 59.310 mm
    maxWidth: CARD_W * (142 / 498),
    fontSize: 4.0,
    minFontSize: 2.2,
    fontStyle: "bold",
    color: [146, 64, 14],
    align: "left",
  },

  // Optional Coach Signature
  signature: {
    x: CARD_W * (300 / 498), // ≈ 32.530 mm
    y: CARD_H * (556 / 670), // ≈ 60.286 mm
    width: CARD_W * (160 / 498), // ≈ 17.349 mm
    height: CARD_H * (20 / 670), // ≈ 2.169 mm
  },

  // Back Side QR Code
  qrCodeBack: {
    x: CARD_W * (391 / 498), // ≈ 42.398 mm
    y: CARD_H * (463 / 670), // ≈ 50.203 mm
    size: CARD_W * (79 / 498), // ≈ 8.566 mm
  },
};

// ============================================================================
// MASTER WEB DOM PREVIEW COORDINATES (in Percentages %)
// ============================================================================
export const CLUB_ID_CARD_WEB_CONFIG: ClubIdCardWebConfig = {
  aspectRatio: "aspect-[498/670]",
  templateFront: "/id-card-templates/club-id-front.png",
  templateFront2x: "/id-card-templates/club-id-front-2x.png",
  templateBack: "/id-card-templates/club-id-back.png",
  templateBack2x: "/id-card-templates/club-id-back-2x.png",

  // 1. Circular Club Logo / Coach Photo
  photo: {
    left: "6.83%",
    top: "41.94%",
    width: "27.71%",
    aspectRatio: "1/1",
    borderRadius: "rounded-full",
  },

  // 2. Club ID No. inside White Pill Badge
  idBadge: {
    left: "4.82%",
    top: "74.63%",
    width: "24.90%",
    height: "4.03%",
  },

  // 3. Right 9 Dynamic Club Fields
  // Line 1: CLUB NAME
  clubName: {
    left: "67.0%",
    top: "40.90%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 2: REGISTRATION NO.
  registrationNo: {
    left: "67.0%",
    top: "45.37%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 3: HEAD COACH
  headCoach: {
    left: "67.0%",
    top: "50.15%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 4: CONTACT NO.
  contactNo: {
    left: "67.0%",
    top: "54.78%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 5: ADDRESS
  address: {
    left: "67.0%",
    top: "59.70%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 6: DISTRICT
  district: {
    left: "67.0%",
    top: "67.76%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 7: STATE
  state: {
    left: "67.0%",
    top: "72.54%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 8: VALIDITY
  validity: {
    left: "67.0%",
    top: "77.16%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Line 9: CLUB CATEGORY
  clubCategory: {
    left: "67.0%",
    top: "81.94%",
    width: "28.5%",
    transform: "translateY(-90%)",
  },

  // Optional Coach Signature
  signature: {
    left: "60.0%",
    top: "84.0%",
    width: "36.0%",
    height: "3.5%",
  },

  // Back Side Live Dynamic QR Code
  qrCodeBack: {
    left: "78.51%",
    top: "69.10%",
    width: "15.86%",
    aspectRatio: "1/1",
  },
};
