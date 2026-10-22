"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { states as indianStates } from "@/data/people";
import { IMAGES } from "@/data/images";
import { cn } from "@/lib/utils";

interface CertifiedBeltCandidate {
  id: string;
  name: string;
  rank: string;
  athleteId: string;
  certificateNumber: string;
  district: string;
  state: string;
  club: string;
  examType: "Belt Examination" | "Black Belt Examination";
  examTitle: string;
  examDate?: string;
  issuedDate?: string;
  image?: string;
  certificateUrl?: string;
}

export default function CertifiedBeltsCandidatesPage() {
  const [candidates, setCandidates] = useState<CertifiedBeltCandidate[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Dropdown Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedBeltType, setSelectedBeltType] = useState<"All" | "Black Belt Examination" | "Belt Examination">("All");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certified-belts-candidates");
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        if (data.states && Array.isArray(data.states)) {
          setAvailableStates(data.states);
        }
      }
    } catch (err) {
      console.error("Failed to load certified candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Filter candidates locally for instant, zero-delay responsiveness
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Belt Type Filter
      if (selectedBeltType !== "All") {
        if (c.examType !== selectedBeltType) return false;
      }

      // 2. State Filter
      if (selectedState !== "All") {
        if (c.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      }

      // 3. Type Search (Name, Certificate No., User ID / Athlete ID, District, State, Rank)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = c.name.toLowerCase().includes(q);
        const mCert = c.certificateNumber.toLowerCase().includes(q);
        const mId = c.athleteId.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
        const mDistrict = c.district.toLowerCase().includes(q);
        const mState = c.state.toLowerCase().includes(q);
        const mRank = c.rank.toLowerCase().includes(q);

        if (!mName && !mCert && !mId && !mDistrict && !mState && !mRank) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchQuery, selectedState, selectedBeltType]);

  // Combined States List (from DB + fallback list)
  const allStateOptions = useMemo(() => {
    const set = new Set<string>();
    availableStates.forEach((s) => set.add(s));
    indianStates.forEach((s) => set.add(s));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableStates]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedState !== "All" ||
    selectedBeltType !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("All");
    setSelectedBeltType("All");
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Official Accreditation Roster"
        title="Certified Belts Candidates"
        description="National registry of authenticated martial artists and athletes certified through official Belt Examinations & Dan Gradings."
        image={IMAGES.martialArts}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* CONTROLS & FILTER BAR */}
        {/* ========================================================================= */}
        <div className="bg-stone-900/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* 1. Type Search Input (searches Name, Certificate no., User ID, District, State) */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, Certificate no., User ID, District, State..."
                className="w-full pl-10 pr-10 py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0 self-start lg:self-center">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {filteredCandidates.length}{" "}
                {filteredCandidates.length === 1 ? "Certified Candidate" : "Certified Candidates"}
              </span>
            </div>
          </div>

          {/* 2. Dropdown Filters (Belt/Category & State) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800/80">
            {/* Belt Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                Belt / Category
              </label>
              <select
                value={selectedBeltType}
                onChange={(e) => setSelectedBeltType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Examinations</option>
                <option value="Black Belt Examination">🥋 Black Belt Examination</option>
                <option value="Belt Examination">🥋 Belt Examination</option>
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All States</option>
                {allStateOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters / Refresh */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-700 text-stone-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>

              <button
                type="button"
                onClick={fetchCandidates}
                title="Reload List"
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-amber-400")} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN-WISE LIST VIEW (NAME & RANK ONLY) */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl sm:rounded-3xl p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-stone-300">Loading certified candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase">No Certified Candidates Found</h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
                {hasActiveFilters
                  ? "No certified candidates match your current search or filter criteria. Try resetting the filters."
                  : "No certified candidate records found in the database."}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#0e1017] border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/90 text-[11px] sm:text-xs uppercase tracking-wider font-bold text-stone-400">
                    <th scope="col" className="py-3.5 px-4 sm:px-6 w-16 text-center">
                      #
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6">
                      Candidate Name
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6">
                      Belt / Rank
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-xs sm:text-sm">
                  {filteredCandidates.map((candidate, idx) => {
                    const isBlackBelt =
                      candidate.examType === "Black Belt Examination" ||
                      candidate.rank.toLowerCase().includes("dan") ||
                      candidate.rank.toLowerCase().includes("black");

                    return (
                      <tr
                        key={`${candidate.examType}-${candidate.certificateNumber}-${candidate.id}-${idx}`}
                        className="hover:bg-stone-900/60 transition-colors group"
                      >
                        {/* 1. Sr. No. Column */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-mono font-semibold text-stone-500 text-center text-xs">
                          {idx + 1}
                        </td>

                        {/* 2. Candidate Name Column */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden",
                                isBlackBelt
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm"
                                  : "bg-stone-800/80 border-stone-700 text-stone-300"
                              )}
                            >
                              {candidate.image ? (
                                <img
                                  src={candidate.image}
                                  alt={candidate.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-base sm:text-lg">🥋</span>
                              )}
                            </div>
                            <div>
                              <span className="font-black text-white uppercase tracking-wide group-hover:text-amber-400 transition-colors block text-xs sm:text-sm md:text-base">
                                {candidate.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Belt / Rank Column */}
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm">
                            <span>🥋</span>
                            <span>{candidate.rank}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
