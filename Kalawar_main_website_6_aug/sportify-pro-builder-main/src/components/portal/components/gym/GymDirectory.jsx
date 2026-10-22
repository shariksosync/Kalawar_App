import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, MapPin, Star, Plus, ShieldCheck, Dumbbell, ArrowRight, LogIn } from "lucide-react";
import UserMenuDropdown from "../common/UserMenuDropdown";

export default function GymDirectory() {
  const { gyms, openModal, setView, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredGyms = gyms.filter((g) => {
    const matchesCity = selectedCity === "All" || g.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesCat =
      selectedCategory === "All" || g.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.city.toLowerCase().includes(search.toLowerCase()) ||
      g.address.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesCat && matchesSearch;
  });

  return (
    <div className="py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20 inline-block mb-2">
            Verified Athletic Clubs
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            GYM & Fitness <span className="gold-gradient-text">Partner Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Discover elite strength, combat, and CrossFit facilities with state-of-the-art conditioning equipment.
          </p>
        </div>

        {/* Dynamic Action Buttons: Sign In / Join Partner / User Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          {!currentUser || !currentUser.isRegistered ? (
            <>
              <button
                onClick={() => openModal("auth_modal", { defaultTab: "signin", defaultRole: "gym_partner" })}
                className="bg-dark-800 text-slate-200 border border-gold-500/30 hover:border-gold-500 hover:text-gold-400 font-heading font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openModal("gymPartner")}
                className="bg-gold-gradient text-black font-heading font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 flex items-center gap-1.5 transition-all"
              >
                <Plus size={16} />
                <span>Join as a Partner</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal("gymPartner")}
                className="bg-dark-800 text-slate-200 border border-white/10 hover:border-gold-500 hover:text-gold-400 font-heading font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus size={15} />
                <span>+ Join Another Facility</span>
              </button>
              <UserMenuDropdown />
            </>
          )}
        </div>
      </div>

      {/* Partner CTA Banner */}
      <div className="bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-gold-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10 max-w-2xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck size={18} className="text-gold-400" />
            <span className="text-xs uppercase font-bold tracking-wider text-gold-400">
              National Club Accreditation
            </span>
          </div>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
            Own a Gym or Fitness Club?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Partner with the Kalawar National Federation. Get listed on the national directory, accept verified enrollments, and manage members, subscriptions, staff payroll, and sales revenue through your private Partner Admin Panel.
          </p>
        </div>
        <button
          onClick={() => openModal("gymPartner")}
          className="shrink-0 bg-gold-gradient text-black font-heading font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 hover:-translate-y-0.5 transition-all relative z-10"
        >
          Join as a Partner Now
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
            placeholder="Search gym by name, area, or city..."
            className="w-full bg-dark-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="All">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Pune">Pune</option>
              <option value="Bangalore">Bangalore</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="All">All Categories</option>
              <option value="CrossFit">CrossFit</option>
              <option value="Combat">MMA & Combat</option>
              <option value="Powerlifting">Powerlifting</option>
              <option value="Yoga">Yoga & Wellness</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredGyms.length === 0 ? (
        <div className="bg-dark-850 border border-white/10 rounded-2xl p-12 text-center">
          <Dumbbell size={40} className="mx-auto text-slate-600 mb-3" />
          <h4 className="font-heading font-bold text-lg text-slate-300 mb-1">No partner gyms found</h4>
          <p className="text-xs text-slate-500">Try adjusting your search query or city filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGyms.map((gym) => (
            <div
              key={gym.id}
              className="bg-dark-850 border border-white/10 rounded-2xl overflow-hidden hover:border-gold-500/50 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={gym.image}
                    alt={gym.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-gold-500 text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-md">
                    {gym.category}
                  </span>
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-gold-500/40 text-gold-400 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} className="fill-gold-400 text-gold-400" />
                    <span>{gym.rating}</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-heading font-bold text-base text-white mb-1 group-hover:text-gold-400 transition-colors">
                    {gym.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <MapPin size={13} className="text-gold-500 shrink-0" />
                    <span className="truncate">{gym.address}, {gym.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {gym.amenities.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="text-[10px] bg-dark-700 text-slate-300 px-2 py-0.5 rounded border border-white/5"
                      >
                        {a}
                      </span>
                    ))}
                    {gym.amenities.length > 4 && (
                      <span className="text-[10px] bg-dark-700 text-gold-400 px-2 py-0.5 rounded">
                        +{gym.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                    Starting From
                  </div>
                  <div className="font-heading font-extrabold text-base text-gold-400">
                    ₹{gym.monthlyPrice.toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                  </div>
                </div>

                <button
                  onClick={() => openModal("gymDetails", gym)}
                  className="bg-dark-700 text-gold-400 hover:bg-gold-500 hover:text-black font-heading font-bold text-xs px-3.5 py-2 rounded-lg border border-gold-500/30 transition-all flex items-center gap-1"
                >
                  <span>View Details</span>
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
