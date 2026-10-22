"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  ArrowRight,
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
  Unlock,
  ExternalLink,
  Plus,
  Minus,
  Star,
  Shirt,
  Camera,
  Car,
  Bed,
  Briefcase,
  HelpCircle,
  FileText,
  Radio,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import type { SportEvent } from "@/data/events";
import { useCountdown } from "@/hooks/useCountdown";
import { IMAGES } from "@/data/images";
import { federation } from "@/constants/navigation";
import { cn, formatEventDisplayDate } from "@/lib/utils";
import { parseVideoSource } from "@/lib/video-utils";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";

const SAMPLE_FALLBACK_ACADEMIES = [
  { name: "Kalawar Combat Academy Pune", city: "Pune, Maharashtra", athleteCount: 18 },
  { name: "Mumbai Warriors Dojo", city: "Mumbai, Maharashtra", athleteCount: 14 },
  { name: "Bengaluru Martial Arts Centre", city: "Bengaluru, Karnataka", athleteCount: 12 },
  { name: "Delhi Strikers Federation", city: "Delhi NCR", athleteCount: 10 },
  { name: "Jaipur Heritage Combat Club", city: "Jaipur, Rajasthan", athleteCount: 8 },
];

interface TournamentCalendarDetailViewProps {
  event: SportEvent;
}

