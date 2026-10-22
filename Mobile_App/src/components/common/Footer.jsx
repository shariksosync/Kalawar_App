import React from "react";
import { useApp } from "../../context/AppContext";
import { Shield, ArrowRight, ExternalLink } from "lucide-react";

export default function Footer() {
  const { setView, openModal, currentUser } = useApp();

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (currentUser.role === "super_admin") {
      setView("super_admin");
    } else {
      openModal("adminLogin");
    }
  };

  return (
    <footer className="bg-[#050608] border-t border-white/10 pt-16 pb-8 mt-24 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="Kalawar Logo" className="h-10 w-auto" />
              <div>
                <div className="font-heading font-extrabold text-lg text-white">KALAWAR</div>
                <div className="text-[10px] text-gold-500 font-semibold tracking-wider">
                  Sports Federation
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official national sports authority dedicated to martial arts accreditation, black belt Dan grading, high-performance fitness hubs, and athletic community excellence.
            </p>
            <div className="text-xs space-y-1 text-slate-400">
              <p>📞 +91 70833 14435</p>
              <p>✉️ kalawarmartialartsindia@gmail.com</p>
            </div>
          </div>

          {/* Col 2: Modules */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4 relative inline-block after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-6 after:h-0.5 after:bg-gold-500">
              Ecosystem Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setView("home")} className="hover:text-gold-400 transition-colors">
                  Home Portal Hub
                </button>
              </li>
              <li>
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold-400 transition-colors flex items-center gap-1"
                >
                  <span>Kalawar Main Website</span>
                  <ExternalLink size={11} className="text-gold-500" />
                </a>
              </li>
              <li>
                <button onClick={() => setView("gym")} className="hover:text-gold-400 transition-colors">
                  GYM & Fitness Clubs
                </button>
              </li>
              <li>
                <button onClick={() => setView("academy")} className="hover:text-gold-400 transition-colors">
                  Sports Academy Roster
                </button>
              </li>
              <li>
                <button onClick={() => setView("media")} className="hover:text-gold-400 transition-colors">
                  Media Social Streaming
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Partner Portals */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4 relative inline-block after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-6 after:h-0.5 after:bg-gold-500">
              Partner Admin Hubs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => openModal("gymPartner")} className="hover:text-gold-400 transition-colors text-left">
                  Join as Gym Partner
                </button>
              </li>
              <li>
                <button onClick={() => openModal("academyPartner")} className="hover:text-gold-400 transition-colors text-left">
                  Register Sports Academy
                </button>
              </li>
              <li>
                <button onClick={() => setView("gym_admin")} className="hover:text-gold-400 transition-colors text-left">
                  Gym Partner Admin Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setView("academy_admin")} className="hover:text-gold-400 transition-colors text-left">
                  Academy Partner Admin Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Prominent Admin Redirect Card */}
          <div>
            <div className="bg-dark-850 border border-gold-500/40 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-black/50 group hover:border-gold-500 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold-gradient"></div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-gold-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded">
                  Governance
                </span>
              </div>
              <h5 className="font-heading font-bold text-white text-sm mb-1.5">
                Federation Admin Portal
              </h5>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                Executive control console to manage partner approvals, verify academies, moderate media streams, and inspect ecosystem analytics.
              </p>
              <button
                id="footer-admin-link"
                onClick={handleAdminClick}
                className="w-full bg-gold-gradient text-black font-heading font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_16px_rgba(240,185,11,0.4)] transition-all"
              >
                <span>Open Admin Portal</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © 2026 KALAWAR Sports & Martial Arts Federation of India. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdminClick}
              className="text-gold-400 hover:text-white font-semibold transition-colors flex items-center gap-1"
            >
              <Shield size={13} />
              <span>Administrative Portal Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
