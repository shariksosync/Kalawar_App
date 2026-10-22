"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Download,
  GraduationCap,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/data/people";
import { CoachCertificateView } from "@/components/certificates/CoachCertificateView";
import {
  downloadCoachCertificatePDF,
  printCoachCertificate,
} from "@/lib/certificate-pdf";

export default function CoachCertificatePage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = decodeURIComponent(rawId || "");

  const [coach, setCoach] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoach() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/coaches/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && (data.coach || data.player)) {
          setCoach(data.coach || data.player);
        } else {
          // Fallback: try players endpoint
          const pRes = await fetch(`/api/players/${encodeURIComponent(id)}`);
          const pData = await pRes.json();
          if (pData.success && pData.player) {
            setCoach(pData.player);
          }
        }
      } catch (err) {
        console.error("Failed to load coach certificate data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCoach();
  }, [id]);

  const handlePrint = () => {
    if (coach) {
      printCoachCertificate(coach);
    }
  };

  const handleDownload = () => {
    if (coach) {
      downloadCoachCertificatePDF(coach);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Coach Certificate verification link copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-xs text-stone-400 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p>Loading official coach certificate &amp; accreditation credential...</p>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-stone-300 space-y-4">
        <GraduationCap className="w-12 h-12 text-stone-600" />
        <h2 className="text-xl font-bold text-white">Coach Certificate Not Found</h2>
        <p className="text-xs text-stone-400 max-w-md">
          No registered coaching accreditation record was found for ID “{id}”.
        </p>
        <Link
          href="/certificates"
          className="px-4 py-2 rounded-xl bg-gold-gradient text-stone-950 text-xs font-bold"
        >
          Return to Certificate Verification
        </Link>
      </div>
    );
  }

  const coachLevel = (coach.qualification || coach.level || "").toString();
  if (
    coachLevel === "Level 0" ||
    coachLevel === "Level 0 - Trainee Coach" ||
    coachLevel.toLowerCase().includes("level 0") ||
    coachLevel.toLowerCase().includes("trainee coach")
  ) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-stone-300 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">No Certificate Issued for Level 0 (Trainee Coach)</h2>
        <p className="text-xs text-stone-400 max-w-md leading-relaxed">
          Coach <strong className="text-white">{coach.name}</strong> ({coach.id}) is accredited as <span className="text-amber-400 font-bold">Level 0 – Trainee Coach</span>. Official federation diplomas and certificates are issued starting from <strong className="text-white">Level 1 (State Certified)</strong> and above.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-gold-gradient text-stone-950 text-xs font-bold shadow-gold"
          >
            Return to Registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-900 py-6 sm:py-10 px-3 sm:px-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* Top Action Header (Hidden in Print) */}
      <div className="w-full max-w-4xl mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Certificate Verification</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy Verification Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-stone-800 border border-amber-500/40 text-amber-300 hover:bg-stone-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gold-gradient text-stone-950 shadow-gold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Visual Canvas */}
      <div className="w-full max-w-3xl flex justify-center">
        <CoachCertificateView coach={coach} />
      </div>
    </div>
  );
}
