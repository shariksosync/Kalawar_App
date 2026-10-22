"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Tv,
  Pin,
} from "lucide-react";
import type { VideoItem } from "@/data/videos";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: VideoItem;
  featured?: boolean;
  onOpenVideo: (video: VideoItem) => void;
}

export function VideoCard({ video, featured = false, onOpenVideo }: VideoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={() => onOpenVideo(video)}
      className={cn(
        "group relative flex flex-col bg-stone-900/90 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
        "hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10 hover:-translate-y-1",
        featured
          ? "border-gold-500/40 bg-gradient-to-br from-stone-900 via-stone-900/95 to-gold-950/20"
          : "border-stone-800/80"
      )}
    >
      {/* Thumbnail Aspect Ratio Box */}
      <div className="relative aspect-video w-full overflow-hidden bg-stone-950">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
        />

        {/* Shimmer Placeholder if image loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-stone-900 animate-pulse flex items-center justify-center">
            <Tv className="w-8 h-8 text-stone-700" />
          </div>
        )}

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-stone-900/90 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-md">
            <Tv className="w-3 h-3 text-amber-400" />
            {video.category}
          </span>

          {video.pinned && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-amber-400 text-stone-950 shadow-md">
              <Pin className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}
        </div>

        {/* Center Glowing Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gold-gradient text-background flex items-center justify-center shadow-lg shadow-gold/40 transform transition-transform duration-300 group-hover:scale-115">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Bottom Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-stone-200 font-mono text-[11px] font-semibold border border-stone-700">
              <Clock className="w-3 h-3 text-amber-400" />
              {video.duration}
            </span>
          </div>
        )}
      </div>

      {/* Video Info Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            {video.title}
          </h3>


          {video.description && (
            <p className="mt-1.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-3">
            {video.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gold-500/70" />
                {new Date(video.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}

            {video.venue && (
              <span className="hidden sm:flex items-center gap-1 truncate max-w-[140px]">
                <MapPin className="w-3 h-3 text-gold-500/70 shrink-0" />
                <span className="truncate">{video.venue}</span>
              </span>
            )}
          </div>

          {video.channelOrCredit && (
            <span className="text-[11px] text-stone-400 font-medium truncate max-w-[130px]">
              {video.channelOrCredit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
