"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function GallerySwitcher() {
  const pathname = usePathname();
  const isPhotos = pathname === "/gallery" || pathname === "/gallery/photos";
  const isVideos = pathname === "/gallery/videos";

  return (
    <div className="flex justify-center items-center w-full my-6">
      <div className="inline-flex items-center p-1.5 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-xl shadow-xl">
        {/* Photo Albums Tab */}
        <Link
          href="/gallery"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all duration-300",
            isPhotos
              ? "bg-gold-gradient text-background shadow-gold scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          )}
        >
          <Camera className={cn("size-4", isPhotos ? "text-background" : "text-primary")} />
          <span>📸 Photo Albums</span>
        </Link>

        {/* Video Gallery Tab */}
        <Link
          href="/gallery/videos"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all duration-300",
            isVideos
              ? "bg-gold-gradient text-background shadow-gold scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          )}
        >
          <Video className={cn("size-4", isVideos ? "text-background" : "text-primary")} />
          <span>🎥 Video Gallery</span>
        </Link>
      </div>
    </div>
  );
}
