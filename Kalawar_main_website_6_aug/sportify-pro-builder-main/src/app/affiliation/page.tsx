"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Filter,
  X,
  Sparkles,
  Building2,
  Landmark,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  QrCode,
  Globe,
  Flame,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { states } from "@/data/people";
import { IMAGES } from "@/data/images";
import { cn } from "@/lib/utils";
import type { Player } from "@/data/people";

type AffiliationTab = "academies" | "state-assoc" | "district-assoc";

const POPULAR_DISCIPLINES = [
  "All",
  "Taekwondo",
  "Karate",
  "Kickboxing",
  "Judo",
  "Kung Fu",
  "MMA",
  "Boxing",
  "Self Defense",
];

function AffiliationDirectoryContent() {
  const searchParams = useSearchParams();

  // Tab State: default to "academies"
  const [activeTab, setActiveTab] = useState<AffiliationTab>("academies");

  // Raw Data State
  const [clubs, setClubs] = useState<any[]>([]);
  const [rawStateAssocs, setRawStateAssocs] = useState<any[]>([]);
  const [rawDistrictAssocs, setRawDistrictAssocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector Modal State for Association Details
  const [viewingAssoc, setViewingAssoc] = useState<any | null>(null);

  // ==========================================
  // SECTION 1: ACADEMIES FILTERS & PAGINATION
  // ==========================================
  const [searchQueryClubs, setSearchQueryClubs] = useState(searchParams.get("q") || "");
  const [selectedStateClubs, setSelectedStateClubs] = useState(searchParams.get("state") || "All");
  const [selectedDistrictClubs, setSelectedDistrictClubs] = useState(searchParams.get("district") || "All");
  const [selectedDisciplineClubs, setSelectedDisciplineClubs] = useState(searchParams.get("discipline") || "All");
  const [currentPageClubs, setCurrentPageClubs] = useState(1);
  const CLUBS_PER_PAGE = 9;

  useEffect(() => {
    setCurrentPageClubs(1);
  }, [searchQueryClubs, selectedStateClubs, selectedDistrictClubs, selectedDisciplineClubs]);

  // ==========================================
  // SECTION 2: STATE ASSOC FILTERS & PAGINATION
  // ==========================================
  const [searchQueryState, setSearchQueryState] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState("All");
  const [currentPageState, setCurrentPageState] = useState(1);
  const STATES_PER_PAGE = 9;

  useEffect(() => {
    setCurrentPageState(1);
  }, [searchQueryState, selectedStateFilter]);

  // ==========================================
  // SECTION 3: DISTRICT ASSOC FILTERS & PAGINATION
  // ==========================================
  const [searchQueryDistrict, setSearchQueryDistrict] = useState("");
  const [selectedDistrictStateFilter, setSelectedDistrictStateFilter] = useState("All");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("All");
  const [currentPageDistrict, setCurrentPageDistrict] = useState(1);
  const DISTRICTS_PER_PAGE = 9;

  useEffect(() => {
    setCurrentPageDistrict(1);
  }, [searchQueryDistrict, selectedDistrictStateFilter, selectedDistrictFilter]);

  // Fetch all 3 registries
  useEffect(() => {
    async function loadAllRegistries() {
      try {
        setLoading(true);
        const [clubsRes, sRes, dRes] = await Promise.all([
          fetch("/api/clubs"),
          fetch("/api/state-associations"),
          fetch("/api/district-associations"),
        ]);
        const [clubsJson, sJson, dJson] = await Promise.all([
          clubsRes.json().catch(() => ({})),
          sRes.json().catch(() => ({})),
          dRes.json().catch(() => ({})),
        ]);

        if (clubsJson?.success && Array.isArray(clubsJson.clubs)) {
          setClubs(clubsJson.clubs);
        }
        if (sJson?.success && Array.isArray(sJson.associations)) {
          setRawStateAssocs(sJson.associations);
        }
        if (dJson?.success && Array.isArray(dJson.associations)) {
          setRawDistrictAssocs(dJson.associations);
        }
      } catch (err) {
        console.error("Failed to load affiliation registries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllRegistries();
  }, []);

  // Filter ONLY Active status users for State Associations
  const activeStateAssocs = useMemo(() => {
    return rawStateAssocs.filter((a) => {
      const st = (a.status || "").toLowerCase().trim();
      return st === "active" || st === "approved";
    });
  }, [rawStateAssocs]);

  // Filter ONLY Active status users for District Associations
  const activeDistrictAssocs = useMemo(() => {
    return rawDistrictAssocs.filter((a) => {
      const st = (a.status || "").toLowerCase().trim();
      return st === "active" || st === "approved";
    });
  }, [rawDistrictAssocs]);

  // Available districts for clubs filter
  const availableClubDistricts = useMemo(() => {
    const list = selectedStateClubs === "All"
      ? clubs
      : clubs.filter((c) => c.state?.toLowerCase() === selectedStateClubs.toLowerCase());
    const set = new Set<string>();
    list.forEach((c) => {
      if (c.district) set.add(c.district);
      else if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [clubs, selectedStateClubs]);

  // Available districts for district association filter
  const availableAssocDistricts = useMemo(() => {
    const list = selectedDistrictStateFilter === "All"
      ? activeDistrictAssocs
      : activeDistrictAssocs.filter((a) => a.state?.toLowerCase() === selectedDistrictStateFilter.toLowerCase());
    const set = new Set<string>();
    list.forEach((a) => {
      if (a.district) set.add(a.district);
      else if (a.city) set.add(a.city);
    });
    return Array.from(set).sort();
  }, [activeDistrictAssocs, selectedDistrictStateFilter]);

  // ==========================================
  // FILTERED SLICES
  // ==========================================

  // 1. Filtered Clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      if (selectedStateClubs !== "All" && club.state?.toLowerCase() !== selectedStateClubs.toLowerCase()) {
        return false;
      }
      if (selectedDistrictClubs !== "All") {
        const d = (club.district || club.city || "").toLowerCase();
        if (d !== selectedDistrictClubs.toLowerCase()) return false;
      }
      if (selectedDisciplineClubs !== "All") {
        const matchesPrimary = club.discipline?.toLowerCase() === selectedDisciplineClubs.toLowerCase();
        const matchesArray = club.disciplines?.some(
          (disc: string) => disc.toLowerCase() === selectedDisciplineClubs.toLowerCase()
        );
        if (!matchesPrimary && !matchesArray) return false;
      }
      if (searchQueryClubs.trim()) {
        const q = searchQueryClubs.toLowerCase();
        const matchName = club.name?.toLowerCase().includes(q);
        const matchId = club.id?.toLowerCase().includes(q);
        const matchCity = club.city?.toLowerCase().includes(q);
        const matchDistrict = club.district?.toLowerCase().includes(q);
        const matchCoach = club.headCoachName?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCity && !matchDistrict && !matchCoach) {
          return false;
        }
      }
      return true;
    });
  }, [clubs, selectedStateClubs, selectedDistrictClubs, selectedDisciplineClubs, searchQueryClubs]);

  const totalPagesClubs = Math.ceil(filteredClubs.length / CLUBS_PER_PAGE);
  const paginatedClubs = useMemo(() => {
    const start = (currentPageClubs - 1) * CLUBS_PER_PAGE;
    return filteredClubs.slice(start, start + CLUBS_PER_PAGE);
  }, [filteredClubs, currentPageClubs]);

  // 2. Filtered State Associations
  const filteredStateAssocs = useMemo(() => {
    return activeStateAssocs.filter((assoc) => {
      if (selectedStateFilter !== "All" && assoc.state?.toLowerCase() !== selectedStateFilter.toLowerCase()) {
        return false;
      }
      if (searchQueryState.trim()) {
        const q = searchQueryState.toLowerCase();
        const matchName = assoc.name?.toLowerCase().includes(q);
        const matchId = assoc.id?.toLowerCase().includes(q);
        const matchState = assoc.state?.toLowerCase().includes(q);
        const matchPres = assoc.presidentName?.toLowerCase().includes(q);
        const matchSec = assoc.secretaryName?.toLowerCase().includes(q);
        const matchEmail = assoc.email?.toLowerCase().includes(q);
        const matchPhone = assoc.phone?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchState && !matchPres && !matchSec && !matchEmail && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [activeStateAssocs, selectedStateFilter, searchQueryState]);

  const totalPagesState = Math.ceil(filteredStateAssocs.length / STATES_PER_PAGE);
  const paginatedStateAssocs = useMemo(() => {
    const start = (currentPageState - 1) * STATES_PER_PAGE;
    return filteredStateAssocs.slice(start, start + STATES_PER_PAGE);
  }, [filteredStateAssocs, currentPageState]);

  // 3. Filtered District Associations
  const filteredDistrictAssocs = useMemo(() => {
    return activeDistrictAssocs.filter((assoc) => {
      if (selectedDistrictStateFilter !== "All" && assoc.state?.toLowerCase() !== selectedDistrictStateFilter.toLowerCase()) {
        return false;
      }
      if (selectedDistrictFilter !== "All") {
        const d = (assoc.district || assoc.city || "").toLowerCase();
        if (d !== selectedDistrictFilter.toLowerCase()) return false;
      }
      if (searchQueryDistrict.trim()) {
        const q = searchQueryDistrict.toLowerCase();
        const matchName = assoc.name?.toLowerCase().includes(q);
        const matchId = assoc.id?.toLowerCase().includes(q);
        const matchDist = assoc.district?.toLowerCase().includes(q);
        const matchCity = assoc.city?.toLowerCase().includes(q);
        const matchPres = assoc.presidentName?.toLowerCase().includes(q);
        const matchSec = assoc.secretaryName?.toLowerCase().includes(q);
        const matchEmail = assoc.email?.toLowerCase().includes(q);
        const matchPhone = assoc.phone?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDist && !matchCity && !matchPres && !matchSec && !matchEmail && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [activeDistrictAssocs, selectedDistrictStateFilter, selectedDistrictFilter, searchQueryDistrict]);

  const totalPagesDistrict = Math.ceil(filteredDistrictAssocs.length / DISTRICTS_PER_PAGE);
  const paginatedDistrictAssocs = useMemo(() => {
    const start = (currentPageDistrict - 1) * DISTRICTS_PER_PAGE;
    return filteredDistrictAssocs.slice(start, start + DISTRICTS_PER_PAGE);
  }, [filteredDistrictAssocs, currentPageDistrict]);

  // ==========================================
  // DYNAMIC SECTION ORDERING AS SPECIFIED:
  // - If Academies selected: Academies -> State Assoc -> District Assoc
  // - If State Assoc selected: State Assoc -> District Assoc -> Academies
  // - If District Assoc selected: District Assoc -> State Assoc -> Academies
  // ==========================================
  const sectionOrder = useMemo<AffiliationTab[]>(() => {
    if (activeTab === "state-assoc") {
      return ["state-assoc", "district-assoc", "academies"];
    }
    if (activeTab === "district-assoc") {
      return ["district-assoc", "state-assoc", "academies"];
    }
    // Default: "academies"
    return ["academies", "state-assoc", "district-assoc"];
  }, [activeTab]);

  const handleTabChange = (newTab: AffiliationTab) => {
    setActiveTab(newTab);
    const container = document.getElementById("affiliation-sections-container");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <SiteLayout>
      {/* 1. Official Hero Section */}
      <PageHero
        eyebrow="Official Federation Affiliation Network"
        title="KALAWAR AFFILIATION DIRECTORY"
        description="Explore officially affiliated academies, clubs, state associations, and district associations across India. Verified training centers, certified officials, and national federation accreditation."
        image={IMAGES.sparring}
      />

      <div className="bg-stone-950 min-h-screen py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">

          {/* 2. Primary Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-gold-500/20 shadow-lg flex items-center gap-2.5 sm:gap-4 transition-all">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gold-500/10 text-gold-400 shrink-0">
                <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] sm:text-xs text-stone-400 font-medium leading-tight">Affiliated Academies</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-tight">{clubs.length || "24+"}</p>
                <p className="text-[9.5px] sm:text-[10px] text-amber-400 font-semibold leading-tight">Verified Institutions</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 shadow-lg flex items-center gap-2.5 sm:gap-4 transition-all">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] sm:text-xs text-stone-400 font-medium leading-tight">State Associations</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-tight">{activeStateAssocs.length}</p>
                <p className="text-[9.5px] sm:text-[10px] text-emerald-400 font-semibold leading-tight">Active State Units</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 shadow-lg flex items-center gap-2.5 sm:gap-4 transition-all">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-400 shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] sm:text-xs text-stone-400 font-medium leading-tight">District Associations</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-tight">{activeDistrictAssocs.length}</p>
                <p className="text-[9.5px] sm:text-[10px] text-blue-400 font-semibold leading-tight">Active District Units</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 shadow-lg flex items-center gap-2.5 sm:gap-4 transition-all">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-400 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] sm:text-xs text-stone-400 font-medium leading-tight">Accredited Coaches</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-tight">120+</p>
                <p className="text-[9.5px] sm:text-[10px] text-purple-400 font-semibold leading-tight">Dan Masters &amp; Officials</p>
              </div>
            </div>
          </div>

          {/* 3. PROMINENT 3-TAB SELECTOR BAR */}
          <div className="p-2 rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-gold-500/30 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Tab 1: Affiliated Academies Directory */}
              <button
                type="button"
                onClick={() => handleTabChange("academies")}
                className={cn(
                  "px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer",
                  activeTab === "academies"
                    ? "bg-gold-gradient text-stone-950 shadow-gold scale-[1.01]"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                )}
              >
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Affiliated Academies Directory</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                    activeTab === "academies"
                      ? "bg-stone-950/20 text-stone-950"
                      : "bg-stone-800 text-stone-400"
                  )}
                >
                  {clubs.length}
                </span>
              </button>

              {/* Tab 2: Affiliated State Association */}
              <button
                type="button"
                onClick={() => handleTabChange("state-assoc")}
                className={cn(
                  "px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer",
                  activeTab === "state-assoc"
                    ? "bg-gold-gradient text-stone-950 shadow-gold scale-[1.01]"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                )}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Affiliated State Association</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                    activeTab === "state-assoc"
                      ? "bg-stone-950/20 text-stone-950"
                      : "bg-stone-800 text-stone-400"
                  )}
                >
                  {activeStateAssocs.length}
                </span>
              </button>

              {/* Tab 3: Affiliated District Association */}
              <button
                type="button"
                onClick={() => handleTabChange("district-assoc")}
                className={cn(
                  "px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer",
                  activeTab === "district-assoc"
                    ? "bg-gold-gradient text-stone-950 shadow-gold scale-[1.01]"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                )}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Affiliated District Association</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                    activeTab === "district-assoc"
                      ? "bg-stone-950/20 text-stone-950"
                      : "bg-stone-800 text-stone-400"
                  )}
                >
                  {activeDistrictAssocs.length}
                </span>
              </button>
            </div>
          </div>

          {/* 4. DYNAMICALLY ORDERED DIRECTORY SECTIONS CONTAINER */}
          <div id="affiliation-sections-container" className="space-y-12 sm:space-y-16">
            {sectionOrder.map((sectionKey, index) => {
              if (sectionKey === "academies") {
                return (
                  <div key="academies" id="clubs-directory-grid" className="space-y-6 pt-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/15 text-gold-400 border border-gold-500/30">
                            Directory Section {index + 1}
                          </span>
                          {activeTab === "academies" && (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-400 text-stone-950">
                              Selected Tab
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
                          <Landmark className="w-6 h-6 text-amber-400 shrink-0" />
                          <span>Affiliated Academies Directory</span>
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Showing{" "}
                          <strong className="text-white">
                            {filteredClubs.length > 0 ? (currentPageClubs - 1) * CLUBS_PER_PAGE + 1 : 0}–
                            {Math.min(currentPageClubs * CLUBS_PER_PAGE, filteredClubs.length)}
                          </strong>{" "}
                          of <strong className="text-white">{filteredClubs.length}</strong> verified institutions with valid affiliation
                        </p>
                      </div>

                      <Link
                        href="/register?type=club&regType=apply"
                        className="w-full sm:w-auto justify-center bg-gold-gradient text-background px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 shrink-0"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Apply for Academy Affiliation</span>
                      </Link>
                    </div>

                    {/* Search & Filters for Academies */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="sm:col-span-2 md:col-span-6 relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search by academy name, city, coach, ID..."
                            value={searchQueryClubs}
                            onChange={(e) => setSearchQueryClubs(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                          />
                          {searchQueryClubs && (
                            <button
                              onClick={() => setSearchQueryClubs("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white p-0.5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="sm:col-span-1 md:col-span-3 relative">
                          <select
                            value={selectedStateClubs}
                            onChange={(e) => {
                              setSelectedStateClubs(e.target.value);
                              setSelectedDistrictClubs("All");
                            }}
                            className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 cursor-pointer"
                          >
                            <option value="All">All States (India)</option>
                            {states.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                        </div>

                        <div className="sm:col-span-1 md:col-span-3 relative">
                          <select
                            value={selectedDistrictClubs}
                            onChange={(e) => setSelectedDistrictClubs(e.target.value)}
                            disabled={availableClubDistricts.length === 0}
                            className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="All">All Districts</option>
                            {availableClubDistricts.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                        </div>
                      </div>

                      {(searchQueryClubs || selectedStateClubs !== "All" || selectedDistrictClubs !== "All") && (
                        <div className="flex items-center justify-end pt-2 border-t border-stone-800/80">
                          <button
                            onClick={() => {
                              setSearchQueryClubs("");
                              setSelectedStateClubs("All");
                              setSelectedDistrictClubs("All");
                            }}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reset Academy Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Academies Grid */}
                    {loading ? (
                      <div className="py-16 text-center">
                        <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-stone-400">Loading affiliated academies...</p>
                      </div>
                    ) : filteredClubs.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {paginatedClubs.map((club) => {
                            const logo =
                              club.logo ||
                              club.image ||
                              "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80";
                            const headCoach = club.headCoachName || club.coachName || "Certified Master Coach";

                            return (
                              <div
                                key={club.id}
                                className="rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-gold-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-gold-500/10 flex flex-col justify-between overflow-hidden group"
                              >
                                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-gold-500/30 bg-stone-950 p-1 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                      <img src={logo} alt={club.name} className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                                        {club.id}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Verified
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                                      {club.name}
                                    </h3>
                                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span className="truncate">
                                        {club.city ? `${club.city}, ` : ""}
                                        {club.state}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                      Chief Instructor / Director:
                                    </p>
                                    <p className="text-xs font-extrabold text-stone-200 truncate flex items-center gap-1.5">
                                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>{headCoach}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="p-3.5 sm:p-4 bg-stone-950/80 border-t border-stone-800/80 flex items-center justify-between gap-2">
                                  <div className="text-[11px] text-stone-400 font-medium truncate">
                                    {club.validUntil ? (
                                      <span className="flex items-center gap-1 text-emerald-400">
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span>Valid 2026-27</span>
                                      </span>
                                    ) : (
                                      <span>Session Active</span>
                                    )}
                                  </div>

                                  <Link
                                    href={`/clubs/${encodeURIComponent(club.id)}`}
                                    className="bg-gold-gradient text-background px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.03] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer shrink-0"
                                  >
                                    <span>View Profile</span>
                                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls for Academies (9 per page) */}
                        {totalPagesClubs > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageClubs((p) => Math.max(1, p - 1));
                                const el = document.getElementById("clubs-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageClubs === 1}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <ChevronLeft className="w-4 h-4 text-amber-400" />
                              <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                              {Array.from({ length: totalPagesClubs }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isCurrent = pageNum === currentPageClubs;
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setCurrentPageClubs(pageNum);
                                      const el = document.getElementById("clubs-directory-grid");
                                      if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className={cn(
                                      "w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer",
                                      isCurrent
                                        ? "bg-gold-gradient text-background shadow-gold scale-105"
                                        : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700"
                                    )}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageClubs((p) => Math.min(totalPagesClubs, p + 1));
                                const el = document.getElementById("clubs-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageClubs === totalPagesClubs}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4 text-amber-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 p-6 space-y-3">
                        <Landmark className="w-10 h-10 text-stone-600 mx-auto" />
                        <h3 className="text-base font-bold text-white">No Affiliated Academies Found</h3>
                        <p className="text-xs text-stone-400 max-w-md mx-auto">
                          No clubs matched your search criteria.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              if (sectionKey === "state-assoc") {
                return (
                  <div key="state-assoc" id="state-assoc-directory-grid" className="space-y-6 pt-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Directory Section {index + 1}
                          </span>
                          {activeTab === "state-assoc" && (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-400 text-stone-950">
                              Selected Tab
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
                          <MapPin className="w-6 h-6 text-emerald-400 shrink-0" />
                          <span>Affiliated State Associations</span>
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Showing{" "}
                          <strong className="text-white">
                            {filteredStateAssocs.length > 0 ? (currentPageState - 1) * STATES_PER_PAGE + 1 : 0}–
                            {Math.min(currentPageState * STATES_PER_PAGE, filteredStateAssocs.length)}
                          </strong>{" "}
                          of <strong className="text-white">{filteredStateAssocs.length}</strong> active state governing associations
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Status Only</span>
                        </span>
                      </div>
                    </div>

                    {/* Search & Filters for State Associations */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8 relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search by state association name, ID, president, secretary, state..."
                            value={searchQueryState}
                            onChange={(e) => setSearchQueryState(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                          />
                          {searchQueryState && (
                            <button
                              onClick={() => setSearchQueryState("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white p-0.5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="sm:col-span-4 relative">
                          <select
                            value={selectedStateFilter}
                            onChange={(e) => setSelectedStateFilter(e.target.value)}
                            className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 cursor-pointer"
                          >
                            <option value="All">All States (India)</option>
                            {states.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                        </div>
                      </div>

                      {(searchQueryState || selectedStateFilter !== "All") && (
                        <div className="flex items-center justify-end pt-2 border-t border-stone-800/80">
                          <button
                            onClick={() => {
                              setSearchQueryState("");
                              setSelectedStateFilter("All");
                            }}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reset State Association Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* State Associations Grid */}
                    {loading ? (
                      <div className="py-16 text-center">
                        <div className="w-9 h-9 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-stone-400">Loading active state associations...</p>
                      </div>
                    ) : filteredStateAssocs.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {paginatedStateAssocs.map((assoc) => {
                            const logo =
                              assoc.image ||
                              assoc.logo ||
                              "/logo.png";
                            const stateName = assoc.state || "National Jurisdiction";
                            const president = assoc.presidentName || assoc.president || "State President";
                            const secretary = assoc.secretaryName || assoc.secretary || "General Secretary";

                            return (
                              <div
                                key={assoc.id}
                                className="rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-emerald-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden group"
                              >
                                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-emerald-500/30 bg-stone-950 p-2 shrink-0 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                                      <img src={logo} alt={assoc.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        {assoc.id}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Active State Unit
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                                      {assoc.name}
                                    </h3>
                                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="truncate font-semibold text-stone-300">{stateName}</span>
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        President:
                                      </span>
                                      <span className="font-extrabold text-stone-200 truncate">{president}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-t border-stone-900 pt-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        Gen. Secretary:
                                      </span>
                                      <span className="font-extrabold text-stone-200 truncate">{secretary}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3.5 sm:p-4 bg-stone-950/80 border-t border-stone-800/80 flex items-center justify-between gap-2">
                                  <div className="text-[11px] text-stone-400 font-medium truncate">
                                    {assoc.email ? (
                                      <span className="truncate max-w-[150px] inline-block">{assoc.email}</span>
                                    ) : (
                                      <span className="text-emerald-400">Accredited Unit</span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setViewingAssoc({ ...assoc, unitType: "State Association" })}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer shrink-0"
                                  >
                                    <span>View Unit Details</span>
                                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls for State Associations (9 per page) */}
                        {totalPagesState > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageState((p) => Math.max(1, p - 1));
                                const el = document.getElementById("state-assoc-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageState === 1}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <ChevronLeft className="w-4 h-4 text-amber-400" />
                              <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                              {Array.from({ length: totalPagesState }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isCurrent = pageNum === currentPageState;
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setCurrentPageState(pageNum);
                                      const el = document.getElementById("state-assoc-directory-grid");
                                      if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className={cn(
                                      "w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer",
                                      isCurrent
                                        ? "bg-gold-gradient text-background shadow-gold scale-105"
                                        : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700"
                                    )}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageState((p) => Math.min(totalPagesState, p + 1));
                                const el = document.getElementById("state-assoc-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageState === totalPagesState}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4 text-amber-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 p-6 space-y-3">
                        <MapPin className="w-10 h-10 text-stone-600 mx-auto" />
                        <h3 className="text-base font-bold text-white">No Active State Associations Found</h3>
                        <p className="text-xs text-stone-400 max-w-md mx-auto">
                          No active state governing bodies match the selected filters.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              if (sectionKey === "district-assoc") {
                return (
                  <div key="district-assoc" id="district-assoc-directory-grid" className="space-y-6 pt-2">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Directory Section {index + 1}
                          </span>
                          {activeTab === "district-assoc" && (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-400 text-stone-950">
                              Selected Tab
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
                          <Building2 className="w-6 h-6 text-blue-400 shrink-0" />
                          <span>Affiliated District Associations</span>
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Showing{" "}
                          <strong className="text-white">
                            {filteredDistrictAssocs.length > 0 ? (currentPageDistrict - 1) * DISTRICTS_PER_PAGE + 1 : 0}–
                            {Math.min(currentPageDistrict * DISTRICTS_PER_PAGE, filteredDistrictAssocs.length)}
                          </strong>{" "}
                          of <strong className="text-white">{filteredDistrictAssocs.length}</strong> active district governing associations
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Status Only</span>
                        </span>
                      </div>
                    </div>

                    {/* Search & Filters for District Associations */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="sm:col-span-2 md:col-span-6 relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search by district association name, ID, city, president..."
                            value={searchQueryDistrict}
                            onChange={(e) => setSearchQueryDistrict(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60"
                          />
                          {searchQueryDistrict && (
                            <button
                              onClick={() => setSearchQueryDistrict("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white p-0.5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="sm:col-span-1 md:col-span-3 relative">
                          <select
                            value={selectedDistrictStateFilter}
                            onChange={(e) => {
                              setSelectedDistrictStateFilter(e.target.value);
                              setSelectedDistrictFilter("All");
                            }}
                            className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 cursor-pointer"
                          >
                            <option value="All">All States (India)</option>
                            {states.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                        </div>

                        <div className="sm:col-span-1 md:col-span-3 relative">
                          <select
                            value={selectedDistrictFilter}
                            onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                            disabled={availableAssocDistricts.length === 0}
                            className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs sm:text-sm focus:outline-none focus:border-gold-500/60 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="All">All Districts</option>
                            {availableAssocDistricts.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                        </div>
                      </div>

                      {(searchQueryDistrict || selectedDistrictStateFilter !== "All" || selectedDistrictFilter !== "All") && (
                        <div className="flex items-center justify-end pt-2 border-t border-stone-800/80">
                          <button
                            onClick={() => {
                              setSearchQueryDistrict("");
                              setSelectedDistrictStateFilter("All");
                              setSelectedDistrictFilter("All");
                            }}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reset District Association Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* District Associations Grid */}
                    {loading ? (
                      <div className="py-16 text-center">
                        <div className="w-9 h-9 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-stone-400">Loading active district associations...</p>
                      </div>
                    ) : filteredDistrictAssocs.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {paginatedDistrictAssocs.map((assoc) => {
                            const logo =
                              assoc.image ||
                              assoc.logo ||
                              "/logo.png";
                            const distName = assoc.district || assoc.city || "District Jurisdiction";
                            const stateName = assoc.state || "State Jurisdiction";
                            const president = assoc.presidentName || assoc.president || "District President";
                            const secretary = assoc.secretaryName || assoc.secretary || "General Secretary";

                            return (
                              <div
                                key={assoc.id}
                                className="rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between overflow-hidden group"
                              >
                                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-blue-500/30 bg-stone-950 p-2 shrink-0 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                                      <img src={logo} alt={assoc.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                        {assoc.id}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Active District Unit
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                                      {assoc.name}
                                    </h3>
                                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                      <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <span className="truncate font-semibold text-stone-300">
                                        {distName}, {stateName}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        President:
                                      </span>
                                      <span className="font-extrabold text-stone-200 truncate">{president}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-t border-stone-900 pt-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        Gen. Secretary:
                                      </span>
                                      <span className="font-extrabold text-stone-200 truncate">{secretary}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3.5 sm:p-4 bg-stone-950/80 border-t border-stone-800/80 flex items-center justify-between gap-2">
                                  <div className="text-[11px] text-stone-400 font-medium truncate">
                                    {assoc.email ? (
                                      <span className="truncate max-w-[150px] inline-block">{assoc.email}</span>
                                    ) : (
                                      <span className="text-blue-400">Accredited Unit</span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setViewingAssoc({ ...assoc, unitType: "District Association" })}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer shrink-0"
                                  >
                                    <span>View Unit Details</span>
                                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls for District Associations (9 per page) */}
                        {totalPagesDistrict > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageDistrict((p) => Math.max(1, p - 1));
                                const el = document.getElementById("district-assoc-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageDistrict === 1}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <ChevronLeft className="w-4 h-4 text-amber-400" />
                              <span>Previous</span>
                            </button>

                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                              {Array.from({ length: totalPagesDistrict }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isCurrent = pageNum === currentPageDistrict;
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => {
                                      setCurrentPageDistrict(pageNum);
                                      const el = document.getElementById("district-assoc-directory-grid");
                                      if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className={cn(
                                      "w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer",
                                      isCurrent
                                        ? "bg-gold-gradient text-background shadow-gold scale-105"
                                        : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700"
                                    )}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageDistrict((p) => Math.min(totalPagesDistrict, p + 1));
                                const el = document.getElementById("district-assoc-directory-grid");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              disabled={currentPageDistrict === totalPagesDistrict}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4 text-amber-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 p-6 space-y-3">
                        <Building2 className="w-10 h-10 text-stone-600 mx-auto" />
                        <h3 className="text-base font-bold text-white">No Active District Associations Found</h3>
                        <p className="text-xs text-stone-400 max-w-md mx-auto">
                          No active district governing bodies match the selected filters.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* 5. Apply for Affiliation Callout Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-gold-500/40 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 p-5 sm:p-8 lg:p-10 shadow-2xl shadow-gold-500/10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  National Governance &amp; Official Affiliation
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Affiliate Your Dojo, Club, or State/District Body with KALAWAR
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
                  Receive official federation charter accreditation, conduct recognized belt grading examinations, field competitors in state &amp; national championships, and issue authentic QR-verifiable certificates.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-2.5 sm:gap-3">
                <Link
                  href="/register?type=club&regType=apply"
                  className="w-full sm:w-auto lg:w-full bg-gold-gradient text-background px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-gold hover:scale-[1.03] active:scale-[0.98] transition-transform text-center flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Apply for Affiliation Now</span>
                </Link>
                <Link
                  href="/rules"
                  className="w-full sm:w-auto lg:w-full px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-center transition-colors flex items-center justify-center"
                >
                  Affiliation Guidelines &amp; By-Laws
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ASSOCIATION UNIT DETAILS MODAL */}
      {viewingAssoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="luxe-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-gold-500/40 space-y-5 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-900 border border-gold-500/30 p-2 flex items-center justify-center">
                  <img
                    src={viewingAssoc.image || viewingAssoc.logo || "/logo.png"}
                    alt={viewingAssoc.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{viewingAssoc.name}</h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {viewingAssoc.id} • {viewingAssoc.unitType || "Affiliated Unit"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAssoc(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">Governance Status</p>
                <p className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active &amp; Recognized
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">Jurisdiction</p>
                <p className="font-bold text-white">
                  {viewingAssoc.district ? `${viewingAssoc.district}, ` : ""}
                  {viewingAssoc.state || "National"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">President / Head</p>
                <p className="font-extrabold text-stone-200">
                  {viewingAssoc.presidentName || viewingAssoc.president || "Authorized Official"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">General Secretary</p>
                <p className="font-extrabold text-stone-200">
                  {viewingAssoc.secretaryName || viewingAssoc.secretary || "Authorized Official"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">Official Email</p>
                <p className="font-medium text-stone-200 truncate">{viewingAssoc.email || "—"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-stone-400">Contact Telephone</p>
                <p className="font-medium text-stone-200 font-mono">{viewingAssoc.phone || "—"}</p>
              </div>
            </div>

            {viewingAssoc.address && (
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1 text-xs">
                <p className="text-[10px] uppercase font-bold text-stone-400">Headquarters Address</p>
                <p className="text-stone-300">
                  {viewingAssoc.address}
                  {viewingAssoc.city ? `, ${viewingAssoc.city}` : ""}
                  {viewingAssoc.pincode ? ` - ${viewingAssoc.pincode}` : ""}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setViewingAssoc(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

export default function AffiliationPage() {
  return (
    <Suspense
      fallback={
        <SiteLayout>
          <div className="min-h-screen bg-stone-950 flex items-center justify-center text-xs text-stone-400">
            Loading KALAWAR Affiliation Network...
          </div>
        </SiteLayout>
      }
    >
      <AffiliationDirectoryContent />
    </Suspense>
  );
}
