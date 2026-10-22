import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import { TECHNICAL_AUTHORITY, type RefereeItem } from "@/types/referee";

/**
 * Generates high-resolution base64 PNG QR Code data URL.
 */
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

/**
 * Fetches referee photo or returns fallback placeholder.
 */
async function getPhotoDataUrl(photoUrl?: string, fallbackName: string = "Official"): Promise<string> {
  if (photoUrl && typeof window !== "undefined") {
    try {
      const res = await fetch(photoUrl);
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
      // CORS or network error, proceed without photo
    }
  }
  return "";
}

/**
 * Generates the official A4 Portrait Referee Registration Slip & Fee Receipt jsPDF document.
 * Single source of truth for both Download and Print.
 */
export async function generateRefereeReceiptPDFDoc(
  referee: RefereeItem
): Promise<{ doc: jsPDF; fileName: string }> {
  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/referees?verify=${encodeURIComponent(referee.licenseNumber || referee.id)}`
      : `https://kalawarfederation.org/referees?verify=${encodeURIComponent(referee.licenseNumber || referee.id)}`;

  const [qrDataUrl, photoDataUrl] = await Promise.all([
    generateQRDataUrl(verifyUrl),
    getPhotoDataUrl(referee.photo, referee.name),
  ]);

  // Outer Gold Border
  doc.setDrawColor(217, 119, 6); // #d97706 Gold
  doc.setLineWidth(1.2);
  doc.roundedRect(10, 10, 190, 277, 3, 3, "D");

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(13, 13, 184, 271, 2, 2, "D");

  // Header Top Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(13, 13, 184, 26, "F");

  doc.setTextColor(251, 191, 36); // #fbbf24 Gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA", 105, 22, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("NATIONAL TECHNICAL & REFEREE REGISTRATION COMMITTEE", 105, 29, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Official Registration Slip & Application Receipt", 105, 35, { align: "center" });

  // Official Receipt Bar
  doc.setFillColor(248, 250, 252);
  doc.rect(13, 41, 184, 9, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(13, 50, 197, 50);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`RECEIPT NO: REC-REF-${referee.id.replace(/[^0-9]/g, "").slice(-6) || "2026-01"}`, 18, 47);
  doc.text(
    `DATE: ${formatToDDMMYYYY(referee.licenseIssuedDate || new Date())}`,
    188,
    47,
    { align: "right" }
  );

  // Photo Box & Main Profile Section
  const startY = 56;
  if (photoDataUrl) {
    try {
      doc.addImage(photoDataUrl, "JPEG", 18, startY, 32, 38);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.rect(18, startY, 32, 38, "D");
    } catch (e) {
      console.warn("Photo render error:", e);
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(18, startY, 32, 38, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(18, startY, 32, 38, "D");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("OFFICIAL PHOTO", 34, startY + 20, { align: "center" });
  }

  // Official Name & Details Header
  const profileX = 56;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(referee.name.toUpperCase(), profileX, startY + 6);

  doc.setFontSize(9.5);
  doc.setTextColor(217, 119, 6);
  doc.text(`${referee.level}`, profileX, startY + 12);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.text(`Official ID: `, profileX, startY + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${referee.licenseNumber || referee.id}`, profileX + 18, startY + 18);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Kalawar ID: `, profileX, startY + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${referee.kalawarId || referee.id}`, profileX + 18, startY + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: `, profileX, startY + 30);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    referee.status === "Active" || referee.status === "Certified" ? 22 : 217,
    referee.status === "Active" || referee.status === "Certified" ? 101 : 119,
    referee.status === "Active" || referee.status === "Certified" ? 52 : 6
  );
  doc.text(`${referee.status.toUpperCase()}`, profileX + 18, startY + 30);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(18, startY + 44, 192, startY + 44);

  // Section 1: Detailed Official Information Table
  const tableY = startY + 50;
  doc.setFillColor(15, 23, 42);
  doc.rect(18, tableY, 174, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL CREDENTIALS & ACADEMIC BACKGROUND", 22, tableY + 5);

  const rows = [
    ["Accredited Rank / Belt", referee.currentRank || "Standard Official"],
    ["Officiating Experience", referee.martialArtsExperience || "N/A"],
    ["Affiliated Academy / Club", referee.academy || "Independent Official"],
    ["State / Union Territory", `${referee.district ? referee.district + ", " : ""}${referee.state}, India`],
    ["Primary Contact Phone", referee.phone || "N/A"],
    ["Official Email Address", referee.email || "N/A"],
    ["Matches Officiated", `${referee.matchesOfficiated || 0} Sanctioned Bouts`],
    ["Validity Status", referee.licenseValidUntil ? `Valid until ${formatToDDMMYYYY(referee.licenseValidUntil)}` : "Active / Verified"],
  ];

  let currentY = tableY + 13;
  doc.setFontSize(8);
  for (const [label, val] of rows) {
    doc.setFillColor(currentY % 12 === 0 ? 248 : 255, currentY % 12 === 0 ? 250 : 255, currentY % 12 === 0 ? 252 : 255);
    doc.rect(18, currentY - 4.5, 174, 6.5, "F");

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text(label, 22, currentY);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text(val, 85, currentY);

    doc.setDrawColor(241, 245, 249);
    doc.line(18, currentY + 2, 192, currentY + 2);
    currentY += 6.5;
  }

  // Section 2: Statutory Terms & Code of Conduct
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, currentY, 174, 34, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, currentY, 174, 34, 2, 2, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("STATUTORY ADJUDICATION CODE & REGISTRATION TERMS:", 22, currentY + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  const terms = [
    "1. This document serves as official proof of referee registration and application acknowledgment.",
    "2. The registered official is subject to National Technical Committee statutory match codes and ethics guidelines.",
    "3. All certifications, ID cards, and tournament duty appointments are issued following committee verification.",
    "4. For real-time credential verification, scan the official QR code below or visit kalawarfederation.org/referees.",
  ];
  let termY = currentY + 12;
  for (const term of terms) {
    doc.text(term, 22, termY);
    termY += 5;
  }

  // Section 3: Footer QR Code & Signatures
  const footerY = 240;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(18, footerY, 192, footerY);

  // Left Signature
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(TECHNICAL_AUTHORITY.name, 22, footerY + 14);
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(7);
  doc.text(`${TECHNICAL_AUTHORITY.role}`, 22, footerY + 19);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(TECHNICAL_AUTHORITY.committeeRole, 22, footerY + 23);

  // Center Verification QR
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 95, footerY + 5, 20, 20);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("Scan to Verify Credential", 105, footerY + 28, { align: "center" });
  }

  // Right Authority Seal Stamp (Positioned cleanly with standard ASCII and safe right margin)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("National Executive Board", 188, footerY + 14, { align: "right" });
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Digitally Authenticated & Recorded", 188, footerY + 19, { align: "right" });
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Governing Council, India", 188, footerY + 23, { align: "right" });

  const fileName = `KALAWAR_Referee_Registration_Receipt_${referee.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  return { doc, fileName };
}

/**
 * Downloads official A4 Portrait Referee Registration Slip & Fee Receipt PDF.
 */
export async function downloadRefereeReceiptPDF(referee: RefereeItem): Promise<void> {
  try {
    toast.loading("Generating Official Registration Receipt PDF...", { id: "ref-receipt-pdf" });
    const { doc, fileName } = await generateRefereeReceiptPDFDoc(referee);
    doc.save(fileName);
    toast.success("Registration Receipt PDF downloaded successfully!", { id: "ref-receipt-pdf" });
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error("Failed to generate Receipt PDF. Please try again.", { id: "ref-receipt-pdf" });
  }
}

// Alias for backward compatibility
export const downloadRefereeLicensePDF = downloadRefereeReceiptPDF;

/**
 * Prints official registration slip seamlessly using the exact same PDF document layout.
 */
export async function printRefereeRegistrationSlip(referee: RefereeItem): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    toast.loading("Preparing Registration Slip for printing...", { id: "ref-receipt-print" });
    const { doc } = await generateRefereeReceiptPDFDoc(referee);

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
        toast.success("Print dialog opened", { id: "ref-receipt-print" });
      } catch (err) {
        console.error("Print error:", err);
        window.open(blobUrl, "_blank");
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      }
    };
  } catch (error) {
    console.error("Print generation failed:", error);
    toast.error("Failed to prepare slip for printing.", { id: "ref-receipt-print" });
  }
}

// Alias for backward compatibility
export const printRefereeLicenseSlip = printRefereeRegistrationSlip;
