"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  Ticket,
  Search,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  ShieldCheck,
  ArrowRight,
  Trophy,
  X,
  Swords,
  Medal,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import { IMAGES } from "@/data/images";
import { cn, formatEventDisplayDate } from "@/lib/utils";

export type ChampionshipCardData = {
  id: string;
  title: string;
  slug?: string;
  shortTitle: string;
  edition: string;
  discipline: string;
  category: "National Championship" | "Grand Prix" | "Grassroots Debut" | "Heritage Championship" | "State Qualifiers" | "Open Cup" | string;
  dateRange: string;
  dateBadgeColor: string;
  city: string;
  state: string;
  venue: string;
  slots: number;
  entryFee: string;
  image: string;
  badgeLabel?: string;
  status: "Registration Open" | "Upcoming" | "Ongoing" | "Filling Fast" | "Closed" | "Completed" | string;
};

const DEFAULT_DISCIPLINES_LIST = [
  "Santulana",
  "Sparsha Yuddha",
  "Kaya Yuddha",
  "Charana Yuddha",
  "Danda Yuddha",
  "Sangama Yuddha",
] as const;

const DEFAULT_CATEGORIES_LIST = [
  "National Championship",
  "State Championship & Qualifiers",
  "District & Club Tournament",
  "Selection Trials",
  "Belt & Dan Examination",
  "National Training Camp & Seminar",
  "Referee & Officials Clinic",
] as const;

