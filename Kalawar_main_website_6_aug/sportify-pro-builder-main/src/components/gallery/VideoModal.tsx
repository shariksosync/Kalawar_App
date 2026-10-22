"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Play,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Film,
  Sparkles,
  Clock,
  Eye,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import type { VideoItem } from "@/data/videos";
import { cn } from "@/lib/utils";

interface VideoModalProps {
  isOpen: boolean;
  video: VideoItem | null;
  allVideos?: VideoItem[];
  onClose: () => void;
  onSelectVideo?: (video: VideoItem) => void;
}

export function VideoModal({
  isOpen,
  video,
  allVideos = [],
  onClose,
  onSelectVideo,
}: VideoModalProps) {
  const [copied, setCopied] = useState(false);

  // Keyboard navigation (Esc to close, Left/Right for prev/next)
  const currentIndex = video && allVideos.length > 0
    ? allVideos.findIndex((v) => v.id === video.id)
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allVideos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectVideo && allVideos[currentIndex - 1]) {
      onSelectVideo(allVideos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, onSelectVideo, allVideos]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectVideo && allVideos[currentIndex + 1]) {
      onSelectVideo(allVideos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, onSelectVideo, allVideos]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !video) return null;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.origin + "/gallery/videos?v=" + (video.slug || video.id);
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Video link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Build embed URL based on video type
  let embedSrc = "";
  if (video.videoType === "youtube" && video.videoId) {
    embedSrc = `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`;
  } else if (video.videoType === "vimeo" && video.videoId) {
    embedSrc = `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
  } else if (video.videoUrl) {
    // If URL already looks like an embed or other URL
    if (video.videoUrl.includes("youtube.com") || video.videoUrl.includes("youtu.be")) {
      const match = video.videoUrl.match(/(?:youtu\.be\/|watch\?v=|embed\/)([\w-]{11})/i);
      if (match && match[1]) {
        embedSrc = `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
      } else {
        embedSrc = video.videoUrl;
      }
    } else {
      embedSrc = video.videoUrl;
    }
  }

  const isNativeVideo = video.videoType === "mp4" || embedSrc.endsWith(".mp4") || embedSrc.endsWith(".webm");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Cinema Modal Container */}
      <div className="relative w-full max-w-6xl max-h-[96vh] flex flex-col bg-stone-950 border border-gold-500/30 rounded-2xl shadow-2xl shadow-black overflow-hidden z-10">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-stone-900/90 border-b border-gold-500/20 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              {video.category}
            </span>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-stone-100 truncate tracking-tight">
              {video.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition-colors"
              title="Share Video"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>


            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg bg-stone-800/80 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-700 transition-colors"
              title="Close Player (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Box (16:9 Aspect Ratio) */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
          {isNativeVideo ? (
            <video
              src={embedSrc}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : embedSrc ? (
            <iframe
              src={embedSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="text-center p-8 text-stone-400">
              <Film className="w-12 h-12 mx-auto mb-3 text-stone-600 animate-pulse" />
              <p>Unable to load video stream</p>
            </div>
          )}

          {/* Floating Prev / Next Quick Nav on Desktop */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-gold-gradient hover:text-background text-white backdrop-blur-md border border-white/20 transition-all shadow-lg group"
              title="Previous Video (←)"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-gold-gradient hover:text-background text-white backdrop-blur-md border border-white/20 transition-all shadow-lg group"
              title="Next Video (→)"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Video Information & Meta Footer */}
        <div className="p-4 sm:p-6 bg-stone-900/95 border-t border-stone-800 overflow-y-auto max-h-[30vh]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {video.title}
              </h3>

              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                {video.duration && (
                  <span className="flex items-center gap-1 font-mono text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {video.duration}
                  </span>
                )}
                {video.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(video.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {video.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {video.venue} {video.district ? `(${video.district})` : ""}
                  </span>
                )}
                {video.channelOrCredit && (
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-medium">
                    {video.channelOrCredit}
                  </span>
                )}
              </div>

              {/* Description */}
              {video.description && (
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed pt-1">
                  {video.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap lg:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 lg:pt-0">
              {video.eventLink && (
                <Link
                  href={video.eventLink}
                  className="bg-gold-gradient text-background inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-gold transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span>Event Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}


              {/* Mobile Prev / Next Controls */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none"
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
