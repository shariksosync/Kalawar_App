"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Search,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Building2,
  Scale,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
  QrCode,
  Trophy,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";

function IdCardsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Auto-redirect if query parameter is present in URL (e.g. from QR scan)
  useEffect(() => {
    const cardParam =
      searchParams.get("id") ||
      searchParams.get("card") ||
      searchParams.get("number") ||
      searchParams.get("verify") ||
      searchParams.get("q");

    if (cardParam && cardParam.trim()) {
      const cleanId = cardParam.trim();
      router.replace(`/id-cards/${encodeURIComponent(cleanId)}`);
    }
  }, [searchParams, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const cleanId = searchQuery.trim();
    router.push(`/id-cards/${encodeURIComponent(cleanId)}`);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-stone-100 pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Official Federation ID Registry
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            Digital ID Card <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Verification</span>
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
            Instant digital identity and license authentication for Athletes, Coaches, Referees, Clubs, and Championship Competitors across India.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-[#0e1017] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <label htmlFor="card-search" className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              Enter KALAWAR ID / License No. / Athlete ID
            </label>
            <div className="relative flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="card-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. KSM-PL-2026-7251, KSM-CO-..., KSM-RF-..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <span>Verify ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              💡 Tip: Scanning the QR code on any printed badge or digital card instantly displays the official verified record.
            </p>
          </form>
        </div>

        {/* Identity Portals */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300 text-center">
            ID Card Categories &amp; Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Athlete ID Cards</h4>
              <p className="text-stone-400 text-xs">National Registry Athlete ID, Rank Status &amp; Competition Eligibility</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Black Belt / Dan ID</h4>
              <p className="text-stone-400 text-xs">Master CR80 Wallet Card for Dan Graded Martial Artists</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Championship Passes</h4>
              <p className="text-stone-400 text-xs">Accredited Competitor Passes with Assigned Arena Bib Numbers</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Referee &amp; Official ID</h4>
              <p className="text-stone-400 text-xs">Technical Official License &amp; Adjudication Accreditation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IdCardsHubPage() {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
            <p className="text-xs text-stone-400">Loading ID Card Verification Portal...</p>
          </div>
        }
      >
        <IdCardsHubContent />
      </Suspense>
    </SiteLayout>
  );
}
