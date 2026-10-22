"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Download,
  Printer,
  Eye,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Award,
  Scale,
  Trophy,
  GraduationCap,
  Building2,
  Copy,
  FileText,
  Sparkles,
  ChevronDown,
  X,
  Check,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import type { RegistrationReceiptItem, ReceiptCategory, ReceiptsStatsSummary } from "@/types/receipt";
import { RegistrationReceiptModal } from "@/components/receipts/RegistrationReceiptModal";
import { downloadRegistrationReceiptPDF, printRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { downloadBeltRegistrationSlipPDF, printBeltRegistrationSlipPDF } from "@/lib/belt-pdf-download";
import { downloadDanPaymentSlipPDF, printDanPaymentSlipPDF } from "@/lib/dan-payment-slip";
import { downloadChampionshipRegistrationReceiptPDF, printChampionshipRegistrationReceiptPDF } from "@/lib/championship-pdf";
import { downloadRefereeReceiptPDF, printRefereeRegistrationSlip } from "@/lib/referee-license-pdf";

interface AdminReceiptsManagerProps {
  federationName?: string;
}

export function AdminReceiptsManager({
  federationName = "KALAWAR Sports & Martial Arts Federation of India",
}: AdminReceiptsManagerProps) {
  const [receipts, setReceipts] = useState<RegistrationReceiptItem[]>([]);
  const [stats, setStats] = useState<ReceiptsStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<ReceiptCategory>("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Selected Receipt for Modal
  const [selectedReceipt, setSelectedReceipt] = useState<RegistrationReceiptItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/receipts?all=true", {
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
      toast.error("Failed to load receipts registry");
    } catch (err) {
      console.error("Failed to fetch admin receipts:", err);
      toast.error("Error loading receipts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReceipts();
  }, []);

  // Helper to extract role category from receipt
  const getReceiptRole = (r: RegistrationReceiptItem): string => {
    if (r.rawPlayer?.memberType) {
      const mt = r.rawPlayer.memberType.toLowerCase();
      if (mt.includes("coach")) return "Coach";
      if (mt.includes("referee") || mt.includes("official")) return "Referee";
      if (mt.includes("club")) return "Club";
      if (mt.includes("player") || mt.includes("athlete")) return "Player";
    }
    const mid = (r.memberId || r.receiptNumber || "").toUpperCase();
    if (mid.includes("-CO-") || mid.startsWith("KSM-CO-") || mid.startsWith("WSF-CO-")) return "Coach";
    if (mid.includes("-REF-") || mid.includes("-OF-") || mid.startsWith("KSM-REF-") || mid.startsWith("KSM-OF-") || mid.startsWith("WSF-REF-") || mid.startsWith("WSF-OF-") || r.category === "referee") return "Referee";
    if (mid.includes("-CL-") || mid.startsWith("KSM-CL-") || mid.startsWith("WSF-CL-")) return "Club";
    return "Player";
  };

  // Unique users list derived from all receipts
  const uniqueUsersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; memberType?: string }>();
    for (const r of receipts) {
      const uId = r.memberId || r.rawPlayer?.id || r.rawDanApp?.athleteId || r.rawChampApp?.athleteId || "";
      if (uId && !map.has(uId)) {
        map.set(uId, {
          id: uId,
          name: r.recipientName,
          memberType: r.categoryLabel,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    let list = [...receipts];

    // Filter by Category
    if (activeCategory !== "all") {
      list = list.filter((r) => r.category === activeCategory);
    }

    // Filter by Role
    if (selectedRoleFilter !== "all") {
      list = list.filter((r) => getReceiptRole(r).toLowerCase() === selectedRoleFilter.toLowerCase());
    }

    // Filter by Specific User / Member
    if (selectedUserFilter !== "all") {
      list = list.filter(
        (r) =>
          (r.memberId && r.memberId.toLowerCase() === selectedUserFilter.toLowerCase()) ||
          (r.rawPlayer?.id && r.rawPlayer.id.toLowerCase() === selectedUserFilter.toLowerCase()) ||
          (r.email && r.email.toLowerCase() === selectedUserFilter.toLowerCase())
      );
    }

    // Filter by Status
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by Year
    if (yearFilter !== "all") {
      list = list.filter((r) => r.issuedAt.includes(yearFilter));
    }

    // Live Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(q) ||
          r.recipientName.toLowerCase().includes(q) ||
          (r.memberId && r.memberId.toLowerCase().includes(q)) ||
          r.title.toLowerCase().includes(q) ||
          (r.discipline && r.discipline.toLowerCase().includes(q)) ||
          (r.academyOrClub && r.academyOrClub.toLowerCase().includes(q)) ||
          (r.metadata?.eventName && r.metadata.eventName.toLowerCase().includes(q)) ||
          (r.metadata?.bibNumber && r.metadata.bibNumber.toLowerCase().includes(q))
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
  }, [receipts, activeCategory, selectedRoleFilter, selectedUserFilter, statusFilter, yearFilter, searchQuery, sortBy]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPDF = async (receipt: RegistrationReceiptItem) => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await downloadBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await downloadDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await downloadChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await downloadRefereeReceiptPDF(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else {
        toast.info("Generating PDF slip...");
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF slip");
    }
  };

  const handlePrintSlip = async (receipt: RegistrationReceiptItem) => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await printBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await printDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await printChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await printRefereeRegistrationSlip(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Failed to trigger print:", err);
      toast.error("Failed to print slip");
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "member_registration":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "belt_exam":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "black_belt_dan":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "championship":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "referee":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-primary/10 text-primary border-primary/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            <Receipt className="size-3.5" /> Official Ledger & Audit Slips
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Registration <span className="text-gold-gradient">Receipts Registry</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized registry of all official athlete registrations, belt exams, Dan certifications, competitor passes, and referee licenses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAllReceipts}
            disabled={loading}
            className="border-border/70 bg-card/60 hover:border-primary/50 text-foreground inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:bg-card cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5 text-primary", loading && "animate-spin")} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div
          onClick={() => setActiveCategory("all")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "all"
              ? "border-primary bg-primary/10 shadow-gold"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-primary/20 text-primary mb-2">
            <Layers className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">{receipts.length}</div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Total Slips
          </div>
        </div>

        <div
          onClick={() => setActiveCategory("member_registration")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "member_registration"
              ? "border-blue-500 bg-blue-500/10 shadow-md"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-blue-500/20 text-blue-400 mb-2">
            <UserCheck className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">
            {stats?.memberRegistrationCount ?? receipts.filter((r) => r.category === "member_registration").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Memberships
          </div>
        </div>

        <div
          onClick={() => setActiveCategory("belt_exam")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "belt_exam"
              ? "border-emerald-500 bg-emerald-500/10 shadow-md"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
            <GraduationCap className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">
            {stats?.beltExamCount ?? receipts.filter((r) => r.category === "belt_exam").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Belt Exams
          </div>
        </div>

        <div
          onClick={() => setActiveCategory("black_belt_dan")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "black_belt_dan"
              ? "border-amber-500 bg-amber-500/10 shadow-md"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-amber-500/20 text-amber-400 mb-2">
            <ShieldCheck className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">
            {stats?.blackBeltDanCount ?? receipts.filter((r) => r.category === "black_belt_dan").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Black Belt Dan
          </div>
        </div>

        <div
          onClick={() => setActiveCategory("championship")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "championship"
              ? "border-purple-500 bg-purple-500/10 shadow-md"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-purple-500/20 text-purple-400 mb-2">
            <Trophy className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">
            {stats?.championshipCount ?? receipts.filter((r) => r.category === "championship").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Championship
          </div>
        </div>

        <div
          onClick={() => setActiveCategory("referee")}
          className={cn(
            "luxe-card p-4 text-center cursor-pointer transition-all border",
            activeCategory === "referee"
              ? "border-rose-500 bg-rose-500/10 shadow-md"
              : "border-border/60 bg-card/60 hover:border-border"
          )}
        >
          <div className="flex items-center justify-center size-8 mx-auto rounded-full bg-rose-500/20 text-rose-400 mb-2">
            <Scale className="size-4" />
          </div>
          <div className="text-xl font-black text-foreground">
            {stats?.refereeCount ?? receipts.filter((r) => r.category === "referee").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            Referee Slips
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="luxe-card border border-border/70 bg-card/75 p-4 sm:p-5 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slip ref, athlete, event..."
              className="w-full rounded-xl border border-border/70 bg-background/80 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Role / Member Classification */}
          <div className="relative">
            <ShieldCheck className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/70 bg-background/80 py-2 pl-9 pr-8 text-xs outline-none focus:border-primary transition-colors cursor-pointer text-foreground font-medium"
            >
              <option value="all">All Roles & Classifications</option>
              <option value="Player">Athletes & Players</option>
              <option value="Coach">Coaches & Mentors</option>
              <option value="Referee">Referees & Officials</option>
              <option value="Club">Affiliated Clubs</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>

          {/* Filter by Specific User / Member */}
          <div className="relative">
            <User className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/70 bg-background/80 py-2 pl-9 pr-8 text-xs outline-none focus:border-primary transition-colors cursor-pointer text-foreground"
            >
              <option value="all">All Members & Candidates ({uniqueUsersList.length})</option>
              {uniqueUsersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.id})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>

          {/* Filter by Status */}
          <div className="relative">
            <Filter className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/70 bg-background/80 py-2 pl-9 pr-8 text-xs outline-none focus:border-primary transition-colors cursor-pointer text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>

          {/* Filter by Year */}
          <div className="relative">
            <SlidersHorizontal className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/70 bg-background/80 py-2 pl-9 pr-8 text-xs outline-none focus:border-primary transition-colors cursor-pointer text-foreground"
            >
              <option value="all">All Issue Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Category:
          </span>
          {[
            { key: "all", label: "All Receipts", count: receipts.length },
            {
              key: "member_registration",
              label: "Member Registrations",
              count: receipts.filter((r) => r.category === "member_registration").length,
            },
            {
              key: "belt_exam",
              label: "Belt Exam Slips",
              count: receipts.filter((r) => r.category === "belt_exam").length,
            },
            {
              key: "black_belt_dan",
              label: "Black Belt Dan",
              count: receipts.filter((r) => r.category === "black_belt_dan").length,
            },
            {
              key: "championship",
              label: "Championship Passes",
              count: receipts.filter((r) => r.category === "championship").length,
            },
            {
              key: "referee",
              label: "Referee Slips",
              count: receipts.filter((r) => r.category === "referee").length,
            },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key as ReceiptCategory)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5",
                activeCategory === cat.key
                  ? "bg-primary text-background shadow-gold"
                  : "border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-mono">
                {cat.count}
              </span>
            </button>
          ))}

          {selectedUserFilter !== "all" && (
            <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
              <span>Filtered by user: <strong>{selectedUserFilter}</strong></span>
              <button
                onClick={() => setSelectedUserFilter("all")}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="luxe-card overflow-hidden border border-border/70 bg-card/60">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Displaying <span className="text-primary font-black">{filteredReceipts.length}</span> of{" "}
            {receipts.length} Official Receipts
          </div>
          <div className="text-xs text-muted-foreground">
            Sorted by: <strong>{sortBy === "newest" ? "Newest First" : "Oldest First"}</strong>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="size-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-xs font-semibold">Loading official registration receipts...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <h4 className="text-sm font-bold text-foreground">No Registration Receipts Found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No receipts matched your current filter criteria. Try resetting the user or category filters.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSelectedUserFilter("all");
                setStatusFilter("all");
                setYearFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Receipt Reference</th>
                  <th className="py-3.5 px-4">Candidate / Member</th>
                  <th className="py-3.5 px-4">Category & Discipline</th>
                  <th className="py-3.5 px-4">Club / State</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-accent/30 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{receipt.receiptNumber}</span>
                        <button
                          onClick={() => handleCopy(receipt.receiptNumber, "Receipt Number")}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity cursor-pointer"
                          title="Copy Receipt Ref"
                        >
                          {copiedId === receipt.receiptNumber ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{receipt.recipientName}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {receipt.memberId || "KSM-MEMBER"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1",
                          getCategoryBadgeColor(receipt.category)
                        )}
                      >
                        {receipt.categoryLabel}
                      </span>
                      <div className="text-[11px] text-muted-foreground">
                        {receipt.discipline || "Kalawar Martial Arts"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-foreground font-medium">
                        {receipt.academyOrClub || "Independent"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {receipt.state || "National"}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {formatToDDMMYYYY(receipt.issuedAt)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="size-3" /> {receipt.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setModalOpen(true);
                          }}
                          className="border-border/60 bg-background/60 hover:border-primary text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all hover:bg-primary/10 cursor-pointer"
                          title="View Full Slip"
                        >
                          <Eye className="size-3 text-primary" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handlePrintSlip(receipt)}
                          className="border-border/60 bg-background/60 hover:border-primary text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-lg border p-1 text-[11px] transition-all cursor-pointer"
                          title="Print Receipt Slip"
                        >
                          <Printer className="size-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(receipt)}
                          className="bg-gold-gradient text-background inline-flex items-center justify-center rounded-lg p-1 text-[11px] font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
                          title="Download PDF Receipt"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      <RegistrationReceiptModal
        receipt={selectedReceipt}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReceipt(null);
        }}
        federationName={federationName}
      />
    </div>
  );
}
