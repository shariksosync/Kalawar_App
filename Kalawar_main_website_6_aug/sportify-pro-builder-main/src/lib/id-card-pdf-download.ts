import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import type { IdCardEntry } from "./id-cards-store";
import { PLAYER_ID_CARD_PDF_CONFIG } from "@/config/player-id-card-coordinates";
import { COACH_ID_CARD_PDF_CONFIG } from "@/config/coach-id-card-coordinates";
import { REFEREE_ID_CARD_PDF_CONFIG, getRefereeIdCardPdfConfig } from "@/config/referee-id-card-coordinates";
import { CLUB_ID_CARD_PDF_CONFIG } from "@/config/club-id-card-coordinates";

/**
 * Generates high-resolution base64 PNG QR Code data URL.
 */
async function generateQRDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 400,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR generation failed:", err);
    return "";
  }
}

/**
 * Loads member photo as a base64 Data URL with aspect ratio crop or circular clip.
 */
async function getPhotoDataUrl(
  photoUrl?: string,
  name?: string,
  isCircular: boolean = false
): Promise<string> {
  if (photoUrl && typeof window !== "undefined" && typeof Image !== "undefined") {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            if (isCircular) {
              const size = 500;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("No 2d context"));
                return;
              }

              ctx.clearRect(0, 0, size, size);

              // Circular clipping mask
              ctx.save();
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.clip();

              // Center-crop image to fill the circle
              const imgAspect = img.width / img.height;
              let drawW = size;
              let drawH = size;
              let drawX = 0;
              let drawY = 0;

              if (imgAspect > 1) {
                drawW = size * imgAspect;
                drawX = (size - drawW) / 2;
              } else {
                drawH = size / imgAspect;
                drawY = (size - drawH) / 2;
              }

              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              ctx.restore();

              resolve(canvas.toDataURL("image/png"));
            } else {
              canvas.width = 300;
              canvas.height = 380;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("No 2d context"));
                return;
              }

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Cover aspect crop with passport headshot auto-crop (focus on face/upper chest)
              const imgAspect = img.width / img.height;
              const canvasAspect = canvas.width / canvas.height;
              let drawW = canvas.width;
              let drawH = canvas.height;
              let drawX = 0;
              let drawY = 0;

              if (imgAspect > canvasAspect) {
                drawW = canvas.height * imgAspect;
                drawX = (canvas.width - drawW) / 2;
                drawY = 0;
              } else {
                drawH = canvas.width / imgAspect;
                drawX = 0;
                // Headshot top-offset: keeps face and top of head in frame
                drawY = -Math.min(drawH * 0.04, Math.max(0, drawH - canvas.height) * 0.12);
              }

              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              resolve(canvas.toDataURL("image/jpeg", 0.95));
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = photoUrl;
      });

      if (dataUrl) return dataUrl;
    } catch {
      // Fall through to fallback avatar
    }
  }

  // Fallback initial avatar
  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      if (isCircular) {
        const size = 500;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          const grad = ctx.createLinearGradient(0, 0, size, size);
          grad.addColorStop(0, "#f59e0b");
          grad.addColorStop(1, "#d97706");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);

          ctx.fillStyle = "#020617";
          ctx.font = "bold 200px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((name || "C").charAt(0).toUpperCase(), size / 2, size / 2);
          return canvas.toDataURL("image/png");
        }
      } else {
        canvas.width = 300;
        canvas.height = 380;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#fef3c7";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#92400e";
          ctx.font = "bold 120px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((name || "P").charAt(0).toUpperCase(), 150, 190);
          return canvas.toDataURL("image/jpeg", 0.9);
        }
      }
    } catch {
      // ignore
    }
  }

  return "";
}

/**
 * Loads master ID card template image as a base64 Data URL.
 */
async function getCardTemplateDataUrl(path: string): Promise<string> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(path);
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
      console.warn(`Template load failed for ${path}:`, err);
    }
  }
  return "";
}

/**
 * Helper to dynamically scale font size so text never overflows or truncates.
 */
