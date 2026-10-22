"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Award,
  Calendar,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Download,
  BookOpen,
  Filter,
  Check,
  Share2,
  Printer,
  ArrowLeft,
  RefreshCw,
  Building,
  FileCheck,
  X,
  ExternalLink,
  Lock,
  KeyRound,
  Smartphone,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { states } from "@/data/people";
import { IMAGES } from "@/data/images";
import {
  STANDARD_BELT_LEVELS,
  type BeltLevel,
  type BeltExamSession,
  type ExamCandidate,
} from "@/data/belt-exams";
import { downloadAdmitCardPDF } from "@/lib/admit-card-pdf";
import { downloadBeltDiplomaPDF, printBeltDiplomaPDF, downloadBeltRegistrationSlipPDF, printBeltRegistrationSlipPDF } from "@/lib/belt-pdf-download";
import { cn, formatToDDMMYYYY, formatMemberType } from "@/lib/utils";

function normalizeDateToYYYYMMDD(val: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, "0");
    const month = ddmmyyyyMatch[2].padStart(2, "0");
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return trimmed;
}

export default function BeltExamsPage() {
  const [activeTab, setActiveTab] = useState<"syllabus" | "schedule" | "register" | "results">("syllabus");
  const [beltLevels, setBeltLevels] = useState<BeltLevel[]>(STANDARD_BELT_LEVELS);
  const [selectedBelt, setSelectedBelt] = useState<BeltLevel>(STANDARD_BELT_LEVELS[0]); // Default Yellow Belt
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [exams, setExams] = useState<BeltExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for schedule
  const [stateFilter, setStateFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Registration Form State
  const [selectedExamForReg, setSelectedExamForReg] = useState<BeltExamSession | null>(null);
  const [regAthleteName, setRegAthleteName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female" | "Other">("Male");
  const [regAcademyName, setRegAcademyName] = useState("");
  const [regClubName, setRegClubName] = useState("");
  const [regState, setRegState] = useState("Maharashtra");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification State for Belt Exams
  const [regOtpCode, setRegOtpCode] = useState("");
  const [regTempToken, setRegTempToken] = useState("");
  const [isSendingRegOtp, setIsSendingRegOtp] = useState(false);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCountdown, setRegOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (regOtpCountdown > 0) {
      timer = setInterval(() => {
        setRegOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [regOtpCountdown]);

  const [regCurrentBelt, setRegCurrentBelt] = useState("White Belt");
  const [regTargetBelt, setRegTargetBelt] = useState("Yellow Belt");
  const [regMedicalAgreed, setRegMedicalAgreed] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [registeredCandidate, setRegisteredCandidate] = useState<ExamCandidate | null>(null);

  const { user, token, isAuthenticated, setUser, getAuthHeaders } = useAuth();

  // Registration Slip Modal
  const [showRegSlipModal, setShowRegSlipModal] = useState(false);
  const [activeSlipCandidate, setActiveSlipCandidate] = useState<{ exam: BeltExamSession; candidate: ExamCandidate } | null>(null);

  // Modal for Admit Card in Result tab
  const [viewAdmitCardModal, setViewAdmitCardModal] = useState<{ exam: BeltExamSession; candidate: ExamCandidate } | null>(null);

  const getNextBelt = (currentBeltName: string): string => {
    const norm = (currentBeltName || "").toLowerCase();
    const idx = beltLevels.findIndex(
      (b) => norm.includes(b.name.toLowerCase()) || norm.includes(b.id.toLowerCase())
    );
    if (idx >= 0 && idx + 1 < beltLevels.length) {
      const next = beltLevels[idx + 1];
      return next.name;
    }
    return beltLevels[0]?.name || "Yellow Belt";
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [examsRes, syllabusRes] = await Promise.all([
        fetch("/api/belt-exams"),
        fetch("/api/belt-exams/syllabus"),
      ]);

      let examsData: any = {};
      let syllabusData: any = {};

      if (examsRes.ok) {
        const text = await examsRes.text();
        if (text.trim()) {
          try {
            examsData = JSON.parse(text);
          } catch {}
        }
      }

      if (syllabusRes.ok) {
        const text = await syllabusRes.text();
        if (text.trim()) {
          try {
            syllabusData = JSON.parse(text);
          } catch {}
        }
      }

      if (examsData.success && Array.isArray(examsData.exams)) {
        setExams(examsData.exams);
        if (examsData.exams.length > 0 && !selectedExamForReg) {
          const openExam = examsData.exams.find((e: BeltExamSession) => e.status === "Registration Open") || examsData.exams[0];
          setSelectedExamForReg(openExam);
        }
      }

      const loadedSyllabus = syllabusData.beltLevels || syllabusData.levels;
      if (syllabusData.success && Array.isArray(loadedSyllabus) && loadedSyllabus.length > 0) {
        setBeltLevels(loadedSyllabus);
        setSelectedBelt((prev) => {
          const matched = loadedSyllabus.find((b: BeltLevel) => b.id === prev?.id);
          return matched || loadedSyllabus[0];
        });
      }
    } catch (err) {
      console.error("Error loading belt exams data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedExamForReg]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically find candidate records belonging to the authenticated user strictly by Unique User/Athlete ID or Email
  const userCandidateRecords = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    const cleanEmail = user.email?.toLowerCase().trim();
    const cleanId = user.id?.toLowerCase().trim();
    const cleanPhone = user.phone?.trim();

    const matches: { exam: BeltExamSession; candidate: ExamCandidate }[] = [];
    for (const ex of exams) {
      for (const cand of ex.candidates) {
        const candAthleteId = cand.athleteId?.toLowerCase().trim();
        const candId = cand.id?.toLowerCase().trim();
        const candEmail = cand.email?.toLowerCase().trim();
        const candPhone = cand.phone?.trim();

        // 1. Primary match: Strict User/Athlete ID or Candidate Roll No
        if (cleanId && (candAthleteId === cleanId || candId === cleanId)) {
          matches.push({ exam: ex, candidate: cand });
          continue;
        }

        // 2. Secondary match: Strict Registered Email (only if athleteId doesn't conflict)
        if (cleanEmail && candEmail && candEmail === cleanEmail) {
          if (!candAthleteId || !cleanId || candAthleteId === cleanId) {
            matches.push({ exam: ex, candidate: cand });
            continue;
          }
        }

        // 3. Tertiary match: Strict Phone (only if athleteId/email do not conflict)
        if (cleanPhone && candPhone && candPhone === cleanPhone) {
          if ((!candAthleteId || !cleanId || candAthleteId === cleanId) && (!candEmail || !cleanEmail || candEmail === cleanEmail)) {
            matches.push({ exam: ex, candidate: cand });
            continue;
          }
        }
      }
    }
    return matches;
  }, [exams, isAuthenticated, user]);

  // Handle URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const sessionParam = params.get("session");

    if (tabParam && ["syllabus", "schedule", "register", "results"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    if (sessionParam && exams.length > 0) {
      const found = exams.find((e) => e.id.toLowerCase() === sessionParam.toLowerCase());
      if (found) {
        setSelectedExamForReg(found);
        setActiveTab("register");
      }
    }
  }, [exams]);

  // Auto-fill form fields from logged-in user profile upon visit
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setRegAthleteName((prev) => prev || user.name);
      if (user.email) setRegEmail((prev) => prev || user.email || "");
      if (user.phone) setRegPhone((prev) => prev || user.phone || "");
      if (user.dob) setRegDob((prev) => prev || normalizeDateToYYYYMMDD(user.dob || ""));
      if (user.gender) setRegGender(user.gender as any);
      if (user.club) {
        setRegAcademyName((prev) => prev || user.club || "");
        setRegClubName((prev) => prev || user.club || "");
      }
      if (user.state) setRegState((prev) => prev || user.state || "Maharashtra");
      if (user.beltRank) {
        setRegCurrentBelt((prev) => prev || user.beltRank || "White Belt");
        setRegTargetBelt((prev) => (prev === "Yellow Belt" ? getNextBelt(user.beltRank || "") : prev));
      }
    }
  }, [isAuthenticated, user]);

  // Send Registration 2FA OTP for Belt Examination
  const handleSendBeltOtp = async () => {
    if (!regEmail.trim() || !regEmail.includes("@")) {
      toast.error("Please enter a valid candidate email address first.");
      return;
    }
    if (!regAthleteName.trim()) {
      toast.error("Please enter candidate athlete name first.");
      return;
    }

    try {
      setIsSendingRegOtp(true);
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim().toLowerCase(), name: regAthleteName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          toast.error("Account Already Registered", {
            description: data.error,
            action: {
              label: "Log In",
              onClick: () => {
                window.location.href = "/login?redirect=/belt-exams?tab=register";
              },
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setRegTempToken(data.tempToken || "");
      setRegOtpSent(true);
      setRegOtpCountdown(60);
      toast.success("Verification Code Sent!", {
        description: `A 6-digit verification code has been dispatched to ${data.maskedEmail || regEmail.trim()}.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingRegOtp(false);
    }
  };

  // Handle Candidate Form Submission
  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const examToUse = selectedExamForReg || exams[0];
    if (!examToUse) {
      toast.error("Please select an examination session first");
      return;
    }

    if (!regAthleteName.trim()) {
      toast.error("Please enter Candidate Full Name");
      return;
    }

    if (!regMedicalAgreed) {
      toast.error("Please accept the Medical & Physical Fitness Declaration");
      return;
    }

    if (!isAuthenticated) {
      if (!regPassword || regPassword.length < 6) {
        toast.error("Please enter a password of at least 6 characters");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (!regOtpCode || regOtpCode.trim().length < 6) {
        if (!regOtpSent) {
          toast.info("Please request and enter your 6-digit Email Verification Code (OTP).");
          handleSendBeltOtp();
        } else {
          toast.error("Please enter the 6-digit verification code (OTP) sent to your email.");
        }
        return;
      }
    }

    try {
      setIsSubmittingReg(true);

      // Clean up any legacy oversized cookie from browser before fetch to prevent HTTP 431
      if (typeof document !== "undefined" && document.cookie.includes("member_session=")) {
        const match = document.cookie.match(/(?:^|;\s*)member_session=([^;]+)/);
        if (match && match[1] && match[1].length > 2048) {
          document.cookie = "member_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }

      const authHeaders = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("wsf_member_token") : null);
      const safeToken = currentToken && currentToken.length < 2048 ? currentToken : undefined;

      const res = await fetch(`/api/belt-exams/${encodeURIComponent(examToUse.id)}/register`, {
        method: "POST",
        credentials: "omit",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          ...(safeToken ? { "Authorization": `Bearer ${safeToken}`, "x-member-token": safeToken } : {}),
        },
        body: JSON.stringify({
          athleteId: user?.id || undefined,
          athleteName: regAthleteName.trim(),
          dob: regDob.trim() || "15/08/2008",
          gender: regGender,
          academyName: regAcademyName.trim() || regClubName.trim() || "Kalawar Martial Arts Academy",
          clubName: regClubName.trim() || regAcademyName.trim() || "Independent Dojo",
          state: regState,
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword || undefined,
          confirmPassword: regConfirmPassword || undefined,
          otpCode: regOtpCode.trim() || undefined,
          tempToken: regTempToken || undefined,
          memberToken: safeToken,
          currentBelt: regCurrentBelt,
          targetBelt: regTargetBelt,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server response error (Status ${res.status}). Please try again.`);
      }

      if (!res.ok || !data.success) {
        if (data.existingAccount) {
          toast.error("Account Already Registered", {
            description: data.error,
            action: {
              label: "Log In",
              onClick: () => {
                window.location.href = "/login?redirect=/belt-exams?tab=register";
              },
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      if (data.user) {
        setUser(data.user, data.token || null);
      }

      setRegisteredCandidate(data.candidate);
      setActiveSlipCandidate({ exam: examToUse, candidate: data.candidate });
      setShowRegSlipModal(true);

      toast.success("Registration Submitted Successfully!", {
        description: `Registration Slip Generated: Roll No. ${data.candidate.id}`,
      });

      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register candidate");
    } finally {
      setIsSubmittingReg(false);
    }
  };



  // Filtered Sessions
  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      const matchesState = stateFilter === "All" || ex.state.toLowerCase() === stateFilter.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.chiefExaminer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [exams, stateFilter, searchQuery]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Official Technical Accreditation & Examination Portal"
        title="🥋 BELT EXAMINATIONS & GUP GRADING"
        description="Standardized National Martial Arts Progression Matrix (Yellow Belt to Junior Black Belt) with 6-stage lifecycle accreditation, verified admit cards, and digital diplomas."
        image={IMAGES.martialArts}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-center gap-1.5 sm:gap-2 p-1.5 bg-stone-900/90 border border-stone-800 rounded-2xl max-w-3xl mx-auto mb-8 sm:mb-10 shadow-xl">
          <button
            onClick={() => setActiveTab("syllabus")}
            className={cn(
              "flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center",
              activeTab === "syllabus"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20 font-black"
                : "text-stone-400 hover:text-white hover:bg-stone-800/60"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Progression Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={cn(
              "flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center",
              activeTab === "schedule"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20 font-black"
                : "text-stone-400 hover:text-white hover:bg-stone-800/60"
            )}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Exam Sessions ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("register")}
            className={cn(
              "flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center",
              activeTab === "register"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20 font-black"
                : "text-stone-400 hover:text-white hover:bg-stone-800/60"
            )}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Candidate Registration</span>
          </button>

          <button
            onClick={() => setActiveTab("results")}
            className={cn(
              "flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center",
              activeTab === "results"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20 font-black"
                : "text-stone-400 hover:text-white hover:bg-stone-800/60"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Admit Card &amp; Results</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SYLLABUS & PROGRESSION MATRIX (11 OFFICIAL BELT RANKS) */}
        {/* ========================================================================= */}
        {activeTab === "syllabus" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto">
              <div className="space-y-1.5">
                <span className="inline-block text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 sm:px-3 py-1 rounded-full border border-amber-400/20">
                  {lang === "hi" ? "11-चरणीय आधिकारिक बेल्ट रैंकिंग मैट्रिक्स" : "11-Stage Official Belt Ranking Matrix"}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {lang === "hi" ? "तकनीकी पाठ्यक्रम और अनुक्रम मानक" : "Technical Syllabus & Standards"}
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  {lang === "hi"
                    ? "राष्ट्रीय तकनीकी समिति द्वारा अनुमोदित मानकीकृत अनुक्रम (अनुक्रम 1: आरम्भ से अनुक्रम 11: संगम तक)।"
                    : "Standardized progression requirements approved by the National Technical Committee from Yellow Belt up to Junior Black Belt."}
                </p>
              </div>

              {/* Language Selector Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-2xl shadow-inner self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setLang("en")}
                  className={cn(
                    "px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                    lang === "en"
                      ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-black"
                      : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                  )}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => setLang("hi")}
                  className={cn(
                    "px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                    lang === "hi"
                      ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-black"
                      : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                  )}
                >
                  <span>🇮🇳</span>
                  <span>Hindi (हिंदी)</span>
                </button>
              </div>
            </div>

            {/* Belt Selector Strip (11 Ranks in Exact Sequence) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3">
              {beltLevels.map((belt, idx) => {
                const isSelected = selectedBelt?.id === belt.id;
                const anukkamaNum = belt.anukkamaNumber || idx + 1;
                const anukkamaTitle = lang === "hi"
                  ? (belt.anukkamaNameHindi ? `${belt.anukkamaNameHindi} (${belt.anukkamaName})` : belt.anukkamaName)
                  : belt.anukkamaName;
                const displayName = lang === "hi"
                  ? (belt.nameHindi ? `${belt.nameHindi}` : belt.name)
                  : belt.name;
                const colorText = lang === "hi" ? belt.beltColorNameHindi : belt.beltColorName;

                return (
                  <button
                    key={belt.id}
                    onClick={() => setSelectedBelt(belt)}
                    className={cn(
                      "p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between min-h-[100px] sm:min-h-[110px]",
                      isSelected
                        ? "bg-stone-900 border-amber-400 shadow-xl shadow-amber-400/10 ring-2 ring-amber-400/40 scale-[1.01] sm:scale-[1.02]"
                        : "bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-black text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 shrink-0">
                        {lang === "hi" ? `अनुक्रम ${anukkamaNum}` : `Anukkama ${anukkamaNum}`}
                      </span>
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">{belt.beltEmoji || "🥋"}</span>
                        <p className={cn("text-xs font-black truncate", isSelected ? "text-amber-300" : "text-white")}>
                          {displayName}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/80">
                        <span className="text-stone-300 font-bold truncate">
                          {anukkamaTitle ? `${anukkamaTitle}` : `Rank ${idx + 1}`}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 capitalize shrink-0 ml-1">
                          {colorText}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-0 right-0 w-1.5 sm:w-2 h-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Belt Detail Card */}
            {selectedBelt && (
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 sm:pb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 sm:px-3 py-0.5 rounded-full">
                        {lang === "hi"
                          ? `अनुक्रम ${selectedBelt.anukkamaNumber || 1}: ${selectedBelt.anukkamaNameHindi || selectedBelt.anukkamaName}`
                          : `Anukkama ${selectedBelt.anukkamaNumber || 1}: ${selectedBelt.anukkamaName}`}
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        {lang === "hi" ? `रंग: ${selectedBelt.beltColorNameHindi || selectedBelt.beltColorName}` : `Color: ${selectedBelt.beltColorName}`}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 flex flex-wrap items-center gap-2">
                      <span>{selectedBelt.beltEmoji || "🥋"}</span>
                      <span>
                        {lang === "hi" && selectedBelt.nameHindi
                          ? `${selectedBelt.nameHindi} (${selectedBelt.name})`
                          : selectedBelt.name}
                      </span>
                      <span className="text-sm sm:text-base lg:text-lg font-mono font-normal text-amber-400/80">
                        — {selectedBelt.anukkamaName}
                      </span>
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-300 mt-1.5 italic font-serif leading-relaxed">
                      "{selectedBelt.summary}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setRegTargetBelt(selectedBelt.name);
                        setActiveTab("register");
                      }}
                      className="w-full sm:w-auto text-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      {lang === "hi" ? "इस बेल्ट के लिए पंजीकरण करें →" : "Register for this Belt →"}
                    </button>
                  </div>
                </div>

                {/* 6 Core Syllabus Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Forms */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Belt Examination Patterns</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.forms || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Techniques */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Fundamental Stances &amp; Strikes</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.techniques || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sparring */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Sparring &amp; Step Drills</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.sparring || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Self Defense */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <User className="w-4 h-4 shrink-0" />
                      <span>Self-Defense Applications</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.selfDefense || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Breaking */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Power Breaking</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.breaking || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Theory & Philosophy */}
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl sm:rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Award className="w-4 h-4 shrink-0" />
                      <span>Philosophy &amp; Federation Ethics</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {(selectedBelt.syllabus?.theory || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EXAMINATION SCHEDULE & SESSIONS */}
        {/* ========================================================================= */}
        {activeTab === "schedule" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 bg-stone-900/80 border border-stone-800 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by city, venue, or examiner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-stone-400 shrink-0" />
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="All">All States / Regions</option>
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Cards */}
            {filteredExams.length === 0 ? (
              <div className="bg-stone-900/40 border border-stone-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-3">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-stone-600 mx-auto" />
                <p className="text-base font-bold text-white">No Examination Sessions Found</p>
                <p className="text-xs text-stone-400">
                  Try clearing search filters or check back shortly for newly scheduled examination dates.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-amber-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all space-y-4 shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                          {exam.discipline}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-full",
                            exam.status === "Registration Open"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-stone-800 text-stone-400"
                          )}
                        >
                          ● {exam.status}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{exam.title}</h3>

                      <div className="space-y-2 text-xs text-stone-300">
                        <div className="flex items-start sm:items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                          <span>
                            {new Date(exam.examDate).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            ({exam.reportingTime})
                          </span>
                        </div>
                        <div className="flex items-start sm:items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                          <span className="break-words">
                            {exam.venueName}, {exam.city}, {exam.state}
                          </span>
                        </div>
                        <div className="flex items-start sm:items-center gap-2">
                          <User className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                          <span>Chief Examiner: {exam.chiefExaminer}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-stone-400">Eligible Belt Ranks:</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {exam.eligibleBelts.map((belt) => (
                            <span
                              key={belt}
                              className="text-[10px] bg-stone-950 border border-stone-800 text-stone-300 px-2 py-0.5 rounded-md"
                            >
                              {belt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[11px] text-stone-400 font-mono">
                        Deadline: {exam.registrationDeadline}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedExamForReg(exam);
                          setActiveTab("register");
                        }}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Register Candidate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CANDIDATE REGISTRATION (NO FEES / INSTANT SLIP) */}
        {/* ========================================================================= */}
        {activeTab === "register" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl">
              <div className="border-b border-stone-800 pb-4">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Official Candidate Enrollment
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Belt Grading Examination Application
                </h2>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Enter candidate details below. After submitting, your official Registration Slip will be generated and routed to the Secretariat for Admit Card issue.
                </p>
              </div>

              <form onSubmit={handleCandidateSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Exam Session Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                    Selected Examination Session *
                  </label>
                  <select
                    value={selectedExamForReg?.id || ""}
                    onChange={(e) => {
                      const found = exams.find((x) => x.id === e.target.value);
                      if (found) setSelectedExamForReg(found);
                    }}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} — {ex.examDate} ({ex.city}, {ex.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Candidate Full Name & DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Candidate Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Full Name as per Certificate"
                      value={regAthleteName}
                      onChange={(e) => setRegAthleteName(e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Date of Birth (DOB) *</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400 [color-scheme:dark] cursor-pointer"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Gender & Affiliated Academy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Gender *
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Affiliated Academy / Dojo *
                    </label>
                    <input
                      type="text"
                      placeholder="Academy Name"
                      value={regAcademyName}
                      onChange={(e) => {
                        setRegAcademyName(e.target.value);
                        setRegClubName(e.target.value);
                      }}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                {/* 5. Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Email Address (for Admit Card &amp; Results) *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Fields / Logged in Badge */}
                {!isAuthenticated ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Create Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white pr-10 focus:outline-none focus:border-amber-400 font-mono"
                          required={!isAuthenticated}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">Min 6 characters. Auto-creates player account &amp; logs you in.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white pr-10 focus:outline-none focus:border-amber-400 font-mono"
                          required={!isAuthenticated}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Email OTP Verification Section */}
                    <div className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl bg-stone-950 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-400" /> Email Verification Code (OTP) *
                        </span>
                        {regOtpSent && (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OTP sent to {regEmail || "candidate email"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <input
                          type="text"
                          maxLength={6}
                          value={regOtpCode}
                          onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 font-mono tracking-widest text-center focus:outline-none focus:border-amber-400"
                          required={!isAuthenticated}
                        />
                        <button
                          type="button"
                          onClick={handleSendBeltOtp}
                          disabled={isSendingRegOtp || (regOtpSent && regOtpCountdown > 0)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-400 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isSendingRegOtp ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                            </>
                          ) : regOtpCountdown > 0 ? (
                            `Resend in ${regOtpCountdown}s`
                          ) : regOtpSent ? (
                            "Resend OTP"
                          ) : (
                            "Send OTP"
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-relaxed">
                        Click <strong>Send OTP</strong> to receive a 6-digit code. Email verification automatically registers and logs you in across the website upon submission.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-400 block">
                        Logged in as {formatMemberType(user?.memberType) || (user?.role === "admin" ? "Admin" : "Member")}
                      </span>
                      <p className="text-[11px] text-stone-400">
                        {user?.name} ({user?.email}) · Auto-filled with your saved profile details.
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. Current Belt & Target Belt (11 Ranks) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Current Belt Held *
                    </label>
                    <select
                      value={regCurrentBelt}
                      onChange={(e) => setRegCurrentBelt(e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="White Belt">White Belt</option>
                      {beltLevels.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Target Belt for Examination *
                    </label>
                    <select
                      value={regTargetBelt}
                      onChange={(e) => setRegTargetBelt(e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                    >
                      {beltLevels.map((b) => (
                        <option key={b.id} value={b.name}>
                          🥋 {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Medical Declaration */}
                <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regMedicalAgreed}
                    onChange={(e) => setRegMedicalAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-stone-300 leading-relaxed">
                    I declare that the candidate is medically and physically fit to participate in this official Belt Grading Examination. I agree to abide by all federation rules and Grandmaster evaluation standards.
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                >
                  {isSubmittingReg ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Submitting Candidate Registration...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="break-words">Submit Candidate Registration &amp; Generate Slip</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TRACK APPLICATION & CANDIDATE PORTAL (DIRECT SEARCH) */}
        {/* ========================================================================= */}
        {activeTab === "results" && (
          <section className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            {!isAuthenticated ? (
              <div className="max-w-xl mx-auto bg-stone-900/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-center space-y-5 sm:space-y-6 shadow-2xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-white">
                    Candidate Portal Authentication Required
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                    Please log in with your registered player account to track your belt examination status, view admit cards, and download official diplomas &amp; registration slips.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    href="/login?redirect=/belt-exams?tab=results"
                    className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <User className="w-4 h-4 shrink-0" /> Log In with Registered Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="w-full sm:w-auto px-5 py-3 sm:py-3.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 hover:border-amber-400 text-xs font-bold transition text-center justify-center"
                  >
                    New Candidate? Register Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header / Intro */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    <Award className="w-3.5 h-3.5 shrink-0" /> Candidate Document Center &amp; Live Tracker
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                    My Belt Examination Records
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
                    Live examination status, Roll Numbers, Hall Tickets, Assessment Scorecards, and Official Diplomas for <strong className="text-white">{user?.name}</strong>.
                  </p>
                </div>

                {/* Candidate Content Body */}
                {userCandidateRecords.length > 0 ? (
                  <div className="space-y-5 sm:space-y-6 animate-fadeIn">
                    {userCandidateRecords.map(({ exam, candidate }, index) => (
                      <div
                        key={candidate.id || index}
                        className="bg-stone-900/90 border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  "text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border",
                                  candidate.status === "Result Declared"
                                    ? candidate.resultStatus === "Passed"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-red-500/10 text-red-400 border-red-500/30"
                                    : candidate.status === "Admit Card Issued"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                )}
                              >
                                ● {candidate.status || "Submitted"}
                              </span>
                              <span className="text-xs text-stone-400 font-mono">
                                Roll No: {candidate.id}
                              </span>
                            </div>

                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white uppercase mt-1">
                              {candidate.athleteName}
                            </h3>
                            <p className="text-xs text-amber-300 font-semibold">
                              Target Belt: 🥋 {candidate.targetBelt} • Session: {exam.title}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-stretch sm:items-center gap-2">
                            {candidate.status === "Result Declared" &&
                              candidate.resultStatus === "Passed" &&
                              candidate.certificateNumber && (
                                <>
                                  <Link
                                    href={`/certificates/belt/${encodeURIComponent(candidate.certificateNumber)}`}
                                    target="_blank"
                                    className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                                  >
                                    <Award className="w-4 h-4 shrink-0" />
                                    <span>View Official Certificate</span>
                                  </Link>

                                  <button
                                    onClick={() => downloadBeltDiplomaPDF({
                                      athleteName: candidate.athleteName,
                                      certificateNumber: candidate.certificateNumber,
                                      beltRank: candidate.targetBelt,
                                      state: candidate.state,
                                      athleteId: candidate.athleteId,
                                      dob: candidate.dob || "15/08/2008",
                                      academyName: candidate.academyName || candidate.clubName,
                                      examDate: candidate.examDate || exam.examDate,
                                      issuedDate: candidate.resultDeclaredAt || exam.examDate,
                                    })}
                                    className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 shrink-0" />
                                    <span>Download Master PDF</span>
                                  </button>

                                  <button
                                    onClick={() => printBeltDiplomaPDF({
                                      athleteName: candidate.athleteName,
                                      certificateNumber: candidate.certificateNumber,
                                      beltRank: candidate.targetBelt,
                                      state: candidate.state,
                                      athleteId: candidate.athleteId,
                                      dob: candidate.dob || "15/08/2008",
                                      academyName: candidate.academyName || candidate.clubName,
                                      examDate: candidate.examDate || exam.examDate,
                                      issuedDate: candidate.resultDeclaredAt || exam.examDate,
                                    })}
                                    className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 border border-stone-700 text-emerald-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-4 h-4 shrink-0" />
                                    <span>Print</span>
                                  </button>
                                </>
                              )}

                            {candidate.status === "Admit Card Issued" && (
                              <>
                                <button
                                  onClick={() => downloadAdmitCardPDF({
                                    candidate,
                                    exam,
                                  })}
                                  className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
                                >
                                  <Download className="w-4 h-4 shrink-0" />
                                  <span>Download Admit Card (PDF)</span>
                                </button>

                                <button
                                  onClick={() => setViewAdmitCardModal({ exam, candidate })}
                                  className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 border border-stone-700 text-blue-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 shrink-0" />
                                  <span>View Hall Ticket</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setActiveSlipCandidate({ exam, candidate });
                                setShowRegSlipModal(true);
                              }}
                              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span>View Registration Slip</span>
                            </button>

                            <button
                              onClick={() => downloadBeltRegistrationSlipPDF({
                                candidate,
                                exam,
                              })}
                              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer font-black"
                            >
                              <Download className="w-4 h-4 shrink-0" />
                              <span>Download Slip (PDF)</span>
                            </button>
                          </div>
                        </div>

                        {/* Candidate Overview Matrix */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                          <div className="bg-stone-950 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-stone-800">
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Student ID</p>
                            <p className="font-mono font-bold text-white mt-1">{candidate.athleteId}</p>
                          </div>

                          <div className="bg-stone-950 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-stone-800">
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Affiliated Academy</p>
                            <p className="font-bold text-white mt-1 truncate">
                              {candidate.academyName || candidate.clubName}
                            </p>
                          </div>

                          <div className="bg-stone-950 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-stone-800">
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Examination Date</p>
                            <p className="font-bold text-amber-400 mt-1">
                              {candidate.examDate || exam.examDate}
                            </p>
                          </div>

                          <div className="bg-stone-950 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-stone-800">
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Venue / Place</p>
                            <p className="font-bold text-white mt-1 truncate">
                              {candidate.examVenue || `${exam.venueName}, ${exam.city}`}
                            </p>
                          </div>
                        </div>

                        {/* Lifecycle Stage Specific Cards */}
                        {candidate.status === "Submitted" && (
                          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span>Stage 2 of 6: Application Under Secretariat Review</span>
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">
                              Your candidate registration has been recorded under Registration Slip No:{" "}
                              <strong className="text-white font-mono break-all">{candidate.registrationSlipId}</strong>.
                              The Technical Examination Secretariat is reviewing candidate credentials. Your Official Admit Card will be unlocked once approved.
                            </p>
                          </div>
                        )}

                        {candidate.status === "Admit Card Issued" && (
                          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Stage 3 of 6: Admit Card &amp; Hall Ticket Issued</span>
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">
                              Admit Card No: <strong className="text-white font-mono break-all">{candidate.admitCardNumber}</strong>.
                              Please print your Admit Card and bring it along with your mandatory sparring protective gear to the venue on examination day.
                            </p>
                          </div>
                        )}

                        {candidate.status === "Result Declared" && (
                          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                                <Award className="w-4 h-4 shrink-0" />
                                <span>Examination Assessment Scorecard</span>
                              </div>
                              <span className="text-xs font-bold text-white">
                                Grade: {candidate.assessment?.grade || "Pass"} ({candidate.assessment?.totalScore || 85}/100)
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-center">
                                <span className="text-[10px] text-stone-400">Belt Examination Patterns</span>
                                <p className="font-bold text-white mt-0.5">{candidate.assessment?.formsScore || 22}/25</p>
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-center">
                                <span className="text-[10px] text-stone-400">Sparring</span>
                                <p className="font-bold text-white mt-0.5">{candidate.assessment?.sparringScore || 23}/25</p>
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-center">
                                <span className="text-[10px] text-stone-400">Self Defense</span>
                                <p className="font-bold text-white mt-0.5">{candidate.assessment?.selfDefenseScore || 21}/25</p>
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-center">
                                <span className="text-[10px] text-stone-400">Fitness &amp; Theory</span>
                                <p className="font-bold text-white mt-0.5">{candidate.assessment?.fitnessScore || 22}/25</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0e1017] border border-stone-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-center space-y-4 shadow-xl">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400/60 flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white uppercase">No Belt Examination Records Found</h3>
                      <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                        No belt grading examination registrations were found under your registered athlete profile ({user?.name || user?.email}). Register for an upcoming session to get started.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      Register for Examination Now
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REGISTRATION SLIP MODAL */}
      {/* ========================================================================= */}
      {showRegSlipModal && activeSlipCandidate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-800 flex-shrink-0 bg-[#0e1017] relative">
              <button
                onClick={() => setShowRegSlipModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-400 hover:text-white p-1.5 sm:p-2 rounded-xl bg-stone-900 border border-stone-800 transition cursor-pointer"
                title="Close Slip"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="text-center space-y-1.5 sm:space-y-2 pr-8 sm:pr-0">
                <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-1 sm:p-1.5 flex items-center justify-center shadow-gold shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-black text-amber-400 tracking-wider uppercase">
                      KALAWAR SPORTS &amp; MARTIAL ARTS FEDERATION
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">
                      National Board of Dan &amp; Gup Technical Belt Accreditation
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="px-2.5 sm:px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    ✓ Official Registration Confirmation Slip
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase mt-1">
                    Candidate Enrollment Slip
                  </h3>
                </div>
              </div>
            </div>

            {/* SCROLLABLE SLIDER BODY */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-3.5 sm:space-y-4 text-xs">
              {/* Slip Hero Box */}
              <div className="bg-stone-950 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Registration Slip No</p>
                  <p className="font-mono font-bold text-amber-400 text-xs sm:text-sm break-all">
                    {activeSlipCandidate.candidate.registrationSlipId || `KAC-BELT-SLIP-${activeSlipCandidate.candidate.id}`}
                  </p>
                </div>
                <div className="space-y-0.5 sm:text-right">
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Candidate Roll Number</p>
                  <p className="font-mono font-bold text-white text-xs sm:text-sm">
                    {activeSlipCandidate.candidate.id}
                  </p>
                </div>
              </div>

              {/* Structured Particulars Grid */}
              <div className="bg-stone-950/70 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-stone-800/80">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Candidate Full Name:</span>
                    <p className="font-bold text-white uppercase mt-0.5 text-xs sm:text-sm">
                      {activeSlipCandidate.candidate.athleteName}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Student / Athlete ID:</span>
                    <p className="font-mono font-bold text-white mt-0.5">
                      {activeSlipCandidate.candidate.athleteId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-stone-800/80">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Current Belt Held:</span>
                    <p className="font-semibold text-stone-200 mt-0.5">
                      {activeSlipCandidate.candidate.currentBelt}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Target Belt Grade:</span>
                    <p className="font-bold text-amber-400 mt-0.5">
                      🥋 {activeSlipCandidate.candidate.targetBelt}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-stone-800/80">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Affiliated Academy / Dojo:</span>
                    <p className="font-semibold text-white mt-0.5 truncate">
                      {activeSlipCandidate.candidate.academyName || activeSlipCandidate.candidate.clubName} ({activeSlipCandidate.candidate.state})
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Contact Details:</span>
                    <p className="font-medium text-stone-300 mt-0.5 break-words">
                      {activeSlipCandidate.candidate.phone} · {activeSlipCandidate.candidate.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Exam Session Title:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {activeSlipCandidate.exam.title}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Registration Status:</span>
                    <p className="font-bold text-emerald-400 mt-0.5">
                      ● Recorded in National Registry
                    </p>
                  </div>
                </div>
              </div>

              {/* Advisory Note */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-[11px] text-stone-300 space-y-1.5 leading-relaxed">
                <p className="font-bold text-amber-400 uppercase">Admit Card &amp; Examination Workflow Information:</p>
                <p>1. Your candidate registration has been recorded under Official Slip No: <span className="text-amber-300 font-mono font-bold break-all">{activeSlipCandidate.candidate.registrationSlipId || `KAC-BELT-SLIP-${activeSlipCandidate.candidate.id}`}</span>.</p>
                <p>2. The Technical Examination Board is auditing candidate prerequisite tenure and verification credentials.</p>
                <p>3. <strong>Exam Date, Reporting Time, and Venue Address</strong> will be confirmed and printed on your official <strong>Examination Admit Card</strong> upon administrator approval.</p>
                <p>4. Download or print this Registration Slip for your federation records and keep your Roll Number handy for tracking.</p>
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="p-3.5 sm:p-5 border-t border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#0e1017] flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadBeltRegistrationSlipPDF({
                    candidate: activeSlipCandidate.candidate,
                    exam: activeSlipCandidate.exam,
                  })}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-wider text-center"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Slip (PDF)</span>
                </button>

                <button
                  onClick={() => printBeltRegistrationSlipPDF({
                    candidate: activeSlipCandidate.candidate,
                    exam: activeSlipCandidate.exam,
                  })}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Print Slip</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowRegSlipModal(false);
                  setActiveTab("results");
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>Track Live Status &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIT CARD VIEWER MODAL */}
      {/* ========================================================================= */}
      {viewAdmitCardModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border-2 border-blue-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-y-auto">
            <button
              onClick={() => setViewAdmitCardModal(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-400 hover:text-white p-1.5 sm:p-2 rounded-xl bg-stone-900 border border-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="text-center space-y-1 border-b border-stone-800 pb-3 sm:pb-4 pr-8 sm:pr-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                Official Hall Ticket &amp; Entry Pass
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase">
                Belt Examination Admit Card
              </h3>
            </div>

            {/* Admit Card Canvas */}
            <div className="bg-stone-950 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-stone-800 space-y-3 sm:space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-stone-800 pb-3 gap-2">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">Admit Card No</p>
                  <p className="text-xs sm:text-base font-mono font-bold text-amber-400 break-all">
                    {viewAdmitCardModal.candidate.admitCardNumber || "KAC-BELT-ADM-2026-001"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">Candidate Roll No</p>
                  <p className="text-xs sm:text-base font-mono font-bold text-white">
                    {viewAdmitCardModal.candidate.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Candidate Name:</span>
                  <p className="font-bold text-white uppercase mt-0.5 text-xs sm:text-sm">
                    {viewAdmitCardModal.candidate.athleteName}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Student ID:</span>
                  <p className="font-mono font-bold text-white mt-0.5">
                    {viewAdmitCardModal.candidate.athleteId}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Target Belt Grade:</span>
                  <p className="font-bold text-amber-400 mt-0.5">
                    🥋 {viewAdmitCardModal.candidate.targetBelt}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Affiliated Academy:</span>
                  <p className="font-bold text-white mt-0.5 truncate">
                    {viewAdmitCardModal.candidate.academyName || viewAdmitCardModal.candidate.clubName}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Exam Date:</span>
                  <p className="font-bold text-white mt-0.5">
                    {viewAdmitCardModal.candidate.examDate || viewAdmitCardModal.exam.examDate}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Reporting Time:</span>
                  <p className="font-bold text-amber-400 mt-0.5">
                    {viewAdmitCardModal.candidate.reportingTime || viewAdmitCardModal.candidate.examTime || viewAdmitCardModal.exam.reportingTime} (Mandatory 30m Prior)
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Session Time:</span>
                  <p className="font-bold text-white mt-0.5">
                    {viewAdmitCardModal.candidate.examTime || viewAdmitCardModal.candidate.reportingTime || viewAdmitCardModal.exam.reportingTime} – {viewAdmitCardModal.candidate.sessionEndTime || viewAdmitCardModal.exam.examEndTime || "06:00 PM"}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Chief Examiner:</span>
                  <p className="font-bold text-white mt-0.5 truncate">
                    {viewAdmitCardModal.candidate.chiefExaminer || viewAdmitCardModal.candidate.evaluatedBy || viewAdmitCardModal.exam.chiefExaminer || "Grandmaster Rajesh Sharma"}
                  </p>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Venue / Place:</span>
                  <p className="font-bold text-white mt-0.5 break-words">
                    {viewAdmitCardModal.candidate.examVenue || `${viewAdmitCardModal.exam.venueName}, ${viewAdmitCardModal.exam.venueAddress ? viewAdmitCardModal.exam.venueAddress + ", " : ""}${viewAdmitCardModal.exam.city}, ${viewAdmitCardModal.exam.state}`}
                  </p>
                </div>
              </div>

              {viewAdmitCardModal.candidate.admitCardRemarks && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-stone-300 space-y-1">
                  <p className="font-bold text-amber-400 uppercase">Technical Secretariat Remarks:</p>
                  <p className="text-white italic">{viewAdmitCardModal.candidate.admitCardRemarks}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-[10px] sm:text-[11px] text-stone-300 space-y-1 leading-relaxed">
                <p className="font-bold text-amber-400 uppercase">Mandatory Examination Rules:</p>
                <p>1. Candidate must report at least 30 minutes prior to scheduled reporting time.</p>
                <p>2. Complete official uniform (Dobok/Gi) and current belt must be worn.</p>
                <p>3. Bring this Admit Card along with your Student ID Card for venue entry.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => downloadAdmitCardPDF({
                  candidate: viewAdmitCardModal.candidate,
                  exam: viewAdmitCardModal.exam,
                })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20 text-center"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download Admit Card (PDF)</span>
              </button>

              <button
                onClick={() => setViewAdmitCardModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700 transition cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
