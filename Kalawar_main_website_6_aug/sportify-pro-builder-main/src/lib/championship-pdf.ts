import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import type { ChampionshipApplication, ChampionshipCertificate } from "@/types/championship";

export function extractDayAndMonth(dateInput?: string | Date): { day: string; month: string } {
  if (!dateInput) return { day: "", month: "" };
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return { day, month };
    }
  } catch {}
  if (typeof dateInput === "string") {
    const parts = dateInput.split(/[-/]/);
    if (parts.length >= 2) {
      if (parts[0].length === 4) {
        return { day: parts[2].slice(0, 2), month: parts[1] };
      }
      return { day: parts[0], month: parts[1] };
    }
  }
  return { day: "", month: "" };
}

export function formatToDDMM(dateInput?: string | Date): string {
  const { day, month } = extractDayAndMonth(dateInput);
  if (!day && !month) return "";
  return `${day}  ${month}`;
}

export function cleanChampionshipText(str: string): string {
  if (!str) return "";
  return str.replace(/[\u3000-\u9fff\uac00-\ud7af]/g, "").trim();
}

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
 * Helper to print a jsPDF document using an iframe so the exact generated PDF is printed.
 */
function printJsPDFDoc(doc: jsPDF, documentTitle: string = "Document"): void {
  try {
    doc.autoPrint();
    const blobUrl = String(doc.output("bloburl"));
    if (typeof window !== "undefined") {
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
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          toast.success(`${documentTitle} print dialog opened!`);
        } catch {
          window.open(blobUrl, "_blank");
          toast.success(`${documentTitle} opened in print preview!`);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      };
    }
  } catch (err) {
    console.error("Print failed:", err);
    toast.error(`Failed to print ${documentTitle}`);
  }
}

/**
 * Draws a clean, crisp vector checkmark tick inside the award checkbox.
 * Replaces unicode characters that fail in standard PDF fonts.
 */
export function drawPdfCheckmark(
  doc: jsPDF,
  cx: number,
  cy: number,
  size: number = 3.6,
  color: [number, number, number] = [180, 20, 20]
): void {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.85);
  doc.setLineCap(1);
  doc.setLineJoin(1);

  const x1 = cx - size * 0.36;
  const y1 = cy + size * 0.05;
  const x2 = cx - size * 0.05;
  const y2 = cy + size * 0.38;
  const x3 = cx + size * 0.45;
  const y3 = cy - size * 0.38;

  doc.line(x1, y1, x2, y2);
  doc.line(x2, y2, x3, y3);
}

/**
 * Builds the jsPDF instance for Official Championship Registration Receipt & Competitor Pass.
 */
