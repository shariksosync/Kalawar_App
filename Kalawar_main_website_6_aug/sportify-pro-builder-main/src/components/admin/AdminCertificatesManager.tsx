"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Plus,
  Building2,
  Phone,
  Mail,
  Filter,
  ExternalLink,
  Paperclip,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  UserCheck,
  UserX,
  Star,
  Trophy,
  MapPin,
  Check,
  Flame,
  QrCode,
  Printer,
  Copy,
  Clock,
  Edit,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { states } from "@/data/people";
import {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  SIGNATORIES,
  type CertificateItem,
  type CertificateType,
  type CertificateStatus,
  type CreateCertificateInput,
} from "@/types/certificate";
import { downloadCertificatePDF, printCertificateSlip } from "@/lib/certificate-pdf";

export function AdminCertificatesManager() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [stateFilter, setStateFilter] = useState<string>("All");

  // Selected certificate for detailed inspector modal
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"details" | "preview" | "status" | "history">("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateCertificateInput>>({});

  // Status reason input
  const [statusReason, setStatusReason] = useState("");

  // Create Certificate Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCertificateInput>({
    holder: "",
    kalawarId: "",
    email: "",
    phone: "",
    state: "Maharashtra",
    district: "",
    academy: "",
    type: "Championship / Achievement Certificate",
    event: "All-India National KALAWAR Championship 2026",
    position: "1st Place - Gold Medal",
    rankOrBelt: "1st Dan Black Belt",
    issued: new Date().toISOString().split("T")[0],
    validUntil: "Perpetual",
    issuedBy: "Mr. Santosh Kasbe (Founder & President)",
    status: "Valid",
    notes: "Official championship certificate issuance.",
  });

  // Fetch certificates
  const fetchCertificates = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/certificates?all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.certificates)) {
        setCertificates(data.certificates);
      } else {
        toast.error("Failed to load certificates registry");
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Network error while loading certificates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = certificates.length;
    const valid = certificates.filter((c) => c.status === "Valid" || c.status === "Issued").length;
    const expired = certificates.filter((c) => c.status === "Expired").length;
    const suspended = certificates.filter((c) => c.status === "Suspended").length;
    const cancelled = certificates.filter((c) => c.status === "Cancelled" || c.status === "Revoked").length;
    return { total, valid, expired, suspended, cancelled };
  }, [certificates]);

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        searchQuery === "" ||
        cert.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.kalawarId && cert.kalawarId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.event && cert.event.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.academy && cert.academy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.rankOrBelt && cert.rankOrBelt.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Valid" && (cert.status === "Valid" || cert.status === "Issued")) ||
        (statusFilter === "Cancelled" && (cert.status === "Cancelled" || cert.status === "Revoked")) ||
        cert.status === statusFilter;

      const matchesType = typeFilter === "All" || cert.type === typeFilter;
      const matchesState = stateFilter === "All" || cert.state === stateFilter;

      return matchesSearch && matchesStatus && matchesType && matchesState;
    });
  }, [certificates, searchQuery, statusFilter, typeFilter, stateFilter]);

  // Open inspector
  const handleOpenInspector = (cert: CertificateItem) => {
    setSelectedCert(cert);
    setEditForm({
      holder: cert.holder,
      kalawarId: cert.kalawarId,
      email: cert.email,
      phone: cert.phone,
      state: cert.state,
      district: cert.district,
      academy: cert.academy,
      type: cert.type,
      event: cert.event,
      position: cert.position,
      rankOrBelt: cert.rankOrBelt,
      issued: cert.issued,
      validUntil: cert.validUntil,
      issuedBy: cert.issuedBy,
      status: cert.status,
    });
    setIsEditing(false);
    setStatusReason("");
    setInspectorTab("details");
  };

  // Create certificate
  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success && data.certificate) {
        toast.success(`Certificate ${data.certificate.number} issued successfully!`);
        setIsCreateOpen(false);
        fetchCertificates();
      } else {
        toast.error(data.error || "Failed to create certificate");
      }
    } catch (err) {
      console.error("Create certificate error:", err);
      toast.error("Network error while creating certificate");
    }
  };

  // Update certificate
  const handleUpdateCertificate = async (
    id: string,
    updates: Partial<CreateCertificateInput> & { statusReason?: string; actionType?: string }
  ) => {
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.certificate) {
        toast.success("Certificate updated successfully");
        setSelectedCert(data.certificate);
        setEditForm(data.certificate);
        setIsEditing(false);
        setStatusReason("");
        fetchCertificates();
      } else {
        toast.error(data.error || "Failed to update certificate");
      }
    } catch (err) {
      console.error("Update certificate error:", err);
      toast.error("Network error while updating certificate");
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate permanently?")) return;
    try {
      const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Certificate record deleted");
        if (selectedCert?.id === id || selectedCert?.number === id) {
          setSelectedCert(null);
        }
        fetchCertificates();
      } else {
        toast.error(data.error || "Failed to delete certificate");
      }
    } catch (err) {
      console.error("Delete certificate error:", err);
      toast.error("Network error while deleting certificate");
    }
  };

  // Copy verification link
  const handleCopyLink = (cert: CertificateItem) => {
    const url = `${window.location.origin}/certificates?number=${encodeURIComponent(cert.number)}`;
    navigator.clipboard.writeText(url);
    toast.success("Public verification URL copied!");
  };

  const getStatusBadgeClass = (status: CertificateStatus) => {
    switch (status) {
      case "Valid":
      case "Issued":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Expired":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Suspended":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "Cancelled":
      case "Revoked":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-card/90 via-card/70 to-card/90 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider shadow-gold">
            <Award className="size-3.5" /> Official Certificate Management Hub
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground font-heading tracking-tight">
            KALAWAR Certificate Registry &amp; Verification
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Generate, authenticate, issue, and cryptographically audit all KALAWAR Dan Diplomas, Belt Promotion Certificates, Technical Official Licenses, and Championship Accreditations.
          </p>
        </div>


      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-sm shadow-sm space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-muted-foreground tracking-wider block">
            Total Registry
          </span>
          <p className="text-2xl font-black text-foreground">{stats.total}</p>
          <span className="text-[10px] text-muted-foreground">Across all disciplines</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-sm shadow-sm space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-emerald-400 tracking-wider block">
            Valid &amp; Active
          </span>
          <p className="text-2xl font-black text-emerald-400">{stats.valid}</p>
          <span className="text-[10px] text-emerald-500/80">Authenticated records</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 backdrop-blur-sm shadow-sm space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-amber-400 tracking-wider block">
            Expired
          </span>
          <p className="text-2xl font-black text-amber-400">{stats.expired}</p>
          <span className="text-[10px] text-amber-500/80">Awaiting clinic renewal</span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/25 backdrop-blur-sm shadow-sm space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-orange-400 tracking-wider block">
            Suspended
          </span>
          <p className="text-2xl font-black text-orange-400">{stats.suspended}</p>
          <span className="text-[10px] text-orange-500/80">Disciplinary review</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 backdrop-blur-sm shadow-sm space-y-1">
          <span className="text-[10.5px] uppercase font-bold text-rose-400 tracking-wider block">
            Cancelled / Revoked
          </span>
          <p className="text-2xl font-black text-rose-400">{stats.cancelled}</p>
          <span className="text-[10px] text-rose-500/80">Nullified credentials</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl border border-border/80 bg-card/40 backdrop-blur-sm space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Cert No (KAC-CERT-...), Name, KALAWAR ID, Event, Club..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-background/80 border border-border/80 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl bg-background/80 border border-border/80 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="All">All Certificate Types</option>
              {CERTIFICATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl bg-background/80 border border-border/80 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {CERTIFICATE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="md:col-span-2">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl bg-background/80 border border-border/80 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="All">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
          <div>
            Showing <strong className="text-foreground">{filteredCertificates.length}</strong> of{" "}
            <strong>{certificates.length}</strong> certificates
          </div>

          {(searchQuery || statusFilter !== "All" || typeFilter !== "All" || stateFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setTypeFilter("All");
                setStateFilter("All");
              }}
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Certificates Table */}
      <div className="rounded-3xl border border-border/80 bg-card/60 overflow-hidden shadow-sm backdrop-blur-md">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="size-8 animate-spin text-primary mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Loading certificates database...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Award className="size-10 text-muted-foreground/40 mx-auto" />
            <h4 className="text-base font-bold text-foreground">No Certificate Records Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No certificates match your search query or selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-[10.5px] uppercase font-bold text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="p-4">Certificate No</th>
                  <th className="p-4">Candidate / Athlete</th>
                  <th className="p-4">Certificate Type</th>
                  <th className="p-4">Event &amp; Position</th>
                  <th className="p-4">State / Club</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-accent/30 transition-colors group">
                    <td className="p-4">
                      <span className="font-mono font-black text-primary block">{cert.number}</span>
                      {cert.kalawarId && (
                        <span className="font-mono text-[10.5px] text-muted-foreground block mt-0.5">
                          {cert.kalawarId}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-black text-foreground text-[13px] block">{cert.holder}</span>
                      {cert.rankOrBelt && (
                        <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                          {cert.rankOrBelt}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block max-w-[180px] truncate">{cert.type}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-foreground block max-w-[200px] truncate">{cert.event}</span>
                      {cert.position && (
                        <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
                          {cert.position}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-foreground block">{cert.state || "India"}</span>
                      {cert.academy && (
                        <span className="text-[11px] text-muted-foreground block mt-0.5 max-w-[140px] truncate">
                          {cert.academy}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-foreground block">{cert.issued}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Thru: {cert.validUntil || "Perpetual"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black border ${getStatusBadgeClass(
                          cert.status
                        )}`}
                      >
                        {cert.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => printCertificateSlip(cert)}
                          title="Print Official Slip"
                          className="p-1.5 rounded-xl bg-card hover:bg-accent border border-border/80 text-foreground transition-colors"
                        >
                          <Printer className="size-3.5 text-muted-foreground" />
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadCertificatePDF(cert)}
                          title="Download High-Res PDF"
                          className="p-1.5 rounded-xl bg-card hover:bg-accent border border-border/80 text-foreground transition-colors"
                        >
                          <Download className="size-3.5 text-primary" />
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

      {/* INSPECTOR MODAL */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#0d0f14] border-2 border-primary/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-5 text-black flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-black/20 text-black">
                  <Award className="size-6" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider">
                    {selectedCert.number}
                  </h3>
                  <p className="text-xs text-zinc-900 font-bold uppercase tracking-wider">
                    {selectedCert.holder} • {selectedCert.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-zinc-800 bg-zinc-950 px-6 shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setInspectorTab("details")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <FileText className="size-3.5" />
                <span>Details &amp; Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("preview")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "preview"
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="size-3.5" />
                <span>Live Certificate Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("status")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "status"
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>Status &amp; Actions</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("history")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Clock className="size-3.5" />
                <span>Audit Trail</span>
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#0d0f14]">
              {/* TAB 1: DETAILS & EDIT */}
              {inspectorTab === "details" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <h4 className="text-sm font-black uppercase tracking-wider text-zinc-200">
                      Credential Identification &amp; Candidate Info
                    </h4>

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="size-3.5 text-primary" />
                      <span>{isEditing ? "Cancel Editing" : "Edit Metadata"}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateCertificate(selectedCert.id, {
                          ...editForm,
                          actionType: "Metadata Updated",
                          statusReason: "Admin modified certificate fields.",
                        });
                      }}
                      className="grid sm:grid-cols-2 gap-4 text-xs"
                    >
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Candidate Name *</label>
                        <input
                          type="text"
                          value={editForm.holder || ""}
                          onChange={(e) => setEditForm({ ...editForm, holder: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">KALAWAR Member / Dan ID</label>
                        <input
                          type="text"
                          value={editForm.kalawarId || ""}
                          onChange={(e) => setEditForm({ ...editForm, kalawarId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Certificate Type *</label>
                        <select
                          value={editForm.type || selectedCert.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        >
                          {CERTIFICATE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Belt / Dan Rank / Designation</label>
                        <input
                          type="text"
                          value={editForm.rankOrBelt || ""}
                          onChange={(e) => setEditForm({ ...editForm, rankOrBelt: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Event / Exam Title *</label>
                        <input
                          type="text"
                          value={editForm.event || ""}
                          onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Position / Achievement</label>
                        <input
                          type="text"
                          value={editForm.position || ""}
                          onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Affiliated Club / Academy</label>
                        <input
                          type="text"
                          value={editForm.academy || ""}
                          onChange={(e) => setEditForm({ ...editForm, academy: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">State / Jurisdiction</label>
                        <select
                          value={editForm.state || selectedCert.state || "Maharashtra"}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        >
                          {states.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">District / City</label>
                        <input
                          type="text"
                          value={editForm.district || ""}
                          onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Issue Date</label>
                        <input
                          type="date"
                          value={editForm.issued || ""}
                          onChange={(e) => setEditForm({ ...editForm, issued: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Validity (e.g. Perpetual or Date)</label>
                        <input
                          type="text"
                          value={editForm.validUntil || ""}
                          onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-primary text-black font-black hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <Save className="size-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Candidate Name</span>
                        <p className="text-base font-black text-white">{selectedCert.holder}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">KALAWAR Member / Dan ID</span>
                        <p className="text-base font-black text-primary font-mono">{selectedCert.kalawarId || "None Logged"}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Certificate Type</span>
                        <p className="font-bold text-amber-400">{selectedCert.type}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Belt / Dan Rank</span>
                        <p className="font-bold text-zinc-200">{selectedCert.rankOrBelt || "Standard Official"}</p>
                      </div>

                      <div className="sm:col-span-2 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Event / Tournament / Exam</span>
                        <p className="text-sm font-bold text-white">{selectedCert.event}</p>
                        {selectedCert.position && (
                          <p className="text-xs text-primary font-semibold mt-0.5">Conferred / Secured: {selectedCert.position}</p>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Affiliated Club / Academy</span>
                        <p className="font-semibold text-zinc-300">{selectedCert.academy || "Independent National Candidate"}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">State / Region</span>
                        <p className="font-semibold text-zinc-300">
                          {selectedCert.district ? selectedCert.district + ", " : ""}
                          {selectedCert.state || "India"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Issue Date</span>
                        <p className="font-mono font-bold text-zinc-200">{selectedCert.issued}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Validity Status</span>
                        <p className="font-bold text-emerald-400">
                          {selectedCert.validUntil || "Perpetual"} ({selectedCert.status})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE CERTIFICATE PREVIEW */}
              {inspectorTab === "preview" && (
                <div className="space-y-6">
                  {/* Luxury Certificate Card Preview */}
                  <div className="relative rounded-3xl border-4 border-amber-500/60 bg-gradient-to-b from-[#181b24] via-[#0d0f14] to-black p-8 text-center shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
                    <div className="mx-auto size-18 rounded-full bg-white mb-3 shadow-gold flex items-center justify-center overflow-hidden">
                      <img src="/logo.png" alt="Logo" className="size-full object-contain" />
                    </div>

                    <p className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                      KALAWAR Sports &amp; Martial Arts Federation of India
                    </p>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mt-1">
                      Certificate of {selectedCert.type.replace("Certificate", "").trim()}
                    </h3>
                    <div className="h-0.5 w-32 bg-amber-500 mx-auto my-3" />

                    <p className="text-xs text-zinc-400 italic">This official credential is conferred upon</p>
                    <p className="text-2xl font-black text-amber-400 uppercase tracking-tight my-2">
                      {selectedCert.holder}
                    </p>

                    <p className="text-xs text-zinc-200 max-w-lg mx-auto leading-relaxed">
                      for achieving <strong className="text-amber-400">{selectedCert.position || "Distinction"}</strong> in{" "}
                      <strong>{selectedCert.event}</strong> on <span className="font-mono">{selectedCert.issued}</span>.
                    </p>

                    {/* Metadata Pill Box */}
                    <div className="my-5 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-3 gap-2 text-xs font-mono max-w-xl mx-auto">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-sans">Certificate No</span>
                        <span className="font-bold text-amber-400">{selectedCert.number}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-sans">KALAWAR ID</span>
                        <span className="font-bold text-white">{selectedCert.kalawarId || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-sans">Status</span>
                        <span className="font-bold text-emerald-400">{selectedCert.status}</span>
                      </div>
                    </div>

                    {/* Signatories & QR */}
                    <div className="grid grid-cols-3 items-center border-t border-zinc-800 pt-5 mt-5">
                      <div>
                        <div className="h-0.5 w-20 bg-amber-500/40 mx-auto mb-1" />
                        <p className="font-bold text-xs text-white">{SIGNATORIES.president.name}</p>
                        <p className="text-[9px] text-amber-400">{SIGNATORIES.president.role}</p>
                      </div>

                      <div className="mx-auto p-2 rounded-xl bg-white size-20 flex items-center justify-center">
                        <QRCode
                          value={`${window.location.origin}/certificates?number=${encodeURIComponent(
                            selectedCert.number
                          )}`}
                          size={64}
                        />
                      </div>

                      <div>
                        <div className="h-0.5 w-20 bg-amber-500/40 mx-auto mb-1" />
                        <p className="font-bold text-xs text-white">{SIGNATORIES.director.name}</p>
                        <p className="text-[9px] text-amber-400">{SIGNATORIES.director.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(selectedCert)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="size-3.5 text-primary" />
                      <span>Copy Verification Link</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printCertificateSlip(selectedCert)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="size-3.5 text-primary" />
                        <span>Print Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadCertificatePDF(selectedCert)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-amber-600 text-black font-black text-xs shadow-md hover:opacity-90 flex items-center gap-1.5 transition-all"
                      >
                        <Download className="size-3.5" />
                        <span>Download Certificate PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STATUS & LIFECYCLE CONTROLS */}
              {inspectorTab === "status" && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Current Authentication Status</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusBadgeClass(
                          selectedCert.status
                        )}`}
                      >
                        {selectedCert.status}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Valid Thru: <strong className="text-white">{selectedCert.validUntil || "Perpetual"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Administrative Reason Input */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Administrative Action Notes / Justification (Logged to Audit History)
                    </label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="e.g. Approved by Supreme Examination Board / Suspended for code of conduct..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-primary"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCertificate(selectedCert.id, {
                          status: "Valid",
                          actionType: "Activated / Revalidated",
                          statusReason: statusReason || "Official certificate set to Valid.",
                        })
                      }
                      className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-black text-sm">Validate / Activate Certificate</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Certifies the credential as authentic and active</p>
                      </div>
                      <ShieldCheck className="size-5 text-emerald-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCertificate(selectedCert.id, {
                          issued: new Date().toISOString().split("T")[0],
                          actionType: "Certificate Reissued",
                          statusReason: statusReason || "Certificate re-issued with updated timestamp.",
                        })
                      }
                      className="p-3.5 rounded-2xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-bold text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-black text-sm">Reissue Certificate</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Updates issue timestamp &amp; logs re-issue</p>
                      </div>
                      <RotateCcw className="size-5 text-primary" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCertificate(selectedCert.id, {
                          status: "Suspended",
                          actionType: "Certificate Suspended",
                          statusReason: statusReason || "Certificate suspended under administrative order.",
                        })
                      }
                      className="p-3.5 rounded-2xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-bold text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-black text-sm">Suspend Credential</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Temporarily halts verification validity</p>
                      </div>
                      <UserX className="size-5 text-orange-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCertificate(selectedCert.id, {
                          status: "Cancelled",
                          actionType: "Certificate Cancelled / Revoked",
                          statusReason: statusReason || "Certificate revoked permanently.",
                        })
                      }
                      className="p-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-xs font-bold text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-black text-sm">Cancel / Revoke Certificate</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Marks credential as revoked in public verification</p>
                      </div>
                      <XCircle className="size-5 text-rose-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {inspectorTab === "history" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span>Chronological Audit History</span>
                  </h4>

                  {(!selectedCert.auditHistory || selectedCert.auditHistory.length === 0) ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
                      No audit events logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCert.auditHistory.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-primary uppercase text-[11px]">{item.action}</span>
                            <span className="font-mono text-[10px] text-zinc-400">{item.timestamp}</span>
                          </div>
                          <p className="text-zinc-300 font-medium">{item.notes}</p>
                          <p className="text-[10px] text-zinc-500">Performed By: {item.performedBy}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / ISSUE CERTIFICATE MODAL */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#0d0f14] border-2 border-primary/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-5 text-black flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <Plus className="size-6 text-black" />
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider">Issue Official Certificate</h3>
                  <p className="text-xs text-zinc-900 font-bold">Automatic unique numbering &amp; QR registration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    value={createForm.holder}
                    onChange={(e) => setCreateForm({ ...createForm, holder: e.target.value })}
                    placeholder="e.g. Aarav Mehra"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">KALAWAR Member / Dan ID</label>
                  <input
                    type="text"
                    value={createForm.kalawarId || ""}
                    onChange={(e) => setCreateForm({ ...createForm, kalawarId: e.target.value })}
                    placeholder="e.g. KSM-PL-2026-7251"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-mono font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Certificate Type *</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  >
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Belt / Dan Rank / Designation</label>
                  <input
                    type="text"
                    value={createForm.rankOrBelt || ""}
                    onChange={(e) => setCreateForm({ ...createForm, rankOrBelt: e.target.value })}
                    placeholder="e.g. 1st Dan Black Belt / Senior Coach"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-300 mb-1">Event / Examination Title *</label>
                  <input
                    type="text"
                    value={createForm.event}
                    onChange={(e) => setCreateForm({ ...createForm, event: e.target.value })}
                    placeholder="e.g. All-India National KALAWAR Championship 2026"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Position / Achievement</label>
                  <input
                    type="text"
                    value={createForm.position || ""}
                    onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                    placeholder="e.g. 1st Place - Gold Medal"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Affiliated Club / Academy</label>
                  <input
                    type="text"
                    value={createForm.academy || ""}
                    onChange={(e) => setCreateForm({ ...createForm, academy: e.target.value })}
                    placeholder="e.g. Shogun Martial Arts Academy"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">State / Jurisdiction</label>
                  <select
                    value={createForm.state || "Maharashtra"}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">District / City</label>
                  <input
                    type="text"
                    value={createForm.district || ""}
                    onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Candidate Email (for auto-send)</label>
                  <input
                    type="email"
                    value={createForm.email || ""}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="candidate@example.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={createForm.issued || ""}
                    onChange={(e) => setCreateForm({ ...createForm, issued: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-amber-500 to-primary text-black font-black uppercase tracking-wider shadow-gold hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <Award className="size-4" />
                  <span>Issue &amp; Register Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
