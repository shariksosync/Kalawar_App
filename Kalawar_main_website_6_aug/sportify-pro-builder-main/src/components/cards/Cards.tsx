import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowUpRight, Calendar, Clock, Pin, FileText, Sparkles } from "lucide-react";
import type { SportEvent } from "@/data/events";
import type { NewsItem } from "@/data/content";
import type { Player, Coach } from "@/data/people";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Upcoming: "bg-primary/15 text-primary border-primary/30",
  Ongoing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Completed: "bg-muted text-muted-foreground border-border",
};

export function EventCard({ event }: { event: SportEvent }) {
  const { isAuthenticated } = useAuth();
  return (
    <article className="luxe-card hover-lift group flex h-full w-full max-w-full flex-col overflow-hidden">
      <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
        />
        <div className="from-card absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none" />
        <span
          className={cn(
            "absolute top-3 left-3 sm:top-4 sm:left-4 rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md max-w-[50%] truncate",
            statusTone[event.status],
          )}
        >
          {event.status}
        </span>
        <span className="glass absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-medium max-w-[45%] truncate">
          {event.discipline}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-6 min-w-0">
        <h3 className="text-lg sm:text-xl leading-snug font-semibold text-balance break-words [overflow-wrap:anywhere]">
          {event.title}
        </h3>
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
          {event.summary}
        </p>
        <dl className="text-muted-foreground mt-4 sm:mt-5 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="text-primary size-4 shrink-0" />
            <span className="truncate">
              {new Date(event.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="text-primary size-4 shrink-0" />
            <span className="truncate">
              {event.venue}, {event.city}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="text-primary size-4 shrink-0" />
            <span className="truncate">
              {event.slots} slots · Entry {event.entryFee}
            </span>
          </div>
        </dl>
        <div className="border-border/60 mt-5 sm:mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 sm:pt-5">
          <Link
            href={`/events/${event.id}`}
            className="text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
          >
            Event details <ArrowUpRight className="size-4 shrink-0" />
          </Link>
          {!isAuthenticated ? (
            <Link
              href="/register?type=player"
              className="border-border/70 hover:border-primary rounded-full border px-3.5 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold transition-colors"
            >
              Register
            </Link>
          ) : (
            <Link
              href={`/events/${event.id}`}
              className="border-border/70 hover:border-primary text-primary rounded-full border px-3.5 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold transition-colors"
            >
              View Fixture
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  const isPinned = item.pinned || item.tag === "Urgent" || item.tag === "Pinned";

  return (
    <Link
      href={`/news/${item.slug}`}
      className={cn(
        "luxe-card hover-lift group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl transition-all duration-300 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 w-full max-w-full min-w-0 box-border",
        featured && "lg:grid lg:grid-cols-12 lg:items-stretch max-w-5xl mx-auto",
      )}
    >
      {/* Top Accent Line on Hover */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gold-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />

      {/* Image & Badges Container */}
      <div
        className={cn(
          "relative overflow-hidden shrink-0 w-full bg-slate-950",
          featured
            ? "aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[280px] lg:col-span-5"
            : "aspect-[16/10] sm:aspect-[16/9]",
        )}
      >
        <img
          src={item.image || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80"}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80";
          }}
          className="size-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Multi-tier gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Category & Pinned) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-950/85 border border-primary/40 text-primary px-3 py-0.5 text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-md">
              {item.category}
            </span>
            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
                ★ PINNED
              </span>
            )}
          </div>

          {item.tag && !isPinned && item.tag !== "Latest" && (
            <span className="rounded-full bg-slate-900/80 border border-border/80 text-foreground/90 px-2.5 py-0.5 text-[9px] font-bold uppercase backdrop-blur-md">
              {item.tag}
            </span>
          )}
        </div>

        {/* Attached Document Indicator Badge (Bottom Right of Image) */}
        {item.documentName && (
          <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/90 border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-slate-200 flex items-center gap-1.5 backdrop-blur-md shadow-lg z-10">
            <span className="text-primary font-bold">PDF</span>
            <span className="text-slate-300">Attached</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div
        className={cn(
          "p-5 sm:p-6 flex flex-col justify-between flex-1 min-w-0 w-full overflow-hidden box-border",
          featured ? "lg:col-span-7 lg:p-7" : "",
        )}
      >
        <div className="min-w-0 w-full overflow-hidden">
          {/* Metadata Row: Date · Reading Time · Location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-muted-foreground text-xs font-medium">
            <div className="flex items-center gap-1.5 text-foreground/80">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <span>
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <span>{item.readTime || "3 min read"}</span>
            </div>
            {item.location && (
              <>
                <span>·</span>
                <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[200px]">
                  <MapPin className="size-3.5 text-primary/70 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </>
            )}
          </div>

          {/* Article Title */}
          <h3
            className={cn(
              "group-hover:text-primary mt-3 font-bold transition-colors leading-snug break-words [overflow-wrap:anywhere]",
              featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
            )}
          >
            {item.title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground/90 mt-2.5 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
            {item.excerpt}
          </p>
        </div>

        {/* Luxury Footer with Actions (Fully Readable, No Truncation) */}
        <div className="pt-4 mt-5 border-t border-border/60 flex flex-col gap-3">
          {item.actionText && (
            <div className="w-full">
              <span className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wide shadow-sm transition-all group-hover:bg-amber-500/20 group-hover:border-amber-500/50 text-center">
                <span>{item.actionText}</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold group-hover:underline">
              <span>Read Full Notice</span>
              <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span className="text-[11px] text-muted-foreground/70 font-medium group-hover:text-muted-foreground transition-colors">
              Official Press
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PlayerCard({ player }: { player: Player }) {
  return (
    <article className="luxe-card hover-lift group overflow-hidden w-full max-w-full">
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={player.image}
          alt={player.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
        />
        <div className="from-card absolute inset-0 bg-gradient-to-t via-card/20 to-transparent pointer-events-none" />
        <span className="bg-gold-gradient text-background absolute top-3 left-3 sm:top-4 sm:left-4 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold">
          RANK #{player.rank}
        </span>
        <div className="absolute right-4 bottom-3 left-4 sm:right-5 sm:bottom-4 sm:left-5 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold truncate">{player.name}</h3>
          <p className="text-primary text-xs tracking-wider uppercase truncate">{player.discipline || "Kalawar Martial Arts"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/60 text-center">
        {(["gold", "silver", "bronze"] as const).map((m) => (
          <div key={m} className="py-3 sm:py-4">
            <p className="text-base sm:text-lg font-semibold">{player.medals[m]}</p>
            <p className="text-muted-foreground text-[9px] sm:text-[10px] tracking-widest uppercase">{m}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <article className="luxe-card hover-lift flex items-center gap-3 sm:gap-5 p-3.5 sm:p-5 w-full max-w-full min-w-0 overflow-hidden">
      <img
        src={coach.image}
        alt={coach.name}
        loading="lazy"
        className="border-primary/30 size-16 sm:size-20 shrink-0 rounded-xl sm:rounded-2xl border object-cover"
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <h3 className="truncate text-sm sm:text-base font-semibold">{coach.name}</h3>
        <p className="text-primary text-xs tracking-wider uppercase truncate">{coach.discipline || "Kalawar Martial Arts"}</p>
        <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs truncate">
          {coach.level} · {coach.experience} yrs · {coach.athletesTrained} athletes
        </p>
      </div>
    </article>
  );
}