function drawAutoFitText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number,
  minFontSize: number = 2.6,
  align: "left" | "center" | "right" = "left",
  baseline: "alphabetic" | "middle" | "top" = "alphabetic"
) {
  if (!text) return;
  doc.setFontSize(baseFontSize);
  const currentWidth = doc.getTextWidth(text);
  if (currentWidth > maxWidth) {
    const scale = maxWidth / currentWidth;
    const newSize = Math.max(minFontSize, baseFontSize * scale);
    doc.setFontSize(newSize);
  }
  if (align === "center") {
    doc.text(text, x + maxWidth / 2, y, { align: "center", baseline });
  } else if (align === "right") {
    doc.text(text, x + maxWidth, y, { align: "right", baseline });
  } else {
    doc.text(text, x, y, { baseline });
  }
}

/**
 * Builds the high-resolution 2-sided jsPDF document for the official ID card (Athlete or Coach).
 */
export async function generateIdCardDoc(card: IdCardEntry): Promise<jsPDF> {
  const isCoach =
    card.cardType === "Coach" ||
    (card as any).memberType === "Coach" ||
    (card.designation && card.designation.toLowerCase().includes("coach")) ||
    card.id?.startsWith("KSM-CO") ||
    card.id?.startsWith("WSF-CO") ||
    card.id?.startsWith("KAC-CO");

  const isReferee =
    card.cardType === "Referee" ||
    (card as any).memberType === "Referee" ||
    (card.designation && card.designation.toLowerCase().includes("referee")) ||
    card.id?.startsWith("KSM-RF") ||
    card.id?.startsWith("WSF-RF") ||
    card.id?.startsWith("KAC-RF");

  const isClub =
    card.cardType === "Club" ||
    (card as any).memberType === "Club" ||
    (card.designation && card.designation.toLowerCase().includes("club")) ||
    card.id?.startsWith("KSM-CL") ||
    card.id?.startsWith("WSF-CL") ||
    card.id?.startsWith("KAC-CL");

  // Determine Referee tier: Trainee, Junior, State, National
  const refereeTier = (() => {
    if (!isReferee) return null;
    const levelStr = (card.refereeLevel || "").toLowerCase();
    if (levelStr) {
      if (levelStr.includes("national") || levelStr.includes("level 3") || levelStr.includes("chief") || levelStr.includes("international")) return "national";
      if (levelStr.includes("state") || levelStr.includes("level 2")) return "state";
      if (levelStr.includes("junior") || levelStr.includes("level 1")) return "junior";
      if (levelStr.includes("trainee") || levelStr.includes("level 0")) return "trainee";
    }
    const desStr = (card.designation || "").toLowerCase();
    if (desStr.includes("national") || desStr.includes("level 3") || desStr.includes("chief") || desStr.includes("international")) return "national";
    if (desStr.includes("state") || desStr.includes("level 2")) return "state";
    if (desStr.includes("junior") || desStr.includes("level 1")) return "junior";
    return "trainee";
  })();

  const refereePdfConfig = isReferee ? getRefereeIdCardPdfConfig(refereeTier) : null;

  // Standard high-resolution card dimensions in mm
  // Club template: 498 x 670 -> ratio 670/498 (~72.65mm)
  // Referee template: 498 x 622 -> ratio 622/498 (~67.45mm)
  // Coach template: 503 x 627 -> ratio 627/503 (~67.31mm)
  // Player template: 472 x 566 -> ratio 566/472 (~64.75mm)
  const cardW = 54;
  const cardH = isClub
    ? CLUB_ID_CARD_PDF_CONFIG.cardHeight
    : isReferee
    ? REFEREE_ID_CARD_PDF_CONFIG.cardHeight
    : isCoach
    ? COACH_ID_CARD_PDF_CONFIG.cardHeight
    : PLAYER_ID_CARD_PDF_CONFIG.cardHeight;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [cardW, cardH],
  });

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/id-cards/${encodeURIComponent(card.id)}`
      : `https://kalawar.org/id-cards/${encodeURIComponent(card.id)}`;

  const frontTemplatePath2x = isClub
    ? CLUB_ID_CARD_PDF_CONFIG.templateFront2x
    : isReferee && refereePdfConfig
    ? refereePdfConfig.templateFront2x
    : isCoach
    ? COACH_ID_CARD_PDF_CONFIG.templateFront2x
    : PLAYER_ID_CARD_PDF_CONFIG.templateFront2x;
  const frontTemplatePath = isClub
    ? CLUB_ID_CARD_PDF_CONFIG.templateFront
    : isReferee && refereePdfConfig
    ? refereePdfConfig.templateFront
    : isCoach
    ? COACH_ID_CARD_PDF_CONFIG.templateFront
    : PLAYER_ID_CARD_PDF_CONFIG.templateFront;

  const backTemplatePath2x = isClub
    ? CLUB_ID_CARD_PDF_CONFIG.templateBack2x
    : isReferee && refereePdfConfig
    ? refereePdfConfig.templateBack2x
    : isCoach
    ? COACH_ID_CARD_PDF_CONFIG.templateBack2x
    : PLAYER_ID_CARD_PDF_CONFIG.templateBack2x;
  const backTemplatePath = isClub
    ? CLUB_ID_CARD_PDF_CONFIG.templateBack
    : isReferee && refereePdfConfig
    ? refereePdfConfig.templateBack
    : isCoach
    ? COACH_ID_CARD_PDF_CONFIG.templateBack
    : PLAYER_ID_CARD_PDF_CONFIG.templateBack;

  const [frontTemplateDataUrl, backTemplateDataUrl, qrDataUrl, photoDataUrl] = await Promise.all([
    getCardTemplateDataUrl(frontTemplatePath2x).then((res) => res || getCardTemplateDataUrl(frontTemplatePath)),
    getCardTemplateDataUrl(backTemplatePath2x).then((res) => res || getCardTemplateDataUrl(backTemplatePath)),
    generateQRDataUrl(verifyUrl),
    getPhotoDataUrl(card.holderPhoto, card.holderName, isClub),
  ]);

  // =========================================================================
  // PAGE 1: FRONT SIDE
  // =========================================================================
  if (frontTemplateDataUrl) {
    doc.addImage(frontTemplateDataUrl, "PNG", 0, 0, cardW, cardH);
  }

  if (isClub) {
    // -------------------------------------------------------------------------
    // CLUB ID CARD FRONT ELEMENTS
    // -------------------------------------------------------------------------
    // 1. Circular Club Logo / Coach Photo
    if (photoDataUrl) {
      try {
        doc.addImage(
          photoDataUrl,
          "PNG",
          CLUB_ID_CARD_PDF_CONFIG.photo.x,
          CLUB_ID_CARD_PDF_CONFIG.photo.y,
          CLUB_ID_CARD_PDF_CONFIG.photo.width,
          CLUB_ID_CARD_PDF_CONFIG.photo.height
        );
      } catch (e) {
        console.warn("Could not embed club photo:", e);
      }
    }

    // 2. Club ID No. inside White Pill Badge
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.idBadge.color);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.id || "KSM-CL-0000",
      CLUB_ID_CARD_PDF_CONFIG.idBadge.x,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.centerY,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.width,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.minFontSize,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.align,
      CLUB_ID_CARD_PDF_CONFIG.idBadge.baseline
    );

    // 3. Right 9 Dynamic Club Fields
    // Line 1: Club Name
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.clubName.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.clubName.fontStyle || "bold");
    drawAutoFitText(
      doc,
      (card.academyName || card.holderName || "Club Name").toUpperCase(),
      CLUB_ID_CARD_PDF_CONFIG.clubName.x,
      CLUB_ID_CARD_PDF_CONFIG.clubName.y,
      CLUB_ID_CARD_PDF_CONFIG.clubName.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.clubName.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.clubName.minFontSize
    );

    // Line 2: Registration No.
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.registrationNo.color);
    doc.setFont(CLUB_ID_CARD_PDF_CONFIG.registrationNo.fontFamily || "courier", CLUB_ID_CARD_PDF_CONFIG.registrationNo.fontStyle || "bold");
    drawAutoFitText(
      doc,
      (card as any).registrationNumber || card.id || "KAC-CL-2026",
      CLUB_ID_CARD_PDF_CONFIG.registrationNo.x,
      CLUB_ID_CARD_PDF_CONFIG.registrationNo.y,
      CLUB_ID_CARD_PDF_CONFIG.registrationNo.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.registrationNo.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.registrationNo.minFontSize
    );

    // Line 3: Head Coach
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.headCoach.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.headCoach.fontStyle || "bold");
    drawAutoFitText(
      doc,
      (card as any).headCoach || (card as any).president || card.holderName || "Head Coach",
      CLUB_ID_CARD_PDF_CONFIG.headCoach.x,
      CLUB_ID_CARD_PDF_CONFIG.headCoach.y,
      CLUB_ID_CARD_PDF_CONFIG.headCoach.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.headCoach.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.headCoach.minFontSize
    );

    // Line 4: Contact No.
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.contactNo.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.contactNo.fontStyle || "bold");
    drawAutoFitText(
      doc,
      card.phone || card.emergencyContact || "+91 98220 12345",
      CLUB_ID_CARD_PDF_CONFIG.contactNo.x,
      CLUB_ID_CARD_PDF_CONFIG.contactNo.y,
      CLUB_ID_CARD_PDF_CONFIG.contactNo.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.contactNo.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.contactNo.minFontSize
    );

    // Line 5: Address
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.address.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.address.fontStyle || "normal");
    drawAutoFitText(
      doc,
      (card as any).address || `${card.district || "Pune"}, ${card.state || "Maharashtra"}`,
      CLUB_ID_CARD_PDF_CONFIG.address.x,
      CLUB_ID_CARD_PDF_CONFIG.address.y,
      CLUB_ID_CARD_PDF_CONFIG.address.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.address.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.address.minFontSize
    );

    // Line 6: District
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.district.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.district.fontStyle || "bold");
    drawAutoFitText(
      doc,
      card.district || "Pune",
      CLUB_ID_CARD_PDF_CONFIG.district.x,
      CLUB_ID_CARD_PDF_CONFIG.district.y,
      CLUB_ID_CARD_PDF_CONFIG.district.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.district.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.district.minFontSize
    );

    // Line 7: State
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.state.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.state.fontStyle || "bold");
    drawAutoFitText(
      doc,
      card.state || "Maharashtra",
      CLUB_ID_CARD_PDF_CONFIG.state.x,
      CLUB_ID_CARD_PDF_CONFIG.state.y,
      CLUB_ID_CARD_PDF_CONFIG.state.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.state.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.state.minFontSize
    );

    // Line 8: Validity
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.validity.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.validity.fontStyle || "bold");
    drawAutoFitText(
      doc,
      formatToDDMMYYYY(card.validUntil, "31/12/2028"),
      CLUB_ID_CARD_PDF_CONFIG.validity.x,
      CLUB_ID_CARD_PDF_CONFIG.validity.y,
      CLUB_ID_CARD_PDF_CONFIG.validity.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.validity.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.validity.minFontSize
    );

    // Line 9: Club Category
    doc.setTextColor(...CLUB_ID_CARD_PDF_CONFIG.clubCategory.color);
    doc.setFont("helvetica", CLUB_ID_CARD_PDF_CONFIG.clubCategory.fontStyle || "bold");
    drawAutoFitText(
      doc,
      (card as any).clubCategory || (card as any).type || "Affiliated Academy",
      CLUB_ID_CARD_PDF_CONFIG.clubCategory.x,
      CLUB_ID_CARD_PDF_CONFIG.clubCategory.y,
      CLUB_ID_CARD_PDF_CONFIG.clubCategory.maxWidth!,
      CLUB_ID_CARD_PDF_CONFIG.clubCategory.fontSize,
      CLUB_ID_CARD_PDF_CONFIG.clubCategory.minFontSize
    );

    // Bottom Coach Signature (render custom signature image if present; do not output "Authorized Signatory" text)
    if ((card as any).signature) {
      try {
        doc.addImage(
          (card as any).signature,
          "PNG",
          CLUB_ID_CARD_PDF_CONFIG.signature.x,
          CLUB_ID_CARD_PDF_CONFIG.signature.y,
          CLUB_ID_CARD_PDF_CONFIG.signature.width,
          CLUB_ID_CARD_PDF_CONFIG.signature.height
        );
      } catch (e) {
        console.warn("Could not embed coach signature:", e);
      }
    }
  } else {
    // 1. Candidate Photo (strictly inside yellow frame)
    const photoX = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.photo.x : isCoach ? COACH_ID_CARD_PDF_CONFIG.photo.x : PLAYER_ID_CARD_PDF_CONFIG.photo.x;
    const photoY = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.photo.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.photo.y : PLAYER_ID_CARD_PDF_CONFIG.photo.y;
    const photoW = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.photo.width : isCoach ? COACH_ID_CARD_PDF_CONFIG.photo.width : PLAYER_ID_CARD_PDF_CONFIG.photo.width;
    const photoH = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.photo.height : isCoach ? COACH_ID_CARD_PDF_CONFIG.photo.height : PLAYER_ID_CARD_PDF_CONFIG.photo.height;

    if (photoDataUrl) {
      try {
        doc.addImage(photoDataUrl, "JPEG", photoX, photoY, photoW, photoH);
      } catch (e) {
        console.warn("Could not embed photo:", e);
      }
    }

    // 2. Front Live Dynamic QR Code
    if (qrDataUrl) {
      const qrX = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeFront.x : isCoach ? COACH_ID_CARD_PDF_CONFIG.qrCodeFront.x : PLAYER_ID_CARD_PDF_CONFIG.qrCodeFront.x;
      const qrY = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeFront.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.qrCodeFront.y : PLAYER_ID_CARD_PDF_CONFIG.qrCodeFront.y;
      const qrSize = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeFront.size : isCoach ? COACH_ID_CARD_PDF_CONFIG.qrCodeFront.size : PLAYER_ID_CARD_PDF_CONFIG.qrCodeFront.size;
      try {
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      } catch (e) {
        console.warn("Could not embed QR:", e);
      }
    }

    // 3. 10 Dynamic Fields on Underlines (sitting right above each line with auto-fit)
    const textX = isReferee ? REFEREE_ID_CARD_PDF_CONFIG.name.x : isCoach ? COACH_ID_CARD_PDF_CONFIG.name.x : PLAYER_ID_CARD_PDF_CONFIG.name.x;
    const maxFieldWidth = isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.name.maxWidth || cardW * (171 / 498)) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.name.maxWidth || cardW * (175 / 503)) : (PLAYER_ID_CARD_PDF_CONFIG.name.maxWidth || cardW * (172 / 472));

    // Line 1: Referee / Coach / Player Name
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      (card.holderName || "Athlete Name").toUpperCase(),
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.name.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.name.y : PLAYER_ID_CARD_PDF_CONFIG.name.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.name.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.name.fontSize : PLAYER_ID_CARD_PDF_CONFIG.name.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.name.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.name.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.name.minFontSize || 2.8)
    );

    // Line 2: ID No.
    doc.setTextColor(180, 83, 9);
    doc.setFont("courier", "bold");
    drawAutoFitText(
      doc,
      card.id || "KW-000000",
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.idNo.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.idNo.y : PLAYER_ID_CARD_PDF_CONFIG.idNo.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.idNo.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.idNo.fontSize : PLAYER_ID_CARD_PDF_CONFIG.idNo.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.idNo.minFontSize || 3.2) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.idNo.minFontSize || 3.2) : (PLAYER_ID_CARD_PDF_CONFIG.idNo.minFontSize || 3.2)
    );

    // Line 3: Date of Birth
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      formatToDDMMYYYY((card as any).dob || card.issueDate, "14/05/2008"),
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.dob.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.dob.y : PLAYER_ID_CARD_PDF_CONFIG.dob.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.dob.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.dob.fontSize : PLAYER_ID_CARD_PDF_CONFIG.dob.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.dob.minFontSize || 3.0) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.dob.minFontSize || 3.0) : (PLAYER_ID_CARD_PDF_CONFIG.dob.minFontSize || 3.0)
    );

    // Line 4: Blood Group
    doc.setTextColor(190, 18, 60);
    doc.setFont("helvetica", "bold");
    if (card.bloodGroup && card.bloodGroup.trim().length > 0) {
      drawAutoFitText(
        doc,
        card.bloodGroup,
        textX,
        isReferee ? REFEREE_ID_CARD_PDF_CONFIG.bloodGroup.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.bloodGroup.y : PLAYER_ID_CARD_PDF_CONFIG.bloodGroup.y,
        maxFieldWidth,
        isReferee ? REFEREE_ID_CARD_PDF_CONFIG.bloodGroup.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.bloodGroup.fontSize : PLAYER_ID_CARD_PDF_CONFIG.bloodGroup.fontSize,
        isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.bloodGroup.minFontSize || 3.0) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.bloodGroup.minFontSize || 3.0) : (PLAYER_ID_CARD_PDF_CONFIG.bloodGroup.minFontSize || 3.0)
      );
    }

    // Line 5: Discipline
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.discipline || "Kalawar Martial Arts",
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.discipline.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.discipline.y : PLAYER_ID_CARD_PDF_CONFIG.discipline.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.discipline.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.discipline.fontSize : PLAYER_ID_CARD_PDF_CONFIG.discipline.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.discipline.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.discipline.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.discipline.minFontSize || 2.8)
    );

    // Line 6: Belt / Rank / Level
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.beltRank || (isReferee ? "Brown Belt / 1st Dan" : "1st Dan Black Belt"),
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.beltRank.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.beltRank.y : PLAYER_ID_CARD_PDF_CONFIG.beltRank.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.beltRank.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.beltRank.fontSize : PLAYER_ID_CARD_PDF_CONFIG.beltRank.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.beltRank.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.beltRank.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.beltRank.minFontSize || 2.8)
    );

    // Line 7: Club / Academy (auto-scaled to fit any length without truncation)
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.academyName || "KALAWAR Academy",
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.academy.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.academy.y : PLAYER_ID_CARD_PDF_CONFIG.academy.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.academy.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.academy.fontSize : PLAYER_ID_CARD_PDF_CONFIG.academy.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.academy.minFontSize || 2.4) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.academy.minFontSize || 2.4) : (PLAYER_ID_CARD_PDF_CONFIG.academy.minFontSize || 2.4)
    );

    // Line 8: District
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.district || "Pune",
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.district.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.district.y : PLAYER_ID_CARD_PDF_CONFIG.district.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.district.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.district.fontSize : PLAYER_ID_CARD_PDF_CONFIG.district.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.district.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.district.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.district.minFontSize || 2.8)
    );

    // Line 9: State
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      card.state || "Maharashtra",
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.state.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.state.y : PLAYER_ID_CARD_PDF_CONFIG.state.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.state.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.state.fontSize : PLAYER_ID_CARD_PDF_CONFIG.state.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.state.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.state.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.state.minFontSize || 2.8)
    );

    // Line 10: Validity
    doc.setTextColor(4, 120, 87);
    doc.setFont("helvetica", "bold");
    drawAutoFitText(
      doc,
      formatToDDMMYYYY(card.validUntil, "31/12/2027"),
      textX,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.validity.y : isCoach ? COACH_ID_CARD_PDF_CONFIG.validity.y : PLAYER_ID_CARD_PDF_CONFIG.validity.y,
      maxFieldWidth,
      isReferee ? REFEREE_ID_CARD_PDF_CONFIG.validity.fontSize : isCoach ? COACH_ID_CARD_PDF_CONFIG.validity.fontSize : PLAYER_ID_CARD_PDF_CONFIG.validity.fontSize,
      isReferee ? (REFEREE_ID_CARD_PDF_CONFIG.validity.minFontSize || 2.8) : isCoach ? (COACH_ID_CARD_PDF_CONFIG.validity.minFontSize || 2.8) : (PLAYER_ID_CARD_PDF_CONFIG.validity.minFontSize || 2.8)
    );
  }

  // =========================================================================
  // PAGE 2: BACK SIDE
  // =========================================================================
  doc.addPage([cardW, cardH], "portrait");

  if (backTemplateDataUrl) {
    doc.addImage(backTemplateDataUrl, "PNG", 0, 0, cardW, cardH);
  }

  // Dynamic Live QR Code on Back
  if (qrDataUrl) {
    const bqrX = isClub
      ? CLUB_ID_CARD_PDF_CONFIG.qrCodeBack.x
      : isReferee
      ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeBack.x
      : isCoach
      ? COACH_ID_CARD_PDF_CONFIG.qrCodeBack.x
      : PLAYER_ID_CARD_PDF_CONFIG.qrCodeBack.x;
    const bqrY = isClub
      ? CLUB_ID_CARD_PDF_CONFIG.qrCodeBack.y
      : isReferee
      ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeBack.y
      : isCoach
      ? COACH_ID_CARD_PDF_CONFIG.qrCodeBack.y
      : PLAYER_ID_CARD_PDF_CONFIG.qrCodeBack.y;
    const bqrSize = isClub
      ? CLUB_ID_CARD_PDF_CONFIG.qrCodeBack.size
      : isReferee
      ? REFEREE_ID_CARD_PDF_CONFIG.qrCodeBack.size
      : isCoach
      ? COACH_ID_CARD_PDF_CONFIG.qrCodeBack.size
      : PLAYER_ID_CARD_PDF_CONFIG.qrCodeBack.size;
    try {
      doc.addImage(qrDataUrl, "PNG", bqrX, bqrY, bqrSize, bqrSize);
    } catch (e) {
      console.warn("Could not embed back QR:", e);
    }
  }

  return doc;
}

