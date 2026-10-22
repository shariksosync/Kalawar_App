import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  Dumbbell,
  Trophy,
  Award,
  Video,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function UnifiedAuthModal() {
  const { activeModal, modalData, closeModal, loginUser } = useApp();

  const [tab, setTab] = useState(modalData?.defaultTab || "signin");
  const [selectedPreset, setSelectedPreset] = useState(modalData?.defaultRole || "gym_partner");

  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("password123");

  const [registerRole, setRegisterRole] = useState("gym_partner");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerFacility, setRegisterFacility] = useState("");
  const [registerPassword, setRegisterPassword] = useState("password123");

  if (activeModal !== "auth_modal" && activeModal !== "authModal" && activeModal !== "signIn") {
    return null;
  }

  const presets = [
    {
      key: "gym_partner",
      title: "Gym Partner Owner",
      name: "Vikram Malhotra",
      facility: "Titan Force Elite Gym",
      email: "vikram@titanforce.in",
      icon: Dumbbell,
      color: "gold"
    },
    {
      key: "academy_partner",
      title: "Sports Academy Director",
      name: "Master Rajesh Sharma",
      facility: "Vanguard Martial Arts Academy",
      email: "rajesh@kalawar.org",
      icon: Trophy,
      color: "blue"
    },
    {
      key: "kalawar_user",
      title: "Kalawar Athlete",
      name: "Arjun Verma (2nd Dan)",
      facility: "National Karate Squad",
      email: "arjun@demo.com",
      icon: Award,
      color: "amber"
    },
    {
      key: "media_creator",
      title: "Media Creator",
      name: "Rohan Kapoor",
      facility: "@rohan_sports_talk",
      email: "rohan@media.org",
      icon: Video,
      color: "purple"
    },
    {
      key: "super_admin",
      title: "Chief Super Admin",
      name: "Federation Overseer",
      facility: "Kalawar HQ",
      email: "admin@kalawar.org",
      icon: Shield,
      color: "red"
    }
  ];

  const handlePresetSelect = (presetKey) => {
    setSelectedPreset(presetKey);
    const p = presets.find((item) => item.key === presetKey);
    if (p) {
      setSignInEmail(p.email);
    }
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    loginUser(selectedPreset);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const custom = {
      name: registerName || "Registered User",
      email: registerEmail || "user@kalawar.org",
      gymName: registerRole === "gym_partner" ? registerFacility : undefined,
      academyName: registerRole === "academy_partner" ? registerFacility : undefined,
      handle: `@${(registerName || "user").toLowerCase().replace(/\s+/g, "")}`
    };
    loginUser(registerRole, custom);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-dark-900 to-dark-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-gold-500/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold mb-3">
            <Sparkles size={13} />
            <span>Unified Federation Single Sign-On</span>
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-white">
            {tab === "signin" ? "Sign In to Your Account" : "Register With Kalawar"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {tab === "signin"
              ? "Access partner admin dashboards, submit technique reels, or manage academy batches seamlessly across the portal."
              : "Create your federation account to join our verified athletic and partner directory."}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-dark-950 border border-white/10 p-1 mb-6">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "signin"
                ? "bg-gold-gradient text-black shadow-md shadow-gold-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In (Existing User)
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "register"
                ? "bg-gold-gradient text-black shadow-md shadow-gold-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* TAB 1: SIGN IN */}
        {tab === "signin" && (
          <form onSubmit={handleSignInSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select 1-Click Demo Account
                </label>
                <span className="text-[10px] text-gold-400">Instant Access</span>
              </div>

              <div className="space-y-2">
                {presets.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPreset === p.key;
                  return (
                    <div
                      key={p.key}
                      onClick={() => handlePresetSelect(p.key)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-gold-500/15 border-gold-500 shadow-md shadow-gold-500/10"
                          : "bg-dark-950/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-gold-500 text-black font-bold" : "bg-dark-800 text-slate-300"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gold-400">
                              {p.title.split(" ")[0]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {p.facility} • <span className="text-slate-300">{p.email}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "border-gold-500 bg-gold-500 text-black" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={13} className="fill-current" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email & Pass Preview */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={signInEmail || presets.find((p) => p.key === selectedPreset)?.email}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gold-gradient text-black font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In to Federation Portal</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "gym_partner", label: "Gym Partner", icon: Dumbbell },
                  { key: "academy_partner", label: "Academy Director", icon: Trophy },
                  { key: "kalawar_user", label: "Athlete / Player", icon: Award },
                  { key: "media_creator", label: "Media Creator", icon: Video }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = registerRole === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setRegisterRole(item.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        isSel
                          ? "bg-gold-500/20 text-gold-300 border-gold-500 shadow-sm"
                          : "bg-dark-950/60 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Full Legal Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. partner@kalawar.org"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Facility / Academy / Handle Name</label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Apex Combat Club"
                  value={registerFacility}
                  onChange={(e) => setRegisterFacility(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Set Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gold-gradient text-black font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>Create Account & Sign In</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
