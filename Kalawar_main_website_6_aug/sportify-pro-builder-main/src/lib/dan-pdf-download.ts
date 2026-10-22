import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import { DAN_GRADES } from "@/data/dan-grading";
import { getDanCertificatePdfConfig } from "@/config/dan-certificate-coordinates";

/**
 * Strips CJK Kanji/Hangul characters that standard WinAnsiEncoding Helvetica cannot render in jsPDF,
 * preventing corrupted characters like `_kμ` from appearing.
 */
export function cleanDanText(str: string): string {
  if (!str) return "";
  return str.replace(/[\u3000-\u9fff\uac00-\ud7af]/g, "").trim();
}

/**
 * Formats a clean, non-duplicated Dan rank banner title for the Diploma certificate.
 * E.g. converts `"2nd Dan Black Belt (Ni Dan)"` and `"Ni Dan (二段)"` to `"2ND DAN BLACK BELT (NI DAN)"`.
 */
export function getDiplomaRankBannerText(danRankTitle: string, japaneseTitle?: string): string {
  const cleanRank = cleanDanText(danRankTitle || "");
  const cleanJap = cleanDanText(japaneseTitle || "");

  if (cleanRank.includes("(") && cleanRank.includes(")")) {
    return cleanRank.toUpperCase();
  }

  if (cleanJap) {
    const pureJap = cleanJap.replace(/[()]/g, "").trim();
    if (pureJap && !cleanRank.toLowerCase().includes(pureJap.toLowerCase())) {
      return `${cleanRank.toUpperCase()} (${pureJap.toUpperCase()})`;
    }
  }

  return cleanRank.toUpperCase() || "BLACK BELT";
}

/**
 * Generates a high-resolution base64 PNG QR Code data URL for instant embedding in jsPDF.
 */
export async function generateDanQRCodeDataUrl(text: string): Promise<string> {
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
 * Generates an athletic martial arts Dobok avatar with initials badge as a high-resolution base64 Data URL.
 */
export function generateAthleteDobokAvatarDataUrl(candidateName: string): string {
  if (typeof document === "undefined") {
    return "";
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 380;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Background gradient (Dark Obsidian Navy)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 380);
    bgGrad.addColorStop(0, "#161922");
    bgGrad.addColorStop(1, "#0a0c10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 300, 380);

    // Subtle background spotlight
    const spotGrad = ctx.createRadialGradient(150, 140, 10, 150, 140, 120);
    spotGrad.addColorStop(0, "rgba(212, 175, 55, 0.15)");
    spotGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, 300, 380);

    // Head Silhouette
    ctx.fillStyle = "#e2b897";
    ctx.beginPath();
    ctx.arc(150, 105, 46, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Headgear
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(150, 92, 46, Math.PI, Math.PI * 2);
    ctx.fill();

    // Dobok Chest / Shoulders (White Martial Arts Uniform)
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(25, 380);
    ctx.lineTo(85, 170);
    ctx.lineTo(150, 235);
    ctx.lineTo(150, 380);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(275, 380);
    ctx.lineTo(215, 170);
    ctx.lineTo(150, 235);
    ctx.lineTo(150, 380);
    ctx.closePath();
    ctx.fill();

    // Black Lapel / V-Neck (Black Belt Master Dobok Trim)
    ctx.strokeStyle = "#090a0f";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(85, 170);
    ctx.lineTo(150, 235);
    ctx.lineTo(215, 170);
    ctx.stroke();

    // Red & Gold Federation Chest Seal
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(195, 270, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.arc(195, 270, 11, 0, Math.PI * 2);
    ctx.fill();

    // Initials Badge
    const initials = candidateName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "KB";

    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(150, 305, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(150, 305, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 150, 306);

    // Gold Border
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 296, 376);

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (err) {
    console.error("Dobok avatar generator error:", err);
    return "";
  }
}

/**
 * Loads or converts a candidate photo URL into a base64 Data URL for embedding in jsPDF.
 * If the photo URL is missing, broken, or blocked by CORS, it falls back to a clean martial artist Dobok avatar.
 */
export async function getAthletePhotoDataUrl(
  photoUrl?: string,
  candidateName?: string
): Promise<string> {
  const athleteName = candidateName || "Athlete";

  // 1. Direct base64 data URL
  if (photoUrl && photoUrl.startsWith("data:image/")) {
    return photoUrl;
  }

  // 2. Load HTTP / relative image in browser
  if (photoUrl && typeof window !== "undefined" && typeof Image !== "undefined") {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 380;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("No 2d context"));
              return;
            }

            // Fill background
            ctx.fillStyle = "#111319";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Cover aspect crop
            const imgAspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;
            let drawW = canvas.width;
            let drawH = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > canvasAspect) {
              drawW = canvas.height * imgAspect;
              drawX = (canvas.width - drawW) / 2;
            } else {
              drawH = canvas.width / imgAspect;
              drawY = (canvas.height - drawH) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            // Add fine gold border
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 3;
            ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

            resolve(canvas.toDataURL("image/jpeg", 0.92));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = photoUrl;
      });

      if (dataUrl) return dataUrl;
    } catch (e) {
      console.warn("Athlete image load failed (using Dobok avatar fallback):", e);
    }
  }

  // 3. Fallback: Generate athletic Dobok martial arts avatar
  return generateAthleteDobokAvatarDataUrl(athleteName);
}

