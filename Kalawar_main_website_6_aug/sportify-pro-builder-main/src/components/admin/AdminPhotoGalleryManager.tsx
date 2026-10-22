"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Camera,
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
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  Pin,
  Image as ImageIcon,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import type { AlbumItem } from "@/data/albums";
import { ALBUM_CATEGORIES, type AlbumCategory, type IPhotoItem } from "@/types/album";
import { cn } from "@/lib/utils";

export function AdminPhotoGalleryManager() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AlbumItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    category: AlbumCategory | string;
    eventName: string;
    eventLink: string;
    date: string;
    venue: string;
    state: string;
    district: string;
    coverPhoto: string;
    description: string;
    photographerCredit: string;
    photos: IPhotoItem[];
    status: "Published" | "Draft";
    pinned: boolean;
  }>({
    title: "",
    category: "Championship Photos",
    eventName: "",
    eventLink: "",
    date: new Date().toISOString().split("T")[0],
    venue: "",
    state: "Maharashtra",
    district: "Pune",
    coverPhoto: "",
    description: "",
    photographerCredit: "KALAWAR Official Media Cell",
    photos: [],
    status: "Published",
    pinned: false,
  });

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gallery/albums?includeAll=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.albums)) {
        setAlbums(data.albums);
      } else {
        setAlbums([]);
      }
    } catch (error) {
      console.error("Failed to load albums:", error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  // Filtered Albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((a) => {
      const matchesCat =
        selectedCategory === "All" ||
        a.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus =
        selectedStatus === "All" || a.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.eventName && a.eventName.toLowerCase().includes(q)) ||
        a.venue.toLowerCase().includes(q) ||
        (a.state && a.state.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q));

      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [albums, selectedCategory, selectedStatus, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = albums.length;
    const published = albums.filter((a) => a.status === "Published").length;
    const pinned = albums.filter((a) => a.pinned).length;
    const totalPhotos = albums.reduce((acc, a) => acc + (a.photos?.length || 0), 0);
    return { total, published, pinned, totalPhotos };
  }, [albums]);

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      category: "Championship Photos",
      eventName: "",
      eventLink: "",
      date: new Date().toISOString().split("T")[0],
      venue: "",
      state: "Maharashtra",
      district: "Pune",
      coverPhoto: "",
      description: "",
      photographerCredit: "KALAWAR Official Media Cell",
      photos: [],
      status: "Published",
      pinned: false,
    });
    setEditingAlbum(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (album: AlbumItem) => {
    setEditingAlbum(album);
    setFormData({
      id: album.id,
      title: album.title,
      category: album.category,
      eventName: album.eventName || "",
      eventLink: album.eventLink || "",
      date: album.date || new Date().toISOString().split("T")[0],
      venue: album.venue,
      state: album.state || "Maharashtra",
      district: album.district || "Pune",
      coverPhoto: album.coverPhoto,
      description: album.description || "",
      photographerCredit: album.photographerCredit || "KALAWAR Official Media Cell",
      photos: Array.isArray(album.photos) ? [...album.photos] : [],
      status: album.status === "Draft" ? "Draft" : "Published",
      pinned: Boolean(album.pinned),
    });
    setIsCreateOpen(true);
  };

  // Upload handler for multiple photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingPhotos(true);
      const uploadedList: IPhotoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds 2MB limit (skipped).`);
          continue;
        }

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("folder", "kalawar_gallery");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          uploadedList.push({
            id: `P-${Date.now()}-${i}`,
            url: data.url,
            caption: "",
            photographer: formData.photographerCredit || "KALAWAR Official Media Cell",
            order: (formData.photos.length || 0) + i + 1,
          });
        }
      }

      if (uploadedList.length > 0) {
        setFormData((prev) => {
          const combined = [...prev.photos, ...uploadedList];
          return {
            ...prev,
            photos: combined,
            coverPhoto: prev.coverPhoto || uploadedList[0].url,
          };
        });
        toast.success(`Successfully uploaded ${uploadedList.length} photo(s)`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload some photos. Please retry.");
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Set Cover Photo
  const handleSetCoverPhoto = (url: string) => {
    setFormData((prev) => ({ ...prev, coverPhoto: url }));
    toast.success("Cover photo updated");
  };

  // Delete individual photo from album
  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => {
      const updated = prev.photos.filter((_, idx) => idx !== index);
      const cover =
        prev.coverPhoto === prev.photos[index]?.url
          ? updated[0]?.url || ""
          : prev.coverPhoto;
      return { ...prev, photos: updated, coverPhoto: cover };
    });
  };

  // Update photo caption/photographer inline
  const handleUpdatePhotoField = (
    index: number,
    field: "caption" | "photographer",
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.photos];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, photos: updated };
    });
  };

  // Save Album (Create or Update)
  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Album title is required");
      return;
    }

    if (!formData.venue.trim()) {
      toast.error("Venue is required");
      return;
    }

    if (!formData.coverPhoto && formData.photos.length === 0) {
      toast.error("Please upload at least one photo or provide a cover photo URL");
      return;
    }

    const payload = {
      ...formData,
      coverPhoto: formData.coverPhoto || formData.photos[0]?.url || "",
    };

    try {
      setIsSaving(true);
      if (editingAlbum) {
        const res = await fetch(`/api/gallery/albums/${editingAlbum.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Photo album updated successfully");
          setIsCreateOpen(false);
          fetchAlbums();
        } else {
          toast.error(data.error || "Failed to update album");
        }
      } else {
        const res = await fetch("/api/gallery/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Photo album created successfully");
          setIsCreateOpen(false);
          fetchAlbums();
        } else {
          toast.error(data.error || "Failed to create album");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving the album");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (album: AlbumItem) => {
    const nextStatus = album.status === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Album status changed to ${nextStatus}`);
        fetchAlbums();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Toggle Pinned
  const handleTogglePinned = async (album: AlbumItem) => {
    try {
      const res = await fetch(`/api/gallery/albums/${album.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !album.pinned }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(album.pinned ? "Album unpinned" : "Album pinned to top");
        fetchAlbums();
      }
    } catch {
      toast.error("Failed to toggle pinned state");
    }
  };

  // Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const res = await fetch(`/api/gallery/albums/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Photo album deleted");
        setDeleteCandidate(null);
        fetchAlbums();
      } else {
        toast.error(data.error || "Failed to delete album");
      }
    } catch {
      toast.error("Failed to delete album");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Camera className="size-6 text-primary" />
            <span>Official Photo Albums Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage federation photo albums, drag-and-drop multi-photo uploads, captions, and event links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAlbums}
            className="rounded-xl border border-border/70 bg-card p-2.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Albums"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create New Album</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur-md">
          <p className="text-xs text-muted-foreground font-medium">Total Albums</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-md">
          <p className="text-xs text-emerald-400 font-medium">Published Albums</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{metrics.published}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-md">
          <p className="text-xs text-amber-400 font-medium">Total Photos</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{metrics.totalPhotos}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-md">
          <p className="text-xs text-primary font-medium">Featured Albums</p>
          <p className="text-xl sm:text-2xl font-black text-primary mt-1">{metrics.pinned}</p>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur-md space-y-3">
        <div className="grid gap-3 sm:grid-cols-12 items-center">
          <div className="relative sm:col-span-6">
            <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search albums by title, venue, event, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/90 border-border/80 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-background/90 border-border/80 text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="All">All Categories</option>
              {ALBUM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-background/90 border-border/80 text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Albums Table */}
      <div className="rounded-2xl border border-border/80 bg-card/70 overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 sm:p-4">Cover & Title</th>
                <th className="p-3.5 sm:p-4">Category</th>
                <th className="p-3.5 sm:p-4">Venue & Date</th>
                <th className="p-3.5 sm:p-4">Photos</th>
                <th className="p-3.5 sm:p-4">Status</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
                    <span>Loading albums...</span>
                  </td>
                </tr>
              ) : filteredAlbums.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    No photo albums match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAlbums.map((album) => (
                  <tr
                    key={album.id}
                    className="hover:bg-accent/40 transition-colors group"
                  >
                    <td className="p-3.5 sm:p-4">
                      <div className="flex items-center gap-3 min-w-0 max-w-md">
                        <img
                          src={album.coverPhoto}
                          alt={album.title}
                          className="size-12 rounded-lg object-cover shrink-0 border border-border"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {album.pinned && (
                              <span className="text-amber-400 font-bold" title="Pinned to Top">
                                ★
                              </span>
                            )}
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {album.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            ID: {album.id} {album.eventName ? `· ${album.eventName}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        {album.category}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap text-muted-foreground">
                      <p className="font-medium text-foreground">{album.venue}</p>
                      <p className="text-[11px]">
                        {new Date(album.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        <Layers className="size-3" />
                        {album.photos?.length || 0}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(album)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer",
                          album.status === "Published"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                        )}
                      >
                        {album.status}
                      </button>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePinned(album)}
                          title={album.pinned ? "Unpin album" : "Pin album to top"}
                          className={cn(
                            "size-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer",
                            album.pinned
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              : "border-border/80 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Pin className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(album)}
                          title="Edit Album"
                          className="size-8 rounded-lg border border-border/80 bg-card hover:border-primary hover:text-primary flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(album)}
                          title="Delete Album"
                          className="size-8 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white flex items-center justify-center text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create / Edit Album Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Camera className="size-5 text-primary" />
                <span>{editingAlbum ? "Edit Photo Album" : "Create New Photo Album"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12th National KALAWAR Championship 2026 - Finals"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {ALBUM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Venue / Complex *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shree Shiv Chhatrapati Sports Complex"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    State & District
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="State (e.g. Maharashtra)"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="District (e.g. Pune)"
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      className="w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Related Event Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12th National Championship 2026"
                    value={formData.eventName}
                    onChange={(e) =>
                      setFormData({ ...formData, eventName: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Event Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /events/calendar or /results"
                    value={formData.eventLink}
                    onChange={(e) =>
                      setFormData({ ...formData, eventLink: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Photographer / Media Cell Credit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KALAWAR National Media Cell / Raj Sharma"
                    value={formData.photographerCredit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        photographerCredit: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Album Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the event, participants, and championship highlights..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Photo Upload Dropzone */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-primary" />
                      <span>Album Photos ({formData.photos.length})</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Upload multiple high-res photos (Max 2MB each). Click on any photo to set it as the primary cover.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                    className="rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5" />
                        <span>Upload Photos</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Photos List / Grid */}
                {formData.photos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 max-h-72 overflow-y-auto p-1 border border-border/60 rounded-xl bg-background/50">
                    {formData.photos.map((photo, idx) => {
                      const isCover = formData.coverPhoto === photo.url;
                      return (
                        <div
                          key={photo.id || idx}
                          className={cn(
                            "relative flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                            isCover
                              ? "border-amber-500/60 bg-amber-500/5 shadow-md"
                              : "border-border/80 bg-card/80"
                          )}
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${idx + 1}`}
                            className="size-14 rounded-lg object-cover shrink-0 border border-border"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                #{idx + 1}
                              </span>
                              {isCover ? (
                                <span className="text-[9px] font-extrabold uppercase bg-amber-500 text-black px-2 py-0.2 rounded-full">
                                  ★ Cover
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverPhoto(photo.url)}
                                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                                >
                                  Set as Cover
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Photo caption..."
                              value={photo.caption || ""}
                              onChange={(e) =>
                                handleUpdatePhotoField(
                                  idx,
                                  "caption",
                                  e.target.value
                                )
                              }
                              className="w-full text-[11px] rounded-lg border border-border/60 bg-background/90 px-2 py-1 text-foreground focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx)}
                            className="size-7 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
                            title="Remove Photo"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <UploadCloud className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      Click to upload photos
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports JPG, PNG, WEBP. Upload multiple images at once.
                    </p>
                  </div>
                )}
              </div>

              {/* Status & Pinned Toggles */}
              <div className="border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) =>
                        setFormData({ ...formData, pinned: e.target.checked })
                      }
                      className="size-4 accent-amber-500 rounded"
                    />
                    <span>Pin Album as Flagship Feature</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={formData.status === "Published"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.checked ? "Published" : "Draft",
                        })
                      }
                      className="size-4 accent-emerald-500 rounded"
                    />
                    <span>Publish Immediately</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-accent text-muted-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gold-gradient text-background rounded-xl px-5 py-2 text-xs font-bold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? "Saving Album..." : editingAlbum ? "Update Album" : "Create Album"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="size-12 rounded-full bg-rose-500/15 text-rose-400 grid place-items-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Delete Photo Album?
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to delete <span className="font-bold text-foreground">"{deleteCandidate.title}"</span>? This will remove all {deleteCandidate.photos.length} photos in this album.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-accent text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-lg transition-colors cursor-pointer"
              >
                Yes, Delete Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
