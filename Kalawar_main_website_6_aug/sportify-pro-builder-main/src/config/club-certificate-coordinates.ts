/**
 * ============================================================================
 * CLUB AFFILIATION CERTIFICATE / LETTER COORDINATES CONFIGURATION
 * ============================================================================
 * 
 * Centralized, isolated coordinate mappings for the Official Club Affiliation
 * Certificate / Letter.
 * 
 * Sections:
 * 1. PREVIEW COORDINATES (`clubCertificatePreviewCoordinates`):
 *    - Measured in Percentages (%) for responsive on-screen Web Preview,
 *      interactive modals, and verification pages.
 *    - To calibrate:
 *      * Shift text Right: Increase `left` %
 *      * Shift text Left:  Decrease `left` %
 *      * Shift text Down:  Increase `top` %
 *      * Shift text Up:    Decrease `top` %
 * 
 * 2. PRINT COORDINATES (`clubCertificatePrintCoordinates`):
 *    - Measured in Millimeters (mm) on A4 Portrait (210 mm x 297 mm)
 *      for browser print dialogs, background print iframes, and paper printing.
 *    - To calibrate:
 *      * Shift text Right: Increase `x` (mm)
 *      * Shift text Left:  Decrease `x` (mm)
 *      * Shift text Down:  Increase `y` (mm)
 *      * Shift text Up:    Decrease `y` (mm)
 * 
 * 3. MASTER DOWNLOAD PDF COORDINATES (`clubCertificateDownloadPdfCoordinates`):
 *    - Measured in Millimeters (mm) on A4 Portrait (210 mm x 297 mm)
 *    - SINGLE SOURCE OF TRUTH for high-resolution PDF downloads across ALL pages:
 *      * /my-certificates (Download PDF button)
 *      * /certificates/[id] (Download Official PDF button)
 *    - To calibrate:
 *      * Shift text Right: Increase `x` (mm)
 *      * Shift text Left:  Decrease `x` (mm)
 *      * Shift text Down:  Increase `y` (mm)
 *      * Shift text Up:    Decrease `y` (mm)
 */

export interface ClubCertificatePdfFieldCoord {
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  fontFamily?: "helvetica" | "times" | "courier";
  fontStyle?: "normal" | "bold" | "italic";
  textColor?: [number, number, number];
}

export interface ClubCertificatePdfQrCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClubCertificatePrintConfig {
  pageWidth: number; // 210 mm (A4 Portrait)
  pageHeight: number; // 297 mm (A4 Portrait)
  templatePath: string;

  // 1. Top-Left Affiliation No.
  affiliationNo: ClubCertificatePdfFieldCoord;

  // 2. Top-Right Date (DD & MM)
  issueDay: ClubCertificatePdfFieldCoord;
  issueMonth: ClubCertificatePdfFieldCoord;

  // 3. Main Certify Line ("This is to certify that [Club Name]")
  clubName: ClubCertificatePdfFieldCoord;

  // 4. Level of Affiliation Checkboxes
  checkboxes: {
    state: { x: number; y: number };
    district: { x: number; y: number };
    club: { x: number; y: number };
    dojo: { x: number; y: number };
  };

  // 5. Unit Details
  unitDetails: {
    x: number;
    maxWidth: number;
    fontFamily: "helvetica" | "times" | "courier";
    fontStyle: "normal" | "bold" | "italic";
    fontSize: number;
    textColor: [number, number, number];
    stateY: number;
    districtY: number;
    academyY: number;
    headCoachY: number;
    contactNoY: number;
  };

  // 6. Validity Range Inside Box
  validity: {
    fontFamily: "helvetica" | "times" | "courier";
    fontStyle: "normal" | "bold" | "italic";
    fontSize: number;
    textColor: [number, number, number];
    fromDay: ClubCertificatePdfFieldCoord;
    fromMonth: ClubCertificatePdfFieldCoord;
    toDay: ClubCertificatePdfFieldCoord;
    toMonth: ClubCertificatePdfFieldCoord;
    toYear2Digit: ClubCertificatePdfFieldCoord;
  };

