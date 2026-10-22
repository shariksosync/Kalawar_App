"use client";

import { useEffect, useCallback, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  Camera,
  Layers,
  ExternalLink,
} from "lucide-react";
import type { IPhotoItem } from "@/types/album";
import type { AlbumItem } from "@/data/albums";
import { downloadFile, cn } from "@/lib/utils";

interface PhotoLightboxProps {
  isOpen: boolean;
  album: AlbumItem | null;
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightbox({
  isOpen,
  album,
  initialIndex = 0,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, album]);

  const photos = album?.photos || [];
  const currentPhoto: IPhotoItem | undefined = photos[currentIndex];

  const handleNext = useCallback(() => {
    if (photos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
    setTouchStart(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen || !album || photos.length === 0 || !currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl text-white animate-in fade-in duration-200 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/60 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="rounded-full bg-primary/20 border border-primary/40 text-primary px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            {album.category}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {album.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="font-semibold text-amber-400">
                Photo {currentIndex + 1} of {photos.length}
              </span>
              <span>·</span>
              <span className="truncate">{album.venue}</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              downloadFile(
                currentPhoto.url,
                `${album.slug}-photo-${currentIndex + 1}.jpg`
              )
            }
            title="Download High-Res Photo"
            className="size-9 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-200 transition-colors"
          >
            <Download className="size-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="size-9 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 hidden sm:flex items-center justify-center text-zinc-200 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Lightbox (Esc)"
            className="size-9 rounded-xl border border-white/20 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Stage (Photo & Navigation Arrows) */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden min-h-0">
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-14 rounded-full border border-white/20 bg-black/60 hover:bg-primary hover:text-black hover:border-primary text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="size-6 sm:size-7" />
          </button>
        )}

        {/* High-Res Image Display */}
        <div className="relative size-full flex items-center justify-center">
          <img
            key={currentPhoto.url}
            src={currentPhoto.url}
            alt={currentPhoto.caption || album.title}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-14 rounded-full border border-white/20 bg-black/60 hover:bg-primary hover:text-black hover:border-primary text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="size-6 sm:size-7" />
          </button>
        )}
      </div>

      {/* 3. Bottom Information & Thumbnail Strip */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-black/80 backdrop-blur-md z-20 shrink-0 space-y-3">
        {/* Caption & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="space-y-1 min-w-0">
            <p className="text-zinc-100 font-medium text-xs sm:text-sm line-clamp-2">
              {currentPhoto.caption || album.description || album.title}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-primary" />
                {new Date(album.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-primary" />
                {album.venue} {album.state ? `(${album.state})` : ""}
              </span>
              {(currentPhoto.photographer || album.photographerCredit) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Camera className="size-3" />
                    Credit: {currentPhoto.photographer || album.photographerCredit}
                  </span>
                </>
              )}
            </div>
          </div>

          {album.eventLink && (
            <a
              href={album.eventLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold shrink-0 transition-colors"
            >
              <span>View Related Event</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        {/* Thumbnail Filmstrip */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-white/20">
            {photos.map((p, idx) => (
              <button
                type="button"
                key={p.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative size-12 sm:size-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                  currentIndex === idx
                    ? "border-primary ring-2 ring-primary/40 scale-105"
                    : "border-white/10 opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={p.url}
                  alt={`Thumb ${idx + 1}`}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