export async function generateChampionshipRegistrationReceiptDoc(
  app: ChampionshipApplication
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186 mm
  let y = margin;

  // Outer Border
  doc.setDrawColor(200, 160, 40);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 3, 3, "S");

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4, 2, 2, "S");

  // Header Band
  doc.setFillColor(15, 17, 23);
  doc.rect(margin + 2.5, margin + 2.5, contentWidth - 5, 32, "F");

  doc.setTextColor(245, 180, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, y + 10, { align: "center" });

  doc.setTextColor(220, 220, 220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("NATIONAL GOVERNING BODY OF INDIAN MARTIAL ARTS & COMBAT SCIENCES", pageWidth / 2, y + 15, { align: "center" });

  doc.setFillColor(245, 180, 50);
  doc.rect(margin + 20, y + 19, contentWidth - 40, 0.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("OFFICIAL CHAMPIONSHIP REGISTRATION RECEIPT & COMPETITOR PASS", pageWidth / 2, y + 26, { align: "center" });

  y += 36;

  // Top Details Bar: Registration ID & Assigned Bib
  doc.setFillColor(245, 245, 248);
  doc.roundedRect(margin + 5, y, contentWidth - 10, 14, 1.5, 1.5, "F");

  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("REGISTRATION NUMBER:", margin + 8, y + 6);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(app.id || app.applicationId || "CHAMP-APP", margin + 8, y + 11);

  if (app.bibNumber) {
    doc.setFillColor(230, 81, 0);
    doc.roundedRect(pageWidth - margin - 45, y + 2.5, 38, 9, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`BIB: ${app.bibNumber}`, pageWidth - margin - 26, y + 8.5, { align: "center" });
  } else {
    doc.setFillColor(80, 80, 80);
    doc.roundedRect(pageWidth - margin - 45, y + 2.5, 38, 9, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`STATUS: ${String(app.status || "PENDING").toUpperCase()}`, pageWidth - margin - 26, y + 8.5, { align: "center" });
  }

  y += 18;

  // Target Championship Details Box
  doc.setFillColor(254, 250, 240);
  doc.setDrawColor(240, 200, 100);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 5, y, contentWidth - 10, 26, 1.5, 1.5, "FD");

  doc.setTextColor(180, 120, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOURNAMENT FIXTURE", margin + 8, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(cleanChampionshipText(app.eventTitle || app.eventName || "National Championship"), margin + 8, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Venue / City: ${app.eventVenue ? `${app.eventVenue}, ` : ""}${app.eventCity || app.city || "Official Arena"}`, margin + 8, y + 18);
  doc.text(`Competition Dates: ${app.eventDate || "Official Fixture Scheduled Dates"}`, margin + 8, y + 23);

  y += 31;

  // Competitor & Division Details Table
  const leftColX = margin + 8;
  const rightColX = pageWidth / 2 + 5;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("COMPETITOR CREDENTIALS", leftColX, y);
  doc.text("DIVISION & CATEGORY", rightColX, y);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin + 5, y + 2, pageWidth - margin - 5, y + 2);

  y += 7;

  const rowH = 7;
  const drawRow = (label1: string, val1: any, label2: string, val2: any) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(label1, leftColX, y);
    doc.text(label2, rightColX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(cleanChampionshipText(val1), leftColX + 32, y);
    doc.text(cleanChampionshipText(val2), rightColX + 32, y);

    y += rowH;
  };

  drawRow("Full Name:", app.applicantName || app.athleteName, "Discipline:", app.discipline);
  drawRow("Date of Birth:", formatToDDMMYYYY(app.dob) || app.dob, "Age Division:", app.ageDivision);
  drawRow("Gender:", app.gender, "Weight Category:", app.weightCategory);
  drawRow("Athlete ID:", app.athleteId || "Pending KSM Pass", "Belt Rank:", app.beltRank);
  drawRow("Academy / Club:", app.clubName || app.club || "Independent", "State Association:", app.state);
  drawRow("Email Address:", app.email, "Coach Name:", app.coachName || "Independent Coach");
  drawRow("Contact Phone:", app.phone, "City / District:", app.city || app.eventCity || "Maharashtra");

  y += 4;

  // QR Code Box & Accreditation Rules
  const appId = app.id || app.applicationId || "CHAMP-APP";
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/championship/register?id=${encodeURIComponent(appId)}`
    : `/championship/register?id=${appId}`;
  const qrDataUrl = await generateChampionshipQRCodeDataUrl(qrUrl);

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin + 5, y, contentWidth - 10, 52, 2, 2, "FD");

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", margin + 8, y + 6, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text("SCAN TO VERIFY", margin + 27, y + 48, { align: "center" });
  }

  // If athlete photo is present, place in the QR/Accreditation section or badge
  const photoUrl = app.photo || app.athletePhoto;
  let photoWidthOffset = 0;
  if (photoUrl && photoUrl.startsWith("data:image")) {
    try {
      const format = photoUrl.includes("image/png") ? "PNG" : "JPEG";
      const photoBoxW = 28;
      const photoBoxH = 36;
      const photoBoxX = pageWidth - margin - 35;
      const photoBoxY = y + 6;
      doc.addImage(photoUrl, format, photoBoxX, photoBoxY, photoBoxW, photoBoxH);
      doc.setDrawColor(200, 160, 40);
      doc.setLineWidth(0.4);
      doc.rect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("ATHLETE PHOTO", photoBoxX + photoBoxW / 2, photoBoxY + photoBoxH + 4, { align: "center" });
      photoWidthOffset = 38;
    } catch (e) {
      console.warn("Could not render photo in registration receipt PDF:", e);
    }
  }

  const rulesX = margin + 50;
  let ruleY = y + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 120, 20);
  doc.text("IMPORTANT TOURNAMENT DAY PROTOCOL", rulesX, ruleY);

  ruleY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);

  const rulesList = [
    "1. Mandatory Weigh-In: Competitors must weigh in on the morning of their match in official uniform.",
    "2. Athlete Pass: Carry this printed receipt and government ID proof (Aadhar/School ID) at entry.",
    "3. Reporting Time: Arrive at the Warm-up Area minimum 1 hour prior to your division scheduled time.",
    "4. Safety Equipment: Federation approved protective gear and official uniform are mandatory.",
    "5. Zero Tolerance: Unsportsmanlike conduct by athlete or corner coaches will result in immediate DQ.",
  ];

  const maxRuleWidth = contentWidth - 55 - photoWidthOffset;
  for (const rule of rulesList) {
    doc.text(rule, rulesX, ruleY, { maxWidth: maxRuleWidth });
    ruleY += 7;
  }

  y += 58;

  // Footer & Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized by: KALAWAR Technical Committee", margin + 8, y + 8);
  doc.text(`Generated on: ${formatToDDMMYYYY(new Date().toISOString())}`, pageWidth - margin - 8, y + 8, { align: "right" });

  return doc;
}

/**
 * Generates and downloads the Official Championship Registration Receipt & Competitor Pass PDF.
 */
export async function downloadChampionshipRegistrationReceiptPDF(
  app: ChampionshipApplication,
  filename?: string
): Promise<boolean> {
  try {
    const doc = await generateChampionshipRegistrationReceiptDoc(app);
    const candidateName = app.applicantName || app.athleteName || "Competitor";
    const appId = app.id || app.applicationId || "CHAMP-APP";
    const safeName = (filename || `Championship_Receipt_${candidateName}_${appId}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`${safeName}.pdf`);
    toast.success("Championship Registration Receipt Downloaded!");
    return true;
  } catch (err) {
    console.error("Failed to generate championship registration receipt:", err);
    toast.error("Failed to generate registration receipt PDF");
    return false;
  }
}

