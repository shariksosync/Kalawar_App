import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import { SIGNATORIES, type CertificateItem } from "@/types/certificate";
import {
  clubCertificatePrintCoordinates,
  clubCertificateDownloadPdfCoordinates,
  certificatePageDownloadPdfCoordinates,
  type ClubCertificatePdfConfig,
} from "@/config/club-certificate-coordinates";

async function generateQRDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return "";
  }
}

async function getRefereeTemplateDataUrl(templatePath: string): Promise<string> {
  if (!templatePath) return "";
  if (templatePath.startsWith("data:")) return templatePath;
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
      console.warn("Fetch note for image:", err);
    }

    try {
      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/jpeg", 0.95));
              return;
            }
          } catch {}
          resolve("");
        };
        img.onerror = () => resolve("");
        img.src = templatePath;
      });
    } catch {}
  }
  return "";
}

/**
 * Generates jsPDF document for Official Referee Certificates (Levels 1, 2, 3)
 */
export async function generateRefereeCertificatePDF(
  cert: CertificateItem
): Promise<{ doc: jsPDF; fileName: string } | null> {
  const isRefereeCert =
    cert.type === "Referee / Technical Official Certificate" ||
    cert.position?.toLowerCase().includes("referee") ||
    cert.event?.toLowerCase().includes("referee");

  if (!isRefereeCert) return null;

  const isLevel3 =
    cert.position?.includes("Level 3") ||
    cert.event?.includes("Level 3");
  const isLevel2 =
    cert.position?.includes("Level 2") ||
    cert.event?.includes("Level 2");

  const templatePath = isLevel3
    ? "/certificates/referee-templates/referee-level-3.png"
    : isLevel2
    ? "/certificates/referee-templates/referee-level-2.png"
    : "/certificates/referee-templates/referee-level-1.png";

  const templateDataUrl = await getRefereeTemplateDataUrl(templatePath);
  if (!templateDataUrl) return null;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates?number=${encodeURIComponent(cert.number)}`
      : `https://kalawarfederation.org/certificates?number=${encodeURIComponent(cert.number)}`;

  const qrDataUrl = await generateQRDataUrl(verifyUrl);

  // Draw Full A4 Background Template
  doc.addImage(templateDataUrl, "PNG", 0, 0, 297, 210);

  // 1. Candidate Full Name
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  const yName = isLevel2 ? 93.2 : 98.8;
  doc.text(cert.holder.toUpperCase(), 148.5, yName, { align: "center" });

  // 2. Left Column Details (X = 77 mm)
  doc.setFontSize(8.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  if (isLevel2) {
    // Level 2 Left column (starts after colon at X = 86.0 mm, underlines at 128.0, 134.3, 140.7, 146.8, 152.6 mm)
    doc.text(cert.number || "KAC-CERT-2026-1001", 86.0, 126.8);
    doc.text(formatToDDMMYYYY((cert as any).dob, "15/08/1996"), 86.0, 133.1);
    doc.text(cert.academy || "Kalawar Combat Club", 86.0, 139.5);
    doc.text(cert.district || "Mumbai Suburban", 86.0, 145.6);
    doc.text(cert.state || "Maharashtra", 86.0, 151.4);
  } else {
    // Level 1 & 3 Left column (underlines start at 77.7 mm; text at X = 80.5 mm, baselines at 132.0, 137.6, 143.5, 149.2, 154.9 mm)
    doc.text(cert.number || "KAC-CERT-2026-1001", 80.5, 132.0);
    doc.text(formatToDDMMYYYY((cert as any).dob, "15/08/1996"), 80.5, 137.6);
    doc.text(cert.academy || "Kalawar Combat Club", 80.5, 143.5);
    doc.text(cert.district || "Mumbai Suburban", 80.5, 149.2);
    doc.text(cert.state || "Maharashtra", 80.5, 154.9);
  }

  // 3. Right Column Details
  if (isLevel2) {
    // Level 2 Right column (starts after colon at X = 193.0 mm, underlines at 128.1, 134.3, 140.7, 146.8, 152.6, 158.1 mm)
    doc.text((cert as any).discipline || "Kalawar Martial Arts", 193.0, 126.9);
    doc.text(cert.rankOrBelt || "1st Dan Black Belt", 193.0, 133.1);
    doc.text(formatToDDMMYYYY((cert as any).examDate || cert.issued, "10/02/2026"), 193.0, 139.5);
    doc.text((cert as any).venue || "National Sports Complex, Pune", 193.0, 145.6);
    doc.text(formatToDDMMYYYY(cert.issued, "10/02/2026"), 193.0, 151.4);
    doc.text(formatToDDMMYYYY(cert.validUntil, cert.validUntil || "2 Years"), 193.0, 156.9);
  } else {
    // Level 1 & 3 Right column (underlines at 132.8, 138.2, 143.4, 148.8, 154.4, 159.8 mm)
    doc.text((cert as any).discipline || "Kalawar Martial Arts", 189, 131.8);
    doc.text(cert.rankOrBelt || "1st Dan Black Belt", 189, 137.2);
    doc.text(formatToDDMMYYYY((cert as any).examDate || cert.issued, "10/02/2026"), 189, 142.4);
    doc.text((cert as any).venue || "National Sports Complex, Pune", 189, 147.8);
    doc.text(formatToDDMMYYYY(cert.issued, "10/02/2026"), 189, 153.4);
    doc.text(formatToDDMMYYYY(cert.validUntil, cert.validUntil || "2 Years"), 189, 158.8);
  }

  // 4. Live Scannable Dynamic QR Code (Exact template frame fit)
  if (qrDataUrl) {
    if (isLevel2) {
      // Level 2 QR frame (x = 253.8 mm, y = 123.5 mm, size = 23.7 mm)
      doc.setFillColor(255, 255, 255);
      doc.rect(253.8, 123.5, 23.7, 23.7, "F");
      doc.addImage(qrDataUrl, "PNG", 253.8, 123.5, 23.7, 23.7);
    } else {
      // Level 1 & Level 3 QR frame (x = 253.4 mm, y = 131.2 mm, size = 22.5 mm)
      doc.setFillColor(255, 255, 255);
      doc.rect(253.4, 131.2, 22.5, 22.5, "F");
      doc.addImage(qrDataUrl, "PNG", 253.4, 131.2, 22.5, 22.5);
    }
  }

  const levelLabel = isLevel3
    ? "Level_3_National_Referee"
    : isLevel2
    ? "Level_2_State_Referee"
    : "Level_1_Junior_Referee";
  const fileName = `KALAWAR_${levelLabel}_Certificate_${cert.holder.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  return { doc, fileName };
}

/**
 * Generates jsPDF document for Official Coach Certificate using the official KALAWAR portrait artwork template
 */
export async function generateCoachCertificatePDF(
  coachOrCert: any
): Promise<{ doc: jsPDF; fileName: string } | null> {
  const data = coachOrCert || {};
  const coachLevelCheck = (data.qualification || data.level || data.coachLevel || "").toString();
  if (
    coachLevelCheck === "Level 0" ||
    coachLevelCheck === "Level 0 - Trainee Coach" ||
    coachLevelCheck.toLowerCase().includes("level 0") ||
    coachLevelCheck.toLowerCase().includes("trainee coach")
  ) {
    toast.error("Level 0 Coaches do not hold an official certificate.", {
      description: "Official certification is conferred for Level 1, Level 2, Level 3, and International coaches.",
    });
    return null;
  }

  const templatePathPng = "/certificates/coach-templates/coach-certificate-template.png";
  const templatePathJpg = "/certificates/coach-templates/coach-certificate-template.jpg";

  let templateDataUrl = await getRefereeTemplateDataUrl(templatePathPng);
  if (!templateDataUrl) {
    templateDataUrl = await getRefereeTemplateDataUrl(templatePathJpg);
  }
  if (!templateDataUrl) return null;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const certNumber =
    data.affiliationCertificateId ||
    data.certificateNumber ||
    data.number ||
    (data.id
      ? data.id.startsWith("KAL-CO-")
        ? data.id
        : `KAL-CO-${data.id.replace(/[^0-9]/g, "").slice(-4) || "2026-001"}`
      : "KAL-CO-2026-001");

  const certSuffix = certNumber.replace(/^KAL-CO-/i, "").replace(/^KSM-CO-/i, "").replace(/^WSF-CO-/i, "");

  const coachName = (
    data.name ||
    data.holder ||
    data.coachName ||
    "Authorized Master Coach"
  ).toUpperCase();

  const coachLevel =
    data.qualification ||
    data.level ||
    data.coachLevel ||
    "Level 2 - National Coach";

  const discipline = data.discipline || "Kalawar Martial Arts";

  const danBelt =
    data.beltRank ||
    data.danRank ||
    data.rankOrBelt ||
    data.specialization ||
    "3rd Dan Black Belt";

  const dob = formatToDDMMYYYY(data.dob, "15/08/1990");

  const academyClub =
    data.club ||
    data.academy ||
    data.academyName ||
    "Independent / National Academy";

  const district = data.district || data.city || "Pune";
  const state = data.state || "Maharashtra";

  const examDate = formatToDDMMYYYY(
    data.examDate || data.registeredOn,
    "12/01/2026"
  );
  const venue = data.venue || "National Sports Complex, Pune";

  const rawIssue =
    data.issueDate || data.issued || data.registeredOn || new Date().toISOString();
  const issueDate = formatToDDMMYYYY(rawIssue, "15/01/2026");

  const rawValid = data.validUntil || `${new Date().getFullYear() + 2}-12-31`;
  const validUntil = formatToDDMMYYYY(rawValid, "31/12/2028");

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates?number=${encodeURIComponent(certNumber)}`
      : `https://kalawarfederation.org/certificates?number=${encodeURIComponent(certNumber)}`;

  const qrDataUrl = await generateQRDataUrl(verifyUrl);

  // 1. Draw Full A4 Portrait Background Template (210 x 297 mm)
  doc.addImage(templateDataUrl, "PNG", 0, 0, 210, 297);

  // 2. Certificate Number (e.g. Suffix next to "Certificate No. : KAL-CO-")
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(certSuffix || certNumber, 109.5, 113.2);

  // 3. Coach Full Name (Center Under "This is to certify that")
  doc.setTextColor(153, 27, 27); // #991b1b Deep burgundy
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17.5);
  doc.text(coachName, 105, 131.8, { align: "center", maxWidth: 165 });

  // 4. Left Column Details Table Values (Aligned to the row underlines at X = 64.0 mm)
  doc.setFontSize(8.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  doc.text(coachLevel, 64.0, 173.8, { maxWidth: 72 });
  doc.text(discipline, 64.0, 179.5, { maxWidth: 72 });
  doc.text(danBelt, 64.0, 185.3, { maxWidth: 72 });
  doc.text(dob, 64.0, 191.0, { maxWidth: 72 });
  doc.text(academyClub, 64.0, 196.7, { maxWidth: 72 });
  doc.text(district, 64.0, 202.4, { maxWidth: 72 });
  doc.text(state, 64.0, 208.1, { maxWidth: 72 });
  doc.text(examDate, 64.0, 213.8, { maxWidth: 72 });
  doc.text(venue, 64.0, 219.5, { maxWidth: 72 });
  doc.text(issueDate, 64.0, 225.2, { maxWidth: 72 });

  // Valid Until in Highlight Burgundy/Red
  doc.setTextColor(185, 28, 28); // #b91c1c
  doc.text(validUntil, 64.0, 230.9, { maxWidth: 72 });

  // 5. Right Side Passport Profile Photo Box (x = 147.2 mm, y = 169.8 mm, w = 40.3 mm, h = 37.4 mm)
  const coachPhoto = data.image || data.photo;
  if (coachPhoto && typeof window !== "undefined") {
    try {
      const photoDataUrl = await getRefereeTemplateDataUrl(coachPhoto);
      if (photoDataUrl) {
        const imageFormat = photoDataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.saveGraphicsState();
        doc.roundedRect(147.2, 169.8, 40.3, 37.4, 4.5, 4.5, null);
        doc.clip();
        doc.discardPath();
        doc.addImage(photoDataUrl, imageFormat, 147.2, 169.8, 40.3, 37.4);
        doc.restoreGraphicsState();
      }
    } catch (e) {
      console.warn("Coach photo draw note:", e);
    }
  }

  // 6. Live Scannable Dynamic QR Code (Pixel-calibrated fit: x = 153.9 mm, y = 209.8 mm, size = 26.5 mm)
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(153.9, 209.8, 26.5, 26.5, "F");
    doc.addImage(qrDataUrl, "PNG", 153.9, 209.8, 26.5, 26.5);
  }

  const sanitized = coachName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const fileName = `KALAWAR_Coach_Certificate_${certNumber}_${sanitized}.pdf`;

  return { doc, fileName };
}

