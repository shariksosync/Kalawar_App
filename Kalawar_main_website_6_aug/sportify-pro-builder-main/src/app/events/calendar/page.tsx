"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  Download,
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Building2,
  Ticket,
  ChevronDown,
  X,
  Swords,
  Medal,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { IMAGES } from "@/data/images";
import type { SportEvent } from "@/data/events";
import { cn, formatEventDisplayDate } from "@/lib/utils";

export type CalendarEventItem = {
  id: string;
  monthCode: "JAN" | "FEB" | "MAR" | "APR" | "MAY" | "JUN" | "JUL" | "AUG" | "SEP" | "OCT" | "NOV" | "DEC" | "2027" | string;
  monthName: string;
  yearNum: number;
  monthIndex: number;
  startDate?: string;
  dateRange: string;
  title: string;
  eventSlug?: string;
  discipline: string;
  type: string;
  region: string;
  venue: string;
  city: string;
  rawStatus: "Upcoming" | "Ongoing" | "Completed" | string;
  status: "Upcoming" | "Registration Open" | "Completed" | string;
  badge?: string;
  registrationOpen?: boolean;
};

const ALL_MONTHS = ["ALL", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "2027"] as const;
const MONTH_SHORT_MAP = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

const DEFAULT_CHAMPIONSHIP_TYPES = [
  "National Championship",
  "State Championship & Qualifiers",
  "District & Club Tournament",
  "Selection Trials",
  "Belt & Dan Examination",
  "National Training Camp & Seminar",
  "Referee & Officials Clinic",
] as const;

const DEFAULT_REGIONS = [
  "Maharashtra",
  "Karnataka",
  "Delhi NCR",
  "Rajasthan",
  "Tamil Nadu",
  "Punjab",
  "Kerala",
  "Gujarat",
  "Goa",
  "National",
] as const;

