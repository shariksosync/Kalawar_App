"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  Users,
  Search,
  Filter,
  CheckCircle2,
  X,
  Eye,
  Check,
  Sparkles,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Download,
  Printer,
  FileCheck,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/people";
import type {
  ChampionshipApplication,
  ChampionshipCertificate,
  ChampionshipPodiumPlace,
  ChampionshipAwardType,
  ChampionshipApplicationStatus,
} from "@/types/championship";
import {
  downloadChampionshipRegistrationReceiptPDF,
  printChampionshipRegistrationReceiptPDF,
  downloadChampionshipDiplomaPDF,
  printChampionshipDiplomaPDF,
} from "@/lib/championship-pdf";
import { formatToDDMMYYYY } from "@/lib/utils";

function getChampionshipLevelBadge(levelOrTitle?: string, certNumber?: string): {
  level: string;
  badgeClass: string;
} {
  const raw = (levelOrTitle || "").toLowerCase();
  const num = (certNumber || "").toUpperCase();

  let level = "District";
  if (raw.includes("inter") || num.includes("-I-")) {
    level = "International";
  } else if (raw.includes("nation") || num.includes("-N-")) {
    level = "National";
  } else if (raw.includes("state") || num.includes("-S-")) {
    level = "State";
  } else {
    level = "District";
  }

  const badgeClass =
    level === "International"
      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
      : level === "National"
      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
      : level === "State"
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
      : "bg-sky-500/20 text-sky-300 border border-sky-500/40";

  return { level, badgeClass };
}

