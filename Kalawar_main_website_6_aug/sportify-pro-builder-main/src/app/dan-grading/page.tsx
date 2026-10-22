"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Award,
  Calendar,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  CreditCard,
  Download,
  Printer,
  ChevronRight,
  UserCheck,
  Building,
  Upload,
  Layers,
  HelpCircle,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  Trash2,
  FileCheck,
  Image as ImageIcon,
  Lock,
  KeyRound,
  LogOut,
  Smartphone,
  RefreshCw,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import {
  DAN_GRADES,
  type DanGradeLevel,
  type DanExamSession,
  type DanApplication,
  type DanApplicationStatus,
} from "@/data/dan-grading";
import { states } from "@/data/people";
import { jsPDF } from "jspdf";
import { downloadDanDiplomaPDF, downloadDanIDCardPDF } from "@/lib/dan-pdf-download";
import { downloadDanPaymentSlipPDF } from "@/lib/dan-payment-slip";
import { formatMemberType } from "@/lib/utils";

export default function DanGradingPage() {
  // Navigation tabs within page
  const [activeTab, setActiveTab] = useState<"syllabus" | "sessions" | "register" | "tracker" | "verify">("syllabus");

  // Selected Dan rank for syllabus explorer
  const [selectedDan, setSelectedDan] = useState<number>(1);

  // Data
  const [grades, setGrades] = useState<DanGradeLevel[]>(DAN_GRADES);
  const [sessions, setSessions] = useState<DanExamSession[]>([]);
  const [applications, setApplications] = useState<DanApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Razorpay Gateway State
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [pendingSimOrder, setPendingSimOrder] = useState<any>(null);

  // File Input Refs
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const currentCertInputRef = useRef<HTMLInputElement>(null);
  const medicalFitnessInputRef = useRef<HTMLInputElement>(null);
  const thesisInputRef = useRef<HTMLInputElement>(null);
  const paymentProofInputRef = useRef<HTMLInputElement>(null);

  // Document Preview Modal
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    docData: string;
    docName: string;
  } | null>(null);

  // Registration Form State
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [formData, setFormData] = useState({
    athleteId: "",
    fullName: "",
    dob: "",
    gender: "Male" as "Male" | "Female" | "Other",
    email: "",
    phone: "",
    state: "Maharashtra",
    academyName: "",
    currentDanGrade: 0,
    currentBeltTitle: "Brown Belt (1st Gup)",
    appliedDanGrade: 1,
    appliedDanTitle: "1st Dan Black Belt (Sho Dan)",
    previousDanCertNo: "",
    previousDanIssueDate: "",
    previousDanIssuedBy: "KALAWAR Sports & Martial Arts Federation",
    instructorName: "",
    instructorDanGrade: "5th Dan Black Belt",

    // Real Document Uploads (Base64 data URLs)
    aadhaarDoc: "",
    aadhaarDocName: "",
    aadhaarDocSize: "",

    currentCertDoc: "",
    currentCertDocName: "",
    currentCertDocSize: "",

    medicalFitnessDoc: "",
    medicalFitnessDocName: "",
    medicalFitnessDocSize: "",

    thesisDoc: "",
    thesisDocName: "",
    thesisDocSize: "",

    paymentProofDoc: "",
    paymentProofDocName: "",
    paymentProofDocSize: "",

    athletePhoto: "",
    athletePhotoName: "",

    paymentMethod: "Razorpay Online" as "Razorpay Online" | "Cash Verification at Venue",
    paymentStatus: "Paid" as "Paid" | "Cash Verification Required",
    declarationAccepted: false,
  });

  const { user, token, isAuthenticated, setUser, getAuthHeaders } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification State for Dan Grading
  const [danOtpCode, setDanOtpCode] = useState("");
  const [danTempToken, setDanTempToken] = useState("");
  const [isSendingDanOtp, setIsSendingDanOtp] = useState(false);
  const [danOtpSent, setDanOtpSent] = useState(false);
  const [danOtpCountdown, setDanOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (danOtpCountdown > 0) {
      timer = setInterval(() => {
        setDanOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [danOtpCountdown]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredApp, setRegisteredApp] = useState<DanApplication | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Real File Upload Handler using FileReader
  const handleFileUpload = (
    type: "aadhaar" | "currentCert" | "medicalFitness" | "thesis" | "paymentProof",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit. Please upload a file under 2MB.");
      return;
    }

    const formattedSize = formatFileSize(file.size);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      if (type === "aadhaar") {
        setFormData((prev) => ({
          ...prev,
          aadhaarDoc: result,
          aadhaarDocName: file.name,
          aadhaarDocSize: formattedSize,
        }));
        toast.success("Aadhaar / National ID attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "currentCert") {
        setFormData((prev) => ({
          ...prev,
          currentCertDoc: result,
          currentCertDocName: file.name,
          currentCertDocSize: formattedSize,
        }));
        toast.success("Current Belt / Dan Certificate attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "medicalFitness") {
        setFormData((prev) => ({
          ...prev,
          medicalFitnessDoc: result,
          medicalFitnessDocName: file.name,
          medicalFitnessDocSize: formattedSize,
        }));
        toast.success("Medical Fitness Certificate attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "thesis") {
        setFormData((prev) => ({
          ...prev,
          thesisDoc: result,
          thesisDocName: file.name,
          thesisDocSize: formattedSize,
        }));
        toast.success("Master Research Thesis attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "paymentProof") {
        setFormData((prev) => ({
          ...prev,
          paymentProofDoc: result,
          paymentProofDocName: file.name,
          paymentProofDocSize: formattedSize,
        }));
        toast.success("Cash Payment Proof / Deposit Receipt attached!", { description: `${file.name} (${formattedSize})` });
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  const handleFileRemove = (type: "aadhaar" | "currentCert" | "medicalFitness" | "thesis" | "paymentProof") => {
    if (type === "aadhaar") {
      setFormData((prev) => ({ ...prev, aadhaarDoc: "", aadhaarDocName: "", aadhaarDocSize: "" }));
      if (aadhaarInputRef.current) aadhaarInputRef.current.value = "";
      toast.info("Aadhaar document removed.");
    } else if (type === "currentCert") {
      setFormData((prev) => ({ ...prev, currentCertDoc: "", currentCertDocName: "", currentCertDocSize: "" }));
      if (currentCertInputRef.current) currentCertInputRef.current.value = "";
      toast.info("Current belt certificate removed.");
    } else if (type === "medicalFitness") {
      setFormData((prev) => ({ ...prev, medicalFitnessDoc: "", medicalFitnessDocName: "", medicalFitnessDocSize: "" }));
      if (medicalFitnessInputRef.current) medicalFitnessInputRef.current.value = "";
      toast.info("Medical fitness certificate removed.");
    } else if (type === "thesis") {
      setFormData((prev) => ({ ...prev, thesisDoc: "", thesisDocName: "", thesisDocSize: "" }));
      if (thesisInputRef.current) thesisInputRef.current.value = "";
      toast.info("Research thesis removed.");
    } else if (type === "paymentProof") {
      setFormData((prev) => ({ ...prev, paymentProofDoc: "", paymentProofDocName: "", paymentProofDocSize: "" }));
      if (paymentProofInputRef.current) paymentProofInputRef.current.value = "";
      toast.info("Payment proof receipt removed.");
    }
  };

  // Tracker & Candidate Search State
  const [trackerQuery, setTrackerQuery] = useState("");
  const [trackedApp, setTrackedApp] = useState<DanApplication | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackerError, setTrackerError] = useState("");

  // Tracker Document Re-upload State & Refs
  const [reuploadDocs, setReuploadDocs] = useState<{
    aadhaarDoc: string;
    aadhaarDocName: string;
    aadhaarDocSize: string;
    currentCertDoc: string;
    currentCertDocName: string;
    currentCertDocSize: string;
    medicalFitnessDoc: string;
    medicalFitnessDocName: string;
    medicalFitnessDocSize: string;
    thesisDoc: string;
    thesisDocName: string;
    thesisDocSize: string;
    paymentProofDoc: string;
    paymentProofDocName: string;
    paymentProofDocSize: string;
  }>({
    aadhaarDoc: "",
    aadhaarDocName: "",
    aadhaarDocSize: "",
    currentCertDoc: "",
    currentCertDocName: "",
    currentCertDocSize: "",
    medicalFitnessDoc: "",
    medicalFitnessDocName: "",
    medicalFitnessDocSize: "",
    thesisDoc: "",
    thesisDocName: "",
    thesisDocSize: "",
    paymentProofDoc: "",
    paymentProofDocName: "",
    paymentProofDocSize: "",
  });
  const [isSubmittingReupload, setIsSubmittingReupload] = useState(false);

  const reuploadAadhaarRef = useRef<HTMLInputElement>(null);
  const reuploadCurrentCertRef = useRef<HTMLInputElement>(null);
  const reuploadMedicalFitnessRef = useRef<HTMLInputElement>(null);
  const reuploadThesisRef = useRef<HTMLInputElement>(null);
  const reuploadPaymentProofRef = useRef<HTMLInputElement>(null);

  // Verification State
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifiedCert, setVerifiedCert] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Fetch initial data & check URL params
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/dan-grading");
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
          setApplications(data.applications || []);
          if (data.grades && data.grades.length > 0) {
            setGrades(data.grades);
          }
          if (data.sessions && data.sessions.length > 0) {
            setSelectedSessionId(data.sessions[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load Dan grading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Support direct navigation from transactional emails (e.g. ?track=ID&tab=tracker)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const trackParam = params.get("track") || params.get("q");

      if (tabParam === "tracker" || tabParam === "syllabus" || tabParam === "sessions" || tabParam === "register" || tabParam === "verify") {
        setActiveTab(tabParam as any);
      }
      if (trackParam) {
        setTrackerQuery(trackParam);
        setActiveTab("tracker");
        fetch(`/api/dan-grading/verify?q=${encodeURIComponent(trackParam.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.application) {
              setTrackedApp(data.application);
            }
          })
          .catch((err) => console.error("Auto track query error:", err));
      }
    }
  }, []);


  const selectedDanInfo = useMemo(() => {
    return grades.find((d) => d.dan === selectedDan) || grades[0] || DAN_GRADES[0];
  }, [selectedDan, grades]);

  // Derived user Dan applications matching authenticated user profile strictly by Unique User/Athlete ID or Email
  const userDanApplications = useMemo(() => {
    if (!user) return [];
    const queryEmail = (user.email || "").toLowerCase().trim();
    const queryId = (user.id || "").toLowerCase().trim();
    const queryPhone = (user.phone || "").toLowerCase().trim();

    return applications.filter((app) => {
      const appAthleteId = (app.athleteId || "").toLowerCase().trim();
      const appId = (app.id || "").toLowerCase().trim();
      const appEmail = (app.email || "").toLowerCase().trim();
      const appPhone = (app.phone || "").toLowerCase().trim();

      // 1. Primary match: Strict User/Athlete ID or Tracking ID
      if (queryId && (appAthleteId === queryId || appId === queryId)) {
        return true;
      }

      // 2. Secondary match: Strict Registered Email (only if athleteId doesn't conflict)
      if (queryEmail && appEmail && appEmail === queryEmail) {
        if (!appAthleteId || !queryId || appAthleteId === queryId) {
          return true;
        }
      }

      // 3. Tertiary match: Strict Phone (only if athleteId/email do not conflict)
      if (queryPhone && appPhone && appPhone === queryPhone) {
        if ((!appAthleteId || !queryId || appAthleteId === queryId) && (!appEmail || !queryEmail || appEmail === queryEmail)) {
          return true;
        }
      }

      return false;
    });
  }, [applications, user]);

  // Derived user Dan certificates matching authenticated user profile strictly by Unique User/Athlete ID or Email
  const userDanCertificates = useMemo(() => {
    if (!user) return [];
    const queryEmail = (user.email || "").toLowerCase().trim();
    const queryId = (user.id || "").toLowerCase().trim();
    const queryPhone = (user.phone || "").toLowerCase().trim();

    return applications.filter((app) => {
      const isPassedOrIssued = Boolean(app.certificateNumber || app.status === "Passed");
      if (!isPassedOrIssued) return false;

      const appAthleteId = (app.athleteId || "").toLowerCase().trim();
      const appId = (app.id || "").toLowerCase().trim();
      const appEmail = (app.email || "").toLowerCase().trim();
      const appPhone = (app.phone || "").toLowerCase().trim();

      // 1. Primary match: Strict User/Athlete ID or Tracking ID
      if (queryId && (appAthleteId === queryId || appId === queryId)) {
        return true;
      }

      // 2. Secondary match: Strict Registered Email (only if athleteId doesn't conflict)
      if (queryEmail && appEmail && appEmail === queryEmail) {
        if (!appAthleteId || !queryId || appAthleteId === queryId) {
          return true;
        }
      }

      // 3. Tertiary match: Strict Phone (only if athleteId/email do not conflict)
      if (queryPhone && appPhone && appPhone === queryPhone) {
        if ((!appAthleteId || !queryId || appAthleteId === queryId) && (!appEmail || !queryEmail || appEmail === queryEmail)) {
          return true;
        }
      }

      return false;
    });
  }, [applications, user]);

  // Auto-fill form fields when logged-in user visits the page
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        athleteId: user.id || prev.athleteId,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        dob: user.dob || prev.dob,
        gender: (user.gender as "Male" | "Female" | "Other") || prev.gender,
        academyName: user.club || prev.academyName,
        state: user.state || prev.state,
        currentBeltTitle: user.beltRank || prev.currentBeltTitle,
        athletePhoto: user.avatar || prev.athletePhoto,
      }));
    }
  }, [isAuthenticated, user]);

  // Handle Dan Grade Selection in Registration
  const handleAppliedDanChange = (danNumber: number) => {
    const targetDan = grades.find((d) => d.dan === danNumber) || DAN_GRADES.find((d) => d.dan === danNumber) || DAN_GRADES[0];
    let prevTitle = "Brown Belt (1st Gup)";
    if (danNumber > 1) {
      const prevDan = grades.find((d) => d.dan === danNumber - 1) || DAN_GRADES.find((d) => d.dan === danNumber - 1);
      prevTitle = prevDan ? prevDan.rankName : `${danNumber - 1}th Dan Black Belt`;
    }

    setFormData((prev) => ({
      ...prev,
      appliedDanGrade: danNumber,
      appliedDanTitle: targetDan.rankName,
      currentDanGrade: danNumber - 1,
      currentBeltTitle: prevTitle,
    }));
  };

  // Real Backend Registration Submitter
  const doSubmitRegistration = async (overrideParams: {
    paymentStatus: "Paid" | "Cash Verification Required";
    paymentMethod: "Razorpay Online" | "Cash Verification at Venue";
    transactionId?: string;
  }) => {
    try {
      setIsSubmitting(true);

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

      const appliedDanObj =
        grades.find((d) => d.dan === formData.appliedDanGrade) ||
        DAN_GRADES.find((d) => d.dan === formData.appliedDanGrade);

      const payload = {
        examId: selectedSessionId || undefined,
        athleteId: formData.athleteId,
        fullName: formData.fullName,
        dob: formData.dob || "2000-01-01",
        gender: formData.gender,
        email: formData.email || "athlete@kalawar.org",
        phone: formData.phone,
        state: formData.state,
        academyName: formData.academyName || "Independent Dojang",
        currentDanGrade: formData.currentDanGrade,
        currentBeltTitle: formData.currentBeltTitle,
        appliedDanGrade: formData.appliedDanGrade,
        appliedDanTitle: formData.appliedDanTitle,
        previousDanCertNo: formData.previousDanCertNo,
        previousDanIssueDate: formData.previousDanIssueDate,
        previousDanIssuedBy: formData.previousDanIssuedBy,
        instructorName: formData.instructorName || "Master Instructor",
        instructorDanGrade: formData.instructorDanGrade,
        aadhaarDoc: formData.aadhaarDoc || undefined,
        aadhaarDocName: formData.aadhaarDoc ? (formData.aadhaarDocName || "aadhaar_verified.pdf") : undefined,
        currentCertDoc: formData.currentCertDoc || undefined,
        currentCertDocName: formData.currentCertDoc ? (formData.currentCertDocName || "current_belt_cert.pdf") : undefined,
        medicalFitnessDoc: formData.medicalFitnessDoc || undefined,
        medicalFitnessDocName: formData.medicalFitnessDoc ? (formData.medicalFitnessDocName || "medical_fitness.pdf") : undefined,
        thesisDoc: formData.thesisDoc || undefined,
        thesisDocName: formData.thesisDoc ? formData.thesisDocName : undefined,
        paymentProofDoc: formData.paymentProofDoc || undefined,
        paymentProofDocName: formData.paymentProofDoc ? formData.paymentProofDocName : undefined,
        paymentProofDocSize: formData.paymentProofDoc ? formData.paymentProofDocSize : undefined,
        paymentStatus: overrideParams.paymentStatus,
        paymentMethod: overrideParams.paymentMethod,
        transactionId: overrideParams.transactionId,
        paymentAmount: appliedDanObj?.fee !== undefined ? appliedDanObj.fee : 3500,
        declarationAccepted: true,
        password: password || undefined,
        confirmPassword: confirmPassword || undefined,
        otpCode: danOtpCode.trim() || undefined,
        tempToken: danTempToken || undefined,
        memberToken: safeToken,
      };

      const res = await fetch("/api/dan-grading/register", {
        method: "POST",
        credentials: "omit",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          ...(safeToken ? { "Authorization": `Bearer ${safeToken}`, "x-member-token": safeToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.application) {
        if (data.user) {
          setUser(data.user, data.token || null);
        }
        setRegisteredApp(data.application);
        setApplications((prev) => [data.application, ...prev]);
        setShowSuccessModal(true);
        toast.success("Dan Examination Application Submitted Successfully!");
      } else if (data.existingAccount) {
        toast.error("Account Already Exists", {
          description: data.error || "An account with this email is already registered. Please log in first to continue.",
          action: {
            label: "Log In",
            onClick: () => {
              window.location.href = "/login?redirect=/dan-grading?tab=register";
            },
          },
        });
      } else {
        toast.error(data.error || "Failed to submit application.");
      }
    } catch (err) {
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Registration 2FA OTP for Dan Grading
  const handleSendDanOtp = async () => {
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid candidate email address first.");
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error("Please enter candidate full name first.");
      return;
    }

    try {
      setIsSendingDanOtp(true);
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), name: formData.fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409) {
          toast.error("Account Already Registered", {
            description: data.error,
            action: {
              label: "Log In",
              onClick: () => {
                window.location.href = "/login?redirect=/dan-grading?tab=register";
              },
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setDanTempToken(data.tempToken || "");
      setDanOtpSent(true);
      setDanOtpCountdown(60);
      toast.success("Verification Code Sent!", {
        description: `A 6-digit verification code has been dispatched to ${data.maskedEmail || formData.email.trim()}.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingDanOtp(false);
    }
  };

  // Handle Dan Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter candidate full name.");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter a contact phone number.");
      return;
    }

    if (!isAuthenticated) {
      if (!password || password.length < 6) {
        toast.error("Please enter a password of at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match. Please verify.");
        return;
      }
      if (!danOtpCode || danOtpCode.trim().length < 6) {
        if (!danOtpSent) {
          toast.info("Please request and enter your 6-digit Email Verification Code (OTP).");
          handleSendDanOtp();
        } else {
          toast.error("Please enter the 6-digit verification code (OTP) sent to your email.");
        }
        return;
      }
    }

    const appliedDanObj =
      grades.find((d) => d.dan === formData.appliedDanGrade) ||
      DAN_GRADES.find((d) => d.dan === formData.appliedDanGrade);

    if (appliedDanObj?.aadhaarRequired && !formData.aadhaarDoc) {
      toast.error("Please upload Aadhaar / National ID document before submitting.");
      return;
    }

    if (appliedDanObj?.currentCertRequired && !formData.currentCertDoc) {
      toast.error("Please upload Current Belt / Dan Certificate before submitting.");
      return;
    }

    if (appliedDanObj?.medicalFitnessRequired && !formData.medicalFitnessDoc) {
      toast.error("Please upload Medical & Physical Fitness Certificate before submitting.");
      return;
    }

    if (appliedDanObj?.theoryThesisRequired && !formData.thesisDoc) {
      toast.error("Please upload Master Research Thesis / Dissertation document before submitting.");
      return;
    }

    if (!formData.declarationAccepted) {
      toast.error("Please accept the Medical Fitness and Martial Arts Code Declaration.");
      return;
    }

    await doSubmitRegistration({
      paymentStatus: "Paid",
      paymentMethod: "Razorpay Online",
      transactionId: `REG-${Date.now()}`,
    });
  };

  const handleSimulatedPaymentSuccess = async () => {
    setSimModalOpen(false);
    await doSubmitRegistration({
      paymentStatus: "Paid",
      paymentMethod: "Razorpay Online",
      transactionId: `pay_sim_${Date.now()}`,
    });
  };

  // Derive effective certificate for display
  const effectiveCert = useMemo(() => {
    if (verifiedCert) return verifiedCert;
    if (trackedApp && (trackedApp.status === "Passed" || trackedApp.certificateNumber)) {
      return {
        certificateNumber: trackedApp.certificateNumber || `KAC-DAN-2026-${trackedApp.id?.split("-").pop() || "8386"}`,
        idCardNumber: trackedApp.idCardNumber || `KAC-DAN-ID-${trackedApp.certificateNumber?.split("-").pop() || "8386"}`,
        candidateName: trackedApp.fullName,
        athleteId: trackedApp.athleteId,
        danRank: trackedApp.appliedDanGrade,
        danRankTitle: trackedApp.appliedDanTitle,
        japaneseTitle: "Master",
        koreanTitle: "Sahbum-nim",
        discipline: "Kalawar Martial Arts & Combat Sports",
        academyName: trackedApp.academyName,
        state: trackedApp.state,
        photoUrl: trackedApp.athletePhoto,
        dob: trackedApp.dob || "N/A",
        issueDate: trackedApp.certificateIssuedDate || trackedApp.appliedDate || "2026-09-04",
        examDate: trackedApp.examDate || "2026-09-28",
        grade: "Passed",
        presidentName: "Mr. Santosh Kasbe",
        presidentRole: "Founder & President – India",
      };
    }
    return null;
  }, [verifiedCert, trackedApp]);

  // Sync certificate when trackedApp becomes available
  useEffect(() => {
    if (!verifiedCert && trackedApp && (trackedApp.status === "Passed" || trackedApp.certificateNumber)) {
      const idToFetch = trackedApp.certificateNumber || trackedApp.athleteId;
      if (idToFetch) {
        fetch(`/api/certificates/dan/${encodeURIComponent(idToFetch)}`)
          .then((res) => res.json())
          .then((cData) => {
            if (cData.success && cData.certificate) {
              setVerifiedCert(cData.certificate);
            }
          })
          .catch(() => {});
      }
    }
  }, [trackedApp, verifiedCert]);

  // Direct Certificate & ID Card Action Handler (Direct PDF download & view without OTP)
  const handleProtectedCertAction = (
    action: "view-diploma" | "download-diploma" | "view-card" | "download-card",
    cert: any
  ) => {
    if (!cert) return;
    if (!isAuthenticated) {
      toast.error("Authentication Required", {
        description: "Please log in with your player account to download or view official credentials.",
        action: {
          label: "Log In",
          onClick: () => {
            window.location.href = "/login?redirect=/dan-grading?tab=verify";
          },
        },
      });
      return;
    }
    if (action === "view-diploma") {
      window.open(`/certificates/dan/${cert.certificateNumber}`, "_blank");
    } else if (action === "download-diploma") {
      downloadDanDiplomaPDF(cert);
    } else if (action === "view-card") {
      window.open(`/id-cards/dan/${cert.certificateNumber}`, "_blank");
    } else if (action === "download-card") {
      downloadDanIDCardPDF(cert);
    }
  };

  // Handle Application Tracker Search
  const handleTrackApplication = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = (overrideQuery !== undefined ? overrideQuery : trackerQuery).trim();
    if (!q) return;

    try {
      setIsTracking(true);
      setTrackerError("");
      setTrackedApp(null);

      const res = await fetch(`/api/dan-grading/verify?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.success && data.application) {
        setTrackedApp(data.application);
        if (data.certificate) {
          setVerifiedCert(data.certificate);
        } else if (data.application.certificateNumber || data.application.status === "Passed") {
          fetch(`/api/certificates/dan/${encodeURIComponent(data.application.certificateNumber || data.application.athleteId)}`)
            .then((res) => res.json())
            .then((cData) => {
              if (cData.success && cData.certificate) {
                setVerifiedCert(cData.certificate);
              }
            })
            .catch(() => {});
        }
      } else if (data.success && data.certificate) {
        setVerifiedCert(data.certificate);
        // Find corresponding application
        const found = applications.find(
          (a) =>
            (data.certificate.certificateNumber && a.certificateNumber === data.certificate.certificateNumber) ||
            (data.certificate.athleteId && a.athleteId?.toLowerCase() === data.certificate.athleteId?.toLowerCase()) ||
            a.id?.toLowerCase() === q.toLowerCase()
        );
        if (found) {
          setTrackedApp(found);
        } else {
          setTrackedApp({
            id: data.certificate.certificateNumber,
            athleteId: data.certificate.athleteId,
            fullName: data.certificate.candidateName,
            dob: data.certificate.dob || "N/A",
            gender: "Male",
            email: data.certificate.email || "verified@kalawar.org",
            phone: "+91 70833 14435",
            state: data.certificate.state,
            academyName: data.certificate.academyName,
            currentDanGrade: data.certificate.danRank - 1,
            currentBeltTitle: `${data.certificate.danRank - 1}th Dan`,
            appliedDanGrade: data.certificate.danRank,
            appliedDanTitle: data.certificate.danRankTitle,
            instructorName: "Technical Committee",
            instructorDanGrade: "Master",
            paymentStatus: "Paid",
            paymentMethod: "Razorpay Online",
            paymentAmount: 3500,
            declarationAccepted: true,
            appliedDate: data.certificate.issueDate,
            status: "Passed",
            attendance: "Present",
            certificateNumber: data.certificate.certificateNumber,
            certificateIssuedDate: data.certificate.issueDate,
            idCardNumber: data.certificate.idCardNumber,
          });
        }
      } else {
        setTrackerError(data.error || "No Dan Examination application or credential found for the given ID.");
      }
    } catch (err) {
      setTrackerError("Failed to track application. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  // Re-upload Document File Handler
  const handleReuploadFile = (
    type: "aadhaar" | "currentCert" | "medicalFitness" | "thesis" | "paymentProof",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit. Please upload a file under 2MB.");
      return;
    }

    const formattedSize = formatFileSize(file.size);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      if (type === "aadhaar") {
        setReuploadDocs((prev) => ({
          ...prev,
          aadhaarDoc: result,
          aadhaarDocName: file.name,
          aadhaarDocSize: formattedSize,
        }));
        toast.success("Aadhaar / National ID attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "currentCert") {
        setReuploadDocs((prev) => ({
          ...prev,
          currentCertDoc: result,
          currentCertDocName: file.name,
          currentCertDocSize: formattedSize,
        }));
        toast.success("Current Belt / Dan Certificate attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "medicalFitness") {
        setReuploadDocs((prev) => ({
          ...prev,
          medicalFitnessDoc: result,
          medicalFitnessDocName: file.name,
          medicalFitnessDocSize: formattedSize,
        }));
        toast.success("Medical Fitness Certificate attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "thesis") {
        setReuploadDocs((prev) => ({
          ...prev,
          thesisDoc: result,
          thesisDocName: file.name,
          thesisDocSize: formattedSize,
        }));
        toast.success("Master Research Thesis attached!", { description: `${file.name} (${formattedSize})` });
      } else if (type === "paymentProof") {
        setReuploadDocs((prev) => ({
          ...prev,
          paymentProofDoc: result,
          paymentProofDocName: file.name,
          paymentProofDocSize: formattedSize,
        }));
        toast.success("Payment Proof receipt attached!", { description: `${file.name} (${formattedSize})` });
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveReuploadDoc = (
    type: "aadhaar" | "currentCert" | "medicalFitness" | "thesis" | "paymentProof"
  ) => {
    if (type === "aadhaar") {
      setReuploadDocs((prev) => ({ ...prev, aadhaarDoc: "", aadhaarDocName: "", aadhaarDocSize: "" }));
      if (reuploadAadhaarRef.current) reuploadAadhaarRef.current.value = "";
      toast.info("Aadhaar document removed.");
    } else if (type === "currentCert") {
      setReuploadDocs((prev) => ({ ...prev, currentCertDoc: "", currentCertDocName: "", currentCertDocSize: "" }));
      if (reuploadCurrentCertRef.current) reuploadCurrentCertRef.current.value = "";
      toast.info("Current belt certificate removed.");
    } else if (type === "medicalFitness") {
      setReuploadDocs((prev) => ({ ...prev, medicalFitnessDoc: "", medicalFitnessDocName: "", medicalFitnessDocSize: "" }));
      if (reuploadMedicalFitnessRef.current) reuploadMedicalFitnessRef.current.value = "";
      toast.info("Medical fitness certificate removed.");
    } else if (type === "thesis") {
      setReuploadDocs((prev) => ({ ...prev, thesisDoc: "", thesisDocName: "", thesisDocSize: "" }));
      if (reuploadThesisRef.current) reuploadThesisRef.current.value = "";
      toast.info("Research thesis removed.");
    } else if (type === "paymentProof") {
      setReuploadDocs((prev) => ({ ...prev, paymentProofDoc: "", paymentProofDocName: "", paymentProofDocSize: "" }));
      if (reuploadPaymentProofRef.current) reuploadPaymentProofRef.current.value = "";
      toast.info("Payment proof receipt removed.");
    }
  };

  const handleSubmitReuploadDocs = async () => {
    if (!trackedApp) return;

    const hasAnyDoc =
      reuploadDocs.aadhaarDoc ||
      reuploadDocs.currentCertDoc ||
      reuploadDocs.medicalFitnessDoc ||
      reuploadDocs.thesisDoc ||
      reuploadDocs.paymentProofDoc;

    if (!hasAnyDoc) {
      toast.error("Please attach at least one updated document to submit.");
      return;
    }

    try {
      setIsSubmittingReupload(true);
      const res = await fetch("/api/dan-grading/update-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: trackedApp.id,
          ...reuploadDocs,
        }),
      });

      const data = await res.json();
      if (data.success && data.application) {
        toast.success("Documents submitted successfully!", {
          description: "Your application is now Under Verification for Technical Committee re-review.",
        });
        setTrackedApp(data.application);
        // Reset reupload files
        setReuploadDocs({
          aadhaarDoc: "",
          aadhaarDocName: "",
          aadhaarDocSize: "",
          currentCertDoc: "",
          currentCertDocName: "",
          currentCertDocSize: "",
          medicalFitnessDoc: "",
          medicalFitnessDocName: "",
          medicalFitnessDocSize: "",
          thesisDoc: "",
          thesisDocName: "",
          thesisDocSize: "",
          paymentProofDoc: "",
          paymentProofDocName: "",
          paymentProofDocSize: "",
        });
      } else {
        toast.error(data.error || "Failed to submit updated documents.");
      }
    } catch (err: any) {
      console.error("Re-upload error:", err);
      toast.error("Failed to submit documents. Please try again.");
    } finally {
      setIsSubmittingReupload(false);
    }
  };

  // Handle Verification Search
  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyQuery.trim()) return;

    try {
      setIsVerifying(true);
      setVerifyError("");
      setVerifiedCert(null);

      const res = await fetch(`/api/dan-grading/verify?q=${encodeURIComponent(verifyQuery.trim())}`);
      const data = await res.json();

      if (data.success && data.certificate) {
        setVerifiedCert(data.certificate);
      } else {
        setVerifyError("No verified Black Belt / Dan Diploma found matching this credential number.");
      }
    } catch (err) {
      setVerifyError("Verification query failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Payment Confirmation Slip PDF Download for Dan Candidate
  const handleDownloadPaymentSlip = async (app: DanApplication) => {
    await downloadDanPaymentSlipPDF(app);
  };

  // Admit Card PDF Download for Dan Candidate
  const handleDownloadAdmitCard = (app: DanApplication) => {
    if (
      !app.admitCardIssued &&
      app.status !== "Eligible" &&
      app.status !== "Exam Scheduled" &&
      app.status !== "Passed" &&
      app.status !== "Exam Completed"
    ) {
      toast.error(
        "Admit Card Pending: Your application is under Technical Committee review. Admit Card will be unlocked once approved with Exam Date & Venue."
      );
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;

      // Dark Header & Outer border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setFillColor(18, 20, 26);
      doc.rect(12, 12, pageWidth - 24, 38, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(212, 175, 55);
      doc.text("KALAWAR SPORTS & MARTIAL ARTS FEDERATION", pageWidth / 2, 24, { align: "center" });

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 205, 215);
      doc.text("National Black Belt Council & Dan Examination Board", pageWidth / 2, 30, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL DAN EXAMINATION ADMIT CARD", pageWidth / 2, 42, { align: "center" });

      // Application & Candidate Box
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.5);
      doc.roundedRect(16, 56, pageWidth - 32, 78, 3, 3, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 45, 55);
      doc.text(`APPLICATION TRACKING ID: ${app.id}`, 22, 66);
      doc.text(`STATUS: ${app.status.toUpperCase()}`, pageWidth - 22, 66, { align: "right" });

      doc.setDrawColor(220, 220, 225);
      doc.line(22, 70, pageWidth - 22, 70);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 20, 30);
      doc.text(`Candidate Name: ${app.fullName}`, 22, 78);
      doc.text(`Athlete ID: ${app.athleteId}`, pageWidth / 2 + 10, 78);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(70, 75, 85);
      doc.text(`Current Rank: ${app.currentBeltTitle}`, 22, 86);
      doc.text(`Applied Dan Rank: ${app.appliedDanTitle}`, pageWidth / 2 + 10, 86);

      doc.text(`Academy / Dojang: ${app.academyName}`, 22, 94);
      doc.text(`State: ${app.state}`, pageWidth / 2 + 10, 94);

      // Confirmed Exam Schedule Highlight
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 110, 20);
      doc.text(`Date of Examination: ${app.examDate || "Scheduled Date"}`, 22, 102);
      doc.text(`Reporting Time: ${app.examTime || "07:30 AM"}`, pageWidth / 2 + 10, 102);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 75, 85);
      doc.text(`Venue Address: ${app.examVenue || "Federation National Combat Arena, Maharashtra"}`, 22, 110, { maxWidth: pageWidth - 44 });
      doc.text(`Instructor / Master: ${app.instructorName} (${app.instructorDanGrade})`, 22, 126);

      // Examination Instructions Box
      doc.setFillColor(254, 252, 240);
      doc.setDrawColor(212, 175, 55);
      doc.roundedRect(16, 140, pageWidth - 32, 90, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(160, 110, 20);
      doc.text("EXAMINATION MANDATES & BOARD INSTRUCTIONS", 22, 150);

      const instructions = [
        "1. Candidate must report in full white Dobok / Uniform with current belt 45 minutes before schedule.",
        "2. Mandatory submission of original Aadhaar Card and 2 recent passport-size color photographs.",
        "3. Candidates applying for 4th Dan & above must bring 2 printed spiral-bound copies of their Research Thesis.",
        "4. Full sparring protective gear (Headgear, Chest Guard, Shin & Forearm Guards, Mouthguard) is compulsory.",
        "5. Wood breaking boards and demolition materials will be verified by the Technical Marshall at 08:00 AM.",
        "6. Dan Diploma and Smart Wallet ID Card will be conferred following Technical Committee sign-off.",
      ];

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 55, 65);
      instructions.forEach((ins, idx) => {
        doc.text(ins, 22, 160 + idx * 10);
      });

      // Signatures
      const sigY = 250;
      doc.setDrawColor(160, 160, 170);
      doc.line(26, sigY, 86, sigY);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 45, 55);
      doc.text("Candidate Signature", 56, sigY + 6, { align: "center" });

      doc.line(pageWidth - 86, sigY, pageWidth - 26, sigY);
      doc.text("MR. SANTOSH KASBE", pageWidth - 56, sigY + 6, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Founder & President – India", pageWidth - 56, sigY + 11, { align: "center" });
      doc.text("Head – Technical Committee", pageWidth - 56, sigY + 15, { align: "center" });

      doc.save(`${app.id}_DAN_ADMIT_CARD.pdf`);
      toast.success("Dan Examination Admit Card downloaded successfully!");
    } catch (err) {
      console.error("Admit Card PDF failed:", err);
      toast.error("Failed to generate Admit Card PDF.");
    }
  };

  return (
    <SiteLayout>
      {/* Official Razorpay Payment Gateway Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-[#07080a] text-stone-100">
        {/* HERO SECTION (Calibrated with top navbar clearance) */}
        <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-stone-800">
          <div className="absolute inset-0 bg-radial-gold opacity-15 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto text-center space-y-4 sm:space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Official Black Belt &amp; Dan Grading System
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase">
              KALAWAR <span className="text-amber-400">BLACK BELT &amp; DAN GRADING</span>
            </h1>

            <p className="text-xs sm:text-base lg:text-xl text-stone-300 max-w-3xl mx-auto font-light leading-relaxed">
              "Advanced Rank, Black Belt Examination &amp; Dan Certification System"
            </p>

            {/* Badges / Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-400 pt-2 sm:pt-3 max-w-3xl mx-auto">
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" /> 1st Dan to 10th Dan Ranks
              </span>
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm">
                <Award className="w-4 h-4 text-amber-400 shrink-0" /> Authorized by Mr. Santosh Kasbe
              </span>
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0" /> Smart Wallet Dan ID Card
              </span>
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Career Belt History Sync
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row items-center justify-center gap-1.5 sm:gap-2 pt-6 sm:pt-8 max-w-3xl mx-auto">
              {[
                { key: "syllabus", label: "Dan Grades & Syllabus", icon: BookOpen },
                { key: "sessions", label: "Exam Sessions", icon: Calendar },
                { key: "register", label: "Online Dan Registration", icon: Award },
                { key: "tracker", label: "Track Application", icon: Search },
                { key: "verify", label: "Verify Credential", icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                      active
                        ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 font-black"
                        : "bg-stone-900/90 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* TAB 1: DAN SYLLABUS & ELIGIBILITY EXPLORER */}
        {activeTab === "syllabus" && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                1st Dan to 10th Dan Technical Syllabus &amp; Criteria
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-2xl mx-auto leading-relaxed">
                Explore comprehensive grading standards, time-in-grade prerequisites, combat requirements, breaking tests, and thesis mandates.
              </p>
            </div>

            {/* Dan Level Selector Buttons (5 cols on mobile, 10 on desktop) */}
            <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 sm:gap-2">
              {grades.map((d) => {
                const active = selectedDan === d.dan;
                return (
                  <button
                    key={d.dan}
                    onClick={() => setSelectedDan(d.dan)}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 sm:gap-1 cursor-pointer ${
                      active
                        ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10 scale-[1.02]"
                        : "bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black">{d.dan}</span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">
                      {d.dan === 1 ? "1st Dan" : d.dan === 2 ? "2nd Dan" : d.dan === 3 ? "3rd Dan" : `${d.dan}th Dan`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Dan Card */}
            <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 shadow-2xl shadow-black/80">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 sm:pb-6">
                <div>
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                      RANK {selectedDanInfo.dan}
                    </span>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                      {selectedDanInfo.rankName}
                    </h3>
                  </div>
                  {selectedDanInfo.designation && (
                    <p className="text-xs sm:text-sm font-semibold text-amber-300/80 mt-1">
                      {selectedDanInfo.designation}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      handleAppliedDanChange(selectedDanInfo.dan);
                      setActiveTab("register");
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition text-center justify-center cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Apply for {selectedDanInfo.dan === 1 ? "1st Dan" : `${selectedDanInfo.dan}th Dan`} →
                  </button>
                </div>
              </div>

              {/* Prerequisites Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-stone-900/90 border border-stone-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl space-y-1">
                  <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Min Training Period</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {selectedDanInfo.minTrainingYears} Years Continuous
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">
                    Min {selectedDanInfo.timeInPreviousGradeYears} yrs in previous grade
                  </p>
                </div>

                <div className="bg-stone-900/90 border border-stone-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl space-y-1">
                  <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Minimum Age</p>
                  <p className="text-sm sm:text-base font-bold text-white">{selectedDanInfo.minAge}+ Years Old</p>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">As per national statutory guidelines</p>
                </div>

                <div className="bg-stone-900/90 border border-stone-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl space-y-1">
                  <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Belt Regalia</p>
                  <p className="text-sm sm:text-base font-bold text-amber-400">{selectedDanInfo.beltColor}</p>
                  <p className="text-[10px] sm:text-[11px] text-stone-400">Official Federation Certified Belt</p>
                </div>
              </div>

              {/* Technical Modules Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Dan Degree Patterns */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase">
                    <Sparkles className="w-4 h-4 shrink-0" /> 1. DAN DEGREE PATTERNS
                  </div>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs text-stone-300">
                    {selectedDanInfo.kataForms.map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Sparring */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> 2. Combat Sparring / Kumite
                  </div>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs text-stone-300">
                    {selectedDanInfo.sparringRequirements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Self Defense & Weapons */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase">
                    <Layers className="w-4 h-4 shrink-0" /> 3. Self Defense &amp; Weaponry
                  </div>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs text-stone-300">
                    {selectedDanInfo.selfDefenseWeapons.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Breaking / Kyokpa */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase">
                    <Award className="w-4 h-4 shrink-0" /> 4. Power &amp; Target Breaking
                  </div>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs text-stone-300">
                    {selectedDanInfo.breakingRequirements.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Thesis Requirement Banner (if applicable) */}
              {selectedDanInfo.theoryThesisRequired && selectedDanInfo.thesisTopic && (
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm uppercase">
                    <FileText className="w-4 h-4 shrink-0" /> Mandatory Master Research Thesis
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed font-mono">
                    {selectedDanInfo.thesisTopic}
                  </p>
                </div>
              )}

              {/* Technical Committee Note */}
              <div className="border-t border-stone-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-stone-400">
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  Technical Committee Approval by <strong>Mr. Santosh Kasbe</strong>
                </span>
                <span className="italic">{selectedDanInfo.eligibilityNotes}</span>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: EXAM SESSIONS */}
        {activeTab === "sessions" && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                Upcoming Dan Examination Schedule
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
                Official national and zonal black belt grading sessions ratified by the Technical Committee.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-[#0e1017] border border-stone-800 hover:border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 transition shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase font-mono">
                          {sess.id}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{sess.title}</h3>
                        <p className="text-xs text-amber-400/90">{sess.discipline}</p>
                      </div>

                      <span
                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${
                          sess.status === "Registration Open"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-stone-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{sess.examDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{sess.reportingTime} – {sess.examEndTime}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{sess.venueName}, {sess.venueAddress}, {sess.city}</span>
                      </div>
                    </div>

                    {/* Chief Examiner */}
                    <div className="bg-stone-900/80 border border-stone-800 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">Chief Examiner</p>
                      <p className="font-bold text-white">{sess.chiefExaminer}</p>
                      <p className="text-[11px] text-amber-400/80">{sess.chiefExaminerRank}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-stone-800/80">
                    <span className="text-xs text-stone-400">
                      Deadline: <strong className="text-white">{sess.registrationDeadline}</strong>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedSessionId(sess.id);
                        setActiveTab("register");
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition text-center justify-center cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      Register for this Exam →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: ONLINE DAN REGISTRATION */}
        {activeTab === "register" && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                Online Black Belt &amp; Dan Registration
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
                Submit official credentials for Dan examination, document verification, and master grading.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 shadow-2xl">
              {/* 1. Target Dan Grade & Session */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  1. Dan Examination Level &amp; Session
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Applying for Dan Rank *</label>
                    <select
                      value={formData.appliedDanGrade}
                      onChange={(e) => handleAppliedDanChange(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {grades.map((d) => (
                        <option key={d.dan} value={d.dan}>
                          {d.rankName} {d.designation ? `(${d.designation})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Target Exam Session</label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.examDate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Candidate Personal Details */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  2. Candidate Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Candidate Full Name"
                      required
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {!isAuthenticated ? (
                    <>
                      <div>
                        <label className="text-xs text-stone-400 block mb-1">Create Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required={!isAuthenticated}
                            minLength={6}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">Min 6 characters. Auto-creates player account &amp; logs you in.</p>
                      </div>

                      <div>
                        <label className="text-xs text-stone-400 block mb-1">Confirm Password *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required={!isAuthenticated}
                            minLength={6}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Email OTP Verification Section */}
                      <div className="sm:col-span-2 lg:col-span-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-950 border border-amber-500/40 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" /> Email Verification Code (OTP) *
                          </span>
                          {danOtpSent && (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> OTP sent to {formData.email || "candidate email"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            maxLength={6}
                            value={danOtpCode}
                            onChange={(e) => setDanOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full sm:flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 font-mono tracking-widest text-center focus:outline-none focus:border-amber-400"
                            required={!isAuthenticated}
                          />
                          <button
                            type="button"
                            onClick={handleSendDanOtp}
                            disabled={isSendingDanOtp || (danOtpSent && danOtpCountdown > 0)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-400 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isSendingDanOtp ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                              </>
                            ) : danOtpCountdown > 0 ? (
                              `Resend in ${danOtpCountdown}s`
                            ) : danOtpSent ? (
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
                    </>
                  ) : (
                    <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-400 block">
                          Logged in as {formatMemberType(user?.memberType) || (user?.role === "admin" ? "Admin" : "Member")}
                        </span>
                        <p className="text-[11px] text-stone-400">
                          {user?.name} ({user?.email}) · This Dan registration will automatically be linked to your account.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">State Association</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-stone-400 block mb-1">Academy / Dojang Name</label>
                    <input
                      type="text"
                      value={formData.academyName}
                      onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                      placeholder="e.g. Pune Warriors Dojang"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Current Belt / Dan</label>
                    <input
                      type="text"
                      value={formData.currentBeltTitle}
                      onChange={(e) => setFormData({ ...formData, currentBeltTitle: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Previous Dan & Instructor Details */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  3. Previous Belt / Dan Credentials &amp; Master
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Previous Cert No (if Dan)</label>
                    <input
                      type="text"
                      value={formData.previousDanCertNo}
                      onChange={(e) => setFormData({ ...formData, previousDanCertNo: e.target.value })}
                      placeholder="e.g. KAC-DAN-2024-0412"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Instructor / Master Name</label>
                    <input
                      type="text"
                      value={formData.instructorName}
                      onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                      placeholder="e.g. Master Ashish Doiphode"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Instructor Dan Rank</label>
                    <input
                      type="text"
                      value={formData.instructorDanGrade}
                      onChange={(e) => setFormData({ ...formData, instructorDanGrade: e.target.value })}
                      placeholder="e.g. 5th Dan Black Belt"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

                {/* 4. Verification Documents (Dynamic Mandatory / Optional) */}
                {(() => {
                  const currentDanObj =
                    grades.find((d) => d.dan === formData.appliedDanGrade) ||
                    DAN_GRADES.find((d) => d.dan === formData.appliedDanGrade);
                  const isAadhaarMandatory = !!currentDanObj?.aadhaarRequired;
                  const isCurrentCertMandatory = !!currentDanObj?.currentCertRequired;
                  const isMedicalFitnessMandatory = !!currentDanObj?.medicalFitnessRequired;
                  const isThesisMandatory = !!currentDanObj?.theoryThesisRequired;

                  return (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 shrink-0" /> 4. Candidate Verification Documents
                        </h4>
                        <span className="text-[11px] text-stone-400">PDF, PNG, JPG (Max 2MB each)</span>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        type="file"
                        ref={aadhaarInputRef}
                        onChange={(e) => handleFileUpload("aadhaar", e)}
                        accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={currentCertInputRef}
                        onChange={(e) => handleFileUpload("currentCert", e)}
                        accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={medicalFitnessInputRef}
                        onChange={(e) => handleFileUpload("medicalFitness", e)}
                        accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={thesisInputRef}
                        onChange={(e) => handleFileUpload("thesis", e)}
                        accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* DOC 1: Aadhaar */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                            formData.aadhaarDoc
                              ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                              : isAadhaarMandatory
                              ? "bg-amber-950/20 border-amber-500/40"
                              : "bg-stone-900/60 border-stone-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                Document 1 • {isAadhaarMandatory ? "Mandatory *" : "Optional"}
                              </span>
                              <p className="text-xs font-bold text-white">Aadhaar / National ID / Passport</p>
                            </div>
                            {formData.aadhaarDoc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Check className="w-3 h-3" /> Attached
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isAadhaarMandatory
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-stone-800 text-stone-400"
                                }`}
                              >
                                {isAadhaarMandatory ? "Required" : "Optional"}
                              </span>
                            )}
                          </div>

                          {formData.aadhaarDoc ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-emerald-500/30 text-xs">
                                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="truncate flex-1">
                                  <p className="font-mono text-white truncate text-[11px]">{formData.aadhaarDocName}</p>
                                  <p className="text-[10px] text-stone-400">{formData.aadhaarDocSize || "Attached file"}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocModal({
                                      title: "Aadhaar / National ID Proof",
                                      docData: formData.aadhaarDoc,
                                      docName: formData.aadhaarDocName,
                                    })
                                  }
                                  className="flex-1 min-w-[90px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => aadhaarInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFileRemove("aadhaar")}
                                  className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => aadhaarInputRef.current?.click()}
                                className="w-full py-3 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900/80 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                <Upload className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
                                <span className="truncate">Choose Aadhaar / Passport File</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* DOC 2: Current Belt / Dan Certificate */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                            formData.currentCertDoc
                              ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                              : isCurrentCertMandatory
                              ? "bg-amber-950/20 border-amber-500/40"
                              : "bg-stone-900/60 border-stone-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                Document 2 • {isCurrentCertMandatory ? "Mandatory *" : "Optional"}
                              </span>
                              <p className="text-xs font-bold text-white">Current Belt / Dan Certificate</p>
                            </div>
                            {formData.currentCertDoc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Check className="w-3 h-3" /> Attached
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isCurrentCertMandatory
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-stone-800 text-stone-400"
                                }`}
                              >
                                {isCurrentCertMandatory ? "Required" : "Optional"}
                              </span>
                            )}
                          </div>

                          {formData.currentCertDoc ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-emerald-500/30 text-xs">
                                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="truncate flex-1">
                                  <p className="font-mono text-white truncate text-[11px]">{formData.currentCertDocName}</p>
                                  <p className="text-[10px] text-stone-400">{formData.currentCertDocSize || "Attached file"}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocModal({
                                      title: "Current Belt / Dan Certificate",
                                      docData: formData.currentCertDoc,
                                      docName: formData.currentCertDocName,
                                    })
                                  }
                                  className="flex-1 min-w-[90px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => currentCertInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFileRemove("currentCert")}
                                  className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => currentCertInputRef.current?.click()}
                                className="w-full py-3 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900/80 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                <Upload className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
                                <span className="truncate">Choose Belt / Dan Certificate</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* DOC 3: Medical & Physical Fitness Certificate */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                            formData.medicalFitnessDoc
                              ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                              : isMedicalFitnessMandatory
                              ? "bg-amber-950/20 border-amber-500/40"
                              : "bg-stone-900/60 border-stone-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                Document 3 • {isMedicalFitnessMandatory ? "Mandatory *" : "Optional"}
                              </span>
                              <p className="text-xs font-bold text-white">Medical &amp; Physical Fitness Cert</p>
                            </div>
                            {formData.medicalFitnessDoc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Check className="w-3 h-3" /> Attached
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isMedicalFitnessMandatory
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-stone-800 text-stone-400"
                                }`}
                              >
                                {isMedicalFitnessMandatory ? "Required" : "Optional"}
                              </span>
                            )}
                          </div>

                          {formData.medicalFitnessDoc ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-emerald-500/30 text-xs">
                                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="truncate flex-1">
                                  <p className="font-mono text-white truncate text-[11px]">{formData.medicalFitnessDocName}</p>
                                  <p className="text-[10px] text-stone-400">{formData.medicalFitnessDocSize || "Attached file"}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocModal({
                                      title: "Medical & Physical Fitness Certificate",
                                      docData: formData.medicalFitnessDoc,
                                      docName: formData.medicalFitnessDocName,
                                    })
                                  }
                                  className="flex-1 min-w-[90px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => medicalFitnessInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFileRemove("medicalFitness")}
                                  className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => medicalFitnessInputRef.current?.click()}
                                className="w-full py-3 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900/80 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                <Upload className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
                                <span className="truncate">Choose Medical Fitness Certificate</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* DOC 4: Master Thesis / Research */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                            formData.thesisDoc
                              ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                              : isThesisMandatory
                              ? "bg-amber-950/20 border-amber-500/40"
                              : "bg-stone-900/60 border-stone-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                Master Thesis • {isThesisMandatory ? "Mandatory *" : "Optional"}
                              </span>
                              <p className="text-xs font-bold text-white">Master Thesis / Dissertation</p>
                            </div>
                            {formData.thesisDoc ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Check className="w-3 h-3" /> Attached
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isThesisMandatory
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-stone-800 text-stone-400"
                                }`}
                              >
                                {isThesisMandatory ? "Required" : "Optional"}
                              </span>
                            )}
                          </div>

                          {formData.thesisDoc ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-emerald-500/30 text-xs">
                                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="truncate flex-1">
                                  <p className="font-mono text-white truncate text-[11px]">{formData.thesisDocName}</p>
                                  <p className="text-[10px] text-stone-400">{formData.thesisDocSize || "Attached file"}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocModal({
                                      title: "Master Research Thesis",
                                      docData: formData.thesisDoc,
                                      docName: formData.thesisDocName,
                                    })
                                  }
                                  className="flex-1 min-w-[90px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => thesisInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFileRemove("thesis")}
                                  className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => thesisInputRef.current?.click()}
                                className="w-full py-3 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900/80 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                <Upload className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
                                <span className="truncate">Choose Research Thesis PDF</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* 5. Medical Declaration & Confirmation */}
              <div className="p-3.5 sm:p-4 bg-stone-900/90 border border-stone-800 rounded-xl sm:rounded-2xl space-y-3">
                <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer text-xs text-stone-300 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                    className="mt-1 rounded text-amber-500 shrink-0"
                  />
                  <span>
                    I solemnly declare that I am physically fit to undergo the vigorous technical, sparring, and breaking assessments of the KALAWAR Dan Examination. I agree to abide by the statutory code of ethics and Technical Committee decisions.
                  </span>
                </label>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 border-t border-stone-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )}
                  Confirm Registration
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 4: TRACK APPLICATION & CANDIDATE PORTAL */}
        {activeTab === "tracker" && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            {!isAuthenticated ? (
              <div className="max-w-xl mx-auto bg-[#0e1017] border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-center space-y-5 sm:space-y-6 shadow-2xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-white">
                    Candidate Portal Authentication Required
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                    Please log in with your registered player account to track your Dan grading application, view candidate admit cards, upload compliance documents, and download official Black Belt credentials.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                  <Link
                    href="/login?redirect=/dan-grading?tab=tracker"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" /> Log In with Registered Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 hover:border-amber-400 text-xs font-bold transition cursor-pointer"
                  >
                    New Dan Candidate? Register Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1.5 sm:space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> Candidate Document Center &amp; Live Tracker
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                    My Dan Grading Applications
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
                    Logged in as <strong className="text-amber-400">{user?.name || user?.email}</strong>. View your live Dan examination status, admit cards, confirmation slips, and candidate documents.
                  </p>
                </div>

                {userDanApplications.length === 0 ? (
                  <div className="bg-[#0e1017] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-center space-y-4 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white uppercase">No Dan Grading Applications Found</h3>
                      <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                        No Black Belt or Dan grading applications were found for your registered account ({user?.email}). Register for an upcoming Dan examination session to track your application, download admit cards, and receive credentials.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" /> Register for Dan Grading Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {userDanApplications.map((trackedApp) => (
                      <div key={trackedApp.id} className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-stone-800 pb-4">
                          <div>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              APPLICATION: {trackedApp.id}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white uppercase">{trackedApp.fullName}</h3>
                            <p className="text-xs text-stone-400">
                              ID: {trackedApp.athleteId} • {trackedApp.appliedDanTitle}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <span className="inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              {trackedApp.status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Pipeline */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-stone-400">Grading Lifecycle Progress</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-[11px] text-center font-bold">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300">
                              1. Submitted
                            </div>
                            <div className={`p-2 sm:p-2.5 rounded-xl border ${
                              trackedApp.status !== "Submitted"
                                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                                : "bg-stone-900 border-stone-800 text-stone-500"
                            }`}>
                              2. Verified
                            </div>
                            <div className={`p-2 sm:p-2.5 rounded-xl border ${
                              trackedApp.status === "Passed" || trackedApp.status === "Exam Completed" || trackedApp.status === "Eligible"
                                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                                : "bg-stone-900 border-stone-800 text-stone-500"
                            }`}>
                              3. Exam
                            </div>
                            <div className={`p-2 sm:p-2.5 rounded-xl border ${
                              trackedApp.status === "Passed"
                                ? "bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                                : "bg-stone-900 border-stone-800 text-stone-500"
                            }`}>
                              4. Result / Cert
                            </div>
                          </div>
                        </div>

                        {/* Documents Required Action Alert */}
                        {trackedApp.status === "Documents Required" && (
                          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/70 via-stone-900 to-rose-950/40 border-2 border-amber-500 shadow-2xl space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                                  Action Required • Technical Committee Review
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-white uppercase">
                                  Additional / Updated Documents Requested
                                </h4>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/40 text-xs text-stone-200 space-y-1">
                              <p className="font-bold text-amber-400">Technical Board Remarks &amp; Instructions:</p>
                              <p className="text-stone-300 whitespace-pre-wrap leading-relaxed">
                                {trackedApp.adminVerificationRemarks || "Please attach the requested verification documents below so the Technical Committee can re-evaluate and approve your application."}
                              </p>
                            </div>

                            <p className="text-xs text-stone-300 leading-relaxed">
                              Please upload the updated or missing document files below and click <strong>&quot;Submit Updated Documents for Re-verification&quot;</strong>.
                            </p>
                          </div>
                        )}

                        {/* Technical Committee Note (when not in Documents Required) */}
                        {trackedApp.status !== "Documents Required" && trackedApp.adminVerificationRemarks && (
                          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-900 border border-stone-800 text-xs text-stone-300 space-y-1">
                            <p className="font-bold text-amber-400">Technical Committee Note:</p>
                            <p className="leading-relaxed">{trackedApp.adminVerificationRemarks}</p>
                          </div>
                        )}

                        {/* Candidate Document Re-upload & Verification Center (ONLY shown when Admin requests more docs) */}
                        {trackedApp.status === "Documents Required" && (
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-amber-500/80 bg-[#0f131d] shadow-xl shadow-amber-500/10 space-y-4 sm:space-y-5 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-stone-800 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                                  <FileCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                                    Verification Documents
                                  </span>
                                  <h4 className="text-sm font-bold text-white uppercase">
                                    Candidate Document Center &amp; Re-upload
                                  </h4>
                                </div>
                              </div>

                              <span className="text-[11px] text-stone-400 font-mono">
                                PDF, PNG, JPG (Max 2MB each)
                              </span>
                            </div>

                            {/* Hidden Re-upload File Inputs */}
                            <input
                              type="file"
                              ref={reuploadAadhaarRef}
                              onChange={(e) => handleReuploadFile("aadhaar", e)}
                              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                            />
                            <input
                              type="file"
                              ref={reuploadCurrentCertRef}
                              onChange={(e) => handleReuploadFile("currentCert", e)}
                              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                            />
                            <input
                              type="file"
                              ref={reuploadMedicalFitnessRef}
                              onChange={(e) => handleReuploadFile("medicalFitness", e)}
                              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                            />
                            <input
                              type="file"
                              ref={reuploadThesisRef}
                              onChange={(e) => handleReuploadFile("thesis", e)}
                              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                            />
                            <input
                              type="file"
                              ref={reuploadPaymentProofRef}
                              onChange={(e) => handleReuploadFile("paymentProof", e)}
                              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {/* DOC 1: Aadhaar / National ID */}
                              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                                reuploadDocs.aadhaarDoc
                                  ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                                  : trackedApp.aadhaarDoc
                                  ? "bg-stone-900/70 border-stone-700/80"
                                  : "bg-stone-900/40 border-stone-800"
                              }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                      Doc 1 • Identification
                                    </span>
                                    <p className="text-xs font-bold text-white">Aadhaar / Passport / National ID</p>
                                  </div>
                                  {reuploadDocs.aadhaarDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      <Check className="w-3 h-3" /> New File Attached
                                    </span>
                                  ) : trackedApp.aadhaarDoc ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                      ✓ On File
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/30 shrink-0">
                                      Missing
                                    </span>
                                  )}
                                </div>

                                {reuploadDocs.aadhaarDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs">
                                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-white truncate text-[11px]">{reuploadDocs.aadhaarDocName}</p>
                                        <p className="text-[10px] text-stone-400">{reuploadDocs.aadhaarDocSize}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Aadhaar / National ID Proof",
                                          docData: reuploadDocs.aadhaarDoc,
                                          docName: reuploadDocs.aadhaarDocName,
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadAadhaarRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReuploadDoc("aadhaar")}
                                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : trackedApp.aadhaarDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-stone-300 truncate text-[11px]">{trackedApp.aadhaarDocName || "aadhaar_verified.pdf"}</p>
                                        <p className="text-[10px] text-stone-500">Document on federation server</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Aadhaar / National ID Proof",
                                          docData: trackedApp.aadhaarDoc || "",
                                          docName: trackedApp.aadhaarDocName || "aadhaar.pdf",
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Existing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadAadhaarRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Re-upload New
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => reuploadAadhaarRef.current?.click()}
                                      className="w-full py-2.5 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="truncate">Upload Aadhaar / Passport</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* DOC 2: Current Belt / Dan Certificate */}
                              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                                reuploadDocs.currentCertDoc
                                  ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                                  : trackedApp.currentCertDoc
                                  ? "bg-stone-900/70 border-stone-700/80"
                                  : "bg-stone-900/40 border-stone-800"
                              }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                      Doc 2 • Belt Credential
                                    </span>
                                    <p className="text-xs font-bold text-white">Current Belt / Dan Certificate</p>
                                  </div>
                                  {reuploadDocs.currentCertDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      <Check className="w-3 h-3" /> New File Attached
                                    </span>
                                  ) : trackedApp.currentCertDoc ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                      ✓ On File
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/30 shrink-0">
                                      Missing
                                    </span>
                                  )}
                                </div>

                                {reuploadDocs.currentCertDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs">
                                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-white truncate text-[11px]">{reuploadDocs.currentCertDocName}</p>
                                        <p className="text-[10px] text-stone-400">{reuploadDocs.currentCertDocSize}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Current Belt / Dan Certificate",
                                          docData: reuploadDocs.currentCertDoc,
                                          docName: reuploadDocs.currentCertDocName,
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadCurrentCertRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReuploadDoc("currentCert")}
                                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : trackedApp.currentCertDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-stone-300 truncate text-[11px]">{trackedApp.currentCertDocName || "current_belt_cert.pdf"}</p>
                                        <p className="text-[10px] text-stone-500">Document on federation server</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Current Belt / Dan Certificate",
                                          docData: trackedApp.currentCertDoc || "",
                                          docName: trackedApp.currentCertDocName || "current_belt_cert.pdf",
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Existing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadCurrentCertRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Re-upload New
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => reuploadCurrentCertRef.current?.click()}
                                      className="w-full py-2.5 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="truncate">Upload Current Belt Certificate</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* DOC 3: Medical & Physical Fitness Certificate */}
                              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                                reuploadDocs.medicalFitnessDoc
                                  ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                                  : trackedApp.medicalFitnessDoc
                                  ? "bg-stone-900/70 border-stone-700/80"
                                  : "bg-stone-900/40 border-stone-800"
                              }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                      Doc 3 • Medical Fitness
                                    </span>
                                    <p className="text-xs font-bold text-white">Medical &amp; Physical Fitness Certificate</p>
                                  </div>
                                  {reuploadDocs.medicalFitnessDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      <Check className="w-3 h-3" /> New File Attached
                                    </span>
                                  ) : trackedApp.medicalFitnessDoc ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                      ✓ On File
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/30 shrink-0">
                                      Missing
                                    </span>
                                  )}
                                </div>

                                {reuploadDocs.medicalFitnessDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs">
                                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-white truncate text-[11px]">{reuploadDocs.medicalFitnessDocName}</p>
                                        <p className="text-[10px] text-stone-400">{reuploadDocs.medicalFitnessDocSize}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Medical Fitness Certificate",
                                          docData: reuploadDocs.medicalFitnessDoc,
                                          docName: reuploadDocs.medicalFitnessDocName,
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadMedicalFitnessRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReuploadDoc("medicalFitness")}
                                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : trackedApp.medicalFitnessDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-stone-300 truncate text-[11px]">{trackedApp.medicalFitnessDocName || "medical_fitness.pdf"}</p>
                                        <p className="text-[10px] text-stone-500">Document on federation server</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Medical Fitness Certificate",
                                          docData: trackedApp.medicalFitnessDoc || "",
                                          docName: trackedApp.medicalFitnessDocName || "medical_fitness.pdf",
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Existing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadMedicalFitnessRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Re-upload New
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => reuploadMedicalFitnessRef.current?.click()}
                                      className="w-full py-2.5 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="truncate">Upload Medical Certificate</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* DOC 4: Master Research Thesis */}
                              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                                reuploadDocs.thesisDoc
                                  ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                                  : trackedApp.thesisDoc
                                  ? "bg-stone-900/70 border-stone-700/80"
                                  : "bg-stone-900/40 border-stone-800"
                              }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                      Doc 4 • Technical Research
                                    </span>
                                    <p className="text-xs font-bold text-white">Master Research Thesis (4th Dan+)</p>
                                  </div>
                                  {reuploadDocs.thesisDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      <Check className="w-3 h-3" /> New File Attached
                                    </span>
                                  ) : trackedApp.thesisDoc ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                      ✓ On File
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-500 shrink-0">
                                      If 4th Dan+
                                    </span>
                                  )}
                                </div>

                                {reuploadDocs.thesisDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs">
                                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-white truncate text-[11px]">{reuploadDocs.thesisDocName}</p>
                                        <p className="text-[10px] text-stone-400">{reuploadDocs.thesisDocSize}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Master Research Thesis",
                                          docData: reuploadDocs.thesisDoc,
                                          docName: reuploadDocs.thesisDocName,
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadThesisRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReuploadDoc("thesis")}
                                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : trackedApp.thesisDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-stone-300 truncate text-[11px]">{trackedApp.thesisDocName || "thesis_paper.pdf"}</p>
                                        <p className="text-[10px] text-stone-500">Document on federation server</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Master Research Thesis",
                                          docData: trackedApp.thesisDoc || "",
                                          docName: trackedApp.thesisDocName || "thesis_paper.pdf",
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Existing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadThesisRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Re-upload New
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => reuploadThesisRef.current?.click()}
                                      className="w-full py-2.5 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="truncate">Upload Research Thesis</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* DOC 5: Cash / Bank Payment Proof */}
                              <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all sm:col-span-2 ${
                                reuploadDocs.paymentProofDoc
                                  ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                                  : trackedApp.paymentProofDoc
                                  ? "bg-stone-900/70 border-stone-700/80"
                                  : "bg-stone-900/40 border-stone-800"
                              }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                      Doc 5 • Additional Verification
                                    </span>
                                    <p className="text-xs font-bold text-white">Registration Proof / Endorsement Receipt</p>
                                  </div>
                                  {reuploadDocs.paymentProofDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      <Check className="w-3 h-3" /> New File Attached
                                    </span>
                                  ) : trackedApp.paymentProofDoc ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                      ✓ On File
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-500 shrink-0">
                                      If Applicable
                                    </span>
                                  )}
                                </div>

                                {reuploadDocs.paymentProofDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs">
                                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-white truncate text-[11px]">{reuploadDocs.paymentProofDocName}</p>
                                        <p className="text-[10px] text-stone-400">{reuploadDocs.paymentProofDocSize}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Payment Deposit Proof / Receipt",
                                          docData: reuploadDocs.paymentProofDoc,
                                          docName: reuploadDocs.paymentProofDocName,
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadPaymentProofRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReuploadDoc("paymentProof")}
                                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : trackedApp.paymentProofDoc ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs">
                                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                      <div className="truncate flex-1">
                                        <p className="font-mono text-stone-300 truncate text-[11px]">{trackedApp.paymentProofDocName || "payment_proof_receipt.png"}</p>
                                        <p className="text-[10px] text-stone-500">Document on federation server</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          title: "Payment Deposit Proof / Receipt",
                                          docData: trackedApp.paymentProofDoc || "",
                                          docName: trackedApp.paymentProofDocName || "payment_proof.png",
                                        })}
                                        className="flex-1 min-w-[70px] py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View Existing
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => reuploadPaymentProofRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> Re-upload New
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => reuploadPaymentProofRef.current?.click()}
                                      className="w-full py-2.5 rounded-xl border border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-xs text-stone-300 hover:text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="truncate">Upload Payment Receipt / Deposit Slip</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Submit Updated Documents Button */}
                            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t border-stone-800">
                              <p className="text-xs text-stone-400 leading-relaxed">
                                Attaching updated files and clicking submit will immediately notify the Technical Committee and update your status to <strong>Under Verification</strong>.
                              </p>
                              <button
                                type="button"
                                onClick={handleSubmitReuploadDocs}
                                disabled={isSubmittingReupload || (!reuploadDocs.aadhaarDoc && !reuploadDocs.currentCertDoc && !reuploadDocs.medicalFitnessDoc && !reuploadDocs.thesisDoc && !reuploadDocs.paymentProofDoc)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                              >
                                {isSubmittingReupload ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                                    Submitting Updated Documents...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 text-stone-950" />
                                    Submit Updated Documents for Re-verification
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Result Card (if Passed) */}
                        {trackedApp.status === "Passed" && trackedApp.certificateNumber && (
                          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-950/30 border border-amber-500/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                                Official Black Belt Credential Issued!
                              </p>
                              <p className="text-sm font-black text-white">
                                Cert No: {trackedApp.certificateNumber}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/certificates/dan/${encodeURIComponent(trackedApp.certificateNumber)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition text-center"
                              >
                                View Diploma →
                              </Link>
                              <button
                                type="button"
                                onClick={() => downloadDanDiplomaPDF(trackedApp)}
                                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Download PDF
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 1. Official Registration Confirmation Slip Card */}
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#121622] via-[#0d1017] to-[#121622] border-2 border-amber-500/40 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-stone-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                  Official Confirmation Slip
                                </span>
                                <h4 className="text-sm font-bold text-white uppercase">
                                  Registration Confirmation Slip
                                </h4>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono self-start sm:self-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ REGISTRATION CONFIRMED
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Registration Status</p>
                              <p className="font-bold text-emerald-400 text-sm mt-0.5">
                                ✓ Registered
                              </p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Tracking ID</p>
                              <p className="font-mono font-bold text-white truncate mt-0.5">{trackedApp.id}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Athlete ID</p>
                              <p className="font-mono font-bold text-white mt-0.5">{trackedApp.athleteId}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Registration Date</p>
                              <p className="font-bold text-stone-200 mt-0.5">{trackedApp.appliedDate || "2026-09-04"}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Current Rank</p>
                              <p className="font-bold text-stone-200 mt-0.5">{trackedApp.currentBeltTitle}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Applied Dan Rank</p>
                              <p className="font-bold text-amber-300 mt-0.5">{trackedApp.appliedDanTitle}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">Academy / Dojang</p>
                              <p className="font-bold text-stone-200 truncate mt-0.5">{trackedApp.academyName}</p>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                              <p className="text-[10px] text-stone-400">State / Region</p>
                              <p className="font-bold text-stone-200 mt-0.5">{trackedApp.state}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                            <p className="text-[11px] text-stone-400">
                              Instructor / Master: <strong className="text-stone-200">{trackedApp.instructorName} ({trackedApp.instructorDanGrade})</strong>
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDownloadPaymentSlip(trackedApp)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Registration Confirmation Slip (PDF)
                            </button>
                          </div>
                        </div>

                        {/* 2. Admit Card & Examination Scheduling Card */}
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0b0d13] border-2 border-stone-800 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-stone-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                trackedApp.admitCardIssued && (trackedApp.status === "Eligible" || trackedApp.status === "Exam Scheduled" || trackedApp.status === "Passed")
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                  : "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                              }`}>
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                  Hall Ticket
                                </span>
                                <h4 className="text-sm font-bold text-white uppercase">
                                  Official Dan Examination Admit Card
                                </h4>
                              </div>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                              trackedApp.admitCardIssued && (trackedApp.status === "Eligible" || trackedApp.status === "Exam Scheduled" || trackedApp.status === "Passed")
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-stone-800 text-stone-400 border border-stone-700"
                            }`}>
                              {trackedApp.admitCardIssued && (trackedApp.status === "Eligible" || trackedApp.status === "Exam Scheduled" || trackedApp.status === "Passed")
                                ? "✓ ADMIT CARD ISSUED"
                                : "🔒 ADMIT CARD PENDING"}
                            </span>
                          </div>

                          {trackedApp.admitCardIssued && (trackedApp.status === "Eligible" || trackedApp.status === "Exam Scheduled" || trackedApp.status === "Passed") ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                                <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                                  <p className="text-[10px] text-stone-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-amber-400 shrink-0" /> Confirmed Exam Date
                                  </p>
                                  <p className="font-bold text-white mt-1 text-sm font-mono">
                                    {trackedApp.examDate || "Scheduled Date"}
                                  </p>
                                </div>
                                <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                                  <p className="text-[10px] text-stone-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" /> Reporting Time
                                  </p>
                                  <p className="font-bold text-white mt-1 text-sm font-mono">
                                    {trackedApp.examTime || "07:30 AM Sharp"}
                                  </p>
                                </div>
                                <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 sm:col-span-1">
                                  <p className="text-[10px] text-stone-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" /> Examination Venue
                                  </p>
                                  <p className="font-bold text-stone-200 mt-1 text-xs truncate">
                                    {trackedApp.examVenue || "Federation Combat Center, Maharashtra"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
                                <p className="text-xs text-stone-400 leading-relaxed">
                                  Your admit card has been officially issued by the Technical Board. Please bring a printed copy to the venue.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAdmitCard(trackedApp)}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 hover:from-amber-400 hover:to-amber-300 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-stone-950" /> Download Admit Card PDF
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 sm:space-y-3">
                              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span>Admit Card Pending Technical Committee Review &amp; Scheduling</span>
                              </div>
                              <p className="text-xs text-stone-300 leading-relaxed">
                                Your registration and Payment Confirmation Slip are recorded. The Federation Technical Examination Board is currently reviewing your application and credentials. Once the board assigns your <strong>Mandatory Date of Exam</strong> and <strong>Examination Venue Address</strong> and approves your candidate profile, your Admit Card will be unlocked here and dispatched directly to <strong>{trackedApp.email}</strong>.
                              </p>
                              <div className="pt-1">
                                <button
                                  disabled
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed"
                                >
                                  🔒 Admit Card Pending Exam Scheduling &amp; Approval
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}


        {/* TAB 5: PUBLIC VERIFICATION & REGISTRY */}
        {activeTab === "verify" && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            {!isAuthenticated ? (
              <div className="max-w-xl mx-auto bg-[#0e1017] border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-center space-y-5 sm:space-y-6 shadow-2xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-white">
                    Credential Authentication Required
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                    Please log in with your registered player account to view your official Black Belt credentials, Dan diplomas, and smart wallet ID cards.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                  <Link
                    href="/login?redirect=/dan-grading?tab=verify"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" /> Log In with Registered Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 hover:border-amber-400 text-xs font-bold transition cursor-pointer"
                  >
                    New Dan Candidate? Register Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1.5 sm:space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Official Dan Credential Registry &amp; Verification
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wide">
                    My Black Belt &amp; Dan Credentials
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                    Authenticated Dan Diploma credentials and high-rank Black Belt accreditation for <strong className="text-amber-400">{user?.name || user?.email}</strong>.
                  </p>
                </div>

                {userDanCertificates.length === 0 ? (
                  <div className="bg-[#0e1017] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-center space-y-4 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white uppercase">No Dan Diplomas Issued Yet</h3>
                      <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                        No official Black Belt credentials or Dan Diplomas have been conferred for your account yet. Complete your Dan examination session to have your diploma and smart ID card verified and issued here.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab("tracker")}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 hover:border-amber-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-amber-400" /> View Examination Applications
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" /> Register for Dan Grading
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {userDanCertificates.map((cert) => (
                      <div key={cert.certificateNumber || cert.id} className="bg-[#0e1017] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl animate-fadeIn">
                        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                              ✓ Authenticated Dan Credential
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white uppercase">{cert.fullName}</h3>
                            <p className="text-xs text-amber-400 font-semibold">{cert.appliedDanTitle}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Certificate No</p>
                            <p className="font-mono font-bold text-white mt-0.5 truncate">{cert.certificateNumber}</p>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Athlete ID</p>
                            <p className="font-mono font-bold text-white mt-0.5 truncate">{cert.athleteId}</p>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Date of Birth</p>
                            <p className="font-mono font-bold text-white mt-0.5">{cert.dob || "—"}</p>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Academy</p>
                            <p className="font-bold text-white mt-0.5 truncate">{cert.academyName || "—"}</p>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Awarded Grade</p>
                            <p className="font-bold text-amber-400 mt-0.5">{cert.status === "Passed" ? "Passed" : cert.status}</p>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 sm:p-3 rounded-xl border border-stone-800">
                            <p className="text-[10px] text-stone-400">Issue Date</p>
                            <p className="font-bold text-white mt-0.5">{cert.certificateIssuedDate || cert.appliedDate || "2026-09-04"}</p>
                          </div>
                        </div>

                        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-xs">
                          <div>
                            <p className="text-stone-400">Authorized Signatory:</p>
                            <p className="font-bold text-white">Mr. Santosh Kasbe</p>
                            <p className="text-[11px] text-amber-400/80">Founder &amp; President – India</p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Link
                              href={`/certificates/dan/${encodeURIComponent(cert.certificateNumber || "")}`}
                              target="_blank"
                              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Diploma →
                            </Link>
                            <button
                              type="button"
                              onClick={() => downloadDanDiplomaPDF(cert)}
                              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Download PDF
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-amber-300">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Want to access Admit Card, Payment Confirmation Slip, or track application status?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("tracker")}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" /> Open Application Tracker
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* DOCUMENT PREVIEW MODAL */}
        {previewDocModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#0e1017] border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-3xl w-full max-h-[90vh] h-[85vh] flex flex-col shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3 sm:mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase truncate">{previewDocModal.title}</h3>
                  <p className="text-[11px] sm:text-xs text-stone-400 font-mono truncate max-w-md">{previewDocModal.docName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDocModal.docData}
                    download={previewDocModal.docName}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span>
                  </a>
                  <button
                    onClick={() => setPreviewDocModal(null)}
                    className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-stone-950 rounded-xl sm:rounded-2xl border border-stone-800 p-2 overflow-hidden flex items-center justify-center">
                {previewDocModal.docData.startsWith("data:image/") ||
                previewDocModal.docData.endsWith(".png") ||
                previewDocModal.docData.endsWith(".jpg") ||
                previewDocModal.docData.endsWith(".jpeg") ? (
                  <img
                    src={previewDocModal.docData}
                    alt={previewDocModal.title}
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                ) : previewDocModal.docData.startsWith("data:application/pdf") ||
                  previewDocModal.docData.endsWith(".pdf") ? (
                  <iframe
                    src={previewDocModal.docData}
                    title={previewDocModal.title}
                    className="w-full h-full rounded-xl bg-white"
                  />
                ) : (
                  <div className="text-center p-6 sm:p-8 space-y-3">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mx-auto" />
                    <p className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md mx-auto">{previewDocModal.docName}</p>
                    <p className="text-xs text-stone-400">Attached file preview is ready.</p>
                    <a
                      href={previewDocModal.docData}
                      download={previewDocModal.docName}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition"
                    >
                      <Download className="w-4 h-4" /> Download Attached File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RAZORPAY SANDBOX / TEST SIMULATION MODAL */}
        {simModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#0e1017] border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full space-y-5 sm:space-y-6 shadow-2xl relative">
              <button
                onClick={() => {
                  setSimModalOpen(false);
                  setIsSubmitting(false);
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1.5 sm:space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white uppercase">Candidate Registration Checkout</h3>
                <p className="text-xs text-stone-400">
                  Instant candidate registration and verification for KALAWAR Dan Examination.
                </p>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-stone-400 shrink-0">Candidate:</span>
                  <span className="font-bold text-white truncate">{formData.fullName} ({formData.athleteId})</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-400 shrink-0">Applied Rank:</span>
                  <span className="font-bold text-amber-400 truncate">{formData.appliedDanTitle}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-400 shrink-0">Razorpay Order ID:</span>
                  <span className="font-mono text-stone-300 truncate">{pendingSimOrder?.orderId || "order_sim_dan_123"}</span>
                </div>
                <div className="flex justify-between border-t border-stone-800 pt-2 text-xs sm:text-sm">
                  <span className="font-bold text-white">Payment Status:</span>
                  <span className="font-bold text-emerald-400">
                    Ready for Verification
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSimulatedPaymentSuccess}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simulate Successful Razorpay Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimModalOpen(false);
                    setIsSubmitting(false);
                    toast.info("Payment cancelled.");
                  }}
                  className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION MODAL - PAYMENT CONFIRMATION SLIP */}
        {showSuccessModal && registeredApp && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[#0e1017] border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-xl w-full space-y-5 sm:space-y-6 shadow-2xl relative my-4 sm:my-8">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1.5 sm:space-y-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white uppercase">Dan Registration Confirmed</h3>
                <p className="text-xs text-stone-400">
                  Official Registration Confirmation Slip generated for KALAWAR Black Belt &amp; Dan Examination.
                </p>
              </div>

              {/* Slip Details Grid */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">Registration Status:</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                    ✓ CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Candidate Name:</span>
                    <span className="font-bold text-white truncate block">{registeredApp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Tracking ID:</span>
                    <span className="font-mono font-bold text-amber-400 truncate block">{registeredApp.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Athlete ID:</span>
                    <span className="font-mono font-bold text-white truncate block">{registeredApp.athleteId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Current Rank:</span>
                    <span className="font-semibold text-stone-200 truncate block">{registeredApp.currentBeltTitle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Applied Dan Rank:</span>
                    <span className="font-bold text-amber-300 truncate block">{registeredApp.appliedDanTitle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Academy / Dojang:</span>
                    <span className="font-semibold text-stone-200 truncate block">{registeredApp.academyName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">State:</span>
                    <span className="font-semibold text-stone-200 truncate block">{registeredApp.state}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Technical Committee:</span>
                    <span className="font-bold text-emerald-400">
                      Scheduled for Audit
                    </span>
                  </div>
                </div>

                <div className="border-t border-stone-800 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                  <span className="text-stone-400">
                    Instructor: <strong className="text-stone-200">{registeredApp.instructorName}</strong>
                  </span>
                  <span className="text-stone-400">
                    Date: <strong className="text-stone-200">{registeredApp.appliedDate || "2026-09-04"}</strong>
                  </span>
                </div>
              </div>

              {/* Advisory note about Admit Card */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-1">
                <p className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Official Admit Card &amp; Schedule Notice</span>
                </p>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Your Registration Confirmation Slip is ready for download below. Your official <strong>Examination Admit Card</strong> will be issued once the Technical Board verifies and schedules the <strong>Date of Exam</strong> and <strong>Examination Venue Address</strong>. You will also be notified via email with your Tracking ID and Athlete ID.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button
                  onClick={() => handleDownloadPaymentSlip(registeredApp)}
                  className="flex-1 py-3 sm:py-3.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Registration Slip (PDF)
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setTrackerQuery(registeredApp.id);
                    setTrackedApp(registeredApp);
                    setActiveTab("tracker");
                  }}
                  className="px-5 py-3 sm:py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 font-bold text-xs hover:text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" /> Track Status
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SiteLayout>
  );
}
