"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, ArrowRight, X, Sparkles } from "lucide-react";
import { type IntroVideoFrequency } from "@/types/settings";
import { parseVideoUrl } from "@/lib/video-utils";

interface IntroVideoOverlayProps {
  enabled?: boolean;
  videoUrl?: string;
  frequency?: IntroVideoFrequency;
  title?: string;
  tagline?: string;
  onEnter?: () => void;
}

const SESSION_STORAGE_KEY = "kalawar_intro_seen_v1";

export function IntroVideoOverlay({
  enabled = true,
  videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-training-in-a-dojo-42866-large.mp4",
  frequency = "once_per_session",
  title = "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA",
  tagline = "Indian Martial Arts • Sports • Skill • Discipline • Excellence",
  onEnter,
}: IntroVideoOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cleanTitle = useMemo(() => {
    return (title || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA")
      .replace(/🇮🇳/g, "")
      .trim();
  }, [title]);

  const parsed = useMemo(() => {
    return parseVideoUrl(videoUrl || "");
  }, [videoUrl]);

  // Reset error state if video URL changes
  useEffect(() => {
    setMediaError(false);
  }, [videoUrl]);

  useEffect(() => {
    if (!enabled || frequency === "never") {
      setIsOpen(false);
      return;
    }

    if (frequency === "once_per_session") {
      const seen = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (seen) {
        setIsOpen(false);
        return;
      }
    }

    // Show intro
    setIsOpen(true);
  }, [enabled, frequency]);

  // Handle escape key to exit intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (frequency === "once_per_session") {
          sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
        }
        setIsOpen(false);
        if (onEnter) onEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, frequency, onEnter]);

  const handleClose = () => {
    if (frequency === "once_per_session") {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    }
    setIsOpen(false);
    if (onEnter) onEnter();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between overflow-hidden bg-black text-white select-none"
        >
          {/* ========================================================= */}
          {/* Universal Background Video Player: YouTube / Drive / MP4 */}
          {/* ========================================================= */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {parsed.type === "youtube" && parsed.videoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&mute=${
                  isMuted ? 1 : 0
                }&controls=0&loop=1&playlist=${
                  parsed.videoId
                }&playsinline=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
                allow="autoplay; encrypted-media; fullscreen"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] pointer-events-none border-0 object-cover"
                title="KALAWAR YouTube Intro Video"
              />
            ) : parsed.type === "vimeo" && parsed.videoId ? (
              <iframe
                src={`https://player.vimeo.com/video/${parsed.videoId}?autoplay=1&muted=${
                  isMuted ? 1 : 0
                }&loop=1&background=1&controls=0`}
                allow="autoplay; fullscreen"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] pointer-events-none border-0 object-cover"
                title="KALAWAR Vimeo Intro Video"
              />
            ) : parsed.type === "drive" && parsed.videoId ? (
              <video
                ref={videoRef}
                src={mediaError ? "https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-training-in-a-dojo-42866-large.mp4" : `/api/video-stream?id=${parsed.videoId}`}
                poster={`https://lh3.googleusercontent.com/d/${parsed.videoId}`}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onError={() => setMediaError(true)}
                className="size-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={mediaError ? "https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-training-in-a-dojo-42866-large.mp4" : (parsed.directUrl || videoUrl)}
                poster={parsed.thumbnailUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onError={() => setMediaError(true)}
                className="size-full object-cover"
              />
            )}

            {/* Subtle Edge Scrims for Controls & Actions (Keeps Central 80% Unobscured) */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
          </div>

          {/* Top Bar: Action Controls */}
          <div className="relative z-10 w-full max-w-7xl px-4 sm:px-8 pt-5 sm:pt-7 flex items-center justify-end">
            <div className="flex items-center gap-2.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                className="size-9 rounded-full border border-white/20 bg-black/50 text-white hover:border-gold-400 hover:text-gold-300 grid place-items-center transition-all backdrop-blur-md active:scale-95 shadow-md"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>

              {/* Skip Button */}
              <button
                type="button"
                onClick={handleClose}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:border-gold-400 hover:text-gold-300 transition-all backdrop-blur-md active:scale-95 shadow-md"
              >
                <span>Skip Intro</span>
                <X className="size-3.5 opacity-70 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Spacer to keep center 100% open and clear */}
          <div className="flex-1" />

          {/* Bottom Bar: Compact Brand (Left) & Enter CTA (Right) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 w-full max-w-7xl px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6"
          >
            {/* Left: Compact Logo & Titles */}
            <div className="flex items-center gap-3.5 max-w-2xl">
              {/* Compact Emblem */}
              <div className="size-12 sm:size-14 rounded-full bg-white/95 overflow-hidden shadow-lg flex items-center justify-center p-1 border border-white/30 shrink-0">
                <img
                  src="/logo.png"
                  alt="KALAWAR Federation Logo"
                  className="size-full object-contain"
                />
              </div>

              {/* Text Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-gold-300">
                    <Sparkles className="size-2.5 text-primary" />
                    <span>National Governing Body</span>
                  </span>
                </div>
                <h1 className="font-display text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-snug">
                  {cleanTitle}
                </h1>
                <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-gold-gradient uppercase drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] line-clamp-1">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Right: Sleek Enter Button */}
            <div className="w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto group relative overflow-hidden rounded-full bg-gold-gradient py-3 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-black shadow-[0_4px_20px_rgba(234,179,8,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Enter Website <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/25 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
