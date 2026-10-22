"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Award,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
  Loader2,
  RefreshCw,
  QrCode,
  GraduationCap,
  Scale,
  Trophy,
  Layers,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import type { UnifiedVerificationResult } from "@/app/api/search/verify/route";

function UniversalVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || searchParams.get("verify") || searchParams.get("id") || "";

  const [query, setQuery] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState("all");
  const [results, setResults] = useState<UnifiedVerificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (searchTerm: string, category: string) => {
    if (!searchTerm.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      const params = new URLSearchParams();
      params.set("q", searchTerm.trim());
      if (category !== "all") {
        params.set("category", category);
      }

      const res = await fetch(`/api/search/verify?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
        if (data.error) setError(data.error);
      }
    } catch (err: any) {
      console.error("Verification search error:", err);
      setError("Failed to query verification registry. Please try again.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ.trim()) {
      setQuery(initialQ.trim());
      performSearch(initialQ.trim(), activeCategory);
    }
  }, [initialQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, activeCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (query.trim()) {
      performSearch(query, cat);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-stone-100 pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> KALAWAR National Ledger
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            Universal Credential <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Verification</span>
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
            Instantly authenticate and verify official Digital ID Cards, Black Belt Diplomas, Belt Grading Records, Referee Licenses, and Championship Certificates on any device.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#0e1017] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Certificate No., KALAWAR ID, Athlete Name, or QR Code text..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <span>Verify Record</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-none">
            {[
              { id: "all", label: "All Credentials" },
              { id: "id_cards", label: "ID Cards & Badges" },
              { id: "certificates", label: "Certificates" },
              { id: "dan_diplomas", label: "Dan Diplomas" },
              { id: "belt_exams", label: "Belt Exams" },
              { id: "rankings", label: "National Rankings" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  activeCategory === cat.id
                    ? "bg-amber-500 text-stone-950 shadow-sm"
                    : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Results Section */}
        {isLoading && (
          <div className="p-12 text-center space-y-3 bg-[#0e1017] rounded-3xl border border-stone-800">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-stone-400">Verifying credential signatures against federation database...</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="p-10 text-center space-y-4 bg-[#0e1017] rounded-3xl border border-stone-800 max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-500/80 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Matching Federation Record Found</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              We could not locate an official registered credential matching &quot;{query}&quot;. Please verify the exact ID number or scan the QR code directly.
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>Found <strong>{results.length}</strong> official verified record(s)</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Cryptographically Verified
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-5 sm:p-6 rounded-3xl bg-[#0e1017] border border-amber-500/30 hover:border-amber-500/70 transition-all shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                          {item.domain === "certificate" || item.domain === "dan" ? (
                            <Award className="w-7 h-7" />
                          ) : (
                            <CreditCard className="w-7 h-7" />
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {item.domainLabel}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ✓ {item.status}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white uppercase">{item.title}</h3>
                        <p className="text-xs text-stone-400">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        href={item.deepLinkUrl}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 text-center"
                      >
                        <span>View Official Document</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Metadata key-value grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                    {Object.entries(item.details).slice(0, 4).map(([key, val]) => (
                      <div key={key} className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800 space-y-0.5">
                        <span className="text-[10px] text-stone-500 uppercase font-semibold">{key}</span>
                        <p className="font-bold text-stone-200 truncate">{String(val || "—")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UniversalVerifyPage() {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
            <p className="text-xs text-stone-400">Loading Universal Verification Portal...</p>
          </div>
        }
      >
        <UniversalVerifyContent />
      </Suspense>
    </SiteLayout>
  );
}
