"use client";

import Link from "next/link";
import {
  Shield,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";

const footerColumns = [
  {
    title: "Championships & Events",
    links: [
      { label: "Our Events", to: "/events" },
      { label: "Annual Calendar", to: "/events/calendar" },
      { label: "Upcoming Events", to: "/events/upcoming" },
      { label: "Championship", to: "/events/championship" },
      { label: "Tournament Results", to: "/results" },
      // { label: "Official Rankings", to: "/ranking" },
    ],
  },
  {
    title: "Technical & Grading",
    links: [
      { label: "Belt Examinations", to: "/belt-exams" },
      { label: "Black Belt & Dan Grading", to: "/dan-grading" },
      { label: "Referee & Officials", to: "/referees" },
      { label: "Player Registration", to: "/register/player" },
      { label: "Coach Accreditation", to: "/register/coach" },
      { label: "Apply for Referee Registration", to: "/register/referee" },
    ],
  },
  {
    title: "Rules & Documentation",
    links: [
      /*
      { label: "Official ID Cards", to: "/id-cards" },
      { label: "Search & Verification", to: "/verify" },
      */
      { label: "Rules & Regulations", to: "/rules" },
      { label: "Official Downloads", to: "/downloads" },
    ],
  },
  {
    title: "Media & Academies",
    links: [
      { label: "News & Notices", to: "/news" },
      { label: "Photo Gallery", to: "/gallery" },
      { label: "Video Gallery", to: "/gallery/videos" },
      { label: "Club & Academy Affiliation", to: "/affiliation" },
      { label: "Official Merchandise Shop", to: "/shop" },
    ],
  },
  {
    title: "Secretariat & Support",
    links: [
      { label: "About Federation", to: "/about" },
      { label: "Executive Committee", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Executive Admin Portal", to: "/admin" },
    ],
  },
];

export function Footer() {
  const { settings } = useSettings();

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;
  const fedMapUrl = settings.googleMapsUrl || (federation as any).googleMapsUrl || "https://share.google/31PQfjzetEDIADnHy";

  return (
    <footer className="border-border/60 relative overflow-hidden border-t w-full max-w-full bg-card/60 backdrop-blur-md">
      {/* Background ambient gold gradient glow */}
      <div className="bg-gold-gradient pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl" />

      <div className="shell relative py-12 sm:py-16 lg:py-20 space-y-12">
        {/* Section 1: Top Row - Federation Identity & Secretariat Contacts */}
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.4fr_1.6fr] items-start">
          {/* Brand Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="size-16 sm:size-18 shrink-0 overflow-hidden rounded-full bg-white shadow-gold flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt={fedName}
                  className="size-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-gold-gradient">
                  {federation.short}
                </p>
                <p className="text-foreground text-xs sm:text-sm font-bold leading-snug">
                  {fedName}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground max-w-xl text-xs sm:text-sm leading-relaxed">
              Indian Martial Arts • Sports • Skill • Discipline • Excellence. National governing body dedicated to traditional Indian martial arts mastery, accredited Dan gradings, state championships, and athlete pathways across India.
            </p>

            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-[11px] sm:text-xs font-semibold text-primary">
                Official Registration & Statutory Documents Available
              </p>
            </div>
          </div>

          {/* Quick Secretariat Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href={fedMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-border/70 bg-card/70 space-y-1.5 hover:border-primary/50 hover:bg-card/90 transition-all group block"
            >
              <div className="flex items-center justify-between gap-1 text-primary text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 group-hover:scale-110 transition-transform" />
                  <span>Headquarters</span>
                </div>
                <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed break-words group-hover:text-foreground">
                {fedAddress}
              </p>
            </a>

            <div className="p-4 rounded-xl border border-border/70 bg-card/70 space-y-1.5">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Phone className="size-3.5" />
                <span>Helpline Contact</span>
              </div>
              <a
                href={`tel:${federation.phone1}`}
                className="text-xs text-foreground/90 font-semibold hover:text-primary transition-colors block"
              >
                {fedPhone}
              </a>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/70 space-y-1.5">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Mail className="size-3.5" />
                <span>Official Email</span>
              </div>
              <a
                href={`mailto:${fedEmail}`}
                className="text-xs text-foreground/90 font-semibold hover:text-primary transition-colors block truncate"
              >
                {fedEmail}
              </a>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <MessageCircle className="size-3.5" />
                <span>WhatsApp Desk</span>
              </div>
              <a
                href={`https://wa.me/${federation.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 font-bold hover:underline block"
              >
                Instant WhatsApp Chat →
              </a>
            </div>
          </div>
        </div>

        {/* Section 2: Full-Width 5-Column Navigation Grid (No Truncation) */}
        <div className="pt-10 border-t border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 lg:gap-10">
            {footerColumns.map((col) => (
              <div key={col.title} className="space-y-4">
                <p className="text-xs sm:text-sm font-black tracking-wider uppercase text-foreground leading-snug border-b border-primary/30 pb-2">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.to}
                        className="text-muted-foreground hover:text-primary text-xs sm:text-sm transition-all block leading-relaxed hover:translate-x-1 duration-150"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Bottom Copyright & Social Media Bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">
              © {new Date().getFullYear()} {fedName}. All rights reserved.
            </p>
            <p className="text-muted-foreground/70 text-[11px]">
              KALAWAR Martial Arts • Registered National Sports & Martial Arts Governing Body.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${federation.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="border-border/70 hover:border-emerald-500 hover:text-emerald-400 grid size-9 place-items-center rounded-full border transition-colors shrink-0 bg-card/60"
              title="Official WhatsApp Desk"
            >
              <MessageCircle className="size-4" />
            </a>
            {[
              { icon: Facebook, href: federation.social.facebook, label: "Facebook" },
              { icon: Instagram, href: federation.social.instagram, label: "Instagram" },
              { icon: Youtube, href: federation.social.youtube, label: "YouTube" },
            ].map(({ icon: Icon, href, label }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="border-border/70 hover:border-primary hover:text-primary grid size-9 place-items-center rounded-full border transition-colors shrink-0 bg-card/60"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
