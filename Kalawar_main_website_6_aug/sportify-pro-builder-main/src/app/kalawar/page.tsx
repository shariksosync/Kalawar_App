"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Trophy,
  Download,
  Sparkles,
  ShieldCheck,
  Shield,
  UserPlus,
  Landmark,
  FileText,
  CreditCard,
  Search,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Swords,
  Award,
  Users,
  Camera,
  Film,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Flame,
  Globe2,
  Newspaper,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import { Counter } from "@/components/common/Counter";
import { IMAGES } from "@/data/images";
import { federationStats } from "@/data/people";
import type { KalawarEvent } from "@/data/kalawar-events";
import type { SportEvent } from "@/data/events";
import { type NewsItem } from "@/data/content";
import type { AlbumItem } from "@/data/albums";
import type { VideoItem } from "@/data/videos";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { federation } from "@/constants/navigation";
import { IntroVideoOverlay } from "@/components/home/IntroVideoOverlay";
import { CommonReviewsSection } from "@/components/home/CommonReviewsSection";
import { HomeImageBanner } from "@/components/home/HomeImageBanner";

// ==========================================
// STEP 2: MAIN HERO SECTION
// ==========================================
function Hero() {
  const { isAuthenticated } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex flex-col items-center overflow-hidden w-full max-w-full pt-[76px] sm:pt-[84px] lg:pt-[92px]">
      {/* Full-Width Animated Clean Image Banner Slider (Spanning 100% of page width) */}
      <div className="w-full">
        <HomeImageBanner />
      </div>

      {/* Main Hero Content & Headline Area */}
      <div className="relative w-full overflow-hidden">
        {/* Dynamic Martial Arts Stadium Background */}
        <motion.div style={{ y }} className="absolute inset-0 -z-10">
          <img
            src={IMAGES.heroStadium}
            alt="KALAWAR National Arena"
            className="size-full object-cover filter brightness-[0.45] contrast-[1.15]"
          />
          <div className="from-background via-background/75 to-background/95 absolute inset-0 bg-gradient-to-b" />
          <div className="from-background/90 absolute inset-0 bg-gradient-to-r via-background/30 to-transparent" />
        </motion.div>

        <motion.div style={{ opacity }} className="shell relative py-8 sm:py-12 lg:py-16">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display max-w-5xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-balance text-white"
          >
            Indian Martial Arts • Sports • <span className="text-gold-gradient">Skill • Discipline</span> • Excellence
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed font-medium"
          >
            A National Platform for Martial Arts, Sports, Athletes and Sporting Excellence. Governing traditional combat disciplines, certified Dan gradings, state championships, and high-performance athlete pathways.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            {!isAuthenticated ? (
              <Link
                href="/register?type=player"
                className="bg-gold-gradient text-background group inline-flex items-center justify-center gap-2 rounded-full px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold transition-all hover:scale-[1.03] active:scale-[0.98] text-center"
              >
                <span>Register Now</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="bg-gold-gradient text-background group inline-flex items-center justify-center gap-2 rounded-full px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold transition-all hover:scale-[1.03] active:scale-[0.98] text-center"
              >
                <span>My Athlete Portal</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            <Link
              href="/events"
              className="glass hover:border-primary inline-flex items-center justify-center gap-2 rounded-full px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors text-center border border-border/80 hover:bg-primary/10 text-foreground"
            >
              <span>Explore KALAWAR</span>
              <ChevronRight className="size-4 text-primary" />
            </Link>
          </motion.div>

          {/* Top 4 KPI Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border-border/60 mt-10 sm:mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4 bg-border/40 backdrop-blur-md shadow-2xl"
          >
            {federationStats.map((s) => (
              <div key={s.label} className="bg-card/80 p-4 sm:p-5 text-center sm:text-left min-w-0">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gold-gradient tracking-tight">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-muted-foreground mt-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase truncate">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ==========================================
// STEP 3: QUICK ACTIONS (4 Options)
// ==========================================
function QuickActions() {
  const actions = [
    {
      title: "Player Registration",
      subtitle: "Official Athlete License & KALAWAR ID",
      icon: Swords,
      href: "/register/player",
      color: "from-amber-500/20 to-yellow-500/5",
      border: "hover:border-amber-500/50",
      badge: "🥋 Athlete Portal",
    },
    {
      title: "Academy Affiliation",
      subtitle: "Affiliate your Dojo, Club or Academy",
      icon: Landmark,
      href: "/affiliation",
      color: "from-blue-500/20 to-cyan-500/5",
      border: "hover:border-blue-500/50",
      badge: "🏫 Dojo / Club",
    },
    {
      title: "Belt Examinations",
      subtitle: "Official color belt syllabus & admit cards",
      icon: Award,
      href: "/belt-exams",
      color: "from-emerald-500/20 to-green-500/5",
      border: "hover:border-emerald-500/50",
      badge: "🥋 Belt Syllabus",
    },
    {
      title: "Events & Tournaments",
      subtitle: "Upcoming state & national championships",
      icon: Trophy,
      href: "/events",
      color: "from-purple-500/20 to-indigo-500/5",
      border: "hover:border-purple-500/50",
      badge: "🏆 Competitions",
    },
  ];

  return (
    <section className="relative -mt-6 sm:-mt-8 z-20 shell">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${act.border}`}
            >
              <div className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${act.color} blur-2xl pointer-events-none`} />
              <div className="flex items-start justify-between">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center group-hover:scale-110 transition-transform shadow-inner">
                  <Icon className="size-5.5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/80 px-2 py-0.5 rounded-full border border-border/60">
                  {act.badge}
                </span>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{act.title}</span>
                  <ArrowRight className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {act.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// STEP 4: KALAWAR DISCIPLINES (Dynamic)
// ==========================================
function KalawarFiveEvents() {
  const [disciplines, setDisciplines] = useState<KalawarEvent[]>([]);
  const [eventsList, setEventsList] = useState<SportEvent[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/kalawar-events")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/events")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([flagshipRes, eventsRes]) => {
      if (flagshipRes?.success && Array.isArray(flagshipRes.events)) {
        setDisciplines(flagshipRes.events);
      }
      if (eventsRes?.success && Array.isArray(eventsRes.events)) {
        setEventsList(eventsRes.events);
      }
    });
  }, []);

  if (disciplines.length === 0) return null;

  const gridColsClass =
    disciplines.length === 1
      ? "grid-cols-1 max-w-md mx-auto"
      : disciplines.length === 2
      ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
      : disciplines.length === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
      : disciplines.length === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  return (
    <section className="section-pad w-full max-w-full overflow-hidden">
      <div className="shell">
        <SectionHeading
          eyebrow="Martial Arts Disciplines"
          title="KALAWAR Flagship Events"
          description="Traditional Indian combat disciplines synthesized with modern sports science, electronic point scoring, and federation safety standards."
          action={
            <Link
              href="/events"
              className="text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider hover:underline"
            >
              View All Events <ArrowRight className="size-4" />
            </Link>
          }
        />

        <div className={`mt-10 sm:mt-12 grid ${gridColsClass} gap-4`}>
          {disciplines.map((ev, idx) => {
            const cleanId = (ev.id || "").replace(/^KE-/i, "").trim().toLowerCase();
            const matchingEvent = eventsList.find((e) => {
              const eId = (e.id || "").trim().toLowerCase();
              const eDiscipline = (e.discipline || "").trim().toLowerCase();
              const eTitle = (e.title || "").trim().toLowerCase();
              return (
                (cleanId && eId === cleanId) ||
                (ev.name && (eDiscipline === ev.name.trim().toLowerCase() || eDiscipline.includes(ev.name.trim().toLowerCase()))) ||
                (ev.tagline && eTitle === ev.tagline.trim().toLowerCase()) ||
                (ev.nextTournamentName && eTitle === ev.nextTournamentName.trim().toLowerCase())
              );
            });

            const targetLink = `/events/${ev.slug || ev.id}`;

            return (
              <Link
                key={ev.slug || ev.id}
                href={targetLink}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card/80 transition-all duration-300 hover:border-primary/60 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                {/* Event Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={ev.heroImage || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80"}
                    alt={ev.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black/70 border border-primary/40 text-gold-gradient text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md">
                    0{idx + 1}
                  </span>
                  {ev.marathiName && (
                    <span className="absolute top-2.5 right-2.5 bg-background/80 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-md border border-border/60">
                      {ev.marathiName}
                    </span>
                  )}
                </div>

                {/* Event Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                      {ev.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {ev.name.replace("Kalawar ", "")}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {ev.tagline}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Rules &amp; Info</span>
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/events"
            className="w-full bg-card hover:bg-accent border border-border/80 text-foreground font-bold text-xs py-3 rounded-full inline-flex items-center justify-center gap-2"
          >
            <span>View All Events →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// STEP 5: UPCOMING CHAMPIONSHIP (Compact Card)
// ==========================================
function UpcomingChampionship({ event }: { event?: SportEvent }) {
  const targetDate = event?.startDate || "2026-11-14";
  const c = useCountdown(targetDate);

  const defaultEvent: SportEvent = {
    id: "champ-2026-kaya",
    title: "All-India Kaya Yuddha National Championship 2026",
    discipline: "Kalawar Kaya Yuddha",
    category: "Championship",
    venue: "Shiv Chhatrapati Sports Complex, Balewadi",
    city: "Pune, Maharashtra",
    startDate: "2026-11-14",
    endDate: "2026-11-16",
    image: IMAGES.stadiumNight,
    status: "Upcoming",
    entryFee: "₹800",
    slots: 640,
    summary: "Premier annual national championship featuring Kata, Kumite, and Upper-Body Hand Striking combat divisions across U-8 to Senior Open categories.",
  };

  const activeEvent = event || defaultEvent;

  const units = [
    { label: "Days", value: c.days },
    { label: "Hours", value: c.hours },
    { label: "Mins", value: c.minutes },
    { label: "Secs", value: c.seconds },
  ];

  return (
    <section className="section-pad bg-card/40 border-y border-border/60 w-full max-w-full overflow-hidden">
      <div className="shell">
        <SectionHeading
          eyebrow="Next National Arena"
          title="Upcoming Championship"
          description="Official national tournament spotlight with live countdown, tatami venues, and athlete registration access."
        />

        <div className="mt-10 sm:mt-12 luxe-card overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/70 to-primary/5 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left Content */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Registrations Live & Open
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary">
                  <Trophy className="size-3.5" /> Official National Grand Prix
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                {activeEvent.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary shrink-0" />
                  <span>{new Date(activeEvent.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} – {new Date(activeEvent.endDate || activeEvent.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="truncate">{activeEvent.venue}, {activeEvent.city}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeEvent.summary}
              </p>

              {/* Countdown Grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm">
                {units.map((u) => (
                  <div key={u.label} className="bg-background/80 border border-border/70 rounded-xl p-2.5 text-center">
                    <p className="text-lg sm:text-2xl font-black text-gold-gradient tabular-nums">
                      {String(u.value).padStart(2, "0")}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      {u.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dual Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={`/events/${activeEvent.id}`}
                  className="bg-gold-gradient text-background px-6 py-3 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-95 inline-flex items-center gap-2"
                >
                  <span>View Details →</span>
                </Link>
                <Link
                  href="/register?type=player"
                  className="glass hover:border-primary px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground hover:bg-primary/10 transition-colors inline-flex items-center gap-2 border border-border/80"
                >
                  <span>Register Now →</span>
                </Link>
              </div>
            </div>

            {/* Right Banner Showcase (Universal 16:9 Landscape - 960x540 / 1200x675 / 1920x1080) */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/70 bg-muted group shadow-xl">
              <img
                src={activeEvent.image || IMAGES.stadiumNight}
                alt={activeEvent.title}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// STEP 6: LATEST ANNOUNCEMENTS
// ==========================================
function LatestAnnouncements({ newsList }: { newsList: NewsItem[] }) {
  const publishedNews = newsList.filter((n) => !n.status || n.status === "Published");
  const items = publishedNews.slice(0, 3);

  return (
    <section className="section-pad w-full max-w-full overflow-hidden">
      <div className="shell">
        <SectionHeading
          eyebrow="Notice Board"
          title="Latest Announcements"
          description="Official circulars, governing policies, tournament schedules, and federation notices."
          action={
            <Link
              href="/news"
              className="text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider hover:underline"
            >
              View All Notices <ArrowRight className="size-4" />
            </Link>
          }
        />

        {items.length > 0 ? (
          <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug || item.id}`}
                className="group luxe-card p-6 rounded-2xl border border-border/70 hover:border-primary/60 transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {item.category || "Announcement"}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Read Full Circular</span>
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 sm:mt-12 rounded-2xl border border-border/60 bg-card/40 p-10 text-center max-w-xl mx-auto">
            <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center mb-3">
              <Newspaper className="size-6 text-primary" />
            </div>
            <h4 className="text-base font-bold text-foreground">No announcements published yet</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Official circulars, governing policies, and notices will appear here once published from the federation portal.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// STEP 7: KALAWAR NETWORK (Visual Hierarchy)
// ==========================================
function KalawarNetwork() {
  const nodes = [
    { label: "INDIA", desc: "National Apex Body", icon: Globe2, count: "1 Federation" },
    { label: "STATE", desc: "State Associations", icon: Landmark, count: "28 States" },
    { label: "DISTRICT", desc: "District Units", icon: Shield, count: "700+ Districts" },
    { label: "ACADEMY / CLUB", desc: "Dojos & Academies", icon: Users, count: "3,760+ Clubs" },
    { label: "ATHLETE", desc: "Martial Artists", icon: Swords, count: "1,97,000+ Players" },
  ];

  return (
    <section className="section-pad w-full max-w-full overflow-hidden">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="PAN-INDIA PRESENCE"
          title="KALAWAR Network"
          description="Building a connected martial arts and sports network across India."
        />

        <div className="mt-12 sm:mt-14 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {nodes.map((node, i) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  className="luxe-card p-5 sm:p-6 rounded-2xl border border-border/70 text-center space-y-3 relative group hover:border-primary/50 transition-all hover:-translate-y-1"
                >
                  <div className="size-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center group-hover:scale-110 transition-transform">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-foreground tracking-wide">{node.label}</p>
                    <p className="text-xs text-muted-foreground">{node.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[11px] font-bold text-gold-gradient font-mono">
                      {node.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// STEP 8: PHOTO & VIDEO PREVIEW (KALAWAR Moments)
// ==========================================
function KalawarMoments({ albums, videos }: { albums: AlbumItem[]; videos: VideoItem[] }) {
  const displayAlbums = Array.isArray(albums) ? albums.slice(0, 4) : [];
  const displayVideos = Array.isArray(videos) ? videos.slice(0, 2) : [];

  return (
    <section className="section-pad bg-card/40 border-y border-border/60 w-full max-w-full overflow-hidden">
      <div className="shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Visual Chronicle</p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
              KALAWAR Moments
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-lg">
              Live captures, podium celebrations, and championship highlights from across India.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/gallery"
              className="bg-card hover:bg-accent border border-border/80 text-foreground font-bold text-xs px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-all"
            >
              <Camera className="size-3.5 text-primary" /> Photo Gallery →
            </Link>
            <Link
              href="/gallery/videos"
              className="bg-gold-gradient text-background font-bold text-xs px-4 py-2.5 rounded-full shadow-gold hover:opacity-90 inline-flex items-center gap-1.5 transition-all"
            >
              <Film className="size-3.5" /> Video Gallery →
            </Link>
          </div>
        </div>

        {/* Photos Grid */}
        {displayAlbums.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            {displayAlbums.map((album: any) => {
              const photoCount = Array.isArray(album.photos) ? album.photos.length : 0;
              const imgSrc = album.coverPhoto || (album.photos && album.photos[0]?.url) || album.src || album.thumb;
              return (
                <Link
                  href="/gallery"
                  key={album.id || album._id}
                  className="group relative block overflow-hidden rounded-2xl h-44 sm:h-56 w-full border border-border/60 bg-muted"
                >
                  <img
                    src={imgSrc}
                    alt={album.title}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                  {/* Category badge */}
                  {album.category && (
                    <span className="absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-primary border border-primary/30 backdrop-blur-sm z-10">
                      {album.category}
                    </span>
                  )}

                  {/* Photo count badge */}
                  {photoCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white/90 border border-white/20 backdrop-blur-sm flex items-center gap-1 z-10">
                      <Camera className="size-2.5 text-primary" />
                      {photoCount}
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                    <p className="text-xs sm:text-sm font-bold line-clamp-2 drop-shadow-md">
                      {album.title}
                    </p>
                    {album.venue && (
                      <p className="text-[10px] sm:text-xs text-white/75 line-clamp-1 mt-0.5">
                        {album.venue}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-8 text-center max-w-xl mx-auto">
            <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center mb-3">
              <Camera className="size-6 text-primary" />
            </div>
            <h4 className="text-base font-bold text-foreground">No photo albums published yet</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Official championship photography and event highlights will appear here once published.
            </p>
          </div>
        )}

        {/* Videos Row */}
        {displayVideos.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayVideos.map((v: any) => {
              const videoThumb = v.thumbnailUrl || v.thumb || v.src || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop";
              return (
                <Link
                  href="/gallery/videos"
                  key={v.id || v._id}
                  className="group relative block overflow-hidden rounded-2xl h-52 sm:h-64 w-full border border-border/60 bg-muted"
                >
                  <img
                    src={videoThumb}
                    alt={v.title}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />

                  {/* Category badge */}
                  {v.category && (
                    <span className="absolute top-3 left-3 text-[10px] sm:text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-black/70 text-primary border border-primary/30 backdrop-blur-sm z-10">
                      {v.category}
                    </span>
                  )}

                  {/* Play Button */}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="size-14 rounded-full bg-gold-gradient grid place-items-center shadow-gold group-hover:scale-110 transition-transform">
                      <Play className="size-5 text-black ml-0.5" fill="currentColor" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white flex items-center justify-between z-10">
                    <p className="text-sm sm:text-base font-bold truncate pr-3">{v.title}</p>
                    {v.duration && (
                      <span className="text-[10px] sm:text-xs font-mono bg-black/80 px-2 py-0.5 rounded border border-white/20 shrink-0">
                        {v.duration}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card/40 p-8 text-center max-w-xl mx-auto">
            <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center mb-3">
              <Film className="size-6 text-primary" />
            </div>
            <h4 className="text-base font-bold text-foreground">No video broadcasts published yet</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Official combat replays, seminar masterclasses, and event highlights will appear here once published.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// STEP 10: OFFICIAL VERIFICATION SEARCH BOX
// ==========================================
function HomeVerificationWidget() {
  const [query, setQuery] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      toast.error("Please enter a Certificate Number or Member ID");
      return;
    }
    // Auto-detect routing: Certificate numbers go to /certificates, Player/Member IDs go to /id-cards or /verify
    if (clean.toUpperCase().startsWith("KAC-CERT-") || clean.includes("CERT")) {
      window.location.href = `/certificates?number=${encodeURIComponent(clean)}`;
    } else {
      window.location.href = `/verify?id=${encodeURIComponent(clean)}`;
    }
  };

  return (
    <section className="section-pad w-full max-w-full overflow-hidden">
      <div className="shell">
        <div className="luxe-card p-6 sm:p-10 lg:p-12 rounded-3xl border border-primary/30 bg-gradient-to-b from-card via-card to-primary/5 text-center max-w-4xl mx-auto space-y-6 shadow-2xl">
          <div className="size-14 mx-auto rounded-2xl bg-primary/10 border border-primary/30 text-primary grid place-items-center shadow-inner">
            <ShieldCheck className="size-7" />
          </div>

          <div className="space-y-2">
            <p className="eyebrow">National Credential Integrity</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
              Verify KALAWAR
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
              Authenticate official Belt Exam certificates, Dan diplomas, Coach licenses, and digital Player ID cards.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Player ID (KSM-PL-...) or Certificate No (KAC-CERT-...)"
                className="w-full bg-background/80 border border-border/80 rounded-full pl-11 pr-4 py-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-gold-gradient text-background px-8 py-3.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-95 whitespace-nowrap"
            >
              Verify Now →
            </button>
          </form>

          {/* QR Option & Direct Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
            >
              <QrCode className="size-4" /> Scan QR Code via Camera
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-medium">
              100% Tamper-Proof Cryptographic Verification
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// STEP 11: CONNECT WITH KALAWAR
// ==========================================
function HomeContactConnect() {
  return (
    <section className="section-pad bg-card/40 border-y border-border/60 w-full max-w-full overflow-hidden">
      <div className="shell">
        <SectionHeading
          eyebrow="National Secretariat"
          title="Connect with KALAWAR"
          description="Official communication channels, headquarters secretariat, and administrative assistance."
        />

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="luxe-card p-5 rounded-2xl border border-border/70 space-y-2">
            <Mail className="size-5 text-primary" />
            <p className="text-xs font-bold uppercase text-muted-foreground">Official Email</p>
            <a href={`mailto:${federation.email}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors block truncate">
              {federation.email}
            </a>
          </div>

          <div className="luxe-card p-5 rounded-2xl border border-border/70 space-y-2">
            <Phone className="size-5 text-primary" />
            <p className="text-xs font-bold uppercase text-muted-foreground">Contact Helpline</p>
            <a href={`tel:${federation.phone1}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors block truncate">
              {federation.phone}
            </a>
          </div>

          <div className="luxe-card p-5 rounded-2xl border border-border/70 space-y-2">
            <MapPin className="size-5 text-primary" />
            <p className="text-xs font-bold uppercase text-muted-foreground">Office Address</p>
            <p className="text-xs font-bold text-foreground truncate">{federation.address}</p>
          </div>

          <div className="luxe-card p-5 rounded-2xl border border-border/70 space-y-2">
            <MessageCircle className="size-5 text-emerald-400" />
            <p className="text-xs font-bold uppercase text-muted-foreground">WhatsApp Desk</p>
            <a
              href={`https://wa.me/${federation.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-400 hover:underline block truncate"
            >
              Chat on WhatsApp →
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="bg-gold-gradient text-background px-8 py-3.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-95 inline-flex items-center gap-2"
          >
            <span>Contact Secretariat →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// MAIN HOMEPAGE WRAPPER
// ==========================================
export default function HomePage() {
  const { settings } = useSettings();
  const [eventsList, setEventsList] = useState<SportEvent[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [albumsList, setAlbumsList] = useState<AlbumItem[]>([]);
  const [videosList, setVideosList] = useState<VideoItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.success && Array.isArray(json.events)) {
          setEventsList(json.events);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      }

      try {
        const res = await fetch("/api/news");
        const json = await res.json();
        if (json.success && Array.isArray(json.news)) {
          setNewsList(json.news);
        }
      } catch (err) {
        console.error("Failed to load news:", err);
      }

      try {
        const res = await fetch("/api/gallery/albums");
        const json = await res.json();
        if (json.success && Array.isArray(json.albums)) {
          setAlbumsList(json.albums.filter((a: any) => a.status === "Published" || !a.status));
        }
      } catch (err) {
        console.error("Failed to load albums:", err);
      }

      try {
        const res = await fetch("/api/gallery/videos");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setVideosList(json.data.filter((v: any) => v.status === "Published" || !v.status));
        }
      } catch (err) {
        console.error("Failed to load videos:", err);
      }
    }
    fetchData();
  }, []);

  const featured = useMemo(() => {
    const nowTime = Date.now();
    const futureUpcoming = eventsList
      .filter((e) => e.status === "Upcoming" && new Date(e.startDate).getTime() > nowTime)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    if (futureUpcoming.length > 0) return futureUpcoming[0];

    const upcomingList = eventsList.filter((e) => e.status === "Upcoming");
    return upcomingList[0] || eventsList[0];
  }, [eventsList]);

  return (
    <SiteLayout>
      {/* STEP 1: WEBSITE OPENING INTRO VIDEO */}
      <IntroVideoOverlay
        enabled={settings.introVideoEnabled ?? true}
        videoUrl={settings.introVideoUrl}
        frequency={settings.introVideoFrequency}
        title={settings.introVideoTitle}
        tagline={settings.introVideoTagline}
      />

      {/* STEP 2: MAIN HERO SECTION */}
      <Hero />

      {/* STEP 3: QUICK ACTIONS */}
      <QuickActions />

      {/* STEP 4: KALAWAR 5 EVENTS */}
      <KalawarFiveEvents />

      {/* STEP 5: UPCOMING CHAMPIONSHIP */}
      <UpcomingChampionship event={featured} />

      {/* STEP 6: LATEST ANNOUNCEMENTS */}
      <LatestAnnouncements newsList={newsList} />

      {/* STEP 7: KALAWAR NETWORK */}
      <KalawarNetwork />

      {/* STEP 8: PHOTO & VIDEO PREVIEW */}
      <KalawarMoments albums={albumsList} videos={videosList} />

      {/* STEP 9: COMMUNITY & ATHLETE COMMON REVIEWS */}
      <CommonReviewsSection />

      {/* STEP 10: OFFICIAL VERIFICATION SEARCH BOX */}
      {/* <HomeVerificationWidget /> */}

      {/* STEP 11: CONTACT / CONNECT */}
      <HomeContactConnect />
    </SiteLayout>
  );
}
