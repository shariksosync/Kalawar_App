import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Menu, X, ExternalLink, Shield, LogIn, LogOut } from "lucide-react";
import UserMenuDropdown from "./UserMenuDropdown";

export default function Navbar() {
  const { activeView, setView, currentUser, showToast, openModal, logoutUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", view: "home" },
    { name: "Kalawar", view: "kalawar", external: true },
    { name: "GYM & Fitness", view: "gym" },
    { name: "Sports Academy", view: "academy" },
    { name: "Media", view: "media" },
  ];

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    if (item.external || item.view === "kalawar") {
      window.location.href = "/kalawar";
      return;
    }
    setView(item.view);
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-dark-950/85 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setView("home")}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <img
            src="/assets/logo.png"
            alt="Kalawar Logo"
            className="h-12 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(240,185,11,0.4)] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-xl tracking-wider text-white">
              KALAWAR
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-gold-500">
              Sports & Martial Arts Federation
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`px-4 py-2 rounded-lg font-heading font-semibold text-sm transition-all duration-200 relative flex items-center gap-1.5 ${
                  isActive
                    ? "text-white bg-gold-500/15 border border-gold-500/40"
                    : "text-slate-300 hover:text-gold-400 hover:bg-gold-500/10"
                }`}
              >
                <span>{item.name}</span>
                {item.external && <ExternalLink size={13} className="text-gold-400 opacity-80" />}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gold-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Pill / Dropdown & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {currentUser && currentUser.isRegistered ? (
            <UserMenuDropdown />
          ) : (
            <button
              onClick={() => openModal("auth_modal", { defaultTab: "signin" })}
              className="hidden sm:flex items-center gap-1.5 bg-dark-850 hover:bg-dark-800 text-slate-200 border border-gold-500/40 hover:border-gold-500 hover:text-gold-400 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-dark-850 border border-white/10"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-gold-500/30 px-5 py-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={`text-left px-4 py-2.5 rounded-lg font-heading font-semibold text-sm flex items-center justify-between ${
                activeView === item.view
                  ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                  : "text-slate-300 hover:bg-dark-800 hover:text-white"
              }`}
            >
              <span>{item.name}</span>
              {item.external && <ExternalLink size={14} className="text-gold-400" />}
            </button>
          ))}
          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            {currentUser && currentUser.isRegistered ? (
              <>
                <span>Signed in: <strong className="text-white">{currentUser.name}</strong></span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logoutUser();
                  }}
                  className="text-red-400 font-bold hover:underline"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <span>Browsing as Guest</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openModal("auth_modal", { defaultTab: "signin" });
                  }}
                  className="text-gold-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
