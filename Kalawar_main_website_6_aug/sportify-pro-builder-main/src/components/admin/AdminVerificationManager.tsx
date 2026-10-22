"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  QrCode,
  Award,
  Trophy,
  GraduationCap,
  Landmark,
  UserCheck,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { UnifiedVerificationResult } from "@/app/api/search/verify/route";
import { generateVerificationSlipPdf } from "@/lib/verification-slip-pdf";
import QRCode from "react-qr-code";

export function AdminVerificationManager() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UnifiedVerificationResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // QR Test generator tool state
  const [testQrText, setTestQrText] = useState("KSM-PL-2026-7251");

  const runVerificationSearch = useCallback(async (qStr: string, catStr: string, statStr: string) => {
    if (!qStr.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search/verify?q=${encodeURIComponent(qStr.trim())}&category=${catStr}&status=${statStr}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
        toast.error(data.error || "Failed to search records.");
      }
    } catch (err) {
      console.error("Admin verification search error:", err);
      toast.error("Network error during verification query.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerificationSearch(query, category, statusFilter);
  };

  const handleDownloadPdf = async (item: UnifiedVerificationResult) => {
    try {
      setDownloadingPdf(item.id);
      await generateVerificationSlipPdf(item);
      toast.success("Verification confirmation slip downloaded", {
        description: `${item.title} (${item.recordNumber})`,
      });
    } catch (err) {
      console.error("Admin slip download error:", err);
      toast.error("Could not generate verification slip.");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleCopyLink = (item: UnifiedVerificationResult) => {
    const url = `${window.location.origin}/verify?q=${encodeURIComponent(item.recordNumber)}`;
    navigator.clipboard.writeText(url);
    toast.success("Public verification URL copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider shadow-gold">
            <ShieldCheck className="size-3.5" /> Central Verification &amp; Audit Console
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">
            Cross-Domain Verification Hub
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Inspect and test live cryptographic verification across all federation domains (ID Cards, Certificates, Dan Diplomas, Belt Exams, Rankings, and Events).
          </p>
        </div>

        {/*
        <Link
          href="/verify"
          target="_blank"
          className="shrink-0 px-5 py-2.5 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <ExternalLink className="size-4" /> Open Public Portal
        </Link>
        */}
      </div>

      {/* Live Admin Search Box */}
      <div className="p-6 rounded-3xl border border-border/70 bg-card/40 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Search className="size-4" /> Query Database Registry
          </div>
          {searched && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setSearched(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Clear Results
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID (KSM-PL-...), Cert No, Roll No, Candidate Name, or Academy..."
              className="w-full h-11 px-4 rounded-2xl bg-card/80 border border-border/80 focus:outline-none focus:border-primary text-sm font-medium text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-card/80 border border-border/80 focus:outline-none focus:border-primary text-xs font-medium text-foreground"
            >
              <option value="all">All Domains</option>
              <option value="id_cards">ID Cards (Players/Coaches/Officials)</option>
              <option value="certificates">Certificates</option>
              <option value="dan_diplomas">Black Belt &amp; Dan Diplomas</option>
              <option value="belt_exams">Belt Exam Candidates</option>
              <option value="rankings">Official Rankings</option>
              <option value="tournaments">Tournaments</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full h-11 rounded-2xl bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" /> Querying...
                </>
              ) : (
                <>
                  <Search className="size-4" /> Test Verify
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Test Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span>Quick Test Records:</span>
          {["Aarav Mehra", "KSM-PL-2026-7251", "KALAWAR-CERT-2026-3001", "CAND-2026-001", "RNK-2026-001"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                runVerificationSearch(item, category, statusFilter);
              }}
              className="px-2.5 py-0.5 rounded-full bg-accent/30 border border-border/70 hover:border-primary/60 text-foreground transition-colors text-[11px]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Registry Match Results ({results.length} record{results.length > 1 ? "s" : ""} found)
            </div>
          </div>

          {results.length === 0 ? (
            <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
              <XCircle className="size-8 text-destructive mx-auto" />
              <div className="text-sm font-bold text-foreground">No Matching Record Located</div>
              <p className="text-xs text-muted-foreground">
                No active or archived record matched query “{query}” in the requested category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((r) => {
                const isGood = r.status === "Active" || r.status === "Valid";
                return (
                  <div
                    key={`${r.domain}_${r.id}`}
                    className="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-4 hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold uppercase">
                          {r.domainLabel}
                        </span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          {r.recordNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                            isGood
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Hash: {r.securityHash}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div>
                        <div className="text-[11px] text-muted-foreground">Holder / Entity</div>
                        <div className="text-sm font-bold text-foreground">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground">Affiliation &amp; State</div>
                        <div className="text-xs font-semibold text-foreground">
                          {r.details["Academy / Club"] || r.details["Club / Dojo"] || r.state || "National Federation Unit"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.discipline || r.rankOrBelt || "Official Registered"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 self-center">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(r)}
                          disabled={downloadingPdf === r.id}
                          className="px-3 py-1.5 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all flex items-center gap-1.5"
                        >
                          <Download className="size-3" /> PDF Slip
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(r)}
                          className="p-1.5 rounded-full border border-border/70 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          title="Copy verification link"
                        >
                          <Copy className="size-3.5" />
                        </button>

                        <Link
                          href={r.deepLinkUrl}
                          className="px-3 py-1.5 rounded-full border border-primary/40 hover:bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                        >
                          <Eye className="size-3" /> Inspect
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QR Code Testing Studio */}
      <div className="p-6 md:p-8 rounded-3xl border border-border/70 bg-card/40 space-y-6 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <QrCode className="size-4" /> QR Code Testing &amp; Preview Studio
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Live QR Code Preview &amp; Deep-Link Verifier
          </h3>
          <p className="text-xs text-muted-foreground">
            Test any identifier or scan string to verify QR Code resolution before physical print production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Identifier / Record String
            </label>
            <input
              type="text"
              value={testQrText}
              onChange={(e) => setTestQrText(e.target.value)}
              placeholder="Enter record ID (e.g. KSM-PL-2026-7251)"
              className="w-full h-11 px-4 rounded-2xl bg-card border border-border/80 focus:outline-none focus:border-primary text-sm font-medium text-foreground"
            />

            <div className="p-3 rounded-2xl bg-accent/20 border border-border/60 text-xs text-muted-foreground space-y-1">
              <div className="font-bold text-foreground">Target Verification Endpoint:</div>
              <code className="text-primary break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/verify?q=${encodeURIComponent(testQrText.trim())}` : `/verify?q=${encodeURIComponent(testQrText.trim())}`}
              </code>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuery(testQrText);
                  runVerificationSearch(testQrText, "all", "all");
                }}
                className="px-4 py-2 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all"
              >
                Test Verification Match
              </button>

              <Link
                href={`/verify?q=${encodeURIComponent(testQrText.trim())}`}
                target="_blank"
                className="px-4 py-2 rounded-full border border-border/70 hover:bg-accent/40 text-foreground font-semibold text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="size-3.5" /> Open Public Link
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 border border-border/80 text-center space-y-2 shadow-sm">
            <QRCode
              value={typeof window !== "undefined" ? `${window.location.origin}/verify?q=${encodeURIComponent(testQrText.trim())}` : testQrText}
              size={120}
              level="M"
            />
            <div className="text-[10px] font-mono font-bold text-slate-700 truncate max-w-full">
              {testQrText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
