"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Award,
  Download,
  Printer,
  Share2,
  RotateCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Edit3,
  Flame,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { cn, formatToDDMMYYYY, formatMemberType } from "@/lib/utils";
import type { IdCardEntry } from "@/lib/id-cards-store";
import { downloadIdCardPDF, printIdCard } from "@/lib/id-card-pdf-download";
import { downloadDanIDCardPDF, printDanIDCard } from "@/lib/dan-pdf-download";
import { PlayerIdCard } from "@/components/cards/PlayerIdCard";
import { DanIdCard } from "@/components/cards/DanIdCard";
import { ChampionshipIdCard } from "@/components/cards/ChampionshipIdCard";
import { downloadChampionshipIdCardPDF, printChampionshipIdCard } from "@/lib/championship-id-card-pdf";
import { IMAGES } from "@/data/images";
import { Trophy } from "lucide-react";

export default function MyIdCardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  // Active Tab Switcher: "member" | "dan" | "championship"
  const [activeTab, setActiveTab] = useState<"member" | "dan" | "championship">("member");

  // Member ID Card State
  const [memberCard, setMemberCard] = useState<IdCardEntry | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [isMemberFlipped, setIsMemberFlipped] = useState(false);

  // Dan ID Card State
  const [danCard, setDanCard] = useState<any | null>(null);
  const [danLoading, setDanLoading] = useState(true);
  const [isDanFlipped, setIsDanFlipped] = useState(false);

  // Championship ID Card State
  const [champCard, setChampCard] = useState<any | null>(null);
  const [champLoading, setChampLoading] = useState(true);
  const [isChampFlipped, setIsChampFlipped] = useState(false);

  useEffect(() => {
    async function loadAllCards() {
      if (!isAuthenticated || !user?.id) {
        setMemberLoading(false);
        setDanLoading(false);
        setChampLoading(false);
        return;
      }

      let foundMemberCard: IdCardEntry | null = null;
      let foundDanCard: any = null;
      let foundChampCard: any = null;

      // 1. Fetch Standard Member ID Card
      try {
        setMemberLoading(true);
        const res = await fetch(`/api/id-cards/${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.card) {
            foundMemberCard = {
              ...data.card,
              cardType: data.card.cardType || (user.memberType as any) || (user.id?.startsWith("WSF-CO") ? "Coach" : undefined),
              memberType: (data.card as any).memberType || user.memberType,
              holderPhoto: user.avatar || (data.card as any).logo || data.card.holderPhoto,
            };
            setMemberCard(foundMemberCard);
          } else {
            // Fallback: search in list
            const listRes = await fetch(`/api/id-cards?sync=true`);
            if (listRes.ok) {
              const listData = await listRes.json();
              if (listData.success && Array.isArray(listData.cards)) {
                const userLowerId = (user.id || "").toLowerCase().trim();
                const userLowerEmail = (user.email || "").toLowerCase().trim();

                const found = listData.cards.find(
                  (c: IdCardEntry) =>
                    (c.id && c.id.toLowerCase().trim() === userLowerId) ||
                    (c.email && userLowerEmail && c.email.toLowerCase().trim() === userLowerEmail && (!c.id || c.id.toLowerCase().trim() === userLowerId))
                );
                if (found) {
                  foundMemberCard = {
                    ...found,
                    cardType: found.cardType || (user.memberType as any) || (user.id?.startsWith("WSF-CO") ? "Coach" : undefined),
                    memberType: (found as any).memberType || user.memberType,
                    holderPhoto: user.avatar || (found as any).logo || found.holderPhoto,
                  };
                }
                setMemberCard(foundMemberCard);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching standard ID card:", err);
      } finally {
        setMemberLoading(false);
      }

      // 2. Fetch Black Belt / Dan ID Card
      try {
        setDanLoading(true);

        // Try direct Dan API lookup by user ID
        const danRes = await fetch(`/api/id-cards/dan/${encodeURIComponent(user.id)}`);
        if (danRes.ok) {
          const danData = await danRes.json();
          if (danData.success && danData.card) {
            foundDanCard = {
              ...danData.card,
              photoUrl: user.avatar || danData.card.photoUrl || danData.card.athletePhoto || danData.card.holderPhoto,
              athletePhoto: user.avatar || danData.card.athletePhoto || danData.card.photoUrl || danData.card.holderPhoto,
              holderPhoto: user.avatar || danData.card.holderPhoto || danData.card.photoUrl || danData.card.athletePhoto,
            };
            setDanCard(foundDanCard);
          }
        }

        // Try lookup by user email if not found
        if (!foundDanCard && user.email) {
          const danEmailRes = await fetch(`/api/id-cards/dan/${encodeURIComponent(user.email)}`);
          if (danEmailRes.ok) {
            const danEmailData = await danEmailRes.json();
            if (danEmailData.success && danEmailData.card) {
              foundDanCard = {
                ...danEmailData.card,
                photoUrl: user.avatar || danEmailData.card.photoUrl || danEmailData.card.athletePhoto || danEmailData.card.holderPhoto,
                athletePhoto: user.avatar || danEmailData.card.athletePhoto || danEmailData.card.photoUrl || danEmailData.card.holderPhoto,
                holderPhoto: user.avatar || danEmailData.card.holderPhoto || danEmailData.card.photoUrl || danEmailData.card.athletePhoto,
              };
              setDanCard(foundDanCard);
            }
          }
        }

        // Fallback: check verify endpoint using user ID or email strictly
        if (!foundDanCard) {
          const searchParam = user.id || user.email || "";
          if (searchParam) {
            const verifyRes = await fetch(`/api/dan-grading/verify?q=${encodeURIComponent(searchParam)}`);
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.success && (verifyData.certificate || verifyData.application)) {
                const app = verifyData.application;
                const cert = verifyData.certificate;
                const isPassed = cert || app?.status === "Passed";
                const resolvedPhoto = user.avatar || cert?.photoUrl || app?.athletePhoto;
                foundDanCard = {
                  id: cert?.idCardNumber || app?.idCardNumber || "KAC-DAN-ID-" + user.id,
                  idCardNumber: cert?.idCardNumber || app?.idCardNumber || "KAC-DAN-ID-" + user.id,
                  certificateNumber: cert?.certificateNumber || app?.certificateNumber || "KAC-DAN-2026-0001",
                  candidateName: cert?.candidateName || app?.fullName || user.name,
                  fullName: cert?.candidateName || app?.fullName || user.name,
                  athleteId: cert?.athleteId || app?.athleteId || user.id,
                  danRank: cert?.danRank || app?.appliedDanGrade || 1,
                  appliedDanGrade: cert?.danRank || app?.appliedDanGrade || 1,
                  danRankTitle: cert?.danRankTitle || app?.appliedDanTitle || "1st Dan Black Belt",
                  appliedDanTitle: cert?.danRankTitle || app?.appliedDanTitle || "1st Dan Black Belt",
                  dob: cert?.dob || app?.dob || "15/08/1998",
                  bloodGroup: app?.bloodGroup || "",
                  emergencyPhone: app?.phone || "+91 98220 12345",
                  discipline: cert?.discipline || app?.discipline || "Kalawar Martial Arts",
                  academyName: cert?.academyName || app?.academyName || "Kalawar State Academy",
                  district: app?.district || "Pune",
                  state: cert?.state || app?.state || "Maharashtra",
                  photoUrl: resolvedPhoto,
                  athletePhoto: resolvedPhoto,
                  holderPhoto: resolvedPhoto,
                  issueDate: cert?.issueDate || app?.certificateIssuedDate || "2026-09-04",
                  validity: "Lifetime Holder",
                  validUntil: "Lifetime Holder",
                  status: isPassed ? "Active" : "Submitted",
                  isApproved: isPassed,
                  presidentName: "MR. SANTOSH KASBE",
                  presidentRole: "Founder & President – India | Head – Technical Committee, India",
                };
                setDanCard(foundDanCard);
              }
            }
          }
        }

        // Auto-switch to Dan tab if user has approved Dan card and no standard member card
        if (foundDanCard?.isApproved && !foundMemberCard) {
          setActiveTab("dan");
        }
      } catch (err) {
        console.error("Error fetching Dan ID card:", err);
      } finally {
        setDanLoading(false);
      }

      // 3. Fetch Championship Competitor ID Card
      try {
        setChampLoading(true);

        // Try lookup by user ID
        const champRes = await fetch(`/api/id-cards/championship/${encodeURIComponent(user.id)}`);
        if (champRes.ok) {
          const champData = await champRes.json();
          if (champData.success && champData.card) {
            foundChampCard = {
              ...champData.card,
              holderPhoto: user.avatar || champData.card.holderPhoto || champData.card.athletePhoto || champData.card.photo,
              photoUrl: user.avatar || champData.card.photoUrl || champData.card.athletePhoto || champData.card.photo,
            };
            setChampCard(foundChampCard);
          }
        }

        // Try lookup by user email if not found
        if (!foundChampCard && user.email) {
          const champEmailRes = await fetch(`/api/id-cards/championship/${encodeURIComponent(user.email)}`);
          if (champEmailRes.ok) {
            const champEmailData = await champEmailRes.json();
            if (champEmailData.success && champEmailData.card) {
              foundChampCard = {
                ...champEmailData.card,
                holderPhoto: user.avatar || champEmailData.card.holderPhoto || champEmailData.card.athletePhoto || champEmailData.card.photo,
                photoUrl: user.avatar || champEmailData.card.photoUrl || champEmailData.card.athletePhoto || champEmailData.card.photo,
              };
              setChampCard(foundChampCard);
            }
          }
        }

        // Auto-switch to Championship tab if user has approved championship card and neither member nor dan approved
        if (foundChampCard?.isApproved && !foundMemberCard && !foundDanCard?.isApproved) {
          setActiveTab("championship");
        }
      } catch (err) {
        console.error("Error fetching Championship ID card:", err);
      } finally {
        setChampLoading(false);
      }
    }

    if (!authLoading) {
      loadAllCards();
    }
  }, [user, isAuthenticated, authLoading]);

  // Handlers for Member ID Card
  const handleMemberPrint = async () => {
    if (!memberCard) return;
    await printIdCard(memberCard);
  };

  const handleMemberShare = () => {
    if (typeof window !== "undefined" && memberCard?.id) {
      const url = `${window.location.origin}/id-cards/${encodeURIComponent(memberCard.id)}`;
      navigator.clipboard.writeText(url);
      toast.success("Official Member ID card verification link copied to clipboard!");
    }
  };

  const handleMemberDownloadPDF = async () => {
    if (!memberCard) return;
    await downloadIdCardPDF(memberCard);
  };

  // Handlers for Dan ID Card
  const handleDanPrint = async () => {
    if (!danCard) return;
    await printDanIDCard(danCard);
  };

  const handleDanShare = () => {
    if (typeof window !== "undefined" && (danCard?.certificateNumber || danCard?.id)) {
      const shareId = danCard.certificateNumber || danCard.id;
      const url = `${window.location.origin}/id-cards/dan/${encodeURIComponent(shareId)}`;
      navigator.clipboard.writeText(url);
      toast.success("Official Dan ID card verification link copied to clipboard!");
    }
  };

  const handleDanDownloadPDF = async () => {
    if (!danCard) return;
    await downloadDanIDCardPDF(danCard);
  };

  // Handlers for Championship ID Card
  const handleChampPrint = async () => {
    if (!champCard) return;
    await printChampionshipIdCard(champCard);
  };

  const handleChampShare = () => {
    if (typeof window !== "undefined" && (champCard?.id || champCard?.championshipApplicationId)) {
      const shareId = champCard.id || champCard.championshipApplicationId;
      const url = `${window.location.origin}/id-cards/championship/${encodeURIComponent(shareId)}`;
      navigator.clipboard.writeText(url);
      toast.success("Official Championship ID card verification link copied to clipboard!");
    }
  };

  const handleChampDownloadPDF = async () => {
    if (!champCard) return;
    await downloadChampionshipIdCardPDF(champCard);
  };

  // 1. Loading State
  if (authLoading || (memberLoading && danLoading && champLoading)) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-spin">
            <CreditCard className="size-6 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            Loading your official digital ID card credentials...
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
          title="My Official ID Card"
          description="Access, print, and download your authentic digital smart identity badge."
          image={IMAGES.ceremony}
        />
        <section className="section-pad">
          <div className="shell max-w-xl mx-auto text-center space-y-5">
            <div className="luxe-card p-10 sm:p-12 rounded-3xl border border-border/80 space-y-5">
              <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center mx-auto">
                <CreditCard className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Sign In to View Your ID Card</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Please log in to your registered athlete, coach, referee, or club account to view and download your verified federation digital ID card.
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
    const cardTitle = isDistrict ? "District Association ID Card" : "State Association ID Card";
    const cardDesc = isDistrict
      ? "District Association official smart digital ID card generation is currently in development and will be available soon."
      : "State Association official smart digital ID card generation is currently in development and will be available soon.";

    return (
      <SiteLayout>
        <PageHero
          eyebrow={portalEyebrow}
          title="My Official ID Card"
          description={`Identity credentials for ${user.name} (${user.id}).`}
          image={IMAGES.ceremony}
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
                <h2 className="text-2xl font-bold text-foreground">{cardTitle}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {cardDesc}
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

  const isMemberApproved = memberCard && (memberCard.status === "Active" || memberCard.status === "Approved");
  const isDanApproved = danCard && (danCard.isApproved || danCard.status === "Passed");
  const isChampApproved = champCard && (champCard.isApproved || champCard.status === "Active" || champCard.status === "Approved");

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Member Accreditation"
        title="My Official ID Cards"
        description={`Digital smart credential badges for ${user.name} (${user.id}).`}
        image={IMAGES.ceremony}
      />

      <section className="section-pad bg-background">
        <div className="shell max-w-5xl mx-auto space-y-8">
          {/* ========================================================================= */}
          {/* TOP CARD TYPE SWITCHER                                                    */}
          {/* ========================================================================= */}
          <div className="flex justify-center w-full">
            <div className="w-full sm:w-auto grid grid-cols-1 sm:flex p-1.5 rounded-2xl sm:rounded-full bg-card/90 border border-border/80 shadow-lg backdrop-blur-md gap-1.5">
              {/* Button 1: Member ID Card */}
              <button
                type="button"
                onClick={() => setActiveTab("member")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none",
                  activeTab === "member"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <CreditCard className="size-4 shrink-0" />
                <span>Member ID Card</span>
                {isMemberApproved && (
                  <span className="size-2 rounded-full bg-emerald-400 shrink-0" title="Active & Approved" />
                )}
              </button>

              {/* Button 2: Black Belt & Dan ID Card */}
              <button
                type="button"
                onClick={() => setActiveTab("dan")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none",
                  activeTab === "dan"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-extrabold shadow-gold shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Flame className="size-4 text-amber-500 shrink-0" />
                <span>Dan ID Card</span>
                {isDanApproved ? (
                  <span className="px-2 py-0.5 rounded-full bg-stone-950/80 text-amber-300 text-[10px] font-black border border-amber-400/40 shrink-0">
                    {danCard.danRank ? `${danCard.danRank} Dan` : "Passed"}
                  </span>
                ) : danCard ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                    Review
                  </span>
                ) : null}
              </button>

              {/* Button 3: Championship ID Card (Just after Dan ID Card) */}
              <button
                type="button"
                onClick={() => setActiveTab("championship")}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none",
                  activeTab === "championship"
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 font-extrabold shadow-gold shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Trophy className="size-4 text-amber-500 shrink-0" />
                <span>Championship ID Card</span>
                {isChampApproved ? (
                  <span className="px-2 py-0.5 rounded-full bg-stone-950/80 text-amber-300 text-[10px] font-black border border-amber-400/40 shrink-0">
                    {champCard.bibNumber || "Pass"}
                  </span>
                ) : champCard ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                    Review
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MEMBER ID CARD                                                     */}
          {/* ========================================================================= */}
          {activeTab === "member" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {isMemberApproved && memberCard ? (
                <>
                  {/* Top Action Bar */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card/80 border border-border/80 print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 grid place-items-center shrink-0">
                        <ShieldCheck className="size-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">Verified Digital ID Card</span>
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold">
                            {memberCard.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Valid through <strong className="text-foreground">{memberCard.validUntil}</strong> · Authorized by {memberCard.authorizedSignatory}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsMemberFlipped(!isMemberFlipped)}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <RotateCw className="size-3.5 text-primary" />
                        <span>{isMemberFlipped ? "Front Side" : "Flip Back"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleMemberShare}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Share2 className="size-3.5" /> Share
                      </button>
                      <button
                        type="button"
                        onClick={handleMemberPrint}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Printer className="size-3.5 text-primary" /> Print Card
                      </button>
                      <button
                        type="button"
                        onClick={handleMemberDownloadPDF}
                        className="col-span-2 sm:col-span-1 rounded-full bg-gold-gradient text-background px-4 sm:px-5 py-2.5 text-[11.5px] sm:text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Download className="size-3.5" /> Download PDF Badge
                      </button>
                    </div>
                  </div>

                  {/* 3D Interactive ID Card Container */}
                  <div className="flex justify-center py-4">
                    <PlayerIdCard
                      card={memberCard}
                      isFlipped={isMemberFlipped}
                      onFlipToggle={() => setIsMemberFlipped(!isMemberFlipped)}
                    />
                  </div>

                  {/* Credential Breakdown Details */}
                  <div className="luxe-card p-5 sm:p-8 rounded-3xl border border-border/80 space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Accredited Credential Particulars</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Member ID</span>
                        <p className="font-mono font-bold text-primary break-all sm:break-normal text-[11.5px] sm:text-xs">{memberCard.id}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Classification</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{formatMemberType(memberCard.cardType || (memberCard as any).memberType || (memberCard.id?.startsWith("WSF-CO") ? "Coach" : "Athlete"))}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Discipline / Sport</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{memberCard.discipline || "Kalawar Martial Arts"}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Rank / Grade</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{memberCard.beltRank || "1st Dan Black Belt"}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Academy / Club</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{memberCard.academyName || "Kalawar Academy"}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">State Association</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{memberCard.state}</p>
                      </div>
                      {memberCard.bloodGroup && memberCard.bloodGroup.trim().length > 0 && (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-400">Blood Group</span>
                          <p className="font-bold text-rose-400 text-[11.5px] sm:text-xs">{memberCard.bloodGroup}</p>
                        </div>
                      )}
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Valid Period</span>
                        <p className="font-bold text-foreground break-words text-[11px] sm:text-xs">{formatToDDMMYYYY(memberCard.issueDate)} to {formatToDDMMYYYY(memberCard.validUntil)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Member ID Card Not Approved State */
                <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-card via-amber-500/5 to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="size-16 sm:size-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center mx-auto shadow-gold/20 shadow-lg">
                    <Clock className="size-8 sm:size-10 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                      ⚠️ Status: Not Approved Yet
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Member ID Card Under Review
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      Your official federation digital ID card application for{" "}
                      <strong className="text-foreground">{user.name}</strong> (Member ID:{" "}
                      <span className="font-mono font-bold text-primary">{user.id}</span>) is currently under review by the Technical Committee &amp; Governing Secretariat.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/dashboard"
                      className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                    >
                      <Edit3 className="size-3.5" /> View / Complete My Profile
                    </Link>
                    <Link
                      href="/contact"
                      className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      Contact Secretariat Desk
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BLACK BELT & DAN ID CARD                                          */}
          {/* ========================================================================= */}
          {activeTab === "dan" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {isDanApproved && danCard ? (
                <>
                  {/* Top Action Bar */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card/80 border border-amber-500/40 shadow-gold/10 shadow-lg print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center shrink-0">
                        <Flame className="size-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">
                            Official Black Belt / {danCard.danRank ? `${danCard.danRank} Dan` : "Dan"} ID Card
                          </span>
                          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black">
                            {danCard.danRankTitle || "Black Belt Holder"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lifetime Federation Holder · Technical Committee Ratified
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsDanFlipped(!isDanFlipped)}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <RotateCw className="size-3.5 text-amber-400" />
                        <span>{isDanFlipped ? "Front Side" : "Flip Back"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDanShare}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Share2 className="size-3.5" /> Share
                      </button>
                      <Link
                        href={`/certificates/dan/${danCard.certificateNumber || danCard.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-amber-500/40 bg-stone-900 hover:bg-stone-800 text-stone-200 px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <FileText className="size-3.5 text-amber-400" /> Diploma
                      </Link>
                      <button
                        type="button"
                        onClick={handleDanPrint}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Printer className="size-3.5 text-amber-400" /> Print Card
                      </button>
                      <button
                        type="button"
                        onClick={handleDanDownloadPDF}
                        className="col-span-2 sm:col-span-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-4 sm:px-5 py-2.5 text-[11.5px] sm:text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Download className="size-3.5" /> Download ID PDF
                      </button>
                    </div>
                  </div>

                  {/* 3D Interactive Dan ID Card */}
                  <div className="flex justify-center py-4">
                    <DanIdCard
                      card={danCard}
                      isFlipped={isDanFlipped}
                      onFlipToggle={() => setIsDanFlipped(!isDanFlipped)}
                    />
                  </div>

                  {/* Dan Particulars Breakdown */}
                  <div className="luxe-card p-5 sm:p-8 rounded-3xl border border-amber-500/30 space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-400 shrink-0" />
                      <span>Black Belt Master Accreditation Particulars</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Athlete ID</span>
                        <p className="font-mono font-bold text-amber-400 break-all sm:break-normal text-[11.5px] sm:text-xs">{danCard.athleteId}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Dan Grade</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{danCard.danRankTitle}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Academy</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{danCard.academyName}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Certificate Ref</span>
                        <p className="font-mono font-bold text-foreground break-all sm:break-normal text-[11px] sm:text-xs">{danCard.certificateNumber}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : danCard ? (
                /* Case 2B: Dan Application In Progress / Under Review */
                <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-card via-amber-500/5 to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="size-16 sm:size-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center mx-auto shadow-gold/20 shadow-lg">
                    <Clock className="size-8 sm:size-10 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                      ⚠️ Status: {danCard.status || "Under Review"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Dan Examination Application In Progress
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      Your Black Belt / Dan Grading application for{" "}
                      <strong className="text-foreground">{danCard.candidateName}</strong> ({danCard.appliedDanTitle || "Dan Candidate"}) is currently being reviewed and scheduled by the National Technical Committee.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/dan-grading?tab=tracker"
                      className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                    >
                      <Sparkles className="size-3.5" /> Track Dan Application Status
                    </Link>
                    <Link
                      href="/contact"
                      className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      Contact Technical Committee
                    </Link>
                  </div>
                </div>
              ) : (
                /* Case 2C: No Dan Application on Record */
                <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="size-16 sm:size-20 rounded-3xl bg-primary/10 border border-primary/30 text-primary grid place-items-center mx-auto">
                    <Award className="size-8 sm:size-10" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                      🥋 National Black Belt Accreditation
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Advance to Black Belt / Dan Grade
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      No Black Belt or Dan accreditation card is currently registered for your account. Register for the official 1st to 10th Dan syllabus, thesis ratification, and national examination session to earn your Black Belt Smart ID Card.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/dan-grading"
                      className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                    >
                      <Sparkles className="size-3.5" /> Register for Dan Grading
                    </Link>
                    <Link
                      href="/dan-grading?tab=syllabus"
                      className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      View Dan Syllabus &amp; Requirements
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CHAMPIONSHIP ID CARD (Competitor Accreditation Pass)                */}
          {/* ========================================================================= */}
          {activeTab === "championship" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {isChampApproved && champCard ? (
                <>
                  {/* Top Action Bar */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card/80 border border-amber-500/40 shadow-gold/10 shadow-lg print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center shrink-0">
                        <Trophy className="size-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">
                            Official Competitor Accreditation Pass
                          </span>
                          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black font-mono">
                            {champCard.bibNumber || "BIB-ASSIGNED"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {champCard.eventTitle || "National Championship"} · Tier: <strong className="text-foreground">{champCard.tournamentTier || champCard.level || "District"}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsChampFlipped(!isChampFlipped)}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <RotateCw className="size-3.5 text-amber-400" />
                        <span>{isChampFlipped ? "Front Side" : "Flip Back"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleChampShare}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Share2 className="size-3.5" /> Share
                      </button>
                      <Link
                        href={`/id-cards/championship/${champCard.id || champCard.championshipApplicationId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-amber-500/40 bg-stone-900 hover:bg-stone-800 text-stone-200 px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <ExternalLink className="size-3.5 text-amber-400" /> Public Pass
                      </Link>
                      <button
                        type="button"
                        onClick={handleChampPrint}
                        className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Printer className="size-3.5 text-amber-400" /> Print Pass
                      </button>
                      <button
                        type="button"
                        onClick={handleChampDownloadPDF}
                        className="col-span-2 sm:col-span-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-4 sm:px-5 py-2.5 text-[11.5px] sm:text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Download className="size-3.5" /> Download Pass PDF
                      </button>
                    </div>
                  </div>

                  {/* 3D Interactive Championship ID Card */}
                  <div className="flex justify-center py-4">
                    <ChampionshipIdCard
                      card={champCard}
                      isFlipped={isChampFlipped}
                      onFlipToggle={() => setIsChampFlipped(!isChampFlipped)}
                    />
                  </div>

                  {/* Championship Particulars Breakdown */}
                  <div className="luxe-card p-5 sm:p-8 rounded-3xl border border-amber-500/30 space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-400 shrink-0" />
                      <span>Competitor Accreditation &amp; Match Particulars</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Competitor Bib</span>
                        <p className="font-mono font-black text-amber-400 break-all text-[11.5px] sm:text-xs">{champCard.bibNumber || "BIB-ASSIGNED"}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Discipline &amp; Belt</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{(champCard.discipline || "Kalawar Martial Arts")} · {champCard.beltRank}</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Division / Weight</span>
                        <p className="font-bold text-foreground break-words text-[11.5px] sm:text-xs">{champCard.ageDivision || "Open"} ({champCard.weightCategory || "Open"})</p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Tournament Event</span>
                        <p className="font-semibold text-foreground break-words text-[11.5px] sm:text-xs">{champCard.eventTitle}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : champCard ? (
                /* Case 3B: Championship Application In Progress / Under Review */
                <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-card via-amber-500/5 to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="size-16 sm:size-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 grid place-items-center mx-auto shadow-gold/20 shadow-lg">
                    <Clock className="size-8 sm:size-10 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                      ⚠️ Status: {champCard.status || "Under Review"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Championship Registration Under Review
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      Your entry registration for{" "}
                      <strong className="text-foreground">{champCard.eventTitle || "Championship"}</strong> is being verified by the Tournament Organizing Committee. Your official Competitor ID Card and Bib Number will be issued upon approval.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/championship"
                      className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                    >
                      <Trophy className="size-3.5" /> View Championship Details
                    </Link>
                    <Link
                      href="/contact"
                      className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      Contact Tournament Desk
                    </Link>
                  </div>
                </div>
              ) : (
                /* Case 3C: No Championship Registration on Record */
                <div className="luxe-card p-8 sm:p-12 rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-card text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="size-16 sm:size-20 rounded-3xl bg-primary/10 border border-primary/30 text-primary grid place-items-center mx-auto">
                    <Trophy className="size-8 sm:size-10 text-amber-400" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                      🏆 National Championship Accreditation
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      Compete in Official Championships
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      No active championship registration was found for your account. Register for upcoming district, state, national, or international trials to receive your official Competitor Accreditation Pass &amp; Bib number.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/championship"
                      className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                    >
                      <Trophy className="size-3.5" /> Browse Championships &amp; Register
                    </Link>
                    <Link
                      href="/events"
                      className="border border-border/80 hover:border-primary rounded-full px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      View Tournament Calendar
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