/**
 * Fetches the master 12x16 print template corresponding to the awarded Dan rank as a base64 Data URL.
 */
export async function getDanTemplateImageDataUrl(danRank: number): Promise<string> {
  const fileDan = Math.min(Math.max(Number(danRank) || 1, 1), 4);
  const suffix = fileDan === 1 ? "1st" : fileDan === 2 ? "2nd" : fileDan === 3 ? "3rd" : "4th";
  
  const candidatePaths = [
    `/certificates/dan-templates/dan-${suffix}.png`,
    `/certificates/dan-templates/dan-${suffix}-web.jpg`,
  ];

  if (typeof window !== "undefined") {
    for (const path of candidatePaths) {
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
          if (dataUrl) return dataUrl;
        }
      } catch (err) {
        console.warn(`Template load failed for ${path}:`, err);
      }
    }
  }
  return "";
}

/**
 * Builds the official 12x16 Master Dan Diploma Certificate jsPDF instance.
 */
export async function buildDanDiplomaPDFDoc(
  data: any
): Promise<{ doc: jsPDF; filename: string; danRankTitle: string } | null> {
  if (!data) return null;
  try {
    const candidateName =
      data.fullName ||
      data.candidateName ||
      data.holder ||
      data.name ||
      data.athleteName ||
      "Athlete";

    const certificateNumber =
      data.certificateNumber ||
      data.number ||
      data.id ||
      "KAC-DAN-2026-0001";

    let appliedDanGrade = 1;
    if (typeof data.appliedDanGrade === "number") {
      appliedDanGrade = data.appliedDanGrade;
    } else if (typeof data.danRankNumber === "number") {
      appliedDanGrade = data.danRankNumber;
    } else if (typeof data.danRank === "number") {
      appliedDanGrade = data.danRank;
    } else {
      const str = String(
        data.appliedDanGrade ||
        data.danRank ||
        data.danRankTitle ||
        data.position ||
        data.rankOrBelt ||
        ""
      );
      const match = str.match(/(\d+)/);
      if (match && match[1]) {
        appliedDanGrade = parseInt(match[1], 10);
      }
    }
    appliedDanGrade = Math.min(Math.max(appliedDanGrade || 1, 1), 4);

    const danInfo = DAN_GRADES.find((d) => d.dan === appliedDanGrade) || DAN_GRADES[0];
    const danRankTitle = data.appliedDanTitle || data.danRankTitle || danInfo.rankName;
    const state = data.state || "Maharashtra";
    const athleteId =
      data.athleteId ||
      data.kalawarId ||
      data.studentId ||
      (data.id && !data.id.startsWith("CERT-") && !data.id.startsWith("KAC-") ? data.id : "") ||
      "KSM-PL-8801";

    const dob = formatToDDMMYYYY(data.dob || data.dateOfBirth, "15/08/1998");
    const academy =
      data.academyName ||
      data.academy ||
      data.clubName ||
      data.club ||
      "Kalawar Martial Arts Academy";

    const examDate = formatToDDMMYYYY(
      data.examDate || data.assessment?.examDate || data.issued,
      "28/09/2026"
    );
    const issueDate = formatToDDMMYYYY(
      data.certificateIssuedDate || data.issueDate || data.issued,
      "04/09/2026"
    );
    const place = state ? `${state.toUpperCase()}, INDIA` : "MAHARASHTRA, INDIA";

    const origin = typeof window !== "undefined" ? window.location.origin : "https://kalawar.org";
    const certUrl = `${origin}/certificates/dan/${encodeURIComponent(certificateNumber)}`;

    // Load Master Template Image and QR Code concurrently
    const [templateDataUrl, qrDataUrl] = await Promise.all([
      getDanTemplateImageDataUrl(appliedDanGrade),
      generateDanQRCodeDataUrl(certUrl),
    ]);

    const config = getDanCertificatePdfConfig(appliedDanGrade);
    const pageWidth = config.pageWidth || 304.8;
    const pageHeight = config.pageHeight || 406.4;

    // 12 x 16 inches = 304.8 mm x 406.4 mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
    });

    if (templateDataUrl) {
      // 1. Render Master 12x16 Background Template
      doc.addImage(templateDataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

      // Helper to draw text line with styling and auto-shrink if needed
      const drawCertText = (text: string, field: typeof config.certNo) => {
        if (!text || !field) return;
        doc.setFont(field.fontFamily || "helvetica", field.fontStyle || "bold");
        const color = field.textColor || [17, 24, 39];
        doc.setTextColor(color[0], color[1], color[2]);

        let fs = field.fontSize || 8.5;
        doc.setFontSize(fs);
        const maxW = field.maxWidth || 48.0;
        while (doc.getTextWidth(text) > maxW && fs > 3.5) {
          fs -= 0.1;
          doc.setFontSize(fs);
        }
        doc.text(text, field.x, field.y, { align: field.align || "left" });
      };

      // 2. Dynamic Top-Right Metadata Table (7-Row Layout)
      drawCertText(certificateNumber, config.certNo);
      drawCertText(athleteId, config.studentId);
      drawCertText(dob, config.dob);
      drawCertText(academy.toUpperCase(), config.academy);
      drawCertText(examDate, config.examDate);
      drawCertText(issueDate, config.issueDate);
      drawCertText(place, config.place);

      // 3. Candidate Name (Horizontally Centered in Bold Serif Typography)
      doc.setFont(config.candidateName.fontFamily || "times", config.candidateName.fontStyle || "bold");
      const nameColor = config.candidateName.textColor || [17, 24, 39];
      doc.setTextColor(nameColor[0], nameColor[1], nameColor[2]);

      let nameFontSize = config.candidateName.largeFontSize || 26;
      if (candidateName.length > 28) nameFontSize = config.candidateName.smallFontSize || 18;
      else if (candidateName.length > 20) nameFontSize = config.candidateName.mediumFontSize || 22;

      doc.setFontSize(nameFontSize);
      doc.text(candidateName.toUpperCase(), config.candidateName.x, config.candidateName.y, {
        align: config.candidateName.align || "center",
      });

      // 4. Scannable Live QR Code (Bottom Left Verify Box)
      if (qrDataUrl) {
        doc.setFillColor(255, 255, 255);
        doc.rect(config.qrCode.x, config.qrCode.y, config.qrCode.width, config.qrCode.height, "F");
        doc.addImage(
          qrDataUrl,
          "PNG",
          config.qrCode.x,
          config.qrCode.y,
          config.qrCode.width,
          config.qrCode.height
        );
      }
    } else {
      // Fallback Vector Render
      doc.setFillColor(15, 17, 21);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(212, 175, 55);
      doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(`OFFICIAL ${danRankTitle.toUpperCase()} CERTIFICATE`, pageWidth / 2, 60, { align: "center" });

      doc.setFontSize(28);
      doc.setTextColor(212, 175, 55);
      doc.text(candidateName.toUpperCase(), pageWidth / 2, 120, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(200, 205, 215);
      doc.text(
        `Certificate No: ${certificateNumber}   |   Student ID: ${athleteId}   |   DOB: ${dob}   |   Academy: ${academy}`,
        pageWidth / 2,
        140,
        { align: "center" }
      );
      doc.text(
        `Date of Examination: ${examDate}   |   Issue Date: ${issueDate}`,
        pageWidth / 2,
        152,
        { align: "center" }
      );

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 20, 200, 40, 40);
      }
    }

    const filename = `${certificateNumber}_${candidateName.replace(/\s+/g, "_")}_DAN_CERTIFICATE.pdf`;
    return { doc, filename, danRankTitle };
  } catch (err) {
    console.error("Dan Diploma PDF build error:", err);
    return null;
  }
}