/**
 * Print registration receipt directly using the exact generated PDF.
 */
export async function printChampionshipRegistrationReceiptPDF(app: ChampionshipApplication): Promise<void> {
  try {
    toast.loading("Preparing Championship Registration Receipt for print...", { id: "champ-print" });
    const doc = await generateChampionshipRegistrationReceiptDoc(app);
    toast.dismiss("champ-print");
    printJsPDFDoc(doc, "Championship Registration Slip");
  } catch (err) {
    console.error("Print registration receipt failed:", err);
    toast.dismiss("champ-print");
    toast.error("Failed to prepare registration slip for print");
  }
}

import {
  getChampionshipPdfConfig,
  getChampionshipWebConfig,
  ChampionshipPdfConfig,
} from "@/config/championship-certificate-coordinates";

/**
 * Fetches the master championship certificate template as a base64 Data URL.
 */
export async function getChampionshipTemplateImageDataUrl(levelOrTier?: string): Promise<string> {
  const config = getChampionshipPdfConfig(levelOrTier);
  const paths = [config.templateImage, config.templateImageFallback].filter(Boolean) as string[];

  if (typeof window !== "undefined") {
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl && dataUrl.startsWith("data:image")) return dataUrl;
        }
      } catch (err) {
        console.warn(`Championship template load failed for ${path}:`, err);
      }
    }
  }
  return "";
}

/**
 * Resolves the official event / discipline title to display on the Event line of the certificate.
 * Extracts authentic martial arts discipline or event title, avoiding generic non-martial sports (e.g. Football).
 */
export function getChampionshipEventName(cert: {
  discipline?: string;
  championshipTitle?: string;
  eventName?: string;
  event?: string;
}): string {
  const d = (cert.discipline || "").trim();
  const invalid = ["football", "cricket", "basketball", "volleyball", "swimming", "badminton", "gymnastics", "athletics"];
  const title = (cert.championshipTitle || cert.eventName || cert.event || "").trim();
  const titleLower = title.toLowerCase();

  // If discipline is not generic ball sport, use it
  if (d && !invalid.includes(d.toLowerCase())) {
    return d;
  }

  // Extract from tournament event title
  if (titleLower.includes("santulana")) return "Santulana";
  if (titleLower.includes("sparsha")) return "Sparsha Yuddha";
  if (titleLower.includes("kaya")) return "Kaya Yuddha";
  if (titleLower.includes("charana")) return "Charana Yuddha";
  if (titleLower.includes("sangama") || titleLower.includes("malla") || titleLower.includes("danda")) return "Sangama Kala";

  return title || "Sparsha Yuddha";
}

