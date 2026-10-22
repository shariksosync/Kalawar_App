/**
 * ============================================================================
 * BELT CERTIFICATE MASTER COORDINATES CONFIGURATION
 * ============================================================================
 * 
 * This file contains isolated, highly granular coordinate definitions for each
 * of the 11 Belt Certificate templates.
 * 
 * - PDF coordinates are in Millimeters (mm) for standard A4 landscape (297x210mm)
 *   or portrait Junior Black Belt (304.8x406.4mm).
 * - Web coordinates are in Percentages (%) for responsive browser overlays.
 * 
 * To calibrate any text or QR position for a specific belt, simply adjust the
 * corresponding numbers in this file.
 */

export interface BeltPdfFieldCoord {
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  fontFamily?: "helvetica" | "times" | "courier";
  fontStyle?: "normal" | "bold" | "italic";
  textColor?: [number, number, number];
}

export interface BeltPdfQrCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeltPdfTemplateConfig {
  pageWidth: number;
  pageHeight: number;
  orientation: "landscape" | "portrait";
  certNo: BeltPdfFieldCoord;
  studentId: BeltPdfFieldCoord;
  dob: BeltPdfFieldCoord;
  academy: BeltPdfFieldCoord & { maxCharsForBaseFont?: number; smallFontSize?: number; maxWidth?: number };
  examDate: BeltPdfFieldCoord;
  issueDate: BeltPdfFieldCoord;
  place: BeltPdfFieldCoord;
  candidateName: BeltPdfFieldCoord & { largeFontSize?: number; mediumFontSize?: number; smallFontSize?: number };
  qrCode: BeltPdfQrCoord;
}

export interface BeltWebFieldCoord {
  top: string;
  left: string;
  fontSize?: string;
  transform?: string;
}

export interface BeltWebTemplateConfig {
  aspectRatio: string;
  certNo: BeltWebFieldCoord;
  studentId: BeltWebFieldCoord;
  dob: BeltWebFieldCoord;
  academy: BeltWebFieldCoord;
  examDate: BeltWebFieldCoord;
  issueDate: BeltWebFieldCoord;
  place: BeltWebFieldCoord;
  candidateName: BeltWebFieldCoord;
  qrCode: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
}