  // 7. Cryptographic Verification QR Code
  qrCode: ClubCertificatePdfQrCoord;

  // 8. Bottom Signatory Box Overlays (President & Secretary)
  presidentName: ClubCertificatePdfFieldCoord;
  secretaryName: ClubCertificatePdfFieldCoord;
}

// Download PDF config interface (alias of print config)
export type ClubCertificateDownloadPdfConfig = ClubCertificatePrintConfig;

// Backward compatibility alias for PDF config interface
export type ClubCertificatePdfConfig = ClubCertificatePrintConfig;

export interface ClubCertificateWebFieldCoord {
  left: string;
  top: string;
  width?: string;
  height?: string;
  transform?: string;
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
}

export interface ClubCertificatePreviewConfig {
  aspectRatio: string;
  templatePath: string;

  // 1. Top-Left Affiliation No.
  affiliationNo: ClubCertificateWebFieldCoord;

  // 2. Top-Right Date (DD & MM)
  issueDay: ClubCertificateWebFieldCoord;
  issueMonth: ClubCertificateWebFieldCoord;

  // 3. Main Certify Line
  clubName: ClubCertificateWebFieldCoord;

  // 4. Level of Affiliation Checkboxes
  checkboxes: {
    state: ClubCertificateWebFieldCoord;
    district: ClubCertificateWebFieldCoord;
    club: ClubCertificateWebFieldCoord;
    dojo: ClubCertificateWebFieldCoord;
  };

  // 5. Unit Details
  unitDetails: {
    left: string;
    width: string;
    transform: string;
    stateTop: string;
    districtTop: string;
    academyTop: string;
    headCoachTop: string;
    contactNoTop: string;
  };

  // 6. Validity Range Inside Box
  validity: {
    transform: string;
    fromDay: ClubCertificateWebFieldCoord;
    fromMonth: ClubCertificateWebFieldCoord;
    toDay: ClubCertificateWebFieldCoord;
    toMonth: ClubCertificateWebFieldCoord;
    toYear2Digit: ClubCertificateWebFieldCoord;
  };

  // 7. Verification QR Code
  qrCode: {
    left: string;
    top: string;
    width: string;
    aspectRatio: string;
  };

  // 8. Bottom Signatory Box Overlays
  presidentName: ClubCertificateWebFieldCoord;
  secretaryName: ClubCertificateWebFieldCoord;
}

// Backward compatibility alias for Web config interface
export type ClubCertificateWebConfig = ClubCertificatePreviewConfig;

/**
 * ============================================================================
 * 1. MASTER PREVIEW COORDINATES (Measured in % for on-screen Web Previews)
 * ============================================================================
 */
