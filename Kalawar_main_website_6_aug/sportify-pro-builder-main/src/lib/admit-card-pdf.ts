import jsPDF from "jspdf";
import { formatToDDMMYYYY } from "./utils";
import type { ExamCandidate, BeltExamSession } from "@/data/belt-exams";

export interface GenerateAdmitCardPDFParams {
  candidate: ExamCandidate;
  exam: BeltExamSession;
  filename?: string;
}

/**
 * Generates an official, high-resolution vector PDF Admit Card directly using jsPDF.
 * Bypasses all DOM rasterization and canvas color parsing issues (like oklch)
 * and produces a crisp, selectable, professional single-page A4 document.
 */
function drawPillBadge(
  doc: jsPDF,
  text: string,
  rightEdgeX: number,
  badgeY: number,
  bgColor: [number, number, number],
  borderColor: [number, number, number],
  textColor: [number, number, number],
  fontSize: number = 6.2
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const textW = doc.getTextWidth(text);
  const paddingX = 3; // 3mm on left & right
  const badgeW = textW + paddingX * 2;
  const badgeH = 5.2;
  const badgeX = rightEdgeX - badgeW;

  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, "FD");

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(text, badgeX + badgeW / 2, badgeY + 3.5, { align: "center" });
}

export async function downloadAdmitCardPDF(
  params: GenerateAdmitCardPDFParams
): Promise<boolean> {
  const { candidate, exam } = params;
  if (!candidate || !exam) {
    throw new Error("Candidate and Examination details are required to generate Admit Card");
  }

  const rawFilename = params.filename || `AdmitCard_${candidate.athleteName}_${candidate.id}`;
  const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, "_");

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

  // 1. Outer Frame & Borders
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 3, 3, "S");

  // Inner Golden Accent Frame
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3, 2, 2, "S");

  // Top Red Accent Line
  doc.setFillColor(180, 40, 40);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, 3.5, "F");

  y += 10;

  // 2. Official Federation Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(160, 40, 40);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", margin + 8, y);

  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(15, 15, 15);
  doc.text("OFFICIAL EXAMINATION ADMIT CARD & HALL TICKET", margin + 8, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "National Board of Dan & Gup Technical Belt Accreditation · Academic Year 2026",
    margin + 8,
    y
  );

  // Top-Right Roll Number Box
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(190, 190, 190);
  doc.roundedRect(pageWidth - margin - 46, y - 10, 38, 14, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  doc.text("ROLL NUMBER", pageWidth - margin - 27, y - 5.5, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(candidate.id, pageWidth - margin - 27, y - 0.5, { align: "center" });

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  y += 6;

  // 3. Dynamic Values Resolution (Prioritizing candidate-specific admin inputs)
  const effectiveExamDate = candidate.examDate || exam.examDate;
  const formattedDate = formatToDDMMYYYY(effectiveExamDate, "28/09/2026");

  const effectiveReportingTime = candidate.reportingTime || candidate.examTime || exam.reportingTime || "07:30 AM";
  const sessionStart = candidate.examTime || candidate.reportingTime || exam.reportingTime || "07:30 AM";
  const sessionEnd = candidate.sessionEndTime || exam.examEndTime || "06:00 PM";
  const effectiveSessionTime = `${sessionStart} – ${sessionEnd}`;

  let effectiveVenue = candidate.examVenue;
  if (!effectiveVenue || !effectiveVenue.trim()) {
    const venueParts = [exam.venueName, exam.venueAddress, exam.city, exam.state].filter(Boolean);
    effectiveVenue = venueParts.join(", ");
  }

  let examinerText =
    candidate.chiefExaminer ||
    candidate.evaluatedBy ||
    (exam.chiefExaminer ? `${exam.chiefExaminer}${exam.chiefExaminerRank ? ` (${exam.chiefExaminerRank})` : ""}` : "") ||
    "Grandmaster Rajesh Sharma (8th Dan Black Belt, National Technical Director)";

  if (!examinerText.includes("(") && (candidate.chiefExaminerRank || exam.chiefExaminerRank)) {
    examinerText = `${examinerText} (${candidate.chiefExaminerRank || exam.chiefExaminerRank})`;
  }

  // Two Side-by-Side Information Boxes
  const colWidth = (contentWidth - 16) / 2; // ~85mm each
  const boxHeight = 84;

  // LEFT BOX: Candidate Details
  const leftX = margin + 6;
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(leftX, y, colWidth, boxHeight, 2, 2, "FD");

  // Left Header
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(leftX, y, colWidth, 7.5, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text("CANDIDATE DETAILS", leftX + 4, y + 5);

  // Verified Athlete Badge
  drawPillBadge(
    doc,
    "VERIFIED ATHLETE",
    leftX + colWidth - 3,
    y + 1.1,
    [220, 252, 231],
    [134, 239, 172],
    [22, 101, 52],
    6.2
  );

  // Candidate Fields
  let cy = y + 13;
  const labelX = leftX + 4;
  const valX = leftX + 26;
  const candValWidth = colWidth - 30;

  const candidateFields = [
    { label: "Full Name:", val: candidate.athleteName, bold: true },
    { label: "Athlete ID:", val: candidate.athleteId, mono: true },
    { label: "Club / Dojo:", val: candidate.academyName || candidate.clubName || "Affiliated Martial Arts Club" },
    { label: "State Assoc:", val: candidate.state || "Maharashtra" },
    { label: "Current Belt:", val: candidate.currentBelt || "White Belt" },
    { label: "Target Belt:", val: candidate.targetBelt, highlight: true },
  ];

  candidateFields.forEach((f) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(f.label, labelX, cy);

    if (f.highlight) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const textW = doc.getTextWidth(f.val);
      const boxW = Math.min(textW + 6, candValWidth);
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      doc.roundedRect(valX - 1, cy - 3.8, boxW, 5.2, 1, 1, "FD");
      doc.setTextColor(146, 64, 14);
      doc.text(f.val, valX + 2, cy);
      cy += 9;
    } else {
      doc.setFont("helvetica", f.bold ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(20, 20, 20);
      const splitVal = doc.splitTextToSize(f.val, candValWidth);
      doc.text(splitVal, valX, cy);
      const lineCount = Array.isArray(splitVal) ? splitVal.length : 1;
      cy += Math.max(8.5, lineCount * 4 + 2);
    }
  });

  // RIGHT BOX: Exam Schedule & Venue
  const rightX = leftX + colWidth + 4;
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(rightX, y, colWidth, boxHeight, 2, 2, "FD");

  // Right Header
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(rightX, y, colWidth, 7.5, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text("EXAM SCHEDULE & VENUE", rightX + 4, y + 5);

  // Fee Paid Badge
  drawPillBadge(
    doc,
    "FEE PAID · CONFIRMED",
    rightX + colWidth - 3,
    y + 1.1,
    [254, 243, 199],
    [245, 158, 11],
    [146, 64, 14],
    6.0
  );

  // Exam Fields
  let rcy = y + 13;
  const rLabelX = rightX + 4;
  const rValX = rightX + 26;
  const rValWidth = colWidth - 30;

  const examFields: { label: string; val: string; bold?: boolean; alert?: boolean }[] = [
    { label: "Exam Date:", val: formattedDate, bold: true },
    { label: "Reporting:", val: `${effectiveReportingTime} (Mandatory 30m Prior)`, alert: true },
    { label: "Session Time:", val: effectiveSessionTime },
    { label: "Venue / Place:", val: effectiveVenue },
    { label: "Chief Examiner:", val: examinerText },
  ];

  if (candidate.admitCardRemarks && candidate.admitCardRemarks.trim()) {
    examFields.push({
      label: "Remarks:",
      val: candidate.admitCardRemarks.trim(),
      bold: true,
    });
  }

  examFields.forEach((f) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(f.label, rLabelX, rcy);

    if (f.alert) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 50, 10);
      const splitVal = doc.splitTextToSize(f.val, rValWidth);
      doc.text(splitVal, rValX, rcy);
      const lineCount = Array.isArray(splitVal) ? splitVal.length : 1;
      rcy += Math.max(8.5, lineCount * 4 + 2);
    } else {
      doc.setFont("helvetica", f.bold ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(20, 20, 20);
      const splitVal = doc.splitTextToSize(f.val, rValWidth);
      doc.text(splitVal, rValX, rcy);
      const lineCount = Array.isArray(splitVal) ? splitVal.length : 1;
      rcy += Math.max(8.5, lineCount * 4 + 2);
    }
  });

  y += boxHeight + 6;

  // 4. Instructions Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(215, 215, 215);
  doc.roundedRect(leftX, y, contentWidth - 12, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 15, 15);
  doc.text("IMPORTANT EXAMINATION INSTRUCTIONS & MANDATORY GUIDELINES:", leftX + 4, y + 6);

  const instructions = [
    "Candidates must wear a clean official white Dobok / Gi with current belt tied properly.",
    "Full sparring protective gear (Headgear, Chest Guard, Shin/Forearm, Groin, Mouthguard) required.",
    "Reporting at least 30 minutes before reporting time is strictly mandatory. Late entry not permitted.",
    "Carry this printed Admit Card along with Federation Athlete ID card or valid Government Photo ID proof.",
  ];

  let iy = y + 11.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  instructions.forEach((ins, idx) => {
    doc.text(`${idx + 1}.  ${ins}`, leftX + 4, iy);
    iy += 5.5;
  });

  y += 42;

  // 5. Signatures Row (3 Equal Columns)
  const sigColWidth = (contentWidth - 20) / 3;

  // Box 1: Candidate
  const s1X = leftX;
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(s1X, y + 12, s1X + sigColWidth, y + 12);
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text("CANDIDATE SIGNATURE", s1X + sigColWidth / 2, y + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Date: ________________", s1X + sigColWidth / 2, y + 20, { align: "center" });

  // Box 2: Coach
  const s2X = s1X + sigColWidth + 4;
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(s2X, y + 12, s2X + sigColWidth, y + 12);
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text("CLUB HEAD COACH", s2X + sigColWidth / 2, y + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Seal & Recommendation", s2X + sigColWidth / 2, y + 20, { align: "center" });

  // Box 3: Chief Examiner
  const s3X = s2X + sigColWidth + 4;
  const examinerSigName = examinerText.split("(")[0].replace(/^(Grandmaster|Master|Shihan|Sensei)\s+/i, "").trim();
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(examinerSigName || "Rajesh Sharma", s3X + sigColWidth / 2, y + 9, { align: "center" });
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(s3X, y + 12, s3X + sigColWidth, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text("CHIEF EXAMINER", s3X + sigColWidth / 2, y + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("National Technical Board Seal", s3X + sigColWidth / 2, y + 20, { align: "center" });

  // 6. Save & Download
  doc.save(`${cleanFilename}.pdf`);
  return true;
}
