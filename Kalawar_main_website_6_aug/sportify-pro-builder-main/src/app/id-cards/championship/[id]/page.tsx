"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Trophy,
  Printer,
  Download,
  Share2,
  ArrowLeft,
  CreditCard,
  RotateCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ChampionshipIdCard } from "@/components/cards/ChampionshipIdCard";
import { downloadChampionshipIdCardPDF, printChampionshipIdCard } from "@/lib/championship-id-card-pdf";

export default function ChampionshipIdCardPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/id-cards/championship/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.card) {
          setCard(data.card);
        }
      } catch (err) {
        console.error("Failed to load Championship ID card:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [id]);

  const handlePrint = async () => {
    if (!card) return;
    await printChampionshipIdCard(card);
  };

  const handleDownloadPDF = async () => {
    if (!card) return;
    await downloadChampionshipIdCardPDF(card);
  };

  const handleShare = () => {
    if (typeof window !== "undefined" && (card?.id || card?.bibNumber)) {
      const shareId = card.id || id;
      const url = `${window.location.origin}/id-cards/championship/${encodeURIComponent(shareId)}`;
      navigator.clipboard.writeText(url);
      toast.success("Official Championship ID Card link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4 pt-24">
          <div className="size-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400 font-semibold">Loading Championship ID Card accreditation...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!card) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4 pt-28 sm:pt-36">
          <Trophy className="size-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Championship Pass Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The championship credential "{id}" could not be located in the national registry.
          </p>
          <Link
            href="/id-cards"
            className="bg-gold-gradient text-background px-6 py-2.5 rounded-xl text-xs font-bold shadow-gold"
          >
            ← Return to ID Cards
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-stone-950 text-stone-100 pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
            <div>
              <Link
                href="/id-cards"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold mb-2"
              >
                <ArrowLeft className="size-3.5" /> Back to ID Cards
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <Trophy className="size-7 text-amber-400" />
                <span>Championship Competitor Pass</span>
              </h1>
              <p className="text-xs text-stone-400">
                Official verified accreditation pass for {card.eventTitle || "Championship"}.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-[11.5px] sm:text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all text-center"
              >
                <RotateCw className="size-3.5 text-amber-400" />
                <span>{isFlipped ? "Front Side" : "Flip Back"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-[11.5px] sm:text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all text-center"
              >
                <Printer className="size-3.5 text-sky-400" />
                <span>Print Pass</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-[11.5px] sm:text-xs font-semibold text-center"
                title="Share Verification Link"
              >
                <Share2 className="size-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-[11.5px] sm:text-xs font-extrabold shadow-gold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110 text-center"
              >
                <Download className="size-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-900/80 border border-amber-500/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Accredited Competitor Pass</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Official Active
                  </span>
                </p>
                <p className="text-[11px] text-stone-400 font-mono">
                  Assigned {card.bibNumber || "BIB Number"} · Tier: {card.tournamentTier || card.level || "District"}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-amber-400">
              {card.championshipApplicationId || card.id}
            </span>
          </div>

          {/* Card Presentation Section */}
          <div className="flex justify-center py-6">
            <ChampionshipIdCard
              card={card}
              isFlipped={isFlipped}
              onFlipToggle={() => setIsFlipped((prev) => !prev)}
              showFlipButton={true}
            />
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
