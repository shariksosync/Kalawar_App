import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import { getChampionshipIdCardPdfConfig } from "@/config/championship-id-card-coordinates";

/**
 * Strips unsupported non-ASCII / CJK characters that standard Helvetica in jsPDF cannot render.
 */
export function cleanText(str: string): string {
  if (!str) return "";
  return str.replace(/[\u3000-\u9fff\uac00-\ud7af]/g, "").trim();
}

/**
 * Generates a high-resolution base64 PNG QR Code data URL for jsPDF.
 */
export async function generateChampionshipQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
    return "";
  }
}

/**
 * Loads a local template asset as base64 Data URL.
 */
export async function getChampionshipTemplateDataUrl(templatePath: string): Promise<string> {
  if (!templatePath) return "";
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(templatePath);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      console.warn(`Template load failed for ${templatePath}:`, err);
    }
  }
  return "";
}

/**
 * Generates an athlete avatar with Dobok and initial badge if photo is missing or invalid.
 */
export function generateCompetitorAvatarDataUrl(candidateName: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 380;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Background gradient (Dark Obsidian Gold)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 380);
    bgGrad.addColorStop(0, "#1c1917");
    bgGrad.addColorStop(1, "#0c0a09");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 300, 380);

    // Head Silhouette
    ctx.fillStyle = "#e2b897";
    ctx.beginPath();
    ctx.arc(150, 105, 46, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(150, 92, 46, Math.PI, Math.PI * 2);
    ctx.fill();

    // Dobok Chest
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(70, 260);
    ctx.lineTo(150, 155);
    ctx.lineTo(230, 260);
    ctx.lineTo(250, 380);
    ctx.lineTo(50, 380);
    ctx.closePath();
    ctx.fill();

    // Gold Trim & Badge
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(150, 220, 22, 0, Math.PI * 2);
    ctx.fill();

    const initials = (candidateName || "C")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    ctx.fillStyle = "#0c0a09";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 150, 220);

    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/**
 * Resolves athlete photo data URL from URL or generates Dobok fallback.
 */
