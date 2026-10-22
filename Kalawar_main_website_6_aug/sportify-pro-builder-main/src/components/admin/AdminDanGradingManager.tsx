"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  MapPin,
  Clock,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  User,
  Users,
  Eye,
  Check,
  Sparkles,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  Send,
  Loader2,
  Download,
  CreditCard,
  UserCheck,
  Sliders,
  DollarSign,
  Layers,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/people";
import {
  DAN_GRADES,
  type DanGradeLevel,
  type DanExamSession,
  type DanApplication,
  type DanApplicationStatus,
  type DanAssessmentScore,
} from "@/data/dan-grading";
import { cn, openFileInFullSize, downloadFile } from "@/lib/utils";
import { downloadDanDiplomaPDF } from "@/lib/dan-pdf-download";

export function AdminDanGradingManager() {
  const [activeTab, setActiveTab] = useState<"syllabus" | "sessions" | "applications" | "assessment" | "registry">("syllabus");

  const [sessions, setSessions] = useState<DanExamSession[]>([]);
  const [applications, setApplications] = useState<DanApplication[]>([]);
  const [grades, setGrades] = useState<DanGradeLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [danFilter, setDanFilter] = useState<number | "All">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [registrySearchQuery, setRegistrySearchQuery] = useState("");
  const [registryDanFilter, setRegistryDanFilter] = useState<number | "All">("All");

  // Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<DanExamSession | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Session Form
  const [sessionForm, setSessionForm] = useState({
    id: "",
    title: "",
    discipline: "Kalawar Martial Arts",
    examDate: "",
    reportingTime: "07:30 AM",
    examEndTime: "06:30 PM",
    venueName: "",
    venueAddress: "",
    city: "",
    state: "Maharashtra",
    chiefExaminer: "Grandmaster Santosh Kasbe (9th Dan)",
    chiefExaminerRank: "Founder & President – India | Head – Technical Committee, India",
    examiners: [
      "Grandmaster Santosh Kasbe (9th Dan)",
      "Master Ashish Doiphode (5th Dan - Working President)",
    ],
    eligibleDans: [1, 2, 3, 4, 5, 6, 7],
    registrationDeadline: "",
    fee: 3500,
    maxCandidates: 75,
    description: "",
    status: "Registration Open" as DanExamSession["status"],
  });

  // Dan Grade / Syllabus Modal State (Full CRUD)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<DanGradeLevel | null>(null);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isResettingGrades, setIsResettingGrades] = useState(false);

  const [gradeForm, setGradeForm] = useState({
    dan: 1,
    rankName: "1st Dan Black Belt",
    titleJapanese: "Sho Dan (初段)",
    titleKorean: "Il Dan (1단)",
    designation: "Assistant Instructor / Competitor",
    fee: 3500,
    minTrainingYears: 3.5,
    timeInPreviousGradeYears: 1,
    minAge: 16,
    beltColor: "Solid Black Belt (Gold 1-Stripe Tip)",
    kataForms: "Koryo Poomsae / Bassai Dai / Heian Series Mastery\nTaeguk 1 to 8 Sequential Demonstration",
    sparringRequirements: "Continuous Free Sparring (3 rounds x 2 mins)\nOlympic/WT Point Combat Rules",
    selfDefenseWeapons: "Knife & Blunt Weapon Defense\nWrist and Joint Lock Escapes",
    breakingRequirements: "Standard 1-inch Pine Board\nJumping Back Kick Demolition",
    aadhaarRequired: false,
    currentCertRequired: false,
    medicalFitnessRequired: false,
    theoryThesisRequired: false,
    thesisTopic: "",
    technicalRequirements: "Mastery of fundamental martial discipline\nClean background check",
    eligibilityNotes: "Must hold verified Brown Belt (1st Gup) for minimum 1 year.",
  });

  // Delete Dan Application State
  const [deleteCandidateApp, setDeleteCandidateApp] = useState<DanApplication | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState(false);

  // Application Verification Modal
  const [verifyingApp, setVerifyingApp] = useState<DanApplication | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [verificationExamDate, setVerificationExamDate] = useState("");
  const [verificationExamTime, setVerificationExamTime] = useState("");
  const [verificationExamVenue, setVerificationExamVenue] = useState("");

  // Candidate Assessment Modal State
  const [selectedAssessmentSessionId, setSelectedAssessmentSessionId] = useState<string>("");

  // Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    url: string;
    name: string;
    type?: string;
  } | null>(null);

  // Helper to generate a reliable preview URL or SVG fallback for documents
  const getDocPreviewUrl = (docData?: string, docName?: string, docTitle?: string, candidateName?: string) => {
    if (docData && (docData.startsWith("data:") || docData.startsWith("http") || docData.startsWith("/"))) {
      return docData;
    }
    const name = docName || "document.pdf";
    const title = docTitle || "Official Verification Document";
    const athlete = candidateName || "Registered Candidate";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1050" viewBox="0 0 800 1050">
      <rect width="800" height="1050" fill="#0e1017"/>
      <rect x="30" y="30" width="740" height="990" rx="20" fill="#161922" stroke="#f59e0b" stroke-width="3"/>
      <rect x="50" y="50" width="700" height="950" rx="12" fill="#0d0f14" stroke="#2a2e39" stroke-width="1.5"/>
      <circle cx="400" cy="140" r="45" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="2"/>
      <text x="400" y="148" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#f59e0b" text-anchor="middle">🥋</text>
      <text x="400" y="230" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">KALAWAR SPORTS &amp; MARTIAL ARTS</text>
      <text x="400" y="260" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#f59e0b" text-anchor="middle" letter-spacing="1">DAN GRADING &amp; BLACK BELT VERIFICATION</text>
      <line x1="120" y1="285" x2="680" y2="285" stroke="#333a48" stroke-width="1.5"/>
      <rect x="100" y="320" width="600" height="70" rx="12" fill="#1c202c" stroke="#f59e0b" stroke-width="1" stroke-opacity="0.4"/>
      <text x="120" y="348" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#a1a1aa" text-transform="uppercase">DOCUMENT TITLE</text>
      <text x="120" y="372" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
      <rect x="100" y="415" width="600" height="150" rx="12" fill="#161922" stroke="#2a2e39" stroke-width="1"/>
      <text x="120" y="445" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#a1a1aa">CANDIDATE NAME:</text>
      <text x="280" y="445" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${athlete}</text>
      <text x="120" y="480" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#a1a1aa">FILE ATTACHMENT:</text>
      <text x="280" y="480" font-family="Courier, monospace" font-size="13" font-weight="bold" fill="#38bdf8">${name}</text>
      <text x="120" y="515" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#a1a1aa">VERIFICATION STATUS:</text>
      <text x="280" y="515" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#34d399">OFFICIALLY REGISTERED &amp; VERIFIED</text>
      <text x="120" y="545" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#a1a1aa">AUTHORITY:</text>
      <text x="280" y="545" font-family="Arial, sans-serif" font-size="12" fill="#d4d4d8">Technical Committee Approval (Santosh Kasbe)</text>
      <rect x="100" y="590" width="600" height="300" rx="12" fill="#10121a" stroke="#272b38" stroke-width="1"/>
      <text x="400" y="660" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f59e0b" text-anchor="middle">DOCUMENT SUMMARY &amp; AUDIT RECORD</text>
      <text x="400" y="700" font-family="Arial, sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">This official proof has been archived under candidate application audit records.</text>
      <text x="400" y="730" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Compliant with National Dan Examination Board &amp; Belt Grading Rules.</text>
      <circle cx="400" cy="800" r="35" fill="#f59e0b" fill-opacity="0.1" stroke="#f59e0b" stroke-width="2"/>
      <text x="400" y="805" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#f59e0b" text-anchor="middle">SEALED</text>
      <text x="400" y="950" font-family="Arial, sans-serif" font-size="11" fill="#71717a" text-anchor="middle">KALAWAR TECHNICAL COMMITTEE • DIGITAL RECORD</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  };

  const [evaluatingApp, setEvaluatingApp] = useState<DanApplication | null>(null);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  const [assessmentForm, setAssessmentForm] = useState({
    formsScore: 23,
    sparringScore: 23,
    selfDefenseScore: 23,
    breakingScore: 14,
    theoryThesisScore: 9,
    attendance: "Present" as "Pending" | "Present" | "Absent",
    resultStatus: "Passed" as "Passed" | "Failed" | "Re-test",
    examinerRemarks: "",
  });

  const getDanStatusBadgeClass = (status: DanApplicationStatus | string) => {
    switch (status) {
      case "Passed":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Eligible":
      case "Exam Scheduled":
        return "bg-teal-500/15 text-teal-400 border-teal-500/30";
      case "Documents Required":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Under Verification":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "Submitted":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Payment Pending":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      case "Failed":
      case "Rejected":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-stone-800 text-stone-300 border-stone-700";
    }
  };

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dan-grading");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setApplications(data.applications || []);
        setGrades(data.grades || DAN_GRADES);
        if (data.sessions && data.sessions.length > 0 && !selectedAssessmentSessionId) {
          setSelectedAssessmentSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load Dan admin data:", err);
      toast.error("Failed to fetch Dan Grading records.");
    } finally {
      setLoading(false);
    }
  }, [selectedAssessmentSessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !searchQuery.trim() ||
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.athleteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.certificateNumber && app.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDan = danFilter === "All" || app.appliedDanGrade === danFilter;
      const matchStatus = statusFilter === "All" || app.status === statusFilter;

      return matchSearch && matchDan && matchStatus;
    });
  }, [applications, searchQuery, danFilter, statusFilter]);

  // Filtered Dan Registry & Credentials
  const filteredRegistry = useMemo(() => {
    const passedApps = applications.filter((a) => a.status === "Passed" && a.certificateNumber);
    const query = registrySearchQuery.trim().toLowerCase();

    return passedApps.filter((holder) => {
      const matchSearch =
        !query ||
        (holder.certificateNumber && holder.certificateNumber.toLowerCase().includes(query)) ||
        (holder.fullName && holder.fullName.toLowerCase().includes(query)) ||
        (holder.athleteId && holder.athleteId.toLowerCase().includes(query)) ||
        (holder.id && holder.id.toLowerCase().includes(query)) ||
        (holder.idCardNumber && holder.idCardNumber.toLowerCase().includes(query)) ||
        (holder.academyName && holder.academyName.toLowerCase().includes(query)) ||
        (holder.appliedDanTitle && holder.appliedDanTitle.toLowerCase().includes(query)) ||
        (holder.state && holder.state.toLowerCase().includes(query));

      const matchDan = registryDanFilter === "All" || holder.appliedDanGrade === registryDanFilter;

      return matchSearch && matchDan;
    });
  }, [applications, registrySearchQuery, registryDanFilter]);

  // Handle Save Session (Create / Edit Full CRUD)
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSession(true);
      if (editingSession) {
        const res = await fetch(`/api/dan-grading/${editingSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionForm),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Dan Exam Session updated successfully!");
          setIsSessionModalOpen(false);
          loadData();
        } else {
          toast.error(data.error || "Failed to update session");
        }
      } else {
        const res = await fetch("/api/dan-grading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionForm),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("New Dan Exam Session created successfully!");
          setIsSessionModalOpen(false);
          loadData();
        } else {
          toast.error(data.error || "Failed to create session");
        }
      }
    } catch (err) {
      toast.error("Failed to save Dan Exam Session.");
    } finally {
      setIsSavingSession(false);
    }
  };

  // Handle Delete Session
  const handleDeleteSession = async (id: string) => {
    if (!confirm(`Are you sure you want to delete session ${id}?`)) return;
    try {
      const res = await fetch(`/api/dan-grading/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Session deleted successfully.");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to delete session.");
    }
  };

  // Handle Edit Dan Grade (Full CRUD)
  const handleEditGrade = (g: DanGradeLevel) => {
    setEditingGrade(g);
    setGradeForm({
      dan: g.dan,
      rankName: g.rankName,
      titleJapanese: g.titleJapanese,
      titleKorean: g.titleKorean,
      designation: g.designation,
      fee: g.fee,
      minTrainingYears: g.minTrainingYears,
      timeInPreviousGradeYears: g.timeInPreviousGradeYears,
      minAge: g.minAge,
      beltColor: g.beltColor,
      kataForms: (g.kataForms || []).join("\n"),
      sparringRequirements: (g.sparringRequirements || []).join("\n"),
      selfDefenseWeapons: (g.selfDefenseWeapons || []).join("\n"),
      breakingRequirements: (g.breakingRequirements || []).join("\n"),
      aadhaarRequired: !!g.aadhaarRequired,
      currentCertRequired: !!g.currentCertRequired,
      medicalFitnessRequired: !!g.medicalFitnessRequired,
      theoryThesisRequired: !!g.theoryThesisRequired,
      thesisTopic: g.thesisTopic || "",
      technicalRequirements: (g.technicalRequirements || []).join("\n"),
      eligibilityNotes: g.eligibilityNotes || "",
    });
    setIsGradeModalOpen(true);
  };

  // Handle Save Dan Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingGrade(true);
      const payload: DanGradeLevel = {
        dan: Number(gradeForm.dan),
        rankName: gradeForm.rankName.trim(),
        titleJapanese: gradeForm.titleJapanese.trim(),
        titleKorean: gradeForm.titleKorean.trim(),
        designation: gradeForm.designation.trim(),
        fee: Number(gradeForm.fee),
        minTrainingYears: Number(gradeForm.minTrainingYears),
        timeInPreviousGradeYears: Number(gradeForm.timeInPreviousGradeYears),
        minAge: Number(gradeForm.minAge),
        beltColor: gradeForm.beltColor.trim(),
        kataForms: gradeForm.kataForms.split("\n").map((s) => s.trim()).filter(Boolean),
        sparringRequirements: gradeForm.sparringRequirements.split("\n").map((s) => s.trim()).filter(Boolean),
        selfDefenseWeapons: gradeForm.selfDefenseWeapons.split("\n").map((s) => s.trim()).filter(Boolean),
        breakingRequirements: gradeForm.breakingRequirements.split("\n").map((s) => s.trim()).filter(Boolean),
        aadhaarRequired: gradeForm.aadhaarRequired,
        currentCertRequired: gradeForm.currentCertRequired,
        medicalFitnessRequired: gradeForm.medicalFitnessRequired,
        theoryThesisRequired: gradeForm.theoryThesisRequired,
        thesisTopic: gradeForm.thesisTopic.trim(),
        technicalRequirements: gradeForm.technicalRequirements.split("\n").map((s) => s.trim()).filter(Boolean),
        eligibilityNotes: gradeForm.eligibilityNotes.trim(),
      };

      const res = await fetch(`/api/dan-grading/grades/${payload.dan}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Dan Grade ${payload.dan} (${payload.rankName}) criteria updated!`);
        setIsGradeModalOpen(false);
        loadData();
      } else {
        // Try creating via POST if not found
        const postRes = await fetch("/api/dan-grading/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const postData = await postRes.json();
        if (postData.success) {
          toast.success(`Dan Grade ${payload.dan} created successfully!`);
          setIsGradeModalOpen(false);
          loadData();
        } else {
          toast.error(postData.error || "Failed to save Dan grade");
        }
      }
    } catch (err) {
      toast.error("Failed to save Dan grade criteria.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Handle Delete Dan Grade
  const handleDeleteGrade = async (dan: number) => {
    if (!confirm(`Are you sure you want to delete Dan Grade ${dan}?`)) return;
    try {
      const res = await fetch(`/api/dan-grading/grades/${dan}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Dan Grade ${dan} deleted.`);
        loadData();
      }
    } catch (err) {
      toast.error("Failed to delete Dan grade.");
    }
  };

  // Handle Reset All Dan Grades to Default
  const handleResetGrades = async () => {
    if (!confirm("Reset all 1st-10th Dan grades to default federation standards?")) return;
    try {
      setIsResettingGrades(true);
      const res = await fetch("/api/dan-grading/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Dan grades and criteria reset to official federation defaults!");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to reset Dan grades.");
    } finally {
      setIsResettingGrades(false);
    }
  };

  // Handle Update Application Status
  // Handle Update Application Status
  const handleUpdateAppStatus = async (
    targetStatus: DanApplicationStatus,
    extraUpdates?: Partial<DanApplication>,
    overrideRemarks?: string
  ) => {
    if (!verifyingApp) return;
    try {
      setIsUpdatingStatus(true);
      const rem = overrideRemarks !== undefined ? overrideRemarks : verificationRemarks;
      const res = await fetch("/api/dan-grading/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: verifyingApp.id,
          status: targetStatus,
          remarks: rem,
          extraUpdates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (targetStatus === "Documents Required") {
          toast.success(`Document re-upload requested! Notification email dispatched to ${verifyingApp.email}`);
        } else if (targetStatus === "Under Verification" || targetStatus === "Submitted") {
          toast.success(`Application marked Under Review! Notification email dispatched to ${verifyingApp.email}`);
        } else if (targetStatus === "Eligible") {
          toast.success(`Candidate approved & Admit Card issued! Notification email dispatched to ${verifyingApp.email}`);
        } else {
          toast.success(`Application status updated to ${targetStatus}`);
        }
        setVerifyingApp(null);
        loadData();
      }
    } catch (err) {
      toast.error("Failed to update application status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestMoreDocs = () => {
    if (!verifyingApp) return;
    const finalRemarks =
      verificationRemarks.trim() ||
      "Please re-upload clear, official copies of required verification documents (Aadhaar / National ID, Current Belt/Dan Certificate, Medical Fitness Certificate).";
    setVerificationRemarks(finalRemarks);
    handleUpdateAppStatus("Documents Required", { admitCardIssued: false }, finalRemarks);
  };

  const handleOpenVerificationModal = (app: DanApplication) => {
    setVerifyingApp(app);
    setVerificationRemarks(app.adminVerificationRemarks || "");
    const linkedSession = sessions.find((s) => s.id === app.examId);
    const defaultDate = app.examDate || linkedSession?.examDate || "";
    const defaultTime = app.examTime || linkedSession?.reportingTime || "07:30 AM";
    const defaultVenue =
      app.examVenue ||
      (linkedSession
        ? `${linkedSession.venueName}, ${linkedSession.venueAddress ? linkedSession.venueAddress + ", " : ""}${linkedSession.city}, ${linkedSession.state}`
        : "") ||
      "";
    setVerificationExamDate(defaultDate);
    setVerificationExamTime(defaultTime);
    setVerificationExamVenue(defaultVenue);
  };

  const handleApproveCandidateForExam = () => {
    if (!verifyingApp) return;
    if (!verificationExamDate.trim()) {
      toast.error("Date of Examination is mandatory before approving candidate.");
      return;
    }
    if (!verificationExamTime.trim()) {
      toast.error("Time of Examination is mandatory before approving candidate.");
      return;
    }
    if (!verificationExamVenue.trim()) {
      toast.error("Address of Examination Venue is mandatory before approving candidate.");
      return;
    }

    handleUpdateAppStatus("Eligible", {
      paymentStatus: "Paid",
      examDate: verificationExamDate.trim(),
      examTime: verificationExamTime.trim(),
      examVenue: verificationExamVenue.trim(),
      admitCardIssued: true,
      admitCardIssuedAt: new Date().toISOString(),
    });
  };

  // Handle Save Assessment & Issue Certificate
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingApp) return;

    const total =
      Number(assessmentForm.formsScore) +
      Number(assessmentForm.sparringScore) +
      Number(assessmentForm.selfDefenseScore) +
      Number(assessmentForm.breakingScore) +
      Number(assessmentForm.theoryThesisScore);

    let grade: DanAssessmentScore["grade"] = "Pass (60-74%)";
    if (total >= 90) grade = "Distinction (90%+)";
    else if (total >= 75) grade = "First Class (75-89%)";
    else if (total < 60) grade = "Fail (<60%)";

    const assessmentPayload: DanAssessmentScore = {
      formsScore: Number(assessmentForm.formsScore),
      sparringScore: Number(assessmentForm.sparringScore),
      selfDefenseScore: Number(assessmentForm.selfDefenseScore),
      breakingScore: Number(assessmentForm.breakingScore),
      theoryThesisScore: Number(assessmentForm.theoryThesisScore),
      totalScore: total,
      grade,
      examinerRemarks: assessmentForm.examinerRemarks,
      committeeApprovalDate: new Date().toISOString().split("T")[0],
      technicalDirectorApproval: true,
      chiefExaminerSignature: "MR. SANTOSH KASBE",
    };

    try {
      setIsSavingAssessment(true);
      const res = await fetch("/api/dan-grading/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: evaluatingApp.id,
          assessment: assessmentPayload,
          resultStatus: assessmentForm.resultStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Assessment saved! ${
            assessmentForm.resultStatus === "Passed"
              ? "Official Dan Certificate & Smart ID Card generated!"
              : "Result updated."
          }`
        );
        setEvaluatingApp(null);
        loadData();
      }
    } catch (err) {
      toast.error("Failed to save assessment.");
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleConfirmDeleteApp = async () => {
    if (!deleteCandidateApp) return;
    try {
      setIsDeletingApp(true);
      const res = await fetch(`/api/dan-grading/applications/${deleteCandidateApp.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete application");
      }
      toast.success(`Application ${deleteCandidateApp.id} for ${deleteCandidateApp.fullName} removed successfully`);
      setDeleteCandidateApp(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete application");
    } finally {
      setIsDeletingApp(false);
    }
  };

  const calculatedTotal =
    Number(assessmentForm.formsScore || 0) +
    Number(assessmentForm.sparringScore || 0) +
    Number(assessmentForm.selfDefenseScore || 0) +
    Number(assessmentForm.breakingScore || 0) +
    Number(assessmentForm.theoryThesisScore || 0);

  return (
    <div className="space-y-6 text-stone-200">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-stone-900 via-[#141720] to-stone-900 border border-amber-500/40 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase font-mono">
              Admin Module
            </span>
            <span className="text-xs text-stone-400">
              Authorized by Mr. Santosh Kasbe (Founder & President)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" /> Black Belt & Dan Grading Center
          </h2>
          <p className="text-xs text-stone-400">
            Manage 1st to 10th Dan examination sessions, candidate verification, dynamic syllabus criteria, and credentials registry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setEditingSession(null);
              setSessionForm({
                id: `KAC-DAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                title: "All-India Black Belt & Dan Examination Session",
                discipline: "Kalawar Martial Arts",
                examDate: new Date().toISOString().split("T")[0],
                reportingTime: "07:30 AM",
                examEndTime: "06:30 PM",
                venueName: "Shree Shiv Chhatrapati Sports Complex",
                venueAddress: "Balewadi Stadium, Pune",
                city: "Pune",
                state: "Maharashtra",
                chiefExaminer: "Grandmaster Santosh Kasbe (9th Dan)",
                chiefExaminerRank: "Founder & President – India | Head – Technical Committee, India",
                examiners: [
                  "Grandmaster Santosh Kasbe (9th Dan)",
                  "Master Ashish Doiphode (5th Dan)",
                ],
                eligibleDans: [1, 2, 3, 4, 5, 6, 7],
                registrationDeadline: new Date().toISOString().split("T")[0],
                fee: 0,
                maxCandidates: 75,
                description: "National Dan Examination & Master Promotion Board.",
                status: "Registration Open",
              });
              setIsSessionModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Create Dan Exam Session
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
        {[
          { key: "syllabus", label: "Dan Syllabus Criteria", icon: Sliders, count: grades.length },
          { key: "sessions", label: "Exam Sessions", icon: Calendar, count: sessions.length },
          { key: "applications", label: "Candidate Applications", icon: Users, count: applications.length },
          { key: "assessment", label: "Examiner Scoring & Results", icon: Award },
          { key: "registry", label: "Dan Registry & Credentials", icon: FileText, count: applications.filter((a) => a.status === "Passed").length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                active
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    active ? "bg-stone-950/40 text-stone-950" : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SESSIONS (Full CRUD) */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Examination Sessions ({sessions.length})
            </h3>
            <span className="text-xs text-stone-400">All session mandates and criteria are live.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">{s.id}</span>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{s.title}</h4>
                      <p className="text-[11px] text-stone-400">{s.city}, {s.state}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {s.status}
                    </span>
                  </div>

                  <div className="text-xs text-stone-300 space-y-1 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
                    <p><strong>Date:</strong> {s.examDate} ({s.reportingTime})</p>
                    <p className="truncate"><strong>Venue:</strong> {s.venueName}</p>
                    <p className="truncate"><strong>Chief Examiner:</strong> {s.chiefExaminer}</p>
                    <p><strong>Registered Candidates:</strong> {s.candidatesCount || 0} / {s.maxCandidates}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                  <span className="font-semibold text-amber-400/90">{s.discipline}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditingSession(s);
                        setSessionForm({
                          id: s.id,
                          title: s.title,
                          discipline: s.discipline,
                          examDate: s.examDate,
                          reportingTime: s.reportingTime,
                          examEndTime: s.examEndTime,
                          venueName: s.venueName,
                          venueAddress: s.venueAddress,
                          city: s.city,
                          state: s.state,
                          chiefExaminer: s.chiefExaminer,
                          chiefExaminerRank: s.chiefExaminerRank,
                          examiners: s.examiners,
                          eligibleDans: s.eligibleDans,
                          registrationDeadline: s.registrationDeadline,
                          fee: s.fee,
                          maxCandidates: s.maxCandidates,
                          description: s.description,
                          status: s.status,
                        });
                        setIsSessionModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-2 rounded-xl bg-stone-800 text-rose-400 hover:bg-rose-950/50 transition"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS & VERIFICATION */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applicant name, ID, cert..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={danFilter}
                onChange={(e) => setDanFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="All">All Dan Ranks</option>
                {grades.map((d) => (
                  <option key={d.dan} value={d.dan}>{d.rankName}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Documents Required">Documents Required</option>
                <option value="Eligible">Eligible</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <span className="text-xs text-stone-400">
              Showing <strong>{filteredApplications.length}</strong> applications
            </span>
          </div>

          {/* Applications Table */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/80 text-stone-400 border-b border-stone-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Candidate & Athlete ID</th>
                  <th className="py-3 px-4">Applied Dan Rank</th>
                  <th className="py-3 px-4">Academy / State</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {app.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{app.fullName}</p>
                      <p className="text-[11px] text-stone-400 font-mono">{app.athleteId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-amber-300">{app.appliedDanTitle}</span>
                      <p className="text-[10px] text-stone-400">Current: {app.currentBeltTitle}</p>
                    </td>
                    <td className="py-3.5 px-4 text-stone-300">
                      <p className="truncate max-w-[150px]">{app.academyName}</p>
                      <p className="text-[10px] text-stone-400">{app.state}</p>
                    </td>
                    <td className="py-3.5 px-4 text-stone-300 font-mono text-[11px]">
                      {app.appliedDate || "2026-09-04"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${getDanStatusBadgeClass(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!app.admitCardIssued && (
                          <button
                            type="button"
                            onClick={() => handleOpenVerificationModal(app)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                            title="Verify and Schedule Exam to Issue Admit Card"
                          >
                            <Check className="w-3 h-3" /> Issue Admit Card
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenVerificationModal(app)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 text-amber-400 hover:bg-stone-700 font-semibold"
                        >
                          Verify Docs
                        </button>
                        <button
                          onClick={() => {
                            setEvaluatingApp(app);
                            setAssessmentForm({
                              formsScore: app.assessment?.formsScore || 23,
                              sparringScore: app.assessment?.sparringScore || 23,
                              selfDefenseScore: app.assessment?.selfDefenseScore || 23,
                              breakingScore: app.assessment?.breakingScore || 14,
                              theoryThesisScore: app.assessment?.theoryThesisScore || 9,
                              attendance: app.attendance || "Present",
                              resultStatus: (app.status === "Passed" ? "Passed" : "Passed") as any,
                              examinerRemarks: app.assessment?.examinerRemarks || "",
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold"
                        >
                          Assess
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidateApp(app)}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 font-semibold transition cursor-pointer flex items-center justify-center"
                          title={`Delete Application ${app.id} (${app.fullName})`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXAMINER SCORING & RESULTS */}
      {activeTab === "assessment" && (
        <div className="space-y-6">
          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Technical Committee Assessment & Scoring Matrix
              </h3>
              <p className="text-xs text-stone-400">
                Grade candidates on 5 core martial pillars (100 Marks) and publish ratified Dan diplomas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-400">Session:</label>
              <select
                value={selectedAssessmentSessionId}
                onChange={(e) => setSelectedAssessmentSessionId(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster of candidates for assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications
              .filter((a) => !selectedAssessmentSessionId || a.examId === selectedAssessmentSessionId)
              .map((cand) => (
                <div
                  key={cand.id}
                  className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">{cand.fullName}</h4>
                      <p className="text-xs text-amber-400 font-semibold">{cand.appliedDanTitle}</p>
                      <p className="text-[11px] text-stone-400 font-mono">ID: {cand.athleteId}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${getDanStatusBadgeClass(
                        cand.status
                      )}`}
                    >
                      {cand.status}
                    </span>
                  </div>

                  {cand.assessment ? (
                    <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Total Score:</span>
                        <strong className="text-amber-400">{cand.assessment.totalScore}/100</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Awarded Grade:</span>
                        <strong className="text-white">{cand.assessment.grade}</strong>
                      </div>
                      {cand.certificateNumber && (
                        <div className="flex justify-between pt-1 border-t border-stone-800">
                          <span className="text-stone-400">Cert No:</span>
                          <span className="font-mono text-amber-400">{cand.certificateNumber}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic">Assessment Pending.</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                    <span className="text-[11px] text-stone-400">{cand.academyName}</span>
                    <button
                      onClick={() => {
                        setEvaluatingApp(cand);
                        setAssessmentForm({
                          formsScore: cand.assessment?.formsScore || 23,
                          sparringScore: cand.assessment?.sparringScore || 23,
                          selfDefenseScore: cand.assessment?.selfDefenseScore || 23,
                          breakingScore: cand.assessment?.breakingScore || 14,
                          theoryThesisScore: cand.assessment?.theoryThesisScore || 9,
                          attendance: cand.attendance || "Present",
                          resultStatus: (cand.status === "Passed" ? "Passed" : "Passed") as any,
                          examinerRemarks: cand.assessment?.examinerRemarks || "",
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition"
                    >
                      Score Candidate →
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: DAN REGISTRY & CREDENTIALS DIRECTORY */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Official Black Belt Dan Registry & Credential Directory
              </h3>
              <p className="text-xs text-stone-400">
                All ratified Dan diplomas and smart ID cards authorized by Mr. Santosh Kasbe.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={registrySearchQuery}
                  onChange={(e) => setRegistrySearchQuery(e.target.value)}
                  placeholder="Search certificate (e.g. KAC-DAN-2026-5096), name, athlete ID..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
                {registrySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRegistrySearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={registryDanFilter}
                onChange={(e) => setRegistryDanFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="All">All Dan Ranks</option>
                {grades.map((d) => (
                  <option key={d.dan} value={d.dan}>{d.rankName}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-stone-400">
              Showing <strong>{filteredRegistry.length}</strong> of{" "}
              {applications.filter((a) => a.status === "Passed" && a.certificateNumber).length} credentials
            </span>
          </div>

          {filteredRegistry.length === 0 ? (
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-stone-600 mx-auto" />
              <h4 className="text-sm font-bold text-stone-300">No Credentials Found</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {registrySearchQuery || registryDanFilter !== "All"
                  ? `No ratified Dan credentials match your search criteria "${registrySearchQuery}".`
                  : "No ratified Dan certificates have been issued yet."}
              </p>
              {(registrySearchQuery || registryDanFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setRegistrySearchQuery("");
                    setRegistryDanFilter("All");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRegistry.map((holder) => (
                <div
                  key={holder.id}
                  className="bg-gradient-to-br from-stone-900 via-[#101217] to-stone-900 border border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {holder.certificateNumber}
                      </span>
                      <h4 className="text-base font-bold text-white uppercase">{holder.fullName}</h4>
                      <p className="text-xs font-semibold text-amber-300">{holder.appliedDanTitle}</p>
                      <p className="text-[10px] text-stone-400 font-mono">ID: {holder.athleteId}</p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 text-xs space-y-1">
                    <p><strong>DOB:</strong> {holder.dob || "—"}</p>
                    <p><strong>Academy:</strong> {holder.academyName}</p>
                    <p><strong>State:</strong> {holder.state}</p>
                    <p><strong>Issued:</strong> {holder.certificateIssuedDate || "2026-09-04"}</p>
                    <p><strong>Score:</strong> <span className="text-amber-400 font-bold">{holder.assessment?.totalScore}/100</span> ({holder.assessment?.grade})</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-800">
                    <Link
                      href={`/certificates/dan/${holder.certificateNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs text-center hover:bg-amber-400 transition"
                    >
                      View Diploma
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadDanDiplomaPDF(holder)}
                      className="p-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition flex items-center justify-center gap-1.5 text-xs font-semibold flex-shrink-0 cursor-pointer"
                      title="Download Diploma PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DAN SYLLABUS CRITERIA (Full CRUD) */}
      {activeTab === "syllabus" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/90 border border-stone-800 p-5 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Dan Grade Syllabus & Criteria Management (1st Dan – 10th Dan)
              </h3>
              <p className="text-xs text-stone-400">
                Live dynamic control of time-in-grade mandates, sparring criteria, and thesis topics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetGrades}
                disabled={isResettingGrades}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-700"
                title="Reset to official federation defaults"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResettingGrades ? "animate-spin text-amber-400" : ""}`} />
                {isResettingGrades ? "Resetting..." : "Reset Defaults"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grades.map((d) => (
              <div
                key={d.dan}
                className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-stone-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                        Dan Grade {d.dan}
                      </span>
                      <h4 className="text-base font-bold text-white uppercase">{d.rankName}</h4>
                      {d.designation && (
                        <p className="text-xs text-amber-300/80 font-medium">{d.designation}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-stone-300 space-y-1.5 bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
                    <p><strong>Designation:</strong> {d.designation}</p>
                    <p><strong>Min Training:</strong> {d.minTrainingYears} yrs (Min {d.timeInPreviousGradeYears} yrs in previous grade)</p>
                    <p><strong>Min Age:</strong> {d.minAge}+ yrs</p>
                    <p><strong>Belt Color:</strong> {d.beltColor}</p>
                    {d.theoryThesisRequired && (
                      <p className="text-amber-300/90 font-mono text-[11px]">
                        <strong>Thesis:</strong> {d.thesisTopic || "Research Thesis Required"}
                      </p>
                    )}
                    <div className="pt-2 border-t border-stone-800/80 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-stone-400">Document Upload Rules:</p>
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.aadhaarRequired ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-stone-900 text-stone-400 border border-stone-800"}`}>
                          Aadhaar: {d.aadhaarRequired ? "Mandatory" : "Optional"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.currentCertRequired ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-stone-900 text-stone-400 border border-stone-800"}`}>
                          Belt Cert: {d.currentCertRequired ? "Mandatory" : "Optional"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.medicalFitnessRequired ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-stone-900 text-stone-400 border border-stone-800"}`}>
                          Medical: {d.medicalFitnessRequired ? "Mandatory" : "Optional"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.theoryThesisRequired ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-stone-900 text-stone-400 border border-stone-800"}`}>
                          Thesis: {d.theoryThesisRequired ? "Mandatory" : "Optional"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                  <span className="text-[10px] text-stone-500 font-mono">
                    Updated: Live Dynamic
                  </span>
                  <div className="flex items-center gap-2">
                    {d.dan > 10 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGrade(d.dan)}
                        className="p-2 rounded-xl bg-stone-800 text-rose-400 hover:bg-rose-950/50 transition"
                        title="Delete Grade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEditGrade(d)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Criteria
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT SESSION (Full Fields) */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white uppercase">
                {editingSession ? "Edit Dan Exam Session" : "Create Dan Exam Session"}
              </h3>
              <p className="text-xs text-stone-400">Configure examination schedule, examiners, and venue.</p>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Session Title *</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    required
                    placeholder="e.g. All-India National Black Belt & Master Dan Grading Examination 2026"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Discipline *</label>
                  <input
                    type="text"
                    value={sessionForm.discipline}
                    onChange={(e) => setSessionForm({ ...sessionForm, discipline: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={sessionForm.examDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, examDate: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Registration Deadline *</label>
                  <input
                    type="date"
                    value={sessionForm.registrationDeadline}
                    onChange={(e) => setSessionForm({ ...sessionForm, registrationDeadline: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Reporting Time</label>
                  <input
                    type="text"
                    value={sessionForm.reportingTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, reportingTime: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Max Candidates Capacity</label>
                  <input
                    type="number"
                    value={sessionForm.maxCandidates}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxCandidates: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Status</label>
                  <select
                    value={sessionForm.status}
                    onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Registration Open">Registration Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Results Published">Results Published</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Venue Name *</label>
                  <input
                    type="text"
                    value={sessionForm.venueName}
                    onChange={(e) => setSessionForm({ ...sessionForm, venueName: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Venue Address</label>
                  <input
                    type="text"
                    value={sessionForm.venueAddress}
                    onChange={(e) => setSessionForm({ ...sessionForm, venueAddress: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={sessionForm.city}
                    onChange={(e) => setSessionForm({ ...sessionForm, city: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">State</label>
                  <select
                    value={sessionForm.state}
                    onChange={(e) => setSessionForm({ ...sessionForm, state: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Chief Technical Examiner *</label>
                  <input
                    type="text"
                    value={sessionForm.chiefExaminer}
                    onChange={(e) => setSessionForm({ ...sessionForm, chiefExaminer: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Session Description</label>
                  <textarea
                    rows={2}
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSession}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  {isSavingSession ? "Saving..." : "Save Exam Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / CREATE DAN GRADE (Full Dynamic Criteria) */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsGradeModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-stone-800 pb-3">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                Dynamic Criteria Config
              </span>
              <h3 className="text-lg font-bold text-white uppercase">
                {editingGrade ? `Edit ${editingGrade.rankName} (Dan ${editingGrade.dan})` : "Add Custom Dan Grade"}
              </h3>
              <p className="text-xs text-stone-400">
                Update belt regalia, time-in-grade prerequisites, Kata, sparring, and thesis requirements.
              </p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800">
                <div>
                  <label className="text-stone-400 block mb-1">Dan Level (1-10) *</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={gradeForm.dan}
                    onChange={(e) => setGradeForm({ ...gradeForm, dan: Number(e.target.value) })}
                    required
                    disabled={!!editingGrade}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Rank Title *</label>
                  <input
                    type="text"
                    value={gradeForm.rankName}
                    onChange={(e) => setGradeForm({ ...gradeForm, rankName: e.target.value })}
                    required
                    placeholder="e.g. 1st Dan Black Belt"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-stone-400 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={gradeForm.designation}
                    onChange={(e) => setGradeForm({ ...gradeForm, designation: e.target.value })}
                    placeholder="e.g. Assistant Instructor / Senior Competitor"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800">
                <div>
                  <label className="text-stone-400 block mb-1">Min Training Years *</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={gradeForm.minTrainingYears}
                    onChange={(e) => setGradeForm({ ...gradeForm, minTrainingYears: Number(e.target.value) })}
                    required
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Time in Previous Grade (Yrs) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={gradeForm.timeInPreviousGradeYears}
                    onChange={(e) => setGradeForm({ ...gradeForm, timeInPreviousGradeYears: Number(e.target.value) })}
                    required
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Minimum Age *</label>
                  <input
                    type="number"
                    min={5}
                    value={gradeForm.minAge}
                    onChange={(e) => setGradeForm({ ...gradeForm, minAge: Number(e.target.value) })}
                    required
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-stone-400 block mb-1">Belt Color &amp; Regalia Details</label>
                  <input
                    type="text"
                    value={gradeForm.beltColor}
                    onChange={(e) => setGradeForm({ ...gradeForm, beltColor: e.target.value })}
                    placeholder="e.g. Solid Black Belt (Gold 1-Stripe Tip)"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-amber-300 font-semibold"
                  />
                </div>
              </div>

              {/* Syllabus Criteria Textareas */}
              <div className="space-y-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800">
                <p className="font-bold text-amber-400 uppercase text-[11px]">
                  Technical Syllabus Breakdown (1 item per line)
                </p>

                <div>
                  <label className="text-stone-400 block mb-1">1. DAN DEGREE PATTERNS</label>
                  <textarea
                    rows={2}
                    value={gradeForm.kataForms}
                    onChange={(e) => setGradeForm({ ...gradeForm, kataForms: e.target.value })}
                    placeholder="Enter each pattern on a new line"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">2. Sparring &amp; Combat Rules</label>
                  <textarea
                    rows={2}
                    value={gradeForm.sparringRequirements}
                    onChange={(e) => setGradeForm({ ...gradeForm, sparringRequirements: e.target.value })}
                    placeholder="Enter sparring criteria on a new line"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">3. Self Defense &amp; Weaponry</label>
                  <textarea
                    rows={2}
                    value={gradeForm.selfDefenseWeapons}
                    onChange={(e) => setGradeForm({ ...gradeForm, selfDefenseWeapons: e.target.value })}
                    placeholder="Enter self defense criteria on a new line"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">4. Breaking &amp; Demolition</label>
                  <textarea
                    rows={2}
                    value={gradeForm.breakingRequirements}
                    onChange={(e) => setGradeForm({ ...gradeForm, breakingRequirements: e.target.value })}
                    placeholder="Enter breaking criteria on a new line"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-stone-800 space-y-2.5">
                  <p className="font-bold text-amber-400 uppercase text-[11px] mb-1">
                    5. Document Upload Requirements (Mandatory vs Optional)
                  </p>
                  <p className="text-[11px] text-stone-400 mb-2">
                    Check a document type to mandate it during candidate registration; unchecked documents remain optional.
                  </p>

                  <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gradeForm.aadhaarRequired}
                      onChange={(e) => setGradeForm({ ...gradeForm, aadhaarRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-stone-900 border-stone-700 focus:ring-amber-500"
                    />
                    <span>1. Aadhaar / National ID / Passport Mandated</span>
                  </label>

                  <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gradeForm.currentCertRequired}
                      onChange={(e) => setGradeForm({ ...gradeForm, currentCertRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-stone-900 border-stone-700 focus:ring-amber-500"
                    />
                    <span>2. Current Belt / Dan Certificate Mandated</span>
                  </label>

                  <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gradeForm.medicalFitnessRequired}
                      onChange={(e) => setGradeForm({ ...gradeForm, medicalFitnessRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-stone-900 border-stone-700 focus:ring-amber-500"
                    />
                    <span>3. Medical &amp; Physical Fitness Certificate Mandated</span>
                  </label>

                  <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gradeForm.theoryThesisRequired}
                      onChange={(e) => setGradeForm({ ...gradeForm, theoryThesisRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-stone-900 border-stone-700 focus:ring-amber-500"
                    />
                    <span>4. Research Thesis / Dissertation Mandated</span>
                  </label>

                  {gradeForm.theoryThesisRequired && (
                    <div className="mt-2 pl-6">
                      <label className="text-stone-400 block mb-1">Thesis Topic / Research Domain</label>
                      <input
                        type="text"
                        value={gradeForm.thesisTopic}
                        onChange={(e) => setGradeForm({ ...gradeForm, thesisTopic: e.target.value })}
                        placeholder="e.g. Master Thesis on Biomechanics of Combat Striking"
                        className="w-full bg-stone-900 border border-amber-500/50 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  {isSavingGrade ? "Saving..." : "Save Dan Criteria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLICATION VERIFICATION */}
      {verifyingApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* STICKY HEADER WITH ALWAYS VISIBLE CLOSE (X) BUTTON */}
            <div className="flex items-start justify-between border-b border-stone-800 p-5 sm:p-6 pb-4 flex-shrink-0 bg-[#0e1017] z-10">
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider">{verifyingApp.id}</span>
                <h3 className="text-lg font-bold text-white uppercase">{verifyingApp.fullName}</h3>
                <p className="text-xs text-stone-400">
                  Target: <span className="text-amber-300 font-semibold">{verifyingApp.appliedDanTitle}</span> • Athlete ID: <span className="font-mono text-white">{verifyingApp.athleteId}</span>
                </p>
              </div>

              <button
                onClick={() => setVerifyingApp(null)}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-amber-500/50 hover:bg-stone-800 transition flex-shrink-0"
                title="Close Modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE BODY CONTENT (SLIDER) */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {(() => {
                const hasAadhaar = Boolean(verifyingApp.aadhaarDoc && verifyingApp.aadhaarDoc.trim());
                const hasCurrentCert = Boolean(verifyingApp.currentCertDoc && verifyingApp.currentCertDoc.trim());
                const hasMedicalFitness = Boolean(verifyingApp.medicalFitnessDoc && verifyingApp.medicalFitnessDoc.trim());
                const hasThesis = Boolean(verifyingApp.thesisDoc && verifyingApp.thesisDoc.trim());
                const hasPaymentProof = Boolean(verifyingApp.paymentProofDoc && verifyingApp.paymentProofDoc.trim());
                const totalUploadedDocs = [hasAadhaar, hasCurrentCert, hasMedicalFitness, hasThesis, hasPaymentProof].filter(Boolean).length;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-300 uppercase tracking-wide">
                        Attached Verification Proofs ({totalUploadedDocs} {totalUploadedDocs === 1 ? "File" : "Files"}):
                      </p>
                      {totalUploadedDocs > 0 && (
                        <span className="text-[10px] text-amber-400 font-semibold">Click View to Inspect Proof</span>
                      )}
                    </div>

                    {totalUploadedDocs === 0 ? (
                      <div className="p-4 bg-stone-950/80 rounded-xl border border-dashed border-stone-800 text-center space-y-1">
                        <p className="font-bold text-stone-300 text-xs">No verification documents attached</p>
                        <p className="text-[11px] text-stone-500">Candidate submitted this application without optional file proofs.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* 1. Aadhaar / Passport */}
                        {hasAadhaar && (
                          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] text-stone-400 uppercase font-semibold">1. Aadhaar / Passport ID</p>
                                <p className="font-mono text-white text-xs truncate">
                                  {verifyingApp.aadhaarDocName || "aadhaar_verified.pdf"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: `Aadhaar / National ID Proof – ${verifyingApp.fullName}`,
                                    url: getDocPreviewUrl(verifyingApp.aadhaarDoc, verifyingApp.aadhaarDocName, "Aadhaar / National ID Card Proof", verifyingApp.fullName),
                                    name: verifyingApp.aadhaarDocName || "aadhaar_proof.pdf",
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <a
                                href={getDocPreviewUrl(verifyingApp.aadhaarDoc, verifyingApp.aadhaarDocName, "Aadhaar / National ID Card Proof", verifyingApp.fullName)}
                                download={verifyingApp.aadhaarDocName || "aadhaar_proof.pdf"}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Download Proof"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 2. Previous Dan / Belt Certificate */}
                        {hasCurrentCert && (
                          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] text-stone-400 uppercase font-semibold">2. Current Belt / Dan Certificate</p>
                                <p className="font-mono text-white text-xs truncate">
                                  {verifyingApp.currentCertDocName || "current_belt_cert.pdf"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: `Current Belt Certificate – ${verifyingApp.fullName}`,
                                    url: getDocPreviewUrl(verifyingApp.currentCertDoc, verifyingApp.currentCertDocName, "Current Belt / Dan Certificate", verifyingApp.fullName),
                                    name: verifyingApp.currentCertDocName || "current_belt_cert.pdf",
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <a
                                href={getDocPreviewUrl(verifyingApp.currentCertDoc, verifyingApp.currentCertDocName, "Current Belt / Dan Certificate", verifyingApp.fullName)}
                                download={verifyingApp.currentCertDocName || "current_belt_cert.pdf"}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Download Proof"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 3. Medical & Physical Fitness */}
                        {hasMedicalFitness && (
                          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] text-stone-400 uppercase font-semibold">3. Medical &amp; Fitness Declaration</p>
                                <p className="font-mono text-white text-xs truncate">
                                  {verifyingApp.medicalFitnessDocName || "medical_fitness.pdf"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: `Medical Fitness Certificate – ${verifyingApp.fullName}`,
                                    url: getDocPreviewUrl(verifyingApp.medicalFitnessDoc, verifyingApp.medicalFitnessDocName, "Medical Fitness Certificate Proof", verifyingApp.fullName),
                                    name: verifyingApp.medicalFitnessDocName || "medical_fitness.pdf",
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <a
                                href={getDocPreviewUrl(verifyingApp.medicalFitnessDoc, verifyingApp.medicalFitnessDocName, "Medical Fitness Certificate Proof", verifyingApp.fullName)}
                                download={verifyingApp.medicalFitnessDocName || "medical_fitness.pdf"}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Download Proof"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 4. Master Research Thesis (for 4th Dan & above) */}
                        {hasThesis && (
                          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] text-stone-400 uppercase font-semibold">4. Master Research Thesis</p>
                                <p className="font-mono text-white text-xs truncate">
                                  {verifyingApp.thesisDocName || "master_research_thesis.pdf"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: `Master Research Thesis – ${verifyingApp.fullName}`,
                                    url: getDocPreviewUrl(verifyingApp.thesisDoc, verifyingApp.thesisDocName, "Master Research Thesis Dissertation", verifyingApp.fullName),
                                    name: verifyingApp.thesisDocName || "master_thesis.pdf",
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <a
                                href={getDocPreviewUrl(verifyingApp.thesisDoc, verifyingApp.thesisDocName, "Master Research Thesis Dissertation", verifyingApp.fullName)}
                                download={verifyingApp.thesisDocName || "master_thesis.pdf"}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Download Proof"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 5. Payment Proof / Deposit Receipt */}
                        {hasPaymentProof && (
                          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] text-stone-400 uppercase font-semibold">5. Payment / Deposit Proof</p>
                                <p className="font-mono text-white text-xs truncate">
                                  {verifyingApp.paymentProofDocName || "payment_receipt.pdf"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: `Payment / Deposit Proof – ${verifyingApp.fullName}`,
                                    url: getDocPreviewUrl(verifyingApp.paymentProofDoc, verifyingApp.paymentProofDocName, "Payment Deposit Proof", verifyingApp.fullName),
                                    name: verifyingApp.paymentProofDocName || "payment_proof.pdf",
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <a
                                href={getDocPreviewUrl(verifyingApp.paymentProofDoc, verifyingApp.paymentProofDocName, "Payment Deposit Proof", verifyingApp.fullName)}
                                download={verifyingApp.paymentProofDocName || "payment_proof.pdf"}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="Download Proof"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* MANDATORY EXAMINATION SCHEDULING (Required for Admit Card issuance) */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> Mandatory Examination Scheduling
                  </p>
                  <span className="text-[10px] text-amber-200 font-bold bg-amber-500/30 border border-amber-500/50 px-2.5 py-0.5 rounded-full">
                    Required for Admit Card
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-300 text-xs block mb-1 font-bold">
                      Date of Examination <span className="text-rose-400 font-black">*</span>
                    </label>
                    <input
                      type="date"
                      value={verificationExamDate}
                      onChange={(e) => setVerificationExamDate(e.target.value)}
                      required
                      className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white text-xs font-semibold [color-scheme:dark]"
                    />
                    {!verificationExamDate && (
                      <p className="text-[10px] text-rose-400 font-medium mt-1">
                        * Please select an exam date
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-stone-300 text-xs block mb-1 font-bold flex items-center justify-between">
                      <span>Time of Examination <span className="text-rose-400 font-black">*</span></span>
                      <span className="text-[10px] text-stone-500 font-normal">e.g. 07:30 AM</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={verificationExamTime}
                        onChange={(e) => setVerificationExamTime(e.target.value)}
                        placeholder="e.g. 07:30 AM or 08:00 AM - 05:00 PM"
                        required
                        className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-semibold placeholder:text-stone-600"
                      />
                      <Clock className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {!verificationExamTime.trim() && (
                      <p className="text-[10px] text-rose-400 font-medium mt-1">
                        * Please enter examination / reporting time
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-stone-300 text-xs block mb-1 font-bold">
                      Address of Examination Venue <span className="text-rose-400 font-black">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={verificationExamVenue}
                      onChange={(e) => setVerificationExamVenue(e.target.value)}
                      placeholder="e.g. Shree Shiv Chhatrapati Sports Complex, Mahalunge, Balewadi, Pune, Maharashtra 411045"
                      required
                      className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    {!verificationExamVenue.trim() && (
                      <p className="text-[10px] text-rose-400 font-medium mt-1">
                        * Please enter the complete venue address for the admit card
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Technical Committee Verification Remarks</label>
                <textarea
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  rows={2}
                  placeholder="e.g. All documents, brown belt tenure, and Aadhaar verified."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-stone-300 space-y-1">
                <p className="text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mandatory Examination Scheduling for Admit Card</span>
                </p>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Filling the mandatory <strong>Date, Time &amp; Address of Exam</strong> and clicking <strong>&quot;Approve Candidate &amp; Issue Admit Card&quot;</strong> will verify this candidate, mark candidate as <strong>Eligible</strong>, issue their official Admit Card, and dispatch the notification email to <strong>{verifyingApp.email}</strong> with their Tracking ID and Athlete ID.
                </p>
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="p-4 px-5 sm:px-6 border-t border-stone-800 flex flex-wrap items-center justify-end gap-2 bg-[#0e1017] flex-shrink-0 z-10">
              <button
                type="button"
                onClick={handleRequestMoreDocs}
                disabled={isUpdatingStatus}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/25 transition text-xs"
              >
                Request More Docs
              </button>
              <button
                type="button"
                onClick={() => handleUpdateAppStatus("Under Verification", { admitCardIssued: false })}
                disabled={isUpdatingStatus}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold hover:bg-cyan-500/25 transition text-xs"
              >
                Mark Under Review
              </button>
              <button
                type="button"
                onClick={handleApproveCandidateForExam}
                disabled={isUpdatingStatus || !verificationExamDate || !verificationExamTime.trim() || !verificationExamVenue.trim()}
                className={`px-5 py-2.5 rounded-xl font-bold transition shadow-lg text-xs ${
                  !verificationExamDate || !verificationExamTime.trim() || !verificationExamVenue.trim()
                    ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                    : "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer"
                }`}
                title={
                  !verificationExamDate || !verificationExamTime.trim() || !verificationExamVenue.trim()
                    ? "Please fill Date, Time, and Address of Exam above to enable approval"
                    : "Approve candidate and issue official admit card"
                }
              >
                {isUpdatingStatus ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </span>
                ) : (
                  "✓ Approve Candidate & Issue Admit Card"
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 4: CANDIDATE ASSESSMENT & SCORING */}
      {evaluatingApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* STICKY HEADER */}
            <div className="flex items-start justify-between border-b border-stone-800 p-5 sm:p-6 pb-4 flex-shrink-0 bg-[#0e1017] z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    EXAMINER SCORING
                  </span>
                  <span className="text-xs text-stone-400 font-mono">{evaluatingApp.athleteId}</span>
                </div>
                <h3 className="text-lg font-bold text-white uppercase">{evaluatingApp.fullName}</h3>
                <p className="text-xs text-amber-400 font-semibold">{evaluatingApp.appliedDanTitle}</p>
              </div>

              <button
                onClick={() => setEvaluatingApp(null)}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-amber-500/50 hover:bg-stone-800 transition flex-shrink-0"
                title="Close Modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="flex-1 flex flex-col overflow-hidden">
              {/* SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
                {/* 5-Factor Scoring Matrix */}
                <div className="space-y-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800">
                  <p className="font-bold text-amber-400 uppercase text-[11px]">
                    5-Pillar Martial Arts Scoring Matrix
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-stone-400 block mb-1">1. DAN DEGREE PATTERNS (0-25) *</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={assessmentForm.formsScore}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, formsScore: Number(e.target.value) })}
                        required
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-stone-400 block mb-1">2. Sparring / Kumite (0-25) *</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={assessmentForm.sparringScore}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, sparringScore: Number(e.target.value) })}
                        required
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-stone-400 block mb-1">3. Self Defense &amp; Weapons (0-25) *</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={assessmentForm.selfDefenseScore}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, selfDefenseScore: Number(e.target.value) })}
                        required
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-stone-400 block mb-1">4. Breaking / Kyokpa (0-15) *</label>
                      <input
                        type="number"
                        min={0}
                        max={15}
                        value={assessmentForm.breakingScore}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, breakingScore: Number(e.target.value) })}
                        required
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-stone-400 block mb-1">5. Theory / Philosophy / Thesis (0-10) *</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={assessmentForm.theoryThesisScore}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, theoryThesisScore: Number(e.target.value) })}
                        required
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
                    <span className="text-xs font-bold text-white">Aggregated Total Score:</span>
                    <span className="text-lg font-black text-amber-400 font-mono">{calculatedTotal} / 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-400 block mb-1">Attendance</label>
                    <select
                      value={assessmentForm.attendance}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, attendance: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-400 block mb-1">Final Result Verdict *</label>
                    <select
                      value={assessmentForm.resultStatus}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, resultStatus: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400"
                    >
                      <option value="Passed">Passed (Issue Dan Certificate)</option>
                      <option value="Failed">Failed</option>
                      <option value="Re-test">Re-test Required</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Examiner &amp; Technical Committee Remarks</label>
                  <textarea
                    value={assessmentForm.examinerRemarks}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, examinerRemarks: e.target.value })}
                    rows={2}
                    placeholder="e.g. Flawless dynamic form execution, high-impact jump kick board breaks."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
                  <p className="font-bold text-white">Authorization:</p>
                  <p>Conferred under direct seal of <strong>Mr. Santosh Kasbe</strong> (Founder &amp; President – India | Head – Technical Committee).</p>
                </div>
              </div>

              {/* STICKY FOOTER */}
              <div className="flex justify-end gap-3 p-4 px-5 sm:px-6 border-t border-stone-800 bg-[#0e1017] flex-shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setEvaluatingApp(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssessment}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  {isSavingAssessment ? "Processing..." : "Publish Result & Issue Dan Diploma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADMIN DOCUMENT PREVIEW MODAL */}
      {previewDocModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase">{previewDocModal.title}</h3>
                <p className="text-xs text-stone-400 font-mono truncate max-w-md">{previewDocModal.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openFileInFullSize(previewDocModal.url, previewDocModal.title || previewDocModal.name)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 font-bold text-xs transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Open Full Size
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(previewDocModal.url, previewDocModal.name)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Proof
                </button>
                <button
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-stone-950 rounded-2xl border border-stone-800 p-2 overflow-hidden flex items-center justify-center">
              {previewDocModal.url.startsWith("data:image/") ||
              previewDocModal.url.endsWith(".png") ||
              previewDocModal.url.endsWith(".jpg") ||
              previewDocModal.url.endsWith(".jpeg") ? (
                <img
                  src={previewDocModal.url}
                  alt={previewDocModal.title}
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              ) : previewDocModal.url.startsWith("data:application/pdf") ||
                previewDocModal.url.endsWith(".pdf") ? (
                <iframe
                  src={previewDocModal.url}
                  title={previewDocModal.title}
                  className="w-full h-full rounded-xl bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">{previewDocModal.name}</p>
                  <p className="text-xs text-stone-400">Attached file preview is ready.</p>
                  <a
                    href={previewDocModal.url}
                    download={previewDocModal.name}
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

      {/* MODAL 6: CONFIRM CANDIDATE APPLICATION DELETION */}
      {deleteCandidateApp && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-rose-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Dan Application?</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to delete application <strong>{deleteCandidateApp.id}</strong> for <strong>{deleteCandidateApp.fullName}</strong> ({deleteCandidateApp.athleteId}) applying for <strong>{deleteCandidateApp.appliedDanTitle}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateApp(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteApp}
                disabled={isDeletingApp}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingApp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
