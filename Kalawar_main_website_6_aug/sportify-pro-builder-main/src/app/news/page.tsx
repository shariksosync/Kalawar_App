"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Newspaper,
  Loader2,
  Sparkles,
  Megaphone,
  Bell,
  Award,
  FileCheck2,
  RefreshCw,
  ArrowRight,
  Pin,
  Calendar,
  Layers,
  Download,
  Filter,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Stagger, StaggerItem } from "@/components/common/Reveal";
import { NewsCard } from "@/components/cards/Cards";
import type { NewsItem, NewsCategory } from "@/data/content";
import { NEWS_CATEGORIES } from "@/data/content";
import { IMAGES } from "@/data/images";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = ["All", ...NEWS_CATEGORIES] as const;

export default function NewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All Years");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "title">("latest");
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    async function loadNews() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.success && Array.isArray(data.news)) {
          setNewsList(data.news);
        }
      } catch (error) {
        console.error("Failed to load news articles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadNews();
  }, []);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    newsList.forEach((n) => {
      if (n.date) {
        const yr = new Date(n.date).getFullYear().toString();
        if (yr && yr !== "NaN") years.add(yr);
      }
    });
    return ["All Years", ...Array.from(years).sort().reverse()];
  }, [newsList]);

  // Pinned Urgent Announcement (Top Ribbon)
  const pinnedAnnouncement = useMemo(() => {
    return newsList.find(
      (n) => (n.pinned || n.tag === "Urgent" || n.tag === "Featured") && n.status === "Published"
    );
  }, [newsList]);

  // Filter & Sort
  const filteredNews = useMemo(() => {
    const result = newsList.filter((n) => {
      if (n.status === "Draft" || n.status === "Archived") return false;

      const matchesCategory =
        activeCategory === "All" ||
        n.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesYear =
        selectedYear === "All Years" ||
        (n.date && new Date(n.date).getFullYear().toString() === selectedYear);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q) ||
        (n.location && n.location.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q);

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
  }, [newsList, activeCategory, selectedYear, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  const visibleNews = filteredNews.slice((page - 1) * perPage, page * perPage);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setPage(validPage);
    const target = document.getElementById("news-results-grid");
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

  return (
    <SiteLayout>
      {/* 1. Page Hero */}
      <PageHero
        eyebrow="Official Federation Press & Announcements"
        title="KALAWAR NEWS & ANNOUNCEMENTS"
        description="Latest Official Updates, Notices & Announcements. Access federation communiqués, championship notices, belt grading circulars, and institutional accreditations."
        image={IMAGES.ceremony}
      />

      {/* 2. Top Pinned Urgent Announcement Ribbon (if present) */}
      {pinnedAnnouncement && (
        <section className="relative -mt-10 mb-8 z-20">
          <div className="shell">
            <div className="rounded-2xl border border-amber-500/40 bg-card/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-amber-500/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider animate-pulse">
                      <Pin className="size-3" /> Pinned Official Announcement
                    </span>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                      {pinnedAnnouncement.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {new Date(pinnedAnnouncement.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug truncate">
                    {pinnedAnnouncement.title}
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-2 max-w-4xl">
                    {pinnedAnnouncement.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
                  <Link
                    href={`/news/${pinnedAnnouncement.slug}`}
                    className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Read Full Notice</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                  {pinnedAnnouncement.actionLink && (
                    <Link
                      href={pinnedAnnouncement.actionLink}
                      className="border-border/70 hover:border-primary/60 hover:bg-primary/5 text-foreground inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                    >
                      <span>{pinnedAnnouncement.actionText || "View Details"}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Search, Category Pills & Filter Controls */}
      <section className="pb-10 w-full max-w-full overflow-hidden">
        <div className="shell space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6 backdrop-blur-md space-y-4">
            {/* Top Row: Search + Year + Sort */}
            <div className="grid gap-3 md:grid-cols-12 items-center">
              <div className="relative md:col-span-6">
                <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notices by title, keywords, or location..."
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
                      ? newsList.filter((n) => n.status === "Published").length
                      : newsList.filter(
                          (n) =>
                            n.category.toLowerCase() === cat.toLowerCase() &&
                            n.status === "Published"
                        ).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setPage(1);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0",
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
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <RefreshCw className="size-3" /> Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. News Articles Grid */}
          <div id="news-results-grid" className="scroll-mt-24">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading federation announcements...</p>
              </div>
            ) : visibleNews.length > 0 ? (
              <>
                <Stagger
                  key={`news-grid-page-${page}-${activeCategory}-${selectedYear}-${searchQuery}-${sortBy}`}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleNews.map((n) => (
                    <StaggerItem key={n.id} className="min-w-0">
                      <NewsCard item={n} />
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
                  <Newspaper className="size-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">No announcements found</h3>
                <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto leading-relaxed">
                  {searchQuery.trim()
                    ? `No releases match "${searchQuery}". Try searching with different keywords.`
                    : activeCategory !== "All"
                    ? `No published releases under "${activeCategory}" currently.`
                    : "No official press releases published yet. Check back soon."}
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
    </SiteLayout>
  );
}

