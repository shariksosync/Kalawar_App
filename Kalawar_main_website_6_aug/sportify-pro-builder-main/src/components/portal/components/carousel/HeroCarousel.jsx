import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { ChevronLeft, ChevronRight, Award, Dumbbell, Trophy, Video, ExternalLink, ArrowRight } from "lucide-react";

export default function HeroCarousel() {
  const { setView, openModal, showToast } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = 5;
  const slideDuration = 5500; // 5.5s

  const slides = [
    { id: 0, title: "Interactive Hub" },
    {
      id: 1,
      tag: "National Dan Grading & Accreditation",
      headline: "Master the Art of Discipline & Honor.",
      paragraph: "Official national martial arts Dan rank evaluations, certified coach licenses, verified black belt records, and national championship rankings.",
      bg: "/assets/banners/slide1.png",
      ctaPrimary: "Explore Kalawar Portal",
      ctaPrimaryAction: () => {
        window.location.href = "/kalawar";
        showToast("Opening Kalawar National Federation Website...", "info");
      },
      ctaSecondary: "View Academies",
      ctaSecondaryAction: () => setView("academy"),
    },
    {
      id: 2,
      tag: "Connected Smart Fitness Ecosystem",
      headline: "State-of-the-Art Strength & Conditioning.",
      paragraph: "From Olympic lifting platforms and calibrated steel plates to professional MMA octagons. Partner gyms manage memberships, staff, and recurring revenue seamlessly.",
      bg: "/assets/banners/slide2.png",
      ctaPrimary: "Explore Gyms",
      ctaPrimaryAction: () => setView("gym"),
      ctaSecondary: "Join as Gym Partner",
      ctaSecondaryAction: () => openModal("gymPartner"),
    },
    {
      id: 3,
      tag: "Grassroots to Olympic Podium",
      headline: "Nurturing India's Future Champions.",
      paragraph: "Multi-discipline youth training centers across Karate, Taekwondo, Badminton, Cricket, and Football with professional coaches and structured batch programs.",
      bg: "/assets/banners/slide3.png",
      ctaPrimary: "Browse Academies",
      ctaPrimaryAction: () => setView("academy"),
      ctaSecondary: "Register Academy",
      ctaSecondaryAction: () => openModal("academyPartner"),
    },
    {
      id: 4,
      tag: "Athletic Creator & Reels Network",
      headline: "Share Your Technique. Inspire The Nation.",
      paragraph: "Connect with athletes, martial artists, and strength coaches. Send mutual follow requests, stream competition replays, and upload training breakdowns.",
      bg: "/assets/banners/slide1.png",
      ctaPrimary: "Enter Media Hub",
      ctaPrimaryAction: () => setView("media"),
      ctaSecondary: "Upload Reel",
      ctaSecondaryAction: () => openModal("mediaUpload"),
    },
  ];

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, slideDuration);
    return () => clearInterval(interval);
  }, [isPaused, currentSlide]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-[600px] overflow-hidden bg-black flex items-center select-none"
    >
      {/* Background Slides */}
      {slides.map((s, idx) => {
        const isActive = idx === currentSlide;
        return (
          <div
            key={s.id}
            style={{
              backgroundImage: `url(${s.bg || "/assets/banners/slide1.png"})`,
            }}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out ${
              isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none"
            }`}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/90 to-dark-950"></div>
          </div>
        );
      })}

      {/* Slide Content Layer */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentSlide === 0 ? (
          /* SLIDE 1: THE 4 INTERACTIVE PORTAL BOXES HUB */
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 px-3 py-1 rounded-full text-gold-400 font-bold text-xs uppercase tracking-wider mb-4 animate-[fadeIn_0.5s_ease-out]">
              ★ Unified Sports & Martial Arts Portal ★
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
              One Federation. <span className="gold-gradient-text">Infinite Excellence.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
              Explore certified martial arts credentials, high-performance gyms, elite sports academies, and our dynamic athlete media network.
            </p>

            {/* The 4 Boxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Box 1: Kalawar */}
              <div
                id="box-kalawar"
                onClick={() => {
                  window.location.href = "/kalawar";
                  showToast("Opening Kalawar National Federation Website...", "info");
                }}
                className="bg-dark-850/80 backdrop-blur-xl border border-white/10 hover:border-gold-500 rounded-2xl p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-4 group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-black transition-all">
                    <Award size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-gold-400 transition-colors">
                    Kalawar
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    National martial arts federation portal, Dan grading certifications, black belt records, referee accreditation, and championship rankings.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded">
                    Federation
                  </span>
                  <span className="font-heading font-bold text-xs text-gold-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Site</span>
                    <ExternalLink size={12} />
                  </span>
                </div>
              </div>

              {/* Box 2: GYM & Fitness */}
              <div
                id="box-gym"
                onClick={() => setView("gym")}
                className="bg-dark-850/80 backdrop-blur-xl border border-white/10 hover:border-sky-400 rounded-2xl p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-black transition-all">
                    <Dumbbell size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-sky-400 transition-colors">
                    GYM & Fitness
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Certified fitness clubs, strength arenas, combat gyms, and CrossFit boxes. Onboard your fitness center as a partner to access your own admin panel.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">
                    Clubs Hub
                  </span>
                  <span className="font-heading font-bold text-xs text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore & Admin</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Box 3: Sports Academy */}
              <div
                id="box-academy"
                onClick={() => setView("academy")}
                className="bg-dark-850/80 backdrop-blur-xl border border-white/10 hover:border-emerald-400 rounded-2xl p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Trophy size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    Sports Academy
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Multi-sport coaching academies for Martial Arts, Badminton, Cricket, and Football. Register your academy to manage batches, coaches, and student rosters.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    Academy Hub
                  </span>
                  <span className="font-heading font-bold text-xs text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View & Admin</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Box 4: Media */}
              <div
                id="box-media"
                onClick={() => setView("media")}
                className="bg-dark-850/80 backdrop-blur-xl border border-white/10 hover:border-gold-500 rounded-2xl p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-4 group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-black transition-all">
                    <Video size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-gold-400 transition-colors">
                    Media
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Instagram-style sports streaming network. Stream reels, send mutual follow requests, like, comment, and upload your competition highlights.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded">
                    Social Stream
                  </span>
                  <span className="font-heading font-bold text-xs text-gold-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Watch & Follow</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SLIDES 2 - 5: CONTENT SHOWCASE */
          <div className="max-w-2xl text-left animate-[fadeIn_0.5s_ease-out]">
            <span className="inline-block bg-gold-500/15 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              {slides[currentSlide].tag}
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-white mb-4 leading-tight">
              {slides[currentSlide].headline}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              {slides[currentSlide].paragraph}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={slides[currentSlide].ctaPrimaryAction}
                className="bg-gold-gradient text-black font-heading font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 transition-all"
              >
                {slides[currentSlide].ctaPrimary}
              </button>
              <button
                onClick={slides[currentSlide].ctaSecondaryAction}
                className="bg-dark-800 text-white font-heading font-semibold text-sm px-6 py-3 rounded-xl border border-white/10 hover:border-gold-500 hover:text-gold-400 transition-all"
              >
                {slides[currentSlide].ctaSecondary}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chevrons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 z-30 w-11 h-11 rounded-full bg-dark-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-gold-500 hover:text-black flex items-center justify-center transition-all duration-200"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 z-30 w-11 h-11 rounded-full bg-dark-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-gold-500 hover:text-black flex items-center justify-center transition-all duration-200"
        aria-label="Next Slide"
      >
        <ChevronRight size={22} />
      </button>

      {/* Indicator Pills */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? "w-8 bg-gold-500 shadow-[0_0_8px_#f0b90b]" : "w-2.5 bg-white/30"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
