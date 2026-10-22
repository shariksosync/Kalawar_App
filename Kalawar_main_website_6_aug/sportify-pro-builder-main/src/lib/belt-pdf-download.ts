import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import { STANDARD_BELT_LEVELS, type ExamCandidate, type BeltExamSession } from "@/data/belt-exams";

/**
 * Strips unsupported characters for standard Helvetica in jsPDF.
 */
export function cleanBeltText(str: string): string {
  if (!str) return "";
  return str.replace(/[\u3000-\u9fff\uac00-\ud7af]/g, "").trim();
}

/**
 * Generates a high-resolution base64 PNG QR Code data URL for instant embedding in jsPDF.
 */
export async function generateBeltQRCodeDataUrl(text: string): Promise<string> {
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
 * Map belt name/ID to its master template PNG file
 */
export function getBeltTemplateFileName(beltRank: string): string {
  const clean = (beltRank || "").toLowerCase().replace(/–/g, "-").replace(/\s+/g, " ").trim();
  
  if (clean.includes("junior") || clean.includes("black")) return "junior-black-belt.png";
  if (clean.includes("red") && (clean.includes("3") || clean.includes("-3") || clean.includes("–3"))) return "red-belt-3.png";
  if (clean.includes("red") && (clean.includes("2") || clean.includes("-2") || clean.includes("–2"))) return "red-belt-2.png";
  if (clean.includes("red") && (clean.includes("1") || clean.includes("-1") || clean.includes("–1"))) return "red-belt-1.png";
  if (clean.includes("red")) return "red-belt.png";
  if (clean.includes("blue") && (clean.includes("1") || clean.includes("-1") || clean.includes("–1"))) return "blue-belt-1.png";
  if (clean.includes("blue")) return "blue-belt.png";
  if (clean.includes("green") && (clean.includes("1") || clean.includes("-1") || clean.includes("–1"))) return "green-belt-1.png";
  if (clean.includes("green")) return "green-belt.png";
  if (clean.includes("yellow") && (clean.includes("1") || clean.includes("-1") || clean.includes("–1"))) return "yellow-belt-1.png";
  if (clean.includes("yellow")) return "yellow-belt.png";

  const match = STANDARD_BELT_LEVELS.find(
    (l) => l.name.toLowerCase() === clean || l.id.toLowerCase() === clean
  );
  return match?.templateFile || "yellow-belt.png";
}

/**
 * Fetches the master belt certificate template as a base64 Data URL.
 */
export async function getBeltTemplateImageDataUrl(beltRank: string): Promise<string> {
  const fileName = getBeltTemplateFileName(beltRank);
  const path = `/certificates/belt-templates/${fileName}`;

  if (typeof window !== "undefined") {
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
  return "";
}

import { getBeltPdfConfig } from "@/config/belt-certificate-coordinates";

/**
 * Builds the official jsPDF document for the Belt Diploma Certificate.
 */
export async function buildBeltDiplomaPDFDoc(data: any): Promise<{ doc: jsPDF; filename: string } | null> {
  if (!data) return null;
  const candidateName =
    data.athleteName ||
    data.candidateName ||
    data.fullName ||
    data.holder ||
    data.name ||
    "Athlete";

  const certificateNumber =
    data.certificateNumber ||
    data.number ||
    data.id ||
    "KAC-BELT-2026-0001";

  const beltRank = data.beltRank || data.targetBelt || data.rankOrBelt || data.position || "Yellow Belt";
  const state = data.state || "Maharashtra";
  const athleteId =
    data.athleteId ||
    data.kalawarId ||
    data.studentId ||
    (data.id && !data.id.startsWith("CERT-") && !data.id.startsWith("KAC-") ? data.id : "") ||
    "KSM-PL-8801";

  const dob = formatToDDMMYYYY(data.dob || data.dateOfBirth, "15/08/2008");
  const academy =
    data.academyName ||
    data.academy ||
    data.clubName ||
    data.club ||
    "Kalawar Martial Arts Academy";

  const examDate = formatToDDMMYYYY(
    data.examDate || data.sessionDate || data.issued,
    "28/09/2026"
  );
  const issueDate = formatToDDMMYYYY(
    data.issuedDate || data.certificateIssuedDate || data.issueDate || data.issued,
    "04/09/2026"
  );
  const place = state ? `${state.toUpperCase()}, INDIA` : "MAHARASHTRA, INDIA";

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kalawar.org";
  const certUrl = `${origin}/certificates/belt/${encodeURIComponent(certificateNumber)}`;

  const templateFileName = getBeltTemplateFileName(beltRank);
  const config = getBeltPdfConfig(templateFileName);

  // Load Master Template Image and QR Code concurrently
  const [templateDataUrl, qrDataUrl] = await Promise.all([
    getBeltTemplateImageDataUrl(beltRank),
    generateBeltQRCodeDataUrl(certUrl),
  ]);

  const doc = new jsPDF({
    orientation: config.orientation,
    unit: "mm",
    format: [config.pageWidth, config.pageHeight],
  });

  if (templateDataUrl) {
    // 1. Render Master Background Template
    doc.addImage(templateDataUrl, "PNG", 0, 0, config.pageWidth, config.pageHeight, undefined, "FAST");

    // Helper function to render text fields with config styles
    const renderField = (field: typeof config.certNo, text: string) => {
      doc.setFont(field.fontFamily || "helvetica", field.fontStyle || "bold");
      doc.setFontSize(field.fontSize || 8.5);
      const color = field.textColor || [26, 30, 41];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, field.x, field.y, { align: field.align || "left" });
    };

    // Row 1: Certificate No.
    renderField(config.certNo, certificateNumber);

    // Row 2: Student ID
    renderField(config.studentId, athleteId);

    // Row 3: Date of Birth
    renderField(config.dob, dob);

    // Row 4: Academy (Dynamically sized to display full length without clipping past the margin)
    doc.setFont(config.academy.fontFamily || "helvetica", config.academy.fontStyle || "bold");
    let academyFontSize = config.academy.fontSize || 8.5;
    doc.setFontSize(academyFontSize);
    const maxAcademyWidth = config.academy.maxWidth || 58; // 58mm max available space before right border
    const academyText = academy.toUpperCase();
    
    // Scale font size down until it strictly fits within allowable boundary
    while (doc.getTextWidth(academyText) > maxAcademyWidth && academyFontSize > 4.5) {
      academyFontSize -= 0.25;
      doc.setFontSize(academyFontSize);
    }
    renderField({ ...config.academy, fontSize: academyFontSize }, academyText);

    // Row 5: Date of Examination
    renderField(config.examDate, examDate);

    // Row 6: Date of Issue
    renderField(config.issueDate, issueDate);

    // Row 7: Place
    renderField(config.place, place);

    // Candidate Name (Horizontally Centered in designated open ribbon zone)
    doc.setFont(config.candidateName.fontFamily || "times", config.candidateName.fontStyle || "bold");
    let nameFontSize = config.candidateName.largeFontSize || 24;
    if (candidateName.length > 28) nameFontSize = config.candidateName.smallFontSize || 18;
    else if (candidateName.length > 20) nameFontSize = config.candidateName.mediumFontSize || 21;
    doc.setFontSize(nameFontSize);
    const nameColor = config.candidateName.textColor || [17, 24, 39];
    doc.setTextColor(nameColor[0], nameColor[1], nameColor[2]);
    doc.text(candidateName.toUpperCase(), config.candidateName.x, config.candidateName.y, {
      align: config.candidateName.align || "center",
    });

    // Scannable Live QR Code
    if (qrDataUrl) {
      doc.setFillColor(255, 255, 255);
      doc.rect(config.qrCode.x, config.qrCode.y, config.qrCode.width, config.qrCode.height, "F");
      doc.addImage(qrDataUrl, "PNG", config.qrCode.x, config.qrCode.y, config.qrCode.width, config.qrCode.height);
    }
  } else {
    // Fallback Vector Render
    const { pageWidth, pageHeight } = config;
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, 35, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`OFFICIAL ${beltRank.toUpperCase()} CERTIFICATE`, pageWidth / 2, 50, { align: "center" });

    doc.setFontSize(26);
    doc.setTextColor(212, 175, 55);
    doc.text(candidateName.toUpperCase(), pageWidth / 2, 95, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(200, 205, 215);
    doc.text(
      `Certificate No: ${certificateNumber}   |   Student ID: ${athleteId}   |   DOB: ${dob}   |   Academy: ${academy}`,
      pageWidth / 2,
      115,
      { align: "center" }
    );
    doc.text(
      `Date of Examination: ${examDate}   |   Issue Date: ${issueDate}   |   Place: ${place}`,
      pageWidth / 2,
      125,
      { align: "center" }
    );

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 18, 140, 36, 36);
    }
  }

  const filename = `${certificateNumber}_${candidateName.replace(/\s+/g, "_")}_${beltRank.replace(/\s+/g, "_")}_CERTIFICATE.pdf`;
  return { doc, filename };
}