export const clubCertificatePreviewCoordinates: ClubCertificatePreviewConfig = {
  aspectRatio: "1240 / 1754",
  templatePath: "/certificates/club-affiliation-template.png",

  affiliationNo: {
    left: "17.0%",
    top: "16.10%",
    width: "22.0%",
    transform: "translateY(-90%)",
  },
  issueDay: {
    left: "78.3%",
    top: "16.15%",
    width: "4.9%",
    transform: "translateY(-88%)",
  },
  issueMonth: {
    left: "83.8%",
    top: "16.15%",
    width: "4.7%",
    transform: "translateY(-88%)",
  },
  clubName: {
    left: "26.0%",
    top: "25.50%",
    width: "64.0%",
    transform: "translateY(-88%)",
  },
  checkboxes: {
    state: { left: "8.95%", top: "34.9%", width: "2.7%", height: "1.9%" },
    district: { left: "27.82%", top: "34.9%", width: "2.7%", height: "1.9%" },
    club: { left: "47.58%", top: "34.9%", width: "2.7%", height: "1.9%" },
    dojo: { left: "69.52%", top: "34.9%", width: "2.7%", height: "1.9%" },
  },
  unitDetails: {
    left: "32.5%",
    width: "57.5%",
    transform: "translateY(-88%)",
    stateTop: "38.90%",
    districtTop: "40.68%",
    academyTop: "42.42%",
    headCoachTop: "44.10%",
    contactNoTop: "45.85%",
  },
  validity: {
    transform: "translateY(-88%)",
    fromDay: { left: "30.7%", top: "82.7%", width: "5.8%" },
    fromMonth: { left: "37.0%", top: "82.7%", width: "4.8%" },
    toDay: { left: "52.9%", top: "82.7%", width: "6.1%" },
    toMonth: { left: "59.7%", top: "82.7%", width: "5.0%" },
    toYear2Digit: { left: "68.1%", top: "82.7%", width: "3.6%" },
  },
  qrCode: {
    left: "83.3%",
    top: "79.8%",
    width: "8.5%",
    aspectRatio: "1/1",
  },
  // Bottom Golden Box Overlays for Preview
  presidentName: {
    left: "20.6%",
    top: "93.55%",
    width: "21.0%",
    transform: "translateY(-88%)",
  },
  secretaryName: {
    left: "74.7%",
    top: "93.5%",
    width: "21.0%",
    transform: "translateY(-88%)",
  },
};

/**
 * ============================================================================
 * 2. MASTER PRINT COORDINATES (Measured in mm for A4 Portrait 210 x 297 mm)
 * ============================================================================
 * Used for browser print dialogs, background print iframes, and paper printing.
 */
export const clubCertificatePrintCoordinates: ClubCertificatePrintConfig = {
  pageWidth: 210,
  pageHeight: 297,
  templatePath: "/certificates/club-affiliation-template.png",

  affiliationNo: {
    x: 35.5,
    y: 48.0,
    fontFamily: "courier",
    fontStyle: "bold",
    fontSize: 10.5,
    textColor: [15, 23, 42],
  },
  issueDay: {
    x: 169.6,
    y: 48.0,
    align: "center",
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [15, 23, 42],
  },
  issueMonth: {
    x: 180.9,
    y: 48.0,
    align: "center",
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [15, 23, 42],
  },
  clubName: {
    x: 122.0,
    y: 75.2,
    align: "center",
    maxWidth: 135,
    fontFamily: "times",
    fontStyle: "bold",
    fontSize: 16.5,
    textColor: [15, 23, 42],
  },
  checkboxes: {
    state: { x: 21.6, y: 106.4 },
    district: { x: 61.1, y: 106.4 },
    club: { x: 102.6, y: 106.4 },
    dojo: { x: 148.7, y: 106.4 },
  },
  unitDetails: {
    x: 68.0,
    maxWidth: 124,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 10.0,
    textColor: [15, 23, 42],
    stateY: 115.2,
    districtY: 120.4,
    academyY: 125.6,
    headCoachY: 130.6,
    contactNoY: 135.8,
  },
  validity: {
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [4, 120, 87],
    fromDay: { x: 70.5, y: 245.5, align: "center" },
    fromMonth: { x: 82.9, y: 245.5, align: "center" },
    toDay: { x: 117.5, y: 245.5, align: "center" },
    toMonth: { x: 130.6, y: 245.5, align: "center" },
    toYear2Digit: { x: 147.0, y: 245.5, align: "center" },
  },
  qrCode: {
    x: 175.0,
    y: 237.0,
    width: 18.0,
    height: 18.0,
  },
  // Bottom Signatory Box Overlays for Print
  presidentName: {
    x: 43.4,
    y: 277.5,
    maxWidth: 37.0,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.0,
    textColor: [15, 23, 42],
  },
  secretaryName: {
    x: 156.7,
    y: 277.5,
    maxWidth: 45.0,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.0,
    textColor: [15, 23, 42],
  },
};