/**
 * Downloads official Master Identity Card PDF (Athlete, Coach, Referee, or Club Front & Back).
 */
export async function downloadIdCardPDF(card: IdCardEntry): Promise<void> {
  const isClub =
    card.cardType === "Club" ||
    (card as any).memberType === "Club" ||
    (card.designation && card.designation.toLowerCase().includes("club")) ||
    card.id?.startsWith("KSM-CL") ||
    card.id?.startsWith("WSF-CL") ||
    card.id?.startsWith("KAC-CL");
  const isCoach =
    card.cardType === "Coach" ||
    (card as any).memberType === "Coach" ||
    (card.designation && card.designation.toLowerCase().includes("coach")) ||
    card.id?.startsWith("KSM-CO") ||
    card.id?.startsWith("WSF-CO") ||
    card.id?.startsWith("KAC-CO");
  const isReferee =
    card.cardType === "Referee" ||
    (card as any).memberType === "Referee" ||
    (card.designation && card.designation.toLowerCase().includes("referee")) ||
    card.id?.startsWith("KSM-RF") ||
    card.id?.startsWith("WSF-RF") ||
    card.id?.startsWith("KAC-RF");
  const cardTitle = isClub ? "Club" : isReferee ? "Referee" : isCoach ? "Coach" : "Player";

  try {
    toast.loading(`Generating Official ${cardTitle} ID Card PDF...`, { id: "id-card-pdf" });
    const doc = await generateIdCardDoc(card);

    // Save File
    const sanitizedId = (card.id || "ID-CARD").replace(/[^a-zA-Z0-9-_]/g, "_");
    doc.save(`KALAWAR_${cardTitle}_ID_Card_${sanitizedId}.pdf`);

    toast.success(`${cardTitle} ID Card PDF downloaded successfully!`, { id: "id-card-pdf" });
  } catch (error) {
    console.error("ID Card PDF download error:", error);
    toast.error(`Failed to generate ${cardTitle} ID Card PDF.`, { id: "id-card-pdf" });
  }
}

