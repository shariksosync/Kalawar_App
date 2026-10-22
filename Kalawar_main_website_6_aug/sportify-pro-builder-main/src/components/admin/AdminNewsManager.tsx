"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Newspaper,
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
  Calendar,
  Layers,
  FileText,
  FileCheck2,
  Pin,
  ExternalLink,
  MapPin,
  Clock,
  User,
  Tag,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { NewsItem, NewsCategory } from "@/data/content";
import { NEWS_CATEGORIES } from "@/data/content";
import { cn, slugify } from "@/lib/utils";

export function AdminNewsManager() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<NewsItem | null>(null);

  // File Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    slug: string;
    category: NewsCategory;
    tag: string;
    author: string;
    date: string;
    expiryDate: string;
    location: string;
    readTime: string;
    excerpt: string;
    body: string;
    image: string;
    documentUrl: string;
    documentName: string;
    documentSize: string;
    actionLink: string;
    actionText: string;
    pinned: boolean;
    status: "Published" | "Draft" | "Archived";
  }>({
    title: "",
    slug: "",
    category: "News",
    tag: "Latest",
    author: "Media Secretariat",
    date: new Date().toISOString().split("T")[0],
    expiryDate: "",
    location: "National Headquarters, India",
    readTime: "3 min read",
    excerpt: "",
    body: "",
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80",
    documentUrl: "",
    documentName: "",
    documentSize: "",
    actionLink: "",
    actionText: "",
    pinned: false,
    status: "Published",
  });

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/news?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.news)) {
        setNewsList(json.news);
      }
    } catch (err) {
      console.warn("Using fallback news dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      title: "",
      slug: "",
      category: "News",
      tag: "Latest",
      author: "Media Secretariat",
      date: new Date().toISOString().split("T")[0],
      expiryDate: "",
      location: "National Headquarters, India",
      readTime: "3 min read",
      excerpt: "",
      body: "",
      image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80",
      documentUrl: "",
      documentName: "",
      documentSize: "",
      actionLink: "",
      actionText: "",
      pinned: false,
      status: "Published",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NewsItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      slug: item.slug,
      category: item.category as NewsCategory,
      tag: item.tag || "Latest",
      author: item.author || "Media Secretariat",
      date: item.date || new Date().toISOString().split("T")[0],
      expiryDate: item.expiryDate || "",
      location: item.location || "National Headquarters, India",
      readTime: item.readTime || "3 min read",
      excerpt: item.excerpt || "",
      body: Array.isArray(item.body) ? item.body.join("\n\n") : (item.body as any) || "",
      image: item.image || "",
      documentUrl: item.documentUrl || "",
      documentName: item.documentName || "",
      documentSize: item.documentSize || "",
      actionLink: item.actionLink || "",
      actionText: item.actionText || "",
      pinned: Boolean(item.pinned),
      status: (item.status as any) || "Published",
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file exceeds 2MB limit");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_news");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
        toast.success("Cover image uploaded successfully");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (err) {
      toast.error("Network error during image upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Document file exceeds 2MB limit", { description: "Please upload a document under 2MB." });
      return;
    }

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        setForm((prev) => ({
          ...prev,
          documentUrl: data.url,
          documentName: file.name,
          documentSize: `${sizeInMB} MB`,
        }));
        toast.success("Document attached successfully", { description: file.name });
      } else {
        toast.error(data.error || "Failed to attach document");
      }
    } catch (err) {
      toast.error("Network error during document attachment");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Headline title is required");
      return;
    }
    if (!form.excerpt.trim()) {
      toast.error("Summary excerpt is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        slug: form.slug.trim() || slugify(form.title),
        body: form.body
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
      };

      if (editingItem) {
        const res = await fetch(`/api/news/${encodeURIComponent(editingItem.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Update failed");
        toast.success("Announcement updated successfully", { description: form.title });
      } else {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Publish failed");
        toast.success("Announcement published successfully", { description: form.title });
      }

      setIsModalOpen(false);
      loadNews();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePinned = async (item: NewsItem) => {
    try {
      const nextPinned = !item.pinned;
      const res = await fetch(`/api/news/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      });
      if (res.ok) {
        toast.success(nextPinned ? "Announcement Pinned to Top" : "Announcement Unpinned", {
          description: item.title,
        });
        loadNews();
      }
    } catch {
      toast.error("Failed to toggle pinned status");
    }
  };

  const handleToggleStatus = async (item: NewsItem) => {
    const nextStatus: "Published" | "Draft" | "Archived" =
      item.status === "Published"
        ? "Draft"
        : item.status === "Draft"
        ? "Archived"
        : "Published";

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${nextStatus}`, { description: item.title });
        loadNews();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Announcement deleted from Newsroom");
        setDeleteConfirmItem(null);
        loadNews();
      }
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const filteredItems = useMemo(() => {
    return newsList.filter((n) => {
      const matchesCategory =
        categoryFilter === "All" ||
        n.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "All" || (n.status || "Published") === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q) ||
        (n.location && n.location.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [newsList, categoryFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: newsList.length,
      published: newsList.filter((n) => n.status === "Published").length,
      drafts: newsList.filter((n) => n.status === "Draft").length,
      pinned: newsList.filter((n) => n.pinned).length,
    };
  }, [newsList]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Metrics Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Newspaper className="size-5 text-primary" /> News & Official Announcements Manager
          </h2>
          <p className="text-muted-foreground text-xs">
            Publish press releases, pin urgent circulars, manage category schedules, and attach official documents.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" /> Publish New Notice / News
        </button>
      </div>

      {/* 2. Top KPI Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Releases</p>
          <p className="text-xl font-extrabold text-foreground mt-1">{counts.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Published & Live</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{counts.published}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] uppercase font-bold text-amber-400">Pinned Announcements</p>
          <p className="text-xl font-extrabold text-amber-400 mt-1">{counts.pinned}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Drafts & Scheduled</p>
          <p className="text-xl font-extrabold text-muted-foreground mt-1">{counts.drafts}</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3 backdrop-blur-md">
        <div className="grid gap-3 md:grid-cols-12 items-center">
          <div className="relative md:col-span-8">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, location, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/90 border-border/80 text-xs w-full rounded-xl border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="All">Status: All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts Only</option>
              <option value="Archived">Archived Only</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
          {["All", ...NEWS_CATEGORIES].map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-gold-gradient text-background shadow-gold"
                    : "border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. News Table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading newsroom repository...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No announcements matched your search. Click <strong>"Publish New Notice / News"</strong> to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase text-foreground">
                <tr>
                  <th className="px-4 py-3">Announcement / Article</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location & Date</th>
                  <th className="px-4 py-3 text-center">Pinned</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3 max-w-md">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=400&q=80"}
                          alt={item.title}
                          className="size-10 rounded-lg object-cover border border-border/80 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-foreground hover:text-primary transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.excerpt}
                          </p>
                          {item.documentName && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
                              📎 {item.documentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-[11px] font-semibold text-foreground">{item.date}</span>
                      <span className="block text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {item.location || "National HQ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePinned(item)}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors border",
                          item.pinned
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "text-muted-foreground/40 border-transparent hover:text-foreground"
                        )}
                        title={item.pinned ? "Click to unpin" : "Click to pin at top"}
                      >
                        <Pin className="size-3.5" />
                      </button>
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
                        {item.status || "Published"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/news/${item.slug}`}
                          target="_blank"
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          title="View Live Page"
                        >
                          <Eye className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          title="Edit Announcement"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          className="grid size-7 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                          title="Delete"
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

      {/* 5. Create / Edit Modal */}
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
              {editingItem ? "Edit News / Announcement" : "Publish Official Announcement"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              Set headline, category, cover photo, attached circular document, and scheduling.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Cover Image Upload Dropzone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground">Cover Banner Photo</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-background/80">
                  <img
                    src={form.image || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=400&q=80"}
                    alt="Cover Preview"
                    className="size-16 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {form.image ? "Cover image attached" : "No custom cover selected"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Recommended: 1600x900px JPG/PNG</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 shrink-0"
                  >
                    {uploadingImage ? <Loader2 className="size-3.5 animate-spin" /> : "Upload Photo"}
                  </button>
                </div>
              </div>

              {/* Title & Slug */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Headline Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Championship Notice 2026"
                    value={form.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: prev.slug ? prev.slug : slugify(newTitle),
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Category & Tag */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Tag / Priority Badge</label>
                  <select
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  >
                    <option value="Latest">Latest</option>
                    <option value="Featured">Featured</option>
                    <option value="Trending">Trending</option>
                    <option value="Urgent">Urgent Notice</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Publication Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-bold"
                  >
                    <option value="Published">Published (Live)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Author, Date & Location */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Issuing Bureau / Author</label>
                  <input
                    type="text"
                    placeholder="e.g. Media Secretariat"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Publish Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Location / Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Maharashtra"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-[11px] font-bold text-foreground">Summary Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short lead paragraph summarizing this news item..."
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Full Body Content */}
              <div>
                <label className="text-[11px] font-bold text-foreground">Full Article Content (Paragraphs)</label>
                <textarea
                  rows={5}
                  placeholder="Enter detailed article text. Separate paragraphs with an empty line..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />
              </div>

              {/* Document / Circular PDF Attachment */}
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <label className="text-[11px] font-bold text-foreground">Attached Official Circular / PDF Document</label>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.zip"
                  onChange={handleDocUpload}
                  className="hidden"
                />

                <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-8 rounded-lg bg-emerald-500/20 text-emerald-400 grid place-items-center shrink-0">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {form.documentName || "No document attached"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {form.documentSize ? `Size: ${form.documentSize}` : "Attach official PDF notice or entry form"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 shrink-0"
                  >
                    {uploadingDoc ? <Loader2 className="size-3.5 animate-spin" /> : "Attach PDF File"}
                  </button>
                </div>
              </div>

              {/* Related Action Link */}
              <div className="grid gap-3 sm:grid-cols-2 border-t border-border/40 pt-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground">Related Portal Action Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /events/calendar, /register, /rules"
                    value={form.actionLink}
                    onChange={(e) => setForm({ ...form, actionLink: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground">Action Button Label</label>
                  <input
                    type="text"
                    placeholder="e.g. View Full Event Calendar"
                    value={form.actionText}
                    onChange={(e) => setForm({ ...form, actionText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Pin to Top Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-border/40">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                    className="size-4 rounded accent-amber-500"
                  />
                  <span className="font-semibold text-foreground">
                    Pin to Top (Highlight in Urgent Announcement Banner)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-muted/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-gold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingItem ? (
                    "Update Announcement"
                  ) : (
                    "Publish Announcement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="size-10 rounded-xl bg-destructive/10 grid place-items-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Delete Announcement</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to remove this notice?</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl font-medium">
              "{deleteConfirmItem.title}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmItem.id)}
                className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold hover:opacity-90"
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
