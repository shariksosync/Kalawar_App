"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Award,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  MapPin,
  Share2,
  Sparkles,
  ShieldCheck,
  Building,
  ArrowLeft,
  CreditCard,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "@/lib/utils";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { downloadDanDiplomaPDF, printDanDiplomaPDF } from "@/lib/dan-pdf-download";
import { getDanCertificateWebConfig, getDanCertWebDynamicFontSize } from "@/config/dan-certificate-coordinates";

export default function DanCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCert() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/dan/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.certificate) {
          setCert(data.certificate);
        }
      } catch (err) {
        console.error("Failed to load Dan certificate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [id]);

  const handlePrint = async () => {
    if (!cert) return;
    await printDanDiplomaPDF(cert);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator
          .share({
            title: `Official Black Belt Dan Certificate - ${cert?.candidateName}`,
            text: `Federation verified ${cert?.danRankTitle} certificate for ${cert?.candidateName}`,
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Certificate verification URL copied to clipboard!");
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!cert) return;
    await downloadDanDiplomaPDF(cert);
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Verifying official Dan certificate credentials...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!cert) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Award className="w-16 h-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Dan Certificate Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The black belt certificate credential "{id}" could not be found or has not yet been approved.
          </p>
          <Link
            href="/dan-grading"
            className="bg-gold-gradient text-background px-6 py-2.5 rounded-xl text-xs font-bold shadow-gold"
          >
            ← Return to Dan Grading Portal
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const certUrl = typeof window !== "undefined" ? window.location.href : `https://kalawar.org/certificates/dan/${cert.certificateNumber}`;
  const config = getDanCertificateWebConfig(cert.danRank || cert.appliedDanGrade || 1);

  const formattedDob = formatToDDMMYYYY(cert.dob || cert.dateOfBirth, "15/08/1998");
  const formattedExamDate = formatToDDMMYYYY(cert.examDate, "28/09/2026");
  const formattedIssueDate = formatToDDMMYYYY(cert.issueDate, "04/09/2026");
  const academyName = (cert.academyName || cert.academy || "—").toUpperCase();
  const place = cert.state ? `${cert.state.toUpperCase()}, INDIA` : "MAHARASHTRA, INDIA";

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#07080a] text-stone-100 pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <Link
              href="/dan-grading"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dan Grading Portal
            </Link>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <Link
                href={`/id-cards/dan/${cert.certificateNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition text-center"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> View Black Belt ID Card
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition cursor-pointer text-center"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-800 border border-stone-700 text-white hover:bg-stone-700 transition cursor-pointer text-center"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5" /> Download 12x16 Master PDF
              </button>
            </div>
          </div>

          {/* MASTER 12x16 CERTIFICATE CONTAINER (Aspect Ratio 3:4) */}
          <div className="relative w-full max-w-[850px] mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-black/90 bg-[#12141a] print:border-none print:shadow-none print:rounded-none print:max-w-none">
            {/* The 12x16 Certificate Canvas with dynamic overlays */}
            <div className={`relative w-full ${config.aspectRatio || "aspect-[3/4]"} select-none bg-stone-900`}>
              {/* Master Artwork Template (12x16) */}
              <picture>
                <source srcSet={config.templateWebp} type="image/webp" />
                <img
                  src={config.templateFallback}
                  alt={`KALAWAR ${cert.danRankTitle || "Dan"} Certificate`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </picture>

              {/* OVERLAY 1: Top-Right Dynamic Metadata Table (7-Row Master Layout) */}
              {/* Line 1: Certificate No */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.certNo.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(cert.certificateNumber, config.certNo.fontSizeClass)} ${config.certNo.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.certNo.top,
                  left: config.certNo.left,
                  maxWidth: config.certNo.maxWidth,
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {cert.certificateNumber}
              </div>

              {/* Line 2: Student ID */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.studentId.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(cert.athleteId, config.studentId.fontSizeClass)} ${config.studentId.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.studentId.top,
                  left: config.studentId.left,
                  maxWidth: config.studentId.maxWidth,
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {cert.athleteId}
              </div>

              {/* Line 3: Date of Birth */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.dob.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(formattedDob, config.dob.fontSizeClass)} ${config.dob.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.dob.top,
                  left: config.dob.left,
                  maxWidth: config.dob.maxWidth,
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {formattedDob}
              </div>

              {/* Line 4: Academy */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.academy.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(academyName, config.academy.fontSizeClass)} ${config.academy.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.academy.top,
                  left: config.academy.left,
                  maxWidth: config.academy.maxWidth || "21.5%",
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {academyName}
              </div>

              {/* Line 5: Date of Examination */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.examDate.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(formattedExamDate, config.examDate.fontSizeClass)} ${config.examDate.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.examDate.top,
                  left: config.examDate.left,
                  maxWidth: config.examDate.maxWidth,
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {formattedExamDate}
              </div>

              {/* Line 6: Date of Issue */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.issueDate.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(formattedIssueDate, config.issueDate.fontSizeClass)} ${config.issueDate.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.issueDate.top,
                  left: config.issueDate.left,
                  maxWidth: config.issueDate.maxWidth,
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {formattedIssueDate}
              </div>

              {/* Line 7: Place */}
              <div
                className={`absolute text-left leading-none pointer-events-none whitespace-nowrap ${config.place.fontWeightClass || "font-sans font-bold"} ${getDanCertWebDynamicFontSize(place, config.place.fontSizeClass)} ${config.place.colorClass || "text-[#111827]"}`}
                style={{
                  top: config.place.top,
                  left: config.place.left,
                  maxWidth: config.place.maxWidth || "24%",
                  transform: "translateY(-100%)",
                  paddingBottom: "1px",
                }}
              >
                {place}
              </div>

              {/* OVERLAY 2: Candidate Name (Centered in Bold Serif Typography) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center w-[86%] pointer-events-none"
                style={{ top: config.candidateName.top || "43.2%" }}
              >
                <h2 className={`${config.candidateName.fontWeightClass || "font-serif font-black uppercase tracking-wider"} ${config.candidateName.fontSizeClass || "text-base sm:text-2xl md:text-3xl lg:text-4xl"} ${config.candidateName.colorClass || "text-[#111827]"} drop-shadow-sm truncate`}>
                  {cert.candidateName}
                </h2>
              </div>

              {/* OVERLAY 3: Dynamic Live Scannable QR Code (Bottom Left Verify Box) */}
              <div
                className="absolute bg-white p-[2px] sm:p-1 flex items-center justify-center shadow-md rounded-[2px]"
                style={{
                  top: config.qrCode.top,
                  left: config.qrCode.left,
                  width: config.qrCode.width,
                  height: config.qrCode.height,
                }}
              >
                <QRCode
                  value={certUrl}
                  style={{ width: "100%", height: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          </div>

          {/* CREDENTIAL AUTHENTICATION SUMMARY CARD */}
          <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 sm:size-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="size-6 sm:size-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Authenticated &amp; Verified Dan Diploma
                    </span>
                    <span className="text-xs text-amber-400 font-bold">12x16 Master Format</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase break-words">{cert.candidateName}</h3>
                  <p className="text-xs text-amber-300 font-semibold">{cert.danRankTitle} {cert.japaneseTitle ? `(${cert.japaneseTitle})` : ""}</p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Download className="size-4" /> Download 12x16 Master PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Certificate No</p>
                <p className="font-mono font-bold text-amber-400 break-all sm:break-normal text-[11px] sm:text-xs mt-1">{cert.certificateNumber}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Athlete ID</p>
                <p className="font-mono font-bold text-white break-all sm:break-normal text-[11.5px] sm:text-xs mt-1">{cert.athleteId}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Date of Birth</p>
                <p className="font-mono font-bold text-white text-[11.5px] sm:text-xs mt-1">{formatToDDMMYYYY(cert.dob || cert.dateOfBirth, "—")}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Academy</p>
                <p className="font-bold text-white break-words text-[11.5px] sm:text-xs mt-1">{cert.academyName || cert.academy || "—"}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Grade</p>
                <p className="font-bold text-emerald-400 text-[11.5px] sm:text-xs mt-1">{cert.grade} {cert.score ? `(${cert.score}/100)` : ""}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Exam Date</p>
                <p className="font-bold text-white text-[11.5px] sm:text-xs mt-1">{formatToDDMMYYYY(cert.examDate, "28/09/2026")}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-stone-400">Authorized Grandmaster Signatory:</p>
                <p className="font-bold text-white">{cert.presidentName || "MR. SANTOSH KASBE"}</p>
                <p className="text-[11px] text-amber-400/80">{cert.presidentRole || "Founder & President – India | Head – Technical Committee, India"}</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/id-cards/dan/${cert.certificateNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 border border-stone-700 text-stone-200 hover:text-white hover:bg-stone-700 transition inline-flex items-center justify-center gap-1.5 text-center"
                >
                  <CreditCard className="size-3.5 text-amber-400" /> View Black Belt ID Card
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