export function AdminChampionshipManager() {
  const [activeTab, setActiveTab] = useState<"requests" | "registered" | "certificates">("requests");

  // Data States
  const [applications, setApplications] = useState<ChampionshipApplication[]>([]);
  const [certificates, setCertificates] = useState<ChampionshipCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [eventFilter, setEventFilter] = useState<string>("All");
  const [awardFilter, setAwardFilter] = useState<string>("All");

  // Modals State
  const [reviewModalApp, setReviewModalApp] = useState<ChampionshipApplication | null>(null);
  const [editingApp, setEditingApp] = useState<ChampionshipApplication | null>(null);
  const [resultModalApp, setResultModalApp] = useState<ChampionshipApplication | null>(null);
  const [issueCertModalApp, setIssueCertModalApp] = useState<ChampionshipApplication | null>(null);

  // Form states for modals
  const [resultForm, setResultForm] = useState<{
    level: string;
    place: ChampionshipPodiumPlace;
    points: number;
    notes: string;
  }>({
    level: "District",
    place: "Gold",
    points: 100,
    notes: "",
  });

  const [issueCertForm, setIssueCertForm] = useState<{
    level: string;
    awardType: string;
    notes: string;
  }>({
    level: "District",
    awardType: "Participant",
    notes: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all applications & certificates
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resApps, resCerts] = await Promise.all([
        fetch("/api/championships/applications").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/championships/certificates").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (resApps && resApps.success && Array.isArray(resApps.applications)) {
        setApplications(resApps.applications);
      }
      if (resCerts && resCerts.success && Array.isArray(resCerts.certificates)) {
        setCertificates(resCerts.certificates);
      }
    } catch (err) {
      console.error("Failed to load championship data:", err);
      toast.error("Failed to load championship data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique Events List for Filter Dropdown
  const uniqueEvents = useMemo(() => {
    const list = new Set<string>();
    applications.forEach((a) => {
      if (a.eventTitle) list.add(a.eventTitle);
    });
    certificates.forEach((c) => {
      if (c.championshipTitle) list.add(c.championshipTitle);
    });
    return Array.from(list);
  }, [applications, certificates]);

  // Tab 1: Applicant Requests (Pending / Under Review / Rejected)
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      // Must be non-approved or match selected status
      const matchesStatus =
        statusFilter === "All"
          ? app.status !== "Approved"
          : app.status === statusFilter;

      const matchesEvent = eventFilter === "All" || app.eventTitle === eventFilter || app.eventId === eventFilter;

      const matchesSearch =
        !q ||
        (app.applicantName || app.athleteName || "").toLowerCase().includes(q) ||
        (app.id || app.applicationId || "").toLowerCase().includes(q) ||
        (app.email || "").toLowerCase().includes(q) ||
        (app.phone || "").toLowerCase().includes(q) ||
        (app.clubName || app.club || "").toLowerCase().includes(q) ||
        (app.discipline || "").toLowerCase().includes(q) ||
        (app.eventTitle || app.eventName || "").toLowerCase().includes(q);

      return matchesStatus && matchesEvent && matchesSearch;
    });
  }, [applications, searchQuery, statusFilter, eventFilter]);

  // Tab 2: Registered Applicants (Approved)
  const filteredRegistered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      if (app.status !== "Approved" && app.status !== "approved") return false;

      const matchesEvent = eventFilter === "All" || (app.eventTitle || app.eventName) === eventFilter || app.eventId === eventFilter;

      const matchesSearch =
        !q ||
        (app.applicantName || app.athleteName || "").toLowerCase().includes(q) ||
        (app.id || app.applicationId || "").toLowerCase().includes(q) ||
        (app.bibNumber && app.bibNumber.toLowerCase().includes(q)) ||
        (app.email || "").toLowerCase().includes(q) ||
        (app.phone || "").toLowerCase().includes(q) ||
        (app.clubName || app.club || "").toLowerCase().includes(q) ||
        (app.discipline || "").toLowerCase().includes(q) ||
        (app.certificateNumber && app.certificateNumber.toLowerCase().includes(q));

      return matchesEvent && matchesSearch;
    });
  }, [applications, searchQuery, eventFilter]);

  // Tab 3: Certificates Registry
  const filteredCertificates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return certificates.filter((cert) => {
      const matchesAward = awardFilter === "All" || cert.awardType === awardFilter;
      const matchesEvent = eventFilter === "All" || (cert.championshipTitle || cert.eventName) === eventFilter || cert.eventId === eventFilter;

      const matchesSearch =
        !q ||
        (cert.candidateName || cert.athleteName || "").toLowerCase().includes(q) ||
        (cert.certificateNumber || "").toLowerCase().includes(q) ||
        (cert.applicationId || "").toLowerCase().includes(q) ||
        (cert.championshipTitle || cert.eventName || "").toLowerCase().includes(q) ||
        (cert.discipline || "").toLowerCase().includes(q) ||
        (cert.clubName || cert.club || "").toLowerCase().includes(q);

      return matchesAward && matchesEvent && matchesSearch;
    });
  }, [certificates, searchQuery, awardFilter, eventFilter]);

  // Summary counts
  const counts = useMemo(() => {
    const pending = applications.filter((a) => a.status === "Pending" || a.status === "Under Review").length;
    const registered = applications.filter((a) => a.status === "Approved").length;
    const issuedCerts = certificates.length;
    return { pending, registered, issuedCerts, total: applications.length };
  }, [applications, certificates]);

  // HANDLERS
  const handleApproveApplicant = async (app: ChampionshipApplication) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/championships/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Approved",
          paymentStatus: app.paymentStatus === "Pending" ? "Paid" : app.paymentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Applicant ${app.applicantName} approved! Assigned ${data.application?.bibNumber || "Bib Number"}, ID Card issued & email sent.`);
        setReviewModalApp(null);
        fetchData();
        // Switch to registered tab so admin can immediately view the candidate
        setActiveTab("registered");
      } else {
        toast.error(data.error || "Failed to approve applicant");
      }
    } catch {
      toast.error("Network error while approving applicant");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplicant = async (app: ChampionshipApplication, reason?: string) => {
    let rejectionReason = reason;
    if (!rejectionReason) {
      const input = prompt(`Enter rejection reason for ${app.applicantName}:`, "Document verification incomplete or criteria not met.");
      if (input === null) return; // Admin cancelled action
      rejectionReason = input.trim() || "Document verification incomplete or criteria not met.";
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/championships/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info(`Application for ${app.applicantName} rejected & notification email sent.`);
        setReviewModalApp(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to reject applicant");
      }
    } catch {
      toast.error("Network error while rejecting applicant");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteApplication = async (app: ChampionshipApplication) => {
    if (!confirm(`Are you sure you want to delete application "${app.id}" for ${app.applicantName}?`)) return;
    try {
      const res = await fetch(`/api/championships/applications/${app.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Application deleted successfully");
        setApplications((prev) => prev.filter((a) => a.id !== app.id));
      } else {
        toast.error(data.error || "Failed to delete application");
      }
    } catch {
      toast.error("Error deleting application");
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModalApp) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/championships/applications/${resultModalApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: resultForm.level,
          result: {
            level: resultForm.level,
            place: resultForm.place,
            points: Number(resultForm.points) || 0,
            notes: resultForm.notes,
            publishedAt: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Result published: ${resultForm.place} (${resultForm.level} Level) for ${resultModalApp.applicantName}`);
        setResultModalApp(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to publish result");
      }
    } catch {
      toast.error("Error publishing result");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCertModalApp) return;

    try {
      setIsProcessing(true);
      const res = await fetch("/api/championships/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: issueCertModalApp.id,
          level: issueCertForm.level,
          awardType: issueCertForm.awardType,
          place: issueCertForm.awardType,
          notes: issueCertForm.notes,
          adminNotes: issueCertForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Official Certificate ${data.certificate?.certificateNumber} Issued!`);
        setIssueCertModalApp(null);
        fetchData();
        setActiveTab("certificates");
      } else {
        toast.error(data.error || "Failed to issue certificate");
      }
    } catch {
      toast.error("Error issuing certificate");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeCertificate = async (cert: ChampionshipCertificate) => {
    if (!confirm(`Are you sure you want to revoke Certificate "${cert.certificateNumber}" for ${cert.candidateName}?`)) return;
    try {
      const res = await fetch(`/api/championships/certificates/${cert.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Certificate revoked successfully");
        setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
        fetchData();
      } else {
        toast.error(data.error || "Failed to revoke certificate");
      }
    } catch {
      toast.error("Error revoking certificate");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-card to-card border border-amber-500/30 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
            <Trophy className="size-3.5" /> Championship Control Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-foreground tracking-tight">
            Championship Management &amp; Certificates
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Review online applicant registration requests, approve competitors with Bib assignments, publish match results, and issue official QR-verifiable championship diplomas.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-4 py-2 text-xs font-bold text-foreground inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`size-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => {
            setActiveTab("requests");
            setStatusFilter("Pending");
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "requests" && statusFilter === "Pending"
              ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5"
              : "border-border/70 bg-card/60 hover:border-border"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">Pending Requests</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-400">{counts.pending}</span>
            <Users className="size-4 text-amber-400/80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("registered")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "registered"
              ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
              : "border-border/70 bg-card/60 hover:border-border"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">Registered Competitors</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400">{counts.registered}</span>
            <ShieldCheck className="size-4 text-emerald-400/80" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("certificates")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "certificates"
              ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/5"
              : "border-border/70 bg-card/60 hover:border-border"
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">Certificates Registry</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-primary">{counts.issuedCerts}</span>
            <Award className="size-4 text-primary/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60">
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">Total Applications</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-foreground">{counts.total}</span>
            <FileText className="size-4 text-muted-foreground/80" />
          </div>
        </div>
      </div>

      {/* Main 3-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "requests"
              ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
              : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/60"
          }`}
        >
          <Users className="size-4" />
          <span>1. Championship Applicant Requests</span>
          {counts.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-950 text-amber-300 ml-1">
              {counts.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("registered")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "registered"
              ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
              : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/60"
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>2. Registered Applicants</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-950/20 text-foreground ml-1">
            {counts.registered}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("certificates")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === "certificates"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/60"
          }`}
        >
          <Award className="size-4" />
          <span>3. Certificates Registry</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-background text-foreground ml-1">
            {counts.issuedCerts}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-card/60 border border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === "requests"
                ? "Search applicant name, tracking ID, email, academy, phone..."
                : activeTab === "registered"
                ? "Search competitor name, Bib number, ID, discipline..."
                : "Search certificate number, candidate name, tournament..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background/80 border border-border/80 rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "requests" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-background/80 border border-border/80 rounded-xl text-foreground outline-none focus:border-primary cursor-pointer"
            >
              <option value="Pending">Status: Pending Only</option>
              <option value="Under Review">Status: Under Review</option>
              <option value="Rejected">Status: Rejected</option>
              <option value="All">Status: All Requests</option>
            </select>
          )}

          {activeTab === "certificates" && (
            <select
              value={awardFilter}
              onChange={(e) => setAwardFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-background/80 border border-border/80 rounded-xl text-foreground outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All Award Types</option>
              <option value="Gold Medal">Gold Medal</option>
              <option value="Silver Medal">Silver Medal</option>
              <option value="Bronze Medal">Bronze Medal</option>
              <option value="Participation & Merit">Participation &amp; Merit</option>
              <option value="Champion Trophy">Champion Trophy</option>
            </select>
          )}

          {uniqueEvents.length > 0 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-background/80 border border-border/80 rounded-xl text-foreground outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
            >
              <option value="All">All Championships</option>
              {uniqueEvents.map((evt) => (
                <option key={evt} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHAMPIONSHIP APPLICANT REQUESTS                                    */}
      {/* ========================================================================= */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading championship applicant requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
              <Users className="size-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-base font-bold text-foreground">No Applicant Requests Found</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `No applicant requests matching "${searchQuery}".`
                  : "When candidates submit the online championship registration form, their requests will appear here for admin review and approval."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredRequests.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-card border border-border/80 hover:border-amber-500/40 transition shadow-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 grid place-items-center font-bold text-sm shrink-0">
                        {(app.applicantName || app.athleteName || "C").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">{app.applicantName || app.athleteName}</h4>
                          <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {app.id || app.applicationId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              app.status === "Approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : app.status === "Rejected"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {app.status}
                          </span>
                          {(() => {
                            const { level, badgeClass } = getChampionshipLevelBadge((app as any).level || app.eventTitle, app.id);
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                {level}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tournament: <strong className="text-foreground">{app.eventTitle}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => setReviewModalApp(app)}
                        className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3.5 py-1.5 text-xs font-bold text-foreground inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="size-3.5 text-primary" /> Review Request
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveApplicant(app)}
                        disabled={isProcessing}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Check className="size-3.5" /> Approve Applicant
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectApplicant(app)}
                        disabled={isProcessing}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <X className="size-3.5" /> Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app)}
                        className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 grid place-items-center transition cursor-pointer"
                        title="Delete application"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Discipline</span>
                      <p className="font-semibold text-foreground truncate">{app.discipline}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Age Division</span>
                      <p className="font-semibold text-foreground truncate">{app.ageDivision}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Weight Category</span>
                      <p className="font-semibold text-foreground truncate">{app.weightCategory}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Belt Rank</span>
                      <p className="font-semibold text-foreground truncate">{app.beltRank}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Academy / Club</span>
                      <p className="font-semibold text-foreground truncate">{app.clubName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Payment Status</span>
                      <p className="font-semibold text-amber-400">
                        {app.entryFee} ({app.paymentStatus})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGISTERED APPLICANTS (Approved Competitors)                        */}
      {/* ========================================================================= */}
      {activeTab === "registered" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading registered competitors...</p>
            </div>
          ) : filteredRegistered.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
              <ShieldCheck className="size-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-base font-bold text-foreground">No Registered Competitors Found</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `No registered applicants matching "${searchQuery}".`
                  : "Approved applicants will appear here with assigned Bib Numbers. From here you can publish results, issue certificates, and download registration receipts."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredRegistered.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 transition shadow-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 grid place-items-center font-bold text-sm shrink-0">
                        {(app.applicantName || app.athleteName || "C").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">{app.applicantName || app.athleteName}</h4>
                          {app.bibNumber && (
                            <span className="font-mono text-xs font-black bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-md shadow-xs">
                              {app.bibNumber}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                            ID: {app.id || app.applicationId}
                          </span>
                          {app.result?.place && app.result.place !== "Pending" && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                app.result.place === "Gold"
                                  ? "bg-amber-400 text-stone-950"
                                  : app.result.place === "Silver"
                                  ? "bg-slate-300 text-stone-950"
                                  : app.result.place === "Bronze"
                                  ? "bg-amber-700 text-white"
                                  : "bg-primary/20 text-primary border border-primary/30"
                              }`}
                            >
                              🏆 {app.result.place} Medalist
                            </span>
                          )}
                          {(() => {
                            const { level, badgeClass } = getChampionshipLevelBadge((app.result as any)?.level || (app as any).level || app.eventTitle, app.id);
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                {level}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tournament: <strong className="text-foreground">{app.eventTitle}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const detectedLevel =
                            (app.result as any)?.level ||
                            app.level ||
                            (app.eventTitle?.toLowerCase().includes("international") ? "International" :
                             app.eventTitle?.toLowerCase().includes("national") ? "National" :
                             app.eventTitle?.toLowerCase().includes("state") ? "State" : "District");

                          setResultModalApp(app);
                          setResultForm({
                            level: detectedLevel,
                            place: (app.result?.place as any) || "Gold",
                            points: app.result?.points || 100,
                            notes: app.result?.notes || "",
                          });
                        }}
                        className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Set placement and tournament match result"
                      >
                        <Trophy className="size-3.5 text-amber-400" /> Publish Results
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const defaultLevel =
                            (app.result as any)?.level ||
                            app.level ||
                            (app.eventTitle?.toLowerCase().includes("international") ? "International" :
                             app.eventTitle?.toLowerCase().includes("national") ? "National" :
                             app.eventTitle?.toLowerCase().includes("state") ? "State" : "District");

                          const defaultAward =
                            app.result?.place === "Gold" ? "Gold" :
                            app.result?.place === "Silver" ? "Silver" :
                            app.result?.place === "Bronze" ? "Bronze" : "Participant";

                          setIssueCertModalApp(app);
                          setIssueCertForm({
                            level: defaultLevel,
                            awardType: defaultAward,
                            notes: app.result?.notes || "",
                          });
                        }}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Issue official QR-verified certificate"
                      >
                        <Award className="size-3.5" />
                        {app.certificateNumber ? "Re-issue Certificate" : "Issue Certificate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => printChampionshipRegistrationReceiptPDF(app)}
                        className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3 py-1.5 text-xs font-bold text-foreground inline-flex items-center gap-1 transition cursor-pointer"
                        title="Print official registration slip"
                      >
                        <Printer className="size-3.5 text-primary" /> Print Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadChampionshipRegistrationReceiptPDF(app)}
                        className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3 py-1.5 text-xs font-bold text-foreground inline-flex items-center gap-1 transition cursor-pointer"
                        title="Download official registration receipt PDF"
                      >
                        <Download className="size-3.5" /> Download Slip
                      </button>

                      {app.certificateNumber && (
                        <Link
                          href={`/certificates/championship/${encodeURIComponent(app.certificateNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 transition"
                          title="View certificate in new tab"
                        >
                          <ExternalLink className="size-3.5" /> View Cert
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Registered Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Discipline</span>
                      <p className="font-semibold text-foreground truncate">{app.discipline}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Division &amp; Weight</span>
                      <p className="font-semibold text-foreground truncate">
                        {app.ageDivision} ({app.weightCategory})
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Belt Rank</span>
                      <p className="font-semibold text-foreground truncate">{app.beltRank}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Academy / Club</span>
                      <p className="font-semibold text-foreground truncate">{app.clubName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">State Association</span>
                      <p className="font-semibold text-foreground truncate">{app.state}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Certificate Status</span>
                      <p className="font-semibold text-foreground truncate">
                        {app.certificateNumber ? (
                          <span className="text-emerald-400 font-mono text-[11px] font-bold">
                            {app.certificateNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Pending Issuance</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CERTIFICATES REGISTRY                                              */}
      {/* ========================================================================= */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading championship certificates registry...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
              <Award className="size-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-base font-bold text-foreground">No Championship Certificates Issued Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? `No certificates matching "${searchQuery}".`
                  : "When you issue certificates to registered competitors from Tab 2, they will be archived here in the permanent registry."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition shadow-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center font-bold text-sm shrink-0">
                        <Award className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">{cert.candidateName}</h4>
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                            {cert.certificateNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              cert.awardType.includes("Gold")
                                ? "bg-amber-400 text-stone-950"
                                : cert.awardType.includes("Silver")
                                ? "bg-slate-300 text-stone-950"
                                : cert.awardType.includes("Bronze")
                                ? "bg-amber-700 text-white"
                                : "bg-primary/20 text-primary border border-primary/30"
                            }`}
                          >
                            {cert.awardType}
                          </span>
                          {(() => {
                            const { level, badgeClass } = getChampionshipLevelBadge(cert.level || cert.championshipTitle, cert.certificateNumber);
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                {level}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tournament: <strong className="text-foreground">{cert.championshipTitle}</strong> | Discipline:{" "}
                          <strong className="text-foreground">{cert.discipline}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Actions: Preview (new tab), Print, Download, Revoke */}
                    <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                      <Link
                        href={`/certificates/championship/${encodeURIComponent(cert.certificateNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Preview certificate in a new browser tab"
                      >
                        <ExternalLink className="size-3.5" /> Preview (New Tab)
                      </Link>

                      <button
                        type="button"
                        onClick={() => printChampionshipDiplomaPDF(cert)}
                        className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3.5 py-1.5 text-xs font-bold text-foreground inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Print official certificate diploma"
                      >
                        <Printer className="size-3.5 text-primary" /> Print
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadChampionshipDiplomaPDF(cert)}
                        className="rounded-xl border border-border/80 bg-background/80 hover:bg-card px-3.5 py-1.5 text-xs font-bold text-foreground inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Download high-resolution certificate PDF"
                      >
                        <Download className="size-3.5 text-primary" /> Download Certificate
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeCertificate(cert)}
                        className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 grid place-items-center transition cursor-pointer"
                        title="Revoke certificate"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Certificate Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Division &amp; Weight</span>
                      <p className="font-semibold text-foreground truncate">
                        {cert.ageDivision} ({cert.weightCategory})
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Belt Rank</span>
                      <p className="font-semibold text-foreground truncate">{cert.beltRank}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Academy / Club</span>
                      <p className="font-semibold text-foreground truncate">{cert.clubName || "Independent"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">State Association</span>
                      <p className="font-semibold text-foreground truncate">{cert.state}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Issue Date</span>
                      <p className="font-semibold text-foreground truncate">{formatToDDMMYYYY(cert.issueDate)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Competitor Bib</span>
                      <p className="font-semibold text-amber-400 font-mono text-[11px] truncate">
                        {cert.bibNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW APPLICANT REQUEST                                         */}
      {/* ========================================================================= */}
      {reviewModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border/90 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Review Championship Registration
                </span>
                <h3 className="text-xl font-black text-foreground uppercase">{reviewModalApp.applicantName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalApp(null)}
                className="size-8 rounded-full border border-border/80 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Application Tracking ID</span>
                <p className="font-mono font-bold text-primary text-sm">{reviewModalApp.id}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Target Championship</span>
                <p className="font-bold text-foreground text-sm">{reviewModalApp.eventTitle}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Discipline &amp; Division</span>
                <p className="font-semibold text-foreground">
                  {reviewModalApp.discipline} &bull; {reviewModalApp.ageDivision}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Weight &amp; Belt</span>
                <p className="font-semibold text-foreground">
                  {reviewModalApp.weightCategory} &bull; {reviewModalApp.beltRank}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Email &amp; Phone</span>
                <p className="font-semibold text-foreground">{reviewModalApp.email}</p>
                <p className="text-muted-foreground">{reviewModalApp.phone}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Academy &amp; State</span>
                <p className="font-semibold text-foreground">{reviewModalApp.clubName}</p>
                <p className="text-muted-foreground">{reviewModalApp.state}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">National ID / Emergency Contact</span>
                <p className="font-semibold text-foreground">
                  {reviewModalApp.aadhaarNumber ? `Aadhaar / ID: ${reviewModalApp.aadhaarNumber}` : "Direct Entry"}
                  {reviewModalApp.emergencyContactName ? ` • Emergency: ${reviewModalApp.emergencyContactName} (${reviewModalApp.emergencyContactPhone || ""})` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
              <button
                type="button"
                onClick={() => handleRejectApplicant(reviewModalApp)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer"
              >
                Reject Request
              </button>

              <button
                type="button"
                onClick={() => handleApproveApplicant(reviewModalApp)}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5"
              >
                <Check className="size-4" /> Approve &amp; Assign Bib
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PUBLISH COMPETITION RESULTS                                      */}
      {/* ========================================================================= */}
      {resultModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveResult}
            className="bg-card border border-border/90 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Publish Match Result
                </span>
                <h3 className="text-lg font-black text-foreground uppercase">{resultModalApp.applicantName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setResultModalApp(null)}
                className="size-8 rounded-full border border-border/80 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Championship Level / Tier *</label>
                <select
                  value={resultForm.level}
                  onChange={(e) => setResultForm({ ...resultForm, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="District">District Championship</option>
                  <option value="State">State Championship</option>
                  <option value="National">National Championship</option>
                  <option value="International">International Championship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Podium Placement / Achievement *</label>
                <select
                  value={resultForm.place}
                  onChange={(e) =>
                    setResultForm({
                      ...resultForm,
                      place: e.target.value as ChampionshipPodiumPlace,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary cursor-pointer font-bold"
                >
                  <option value="Gold">🥇 Gold</option>
                  <option value="Silver">🥈 Silver</option>
                  <option value="Bronze">🥉 Bronze</option>
                  <option value="Participant">🏅 Participant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Ranking Points Awarded</label>
                <input
                  type="number"
                  value={resultForm.points}
                  onChange={(e) => setResultForm({ ...resultForm, points: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Special Technical Notes / Bout Score</label>
                <textarea
                  rows={3}
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary resize-none"
                  placeholder="e.g. Won Final by Ippon 12-4 / Fastest Knockout in 32 seconds"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setResultModalApp(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-amber-400/20"
              >
                Save &amp; Publish Result
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ISSUE OFFICIAL CERTIFICATE                                       */}
      {/* ========================================================================= */}
      {issueCertModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleIssueCertificate}
            className="bg-card border border-border/90 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Issue Championship Diploma
                </span>
                <h3 className="text-lg font-black text-foreground uppercase">{issueCertModalApp.applicantName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIssueCertModalApp(null)}
                className="size-8 rounded-full border border-border/80 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Tournament &amp; Category</span>
                <p className="font-bold text-foreground">{issueCertModalApp.eventTitle}</p>
                <p className="text-muted-foreground">
                  {issueCertModalApp.discipline} &bull; {issueCertModalApp.ageDivision} ({issueCertModalApp.weightCategory})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Championship Level / Tier *</label>
                <select
                  value={issueCertForm.level}
                  onChange={(e) => setIssueCertForm({ ...issueCertForm, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="District">District Championship</option>
                  <option value="State">State Championship</option>
                  <option value="National">National Championship</option>
                  <option value="International">International Championship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Award Type on Certificate *</label>
                <select
                  value={issueCertForm.awardType}
                  onChange={(e) => setIssueCertForm({ ...issueCertForm, awardType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary cursor-pointer font-bold"
                >
                  <option value="Gold">🥇 Gold</option>
                  <option value="Silver">🥈 Silver</option>
                  <option value="Bronze">🥉 Bronze</option>
                  <option value="Participant">🏅 Participant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground block">Custom Certificate Remarks</label>
                  <span className="text-[10px] text-muted-foreground font-semibold">(For Internal Admin Records Only)</span>
                </div>
                <textarea
                  rows={2}
                  value={issueCertForm.notes}
                  onChange={(e) => setIssueCertForm({ ...issueCertForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs outline-none focus:border-primary resize-none"
                  placeholder="e.g. Unanimous Referee Decision in Finals / Category notes"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setIssueCertModalApp(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-primary/20"
              >
                Issue Certificate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
