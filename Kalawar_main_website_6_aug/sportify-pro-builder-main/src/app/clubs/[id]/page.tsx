"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Award,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  QrCode,
  FileText,
  MessageCircle,
  Building,
  Sparkles,
  Trophy,
  CheckCircle2,
  Share2,
  Printer,
  Compass,
  Star,
  Send,
  Loader2,
  Globe,
  Camera,
  X,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { toast } from "sonner";
import type { Player } from "@/data/people";

export default function ClubProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = decodeURIComponent(rawId || "");

  const [club, setClub] = useState<Player | null>(null);
  const [coaches, setCoaches] = useState<Player[]>([]);
  const [athletes, setAthletes] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "coaches" | "timings" | "achievements" | "verify"
  >("overview");

  // Lightbox Photo State
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Enquiry form state
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false);

  useEffect(() => {
    async function loadClubData() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch('/api/clubs/' + encodeURIComponent(id));
        const data = await res.json();
        if (data.success && data.club) {
          setClub(data.club);
          setCoaches(data.coaches || []);
          setAthletes(data.athletes || []);
        }
      } catch (err) {
        console.error("Failed to load club details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClubData();
  }, [id]);

  const totalCoachesCount = useMemo(() => {
    if (!club) return 0;
    const hasHeadCoach = Boolean(club.headCoachName || club.coachName);
    const otherCoaches = coaches.filter(
      (c) => c.name?.toLowerCase() !== (club.headCoachName || club.coachName || "").toLowerCase()
    );
    return (hasHeadCoach ? 1 : 0) + otherCoaches.length;
  }, [club, coaches]);

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      toast.error("Please fill in your name and contact phone number");
      return;
    }

    try {
      setIsSendingEnquiry(true);
      const cleanPhone = enquiryPhone.trim();
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enquiryName.trim(),
          phone: cleanPhone,
          email: enquiryEmail.trim() || (cleanPhone.replace(/[^0-9]/g, "") + "@enquiry.kalawar.org"),
          subject: "Admission Enquiry: " + (club?.name || "Affiliated Academy") + " (" + (club?.id || "") + ")",
          message:
            enquiryMessage.trim() ||
            ("Admission & trial class enquiry submitted for " + (club?.name || "Academy") + ". Contact: " + cleanPhone),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit enquiry");
      }

      toast.success("Enquiry Sent Successfully!", {
        description: "Your admission request for " + (club?.name || "the academy") + " has been recorded. The director will contact you shortly.",
      });
      setEnquiryName("");
      setEnquiryPhone("");
      setEnquiryEmail("");
      setEnquiryMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit admission enquiry. Please try again.");
    } finally {
      setIsSendingEnquiry(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator
          .share({
            title: club?.name || "KALAWAR Affiliated Academy",
            text: "Official profile & verification for " + (club?.name || "Academy"),
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Profile URL copied to clipboard!");
      }
    }
  };

  // Location string without duplicates
  const cleanLocation = useMemo(() => {
    if (!club) return "";
    const rawList = [club.city, club.district, club.state]
      .filter(Boolean)
      .map((s) => s?.trim());
    const uniqueList: string[] = [];
    for (const item of rawList) {
      if (!item) continue;
      if (!uniqueList.some((u) => u.toLowerCase() === item.toLowerCase())) {
        uniqueList.push(item);
      }
    }
    return uniqueList.join(", ");
  }, [club]);

  // Session formatted text
  const sessionText = useMemo(() => {
    if (!club) return "Session 2026-27";
    try {
      const fromY = club.validFrom ? new Date(club.validFrom).getFullYear() : 2026;
      const toY = club.validUntil ? new Date(club.validUntil).getFullYear() : fromY + 1;
      if (isNaN(fromY) || isNaN(toY)) return "Session 2026-27";
      return fromY === toY ? ("Session " + fromY) : ("Session " + fromY + "-" + String(toY).slice(-2));
    } catch {
      return "Session 2026-27";
    }
  }, [club]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Verifying official academy credentials...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!club) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-stone-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Building className="w-16 h-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Academy Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The club or academy profile with identifier "{id}" could not be found or has not yet been approved.
          </p>
          <Link
            href="/clubs"
            className="bg-gold-gradient text-background px-6 py-2.5 rounded-xl text-xs font-bold shadow-gold"
          >
            ← Return to Affiliated Directory
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const logo =
    club.logo ||
    club.image ||
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80";
  const banner =
    club.image ||
    club.logo ||
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1600&q=80";
  const headCoach = club.headCoachName || club.coachName || "Grandmaster / Sensei";
  const disciplinesList =
    club.disciplines && club.disciplines.length > 0
      ? club.disciplines
      : [club.discipline || "Martial Arts"];
  const facilitiesList =
    club.facilities && club.facilities.length > 0
      ? club.facilities
      : [
          "Federation Approved Combat Tatami Mats",
          "Electronic Scoring PSS Arena",
          "Strength & Conditioning Gym",
          "First-Aid & Sports Medicine Station",
        ];
  const achievementsList =
    club.achievements && club.achievements.length > 0
      ? club.achievements
      : [
          "Officially Affiliated with KALAWAR National Federation",
          "Authorized Belt Grading & Certificate Examination Center",
          "Active Delegation in State & National Championships",
        ];
  const batchesList =
    club.batches && club.batches.length > 0
      ? club.batches
      : [
          { name: "Cadet / Junior Batch", time: "05:00 PM - 06:30 PM (Ages 6-14)" },
          { name: "Senior Competitors", time: "06:30 PM - 08:30 PM (Ages 15+)" },
          { name: "Morning Sparring", time: "06:00 AM - 08:00 AM (Elite squad)" },
        ];

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(
    currentUrl || ("https://kalawar.org/clubs/" + club.id)
  );

  return (
    <SiteLayout>
      <div className="bg-stone-950 min-h-screen text-stone-200">
        {/* 1. Hero Billboard */}
        <div className="relative pt-24 sm:pt-28 pb-8 sm:pb-12 overflow-hidden border-b border-gold-500/20 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <img src={banner} alt={club.name} className="w-full h-full object-cover blur-sm" />
          </div>

          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 space-y-4 sm:space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-stone-400 overflow-x-auto pb-1">
              <Link href="/clubs" className="hover:text-amber-300 transition-colors shrink-0">
                Affiliated Directory
              </Link>
              <span>/</span>
              <span className="text-stone-300 shrink-0">{club.state}</span>
              <span>/</span>
              <span className="text-amber-400 font-semibold truncate">{club.name}</span>
            </div>

            {/* Billboard Profile Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-gold-500/40 bg-stone-900 p-1 sm:p-1.5 shrink-0 shadow-2xl shadow-gold-500/20">
                  <img src={logo} alt={club.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                </div>

                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {club.id}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      APPROVED &amp; ACTIVE
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-stone-900 text-stone-300 border border-stone-800">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                      Valid {sessionText}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                    {club.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{cleanLocation}</span>
                  </p>
                </div>
              </div>

              {/* Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <div className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider select-none shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>Certified</span>
                </div>

                {club.phone && (
                  <a
                    href={"tel:" + club.phone.replace(/[^0-9+]/g, "")}
                    className="p-2.5 sm:p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors"
                    title="Call Academy"
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </a>
                )}

                <button
                  onClick={handleShare}
                  className="p-2.5 sm:p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Share Profile"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* 2. Navigation Tab Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-stone-800/80 overflow-x-auto pb-1.5 scrollbar-none">
              {[
                { key: "overview", label: "Overview & Facility" },
                { key: "coaches", label: "Certified Coaches (" + totalCoachesCount + ")" },
                { key: "timings", label: "Disciplines & Timings" },
                { key: "achievements", label: "Achievements & Gallery" },
                { key: "verify", label: "QR Spot Verification" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={"px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer " + (
                      isActive
                        ? "bg-gold-gradient text-background shadow-gold"
                        : "bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Tab Contents */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* About */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>About the Academy</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                      {club.bio ||
                        (club.name + " is an officially accredited martial arts institution affiliated with KALAWAR Sports & Martial Arts Federation of India. The academy is committed to providing elite-level combat training, youth physical conditioning, Dan belt examinations, and competitive sports mastery in " + club.state + ".")}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-800/80">
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Founded In
                        </p>
                        <p className="text-base font-extrabold text-white mt-0.5">
                          {club.yearFounded || "2020"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Active Members
                        </p>
                        <p className="text-base font-extrabold text-amber-400 mt-0.5">
                          {club.memberCount || "150"}+ Athletes
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 col-span-2 sm:col-span-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Federation Seal
                        </p>
                        <p className="text-xs font-bold text-emerald-400 mt-1">Official Affiliate</p>
                      </div>
                    </div>
                  </div>

                  {/* Facility & Location */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-amber-400" />
                      <span>Facility Infrastructure &amp; Location</span>
                    </h2>

                    <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        Registered Dojo Facility Address:
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                        {club.registeredAddress ||
                          club.address ||
                          "Main Sports Complex, Federation Wing"}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <a
                          href={"https://maps.google.com/?q=" + encodeURIComponent(
                            club.name + " " + (club.registeredAddress || club.address || club.state)
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-amber-400 hover:text-white transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Open Google Maps Directions ↗</span>
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Academy Amenities &amp; Equipment:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {facilitiesList.map((fac) => (
                          <div
                            key={fac}
                            className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center gap-2.5 text-xs text-stone-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{fac}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CERTIFIED COACHES */}
              {activeTab === "coaches" && (
                <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>Certified Coaches &amp; Instructors</span>
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Federation accredited black belt instructors supervising daily training and technical gradings
                    </p>
                  </div>

                  {/* Chief Coach Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-gold-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Award className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-400 text-stone-950">
                          Head Coach
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-1">{headCoach}</h3>
                        <p className="text-xs text-stone-400">
                          Head Instructor &amp; Examination Officer
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      ✓ License Verified
                    </span>
                  </div>

                  {/* Other Coaches Grid */}
                  {coaches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coaches.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-gold-500/40 transition-colors flex items-center gap-3.5"
                        >
                          <div className="w-12 h-12 rounded-xl bg-stone-900 overflow-hidden border border-stone-800 shrink-0">
                            <img
                              src={
                                c.image ||
                                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80"
                              }
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                            <p className="text-[11px] text-amber-400 font-mono truncate">{c.id}</p>
                            <p className="text-[11px] text-stone-400 truncate">
                              {c.discipline || "Martial Arts"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-stone-950 border border-stone-800/80 text-xs text-stone-400 space-y-1">
                      <p className="font-semibold text-stone-300">
                        Primary coaching is conducted by Head Coach {headCoach}.
                      </p>
                      <p className="text-[11px]">
                        Assistant black belts and trainers are registered through the national coach accreditation portal.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DISCIPLINES & TIMINGS */}
              {activeTab === "timings" && (
                <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Weekly Batch Schedule</span>
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Training programs, age brackets, and regular practice hours
                    </p>
                  </div>

                  {/* Schedule Card */}
                  <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Official Training Timings:
                    </p>
                    <p className="text-sm font-semibold text-stone-200">
                      {club.timings ||
                        "Mon - Sat: 06:00 AM - 09:30 AM (Morning) & 05:00 PM - 09:00 PM (Evening)"}
                    </p>

                    {batchesList.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-stone-800/80 text-xs">
                        {batchesList.map((b, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-1">
                            <p className="font-bold text-white">{b.name}</p>
                            <p className="text-stone-400 text-[11px] leading-relaxed">{b.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ACHIEVEMENTS & GALLERY */}
              {activeTab === "achievements" && (
                <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>Academy Honors &amp; Gallery</span>
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Tournament titles, state championship triumphs, and dojo training moments
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {achievementsList.map((ach, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center gap-3"
                      >
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-stone-200">{ach}</span>
                      </div>
                    ))}
                  </div>

                  {club.photos && club.photos.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-stone-800/80">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Dojo Action Photos:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {club.photos.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxPhoto(p)}
                            className="aspect-video rounded-2xl overflow-hidden border border-stone-800 hover:border-gold-500/50 transition-all cursor-pointer group"
                          >
                            <img
                              src={p}
                              alt="Dojo activity"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: QR SPOT VERIFICATION */}
              {activeTab === "verify" && (
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-gold-500/40 space-y-6 shadow-2xl">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-4 bg-white rounded-3xl shrink-0 shadow-2xl">
                      <img src={qrUrl} alt="QR Verification" className="w-44 h-44 object-contain" />
                    </div>

                    <div className="space-y-3 text-center sm:text-left">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-stone-950">
                        <QrCode className="w-3.5 h-3.5" />
                        Official QR Field Verification
                      </span>
                      <h3 className="text-xl font-black text-white">
                        Scan to Verify Academy Affiliation
                      </h3>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        Scan this dynamic QR code using any smartphone camera or QR reader to authenticate this dojo's active registration status with KALAWAR National Federation.
                      </p>
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 select-none">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Certified &amp; Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Quick Contact & Enquiry Form */}
            <div className="lg:col-span-4 space-y-6">
              {/* Official Credentials Summary */}
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-gold-500/30 space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Affiliation Details</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                    <span className="text-stone-400">Affiliation ID:</span>
                    <span className="font-mono font-bold text-amber-300">{club.id}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                    <span className="text-stone-400">Certificate Ref:</span>
                    <span className="font-mono font-bold text-stone-200">
                      {club.affiliationCertificateId || ("KAC-AFF-2026-" + club.id.slice(-3))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                    <span className="text-stone-400">State Association:</span>
                    <span className="font-bold text-white">{club.state}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                    <span className="text-stone-400">Validity Period:</span>
                    <span className="font-bold text-emerald-400">{sessionText}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Verification Seal:</span>
                    <span className="font-extrabold text-emerald-400">✓ Verified</span>
                  </div>
                </div>

                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl py-2.5 px-3 text-center flex items-center justify-center gap-2 select-none">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                    Certified
                  </span>
                </div>
              </div>

              {/* Direct Enquiry Box */}
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  <span>Academy Enquiry &amp; Admission</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Interested in martial arts training or batch admissions? Send a direct enquiry to the academy chief instructor.
                </p>

                <form onSubmit={handleSendEnquiry} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      required
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Mobile Phone Number *"
                      required
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={enquiryEmail}
                      onChange={(e) => setEnquiryEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      placeholder="Your message, training goals, or child's age..."
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEnquiry}
                    className="w-full bg-gold-gradient text-background py-3 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingEnquiry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                </form>

                {club.phone && (
                  <div className="pt-2 text-center">
                    <a
                      href={"https://wa.me/" + club.phone.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(
                        "Hello, I am interested in joining " + club.name + " under KALAWAR Federation."
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp directly</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Photo Lightbox Modal */}
        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxPhoto(null)}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-gold-500/40">
                <img
                  src={lightboxPhoto}
                  alt="Dojo photo large preview"
                  className="w-full h-full object-contain max-h-[85vh]"
                />
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SiteLayout>
  );
}
