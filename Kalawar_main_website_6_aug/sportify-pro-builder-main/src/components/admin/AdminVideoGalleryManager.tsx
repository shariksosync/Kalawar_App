"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Loader2,
  Filter,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Pin,
  Tv,
  Film,
  CheckCircle2,
  Share2,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { VideoItem } from "@/data/videos";
import { VIDEO_CATEGORIES, type VideoCategory, type VideoType } from "@/types/video";
import { parseVideoUrl } from "@/lib/video-utils";
import { VideoModal } from "@/components/gallery/VideoModal";
import { cn } from "@/lib/utils";



export function AdminVideoGalleryManager() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<VideoItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    category: string;
    videoUrl: string;
    videoType: VideoType;
    videoId: string;
    thumbnailUrl: string;
    duration: string;
    eventName: string;
    eventLink: string;
    date: string;
    venue: string;
    state: string;
    district: string;
    description: string;
    channelOrCredit: string;
    status: "Published" | "Draft" | "Archived";
    pinned: boolean;
  }>({
    title: "",
    category: "Championship Videos",
    videoUrl: "",
    videoType: "youtube",
    videoId: "",
    thumbnailUrl: "",
    duration: "10:00",
    eventName: "",
    eventLink: "",
    date: new Date().toISOString().split("T")[0],
    venue: "",
    state: "Maharashtra",
    district: "Pune",
    description: "",
    channelOrCredit: "KALAWAR Official",
    status: "Published",
    pinned: false,
  });

  // Fetch videos
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery/videos");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.warn("Failed to fetch videos from API:", err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // When video URL changes in form, auto-detect YouTube/Vimeo ID & Thumbnail
  const handleVideoUrlChange = (url: string) => {
    const parsed = parseVideoUrl(url);
    setFormData((prev) => ({
      ...prev,
      videoUrl: url,
      videoType: parsed.videoType,
      videoId: parsed.videoId,
      thumbnailUrl: prev.thumbnailUrl && prev.thumbnailUrl !== parseVideoUrl(prev.videoUrl).defaultThumbnail
        ? prev.thumbnailUrl
        : parsed.defaultThumbnail,
    }));
  };

  // Upload custom thumbnail image file
  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("File size exceeds 2MB limit. Please choose a smaller image under 2MB.");
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = "";
      return;
    }

    setUploadingThumbnail(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "kalawar_videos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload thumbnail");
      }

      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: data.url,
      }));
      toast.success("Thumbnail uploaded successfully!");
    } catch (err: any) {
      console.error("Thumbnail upload failed:", err);
      toast.error(err.message || "Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = "";
      }
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      category: "Championship Videos",
      videoUrl: "",
      videoType: "youtube",
      videoId: "",
      thumbnailUrl: "",
      duration: "10:00",
      eventName: "",
      eventLink: "",
      date: new Date().toISOString().split("T")[0],
      venue: "Balewadi Sports Complex, Pune",
      state: "Maharashtra",
      district: "Pune",
      description: "",
      channelOrCredit: "KALAWAR Official Media",
      status: "Published",
      pinned: false,
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v: VideoItem) => {
    setEditingVideo(v);
    setFormData({
      id: v.id,
      title: v.title,
      category: v.category,
      videoUrl: v.videoUrl,
      videoType: v.videoType || "youtube",
      videoId: v.videoId || "",
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration || "00:00",
      eventName: v.eventName || "",
      eventLink: v.eventLink || "",
      date: v.date,
      venue: v.venue || "",
      state: v.state || "Maharashtra",
      district: v.district || "Pune",
      description: v.description || "",
      channelOrCredit: v.channelOrCredit || "KALAWAR Official",
      status: v.status || "Published",
      pinned: !!v.pinned,
    });
    setIsCreateOpen(true);
  };

  // Submit Save / Create
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please provide a video title");
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.error("Please provide a valid Video URL (YouTube, Vimeo, or MP4 link)");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!editingVideo;
      const endpoint = isEditing
        ? `/api/gallery/videos/${editingVideo.id}`
        : "/api/gallery/videos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save video");
      }

      toast.success(isEditing ? "Video updated successfully!" : "Video added successfully!");
      setIsCreateOpen(false);
      fetchVideos();
    } catch (err: any) {
      toast.error(err.message || "Error saving video");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Pinned Status
  const handleTogglePinned = async (v: VideoItem) => {
    try {
      const updatedPinned = !v.pinned;
      const res = await fetch(`/api/gallery/videos/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: updatedPinned }),
      });
      if (res.ok) {
        toast.success(updatedPinned ? "Video marked as Featured Spotlight" : "Video unpinned");
        fetchVideos();
      }
    } catch {
      toast.error("Failed to update featured state");
    }
  };

  // Toggle Publish Status
  const handleToggleStatus = async (v: VideoItem) => {
    const nextStatus = v.status === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`/api/gallery/videos/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Video is now ${nextStatus}`);
        fetchVideos();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Delete Video
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      const res = await fetch(`/api/gallery/videos/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Video deleted successfully");
        setDeleteCandidate(null);
        fetchVideos();
      } else {
        toast.error("Failed to delete video");
      }
    } catch {
      toast.error("Error deleting video");
    }
  };

  // Filtered list
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (selectedCategory !== "All" && v.category !== selectedCategory) return false;
      if (selectedStatus !== "All" && v.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchEvent = v.eventName?.toLowerCase().includes(q);
        const matchVenue = v.venue?.toLowerCase().includes(q);
        const matchCredit = v.channelOrCredit?.toLowerCase().includes(q);
        if (!matchTitle && !matchEvent && !matchVenue && !matchCredit) return false;
      }
      return true;
    });
  }, [videos, selectedCategory, selectedStatus, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = videos.length;
    const published = videos.filter((v) => v.status === "Published").length;
    const pinned = videos.filter((v) => v.pinned).length;
    const youtubeCount = videos.filter((v) => v.videoType === "youtube" || !v.videoType).length;
    return { total, published, pinned, youtubeCount };
  }, [videos]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-gold-400" />
            <span>KALAWAR Video Library Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Publish official YouTube, Vimeo & stream broadcast links without heavy storage bloat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/gallery/videos"
            target="_blank"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-gold-500/40 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-gold-400" />
            <span>Public Video Gallery ↗</span>
          </Link>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gold-gradient text-background flex items-center gap-2 shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Video</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium">Total Videos</p>
            <p className="text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-gold-500/10 text-gold-400">
            <Tv className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium">Published Broadcasts</p>
            <p className="text-2xl font-black text-emerald-400">{stats.published}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium">Featured Spotlight</p>
            <p className="text-2xl font-black text-gold-400">{stats.pinned}</p>
          </div>
          <div className="p-3 rounded-xl bg-gold-500/10 text-gold-400">
            <Pin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium">YouTube Streams</p>
            <p className="text-2xl font-black text-amber-400">{stats.youtubeCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Play className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search videos by title, event, credit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60"
          >
            <option value="All">All Categories ({videos.length})</option>
            {VIDEO_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          <button
            onClick={fetchVideos}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-gold-400"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-gold-400")} />
          </button>
        </div>
      </div>

      {/* 3. Video Table / Cards View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          <p className="text-xs">Loading video catalogue...</p>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className={cn(
                "group relative bg-stone-900/90 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all",
                video.pinned ? "border-gold-500/50" : "border-stone-800/80"
              )}
            >
              {/* Top Video Preview Header */}
              <div>
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                  {/* Play preview button */}
                  <button
                    onClick={() => setPreviewVideo(video)}
                    className="absolute inset-0 flex items-center justify-center"
                    title="Instant Play Preview"
                  >
                    <div className="w-12 h-12 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </button>

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-950/80 text-gold-400 border border-gold-500/30">
                      {video.category}
                    </span>
                    {video.pinned && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500 text-stone-950">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] font-bold text-stone-200 border border-stone-700">
                      {video.duration}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      {video.date}
                    </span>
                    {video.venue && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 text-stone-500" />
                        {video.venue}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-stone-950/60 border-t border-stone-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(video)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                      video.status === "Published"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-stone-800 text-stone-400 border-stone-700 hover:text-white"
                    )}
                  >
                    {video.status || "Published"}
                  </button>

                  {/* Pin Toggle */}
                  <button
                    onClick={() => handleTogglePinned(video)}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      video.pinned
                        ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
                        : "bg-stone-800 text-stone-500 border-stone-700 hover:text-gold-400"
                    )}
                    title={video.pinned ? "Unpin video" : "Pin as Featured Spotlight"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(video)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-gold-500/20 text-stone-300 hover:text-gold-400 border border-stone-700 transition-colors"
                    title="Edit Video"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteCandidate(video)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/20 text-stone-300 hover:text-red-400 border border-stone-700 transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-stone-900/50 border border-stone-800 p-8 space-y-3">
          <Film className="w-10 h-10 text-stone-600 mx-auto" />
          <p className="text-sm text-stone-300 font-semibold">No videos found</p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gold-gradient text-background shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Add Your First Video
          </button>
        </div>
      )}

      {/* 4. Add / Edit Video Modal (Strictly URL / Embed only, NO file upload) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-stone-950 border border-gold-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900/90 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingVideo ? "Edit KALAWAR Video" : "Add New Official Video"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Enter external video link (YouTube, Vimeo, or Direct Stream).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVideo} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12th National Championship — Senior Men's Combat Finals"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                  >
                    {VIDEO_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Duration (MM:SS or HH:MM:SS)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18:45 or 01:15:00"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Video URL Input (with instant detection) */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-gold-500/20 space-y-3">
                <label className="block text-xs font-bold text-gold-400">
                  Video URL / Embed Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={formData.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 font-mono"
                />
                <p className="text-[11px] text-stone-400">
                  Supports YouTube standard URLs, Shorts, Live Streams, Vimeo, and direct MP4 stream links.
                </p>

                {/* Live Auto-detected Preview Box */}
                {formData.thumbnailUrl && (
                  <div className="pt-2 flex items-center gap-4">
                    <div className="relative aspect-video w-32 rounded-lg overflow-hidden bg-black border border-stone-700 shrink-0">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-5 h-5 text-gold-400 fill-current" />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-stone-300">
                      <p className="font-semibold text-gold-300">
                        Detected: {formData.videoType.toUpperCase()}
                      </p>
                      {formData.videoId && (
                        <p className="font-mono text-[11px] text-stone-400">
                          Video ID: {formData.videoId}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Thumbnail Upload & URL Override */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-gold-400" />
                    Custom Thumbnail (Optional Override)
                  </label>
                  {formData.thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultThumb = formData.videoUrl ? parseVideoUrl(formData.videoUrl).defaultThumbnail : "";
                        setFormData((prev) => ({ ...prev, thumbnailUrl: defaultThumb }));
                        toast.info("Custom thumbnail reset to default");
                      }}
                      className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                {/* Hidden native file input */}
                <input
                  type="file"
                  ref={thumbnailFileInputRef}
                  onChange={handleThumbnailFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                {/* Dual Options: Upload Button & Direct URL */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Upload button */}
                    <button
                      type="button"
                      disabled={uploadingThumbnail}
                      onClick={() => thumbnailFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 hover:border-gold-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {uploadingThumbnail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-gold-400" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>

                    <div className="text-center sm:text-left text-[11px] text-stone-500 font-medium sm:px-1">
                      OR
                    </div>

                    {/* Direct URL input */}
                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder="Paste custom image URL (https://...)"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 font-mono"
                      />
                      {formData.thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
                          title="Clear URL"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Upload an image file (JPG, PNG, WebP up to 2MB) or paste an external image link. Leave empty to automatically use the default YouTube/Vimeo thumbnail.
                  </p>
                </div>

                {/* Thumbnail Preview Badge */}
                {formData.thumbnailUrl && (
                  <div className="pt-2 flex items-center gap-3 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800/80">
                    <div className="relative aspect-video w-24 rounded-lg overflow-hidden bg-stone-900 border border-stone-700/60 shrink-0">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Custom Thumbnail Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gold-300 truncate">
                        Active Thumbnail
                      </p>
                      <p className="text-[11px] text-stone-400 font-mono truncate">
                        {formData.thumbnailUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Name & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Related Event Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12th National Championship 2026"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Event Hub URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /events"
                    value={formData.eventLink}
                    onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Date, Venue & Credit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Venue / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Balewadi Complex, Pune"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Channel / Media Credit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KALAWAR Official Channel"
                    value={formData.channelOrCredit}
                    onChange={(e) => setFormData({ ...formData, channelOrCredit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Video Description & Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the bout, seminar, kata performance, or speech..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                />
              </div>

              {/* Status & Pinned */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-800">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500 bg-stone-900 border-stone-700"
                    />
                    <span className="text-xs font-bold text-gold-400">
                      Pin as Featured Spotlight Video
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-stone-400">Status:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gold-gradient text-background flex items-center gap-2 shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingVideo ? "Update Video" : "Publish Video"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-950 border border-red-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Video Broadcast?</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{deleteCandidate.title}"</span>? This action will permanently remove it from the public video gallery.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Instant Play Preview Modal */}
      <VideoModal
        isOpen={!!previewVideo}
        video={previewVideo}
        allVideos={videos}
        onClose={() => setPreviewVideo(null)}
        onSelectVideo={(v) => setPreviewVideo(v)}
      />
    </div>
  );
}
