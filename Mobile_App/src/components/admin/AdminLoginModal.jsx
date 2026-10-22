import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Shield, Lock, Mail, Key, X, CheckCircle2, ArrowRight } from "lucide-react";

export default function AdminLoginModal() {
  const { activeModal, closeModal, setRole, setView, showToast } = useApp();

  const [email, setEmail] = useState("admin@kalawar.org");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  if (activeModal !== "admin_login" && activeModal !== "adminLogin") return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setRole("super_admin");
      setView("super_admin");
      closeModal();
      showToast("Super Admin authentication successful! Welcome Federation Overseer.", "success");
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-gold-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-gold-500/10 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeModal}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/10">
          <Shield className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-display font-bold text-white">Kalawar Federation Admin</h3>
          <p className="text-xs text-gray-400 mt-1">
            Access global portal analytics, gym/academy approvals & media moderation
          </p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-3.5 mb-6 text-xs text-gold-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-gold-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Demo Login Enabled
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-300">
            <span>Email: <strong className="text-white">admin@kalawar.org</strong></span>
            <span>Password: <strong className="text-white">admin123</strong></span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-300 block mb-1 font-medium">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1 font-medium">Secret Security Passkey</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-gold-500/20 flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating Master Session..." : "Authorize Super Admin Console"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setRole("super_admin");
              setView("super_admin");
              closeModal();
            }}
            className="text-[11px] text-gray-400 hover:text-gold-400 transition-colors underline"
          >
            Skip password & enter Super Admin as Federation Overseer
          </button>
        </div>
      </div>
    </div>
  );
}