/**
 * Downloads official Coach Certificate PDF.
 */
export async function downloadCoachCertificatePDF(data: any): Promise<void> {
  try {
    toast.loading("Generating Official Coach Certificate PDF...", { id: "coach-cert-pdf" });
    const result = await generateCoachCertificatePDF(data);
    if (result) {
      result.doc.save(result.fileName);
      toast.success("Coach Certificate PDF downloaded successfully!", { id: "coach-cert-pdf" });
    } else {
      toast.error("Failed to load certificate template.", { id: "coach-cert-pdf" });
    }
  } catch (error) {
    console.error("Coach Certificate PDF download error:", error);
    toast.error("Failed to generate Coach Certificate PDF.", { id: "coach-cert-pdf" });
  }
}

/**
 * Opens browser print dialog for Coach Certificate.
 */
export async function printCoachCertificate(data: any): Promise<void> {
  try {
    toast.loading("Preparing Coach Certificate for print...", { id: "coach-cert-print" });
    const result = await generateCoachCertificatePDF(data);
    if (!result) {
      toast.error("Failed to generate print document.", { id: "coach-cert-print" });
      return;
    }
    result.doc.autoPrint();
    const blobUrl = String(result.doc.output("bloburl"));
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
          toast.success("Print dialog opened!", { id: "coach-cert-print" });
        } catch {
          window.open(blobUrl, "_blank");
          toast.success("Certificate opened in print window!", { id: "coach-cert-print" });
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 60000);
        }
      };
    }
  } catch (error) {
    console.error("Coach Certificate print error:", error);
    toast.error("Failed to print coach certificate.", { id: "coach-cert-print" });
  }
}

