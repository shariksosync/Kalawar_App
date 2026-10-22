import React from "react";
import { useApp } from "../../context/AppContext";
import {
  ExternalLink,
  Dumbbell,
  Trophy,
  Video,
  ArrowRight,
  Shield,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar
} from "lucide-react";

export default function HomeView() {
  const { setView, openModal, gyms, academies, mediaPosts } = useApp();

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fadeIn">
      {/* 4 Core Federation Pillars Highlight Section */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> All-In-One Sports & Fitness Infrastructure
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Explore the Kalawar Ecosystem
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Connecting championship sports federation administration, premium partner gyms, grassroot academies, and athlete media creation into a single high-performance portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Kalawar Main Site */}
          <a
            href="/kalawar"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-gold-500/30 hover:border-gold-400 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold-500/15"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">Pillar I</span>
              <h3 className="text-xl font-display font-bold text-white mt-1 group-hover:text-gold-300 transition-colors">
                Kalawar Federation
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Official federation portal running full player profiles, championship tournaments, club directories, and e-shop.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>Open Kalawar Portal</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </a>

          {/* Card 2: Gym & Fitness */}
          <div
            onClick={() => setView("gym")}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-white/10 hover:border-gold-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold-500/15 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">Pillar II</span>
              <h3 className="text-xl font-display font-bold text-white mt-1 group-hover:text-gold-300 transition-colors">
                GYM & Fitness
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Filterable directory of certified fitness centers, tier pricing, trainer rosters, and partner onboarding.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>Explore {gyms.length} Partner Gyms</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Sports Academy */}
          <div
            onClick={() => setView("academy")}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-white/10 hover:border-gold-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold-500/15 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Pillar III</span>
              <h3 className="text-xl font-display font-bold text-white mt-1 group-hover:text-gold-300 transition-colors">
                Sports Academy
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Grassroots training academies across Taekwondo, Football, Cricket, Badminton & Olympic wrestling with batch capacity trackers.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>View {academies.length} Academies</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Media */}
          <div
            onClick={() => setView("media")}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-white/10 hover:border-gold-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold-500/15 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Pillar IV</span>
              <h3 className="text-xl font-display font-bold text-white mt-1 group-hover:text-gold-300 transition-colors">
                Athlete Media
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Video reels simulation, mutual follow requests, community comments, and technique breakdown masterclasses.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>Watch Reels & Highlights</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Partner Onboarding CTA Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-gold-500/30 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
              Federation Partnership Program
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-wide">
              Empower Your Facility With Official Kalawar Affiliation
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Gain verified national certification, list in the federation public directory, and access dedicated self-service management panels for members, coaches, batches, and revenues.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => openModal("gym_partner_register")}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 text-obsidian-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 transition-all flex items-center gap-2"
              >
                <Dumbbell className="w-4 h-4" /> + Join as Gym Partner
              </button>
              <button
                onClick={() => openModal("academy_partner_register")}
                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-gold-500/30 hover:border-gold-500 text-gold-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" /> + Register Sports Academy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 space-y-1">
              <div className="text-2xl sm:text-3xl font-display font-bold text-gold-400">100%</div>
              <div className="text-xs font-bold text-white">Self-Service Portals</div>
              <p className="text-[11px] text-gray-400">Dedicated dashboards for gym and academy partners.</p>
            </div>
            <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 space-y-1">
              <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-400">0% DB</div>
              <div className="text-xs font-bold text-white">Zero DB Friction</div>
              <p className="text-[11px] text-gray-400">Smooth client-side mock simulation with local persistence.</p>
            </div>
            <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 space-y-1">
              <div className="text-2xl sm:text-3xl font-display font-bold text-blue-400">Verified</div>
              <div className="text-xs font-bold text-white">Federation Dan Badges</div>
              <p className="text-[11px] text-gray-400">National grading & coach accreditation recognition.</p>
            </div>
            <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 space-y-1">
              <div className="text-2xl sm:text-3xl font-display font-bold text-purple-400">Mutual</div>
              <div className="text-xs font-bold text-white">Athlete Follows</div>
              <p className="text-[11px] text-gray-400">Integrated athletic media & video technique hub.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