/**
 * Opens dedicated high-resolution ID card print dialog (Front & Back).
 */
export async function printIdCard(card: IdCardEntry): Promise<void> {
  const isClub =
    card.cardType === "Club" ||
    (card as any).memberType === "Club" ||
    (card.designation && card.designation.toLowerCase().includes("club")) ||
    card.id?.startsWith("KSM-CL") ||
    card.id?.startsWith("WSF-CL") ||
    card.id?.startsWith("KAC-CL");
  const isCoach =
    card.cardType === "Coach" ||
    (card as any).memberType === "Coach" ||
    (card.designation && card.designation.toLowerCase().includes("coach")) ||
    card.id?.startsWith("KSM-CO") ||
    card.id?.startsWith("WSF-CO") ||
    card.id?.startsWith("KAC-CO");
  const isReferee =
    card.cardType === "Referee" ||
    (card as any).memberType === "Referee" ||
    (card.designation && card.designation.toLowerCase().includes("referee")) ||
    card.id?.startsWith("KSM-RF") ||
    card.id?.startsWith("WSF-RF") ||
    card.id?.startsWith("KAC-RF");
  const cardTitle = isClub ? "Club" : isReferee ? "Referee" : isCoach ? "Coach" : "Player";

  try {
    toast.loading(`Preparing ${cardTitle} ID Card for print...`, { id: "id-card-print" });
    const doc = await generateIdCardDoc(card);
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
          toast.success("ID Card print dialog opened!", { id: "id-card-print" });
        } catch {
          window.open(blobUrl, "_blank");
          toast.success("ID Card opened in print window!", { id: "id-card-print" });
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
    console.error("ID Card Print error:", error);
    toast.error("Failed to prepare ID card for print.", { id: "id-card-print" });
  }
}
