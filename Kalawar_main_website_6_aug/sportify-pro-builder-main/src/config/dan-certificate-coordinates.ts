/**
 * DAN CERTIFICATE MASTER COORDINATES CONFIGURATION SYSTEM
 * ============================================================================
 * Centralized, isolated coordinate mappings for all 4 Dan Certificates (1st Dan - 4th Dan).
 * 
 * Format:
 * - Master 12x16 inches print size: 304.8 mm width x 406.4 mm height (Aspect Ratio 3:4).
 * 
 * Units:
 * - PDF coordinates: Millimeters (mm) measured from top-left (0, 0).
 * - Web coordinates: Percentages (%) for responsive CSS absolute positioning.
 * 
 * HOW TO ADJUST COORDINATES:
 * - To shift text Right: Increase `x` (PDF) or increase `left` % (Web).
 * - To shift text Left: Decrease `x` (PDF) or decrease `left` % (Web).
 * - To shift text Down: Increase `y` (PDF) or increase `top` % (Web).
 * - To shift text Up: Decrease `y` (PDF) or decrease `top` % (Web).
 */

export interface DanCertificatePdfFieldCoord {
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  fontFamily?: "helvetica" | "times" | "courier";
  fontStyle?: "normal" | "bold" | "italic";
  textColor?: [number, number, number];
}

export interface DanCertificatePdfQrCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DanCertificatePdfConfig {
  pageWidth: number; // 304.8 mm (12 in)
  pageHeight: number; // 406.4 mm (16 in)
  templateImage: string;

  // 7 Top-Right Metadata lines (sitting directly on top of underlines after label colons)
  certNo: DanCertificatePdfFieldCoord;
  studentId: DanCertificatePdfFieldCoord;
  dob: DanCertificatePdfFieldCoord;
  academy: DanCertificatePdfFieldCoord;
  examDate: DanCertificatePdfFieldCoord;
  issueDate: DanCertificatePdfFieldCoord;
  place: DanCertificatePdfFieldCoord;

  // Candidate Name (Centered horizontally in ribbon)
  candidateName: DanCertificatePdfFieldCoord & {
    largeFontSize?: number;
    mediumFontSize?: number;
    smallFontSize?: number;
  };

  // Bottom-Left Verification QR Code
  qrCode: DanCertificatePdfQrCoord;
}

export interface DanCertificateWebFieldCoord {
  top: string;
  left: string;
  fontSizeClass?: string;
  fontWeightClass?: string;
  colorClass?: string;
  maxWidth?: string;
}

export interface DanCertificateWebConfig {
  templateWebp: string;
  templateFallback: string;
  aspectRatio: string;

  // 7 Top-Right Metadata lines
  certNo: DanCertificateWebFieldCoord;
  studentId: DanCertificateWebFieldCoord;
  dob: DanCertificateWebFieldCoord;
  academy: DanCertificateWebFieldCoord;
  examDate: DanCertificateWebFieldCoord;
  issueDate: DanCertificateWebFieldCoord;
  place: DanCertificateWebFieldCoord;

  // Candidate Name
  candidateName: {
    top: string;
    fontSizeClass?: string;
    fontWeightClass?: string;
    colorClass?: string;
  };

  // Bottom-Left QR Code
  qrCode: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
}

// Common font and color presets (refined bold single line matching download PDF)
export const COMMON_DAN_CERT_WEB_FONT = "text-[5.5px] sm:text-[7.0px] md:text-[8.0px] lg:text-[9.0px]";
export const COMMON_DAN_CERT_WEB_WEIGHT = "font-sans font-bold tracking-tight whitespace-nowrap";
export const COMMON_DAN_CERT_WEB_COLOR = "text-[#111827]";

const COMMON_PDF_FONT_SIZE = 8.5;
const COMMON_PDF_TEXT_COLOR: [number, number, number] = [17, 24, 39];

/**
 * Calculates responsive Tailwind font sizing based on character length so text fields
 * always fit cleanly on a single underline without ellipsis truncation or border overflow.
 */
export function getDanCertWebDynamicFontSize(
  text?: string,
  fallbackClass: string = COMMON_DAN_CERT_WEB_FONT
): string {
  if (!text) return fallbackClass;
  const len = text.trim().length;

  if (len > 34) {
    return "text-[3.5px] sm:text-[4.6px] md:text-[5.4px] lg:text-[6.2px]";
  }
  if (len > 26) {
    return "text-[4.0px] sm:text-[5.2px] md:text-[6.2px] lg:text-[7.0px]";
  }
  if (len > 18) {
    return "text-[4.8px] sm:text-[6.2px] md:text-[7.2px] lg:text-[8.0px]";
  }
  return fallbackClass;
}

