"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Award,
  Printer,
  Download,
  Share2,
  ArrowLeft,
  FileText,
  CreditCard,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { DanIdCard } from "@/components/cards/DanIdCard";
import { downloadDanIDCardPDF, printDanIDCard } from "@/lib/dan-pdf-download";

export default function DanIdCardPage({
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
        const res = await fetch(`/api/id-cards/dan/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.card) {
          setCard(data.card);
        }
      } catch (err) {
        console.error("Failed to load Dan ID card:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [id]);

  const handlePrint = async () => {
    if (!card) return;
    await printDanIDCard(card);
  };

  const handleDownloadCardPDF = async () => {
    if (!card) return;
    await downloadDanIDCardPDF(card);
  };

  const handleShare = () => {
    if (typeof window !== "undefined" && (card?.id || card?.certificateNumber)) {
      const shareId = card.certificateNumber || card.id;
      const url = `${window.location.origin}/id-cards/dan/${encodeURIComponent(shareId)}`;
      navigator.clipboard.writeText(url);
      toast.success("Official Dan ID card verification link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Loading Black Belt / Dan ID Card...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!card) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Award className="w-16 h-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Dan ID Card Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The black belt ID card credential "{id}" could not be located.
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

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#090a0d] text-stone-100 pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
            <Link
              href="/dan-grading"
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dan Grading Portal
            </Link>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-400 transition cursor-pointer text-center"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFlipped ? "Front Side" : "Flip Back"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-400 transition cursor-pointer text-center"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>

              <Link
                href={`/certificates/dan/${card.certificateNumber || card.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-400 transition text-center"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Diploma
              </Link>

              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-800 border border-stone-700 text-white hover:bg-stone-700 transition cursor-pointer text-center"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Card
              </button>

              <button
                onClick={handleDownloadCardPDF}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5" /> Download ID PDF
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-wide">
              Official Black Belt / Dan Identity Card
            </h1>
            <p className="text-xs text-stone-400">
              Federation High-Rank Accreditation Card ({card.danRankTitle || "Black Belt Holder"})
            </p>
          </div>

          {/* 3D Flippable Dan ID Card */}
          <div className="flex justify-center py-4">
            <DanIdCard
              card={card}
              isFlipped={isFlipped}
              onFlipToggle={() => setIsFlipped(!isFlipped)}
            />
          </div>

          {/* Action Bar Below ID Card */}
          <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl print:hidden">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center justify-center sm:justify-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Smart Black Belt / Dan Wallet ID Card
              </h4>
              <p className="text-xs text-stone-400">
                Official accreditation badge printable in standard CR80 wallet format.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDownloadCardPDF}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Wallet ID Card PDF
              </button>
              <Link
                href={`/certificates/dan/${card.certificateNumber || card.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-200 hover:text-amber-400 hover:border-amber-500/50 transition flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-400" /> View Diploma Certificate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
