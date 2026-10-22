"use client";

import { useState } from "react";
import {
  Wrench,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw,
  Trophy,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "@/lib/settings-context";
import { federation } from "@/constants/navigation";

export function MaintenanceView() {
  const { settings } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fedName =
    settings.federationName ||
    federation.name ||
    "KALAWAR Sports & Martial Arts Federation of India";
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;
  const activeSeason = settings.activeSeason || "2026";

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden selection:bg-primary selection:text-background">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[36rem] sm:size-[48rem] rounded-full bg-gold-gradient opacity-[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 size-[28rem] rounded-full bg-primary/10 opacity-[0.06] blur-[120px]" />

      {/* Decorative Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(var(--color-primary) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header with Official Logo (Admin button removed) */}
      <header className="relative z-10 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-11 sm:size-13 shrink-0 overflow-hidden rounded-full border border-primary/50 bg-background/95 p-1 shadow-gold ring-1 ring-primary/30">
              <img
                src="/logo.png"
                alt={fedName}
                className="size-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="block text-sm sm:text-base lg:text-[17px] font-black tracking-[0.12em] uppercase text-gold-gradient drop-shadow-sm">
                KALAWAR SPORTS
              </span>
              <span className="text-[9.5px] sm:text-[11.5px] font-bold text-gold-gradient whitespace-nowrap drop-shadow-sm">
                &amp; Martial Arts Federation of India
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
              </span>
              <span className="hidden sm:inline">System Maintenance</span>
              <span className="sm:hidden">Maintenance</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Maintenance Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center justify-center">
        {/* Animated Badge & Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-6"
        >
          <div className="size-20 sm:size-24 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-gold ring-1 ring-primary/20 backdrop-blur-xl">
            <Wrench className="size-10 sm:size-12 animate-pulse text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-gold-gradient flex items-center justify-center text-background shadow-gold">
            <Sparkles className="size-4" />
          </div>
        </motion.div>

        {/* Heading & Subtext */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-gold">
            <Clock className="size-3.5" />
            <span>Season {activeSeason} Platform Upgrades</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
            Portal Under Scheduled{" "}
            <span className="text-gold-gradient">Maintenance</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
            The official portal of{" "}
            <strong className="text-foreground font-semibold">{fedName}</strong>{" "}
            is currently undergoing essential infrastructure enhancements and database
            upgrades in preparation for the upcoming{" "}
            <span className="text-primary font-semibold">{activeSeason}</span>{" "}
            national championships and tournament calendar.
          </p>
        </motion.div>

        {/* Feature Highlights of Upgrades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full mt-10 text-left"
        >
          <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-lg hover:border-primary/40 transition-all">
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
              <Trophy className="size-4.5" />
            </div>
            <h2 className="text-sm font-bold text-foreground">
              Tournament Engine
            </h2>
            <p className="text-muted-foreground text-xs mt-1 leading-normal">
              Upgrading real-time bracket generation and live match scoring protocols.
            </p>
          </div>

          <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-lg hover:border-primary/40 transition-all">
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
              <ShieldCheck className="size-4.5" />
            </div>
            <h2 className="text-sm font-bold text-foreground">
              Digital Verification
            </h2>
            <p className="text-muted-foreground text-xs mt-1 leading-normal">
              Enhanced cryptographic QR certificate verification and athlete database.
            </p>
          </div>

          <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-lg hover:border-primary/40 transition-all">
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
              <Zap className="size-4.5" />
            </div>
            <h2 className="text-sm font-bold text-foreground">
              High-Speed Sync
            </h2>
            <p className="text-muted-foreground text-xs mt-1 leading-normal">
              Accelerating player registrations, club licensing, and official downloads.
            </p>
          </div>
        </motion.div>

        {/* Secretariat & Urgent Inquiries Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl mt-8 p-5 sm:p-6 luxe-card rounded-2xl border border-primary/25 bg-card/80 backdrop-blur-xl shadow-luxe space-y-4 text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Urgent Inquiries &amp; Affiliation Support
              </h3>
              <p className="text-muted-foreground text-xs">
                Our national secretariat remains active during portal maintenance:
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/80 hover:border-primary px-3.5 py-1.5 text-xs font-semibold text-foreground/90 hover:text-primary bg-background/50 hover:bg-accent/40 transition-all shrink-0 cursor-pointer"
              title="Check if portal is back online"
            >
              <RefreshCw
                className={`size-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Checking..." : "Refresh Portal"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={`mailto:${fedEmail}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-accent/20 hover:border-primary/50 hover:bg-accent/40 transition-colors group text-left min-w-0"
            >
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Secretariat Email
                </p>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {fedEmail}
                </p>
              </div>
            </a>

            <a
              href={`tel:${fedPhone.split("/")[0]?.trim() || fedPhone}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-accent/20 hover:border-primary/50 hover:bg-accent/40 transition-colors group text-left min-w-0"
            >
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20">
                <Phone className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Helpline Numbers
                </p>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {fedPhone}
                </p>
              </div>
            </a>
          </div>

          {fedAddress && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground justify-center sm:justify-start">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{fedAddress}</span>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border/40 bg-background/80 backdrop-blur-xl py-4 sm:py-5 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p>
            © {new Date().getFullYear()} {fedName}. All rights reserved.
          </p>
          <p className="text-primary/80 font-medium text-[11px] sm:text-xs">
            Official National Federation Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
