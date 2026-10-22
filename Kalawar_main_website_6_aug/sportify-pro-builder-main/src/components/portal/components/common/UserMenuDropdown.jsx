import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  User,
  ChevronDown,
  Shield,
  Dumbbell,
  Trophy,
  Video,
  LogOut,
  ExternalLink,
  Award,
  Settings,
  Sparkles,
  Building,
  CheckCircle2
} from "lucide-react";

export default function UserMenuDropdown({ compact = false }) {
  const { currentUser, setView, logoutUser, setRole, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser || !currentUser.isRegistered) return null;

  const handleAdminPanelNavigation = () => {
    setIsOpen(false);
    if (currentUser.role === "gym_partner") {
      setView("gym_admin");
      showToast(`Navigated to Gym Partner Admin: ${currentUser.gymName || "Titan Force"}`, "info");
    } else if (currentUser.role === "academy_partner") {
      setView("academy_admin");
      showToast(`Navigated to Academy Partner Admin: ${currentUser.academyName || "Vanguard Academy"}`, "info");
    } else if (currentUser.role === "super_admin") {
      setView("super_admin");
      showToast("Navigated to Super Admin Headquarters Console", "info");
    } else {
      setView("media");
      showToast("Navigated to Media & Athlete Community Hub", "info");
    }
  };

  const handleRoleSwitch = (roleKey) => {
    setRole(roleKey);
    setIsOpen(false);
  };

  const getAdminLabel = () => {
    if (currentUser.role === "gym_partner") return "Open Gym Partner Admin Panel";
    if (currentUser.role === "academy_partner") return "Open Academy Partner Admin Panel";
    if (currentUser.role === "super_admin") return "Open Super Admin Console";
    return "Partner / Creator Studio";
  };

  const getAdminIcon = () => {
    if (currentUser.role === "gym_partner") return Dumbbell;
    if (currentUser.role === "academy_partner") return Trophy;
    if (currentUser.role === "super_admin") return Shield;
    return Sparkles;
  };

  const AdminIcon = getAdminIcon();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-dark-850 hover:bg-dark-800 border border-gold-500/40 hover:border-gold-500 p-1.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg transition-all text-left group"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <img
            src={currentUser.avatar || "/assets/logo.png"}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-gold-500/50"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-dark-950" />
        </div>

        {!compact && (
          <div className="hidden sm:block min-w-0 pr-1">
            <div className="text-xs font-bold text-white truncate max-w-[130px] group-hover:text-gold-300 transition-colors">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-gold-400 font-semibold truncate max-w-[130px]">
              {currentUser.badge}
            </div>
          </div>
        )}

        <ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-gold-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-gold-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-gradient-to-b from-dark-900 to-dark-950 border border-gold-500/30 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
          {/* Header Profile Info */}
          <div className="p-4 border-b border-white/10 bg-dark-850/60">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || "/assets/logo.png"}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gold-500/40 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-400 truncate">{currentUser.handle || "@kalawar"}</p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  {currentUser.badge}
                </div>
              </div>
            </div>

            {/* Facility details if partner */}
            {(currentUser.gymName || currentUser.academyName) && (
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2 text-xs text-slate-300">
                <Building size={14} className="text-gold-400 flex-shrink-0" />
                <span className="truncate font-medium">
                  {currentUser.gymName || currentUser.academyName}
                </span>
              </div>
            )}
          </div>

          {/* Primary Action: Admin Panel */}
          <div className="p-2 border-b border-white/10">
            <button
              onClick={handleAdminPanelNavigation}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gold-500/15 via-gold-500/10 to-transparent hover:from-gold-500/25 border border-gold-500/30 hover:border-gold-500/60 text-gold-300 font-bold text-xs transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gold-500 text-black flex items-center justify-center font-bold shadow-md shadow-gold-500/20">
                  <AdminIcon size={16} />
                </div>
                <span>{getAdminLabel()}</span>
              </div>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform text-gold-400" />
            </button>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="p-3 border-b border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Role Simulation
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleRoleSwitch("gym_partner")}
                className={`p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 ${
                  currentUser.role === "gym_partner"
                    ? "bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40"
                    : "hover:bg-dark-800 text-slate-300"
                }`}
              >
                <Dumbbell size={13} className="text-gold-400 flex-shrink-0" />
                <span className="truncate">Gym Partner</span>
              </button>

              <button
                onClick={() => handleRoleSwitch("academy_partner")}
                className={`p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 ${
                  currentUser.role === "academy_partner"
                    ? "bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40"
                    : "hover:bg-dark-800 text-slate-300"
                }`}
              >
                <Trophy size={13} className="text-blue-400 flex-shrink-0" />
                <span className="truncate">Academy Dir</span>
              </button>

              <button
                onClick={() => handleRoleSwitch("kalawar_user")}
                className={`p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 ${
                  currentUser.role === "kalawar_user"
                    ? "bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40"
                    : "hover:bg-dark-800 text-slate-300"
                }`}
              >
                <Award size={13} className="text-amber-400 flex-shrink-0" />
                <span className="truncate">Athlete</span>
              </button>

              <button
                onClick={() => handleRoleSwitch("super_admin")}
                className={`p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 ${
                  currentUser.role === "super_admin"
                    ? "bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40"
                    : "hover:bg-dark-800 text-slate-300"
                }`}
              >
                <Shield size={13} className="text-red-400 flex-shrink-0" />
                <span className="truncate">Super Admin</span>
              </button>
            </div>
          </div>

          {/* Logout Action */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                logoutUser();
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={15} />
              <span>Sign Out to Guest Mode</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