export default function CalendarPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [selectedRegion, setSelectedRegion] = useState<string>("All Regions");
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Upcoming" | "Ongoing" | "Completed">("ALL");

  useEffect(() => {
    async function loadDynamicCalendar() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.success && Array.isArray(json.events)) {
          const calendarList: CalendarEventItem[] = json.events.map((e: any) => {
            let monthCode: string = (e.month || "").toUpperCase().trim();
            let yearNum = e.year || 2026;
            let monthIndex = 0;

            if (e.startDate) {
              const d = new Date(e.startDate);
              if (!isNaN(d.getTime())) {
                monthIndex = d.getMonth();
                monthCode = MONTH_SHORT_MAP[monthIndex] || "APR";
                yearNum = d.getFullYear();
              }
            } else {
              const idx = MONTH_SHORT_MAP.indexOf(monthCode as any);
              if (idx !== -1) monthIndex = idx;
            }
            if (!monthCode) monthCode = "APR";

            const eventRawStatus = (e.status || "Upcoming").trim();
            const isRegLive = e.registrationLive !== false && eventRawStatus !== "Completed";

            return {
              id: e.id,
              monthCode: monthCode,
              monthName: `${monthCode} ${yearNum}`,
              yearNum: yearNum,
              monthIndex: monthIndex,
              startDate: e.startDate,
              dateRange: formatEventDisplayDate(
                e.startDate && e.endDate ? `${e.startDate} – ${e.endDate}` : e.startDate
              ),
              title: e.title,
              eventSlug: e.id,
              discipline: e.discipline,
              type: e.tier || e.category || "National Championship",
              region: (e.city?.includes("Pune") || e.city?.includes("Mumbai") ? "Maharashtra" : e.city?.includes("Bengaluru") ? "Karnataka" : e.city?.includes("Delhi") ? "Delhi NCR" : e.city?.includes("Jaipur") ? "Rajasthan" : "National"),
              venue: e.venue,
              city: e.city,
              rawStatus: eventRawStatus,
              status: eventRawStatus === "Completed" ? "Completed" : isRegLive ? "Registration Open" : "Upcoming",
              registrationOpen: isRegLive,
              badge: e.tier || "Sanctioned Fixture",
            };
          });
          setCalendarEvents(calendarList);
        }
      } catch (err) {
        console.warn("Could not load dynamic calendar:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDynamicCalendar();
  }, []);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: calendarEvents.length,
      upcoming: calendarEvents.filter((e) => {
        const s = (e.rawStatus || "").toLowerCase();
        return s === "upcoming" || (!s.includes("ongoing") && !s.includes("live") && !s.includes("completed"));
      }).length,
      ongoing: calendarEvents.filter((e) => {
        const s = (e.rawStatus || "").toLowerCase();
        return s === "ongoing" || s.includes("live");
      }).length,
      completed: calendarEvents.filter((e) => {
        const s = (e.rawStatus || "").toLowerCase();
        return s === "completed" || s.includes("finish");
      }).length,
    };
  }, [calendarEvents]);

  // Smart Dynamic Tournament Types auto-detected from loaded events + curated federation standards
  const championshipTypes = useMemo(() => {
    const list: string[] = ["All Types"];
    const foundSet = new Set<string>();

    DEFAULT_CHAMPIONSHIP_TYPES.forEach((t) => {
      foundSet.add(t.toLowerCase().trim());
      list.push(t);
    });

    calendarEvents.forEach((e) => {
      if (e.type && !foundSet.has(e.type.toLowerCase().trim())) {
        foundSet.add(e.type.toLowerCase().trim());
        list.push(e.type);
      }
      if (e.discipline && !foundSet.has(e.discipline.toLowerCase().trim())) {
        foundSet.add(e.discipline.toLowerCase().trim());
        list.push(e.discipline);
      }
    });

    return list;
  }, [calendarEvents]);

  // Smart Dynamic Regions auto-detected from loaded events + curated standards
  const availableRegions = useMemo(() => {
    const list: string[] = ["All Regions"];
    const foundSet = new Set<string>();

    DEFAULT_REGIONS.forEach((r) => {
      foundSet.add(r.toLowerCase().trim());
      list.push(r);
    });

    calendarEvents.forEach((e) => {
      if (e.region && !foundSet.has(e.region.toLowerCase().trim())) {
        foundSet.add(e.region.toLowerCase().trim());
        list.push(e.region);
      }
      if (e.city && !foundSet.has(e.city.toLowerCase().trim())) {
        foundSet.add(e.city.toLowerCase().trim());
        list.push(e.city);
      }
    });

    return list;
  }, [calendarEvents]);

  // Filter events based on keyword, type, region, active month, and status
  const filteredEvents = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return calendarEvents.filter((e) => {
      const matchKeyword =
        !q ||
        (e.id + " " + e.title + " " + e.city + " " + e.venue + " " + e.discipline + " " + e.dateRange + " " + (e.eventSlug || ""))
          .toLowerCase()
          .includes(q);

      const matchType =
        selectedType === "All Types" ||
        (e.type && e.type.toLowerCase().includes(selectedType.toLowerCase())) ||
        (e.discipline && e.discipline.toLowerCase().includes(selectedType.toLowerCase())) ||
        (e.title && e.title.toLowerCase().includes(selectedType.toLowerCase()));

      const matchRegion =
        selectedRegion === "All Regions" ||
        (e.region && e.region.toLowerCase().includes(selectedRegion.toLowerCase())) ||
        (e.city && e.city.toLowerCase().includes(selectedRegion.toLowerCase()));

      const matchMonth =
        activeMonthFilter === "ALL"
          ? true
          : activeMonthFilter === "2027"
          ? e.yearNum === 2027
          : e.monthCode === activeMonthFilter;

      const raw = (e.rawStatus || "Upcoming").toLowerCase();
      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "Upcoming"
          ? raw === "upcoming" || (!raw.includes("ongoing") && !raw.includes("live") && !raw.includes("completed"))
          : statusFilter === "Ongoing"
          ? raw === "ongoing" || raw.includes("live")
          : statusFilter === "Completed"
          ? raw === "completed" || raw.includes("finish")
          : true;

      return matchKeyword && matchType && matchRegion && matchMonth && matchStatus;
    });
  }, [calendarEvents, keyword, selectedType, selectedRegion, activeMonthFilter, statusFilter]);

  // Group filtered events by true Year and Month for strict chronological display
  const groupedByMonth = useMemo(() => {
    type MonthGroup = {
      groupKey: string;
      monthCode: string;
      monthName: string;
      yearNum: number;
      monthIndex: number;
      events: CalendarEventItem[];
    };

    const groupsMap: Record<string, MonthGroup> = {};

    filteredEvents.forEach((evt) => {
      const groupKey = `${evt.yearNum}-${String(evt.monthIndex).padStart(2, "0")}`;
      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = {
          groupKey,
          monthCode: evt.monthCode,
          monthName: evt.monthName,
          yearNum: evt.yearNum,
          monthIndex: evt.monthIndex,
          events: [],
        };
      }
      groupsMap[groupKey].events.push(evt);
    });

    const sortedGroups = Object.values(groupsMap).sort((a, b) => {
      if (a.yearNum !== b.yearNum) return a.yearNum - b.yearNum;
      return a.monthIndex - b.monthIndex;
    });

    // Sort fixtures within each month group by startDate ascending
    sortedGroups.forEach((g) => {
      g.events.sort((a, b) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return timeA - timeB;
      });
    });

    return sortedGroups;
  }, [filteredEvents]);

  const handleResetFilters = () => {
    setKeyword("");
    setSelectedType("All Types");
    setSelectedRegion("All Regions");
    setActiveMonthFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <SiteLayout>
      {/* Top Header Section */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-8 border-b border-border/60 bg-gradient-to-b from-card/80 via-background to-background text-center">
        <div className="shell max-w-4xl mx-auto">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary">
            SANCTIONED ANNUAL SCHEDULE
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-gold-gradient mt-2">
            COMPETITION CALENDAR
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Official chronological schedule of all national championships, grand prix circuits, grassroots debut cups, and selection trials across India.
          </p>
        </div>
      </section>

      {/* Quick Month Filter Bar (Gold Pills) */}
      <section className="border-b border-border/60 bg-card/70 py-3.5 sticky top-16 z-30 backdrop-blur-xl">
        <div className="shell">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 px-1.5 -mx-1.5">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 uppercase tracking-wider mr-2 hidden sm:inline-block">
              Filter Month:
            </span>
            {ALL_MONTHS.map((m) => {
              const isActive = activeMonthFilter === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMonthFilter(m)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0",
                    isActive
                      ? "bg-gold-gradient text-background shadow-gold scale-105 font-black"
                      : "bg-background/80 border border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Filter & Content Section */}
      <section className="section-pad bg-background/50 min-h-[60vh]">
        <div className="shell">
          {/* Status Segmented Tabs: All, Upcoming, Ongoing, Completed */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-1.5 -mx-1.5 mb-6">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-2",
                statusFilter === "ALL"
                  ? "bg-gold-gradient text-background font-black shadow-gold scale-105"
                  : "bg-card/80 border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              All Championships ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Upcoming")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-2",
                statusFilter === "Upcoming"
                  ? "bg-primary text-background font-black shadow-gold scale-105"
                  : "bg-card/80 border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="size-3.5" /> Upcoming Events ({statusCounts.upcoming})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Ongoing")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-2",
                statusFilter === "Ongoing"
                  ? "bg-emerald-600 text-white font-black shadow-lg scale-105"
                  : "bg-card/80 border border-emerald-500/30 text-emerald-400 hover:border-emerald-500"
              )}
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              🟢 OnGoing Live Events ({statusCounts.ongoing})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Completed")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-2",
                statusFilter === "Completed"
                  ? "bg-muted text-foreground font-black shadow-lg scale-105 border border-border"
                  : "bg-card/80 border border-border/80 text-muted-foreground hover:border-primary/50"
              )}
            >
              <Trophy className="size-3.5 text-amber-400" /> Completed Events ({statusCounts.completed})
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-card/75 border border-border/80 rounded-2xl p-4 sm:p-6 mb-10 shadow-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Keyword Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Event ID (e.g. EVT-01), title, city..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary pr-9"
                />
                <Search className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Tournament Type Dropdown */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {championshipTypes.map((t) => (
                    <option key={t} value={t} className="bg-card text-foreground">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Dropdown */}
              <div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                >
                  {availableRegions.map((r) => (
                    <option key={r} value={r} className="bg-card text-foreground">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset / Count Actions */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing <strong className="text-foreground font-bold">{filteredEvents.length}</strong> fixtures
                </span>
                {(keyword || selectedType !== "All Types" || selectedRegion !== "All Regions" || activeMonthFilter !== "ALL" || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="size-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">Loading official competition fixtures...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 luxe-card border border-border/70 p-8 max-w-lg mx-auto">
              <CalendarDays className="size-12 text-primary/40 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Fixtures Match Your Selection</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search keywords, month filter, or status selector to view other scheduled championships.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-luxe px-5 py-2 text-xs font-bold mt-4"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Chronological Month-by-Month Grouping */
            <div className="space-y-12">
              {groupedByMonth.map((group) => (
                <div key={group.groupKey} className="space-y-4">
                  {/* Month Header Banner */}
                  <div className="flex items-center gap-3 border-b border-border/80 pb-3">
                    <span className="size-9 rounded-xl bg-gold-gradient text-background font-black text-xs grid place-items-center shadow-gold">
                      {group.monthCode}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-foreground">{group.monthName}</h3>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        {group.events.length} Sanctioned {group.events.length === 1 ? "Event" : "Events"} Scheduled
                      </p>
                    </div>
                  </div>

                  {/* Events List in this Month */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.events.map((evt) => {
                      const s = (evt.rawStatus || "").toLowerCase();
                      const isEvtOngoing = s === "ongoing" || s.includes("live");
                      const isEvtCompleted = s === "completed" || s.includes("finish");

                      return (
                        <Reveal key={evt.id}>
                          <div className="luxe-card border border-border/80 hover:border-primary/50 p-5 sm:p-6 bg-card/75 transition-all group flex flex-col justify-between space-y-4">
                            <div>
                              {/* Top Badges */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-black uppercase">
                                  {evt.type}
                                </span>

                                {/* Dynamic Status Badges */}
                                {isEvtOngoing ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> OnGoing
                                  </span>
                                ) : isEvtCompleted ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-muted/80 text-muted-foreground border border-border">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-primary/20 text-primary border border-primary/30">
                                    Upcoming Events
                                  </span>
                                )}
                              </div>

                              {/* Title & Discipline */}
                              <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                                {evt.title}
                              </h4>
                              <p className="text-xs font-mono text-primary font-semibold mt-1">
                                {evt.discipline}
                              </p>

                              {/* Dates & Location */}
                              <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="size-3.5 text-primary shrink-0" />
                                  <span className="text-foreground font-semibold">{evt.dateRange}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="size-3.5 text-primary shrink-0" />
                                  <span>{evt.venue}, {evt.city}</span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Action Button */}
                            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                ID: {evt.id}
                              </span>
                              {isEvtOngoing ? (
                                <Link
                                  href={`/events/${evt.id}`}
                                  className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                                >
                                  Watch Live <ArrowRight className="size-3.5" />
                                </Link>
                              ) : isEvtCompleted ? (
                                <Link
                                  href={`/events/${evt.id}`}
                                  className="px-3.5 py-1.5 rounded-full border border-amber-400/50 hover:border-amber-400 text-xs text-amber-400 font-bold inline-flex items-center gap-1 hover:bg-amber-400/10 transition-colors"
                                >
                                  View Results <ChevronRight className="size-3" />
                                </Link>
                              ) : evt.registrationOpen ? (
                                <Link
                                  href={`/events/${evt.id}`}
                                  className="btn-luxe px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-gold"
                                >
                                  Register Now <ArrowRight className="size-3.5" />
                                </Link>
                              ) : (
                                <Link
                                  href={`/events/${evt.id}`}
                                  className="px-3.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1"
                                >
                                  View Details <ChevronRight className="size-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