/**
 * ============================================================================
 * 3. MASTER DOWNLOAD PDF COORDINATES (Measured in mm for A4 Portrait 210 x 297 mm)
 * ============================================================================
 * SINGLE MASTER COORDINATE CONFIGURATION used for downloaded high-resolution A4
 * PDF files across BOTH:
 *   - /my-certificates (Download PDF button)
 *   - /certificates/[id] (Download Official PDF button)
 * 
 * Edit coordinates here to change PDF downloads globally in both places!
 */
export const clubCertificateDownloadPdfCoordinates: ClubCertificateDownloadPdfConfig = {
  pageWidth: 210,
  pageHeight: 297,
  templatePath: "/certificates/club-affiliation-template.png",

  // 1. Top-Left Affiliation No.
  affiliationNo: {
    x: 35.5,
    y: 47.8,
    fontFamily: "courier",
    fontStyle: "bold",
    fontSize: 10.5,
    textColor: [15, 23, 42],
  },

  // 2. Top-Right Date (DD & MM)
  issueDay: {
    x: 169.6,
    y: 47.8,
    align: "center",
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [15, 23, 42],
  },
  issueMonth: {
    x: 180.9,
    y: 47.8,
    align: "center",
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [15, 23, 42],
  },

  // 3. Main Certify Line ("This is to certify that [Club Name]")
  clubName: {
    x: 122.0,
    y: 75.2,
    align: "center",
    maxWidth: 135,
    fontFamily: "times",
    fontStyle: "bold",
    fontSize: 16.5,
    textColor: [15, 23, 42],
  },

  // 4. Level of Affiliation Checkboxes
  checkboxes: {
    state: { x: 21.6, y: 106.4 },
    district: { x: 61.1, y: 106.4 },
    club: { x: 102.6, y: 106.4 },
    dojo: { x: 148.7, y: 106.4 },
  },

  // 5. Unit Details
  unitDetails: {
    x: 68.0,
    maxWidth: 124,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 10.0,
    textColor: [15, 23, 42],
    stateY: 115.2,
    districtY: 120.4,
    academyY: 125.6,
    headCoachY: 130.6,
    contactNoY: 135.8,
  },

  // 6. Validity Range Inside Box (Calibrated for downloaded PDF)
  validity: {
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.5,
    textColor: [4, 120, 87],
    fromDay: { x: 70.5, y: 245.4, align: "center" },
    fromMonth: { x: 82.9, y: 245.4, align: "center" },
    toDay: { x: 117.5, y: 245.4, align: "center" },
    toMonth: { x: 130.6, y: 245.4, align: "center" },
    toYear2Digit: { x: 147.0, y: 245.4, align: "center" },
  },

  // 7. Cryptographic Verification QR Code
  qrCode: {
    x: 175.0,
    y: 237.0,
    width: 18.0,
    height: 18.0,
  },

  // 8. Bottom Signatory Box Overlays (President & Secretary)
  presidentName: {
    x: 43.4,
    y: 277.5,
    maxWidth: 37.0,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.0,
    textColor: [15, 23, 42],
  },
  secretaryName: {
    x: 156.7,
    y: 277.5,
    maxWidth: 45.0,
    fontFamily: "helvetica",
    fontStyle: "bold",
    fontSize: 9.0,
    textColor: [15, 23, 42],
  },
};

/**
 * ============================================================================
 * 4. CERTIFICATE VERIFICATION PAGE DOWNLOAD PDF COORDINATES ALIAS
 * (`certificatePageDownloadPdfCoordinates`)
 * ============================================================================
 * Direct alias pointing strictly to `clubCertificateDownloadPdfCoordinates`.
 * This guarantees 100% single-source parity so editing one coordinate updates both!
 */
export const certificatePageDownloadPdfCoordinates: ClubCertificateDownloadPdfConfig = clubCertificateDownloadPdfCoordinates;

/**
 * Backward compatibility aliases
 */
export const clubCertificateWebCoordinates = clubCertificatePreviewCoordinates;
export const clubCertificatePdfCoordinates = clubCertificateDownloadPdfCoordinates;