/**
 * Resolves the official martial arts category title for championship certificate rendering.
 * Matches official discipline styles and avoids raw concatenation or duplicate participant notes.
 */
export function getChampionshipCategoryTitle(cert: {
  category?: string;
  discipline?: string;
  division?: string;
  ageDivision?: string;
  championshipTitle?: string;
  eventName?: string;
  event?: string;
}): string {
  const explicitCategory = (cert.category || "").trim();
  if (
    explicitCategory &&
    !explicitCategory.toLowerCase().includes("participant") &&
    !explicitCategory.toLowerCase().includes("championship")
  ) {
    return explicitCategory;
  }
  const disc = (cert.discipline || "").toLowerCase();
  const title = (cert.championshipTitle || cert.eventName || cert.event || "").toLowerCase();

  if (disc.includes("santulana") || title.includes("santulana")) return "Balance & Agility";
  if (disc.includes("sparsha") || title.includes("sparsha")) return "Semi Contact Fight";
  if (disc.includes("kaya") || title.includes("kaya")) return "Hand Striking Combat";
  if (disc.includes("charana") || title.includes("charana")) return "Kicking Combat";
  if (
    disc.includes("sangama") ||
    disc.includes("malla") ||
    disc.includes("danda") ||
    disc.includes("anukkama") ||
    title.includes("sangama") ||
    title.includes("malla")
  ) {
    return "Malla Yuddha / Traditional Combat";
  }
  return cert.division || "Semi Contact Fight";
}

/**
 * Resolves the official place string for championship certificate rendering.
 * For District certificates, ensures athlete's district/city/state is shown rather than national default.
 */
export function getChampionshipPlaceString(cert: ChampionshipCertificate | any, levelOrTier?: string): string {
  const isDistrict =
    !levelOrTier ||
    String(levelOrTier).toLowerCase() === "district" ||
    (cert.level && String(cert.level).toLowerCase() === "district");

  if (isDistrict) {
    const rawLocation = cert.eventLocation || cert.eventVenue || "";
    if (rawLocation && !rawLocation.toLowerCase().includes("national")) {
      return rawLocation;
    }
    return (
      cert.district ||
      cert.city ||
      cert.eventCity ||
      cert.state ||
      "District Sports Complex"
    );
  }

  return (
    cert.eventLocation ||
    cert.eventVenue ||
    cert.district ||
    cert.city ||
    cert.state ||
    "National Tournament Arena"
  );
}

/**
 * Builds the jsPDF instance for Official Championship Diploma (Landscape A4: 297x210mm).
 */
