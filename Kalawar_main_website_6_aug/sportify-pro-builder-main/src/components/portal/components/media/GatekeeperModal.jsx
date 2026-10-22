import React from "react";
import { useApp } from "../../context/AppContext";
import { ShieldAlert, UserCheck, Sparkles, X, ArrowRight } from "lucide-react";

export default function GatekeeperModal() {
  const { activeModal, modalData, closeModal, setRole } = useApp();

  if (activeModal !== "gatekeeper") return null;

  const actionText = modalData?.action || "interact with the community";

  const handleSelectRole = (roleKey) => {
    setRole(roleKey);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-gold-500/10 text-center overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
          Federation Profile Required
        </h3>

        <p className="text-sm text-gray-300 mb-6 max-w-sm mx-auto leading-relaxed">
          You are currently in <span className="text-gold-400 font-semibold">Guest Explorer</span> mode. To {actionText}, please choose a verified profile below:
        </p>

        <div className="space-y-3 text-left">
          <button
            onClick={() => handleSelectRole("kalawar_user")}
            className="w-full p-4 rounded-2xl bg-obsidian-800/80 hover:bg-gold-500/10 border border-white/10 hover:border-gold-500/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
                🥋
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                  Continue as Kalawar Athlete
                </h4>
                <p className="text-xs text-gray-400">Arjun Verma (2nd Dan Black Belt)</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => handleSelectRole("media_creator")}
            className="w-full p-4 rounded-2xl bg-obsidian-800/80 hover:bg-gold-500/10 border border-white/10 hover:border-gold-500/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                🎙️
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                  Continue as Media Creator
                </h4>
                <p className="text-xs text-gray-400">Rohan Kapoor (@rohan_sports_talk)</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => handleSelectRole("gym_partner")}
            className="w-full p-4 rounded-2xl bg-obsidian-800/80 hover:bg-gold-500/10 border border-white/10 hover:border-gold-500/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                🏋️
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors">
                  Continue as Partner Gym
                </h4>
                <p className="text-xs text-gray-400">Titan Force Elite Club Admin</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <p className="text-[11px] text-gray-500 mt-6">
          * This is a 100% simulated mock session. Switching roles takes effect instantly across all federation modules.
        </p>
      </div>
    </div>
  );
}