export interface AffiliationLevelsSelection {
  isState: boolean;
  isDistrict: boolean;
  isClub: boolean;
  isDojo: boolean;
}

/**
 * Resolves all active affiliation level categories from club data.
 */
export function resolveAffiliationLevels(data: any): AffiliationLevelsSelection {
  const list: string[] = [];

  if (Array.isArray(data?.levelsOfAffiliation)) {
    list.push(...data.levelsOfAffiliation);
  } else if (typeof data?.levelsOfAffiliation === "string" && data.levelsOfAffiliation.trim()) {
    list.push(...data.levelsOfAffiliation.split(",").map((s: string) => s.trim()));
  }

  if (typeof data?.levelOfAffiliation === "string" && data.levelOfAffiliation.trim()) {
    list.push(...data.levelOfAffiliation.split(",").map((s: string) => s.trim()));
  }
  if (typeof data?.clubCategory === "string" && data.clubCategory.trim()) {
    list.push(...data.clubCategory.split(",").map((s: string) => s.trim()));
  }
  if (typeof data?.category === "string" && data.category.trim()) {
    list.push(...data.category.split(",").map((s: string) => s.trim()));
  }
  if (typeof data?.level === "string" && data.level.trim()) {
    list.push(...data.level.split(",").map((s: string) => s.trim()));
  }

  const lower = list.map((s) => s.toLowerCase());
  const isState = lower.some((s) => s.includes("state"));
  const isDistrict = lower.some((s) => s.includes("district"));
  const isDojo = lower.some((s) => s.includes("dojo") || s.includes("class"));
  let isClub = lower.some((s) => s.includes("academy") || s.includes("club"));

  if (!isState && !isDistrict && !isDojo && !isClub) {
    isClub = true;
  }

  return { isState, isDistrict, isClub, isDojo };
}

