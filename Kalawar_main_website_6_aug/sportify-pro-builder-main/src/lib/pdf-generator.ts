import jsPDF from "jspdf";
import { federation } from "@/constants/navigation";

export interface PDFDocumentConfig {
  title: string;
  category?: string;
  docCode?: string;
  date?: string;
  sections?: {
    heading: string;
    body: string | string[];
  }[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  notes?: string[];
}

export function generateOfficialPDF(config: PDFDocumentConfig): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  // 1. Top Decorative Golden / Red Accent Bar
  doc.setFillColor(212, 175, 55); // Gold
  doc.rect(0, 0, pageWidth, 5, "F");

  doc.setFillColor(180, 40, 40); // Deep Martial Red
  doc.rect(0, 5, pageWidth, 2, "F");

  // 2. Header: Federation Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(federation.name.toUpperCase(), pageWidth / 2, cursorY, { align: "center" });

  cursorY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `National Governing Body for Martial Arts & Multi-Sport Excellence | Email: ${federation.email}`,
    pageWidth / 2,
    cursorY,
    { align: "center" }
  );

  cursorY += 4;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  cursorY += 8;

  // 3. Document Title Block
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, "F");
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(180, 40, 40);
  doc.text(config.title.toUpperCase(), margin + 5, cursorY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const docMeta = `Document Ref: ${config.docCode || "K-DOC-2026"}   |   Category: ${config.category || "Official Publication"}   |   Issue Date: ${config.date || "January 2026"}`;
  doc.text(docMeta, margin + 5, cursorY + 14);

  // Status Badge
  doc.setFillColor(235, 248, 235);
  doc.setDrawColor(46, 125, 50);
  doc.roundedRect(pageWidth - margin - 36, cursorY + 4, 32, 7, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(46, 125, 50);
  doc.text("OFFICIAL & VERIFIED", pageWidth - margin - 20, cursorY + 8.5, { align: "center" });

  cursorY += 30;

  // 4. Render Sections
  if (config.sections && config.sections.length > 0) {
    for (const sec of config.sections) {
      // Check page overflow
      if (cursorY > pageHeight - 35) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(sec.heading, margin, cursorY);
      cursorY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      if (Array.isArray(sec.body)) {
        for (const item of sec.body) {
          if (cursorY > pageHeight - 25) {
            doc.addPage();
            cursorY = 20;
          }
          const wrapped = doc.splitTextToSize(`• ${item}`, contentWidth - 4);
          doc.text(wrapped, margin + 2, cursorY);
          cursorY += wrapped.length * 4.2 + 1.5;
        }
      } else {
        const wrapped = doc.splitTextToSize(sec.body, contentWidth);
        doc.text(wrapped, margin, cursorY);
        cursorY += wrapped.length * 4.2 + 3;
      }

      cursorY += 3;
    }
  }

  // 5. Render Table if provided
  if (config.tableData && config.tableData.headers.length > 0) {
    if (cursorY > pageHeight - 45) {
      doc.addPage();
      cursorY = 20;
    }

    const colWidth = contentWidth / config.tableData.headers.length;
    doc.setFillColor(240, 240, 245);
    doc.rect(margin, cursorY, contentWidth, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);

    config.tableData.headers.forEach((h, i) => {
      doc.text(h, margin + i * colWidth + 2, cursorY + 4.8);
    });

    cursorY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);

    for (const row of config.tableData.rows) {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);

      row.forEach((cell, i) => {
        const cellText = doc.splitTextToSize(cell, colWidth - 4);
        doc.text(cellText, margin + i * colWidth + 2, cursorY + 4.5);
      });

      cursorY += 6.5;
    }
    cursorY += 5;
  }

  // 6. Official Stamp and Authorization Footer
  if (cursorY > pageHeight - 40) {
    doc.addPage();
    cursorY = 20;
  } else {
    cursorY = Math.max(cursorY + 6, pageHeight - 38);
  }

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 40, 40);
  doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA — NATIONAL SECRETARIAT", margin, cursorY);

  cursorY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `This is an electronically generated official federation document. Verified under National Governance Mandate. Ref: ${config.docCode || "KALAWAR-OFFICIAL"}`,
    margin,
    cursorY
  );

  doc.setFont("helvetica", "italic");
  doc.text("Authorized Signatory: Founder & President / Working President — India", pageWidth - margin, cursorY, {
    align: "right",
  });

  // Trigger download
  const cleanName = (config.title || "KALAWAR_Document").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`${cleanName}.pdf`);
}