export default function ChampionshipPage() {
  const [championships, setChampionships] = useState<ChampionshipCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All Disciplines");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");

  // Client-Side Pagination State (12 championships per page)
  const EVENTS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedDiscipline, selectedCategory]);

  // Smart Dynamic Disciplines auto-detected from loaded championships + curated standards
  const disciplinesList = useMemo(() => {
    const list: string[] = ["All Disciplines"];
    const foundSet = new Set<string>();

    DEFAULT_DISCIPLINES_LIST.forEach((d) => {
      foundSet.add(d.toLowerCase().trim());
      list.push(d);
    });

    championships.forEach((e) => {
      if (e.discipline && !foundSet.has(e.discipline.toLowerCase().trim())) {
        foundSet.add(e.discipline.toLowerCase().trim());
        list.push(e.discipline);
      }
    });

    return list;
  }, [championships]);

  // Smart Dynamic Categories auto-detected from loaded championships + curated standards
  const categoriesList = useMemo(() => {
    const list: string[] = ["All Categories"];
    const foundSet = new Set<string>();

    DEFAULT_CATEGORIES_LIST.forEach((c) => {
      foundSet.add(c.toLowerCase().trim());
      list.push(c);
    });

    championships.forEach((e) => {
      if (e.category && !foundSet.has(String(e.category).toLowerCase().trim())) {
        foundSet.add(String(e.category).toLowerCase().trim());
        list.push(String(e.category));
      }
    });

    return list;
  }, [championships]);

  useEffect(() => {
    async function loadDynamicChampionships() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.success && Array.isArray(json.events)) {
          // Filter events that are strictly created for the championship section or have CHAMP prefix
          const championshipItems = json.events.filter(
            (e: any) =>
              e.eventType === "championship" ||
              (e.id && String(e.id).toUpperCase().startsWith("CHAMP-"))
          );

          const mappedDb: ChampionshipCardData[] = championshipItems.map((e: any) => ({
            id: e.id,
            title: e.title,
            slug: e.id,
            shortTitle: e.title,
            edition: `${e.year || 2026} Championship Edition`,
            discipline: e.discipline,
            category: (e.tier || e.category || "National Championship") as any,
            dateRange: formatEventDisplayDate(
              e.startDate && e.endDate ? `${e.startDate} – ${e.endDate}` : e.startDate
            ),
            dateBadgeColor: "bg-amber-500 text-black",
            city: e.city,
            state: e.city?.includes("Pune") || e.city?.includes("Mumbai") ? "Maharashtra" : "India",
            venue: e.venue,
            slots: e.slots || 64,
            entryFee: e.entryFee || "Free",
            image: e.image || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
            badgeLabel: e.registrationLive === false || e.status === "Completed" ? "Registration Closed" : "Open for Registration",
            status: e.status || "Upcoming",
          }));

          setChampionships(mappedDb);
        } else {
          setChampionships([]);
        }
      } catch (err) {
        console.error("Failed to load championship fixtures from database:", err);
        setChampionships([]);
      } finally {
        setLoading(false);
      }
    }
    loadDynamicChampionships();
  }, []);

  const filtered = useMemo(() => {
    return championships.filter((e) => {
      const matchQuery =
        !query.trim() ||
        (e.title + e.city + e.state + e.venue + e.discipline + e.shortTitle + e.edition)
          .toLowerCase()
          .includes(query.trim().toLowerCase());

      const matchDiscipline =
        selectedDiscipline === "All Disciplines" ||
        e.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase()) ||
        selectedDiscipline.toLowerCase().includes(e.discipline.toLowerCase());

      const matchCategory =
        selectedCategory === "All Categories" ||
        (e.category && String(e.category).toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (e.title && e.title.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchQuery && matchDiscipline && matchCategory;
    });
  }, [championships, query, selectedDiscipline, selectedCategory]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    return filtered.slice(start, start + EVENTS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleReset = () => {
    setQuery("");
    setSelectedDiscipline("All Disciplines");
    setSelectedCategory("All Categories");
    setCurrentPage(1);
  };

  return (
    <SiteLayout>
      {/* Top Header Section */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-8 border-b border-border/60 bg-gradient-to-b from-card/80 via-background to-background text-center">
        <div className="shell max-w-4xl mx-auto">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary flex items-center justify-center gap-1.5">
            <Swords className="size-4 text-primary" />
            KALAWAR FEDERATION CHAMPIONSHIPS
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-gold-gradient mt-2">
            CHAMPIONSHIPS
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Official sanctioned championship tournaments, state title qualifiers, and national medal divisions.
            Select your discipline or search by championship name, city, and category.
          </p>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="shell max-w-5xl mx-auto mt-8">
          <div className="bg-card/75 border border-primary/25 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
            {/* Search Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-left mb-1.5">
                Search Championships:
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search by championship title, host city, state, venue, or martial arts discipline..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary transition-colors pr-12"
                />
                <div className="absolute right-2 top-2 bottom-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg flex items-center justify-center transition-colors">
                  <Search className="size-4" />
                </div>
              </div>
            </div>

            {/* Discipline & Category Filter Pills / Dropdowns */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
                  <Filter className="size-3 text-primary" /> Filter:
                </span>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="bg-background/90 border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                >
                  {disciplinesList.map((d) => (
                    <option key={d} value={d} className="bg-card text-foreground">
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-background/90 border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c} className="bg-card text-foreground">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-semibold text-muted-foreground self-end sm:self-auto">
                Showing{" "}
                <strong className="text-foreground">
                  {filtered.length > 0 ? (currentPage - 1) * EVENTS_PER_PAGE + 1 : 0}–{Math.min(currentPage * EVENTS_PER_PAGE, filtered.length)}
                </strong>{" "}
                of <strong className="text-foreground">{filtered.length}</strong> Championships
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAMPIONSHIP GRID (WITH REAL HIGH-DEFINITION ACTION POSTERS)
          ========================================================================= */}
      <section className="section-pad" id="championships-grid">
        <div className="shell max-w-6xl mx-auto">
          {/* Active Filter Pills Summary */}
          {(query.trim() || selectedDiscipline !== "All Disciplines" || selectedCategory !== "All Categories") && (
            <div className="flex items-center justify-between gap-3 flex-wrap bg-card/60 border border-border/60 rounded-xl p-3 mb-8 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
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
                {query.trim() && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold font-mono">
                    &quot;{query}&quot;
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-destructive hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="size-3" /> Clear Filters
              </button>
            </div>
          )}

          {/* Loading / Empty / Grid State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 my-6">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground mt-3 font-semibold">Loading sanctioned championship fixtures...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="luxe-card p-12 text-center max-w-lg mx-auto bg-card/60 border border-border/80 my-10">
              <Trophy className="size-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Championships Found</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                No championship tournaments match your current filters. Try searching for a different keyword or resetting your filters.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-5 btn-luxe px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            /* Championship Cards Grid (With Action Poster Images) */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {paginatedEvents.map((evt) => {
                  const targetLink = evt.slug ? `/events/${evt.slug}` : `/events/${evt.id}`;
                  const isOpen = evt.status !== "Closed" && evt.badgeLabel !== "Registration Closed";

                  return (
                    <div
                      key={evt.id}
                      className="luxe-card border border-border/80 hover:border-primary/60 transition-all duration-300 bg-card/85 hover:bg-card shadow-xl hover:shadow-2xl hover:shadow-primary/10 rounded-2xl group flex flex-col justify-between overflow-hidden relative hover:-translate-y-1"
                    >
                      <div>
                        {/* Top: 16:9 High-Definition Poster Banner */}
                        <Link href={targetLink} className="block relative aspect-[16/9] w-full overflow-hidden bg-muted group/img">
                          <img
                            src={evt.image && evt.image.trim() ? evt.image.trim() : "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80"}
                            alt={evt.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80";
                            }}
                            className="size-full object-cover group-hover/img:scale-105 transition-all duration-500"
                          />

                          {/* Top Clean Badges */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider text-amber-400 border border-white/20 shadow-md">
                              {evt.id}
                            </span>
                            
                            {/* Single Clean Status Badge */}
                            {evt.status === "Ongoing" ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Live Now
                              </span>
                            ) : evt.status === "Completed" ? (
                              <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-muted-foreground border border-white/20 text-[10px] font-black uppercase tracking-wider shadow-md">
                                Completed
                              </span>
                            ) : isOpen ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Open for Registration
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-950/85 backdrop-blur-md text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-md">
                                🔒 Closed
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Middle Body Metadata Area */}
                        <div className="p-4 sm:p-5 space-y-3">
                          {/* Top Meta Line: Edition + Discipline + Tier */}
                          <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold text-muted-foreground">
                            <span className="text-primary font-black uppercase tracking-wider">
                              {evt.edition}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-wide">
                              🥋 {evt.discipline}
                            </span>
                          </div>

                          <div>
                            <Link href={targetLink}>
                              <h4 className="text-base font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                {evt.title}
                              </h4>
                            </Link>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 line-clamp-1">
                              <MapPin className="size-3.5 text-primary shrink-0" />
                              <span>{evt.venue}, {evt.city}</span>
                            </p>
                          </div>

                          {/* Streamlined Luxury Schedule & Slots Bar */}
                          <div className="p-2.5 rounded-xl border border-primary/25 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent flex items-center justify-between gap-2 shadow-inner">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/40">
                                <CalendarDays className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">Dates</span>
                                <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">{evt.dateRange}</span>
                              </div>
                            </div>
                            <div className="text-right pl-3 border-l border-border/60 shrink-0">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">Slots</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">{evt.slots}</span>
                            </div>
                          </div>

                          {/* Tier Label */}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                            <span>Championship Tier</span>
                            <span className="font-bold text-foreground">{evt.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Card Action Footer */}
                      <div className="p-3.5 bg-background/90 border-t border-border/60 flex items-center justify-between gap-2">
                        <Link
                          href={targetLink}
                          className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group/link"
                        >
                          Rules &amp; Info <ChevronRight className="size-3 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                          href={targetLink}
                          className="btn-luxe px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-gold hover:scale-105 transition-transform"
                        >
                          <Ticket className="size-3.5" /> Register
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-border/80 bg-card hover:bg-card/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="flex items-center gap-1 text-xs font-bold">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={cn(
                          "size-8 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          currentPage === pg
                            ? "bg-primary text-background border-primary shadow-gold"
                            : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                        )}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-border/80 bg-card hover:bg-card/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
