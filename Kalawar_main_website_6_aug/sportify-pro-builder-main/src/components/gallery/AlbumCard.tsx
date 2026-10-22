"use client";

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Camera,
  Layers,
  ExternalLink,
  Eye,
  Sparkles,
} from "lucide-react";
import type { AlbumItem } from "@/data/albums";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: AlbumItem;
  featured?: boolean;
  onOpenLightbox: (album: AlbumItem, initialIndex?: number) => void;
}

export function AlbumCard({ album, featured = false, onOpenLightbox }: AlbumCardProps) {
  const photoCount = album.photos?.length || 0;

  return (
    <article
      onClick={() => onOpenLightbox(album, 0)}
      className={cn(
        "luxe-card hover-lift group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl transition-all duration-300 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer w-full max-w-full min-w-0 box-border",
        featured && "lg:grid lg:grid-cols-12 lg:items-stretch max-w-5xl mx-auto"
      )}
    >
      {/* Top Gold Shimmer Accent Line on Hover */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gold-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />

      {/* Album Cover Photo Container */}
      <div
        className={cn(
          "relative overflow-hidden shrink-0 w-full bg-slate-950",
          featured
            ? "aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[280px] lg:col-span-5"
            : "aspect-[16/10] sm:aspect-[16/9]"
        )}
      >
        <img
          src={
            album.coverPhoto ||
            (album.photos?.[0]?.url ??
              "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80")
          }
          alt={album.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1600&q=80";
          }}
          className="size-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

        {/* Floating Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-950/85 border border-primary/40 text-primary px-3 py-0.5 text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-md">
              {album.category}
            </span>
            {album.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
                ★ FEATURED ALBUM
              </span>
            )}
          </div>
        </div>

        {/* Photo Count Badge (Bottom Right) */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/90 border border-white/15 px-2.5 py-1 text-[10px] font-bold text-slate-200 flex items-center gap-1.5 backdrop-blur-md shadow-lg z-10">
          <Layers className="size-3 text-primary" />
          <span>{photoCount} {photoCount === 1 ? "Photo" : "Photos"}</span>
        </div>
      </div>

      {/* Content Container */}
      <div
        className={cn(
          "p-5 sm:p-6 flex flex-col justify-between flex-1 min-w-0 w-full overflow-hidden box-border",
          featured ? "lg:col-span-7 lg:p-7" : ""
        )}
      >
        <div className="min-w-0 w-full overflow-hidden">
          {/* Metadata Row: Date & Venue */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-muted-foreground text-xs font-medium">
            <div className="flex items-center gap-1.5 text-foreground/80">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <span>
                {new Date(album.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1 text-muted-foreground truncate max-w-[220px]">
              <MapPin className="size-3.5 text-primary/70 shrink-0" />
              <span className="truncate">
                {album.venue} {album.state ? `· ${album.state}` : ""}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3
            className={cn(
              "group-hover:text-primary mt-3 font-bold transition-colors leading-snug break-words [overflow-wrap:anywhere]",
              featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            )}
          >
            {album.title}
          </h3>

          {/* Description */}
          {album.description && (
            <p className="text-muted-foreground/90 mt-2.5 line-clamp-2 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
              {album.description}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-5 border-t border-border/60 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary group-hover:text-primary-light transition-colors">
            <Eye className="size-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>View Full Album ({photoCount})</span>
          </div>

          {album.photographerCredit && (
            <span className="text-[11px] text-muted-foreground/70 font-medium truncate max-w-[150px]">
              📷 {album.photographerCredit}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