/**
 * Generates and downloads the Official Master Belt Grading Diploma Certificate PDF.
 */
export async function downloadBeltDiplomaPDF(data: any): Promise<boolean> {
  if (!data) return false;
  try {
    const result = await buildBeltDiplomaPDFDoc(data);
    if (!result) {
      toast.error("Failed to generate certificate details.");
      return false;
    }
    result.doc.save(result.filename);
    const beltRank = data.beltRank || data.targetBelt || "Belt";
    toast.success(`Official ${beltRank} Master Certificate PDF downloaded!`);
    return true;
  } catch (err) {
    console.error("Belt Diploma PDF generation failed:", err);
    toast.error("Failed to generate Belt Diploma PDF.");
    return false;
  }
}

/**
 * Triggers direct browser printing of the official high-resolution Belt Diploma Certificate.
 */
export async function printBeltDiplomaPDF(data: any): Promise<boolean> {
  if (!data) return false;
  try {
    const result = await buildBeltDiplomaPDFDoc(data);
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
        } catch {
          window.open(String(blobUrl), "_blank");
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(String(blobUrl));
        }, 60000);
      };
    }
    return true;
  } catch (err) {
    console.error("Print Belt Diploma PDF failed:", err);
    toast.error("Failed to trigger certificate print dialog.");
    return false;
  }
}