/**
 * Generates and downloads the Official 12x16 Master Dan Diploma Certificate PDF.
 */
export async function downloadDanDiplomaPDF(data: any): Promise<boolean> {
  if (!data) return false;
  try {
    const result = await buildDanDiplomaPDFDoc(data);
    if (!result) {
      toast.error("Failed to generate Dan Diploma PDF.");
      return false;
    }
    result.doc.save(result.filename);
    toast.success(`Official ${result.danRankTitle} Master 12x16 Certificate PDF downloaded!`);
    return true;
  } catch (err) {
    console.error("Dan Diploma PDF generation failed:", err);
    toast.error("Failed to generate Dan Diploma PDF.");
    return false;
  }
}

/**
 * Triggers direct browser printing of the official high-resolution Dan Diploma Certificate.
 */
export async function printDanDiplomaPDF(data: any): Promise<boolean> {
  if (!data) return false;
  try {
    const result = await buildDanDiplomaPDFDoc(data);
    if (!result) {
      toast.error("Failed to prepare certificate for printing.");
      return false;
    }

    result.doc.autoPrint();
    const blobUrl = result.doc.output("bloburl");

    if (typeof window !== "undefined") {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = String(blobUrl);
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          toast.success("Dan Diploma print preview opened!");
        } catch {
          window.open(String(blobUrl), "_blank");
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(String(blobUrl));
        }, 60000);
      };
      return true;
    }
    return false;
  } catch (err) {
    console.error("Dan Diploma print failed:", err);
    toast.error("Failed to prepare Dan Diploma for printing.");
    return false;
  }
}