// ----------------------------------------------------------------------------
// BASE LANDSCAPE CONFIG TEMPLATE (A4: 297mm x 210mm)
// ----------------------------------------------------------------------------
function createStandardLandscapePdfConfig(customOverrides?: Partial<BeltPdfTemplateConfig>): BeltPdfTemplateConfig {
  return {
    pageWidth: 297,
    pageHeight: 210,
    orientation: "landscape",
    certNo: { x: 240.6, y: 11.8, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    studentId: { x: 232.7, y: 16.5, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    dob: { x: 235.6, y: 21.3, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    academy: { x: 229.7, y: 26.1, fontSize: 8.5, smallFontSize: 7.0, maxCharsForBaseFont: 26, maxWidth: 58, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    examDate: { x: 249.6, y: 30.9, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    issueDate: { x: 234.7, y: 35.6, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    place: { x: 224.7, y: 40.4, fontSize: 8.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    candidateName: {
      x: 297 / 2,
      y: 109.2, // Clean center of the open white ribbon
      largeFontSize: 24,
      mediumFontSize: 21,
      smallFontSize: 18,
      align: "center",
      fontFamily: "times",
      fontStyle: "bold",
      textColor: [17, 24, 39],
    },
    qrCode: {
      x: 297 * 0.0510,
      y: 210 * 0.7280,
      width: 297 * 0.1140,
      height: 210 * 0.1972,
    },
    ...customOverrides,
  };
}

function createStandardLandscapeWebConfig(customOverrides?: Partial<BeltWebTemplateConfig>): BeltWebTemplateConfig {
  return {
    aspectRatio: "aspect-[1.414/1]",
    certNo: { top: "5.59%", left: "81.0%" },
    studentId: { top: "7.87%", left: "78.3%" },
    dob: { top: "10.14%", left: "79.3%" },
    academy: { top: "12.42%", left: "77.3%" },
    examDate: { top: "14.69%", left: "84.0%" },
    issueDate: { top: "16.97%", left: "79.0%" },
    place: { top: "19.24%", left: "75.6%" },
    candidateName: { top: "52.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: {
      top: "72.80%",
      left: "5.10%",
      width: "11.40%",
      height: "19.72%",
    },
    ...customOverrides,
  };
}

// ============================================================================
// 1. INDIVIDUAL PDF COORDINATES PER BELT (IN MM)
// ============================================================================
export const BELT_PDF_CONFIGS: Record<string, BeltPdfTemplateConfig> = {
  // 1. Yellow Belt (Anukkama 1)
  "yellow-belt.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0503, y: 220 * 0.7261, width: 295 * 0.1107, height: 140 * 0.1991 },
  }),

  // 2. Yellow Belt–1 (Anukkama 2)
  "yellow-belt-1.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1148, height: 140 * 0.1972 },
  }),

  // 3. Green Belt (Anukkama 3)
  "green-belt.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0503, y: 220 * 0.7327, width: 295 * 0.1133, height: 140 * 0.1934 },
  }),

  // 4. Green Belt–1 (Anukkama 4)
  "green-belt-1.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1140, height: 140 * 0.1972 },
  }),

  // 5. Blue Belt (Anukkama 5)
  "blue-belt.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1140, height: 140 * 0.1972 },
  }),

  // 6. Blue Belt–1 (Anukkama 6)
  "blue-belt-1.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1140, height: 140 * 0.1972 },
  }),

  // 7. Red Belt (Anukkama 7)
  "red-belt.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1134, height: 140 * 0.1972 },
  }),

  // 8. Red Belt–1 (Anukkama 8)
  "red-belt-1.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7280, width: 295 * 0.1133, height: 140 * 0.1972 },
  }),

  // 9. Red Belt–2 (Anukkama 9)
  "red-belt-2.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7156, width: 295 * 0.1133, height: 140 * 0.2104 },
  }),

  // 10. Red Belt–3 (Anukkama 10)
  "red-belt-3.png": createStandardLandscapePdfConfig({
    candidateName: { x: 297 / 2, y: 105.2, largeFontSize: 24, mediumFontSize: 21, smallFontSize: 18, align: "center", fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 220 * 0.0510, y: 220 * 0.7156, width: 295 * 0.1140, height: 140 * 0.2104 },
  }),

  // 11. Junior Black Belt (Anukkama 11 - Portrait 304.8mm x 406.4mm)
  "junior-black-belt.png": {
    pageWidth: 304.8,
    pageHeight: 406.4,
    orientation: "portrait",
    certNo: { x: 239.2, y: 16.1, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    studentId: { x: 227.7, y: 22.6, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    dob: { x: 232.0, y: 29.2, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    academy: { x: 223.3, y: 35.7, fontSize: 9.5, smallFontSize: 8.0, maxCharsForBaseFont: 26, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    examDate: { x: 252.2, y: 42.3, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    issueDate: { x: 230.6, y: 48.8, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    place: { x: 216.1, y: 55.3, fontSize: 9.5, fontFamily: "helvetica", fontStyle: "bold", textColor: [26, 30, 41] },
    candidateName: {
      x: 304.8 / 2,
      y: 344.4 * 0.485,
      largeFontSize: 40,
      mediumFontSize: 23,
      smallFontSize: 20,
      align: "center",
      fontFamily: "times",
      fontStyle: "bold",
      textColor: [17, 24, 39],
    },
    qrCode: {
      x: 367 * 0.0550,
      y: 468 * 0.7290,
      width: 248.8 * 0.1441,
      height: 168.4 * 0.2200,
    },
  },
};

// ============================================================================
// 2. INDIVIDUAL WEB PREVIEW OVERLAY COORDINATES PER BELT (IN %)
// ============================================================================
export const BELT_WEB_CONFIGS: Record<string, BeltWebTemplateConfig> = {
  // 1. Yellow Belt
  "yellow-belt.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 2. Yellow Belt–1
  "yellow-belt-1.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 3. Green Belt
  "green-belt.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 4. Green Belt–1
  "green-belt-1.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 5. Blue Belt
  "blue-belt.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 6. Blue Belt–1
  "blue-belt-1.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 7. Red Belt
  "red-belt.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 8. Red Belt–1
  "red-belt-1.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 9. Red Belt–2
  "red-belt-2.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 10. Red Belt–3
  "red-belt-3.png": createStandardLandscapeWebConfig({
    candidateName: { top: "48.0%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: { top: "76.50%", left: "4.10%", width: "11.40%", height: "12.72%" },
  }),

  // 11. Junior Black Belt (Portrait 3:4)
  "junior-black-belt.png": {
    aspectRatio: "aspect-[3/4]",
    certNo: { top: "3.96%", left: "78.5%" },
    studentId: { top: "5.57%", left: "74.7%" },
    dob: { top: "7.18%", left: "76.1%" },
    academy: { top: "8.79%", left: "73.3%" },
    examDate: { top: "10.40%", left: "82.8%" },
    issueDate: { top: "12.01%", left: "75.6%" },
    place: { top: "13.61%", left: "70.9%" },
    candidateName: { top: "40%", left: "50%", transform: "translate(-50%, -50%)" },
    qrCode: {
      top: "83.9%",
      left: "7.5%",
      width: "14.41%",
      height: "9.00%",
    },
  },
};

/**
 * Resolves the PDF coordinate configuration for a given template file name.
 */
export function getBeltPdfConfig(templateFileName: string): BeltPdfTemplateConfig {
  return BELT_PDF_CONFIGS[templateFileName] || BELT_PDF_CONFIGS["yellow-belt-1.png"] || createStandardLandscapePdfConfig();
}

/**
 * Resolves the Web overlay coordinate configuration for a given template file name.
 */
export function getBeltWebConfig(templateFileName: string): BeltWebTemplateConfig {
  return BELT_WEB_CONFIGS[templateFileName] || BELT_WEB_CONFIGS["yellow-belt-1.png"] || createStandardLandscapeWebConfig();
}
