"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Download,
  Printer,
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
  Search,
  Layers,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { cn, formatToDDMMYYYY, formatMemberType } from "@/lib/utils";
import type { RegistrationReceiptItem, ReceiptCategory, ReceiptsStatsSummary } from "@/types/receipt";
import { downloadRegistrationReceiptPDF, printRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { downloadBeltRegistrationSlipPDF, printBeltRegistrationSlipPDF } from "@/lib/belt-pdf-download";
import { downloadDanPaymentSlipPDF, printDanPaymentSlipPDF } from "@/lib/dan-payment-slip";
import { downloadChampionshipRegistrationReceiptPDF, printChampionshipRegistrationReceiptPDF } from "@/lib/championship-pdf";
import { downloadRefereeReceiptPDF, printRefereeRegistrationSlip } from "@/lib/referee-license-pdf";
import { RegistrationReceiptModal } from "@/components/receipts/RegistrationReceiptModal";
import { IMAGES } from "@/data/images";

export default function MyReceiptsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  const [receipts, setReceipts] = useState<RegistrationReceiptItem[]>([]);
  const [stats, setStats] = useState<ReceiptsStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<ReceiptCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  
  // Selected Receipt for Modal
  const [selectedReceipt, setSelectedReceipt] = useState<RegistrationReceiptItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadReceipts = async () => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (user.id) params.set("userId", user.id);
      if (user.email) params.set("email", user.email);

      const res = await fetch(`/api/receipts?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.receipts)) {
          setReceipts(data.receipts);
          setStats(data.stats || null);
          return;
        }
      }
      setReceipts([]);
    } catch (err) {
      console.error("Failed to load registration receipts:", err);
      toast.error("Failed to load your receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadReceipts();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenReceipt = (receipt: RegistrationReceiptItem) => {
    setSelectedReceipt(receipt);
    setModalOpen(true);
  };

  const handleDownloadPDF = async (receipt: RegistrationReceiptItem) => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, settings.federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await downloadBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await downloadDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await downloadChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await downloadRefereeReceiptPDF(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, settings.federationName);
      } else {
        toast.info("Generating registration slip PDF...");
      }
    } catch (err) {
      console.error("Failed to download slip PDF:", err);
      toast.error("Failed to generate PDF slip");
    }
  };

  const handlePrintSlip = async (receipt: RegistrationReceiptItem) => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, settings.federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await printBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await printDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await printChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await printRefereeRegistrationSlip(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, settings.federationName);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Failed to print slip:", err);
      toast.error("Failed to trigger print");
    }
  };

  // Category counts computed from full user receipts dataset
  const categoryCounts = useMemo(() => {
    const all = receipts.length;
    const member_registration = receipts.filter((r) => r.category === "member_registration").length;
    const belt_exam = receipts.filter((r) => r.category === "belt_exam").length;
    const black_belt_dan = receipts.filter((r) => r.category === "black_belt_dan").length;
    const championship = receipts.filter((r) => r.category === "championship").length;
    const referee = receipts.filter((r) => r.category === "referee").length;
    return { all, member_registration, belt_exam, black_belt_dan, championship, referee };
  }, [receipts]);

  // Filtered and sorted receipts
  const filteredReceipts = useMemo(() => {
    let list = [...receipts];

    // Category Filter
    if (activeCategory !== "all") {
      list = list.filter((r) => r.category === activeCategory);
    }

    // Status Filter
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Year Filter
    if (yearFilter !== "all") {
      list = list.filter((r) => r.issuedAt.includes(yearFilter));
    }

    // Live Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.recipientName.toLowerCase().includes(q) ||
          (r.memberId && r.memberId.toLowerCase().includes(q)) ||
          (r.discipline && r.discipline.toLowerCase().includes(q)) ||
          (r.metadata?.eventName && r.metadata.eventName.toLowerCase().includes(q)) ||
          (r.metadata?.bibNumber && r.metadata.bibNumber.toLowerCase().includes(q)) ||
          (r.categoryLabel && r.categoryLabel.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      }
      return 0;
    });

    return list;
  }, [receipts, activeCategory, statusFilter, yearFilter, searchQuery, sortBy]);

  // Loading State
  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-spin">
            <Receipt className="size-6 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            Retrieving your registration receipts ledger...
          </p>
        </div>
      </SiteLayout>
    );
  }

  // Unauthenticated State
  if (!isAuthenticated || !user) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="National Secretariat Ledger"
          title="Registration Receipts"
          description="View, verify, print, and download official registration receipts, belt examination slips, championship passes, and referee licenses."
          image={IMAGES.heroStadium}
        />
        <section className="section-pad">
          <div className="shell max-w-xl mx-auto text-center space-y-5">
            <div className="luxe-card p-10 sm:p-12 rounded-3xl border border-border/80 space-y-5">
              <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center mx-auto">
                <Receipt className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Sign In to View Your Receipts</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Please log in to your registered member account to access and download your official registration slips and receipts.
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

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Federation Credentials & Slips"
        title="Registration Receipts"
        description={`Official registration receipts and examination slips created under ${user.name} (${user.id}).`}
        image={IMAGES.heroStadium}
      />

      <section className="section-pad bg-background">
        <div className="shell max-w-6xl mx-auto space-y-8">
          {/* User Profile Header Card */}
          <div className="luxe-card p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/30 border border-primary/40 text-primary grid place-items-center shrink-0 shadow-inner">
                <Receipt className="size-6 sm:size-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-xl font-bold text-foreground">{user.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] sm:text-[11px] font-bold uppercase">
                    {formatMemberType(user.memberType || user.role || "Member")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span className="font-mono text-primary font-semibold">{user.id}</span>
                  {user.email && <span className="break-all sm:break-normal">{user.email}</span>}
                  {user.state && <span>{user.state}, India</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto self-stretch md:self-center">
              <button
                type="button"
                onClick={loadReceipts}
                className="border border-border/80 hover:border-primary rounded-xl sm:rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                title="Refresh Receipts"
              >
                <RefreshCw className="size-3.5 text-primary" /> Refresh
              </button>
              <Link
                href="/dashboard"
                className="border border-border/80 hover:border-primary rounded-xl sm:rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span>Dashboard</span> <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Total Receipts</span>
              <div className="text-lg sm:text-xl font-black text-foreground font-mono">{stats?.totalCount || receipts.length}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Registrations</span>
              <div className="text-lg sm:text-xl font-black text-primary font-mono">{categoryCounts.member_registration}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Belt Exams</span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">{categoryCounts.belt_exam}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Black Belt</span>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">{categoryCounts.black_belt_dan}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Championships</span>
              <div className="text-lg sm:text-xl font-black text-primary font-mono">{categoryCounts.championship}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border/80 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Referee Slips</span>
              <div className="text-lg sm:text-xl font-black text-blue-400 font-mono">{categoryCounts.referee}</div>
            </div>
          </div>

          {/* Filtering, Search & View Controls */}
          <div className="space-y-4">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer",
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
              >
                All Receipts ({categoryCounts.all})
              </button>

              {categoryCounts.member_registration > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("member_registration")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                    activeCategory === "member_registration"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  <span>🛡️ Registration Receipts</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{categoryCounts.member_registration}</span>
                </button>
              )}

              {categoryCounts.belt_exam > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("belt_exam")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                    activeCategory === "belt_exam"
                      ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
                      : "bg-card/70 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                  )}
                >
                  <span>🥋 Belt Exam Receipts</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{categoryCounts.belt_exam}</span>
                </button>
              )}

              {categoryCounts.black_belt_dan > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("black_belt_dan")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                    activeCategory === "black_belt_dan"
                      ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
                      : "bg-card/70 border border-amber-500/30 text-amber-400 hover:text-amber-300"
                  )}
                >
                  <span>🥋 Black Belt Receipts</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{categoryCounts.black_belt_dan}</span>
                </button>
              )}

              {categoryCounts.championship > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("championship")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                    activeCategory === "championship"
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/70 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  <span>🏅 Championship Receipts</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{categoryCounts.championship}</span>
                </button>
              )}

              {categoryCounts.referee > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("referee")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5",
                    activeCategory === "referee"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-card/70 border border-blue-500/30 text-blue-400 hover:text-blue-300"
                  )}
                >
                  <span>⚖️ Referee Registration</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{categoryCounts.referee}</span>
                </button>
              )}
            </div>

            {/* Search, Year & Sort Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-card/60 border border-border/80">
              {/* Search Box */}
              <div className="relative lg:col-span-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search receipt ref, candidate name, event, discipline..."
                  className="w-full rounded-full bg-background border border-border/80 pl-10 pr-9 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-full bg-background border border-border/80 px-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="lg:col-span-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full rounded-full bg-background border border-border/80 px-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="lg:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-full bg-background border border-border/80 px-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Receipts Grid */}
          {filteredReceipts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredReceipts.map((receipt) => {
                const isDan = receipt.category === "black_belt_dan";
                const isBelt = receipt.category === "belt_exam";
                const isChamp = receipt.category === "championship";
                const isRef = receipt.category === "referee";

                return (
                  <div
                    key={receipt.id || receipt.receiptNumber}
                    className={cn(
                      "luxe-card p-4.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 sm:space-y-5 group transition-all",
                      isDan
                        ? "border-amber-400/50 bg-gradient-to-br from-[#121008] via-card to-amber-950/20 hover:border-amber-400 shadow-amber-950/20"
                        : isBelt
                        ? "border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-950/15 hover:border-emerald-400"
                        : isChamp
                        ? "border-primary/50 bg-gradient-to-br from-card via-card to-primary/10 hover:border-primary"
                        : isRef
                        ? "border-blue-500/40 bg-gradient-to-br from-card via-card to-blue-950/15 hover:border-blue-400"
                        : "border-border/80 bg-card/90 hover:border-primary/60"
                    )}
                  >
                    {/* Top Card Bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              isDan
                                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                                : isBelt
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isChamp
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : isRef
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-accent text-foreground border border-border/60"
                            )}
                          >
                            {receipt.categoryLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="size-3 shrink-0" /> {receipt.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors break-words">
                          {receipt.title}
                        </h3>
                      </div>
                    </div>

                    {/* Meta Particulars Grid */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs p-3 sm:p-3.5 rounded-2xl bg-background/60 border border-border/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Slip / Receipt Ref</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-primary break-all sm:break-normal text-[11px] sm:text-xs">
                            {receipt.receiptNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(receipt.receiptNumber, "Slip Number")}
                            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                            title="Copy Reference"
                          >
                            {copiedId === receipt.receiptNumber ? (
                              <Check className="size-3 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="size-3 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Issue Date</span>
                        <span className="font-semibold text-foreground mt-0.5 block text-xs sm:text-sm">
                          {formatToDDMMYYYY(receipt.issuedAt, new Date())}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Candidate / Holder</span>
                        <span className="font-semibold text-foreground break-words block mt-0.5 text-xs sm:text-sm">
                          {receipt.recipientName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registration / Member ID</span>
                        <span className="font-mono font-semibold text-muted-foreground break-all sm:break-normal block mt-0.5 text-[11px] sm:text-xs">
                          {receipt.memberId || "Recorded"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(receipt)}
                        className="w-full sm:w-auto border border-border/80 hover:border-primary text-foreground rounded-xl sm:rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                      >
                        <Eye className="size-3.5 text-primary" /> View Slip
                      </button>

                      <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(receipt)}
                          className="rounded-xl sm:rounded-full border border-border/80 hover:border-primary text-foreground hover:text-primary px-3.5 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center bg-card/60 shadow-xs"
                          title="Print Official Slip"
                        >
                          <Printer className="size-3.5 text-primary" /> Print
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(receipt)}
                          className="rounded-xl sm:rounded-full bg-gold-gradient text-stone-950 font-bold px-4 py-2.5 text-xs shadow-gold inline-flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer text-center"
                        >
                          <Download className="size-3.5" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="luxe-card p-12 rounded-3xl border border-border/80 text-center space-y-4 max-w-lg mx-auto">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary grid place-items-center mx-auto">
                <Receipt className="size-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">No Registration Receipts Found</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {searchQuery || activeCategory !== "all" || statusFilter !== "all"
                    ? "No receipts matched your current filter criteria. Try resetting category filters."
                    : "No official registration receipts or slips have been submitted under this account yet."}
                </p>
              </div>

              {(searchQuery || activeCategory !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("all");
                    setSearchQuery("");
                    setStatusFilter("all");
                    setYearFilter("all");
                  }}
                  className="border border-border/80 hover:border-primary rounded-full px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Interactive Registration Receipt Modal */}
      <RegistrationReceiptModal
        receipt={selectedReceipt}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        federationName={settings.federationName}
      />
    </SiteLayout>
  );
}