/**
 * Resolves the primary affiliation level category from club data.
 */
export function resolveAffiliationLevel(data: any): "State" | "District" | "Academy/Club" | "Dojo" {
  const { isState, isDistrict, isDojo } = resolveAffiliationLevels(data);
  if (isState) return "State";
  if (isDistrict) return "District";
  if (isDojo) return "Dojo";
  return "Academy/Club";
}

/**
 * Generates jsPDF document for Official Club Affiliation Certificate / Letter
 */
export async function generateClubAffiliationCertificatePDF(
  data: any,
  options?: { mode?: "download" | "print"; customConfig?: ClubCertificatePdfConfig }
): Promise<{ doc: jsPDF; fileName: string } | null> {
  const mode = options?.mode || "download";
  const activeCfg =
    options?.customConfig ||
    (mode === "print"
      ? clubCertificatePrintCoordinates
      : clubCertificateDownloadPdfCoordinates);
  const templatePath = activeCfg.templatePath;
  const templateDataUrl = await getRefereeTemplateDataUrl(templatePath);

  if (!templateDataUrl) return null;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let resolvedData = { ...data };
  if (
    typeof window !== "undefined" &&
    (!data.levelsOfAffiliation || data.levelsOfAffiliation.length === 0) &&
    !data.levelOfAffiliation
  ) {
    const clubId = data.kalawarId || data.id || data.number;
    if (clubId) {
      try {
        const res = await fetch(`/api/clubs/${encodeURIComponent(clubId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.club) {
            resolvedData = { ...json.club, ...data, ...json.club };
          }
        }
      } catch (e) {
        // silent fallback
      }
    }
  }

  const affiliationNo =
    resolvedData.affiliationCertificateId ||
    resolvedData.affiliationNumber ||
    resolvedData.certificateNumber ||
    resolvedData.number ||
    resolvedData.id ||
    "KAC-AFF-2026-001";

  const rawDate =
    resolvedData.issueDate ||
    resolvedData.issued ||
    resolvedData.createdAt ||
    new Date().toISOString();
  const dateObj = new Date(rawDate);
  const isValidDate = !isNaN(dateObj.getTime());
  const day = isValidDate ? String(dateObj.getDate()).padStart(2, "0") : "16";
  const month = isValidDate ? String(dateObj.getMonth() + 1).padStart(2, "0") : "09";
  const year = isValidDate ? String(dateObj.getFullYear()) : "2026";

  const clubName = (
    resolvedData.name ||
    resolvedData.academyName ||
    resolvedData.holder ||
    resolvedData.academy ||
    "Official Martial Arts Club"
  ).toUpperCase();

  const state = resolvedData.state || "Maharashtra";
  const district = resolvedData.district || resolvedData.city || "Pune";
  const academyName =
    resolvedData.name ||
    resolvedData.academyName ||
    resolvedData.academy ||
    clubName;
  const headCoach =
    resolvedData.headCoachName ||
    resolvedData.headCoach ||
    resolvedData.presidentName ||
    resolvedData.president ||
    resolvedData.instructor ||
    resolvedData.holder ||
    "Authorized Head Coach";
  const contactNo =
    resolvedData.phone ||
    resolvedData.contactNo ||
    resolvedData.emergencyContact ||
    resolvedData.mobile ||
    resolvedData.alternatePhone ||
    "+91 98220 12345";

  const { isState, isDistrict, isClub, isDojo } = resolveAffiliationLevels(resolvedData);

  const certLookupId =
    resolvedData.kalawarId ||
    resolvedData.id ||
    resolvedData.affiliationCertificateId ||
    resolvedData.affiliationNumber ||
    resolvedData.certificateNumber ||
    resolvedData.number ||
    affiliationNo;

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/clubs/${encodeURIComponent(certLookupId)}/certificate`
      : `https://kalawar.org/clubs/${encodeURIComponent(certLookupId)}/certificate`;

  const qrDataUrl = await generateQRDataUrl(verifyUrl);

  // Draw Full A4 Portrait Background Template (210 x 297 mm)
  doc.addImage(templateDataUrl, "PNG", 0, 0, 210, 297);

  const printCfg = activeCfg;

  // 1. Top Left: Affiliation No.
  const affCfg = printCfg.affiliationNo;
  const [affR, affG, affB] = affCfg.textColor || [15, 23, 42];
  doc.setTextColor(affR, affG, affB);
  doc.setFont(affCfg.fontFamily || "courier", affCfg.fontStyle || "bold");
  doc.setFontSize(affCfg.fontSize || 10.5);
  doc.text(affiliationNo, affCfg.x, affCfg.y);

  // 2. Top Right: Date - Day (DD) & Month (MM)
  const dCfg = printCfg.issueDay;
  const mCfg = printCfg.issueMonth;
  doc.setFont(dCfg.fontFamily || "helvetica", dCfg.fontStyle || "bold");
  doc.setFontSize(dCfg.fontSize || 9.5);
  doc.text(day, dCfg.x, dCfg.y, { align: dCfg.align || "center" });
  doc.text(month, mCfg.x, mCfg.y, { align: mCfg.align || "center" });

  // 3. Main Certify Line: "This is to certify that [Club Name]"
  const nameCfg = printCfg.clubName;
  const [nameR, nameG, nameB] = nameCfg.textColor || [15, 23, 42];
  doc.setTextColor(nameR, nameG, nameB);
  doc.setFont(nameCfg.fontFamily || "times", nameCfg.fontStyle || "bold");
  doc.setFontSize(nameCfg.fontSize || 16.5);
  doc.text(clubName, nameCfg.x, nameCfg.y, { align: nameCfg.align || "center", maxWidth: nameCfg.maxWidth || 135 });

  // 4. Level of Affiliation Checkboxes (Vector Checkmark for sharp high-res print/pdf)
  const drawVectorCheckmark = (cx: number, cy: number) => {
    doc.setDrawColor(180, 83, 9); // amber-700
    doc.setLineWidth(1.1);
    doc.line(cx - 2.0, cy + 0.1, cx - 0.6, cy + 1.8);
    doc.line(cx - 0.6, cy + 1.8, cx + 2.5, cy - 2.0);
  };

  const cbCfg = printCfg.checkboxes;
  if (isState) drawVectorCheckmark(cbCfg.state.x, cbCfg.state.y);
  if (isDistrict) drawVectorCheckmark(cbCfg.district.x, cbCfg.district.y);
  if (isClub) drawVectorCheckmark(cbCfg.club.x, cbCfg.club.y);
  if (isDojo) drawVectorCheckmark(cbCfg.dojo.x, cbCfg.dojo.y);

  // 5. Unit Details (5 Lines)
  const uCfg = printCfg.unitDetails;
  const [uR, uG, uB] = uCfg.textColor || [15, 23, 42];
  doc.setTextColor(uR, uG, uB);
  doc.setFont(uCfg.fontFamily || "helvetica", uCfg.fontStyle || "bold");
  doc.setFontSize(uCfg.fontSize || 10.0);
  doc.text(state, uCfg.x, uCfg.stateY, { maxWidth: uCfg.maxWidth });
  doc.text(district, uCfg.x, uCfg.districtY, { maxWidth: uCfg.maxWidth });
  doc.text(academyName, uCfg.x, uCfg.academyY, { maxWidth: uCfg.maxWidth });
  doc.text(headCoach, uCfg.x, uCfg.headCoachY, { maxWidth: uCfg.maxWidth });
  doc.text(contactNo, uCfg.x, uCfg.contactNoY, { maxWidth: uCfg.maxWidth });

  // 6. Validity Range (Inside Validity Box)
  const rawFromDate = resolvedData.validFrom || resolvedData.issued || "2026-01-01";
  const fromDateObj = new Date(rawFromDate);
  const isValidFrom = !isNaN(fromDateObj.getTime());
  const fromDay = isValidFrom ? String(fromDateObj.getDate()).padStart(2, "0") : "01";
  const fromMonth = isValidFrom ? String(fromDateObj.getMonth() + 1).padStart(2, "0") : "01";

  const rawToDate = resolvedData.validUntil || resolvedData.validTo || "2026-12-31";
  const toDateObj = new Date(rawToDate);
  const isValidTo = !isNaN(toDateObj.getTime());
  const toDay = isValidTo ? String(toDateObj.getDate()).padStart(2, "0") : "31";
  const toMonth = isValidTo ? String(toDateObj.getMonth() + 1).padStart(2, "0") : "12";
  const toYear2Digit = isValidTo ? String(toDateObj.getFullYear()).slice(-2) : "26";

  const vCfg = printCfg.validity;
  const [vR, vG, vB] = vCfg.textColor || [4, 120, 87];
  doc.setTextColor(vR, vG, vB);
  doc.setFont(vCfg.fontFamily || "helvetica", vCfg.fontStyle || "bold");
  doc.setFontSize(vCfg.fontSize || 9.5);

  doc.text(fromDay, vCfg.fromDay.x, vCfg.fromDay.y, { align: vCfg.fromDay.align || "center" });
  doc.text(fromMonth, vCfg.fromMonth.x, vCfg.fromMonth.y, { align: vCfg.fromMonth.align || "center" });
  doc.text(toDay, vCfg.toDay.x, vCfg.toDay.y, { align: vCfg.toDay.align || "center" });
  doc.text(toMonth, vCfg.toMonth.x, vCfg.toMonth.y, { align: vCfg.toMonth.align || "center" });
  doc.text(toYear2Digit, vCfg.toYear2Digit.x, vCfg.toYear2Digit.y, { align: vCfg.toYear2Digit.align || "center" });

  // 7. Verification QR Code
  const qrCfg = printCfg.qrCode;
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrCfg.x, qrCfg.y, qrCfg.width, qrCfg.height);
  }

  // 8. Bottom Signatory Box Overlays: President Name & Secretary Name
  const presidentName = resolvedData.presidentName || resolvedData.president || "";
  const secretaryName = resolvedData.secretaryName || resolvedData.secretary || "";

  if (presidentName) {
    const pCfg = activeCfg.presidentName;
    doc.setFont(pCfg.fontFamily || "helvetica", pCfg.fontStyle || "bold");
    doc.setFontSize(pCfg.fontSize || 9.0);
    const [r, g, b] = pCfg.textColor || [15, 23, 42];
    doc.setTextColor(r, g, b);
    doc.text(presidentName, pCfg.x, pCfg.y, { maxWidth: pCfg.maxWidth });
  }

  if (secretaryName) {
    const sCfg = activeCfg.secretaryName;
    doc.setFont(sCfg.fontFamily || "helvetica", sCfg.fontStyle || "bold");
    doc.setFontSize(sCfg.fontSize || 9.0);
    const [r, g, b] = sCfg.textColor || [15, 23, 42];
    doc.setTextColor(r, g, b);
    doc.text(secretaryName, sCfg.x, sCfg.y, { maxWidth: sCfg.maxWidth });
  }

  const sanitized = clubName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const fileName = `KALAWAR_Affiliation_Letter_${sanitized}.pdf`;

  return { doc, fileName };
}

/**
 * Downloads official Club Affiliation Certificate PDF.
 */
export async function downloadClubAffiliationCertificatePDF(data: any): Promise<void> {
  try {
    toast.loading("Generating Official Affiliation Letter PDF...", { id: "affiliation-pdf" });
    const result = await generateClubAffiliationCertificatePDF(data, { mode: "download" });
    if (result) {
      result.doc.save(result.fileName);
      toast.success("Affiliation Letter PDF downloaded successfully!", { id: "affiliation-pdf" });
    } else {
      toast.error("Failed to load certificate template.", { id: "affiliation-pdf" });
    }
  } catch (error) {
    console.error("Affiliation PDF download error:", error);
    toast.error("Failed to generate Affiliation Letter PDF.", { id: "affiliation-pdf" });
  }
}

/**
 * Opens browser print dialog for Club Affiliation Certificate.
 */
export async function printClubAffiliationCertificate(data: any, options?: { customConfig?: ClubCertificatePdfConfig }): Promise<void> {
  try {
    toast.loading("Preparing Affiliation Certificate for print...", { id: "affiliation-print" });
    const result = await generateClubAffiliationCertificatePDF(data, { mode: "print", customConfig: options?.customConfig });
    if (!result) {
      toast.error("Failed to generate print document.", { id: "affiliation-print" });
      return;
    }
    result.doc.autoPrint();
    const blobUrl = String(result.doc.output("bloburl"));
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
          toast.success("Print dialog opened!", { id: "affiliation-print" });
        } catch {
          window.open(blobUrl, "_blank");
          toast.success("Certificate opened in print window!", { id: "affiliation-print" });
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 60000);
        }
      };
    }
  } catch (error) {
    console.error("Certificate print error:", error);
    toast.error("Failed to print certificate.", { id: "affiliation-print" });
  }
}

