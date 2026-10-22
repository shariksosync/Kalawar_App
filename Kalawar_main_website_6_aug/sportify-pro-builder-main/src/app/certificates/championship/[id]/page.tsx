"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Trophy,
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
  Loader2,
  Eye,
  User,
  Medal,
  Swords,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "@/lib/utils";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { federation } from "@/constants/navigation";
import {
  downloadChampionshipDiplomaPDF,
  printChampionshipDiplomaPDF,
  formatToDDMM,
  extractDayAndMonth,
  getChampionshipEventName,
  getChampionshipCategoryTitle,
  getChampionshipPlaceString,
} from "@/lib/championship-pdf";
import {
  getChampionshipWebConfig,
  ChampionshipWebConfig,
} from "@/config/championship-certificate-coordinates";
import type { ChampionshipCertificate } from "@/types/championship";

export default function ChampionshipCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cert, setCert] = useState<ChampionshipCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCert() {
      if (!id) return;
      try {
        setLoading(true);
        setNotFound(false);
        const res = await fetch(`/api/certificates/championship/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.certificate) {
          setCert(data.certificate);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Championship certificate:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [id]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Certificate verification link copied to clipboard!");
    }
  };

  const verifyUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://kalawarfederation.org/certificates/championship/${encodeURIComponent(id)}`;

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Verifying championship credential from national registry...
          </p>
        </div>
      </SiteLayout>
    );
  }

  if (notFound || !cert) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-3xl bg-accent/40 text-primary grid place-items-center mb-4 border border-primary/20 shadow-gold">
            <Trophy className="size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            Certificate Not Found
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-md">
            No official championship certificate record was found matching credential identifier &quot;{id}&quot;.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/events"
              className="bg-gold-gradient text-background px-6 py-3 rounded-full text-xs font-bold shadow-gold hover:scale-105 transition-transform"
            >
              Browse Tournaments
            </Link>
            <Link
              href="/"
              className="border border-border/80 bg-card px-6 py-3 rounded-full text-xs font-semibold hover:border-primary transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const isGold = cert.podiumPlace === "Gold" || cert.awardType === "Gold Medal";
  const isSilver = cert.podiumPlace === "Silver" || cert.awardType === "Silver Medal";
  const isBronze = cert.podiumPlace === "Bronze" || cert.awardType === "Bronze Medal";

  return (
    <SiteLayout>
      {/* Top Breadcrumb & Share Bar */}
      <section className="pt-28 sm:pt-32 pb-4 bg-card/40 border-b border-border/60">
        <div className="shell max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/events" className="hover:text-primary transition-colors">Tournaments</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Championship Diploma</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl border border-border/80 bg-background/80 hover:border-primary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer text-center"
            >
              <Share2 className="size-3.5" /> Share Verification
            </button>
            <Link
              href="/events"
              className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl border border-border/70 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors text-center inline-flex items-center"
            >
              ← Back to Events
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="section-pad bg-background">
        <div className="shell max-w-5xl mx-auto space-y-8">
          {/* Header Verification Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-950/20 border border-emerald-500/40 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="size-11 sm:size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 grid place-items-center shrink-0">
                <BadgeCheck className="size-6 sm:size-6.5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Verified Championship Credential
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Official Authenticated Record
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Registry Cert No: <strong className="text-foreground font-bold break-all sm:break-normal">{cert.certificateNumber}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => downloadChampionshipDiplomaPDF(cert)}
                className="col-span-2 sm:col-span-1 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full bg-gold-gradient text-background font-bold text-[11.5px] sm:text-xs uppercase tracking-wider shadow-gold hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Download className="size-3.5 sm:size-4" /> Download Diploma (PDF)
              </button>
              <button
                type="button"
                onClick={() => printChampionshipDiplomaPDF(cert)}
                className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl sm:rounded-full bg-card border border-border hover:border-primary text-[11.5px] sm:text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Printer className="size-3.5 sm:size-4 text-primary" /> Print
              </button>
            </div>
          </div>

          {/* DIPLOMA PREVIEW CANVAS - OFFICIAL ARTWORK OVERLAY */}
          {(() => {
            const levelOrTier = (cert as any).level || cert.championshipTitle || cert.eventName || "district";
            const webConfig = getChampionshipWebConfig(levelOrTier);
            const awardLower = (cert.awardType || cert.place || cert.podiumPlace || "").toLowerCase();
            let activeTick = webConfig.awardBoxes.participation;
            if (awardLower.includes("gold") || awardLower.includes("1st")) {
              activeTick = webConfig.awardBoxes.gold;
            } else if (awardLower.includes("silver") || awardLower.includes("2nd")) {
              activeTick = webConfig.awardBoxes.silver;
            } else if (awardLower.includes("bronze") || awardLower.includes("3rd")) {
              activeTick = webConfig.awardBoxes.bronze;
            }

            const candidateName = cert.candidateName || cert.athleteName || "Competitor";
            const certNumDisplay = cert.certificateNumber
              ? cert.certificateNumber.replace(/^KAL-2026-([A-Za-z]-)?/i, "").replace(/^CERT-CHAMP-2026-([A-Za-z]-)?/i, "")
              : "0104";
            const { day, month } = extractDayAndMonth(cert.issueDate || new Date().toISOString());
            const placeStr = getChampionshipPlaceString(cert, levelOrTier);
            const eventName = getChampionshipEventName(cert);
            const categoryTitle = getChampionshipCategoryTitle(cert);
            const ageGroupTitle =
              cert.ageDivision && !cert.ageDivision.toLowerCase().includes("participant")
                ? cert.ageDivision
                : "Senior Open (18-29)";

            return (
              <div className="relative rounded-3xl border-2 sm:border-4 border-amber-500/40 bg-stone-950 p-2 sm:p-4 shadow-2xl overflow-hidden">
                <div className="relative w-full aspect-[297/210] rounded-2xl overflow-hidden shadow-inner select-none">
                  {/* Master Background Artwork Image */}
                  <img
                    src={webConfig.templateWebp || "/certificates/championship-templates/district-template.jpg"}
                    alt="Official Championship Certificate"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                    onError={(e) => {
                      // Fallback if png/webp is not found
                      const target = e.currentTarget;
                      if (target.src !== webConfig.templateFallback) {
                        target.src = webConfig.templateFallback;
                      }
                    }}
                  />

                  {/* 1. Candidate Name */}
                  <div
                    style={{
                      top: webConfig.candidateName.top,
                      left: webConfig.candidateName.left,
                      transform: webConfig.candidateName.transform,
                    }}
                    className={`absolute z-10 ${webConfig.candidateName.fontSizeClass || "text-base font-black"} select-text`}
                  >
                    {candidateName}
                  </div>

                  {/* 2. Event / Discipline */}
                  <div
                    style={{
                      top: webConfig.eventDiscipline.top,
                      left: webConfig.eventDiscipline.left,
                    }}
                    className={`absolute z-10 ${webConfig.eventDiscipline.fontSizeClass || "text-xs font-bold"} select-text`}
                  >
                    {eventName}
                  </div>

                  {/* 3. Category */}
                  <div
                    style={{
                      top: webConfig.category.top,
                      left: webConfig.category.left,
                    }}
                    className={`absolute z-10 ${webConfig.category.fontSizeClass || "text-xs font-bold"} select-text`}
                  >
                    {categoryTitle}
                  </div>

                  {/* 4. Age Group */}
                  <div
                    style={{
                      top: webConfig.ageGroup.top,
                      left: webConfig.ageGroup.left,
                    }}
                    className={`absolute z-10 ${webConfig.ageGroup.fontSizeClass || "text-xs font-bold"} select-text`}
                  >
                    {ageGroupTitle}
                  </div>

                  {/* 5. Weight Category */}
                  <div
                    style={{
                      top: webConfig.weightCategory.top,
                      left: webConfig.weightCategory.left,
                    }}
                    className={`absolute z-10 ${webConfig.weightCategory.fontSizeClass || "text-xs font-bold"} select-text`}
                  >
                    {cert.weightCategory || "-50.0 kg"}
                  </div>

                  {/* 6. Award Box Tick Mark */}
                  {activeTick && (
                    <div
                      style={{
                        top: activeTick.top,
                        left: activeTick.left,
                      }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-red-600 font-black text-xs sm:text-base md:text-xl select-none"
                    >
                      ✓
                    </div>
                  )}

                  {/* 7. Bottom Certificate Number */}
                  <div
                    style={{
                      top: webConfig.certNumberSuffix.top,
                      left: webConfig.certNumberSuffix.left,
                    }}
                    className={`absolute z-10 ${webConfig.certNumberSuffix.fontSizeClass || "text-xs font-mono font-bold"} select-text`}
                  >
                    {certNumDisplay}
                  </div>

                  {/* 8. Date Day & Month */}
                  {webConfig.eventDay && (
                    <div
                      style={{
                        top: webConfig.eventDay.top,
                        left: webConfig.eventDay.left,
                      }}
                      className={`absolute z-10 ${webConfig.eventDay.fontSizeClass || "text-xs font-bold"} select-text`}
                    >
                      {day}
                    </div>
                  )}
                  {webConfig.eventMonth && (
                    <div
                      style={{
                        top: webConfig.eventMonth.top,
                        left: webConfig.eventMonth.left,
                      }}
                      className={`absolute z-10 ${webConfig.eventMonth.fontSizeClass || "text-xs font-bold"} select-text`}
                    >
                      {month}
                    </div>
                  )}

                  {/* 9. Place */}
                  <div
                    style={{
                      top: webConfig.eventPlace.top,
                      left: webConfig.eventPlace.left,
                    }}
                    className={`absolute z-10 ${webConfig.eventPlace.fontSizeClass || "text-xs font-bold"} select-text`}
                  >
                    {placeStr}
                  </div>

                  {/* 10. QR Code */}
                  <div
                    style={{
                      top: webConfig.qrCode.top,
                      left: webConfig.qrCode.left,
                      width: webConfig.qrCode.width,
                    }}
                    className="absolute z-10 aspect-square p-0.5 bg-white rounded-xs shadow-xs"
                  >
                    <QRCode
                      value={verifyUrl}
                      size={256}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Certificate Metadata Details Grid */}
          <div className="luxe-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Credential Specification &amp; Registry Record
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
              <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                <span className="text-muted-foreground block font-semibold text-[10px] sm:text-xs">Certificate Number</span>
                <p className="font-mono font-bold text-primary break-all sm:break-normal text-[11px] sm:text-xs">{cert.certificateNumber}</p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                <span className="text-muted-foreground block font-semibold text-[10px] sm:text-xs">Date of Issue</span>
                <p className="font-bold text-foreground text-[11.5px] sm:text-xs">{formatToDDMMYYYY(cert.issueDate)}</p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                <span className="text-muted-foreground block font-semibold text-[10px] sm:text-xs">Competitor Bib</span>
                <p className="font-mono font-bold text-amber-400 break-all sm:break-normal text-[11.5px] sm:text-xs">{cert.bibNumber || "BIB-CHAMP"}</p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                <span className="text-muted-foreground block font-semibold text-[10px] sm:text-xs">Sanctioning Body</span>
                <p className="font-bold text-foreground text-[11.5px] sm:text-xs">National Federation</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
