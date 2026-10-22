"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Upload,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  RefreshCw,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  Loader2,
  Filter,
  BadgeCheck,
  Download,
  Calendar,
  Layers,
  FileCheck2,
  FileCode,
  ArrowUpDown,
  BookOpen,
  ClipboardList,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import {
  OFFICIAL_DOWNLOADS,
  PRIMARY_DOWNLOAD_CATEGORIES,
  PrimaryDownloadCategory,
  YEARS_LIST,
  EVENT_FILTERS,
  DownloadItem,
} from "@/data/downloads-data";
import { generateOfficialPDF } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, any> = {
  All: FileText,
  "Rule Book & Regulations": BookOpen,
  "Registration Forms": ClipboardList,
  "Official Forms": Scale,
  "Certificates & Documents": FileCheck2,
};

export function AdminDownloadsManager() {
  const [downloads, setDownloads] = useState<DownloadItem[]>(OFFICIAL_DOWNLOADS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>("All Years");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DownloadItem | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    category: PrimaryDownloadCategory;
    description: string;
    version: string;
    publishedDate: string;
    updatedDate: string;
    year: string;
    event: string;
    type: "PDF" | "DOCX" | "ZIP";
    size: string;
    docCode: string;
    fileUrl: string;
    status: "Published" | "Draft" | "Archived";
    order: number;
    officialStamp: boolean;
    featured: boolean;
  }>({
    title: "",
    category: "Rule Book & Regulations",
    description: "",
    version: "v2026.1",
    publishedDate: "",
    updatedDate: "",
    year: "2026",
    event: "Federation Direct / General",
    type: "PDF",
    size: "1.0 MB",
    docCode: "",
    fileUrl: "",
    status: "Published",
    order: 1,
    officialStamp: true,
    featured: false,
  });

  const loadDownloads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/downloads?all=true");
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.success && Array.isArray(json.downloads)) {
          setDownloads(json.downloads);
        }
      }
    } catch (err) {
      console.warn("Using default downloads dataset fallback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDownloads();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedFile(null);
    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setForm({
      title: "",
      category: "Rule Book & Regulations",
      description: "",
      version: "v2026.1",
      publishedDate: today,
      updatedDate: today,
      year: "2026",
      event: "Federation Direct / General",
      type: "PDF",
      size: "1.0 MB",
      docCode: `K-DOC-${Date.now().toString(36).toUpperCase()}`,
      fileUrl: "",
      status: "Published",
      order: downloads.length + 1,
      officialStamp: true,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DownloadItem) => {
    setEditingItem(item);
    setSelectedFile(null);
    setForm({
      title: item.title,
      category: item.category as PrimaryDownloadCategory,
      description: item.description,
      version: item.version || "v2026.1",
      publishedDate: item.publishedDate,
      updatedDate: item.updatedDate,
      year: item.year || "2026",
      event: item.event || "Federation Direct / General",
      type: item.type,
      size: item.size,
      docCode: item.docCode,
      fileUrl: (item as any).fileUrl || "",
      status: item.status,
      order: item.order || 1,
      officialStamp: Boolean(item.officialStamp),
      featured: Boolean(item.featured),
    });
    setIsModalOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds 2MB limit", { description: "Please upload a document under 2MB." });
      return;
    }

    setSelectedFile(file);
    const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
    const fileType = ext === "DOCX" || ext === "DOC" ? "DOCX" : ext === "ZIP" ? "ZIP" : "PDF";

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMB} MB`;

    // Auto-update form values
    setForm((prev) => ({
      ...prev,
      type: fileType as any,
      size: sizeStr,
      title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      updatedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }));

    // Upload directly
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "wsf_documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, fileUrl: data.url }));
        toast.success("Document uploaded successfully", { description: file.name });
      }
    } catch (uploadErr) {
      console.error("File upload error:", uploadErr);
      toast.error("Failed to upload file to storage");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Document title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update existing document
        const res = await fetch(`/api/downloads/${encodeURIComponent(editingItem.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Update failed");

        toast.success("Document updated successfully", { description: form.title });
      } else {
        // Create new document
        const res = await fetch("/api/downloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Create failed");

        toast.success("Document created & published", { description: form.title });
      }

      setIsModalOpen(false);
      loadDownloads();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DownloadItem) => {
    const nextStatus: "Published" | "Draft" | "Archived" =
      item.status === "Published"
        ? "Draft"
        : item.status === "Draft"
        ? "Archived"
        : "Published";

    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${nextStatus}`, { description: item.title });
        loadDownloads();
      }
    } catch (e) {
      toast.error("Failed to update document status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Document deleted from Download Center");
        setDeleteConfirmItem(null);
        loadDownloads();
      }
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };

  const filteredItems = useMemo(() => {
    return downloads.filter((d) => {
      const matchesCategory =
        categoryFilter === "All" || d.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All" || d.status === statusFilter;
      const matchesYear =
        yearFilter === "All Years" || d.year === yearFilter;
      const matchesSearch =
        searchQuery === "" ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.docCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.version.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesStatus && matchesYear && matchesSearch;
    });
  }, [downloads, categoryFilter, statusFilter, yearFilter, searchQuery]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      total: downloads.length,
      published: downloads.filter((d) => d.status === "Published").length,
      drafts: downloads.filter((d) => d.status === "Draft").length,
      archived: downloads.filter((d) => d.status === "Archived").length,
    };
  }, [downloads]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Metrics Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="size-5 text-primary" /> Downloads & Official Documents Manager
          </h2>
          <p className="text-muted-foreground text-xs">
            Directly upload, edit, version-control, replace files, and manage statutory publications on Page 10.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" /> Upload New Document / PDF
        </button>
      </div>

      {/* 2. Top Metric KPI Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Documents</p>
          <p className="text-xl font-extrabold text-foreground mt-1">{counts.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Published & Live</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{counts.published}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] uppercase font-bold text-amber-400">Drafts (Unpublished)</p>
          <p className="text-xl font-extrabold text-amber-400 mt-1">{counts.drafts}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Archived Versions</p>
          <p className="text-xl font-extrabold text-muted-foreground mt-1">{counts.archived}</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3 backdrop-blur-md">
        <div className="grid gap-3 md:grid-cols-12 items-center">
          <div className="relative md:col-span-6">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, doc reference, or version..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/90 border-border/80 text-xs w-full rounded-xl border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="All">Status: All Records</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts Only</option>
              <option value="Archived">Archived Only</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-background/90 border-border/80 text-xs w-full rounded-xl border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              {YEARS_LIST.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
          {PRIMARY_DOWNLOAD_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-gold-gradient text-background shadow-gold"
                    : "border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Documents Table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading documents repository...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No documents matched your criteria. Click <strong>"Upload New Document / PDF"</strong> to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase text-foreground">
                <tr>
                  <th className="px-4 py-3">Document Title & Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">File Type & Size</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <FileText className="size-4" />
                        </span>
                        <div>
                          <p className="font-bold text-foreground hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground/70">{item.docCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 font-mono text-[10px] font-bold text-amber-400 px-2 py-0.5">
                        {item.version}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-semibold text-foreground">{item.type}</span>
                      <span className="block text-[10px] text-muted-foreground">{item.size}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-[10px]">Pub: {item.publishedDate}</span>
                      <span className="block text-[10px] text-emerald-400 font-medium">Upd: {item.updatedDate}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-all",
                          item.status === "Published"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : item.status === "Draft"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                            : "bg-slate-500/15 text-slate-400 border border-slate-500/30 hover:bg-slate-500/25"
                        )}
                        title="Click to toggle status"
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if ((item as any).fileUrl) {
                              window.open((item as any).fileUrl, "_blank");
                            } else {
                              generateOfficialPDF({
                                title: item.title,
                                category: item.category,
                                docCode: item.docCode,
                                date: item.updatedDate,
                                sections: [
                                  {
                                    heading: "OFFICIAL DOCUMENT OVERVIEW",
                                    body: item.description,
                                  },
                                ],
                              });
                            }
                          }}
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          title="View / Download Live File"
                        >
                          <Download className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          title="Edit Document / Replace File"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="size-3.5" />
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

      {/* 5. Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <h3 className="text-lg font-bold text-foreground">
              {editingItem ? "Edit Document / Replace File" : "Upload New Official Document"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              Upload PDF or DOCX file, set official version number, and publish to the Download Center.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* File Upload Dropzone */}
              <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadingFile ? (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-xs font-bold text-primary">Uploading file to secure storage...</p>
                  </div>
                ) : form.fileUrl ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-emerald-500/30">
                    <div className="flex items-center gap-2 text-left">
                      <span className="size-8 rounded-lg bg-emerald-500/20 text-emerald-400 grid place-items-center">
                        <FileCheck2 className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {selectedFile?.name || "Uploaded Document File Attached"}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          Format: {form.type} · Size: {form.size}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Replace File
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer py-3 space-y-1 hover:opacity-80 transition-opacity"
                  >
                    <UploadCloud className="mx-auto size-8 text-primary" />
                    <p className="text-xs font-bold text-foreground">Click to browse or drop PDF / DOCX file here</p>
                    <p className="text-[10px] text-muted-foreground">Supported: PDF, DOCX, ZIP (Up to 2MB)</p>
                  </div>
                )}
              </div>

              {/* Title & Reference Code */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official Rule Book PDF 2026-27"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Document Reference Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K-DOC-RB-2026"
                    value={form.docCode}
                    onChange={(e) => setForm({ ...form, docCode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Category & Scope */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Rule Book & Regulations">Rule Book & Regulations</option>
                    <option value="Registration Forms">Registration Forms</option>
                    <option value="Official Forms">Official Forms</option>
                    <option value="Certificates & Documents">Certificates & Documents</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Tournament Scope / Event</label>
                  <input
                    type="text"
                    placeholder="e.g. National Championship / General"
                    value={form.event}
                    onChange={(e) => setForm({ ...form, event: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Version & Dates */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Version Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="v2026.1"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Published Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="15 Jan 2026"
                    value={form.publishedDate}
                    onChange={(e) => setForm({ ...form, publishedDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Updated Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="28 Feb 2026"
                    value={form.updatedDate}
                    onChange={(e) => setForm({ ...form, updatedDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Format, Size & Publication Status */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground">File Format</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">DOCX Word Document</option>
                    <option value="ZIP">ZIP Archive</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">File Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 5.4 MB"
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Publication Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-bold"
                  >
                    <option value="Published">Published (Live on Site)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-foreground">Description & Technical Summary *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what this document contains and who should download it..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Official Stamp & Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.officialStamp}
                    onChange={(e) => setForm({ ...form, officialStamp: e.target.checked })}
                    className="size-4 rounded accent-amber-500"
                  />
                  <span>Mark with Official Federation Stamp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="size-4 rounded accent-amber-500"
                  />
                  <span>Highlight as Featured Download</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border/60 px-4 py-2 text-xs font-semibold hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingFile}
                  className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-gold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving...
                    </>
                  ) : editingItem ? (
                    "Save & Replace Document"
                  ) : (
                    "Upload & Publish Document"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl">
            <h3 className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" /> Delete Official Document?
            </h3>
            <p className="text-muted-foreground text-xs mt-2">
              Are you sure you want to delete <strong>{deleteConfirmItem.title}</strong> ({deleteConfirmItem.docCode})? This action cannot be undone and will remove the file from the public Download Center.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-xl border border-border/60 px-4 py-2 text-xs font-semibold hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmItem.id)}
                className="bg-destructive text-destructive-foreground rounded-xl px-4 py-2 text-xs font-bold hover:opacity-90"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