/**
 * Downloads official A4 landscape high-resolution Certificate PDF.
 */
export async function downloadCertificatePDF(cert: CertificateItem, options?: { customConfig?: ClubCertificatePdfConfig }): Promise<void> {
  try {
    toast.loading("Generating Official Certificate PDF...", { id: "cert-pdf" });

    // 1. Check for dedicated Club Affiliation Certificate
    const isClubAffiliation =
      cert.type === "Club Affiliation Certificate" ||
      cert.type === "Affiliation Certificate" ||
      cert.event?.toLowerCase().includes("affiliation") ||
      cert.position?.toLowerCase().includes("club") ||
      cert.position?.toLowerCase().includes("academy") ||
      cert.number?.startsWith("KAC-AFF") ||
      cert.number?.startsWith("KSM-CL") ||
      cert.number?.startsWith("WSF-CL");

    if (isClubAffiliation) {
      const clubResult = await generateClubAffiliationCertificatePDF(cert, { mode: "download", customConfig: options?.customConfig });
      if (clubResult) {
        clubResult.doc.save(clubResult.fileName);
        toast.success("Affiliation Certificate PDF downloaded successfully!", { id: "cert-pdf" });
        return;
      }
    }

    // 2. Check for dedicated Coach Certificate Engine
    const isCoachCert =
      cert.type === "Coaching Accreditation" ||
      cert.type === "Coach Certificate" ||
      cert.type === "Coaching License" ||
      cert.position?.toLowerCase().includes("coach") ||
      cert.event?.toLowerCase().includes("coach") ||
      cert.number?.startsWith("KAL-CO") ||
      cert.number?.startsWith("KSM-CO") ||
      cert.number?.startsWith("WSF-CO");

    if (isCoachCert) {
      const coachResult = await generateCoachCertificatePDF(cert);
      if (coachResult) {
        coachResult.doc.save(coachResult.fileName);
        toast.success("Coach Certificate PDF downloaded successfully!", { id: "cert-pdf" });
        return;
      }
    }

    // 3. Check for dedicated Referee Certificate Engine
    const refereeResult = await generateRefereeCertificatePDF(cert);
    if (refereeResult) {
      refereeResult.doc.save(refereeResult.fileName);
      toast.success("Referee Certificate PDF downloaded successfully!", { id: "cert-pdf" });
      return;
    }

    // Standard A4 Landscape: 297mm x 210mm
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const verifyUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/certificates?number=${encodeURIComponent(cert.number)}`
        : `https://kalawarfederation.org/certificates?number=${encodeURIComponent(cert.number)}`;

    const qrDataUrl = await generateQRDataUrl(verifyUrl);

    // =========================================================================
    // LUXURY DIPLOMA BORDER & BACKGROUND
    // =========================================================================
    doc.setFillColor(15, 23, 42); // Navy Dark Background
    doc.rect(0, 0, 297, 210, "F");

    // Outer Gold Border
    doc.setDrawColor(217, 119, 6); // #d97706 Gold
    doc.setLineWidth(1.8);
    doc.roundedRect(8, 8, 281, 194, 4, 4, "D");

    // Inner Fine Border
    doc.setDrawColor(251, 191, 36); // #fbbf24
    doc.setLineWidth(0.6);
    doc.roundedRect(12, 12, 273, 186, 3, 3, "D");

    // Top Gold Bar
    doc.setFillColor(217, 119, 6);
    doc.rect(12, 12, 273, 14, "F");

    // Top Bar Header
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", 148.5, 20.5, { align: "center" });

    // Federation Title & Subtitle
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NATIONAL TECHNICAL & GOVERNING COUNCIL", 148.5, 34, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`CERTIFICATE OF ${cert.type.toUpperCase().replace("CERTIFICATE", "").trim()}`, 148.5, 46, {
      align: "center",
    });

    // Gold Rule Divider
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.8);
    doc.line(70, 51, 227, 51);

    // Preamble
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("This credential is officially authenticated and proudly conferred upon", 148.5, 60, {
      align: "center",
    });

    // Candidate Name
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(cert.holder.toUpperCase(), 148.5, 75, { align: "center" });

    // Details Paragraph
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    let detailLine = `for outstanding achievement in "${cert.event}"`;
    if (cert.position) {
      detailLine += ` securing ${cert.position}`;
    }
    doc.text(detailLine, 148.5, 87, { align: "center" });

    // Metadata Grid (Rank, Academy, State, Validity)
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(35, 96, 227, 24, 2, 2, "F");
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.roundedRect(35, 96, 227, 24, 2, 2, "D");

    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("KALAWAR ID:", 42, 104);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(cert.kalawarId || "N/A", 70, 104);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("BELT / RANK:", 42, 113);
    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.text(cert.rankOrBelt || "Standard", 70, 113);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("AFFILIATED CLUB:", 150, 104);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(cert.academy || "Independent National Official", 185, 104);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("STATE / REGION:", 150, 113);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`${cert.district ? cert.district + ", " : ""}${cert.state || "India"}`, 185, 113);

    // Status Ribbon
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`AUTHENTICATION STATUS: ${(cert.status || "VALID").toUpperCase()}`, 148.5, 130, {
      align: "center",
    });

    // =========================================================================
    // SIGNATORIES & QR CODE
    // =========================================================================
    // Signatory 1 (Left)
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(35, 162, 95, 162);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(SIGNATORIES.president.name, 65, 167, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(251, 191, 36);
    doc.text(SIGNATORIES.president.role, 65, 171, { align: "center" });

    // QR Code (Center)
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, "PNG", 133.5, 142, 30, 30);
      } catch (e) {
        // ignore
      }
    }
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("SCAN TO VERIFY AUTHENTICITY", 148.5, 176, { align: "center" });

    // Signatory 2 (Right)
    doc.line(202, 162, 262, 162);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(SIGNATORIES.director.name, 232, 167, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(251, 191, 36);
    doc.text(SIGNATORIES.director.role, 232, 171, { align: "center" });

    // Footer Security Line
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Certificate No: ${cert.number}  |  Issue Date: ${formatToDDMMYYYY(cert.issued, "10/02/2026")}  |  Validity: ${formatToDDMMYYYY(cert.validUntil, cert.validUntil || "Perpetual")}`, 148.5, 188, {
      align: "center",
    });

    const fileName = `KALAWAR_Certificate_${cert.number}_${cert.holder.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    doc.save(fileName);

    toast.success("Official Certificate PDF downloaded successfully!", { id: "cert-pdf" });
  } catch (err) {
    console.error("PDF generation failed:", err);
    toast.error("Failed to generate PDF. Please try again.", { id: "cert-pdf" });
  }
}

