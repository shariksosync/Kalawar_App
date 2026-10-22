import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats camelCase memberType to human-readable spaced label.
 * e.g. "StateAssociation" -> "State Association", "DistrictAssociation" -> "District Association"
 */
export function formatMemberType(type?: string | null): string {
  if (!type) return "Player";
  const clean = String(type).trim();
  if (clean === "StateAssociation" || clean.toLowerCase() === "stateassociation") return "State Association";
  if (clean === "DistrictAssociation" || clean.toLowerCase() === "districtassociation") return "District Association";
  return clean;
}


/**
 * Downloads a file directly to the user's computer, handling cross-origin Cloudinary URLs, blobs, and data URLs.
 */
export async function downloadFile(url?: string | null, fileName?: string | null) {
  if (!url) return;
  const targetName = fileName || "Official_Affiliation_Document.pdf";

  try {
    // If data URL or blob URL, trigger instant client download
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = targetName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Try fetching file as a Blob to force browser download
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = targetName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      return;
    }
  } catch (error) {
    console.warn("Direct blob fetch failed, applying Cloudinary fl_attachment fallback:", error);
  }

  // Cloudinary fallback: insert fl_attachment to force attachment header from CDN
  let downloadUrl = url;
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    const cleanFileName = targetName.replace(/[^a-zA-Z0-9._-]/g, "_");
    downloadUrl = url.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(cleanFileName)}/`);
  }

  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = targetName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Returns ordinal suffix for a day number (e.g. 1st, 2nd, 3rd, 4th, 21st, etc.)
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Robustly formats any date input (YYYY-MM-DD, ISO, text, etc.) into the luxury
 * format "January 3rd, 2026".
 */
export function formatEventDisplayDate(raw: string | undefined | null, fallback?: string): string {
  if (!raw || !raw.trim()) return fallback || "TBA";
  const str = raw.trim();

  // If already formatted with ordinal suffix (e.g. "January 3rd, 2026", "December 20th, 2025"), return as is
  if (/[a-zA-Z]+\s+\d+(st|nd|rd|th),?\s+\d{4}/i.test(str)) {
    return str;
  }

  // Handle range strings e.g. "2026-04-17 - 2026-04-18" or "April 17th – 18th, 2026"
  if (str.includes("–") || str.includes(" - ")) {
    const delimiter = str.includes("–") ? "–" : " - ";
    const parts = str.split(delimiter).map((p) => p.trim());
    if (parts.length === 2) {
      const p1 = formatEventDisplayDate(parts[0]);
      const p2 = formatEventDisplayDate(parts[1]);
      return `${p1} – ${p2}`;
    }
    return str;
  }

  // Handle YYYY-MM-DD format directly to avoid timezone shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map((n) => parseInt(n, 10));
    if (y && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const month = MONTH_NAMES[m - 1];
      return `${month} ${d}${getOrdinalSuffix(d)}, ${y}`;
    }
  }

  // Handle parseable date strings
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const month = MONTH_NAMES[parsed.getMonth()];
    const day = parsed.getDate();
    const year = parsed.getFullYear();
    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  }

  return str;
}

/**
 * Creates a URL-friendly slug from string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Standardizes any date input (ISO, YYYY-MM-DD, timestamp, Date object, string)
 * to strictly return in DD/MM/YYYY format.
 */
export function formatToDDMMYYYY(
  dateInput?: string | Date | number | null,
  fallback: string | Date = "N/A"
): string {
  if (!dateInput) {
    if (fallback instanceof Date) {
      return formatToDDMMYYYY(fallback);
    }
    return fallback;
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return fallback instanceof Date ? formatToDDMMYYYY(fallback) : fallback;
    }
    const d = String(dateInput.getDate()).padStart(2, "0");
    const m = String(dateInput.getMonth() + 1).padStart(2, "0");
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(dateInput).trim();
  if (!str) return fallback instanceof Date ? formatToDDMMYYYY(fallback) : fallback;

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // DD-MM-YYYY or DD.MM.YYYY -> DD/MM/YYYY
  if (/^(\d{2})[-.](\d{2})[-.](\d{4})$/.test(str)) {
    return str.replace(/[-.]/g, "/");
  }

  // YYYY-MM-DD or YYYY/MM/DD (handle directly without timezone skew)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, "0");
    const d = ymdMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  // D/M/YYYY or D-M-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${d}/${m}/${y}`;
  }

  // Parse using Date constructor for timestamps or other formats
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Safely opens an image, document, or PDF in full size in a new browser tab.
 * Automatically converts base64 data: URLs into Blob object URLs or HTML document streams
 * so modern Chromium browsers render them in full resolution instead of opening a blank page.
 */
export function openFileInFullSize(url?: string | null, title?: string | null) {
  if (!url || typeof window === "undefined") return;

  const docTitle = title || "Document Full Size Preview";

  // Handle base64 / data: URLs
  if (url.startsWith("data:")) {
    try {
      const parts = url.split(",");
      if (parts.length >= 2) {
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = window.URL.createObjectURL(blob);
        const win = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (win) {
          // Free object URL after 2 minutes to prevent memory leak
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
          return;
        }
      }
    } catch (err) {
      console.warn("Blob conversion failed, using fallback document stream:", err);
    }

    // Fallback if popup blocker or blob creation has issues
    try {
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${docTitle.replace(/[<>"']/g, "")}</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #090d16; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: auto; padding: 24px; }
                .wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 100%; max-height: 100%; }
                img { max-width: 95vw; max-height: 90vh; object-fit: contain; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); }
                iframe { width: 95vw; height: 92vh; border: none; border-radius: 12px; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                ${url.startsWith("data:application/pdf") ? `<iframe src="${url}"></iframe>` : `<img src="${url}" alt="Full Size Preview" />`}
              </div>
            </body>
          </html>
        `);
        newWin.document.close();
        return;
      }
    } catch (streamErr) {
      console.warn("Could not write document stream:", streamErr);
    }
  }

  // Standard web URL or existing blob URL
  window.open(url, "_blank", "noopener,noreferrer");
}