export interface GenerateBeltSlipParams {
  candidate: ExamCandidate;
  exam: BeltExamSession;
  filename?: string;
}

/**
 * Builds the official, high-resolution vector PDF Registration Confirmation Slip document
 * for Belt Examination candidates with clean vector typography and scannable verification QR.
 */
export async function buildBeltRegistrationSlipDoc(params: GenerateBeltSlipParams): Promise<jsPDF | null> {
  const { candidate, exam } = params;
  if (!candidate || !exam) {
    return null;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;

  const slipId = cleanBeltText(candidate.registrationSlipId || `KAC-BELT-SLIP-${candidate.id || "001"}`);
  const candidateName = cleanBeltText(candidate.athleteName || "Candidate");
  const athleteId = cleanBeltText(candidate.athleteId || "KSM-PL-8801");
  const rollNo = cleanBeltText(candidate.id || "CAND-001");
  const currentBelt = cleanBeltText(candidate.currentBelt || "White Belt");
  const targetBelt = cleanBeltText(candidate.targetBelt || "Yellow Belt");
  const academyName = cleanBeltText(candidate.academyName || candidate.clubName || "Kalawar Martial Arts Academy");
  const state = cleanBeltText(candidate.state || "Maharashtra");
  const phone = cleanBeltText(candidate.phone || "Not Provided");
  const email = cleanBeltText(candidate.email || "Not Provided");
  const dob = cleanBeltText(formatToDDMMYYYY(candidate.dob, "15/08/2008"));
  const gender = cleanBeltText(candidate.gender || "Male");
  const rawRegDate = candidate.registeredOn || (candidate as any).registeredAt;
  const regDate = cleanBeltText(formatToDDMMYYYY(rawRegDate, new Date()));

  const examTitle = cleanBeltText(exam.title || "National Belt Grading & Progression Examination");
  const examDate = cleanBeltText(formatToDDMMYYYY(candidate.examDate || exam.examDate, "28/09/2026"));
  const examTime = cleanBeltText(candidate.examTime || exam.reportingTime || "08:00 AM");
  const venue = cleanBeltText(candidate.examVenue || `${exam.venueName || "National Sports Complex"}, ${exam.city || "Mumbai"}`);
  const chiefExaminer = cleanBeltText(exam.chiefExaminer || "Grandmaster Rajesh Sharma (8th Dan)");

  // Generate Verification QR Code pointing to public live tracker
  const origin = typeof window !== "undefined" ? window.location.origin : "https://kalawarfederation.org";
  const verifyUrl = `${origin}/belt-exams?tab=results&candidate=${encodeURIComponent(rollNo)}`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    console.warn("QR code generation fallback:", e);
  }

  // 1. Outer Frame & Borders
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Fine Border
  doc.setDrawColor(230, 200, 100);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // 2. Dark Obsidian Header Banner
  doc.setFillColor(15, 20, 30);
  doc.roundedRect(14, 14, pageWidth - 28, 33, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, 23, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("National Board of Dan & Gup Technical Belt Accreditation", pageWidth / 2, 28.5, { align: "center" });

  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text("Recognized National Governing Body - Technical Examination Board - Year 2026", pageWidth / 2, 33, { align: "center" });

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL BELT EXAMINATION REGISTRATION SLIP", pageWidth / 2, 41.5, { align: "center" });

  // 3. Status & Registration Summary Hero Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 49, pageWidth - 28, 22, 2, 2, "FD");

  // Left info block
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`REGISTRATION SLIP NO: ${slipId}`, 18, 56);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`CANDIDATE ROLL NO: ${rollNo}   -   REGISTRATION DATE: ${regDate}`, 18, 61.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text(`STAGE 2 OF 6: CONFIRMED - RECORDED IN NATIONAL REGISTRY`, 18, 67);

  // Right Dark Box: CANDIDACY STATUS
  const statusBoxW = 66;
  const statusBoxX = pageWidth - 14 - statusBoxW - 3;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(statusBoxX, 51.5, statusBoxW, 17, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("ENROLLMENT STATUS", statusBoxX + statusBoxW / 2, 57, { align: "center" });

  // Green circular badge + checkmark
  const statusCenterX = statusBoxX + statusBoxW / 2;
  const badgeY = 63.3;

  doc.setFillColor(16, 185, 129);
  doc.circle(statusCenterX - 18, badgeY, 2.3, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.line(statusCenterX - 19.3, badgeY - 0.1, statusCenterX - 18.2, badgeY + 1.0);
  doc.line(statusCenterX - 18.2, badgeY + 1.0, statusCenterX - 16.7, badgeY - 0.9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(52, 211, 153);
  doc.text("CONFIRMED", statusCenterX - 13.5, 64.6);

  // 4. Candidate & Examination Registration Particulars (Structured 2-Column Grid)
  const cardY = 74;
  const cardH = 97;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, cardY, pageWidth - 28, cardH, 2, 2, "FD");

  // Title Bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, cardY, pageWidth - 28, 8, 2, 2, "F");
  doc.rect(14, cardY + 4, pageWidth - 28, 4, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(248, 250, 252);
  doc.text("CANDIDATE & BELT EXAMINATION ENROLLMENT PARTICULARS", 18, cardY + 5.5);

  // Vertical Divider Line at center
  const colSplitX = 104;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(colSplitX, cardY + 8, colSplitX, cardY + cardH);

  // 5 Field Pairs in Left & Right Columns (No Exam Date/Time/Venue on Registration Slip)
  const fieldPairs = [
    {
      leftLabel: "Candidate Full Name:",
      leftVal: candidateName.toUpperCase(),
      rightLabel: "Federation Student / Athlete ID:",
      rightVal: athleteId,
    },
    {
      leftLabel: "Current Belt Rank Held:",
      leftVal: currentBelt,
      rightLabel: "Target Belt Examination Grade:",
      rightVal: targetBelt,
    },
    {
      leftLabel: "Date of Birth & Gender:",
      leftVal: `${dob} - ${gender}`,
      rightLabel: "Affiliated Academy / Dojo:",
      rightVal: `${academyName} (${state})`,
    },
    {
      leftLabel: "Contact Coordinates (Phone - Email):",
      leftVal: `${phone} - ${email}`.trim().replace(/^-+\s*|-+\s*$/g, ""),
      rightLabel: "Examination Session:",
      rightVal: examTitle,
    },
    {
      leftLabel: "Registration Lifecycle Stage:",
      leftVal: "Stage 2: Recorded - Under Technical Audit",
      rightLabel: "Examination Schedule & Venue Status:",
      rightVal: "To be confirmed on Official Admit Card",
    },
  ];

  let rowY = cardY + 11;
  const rowHeight = 17;
  const leftColX = 18;
  const rightColX = 107;
  const colTextMaxW = 82;

  fieldPairs.forEach((pair, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14.5, rowY - 2.5, pageWidth - 29, rowHeight, "F");
    }

    if (idx > 0) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(14, rowY - 2.5, pageWidth - 14, rowY - 2.5);
    }

    // Left Column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(pair.leftLabel, leftColX, rowY + 1.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    if (idx === 4) {
      doc.setTextColor(5, 150, 105); // Green for recorded status
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(pair.leftVal, leftColX, rowY + 6.5, { maxWidth: colTextMaxW });

    // Right Column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(pair.rightLabel, rightColX, rowY + 1.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    if (idx === 1) {
      doc.setTextColor(217, 119, 6); // Target Belt highlight
    } else if (idx === 4) {
      doc.setTextColor(37, 99, 235); // Blue for admit card schedule status
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(pair.rightVal, rightColX, rowY + 6.5, { maxWidth: colTextMaxW });

    rowY += rowHeight;
  });

  // 5. Advisory Notice / Admit Card Issuance Flow Box
  const noticeY = 175;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, noticeY, pageWidth - 28, 54, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("IMPORTANT NOTICE - ADMIT CARD & EXAMINATION LIFECYCLE WORKFLOW", 18, noticeY + 8.5);

  const notices = [
    `1. Your candidate registration has been recorded under Official Slip No: ${slipId}.`,
    "2. The Technical Examination Secretariat is auditing candidate training tenure, prerequisite grade, and medical fitness.",
    "3. Confirmed examination date, reporting time, and venue address will be issued on your official Admit Card upon approval.",
    "4. The Admit Card will confirm your reporting slot, allocated examination tatami, and chief examiner panel.",
    `5. You can track real-time status anytime on the national portal using your Roll No (${rollNo}) or Student ID.`,
  ];

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  notices.forEach((n, idx) => {
    doc.text(n, 18, noticeY + 16 + idx * 7.5, { maxWidth: pageWidth - 36 });
  });

  // 6. Verification QR & Footer Signatures
  const footerY = 233;

  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(18, footerY, 26, 26, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(18, footerY, 26, 26, "D");
    doc.addImage(qrDataUrl, "PNG", 18, footerY, 26, 26);
  }
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("SCAN TO TRACK STATUS", 31, footerY + 30, { align: "center" });

  // Official Stamp Text
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", 48, footerY + 6);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Recognized National Technical Council - CIN: U93190PN2026NPL258757", 48, footerY + 11);
  doc.text("Official Digital Registration Confirmation & Candidate Ledger Acknowledgement", 48, footerY + 16);
  doc.text(`Chief Technical Examiner: ${chiefExaminer}`, 48, footerY + 21);

  // Signatory on Right
  const sigX = pageWidth - 55;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(sigX - 20, footerY + 19, sigX + 25, footerY + 19);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MR. SANTOSH KASBE", sigX + 2.5, footerY + 23.5, { align: "center" });

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & President - India", sigX + 2.5, footerY + 27.5, { align: "center" });
  doc.text("Head - Technical Examination Board", sigX + 2.5, footerY + 31.5, { align: "center" });

  return doc;
}

