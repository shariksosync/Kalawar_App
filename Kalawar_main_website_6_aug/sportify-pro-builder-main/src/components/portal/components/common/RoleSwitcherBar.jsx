import React from "react";
import { useApp } from "../../context/AppContext";
import { UserCheck, Shield, Dumbbell, Award, Video, Eye } from "lucide-react";

export default function RoleSwitcherBar() {
  const { currentUser, setRole } = useApp();

  const roles = [
    { key: "anonymous", label: "Anonymous (Guest)", icon: Eye },
    { key: "kalawar_user", label: "Kalawar Athlete", icon: Award },
    { key: "gym_partner", label: "Gym Partner", icon: Dumbbell },
    { key: "academy_partner", label: "Academy Partner", icon: UserCheck },
    { key: "media_creator", label: "Media Creator", icon: Video },
    { key: "super_admin", label: "Super Admin", icon: Shield },
  ];

  return (
    <aside aria-label="Demo role selector" className="bg-[#060709] border-b border-gold-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 relative z-50">
      <div className="flex items-center gap-2.5 text-slate-400">
        <span className="font-semibold text-slate-300">Demo Role:</span>
        <span className="bg-gold-500/10 text-gold-400 border border-gold-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px]">
          {currentUser.badge}
        </span>
        <span className="text-slate-500 hidden md:inline">(Click any profile to test permissions)</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentUser.role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gold-gradient text-black font-bold shadow-[0_0_12px_rgba(240,185,11,0.4)]"
                  : "bg-dark-700 text-slate-400 hover:text-slate-100 hover:bg-dark-600 border border-white/5"
              }`}
            >
              <Icon size={13} />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
