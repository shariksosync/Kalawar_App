"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { BannerSlide, defaultBannerSlides } from "@/types/settings";

export { defaultBannerSlides as bannerSlides };

const SLIDE_DURATION = 10000; // 10 seconds per slide

export function HomeImageBanner() {
  const { settings } = useSettings();

  const slides: BannerSlide[] = useMemo(() => {
    if (Array.isArray(settings?.bannerSlides) && settings.bannerSlides.length > 0) {
      const active = settings.bannerSlides.filter((s) => s.active !== false && s.image?.trim());
      if (active.length > 0) return active;
    }
    return defaultBannerSlides;
  }, [settings?.bannerSlides]);

  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Keep current slide within bounds if slides array changes
  useEffect(() => {
    if (current >= slides.length) {
      setCurrent(0);
      setProgress(0);
    }
  }, [slides.length, current]);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    if (index === current) return;
    setCurrent(index);
    setProgress(0);
  };

  // Continuous 60fps Progress Timer & Auto-Switch (10s duration)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const intervalTime = 50; // Smooth 60fps progress update
    const step = (intervalTime / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          nextSlide();
          return 0;
        }
        return old + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slides.length]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  const fallbackImage = slides[0]?.image || defaultBannerSlides[0].image;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative w-full overflow-hidden bg-black select-none border-b border-primary/25 shadow-[0_15px_45px_rgba(0,0,0,0.9)]"
    >
      {/* Top Gold Continuous Progress Bar */}
      {slides.length > 1 && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10 backdrop-blur-xs">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.85)] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Full-Width 16:9 Widescreen Image Container - 100% Unclipped Proportional Height */}
      <div
        className="relative w-full overflow-hidden bg-black flex items-center justify-center"
        style={{ width: "100%", aspectRatio: "1672 / 941" }}
      >
        {/* In-flow Natural Height Spacer Image: guarantees the parent container dynamically expands to the exact 1672:941 height on all devices */}
        <img
          src={fallbackImage}
          alt=""
          aria-hidden="true"
          className="w-full h-auto block opacity-0 pointer-events-none select-none invisible"
        />

        {slides.map((slide, idx) => {
          const isActive = idx === current;
          const imgElement = (
            <img
              src={slide.image}
              alt={slide.alt || slide.title || `Banner Slide ${idx + 1}`}
              className="size-full w-full h-full object-contain object-center select-none"
              loading={idx === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          );

          return (
            <div
              key={slide.id || `slide-${idx}`}
              aria-hidden={!isActive}
              className={`absolute inset-0 size-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {slide.link ? (
                <a
                  href={slide.link}
                  target={slide.link.startsWith("http") ? "_blank" : undefined}
                  rel={slide.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block size-full w-full h-full cursor-pointer"
                  title={slide.title || slide.alt || undefined}
                >
                  {imgElement}
                </a>
              ) : (
                imgElement
              )}
            </div>
          );
        })}
      </div>

      {/* Prev / Next Frosted Glass Buttons (Subtly Visible on Desktop Hover) */}
      {slides.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-3 sm:left-5 z-20 flex items-center pointer-events-none">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous Banner"
              className="size-9 sm:size-11 rounded-full bg-background/80 hover:bg-primary/25 border border-border/80 hover:border-primary text-foreground hover:text-primary flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer pointer-events-auto"
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-3 sm:right-5 z-20 flex items-center pointer-events-none">
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next Banner"
              className="size-9 sm:size-11 rounded-full bg-background/80 hover:bg-primary/25 border border-border/80 hover:border-primary text-foreground hover:text-primary flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer pointer-events-auto"
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>
          </div>
        </>
      )}

      {/* Bottom Gold Pill Pagination Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 sm:gap-2">
          {slides.map((slide, index) => {
            const isActive = index === current;
            return (
              <button
                key={slide.id || `dot-${index}`}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to banner slide ${index + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out cursor-pointer ${
                  isActive
                    ? "w-8 sm:w-11 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.95)]"
                    : "w-2.5 bg-white/40 hover:bg-white/70 hover:w-4"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