export function TournamentCalendarDetailView({ event }: TournamentCalendarDetailViewProps) {
  const c = useCountdown(event.startDate);
  const [activeModal, setActiveModal] = useState<"teams" | "divisions" | "weightChart" | "weighIns" | "staff" | "media" | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoUrl: string } | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tournament fixture link copied to clipboard!");
    }
  };

  // Format dates for display
  const formattedFullDate = formatEventDisplayDate(
    event.startDate,
    `${event.month || "APR"} ${event.year || 2026}`
  );

  // Calculate default deadlines based on event startDate if not customized
  const computeOffsetDate = (daysBefore: number) => {
    const d = new Date(event.startDate);
    if (isNaN(d.getTime())) return "TBA";
    d.setDate(d.getDate() - daysBefore);
    return formatEventDisplayDate(d.toISOString().split("T")[0]);
  };

  const relevantDatesList = [
    {
      key: "affiliation",
      title: "Affiliation Deadline",
      date: formatEventDisplayDate(event.relevantDates?.affiliationDeadline, computeOffsetDate(24)),
      details: "Clubs and athletes must have verified WSF/KALAWAR federation memberships approved prior to this date.",
    },
    {
      key: "registrationCheckday",
      title: "Registration Checkday",
      date: formatEventDisplayDate(event.relevantDates?.registrationCheckday, computeOffsetDate(4)),
      details: "All athletes must review their division brackets, weight category registrations, and age groups on the portal.",
    },
    {
      key: "registrationDeadline",
      title: "Registration Deadline",
      date: formatEventDisplayDate(event.relevantDates?.registrationDeadline, computeOffsetDate(9)),
      details: "Final online registration closes strictly at 11:59 PM IST. No on-spot or walk-in registrations will be accommodated.",
    },
    {
      key: "scheduleRelease",
      title: "Schedule Release Date",
      date: formatEventDisplayDate(event.relevantDates?.scheduleReleaseDate, computeOffsetDate(2)),
      details: "Estimated order of bouts, tatami ring assignments, and mat schedules published on the official portal.",
    },
    {
      key: "athleteCorrection",
      title: "Athlete Correction Deadline",
      date: formatEventDisplayDate(event.relevantDates?.athleteCorrectionDeadline, computeOffsetDate(8)),
      details: "Last day for registered athletes to request division or weight class adjustments without penalty.",
    },
    {
      key: "bracketsRelease",
      title: "Brackets Release Date",
      date: formatEventDisplayDate(event.relevantDates?.bracketsReleaseDate, computeOffsetDate(2)),
      details: "Official tournament single-elimination brackets with seeded fighters released for public viewing.",
    },
    {
      key: "professorCorrection",
      title: "Professor / Master Correction Period",
      date: formatEventDisplayDate(
        event.relevantDates?.professorCorrectionPeriod,
        `${computeOffsetDate(7)} – ${computeOffsetDate(6)}`
      ),
      details: "Head instructors and certified dojo masters can submit bracket adjustments for affiliated students.",
    },
  ];

  // Belt & Age Division Rows
  const defaultDivisions = [
    { birthYear: "2022", ageDivision: "Mighty-Mite 1 (Under 5)", belts: "White, Yellow" },
    { birthYear: "2021", ageDivision: "Mighty-Mite 2 (Under 6)", belts: "White, Yellow" },
    { birthYear: "2020", ageDivision: "Mighty-Mite 3 (Under 7)", belts: "White, Yellow" },
    { birthYear: "2019", ageDivision: "Pee-Wee 1 (Under 8)", belts: "White, Yellow, Orange" },
    { birthYear: "2018", ageDivision: "Pee-Wee 2 (Under 9)", belts: "White, Yellow, Orange" },
    { birthYear: "2017", ageDivision: "Pee-Wee 3 (Under 10)", belts: "White, Yellow, Orange" },
    { birthYear: "2016", ageDivision: "Junior 1 (Under 11)", belts: "White, Yellow, Orange, Green" },
    { birthYear: "2015", ageDivision: "Junior 2 (Under 12)", belts: "White, Yellow, Orange, Green" },
    { birthYear: "2014", ageDivision: "Junior 3 (Under 13)", belts: "White, Yellow, Orange, Green" },
    { birthYear: "2013", ageDivision: "Teen 1 (Under 14)", belts: "White, Yellow, Orange, Green, Blue" },
    { birthYear: "2012", ageDivision: "Teen 2 (Under 15)", belts: "White, Yellow, Orange, Green, Blue" },
    { birthYear: "2011", ageDivision: "Teen 3 (Under 16)", belts: "White, Yellow, Orange, Green, Blue" },
    { birthYear: "2008 – 2010", ageDivision: "Juvenile / Youth (16–17)", belts: "White, Blue, Purple" },
    { birthYear: "1997 – 2007", ageDivision: "Senior Open (18–29)", belts: "White, Blue, Purple, Brown, Black" },
    { birthYear: "1990 – 1996", ageDivision: "Master 1 (30+)", belts: "All Ranks" },
    { birthYear: "1984 – 1989", ageDivision: "Master 2 (36+)", belts: "All Ranks" },
  ];

  const activeDivisions = event.divisions && event.divisions.length > 0 ? event.divisions : defaultDivisions;
  const activeAcademies = event.participatingAcademies && event.participatingAcademies.length > 0 ? event.participatingAcademies : SAMPLE_FALLBACK_ACADEMIES;

  const currentStatus = (event.status || (event.registrationLive !== false ? "Upcoming" : "Completed")).trim();
  const isOngoing = currentStatus.toLowerCase() === "ongoing" || currentStatus.toLowerCase().includes("live");
  const isCompleted = currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase().includes("finish");
  const isUpcoming = !isOngoing && !isCompleted;

  const isLive = event.registrationLive !== false && !isCompleted;
  const starsCount = event.stars || 4;

  const mapAddress = event.mapLocation?.address || `${event.venue}, ${event.city}, India`;
  const mapEmbedUrl =
    event.mapLocation?.embedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <SiteLayout>
      {/* Top Breadcrumb Header Bar */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-3 border-b border-border/40 bg-card/30">
        <div className="shell flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="size-3.5 opacity-60 shrink-0" />
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <ChevronRight className="size-3.5 opacity-60 shrink-0" />
            <Link href="/events/calendar" className="hover:text-primary transition-colors">Calendar</Link>
            <ChevronRight className="size-3.5 opacity-60 shrink-0" />
            <span className="text-foreground font-semibold truncate max-w-[180px] sm:max-w-xs">{event.title}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleShare}
              className="border-border/70 hover:border-primary inline-flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer bg-background/80"
            >
              <Share2 className="size-3.5" /> Share
            </button>
            <Link
              href="/events/calendar"
              className="rounded-full border border-border/70 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              ← Back to Calendar
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          1. BIG HERO PHOTO BANNER AT THE TOP (Full-Width Cinematic Header)
          ========================================================================= */}
      <section className="relative w-full bg-background overflow-hidden border-b border-border/60">
        <div className="relative min-h-[460px] sm:min-h-[440px] md:min-h-[480px] lg:h-[500px] w-full bg-muted flex flex-col justify-between">
          <img
            src={event.image && event.image.trim() ? event.image.trim() : IMAGES.martialArts}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = IMAGES.martialArts;
            }}
            className="absolute inset-0 size-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/65 to-black/35" />

          {/* Floating Badges & Title Overlay */}
          <div className="relative z-10 flex flex-col justify-between p-4 sm:p-8 lg:p-12 shell max-w-7xl mx-auto size-full min-h-[460px] sm:min-h-[440px] md:min-h-[480px] lg:h-[500px]">
            {/* Top Bar inside image */}
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-black/75 backdrop-blur-md border border-primary/40 px-3 py-1 text-[11px] sm:text-xs font-black uppercase text-primary tracking-wider">
                  🥋 {event.discipline}
                </span>
                <span className="rounded-full bg-primary/25 backdrop-blur-md border border-primary/40 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-primary">
                  {event.tier || "Sanctioned Fixture"}
                </span>
                {event.organization?.sanctioningBody && (
                  <span className="inline-flex rounded-full bg-black/65 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-white/90">
                    <ShieldCheck className="size-3 text-amber-400 mr-1 inline" /> {event.organization.sanctioningBody}
                  </span>
                )}
              </div>

              {/* Star Rating Badge */}
              <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md border border-amber-400/50 rounded-full px-2.5 sm:px-3 py-1 text-xs font-black text-amber-400 shadow-gold">
                <span>{starsCount}</span>
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
              </div>
            </div>

            {/* Bottom Content inside image */}
            <div className="space-y-2.5 sm:space-y-3 pt-6">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/85 font-mono flex-wrap">
                <span className="bg-primary/95 text-background px-2.5 sm:px-3 py-0.5 rounded-full font-bold text-[11px] sm:text-xs">
                  {event.month || "APR"} {event.year || 2026}
                </span>
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <CalendarDays className="size-3.5 sm:size-4 text-primary shrink-0" /> {event.startDate} – {event.endDate}
                </span>
                <span className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="size-3.5 sm:size-4 text-primary shrink-0" /> {event.venue}, {event.city}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight text-gold-gradient drop-shadow-md break-words leading-tight">
                {event.title}
              </h1>

              {/* Badges & Status Line */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {isOngoing ? (
                  <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 backdrop-blur-md shadow-lg">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> OnGoing
                  </span>
                ) : isCompleted ? (
                  <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-muted/80 text-muted-foreground border border-border backdrop-blur-md">
                    Completed
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-primary/25 text-primary border border-primary/50 backdrop-blur-md">
                    Upcoming Events
                  </span>
                )}

                {isUpcoming && (
                  <span
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 backdrop-blur-md",
                      isLive
                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/50"
                        : "bg-muted/80 text-muted-foreground border border-border"
                    )}
                  >
                    {isLive ? <><Unlock className="size-3 sm:size-3.5" /> Registration Open</> : <><Lock className="size-3 sm:size-3.5" /> Registration Closed</>}
                  </span>
                )}

                {event.organization?.organizer && (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-white/90 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full border border-white/20">
                    <Building2 className="size-3 text-primary shrink-0" /> {event.organization.organizer}
                  </span>
                )}

                <span className="text-[11px] sm:text-xs text-white/80 font-semibold sm:ml-auto">
                  Slots: <strong className="text-primary font-bold">{event.slots || 128}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. TOP HEADER DATE, STARS & NOTICE / STAFF BOX (Matching Image 1)
          ========================================================================= */}
      <section className="pt-6 sm:pt-8 pb-4 bg-background">
        <div className="shell max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Main Date & Rating Bar */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3 sm:pb-4 gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
              {formattedFullDate}
            </h2>
            <div className="flex items-center gap-1 sm:gap-1.5 text-amber-400 font-black text-sm sm:text-lg shrink-0">
              <span>{starsCount}</span>
              <Star className="size-4 sm:size-5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          {/* Ongoing Live Status Banner */}
          {isOngoing && (
            <div className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg animate-fadeIn">
              <div className="flex items-start sm:items-center gap-3">
                <span className="size-3.5 rounded-full bg-red-500 animate-ping shrink-0 mt-1 sm:mt-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-red-400 block">
                    🔴 Championship Matches In Progress
                  </span>
                  <p className="text-xs sm:text-sm text-foreground/90 font-medium">
                    Official tatami ring bouts and live scoring are active at {event.venue}. Follow live stream and scoring updates below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {event.liveResults?.liveStreamUrl && (
                  <a
                    href={event.liveResults.liveStreamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Play className="size-3.5 fill-current" /> Watch Live Tatami
                  </a>
                )}
                {event.drawFixtures?.liveScoreUrl && (
                  <a
                    href={event.drawFixtures.liveScoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card border border-primary/40 hover:border-primary text-primary font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
                  >
                    <Swords className="size-3.5" /> Live Scoreboard
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Completed Status Banner */}
          {isCompleted && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg animate-fadeIn">
              <div className="flex items-start sm:items-center gap-3">
                <Trophy className="size-6 sm:size-7 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                    🏆 Championship Concluded &amp; Results Official
                  </span>
                  <p className="text-xs sm:text-sm text-foreground/90 font-medium">
                    All bracket matches have finalized. Medals and team champion trophies have been awarded.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {event.resultsArchiveId && (
                  <Link
                    href={`/events/${event.resultsArchiveId}`}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gold-gradient text-background font-black text-xs uppercase tracking-wider shadow-gold text-center"
                  >
                    Full Results Archive →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("podium-results-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card border border-amber-400/50 hover:border-amber-400 text-amber-400 font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Medal className="size-3.5" /> View Medal Winners
                </button>
              </div>
            </div>
          )}

          {/* Hotel Accommodations & Staff Box */}
          <div className="luxe-card p-4 sm:p-6 border border-primary/30 bg-card/60 space-y-3 sm:space-y-4 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-primary block uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Bed className="size-3.5" /> Hotel Accommodations
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {event.topNotice?.hotelInfo ||
                  `Special negotiated athlete discount rates are available at partner hotels in ${event.city}. Please mention "${event.title}" at reservation check-in for special boarding privileges.`}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60">
              <span className="text-xs font-bold text-foreground block uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-primary" /> Staff &amp; Official Volunteers
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {event.topNotice?.staffInfo ||
                  "If you are interested in working with the official organizing committee as a certified ring official, medical assistant, or tatami staff for this championship, please complete the official application."}
                {" "}
                <button
                  type="button"
                  onClick={() => setActiveModal("staff")}
                  className="text-primary hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                >
                  [here]
                </button>
              </p>
            </div>
          </div>

          {/* =========================================================================
              3. THREE COLUMN LOGISTICS & QUICK ACTIONS SECTION (Matching Image 1)
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {/* Column 1: Location & Organizer */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 flex flex-col justify-between space-y-4 rounded-2xl">
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <MapPin className="size-4 text-primary shrink-0" /> Location &amp; Host
                </h3>
                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground">{event.venue}</p>
                  <p>{event.address || `${event.venue}, Stadium Complex Arena`}</p>
                  <p>{event.city}, India</p>
                </div>

                {/* Organizer & Contacts */}
                <div className="pt-2 border-t border-border/40 text-xs space-y-1 text-muted-foreground">
                  <p>
                    <span className="text-foreground font-semibold">Organizer:</span> {event.organization?.organizer || "KALAWAR Sports Federation"}
                  </p>
                  {event.organization?.sanctioningBody && (
                    <p>
                      <span className="text-foreground font-semibold">Sanctioned By:</span> {event.organization.sanctioningBody}
                    </p>
                  )}
                  {event.organization?.contactEmail && (
                    <p className="truncate">
                      <span className="text-foreground font-semibold">Contact:</span> {event.organization.contactEmail}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1 pt-1"
              >
                Open in Maps <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Column 2: Key Deadlines & Eligibility */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 flex flex-col justify-between space-y-4 rounded-2xl">
              <div>
                <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <CalendarDays className="size-4 text-primary shrink-0" /> Key Deadlines &amp; Entry
                </h3>
                <div className="mt-3 space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Early Registration Cutoff</span>
                    <span className="font-bold text-foreground">
                      Until {formatEventDisplayDate(event.prices?.earlyBirdDeadline, computeOffsetDate(18))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Final Registration Deadline</span>
                    <span className="font-bold text-primary">
                      Until {formatEventDisplayDate(event.prices?.standardDeadline || event.relevantDates?.registrationDeadline, computeOffsetDate(9))}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Spectators</span>
                      <span className="font-semibold text-foreground">Open to Public</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Parking &amp; Transit</span>
                      <span className="font-semibold text-foreground">Arena Parking</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold">
                * All entries include certified athlete card &amp; insurance verification
              </div>
            </div>

            {/* Column 3: Quick Action Buttons Stack */}
            <div className="flex flex-col justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveModal("teams")}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl border border-primary/40 bg-card/80 hover:bg-primary/15 text-primary text-xs font-black uppercase tracking-wider transition-all text-center shadow-sm hover:border-primary cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Users className="size-3.5 shrink-0" /> ATHLETES LIST BY TEAMS ({activeAcademies.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("divisions")}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl border border-primary/40 bg-card/80 hover:bg-primary/15 text-primary text-xs font-black uppercase tracking-wider transition-all text-center shadow-sm hover:border-primary cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Swords className="size-3.5 shrink-0" /> ATHLETES LIST BY DIVISIONS ({activeDivisions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("weightChart")}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl border border-primary/40 bg-card/80 hover:bg-primary/15 text-primary text-xs font-black uppercase tracking-wider transition-all text-center shadow-sm hover:border-primary cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Scale className="size-3.5 shrink-0" /> WEIGHT CHART &amp; LIMITS
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("weighIns")}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl border border-primary/40 bg-card/80 hover:bg-primary/15 text-primary text-xs font-black uppercase tracking-wider transition-all text-center shadow-sm hover:border-primary cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clock className="size-3.5 shrink-0" /> WEIGH INS PROTOCOL
              </button>
            </div>
          </div>

          {/* Official Schedule, Bout Order & Brackets Downloads Strip */}
          {(event.schedule?.schedulePdfUrl || event.schedule?.orderOfBoutsUrl || event.drawFixtures?.bracketsPdfUrl || event.drawFixtures?.drawUrl) && (
            <div className="luxe-card p-4 sm:p-5 border border-primary/30 bg-primary/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider">
                    Official Schedule, Bout Order &amp; Brackets
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Direct access to official tournament fixture schedules and draw sheets.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {event.schedule?.schedulePdfUrl && (
                  <a
                    href={event.schedule.schedulePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-background border border-border hover:border-primary text-xs font-bold text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="size-3.5 text-primary" /> Schedule (PDF)
                  </a>
                )}
                {event.schedule?.orderOfBoutsUrl && (
                  <a
                    href={event.schedule.orderOfBoutsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-background border border-border hover:border-primary text-xs font-bold text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="size-3.5 text-primary" /> Order of Bouts
                  </a>
                )}
                {(event.drawFixtures?.bracketsPdfUrl || event.drawFixtures?.drawUrl) && (
                  <a
                    href={event.drawFixtures.bracketsPdfUrl || event.drawFixtures.drawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-primary text-background font-black text-xs inline-flex items-center justify-center gap-1.5 transition-transform hover:scale-105 shadow-gold text-center"
                  >
                    <Swords className="size-3.5" /> View Brackets / Draw
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Centered Main Dynamic Action Button */}
          <div className="pt-2 sm:pt-4 pb-2 flex justify-center w-full">
            {isOngoing ? (
              <div className="flex items-center gap-3 flex-wrap justify-center w-full sm:w-auto">
                {event.liveResults?.liveStreamUrl ? (
                  <a
                    href={event.liveResults.liveStreamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-6 sm:px-10 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform inline-flex items-center justify-center gap-2"
                  >
                    <Play className="size-4 fill-current" /> WATCH LIVE TATAMI STREAM
                  </a>
                ) : (
                  <span className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-red-950/50 border border-red-500 text-red-400 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 text-center">
                    <Radio className="size-4 animate-pulse" /> CHAMPIONSHIP MATCHES UNDERWAY
                  </span>
                )}
              </div>
            ) : isCompleted ? (
              <div className="flex items-center gap-3 flex-wrap justify-center w-full sm:w-auto">
                {event.resultsArchiveId ? (
                  <Link
                    href={`/events/${event.resultsArchiveId}`}
                    className="w-full sm:w-auto bg-gold-gradient text-background px-6 sm:px-10 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-gold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 text-center"
                  >
                    <Trophy className="size-4" /> VIEW OFFICIAL RESULTS ARCHIVE
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("podium-results-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto bg-gold-gradient text-background px-6 sm:px-10 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-gold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Medal className="size-4" /> VIEW PODIUM MEDAL TALLY
                  </button>
                )}
              </div>
            ) : isLive ? (
              <Link
                href={`/championship/register?eventId=${encodeURIComponent(event.id)}`}
                className="w-full sm:w-auto bg-gold-gradient text-background px-6 sm:px-10 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-gold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Ticket className="size-4" /> REGISTER NOW FOR CHAMPIONSHIP
              </Link>
            ) : (
              <span className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-muted/70 text-muted-foreground text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 border border-border cursor-not-allowed text-center">
                <Lock className="size-4" /> REGISTRATION CLOSED
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. RELEVANT DATES MILESTONE GRID (Matching Image 2)
          ========================================================================= */}
      <section className="section-pad border-y border-border/60 bg-card/40">
        <div className="shell max-w-6xl mx-auto space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
              RELEVANT DATES
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              * Date(s) and time(s) based on Indian Standard Time (IST) &amp; tournament venue schedule
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-10 gap-y-3 sm:gap-y-4">
            {relevantDatesList.map((item) => {
              const isExpanded = !!expandedDates[item.key];
              return (
                <div key={item.key} className="border-b border-border/50 pb-3 p-1 sm:p-2 rounded-xl hover:bg-card/40 transition-colors">
                  <div
                    onClick={() => toggleDate(item.key)}
                    className="flex items-center justify-between gap-3 cursor-pointer group select-none"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors block">
                        {item.title}
                      </span>
                      <span className="text-xs text-primary font-mono font-semibold">
                        {item.date}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label={`Toggle ${item.title}`}
                      className="size-7 rounded-lg bg-background/80 border border-border/80 flex items-center justify-center text-primary group-hover:border-primary shrink-0 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 text-xs text-muted-foreground leading-relaxed pl-2.5 border-l-2 border-primary/50 animate-fadeIn">
                      {item.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Federation Sanctioning Seals / Logos */}
          <div className="pt-6 sm:pt-8 border-t border-border/60 flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-80">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-primary">
              <ShieldCheck className="size-4 sm:size-5 shrink-0" /> KALAWAR SANCTIONED EVENT
            </div>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-muted-foreground">
              <Award className="size-4 sm:size-5 text-amber-400 shrink-0" /> WORLD SPORTS FEDERATION AFFILIATED
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. INTERACTIVE VENUE MAP SECTION (Matching Image 3)
          ========================================================================= */}
      <section className="section-pad bg-background">
        <div className="shell max-w-6xl mx-auto space-y-6">
          <SectionHeading
            align="left"
            eyebrow="Tournament Arena"
            title="Venue Location & Directions"
            description="Official stadium layout, parking facilities, and transport connections."
          />

          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-muted relative h-64 sm:h-80 lg:h-96 w-full">
            <iframe
              title={`Map of ${event.venue}`}
              src={mapEmbedUrl}
              className="size-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
            <div className="luxe-card p-4 border border-border/80 bg-card/60 rounded-2xl">
              <span className="text-[10px] font-bold text-primary uppercase block">Arena Hall</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{event.venue}</span>
            </div>
            <div className="luxe-card p-4 border border-border/80 bg-card/60 rounded-2xl">
              <span className="text-[10px] font-bold text-primary uppercase block">City &amp; Region</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{event.city}</span>
            </div>
            <div className="luxe-card p-4 border border-border/80 bg-card/60 rounded-2xl">
              <span className="text-[10px] font-bold text-primary uppercase block">Parking &amp; Transit</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">Designated Arena Parking &amp; Transit</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BELT & AGE DIVISIONS MATRIX & OPEN CLASS (Matching Image 4)
          ========================================================================= */}
      <section className="section-pad border-y border-border/60 bg-card/40">
        <div className="shell max-w-6xl mx-auto space-y-6 sm:space-y-8">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
              BELT &amp; AGE DIVISIONS
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official division eligibility standards for Male and Female athletes
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Division Table */}
            <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-border/80 bg-card/80 shadow-lg -mx-1 sm:mx-0">
              <table className="min-w-[500px] w-full text-left text-xs">
                <thead>
                  <tr className="bg-primary/10 border-b border-border text-primary font-black uppercase tracking-wider">
                    <th className="p-3 sm:p-3.5">Year Of Birth</th>
                    <th className="p-3 sm:p-3.5">Age Division</th>
                    <th className="p-3 sm:p-3.5">Belt / Rank</th>
                    <th className="p-3 sm:p-3.5">Weight Class / Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-foreground/90">
                  {activeDivisions.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                      <td className="p-3 sm:p-3.5 font-mono text-primary font-bold">{row.birthYear}</td>
                      <td className="p-3 sm:p-3.5 font-semibold text-foreground">{row.ageDivision}</td>
                      <td className="p-3 sm:p-3.5 text-muted-foreground">{row.belts}</td>
                      <td className="p-3 sm:p-3.5 font-mono text-primary font-bold">
                        {row.weightLimit || "Per Standard Rules"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Division Rules & Eligibility Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <div className="luxe-card p-4 sm:p-5 border border-border/80 bg-card/60 space-y-3 rounded-2xl">
                <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-4 shrink-0" /> Eligibility Criteria
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  * Any athlete who holds a black belt or equivalent rank in any traditional combat sport, has competed professionally, or holds national wrestling honors, cannot compete in novice white belt divisions.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                  Official weight and rank measurements follow international standards approved by the Federation Technical Committee.
                </p>
              </div>

              {/* Open Class / Absolute Division */}
              <div className="luxe-card p-4 sm:p-5 border border-primary/30 bg-primary/5 space-y-2 rounded-2xl">
                <h4 className="text-sm font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <Trophy className="size-4 text-amber-400 shrink-0" /> OPEN CLASS (ABSOLUTE)
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {event.openClass?.description ||
                    "Open Class (Absolute) registration is available for Gold, Silver, and Bronze medalists in senior adult weight divisions. No additional fee required."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PARTICIPATING ACADEMIES & DOJOS SHOWCASE
          ========================================================================= */}
      <section className="section-pad bg-card/20 border-b border-border/60">
        <div className="shell max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <Users className="size-5 text-primary shrink-0" /> PARTICIPATING ACADEMIES &amp; TEAMS
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official affiliated martial arts academies and athletic dojos competing in this championship
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal("teams")}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card border border-primary/40 hover:border-primary text-primary font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              View Full Team Roster ({activeAcademies.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activeAcademies.slice(0, 6).map((acad, idx) => (
              <div
                key={idx}
                className="luxe-card p-4 sm:p-5 border border-border/80 bg-card/60 rounded-2xl flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider block">
                    Academy #{idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-foreground leading-snug truncate">{acad.name}</h4>
                  {acad.city && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-primary/70 shrink-0" /> {acad.city}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-black text-primary block">
                    {acad.athleteCount || 0}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Athletes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOP PODIUM & MEDALISTS SHOWCASE (Results & Medal Tally)
          ========================================================================= */}
      {((event.liveResults?.topPodium?.gold || event.liveResults?.topPodium?.silver || event.liveResults?.topPodium?.bronze) || isCompleted) && (
        <section id="podium-results-section" className="section-pad bg-background border-b border-border/60">
          <div className="shell max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-primary block">
                  CHAMPIONSHIP HONORS
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="size-5 sm:size-6 text-amber-400 shrink-0" /> OFFICIAL PODIUM WINNERS &amp; MEDAL TALLY
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Podium rankings and top medalists awarded at the official ceremony
                </p>
              </div>

              {event.resultsArchiveId && (
                <Link
                  href={`/events/${event.resultsArchiveId}`}
                  className="w-full sm:w-auto btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-gold text-center"
                >
                  Full Archive Scorecard <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>

            {(event.liveResults?.topPodium?.gold || event.liveResults?.topPodium?.silver || event.liveResults?.topPodium?.bronze) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
                {/* Gold Medalist */}
                <div className="luxe-card p-5 sm:p-6 border rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-4 text-center relative overflow-hidden transition-all border-amber-400/60 bg-amber-400/5 shadow-gold">
                  <div className="absolute top-3 right-3 text-2xl select-none">🥇</div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">
                      Rank 1 • Gold Champion
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-foreground mt-2">
                      {event.liveResults?.topPodium?.gold || "Gold Medalist TBA"}
                    </h4>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full bg-background border border-border text-[11px] font-mono text-muted-foreground">
                      Division Champion
                    </span>
                  </div>
                </div>

                {/* Silver Medalist */}
                <div className="luxe-card p-5 sm:p-6 border rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-4 text-center relative overflow-hidden transition-all border-slate-300/40 bg-slate-400/5">
                  <div className="absolute top-3 right-3 text-2xl select-none">🥈</div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300 block">
                      Rank 2 • Silver Runner-Up
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-foreground mt-2">
                      {event.liveResults?.topPodium?.silver || "Silver Medalist TBA"}
                    </h4>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full bg-background border border-border text-[11px] font-mono text-muted-foreground">
                      Finalist
                    </span>
                  </div>
                </div>

                {/* Bronze Medalist */}
                <div className="luxe-card p-5 sm:p-6 border rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-4 text-center relative overflow-hidden transition-all border-amber-700/40 bg-amber-700/5">
                  <div className="absolute top-3 right-3 text-2xl select-none">🥉</div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-600 block">
                      Rank 3 • Bronze Podium
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-foreground mt-2">
                      {event.liveResults?.topPodium?.bronze || "Bronze Medalist TBA"}
                    </h4>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full bg-background border border-border text-[11px] font-mono text-muted-foreground">
                      Semifinalist
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="luxe-card p-6 sm:p-8 border border-border/80 bg-card/60 rounded-2xl sm:rounded-3xl text-center space-y-3">
                <Medal className="size-9 sm:size-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-foreground">Official Results Verified</h4>
                <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                  Divisional medal awards and team championship trophies have been sealed. Click below to inspect verified certificates and bout scores.
                </p>
                {event.resultsArchiveId && (
                  <Link
                    href={`/events/${event.resultsArchiveId}`}
                    className="w-full sm:w-auto btn-luxe px-6 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 mt-2"
                  >
                    View Official Results Archive
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          PHOTOS & UNIVERSAL VIDEOS SHOWCASE
          ========================================================================= */}
      {((event.media?.photos && event.media.photos.length > 0) || (event.media?.videos && event.media.videos.length > 0)) && (
        <section className="section-pad bg-card/30 border-b border-border/60">
          <div className="shell max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Photos Gallery */}
            {event.media?.photos && event.media.photos.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-primary block">
                    EVENT HIGHLIGHTS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Camera className="size-5 text-primary shrink-0" /> ACTION PHOTO GALLERY ({event.media.photos.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official ringside action photography and podium medal presentation moments
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {event.media.photos.map((photo, pIdx) => {
                    const photoSrc = typeof photo === "string" ? photo : photo.src;
                    const photoTitle = typeof photo === "string" ? `Championship Photo ${pIdx + 1}` : (photo.title || `Championship Photo ${pIdx + 1}`);

                    return (
                      <div
                        key={pIdx}
                        onClick={() => setActivePhoto(photoSrc)}
                        className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border/80 hover:border-primary cursor-pointer shadow-md transition-all"
                      >
                        <img
                          src={photoSrc}
                          alt={photoTitle}
                          referrerPolicy="no-referrer"
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="size-5 sm:size-6 text-white drop-shadow-md" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Universal Videos Grid */}
            {event.media?.videos && event.media.videos.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="border-b border-border/60 pb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-primary block">
                    STREAM &amp; BROADCAST
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Tv className="size-5 text-primary shrink-0" /> UNIVERSAL VIDEO REPLAYS &amp; LIVE STREAMS ({event.media.videos.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Streamable match replays, athlete interviews, and highlight reels from YouTube, Vimeo, Instagram, and direct MP4
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {event.media.videos.map((vid, vIdx) => {
                    const parsed = parseVideoSource(vid.videoUrl);
                    const thumb = vid.thumb || (vid as any).thumbnailUrl || parsed.thumbnailUrl || IMAGES.martialArts;

                    return (
                      <div
                        key={vIdx}
                        onClick={() => setActiveVideo({ title: vid.title, videoUrl: vid.videoUrl })}
                        className="group luxe-card p-3 rounded-2xl border border-border/80 hover:border-primary bg-card/60 cursor-pointer transition-all space-y-3 shadow-lg"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                          <img
                            src={thumb}
                            alt={vid.title}
                            referrerPolicy="no-referrer"
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="size-10 sm:size-11 rounded-full bg-primary/90 text-background grid place-items-center group-hover:scale-110 transition-transform shadow-gold">
                              <Play className="size-4 sm:size-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase text-white">
                            {parsed.platformLabel}
                          </span>
                        </div>
                        <div className="px-1">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {vid.title}
                          </h4>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                            <Play className="size-3 text-primary" /> Click to watch replay
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          7. IMPORTANT INFO & POLICIES (Matching Images 5 & 6)
          ========================================================================= */}
      <section className="section-pad bg-background">
        <div className="shell max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
              IMPORTANT INFO &amp; TOURNAMENT GUIDELINES
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Read all policies carefully before completing athlete check-in
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Registration Policy */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="size-4 shrink-0" /> Registration &amp; Capacity
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.importantInfo?.registrationPolicy ||
                  "We accommodate athletes according to stadium safety and tatami mat capacity. Registration is confirmed only upon successful online payment. KALAWAR reserves the right to close registrations early if capacity is reached."}
              </p>
            </div>

            {/* Refund Policy */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Scale className="size-4 shrink-0" /> 48-Hour Refund Policy
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.importantInfo?.refundPolicy ||
                  "Registration fees are 100% refundable within 48 hours of purchase. After 48 hours, cancellations are non-refundable. If an athlete remains alone in their division bracket on Registration Checkday, they are entitled to a full refund or can choose to move to an adjacent category."}
              </p>
            </div>

            {/* Competition Day & Weigh-in */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Clock className="size-4 shrink-0" /> Competition Day &amp; Bullpen Weigh-In
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.importantInfo?.competitionDayWeighIn ||
                  "Athletes must be physically present in the bullpen warm-up area at least 1 hour prior to their estimated division start time. Mandatory government photo ID or KALAWAR Federation Card is required. Official weigh-in allows ONE single attempt immediately before the first match."}
              </p>
            </div>

            {/* Medal & Trophy Awards */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="size-4 shrink-0" /> Medal &amp; Trophy Awards
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.awards?.medalRules ||
                  "Athletes who place 1st (Gold), 2nd (Silver), and 3rd (Bronze) in their division will receive official podium medals. All medals must be picked up at the podium ceremony; unclaimed medals are not mailed post-event."}
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                <strong>Five Group Trophies Awarded:</strong> Overall Academy, Mighty-Mite, Pee-Wee, Junior, Teen.
              </div>
            </div>

            {/* Tournament T-Shirt */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Shirt className="size-4 shrink-0" /> Complimentary Tournament T-Shirt
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.tshirtInfo?.description ||
                  "All registered athletes receive a complimentary official championship dry-fit t-shirt. T-shirts must be collected at the event merchandise booth upon credential check-in."}
              </p>
            </div>

            {/* Prohibited Items Inside Venue */}
            <div className="luxe-card p-4 sm:p-6 border border-destructive/30 bg-destructive/5 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                <X className="size-4 shrink-0" /> Prohibited Inside Venue
              </h4>
              <ul className="text-xs text-foreground/90 space-y-1.5 list-disc list-inside">
                <li>No outside banners, flags, or unsanctioned promotional signage</li>
                <li>No weapons, outside food, pets, or hazardous equipment</li>
                <li>Unauthorized live streaming or commercial video recording is strictly prohibited</li>
              </ul>
            </div>

            {/* Media Professionals */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Camera className="size-4 shrink-0" /> Media &amp; Press Accreditation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.mediaAccreditation?.description ||
                  "Official media passes are limited and subject to review. Applications must be submitted at least 2 weeks prior to the event. A government-issued photo ID is required to claim the press vest."}
                {" "}
                <button
                  type="button"
                  onClick={() => setActiveModal("media")}
                  className="text-primary hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                >
                  [apply here]
                </button>
              </p>
            </div>

            {/* Organization & Sanctioning */}
            <div className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60 space-y-2.5 sm:space-y-3 rounded-2xl">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Building2 className="size-4 text-primary shrink-0" /> Official Organization
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.organization?.organizer ||
                  "This national championship is organized by the KALAWAR Sports & Martial Arts Federation of India in partnership with the World Sports Federation."}
              </p>
            </div>
          </div>

          {/* Bottom Centered REGISTER NOW Action */}
          <div className="pt-4 sm:pt-6 flex flex-col items-center justify-center gap-3 w-full">
            {isLive ? (
              <Link
                href={`/championship/register?eventId=${encodeURIComponent(event.id)}`}
                className="w-full sm:w-auto bg-gold-gradient text-background px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest shadow-gold hover:scale-105 transition-transform inline-flex items-center justify-center gap-2.5 text-center"
              >
                <Ticket className="size-5 shrink-0" /> REGISTER NOW FOR CHAMPIONSHIP
              </Link>
            ) : (
              <span className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-muted text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wider border border-border cursor-not-allowed text-center">
                REGISTRATION CLOSED
              </span>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Official digital verified certificate provided to all registered participants.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE MODALS (Teams, Divisions, Weight Chart, Weigh Ins, Staff, Media)
          ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="luxe-card border border-primary/40 bg-card w-[95vw] sm:w-full max-w-2xl max-h-[88vh] flex flex-col p-4 sm:p-6 lg:p-8 space-y-4 animate-scaleIn rounded-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-border pb-3 gap-2 shrink-0">
              <h3 className="text-sm sm:text-lg font-black text-foreground uppercase tracking-wider text-gold-gradient leading-snug">
                {activeModal === "teams" && "Athletes List by Teams / Academies"}
                {activeModal === "divisions" && "Athletes List by Divisions"}
                {activeModal === "weightChart" && "Official Weight Categories & Allowances"}
                {activeModal === "weighIns" && "Official Weigh-In Schedule & Instructions"}
                {activeModal === "staff" && "Championship Staff & Volunteer Application"}
                {activeModal === "media" && "Media & Press Accreditation Application"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="size-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed overflow-y-auto flex-1 pr-1">
              {activeModal === "teams" && (
                <div className="space-y-3">
                  <p>Official registered academies and dojos affiliated with {event.title}:</p>
                  <div className="divide-y divide-border/40 rounded-xl border border-border bg-background/60 max-h-80 overflow-y-auto">
                    {activeAcademies.map((team, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate">
                            {idx + 1}. {team.name}
                          </span>
                          {team.city && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3 text-primary/70 shrink-0" /> {team.city}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
                          {team.athleteCount || 0} Athletes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === "divisions" && (
                <div className="space-y-3">
                  <p>Official weight categories and age divisions for {event.title}:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-80 overflow-y-auto pr-1">
                    {activeDivisions.map((div: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-background/70 border border-border">
                        <span className="font-bold text-primary block">{div.ageDivision}</span>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1 gap-2">
                          <span>{div.birthYear} ({div.belts})</span>
                          <span className="font-mono font-bold text-foreground shrink-0">{div.weightLimit || "Per Standard Rules"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === "weightChart" && (
                <div className="space-y-3">
                  <p>Standard division weight limits (in kg) for {event.discipline}:</p>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-[280px] w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                      <thead className="bg-primary/10 text-primary font-bold">
                        <tr>
                          <th className="p-2.5">Division</th>
                          <th className="p-2.5">Male Limit</th>
                          <th className="p-2.5">Female Limit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        <tr><td className="p-2.5 font-bold">Rooster</td><td className="p-2.5">-57.5 kg</td><td className="p-2.5">-48.5 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Light Feather</td><td className="p-2.5">-64.0 kg</td><td className="p-2.5">-53.5 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Feather</td><td className="p-2.5">-70.0 kg</td><td className="p-2.5">-58.5 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Light</td><td className="p-2.5">-76.0 kg</td><td className="p-2.5">-64.0 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Middle</td><td className="p-2.5">-82.3 kg</td><td className="p-2.5">-69.0 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Medium Heavy</td><td className="p-2.5">-88.3 kg</td><td className="p-2.5">-74.0 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Heavy</td><td className="p-2.5">-94.3 kg</td><td className="p-2.5">-79.3 kg</td></tr>
                        <tr><td className="p-2.5 font-bold">Super Heavy</td><td className="p-2.5">+100.5 kg</td><td className="p-2.5">+79.3 kg</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModal === "weighIns" && (
                <div className="space-y-3">
                  <p className="font-bold text-foreground">Official Weigh-In Protocol:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Weigh-in takes place in the Bullpen Inspection Zone immediately before your first match.</li>
                    <li>Athletes must step onto the calibrated digital scale in full sanctioned uniform / apparel.</li>
                    <li>Only <strong>ONE (1)</strong> attempt is allowed. There are no secondary tries or weight allowances.</li>
                    <li>Failure to make weight results in immediate disqualification without refund.</li>
                  </ul>
                </div>
              )}

              {activeModal === "staff" && (
                <div className="space-y-3">
                  <p>Join the official championship organization crew! Positions include tatami ring coordination, scoring tablet operation, athlete staging, and security management.</p>
                  <p className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs">
                    Please send your resume and federation accreditation ID to <strong>support@kalawar.org</strong> with the subject line <em>"Staff Application – {event.title}"</em>.
                  </p>
                </div>
              )}

              {activeModal === "media" && (
                <div className="space-y-3">
                  <p>Certified sports photographers, broadcast crew, and registered news journalists can apply for official ringside media passes.</p>
                  <p className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs">
                    Submit your press organization details to <strong>media@kalawar.org</strong> at least 14 days prior to event commencement.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full sm:w-auto btn-luxe px-6 py-2 text-xs font-bold text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              aria-label="Close photo preview"
              className="absolute -top-12 right-0 size-9 rounded-full bg-card border border-border grid place-items-center text-foreground hover:border-primary cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <img
              src={activePhoto}
              alt="Championship Zoom View"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain shadow-2xl border border-border/80"
            />
          </div>
        </div>
      )}

      {/* UNIVERSAL VIDEO LIGHTBOX MODAL */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            className="bg-card border border-primary/40 rounded-2xl sm:rounded-3xl max-w-4xl w-[95vw] sm:w-full p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                  {parseVideoSource(activeVideo.videoUrl).platformLabel} Stream Player
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">{activeVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-border/80 shadow-lg">
              {parseVideoSource(activeVideo.videoUrl).type === "direct" ? (
                <video
                  src={parseVideoSource(activeVideo.videoUrl).directUrl}
                  controls
                  autoPlay
                  className="size-full object-contain"
                />
              ) : (
                <iframe
                  src={parseVideoSource(activeVideo.videoUrl).embedUrl}
                  title={activeVideo.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
              <span className="truncate max-w-full sm:max-w-md font-mono text-[10px] sm:text-[11px]">{activeVideo.videoUrl}</span>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary/90 cursor-pointer text-center"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT REGISTRATION MODAL */}
      <EventRegistrationModal
        event={event}
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />
    </SiteLayout>
  );
}
