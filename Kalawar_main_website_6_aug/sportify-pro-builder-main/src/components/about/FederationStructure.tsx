"use client";

import {
  Globe,
  Building,
  MapPin,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const tiers = [
  {
    id: "india",
    tier: "Tier 1",
    level: "National Federation – India",
    subtitle: "Apex National Governing Council",
    icon: Globe,
    badge: "All-India Authority",
  },
  {
    id: "state",
    tier: "Tier 2",
    level: "State Associations",
    subtitle: "State Governing Councils across 28+ States",
    icon: Building,
    badge: "State Level Chapters",
  },
  {
    id: "district",
    tier: "Tier 3",
    level: "District Units",
    subtitle: "District Councils & Zonal Committees",
    icon: MapPin,
    badge: "District Authority",
  },
  {
    id: "academy",
    tier: "Tier 4",
    level: "Academies, Clubs & Dojos",
    subtitle: "Grassroots Training Centers & Certified Instructors",
    icon: GraduationCap,
    badge: "Grassroots Foundation",
  },
];

export function FederationStructure() {
  return (
    <section className="section-pad">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Nationwide Governance Architecture"
          title="Federation Structure: India → State → District → Academy"
          description="A structured, transparent four-tier administrative pyramid connecting grassroots dojos to national championship podiums across India."
        />

        {/* Visual Hierarchy Flow Map */}
        <div className="mt-8 sm:mt-14 grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
          {tiers.map((t, idx) => {
            const Icon = t.icon;

            return (
              <Reveal key={t.id} delay={idx * 0.08}>
                <div className="luxe-card p-5 sm:p-6 h-full transition-all duration-300 relative border flex flex-col justify-between border-border/80 bg-card/60">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-10 rounded-xl flex items-center justify-center border transition-colors bg-primary/10 text-primary border-primary/20">
                          <Icon className="size-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                          {t.tier}
                        </span>
                      </div>

                      {idx < 3 && (
                        <div className="hidden lg:flex items-center text-muted-foreground/60">
                          <ChevronRight className="size-4" />
                        </div>
                      )}
                    </div>

                    <h3 className="mt-3.5 sm:mt-4 text-sm sm:text-base font-bold text-foreground">
                      {t.level}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.subtitle}
                    </p>
                  </div>

                  <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                      {t.badge}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