// ============================================================================
// PDF CONFIG REGISTRY (1st to 4th Dan Isolated Configurations)
// ============================================================================
export const DAN_CERTIFICATE_PDF_CONFIGS: Record<string, DanCertificatePdfConfig> = {
  // 1st DAN (Lines at y: 31.35mm, 39.29mm, 47.23mm, 55.17mm, 63.50mm, 71.44mm, 79.38mm)
  "dan-1": {
    pageWidth: 304.8,
    pageHeight: 406.4,
    templateImage: "/certificates/dan-templates/dan-1st.png",
    certNo: { x: 248.5, y: 30.7, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    studentId: { x: 243.8, y: 38.6, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 52.0 },
    dob: { x: 247.5, y: 46.5, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    academy: { x: 240.5, y: 54.4, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 55.0 },
    examDate: { x: 262.2, y: 62.7, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 34.0 },
    issueDate: { x: 248.1, y: 70.7, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 42.0 },
    place: { x: 234.0, y: 78.6, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 62.0 },
    candidateName: { x: 152.4, y: 183.5, align: "center", largeFontSize: 35, mediumFontSize: 22, smallFontSize: 18, fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 19.8, y: 338.2, width: 30.9, height: 29.4 },
  },

  // 2nd DAN (Lines at y: 28.18mm, 35.72mm, 43.66mm, 51.20mm, 59.13mm, 67.07mm, 74.61mm)
  "dan-2": {
    pageWidth: 304.8,
    pageHeight: 406.4,
    templateImage: "/certificates/dan-templates/dan-2nd.png",
    certNo: { x: 248.5, y: 27.5, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    studentId: { x: 243.8, y: 35.0, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 52.0 },
    dob: { x: 247.5, y: 42.9, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    academy: { x: 240.5, y: 50.5, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 55.0 },
    examDate: { x: 262.2, y: 58.4, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 34.0 },
    issueDate: { x: 248.1, y: 66.3, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 42.0 },
    place: { x: 234.0, y: 73.9, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 62.0 },
    candidateName: { x: 152.4, y: 183.5, align: "center", largeFontSize: 35, mediumFontSize: 22, smallFontSize: 18, fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 19.8, y: 338.2, width: 30.9, height: 29.4 },
  },

  // 3rd DAN (Lines at y: 24.21mm, 31.75mm, 39.69mm, 47.63mm, 55.56mm, 63.90mm, 71.83mm)
  "dan-3": {
    pageWidth: 304.8,
    pageHeight: 406.4,
    templateImage: "/certificates/dan-templates/dan-3rd.png",
    certNo: { x: 243.5, y: 23.5, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    studentId: { x: 238.4, y: 31.0, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 52.0 },
    dob: { x: 242.5, y: 38.9, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    academy: { x: 233.5, y: 46.9, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 55.0 },
    examDate: { x: 257.2, y: 54.8, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 34.0 },
    issueDate: { x: 242, y: 63.2, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 42.0 },
    place: { x: 227.0, y: 71.1, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 62.0 },
    candidateName: { x: 152.4, y: 183.5, align: "center", largeFontSize: 35, mediumFontSize: 22, smallFontSize: 18, fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 19.4, y: 337.5, width: 31.3, height: 29.4 },
  },

  // 4th DAN (Lines at y: 21.83mm, 29.77mm, 38.10mm, 46.43mm, 54.77mm, 62.71mm, 71.04mm)
  "dan-4": {
    pageWidth: 304.8,
    pageHeight: 406.4,
    templateImage: "/certificates/dan-templates/dan-4th.png",
    certNo: { x: 243.5, y: 21.1, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    studentId: { x: 238.4, y: 29.0, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 52.0 },
    dob: { x: 242.5, y: 37.3, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 48.0 },
    academy: { x: 233.5, y: 45.7, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 55.0 },
    examDate: { x: 257.2, y: 54.0, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 34.0 },
    issueDate: { x: 242.0, y: 62.0, fontSize: COMMON_PDF_FONT_SIZE, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 42.0 },
    place: { x: 227.0, y: 70.3, fontSize: 8.0, fontFamily: "helvetica", fontStyle: "bold", textColor: COMMON_PDF_TEXT_COLOR, maxWidth: 62.0 },
    candidateName: { x: 152.4, y: 183.5, align: "center", largeFontSize: 35, mediumFontSize: 22, smallFontSize: 18, fontFamily: "times", fontStyle: "bold", textColor: [17, 24, 39] },
    qrCode: { x: 19.4, y: 337.5, width: 31.3, height: 29.4 },
  },
};

// ============================================================================
// WEB CONFIG REGISTRY (1st to 4th Dan Isolated Configurations)
// ============================================================================
export const DAN_CERTIFICATE_WEB_CONFIGS: Record<string, DanCertificateWebConfig> = {
  // 1st DAN
  "dan-1": {
    templateWebp: "/certificates/dan-templates/dan-1st-web.webp",
    templateFallback: "/certificates/dan-templates/dan-1st.png",
    aspectRatio: "aspect-[3/4]",
    certNo: { top: "7.71%", left: "79.6%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    studentId: { top: "9.67%", left: "78.0%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "19.5%" },
    dob: { top: "11.62%", left: "79.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    academy: { top: "13.57%", left: "77.4%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "20.5%" },
    examDate: { top: "15.63%", left: "83.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "14.0%" },
    issueDate: { top: "17.58%", left: "80.0%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "17.5%" },
    place: { top: "19.53%", left: "74.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "23.0%" },
    candidateName: { top: "42.7%", fontSizeClass: "text-base sm:text-2xl md:text-3xl lg:text-4xl", fontWeightClass: "font-serif font-black uppercase tracking-wider", colorClass: "text-[#111827]" },
    qrCode: { top: "83.2%", left: "8.9%", width: "9.65%", height: "7.0%" },
  },

  // 2nd DAN
  "dan-2": {
    templateWebp: "/certificates/dan-templates/dan-2nd-web.webp",
    templateFallback: "/certificates/dan-templates/dan-2nd.png",
    aspectRatio: "aspect-[3/4]",
    certNo: { top: "6.93%", left: "79.6%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    studentId: { top: "8.79%", left: "78.0%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "19.5%" },
    dob: { top: "10.74%", left: "79.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    academy: { top: "12.60%", left: "77.4%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "20.5%" },
    examDate: { top: "14.55%", left: "83.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "14.0%" },
    issueDate: { top: "16.50%", left: "80.0%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "17.5%" },
    place: { top: "18.36%", left: "74.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "23.0%" },
    candidateName: { top: "42.7%", fontSizeClass: "text-base sm:text-2xl md:text-3xl lg:text-4xl", fontWeightClass: "font-serif font-black uppercase tracking-wider", colorClass: "text-[#111827]" },
    qrCode: { top: "83.2%", left: "8.9%", width: "9.65%", height: "7.0%" },
  },

  // 3rd DAN
  "dan-3": {
    templateWebp: "/certificates/dan-templates/dan-3rd-web.webp",
    templateFallback: "/certificates/dan-templates/dan-3rd.png",
    aspectRatio: "aspect-[3/4]",
    certNo: { top: "5.96%", left: "78.4%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    studentId: { top: "7.81%", left: "76.5%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "19.5%" },
    dob: { top: "9.77%", left: "77.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    academy: { top: "11.72%", left: "75.4%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "20.5%" },
    examDate: { top: "13.67%", left: "82.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "14.0%" },
    issueDate: { top: "15.72%", left: "77.9%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "17.5%" },
    place: { top: "17.68%", left: "73%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "23.0%" },
    candidateName: { top: "42.7%", fontSizeClass: "text-base sm:text-2xl md:text-3xl lg:text-4xl", fontWeightClass: "font-serif font-black uppercase tracking-wider", colorClass: "text-[#111827]" },
    qrCode: { top: "83.02%", left: "8.9%", width: "9.65%", height: "7.3%" },
  },

  // 4th DAN
  "dan-4": {
    templateWebp: "/certificates/dan-templates/dan-4th-web.webp",
    templateFallback: "/certificates/dan-templates/dan-4th.png",
    aspectRatio: "aspect-[3/4]",
    certNo: { top: "5.37%", left: "78.2%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    studentId: { top: "7.32%", left: "76.3%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "19.5%" },
    dob: { top: "9.38%", left: "78%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "18.0%" },
    academy: { top: "11.43%", left: "75.4%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "20.5%" },
    examDate: { top: "13.48%", left: "82.5%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "14.0%" },
    issueDate: { top: "15.43%", left: "78.0%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "17.5%" },
    place: { top: "17.48%", left: "72.8%", fontSizeClass: COMMON_DAN_CERT_WEB_FONT, fontWeightClass: COMMON_DAN_CERT_WEB_WEIGHT, colorClass: COMMON_DAN_CERT_WEB_COLOR, maxWidth: "23.0%" },
    candidateName: { top: "42.7%", fontSizeClass: "text-base sm:text-2xl md:text-3xl lg:text-4xl", fontWeightClass: "font-serif font-black uppercase tracking-wider", colorClass: "text-[#111827]" },
    qrCode: { top: "83.2%", left: "8.9%", width: "9.65%", height: "7.0%" },
  },
};

// ============================================================================
// HELPER GETTERS
// ============================================================================
export function getDanCertKey(danRank?: number | string): string {
  const num = typeof danRank === "string" ? parseInt(danRank, 10) || 1 : danRank || 1;
  if (num === 1) return "dan-1";
  if (num === 2) return "dan-2";
  if (num === 3) return "dan-3";
  if (num === 4) return "dan-4";
  return "dan-1";
}

export function getDanCertificatePdfConfig(danRank?: number | string): DanCertificatePdfConfig {
  const key = getDanCertKey(danRank);
  return DAN_CERTIFICATE_PDF_CONFIGS[key] || DAN_CERTIFICATE_PDF_CONFIGS["dan-1"];
}

export function getDanCertificateWebConfig(danRank?: number | string): DanCertificateWebConfig {
  const key = getDanCertKey(danRank);
  return DAN_CERTIFICATE_WEB_CONFIGS[key] || DAN_CERTIFICATE_WEB_CONFIGS["dan-1"];
}
