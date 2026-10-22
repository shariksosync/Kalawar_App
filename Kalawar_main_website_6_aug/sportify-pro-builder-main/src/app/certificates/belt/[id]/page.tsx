"use client";

import { getBeltWebConfig } from "@/config/belt-certificate-coordinates";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Award,
  Printer,
  Download,
  CheckCircle2,
  Share2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "@/lib/utils";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { downloadBeltDiplomaPDF, printBeltDiplomaPDF, getBeltTemplateFileName } from "@/lib/belt-pdf-download";

export default function BeltCertificatePage({
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
        const res = await fetch(`/api/certificates/belt/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.certificate) {
          setCert(data.certificate);
        }
      } catch (err) {
        console.error("Failed to load belt certificate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [id]);

  const handlePrint = async () => {
    if (!cert) return;
    await printBeltDiplomaPDF(cert);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator
          .share({
            title: `Official Belt Grading Certificate - ${cert?.candidateName}`,
            text: `Federation verified ${cert?.beltRank} grading certificate for ${cert?.candidateName}`,
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
    await downloadBeltDiplomaPDF(cert);
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Verifying official federation belt diploma...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!cert) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-[#07080a] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Award className="w-16 h-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Belt Certificate Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The belt certificate credential "${id}" could not be found or has not yet been declared.
          </p>
          <Link
            href="/belt-exams"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            ← Return to Belt Examination Portal
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const certUrl = typeof window !== "undefined" ? window.location.href : `https://kalawar.org/certificates/belt/${cert.certificateNumber}`;
  const templateFileName = getBeltTemplateFileName(cert.beltRank);
  const coords = getBeltWebConfig(templateFileName);
  const academyStr = cert.academyName || "—";
  let academyFontSizeClass = "text-[5.5px] sm:text-[7.5px] md:text-[9px]";
  if (academyStr.length > 44) {
    academyFontSizeClass = "text-[3.8px] sm:text-[5.0px] md:text-[6.5px]";
  } else if (academyStr.length > 34) {
    academyFontSizeClass = "text-[4.4px] sm:text-[5.8px] md:text-[7.2px]";
  } else if (academyStr.length > 25) {
    academyFontSizeClass = "text-[5.0px] sm:text-[6.8px] md:text-[8.2px]";
  }

  const templateImg = `/certificates/belt-templates/${templateFileName}`;
  const isJuniorBlackBelt = templateFileName === "junior-black-belt.png";

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#07080a] text-stone-100 pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <Link
              href="/belt-exams"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Belt Examination Portal
            </Link>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
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
                <Download className="w-3.5 h-3.5" /> Download Official Master PDF
              </button>
            </div>
          </div>

          {/* MASTER CERTIFICATE CONTAINER */}
          <div className="relative w-full max-w-[920px] mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-black/90 bg-[#12141a] print:border-none print:shadow-none print:rounded-none print:max-w-none">
            {/* Canvas Container */}
            <div
              className={`relative w-full select-none bg-stone-900 ${
                isJuniorBlackBelt ? "aspect-[3/4]" : "aspect-[1.414/1]"
              }`}
            >
              {/* Master Artwork Template Background */}
              <img
                src={templateImg}
                alt={`KALAWAR ${cert.beltRank} Certificate`}
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* OVERLAY 1: Top-Right Dynamic Metadata Table (7 Rows) */}
              {/* Line 1: Certificate No. */}
              <div
                className="absolute text-left font-mono font-bold text-[#1a1e29] text-[7px] sm:text-[9.5px] md:text-[11px] leading-none pointer-events-none -translate-y-[88%]"
                style={{ top: coords.certNo.top, left: coords.certNo.left }}
              >
                {cert.certificateNumber}
              </div>

              {/* Line 2: Student ID */}
              <div
                className="absolute text-left font-mono font-bold text-[#1a1e29] text-[7px] sm:text-[9.5px] md:text-[11px] leading-none pointer-events-none -translate-y-[88%]"
                style={{ top: coords.studentId.top, left: coords.studentId.left }}
              >
                {cert.athleteId}
              </div>

              {/* Line 3: Date of Birth */}
              <div
                className="absolute text-left font-mono font-bold text-[#1a1e29] text-[7px] sm:text-[9.5px] md:text-[11px] leading-none pointer-events-none -translate-y-[88%]"
                style={{ top: coords.dob.top, left: coords.dob.left }}
              >
                {formatToDDMMYYYY(cert.dob || cert.dateOfBirth, "—")}
              </div>

              {/* Line 4: Academy (Full Length Auto-Fitted without Truncation) */}
              <div
                className={`absolute text-left font-sans font-bold text-[#1a1e29] ${academyFontSizeClass} leading-none pointer-events-none whitespace-nowrap -translate-y-[88%]`}
                style={{ top: coords.academy.top, left: coords.academy.left }}
                title={academyStr}
              >
                {academyStr}
              </div>

              {/* Line 5: Date of Examination */}
              <div
                className="absolute text-left font-mono font-bold text-[#1a1e29] text-[7px] sm:text-[9.5px] md:text-[11px] leading-none pointer-events-none -translate-y-[88%]"
                style={{ top: coords.examDate.top, left: coords.examDate.left }}
              >
                {formatToDDMMYYYY(cert.examDate, "28/09/2026")}
              </div>

              {/* Line 6: Date of Issue */}
              <div
                className="absolute text-left font-mono font-bold text-[#1a1e29] text-[7px] sm:text-[9.5px] md:text-[11px] leading-none pointer-events-none -translate-y-[88%]"
                style={{ top: coords.issueDate.top, left: coords.issueDate.left }}
              >
                {formatToDDMMYYYY(cert.issuedDate || cert.issueDate, "04/09/2026")}
              </div>

              {/* Line 7: Place */}
              <div
                className="absolute text-left font-sans font-bold text-[#1a1e29] text-[6.5px] sm:text-[8.5px] md:text-[10px] leading-none pointer-events-none truncate max-w-[25%] -translate-y-[88%]"
                style={{ top: coords.place.top, left: coords.place.left }}
              >
                {cert.state ? `${cert.state.toUpperCase()}, INDIA` : "MAHARASHTRA, INDIA"}
              </div>

              {/* OVERLAY 2: Candidate Name (Centered in blank name zone) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[86%] pointer-events-none"
                style={{ top: coords.candidateName.top }}
              >
                <h2 className="font-serif font-black uppercase text-[#111827] text-base sm:text-2xl md:text-3xl lg:text-4xl tracking-wider drop-shadow-sm truncate">
                  {cert.candidateName}
                </h2>
              </div>

              {/* OVERLAY 3: QR Code (Bottom Left) */}
              <div
                className="absolute bg-white p-[1px] sm:p-[2px] flex items-center justify-center shadow-md rounded-[2px]"
                style={{
                  top: coords.qrCode.top,
                  left: coords.qrCode.left,
                  width: coords.qrCode.width,
                  height: coords.qrCode.height,
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
                      ✓ Authenticated &amp; Verified Belt Diploma
                    </span>
                    <span className="text-xs text-amber-400 font-bold">Official Federation Credential</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase break-words mt-0.5">{cert.candidateName}</h3>
                  <p className="text-xs text-amber-300 font-semibold">🥋 {cert.beltRank}</p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Download className="size-4" /> Download Official Master PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Certificate No</p>
                <p className="font-mono font-bold text-amber-400 break-all sm:break-normal text-[11px] sm:text-xs mt-1">{cert.certificateNumber}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Student ID</p>
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
                <p className="font-bold text-emerald-400 text-[11.5px] sm:text-xs mt-1">{cert.grade || "Passed"} {cert.score ? `(${cert.score}/100)` : ""}</p>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Exam Date</p>
                <p className="font-bold text-white text-[11.5px] sm:text-xs mt-1">{formatToDDMMYYYY(cert.examDate, "28/09/2026")}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-stone-400">Chief Technical Examiner:</p>
                <p className="font-bold text-white">{cert.chiefExaminer || "MR. SANTOSH KASBE"}</p>
                <p className="text-[11px] text-amber-400/80">{cert.chiefExaminerRank || "Chief Technical Board"}</p>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Digitally Ratified &amp; QR Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