export async function getCompetitorPhotoDataUrl(photoUrl?: string, candidateName: string = "Athlete"): Promise<string> {
  if (photoUrl && typeof window !== "undefined") {
    try {
      const res = await fetch(photoUrl, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fallback
    }
  }
  return generateCompetitorAvatarDataUrl(candidateName);
}

/**
 * Builds the Master 2-Page CR80 Portrait jsPDF instance for Championship ID Card (Page 1 = Front, Page 2 = Back).
 */
export async function buildChampionshipIDCardPDFDoc(card: any): Promise<jsPDF | null> {
  if (!card) return null;

  const config = getChampionshipIdCardPdfConfig();

  const applicantName = cleanText(card.holderName || card.applicantName || card.athleteName || "Competitor");
  const athleteId = cleanText(card.athleteId || card.id || card.championshipApplicationId || "CHAMP-2026-0001");
  const bibNumber = cleanText(card.bibNumber || "BIB-001");
  const eventTitle = cleanText(card.eventTitle || card.eventName || "Championship 2026");
  const tier = cleanText(card.tournamentTier || card.level || "DISTRICT").toUpperCase();
  const discipline = cleanText(card.discipline || "Kalawar Martial Arts");
  const division = cleanText(card.ageDivision || "Open Division");
  const weight = cleanText(card.weightCategory || "Open Weight");
  const beltRank = cleanText(card.beltRank || "Competitor");
  const academy = cleanText(card.academyName || card.clubName || card.club || "Independent Athlete");
  const district = cleanText(card.district || card.city || "Pune");
  const state = cleanText(card.state || "Maharashtra");
  const dob = card.dob || card.dateOfBirth ? formatToDDMMYYYY(card.dob || card.dateOfBirth, "15/08/1998") : "15/08/1998";
  const bloodGroup = cleanText(card.bloodGroup || "");
  const validity = card.validUntil ? formatToDDMMYYYY(card.validUntil, "31/12/2026") : "SEASON 2026";
  const issueDate = card.issueDate ? formatToDDMMYYYY(card.issueDate, "01/01/2026") : "01/01/2026";
  const photoUrl = card.holderPhoto || card.athletePhoto || card.photo;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kalawar.org";
  const certUrl = `${origin}/id-cards/championship/${encodeURIComponent(card.id || athleteId)}`;

  const cardW = config.cardWidth || 54.0;
  const cardH = config.cardHeight || 68.08;

  const [frontTemplateDataUrl, backTemplateDataUrl, athletePhotoDataUrl, qrDataUrl] = await Promise.all([
    getChampionshipTemplateDataUrl(config.templateFront),
    getChampionshipTemplateDataUrl(config.templateBack),
    getCompetitorPhotoDataUrl(photoUrl, applicantName),
    generateChampionshipQRCodeDataUrl(certUrl),
  ]);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [cardW, cardH],
  });

  // =========================================================================
  // PAGE 1: FRONT SIDE
  // =========================================================================
  if (frontTemplateDataUrl) {
    doc.addImage(frontTemplateDataUrl, "PNG", 0, 0, cardW, cardH, undefined, "FAST");
  } else {
    // Dark luxury aesthetic fallback background
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, cardW, cardH, "F");
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 0, cardW, 2.5, "F");
  }

  // 1. Photo
  if (athletePhotoDataUrl) {
    try {
      doc.addImage(
        athletePhotoDataUrl,
        "JPEG",
        config.photo.x,
        config.photo.y,
        config.photo.width,
        config.photo.height,
        undefined,
        "FAST"
      );
    } catch (imgErr) {
      console.warn("Could not render photo in Championship ID card PDF:", imgErr);
    }
  }

  // 2. Front Scannable QR Code
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(
      config.qrCodeFront.x,
      config.qrCodeFront.y,
      config.qrCodeFront.size,
      config.qrCodeFront.size,
      "F"
    );
    doc.addImage(
      qrDataUrl,
      "PNG",
      config.qrCodeFront.x + 0.3,
      config.qrCodeFront.y + 0.3,
      config.qrCodeFront.size - 0.6,
      config.qrCodeFront.size - 0.6,
      undefined,
      "FAST"
    );
  }

  // Helper: Fits text cleanly on a single line within maxWidth by reducing font size and truncating if necessary
  const fitTextToWidth = (
    text: string,
    maxWidth: number,
    initialFontSize: number,
    minFontSize: number = 3.2
  ): { text: string; fontSize: number } => {
    let currentFontSize = initialFontSize;
    doc.setFontSize(currentFontSize);
    let textWidth = doc.getTextWidth(text);

    // Step down font size if it exceeds maxWidth
    while (textWidth > maxWidth && currentFontSize > minFontSize) {
      currentFontSize -= 0.15;
      doc.setFontSize(currentFontSize);
      textWidth = doc.getTextWidth(text);
    }

    // If still exceeding at minFontSize, truncate with ellipsis
    if (textWidth > maxWidth) {
      let truncated = text;
      while (truncated.length > 3 && doc.getTextWidth(truncated + "...") > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return { text: truncated.trim() + "...", fontSize: currentFontSize };
    }

    return { text, fontSize: currentFontSize };
  };

  // 3. Right 8 Form Fields (Baseline Aligned on Printed Underlines, Single-Line Auto-Fitted)
  const printField = (field: any, val: string) => {
    if (!val || !field) return;
    doc.setFont("helvetica", field.fontStyle || "bold");
    const maxW = field.maxWidth || (cardW - field.x - 2);
    const { text: fittedText, fontSize: fittedSize } = fitTextToWidth(
      val,
      maxW,
      field.fontSize || 5.0,
      3.2
    );
    doc.setFontSize(fittedSize);
    doc.setTextColor(field.color[0], field.color[1], field.color[2]);
    // Single-line print without wrapping
    doc.text(fittedText, field.x, field.y, {
      align: field.align || "left",
    });
  };

  const categoryDisplay = `${discipline}${beltRank ? ` · ${beltRank}` : ""}${weight ? ` (${weight})` : ""}`;
  const idNoDisplay = `${bibNumber} · ${athleteId}`;

  printField(config.participantName, applicantName);
  printField(config.teamDojoName, academy);
  printField(config.category, categoryDisplay);
  printField(config.ageGroup, division);
  printField(config.gender, card.gender || "Male");
  printField(config.events, eventTitle);
  printField(config.idNo, idNoDisplay);
  printField(config.bloodGroup, bloodGroup);

  // =========================================================================
  // PAGE 2: BACK SIDE
  // =========================================================================
  doc.addPage([cardW, cardH], "portrait");

  if (backTemplateDataUrl) {
    doc.addImage(backTemplateDataUrl, "PNG", 0, 0, cardW, cardH, undefined, "FAST");
  } else {
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, cardW, cardH, "F");
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 0, cardW, 2.5, "F");
  }

  // Back Scannable Verification QR Code
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(
      config.qrCodeBack.x,
      config.qrCodeBack.y,
      config.qrCodeBack.size,
      config.qrCodeBack.size,
      "F"
    );
    doc.addImage(
      qrDataUrl,
      "PNG",
      config.qrCodeBack.x + 0.5,
      config.qrCodeBack.y + 0.5,
      config.qrCodeBack.size - 1.0,
      config.qrCodeBack.size - 1.0,
      undefined,
      "FAST"
    );
  }

  return doc;
}

/**
 * Downloads the Championship ID Card as a 2-page print-ready PDF.
 */
export async function downloadChampionshipIdCardPDF(card: any): Promise<void> {
  const toastId = toast.loading("Generating official Championship ID Card PDF...");
  try {
    const doc = await buildChampionshipIDCardPDFDoc(card);
    if (!doc) {
      toast.error("Could not construct ID card document.", { id: toastId });
      return;
    }

    const applicantName = (card.holderName || card.applicantName || "Competitor").replace(/[^a-zA-Z0-9_-]/g, "_");
    const bib = (card.bibNumber || "BIB").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `KALAWAR_Championship_Pass_${bib}_${applicantName}.pdf`;

    doc.save(filename);
    toast.success("Championship ID Card downloaded successfully!", { id: toastId });
  } catch (err) {
    console.error("Error generating Championship ID Card PDF:", err);
    toast.error("Failed to generate Championship ID card PDF.", { id: toastId });
  }
}

/**
 * Opens the native browser print dialogue for the Championship ID Card PDF.
 */
export async function printChampionshipIdCard(card: any): Promise<void> {
  const toastId = toast.loading("Preparing Championship ID Card for printing...");
  try {
    const doc = await buildChampionshipIDCardPDFDoc(card);
    if (!doc) {
      toast.error("Could not construct ID card for printing.", { id: toastId });
      return;
    }

    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        toast.success("Print dialogue opened.", { id: toastId });
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 30000);
      }, 500);
    };
  } catch (err) {
    console.error("Print Championship ID Card error:", err);
    toast.error("Failed to open print dialogue.", { id: toastId });
  }
}
