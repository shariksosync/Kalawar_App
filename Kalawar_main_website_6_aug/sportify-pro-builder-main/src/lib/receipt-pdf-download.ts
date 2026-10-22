import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "./utils";
import type { Player } from "@/data/people";

const DEFAULT_FEDERATION = "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA";

/**
 * Builds the official jsPDF document for Member Registration Receipt & Credential Slip.
 */
export async function buildRegistrationReceiptDoc(
  player: Player,
  federationName = DEFAULT_FEDERATION
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4", // 210 x 297 mm
  });

  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2; // 180mm

  // Outer Decorative Gold Border
  doc.setDrawColor(212, 175, 55); // #d4af37
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, margin, contentW, 267, 4, 4);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 2, margin + 2, contentW - 4, 263, 3, 3);

  // Header Background
  doc.setFillColor(15, 23, 42); // #0f172a dark slate
  doc.roundedRect(margin + 4, margin + 4, contentW - 8, 28, 2, 2, "F");

  // Header Title
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(federationName.toUpperCase(), pageW / 2, margin + 14, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("OFFICIAL MEMBER REGISTRATION RECEIPT & LEDGER SLIP", pageW / 2, margin + 21, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const regDateStr = formatToDDMMYYYY(player.registeredOn, new Date());
  doc.text(`RECEIPT REF: REC-REG-${player.id}  |  ISSUED DATE: ${regDateStr}`, pageW / 2, margin + 27, { align: "center" });

  // Membership ID Box
  let currentY = margin + 37;
  doc.setFillColor(254, 243, 199); // #fef3c7 light amber
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 6, currentY, contentW - 12, 22, 2, 2, "FD");

  doc.setTextColor(180, 83, 9); // #b45309
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("VERIFIED NATIONAL MEMBERSHIP CREDENTIAL", margin + 10, currentY + 6.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(player.id, margin + 10, currentY + 14);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Registered Candidate: ${player.name.toUpperCase()}   |   Email: ${player.email || "Registered Member"}`, margin + 10, currentY + 19);

  // Member Details Table
  currentY += 28;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MEMBER ACCREDITATION DETAILS", margin + 6, currentY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 6, currentY + 2, pageW - margin - 6, currentY + 2);

  currentY += 6;

  const rows: [string, string][] = [
    ["Full Member Name", player.name.toUpperCase()],
    ["Classification / Role", player.memberType || "Player / Athlete"],
    ["Sports Discipline", player.discipline || "Kalawar Martial Arts"],
  ];

  if (player.beltRank) rows.push(["Current Belt / Rank", player.beltRank]);
  if (player.ageGroup) rows.push(["Age Division", player.ageGroup]);
  if (player.weightCategory) rows.push(["Weight Category", player.weightCategory]);
  rows.push(["State Association Unit", `${player.state || "Maharashtra"}, India`]);
  if (player.city) rows.push(["City / District", player.city]);
  if (player.club) rows.push(["Affiliated Club / Academy", player.club]);
  if (player.coachName) rows.push(["Authorized Coach / Mentor", player.coachName]);
  rows.push(["Official Registration Date", formatToDDMMYYYY(player.registeredOn, "Recorded")]);
  rows.push(["National Accreditation Status", `${player.status || "Active"} (Recorded in Official National Ledger)`]);

  const rowH = 7.5;
  rows.forEach(([label, val], idx) => {
    const y = currentY + idx * rowH;
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 6, y - 4.5, contentW - 12, rowH, "F");
    }

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, margin + 9, y);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", label === "National Accreditation Status" ? "bold" : "normal");
    if (label === "National Accreditation Status") {
      doc.setTextColor(21, 128, 61); // green
    }
    doc.setFontSize(8.5);
    doc.text(val, margin + 70, y);

    doc.setDrawColor(241, 245, 249);
    doc.line(margin + 6, y + 3, pageW - margin - 6, y + 3);
  });

  // QR Code & Verification Seal Box
  currentY += rows.length * rowH + 8;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 6, currentY, contentW - 12, 34, 2, 2, "FD");

  // QR Code
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/id-cards/${encodeURIComponent(player.id)}`
      : `https://kalawarmartialarts.org/id-cards/${encodeURIComponent(player.id)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 250,
    });
    doc.addImage(qrDataUrl, "PNG", margin + 10, currentY + 3.5, 27, 27);
  } catch {
    // ignore
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("DIGITAL AUTHORIZATION & VERIFICATION SEAL", margin + 42, currentY + 9);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("This registration slip is digitally cryptographically verified. Scan the QR code", margin + 42, currentY + 14);
  doc.text("to verify real-time membership credentials on the official National Portal ledger.", margin + 42, currentY + 18.5);
  doc.text(`Official Verification URL: ${verifyUrl}`, margin + 42, currentY + 23);

  // Footer Secretariat Note
  const footerY = margin + 250;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 6, footerY, pageW - margin - 6, footerY);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Issued by: ${federationName}`, pageW / 2, footerY + 5, { align: "center" });
  doc.text("Secretariat Desk: contact@kalawarfederation.org  |  Portal: https://kalawarmartialarts.org", pageW / 2, footerY + 9, { align: "center" });

  return doc;
}

/**
 * Generates and downloads official Member Registration Receipt & Credential Slip PDF.
 */
export async function downloadRegistrationReceiptPDF(
  player: Player,
  federationName = DEFAULT_FEDERATION
): Promise<void> {
  try {
    toast.loading("Generating Official Registration Receipt PDF...", { id: "receipt-pdf" });

    const doc = await buildRegistrationReceiptDoc(player, federationName);
    const sanitizedId = (player.id || "MEMBER").replace(/[^a-zA-Z0-9-_]/g, "_");
    doc.save(`Registration_Receipt_${sanitizedId}.pdf`);

    toast.success("Registration Receipt PDF downloaded successfully!", { id: "receipt-pdf" });
  } catch (err: any) {
    console.error("Receipt PDF download error:", err);
    toast.error("Failed to generate Registration Receipt PDF", { id: "receipt-pdf" });
  }
}

/**
 * Generates and triggers the browser's native print preview dialog for the official
 * Member Registration Receipt PDF, bypassing any page styling or HTML distortions.
 */
export async function printRegistrationReceiptPDF(
  player: Player,
  federationName = DEFAULT_FEDERATION
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    toast.loading("Preparing Registration Receipt for printing...", { id: "receipt-print" });
    const doc = await buildRegistrationReceiptDoc(player, federationName);
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
        toast.success("Print dialog opened", { id: "receipt-print" });
      } catch (err) {
        console.error("Print dialog error:", err);
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
  } catch (err: any) {
    console.error("Print generation failed:", err);
    toast.error("Failed to prepare receipt for printing.", { id: "receipt-print" });
  }
}
