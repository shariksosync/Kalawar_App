"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  Calendar,
  Building2,
  User,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Medal,
  Clock,
  CheckCircle2,
  X,
  Copy,
  Check,
  Filter,
  Eye,
} from "lucide-react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import type { CertificateItem } from "@/types/certificate";
import { downloadCertificatePDF, printCertificateSlip } from "@/lib/certificate-pdf";
import { downloadDanDiplomaPDF, printDanDiplomaPDF } from "@/lib/dan-pdf-download";
import { downloadBeltDiplomaPDF, printBeltDiplomaPDF } from "@/lib/belt-pdf-download";
import { downloadChampionshipDiplomaPDF, printChampionshipDiplomaPDF } from "@/lib/championship-pdf";
import { RefereeCertificateView } from "@/components/certificates/RefereeCertificateView";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";
import { IMAGES } from "@/data/images";

type FilterTab = "all" | "dan" | "belt" | "championship" | "accreditation";

export default function MyCertificatesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadMyCertificates() {
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all certificates to match against current member credentials
        const res = await fetch("/api/certificates?all=true");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.certificates)) {
            const userLowerId = (user.id || "").trim().toLowerCase();
            const userLowerEmail = (user.email || "").trim().toLowerCase();

            const myCerts = data.certificates.filter((c: CertificateItem) => {
              const cId = (c.kalawarId || "").trim().toLowerCase();
              const cEmail = (c.email || "").trim().toLowerCase();

              // 1. Primary match: Strict User / Athlete ID
              if (userLowerId && cId && cId === userLowerId) {
                return true;
              }

              // 2. Secondary match: Strict Registered Email (only if ID doesn't conflict)
              if (userLowerEmail && cEmail && cEmail === userLowerEmail) {
                if (!cId || !userLowerId || cId === userLowerId) {
                  return true;
                }
              }

              return false;
            });

            setCertificates(myCerts);
            return;
          }
        }

        setCertificates([]);
      } catch (err) {
        console.error("Failed to load user certificates:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadMyCertificates();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    toast.success("Certificate number copied to clipboard");
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Categorization helpers
  const isDanCert = (c: CertificateItem) =>
    c.isDanCert ||
    c.type?.toLowerCase().includes("dan") ||
    c.type?.toLowerCase().includes("black belt") ||
    c.number?.startsWith("KAC-DAN") ||
    c.position?.toLowerCase().includes("dan");

  const isBeltCert = (c: CertificateItem) =>
    (c.isBeltCert ||
      c.type?.toLowerCase().includes("belt examination") ||
      c.number?.startsWith("KAC-BELT") ||
      c.position?.toLowerCase().includes("grading")) &&
    !isDanCert(c);

  const isChampionshipCert = (c: CertificateItem) =>
    !isDanCert(c) &&
    !isBeltCert(c) &&
    (c.type?.toLowerCase().includes("championship") ||
      c.type?.toLowerCase().includes("achievement") ||
      c.type?.toLowerCase().includes("participation") ||
      c.position?.toLowerCase().includes("medal") ||
      c.position?.toLowerCase().includes("place") ||
      c.position?.toLowerCase().includes("participant"));

  const isAccreditationCert = (c: CertificateItem) =>
    !isDanCert(c) &&
    !isBeltCert(c) &&
    !isChampionshipCert(c);

  const counts = useMemo(() => {
    const dan = certificates.filter(isDanCert).length;
    const belt = certificates.filter(isBeltCert).length;
    const champ = certificates.filter(isChampionshipCert).length;
    const acc = certificates.filter(isAccreditationCert).length;
    return { all: certificates.length, dan, belt, champ, acc };
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    if (activeTab === "dan") return certificates.filter(isDanCert);
    if (activeTab === "belt") return certificates.filter(isBeltCert);
    if (activeTab === "championship") return certificates.filter(isChampionshipCert);
    if (activeTab === "accreditation") return certificates.filter(isAccreditationCert);
    return certificates;
  }, [certificates, activeTab]);

  const handleDownload = async (cert: CertificateItem) => {
    if (isDanCert(cert)) {
      toast.loading("Generating High-Resolution Dan Master Diploma PDF...", { id: "pdf-gen" });
      try {
        await downloadDanDiplomaPDF(cert);
        toast.success("Dan Diploma PDF downloaded successfully!", { id: "pdf-gen" });
      } catch {
        toast.error("Failed to generate Dan Diploma PDF", { id: "pdf-gen" });
      }
    } else if (isBeltCert(cert)) {
      toast.loading("Generating Official Belt Examination Certificate PDF...", { id: "pdf-gen" });
      try {
        await downloadBeltDiplomaPDF(cert);
        toast.success("Belt Certificate PDF downloaded successfully!", { id: "pdf-gen" });
      } catch {
        toast.error("Failed to generate Belt Certificate PDF", { id: "pdf-gen" });
      }
    } else if (isChampionshipCert(cert)) {
      toast.loading("Generating Official Championship Diploma PDF...", { id: "pdf-gen" });
      try {
        const champCertData = {
          certificateNumber: cert.number,
          applicationId: cert.kalawarId || cert.id,
          championshipTitle: cert.event,
          level: cert.level || "District",
          discipline: cert.discipline || "Kalawar Martial Arts",
          category: cert.category || "",
          candidateName: cert.holder,
          athleteName: cert.holder,
          athleteId: cert.kalawarId,
          email: cert.email,
          phone: cert.phone,
          clubName: cert.academy || cert.club || "",
          state: cert.state || "",
          ageDivision:
            cert.ageDivision && !cert.ageDivision.toLowerCase().includes("participant")
              ? cert.ageDivision
              : cert.qualification && !cert.qualification.toLowerCase().includes("participant")
              ? cert.qualification
              : "Senior Open (18-29)",
          weightCategory: cert.weightCategory || "-50.0 kg",
          beltRank: cert.rankOrBelt || cert.beltRank || "",
          awardType: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
          place: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
          podiumPlace: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
          issueDate: cert.issued,
          bibNumber: cert.bibNumber,
          eventLocation: cert.venue || cert.district || (cert as any).city || cert.state || "District Sports Complex",
          notes: cert.notes || "",
        };
        await downloadChampionshipDiplomaPDF(champCertData as any);
      } catch {
        toast.error("Failed to generate Championship Diploma PDF", { id: "pdf-gen" });
      }
    } else {
      downloadCertificatePDF(cert);
    }
  };

  const handlePrint = async (cert: CertificateItem) => {
    if (isDanCert(cert)) {
      await printDanDiplomaPDF(cert);
    } else if (isBeltCert(cert)) {
      await printBeltDiplomaPDF(cert);
    } else if (isChampionshipCert(cert)) {
      const champCertData = {
        certificateNumber: cert.number,
        applicationId: cert.kalawarId || cert.id,
        championshipTitle: cert.event,
        level: cert.level || "District",
        discipline: cert.discipline || "Kalawar Martial Arts",
        category: cert.category || "",
        candidateName: cert.holder,
        athleteName: cert.holder,
        athleteId: cert.kalawarId,
        email: cert.email,
        phone: cert.phone,
        clubName: cert.academy || cert.club || "",
        state: cert.state || "",
        ageDivision:
          cert.ageDivision && !cert.ageDivision.toLowerCase().includes("participant")
            ? cert.ageDivision
            : cert.qualification && !cert.qualification.toLowerCase().includes("participant")
            ? cert.qualification
            : "Senior Open (18-29)",
        weightCategory: cert.weightCategory || "-50.0 kg",
        beltRank: cert.rankOrBelt || cert.beltRank || "",
        awardType: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
        place: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
        podiumPlace: cert.awardType || (cert.position && !cert.position.includes("Championship") ? cert.position : "Participant"),
        issueDate: cert.issued,
        bibNumber: cert.bibNumber,
        eventLocation: cert.venue || cert.district || (cert as any).city || cert.state || "District Sports Complex",
        notes: cert.notes || "",
      };
      await printChampionshipDiplomaPDF(champCertData as any);
    } else {
      printCertificateSlip(cert);
    }
  };

  // 1. Loading State
  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-spin">
            <Award className="size-6 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            Retrieving your official federation certificates...
          </p>
        </div>
      </SiteLayout>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated || !user) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="Federation Credentials"
          title="My Certificates"
          description="Access, verify, print, and download your authentic championship awards, Dan grading diplomas, and belt credentials."
          image={IMAGES.trophy}
        />
        <section className="section-pad">
          <div className="shell max-w-xl mx-auto text-center space-y-5">
            <div className="luxe-card p-10 sm:p-12 rounded-3xl border border-border/80 space-y-5">
              <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center mx-auto">
                <Award className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Sign In to View Your Certificates</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Please log in to your registered member account to view and download official championship, Dan grade, or belt examination certificates.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                >
                  Sign In to Member Portal <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/register"
                  className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold"
                >
                  Register New Member
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // 3. State & District Association Coming Soon State
  if (
    user?.memberType === "StateAssociation" ||
    user?.id?.startsWith("KSM-SA-") ||
    user?.id?.startsWith("WSF-SA-") ||
    user?.memberType === "DistrictAssociation" ||
    user?.id?.startsWith("KSM-DA-") ||
    user?.id?.startsWith("WSF-DA-")
  ) {
    const isDistrict = user?.memberType === "DistrictAssociation" || user?.id?.startsWith("KSM-DA-") || user?.id?.startsWith("WSF-DA-");
    const portalEyebrow = isDistrict ? "District Association Portal" : "State Association Portal";
    const certTitle = isDistrict ? "District Association Certificates" : "State Association Certificates";
    const certDesc = isDistrict
      ? "District Association certificates and credentials registry will be available soon in an upcoming update."
      : "State Association certificates and credentials registry will be available soon in an upcoming update.";

    return (
      <SiteLayout>
        <PageHero
          eyebrow={portalEyebrow}
          title="My Certificates"
          description={`Accreditation and certification credentials for ${user.name} (${user.id}).`}
          image={IMAGES.trophy}
        />
        <section className="section-pad">
          <div className="shell max-w-xl mx-auto text-center space-y-5">
            <div className="luxe-card p-10 sm:p-12 rounded-3xl border border-border/80 space-y-5">
              <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 grid place-items-center mx-auto">
                <Clock className="size-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider">
                  Coming Soon
                </span>
                <h2 className="text-2xl font-bold text-foreground">{certTitle}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {certDesc}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                >
                  Back to Dashboard <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Member Accreditation"
        title="My Certificates"
        description={`Official credentials and achievement awards conferred to ${user.name} (${user.id}).`}
        image={IMAGES.trophy}
      />

      <section className="section-pad bg-background">
        <div className="shell max-w-6xl mx-auto space-y-8">
          {/* ========================================================================= */}
          {/* CASE 1: USER HAS ISSUED CERTIFICATES                                      */}
          {/* ========================================================================= */}
          {certificates.length > 0 ? (
            <div className="space-y-8">
              {/* Top Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/80 border border-border/80">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center shrink-0">
                    <Award className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Conferred Federation Certificates ({certificates.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Digitally authenticated and recorded in the KALAWAR National Ledger.
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer",
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  All Certificates ({counts.all})
                </button>
                {counts.dan > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("dan")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                      activeTab === "dan"
                        ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
                        : "bg-card/70 border border-amber-500/30 text-amber-400/90 hover:text-amber-300 hover:border-amber-400"
                    )}
                  >
                    <span>🥋 Dan Diplomas</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{counts.dan}</span>
                  </button>
                )}
                {counts.belt > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("belt")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                      activeTab === "belt"
                        ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
                        : "bg-card/70 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400"
                    )}
                  >
                    <span>🥋 Belt Exams</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{counts.belt}</span>
                  </button>
                )}
                {counts.champ > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("championship")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                      activeTab === "championship"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                    )}
                  >
                    <span>🏅 Championships</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{counts.champ}</span>
                  </button>
                )}
                {counts.acc > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("accreditation")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                      activeTab === "accreditation"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                    )}
                  >
                    <span>🛡️ Accreditations</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{counts.acc}</span>
                  </button>
                )}
              </div>

              {/* Certificates Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {filteredCertificates.map((cert) => {
                  const isDan = isDanCert(cert);
                  const isBelt = isBeltCert(cert);
                  const isChamp = isChampionshipCert(cert);

                  return (
                    <div
                      key={cert.id || cert.number}
                      className={cn(
                        "luxe-card p-4.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col justify-between space-y-5 group transition-all",
                        isDan
                          ? "border-amber-400/50 bg-gradient-to-br from-[#121008] via-card to-amber-950/20 hover:border-amber-400 shadow-amber-950/20"
                          : isBelt
                          ? "border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-950/15 hover:border-emerald-400"
                          : isChamp
                          ? "border-primary/50 bg-gradient-to-br from-card via-card to-primary/10 hover:border-primary shadow-primary/10"
                          : "border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/60"
                      )}
                    >
                      {/* Top Row: Type & Number */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 border-b border-border/60 pb-3 sm:pb-4">
                        <div className="space-y-1.5 min-w-0">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                              isDan
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                                : isBelt
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : isChamp
                                ? "bg-primary/20 text-primary border-primary/40 font-black"
                                : "bg-primary/15 text-primary border-primary/30"
                            )}
                          >
                            {isDan
                              ? "🥋 Black Belt Dan Diploma"
                              : isBelt
                              ? "🥋 Belt Examination Certificate"
                              : isChamp
                              ? `🏆 ${cert.level || "Championship"} Diploma`
                              : cert.type}
                          </span>
                          <h4 className="text-base font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors break-words">
                            {cert.event}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(cert.number)}
                          className={cn(
                            "font-mono text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 self-start cursor-pointer",
                            isDan
                              ? "text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20"
                              : "text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
                          )}
                          title="Copy Certificate Number"
                        >
                          <span className="break-all sm:break-normal">{cert.number}</span>
                          {copiedNumber === cert.number ? (
                            <Check className="size-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="size-3 opacity-60 shrink-0" />
                          )}
                        </button>
                      </div>

                      {/* Middle: Details */}
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Conferred Award</span>
                          <p className="font-bold text-foreground text-xs sm:text-sm break-words">{cert.position}</p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rank / Grade</span>
                          <p
                            className={cn(
                              "font-semibold text-xs sm:text-sm break-words",
                              isDan ? "text-amber-400" : isBelt ? "text-emerald-400" : "text-primary"
                            )}
                          >
                            {cert.danRank || cert.beltRank || cert.rankOrBelt || "Standard"}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Issue Date</span>
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{formatToDDMMYYYY(cert.issued)}</p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Accreditation</span>
                          <p className="font-bold text-emerald-400 text-xs sm:text-sm inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3 shrink-0" /> Valid &amp; Active
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <Link
                            href={
                              isDan
                                ? `/certificates/dan/${encodeURIComponent(cert.number)}`
                                : isBelt
                                ? `/certificates/belt/${encodeURIComponent(cert.number)}`
                                : isChamp
                                ? `/certificates/championship/${encodeURIComponent(cert.number)}`
                                : `/certificates/${encodeURIComponent(cert.number)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "text-xs font-bold inline-flex items-center gap-1.5 transition-colors hover:underline",
                              isDan
                                ? "text-amber-400 hover:text-amber-300"
                                : isBelt
                                ? "text-emerald-400 hover:text-emerald-300"
                                : "text-primary hover:text-primary/80"
                            )}
                          >
                            <Eye className="size-3.5" />
                            <span>Preview</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handlePrint(cert)}
                            className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:text-primary inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs text-center"
                            title="Print Official Certificate"
                          >
                            <Printer className="size-3.5 text-primary" /> Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(cert)}
                            className={cn(
                              "rounded-xl px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs text-center",
                              isDan
                                ? "bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-amber-400/20"
                                : isBelt
                                ? "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/20"
                                : "border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary shadow-primary/10"
                            )}
                            title="Download Official PDF"
                          >
                            <Download className="size-3.5" /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE 2: NO CERTIFICATE IS ISSUED YET                                      */
            /* ========================================================================= */
            <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-card via-amber-500/5 to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
              <div className="size-16 sm:size-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center mx-auto shadow-gold/20 shadow-lg">
                <Award className="size-8 sm:size-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Status: No Certificates Conferred
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  No Certificate is Issued Yet
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  No official federation certificates have been issued to{" "}
                  <strong className="text-foreground">{user.name}</strong> (Member ID:{" "}
                  <span className="font-mono font-bold text-primary">{user.id}</span>) by the administration yet.
                </p>
              </div>

              {/* How to Earn Certificates Info Box */}
              <div className="p-5 rounded-2xl bg-background/80 border border-border/80 text-left space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Official Ways Certificates Are Conferred
                </span>
                <div className="grid gap-2.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <Medal className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Tournament Podiums &amp; Participation:</strong> Gold, Silver, Bronze medals and official participation merit in State/National championships.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Dan Grading &amp; Belt Exams:</strong> Successful completion and ratification of color belt examinations or Black Belt Dan defenses.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Coach &amp; Referee Accreditations:</strong> Licensed technical official certifications and coaching clinics.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/events"
                  className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                >
                  <Medal className="size-3.5" /> Browse Upcoming Championships
                </Link>
                <Link
                  href="/dashboard"
                  className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  Go to My Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CERTIFICATE FULL PREVIEW MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-3xl rounded-3xl border-2 border-primary/40 bg-card/95 p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center">
                    <Award className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Official Conferred Certificate</h3>
                    <p className="text-xs text-muted-foreground font-mono">{selectedCert.number}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="size-8 rounded-full border border-border/80 hover:border-primary grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Certificate Presentation Frame */}
              {isDanCert(selectedCert) ? (
                <div className="rounded-2xl border-4 border-double border-amber-400 bg-gradient-to-b from-[#161209] to-[#0d0a05] text-white p-6 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                      {settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-300 font-serif">
                      BLACK BELT DAN DIPLOMA
                    </h2>
                    <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-mono">
                      NATIONAL DIPLOMA NO: {selectedCert.number}
                    </p>
                  </div>

                  <div className="space-y-2 py-3 border-y border-amber-400/30">
                    <p className="text-xs text-stone-300 italic">This is to officially certify that</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-200 uppercase tracking-tight font-serif">
                      {selectedCert.holder}
                    </p>
                    <p className="text-xs text-stone-300">
                      Member ID: <strong className="font-mono text-amber-400">{selectedCert.kalawarId || user.id}</strong> · {selectedCert.state}, India
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1 rounded-full bg-amber-400 text-stone-950 font-extrabold text-sm uppercase tracking-wider shadow-lg">
                        {selectedCert.danRank || selectedCert.rankOrBelt || selectedCert.position}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left pt-2 text-xs text-stone-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1 rounded-lg border border-amber-400">
                        <QRCode
                          value={`https://kalawarmartialarts.org/certificates/dan/${encodeURIComponent(selectedCert.number)}`}
                          size={50}
                        />
                      </div>
                      <div className="text-[10px]">
                        <p className="font-bold text-amber-400">Digital Seal</p>
                        <p>Issued: {selectedCert.issued}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Link
                        href={`/certificates/dan/${encodeURIComponent(selectedCert.number)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5 underline"
                      >
                        Open High-Resolution Diploma Portal <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : isBeltCert(selectedCert) ? (
                <div className="rounded-2xl border-4 border-double border-emerald-500/80 bg-gradient-to-b from-[#091a13] to-[#040d0a] text-white p-6 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                      {settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-300 font-serif">
                      BELT EXAMINATION CERTIFICATE
                    </h2>
                    <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-mono">
                      NATIONAL CERTIFICATE NO: {selectedCert.number}
                    </p>
                  </div>

                  <div className="space-y-2 py-3 border-y border-emerald-500/30">
                    <p className="text-xs text-stone-300 italic">This is to officially certify that</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-200 uppercase tracking-tight font-serif">
                      {selectedCert.holder}
                    </p>
                    <p className="text-xs text-stone-300">
                      Member ID: <strong className="font-mono text-emerald-400">{selectedCert.kalawarId || user.id}</strong> · {selectedCert.state}, India
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1 rounded-full bg-emerald-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider shadow-lg">
                        {selectedCert.beltRank || selectedCert.rankOrBelt || selectedCert.position}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left pt-2 text-xs text-stone-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1 rounded-lg border border-emerald-400">
                        <QRCode
                          value={`https://kalawarmartialarts.org/certificates/belt/${encodeURIComponent(selectedCert.number)}`}
                          size={50}
                        />
                      </div>
                      <div className="text-[10px]">
                        <p className="font-bold text-emerald-400">Digital Seal</p>
                        <p>Issued: {selectedCert.issued}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Link
                        href={`/certificates/belt/${encodeURIComponent(selectedCert.number)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1.5 underline"
                      >
                        Open High-Resolution Belt Portal <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedCert.type === "Club Affiliation Certificate" ||
              selectedCert.type === "Affiliation Certificate" ||
              selectedCert.event?.toLowerCase().includes("affiliation") ||
              selectedCert.number?.startsWith("KAC-AFF") ||
              selectedCert.number?.startsWith("WSF-CL") ? (
                <div className="space-y-4">
                  <ClubAffiliationCertificateView
                    certificate={selectedCert}
                  />
                  <div className="p-3 rounded-xl bg-background/80 border border-border/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Affiliation Level: </span>
                      <strong className="text-amber-400 font-bold">{selectedCert.position || "Club Affiliation"}</strong>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      Issued: <strong className="text-foreground">{selectedCert.issued}</strong>
                    </div>
                  </div>
                </div>
              ) : selectedCert.type === "Referee / Technical Official Certificate" ||
              selectedCert.position?.toLowerCase().includes("referee") ? (
                <div className="space-y-4">
                  <RefereeCertificateView
                    certificate={selectedCert}
                    verificationUrl={`https://kalawarmartialarts.org/certificates?number=${encodeURIComponent(selectedCert.number)}`}
                  />
                  <div className="p-3 rounded-xl bg-background/80 border border-border/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Official Designation: </span>
                      <strong className="text-amber-400 font-bold">{selectedCert.position}</strong>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      Issued: <strong className="text-foreground">{selectedCert.issued}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-4 border-double border-amber-400/80 bg-gradient-to-b from-[#fffef7] to-[#faf5e8] text-stone-900 p-6 sm:p-8 shadow-inner space-y-5 text-center relative overflow-hidden">
                  <div className="border border-amber-600/30 p-5 rounded-xl space-y-4">
                    {/* Top Org Title */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-amber-900">
                        {settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}
                      </p>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-800 font-serif">
                        CERTIFICATE OF ACHIEVEMENT
                      </h2>
                      <p className="text-[10px] text-amber-900/70 uppercase tracking-wider font-mono">
                        NATIONAL CERTIFICATE NO: {selectedCert.number}
                      </p>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-2 py-2">
                      <p className="text-xs text-stone-600 italic">This is to officially certify that</p>
                      <p className="text-xl sm:text-2xl font-black text-amber-950 uppercase tracking-tight font-serif border-b-2 border-amber-400/60 inline-block pb-0.5">
                        {selectedCert.holder}
                      </p>
                      <p className="text-xs text-stone-600">
                        Member ID: <strong className="font-mono text-stone-900">{selectedCert.kalawarId || user.id}</strong> · {selectedCert.state}, India
                      </p>
                      <p className="text-xs text-stone-700 leading-relaxed pt-2 max-w-lg mx-auto">
                        has successfully achieved <strong className="text-amber-900">{selectedCert.position}</strong> in the prestigious event{" "}
                        <strong className="text-stone-900">{selectedCert.event}</strong>.
                      </p>
                    </div>

                    {/* Footer Signatures & QR */}
                    <div className="pt-4 border-t border-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-lg border border-amber-400 shadow-xs">
                          <QRCode
                            value={`https://kalawarmartialarts.org/certificates?number=${encodeURIComponent(selectedCert.number)}`}
                            size={50}
                          />
                        </div>
                        <div className="text-[10px] text-stone-600">
                          <p className="font-bold text-stone-900">Digital Seal</p>
                          <p>Issued: {selectedCert.issued}</p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-stone-800">
                        <p className="font-bold font-serif">{selectedCert.issuedBy}</p>
                        <p className="text-[10px] text-stone-600">Governing Council, India</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="w-full sm:w-auto border border-border/80 hover:border-primary/60 rounded-xl sm:rounded-full px-5 py-2.5 text-xs font-semibold hover:bg-accent/40 transition-colors cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint(selectedCert)}
                  className="w-full sm:w-auto border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl sm:rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors text-center"
                >
                  <Printer className="size-4" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedCert)}
                  className="w-full sm:w-auto bg-gold-gradient text-background rounded-xl sm:rounded-full px-6 py-2.5 text-xs font-bold shadow-gold hover:opacity-95 transition-opacity cursor-pointer inline-flex items-center justify-center gap-2 text-center"
                >
                  <Download className="size-4" /> Download Official PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}

