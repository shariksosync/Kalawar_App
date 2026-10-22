"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Building2,
  Scale,
  Swords,
  ChevronRight,
  FileText,
  BadgeCheck,
  RefreshCw,
  Lock,
  KeyRound,
  Smartphone,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  Check,
  FileCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { states } from "@/data/people";
import { formatMemberType } from "@/lib/utils";
import { federation } from "@/constants/navigation";
import {
  downloadChampionshipRegistrationReceiptPDF,
  printChampionshipRegistrationReceiptPDF,
} from "@/lib/championship-pdf";
import type { ChampionshipApplication } from "@/types/championship";

interface LiveEvent {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: number;
  venue?: string;
  city?: string;
  discipline?: string;
  registrationLive?: boolean;
}

const CHAMPIONSHIP_DISCIPLINES = [
  "Sparsha Yuddha",
  "Kaya Yuddha",
  "Charana Yuddha",
  "Santulana",
  "Sangama Kala",
];

function ChampionshipRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, isAuthenticated, setUser, getAuthHeaders } = useAuth();
  const preselectedEventId = searchParams.get("eventId") || "";

  // Active view: 'register' or 'track'
  const [activeView, setActiveView] = useState<"register" | "track">("register");

  // Events list (strictly live events fetched from database)
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Form State
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || "");
  const [athleteName, setAthleteName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");

  // OTP Verification State
  const [otpCode, setOtpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [city, setCity] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("Parent / Guardian");

  const [discipline, setDiscipline] = useState<string>("Sparsha Yuddha");
  const [beltRank, setBeltRank] = useState("");
  const [ageDivision, setAgeDivision] = useState("Senior Open (18-29)");
  const [weightCategory, setWeightCategory] = useState("Open Weight");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [club, setClub] = useState("");
  const [coachName, setCoachName] = useState("");
  const [previousAchievements, setPreviousAchievements] = useState("");

  const [athletePhoto, setAthletePhoto] = useState<string>("");
  const [athletePhotoName, setAthletePhotoName] = useState<string>("");
  const [athletePhotoSize, setAthletePhotoSize] = useState<string>("");

  const [idProofDocument, setIdProofDocument] = useState<string>("");
  const [idProofDocName, setIdProofDocName] = useState<string>("");
  const [idProofDocSize, setIdProofDocSize] = useState<string>("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);

  // Document / Image Preview Modal
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    docData: string;
    docName: string;
  } | null>(null);

  const [dobError, setDobError] = useState<string>("");
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<ChampionshipApplication | null>(null);

  // Direct Application Tracking State (No OTP)
  const [trackQuery, setTrackQuery] = useState("");
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [trackedApplications, setTrackedApplications] = useState<ChampionshipApplication[]>([]);

  // Search Application Function
  const handleTrackSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = (overrideQuery !== undefined ? overrideQuery : trackQuery).trim();
    if (!q) {
      setTrackError("Please enter your Application ID, Athlete ID, Bib Number, or Email.");
      return;
    }

    try {
      setIsSearchingTrack(true);
      setTrackError("");
      setHasSearched(true);
      const res = await fetch(`/api/championships/applications?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setTrackedApplications(data.applications);
        if (data.applications.length === 0) {
          setTrackError(`No championship registrations found matching "${q}".`);
        } else {
          toast.success(`Found ${data.applications.length} championship registration(s).`);
        }
      } else {
        setTrackError(data.error || "Failed to find application record.");
        setTrackedApplications([]);
      }
    } catch (err) {
      setTrackError("Network error while searching application.");
      setTrackedApplications([]);
    } finally {
      setIsSearchingTrack(false);
    }
  };

  // Auto-fill logged in user email & name
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.email && !email) setEmail(user.email);
      if (user.name && !athleteName) setAthleteName(user.name);
    }
  }, [isAuthenticated, user]);

  // Auto-search if URL contains id/track param or view=track
  useEffect(() => {
    const view = searchParams.get("view") || searchParams.get("tab");
    const q = searchParams.get("id") || searchParams.get("track") || searchParams.get("candidate");
    if (view === "track" || q) {
      setActiveView("track");
      if (q) {
        setTrackQuery(q);
        handleTrackSearch(undefined, q);
      }
    }
  }, [searchParams]);

  // Auto-load candidate's applications when navigating to Track View while logged in
  useEffect(() => {
    if (activeView === "track" && isAuthenticated && user) {
      const q = user.id || user.email;
      if (q) {
        handleTrackSearch(undefined, q);
      }
    }
  }, [activeView, isAuthenticated, user]);

  // Auto-fill form fields from logged-in user profile upon visit
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setAthleteName((prev) => prev || user.name);
      if (user.email) setEmail((prev) => prev || user.email || "");
      if (user.phone) setPhone((prev) => prev || user.phone || "");
      if (user.gender) setGender(user.gender as any);
      if (user.dob) handleDobChange(user.dob);
      if (user.club) setClub((prev) => prev || user.club || "");
      if (user.state) setStateName((prev) => prev || user.state || "Maharashtra");
      if (user.beltRank) setBeltRank((prev) => prev || user.beltRank || "White Belt");
      if (user.avatar) setAthletePhoto((prev) => prev || user.avatar || "");
    }
  }, [isAuthenticated, user]);

  // Fetch all championship events (strictly LIVE registration)
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const res = await fetch("/api/events");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.events)) {
            // Strictly filter for events where registrationLive is true and event is not completed
            const liveOnly = json.events.filter((e: any) => {
              const isLive = e.registrationLive === true;
              const isNotCompleted = e.status !== "Completed" && !e.status?.toLowerCase().includes("finish");
              return isLive && isNotCompleted;
            });

            setEvents(liveOnly);
            if (liveOnly.length > 0) {
              const hasPreselected = preselectedEventId && liveOnly.some((e: any) => e.id === preselectedEventId);
              setSelectedEventId(hasPreselected ? preselectedEventId : liveOnly[0].id);
            } else {
              setSelectedEventId("");
            }
          } else {
            setEvents([]);
            setSelectedEventId("");
          }
        } else {
          setEvents([]);
          setSelectedEventId("");
        }
      } catch (err) {
        console.error("Failed to load events:", err);
        setEvents([]);
        setSelectedEventId("");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, [preselectedEventId]);

  // Update selected event if query param changes
  useEffect(() => {
    if (preselectedEventId && events.some((e) => e.id === preselectedEventId)) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId, events]);

  // Current selected event object
  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Auto-sync discipline whenever selected tournament event changes
  useEffect(() => {
    if (currentEvent) {
      const eventDisc = currentEvent.discipline || "";
      const title = (currentEvent.title || "").toLowerCase();
      if (title.includes("santulana") || eventDisc.toLowerCase().includes("santulana")) {
        setDiscipline("Santulana");
      } else if (title.includes("sparsha") || eventDisc.toLowerCase().includes("sparsha")) {
        setDiscipline("Sparsha Yuddha");
      } else if (title.includes("kaya") || eventDisc.toLowerCase().includes("kaya")) {
        setDiscipline("Kaya Yuddha");
      } else if (title.includes("charana") || eventDisc.toLowerCase().includes("charana")) {
        setDiscipline("Charana Yuddha");
      } else if (
        title.includes("sangama") ||
        title.includes("malla") ||
        title.includes("danda") ||
        eventDisc.toLowerCase().includes("sangama")
      ) {
        setDiscipline("Sangama Kala");
      } else if (eventDisc && !["football", "cricket", "basketball", "volleyball", "swimming", "badminton", "gymnastics", "athletics"].includes(eventDisc.toLowerCase())) {
        setDiscipline(eventDisc);
      }
    }
  }, [currentEvent]);

  // Max allowed DOB is 4 years ago from today
  const maxDobDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 4);
    return d.toISOString().split("T")[0];
  }, []);

  const formattedMaxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 4);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, []);

  // Helper to auto-select age division based on numeric age
  const updateAgeDivision = (numericAge: number) => {
    if (numericAge < 7) {
      setAgeDivision("Mighty-Mite (Under 7)");
    } else if (numericAge < 10) {
      setAgeDivision("Pee-Wee (Under 10)");
    } else if (numericAge < 13) {
      setAgeDivision("Junior (Under 13)");
    } else if (numericAge < 16) {
      setAgeDivision("Teen (Under 16)");
    } else if (numericAge <= 17) {
      setAgeDivision("Juvenile / Youth (16-17)");
    } else if (numericAge <= 29) {
      setAgeDivision("Senior Open (18-29)");
    } else if (numericAge <= 35) {
      setAgeDivision("Master 1 (30+)");
    } else {
      setAgeDivision("Master 2 (36+)");
    }
  };

  // Auto-calculate age from DOB with minimum 4 years validation
  const handleDobChange = (val: string) => {
    setDob(val);
    setDobError("");

    if (!val) {
      setAge("");
      return;
    }

    const birthDate = new Date(val);
    if (isNaN(birthDate.getTime())) {
      setDobError("Please select a valid date of birth.");
      setAge("");
      return;
    }

    const today = new Date();
    if (birthDate > today) {
      setDobError("Date of birth cannot be in the future.");
      setAge("");
      return;
    }

    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 4) {
      setDobError(`Competitor must be at least 4 years old (DOB on or before ${formattedMaxDob}). Current calculated age is ${calculatedAge < 0 ? 0 : calculatedAge} yr.`);
      setAge("");
      return;
    }

    // Valid age >= 4 -> auto-fill age & division
    setAge(calculatedAge);
    setDobError("");
    updateAgeDivision(calculatedAge);
  };

  // Auto-calculate and fill DOB when Age (Years) is entered
  const handleAgeChange = (val: string) => {
    if (!val) {
      setAge("");
      setDobError("");
      return;
    }

    const numericAge = parseInt(val, 10);
    if (isNaN(numericAge) || numericAge <= 0) {
      setAge(val === "" ? "" : Number(val) || "");
      return;
    }

    setAge(numericAge);

    if (numericAge < 4) {
      setDobError("Competitor must be at least 4 years old.");
      return;
    }

    setDobError("");

    const today = new Date();
    const birthYear = today.getFullYear() - numericAge;

    // Retain existing month and day if selected, otherwise default to Jan 1st
    let monthStr = "01";
    let dayStr = "01";
    if (dob) {
      const parts = dob.split("-");
      if (parts.length === 3) {
        monthStr = parts[1];
        dayStr = parts[2];
      }
    }
    const computedDob = `${birthYear}-${monthStr}-${dayStr}`;
    setDob(computedDob);

    // Synchronize age division
    updateAgeDivision(numericAge);
  };

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const compressImageFile = async (file: File, maxWidth = 900, maxHeight = 900, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Passport Photo exceeds 5MB limit. Please upload an image under 5MB.");
      return;
    }

    try {
      const compressed = await compressImageFile(file, 800, 800, 0.85);
      const approxBytes = Math.round((compressed.length * 3) / 4);
      const formattedSize = formatFileSize(approxBytes);
      setAthletePhoto(compressed);
      setAthletePhotoName(file.name);
      setAthletePhotoSize(formattedSize);
      toast.success("Passport photo attached!", { description: `${file.name} (${formattedSize})` });
    } catch {
      toast.error("Failed to read image file.");
    }
  };

  const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("ID Proof document exceeds 8MB limit. Please upload a file under 8MB.");
      return;
    }

    try {
      const compressed = await compressImageFile(file, 1000, 1000, 0.85);
      const approxBytes = Math.round((compressed.length * 3) / 4);
      const formattedSize = formatFileSize(approxBytes);
      setIdProofDocument(compressed);
      setIdProofDocName(file.name);
      setIdProofDocSize(formattedSize);
      toast.success("Age / Aadhaar ID Proof attached!", { description: `${file.name} (${formattedSize})` });
    } catch {
      toast.error("Failed to read document file.");
    }
  };

  const handleRemoveFile = (type: "photo" | "idProof") => {
    if (type === "photo") {
      setAthletePhoto("");
      setAthletePhotoName("");
      setAthletePhotoSize("");
      if (photoInputRef.current) photoInputRef.current.value = "";
      toast.info("Passport photo removed.");
    } else {
      setIdProofDocument("");
      setIdProofDocName("");
      setIdProofDocSize("");
      if (idProofInputRef.current) idProofInputRef.current.value = "";
      toast.info("ID proof document removed.");
    }
  };

  // Send Registration 2FA OTP
  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address first.");
      return;
    }
    if (!athleteName.trim()) {
      toast.error("Please enter competitor name first.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: athleteName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          toast.error("Account Already Registered", {
            description: data.error,
            action: {
              label: "Log In",
              onClick: () => router.push("/login?redirect=/championship/register"),
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setTempToken(data.tempToken || "");
      setOtpSent(true);
      setOtpCountdown(60);
      toast.success("Verification Code Sent!", {
        description: `A 6-digit verification code has been dispatched to ${data.maskedEmail || email.trim()}.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId || !currentEvent) {
      toast.error("Please select an active championship fixture with open registration.");
      return;
    }

    if (!athleteName.trim()) {
      toast.error("Competitor Name is required.");
      return;
    }

    if (!dob) {
      toast.error("Date of birth is required.");
      return;
    }

    if (dobError) {
      toast.error(dobError);
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("A valid email address is required for registration.");
      return;
    }

    if (!isAuthenticated) {
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (!otpCode || otpCode.trim().length < 6) {
        if (!otpSent) {
          toast.info("Please request and enter your 6-digit Email Verification Code (OTP).");
          handleSendOtp();
        } else {
          toast.error("Please enter the 6-digit verification code (OTP) sent to your email.");
        }
        return;
      }
    }

    if (!phone.trim()) {
      toast.error("Contact phone number is required.");
      return;
    }

    if (!city.trim()) {
      toast.error("City / District is required.");
      return;
    }

    if (!beltRank.trim()) {
      toast.error("Please select your current Belt Rank / Grade.");
      return;
    }

    if (!athletePhoto) {
      toast.error("Please upload the competitor's passport size photo.");
      return;
    }

    if (!idProofDocument) {
      toast.error("Please upload Aadhaar or Govt ID proof document.");
      return;
    }

    if (!agreedToRules) {
      toast.error("You must agree to the tournament regulations and medical declaration.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        eventId: selectedEventId,
        eventName: currentEvent?.title || "KALAWAR All India National Championship 2026",
        eventTitle: currentEvent?.title || "KALAWAR All India National Championship 2026",
        eventDate: currentEvent?.startDate || "2026-05-15",
        eventLocation: currentEvent ? `${currentEvent.venue || "Stadium"}, ${currentEvent.city || "India"}` : "Shiv Chhatrapati Sports Complex, Pune",
        eventVenue: currentEvent?.venue || "Shiv Chhatrapati Sports Complex, Balewadi",
        eventCity: city.trim() || currentEvent?.city || "Pune",
        athleteName: athleteName.trim(),
        applicantName: athleteName.trim(),
        photo: athletePhoto,
        athletePhoto: athletePhoto,
        gender,
        dob,
        age: Number(age) || undefined,
        email: email.trim().toLowerCase(),
        password: password || undefined,
        confirmPassword: confirmPassword || undefined,
        otpCode: otpCode.trim() || undefined,
        tempToken: tempToken || undefined,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        aadhaarNumber: aadhaarNumber.trim() || undefined,
        idProofDoc: idProofDocument,
        idProofDocument: idProofDocument,
        state: stateName,
        city: city.trim(),
        residentialAddress: residentialAddress.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation.trim() || undefined,
        emergencyContact: {
          name: emergencyContactName.trim() || "",
          phone: emergencyContactPhone.trim() || "",
          relation: emergencyContactRelation.trim() || "",
        },
        discipline,
        beltRank: beltRank.trim(),
        ageDivision,
        weightCategory,
        weightKg: Number(weightKg) || undefined,
        club: club.trim() || "Independent Athlete",
        clubName: club.trim() || "Independent Athlete",
        coachName: coachName.trim() || undefined,
        previousAchievements: previousAchievements.trim() || undefined,
        entryFee: "Free Entry",
        paymentStatus: "Exempt",
        paymentMode: "Direct",
      };

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

      const res = await fetch("/api/championships/applications", {
        method: "POST",
        credentials: "omit",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          ...(safeToken ? { "Authorization": `Bearer ${safeToken}`, "x-member-token": safeToken } : {}),
        },
        body: JSON.stringify({
          ...payload,
          memberToken: safeToken,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.existingAccount) {
          toast.error("Account Already Registered", {
            description: json.error,
            action: {
              label: "Log In",
              onClick: () => {
                router.push("/login?redirect=/championship/register");
              },
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(json.error || "Failed to submit championship application.");
      }

      if (json.user) {
        setUser(json.user, json.token || null);
      }

      setSubmittedApplication(json.application);
      toast.success("Championship registration submitted successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {/* Top Header Hero */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8 bg-gradient-to-b from-card/80 to-background border-b border-border/60">
        <div className="shell max-w-5xl mx-auto space-y-3.5 sm:space-y-4 text-center px-4 sm:px-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-primary max-w-full text-center">
            <Trophy className="size-3.5 shrink-0" />
            <span className="truncate sm:whitespace-normal">Official Federation Championship Registration Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">
            Register For <span className="text-gold-gradient">Championship</span>
          </h1>

          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Submit competitor registration for state and national tournament fixtures. All entries are reviewed by the National Technical Committee before issuing official competitor bibs and championship certificates.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 sm:pt-3 w-full max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => {
                setActiveView("register");
                setSubmittedApplication(null);
              }}
              className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "register"
                  ? "bg-gold-gradient text-background shadow-gold"
                  : "bg-card/70 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="size-3.5 shrink-0" /> New Competitor Registration
            </button>

            <button
              type="button"
              onClick={() => setActiveView("track")}
              className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "track"
                  ? "bg-gold-gradient text-background shadow-gold"
                  : "bg-card/70 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="size-3.5 shrink-0" /> Track Application &amp; Candidate Portal
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="py-6 sm:py-10 md:py-12 bg-background min-h-[60vh]">
        <div className="shell max-w-4xl mx-auto px-4 sm:px-6">
          {/* VIEW 1: SUCCESS CONFIRMATION RECEIPT */}
          {submittedApplication && (
            <div className="luxe-card p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/40 bg-card/60 shadow-2xl space-y-5 sm:space-y-6 animate-fadeIn">
              <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3 pb-5 sm:pb-6 border-b border-border/80">
                <div className="size-14 sm:size-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 grid place-items-center">
                  <CheckCircle2 className="size-7 sm:size-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
                  Registration Received Successfully!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                  Your tournament entry application has been lodged in the federation registry. Please save your Application Tracking ID for future verification.
                </p>
                <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-primary/10 border border-primary/30 max-w-full">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Application ID:
                  </span>
                  <span className="text-sm sm:text-base font-mono font-black text-primary break-all">
                    {submittedApplication.applicationId || submittedApplication.id}
                  </span>
                </div>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Competitor Name</span>
                  <p className="font-bold text-foreground text-sm truncate">{submittedApplication.athleteName || submittedApplication.applicantName}</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Championship Event</span>
                  <p className="font-bold text-foreground line-clamp-1">{submittedApplication.eventName || submittedApplication.eventTitle}</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Discipline &amp; Division</span>
                  <p className="font-bold text-primary line-clamp-1">{submittedApplication.discipline} · {submittedApplication.ageDivision}</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Weight Category</span>
                  <p className="font-bold text-foreground line-clamp-1">{submittedApplication.weightCategory} {submittedApplication.weightKg ? `(${submittedApplication.weightKg} kg)` : ""}</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Club / Academy</span>
                  <p className="font-bold text-foreground truncate">{submittedApplication.club || submittedApplication.clubName || "Independent"}</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-1">
                  <span className="text-muted-foreground block font-semibold text-[11px]">Review Status</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Pending Admin Approval
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
                <Shield className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">What Happens Next?</strong>
                  The National Organizing Committee will review your applicant details. Once approved, your official <strong>Competitor Bib Number</strong> will be assigned, and your registration slip will be confirmed for weigh-in at the tournament arena.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const trackId = submittedApplication.applicationId || submittedApplication.id || submittedApplication.email || "";
                    setSubmittedApplication(null);
                    setActiveView("track");
                    if (trackId) {
                      setTrackQuery(trackId);
                      handleTrackSearch(undefined, trackId);
                    }
                  }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-background font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Search className="size-4 shrink-0" /> Track in Candidate Portal
                </button>
                <button
                  type="button"
                  onClick={() => downloadChampionshipRegistrationReceiptPDF(submittedApplication)}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="size-4 shrink-0" /> Download Competitor Pass (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => printChampionshipRegistrationReceiptPDF(submittedApplication)}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-card border border-border hover:border-primary text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="size-4 text-primary shrink-0" /> Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedApplication(null);
                    setAthleteName("");
                    setPhone("");
                    setEmail("");
                    setAthletePhoto("");
                    setIdProofDocument("");
                  }}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-card border border-border hover:border-primary text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
                >
                  Register Another Competitor
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: REGISTRATION FORM */}
          {/* VIEW 2: REGISTRATION FORM */}
          {!submittedApplication && activeView === "register" && (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
              {/* Event Selector Banner */}
              <div className="luxe-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Trophy className="size-4 shrink-0" /> Target Championship Fixture
                  </span>
                  {selectedEventId && (
                    <span className="text-[11px] font-mono text-muted-foreground bg-background/60 px-3 py-1 rounded-full border border-border">
                      Fixture Code: {selectedEventId}
                    </span>
                  )}
                </div>

                {loadingEvents ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading open tournament fixtures...</span>
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center space-y-2">
                    <p className="text-xs font-bold text-amber-300">
                      No tournament fixtures are currently open for live athlete registration.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Please check back soon or browse scheduled fixtures in our annual competition calendar.
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-3">
                      <Link
                        href="/events/calendar"
                        className="btn-luxe px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Calendar className="size-3.5" /> View Calendar
                      </Link>
                      <Link
                        href="/events/upcoming"
                        className="px-4 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-card inline-flex items-center gap-1"
                      >
                        Upcoming Events
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Select Tournament Event *</label>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} {ev.city ? `(${ev.city})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentEvent && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 text-xs">
                        <div className="p-3 rounded-xl bg-background/50 border border-border/60 flex items-center gap-2.5">
                          <Calendar className="size-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dates</span>
                            <span className="font-semibold text-foreground truncate block">{currentEvent.startDate || "Scheduled Dates"}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-background/50 border border-border/60 flex items-center gap-2.5">
                          <MapPin className="size-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Venue / City</span>
                            <span className="font-semibold text-foreground truncate block">{currentEvent.venue || currentEvent.city || "Official Arena"}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-background/50 border border-border/60 flex items-center gap-2.5">
                          <Swords className="size-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Disciplines</span>
                            <span className="font-semibold text-foreground truncate block">{currentEvent.discipline || "All Martial Arts"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 1. Athlete Personal Credentials */}
              <div className="luxe-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <User className="size-4 text-primary shrink-0" /> 1. Competitor Personal Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Competitor Full Name *</label>
                    <input
                      type="text"
                      value={athleteName}
                      onChange={(e) => setAthleteName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Date of Birth *</label>
                    <input
                      type="date"
                      value={dob}
                      max={maxDobDate}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                      required
                    />
                    {dobError && <p className="text-[11px] text-red-400">{dobError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Calculated Age (Years)</label>
                    <input
                      type="text"
                      value={age !== "" ? `${age} Years` : "Auto-computed from DOB"}
                      readOnly
                      className="w-full bg-background/50 border border-border/80 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Contact Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Contact Mobile Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  {!isAuthenticated ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">Create Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-11 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary font-mono"
                            required={!isAuthenticated}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">Min 6 characters. Auto-creates player account &amp; logs you in.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">Confirm Password *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-11 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary font-mono"
                            required={!isAuthenticated}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Email OTP Verification Field */}
                      <div className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl bg-card/90 border border-primary/35 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <KeyRound className="size-4 text-primary shrink-0" /> Email Verification Code (OTP) *
                          </span>
                          {otpSent && (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="size-3.5 shrink-0" /> OTP dispatched to {email || "your email"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 sm:py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary font-mono tracking-widest text-sm text-center"
                            required={!isAuthenticated}
                          />
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || (otpSent && otpCountdown > 0)}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary/15 border border-primary/40 hover:bg-primary/25 text-primary text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isSendingOtp ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin shrink-0" /> Sending...
                              </>
                            ) : otpCountdown > 0 ? (
                              `Resend in ${otpCountdown}s`
                            ) : otpSent ? (
                              "Resend OTP"
                            ) : (
                              "Send OTP"
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                          Click <strong>Send OTP</strong> to receive a 6-digit code. Verifying your email automatically logs you in as a Player across the site upon submission.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 p-3 sm:p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex items-center gap-3">
                      <BadgeCheck className="size-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-primary block truncate">
                          Logged in as {formatMemberType(user?.memberType) || (user?.role === "admin" ? "Admin" : "Member")}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user?.name} ({user?.email}) · Auto-filled with your saved profile details.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">State Association *</label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">City / District *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-foreground">Residential Postal Address</label>
                  <input
                    type="text"
                    value={residentialAddress}
                    onChange={(e) => setResidentialAddress(e.target.value)}
                    placeholder="Full residential street address, city, pin code"
                    className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* 2. Martial Arts Category & Division */}
              <div className="luxe-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Swords className="size-4 text-primary shrink-0" /> 2. Competition Division &amp; Weight Category
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Martial Arts Discipline *</label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      {CHAMPIONSHIP_DISCIPLINES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Current Belt Rank *</label>
                    <input
                      type="text"
                      value={beltRank}
                      onChange={(e) => setBeltRank(e.target.value)}
                      placeholder="e.g. Black Belt 1st Dan / Brown Belt"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Age Division *</label>
                    <select
                      value={ageDivision}
                      onChange={(e) => setAgeDivision(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="Mighty-Mite (Under 7)">Mighty-Mite (Under 7)</option>
                      <option value="Pee-Wee (Under 10)">Pee-Wee (Under 10)</option>
                      <option value="Junior (Under 13)">Junior (Under 13)</option>
                      <option value="Teen (Under 16)">Teen (Under 16)</option>
                      <option value="Juvenile / Youth (16-17)">Juvenile / Youth (16-17)</option>
                      <option value="Senior Open (18-29)">Senior Open (18-29)</option>
                      <option value="Master 1 (30+)">Master 1 (30+)</option>
                      <option value="Master 2 (36+)">Master 2 (36+)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Weight Division Category *</label>
                    <select
                      value={weightCategory}
                      onChange={(e) => setWeightCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="Open Weight">Open Weight Division</option>
                      <option value="Under 45.0 kg (Flyweight)">Under 45.0 kg (Flyweight)</option>
                      <option value="Under 50.0 kg (Bantamweight)">Under 50.0 kg (Bantamweight)</option>
                      <option value="Under 55.0 kg (Featherweight)">Under 55.0 kg (Featherweight)</option>
                      <option value="Under 60.0 kg (Lightweight)">Under 60.0 kg (Lightweight)</option>
                      <option value="Under 67.0 kg (Welterweight)">Under 67.0 kg (Welterweight)</option>
                      <option value="Under 75.0 kg (Middleweight)">Under 75.0 kg (Middleweight)</option>
                      <option value="Under 84.0 kg (Heavyweight)">Under 84.0 kg (Heavyweight)</option>
                      <option value="Above 84.0 kg (Super Heavyweight)">Above 84.0 kg (Super Heavyweight)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : "")}
                      placeholder="e.g. 58.5"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Academy / Club / Dojo</label>
                    <input
                      type="text"
                      value={club}
                      onChange={(e) => setClub(e.target.value)}
                      placeholder="e.g. Dragon Combat Academy (or Independent)"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Corner Coach / Instructor Name</label>
                    <input
                      type="text"
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      placeholder="e.g. Master Rajesh Shinde"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Previous Tournament Records</label>
                    <input
                      type="text"
                      value={previousAchievements}
                      onChange={(e) => setPreviousAchievements(e.target.value)}
                      placeholder="e.g. Gold in 2025 State Championship"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Emergency Contact & Declarations */}
              <div className="luxe-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-4 sm:space-y-5">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-primary shrink-0" /> 3. Emergency Contact &amp; Athlete Declaration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Parent / Guardian Name"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Relation</label>
                    <select
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="Parent / Guardian">Parent / Guardian</option>
                      <option value="Coach / Instructor">Coach / Instructor</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
                  {/* Hidden Native File Inputs */}
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={idProofInputRef}
                    accept="image/png,image/jpeg,image/webp,image/jpg,.pdf"
                    onChange={handleIdProofUpload}
                    className="hidden"
                  />

                  {/* UPLOAD 1: Passport Photo */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      athletePhoto
                        ? "bg-emerald-950/20 border-emerald-500/50 shadow-sm"
                        : "bg-background/60 border-border/80 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                          Competitor Photo *
                        </span>
                        <p className="text-xs font-bold text-foreground">Competitor Passport Photo</p>
                      </div>
                      {athletePhoto ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check className="size-3 shrink-0" /> Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          Required
                        </span>
                      )}
                    </div>

                    {athletePhoto ? (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/80 border border-emerald-500/30 text-xs">
                          <img
                            src={athletePhoto}
                            alt="Competitor Passport Photo"
                            className="size-11 sm:size-12 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                          />
                          <div className="truncate flex-1 min-w-0">
                            <p className="font-mono text-foreground truncate text-[11px]">
                              {athletePhotoName || "competitor_passport_photo.jpg"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {athletePhotoSize || "Image attached"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocModal({
                                title: "Competitor Passport Photo",
                                docData: athletePhoto,
                                docName: athletePhotoName || "passport_photo.jpg",
                              })
                            }
                            className="flex-1 py-2 sm:py-1.5 rounded-xl bg-card border border-border hover:border-primary/50 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="size-3.5 shrink-0" /> View Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="px-3 py-2 sm:py-1.5 rounded-xl bg-card border border-border hover:border-foreground/40 text-foreground font-bold text-xs transition cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("photo")}
                            className="p-2 sm:p-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full py-3.5 px-4 rounded-xl border border-dashed border-border hover:border-primary bg-background/40 hover:bg-card/80 text-xs text-muted-foreground hover:text-foreground font-semibold transition flex items-center justify-center gap-2.5 group cursor-pointer"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="size-4" />
                          </div>
                          <span className="text-left">
                            <strong className="block text-foreground text-[11px] sm:text-xs">Choose Passport Photo</strong>
                            <span className="text-[10px] text-muted-foreground font-normal">PNG, JPG, WEBP (Max 2MB)</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UPLOAD 2: Age / Aadhaar ID Proof */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      idProofDocument
                        ? "bg-emerald-950/20 border-emerald-500/50 shadow-sm"
                        : "bg-background/60 border-border/80 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                          ID Document *
                        </span>
                        <p className="text-xs font-bold text-foreground">Age / Aadhaar ID Proof</p>
                      </div>
                      {idProofDocument ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check className="size-3 shrink-0" /> Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          Required
                        </span>
                      )}
                    </div>

                    {idProofDocument ? (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/80 border border-emerald-500/30 text-xs">
                          {idProofDocument.startsWith("data:image/") || idProofDocument.startsWith("http") ? (
                            <img
                              src={idProofDocument}
                              alt="ID Proof"
                              className="size-11 sm:size-12 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                            />
                          ) : (
                            <div className="size-11 sm:size-12 rounded-lg bg-emerald-950/40 border border-emerald-500/30 grid place-items-center text-emerald-400 shrink-0">
                              <FileText className="size-5" />
                            </div>
                          )}
                          <div className="truncate flex-1 min-w-0">
                            <p className="font-mono text-foreground truncate text-[11px]">
                              {idProofDocName || "aadhaar_id_proof.pdf"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {idProofDocSize || "Document attached"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocModal({
                                title: "Age / Aadhaar ID Proof",
                                docData: idProofDocument,
                                docName: idProofDocName || "aadhaar_id_proof.pdf",
                              })
                            }
                            className="flex-1 py-2 sm:py-1.5 rounded-xl bg-card border border-border hover:border-primary/50 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="size-3.5 shrink-0" /> View Proof
                          </button>
                          <button
                            type="button"
                            onClick={() => idProofInputRef.current?.click()}
                            className="px-3 py-2 sm:py-1.5 rounded-xl bg-card border border-border hover:border-foreground/40 text-foreground font-bold text-xs transition cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("idProof")}
                            className="p-2 sm:p-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => idProofInputRef.current?.click()}
                          className="w-full py-3.5 px-4 rounded-xl border border-dashed border-border hover:border-primary bg-background/40 hover:bg-card/80 text-xs text-muted-foreground hover:text-foreground font-semibold transition flex items-center justify-center gap-2.5 group cursor-pointer"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="size-4" />
                          </div>
                          <span className="text-left">
                            <strong className="block text-foreground text-[11px] sm:text-xs">Choose Aadhaar / ID File</strong>
                            <span className="text-[10px] text-muted-foreground font-normal">PDF, PNG, JPG (Max 3MB)</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <label className="flex items-start gap-2.5 sm:gap-3 text-xs text-muted-foreground cursor-pointer select-none leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreedToRules}
                      onChange={(e) => setAgreedToRules(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary size-4 shrink-0"
                      required
                    />
                    <span>
                      I hereby declare that all provided competitor details are accurate. I agree to abide by the official rules, anti-doping policies, and safety guidelines established by the KALAWAR Sports &amp; Martial Arts Federation of India.
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <Link
                    href="/events"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center sm:justify-start gap-1.5 py-2 transition-colors"
                  >
                    <ArrowLeft className="size-3.5 shrink-0" /> Back to Events Calendar
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-gold-gradient text-background font-black rounded-full text-xs sm:text-sm uppercase tracking-widest shadow-gold hover:scale-[1.02] sm:hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin shrink-0" /> Submitting Entry...
                      </>
                    ) : (
                      <>
                        <Trophy className="size-4 shrink-0" /> Submit Championship Registration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW 3: CANDIDATE INSTANT TRACKING & DOCUMENT PORTAL */}
          {activeView === "track" && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              {!isAuthenticated ? (
                <div className="max-w-xl mx-auto luxe-card p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-2 border-primary/40 bg-card/70 text-center space-y-5 sm:space-y-6 shadow-2xl">
                  <div className="size-12 sm:size-14 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-gold">
                    <Lock className="size-6 sm:size-7" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground">
                      Candidate Portal Authentication Required
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Please log in with your registered player account to track your championship applications, view competitor bibs, access tournament fixtures, and download official registration slips.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full">
                    <Link
                      href="/login?redirect=/championship/register?view=track"
                      className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gold-gradient text-background text-xs font-bold uppercase tracking-wider shadow-gold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <User className="size-4 shrink-0" /> Log In with Registered Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => setActiveView("register")}
                      className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-secondary/80 border border-border text-foreground hover:border-primary text-xs font-semibold transition cursor-pointer text-center"
                    >
                      New Competitor? Register Now
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header Banner */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      <Search className="size-3.5 shrink-0" /> Candidate Document &amp; Status Portal
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
                      My Championship Registrations
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      Logged in as <strong className="text-primary">{user?.name || user?.email}</strong>. View live tournament registration status, bib numbers, and download official registration slips.
                    </p>
                  </div>

                  {/* Results Display */}
                  {isSearchingTrack ? (
                    <div className="p-8 sm:p-12 text-center space-y-3 bg-card/60 rounded-2xl sm:rounded-3xl border border-border">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">Loading your championship registrations...</p>
                    </div>
                  ) : trackedApplications.length === 0 ? (
                    <div className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-border bg-card/40 text-center space-y-4">
                      <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">No Championship Registrations Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          No active tournament entries found for your account ({user?.email}). Register for an upcoming championship to get your candidate registration slip and official bib number.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView("register")}
                        className="px-5 py-2.5 rounded-xl bg-gold-gradient text-background text-xs font-bold uppercase tracking-wider shadow-gold hover:scale-[1.02] transition-transform inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="size-4 shrink-0" /> Register for Championship Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {trackedApplications.map((app, idx) => (
                        <div
                          key={app.id || app.applicationId || idx}
                          className="luxe-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 space-y-4 sm:space-y-6 shadow-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/60 pb-3.5 sm:pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                  {app.applicationId || app.id}
                                </span>
                                {app.bibNumber ? (
                                  <span className="font-mono text-xs font-black text-amber-400 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                                    BIB: {app.bibNumber}
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs font-bold text-muted-foreground px-2.5 py-0.5 rounded-md bg-accent/40 border border-border">
                                    BIB: Pending Assign
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    app.status?.toLowerCase() === "approved"
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                      : app.status?.toLowerCase() === "rejected"
                                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  }`}
                                >
                                  {app.status?.toLowerCase() === "approved"
                                    ? "Approved Competitor"
                                    : app.status?.toLowerCase() === "rejected"
                                    ? "Application Rejected"
                                    : "Pending Review"}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-foreground mt-1">{app.athleteName || app.applicantName}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1">{app.eventName || app.eventTitle}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => downloadChampionshipRegistrationReceiptPDF(app)}
                                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold text-foreground inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Download className="size-3.5 text-primary shrink-0" /> Slip (PDF)
                              </button>
                              <button
                                type="button"
                                onClick={() => printChampionshipRegistrationReceiptPDF(app)}
                                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold text-foreground inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Printer className="size-3.5 text-primary shrink-0" /> Print
                              </button>
                              {app.certificateNumber && (
                                <Link
                                  href={`/certificates/championship/${encodeURIComponent(app.certificateNumber)}`}
                                  target="_blank"
                                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gold-gradient text-background text-xs font-bold uppercase tracking-wider shadow-gold inline-flex items-center justify-center gap-1.5"
                                >
                                  <Trophy className="size-3.5 shrink-0" /> View Certificate
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Competitor Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                            <div className="p-2.5 sm:p-3 rounded-xl bg-background/50 border border-border/60">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Discipline</span>
                              <p className="font-semibold text-foreground truncate">{app.discipline}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-background/50 border border-border/60">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Division</span>
                              <p className="font-semibold text-foreground truncate">{app.ageDivision}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-background/50 border border-border/60">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Weight</span>
                              <p className="font-semibold text-foreground truncate">{app.weightCategory} {app.weightKg ? `(${app.weightKg}kg)` : ""}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-background/50 border border-border/60">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Club / Dojo</span>
                              <p className="font-semibold text-foreground truncate">{app.club || app.clubName || "Independent"}</p>
                            </div>
                          </div>

                          {/* Result Banner if Published */}
                          {app.podiumPlace && app.podiumPlace !== "None" && (
                            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-3">
                                <Award className="size-6 text-amber-400 shrink-0" />
                                <div>
                                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                                    Championship Result Published
                                  </span>
                                  <p className="text-xs sm:text-sm font-black text-foreground">
                                    🏆 {app.podiumPlace} Winner · {app.awardType || "Official Certificate"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Real Document / Image Preview Modal */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-primary/50 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 sm:size-5 text-primary shrink-0" />
                <h3 className="text-xs sm:text-base font-bold text-foreground truncate max-w-[220px] sm:max-w-md">
                  {previewDocModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="p-1.5 rounded-xl bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
              >
                <X className="size-4 sm:size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-background/80 min-h-[260px] sm:min-h-[300px]">
              {previewDocModal.docData.startsWith("data:image/") ||
              previewDocModal.docData.startsWith("http") ||
              previewDocModal.docData.startsWith("/") ? (
                <img
                  src={previewDocModal.docData}
                  alt={previewDocModal.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : previewDocModal.docData.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewDocModal.docData}
                  title={previewDocModal.title}
                  className="w-full h-[65vh] rounded-xl border border-border"
                />
              ) : (
                <div className="text-center p-6 sm:p-8 text-muted-foreground space-y-2">
                  <FileCheck className="size-10 sm:size-12 text-primary mx-auto" />
                  <p className="font-mono text-xs sm:text-sm text-foreground break-all">{previewDocModal.docName}</p>
                  <p className="text-[11px] sm:text-xs">Document is attached and ready for tournament committee verification.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

export default function ChampionshipRegisterPage() {
  return (
    <Suspense
      fallback={
        <SiteLayout>
          <div className="min-h-[70vh] flex items-center justify-center">
            <RefreshCw className="size-6 animate-spin text-primary" />
          </div>
        </SiteLayout>
      }
    >
      <ChampionshipRegisterContent />
    </Suspense>
  );
}