/**
 * Prints official certificate credential slip via invisible iframe.
 */
export async function printCertificateSlip(cert: CertificateItem): Promise<void> {
  if (typeof window === "undefined") return;

  const isClubAffiliation =
    cert.type === "Club Affiliation Certificate" ||
    cert.type === "Affiliation Certificate" ||
    cert.event?.toLowerCase().includes("affiliation") ||
    cert.position?.toLowerCase().includes("club") ||
    cert.position?.toLowerCase().includes("academy") ||
    cert.number?.startsWith("KAC-AFF") ||
    cert.number?.startsWith("KSM-CL") ||
    cert.number?.startsWith("WSF-CL");

  if (isClubAffiliation) {
    await printClubAffiliationCertificate(cert);
    return;
  }

  const isCoachCert =
    cert.type === "Coaching Accreditation" ||
    cert.type === "Coach Certificate" ||
    cert.type === "Coaching License" ||
    cert.position?.toLowerCase().includes("coach") ||
    cert.event?.toLowerCase().includes("coach") ||
    cert.number?.startsWith("KAL-CO") ||
    cert.number?.startsWith("KSM-CO") ||
    cert.number?.startsWith("WSF-CO");

  if (isCoachCert) {
    await printCoachCertificate(cert);
    return;
  }

  const isRefereeCert =
    cert.type === "Referee / Technical Official Certificate" ||
    cert.position?.toLowerCase().includes("referee") ||
    cert.event?.toLowerCase().includes("referee");

  if (isRefereeCert) {
    try {
      toast.loading("Preparing official certificate for print...", { id: "cert-print" });
      const refereeResult = await generateRefereeCertificatePDF(cert);
      if (refereeResult) {
        const blob = refereeResult.doc.output("blob");
        const blobUrl = URL.createObjectURL(blob);

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              toast.dismiss("cert-print");
            } catch (err) {
              console.error("Print error:", err);
            } finally {
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                URL.revokeObjectURL(blobUrl);
              }, 3000);
            }
          }, 400);
        };
        return;
      }
    } catch (e) {
      console.warn("Direct referee print error, falling back to slip:", e);
      toast.dismiss("cert-print");
    }
  }

  const verifyUrl = `${window.location.origin}/certificates?number=${encodeURIComponent(cert.number)}`;
  const qrDataUrl = await generateQRDataUrl(verifyUrl);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>KALAWAR Certificate - ${cert.number}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          body { background: #fff; color: #1e293b; padding: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { max-width: 900px; margin: 0 auto; border: 3px solid #d97706; border-radius: 20px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background: #fafafa; }
          .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 13px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
          .cert-title { font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 15px; text-transform: uppercase; }
          .conferred { font-size: 13px; color: #64748b; font-style: italic; margin-top: 10px; }
          .holder { font-size: 30px; font-weight: 900; color: #b45309; text-transform: uppercase; margin: 10px 0; }
          .reason { font-size: 14px; color: #334155; line-height: 1.6; max-width: 750px; margin: 0 auto 20px auto; text-align: center; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
          .info-table td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
          .info-table td.label { font-weight: 700; color: #64748b; width: 22%; text-transform: uppercase; font-size: 10px; }
          .info-table td.val { font-weight: 800; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .footer-section { margin-top: 25px; padding-top: 16px; border-top: 2px solid #d97706; display: flex; justify-content: space-between; align-items: center; }
          .signature-box { text-align: center; width: 200px; border-top: 1px solid #0f172a; padding-top: 6px; }
          .signature-name { font-size: 13px; font-weight: 900; color: #0f172a; }
          .signature-role { font-size: 10px; color: #d97706; font-weight: 700; }
          .qr-box { text-align: center; }
          .qr-box img { width: 75px; height: 75px; display: block; margin: 0 auto; }
          .qr-text { font-size: 8px; color: #64748b; margin-top: 2px; text-transform: uppercase; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="title">KALAWAR Sports & Martial Arts Federation of India</div>
            <div class="subtitle">National Technical Committee · Official Certificate Verification</div>
          </div>

          <div style="text-align: center;">
            <div class="cert-title">Certificate of ${cert.type.replace("Certificate", "").trim()}</div>
            <div class="conferred">This official credential is authenticated and proudly conferred upon</div>
            <div class="holder">${cert.holder}</div>
            <div class="reason">
              for successfully achieving <strong>${cert.position || "Distinction"}</strong> in the <strong>${cert.event}</strong> on <strong>${formatToDDMMYYYY(cert.issued, "10/02/2026")}</strong>.
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Certificate No</td>
              <td class="val" style="font-family: monospace; color: #d97706;">${cert.number}</td>
              <td class="label">KALAWAR ID</td>
              <td class="val" style="font-family: monospace;">${cert.kalawarId || "N/A"}</td>
            </tr>
            <tr>
              <td class="label">Belt / Rank</td>
              <td class="val">${cert.rankOrBelt || "Standard"}</td>
              <td class="label">Affiliated Club</td>
              <td class="val">${cert.academy || "Independent Official"}</td>
            </tr>
            <tr>
              <td class="label">State / Region</td>
              <td class="val">${cert.district ? cert.district + ", " : ""}${cert.state || "India"}</td>
              <td class="label">Status</td>
              <td class="val"><span class="badge">${cert.status}</span></td>
            </tr>
          </table>

          <div class="footer-section">
            <div class="signature-box">
              <div class="signature-name">${SIGNATORIES.president.name}</div>
              <div class="signature-role">${SIGNATORIES.president.role}</div>
            </div>

            <div class="qr-box">
              <img src="${qrDataUrl}" alt="Verification QR" />
              <div class="qr-text">Scan to Verify</div>
            </div>

            <div class="signature-box">
              <div class="signature-name">${SIGNATORIES.director.name}</div>
              <div class="signature-role">${SIGNATORIES.director.role}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 250);
}