export async function generateChampionshipDiplomaDoc(
  cert: ChampionshipCertificate | any
): Promise<jsPDF> {
  const levelOrTier = (cert as any).level || cert.championshipTitle || cert.eventName || "district";
  const config = getChampionshipPdfConfig(levelOrTier);

  const certNumber = (cert as any).certificateNumber || (cert as any).number || (cert as any).id || "KAL-2026-0001";

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [config.pageWidth, config.pageHeight],
  });

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/certificates/championship/${encodeURIComponent(certNumber)}`
    : `https://kalawarfederation.org/certificates/championship/${encodeURIComponent(certNumber)}`;

  // Load Background Template Image and QR Code concurrently
  const [templateDataUrl, qrDataUrl] = await Promise.all([
    getChampionshipTemplateImageDataUrl(levelOrTier),
    generateChampionshipQRCodeDataUrl(qrUrl),
  ]);

  if (templateDataUrl) {
    // 1. Master Background Artwork
    doc.addImage(templateDataUrl, "PNG", 0, 0, config.pageWidth, config.pageHeight, undefined, "FAST");

    // Helper to render text fields with config styles
    const renderField = (field: typeof config.candidateName, text: string) => {
      if (!field || !text) return;
      doc.setFont(field.fontFamily || "helvetica", field.fontStyle || "bold");
      doc.setFontSize(field.fontSize || 12);
      const color = field.textColor || [20, 20, 30];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, field.x, field.y, {
        align: field.align || "left",
        maxWidth: field.maxWidth,
      });
    };

    // 2. Candidate Name on "Mr. / Ms."
    const candidateName =
      (cert as any).candidateName ||
      (cert as any).applicantName ||
      (cert as any).athleteName ||
      (cert as any).holder ||
      (cert as any).name ||
      "Competitor";
    renderField(config.candidateName, candidateName);

    // 3. Form Lines
    const eventName = getChampionshipEventName(cert);
    const categoryTitle = getChampionshipCategoryTitle(cert);
    const ageGroupTitle =
      cert.ageDivision && !cert.ageDivision.toLowerCase().includes("participant")
        ? cert.ageDivision
        : "Senior Open (18-29)";

    renderField(config.eventDiscipline, eventName);
    renderField(config.category, categoryTitle);
    renderField(config.ageGroup, ageGroupTitle);
    renderField(config.weightCategory, cert.weightCategory || "-50.0 kg");

    // 4. Award Checkbox Tick Mark
    const awardLower = (cert.awardType || cert.place || cert.podiumPlace || (cert as any).position || "").toLowerCase();
    let tickBox = config.awardBoxes.participation;
    if (awardLower.includes("gold") || awardLower.includes("1st")) {
      tickBox = config.awardBoxes.gold;
    } else if (awardLower.includes("silver") || awardLower.includes("2nd")) {
      tickBox = config.awardBoxes.silver;
    } else if (awardLower.includes("bronze") || awardLower.includes("3rd")) {
      tickBox = config.awardBoxes.bronze;
    }

    if (tickBox) {
      drawPdfCheckmark(doc, tickBox.x, tickBox.y, 3.6, [180, 20, 20]);
    }

    // 5. Bottom Metadata
    const certNumDisplay = certNumber
      ? certNumber.replace(/^KAL-2026-([A-Za-z]-)?/i, "").replace(/^CERT-CHAMP-2026-([A-Za-z]-)?/i, "")
      : "0104";
    renderField(config.certNumberSuffix, certNumDisplay);

    const rawIssueDate = (cert as any).issueDate || (cert as any).certificateIssuedAt || (cert as any).issued || new Date().toISOString();
    const { day, month } = extractDayAndMonth(rawIssueDate);
    if (config.eventDay && config.eventMonth) {
      renderField(config.eventDay, day);
      renderField(config.eventMonth, month);
    } else if (config.eventDate) {
      renderField(config.eventDate, `${day}   ${month}`);
    }

    const placeStr = getChampionshipPlaceString(cert, levelOrTier);
    renderField(config.eventPlace, placeStr);

    // 6. QR Code inside the QR frame
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", config.qrCode.x, config.qrCode.y, config.qrCode.width, config.qrCode.height);
    }
  } else {
    // Fallback vector drawing if template image cannot be fetched
    const pageWidth = config.pageWidth;
    const pageHeight = config.pageHeight;
    const margin = 10;

    doc.setFillColor(253, 252, 248);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(1.2);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, margin + 18, { align: "center" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.text("OFFICIAL CHAMPIONSHIP DIPLOMA", pageWidth / 2, margin + 35, { align: "center" });

    const candidateName = cert.candidateName || cert.athleteName || "Competitor";
    doc.setFontSize(20);
    doc.text(candidateName, pageWidth / 2, margin + 65, { align: "center" });

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 35, pageHeight - margin - 35, 25, 25);
    }
  }

  return doc;
}

/**
 * Generates and downloads the Official Championship Diploma PDF (Landscape).
 */
export async function downloadChampionshipDiplomaPDF(
  cert: ChampionshipCertificate,
  filename?: string
): Promise<boolean> {
  try {
    const doc = await generateChampionshipDiplomaDoc(cert);
    const candidateName = cert.candidateName || cert.athleteName || "Competitor";
    const safeName = (filename || `Championship_Diploma_${candidateName}_${cert.certificateNumber}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`${safeName}.pdf`);
    toast.success("Official Championship Diploma Downloaded!");
    return true;
  } catch (err) {
    console.error("Failed to generate championship diploma PDF:", err);
    toast.error("Failed to generate championship diploma");
    return false;
  }
}

/**
 * Print championship diploma directly using the exact generated PDF.
 */
export async function printChampionshipDiplomaPDF(cert: ChampionshipCertificate): Promise<void> {
  try {
    toast.loading("Preparing Championship Certificate for print...", { id: "champ-cert-print" });
    const doc = await generateChampionshipDiplomaDoc(cert);
    toast.dismiss("champ-cert-print");
    printJsPDFDoc(doc, "Championship Certificate");
  } catch (err) {
    console.error("Print championship diploma failed:", err);
    toast.dismiss("champ-cert-print");
    toast.error("Failed to prepare diploma for print");
  }
}
