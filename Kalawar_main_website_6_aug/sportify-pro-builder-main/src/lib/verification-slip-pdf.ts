import jsPDF from "jspdf";
import QRCode from "qrcode";
import { formatToDDMMYYYY } from "./utils";
import type { UnifiedVerificationResult } from "@/app/api/search/verify/route";

export async function generateVerificationSlipPdf(result: UnifiedVerificationResult): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background styling - Slate Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Gold accent bar
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 42, pageWidth, 3, "F");

  // Title & Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(212, 175, 55);
  doc.text("CENTRAL RECORD REGISTRY & OFFICIAL DIGITAL VERIFICATION PORTAL", pageWidth / 2, 23, { align: "center" });

  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 220);
  doc.text("National Digital Verification Slip • Form Ref: KAC-V2026-CERT", pageWidth / 2, 31, { align: "center" });

  // Verification Status Badge Box
  const statusY = 52;
  const isGood = result.status === "Active" || result.status === "Valid";
  if (isGood) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
  }
  doc.setLineWidth(0.6);
  doc.roundedRect(15, statusY, pageWidth - 30, 22, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  if (isGood) {
    doc.setTextColor(5, 150, 105);
    doc.text(`[√] OFFICIALLY VERIFIED & AUTHENTIC: ${result.status.toUpperCase()}`, 22, statusY + 9);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`[!] RECORD STATUS: ${result.status.toUpperCase()}`, 22, statusY + 9);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Security UID: ${result.securityHash}  |  Verified Timestamp: ${formatToDDMMYYYY(result.verifiedAt)}`, 22, statusY + 16);

  // Record Summary Card
  const cardY = 82;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, cardY, pageWidth - 30, 120, 3, 3, "FD");

  // Left Details Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(result.title, 22, cardY + 12);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.text(result.subtitle || result.domainLabel, 22, cardY + 18);

  doc.setDrawColor(226, 232, 240);
  doc.line(22, cardY + 22, pageWidth - 75, cardY + 22);

  // Key-Value Grid
  let currY = cardY + 30;
  const detailEntries = Object.entries(result.details).slice(0, 9);
  
  doc.setFont("helvetica", "normal");
  for (const [key, val] of detailEntries) {
    if (val === undefined || val === null || val === "") continue;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(`${key}:`, 22, currY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const isDateKey = /date|dob|birth|valid|issued|registered|verified|exam\s*date/i.test(key);
    let displayVal = String(val);
    if (isDateKey && typeof val === "string" && (val.includes("-") || val.includes("/")) && !val.includes("@")) {
      displayVal = formatToDDMMYYYY(val, val);
    }
    const truncatedVal = displayVal.length > 36 ? displayVal.slice(0, 34) + "..." : displayVal;
    doc.text(truncatedVal, 68, currY);

    currY += 8.5;
  }

  // Right Side: QR Code & Anti-Tamper Stamp
  const qrX = pageWidth - 65;
  const qrY = cardY + 10;

  const verifyUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/verify?q=${encodeURIComponent(result.recordNumber)}`
    : `https://kalawarmartialarts.org/verify?q=${encodeURIComponent(result.recordNumber)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    doc.addImage(qrDataUrl, "PNG", qrX, qrY, 45, 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("SCAN TO RE-VERIFY", qrX + 22.5, qrY + 49, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(result.recordNumber, qrX + 22.5, qrY + 53, { align: "center" });
  } catch (err) {
    console.error("QR Code generation error in verification slip:", err);
  }

  // Security Seal & Signatures Box
  const sigY = 215;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, sigY, pageWidth - 15, sigY);

  // Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Mr. Santosh Uddhav Kasabe", 25, sigY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & President – India", 25, sigY + 19);
  doc.text("KALAWAR Sports & Martial Arts Federation", 25, sigY + 23);

  // National Registry Secretariat
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Central Verification Cell", pageWidth - 75, sigY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Automated Cryptographic Seal", pageWidth - 75, sigY + 19);
  doc.text("National Central Registry Database V2026", pageWidth - 75, sigY + 23);

  // Footer & Disclaimer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 18, pageWidth, 18, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "This is an official computer-generated verification certificate issued under the seal of KALAWAR Federation of India.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
  doc.text(
    "Official Website: https://kalawarmartialarts.org  |  Helpline: +91 70833 14435 / +91 95614 27125",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  const filename = `KALAWAR_VERIFICATION_${result.recordNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(filename);
}
