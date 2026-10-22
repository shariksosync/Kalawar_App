import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Shield,
  Dumbbell,
  Trophy,
  Video,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Eye,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ShieldAlert
} from "lucide-react";

export default function SuperAdminDashboard() {
  const {
    gyms,
    academies,
    mediaPosts,
    users,
    approveGym,
    suspendGym,
    deleteGym,
    approveAcademy,
    suspendAcademy,
    deleteAcademy,
    deletePost,
    setRole,
    setView,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState("overview");

  // Search & Filter states
  const [gymSearch, setGymSearch] = useState("");
  const [gymStatusFilter, setGymStatusFilter] = useState("All");

  const [acadSearch, setAcadSearch] = useState("");
  const [acadSportFilter, setAcadSportFilter] = useState("All");

  const [mediaSearch, setMediaSearch] = useState("");

  // Approvals counts
  const pendingGyms = gyms.filter((g) => g.status === "Pending");
  const pendingAcademies = academies.filter((a) => a.status === "Pending");
  const totalEconomy =
    gyms.reduce((acc, g) => acc + (g.monthlyRevenue || 0), 0) +
    academies.reduce((acc, a) => acc + (a.studentsCount * (a.monthlyFee || 2500)), 0);

  // Filtered lists
  const filteredGyms = gyms.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
      g.city.toLowerCase().includes(gymSearch.toLowerCase());
    const matchesStatus = gymStatusFilter === "All" || g.status === gymStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAcademies = academies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(acadSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(acadSearch.toLowerCase()) ||
      a.director.toLowerCase().includes(acadSearch.toLowerCase());
    const matchesSport = acadSportFilter === "All" || a.sport.toLowerCase().includes(acadSportFilter.toLowerCase());
    return matchesSearch && matchesSport;
  });

  const filteredPosts = mediaPosts.filter((p) => {
    return (
      p.title.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      p.authorName.toLowerCase().includes(mediaSearch.toLowerCase())
    );
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner: Master Federation Console */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border border-gold-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-xl shadow-gold-500/20 flex-shrink-0">
              <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-10 h-10 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-500 text-obsidian-950 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> SUPER ADMIN CONSOLE
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Federation System 100% Operational
                </span>
                <span className="text-xs text-gray-400">Mock Engine: Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
                Chief Federation Administrative Headquarters
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Centralized oversight for Gym & Fitness Partners, Sports Academies, Media Moderation & Athlete Rosters.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                pendingGyms.forEach((g) => approveGym(g.id));
                pendingAcademies.forEach((a) => approveAcademy(a.id));
                showToast("All pending applications batch-approved!", "success");
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Quick Approve All Pending ({pendingGyms.length + pendingAcademies.length})
            </button>
            <button
              onClick={() => setView("home")}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Console Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Federation Analytics", icon: Activity },
            {
              id: "gyms",
              label: `Gym Partners (${gyms.length})${pendingGyms.length ? ` ⚠️ ${pendingGyms.length}` : ""}`,
              icon: Dumbbell
            },
            {
              id: "academies",
              label: `Sports Academies (${academies.length})${pendingAcademies.length ? ` ⚠️ ${pendingAcademies.length}` : ""}`,
              icon: Trophy
            },
            { id: "moderation", label: `Media Moderation (${mediaPosts.length})`, icon: Video },
            { id: "users", label: `Platform Users (${users.length})`, icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-lg shadow-gold-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-obsidian-950" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Ecosystem KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Affiliated Gyms</span>
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{gyms.length} Clubs</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {gyms.filter(g => g.status === "Approved").length} Active in Directory
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Certified Academies</span>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{academies.length} Dojos</div>
              <p className="text-xs text-blue-400 font-medium">
                Covering Taekwondo, Football, Cricket, Badminton & Wrestling
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Media Reels & Posts</span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{mediaPosts.length} Clips</div>
              <p className="text-xs text-purple-400 font-medium">
                {mediaPosts.reduce((acc, p) => acc + p.viewsCount, 0).toLocaleString()} Total Reel Views
              </p>
            </div>

            <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Federation Economy</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">
                ₹{(totalEconomy / 100000).toFixed(1)} Lakhs
              </div>
              <p className="text-xs text-emerald-400 font-medium">
                Simulated Monthly Partner Gross Run Rate
              </p>
            </div>
          </div>

          {/* Pending Approvals Callout Section */}
          {(pendingGyms.length > 0 || pendingAcademies.length > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-amber-300">
                      Pending Partner Affiliation Applications Awaiting Review
                    </h3>
                    <p className="text-xs text-amber-200/80">
                      New clubs have submitted KYC and onboarding credentials. Approve to publish to national directory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {pendingGyms.map((g) => (
                  <div key={g.id} className="bg-obsidian-950/80 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{g.name}</h4>
                        <p className="text-[11px] text-gray-400">{g.ownerName} • {g.city}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => approveGym(g.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                ))}

                {pendingAcademies.map((a) => (
                  <div key={a.id} className="bg-obsidian-950/80 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{a.name}</h4>
                        <p className="text-[11px] text-gray-400">{a.director} • {a.sport}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => approveAcademy(a.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Ecosystem Hub Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab("gyms")}
              className="bg-obsidian-900/60 border border-white/10 hover:border-gold-500/40 rounded-2xl p-6 transition-all cursor-pointer group"
            >
              <Dumbbell className="w-8 h-8 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-base font-bold text-white mb-1">Gym & Fitness Network</h4>
              <p className="text-xs text-gray-400 mb-4">
                Manage commercial gym affiliations, review tier pricing, trainer counts and public directory listings.
              </p>
              <span className="text-xs text-gold-400 font-semibold flex items-center gap-1">
                Open Gyms Panel <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => setActiveTab("academies")}
              className="bg-obsidian-900/60 border border-white/10 hover:border-gold-500/40 rounded-2xl p-6 transition-all cursor-pointer group"
            >
              <Trophy className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-base font-bold text-white mb-1">Sports Academies & Dojos</h4>
              <p className="text-xs text-gray-400 mb-4">
                Oversee official martial arts, football, cricket, and badminton centers, coach accreditations, and medal tallies.
              </p>
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                Open Academies Panel <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => setActiveTab("moderation")}
              className="bg-obsidian-900/60 border border-white/10 hover:border-gold-500/40 rounded-2xl p-6 transition-all cursor-pointer group"
            >
              <Video className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-base font-bold text-white mb-1">Community Media Moderation</h4>
              <p className="text-xs text-gray-400 mb-4">
                Audit community uploaded technique reels, moderate comments, ensure safety, and feature top creators.
              </p>
              <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                Open Moderation Desk <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GYM PARTNERS */}
      {activeTab === "gyms" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Commercial Gym Partners Directory Control</h2>
              <p className="text-xs text-gray-400">Oversee public listings, suspend inactive clubs, and approve applications</p>
            </div>
            <button
              onClick={() => setView("gym_admin")}
              className="px-4 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 text-xs font-bold hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
            >
              Open Gym Partner Portal View
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-obsidian-900/60 border border-white/10 rounded-2xl p-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search gym by name or city..."
                value={gymSearch}
                onChange={(e) => setGymSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-obsidian-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={gymStatusFilter}
                onChange={(e) => setGymStatusFilter(e.target.value)}
                className="bg-obsidian-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved Only</option>
                <option value="Pending">Pending Review</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-obsidian-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Gym Facility</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">City</th>
                    <th className="py-3.5 px-4 font-semibold">Members</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredGyms.map((gym) => (
                    <tr key={gym.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={gym.image}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-white block">{gym.name}</span>
                            <span className="text-[11px] text-gray-400">Owner: {gym.ownerName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gold-300">{gym.category}</td>
                      <td className="py-3 px-4 text-gray-300">{gym.city}</td>
                      <td className="py-3 px-4 text-white font-semibold">{gym.membersCount || 0}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gym.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : gym.status === "Pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {gym.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {gym.status !== "Approved" && (
                          <button
                            onClick={() => approveGym(gym.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {gym.status === "Approved" && (
                          <button
                            onClick={() => suspendGym(gym.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteGym(gym.id)}
                          className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPORTS ACADEMIES */}
      {activeTab === "academies" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Federation Sports Academies Oversight</h2>
              <p className="text-xs text-gray-400">Accreditations, coaches on roster, Dan gradings, and federation certifications</p>
            </div>
            <button
              onClick={() => setView("academy_admin")}
              className="px-4 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 text-xs font-bold hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
            >
              Open Academy Partner Portal View
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-obsidian-900/60 border border-white/10 rounded-2xl p-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search academy or director..."
                value={acadSearch}
                onChange={(e) => setAcadSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-obsidian-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={acadSportFilter}
                onChange={(e) => setAcadSportFilter(e.target.value)}
                className="bg-obsidian-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
              >
                <option value="All">All Disciplines</option>
                <option value="Martial Arts">Martial Arts / Taekwondo</option>
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Badminton">Badminton</option>
                <option value="Wrestling">Wrestling</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-obsidian-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Academy & Dojo</th>
                    <th className="py-3.5 px-4 font-semibold">Sport Discipline</th>
                    <th className="py-3.5 px-4 font-semibold">Director</th>
                    <th className="py-3.5 px-4 font-semibold">Students</th>
                    <th className="py-3.5 px-4 font-semibold">Medals Won</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAcademies.map((acad) => (
                    <tr key={acad.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={acad.image}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-white block">{acad.name}</span>
                            <span className="text-[11px] text-gray-400">{acad.city}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gold-300">{acad.sport}</td>
                      <td className="py-3 px-4 text-gray-300">{acad.director}</td>
                      <td className="py-3 px-4 text-white font-bold">{acad.studentsCount}</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">🏅 {acad.medalsWon}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acad.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : acad.status === "Pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {acad.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {acad.status !== "Approved" && (
                          <button
                            onClick={() => approveAcademy(acad.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {acad.status === "Approved" && (
                          <button
                            onClick={() => suspendAcademy(acad.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteAcademy(acad.id)}
                          className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEDIA MODERATION */}
      {activeTab === "moderation" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Community Media Content Moderation</h2>
              <p className="text-xs text-gray-400">Audit user-uploaded reels, remove inappropriate content, and enforce guidelines</p>
            </div>
            <button
              onClick={() => setView("media")}
              className="px-4 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 text-xs font-bold hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
            >
              Open Public Media Feed
            </button>
          </div>

          <div className="bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-obsidian-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Clip Title</th>
                    <th className="py-3.5 px-4 font-semibold">Author & Role</th>
                    <th className="py-3.5 px-4 font-semibold">Type</th>
                    <th className="py-3.5 px-4 font-semibold">Likes</th>
                    <th className="py-3.5 px-4 font-semibold">Views</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.mediaUrl}
                            alt=""
                            className="w-12 h-8 rounded-lg object-cover ring-1 ring-white/10 flex-shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-white block max-w-xs truncate">{post.title}</span>
                            <span className="text-[11px] text-gold-400">{post.hashtags.split(" ")[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white block font-medium">{post.authorName}</span>
                        <span className="text-[11px] text-gray-400">{post.authorRole}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-[10px] uppercase font-semibold">
                          {post.mediaType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-red-400 font-bold">❤️ {post.likesCount}</td>
                      <td className="py-3 px-4 text-gray-300">{post.viewsCount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Reel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-white">Federation Unified User Accounts</h2>
            <p className="text-xs text-gray-400">Pre-seeded mock accounts across all 5 federation roles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map((usr) => (
              <div key={usr.id} className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-5 hover:border-gold-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-[10px] font-bold">
                      {usr.role}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {usr.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-0.5">{usr.name}</h3>
                  <p className="text-xs text-gray-400">{usr.email}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-mono">ID: {usr.id}</span>
                  <button
                    onClick={() => {
                      if (usr.role.includes("Player") || usr.role.includes("Coach")) setRole("kalawar_user");
                      else if (usr.role.includes("Gym")) setRole("gym_partner");
                      else if (usr.role.includes("Academy")) setRole("academy_partner");
                      else if (usr.role.includes("Media")) setRole("media_creator");
                      else setRole("super_admin");
                    }}
                    className="text-xs text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1"
                  >
                    Simulate Role <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
