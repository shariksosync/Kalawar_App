"use client";

import { notFound } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  QrCode,
  Download,
  Share2,
  X,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Info,
  Layers,
  User,
  Users,
  Flame,
  Scale,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import type {
  AthleteRankingEntry,
  AcademyRankingEntry,
  RankingRulesConfig,
  RankingPeriod,
} from "@/lib/rankings-store";

type RankingTab =
  | "overall"
  | "events"
  | "age"
  | "gender"
  | "weight"
  | "state"
  | "district"
  | "academy";

/**
 * ============================================================================
 * THE RANKING PAGE IS CURRENTLY HIDDEN & ACCESS IS BLOCKED (RETURNS 404).
 *
 * HOW TO UNHIDE THIS PAGE IN THE FUTURE:
 * 1. Change `const IS_PAGE_ENABLED = false;` to `true` below.
 * 2. In `src/components/layout/Footer.tsx`, uncomment:
 *    `{ label: "Official Rankings", to: "/ranking" }`
 * ============================================================================
 */
const IS_PAGE_ENABLED = false;

export default function OfficialRankingPage() {
  if (!IS_PAGE_ENABLED) {
    notFound();
  }


  const [athletes, setAthletes] = useState<AthleteRankingEntry[]>([]);
  const [academies, setAcademies] = useState<AcademyRankingEntry[]>([]);
  const [rules, setRules] = useState<RankingRulesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isFrozen, setIsFrozen] = useState(false);

  // Tabs & Period
  const [activeTab, setActiveTab] = useState<RankingTab>("overall");
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("Current");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

  // Multi-Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("All");
  const [selectedWeight, setSelectedWeight] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");

  // Detail Modal
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteRankingEntry | null>(null);

  useEffect(() => {
    async function fetchRankings() {
      try {
        setLoading(true);
        const res = await fetch("/api/rankings");
        const json = await res.json();
        if (json.success) {
          setAthletes(json.athletes || []);
          setAcademies(json.academies || []);
          setRules(json.rules || null);
          setLastUpdated(json.lastRecalculatedAt || "");
          setIsFrozen(json.isFrozen || false);
        }
      } catch (err) {
        console.error("Failed to load official rankings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  // Filter dropdown unique options
  const filterOptions = useMemo(() => {
    const disciplines = new Set<string>();
    const ageGroups = new Set<string>();
    const weights = new Set<string>();
    const states = new Set<string>();
    const districts = new Set<string>();

    athletes.forEach((a) => {
      if (a.discipline) disciplines.add(a.discipline);
      if (a.ageGroup) ageGroups.add(a.ageGroup);
      if (a.weightCategory) weights.add(a.weightCategory);
      if (a.state) states.add(a.state);
      if (a.district) districts.add(a.district);
    });

    return {
      disciplines: ["All", ...Array.from(disciplines)],
      ageGroups: ["All", ...Array.from(ageGroups)],
      weights: ["All", ...Array.from(weights)],
      states: ["All", ...Array.from(states)],
      districts: ["All", ...Array.from(districts)],
    };
  }, [athletes]);

  // Filtered Athletes list based on current active tab & filters
  const filteredAthletes = useMemo(() => {
    return athletes.filter((ath) => {
      // Search
      const matchSearch =
        !searchQuery.trim() ||
        ath.athleteName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        ath.athleteId.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        ath.clubName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        ath.rankingId.toLowerCase().includes(searchQuery.trim().toLowerCase());

      // Discipline
      const matchDiscipline =
        selectedDiscipline === "All" ||
        ath.discipline.toLowerCase() === selectedDiscipline.toLowerCase();

      // Gender
      const matchGender =
        selectedGender === "All" ||
        ath.gender.toLowerCase() === selectedGender.toLowerCase();

      // Age Group
      const matchAge =
        selectedAgeGroup === "All" ||
        ath.ageGroup.toLowerCase().includes(selectedAgeGroup.toLowerCase());

      // Weight Category
      const matchWeight =
        selectedWeight === "All" ||
        ath.weightCategory.toLowerCase().includes(selectedWeight.toLowerCase());

      // State
      const matchState =
        selectedState === "All" ||
        ath.state.toLowerCase() === selectedState.toLowerCase();

      // District
      const matchDistrict =
        selectedDistrict === "All" ||
        ath.district.toLowerCase() === selectedDistrict.toLowerCase();

      return (
        matchSearch &&
        matchDiscipline &&
        matchGender &&
        matchAge &&
        matchWeight &&
        matchState &&
        matchDistrict
      );
    });
  }, [
    athletes,
    searchQuery,
    selectedDiscipline,
    selectedGender,
    selectedAgeGroup,
    selectedWeight,
    selectedState,
    selectedDistrict,
  ]);

  // Filtered Academies
  const filteredAcademies = useMemo(() => {
    return academies.filter((acad) => {
      const matchSearch =
        !searchQuery.trim() ||
        acad.academyName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        acad.state.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        acad.district.toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchState =
        selectedState === "All" ||
        acad.state.toLowerCase() === selectedState.toLowerCase();

      return matchSearch && matchState;
    });
  }, [academies, searchQuery, selectedState]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDiscipline("All");
    setSelectedGender("All");
    setSelectedAgeGroup("All");
    setSelectedWeight("All");
    setSelectedState("All");
    setSelectedDistrict("All");
    toast.info("All ranking filters have been reset.");
  };

  const handleExportCSV = () => {
    if (activeTab === "academy") {
      const headers = "Rank,Academy Name,State,District,Total Points,Athletes,Gold,Silver,Bronze,Performance Rating\n";
      const rows = filteredAcademies
        .map(
          (a) =>
            `#${a.rank},"${a.academyName}","${a.state}","${a.district}",${a.totalPoints},${a.totalAthletes},${a.gold},${a.silver},${a.bronze},${a.performanceScore}`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kalawar_Official_Academy_Rankings_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } else {
      const headers = "Rank,Rank Change,Athlete Name,KALAWAR ID,Club / Academy,State,District,Discipline,Gender,Age Group,Weight Category,Total Points,Gold,Silver,Bronze,Total Competitions,Win Ratio\n";
      const rows = filteredAthletes
        .map(
          (a) =>
            `#${a.currentRank},${a.rankChange > 0 ? "+" + a.rankChange : a.rankChange},"${a.athleteName}",${a.athleteId},"${a.clubName}","${a.state}","${a.district}","${a.discipline}","${a.gender}","${a.ageGroup}","${a.weightCategory}",${a.totalPoints},${a.medals.gold},${a.medals.silver},${a.medals.bronze},${a.totalCompetitions},${a.winRatio}%`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kalawar_Official_Athlete_Rankings_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }
    toast.success("Official rankings exported to CSV!");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <SiteLayout>
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-32 pb-14 border-b border-border/60 bg-gradient-to-b from-card/95 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="shell relative z-10">
          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
                <Trophy className="size-3.5" /> OFFICIAL FEDERATION STANDINGS
              </span>
              {isFrozen && (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                  🔒 Standings Frozen for Championship
                </span>
              )}
              {lastUpdated && (
                <span className="text-xs text-muted-foreground font-medium">
                  Last Updated: {new Date(lastUpdated).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-gold-gradient">
              🏅 KALAWAR OFFICIAL RANKING
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Official Athlete Ranking Based on Verified Competition Performance, Medal Tally &amp; Technical Merit Points.
            </p>

            {/* Quick KPI stats bar */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl bg-card/80 border border-border/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Ranked Athletes</span>
                <p className="text-xl sm:text-2xl font-black text-foreground">{athletes.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-card/80 border border-border/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Affiliated Dojos</span>
                <p className="text-xl sm:text-2xl font-black text-primary">{academies.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-card/80 border border-border/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">#1 National Seed</span>
                <p className="text-base sm:text-lg font-black text-amber-400 truncate">
                  {athletes[0]?.athleteName || "TBA"}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-card/80 border border-border/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Points System</span>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1">
                  <ShieldCheck className="size-3.5" /> Ratified by Tech Comm
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Ranking Content Area */}
      <section className="section-pad bg-background">
        <div className="shell max-w-7xl mx-auto space-y-6">
          {/* Top Tabs: 8 Ranking Categories & Period Selector */}
          <div className="space-y-4 border-b border-border/60 pb-5">
            {/* Category Tabs Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { key: "overall", label: "🥋 Overall Athlete", desc: "National Standing" },
                { key: "events", label: "🥊 Event-wise", desc: "Discipline Leaders" },
                { key: "age", label: "🎂 Age Category", desc: "Junior / Senior" },
                { key: "gender", label: "🚻 Gender-wise", desc: "Men & Women" },
                { key: "weight", label: "⚖️ Weight Category", desc: "Division Brackets" },
                { key: "state", label: "📍 State Ranking", desc: "State Units" },
                { key: "district", label: "🏙️ District Ranking", desc: "District Units" },
                { key: "academy", label: "🏛️ Academy / Dojo", desc: "Club Standings" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as RankingTab)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 inline-flex items-center gap-1.5 shadow-sm",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-gold"
                      : "bg-card/80 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-card"
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-Header & Actions Toolbar (Period, Export, Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-gold-gradient tracking-wide">
                  {activeTab === "overall"
                    ? "🏆 National Athlete Standings"
                    : activeTab === "events"
                    ? "🥊 Discipline Leaders Ranking"
                    : activeTab === "age"
                    ? "🎂 Age Category Divisions"
                    : activeTab === "gender"
                    ? "🚻 Gender-wise Divisions"
                    : activeTab === "weight"
                    ? "⚖️ Weight Class Rankings"
                    : activeTab === "state"
                    ? "📍 State Association Standings"
                    : activeTab === "district"
                    ? "🏙️ District Units Standings"
                    : "🏛️ Affiliated Dojo & Academy Rankings"}
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  ({activeTab === "academy" ? `${filteredAcademies.length} Academies` : `${filteredAthletes.length} Athletes`})
                </span>
              </div>

              {/* Action Toolbar with flex-nowrap and shrink-0 */}
              <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as RankingPeriod)}
                  className="bg-card/90 border border-border/80 hover:border-primary/60 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm"
                >
                  <option value="Current">Current Ranking (2026 Live)</option>
                  <option value="Monthly">Monthly Cycle</option>
                  <option value="Yearly">Yearly Official Standing</option>
                  <option value="Archive">2025 Archive Final</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl border border-border/80 bg-card/90 hover:bg-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                  title="Export current ranking table to CSV"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-400" /> Export CSV
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl border border-border/80 bg-card/90 hover:bg-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                  title="Print official ranking table"
                >
                  <Printer className="size-3.5 text-primary" /> Print
                </button>
              </div>
            </div>
          </div>

          {/* Points Rules Info Banner */}
          {rules && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Info className="size-4 text-amber-400 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Official Merit Points System:</strong> Gold:{" "}
                  <span className="text-amber-400 font-bold">{rules.goldPoints} pts</span> · Silver:{" "}
                  <span className="text-slate-300 font-bold">{rules.silverPoints} pts</span> · Bronze:{" "}
                  <span className="text-amber-600 font-bold">{rules.bronzePoints} pts</span> · Match Win:{" "}
                  <span className="text-foreground font-bold">{rules.matchWinPoints} pts</span> · Participation:{" "}
                  <span className="text-foreground font-bold">{rules.participationPoints} pts</span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Championship Multiplier: National (x{rules.nationalMultiplier})
              </span>
            </div>
          )}

          {/* Search & Multi-Filter Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "academy"
                      ? "Search academy name, city, or state..."
                      : "Search athlete name, KALAWAR ID, ranking ID, or club..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/90 border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border/80 hover:bg-accent/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
              >
                Reset Filters
              </button>
            </div>

            {/* Filter Dropdowns Grid */}
            {activeTab !== "academy" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
                {/* Discipline */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Event / Discipline
                  </label>
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    {filterOptions.disciplines.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    <option value="All">All Genders</option>
                    <option value="Male">Male Division</option>
                    <option value="Female">Female Division</option>
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Age Division
                  </label>
                  <select
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    {filterOptions.ageGroups.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight Category */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Weight Class
                  </label>
                  <select
                    value={selectedWeight}
                    onChange={(e) => setSelectedWeight(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    {filterOptions.weights.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    {filterOptions.states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    District / City
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-background/90 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer focus:border-primary"
                  >
                    {filterOptions.districts.map((dst) => (
                      <option key={dst} value={dst}>
                        {dst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* MAIN RANKINGS DISPLAY */}
          {activeTab === "academy" ? (
            /* =========================================================
               ACADEMY / CLUB RANKING VIEW
               ========================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase text-foreground flex items-center gap-2">
                  <Building2 className="size-4 text-primary" /> Affiliated Dojo &amp; Academy Standings
                </h3>
                <span className="text-xs text-muted-foreground">
                  Showing {filteredAcademies.length} Academies
                </span>
              </div>

              {filteredAcademies.length === 0 ? (
                <div className="luxe-card p-12 text-center text-xs text-muted-foreground">
                  No academies matched your search criteria.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/80 bg-card/75 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-accent/20 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3.5 px-4">Rank</th>
                          <th className="py-3.5 px-4">Academy / Dojo Name</th>
                          <th className="py-3.5 px-4">State &amp; District</th>
                          <th className="py-3.5 px-4 text-center">Athletes</th>
                          <th className="py-3.5 px-4 text-center">Medals (🥇 🥈 🥉)</th>
                          <th className="py-3.5 px-4 text-right">Total Points</th>
                          <th className="py-3.5 px-4 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredAcademies.map((acad) => (
                          <tr
                            key={acad.rank}
                            className={cn(
                              "hover:bg-accent/20 transition-colors",
                              acad.rank === 1
                                ? "bg-amber-500/10 font-semibold"
                                : acad.rank === 2
                                ? "bg-slate-500/10"
                                : acad.rank === 3
                                ? "bg-amber-800/10"
                                : ""
                            )}
                          >
                            <td className="py-3.5 px-4">
                              <span
                                className={cn(
                                  "size-7 rounded-lg font-black text-xs inline-flex items-center justify-center shadow-sm",
                                  acad.rank === 1
                                    ? "bg-amber-400 text-stone-950"
                                    : acad.rank === 2
                                    ? "bg-slate-300 text-stone-950"
                                    : acad.rank === 3
                                    ? "bg-amber-700 text-amber-100"
                                    : "bg-accent text-foreground"
                                )}
                              >
                                #{acad.rank}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                <Building2 className="size-3.5 text-primary shrink-0" />
                                <span>{acad.academyName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {acad.district}, {acad.state}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-foreground">
                              {acad.totalAthletes}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2 font-bold text-xs">
                                <span className="text-amber-400" title="Gold">🥇 {acad.gold}</span>
                                <span className="text-slate-300" title="Silver">🥈 {acad.silver}</span>
                                <span className="text-amber-600" title="Bronze">🥉 {acad.bronze}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono font-black text-sm text-primary">
                                {acad.totalPoints} pts
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                              {acad.performanceScore} avg/ath
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* =========================================================
               ATHLETE OFFICIAL RANKINGS TABLE
               ========================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase text-foreground flex items-center gap-2">
                  <Trophy className="size-4 text-primary" /> Official Competitor Standings
                </h3>
                <span className="text-xs text-muted-foreground">
                  Showing {filteredAthletes.length} of {athletes.length} Athletes
                </span>
              </div>

              {filteredAthletes.length === 0 ? (
                <div className="luxe-card p-12 text-center text-xs text-muted-foreground">
                  No athletes matched your search or filter criteria.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/80 bg-card/75 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-accent/20 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3.5 px-4 whitespace-nowrap">Rank</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Athlete &amp; ID</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Club / Dojo</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Category / Division</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">State &amp; District</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap">Podiums (🥇 🥈 🥉)</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap">Win Ratio</th>
                          <th className="py-3.5 px-4 text-right whitespace-nowrap">Official Points</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredAthletes.map((ath) => (
                          <tr
                            key={ath.rankingId}
                            onClick={() => setSelectedAthlete(ath)}
                            className={cn(
                              "hover:bg-accent/25 transition-colors cursor-pointer group",
                              ath.currentRank === 1
                                ? "bg-amber-500/10"
                                : ath.currentRank === 2
                                ? "bg-slate-500/10"
                                : ath.currentRank === 3
                                ? "bg-amber-800/10"
                                : ""
                            )}
                          >
                            {/* Rank & Change */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "size-8 rounded-xl font-black text-xs flex items-center justify-center shadow-sm shrink-0",
                                    ath.currentRank === 1
                                      ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 border border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                                      : ath.currentRank === 2
                                      ? "bg-gradient-to-br from-slate-200 to-slate-400 text-stone-950 border border-slate-200"
                                      : ath.currentRank === 3
                                      ? "bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 border border-amber-600"
                                      : "bg-accent/60 text-foreground border border-border"
                                  )}
                                >
                                  #{ath.currentRank}
                                </span>

                                {/* Rank change badge */}
                                {ath.rankChange > 0 ? (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                                    <TrendingUp className="size-3 mr-0.5" /> +{ath.rankChange}
                                  </span>
                                ) : ath.rankChange < 0 ? (
                                  <span className="text-[10px] font-bold text-rose-400 flex items-center">
                                    <TrendingDown className="size-3 mr-0.5" /> {ath.rankChange}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center">
                                    <Minus className="size-3" />
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Athlete Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-xs shrink-0 overflow-hidden">
                                  {ath.photo && !ath.photo.includes("1500648767791-00dcc994a43e") ? (
                                    <img
                                      src={ath.photo}
                                      alt={ath.athleteName}
                                      className="size-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "";
                                      }}
                                    />
                                  ) : (
                                    ath.athleteName.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-black text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                                    {ath.athleteName}
                                  </h4>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {ath.athleteId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Club */}
                            <td className="py-3.5 px-4 font-semibold text-foreground">
                              <p className="truncate max-w-[150px]">{ath.clubName}</p>
                              <span className="text-[10px] text-amber-400 font-bold block">{ath.beltRank}</span>
                            </td>

                            {/* Discipline & Division */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-foreground block">{ath.discipline}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {ath.gender} · {ath.ageGroup} · {ath.weightCategory}
                              </span>
                            </td>

                            {/* State & District */}
                            <td className="py-3.5 px-4 text-muted-foreground">
                              <p className="font-semibold text-foreground">{ath.district}</p>
                              <span className="text-[10px]">{ath.state}</span>
                            </td>

                            {/* Medals */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2 font-bold text-xs">
                                <span className="text-amber-400" title="Gold">🥇 {ath.medals.gold}</span>
                                <span className="text-slate-300" title="Silver">🥈 {ath.medals.silver}</span>
                                <span className="text-amber-600" title="Bronze">🥉 {ath.medals.bronze}</span>
                              </div>
                            </td>

                            {/* Win Ratio */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex flex-col items-center justify-center">
                                <span
                                  className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border shadow-sm whitespace-nowrap",
                                    ath.winRatio >= 85
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : ath.winRatio >= 75
                                      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  )}
                                >
                                  {ath.winRatio}%
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono font-semibold mt-0.5 whitespace-nowrap">
                                  {ath.matchesWon}W · {ath.matchesLost}L
                                </span>
                              </div>
                            </td>

                            {/* Total Points */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono font-black text-sm text-gold-gradient">
                                {ath.totalPoints} pts
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="p-1.5 rounded-lg bg-accent/40 group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground transition-all inline-flex items-center justify-center">
                                <ArrowUpRight className="size-3.5" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ATHLETE RANKING PROFILE DETAIL MODAL */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="size-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl font-black text-amber-400 overflow-hidden shrink-0">
                  {selectedAthlete.photo && !selectedAthlete.photo.includes("1500648767791-00dcc994a43e") ? (
                    <img
                      src={selectedAthlete.photo}
                      alt={selectedAthlete.athleteName}
                      className="size-full object-cover"
                    />
                  ) : (
                    selectedAthlete.athleteName.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/35 text-[10px] font-black uppercase tracking-wider">
                      National Rank #{selectedAthlete.currentRank}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      <ShieldCheck className="size-3 inline mr-1" /> Verified Standing
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                    {selectedAthlete.athleteName}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    KALAWAR ID: <strong className="text-primary">{selectedAthlete.athleteId}</strong> · Ranking ID: {selectedAthlete.rankingId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAthlete(null)}
                className="size-8 rounded-full bg-accent/40 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Performance Stats KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Points</span>
                <p className="text-xl font-black text-gold-gradient">{selectedAthlete.totalPoints}</p>
                <span className="text-[9px] text-muted-foreground">Merit Score</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Medals Won</span>
                <p className="text-sm font-black text-foreground pt-1">
                  🥇{selectedAthlete.medals.gold} 🥈{selectedAthlete.medals.silver} 🥉{selectedAthlete.medals.bronze}
                </p>
                <span className="text-[9px] text-muted-foreground">Podiums</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Win Ratio</span>
                <p className="text-xl font-black text-emerald-400">{selectedAthlete.winRatio}%</p>
                <span className="text-[9px] text-muted-foreground">{selectedAthlete.matchesWon}W / {selectedAthlete.matchesLost}L</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Rank Change</span>
                <p className="text-xl font-black text-foreground">
                  {selectedAthlete.rankChange > 0 ? (
                    <span className="text-emerald-400">▲ +{selectedAthlete.rankChange}</span>
                  ) : selectedAthlete.rankChange < 0 ? (
                    <span className="text-rose-400">▼ {selectedAthlete.rankChange}</span>
                  ) : (
                    "—"
                  )}
                </p>
                <span className="text-[9px] text-muted-foreground">Prev: #{selectedAthlete.previousRank || selectedAthlete.currentRank}</span>
              </div>
            </div>

            {/* Athlete Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">Affiliated Academy / Club</span>
                <p className="font-bold text-foreground truncate">{selectedAthlete.clubName}</p>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">Belt Rank</span>
                <p className="font-bold text-amber-400">{selectedAthlete.beltRank}</p>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">Discipline</span>
                <p className="font-bold text-foreground">{selectedAthlete.discipline}</p>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">Division / Category</span>
                <p className="font-bold text-foreground">{selectedAthlete.gender} · {selectedAthlete.ageGroup}</p>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">Weight Category</span>
                <p className="font-bold text-foreground">{selectedAthlete.weightCategory}</p>
              </div>
              <div className="p-3 rounded-xl bg-card/60 border border-border/60">
                <span className="text-muted-foreground text-[10px]">State &amp; District</span>
                <p className="font-bold text-foreground">{selectedAthlete.district}, {selectedAthlete.state}</p>
              </div>
            </div>

            {/* Ranking History Progression */}
            {selectedAthlete.history && selectedAthlete.history.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-primary" /> Official Ranking History &amp; Milestones
                </h4>
                <div className="rounded-2xl border border-border/60 bg-accent/15 divide-y divide-border/40 overflow-hidden text-xs">
                  {selectedAthlete.history.map((h, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{h.period}</p>
                        {h.notes && <span className="text-[10px] text-muted-foreground">{h.notes}</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-amber-400">Rank #{h.rank}</span>
                        <p className="font-mono text-[10px] text-muted-foreground">{h.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code Verification Footer */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-card/80 via-card/50 to-primary/10 border border-primary/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Official QR Verification</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Scan this code to verify athlete credentials on the official portal.
                </p>
              </div>
              <div className="size-16 p-1.5 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                <QRCode
                  value={`https://kalawar-federation.org/ranking?search=${encodeURIComponent(selectedAthlete.athleteId)}`}
                  size={52}
                />
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAthlete(null)}
                className="btn-luxe px-6 py-2 text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