/**
 * Generates and downloads an official, high-resolution vector PDF Registration Confirmation Slip
 * for Belt Examination candidates using jsPDF with guaranteed non-overlapping typography,
 * scannable verification QR code, and official technical board credentials.
 */
export async function downloadBeltRegistrationSlipPDF(params: GenerateBeltSlipParams): Promise<boolean> {
  try {
    const doc = await buildBeltRegistrationSlipDoc(params);
    if (!doc) {
      toast.error("Candidate and examination details are required to generate registration slip.");
      return false;
    }

    const slipId = cleanBeltText(params.candidate.registrationSlipId || `KAC-BELT-SLIP-${params.candidate.id || "001"}`);
    const candidateName = cleanBeltText(params.candidate.athleteName || "Candidate");
    const downloadFileName = params.filename || `${slipId}_${candidateName.replace(/\s+/g, "_")}_REGISTRATION_SLIP.pdf`;
    
    doc.save(downloadFileName);
    toast.success("Official Belt Examination Registration Slip PDF downloaded successfully!");
    return true;
  } catch (err) {
    console.error("Registration slip PDF generation failed:", err);
    toast.error("Failed to generate Registration Slip PDF.");
    return false;
  }
}

/**
 * Generates and immediately prints the clean vector PDF Registration Slip,
 * completely bypassing HTML page interference and backdrop overlays.
 */
export async function printBeltRegistrationSlipPDF(params: GenerateBeltSlipParams): Promise<boolean> {
  try {
    const doc = await buildBeltRegistrationSlipDoc(params);
    if (!doc) {
      toast.error("Candidate and examination details are required to print registration slip.");
      return false;
    }

    doc.autoPrint();
    const blobUrl = doc.output("bloburl");

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
        } catch {
          window.open(String(blobUrl), "_blank");
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(String(blobUrl));
        }, 60000);
      };
    }
    return true;
  } catch (err) {
    console.error("Print Registration Slip PDF failed:", err);
    toast.error("Failed to trigger print dialog.");
    return false;
  }
}

