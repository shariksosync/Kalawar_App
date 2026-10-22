"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Compass,
  Swords,
  Trophy,
  UserCheck,
  Award,
  Users,
  Building2,
  Scale,
  HeartPulse,
  FileQuestion,
  AlertOctagon,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Stagger, StaggerItem } from "@/components/common/Reveal";
import {
  RULES_SECTIONS,
  DISCIPLINE_RULES,
  FEDERATION_RULES_OVERVIEW,
  RuleSection,
} from "@/data/rules-data";
import { IMAGES } from "@/data/images";
import { generateOfficialPDF } from "@/lib/pdf-generator";

const ICON_MAP: Record<string, any> = {
  Shield,
  Compass,
  Swords,
  Trophy,
  UserCheck,
  Award,
  Users,
  Building2,
  Scale,
  HeartPulse,
  FileQuestion,
  AlertOctagon,
};

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDisciplineId, setActiveDisciplineId] = useState("kaya-yuddha");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  const activeDiscipline = useMemo(
    () => DISCIPLINE_RULES.find((d) => d.id === activeDisciplineId) || DISCIPLINE_RULES[0],
    [activeDisciplineId]
  );

  const filteredSections = useMemo(() => {
    return RULES_SECTIONS.filter((section) => {
      const matchesSearch =
        searchQuery === "" ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.points?.some(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesSearch;
    });
  }, [searchQuery]);

  const handleDownloadRulebook = () => {
    const toastId = toast.loading("Generating Official Rulebook PDF...", {
      description: "Compiling statutory regulations and scoring guidelines.",
    });

    try {
      generateOfficialPDF({
        title: "Official KALAWAR National Rulebook 2026-27",
        category: "National Statutory Rulebook",
        docCode: "K-DOC-RB-2026-NAT",
        date: "January 2026",
        sections: [
          {
            heading: "1. GENERAL JURISDICTION & SANCTIONING",
            body: "KALAWAR Sports & Martial Arts Federation of India governs all official state and national championships across India. All participants must hold valid K-UID credentials.",
          },
          {
            heading: "2. FIVE FLAGSHIP MARTIAL ARTS DISCIPLINES",
            body: [
              "Kaya Yuddha: Full-contact combat with 8x8m Tatami, 3 rounds x 2 min, approved headgear/gloves.",
              "Charana Yuddha: Kicking combat focusing exclusively on aerial and dynamic kicking above waistline.",
              "Santulana: NO WEIGHT CATEGORY — Performance-based equilibrium evaluated across 8 criteria out of 10.0 pts.",
              "Sparsha Yuddha: Precision point touch combat with 10-point mercy rule.",
              "Sangama Kala: Weapons and synchronized Kata scored on weapon handling, power, and posture.",
            ],
          },
          {
            heading: "3. THREE-TIER PENALTY ESCALATION SYSTEM",
            body: [
              "Tier 1 (Keikoku): Official Warning for minor boundary exits (Jogai) and stalling. No point penalty.",
              "Tier 2 (Chui): Formal Caution for repeated exits or excessive contact. 1 Point awarded to opponent.",
              "Tier 3 (Hansoku-Make): Direct Disqualification for illegal strikes or gross unsportsmanlike conduct.",
            ],
          },
          {
            heading: "4. PROTEST & APPEAL STATUTORY TIMELINES",
            body: "Written protest must be lodged by accredited Head Coach within 15 minutes of bout conclusion with a statutory fee of ₹2,000 INR. Reviewed by 3-member Senior Technical Jury.",
          },
          {
            heading: "5. RINGSIDE SAFETY & CONCUSSION HIATUS",
            body: "Mandatory ALS ambulance, ringside physician, and SCAT-5 concussion protocol. 30-day mandatory suspension following any knockout.",
          },
        ],
        tableData: {
          headers: ["Discipline", "Category Type", "Weight Restriction", "Match Duration", "Scoring System"],
          rows: [
            ["Kaya Yuddha", "Combat", "U-8 to U-19 (12 Cls), Open", "3 Rds x 2 Min", "1-4 Pts / KO / TKO"],
            ["Charana Yuddha", "Striking", "U-8 to U-19, Open", "2 Rds x 2 Min", "1-5 Pts / 12-Pt Gap"],
            ["Santulana", "Performance", "NO WEIGHT CATEGORY", "90s - 2 Min", "10-Pt Matrix (8 Criteria)"],
            ["Sparsha Yuddha", "Point Combat", "U-8 to U-19, Open", "2 Rds x 1.5 Min", "1-3 Pts / First to 10"],
            ["Sangama Kala", "Weapons / Kata", "Age & Belt Divisions", "1 - 3.5 Min", "10-Pt Master Panel"],
          ],
        },
      });

      toast.success("Download Ready", {
        id: toastId,
        description: "Official KALAWAR Rulebook PDF downloaded successfully.",
      });
    } catch (e) {
      toast.error("Failed to generate PDF. Please try again.", {
        id: toastId,
      });
    }
  };

  return (
    <SiteLayout>
      {/* 1. Page Hero */}
      <PageHero
        eyebrow="Official Governance & Regulations"
        title="Rules & Regulations"
        description="Comprehensive statutory rulebook, discipline regulations, referee charters, player codes, and 3-tier penalty escalation system governing all sanctioned competitions across India."
        image={IMAGES.martialArts}
      />

      {/* 2. Top Stats Bar & Quick Actions */}
      <section className="relative -mt-10 mb-12 z-20">
        <div className="shell">
          <div className="rounded-2xl border border-primary/30 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Edition</p>
                  <p className="text-sm font-bold text-primary">{FEDERATION_RULES_OVERVIEW.rulebookVersion}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Disciplines</p>
                  <p className="text-sm font-bold text-foreground">5 Official Formats</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Penalty System</p>
                  <p className="text-sm font-bold text-amber-500">3-Tier Escalation</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Protest Window</p>
                  <p className="text-sm font-bold text-foreground">15 Mins (₹2,000)</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadRulebook}
                  className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="size-4" /> Download Rulebook PDF
                </button>
                <Link
                  href="/downloads"
                  className="border-border/70 hover:border-primary/60 hover:bg-primary/5 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition-colors"
                >
                  <FileText className="size-4 text-primary" /> View All Downloads
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="pb-8">
        <div className="shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rules, commands, scoring, penalties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background/80 border-border/80 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">Jump to:</span>
              <a
                href="#discipline-rules"
                className="border-border/60 hover:border-primary hover:text-primary rounded-lg border bg-background/50 px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                5 Disciplines
              </a>
              <a
                href="#protest-appeal-rules"
                className="border-border/60 hover:border-primary hover:text-primary rounded-lg border bg-background/50 px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                Protest & Appeal
              </a>
              <a
                href="#penalty-system"
                className="border-border/60 hover:border-primary hover:text-primary rounded-lg border bg-background/50 px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                3-Tier Penalty
              </a>
              <a
                href="#safety-rules"
                className="border-border/60 hover:border-primary hover:text-primary rounded-lg border bg-background/50 px-3 py-1.5 text-[11px] font-medium transition-colors"
              >
                Medical Safety
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Main Content: Rules Sections & Interactive Modules */}
      <section className="pb-24">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            {/* Sidebar Table of Contents (Sticky on Desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
                <p className="text-xs font-bold tracking-wider text-primary uppercase">Rulebook Index</p>
                <nav className="mt-3 space-y-1">
                  {RULES_SECTIONS.map((sec) => {
                    const Icon = ICON_MAP[sec.icon] || Shield;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="font-mono text-[10px] text-primary/70">{sec.number}</span>
                        <span className="truncate group-hover:font-medium">{sec.title}</span>
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-6 border-t border-border/60 pt-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[11px] font-bold text-primary">Need Official Sanction?</p>
                    <p className="text-muted-foreground mt-1 text-[10px] leading-relaxed">
                      Download sanction proformas or register championship entries via Secretariat portal.
                    </p>
                    <Link
                      href="/contact"
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Contact Secretariat <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Rules Content Stream */}
            <main className="space-y-16">
              {filteredSections.map((section) => {
                const Icon = ICON_MAP[section.icon] || Shield;

                // SPECIAL INTERACTIVE MODULE: Section 03 - Discipline-Specific Rules
                if (section.id === "event-specific-rules") {
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 rounded-2xl border border-primary/30 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">SECTION {section.number}</span>
                            {section.badge && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {section.badge}
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                        </div>
                      </div>

                      <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{section.subtitle}</p>

                      {/* Discipline Tab Switcher */}
                      <div className="mt-8 border-b border-border/60">
                        <div className="flex flex-wrap gap-2 pb-3">
                          {DISCIPLINE_RULES.map((disc) => {
                            const isSelected = disc.id === activeDisciplineId;
                            return (
                              <button
                                key={disc.id}
                                onClick={() => setActiveDisciplineId(disc.id)}
                                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                  isSelected
                                    ? "bg-gold-gradient text-background shadow-gold scale-105"
                                    : "border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                              >
                                {disc.name}
                                {disc.id === "santulana" && (
                                  <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                                    No Weight
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Discipline Deep Dive */}
                      <div className="mt-6 space-y-6">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                                {activeDiscipline.categoryType}
                              </span>
                              <h3 className="text-lg font-bold text-foreground">{activeDiscipline.name}</h3>
                              <p className="text-muted-foreground text-xs">{activeDiscipline.tagline}</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-right">
                              <p className="text-[10px] text-muted-foreground uppercase">Rounds & Time</p>
                              <p className="text-xs font-bold text-primary">{activeDiscipline.roundsDuration}</p>
                            </div>
                          </div>

                          {/* Weight Category Note Callout */}
                          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                              <Info className="size-4 shrink-0" /> Weight Category Regulation:
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {activeDiscipline.weightCategoryNote}
                            </p>
                          </div>
                        </div>

                        {/* Mat Dimensions & Special Regulations */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                            <p className="text-xs font-bold text-primary uppercase">Arena & Mat Specifications</p>
                            <p className="text-muted-foreground mt-1 text-xs">{activeDiscipline.matDimensions}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                            <p className="text-xs font-bold text-primary uppercase">Mandatory Protective Gear</p>
                            <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                              {activeDiscipline.mandatoryGear.map((gear, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" /> {gear}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Permitted vs Prohibited Strikes */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase">
                              <CheckCircle2 className="size-4 shrink-0" /> Permitted Techniques
                            </p>
                            <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                              {activeDiscipline.permittedStrikes.map((p, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase">
                              <AlertTriangle className="size-4 shrink-0" /> Prohibited Fouls & Illegal Strikes
                            </p>
                            <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                              {activeDiscipline.prohibitedStrikes.map((p, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-red-500 font-bold">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Scoring Matrix Table */}
                        <div>
                          <p className="text-xs font-bold text-primary uppercase">Official Scoring Matrix</p>
                          <div className="mt-2 overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-bold uppercase text-foreground">
                                <tr>
                                  <th className="px-4 py-2.5">Technique / Action</th>
                                  <th className="px-4 py-2.5">Value / Score</th>
                                  <th className="px-4 py-2.5">Validation Requirement</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40 text-muted-foreground">
                                {activeDiscipline.scoringSystem.map((sc, i) => (
                                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-foreground">{sc.action}</td>
                                    <td className="px-4 py-2.5 font-bold text-primary">{sc.points}</td>
                                    <td className="px-4 py-2.5">{sc.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Victory Determinations */}
                        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                          <p className="text-xs font-bold text-foreground uppercase">Official Victory Outcomes</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {activeDiscipline.winConditions.map((win, i) => (
                              <span
                                key={i}
                                className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                              >
                                {win}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                // SPECIAL INTERACTIVE MODULE: Section 12 - 3-Tier Penalty Escalation System
                if (section.id === "penalty-system") {
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                          <AlertOctagon className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">SECTION {section.number}</span>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                              3-Tier Disciplinary Scale
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                        </div>
                      </div>

                      <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{section.subtitle}</p>

                      <div className="mt-6 grid gap-5 md:grid-cols-3">
                        {/* Tier 1 */}
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-500">
                                TIER 1
                              </span>
                              <span className="text-[10px] text-muted-foreground">Official Warning</span>
                            </div>
                            <h3 className="mt-2 text-base font-bold text-foreground">Keikoku</h3>
                            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                              Issued for minor unintentional violations: Stepping out of bounds (Jogai), passive stalling, minor pushing, or delay.
                            </p>
                          </div>
                          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-background/80 p-2.5 text-xs">
                            <p className="font-semibold text-yellow-500">Consequence:</p>
                            <p className="text-muted-foreground text-[11px]">Recorded on bout log. No point penalty on scoreboard.</p>
                          </div>
                        </div>

                        {/* Tier 2 */}
                        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                                TIER 2
                              </span>
                              <span className="text-[10px] text-muted-foreground">Formal Caution</span>
                            </div>
                            <h3 className="mt-2 text-base font-bold text-foreground">Chui</h3>
                            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                              Issued for repeated boundary exits, excessive contact after stop command, grabbing opponent's uniform, or complaining.
                            </p>
                          </div>
                          <div className="mt-4 rounded-lg border border-orange-500/20 bg-background/80 p-2.5 text-xs">
                            <p className="font-semibold text-orange-400">Consequence:</p>
                            <p className="text-muted-foreground text-[11px]">1 Point awarded directly to the opponent's scoreboard score.</p>
                          </div>
                        </div>

                        {/* Tier 3 */}
                        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                TIER 3
                              </span>
                              <span className="text-[10px] text-muted-foreground">Direct Disqualification</span>
                            </div>
                            <h3 className="mt-2 text-base font-bold text-foreground">Hansoku-Make</h3>
                            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                              Issued for intentional strikes to prohibited zones (groin, spine, throat), biting, striking a downed opponent, or accumulating 3 Chui.
                            </p>
                          </div>
                          <div className="mt-4 rounded-lg border border-red-500/20 bg-background/80 p-2.5 text-xs">
                            <p className="font-semibold text-red-400">Consequence:</p>
                            <p className="text-muted-foreground text-[11px]">Instant bout forfeiture. Disciplinary Tribunal review.</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                // SPECIAL INTERACTIVE MODULE: Section 11 - Protest & Appeal Rules
                if (section.id === "protest-appeal-rules") {
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <FileQuestion className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">SECTION {section.number}</span>
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Statutory Grievance Protocol
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                        </div>
                      </div>

                      <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{section.subtitle}</p>

                      {/* 3-Step Appeal Process Flow */}
                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-primary/20 bg-background/60 p-4">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-primary/20 font-mono text-xs font-bold text-primary">
                              1
                            </span>
                            <p className="text-xs font-bold text-foreground">15-Minute Window</p>
                          </div>
                          <p className="text-muted-foreground mt-2 text-xs">
                            Accredited Head Coach must submit written protest on official Form P-1 within exactly 15 minutes of bout completion.
                          </p>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-background/60 p-4">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-primary/20 font-mono text-xs font-bold text-primary">
                              2
                            </span>
                            <p className="text-xs font-bold text-foreground">₹2,000 Statutory Fee</p>
                          </div>
                          <p className="text-muted-foreground mt-2 text-xs">
                            Deposit of ₹2,000 INR required at Chief Table. 100% refunded if appeal is upheld; forfeited if frivolous.
                          </p>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-background/60 p-4">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-primary/20 font-mono text-xs font-bold text-primary">
                              3
                            </span>
                            <p className="text-xs font-bold text-foreground">Jury Video Verdict</p>
                          </div>
                          <p className="text-muted-foreground mt-2 text-xs">
                            3-member Senior Technical Board reviews multi-angle official footage and electronic logs. Decision is final and binding.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
                        <p className="font-bold text-foreground">Permissible Grounds for Protest:</p>
                        <p className="text-muted-foreground mt-1">
                          Mathematical scoring discrepancies, failure of electronic sensor equipment, or gross misinterpretation of written rules. Subjective judgment calls (e.g., speed, lightness of touch) cannot be protested.
                        </p>
                      </div>
                    </article>
                  );
                }

                // STANDARD ACCORDION / EXPANDABLE SECTION
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">SECTION {section.number}</span>
                          {section.badge && (
                            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {section.badge}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                      </div>
                    </div>

                    <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{section.subtitle}</p>

                    {section.content.intro && (
                      <p className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {section.content.intro}
                      </p>
                    )}

                    {/* Points list */}
                    {section.content.points && (
                      <div className="mt-6 space-y-4">
                        {section.content.points.map((pt, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-border/40 bg-background/50 p-4 transition-colors hover:border-primary/30"
                          >
                            <h3 className="text-sm font-bold text-foreground">{pt.title}</h3>
                            <p className="text-muted-foreground mt-1 text-xs sm:text-sm leading-relaxed">
                              {pt.description}
                            </p>
                            {pt.details && (
                              <ul className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                                {pt.details.map((d, dIdx) => (
                                  <li key={dIdx} className="flex items-start gap-1.5">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Alert Box */}
                    {section.content.alert && (
                      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Sparkles className="size-4 shrink-0" /> {section.content.alert.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{section.content.alert.text}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </main>
          </div>
        </div>
      </section>

      {/* 5. Bottom Download Callout Banner */}
      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="shell text-center">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="size-3.5" /> Official Rulebook 2026-27
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Get the Full Print-Ready National Rulebook
            </h2>
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">
              Download the complete 12-section PDF containing high-resolution Tatami diagrams, full scoring rubrics, referee hand signals, and disciplinary guidelines.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownloadRulebook}
                className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="size-4" /> Download Official Rulebook PDF
              </button>
              <Link
                href="/downloads"
                className="border-border/70 hover:border-primary hover:bg-primary/5 inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-xs font-semibold transition-colors"
              >
                Browse All 9 Resource Categories
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
