import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import type { DanApplication } from "@/data/dan-grading";

/**
 * Builds an official, high-resolution vector PDF Registration Confirmation Slip
 * for Dan Grading candidates using jsPDF with guaranteed non-overlapping typography and zero payment mentions.
 */
export async function buildDanPaymentSlipDoc(app: DanApplication): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;

    // Generate Verification QR Code
    const verifyUrl = `https://kalawarfederation.org/dan-grading?track=${encodeURIComponent(app.id)}&tab=tracker`;
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

    // 1. Outer Luxury Gold Border
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
    doc.text("National Black Belt Council & Technical Examination Board", pageWidth / 2, 28.5, { align: "center" });

    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text("Recognized National Governing Body · Registered Technical Council", pageWidth / 2, 33, { align: "center" });

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL REGISTRATION CONFIRMATION SLIP", pageWidth / 2, 41.5, { align: "center" });

    // 3. Status & Registration Summary Hero Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 49, pageWidth - 28, 22, 2, 2, "FD");

    // Left info block
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`APPLICATION TRACKING ID: ${app.id}`, 18, 56);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`REGISTRATION DATE: ${formatToDDMMYYYY(app.appliedDate, "04/09/2026")}`, 18, 61.5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(`REGISTRATION STATUS: CONFIRMED · UNDER TECHNICAL VERIFICATION`, 18, 67);

    // Right Dark Box: CANDIDACY STATUS
    const statusBoxW = 66;
    const statusBoxX = pageWidth - 14 - statusBoxW - 3;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(statusBoxX, 51.5, statusBoxW, 17, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("REGISTRATION STATUS", statusBoxX + statusBoxW / 2, 57, { align: "center" });

    // Render crisp green circle with white checkmark + bold CONFIRMED text
    const statusCenterX = statusBoxX + statusBoxW / 2;
    const badgeY = 63.3;

    // Green circular badge
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.circle(statusCenterX - 18, badgeY, 2.3, "F");

    // Crisp white checkmark vector lines
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.line(statusCenterX - 19.3, badgeY - 0.1, statusCenterX - 18.2, badgeY + 1.0);
    doc.line(statusCenterX - 18.2, badgeY + 1.0, statusCenterX - 16.7, badgeY - 0.9);

    // Bold Emerald "CONFIRMED" Text
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
    doc.rect(14, cardY + 4, pageWidth - 28, 4, "F"); // square bottom corners
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(248, 250, 252);
    doc.text("CANDIDATE & EXAMINATION REGISTRATION PARTICULARS", 18, cardY + 5.5);

    // Vertical Divider Line at center
    const colSplitX = 104;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(colSplitX, cardY + 8, colSplitX, cardY + cardH);

    // 5 Field Pairs in Left & Right Columns
    const fieldPairs = [
      {
        leftLabel: "Candidate Full Name:",
        leftVal: (app.fullName || "Candidate").toUpperCase(),
        rightLabel: "Federation Athlete ID:",
        rightVal: app.athleteId || "KSM-PL-2026-0000",
      },
      {
        leftLabel: "Current Belt Rank:",
        leftVal: app.currentBeltTitle || "Brown Belt (1st Gup)",
        rightLabel: "Applied Dan Rank Target:",
        rightVal: app.appliedDanTitle || "1st Dan Black Belt",
      },
      {
        leftLabel: "Affiliated Academy / Dojang:",
        leftVal: app.academyName || "Independent Dojang",
        rightLabel: "State Association / Region:",
        rightVal: app.state || "Maharashtra",
      },
      {
        leftLabel: "Instructor / Master:",
        leftVal: `${app.instructorName || "Master"} (${app.instructorDanGrade || "5th Dan"})`,
        rightLabel: "Candidate Contact (Phone · Email):",
        rightVal: `${app.phone || ""} · ${app.email || ""}`.trim().replace(/^·\s*|·\s*$/g, ""),
      },
      {
        leftLabel: "Technical Board Status:",
        leftVal: "Scheduled for Prerequisite & Document Audit",
        rightLabel: "Examination Admit Card:",
        rightVal: "Pending Technical Committee Verification",
      },
    ];

    let rowY = cardY + 11;
    const rowHeight = 17;
    const leftColX = 18;
    const rightColX = 107;
    const colTextMaxW = 82; // Strictly limits text width so it NEVER overlaps across columns

    fieldPairs.forEach((pair, idx) => {
      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14.5, rowY - 2.5, pageWidth - 29, rowHeight, "F");
      }

      // Horizontal subtle line between rows
      if (idx > 0) {
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        doc.line(14, rowY - 2.5, pageWidth - 14, rowY - 2.5);
      }

      // Left Column Field
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(pair.leftLabel, leftColX, rowY + 1.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(pair.leftVal, leftColX, rowY + 6.5, { maxWidth: colTextMaxW });

      // Right Column Field
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(pair.rightLabel, rightColX, rowY + 1.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      if (idx === 1) {
        doc.setTextColor(217, 119, 6); // Dan target highlight in amber
      } else if (idx === 4) {
        doc.setTextColor(5, 150, 105);
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
    doc.text("IMPORTANT NOTICE · ADMIT CARD & EXAMINATION SCHEDULING WORKFLOW", 18, noticeY + 8.5);

    const notices = [
      "1. Your Dan examination registration has been officially recorded in the federation portal.",
      "2. The Technical Examination Board is auditing your prerequisite rank tenure, documents, and identity verification.",
      "3. Once approved by the Technical Committee, your Official Examination Admit Card & Hall Ticket will be issued.",
      "4. The Admit Card will specify your confirmed Date of Examination, Reporting Time, and Venue Address.",
      "5. You will receive an automated email notification with your Tracking ID and Athlete ID as soon as your Admit Card is ready.",
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
    doc.text("SCAN TO VERIFY SLIP", 31, footerY + 30, { align: "center" });

    // Official Stamp Text
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", 48, footerY + 6);

    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("CIN: U93190PN2026NPL258757 · Recognized National Technical Council", 48, footerY + 11);
    doc.text("Official Digital Registration Confirmation & Candidate Ledger Acknowledgement", 48, footerY + 16);
    doc.text(`Track live application status at https://kalawarfederation.org/dan-grading`, 48, footerY + 21);

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
    doc.text("Head - Technical Committee", sigX + 2.5, footerY + 31.5, { align: "center" });

    return doc;
}

/**
 * Generates and downloads official Black Belt Dan Registration Confirmation Slip PDF.
 */
export async function downloadDanPaymentSlipPDF(app: DanApplication): Promise<void> {
  try {
    const doc = await buildDanPaymentSlipDoc(app);
    doc.save(`${app.id}_REGISTRATION_CONFIRMATION_SLIP.pdf`);
    toast.success("Official Registration Confirmation Slip downloaded successfully!");
  } catch (err) {
    console.error("Registration slip PDF generation failed:", err);
    toast.error("Failed to generate Registration Confirmation Slip PDF.");
  }
}

/**
 * Generates and immediately prints the clean vector PDF Dan Registration Confirmation Slip,
 * opening the browser's native print preview dialog without unstyled HTML artifacts.
 */
export async function printDanPaymentSlipPDF(app: DanApplication): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    toast.loading("Preparing Dan Registration Slip for printing...", { id: "dan-print" });
    const doc = await buildDanPaymentSlipDoc(app);
    doc.autoPrint();

    const blob = doc.output("blob");
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
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        toast.success("Print dialog opened", { id: "dan-print" });
      } catch (err) {
        console.error("Print error:", err);
        window.open(blobUrl, "_blank");
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(blobUrl);
        }, 10000);
      }
    };
  } catch (err) {
    console.error("Print generation failed:", err);
    toast.error("Failed to prepare slip for printing.", { id: "dan-print" });
  }
}
