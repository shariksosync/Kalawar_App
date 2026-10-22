"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  ArrowLeft,
  Loader2,
  Sparkles,
  Award,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Clock,
  Trophy,
  Phone,
  Mail,
  ChevronRight,
  Maximize2,
  X,
  FileCheck,
  Building2,
  BookOpen,
  Scale,
  Target,
  Swords,
  Play,
  Download,
  AlertTriangle,
  Flame,
  Medal,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import type { SportEvent } from "@/data/events";
import type { KalawarEvent, SangamaKalaSubDiscipline } from "@/data/kalawar-events";
import { TournamentCalendarDetailView } from "@/components/events/TournamentCalendarDetailView";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { useCountdown } from "@/hooks/useCountdown";
import { useAuth } from "@/lib/auth-context";
import { IMAGES } from "@/data/images";
import { federation } from "@/constants/navigation";
import { parseVideoSource } from "@/lib/video-utils";
import { cn } from "@/lib/utils";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const [kalawarEvent, setKalawarEvent] = useState<KalawarEvent | undefined>(undefined);

  const [event, setEvent] = useState<SportEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setNotFoundState(false);

        const rawId = resolvedParams.eventId.trim();
        const cleanId = rawId.replace(/^KE-/i, "");
        const isTournament = cleanId.toUpperCase().startsWith("EVT-CAL-") || /^EVT-\d{4}-\d+/i.test(cleanId);

        if (isTournament) {
          // Strictly a Tournament Calendar Event -> Only query /api/events/[id]
          try {
            const res = await fetch(`/api/events/${encodeURIComponent(cleanId)}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.event) {
                if (isMounted) {
                  setEvent(json.event);
                  setKalawarEvent(undefined);
                  setNotFoundState(false);
                  setLoading(false);
                }
                return;
              }
            }
          } catch (err) {
            console.warn("Error fetching tournament event:", err);
          }

          if (isMounted) {
            setNotFoundState(true);
            setLoading(false);
          }
          return;
        }

        // Priority 1: Check tournament in /api/events/[id] with cleanId
        try {
          const resTournament = await fetch(`/api/events/${encodeURIComponent(cleanId)}`);
          if (resTournament.ok) {
            const jsonTournament = await resTournament.json();
            if (jsonTournament.success && jsonTournament.event) {
              if (isMounted) {
                setEvent(jsonTournament.event);
                setKalawarEvent(undefined);
                setNotFoundState(false);
                setLoading(false);
              }
              return;
            }
          }
        } catch {
          // not found
        }

        // Priority 2: Flagship Kalawar Event / Discipline
        try {
          const resKalawar = await fetch(`/api/kalawar-events/${encodeURIComponent(rawId)}`);
          if (resKalawar.ok) {
            const jsonKalawar = await resKalawar.json();
            if (jsonKalawar.success && jsonKalawar.event) {
              if (isMounted) {
                setKalawarEvent(jsonKalawar.event);
                setEvent(null);
                setNotFoundState(false);
                setLoading(false);
              }
              return;
            }
          }
        } catch {
          // continue fallback
        }

        // Neither was found
        if (isMounted) {
          setNotFoundState(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load event:", err);
        if (isMounted) {
          setNotFoundState(true);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.eventId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading event details...</p>
        </div>
      </SiteLayout>
    );
  }

  // If this is a flagship KALAWAR discipline:
  if (kalawarEvent) {
    return <KalawarEventDetailContent event={kalawarEvent} />;
  }

  // Otherwise, handle regular tournament fixtures
  if (notFoundState || !event) {
    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-3xl bg-accent/40 text-primary grid place-items-center mb-4 border border-primary/20 shadow-gold">
            <CalendarDays className="size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-md">
            The event &quot;{resolvedParams.eventId}&quot; could not be located in the federation registry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              href="/events"
              className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-gold hover:scale-105 transition-transform"
            >
              <ArrowLeft className="size-4" /> Back to Disciplines &amp; Events
            </Link>
            <Link
              href="/events/calendar"
              className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-6 py-3 text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <CalendarDays className="size-4 text-primary" /> View Calendar
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return <TournamentCalendarDetailView event={event} />;
}

/* =========================================================================
   FLAGSHIP KALAWAR DISCIPLINE DETAIL VIEW (DYNAMIC)
   ========================================================================= */
function KalawarEventDetailContent({ event }: { event: KalawarEvent }) {
  const [activeTab, setActiveTab] = useState<
    "intro" | "rules" | "scoring" | "categories" | "equipment" | "media" | "results"
  >("intro");

  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    videoUrl?: string;
    desc?: string;
    duration?: string;
    thumb?: string;
  } | null>(null);

  const [activePhoto, setActivePhoto] = useState<{
    src: string;
    title: string;
    category?: string;
  } | null>(null);

  const [allKalawarList, setAllKalawarList] = useState<KalawarEvent[]>([]);

  useEffect(() => {
    fetch("/api/kalawar-events")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.events)) {
          setAllKalawarList(data.events);
        }
      })
      .catch(() => {});
  }, []);

  const activeAgeDivisions = useMemo(() => {
    const list = (event.ageWeight || []).filter((aw) => aw.active !== false);
    return list.length > 0 ? list : (event.ageWeight || []);
  }, [event.ageWeight]);

  const [selectedCategoryAge, setSelectedCategoryAge] = useState<string>(
    event.ageWeight?.[0]?.group || "U-8"
  );
  const [selectedCategoryGender, setSelectedCategoryGender] = useState<"male" | "female">("male");

  const currentAgeDivision =
    activeAgeDivisions.find((aw) => aw.group === selectedCategoryAge) ||
    activeAgeDivisions[0];

  const isOpenDivision =
    currentAgeDivision &&
    (currentAgeDivision.group.toLowerCase().includes("open") ||
      (currentAgeDivision.weightClassesMale || []).some((w) =>
        w.toLowerCase().includes("open weight")
      ));

  const [selectedSubDiscipline, setSelectedSubDiscipline] = useState<string>(
    event.sangamaKalaSubDisciplines && event.sangamaKalaSubDisciplines.length > 0
      ? event.sangamaKalaSubDisciplines[0].id
      : ""
  );

  const activeSub = event.sangamaKalaSubDisciplines?.find((s) => s.id === selectedSubDiscipline);

  const relatedEvents = allKalawarList.filter(
    (e) =>
      e.id !== event.id &&
      ((event.relatedEventSlugs || []).includes(e.slug) ||
        (event.relatedEventSlugs || []).includes(e.id) ||
        (event.relatedEventSlugs || []).length === 0)
  ).slice(0, 3);

  const isSantulana =
    event.hasWeightCategories === false ||
    event.slug === "santulana" ||
    event.id === "KE-03";

  const SANTULANA_EVALUATION_CRITERIA = [
    {
      id: 1,
      title: "Dynamic Footwork & Agility",
      marathi: "चपळता आणि वेग",
      desc: "Speed, fluidity, and lateral transitions across marker points without step hesitation.",
      icon: Flame,
    },
    {
      id: 2,
      title: "Body Balance & Posture Control",
      marathi: "शरीराचा समतोल",
      desc: "Center-of-gravity stabilization during high-speed direction changes and pivots.",
      icon: Scale,
    },
    {
      id: 3,
      title: "Reaction Time & Reflexes",
      marathi: "प्रतिक्रिया वेळ व सजगता",
      desc: "Response latency to auditory and visual directional change commands.",
      icon: Sparkles,
    },
    {
      id: 4,
      title: "Coordination & Fluidity",
      marathi: "समन्वय व लयबद्ध हालचाल",
      desc: "Synchronization of upper-limb and lower-limb movement mechanics under tempo.",
      icon: Target,
    },
    {
      id: 5,
      title: "Core Stability & Recovery",
      marathi: "कोअर संतुलन व स्थिरता",
      desc: "Instant re-centering of core posture following obstacles or airborne landing.",
      icon: ShieldCheck,
    },
    {
      id: 6,
      title: "Stamina & Pace Control",
      marathi: "दमसास व गती नियंत्रण",
      desc: "Endurance maintenance across multi-station agility circuits without pace deceleration.",
      icon: Clock,
    },
    {
      id: 7,
      title: "Technical Precision",
      marathi: "तांत्रिक अचूकता",
      desc: "Exact foot placement within demarcated grids and zero line violation faults.",
      icon: Award,
    },
    {
      id: 8,
      title: "Timed Course Completion",
      marathi: "अंतिम वेळ व कामगिरी",
      desc: "Total stopwatch course run time recorded precisely in tenths of a second.",
      icon: Trophy,
    },
  ];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  const tabs = [
    { id: "intro", label: "Introduction", icon: BookOpen },
    { id: "rules", label: "Rules & Format", icon: Scale },
    { id: "scoring", label: "Scoring System", icon: Target },
    { id: "categories", label: isSantulana ? "Agility Criteria & Divisions" : "Categories & Weights", icon: Users },
    { id: "equipment", label: "Equipment & Gear", icon: ShieldCheck },
    { id: "media", label: "Photos & Videos", icon: Play },
    { id: "results", label: "Results & Champions", icon: Trophy },
  ] as const;

  return (
    <SiteLayout>
      {/* Top Breadcrumb Header */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-3 border-b border-border/40 bg-card/40">
        <div className="shell flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="size-3.5 opacity-60 shrink-0" />
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <ChevronRight className="size-3.5 opacity-60 shrink-0" />
            <span className="text-foreground font-semibold truncate max-w-[180px] sm:max-w-xs">{event.name}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleShare}
              className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="size-3.5" /> Share Event
            </button>
            <Link
              href="/events/calendar"
              className="rounded-full bg-gold-gradient text-background px-3.5 sm:px-4 py-1.5 text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <CalendarDays className="size-3.5" /> View Calendar
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 border-b border-border/60 bg-gradient-to-b from-card/90 via-background to-background">
        <div className="absolute inset-0 opacity-15">
          <img src={event.heroImage} alt={event.name} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        </div>

        <div className="shell relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* Left Details Column */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  {event.badge}
                </span>
                {event.marathiName && (
                  <span className="rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold">
                    {event.marathiName}
                  </span>
                )}
                <span className="rounded-full bg-accent/40 border border-border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-muted-foreground">
                  Sanctioned National Discipline
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight break-words">
                {event.name}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl font-bold text-primary mt-1.5 sm:mt-2">
                {event.subtitle}
              </p>
              <p className="text-xs sm:text-base text-muted-foreground mt-3 sm:mt-4 leading-relaxed max-w-2xl">
                {event.tagline}
              </p>

              {/* Skills Tags */}
              {event.skills && event.skills.length > 0 && (
                <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider mr-1">Skills:</span>
                  {event.skills.map((skill, si) => (
                    <span
                      key={si}
                      className="rounded-full bg-primary/10 border border-primary/25 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-primary"
                    >
                      ⚡ {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href="/downloads"
                  className="w-full sm:w-auto bg-gold-gradient text-background px-6 py-3 rounded-full text-xs sm:text-sm font-bold shadow-gold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 text-center"
                >
                  <Download className="size-4 shrink-0" /> Official Rulebook (PDF)
                </a>
              </div>
            </div>

            {/* Right: High-Definition Action Showcase Poster Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary/40 shadow-[0_0_50px_rgba(234,179,8,0.2)] bg-card/90 group h-64 sm:h-80 lg:h-96 w-full">
                <img
                  src={event.heroImage}
                  alt={event.name}
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-transparent" />
                <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 flex items-center justify-between text-xs">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white font-bold text-[11px] sm:text-xs">
                    Official Discipline Action
                  </span>
                  <span className="px-2.5 sm:px-3 py-1 rounded-full bg-primary text-background font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-gold">
                    {event.badge}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Navigation */}
      <section className="sticky top-14 sm:top-16 z-30 border-b border-border/60 bg-card/90 backdrop-blur-xl py-2 px-2 sm:px-0">
        <div className="shell overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-gold-gradient text-background shadow-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Tab Content Area */}
      <section className="section-pad">
        <div className="shell max-w-5xl mx-auto">
          {/* TAB 1: INTRODUCTION */}
          {activeTab === "intro" && (
            <Reveal>
              <div className="space-y-10">
                <div className="luxe-card p-6 sm:p-10 border border-border/80 bg-card/60">
                  <span className="text-xs font-mono font-bold text-primary uppercase">01 / Overview</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
                    About {event.name}
                  </h2>
                  <p className="mt-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
                    {event.introduction?.overview || event.tagline || "Official sanctioned discipline."}
                  </p>

                  {/* Objective Box */}
                  {event.objective && (
                    <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                        Official Discipline Objective
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-amber-200 mt-1 leading-relaxed">
                        🎯 {event.objective}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60 flex flex-col justify-between">
                    <div>
                      <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center mb-3">
                        <Flame className="size-5" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">Martial Philosophy</h3>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {event.introduction?.philosophy || "Cultivating spirit, technical discipline, humility, and mental fortitude under pressure."}
                      </p>
                    </div>
                  </div>

                  <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60 flex flex-col justify-between">
                    <div>
                      <div className="size-10 rounded-xl bg-amber-500/15 text-amber-400 grid place-items-center mb-3">
                        <BookOpen className="size-5" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">Historical Roots &amp; Evolution</h3>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {event.introduction?.historicalRoots || "Derived from authentic Indian martial traditions and adapted into safe modern competitive sports formats."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Highlights */}
                {event.introduction?.keyHighlights && event.introduction.keyHighlights.length > 0 && (
                  <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                    <h3 className="text-lg font-bold text-foreground mb-4">Key Event Highlights</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {event.introduction.keyHighlights.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-border/50">
                          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-foreground/90 leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* TAB 2: RULES & FORMAT */}
          {activeTab === "rules" && (
            <Reveal>
              <div className="space-y-8">
                {/* Format & Rounds Overview */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="luxe-card p-6 border border-border/80 bg-card/60">
                    <span className="text-xs font-mono font-bold text-primary uppercase">Arena Standard</span>
                    <h3 className="text-lg font-bold text-foreground mt-1">Combat Ring / Mat Dimensions</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">{event.rules?.format || "Standard 8m x 8m padded combat arena."}</p>
                  </div>

                  <div className="luxe-card p-6 border border-border/80 bg-card/60">
                    <span className="text-xs font-mono font-bold text-primary uppercase">Timing Protocol</span>
                    <h3 className="text-lg font-bold text-foreground mt-1">Match Rounds &amp; Rest Periods</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">{event.rules?.rounds || "3 rounds of 2 minutes (1 min rest)."}</p>
                  </div>
                </div>

                {/* Sangama Kala Special Sub-Disciplines Switcher if viewing Sangama Kala */}
                {event.sangamaKalaSubDisciplines && (
                  <div className="luxe-card p-6 sm:p-8 border border-primary/40 bg-gradient-to-br from-primary/10 via-card/70 to-card">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 mb-6">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Pillars of Sangama Kala
                        </span>
                        <h3 className="text-xl font-bold text-foreground mt-1">
                          Select Sub-Discipline Rulebook
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {event.sangamaKalaSubDisciplines.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedSubDiscipline(sub.id)}
                            className={cn(
                              "rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
                              selectedSubDiscipline === sub.id
                                ? "bg-primary text-background font-bold shadow-gold"
                                : "border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {sub.name} {sub.marathiName ? `(${sub.marathiName})` : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeSub && (
                      <div className="space-y-4">
                        <h4 className="text-base sm:text-lg font-bold text-foreground">{activeSub.name} – {activeSub.tagline}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{activeSub.description}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 pt-4">
                          <div className="p-4 rounded-xl bg-background/70 border border-border/60">
                            <h5 className="text-xs font-bold uppercase text-primary mb-2">Specific Rules:</h5>
                            <ul className="space-y-1.5 text-xs text-foreground/90">
                              {activeSub.rules.map((r, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 rounded-xl bg-background/70 border border-border/60">
                            <h5 className="text-xs font-bold uppercase text-primary mb-2">Scoring &amp; Pinning:</h5>
                            <ul className="space-y-1.5 text-xs text-foreground/90">
                              {activeSub.scoring.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Target className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legal Targets vs Prohibited Strikes */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="luxe-card p-6 sm:p-8 border border-emerald-500/30 bg-emerald-950/10">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="size-5" /> Authorized Legal Target Zones
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90">
                      {(event.rules?.legalTargets || ["Federation approved strike target areas", "Torso & chest protector surface"]).map((t, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="luxe-card p-6 sm:p-8 border border-destructive/30 bg-destructive/10">
                    <h3 className="text-base sm:text-lg font-bold text-destructive flex items-center gap-2 mb-4">
                      <AlertTriangle className="size-5" /> Prohibited Techniques &amp; Fouls
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90">
                      {(event.rules?.prohibitedTechniques || ["Striking behind the spine or throat", "Uncontrolled malicious force"]).map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="size-1.5 rounded-full bg-destructive shrink-0 mt-2" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Penalties & Officiating Protocol */}
                <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">Fouls &amp; Penalty Escalation</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {(event.rules?.foulsAndPenalties || ["Tier 1: Official verbal caution", "Tier 2: Penalty point to opponent", "Tier 3: Disqualification"]).map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-background/60 border border-border/60">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Tier {i + 1}</span>
                        <p className="text-xs sm:text-sm font-semibold text-foreground mt-1">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary shrink-0" />
                    <span><strong>Judging Protocol:</strong> {event.rules?.judgingProtocol || "Panel of certified referee and corner judges measuring accuracy and technical execution."}</span>
                  </div>
                </div>

                {/* Page 5 Rules & Regulations: Age & Weight Categories Protocol */}
                <div className="luxe-card p-6 sm:p-8 border border-primary/40 bg-gradient-to-br from-primary/10 via-card/70 to-card space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                        Official Federation Handbook • Page 5
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                        Age &amp; Weight Categories Regulations
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold font-mono self-start sm:self-auto">
                      Standard Federation Protocol
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Official Age Categories */}
                    <div className="p-4 rounded-2xl bg-background/70 border border-border/70 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                          <CalendarDays className="size-4" /> Age Categories
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-3">Standard approved age divisions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["U-8", "U-10", "U-12", "U-14", "U-17", "U-19", "Open Category – All Ages"].map((age) => (
                            <span
                              key={age}
                              className="px-2 py-1 rounded-lg bg-primary/15 text-primary text-xs font-bold border border-primary/25"
                            >
                              {age}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/40">
                        7 Official Divisions
                      </div>
                    </div>

                    {/* 2. U-19 Weight Categories (12 brackets) */}
                    <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                          <Scale className="size-4" /> U-19 Weight Brackets
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">12 official competition brackets:</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-blue-300">
                          {[
                            "Under 40 kg",
                            "40–45 kg",
                            "45–50 kg",
                            "50–55 kg",
                            "55–60 kg",
                            "60–65 kg",
                            "65–70 kg",
                            "70–75 kg",
                            "75–80 kg",
                            "80–85 kg",
                            "85–90 kg",
                            "Above 90 kg",
                          ].map((w) => (
                            <div key={w} className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-center">
                              {w}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-400/80 font-mono pt-2 border-t border-blue-500/20">
                        12 Standard Brackets
                      </div>
                    </div>

                    {/* 3. Open Category Protocol */}
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                          <Trophy className="size-4" /> Open Category
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">Protocol for Open Division:</p>
                        <ul className="space-y-1.5 text-xs text-foreground/90">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Open Weight Category:</strong> No fixed weight limit.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>Final grouping / draw as per respective Championship &amp; Event Regulations.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="text-[10px] text-amber-400/80 font-mono pt-2 border-t border-amber-500/20">
                        All Ages &bull; Open Weight
                      </div>
                    </div>

                    {/* 4. Santulana Protocol */}
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                          <Flame className="size-4" /> Santulana Protocol
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2">Agility &amp; form discipline:</p>
                        <ul className="space-y-1.5 text-xs text-foreground/90">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span><strong>No Weight Category:</strong> Purely performance-based.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Judged on agility, footwork speed, posture control &amp; technical form.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="text-[10px] text-emerald-400/80 font-mono pt-2 border-t border-emerald-500/20">
                        Performance Metric Based
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* TAB 3: SCORING SYSTEM */}
          {activeTab === "scoring" && (
            <Reveal>
              <div className="space-y-8">
                <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                  <span className="text-xs font-mono font-bold text-primary uppercase">Scoring Protocol</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Official Point Matrix</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">{event.scoring?.system || "Standard electronic point scoring system."}</p>

                  <div className="mt-6 divide-y divide-border/60">
                    {(event.scoring?.pointMatrix || [
                      { action: "Clean Direct Strike", points: "1 Point", description: "Clean contact to authorized legal target zone." },
                      { action: "Combination Technique", points: "2 Points", description: "Multi-strike combination landing without reply." },
                    ]).map((item, idx) => (
                      <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">{item.action}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-3.5 py-1 text-xs font-bold shrink-0 self-start sm:self-center">
                          {item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="luxe-card p-6 border border-border/80 bg-card/60">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                      <Target className="size-4 text-primary" /> Valid Scoring Criteria
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                      {(event.scoring?.criteria || ["Clean impact on legal targets", "Good balance and stance"]).map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="luxe-card p-6 border border-border/80 bg-card/60">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
                      <Trophy className="size-4 text-amber-400" /> Match Victory Conditions
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                      {(event.scoring?.winConditions || ["Highest point score at match expiration", "Referee stoppage of contest"]).map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Medal className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* TAB 4: CATEGORIES & WEIGHTS / SANTULANA AGILITY CRITERIA */}
          {activeTab === "categories" && (
            <Reveal>
              <div className="space-y-8">
                {/* Santulana: No Weight Categories Presentation */}
                {isSantulana ? (
                  <div className="space-y-8">
                    {/* Notice Banner */}
                    <div className="luxe-card p-6 sm:p-8 border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                            <Scale className="size-3.5" /> Agility &amp; Performance Discipline
                          </span>
                          <h3 className="text-2xl font-black text-foreground mt-2">
                            NO WEIGHT CATEGORIES (वजन गट नाहीत ❌)
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                            Kalawar Santulana is evaluated purely on balance, agility, reflexes, coordination, and timed obstacle execution. All athletes within each age division compete under a standardized agility course matrix regardless of bodyweight.
                          </p>
                        </div>

                        <Link
                          href={`/register/player?discipline=${encodeURIComponent(event.name)}`}
                          className="bg-gold-gradient text-background px-5 py-2.5 rounded-full text-xs font-bold shadow-gold hover:scale-105 transition-transform inline-flex items-center gap-2"
                        >
                          <Ticket className="size-4" /> Register in Santulana
                        </Link>
                      </div>
                    </div>

                    {/* 8 Official Agility Evaluation Criteria Cards */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-primary uppercase">Evaluation Protocol</span>
                          <h4 className="text-xl font-bold text-foreground">8 Official Agility &amp; Performance Criteria</h4>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">Standardized Scoring 1–10 Points</span>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {SANTULANA_EVALUATION_CRITERIA.map((crit) => {
                          const Icon = crit.icon;
                          return (
                            <div
                              key={crit.id}
                              className="luxe-card p-5 border border-border/80 bg-card/60 flex flex-col justify-between hover:border-primary/40 transition-colors"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center">
                                    <Icon className="size-4" />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-primary">0{crit.id}</span>
                                </div>
                                <h5 className="text-sm font-bold text-foreground">{crit.title}</h5>
                                <p className="text-[11px] font-semibold text-amber-300 mt-0.5">{crit.marathi}</p>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{crit.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age Divisions for Santulana */}
                    <div className="luxe-card p-6 border border-border/80 bg-card/60">
                      <h4 className="text-lg font-bold text-foreground mb-4">Official Age Groups (Open Weight)</h4>
                      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(event.ageWeight || []).map((aw, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-background/80 border border-border/70 text-center">
                            <span className="text-sm font-black text-primary block">{aw.group}</span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">{aw.ageLimit}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-2">Open Weight</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Combat Disciplines: Kaya Yuddha, Charana Yuddha, Sparsha Yuddha, Sangama Kala */
                  <div className="space-y-8">
                    {/* Interactive Category Selector Card */}
                    <div className="luxe-card p-6 sm:p-8 border border-primary/30 bg-card/70 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                        <div>
                          <span className="text-xs font-mono font-bold text-primary uppercase">Division Matrix</span>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                            Select Age Group &amp; Gender
                          </h3>
                        </div>

                        {/* Boys / Girls Toggle */}
                        <div className="inline-flex rounded-full bg-background/80 border border-border p-1 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryGender("male")}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5",
                              selectedCategoryGender === "male"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span>👦 Boys / Male</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryGender("female")}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5",
                              selectedCategoryGender === "female"
                                ? "bg-pink-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span>👧 Girls / Female</span>
                          </button>
                        </div>
                      </div>

                      {/* Age Division Tabs: U-8, U-10, U-12, U-14, U-17, U-19, Open Category */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {activeAgeDivisions.map((aw) => (
                          <button
                            key={aw.group}
                            type="button"
                            onClick={() => setSelectedCategoryAge(aw.group)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border",
                              (currentAgeDivision?.group === aw.group)
                                ? "bg-gold-gradient text-background border-primary shadow-gold scale-105"
                                : "bg-background/60 text-muted-foreground hover:text-foreground border-border/80"
                            )}
                          >
                            {aw.group}
                          </button>
                        ))}
                      </div>

                      {/* Active Division Weight Cards or Open Category Banner */}
                      {currentAgeDivision && (
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-bold text-foreground">
                                {currentAgeDivision.group} — {currentAgeDivision.ageLimit}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                (Match: {currentAgeDivision.matchDuration || "3 rounds x 2.0 mins"})
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-primary">
                              {isOpenDivision
                                ? "Open Weight Category"
                                : selectedCategoryGender === "male"
                                ? "Boys Weight Brackets"
                                : "Girls Weight Brackets"}
                            </span>
                          </div>

                          {isOpenDivision ? (
                            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-amber-500/15 via-card to-card border border-amber-500/30 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                    Federation Open Category Protocol
                                  </span>
                                  <h4 className="text-base sm:text-lg font-black text-foreground">
                                    {currentAgeDivision.group} — Open Weight Division
                                  </h4>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold self-start sm:self-auto border border-amber-500/30">
                                  ⚖️ No Fixed Weight Limit
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                <strong>Open Weight Category:</strong> No fixed weight limit. Final grouping, weight seeding, and tournament draw will be conducted strictly as per respective Championship &amp; Event Regulations.
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-xs font-semibold text-amber-300/90">
                                  ✓ Official Federation Sanctioned Open Weight Division
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {(selectedCategoryGender === "male"
                                ? currentAgeDivision.weightClassesMale || []
                                : currentAgeDivision.weightClassesFemale || []
                              ).map((wt, wIdx) => (
                                <div
                                  key={wIdx}
                                  className={cn(
                                    "p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center py-4 group",
                                    selectedCategoryGender === "male"
                                      ? "bg-blue-950/15 border-blue-500/30 hover:border-blue-500/60"
                                      : "bg-pink-950/15 border-pink-500/30 hover:border-pink-500/60"
                                  )}
                                >
                                  <span className="text-[10px] font-mono text-muted-foreground block">
                                    Cat {wIdx + 1}
                                  </span>
                                  <span className="text-sm font-black text-foreground mt-1 block">
                                    {wt}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Age / Weight Classes Full Matrix Table */}
                    {activeAgeDivisions.length > 0 && (
                      <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-foreground">
                            Complete Official Federation Weight Matrix
                          </h3>
                          <span className="text-xs text-muted-foreground">All Age &amp; Weight Brackets</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs sm:text-sm">
                            <thead>
                              <tr className="border-b border-border/60 text-muted-foreground">
                                <th className="pb-3 uppercase tracking-wider font-bold">Group / Division</th>
                                <th className="pb-3 uppercase tracking-wider font-bold">👦 Male Weight Classes</th>
                                <th className="pb-3 uppercase tracking-wider font-bold">👧 Female Weight Classes</th>
                                <th className="pb-3 uppercase tracking-wider font-bold">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 text-foreground/90">
                              {activeAgeDivisions.map((aw, idx) => (
                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                  <td className="py-4 font-bold text-primary align-top">
                                    <div>{aw.group}</div>
                                    <div className="text-[10px] text-muted-foreground font-normal">{aw.ageLimit}</div>
                                  </td>
                                  <td className="py-4 align-top">
                                    <div className="flex flex-wrap gap-1">
                                      {(aw.weightClassesMale || []).map((w, wi) => (
                                        <span
                                          key={wi}
                                          className="px-2 py-0.5 rounded bg-blue-950/30 border border-blue-500/20 text-[11px] font-mono text-blue-300"
                                        >
                                          {w}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-4 align-top">
                                    <div className="flex flex-wrap gap-1">
                                      {(aw.weightClassesFemale || []).map((w, wi) => (
                                        <span
                                          key={wi}
                                          className="px-2 py-0.5 rounded bg-pink-950/30 border border-pink-500/20 text-[11px] font-mono text-pink-300"
                                        >
                                          {w}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-4 text-xs font-semibold text-muted-foreground whitespace-nowrap align-top">
                                    {aw.matchDuration || "3 x 2.0 mins"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* TAB 5: EQUIPMENT & GEAR */}
          {activeTab === "equipment" && (
            <Reveal>
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="luxe-card p-6 border border-primary/30 bg-primary/5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary uppercase">Mandatory</span>
                      <h4 className="text-base font-bold text-foreground mt-1">Required Safety Gear</h4>
                      <ul className="mt-4 space-y-2 text-xs text-foreground/90">
                        {(event.equipment?.mandatory || ["Certified protective headguard", "Chest protector", "Mouthguard"]).map((eq, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{eq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="luxe-card p-6 border border-border/80 bg-card/60 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Optional</span>
                      <h4 className="text-base font-bold text-foreground mt-1">Authorized Accessories</h4>
                      <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                        {(event.equipment?.optional || ["Athletic wrap tape", "Ankle support"]).map((op, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                            <span>{op}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="luxe-card p-6 border border-destructive/30 bg-destructive/5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-destructive uppercase">Prohibited</span>
                      <h4 className="text-base font-bold text-foreground mt-1">Banned Equipment</h4>
                      <ul className="mt-4 space-y-2 text-xs text-foreground/90">
                        {(event.equipment?.prohibited || ["Metallic jewelry", "Hard plastic braces"]).map((pr, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <X className="size-3.5 text-destructive shrink-0 mt-0.5" />
                            <span>{pr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" /> Official Uniform &amp; Apparel Standards
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {event.equipment?.uniformStandards || "Official KALAWAR black & gold combat uniform sanctioned by the federation."}
                  </p>
                </div>
              </div>
            </Reveal>
          )}

          {/* TAB 6: PHOTOS & VIDEOS */}
          {activeTab === "media" && (
            <Reveal>
              <div className="space-y-10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">Official Action Gallery</h3>
                    <span className="text-xs text-muted-foreground">Click any photo to enlarge</span>
                  </div>
                  {event.media?.photos && event.media.photos.length > 0 ? (
                    <div className="grid sm:grid-cols-3 gap-4">
                      {event.media.photos.map((photo, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhoto(photo)}
                          className="relative rounded-2xl overflow-hidden border border-border/80 group h-56 bg-muted cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/60 hover:shadow-gold"
                        >
                          <img
                            src={photo.src}
                            alt={photo.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                            <span className="text-[10px] font-bold text-primary uppercase">{photo.category}</span>
                            <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{photo.title}</h4>
                          </div>
                          <div className="absolute top-3 right-3 size-8 rounded-full bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
                            <Maximize2 className="size-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="luxe-card p-8 text-center text-xs text-muted-foreground">
                      Action photos will be published after the upcoming championship.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">Video Showcases &amp; Match Highlights</h3>
                    <span className="text-xs text-muted-foreground">Click to watch streaming video</span>
                  </div>
                  {event.media?.videos && event.media.videos.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {event.media.videos.map((vid, i) => {
                        const parsed = parseVideoSource(vid.videoUrl || vid.thumb || "");
                        return (
                          <div
                            key={i}
                            onClick={() => setActiveVideo(vid)}
                            className="luxe-card p-4 border border-border/80 bg-card/60 hover:bg-card/90 hover:border-primary/50 flex gap-4 items-center group cursor-pointer transition-all hover:shadow-gold duration-200"
                          >
                            <div className="relative size-24 rounded-xl overflow-hidden bg-muted shrink-0">
                              <img
                                src={
                                  vid.thumb ||
                                  parsed.thumbnailUrl ||
                                  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80"
                                }
                                alt={vid.title}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="size-9 rounded-full bg-primary text-background grid place-items-center shadow-gold group-hover:scale-110 transition-transform">
                                  <Play className="size-4 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-primary font-bold">{vid.duration}</span>
                                {vid.videoUrl && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                    {parsed.platformLabel}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors line-clamp-1">
                                {vid.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vid.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="luxe-card p-8 text-center text-xs text-muted-foreground">
                      Match highlight videos will be uploaded following sanctioned national fixtures.
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* TAB 7: RESULTS & CHAMPIONS */}
          {activeTab === "results" && (
            <Reveal>
              <div className="space-y-8">
                {(event.results && event.results.length > 0) ? (
                  event.results.map((res, i) => (
                    <div key={i} className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6">
                        <div>
                          <span className="text-xs font-mono font-bold text-primary uppercase">{res.season} Season</span>
                          <h3 className="text-xl font-bold text-foreground mt-0.5">{res.championship}</h3>
                        </div>
                        <Link
                          href="/results"
                          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View Full Season Tally →
                        </Link>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        {(res.podium || []).map((p, pi) => (
                          <div
                            key={pi}
                            className={cn(
                              "p-5 rounded-2xl border flex flex-col justify-between",
                              p.position === "Gold"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : p.position === "Silver"
                                ? "bg-slate-500/10 border-slate-500/30 text-slate-300"
                                : "bg-amber-800/10 border-amber-800/30 text-amber-600"
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider">{p.position} Medal</span>
                                <Trophy className="size-4" />
                              </div>
                              <h4 className="text-base font-bold text-foreground mt-3">{p.athlete}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{p.academy}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-semibold text-primary">
                              {p.state}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="luxe-card p-8 text-center bg-card/60">
                    <Trophy className="size-8 text-primary mx-auto mb-2 opacity-60" />
                    <h4 className="text-base font-bold text-foreground">No Championship Results Archived Yet</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Podium standings and athlete records will appear once official fixtures are concluded.
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* RELATED EVENTS DISCOVERY */}
          {relatedEvents.length > 0 && (
            <div className="mt-20 pt-12 border-t border-border/60">
              <h3 className="text-xl font-bold text-foreground mb-6">Explore Other KALAWAR Disciplines</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {relatedEvents.map((re) => (
                  <Link
                    key={re.id}
                    href={`/events/${re.slug || re.id}`}
                    className="luxe-card p-5 border border-border/80 hover:border-primary/50 transition-all group bg-card/60 block"
                  >
                    <span className="text-[10px] font-bold text-primary uppercase">{re.badge}</span>
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mt-1">
                      {re.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">{re.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          LUXE VIDEO PLAYER LIGHTBOX MODAL
          ========================================================================= */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-card border border-primary/40 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-4 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                  {parseVideoSource(activeVideo.videoUrl || activeVideo.thumb || "").platformLabel} • Official Video Highlight
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">{activeVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/80 shadow-2xl">
              {parseVideoSource(activeVideo.videoUrl || activeVideo.thumb || "").type === "direct" ? (
                <video
                  src={parseVideoSource(activeVideo.videoUrl || activeVideo.thumb || "").directUrl}
                  controls
                  autoPlay
                  className="size-full object-contain"
                />
              ) : (
                <iframe
                  src={parseVideoSource(activeVideo.videoUrl || activeVideo.thumb || "").embedUrl}
                  title={activeVideo.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Modal Footer / Video Description */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
              <p className="line-clamp-2 text-foreground/90 max-w-2xl">{activeVideo.desc}</p>
              <div className="flex items-center gap-2 shrink-0">
                {activeVideo.duration && (
                  <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-mono text-[11px] font-bold text-primary">
                    ⏱ {activeVideo.duration}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary/90 cursor-pointer shadow-gold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHOTO LIGHTBOX MODAL
          ========================================================================= */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="bg-card border border-primary/40 rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">
                  {activePhoto.category || "Action Photo"}
                </span>
                <h3 className="text-base font-bold text-foreground">{activePhoto.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img src={activePhoto.src} alt={activePhoto.title} className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

/* =========================================================================
   GENERIC TOURNAMENT FIXTURE DETAIL VIEW (For ID: EVT-...)
   ========================================================================= */
function EventDetailContent({ event }: { event: SportEvent }) {
  const { isAuthenticated } = useAuth();
  const c = useCountdown(event.startDate);
  const [imgSrc, setImgSrc] = useState(event.image || IMAGES.martialArts);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isGenericRegOpen, setIsGenericRegOpen] = useState(false);

  const formattedStartDate = new Date(event.startDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedEndDate = new Date(event.endDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  const statusTone: Record<string, { badge: string; dot: string }> = {
    Upcoming: { badge: "bg-primary/20 text-primary border-primary/40", dot: "bg-primary" },
    Ongoing: { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", dot: "bg-emerald-400 animate-pulse" },
    Completed: { badge: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  };

  const currentTone = statusTone[event.status] || statusTone.Upcoming;

  return (
    <SiteLayout>
      {/* Top Breadcrumbs & Action Bar */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-4 border-b border-border/40 bg-card/30">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="size-3.5 opacity-60" />
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <ChevronRight className="size-3.5 opacity-60" />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{event.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="border-border/70 hover:border-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer bg-background/80"
            >
              <Share2 className="size-3.5" /> Share
            </button>
            <Link
              href="/events/calendar"
              className="bg-gold-gradient text-background inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-gold hover:opacity-90 transition-opacity"
            >
              <CalendarDays className="size-3.5" /> All Fixtures
            </Link>
          </div>
        </div>
      </section>

      {/* Main Tournament Details */}
      <section className="section-pad">
        <div className="shell grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-muted h-72 sm:h-96">
              <img src={imgSrc} alt={event.title} className="size-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", currentTone.badge)}>
                  {event.status}
                </span>
                <span className="rounded-full bg-background/80 backdrop-blur-md border border-border px-3 py-1 text-xs font-semibold text-foreground">
                  {event.discipline}
                </span>
              </div>
            </div>

            <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{event.title}</h1>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {event.summary || "Official tournament fixture sanctioned by the KALAWAR Sports & Martial Arts Federation of India."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="luxe-card p-6 border border-border/80 bg-card/60 space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Ticket className="size-4 text-primary" /> Entry &amp; Registration
              </h3>
              <div className="flex justify-between items-center py-2 border-y border-border/60 text-xs">
                <span className="text-muted-foreground">Registration Status:</span>
                <span className="font-bold text-emerald-400 text-xs">Open / Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Available Slots:</span>
                <span className="font-bold text-primary">{event.slots || 100}</span>
              </div>
              {event.status === "Upcoming" || event.status === "Ongoing" ? (
                <Link
                  href={`/championship/register?eventId=${encodeURIComponent(event.id)}`}
                  className="w-full bg-gold-gradient text-background py-3 rounded-full text-xs font-bold shadow-gold text-center block hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Register Online for Championship
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full bg-muted/60 border border-border/80 text-muted-foreground/60 py-3 rounded-full text-xs font-semibold text-center block cursor-not-allowed select-none opacity-60"
                >
                  Registration Closed
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EVENT REGISTRATION MODAL */}
      <EventRegistrationModal
        event={event}
        isOpen={isGenericRegOpen}
        onClose={() => setIsGenericRegOpen(false)}
      />
    </SiteLayout>
  );
}
