"use client";

import { useSettings } from "@/lib/settings-context";
import { Sparkles, Trophy } from "lucide-react";

export function AnnouncementBanner() {
  const { settings } = useSettings();

  const isEnabled =
    settings.announcementBannerEnabled !== false &&
    Boolean(settings.announcementBanner && settings.announcementBanner.trim());

  if (!isEnabled) {
    return null;
  }

  const text = settings.announcementBanner?.trim() || "";

  return (
    <div
      role="region"
      aria-label="Federation Announcement"
      className="bg-gold-gradient text-background border-b border-primary/30 overflow-hidden relative z-50 select-none shadow-[0_2px_10px_rgba(234,179,8,0.25)]"
    >
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 32px;
          white-space: nowrap;
          width: max-content;
          animation: marquee-scroll 130s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="py-1.5 sm:py-2">
        <div className="marquee-track cursor-default">
          {/* First segment */}
          {Array.from({ length: 10 }).flatMap((_, i) => [
            <div
              key={`ann-a-${i}`}
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs md:text-[12.5px] font-bold tracking-wide uppercase drop-shadow-xs"
            >
              {i % 2 === 0 ? (
                <Trophy className="size-3 sm:size-3.5 shrink-0 text-background" />
              ) : (
                <Sparkles className="size-3 sm:size-3.5 shrink-0 text-background" />
              )}
              <span>{text}</span>
            </div>,
            <span
              key={`ann-a-dot-${i}`}
              className="inline-block size-1.5 rounded-full bg-background/40 shrink-0"
            />,
          ])}
          {/* Duplicate segment for smooth infinite loop */}
          {Array.from({ length: 10 }).flatMap((_, i) => [
            <div
              key={`ann-b-${i}`}
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs md:text-[12.5px] font-bold tracking-wide uppercase drop-shadow-xs"
            >
              {i % 2 === 0 ? (
                <Trophy className="size-3 sm:size-3.5 shrink-0 text-background" />
              ) : (
                <Sparkles className="size-3 sm:size-3.5 shrink-0 text-background" />
              )}
              <span>{text}</span>
            </div>,
            <span
              key={`ann-b-dot-${i}`}
              className="inline-block size-1.5 rounded-full bg-background/40 shrink-0"
            />,
          ])}
        </div>
      </div>
    </div>
  );
}
