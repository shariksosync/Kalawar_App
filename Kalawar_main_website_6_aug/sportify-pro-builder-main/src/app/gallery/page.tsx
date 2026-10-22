"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Camera,
  Loader2,
  Sparkles,
  RefreshCw,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  ArrowRight,
  Pin,
  Filter,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Stagger, StaggerItem } from "@/components/common/Reveal";
import { AlbumCard } from "@/components/gallery/AlbumCard";
import { PhotoLightbox } from "@/components/gallery/PhotoLightbox";
import { GallerySwitcher } from "@/components/gallery/GallerySwitcher";
import type { AlbumItem } from "@/data/albums";
import { ALBUM_CATEGORIES } from "@/types/album";
import { IMAGES } from "@/data/images";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = ["All", ...ALBUM_CATEGORIES] as const;

export default function PhotoGalleryPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All Years");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "title">("latest");
  const [page, setPage] = useState(1);
  const perPage = 6;

  // Lightbox state
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function loadAlbums() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/gallery/albums");
        const data = await res.json();
        if (data.success && Array.isArray(data.albums)) {
          setAlbums(data.albums);
        }
      } catch (error) {
        console.error("Failed to load photo albums:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAlbums();
  }, []);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    albums.forEach((a) => {
      if (a.date) {
        const yr = new Date(a.date).getFullYear().toString();
        if (yr && yr !== "NaN") years.add(yr);
      }
    });
    return ["All Years", ...Array.from(years).sort().reverse()];
  }, [albums]);

  // Pinned Flagship Album
  const pinnedAlbum = useMemo(() => {
    return albums.find((a) => a.pinned && a.status === "Published");
  }, [albums]);

  // Filter & Sort
  const filteredAlbums = useMemo(() => {
    const result = albums.filter((a) => {
      if (a.status === "Draft" || a.status === "Archived") return false;

      const matchesCategory =
        activeCategory === "All" ||
        a.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesYear =
        selectedYear === "All Years" ||
        (a.date && new Date(a.date).getFullYear().toString() === selectedYear);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.eventName && a.eventName.toLowerCase().includes(q)) ||
        a.venue.toLowerCase().includes(q) ||
        (a.state && a.state.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q);

      return matchesCategory && matchesYear && matchesSearch;
    });

    if (sortBy === "latest") {
      result.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [albums, activeCategory, selectedYear, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAlbums.length / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  const visibleAlbums = filteredAlbums.slice((page - 1) * perPage, page * perPage);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setPage(validPage);
    const target = document.getElementById("albums-results-grid");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const resetFilters = () => {
    setActiveCategory("All");
    setSelectedYear("All Years");
    setSearchQuery("");
    setSortBy("latest");
    setPage(1);
  };

  const handleOpenLightbox = (album: AlbumItem, initialIndex = 0) => {
    setSelectedAlbum(album);
    setLightboxInitialIndex(initialIndex);
    setLightboxOpen(true);
  };

  return (
    <SiteLayout>
      {/* 1. Page Hero */}
      <PageHero
        eyebrow="Official Federation Photographic Archive"
        title="KALAWAR PHOTO GALLERY"
        description="Official Moments, Championships, Training & Achievements. Browse curated albums capturing the spirit, discipline, and competitive excellence of Indian martial arts."
        image={IMAGES.sparring}
      />

      {/* 2. Top Segmented Switcher (Photos & Videos) */}
      <div className="shell relative -mt-6 z-20">
        <GallerySwitcher />
      </div>

      {/* 3. Flagship Featured Album Banner (if present) */}
      {pinnedAlbum && (
        <section className="pb-8 w-full max-w-full overflow-hidden">
          <div className="shell">
            <div className="rounded-2xl border border-amber-500/40 bg-card/95 p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all hover:border-amber-500/70">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                {/* Left Thumbnail */}
                <div
                  onClick={() => handleOpenLightbox(pinnedAlbum, 0)}
                  className="lg:col-span-5 relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group shrink-0 border border-border/80 shadow-lg"
                >
                  <img
                    src={pinnedAlbum.coverPhoto}
                    alt={pinnedAlbum.title}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="font-bold flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                      <Layers className="size-3.5 text-primary" />
                      {pinnedAlbum.photos.length} Photos in Album
                    </span>
                    <span className="text-amber-300 font-semibold flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                      Click to View ↗
                    </span>
                  </div>
                </div>

                {/* Right Info */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider animate-pulse">
                      <Pin className="size-3" /> Flagship National Album
                    </span>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                      {pinnedAlbum.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="size-3 text-primary" />
                      {new Date(pinnedAlbum.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-snug">
                    {pinnedAlbum.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {pinnedAlbum.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary" />
                      {pinnedAlbum.venue} {pinnedAlbum.state ? `· ${pinnedAlbum.state}` : ""}
                    </span>
                    {pinnedAlbum.photographerCredit && (
                      <span className="flex items-center gap-1 text-amber-300/90">
                        <Camera className="size-3.5" />
                        {pinnedAlbum.photographerCredit}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(pinnedAlbum, 0)}
                      className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Camera className="size-3.5" />
                      <span>Explore Full Album ({pinnedAlbum.photos.length} Photos)</span>
                    </button>

                    {pinnedAlbum.eventLink && (
                      <Link
                        href={pinnedAlbum.eventLink}
                        className="border-border/70 hover:border-primary/60 hover:bg-primary/5 text-foreground inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                      >
                        <span>View Championship Details</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Search & Multi-Filter Bar */}
      <section className="pb-10 w-full max-w-full overflow-hidden">
        <div className="shell space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6 backdrop-blur-md space-y-4">
            {/* Top Row: Search + Year + Sort */}
            <div className="grid gap-3 md:grid-cols-12 items-center">
              <div className="relative md:col-span-6">
                <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search albums by event, venue, state, district..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background/90 border-border/80 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-2.5 pl-10 pr-8 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="md:col-span-3">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="bg-background/90 border-border/80 focus:border-primary text-xs w-full rounded-xl border py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-medium"
                >
                  <option value="latest">Sort: Latest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="title">Sort: Title A–Z</option>
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="border-t border-border/50 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_TABS.map((cat) => {
                  const isSelected = activeCategory === cat;
                  const count =
                    cat === "All"
                      ? albums.filter((a) => a.status === "Published").length
                      : albums.filter(
                          (a) =>
                            a.category.toLowerCase() === cat.toLowerCase() &&
                            a.status === "Published"
                        ).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setPage(1);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer",
                        isSelected
                          ? "bg-gold-gradient text-background shadow-gold scale-105"
                          : "border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <span>{cat}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                          isSelected ? "bg-background/25 text-background" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                {(activeCategory !== "All" ||
                  selectedYear !== "All Years" ||
                  searchQuery !== "") && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <RefreshCw className="size-3" /> Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. Albums Grid */}
          <div id="albums-results-grid" className="scroll-mt-24">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading official photo albums...</p>
              </div>
            ) : visibleAlbums.length > 0 ? (
              <>
                <Stagger
                  key={`albums-grid-page-${page}-${activeCategory}-${selectedYear}-${searchQuery}-${sortBy}`}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleAlbums.map((album) => (
                    <StaggerItem key={album.id} className="min-w-0">
                      <AlbumCard
                        album={album}
                        onOpenLightbox={(alb, idx) => handleOpenLightbox(alb, idx)}
                      />
                    </StaggerItem>
                  ))}
                </Stagger>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold hover:border-primary disabled:opacity-30 disabled:hover:border-border/70 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            "size-8 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            page === pageNum
                              ? "bg-gold-gradient text-background shadow-gold scale-105"
                              : "border border-border/60 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold hover:border-primary disabled:opacity-30 disabled:hover:border-border/70 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center max-w-xl mx-auto">
                <div className="size-14 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center mb-4">
                  <Camera className="size-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">No photo albums found</h3>
                <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto leading-relaxed">
                  {searchQuery.trim()
                    ? `No albums match "${searchQuery}". Try searching with different keywords.`
                    : activeCategory !== "All"
                    ? `No albums published under "${activeCategory}" currently.`
                    : "No official photo albums published yet. Check back soon."}
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Full-Screen Photo Lightbox Modal */}
      <PhotoLightbox
        isOpen={lightboxOpen}
        album={selectedAlbum}
        initialIndex={lightboxInitialIndex}
        onClose={() => {
          setLightboxOpen(false);
          setSelectedAlbum(null);
        }}
      />
    </SiteLayout>
  );
}
