import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, Trophy, MapPin, Plus, ShieldCheck, ArrowRight, Medal, LogIn } from "lucide-react";
import UserMenuDropdown from "../common/UserMenuDropdown";

export default function AcademyDirectory() {
  const { academies, openModal, setView, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState("All");

  const filteredAcademies = academies.filter((a) => {
    const matchesSport = selectedSport === "All" || a.sport.toLowerCase().includes(selectedSport.toLowerCase());
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.director.toLowerCase().includes(search.toLowerCase()) ||
      a.sport.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div className="py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-2">
            Grassroots to Podium
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Sports Academy <span className="gold-gradient-text">Partner Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            National coaching centers for Martial Arts, Badminton, Cricket, Football & Combat sports.
          </p>
        </div>

        {/* Dynamic Action Buttons: Sign In / Join Partner / User Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          {!currentUser || !currentUser.isRegistered ? (
            <>
              <button
                onClick={() => openModal("auth_modal", { defaultTab: "signin", defaultRole: "academy_partner" })}
                className="bg-dark-800 text-slate-200 border border-emerald-500/30 hover:border-emerald-500 hover:text-emerald-400 font-heading font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openModal("academyPartner")}
                className="bg-gold-gradient text-black font-heading font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 flex items-center gap-1.5 transition-all"
              >
                <Plus size={16} />
                <span>Join as a Partner</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal("academyPartner")}
                className="bg-dark-800 text-slate-200 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 font-heading font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus size={15} />
                <span>+ Register Another Branch</span>
              </button>
              <UserMenuDropdown />
            </>
          )}
        </div>
      </div>

      {/* Partner CTA Banner */}
      <div className="bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10 max-w-2xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              National Academy Affiliation
            </span>
          </div>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
            Direct a Sports Academy or Dojo?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Affiliate your academy under Kalawar Federation. Gain access to national Dan grading accreditation, state trial nominations, and your private Academy Partner Dashboard to manage batch schedules, athlete rosters, and tuition fee ledgers.
          </p>
        </div>
        <button
          onClick={() => openModal("academyPartner")}
          className="shrink-0 bg-gold-gradient text-black font-heading font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 hover:-translate-y-0.5 transition-all relative z-10"
        >
          Register Academy as Partner
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-dark-850 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative min-w-[260px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search academy, director, or sport..."
            className="w-full bg-dark-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Sport Discipline:</span>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="bg-dark-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
          >
            <option value="All">All Sports</option>
            <option value="Martial Arts">Martial Arts & Taekwondo</option>
            <option value="Badminton">Badminton</option>
            <option value="Cricket">Cricket</option>
            <option value="Football">Football</option>
            <option value="Wrestling">Wrestling & Combat</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredAcademies.length === 0 ? (
        <div className="bg-dark-850 border border-white/10 rounded-2xl p-12 text-center">
          <Trophy size={40} className="mx-auto text-slate-600 mb-3" />
          <h4 className="font-heading font-bold text-lg text-slate-300 mb-1">No academies found</h4>
          <p className="text-xs text-slate-500">Try selecting "All Sports" or a different search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAcademies.map((acad) => (
            <div
              key={acad.id}
              className="bg-dark-850 border border-white/10 rounded-2xl overflow-hidden hover:border-gold-500/50 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={acad.image}
                    alt={acad.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-gold-gradient text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-md">
                    {acad.sport}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-gold-400 transition-colors">
                    {acad.name}
                  </h3>
                  <div className="text-xs font-semibold text-gold-400 mb-1">
                    🏅 Head: {acad.director}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                    <MapPin size={13} className="text-gold-500 shrink-0" />
                    <span className="truncate">{acad.address}, {acad.city}</span>
                  </div>

                  <div className="bg-dark-750/50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center mb-4 border border-white/5">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold">Athletes</div>
                      <div className="font-heading font-bold text-sm text-white">{acad.studentsCount}+</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold">Coaches</div>
                      <div className="font-heading font-bold text-sm text-white">{acad.coachesCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-semibold">Medals</div>
                      <div className="font-heading font-bold text-sm text-gold-400 flex items-center justify-center gap-0.5">
                        <span>{acad.medalsWon}</span>
                        <Medal size={11} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {acad.ageGroups.map((grp) => (
                      <span
                        key={grp}
                        className="text-[10px] bg-dark-700 text-slate-300 px-2 py-0.5 rounded border border-white/5"
                      >
                        {grp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                    Tuition Fee
                  </div>
                  <div className="font-heading font-extrabold text-base text-gold-400">
                    ₹{acad.monthlyFee.toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                  </div>
                </div>

                <button
                  onClick={() => openModal("academyDetails", acad)}
                  className="bg-dark-700 text-gold-400 hover:bg-gold-500 hover:text-black font-heading font-bold text-xs px-3.5 py-2 rounded-lg border border-gold-500/30 transition-all flex items-center gap-1"
                >
                  <span>View & Trials</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
