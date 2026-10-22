"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Film,
  Loader2,
  Sparkles,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ArrowRight,
  Pin,
  Filter,
  Tv,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Stagger, StaggerItem } from "@/components/common/Reveal";
import { VideoCard } from "@/components/gallery/VideoCard";
import { VideoModal } from "@/components/gallery/VideoModal";
import { GallerySwitcher } from "@/components/gallery/GallerySwitcher";
import type { VideoItem } from "@/data/videos";
import { VIDEO_CATEGORIES } from "@/types/video";
import { IMAGES } from "@/data/images";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = ["All", ...VIDEO_CATEGORIES] as const;

export default function VideoGalleryPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  // Video Theater Lightbox state
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Fetch videos from API
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery/videos", { cache: "no-store" });
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

  // Filter only published videos
  const publishedVideos = useMemo(() => {
    return videos.filter((v) => v.status === "Published" || !v.status);
  }, [videos]);

  // Extract unique years from videos
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    publishedVideos.forEach((v) => {
      if (v.date) {
        const y = new Date(v.date).getFullYear().toString();
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    return ["All", ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, [publishedVideos]);

  // Filter & Search videos
  const filteredVideos = useMemo(() => {
    let result = [...publishedVideos];

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((v) => v.category === activeCategory);
    }

    // Year filter
    if (selectedYear !== "All") {
      result = result.filter((v) => {
        if (!v.date) return false;
        return new Date(v.date).getFullYear().toString() === selectedYear;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((v) => {
        return (
          v.title.toLowerCase().includes(q) ||
          v.eventName?.toLowerCase().includes(q) ||
          v.venue?.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.channelOrCredit?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [publishedVideos, activeCategory, selectedYear, searchQuery, sortBy]);

  // Pinned / Flagship Spotlight Video
  const pinnedVideo = useMemo(() => {
    return publishedVideos.find((v) => v.pinned) || publishedVideos[0] || null;
  }, [publishedVideos]);

  // Paginated videos
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVideos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVideos, currentPage]);

  // Open video theater player
  const handleOpenVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  // Live category count helper
  const getCategoryCount = (catName: string) => {
    if (catName === "All") return publishedVideos.length;
    return publishedVideos.filter((v) => v.category === catName).length;
  };

  return (
    <SiteLayout>
      {/* 1. Official Hero Section */}
      <PageHero
        eyebrow="Official Federation Broadcast Archive"
        title="KALAWAR VIDEO GALLERY"
        description="Official Highlights, Championship Matches, Seminars & Training Footage. Stream high-definition championship bouts, technical grading masterclasses, and national events."
        image={IMAGES.sparring}
      />

      {/* 2. Top Segmented Switcher (Photos & Videos) */}
      <div className="shell relative -mt-6 z-20">
        <GallerySwitcher />
      </div>


      <div className="bg-stone-950 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* 3. Flagship Pinned Spotlight Video Banner */}
          {pinnedVideo && !searchQuery && activeCategory === "All" && (
            <div className="relative rounded-3xl overflow-hidden border border-gold-500/40 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 shadow-2xl shadow-gold-500/10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
                {/* Left: Billboard Info */}
                <div className="lg:col-span-6 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 z-10">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-stone-950 shadow-md">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                        Featured Broadcast
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                        <Tv className="w-3.5 h-3.5 text-amber-400" />
                        {pinnedVideo.category}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                      {pinnedVideo.title}
                    </h2>

                    {pinnedVideo.description && (
                      <p className="text-sm text-stone-300 line-clamp-3 leading-relaxed">
                        {pinnedVideo.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-400">
                      {pinnedVideo.duration && (
                        <span className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
                          <Clock className="w-4 h-4 text-amber-400" />
                          {pinnedVideo.duration}
                        </span>
                      )}
                      {pinnedVideo.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-400/80" />
                          {new Date(pinnedVideo.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {pinnedVideo.venue && (
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-4 h-4 text-amber-400/80 shrink-0" />
                          <span className="truncate">{pinnedVideo.venue}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenVideo(pinnedVideo)}
                        className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs sm:text-sm font-extrabold shadow-gold transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Watch Official Video</span>
                      </button>


                      {pinnedVideo.eventLink && (
                        <Link
                          href={pinnedVideo.eventLink}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors"
                        >
                          <span>Event Hub</span>
                          <ExternalLink className="w-4 h-4 text-gold-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Billboard Video Preview with Glowing Play Button */}
                <div
                  onClick={() => handleOpenVideo(pinnedVideo)}
                  className="lg:col-span-6 relative aspect-video w-full cursor-pointer group overflow-hidden bg-stone-950"
                >
                  <img
                    src={pinnedVideo.thumbnailUrl}
                    alt={pinnedVideo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold-gradient text-background flex items-center justify-center shadow-2xl shadow-gold transform transition-transform duration-300 group-hover:scale-110">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Category Filter Pills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-200 text-sm font-semibold">
                <Filter className="w-4 h-4 text-amber-400" />
                <span>Explore Official Video Channels</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800">
              {CATEGORY_TABS.map((cat) => {
                const count = getCategoryCount(cat);
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border",
                      isActive
                        ? "bg-gold-gradient text-background border-transparent shadow-gold font-bold scale-[1.02]"
                        : "bg-card/90 text-muted-foreground border-border hover:border-amber-500/40 hover:text-foreground"
                    )}
                  >
                    <span>{cat}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        isActive
                          ? "bg-stone-950/80 text-amber-300 font-bold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>


          {/* 5. Search, Year & Sort Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search videos by title, event, venue..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-gold-500/60 transition-colors"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr === "All" ? "All Years" : `Year ${yr}`}
                  </option>
                ))}
              </select>

              {/* Sort Select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchVideos}
                disabled={loading}
                className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-gold-400 hover:border-gold-500/40 transition-colors"
                title="Refresh video list"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-gold-400")} />
              </button>
            </div>
          </div>

          {/* 6. Video Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
              <p className="text-sm">Loading official KALAWAR videos...</p>
            </div>
          ) : paginatedVideos.length > 0 ? (
            <div className="space-y-8">
              <Stagger key={`${activeCategory}-${selectedYear}-${currentPage}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedVideos.map((video) => (
                  <StaggerItem key={video.id}>
                    <VideoCard
                      video={video}
                      onOpenVideo={handleOpenVideo}
                    />
                  </StaggerItem>
                ))}
              </Stagger>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className={cn(
                          "w-9 h-9 rounded-xl text-xs font-bold transition-all",
                          isCurrent
                            ? "bg-gold-500 text-stone-950 shadow-md shadow-gold-500/20"
                            : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl bg-stone-900/50 border border-stone-800/60 p-8 space-y-4">
              <Film className="w-12 h-12 text-stone-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-200">No Videos Found</h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto">
                  No video matches your current search or category filter. Try clearing the filters or selecting another category.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                  setSelectedYear("All");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500/20 text-gold-300 hover:bg-gold-500 hover:text-black border border-gold-500/40 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 7. Full-Screen Cinema Theater Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        video={selectedVideo}
        allVideos={filteredVideos}
        onClose={() => setIsVideoModalOpen(false)}
        onSelectVideo={(v) => setSelectedVideo(v)}
      />
    </SiteLayout>
  );
}
