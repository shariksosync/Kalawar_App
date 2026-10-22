import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export interface InvoicePDFOptions {
  filename?: string;
  marginMm?: number;
  pixelRatio?: number;
}

/**
 * Generates and triggers a direct PDF file download from a visible invoice element
 * Captures the full document height without scrollbars, line wrapping, or truncation
 */
export async function downloadInvoicePDF(
  element: HTMLElement | null,
  options?: InvoicePDFOptions
): Promise<boolean> {
  if (!element) {
    throw new Error("Target invoice element not found");
  }

  const rawFilename = options?.filename || "Tax_Invoice";
  const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, "_");
  const pixelRatio = options?.pixelRatio || 2.5;

  // 1. Temporarily clear overflow and max-height on the root element and all scrollable children
  const savedStyles: {
    el: HTMLElement;
    overflow: string;
    overflowX: string;
    overflowY: string;
    maxHeight: string;
    height: string;
  }[] = [];

  const allScrollContainers = [
    element,
    ...Array.from(
      element.querySelectorAll<HTMLElement>(
        ".overflow-x-auto, .overflow-y-auto, [class*='overflow-x'], [class*='overflow-y']"
      )
    ),
  ];

  allScrollContainers.forEach((el) => {
    savedStyles.push({
      el,
      overflow: el.style.overflow,
      overflowX: el.style.overflowX,
      overflowY: el.style.overflowY,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    });
    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
    el.style.maxHeight = "none";
  });

  // Calculate the full scroll dimensions of the invoice
  const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 750);
  const fullHeight = Math.max(element.scrollHeight, element.offsetHeight);

  try {
    // 2. Direct capture of the full-height invoice
    const imgData = await toPng(element, {
      quality: 1.0,
      pixelRatio,
      backgroundColor: "#ffffff",
      cacheBust: false,
      skipFonts: true,
      width: fullWidth,
      height: fullHeight,
      style: {
        background: "#ffffff",
        color: "#111827",
        overflow: "visible",
        maxHeight: "none",
        height: `${fullHeight}px`,
        width: `${fullWidth}px`,
      },
    });

    // 3. Load captured image to get exact natural dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = (e) => reject(e);
    });

    // 4. Create standard A4 Portrait PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const margin = options?.marginMm ?? 6;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (img.height * contentWidth) / img.width;

    // Single-page invoice
    if (contentHeight <= pdfHeight - margin * 2) {
      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        contentWidth,
        contentHeight,
        undefined,
        "FAST"
      );
    } else {
      // Multi-page handling
      let position = margin;
      let remainingHeight = contentHeight;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        contentWidth,
        contentHeight,
        undefined,
        "FAST"
      );
      remainingHeight -= pdfHeight;

      while (remainingHeight > 0) {
        position = remainingHeight - contentHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          contentWidth,
          contentHeight,
          undefined,
          "FAST"
        );
        remainingHeight -= pdfHeight;
      }
    }

    // 5. Trigger instant download
    pdf.save(`${cleanFilename}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate and download invoice PDF:", error);
    throw error;
  } finally {
    // 6. Restore original styles
    savedStyles.forEach(({ el, overflow, overflowX, overflowY, maxHeight, height }) => {
      el.style.overflow = overflow;
      el.style.overflowX = overflowX;
      el.style.overflowY = overflowY;
      el.style.maxHeight = maxHeight;
      el.style.height = height;
    });
  }
}