import { getDanIdCardPdfConfig } from "@/config/dan-id-card-coordinates";

/**
 * Loads a local template asset as base64 Data URL.
 */
export async function getDanCardTemplateDataUrl(templatePath: string): Promise<string> {
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
 * Builds the Master 2-Page CR80 Portrait jsPDF instance for a Dan ID Card (Page 1 = Front, Page 2 = Back).
 */
export async function buildDanIDCardPDFDoc(card: any): Promise<jsPDF | null> {
  if (!card) return null;

  const candidateName = card.fullName || card.candidateName || "Athlete";
  const appliedDanGrade = Number(card.appliedDanGrade || card.danRank || 1);
  const config = getDanIdCardPdfConfig(appliedDanGrade);

  const idCardNumber = card.idCardNumber || `KAC-DAN-ID-${card.certificateNumber?.split("-").pop() || "001"}`;
  const certificateNumber = card.certificateNumber || "KAC-DAN-2026-0001";
  const athleteId = card.athleteId || card.id || "KSM-PL-8801";
  const dob = card.dob || card.dateOfBirth ? formatToDDMMYYYY(card.dob || card.dateOfBirth, "15/08/1998") : "15/08/1998";
  const bloodGroup = card.bloodGroup || "";
  const discipline = card.discipline || "Kalawar Martial Arts";
  const academyName = card.academyName || card.academy || "Kalawar Martial Arts Academy";
  const district = card.district || "Pune";
  const state = card.state || "Maharashtra";
  const validity = card.validity || card.validUntil ? formatToDDMMYYYY(card.validity || card.validUntil, "31/12/2028") : "LIFETIME HOLDER";
  const photoUrl = card.athletePhoto || card.photoUrl || card.photo;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kalawar.org";
  const certUrl = `${origin}/certificates/dan/${encodeURIComponent(certificateNumber)}`;

  // Card dimensions in mm matching 502 x 633 px template aspect ratio (54.0 x 68.08 mm)
  const cardW = config.cardWidth || 54.0;
  const cardH = config.cardHeight || 68.08;

  const [frontTemplateDataUrl, backTemplateDataUrl, athletePhotoDataUrl, qrDataUrl] = await Promise.all([
    getDanCardTemplateDataUrl(config.templateFront),
    getDanCardTemplateDataUrl(config.templateBack),
    getAthletePhotoDataUrl(photoUrl, candidateName),
    generateDanQRCodeDataUrl(certUrl),
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
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, cardW, cardH, "F");
  }

  // 1. Photo Box
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
      console.warn("Could not render photo in Dan ID card PDF:", imgErr);
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
      config.qrCodeFront.x,
      config.qrCodeFront.y,
      config.qrCodeFront.size,
      config.qrCodeFront.size,
      undefined,
      "FAST"
    );
  }

  // Helper to draw text line with auto font-shrink to guarantee zero overflow
  const drawLine = (text: string, field: typeof config.name) => {
    if (!text || !field) return;

    doc.setFont("helvetica", field.fontStyle || "normal");
    doc.setTextColor(field.color[0], field.color[1], field.color[2]);

    let fs = field.fontSize || 4.4;
    const maxW = field.maxWidth || 19.4;

    doc.setFontSize(fs);
    while (doc.getTextWidth(text) > maxW && fs > 3.0) {
      fs -= 0.15;
      doc.setFontSize(fs);
    }

    doc.text(text, field.x, field.y);
  };

  // 3. Right 10 Form Lines (Direct Baseline Coordinates)
  drawLine(candidateName.toUpperCase(), config.name);
  drawLine(`Black Belt & ${appliedDanGrade} Dan`, config.beltColor);
  drawLine(athleteId, config.membershipNo);
  drawLine(dob, config.dob);
  drawLine(bloodGroup, config.bloodGroup);
  drawLine(discipline, config.discipline);
  drawLine(academyName, config.academy);
  drawLine(district, config.district);
  drawLine(state, config.state);
  drawLine(validity, config.validity);

  // =========================================================================
  // PAGE 2: BACK SIDE
  // =========================================================================
  doc.addPage([cardW, cardH], "portrait");

  if (backTemplateDataUrl) {
    doc.addImage(backTemplateDataUrl, "PNG", 0, 0, cardW, cardH, undefined, "FAST");
  } else {
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, cardW, cardH, "F");
  }

  // Back QR Code
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
      config.qrCodeBack.x,
      config.qrCodeBack.y,
      config.qrCodeBack.size,
      config.qrCodeBack.size,
      undefined,
      "FAST"
    );
  }

  return doc;
}

