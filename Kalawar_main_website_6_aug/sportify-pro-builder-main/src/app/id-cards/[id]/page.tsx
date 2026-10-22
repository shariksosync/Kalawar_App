"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Award,
  QrCode,
  Download,
  Printer,
  Share2,
  ArrowLeft,
  RotateCw,
  Phone,
  Droplet,
  User,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  ExternalLink,
  Flame,
  Scale,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import type { IdCardEntry } from "@/lib/id-cards-store";
import { downloadIdCardPDF, printIdCard } from "@/lib/id-card-pdf-download";
import { PlayerIdCard } from "@/components/cards/PlayerIdCard";

export default function SingleIdCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [card, setCard] = useState<IdCardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/id-cards/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.card) {
          setCard(data.card);
        }
      } catch (err) {
        console.error("Failed to load ID card:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [id]);

  const handlePrint = async () => {
    if (!card) return;
    await printIdCard(card);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Official ID card verification link copied to clipboard!");
    }
  };

  const handleDownloadPDF = async () => {
    if (!card) return;
    await downloadIdCardPDF(card);
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-spin">
            <CreditCard className="size-6 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground font-semibold">Loading Official Digital ID Card...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!card) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="size-14 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">ID Card Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested ID card credential "{id}" could not be located in the official federation registry.
          </p>
          <Link
            href="/id-cards"
            className="btn-luxe px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" /> Back to ID Cards Hub
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const isActive = card.status === "Active" || card.status === "Approved";
  const isSuspended = card.status === "Suspended";
  const isExpired = card.status === "Expired";
  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/id-cards/${encodeURIComponent(card.id)}`
      : `https://kalawar.org/id-cards/${encodeURIComponent(card.id)}`;

  return (
    <SiteLayout>
      {/* Top Breadcrumb & Action Bar */}
      <section className="pt-28 sm:pt-32 pb-4 border-b border-border/40 bg-card/40 print:hidden">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/id-cards" className="hover:text-primary transition-colors">ID Cards</Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-xs">{card.holderName} ({card.id})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none rounded-full border border-border/80 bg-background/80 hover:bg-card px-3.5 py-2 text-[11.5px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <Share2 className="size-3.5" /> Share
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none rounded-full border border-border/80 bg-background/80 hover:bg-card px-3.5 py-2 text-[11.5px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <Printer className="size-3.5 text-primary" /> Print ID Card
            </button>
            {isActive && (
              <button
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto rounded-full bg-gold-gradient text-background px-4 py-2 text-[11.5px] sm:text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Download className="size-3.5" /> Download PDF Badge
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Card Showcase & Verification Body */}
      <section className="section-pad bg-background">
        <div className="shell max-w-5xl mx-auto space-y-8">
          {/* Verification Status Banner */}
          <div
            className={cn(
              "p-5 rounded-3xl border-2 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl print:hidden",
              isActive
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : isSuspended
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                : isExpired
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-amber-500/10 border-amber-500/40 text-amber-300"
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "size-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isSuspended
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-amber-500/20 text-amber-400"
                )}
              >
                {isActive ? <ShieldCheck className="size-6" /> : <AlertCircle className="size-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide">
                    {isActive
                      ? "✅ Official Verified Credential"
                      : isSuspended
                      ? "🚫 Credential Suspended"
                      : isExpired
                      ? "⛔ Credential Expired"
                      : card.status === "Rejected"
                      ? "❌ Application Rejected"
                      : "⚠️ Awaiting Admin ID Card Approval"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-background/50 text-[10px] font-mono font-bold">
                    {card.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isActive
                    ? `Authenticated against KALAWAR National Central Database registry. Valid from ${formatToDDMMYYYY(card.issueDate)} to ${formatToDDMMYYYY(card.validUntil)}.`
                    : card.status === "Rejected"
                    ? "This ID card request was rejected by the Technical Committee. Please contact administration."
                    : "This account has been registered, but the official ID card is pending Technical Committee approval before issuance."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-card hover:bg-accent/60 border border-border/80 text-foreground font-bold text-xs px-4 py-2.5 rounded-2xl inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md transition-all"
            >
              <RotateCw className="size-4 text-primary" />
              <span>{isFlipped ? "Show Front Side" : "Flip to Back Side"}</span>
            </button>
          </div>

          {/* 3D ID CARD CONTAINER */}
          <div className="flex justify-center">
            <PlayerIdCard
              card={card}
              isFlipped={isFlipped}
              onFlipToggle={() => setIsFlipped(!isFlipped)}
            />
          </div>

          <p className="text-center text-xs text-muted-foreground italic print:hidden">
            💡 Click on the digital ID card above or press "Flip" to toggle between Front &amp; Back views.
          </p>

          {/* Audit History & Credential Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Left: Card Specifications */}
            <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-primary font-black uppercase text-xs">
                <CreditCard className="size-4" /> Credential Specification
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-accent/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">KALAWAR ID</span>
                  <p className="font-mono font-bold text-foreground">{card.id}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">Card Category</span>
                  <p className="font-bold text-primary">{card.cardType} ID</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">Issued Date</span>
                  <p className="font-bold text-foreground">{formatToDDMMYYYY(card.issueDate)}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">Expiry / Renewal</span>
                  <p className="font-bold text-emerald-400">{formatToDDMMYYYY(card.validUntil)}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/20 border border-border/50 col-span-2">
                  <span className="text-[10px] text-muted-foreground">Affiliated Academy</span>
                  <p className="font-bold text-foreground">{card.academyName}</p>
                </div>
              </div>
            </div>

            {/* Right: Verification & Audit Timeline */}
            <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-primary font-black uppercase text-xs">
                <ShieldCheck className="size-4 text-emerald-400" /> Verification &amp; Audit Log
              </div>

              <div className="space-y-3">
                {card.history && card.history.length > 0 ? (
                  card.history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-accent/20 border border-border/50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">{h.action}</p>
                        {h.notes && <p className="text-[11px] text-muted-foreground">{h.notes}</p>}
                        <span className="text-[10px] text-primary font-semibold">By: {h.by}</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{h.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No historical changes recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
