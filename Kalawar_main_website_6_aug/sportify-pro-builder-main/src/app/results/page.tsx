"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Filter,
  X,
  Award,
  Building2,
  Loader2,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import type { DetailedTournamentResult } from "@/data/results-archive";

export type YearBadgeItem = {
  year: number;
  resultId: string;
};

export type DynamicChampionshipSeries = {
  seriesKey: string;
  title: string;
  slug: string;
  discipline: string;
  category: string;
  years: YearBadgeItem[];
};

export default function ResultsPage() {
  const [archives, setArchives] = useState<DetailedTournamentResult[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbDisciplines, setDbDisciplines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [query, setQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All Disciplines");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedYear, setSelectedYear] = useState<string>("All Years");

  useEffect(() => {
    async function loadDynamicResults() {
      try {
        setLoading(true);
        const [resResults, resCats, resDiscs] = await Promise.all([
          fetch("/api/results/championships").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/events/categories").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/events/disciplines").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (resResults && resResults.success && Array.isArray(resResults.results)) {
          setArchives(resResults.results);
        }
        if (resCats && resCats.success && Array.isArray(resCats.categories)) {
          setDbCategories(resCats.categories);
        }
        if (resDiscs && resDiscs.success && Array.isArray(resDiscs.disciplines)) {
          setDbDisciplines(resDiscs.disciplines);
        }
      } catch (err) {
        console.error("Failed to load dynamic championship results:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDynamicResults();
  }, []);

  // Group database archives into Championship Series
  const seriesList = useMemo(() => {
    const groups: Record<string, DynamicChampionshipSeries> = {};

    archives.forEach((item) => {
      // Smart series key: Use custom slug if set, otherwise derive unique slug from title
      const cleanSlug = item.slug && item.slug.trim();
      const derivedFromTitle = item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "";
      const seriesKey = (cleanSlug && cleanSlug !== "national-championship") ? cleanSlug : (derivedFromTitle || item.id);

      if (!groups[seriesKey]) {
        groups[seriesKey] = {
          seriesKey,
          title: item.title,
          slug: cleanSlug || seriesKey,
          discipline: item.discipline || "Martial Arts Combat",
          category: item.category || "National Championship",
          years: [],
        };
      }

      if (item.year && !groups[seriesKey].years.some((y) => y.year === item.year && y.resultId === item.id)) {
        groups[seriesKey].years.push({
          year: item.year,
          resultId: item.id,
        });
      }
    });

    // Sort years descending inside each series
    Object.values(groups).forEach((g) => {
      g.years.sort((a, b) => b.year - a.year);
    });

    return Object.values(groups);
  }, [archives]);

  // Dynamically extract unique disciplines, categories, and years for filter dropdowns
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    dbDisciplines.forEach((d) => set.add(d));
    archives.forEach((a) => {
      if (a.discipline) set.add(a.discipline);
    });
    return ["All Disciplines", ...Array.from(set)];
  }, [archives, dbDisciplines]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    dbCategories.forEach((c) => set.add(c));
    archives.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["All Categories", ...Array.from(set)];
  }, [archives, dbCategories]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    archives.forEach((a) => {
      if (a.year) set.add(a.year);
    });
    const sorted = Array.from(set).sort((a, b) => b - a);
    return ["All Years", ...sorted.map(String)];
  }, [archives]);

  // Filtered championship series
  const filteredSeries = useMemo(() => {
    return seriesList.filter((item) => {
      const matchQuery =
        !query.trim() ||
        (item.title + item.discipline + item.category)
          .toLowerCase()
          .includes(query.trim().toLowerCase());

      const matchDiscipline =
        selectedDiscipline === "All Disciplines" ||
        item.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase());

      const matchCategory =
        selectedCategory === "All Categories" || item.category === selectedCategory;

      const matchYear =
        selectedYear === "All Years" || item.years.some((y) => y.year === parseInt(selectedYear, 10));

      return matchQuery && matchDiscipline && matchCategory && matchYear;
    });
  }, [seriesList, query, selectedDiscipline, selectedCategory, selectedYear]);

  const handleReset = () => {
    setQuery("");
    setSelectedDiscipline("All Disciplines");
    setSelectedCategory("All Categories");
    setSelectedYear("All Years");
  };

  return (
    <SiteLayout>
      {/* Top Header Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8 border-b border-border/60 bg-gradient-to-b from-card/80 via-background to-background text-center px-4 sm:px-6">
        <div className="shell max-w-4xl mx-auto space-y-2">
          <span className="inline-block text-xs sm:text-sm font-black uppercase tracking-widest text-primary">
            CHAMPIONSHIP ARCHIVE
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-gold-gradient">
            RESULTS
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-1">
            Historical championship records, verified medal podiums, and state rankings from official sanctioned seasons.
            Select any year to explore winners, podium placements, and academy medal tallies.
          </p>
        </div>

        {/* Filters Controls Bar */}
        <div className="shell max-w-5xl mx-auto mt-6 sm:mt-8">
          <div className="bg-card/75 border border-primary/25 rounded-2xl p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl space-y-3.5 sm:space-y-4">
            {/* Search Input */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-left mb-1.5">
                Search Results:
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search championships by name, discipline, or category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary transition-colors pr-11 sm:pr-12"
                />
                <div className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-2.5 sm:px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg flex items-center justify-center transition-colors">
                  <Search className="size-3.5 sm:size-4 shrink-0" />
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2.5 sm:pt-3 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                  <Filter className="size-3 text-primary shrink-0" /> Filter:
                </span>

                <div className="grid grid-cols-1 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full">
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="w-full sm:w-auto bg-background/90 border border-border/80 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary truncate"
                  >
                    {availableDisciplines.map((d) => (
                      <option key={d} value={d} className="bg-card text-foreground">
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto bg-background/90 border border-border/80 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary truncate"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c} className="bg-card text-foreground">
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full sm:w-auto bg-background/90 border border-border/80 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary truncate"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y} className="bg-card text-foreground">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs font-semibold text-muted-foreground text-right sm:text-left self-end md:self-auto shrink-0">
                Showing <strong className="text-foreground">{filteredSeries.length}</strong> Championships
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Results Matrix */}
      <section className="section-pad px-4 sm:px-6">
        <div className="shell max-w-6xl mx-auto">
          {/* Active Filters Summary */}
          {(query.trim() || selectedDiscipline !== "All Disciplines" || selectedCategory !== "All Categories" || selectedYear !== "All Years") && (
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 flex-wrap bg-card/60 border border-border/60 rounded-xl p-3 mb-6 sm:mb-8 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-bold text-muted-foreground">Active Filters:</span>
                {selectedDiscipline !== "All Disciplines" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                    Discipline: {selectedDiscipline}
                  </span>
                )}
                {selectedCategory !== "All Categories" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedYear !== "All Years" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                    Year: {selectedYear}
                  </span>
                )}
                {query.trim() && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold font-mono">
                    &quot;{query}&quot;
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-destructive hover:underline font-bold inline-flex items-center gap-1 cursor-pointer ml-auto"
              >
                <X className="size-3" /> Clear Filters
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Loading official championship results archives...</p>
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="luxe-card p-8 sm:p-12 text-center max-w-lg mx-auto bg-card/60 border border-border/80 my-8 sm:my-10 rounded-2xl sm:rounded-3xl">
              <Trophy className="size-10 sm:size-12 text-primary mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">No Results Found</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                No championships match your selected filter criteria. Try resetting the filters.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-5 btn-luxe px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 bg-card/75 border border-primary/25 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
              {filteredSeries.map((series, idx) => (
                <div
                  key={series.seriesKey}
                  className={cn(
                    "grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start lg:items-center group transition-colors py-5 sm:py-8",
                    idx === 0 ? "pt-0" : "",
                    idx === filteredSeries.length - 1 ? "pb-0" : ""
                  )}
                >
                  {/* Left Column: Championship Title & Details */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-bold uppercase">
                        {series.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-xl font-black text-foreground group-hover:text-gold-gradient transition-colors leading-snug">
                      {series.title}
                    </h3>

                    <p className="text-xs text-muted-foreground font-medium">
                      {series.discipline}
                    </p>
                  </div>

                  {/* Right Column: Horizontal Cluster of Gold Year Badges (Exact IBJJF Style) */}
                  <div className="lg:col-span-7 flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 lg:pt-0">
                    {series.years.map((yrItem) => (
                      <Link
                        key={yrItem.resultId}
                        href={`/results/${yrItem.resultId}`}
                        className="px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm text-primary hover:bg-gold-gradient hover:text-background hover:shadow-gold transition-all duration-200 border border-primary/25 hover:scale-105 bg-background/60 inline-flex items-center justify-center min-w-[64px]"
                        title={`View ${series.title} Season ${yrItem.year} Official Results`}
                      >
                        {yrItem.year}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info & Official Verification */}
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="luxe-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
              <div>
                <Award className="size-7 sm:size-8 text-primary mb-2.5" />
                <h4 className="text-sm sm:text-base font-bold text-foreground">Official Championship Diplomas</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Access and download authentic federation participation and podium medal diplomas.
                </p>
              </div>
              <div>
                <Link
                  href="/my-certificates"
                  className="w-full sm:w-auto btn-luxe px-5 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  View My Certificates →
                </Link>
              </div>
            </div>

            <div className="luxe-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
              <div>
                <Building2 className="size-7 sm:size-8 text-amber-400 mb-2.5" />
                <h4 className="text-sm sm:text-base font-bold text-foreground">Annual Competition Calendar</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Browse upcoming 2026 state trials, Grand Prix events, and national championship fixtures.
                </p>
              </div>
              <div>
                <Link
                  href="/events/calendar"
                  className="w-full sm:w-auto rounded-full border border-border/80 bg-background px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  Open 2026 Calendar →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
