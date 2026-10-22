"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Trophy,
  ArrowRight,
  Sparkles,
  Ticket,
  ChevronRight,
  Swords,
  Medal,
  Loader2,
  CheckCircle2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import type { KalawarEvent } from "@/data/kalawar-events";
import { IMAGES } from "@/data/images";
import type { SportEvent } from "@/data/events";
import { cn, formatEventDisplayDate } from "@/lib/utils";

export default function EventsPage() {
  const [flagshipEvents, setFlagshipEvents] = useState<KalawarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<SportEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SportEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<SportEvent[]>([]);
  const [topMedalStates, setTopMedalStates] = useState<Array<{ rank: number; state: string; gold: number; subtitle: string }>>([
    { rank: 1, state: "Maharashtra", gold: 42, subtitle: "National Champion State (42 Golds)" },
    { rank: 2, state: "Karnataka", gold: 36, subtitle: "Runner Up State (36 Golds)" },
    { rank: 3, state: "Delhi", gold: 31, subtitle: "Second Runner Up (31 Golds)" },
  ]);
  const [resultsCount, setResultsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resEvents, resFlag, resResults, resTally] = await Promise.all([
          fetch("/api/events")
            .then(async (r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/kalawar-events")
            .then(async (r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/results/championships")
            .then(async (r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/medal-tally")
            .then(async (r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);

        // 1. Upcoming tournaments & 2. Calendar fixtures
        if (resEvents && resEvents.success && Array.isArray(resEvents.events)) {
          const allEvts = resEvents.events as SportEvent[];
          setAllEvents(allEvts);

          // Filter for upcoming open tournaments
          const upcoming = allEvts
            .filter((e) => e.eventType === "upcoming" || e.status === "Upcoming" || e.status === "Ongoing")
            .slice(0, 3);
          setUpcomingEvents(upcoming.length > 0 ? upcoming : allEvts.slice(0, 3));

          // Filter for calendar fixtures
          const calendar = allEvts
            .filter((e) => e.eventType === "calendar" || e.category?.toLowerCase().includes("calendar") || e.month)
            .slice(0, 3);
          setCalendarEvents(calendar.length > 0 ? calendar : allEvts.slice(0, 3));
        }

        // 3. Flagship Disciplines
        if (resFlag && resFlag.success && Array.isArray(resFlag.events)) {
          setFlagshipEvents(resFlag.events);
        }

        // 4. Results Archives Count
        if (resResults && resResults.success && Array.isArray(resResults.results)) {
          setResultsCount(resResults.results.length);
        }

        // 5. Medal Standings (Top 3 states)
        if (resTally && resTally.success && Array.isArray(resTally.tally) && resTally.tally.length > 0) {
          const sorted = [...resTally.tally].sort((a: any, b: any) => (b.gold || 0) - (a.gold || 0));
          setTopMedalStates([
            {
              rank: 1,
              state: sorted[0]?.state || "Maharashtra",
              gold: sorted[0]?.gold || 42,
              subtitle: `National Champion State (${sorted[0]?.gold || 42} Golds)`,
            },
            {
              rank: 2,
              state: sorted[1]?.state || "Karnataka",
              gold: sorted[1]?.gold || 36,
              subtitle: `Runner Up State (${sorted[1]?.gold || 36} Golds)`,
            },
            {
              rank: 3,
              state: sorted[2]?.state || "Delhi",
              gold: sorted[2]?.gold || 31,
              subtitle: `Second Runner Up (${sorted[2]?.gold || 31} Golds)`,
            },
          ]);
        } else if (resResults && resResults.success && Array.isArray(resResults.results) && resResults.results.length > 0) {
          const stateCounts: Record<string, number> = {};
          resResults.results.forEach((r: any) => {
            if (r.topPodium?.gold?.state) {
              stateCounts[r.topPodium.gold.state] = (stateCounts[r.topPodium.gold.state] || 0) + 1;
            }
            r.athletesResultsByCategory?.forEach((cat: any) => {
              const gold = cat.podium?.find((p: any) => p.place === 1);
              if (gold?.state) {
                stateCounts[gold.state] = (stateCounts[gold.state] || 0) + 1;
              }
            });
          });

          const stateEntries = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
          if (stateEntries.length > 0) {
            setTopMedalStates([
              {
                rank: 1,
                state: stateEntries[0]?.[0] || "Maharashtra",
                gold: stateEntries[0]?.[1] || 12,
                subtitle: `National Champion State (${stateEntries[0]?.[1] || 12} Verified Golds)`,
              },
              {
                rank: 2,
                state: stateEntries[1]?.[0] || "Karnataka",
                gold: stateEntries[1]?.[1] || 8,
                subtitle: `Runner Up State (${stateEntries[1]?.[1] || 8} Verified Golds)`,
              },
              {
                rank: 3,
                state: stateEntries[2]?.[0] || "Delhi",
                gold: stateEntries[2]?.[1] || 5,
                subtitle: `Second Runner Up (${stateEntries[2]?.[1] || 5} Verified Golds)`,
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load events data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <SiteLayout>
      {/* Page Hero */}
      <PageHero
        eyebrow="National Competition Platform"
        title="KALAWAR Events"
        description="Explore the 5 sanctioned national martial arts disciplines, annual competition calendar, upcoming tournament registrations, and real-time championship results."
        image={IMAGES.stadiumNight}
      />

      {/* =========================================================================
          SECTION 1: THE MAIN KALAWAR EVENTS
          ========================================================================= */}
      <section id="five-events" className="section-pad">
        <div className="shell">
          <SectionHeading
            align="center"
            eyebrow="Sanctioned Martial Arts Disciplines"
            title="The Main KALAWAR Events"
            description="Official combat, agility, and heritage formats governed by the KALAWAR Sports & Martial Arts Federation of India."
          />

          <div className="mt-14 space-y-8">
            {flagshipEvents.map((evt, idx) => {
              const disciplineName = evt.name;
              const subtitle = evt.subtitle || "Official Federation Discipline";
              const targetLink = `/events/${evt.slug || evt.id}`;
              const overviewText = evt.introduction?.overview || evt.tagline || evt.objective || "Official combat and martial arts discipline governed by the federation.";
              const matchFormat = evt.rules?.rounds ? evt.rules.rounds.split("(")[0] : "3 rounds x 2 mins";
              const ageDivisionsCount = evt.ageWeight?.length || 0;

              return (
                <Reveal key={evt.id} delay={idx * 0.08}>
                  <div className="luxe-card overflow-hidden border border-border/80 hover:border-primary/50 transition-all group bg-card/60 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-primary/10">
                    <div className="grid lg:grid-cols-12 gap-0 items-center lg:items-stretch">
                      {/* Left: Event Photo Banner */}
                      <div className="lg:col-span-5 relative aspect-[16/9] lg:aspect-[16/10] w-full bg-muted overflow-hidden">
                        <Link href={targetLink} className="block size-full group/img relative">
                          <img
                            src={evt.heroImage || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80"}
                            alt={evt.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80";
                            }}
                            className="size-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                        </Link>

                        {/* Top Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-1.5 z-10">
                          <div className="flex flex-wrap gap-1.5">
                            {evt.marathiName && (
                              <span className="rounded-full bg-background/80 backdrop-blur-md text-amber-300 border border-primary/30 px-2.5 py-1 text-[10px] font-bold">
                                {evt.marathiName}
                              </span>
                            )}
                          </div>

                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-wider shadow-md inline-flex items-center gap-1.5",
                              evt.registrationLive !== false
                                ? "bg-emerald-950/90 text-emerald-400 border border-emerald-500/40"
                                : "bg-black/80 text-muted-foreground border border-white/20"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                evt.registrationLive !== false ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
                              )}
                            />
                            {evt.registrationLive !== false ? "Official Discipline" : "Inactive"}
                          </span>
                        </div>

                        {/* Floating Bottom Discipline Tag */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-[10px]">
                          <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-primary/40 text-primary font-black uppercase tracking-wider shadow-sm">
                            🥋 {disciplineName}
                          </span>
                        </div>
                      </div>

                      {/* Right: Event Details & Sub-Disciplines */}
                      <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                            <div>
                              <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
                                Discipline {idx + 1} of {flagshipEvents.length} • {evt.category || "Sanctioned Format"}
                              </span>
                              <Link href={targetLink}>
                                <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors mt-0.5">
                                  {disciplineName}
                                </h3>
                              </Link>
                              <p className="text-sm font-semibold text-primary mt-0.5">
                                {disciplineName} — {subtitle}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mt-2">
                            {overviewText}
                          </p>

                          {/* If Sangama Kala: Show the 3 Sub-Disciplines pills */}
                          {evt.sangamaKalaSubDisciplines && evt.sangamaKalaSubDisciplines.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border/60">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-2.5">
                                <Swords className="size-3.5" /> Includes Heritage Sub-Disciplines:
                              </span>
                              <div className="grid sm:grid-cols-3 gap-3">
                                {evt.sangamaKalaSubDisciplines.map((sub) => (
                                  <div key={sub.id} className="p-3 rounded-xl bg-background/70 border border-border/70">
                                    <h4 className="text-xs font-bold text-foreground">
                                      {sub.name} <span className="text-primary font-normal">{sub.marathiName ? `(${sub.marathiName})` : ""}</span>
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                      {sub.tagline}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Highlights Grid */}
                          {evt.introduction?.keyHighlights && evt.introduction.keyHighlights.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border/60 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {evt.introduction.keyHighlights.slice(0, 2).map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                                  <span className="truncate">{h}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Luxury Discipline Summary Box (Category, Format, Age Divisions) */}
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-primary/30 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent shadow-inner">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/40">
                                <ShieldCheck className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-tight">Format</span>
                                <span className="text-xs font-bold text-amber-300 truncate block">{matchFormat}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:pl-2 sm:border-l sm:border-border/50">
                              <div className="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/40">
                                <Trophy className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-tight">Category</span>
                                <span className="text-xs font-bold text-foreground truncate block">{evt.category || "Combat Striking"}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:pl-2 sm:border-l sm:border-border/50">
                              <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                                <Users className="size-3.5" />
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-tight">Age Divisions</span>
                                <span className="text-xs font-bold text-emerald-400">{ageDivisionsCount} Brackets</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                              Official Federation Discipline
                            </span>
                          </div>

                          <div className="flex items-center">
                            <Link
                              href={targetLink}
                              className="btn-luxe px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-gold hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer"
                            >
                              <span>Rules &amp; Info</span>
                              <ChevronRight className="size-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: COMPETITION CALENDAR BRIEF (DYNAMIC)
          ========================================================================= */}
      <section className="section-pad border-t border-border/60 bg-accent/20">
        <div className="shell">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Annual Schedule
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                National Competition Calendar 2026
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                Sanctioned state qualifiers, zonal grand prix tournaments, and national championship fixtures.
              </p>
            </div>
            <Link
              href="/events/calendar"
              className="btn-luxe px-5 py-2.5 text-xs font-bold shrink-0 self-start md:self-auto inline-flex items-center gap-1.5"
            >
              View Full 12-Month Calendar <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-6">
              {calendarEvents.map((evt) => {
                const displayDate = evt.month
                  ? `${evt.month} 2026`
                  : evt.startDate
                  ? formatEventDisplayDate(evt.startDate)
                  : "Season 2026";

                return (
                  <div key={evt.id} className="luxe-card p-6 border border-border/80 bg-card/60 flex flex-col justify-between hover:border-primary/50 transition-colors group">
                    <div>
                      <div className="size-12 rounded-2xl bg-primary/15 text-primary grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                        <CalendarDays className="size-6" />
                      </div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        {displayDate}
                      </span>
                      <h4 className="text-base font-bold text-foreground mt-1 group-hover:text-primary transition-colors leading-snug line-clamp-1">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {evt.venue || "Indoor Stadium"}, {evt.city} • {evt.slots ? `${evt.slots} Athletes` : "Sanctioned Fixture"}
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                      <Link href={`/events/${evt.id}`} className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                        Schedule Details <ChevronRight className="size-3" />
                      </Link>
                      <span className="text-[10px] font-mono text-muted-foreground">{evt.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: UPCOMING EVENTS & FIXTURES BRIEF (DYNAMIC LUXURY CARDS)
          ========================================================================= */}
      <section className="section-pad border-t border-border/60 bg-accent/20">
        <div className="shell">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Open Registrations
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                Upcoming Tournaments &amp; Trials
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                Live fixtures accepting online athlete registrations. Verified entry codes and automatic badge generation.
              </p>
            </div>
            <Link
              href="/events/upcoming"
              className="btn-luxe px-5 py-2.5 text-xs font-bold shrink-0 self-start md:self-auto inline-flex items-center gap-1.5"
            >
              View All Upcoming Events <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="luxe-card p-10 text-center max-w-md mx-auto bg-card/60">
              <Ticket className="size-10 text-primary mx-auto mb-3" />
              <h4 className="text-base font-bold text-foreground">Upcoming Fixtures Being Finalized</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Visit the full competition calendar for scheduled month-by-month dates.
              </p>
              <Link href="/events/calendar" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">
                View Calendar →
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((evt) => {
                const targetLink = `/events/${evt.id}`;
                const isOpen = evt.status !== "Closed";

                return (
                  <div
                    key={evt.id}
                    className="luxe-card border border-border/80 hover:border-primary/60 transition-all duration-300 bg-card/80 hover:bg-card shadow-xl rounded-2xl group flex flex-col justify-between overflow-hidden relative hover:-translate-y-1"
                  >
                    <div>
                      {/* Image Poster Header */}
                      <Link href={targetLink} className="block relative h-44 w-full overflow-hidden bg-muted group/img">
                        <img
                          src={evt.image && evt.image.trim() ? evt.image.trim() : "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80"}
                          alt={evt.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80";
                          }}
                          className="size-full object-cover group-hover/img:scale-108 brightness-95 group-hover/img:brightness-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider text-amber-400 border border-white/20 shadow-md">
                            {evt.id}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-wider shadow-md inline-flex items-center gap-1.5",
                              evt.status === "Ongoing"
                                ? "bg-emerald-950/85 text-emerald-400 border border-emerald-500/40"
                                : evt.status === "Completed"
                                ? "bg-black/75 text-muted-foreground border border-white/20"
                                : "bg-primary/25 text-primary border border-primary/40"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                evt.status === "Ongoing"
                                  ? "bg-emerald-400 animate-pulse"
                                  : evt.status === "Completed"
                                  ? "bg-muted-foreground"
                                  : "bg-primary"
                              )}
                            />
                            {evt.status === "Ongoing"
                              ? "OnGoing"
                              : evt.status === "Completed"
                              ? "Completed"
                              : "Upcoming Events"}
                          </span>
                        </div>
                      </Link>

                      {/* Content Area */}
                      <div className="p-4 sm:p-5 space-y-2.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
                          🥋 {evt.discipline}
                        </span>
                        <Link href={targetLink}>
                          <h4 className="text-base font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {evt.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 line-clamp-1">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span>{evt.city} • {evt.venue || "Indoor Stadium"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="p-3.5 bg-background/90 border-t border-border/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registration</span>
                        <span className="text-xs font-black text-emerald-400">Open</span>
                      </div>
                      <Link
                        href={targetLink}
                        className="btn-luxe px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-gold"
                      >
                        Details &amp; Entry →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: RESULTS & MEDAL TALLY BRIEF (DYNAMIC)
          ========================================================================= */}
      <section className="section-pad border-t border-border/60">
        <div className="shell">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Championship Outcomes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                Verified Results &amp; Medal Standing
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                Official podium archives, state rankings, and athlete achievements across all KALAWAR divisions.
              </p>
            </div>
            <Link
              href="/results"
              className="bg-gold-gradient text-background px-5 py-2.5 rounded-full text-xs font-bold shadow-gold hover:scale-105 transition-transform shrink-0 self-start md:self-auto inline-flex items-center gap-1.5"
            >
              Explore Full Results Centre <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rank 1 */}
            <div className="luxe-card p-6 border border-amber-500/30 bg-amber-950/10 text-center flex flex-col justify-between">
              <div>
                <Trophy className="size-8 text-amber-400 mx-auto mb-2" />
                <span className="text-xl sm:text-2xl font-black text-foreground block">
                  #{topMedalStates[0]?.rank || 1} {topMedalStates[0]?.state || "Maharashtra"}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {topMedalStates[0]?.subtitle || "National Champion State (42 Golds)"}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-[11px] font-bold text-amber-400">
                🥇 Gold Spotlight Rank
              </div>
            </div>

            {/* Rank 2 */}
            <div className="luxe-card p-6 border border-border/80 bg-card/60 text-center flex flex-col justify-between">
              <div>
                <Medal className="size-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xl sm:text-2xl font-black text-foreground block">
                  #{topMedalStates[1]?.rank || 2} {topMedalStates[1]?.state || "Karnataka"}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {topMedalStates[1]?.subtitle || "Runner Up State (36 Golds)"}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-[11px] font-bold text-slate-300">
                🥈 Silver Spotlight Rank
              </div>
            </div>

            {/* Rank 3 */}
            <div className="luxe-card p-6 border border-border/80 bg-card/60 text-center flex flex-col justify-between">
              <div>
                <Medal className="size-8 text-amber-600 mx-auto mb-2" />
                <span className="text-xl sm:text-2xl font-black text-foreground block">
                  #{topMedalStates[2]?.rank || 3} {topMedalStates[2]?.state || "Delhi"}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {topMedalStates[2]?.subtitle || "Second Runner Up (31 Golds)"}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-[11px] font-bold text-amber-600">
                🥉 Bronze Spotlight Rank
              </div>
            </div>

            {/* 4th Card: Official Archive */}
            <div className="luxe-card p-6 border border-primary/30 bg-primary/10 text-center flex flex-col justify-between">
              <div>
                <Sparkles className="size-8 text-primary mx-auto mb-2" />
                <span className="text-base font-bold text-foreground block">Official Results Archive</span>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {resultsCount > 0 ? `${resultsCount} Championship Archives Verified` : "Search athlete certificates & medals"}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40">
                <Link href="/results" className="text-xs font-bold text-primary hover:underline inline-flex items-center justify-center gap-1">
                  Open Results Centre <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