/**
 * Generates and downloads the Official Black Belt / Dan Smart Identity Card PDF.
 */
export async function downloadDanIDCardPDF(card: any): Promise<void> {
  if (!card) return;
  try {
    const doc = await buildDanIDCardPDFDoc(card);
    if (!doc) {
      toast.error("Failed to build Dan ID Card PDF");
      return;
    }

    const candidateName = card.fullName || card.candidateName || "Athlete";
    const idCardNumber = card.idCardNumber || `KAC-DAN-ID-${card.certificateNumber?.split("-").pop() || "001"}`;

    doc.save(`${idCardNumber}_${candidateName.replace(/\s+/g, "_")}_DAN_ID_CARD.pdf`);
    toast.success("Black Belt / Dan ID Card PDF downloaded successfully!");
  } catch (err) {
    console.error("Black Belt ID Card PDF generation failed:", err);
    toast.error("Failed to generate ID Card PDF.");
  }
}

/**
 * Prints the Dan ID card directly in a new window.
 */
export async function printDanIDCard(card: any): Promise<void> {
  if (!card) return;
  try {
    const doc = await buildDanIDCardPDFDoc(card);
    if (!doc) {
      toast.error("Failed to generate Dan ID card for printing");
      return;
    }

    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.info("Pop-up blocked. Downloading PDF instead...");
      await downloadDanIDCardPDF(card);
    }
  } catch (err) {
    console.error("Failed to print Dan ID card:", err);
    toast.error("Failed to print ID card.");
  }
}

