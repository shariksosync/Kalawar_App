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
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Download,
  Printer,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { states } from "@/data/people";
import {
  STANDARD_BELT_LEVELS,
  type BeltLevel,
  type BeltExamSession,
  type ExamCandidate,
} from "@/data/belt-exams";
import { downloadBeltDiplomaPDF, printBeltDiplomaPDF, downloadBeltRegistrationSlipPDF } from "@/lib/belt-pdf-download";
import { downloadAdmitCardPDF } from "@/lib/admit-card-pdf";
import { cn } from "@/lib/utils";

export function AdminBeltExamManager() {
  const [activeTab, setActiveTab] = useState<"syllabus" | "sessions" | "roster">("syllabus");
  const [lang, setLang] = useState<"en" | "hi">("en");

  // Sessions State
  const [exams, setExams] = useState<BeltExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Belt Grades & Syllabus State (Static Official 11 Stages)
  const [beltLevels, setBeltLevels] = useState<BeltLevel[]>(STANDARD_BELT_LEVELS);
  const [isBeltModalOpen, setIsBeltModalOpen] = useState(false);
  const [editingBelt, setEditingBelt] = useState<BeltLevel | null>(null);
  const [isSavingBelt, setIsSavingBelt] = useState(false);

  const [beltForm, setBeltForm] = useState({
    id: "",
    name: "Yellow Belt",
    gupDan: "8th Gup",
    badgeColor: "bg-amber-400 text-stone-950",
    borderColor: "border-amber-400",
    textColor: "text-amber-400",
    bgGradient: "from-amber-400 to-yellow-600",
    minTrainingMonths: 3,
    templateFile: "yellow-belt.png",
    summary: "Signifies the earth from which a plant sprouts and takes root as the foundation is laid.",
    forms: "Basic 4-Direction Punching (Saju Jirugi)\nDan-Gun Pattern (21 Movements)",
    techniques: "Walking Stance (Gunnun Sogi)\nFront Snap Kick (Ap Chagi)\nLow Block (Najunde Makgi)",
    sparring: "Basic 3-Step Pre-Arranged Sparring Drills (Sambo Matsogi)",
    selfDefense: "Basic Wrist Grab Release (Single Hand)",
    breaking: "1/2 Inch Pine Board with Front Kick",
    theory: "Meaning of Yellow Belt\nFederation Tenets\nDojo Rules & Bowing Protocol",
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<BeltExamSession | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [deleteCandidateSession, setDeleteCandidateSession] = useState<BeltExamSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Session Form
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    discipline: "Kalawar Martial Arts",
    examDate: "",
    reportingTime: "08:00 AM",
    examEndTime: "05:00 PM",
    venueName: "",
    venueAddress: "",
    city: "",
    state: "Maharashtra",
    chiefExaminer: "Grandmaster Rajesh Sharma (8th Dan)",
    chiefExaminerRank: "8th Dan Black Belt, Chief Technical Director",
    examiners: "Sensei Amit Patil (5th Dan), Sensei Sunita Deshmukh (4th Dan)",
    eligibleBelts: [
      "Yellow Belt",
      "Yellow Belt-1",
      "Green Belt",
      "Green Belt-1",
      "Blue Belt",
      "Blue Belt-1",
      "Red Belt",
      "Red Belt-1",
      "Red Belt-2",
      "Red Belt-3",
      "Junior Black Belt",
    ],
    registrationDeadline: "",
    maxCandidates: 100,
    description: "Official National Belt Grading and Technical Promotion Examination.",
    status: "Registration Open" as BeltExamSession["status"],
  });

  // Roster Management State
  const [selectedRosterExamId, setSelectedRosterExamId] = useState<string>("ALL");
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("All");
  const [evaluatingCandidate, setEvaluatingCandidate] = useState<ExamCandidate | null>(null);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [isPublishingResults, setIsPublishingResults] = useState(false);

  // Admit Card Issuance Modal State (Matching Dan Module)
  const [issuingAdmitCardCandidate, setIssuingAdmitCardCandidate] = useState<ExamCandidate | null>(null);
  const [isIssuingAdmitCard, setIsIssuingAdmitCard] = useState(false);
  const [admitCardExamDate, setAdmitCardExamDate] = useState("");
  const [admitCardReportingTime, setAdmitCardReportingTime] = useState("");
  const [admitCardSessionStartTime, setAdmitCardSessionStartTime] = useState("");
  const [admitCardSessionEndTime, setAdmitCardSessionEndTime] = useState("");
  const [admitCardExamVenue, setAdmitCardExamVenue] = useState("");
  const [admitCardChiefExaminer, setAdmitCardChiefExaminer] = useState("");
  const [admitCardRemarks, setAdmitCardRemarks] = useState("");

  // Candidate Deletion State
  const [deleteCandidateRecord, setDeleteCandidateRecord] = useState<ExamCandidate | null>(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Candidate Assessment Form (Matching attached design)
  const [assessmentForm, setAssessmentForm] = useState({
    attendance: "Pending" as "Pending" | "Present" | "Absent",
    formsScore: 25,
    sparringScore: 25,
    selfDefenseScore: 20,
    fitnessScore: 20,
    examinerRemarks: "Standard technical promotion evaluation complete.",
    resultStatus: "Pending Evaluation" as "Pending Evaluation" | "Passed" | "Failed" | "Re-test",
    evaluatedBy: "Grandmaster Rajesh Sharma (8th Dan)",
  });

  // Load Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [examsRes, levelsRes] = await Promise.all([
        fetch("/api/belt-exams"),
        fetch("/api/belt-exams/levels"),
      ]);

      let examsData: any = {};
      let levelsData: any = {};

      if (examsRes.ok) {
        const text = await examsRes.text();
        if (text.trim()) {
          try {
            examsData = JSON.parse(text);
          } catch {}
        }
      }

      if (levelsRes.ok) {
        const text = await levelsRes.text();
        if (text.trim()) {
          try {
            levelsData = JSON.parse(text);
          } catch {}
        }
      }

      if (examsData.success && Array.isArray(examsData.exams)) {
        setExams(examsData.exams);
      }

      const loadedLevels = levelsData.beltLevels || levelsData.levels || [];
      if (Array.isArray(loadedLevels) && loadedLevels.length > 0) {
        setBeltLevels(loadedLevels);
      }
    } catch (err) {
      console.error("Error loading belt exam data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------
  // BELT LEVELS (SYLLABUS) HANDLERS (STATIC & NON-DELETABLE)
  // -------------------------------------------------------------
  const handleOpenEditBelt = (belt: BeltLevel) => {
    setEditingBelt(belt);
    setBeltForm({
      id: belt.id,
      name: belt.name,
      gupDan: belt.gupDan,
      badgeColor: belt.badgeColor || "bg-amber-400 text-stone-950",
      borderColor: belt.borderColor || "border-amber-400",
      textColor: belt.textColor || "text-amber-400",
      bgGradient: belt.bgGradient || "from-amber-400 to-yellow-600",
      minTrainingMonths: belt.minTrainingMonths || 0,
      templateFile: belt.templateFile || "yellow-belt.png",
      summary: belt.summary || "",
      forms: (belt.syllabus?.forms || []).join("\n"),
      techniques: (belt.syllabus?.techniques || []).join("\n"),
      sparring: (belt.syllabus?.sparring || []).join("\n"),
      selfDefense: (belt.syllabus?.selfDefense || []).join("\n"),
      breaking: (belt.syllabus?.breaking || []).join("\n"),
      theory: (belt.syllabus?.theory || []).join("\n"),
    });
    setIsBeltModalOpen(true);
  };

  const handleSaveBelt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBelt) return;

    try {
      setIsSavingBelt(true);
      const cleanId = editingBelt.id;

      const payload = {
        templateFile: beltForm.templateFile,
        summary: beltForm.summary.trim(),
        syllabus: {
          forms: beltForm.forms.split("\n").map((s) => s.trim()).filter(Boolean),
          techniques: beltForm.techniques.split("\n").map((s) => s.trim()).filter(Boolean),
          sparring: beltForm.sparring.split("\n").map((s) => s.trim()).filter(Boolean),
          selfDefense: beltForm.selfDefense.split("\n").map((s) => s.trim()).filter(Boolean),
          breaking: beltForm.breaking.split("\n").map((s) => s.trim()).filter(Boolean),
          theory: beltForm.theory.split("\n").map((s) => s.trim()).filter(Boolean),
        },
      };

      const url = `/api/belt-exams/levels/${cleanId}`;
      const method = "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save belt syllabus");
      }

      toast.success("Belt Syllabus Updated in Database", {
        description: `${editingBelt.name} standards saved live.`,
      });

      setIsBeltModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving belt syllabus");
    } finally {
      setIsSavingBelt(false);
    }
  };

  // -------------------------------------------------------------
  // EXAM SESSIONS HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddSession = () => {
    setEditingExam(null);
    setFormData({
      id: "",
      title: "National Belt Grading Examination 2026",
      discipline: "Kalawar Martial Arts",
      examDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      reportingTime: "08:00 AM",
      examEndTime: "05:00 PM",
      venueName: "Federation Sports Arena",
      venueAddress: "Central Sports Complex",
      city: "Pune",
      state: "Maharashtra",
      chiefExaminer: "Grandmaster Rajesh Sharma (8th Dan)",
      chiefExaminerRank: "8th Dan Black Belt, Chief Technical Director",
      examiners: "Sensei Amit Patil (5th Dan), Sensei Sunita Deshmukh (4th Dan)",
      eligibleBelts: beltLevels.map((b) => b.name),
      registrationDeadline: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      maxCandidates: 100,
      description: "Official National Belt Grading and Technical Promotion Examination.",
      status: "Registration Open",
    });
    setIsSessionModalOpen(true);
  };

  const handleOpenEditSession = (exam: BeltExamSession) => {
    setEditingExam(exam);
    setFormData({
      id: exam.id,
      title: exam.title,
      discipline: exam.discipline || "Kalawar Martial Arts",
      examDate: exam.examDate,
      reportingTime: exam.reportingTime || "08:00 AM",
      examEndTime: exam.examEndTime || "05:00 PM",
      venueName: exam.venueName,
      venueAddress: exam.venueAddress,
      city: exam.city,
      state: exam.state,
      chiefExaminer: exam.chiefExaminer,
      chiefExaminerRank: exam.chiefExaminerRank || "",
      examiners: (exam.examiners || []).join(", "),
      eligibleBelts: exam.eligibleBelts || [],
      registrationDeadline: exam.registrationDeadline,
      maxCandidates: exam.maxCandidates || 100,
      description: exam.description || "",
      status: exam.status,
    });
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.examDate || !formData.venueName.trim()) {
      toast.error("Please fill in Title, Date, and Venue");
      return;
    }

    try {
      setIsSavingSession(true);
      const isNew = !editingExam;
      const url = isNew ? "/api/belt-exams" : `/api/belt-exams/${editingExam.id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...formData,
        examiners: formData.examiners.split(",").map((s) => s.trim()).filter(Boolean),
        maxCandidates: Number(formData.maxCandidates) || 100,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save session");
      }

      toast.success(isNew ? "Session Created" : "Session Updated", {
        description: `${formData.title} (${formData.examDate}) saved.`,
      });

      setIsSessionModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving session");
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteCandidateSession) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/belt-exams/${deleteCandidateSession.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete session");
      }
      toast.success("Session Deleted", {
        description: `${deleteCandidateSession.title} removed.`,
      });
      setDeleteCandidateSession(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // CANDIDATE LIFECYCLE: ADMIT CARD ISSUE & INDIVIDUAL ASSESSMENT
  // -------------------------------------------------------------
  const handleOpenAdmitCardModal = (candidate: ExamCandidate & { examSession?: BeltExamSession }) => {
    setIssuingAdmitCardCandidate(candidate);
    const session =
      candidate.examSession ||
      exams.find((e) => e.candidates?.some((c) => c.id === candidate.id)) ||
      (selectedRosterExamId !== "ALL" ? exams.find((e) => e.id === selectedRosterExamId) : null) ||
      exams[0] ||
      null;

    const defaultDate = candidate.examDate || session?.examDate || "";
    const defaultReporting = candidate.reportingTime || candidate.examTime || session?.reportingTime || "07:30 AM";
    const defaultSessionStart = candidate.examTime || candidate.reportingTime || session?.reportingTime || "07:30 AM";
    const defaultSessionEnd = candidate.sessionEndTime || session?.examEndTime || "06:00 PM";
    const defaultVenue =
      candidate.examVenue ||
      (session
        ? `${session.venueName}${session.venueAddress ? ", " + session.venueAddress : ""}, ${session.city}, ${session.state}`
        : "") ||
      "";
    const defaultExaminer =
      candidate.chiefExaminer ||
      candidate.evaluatedBy ||
      (session ? `${session.chiefExaminer}${session.chiefExaminerRank ? ` (${session.chiefExaminerRank})` : ""}` : "") ||
      "Grandmaster Rajesh Sharma (8th Dan Black Belt, National Technical Director)";

    setAdmitCardExamDate(defaultDate);
    setAdmitCardReportingTime(defaultReporting);
    setAdmitCardSessionStartTime(defaultSessionStart);
    setAdmitCardSessionEndTime(defaultSessionEnd);
    setAdmitCardExamVenue(defaultVenue);
    setAdmitCardChiefExaminer(defaultExaminer);
    setAdmitCardRemarks(candidate.admitCardRemarks || "");
  };

  const handleApproveAndIssueAdmitCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!issuingAdmitCardCandidate) return;

    const session =
      (issuingAdmitCardCandidate as any).examSession ||
      exams.find((e) => e.candidates?.some((c) => c.id === issuingAdmitCardCandidate.id)) ||
      (selectedRosterExamId !== "ALL" ? exams.find((e) => e.id === selectedRosterExamId) : null) ||
      exams[0];

    if (!session) {
      toast.error("Examination session could not be determined.");
      return;
    }

    if (!admitCardExamDate.trim()) {
      toast.error("Date of Examination is mandatory before issuing admit card.");
      return;
    }
    if (!admitCardReportingTime.trim()) {
      toast.error("Reporting Time is mandatory before issuing admit card.");
      return;
    }
    if (!admitCardSessionStartTime.trim() || !admitCardSessionEndTime.trim()) {
      toast.error("Session Time (From & To) is mandatory before issuing admit card.");
      return;
    }
    if (!admitCardExamVenue.trim()) {
      toast.error("Address of Examination Venue is mandatory before issuing admit card.");
      return;
    }

    try {
      setIsIssuingAdmitCard(true);
      const res = await fetch(
        `/api/belt-exams/${encodeURIComponent(session.id)}/candidates/${encodeURIComponent(issuingAdmitCardCandidate.id)}/issue-admit-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issuedBy: "Federation Technical Secretariat",
            examDate: admitCardExamDate.trim(),
            examTime: admitCardSessionStartTime.trim(),
            reportingTime: admitCardReportingTime.trim(),
            sessionEndTime: admitCardSessionEndTime.trim(),
            examVenue: admitCardExamVenue.trim(),
            chiefExaminer: admitCardChiefExaminer.trim(),
            admitCardRemarks: admitCardRemarks.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to issue admit card");
      }

      toast.success("Admit Card Issued & Email Notification Dispatched!", {
        description: `Admit card issued for ${issuingAdmitCardCandidate.athleteName} (Roll: ${issuingAdmitCardCandidate.id}). Confirmation emailed to ${issuingAdmitCardCandidate.email || "candidate"}.`,
      });

      setIssuingAdmitCardCandidate(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error issuing admit card");
    } finally {
      setIsIssuingAdmitCard(false);
    }
  };

  const handleOpenAssessCandidate = (cand: ExamCandidate & { examSession?: BeltExamSession }) => {
    setEvaluatingCandidate(cand);
    setAssessmentForm({
      attendance: cand.attendance || "Present",
      formsScore: cand.assessment?.formsScore !== undefined ? cand.assessment.formsScore : 25,
      sparringScore: cand.assessment?.sparringScore !== undefined ? cand.assessment.sparringScore : 25,
      selfDefenseScore: cand.assessment?.selfDefenseScore !== undefined ? cand.assessment.selfDefenseScore : 20,
      fitnessScore: cand.assessment?.fitnessScore !== undefined ? cand.assessment.fitnessScore : 20,
      examinerRemarks: cand.assessment?.examinerRemarks || "Standard technical promotion evaluation complete.",
      resultStatus:
        cand.status === "Result Declared"
          ? ((cand.resultStatus as any) || "Passed")
          : "Passed",
      evaluatedBy: cand.evaluatedBy || "Grandmaster Rajesh Sharma (8th Dan)",
    });
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingCandidate) return;

    const session =
      (evaluatingCandidate as any).examSession ||
      exams.find((e) => e.candidates?.some((c) => c.id === evaluatingCandidate.id)) ||
      (selectedRosterExamId !== "ALL" ? exams.find((e) => e.id === selectedRosterExamId) : null) ||
      exams[0];

    if (!session) return;

    try {
      setIsSavingAssessment(true);
      const res = await fetch(`/api/belt-exams/${encodeURIComponent(session.id)}/assess`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: evaluatingCandidate.id,
          ...assessmentForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save assessment");
      }

      if (assessmentForm.resultStatus === "Pending Evaluation") {
        toast.success("Assessment Draft Saved!", {
          description: `Scorecard updated for ${evaluatingCandidate.athleteName}. Evaluation remains pending.`,
        });
      } else {
        toast.success("Assessment Saved & Result Declared!", {
          description: `${evaluatingCandidate.athleteName}: ${assessmentForm.resultStatus} (${evaluatingCandidate.targetBelt}). Result email dispatched to ${evaluatingCandidate.email || "candidate"}.`,
        });
      }

      setEvaluatingCandidate(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving candidate assessment");
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!deleteCandidateRecord) return;
    const session =
      (deleteCandidateRecord as any).examSession ||
      exams.find((e) => e.candidates?.some((c) => c.id === deleteCandidateRecord.id)) ||
      (selectedRosterExamId !== "ALL" ? exams.find((e) => e.id === selectedRosterExamId) : null) ||
      exams[0];

    if (!session) return;

    try {
      setIsDeletingCandidate(true);
      const res = await fetch(
        `/api/belt-exams/${encodeURIComponent(session.id)}/candidates/${encodeURIComponent(deleteCandidateRecord.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove candidate");
      }
      toast.success("Candidate Removed", {
        description: `${deleteCandidateRecord.athleteName} removed from session.`,
      });
      setDeleteCandidateRecord(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete candidate");
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  const handlePublishAllResults = async () => {
    if (!selectedRosterExamId || selectedRosterExamId === "ALL") {
      toast.error("Please select a specific exam session from the dropdown to publish results.");
      return;
    }
    try {
      setIsPublishingResults(true);
      const res = await fetch(`/api/belt-exams/${encodeURIComponent(selectedRosterExamId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Results Published" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish results");
      }
      toast.success("Session Results Published!", {
        description: "Official results are now ratified and viewable by candidates.",
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error publishing results");
    } finally {
      setIsPublishingResults(false);
    }
  };

  const selectedRosterExam = useMemo(() => {
    if (selectedRosterExamId === "ALL") return null;
    return exams.find((e) => e.id === selectedRosterExamId) || null;
  }, [exams, selectedRosterExamId]);

  const totalCandidatesCount = useMemo(() => {
    return exams.reduce((acc, e) => acc + (e.candidates?.length || 0), 0);
  }, [exams]);

  const displayCandidates = useMemo(() => {
    let list: (ExamCandidate & { examSession: BeltExamSession })[] = [];
    if (selectedRosterExamId && selectedRosterExamId !== "ALL") {
      const exam = exams.find((e) => e.id === selectedRosterExamId);
      if (exam && exam.candidates) {
        list = exam.candidates.map((c) => ({ ...c, examSession: exam }));
      }
    } else {
      list = exams.flatMap((ex) => (ex.candidates || []).map((c) => ({ ...c, examSession: ex })));
    }

    if (rosterStatusFilter !== "All") {
      list = list.filter((c) => c.status === rosterStatusFilter);
    }

    if (rosterSearchQuery.trim()) {
      const q = rosterSearchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.athleteName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.athleteId?.toLowerCase().includes(q) ||
          (c.certificateNumber && c.certificateNumber.toLowerCase().includes(q)) ||
          c.registrationSlipId?.toLowerCase().includes(q) ||
          c.admitCardNumber?.toLowerCase().includes(q) ||
          c.targetBelt?.toLowerCase().includes(q) ||
          c.currentBelt?.toLowerCase().includes(q) ||
          c.academyName?.toLowerCase().includes(q) ||
          c.clubName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q) ||
          c.examSession?.title?.toLowerCase().includes(q) ||
          c.examSession?.id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [exams, selectedRosterExamId, rosterStatusFilter, rosterSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Admin Secretariat
            </span>
            <span className="text-xs text-stone-400">Gup &amp; Dan Belt Grading Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Belt Examination Administration
          </h1>
          <p className="text-xs text-stone-400">
            Manage 11-stage belt progression syllabus, examination sessions, admit card issuance, scorecard evaluations, and digital diploma publications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-stone-900 border border-stone-800 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab("syllabus")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer",
            activeTab === "syllabus"
              ? "bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/20"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Award className="w-4 h-4" />
          <span>Belt Ranks ({beltLevels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer",
            activeTab === "sessions"
              ? "bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/20"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("roster")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer",
            activeTab === "roster"
              ? "bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/20"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Roster &amp; Results</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BELT RANKS & SYLLABUS EDITOR (11 STATIC OFFICIAL RANKS) */}
      {/* ========================================================================= */}
      {activeTab === "syllabus" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Static &amp; Non-Deletable
                </span>
                <span className="text-[10px] text-stone-400">Strict Standard Progression</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {lang === "hi" ? "आधिकारिक 11-चरणीय बेल्ट रैंकिंग मानक" : "Official 11-Stage Belt Ranking Standards"}
              </h3>
              <p className="text-xs text-stone-400">
                {lang === "hi"
                  ? "अनुक्रम 1 (आरम्भ) से अनुक्रम 11 (संगम) तक का आधिकारिक स्तर, रंग और तकनीकी पाठ्यक्रम।"
                  : "Official hierarchy and technical syllabus from Yellow Belt (Rank 1) to Junior Black Belt (Rank 11)."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Language Selector Switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                    lang === "en"
                      ? "bg-amber-400 text-stone-950 font-black shadow"
                      : "text-stone-400 hover:text-white"
                  )}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                    lang === "hi"
                      ? "bg-amber-400 text-stone-950 font-black shadow"
                      : "text-stone-400 hover:text-white"
                  )}
                >
                  <span>🇮🇳</span>
                  <span>Hindi (हिंदी)</span>
                </button>
              </div>

              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-stone-300 hidden md:flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>11 Official Levels</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beltLevels.map((belt, idx) => {
              const anukkamaNum = belt.anukkamaNumber || idx + 1;
              const displayName = lang === "hi" && belt.nameHindi ? `${belt.nameHindi} (${belt.name})` : belt.name;
              const anukkamaTitle = lang === "hi" && belt.anukkamaNameHindi ? `${belt.anukkamaNameHindi} (${belt.anukkamaName})` : belt.anukkamaName;
              const colorDisplay = lang === "hi" && belt.beltColorNameHindi ? `${belt.beltColorNameHindi} (${belt.beltColorName})` : belt.beltColorName;

              return (
                <div
                  key={belt.id}
                  className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between hover:border-stone-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        {lang === "hi" ? `अनुक्रम ${anukkamaNum}` : `Anukkama ${anukkamaNum}`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{belt.beltEmoji || "🥋"}</span>
                        <span>{displayName}</span>
                      </h4>

                      <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between text-xs font-semibold text-stone-300">
                        <span className="text-amber-400 font-bold">
                          {lang === "hi" ? `अनुक्रम ${anukkamaNum}: ${anukkamaTitle}` : `Anukkama ${anukkamaNum}: ${anukkamaTitle}`}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 capitalize">
                          {colorDisplay}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-400 line-clamp-2 italic font-serif">
                      "{belt.summary}"
                    </p>

                    <div className="pt-2 text-[11px] text-stone-300 space-y-1">
                      <p>• Forms: <strong>{belt.syllabus?.forms?.length || 0} patterns</strong></p>
                      <p>• Techniques: <strong>{belt.syllabus?.techniques?.length || 0} techniques</strong></p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-stone-600" /> Static Standard
                    </span>
                    <button
                      onClick={() => handleOpenEditBelt(belt)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition cursor-pointer text-xs font-bold flex items-center gap-1.5 border border-stone-700/60"
                      title="Edit Syllabus Requirements"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Syllabus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXAM SESSIONS */}
      {/* ========================================================================= */}
      {activeTab === "sessions" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Belt Examination Sessions</h3>
              <p className="text-xs text-stone-400">
                Create and manage official examination dates, venues, and chief examiners.
              </p>
            </div>

            <button
              onClick={handleOpenAddSession}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Exam Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded-md">
                      {exam.id}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                        exam.status === "Registration Open"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-stone-800 text-stone-400"
                      )}
                    >
                      ● {exam.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{exam.title}</h4>

                  <div className="space-y-1 text-xs text-stone-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{exam.examDate} ({exam.reportingTime})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{exam.venueName}, {exam.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Candidates Enrolled: <strong>{exam.candidates?.length || 0}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedRosterExamId(exam.id);
                      setActiveTab("roster");
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
                  >
                    View Roster ({exam.candidates?.length || 0}) &rarr;
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditSession(exam)}
                      className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidateSession(exam)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
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

      {/* ========================================================================= */}
      {/* TAB 3: CANDIDATE ROSTER & RESULTS (LIFECYCLE) */}
      {/* ========================================================================= */}
      {activeTab === "roster" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Filter Controls */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex-shrink-0">
                  Exam Session:
                </span>
                <select
                  value={selectedRosterExamId}
                  onChange={(e) => setSelectedRosterExamId(e.target.value)}
                  className="w-full sm:w-auto min-w-[280px] px-3.5 py-2.5 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl text-xs text-white font-bold cursor-pointer"
                >
                  <option value="ALL">
                    🌟 All Examination Sessions ({totalCandidatesCount} Total Candidates)
                  </option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.examDate}) — {ex.candidates?.length || 0} Candidates
                    </option>
                  ))}
                </select>
              </div>

              {selectedRosterExam && (
                <button
                  onClick={handlePublishAllResults}
                  disabled={isPublishingResults}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Results for this Session</span>
                </button>
              )}
            </div>

            {/* Sub-Filters: Search Bar & Status Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-800/80">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={rosterSearchQuery}
                  onChange={(e) => setRosterSearchQuery(e.target.value)}
                  placeholder="Search candidate name, ID, cert (e.g. KAC-BELT-2026-4938), roll no, belt..."
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {rosterSearchQuery && (
                  <button
                    onClick={() => setRosterSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["All", "Submitted", "Admit Card Issued", "Result Declared"] as const).map((st) => {
                  const count =
                    st === "All"
                      ? selectedRosterExamId === "ALL"
                        ? totalCandidatesCount
                        : selectedRosterExam?.candidates?.length || 0
                      : (selectedRosterExamId === "ALL"
                          ? exams.flatMap((e) => e.candidates || [])
                          : selectedRosterExam?.candidates || []
                        ).filter((c) => c.status === st).length;

                  return (
                    <button
                      key={st}
                      onClick={() => setRosterStatusFilter(st)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer",
                        rosterStatusFilter === st
                          ? "bg-amber-400 text-stone-950 shadow-md font-black"
                          : "bg-stone-950 text-stone-400 hover:text-white border border-stone-800"
                      )}
                    >
                      {st === "Submitted" ? "Submitted (Pending)" : st} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Candidate Table */}
          {displayCandidates.length > 0 ? (
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-950/80 text-stone-400 uppercase font-mono text-[10px] border-b border-stone-800">
                    <tr>
                      <th className="p-4">Roll No, ID &amp; Certificate</th>
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Academy / Dojo</th>
                      <th className="p-4">Belt Progression</th>
                      <th className="p-4">Stage &amp; Status</th>
                      <th className="p-4">Score &amp; Grade</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {displayCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-stone-800/40 transition">
                        <td className="p-4 font-mono">
                          <p className="font-bold text-amber-400">{cand.id}</p>
                          <p className="text-[10px] text-stone-400">{cand.athleteId}</p>
                          {cand.certificateNumber && (
                            <div className="mt-1 flex items-center gap-1">
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold flex items-center gap-1"
                                title={`Certificate: ${cand.certificateNumber}`}
                              >
                                <Award className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{cand.certificateNumber}</span>
                              </span>
                            </div>
                          )}
                          {selectedRosterExamId === "ALL" && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-sans truncate max-w-[130px]" title={cand.examSession?.title}>
                              {cand.examSession?.city || "Exam"} ({cand.examSession?.examDate})
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white uppercase">{cand.athleteName}</p>
                          <p className="text-[10px] text-stone-400">{cand.email || "No email"}</p>
                          {cand.phone && <p className="text-[10px] text-stone-500">{cand.phone}</p>}
                        </td>

                        <td className="p-4">
                          <p className="font-semibold text-white truncate max-w-[160px]">
                            {cand.academyName || cand.clubName}
                          </p>
                          <p className="text-[10px] text-stone-400">{cand.state}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-amber-300">🥋 {cand.targetBelt}</p>
                          <p className="text-[10px] text-stone-400">From: {cand.currentBelt}</p>
                        </td>

                        <td className="p-4">
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border",
                              cand.status === "Result Declared"
                                ? cand.resultStatus === "Passed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-red-500/10 text-red-400 border-red-500/30"
                                : cand.status === "Admit Card Issued"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}
                          >
                            ● {cand.status || "Submitted"}
                          </span>
                        </td>

                        <td className="p-4">
                          {cand.status === "Result Declared" ? (
                            <div>
                              <p className="font-bold text-emerald-400">{cand.assessment?.grade || "Pass"}</p>
                              <p className="text-[10px] text-stone-400">{cand.assessment?.totalScore || 85}/100</p>
                              {cand.certificateNumber && (
                                <p className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1 mt-0.5" title={`Certificate Number: ${cand.certificateNumber}`}>
                                  <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate max-w-[130px]">{cand.certificateNumber}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 font-mono">—</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cand.status === "Submitted" && (
                              <button
                                onClick={() => handleOpenAdmitCardModal(cand)}
                                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-md cursor-pointer"
                                title="Review and issue official examination admit card"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Issue Admit Card</span>
                              </button>
                            )}

                            {(cand.status === "Admit Card Issued" || cand.status === "Submitted") && (
                              <button
                                onClick={() => handleOpenAssessCandidate(cand)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold transition flex items-center gap-1 shadow-md cursor-pointer"
                                title="Grade candidate and declare official promotion result"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Declare Result</span>
                              </button>
                            )}

                            {(cand.status === "Admit Card Issued" || cand.status === "Result Declared") && (
                              <button
                                onClick={() => {
                                  const ex = cand.examSession || selectedRosterExam || exams[0];
                                  if (ex) {
                                    downloadAdmitCardPDF({
                                      candidate: cand,
                                      exam: ex,
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition cursor-pointer"
                                title="Download Official Admit Card (PDF)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {cand.status === "Admit Card Issued" && (
                              <button
                                onClick={() => handleOpenAdmitCardModal(cand)}
                                className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition cursor-pointer"
                                title="Edit / Re-issue Admit Card"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {cand.status === "Result Declared" && (
                              <>
                                <button
                                  onClick={() => handleOpenAssessCandidate(cand)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                                  title="Edit Scorecard"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {cand.resultStatus === "Passed" && cand.certificateNumber && (
                                  <>
                                    <Link
                                      href={`/certificates/belt/${encodeURIComponent(cand.certificateNumber)}`}
                                      target="_blank"
                                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition"
                                      title="View Certificate"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>

                                    <button
                                      onClick={() => downloadBeltDiplomaPDF({
                                        athleteName: cand.athleteName,
                                        certificateNumber: cand.certificateNumber,
                                        beltRank: cand.targetBelt,
                                        state: cand.state,
                                        athleteId: cand.athleteId,
                                        dob: cand.dob || "15/08/2008",
                                        academyName: cand.academyName || cand.clubName,
                                        examDate: cand.examDate || cand.examSession?.examDate,
                                        issuedDate: cand.resultDeclaredAt || cand.examSession?.examDate,
                                      })}
                                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition cursor-pointer"
                                      title="Download Master PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => printBeltDiplomaPDF({
                                        athleteName: cand.athleteName,
                                        certificateNumber: cand.certificateNumber,
                                        beltRank: cand.targetBelt,
                                        state: cand.state,
                                        athleteId: cand.athleteId,
                                        dob: cand.dob || "15/08/2008",
                                        academyName: cand.academyName || cand.clubName,
                                        examDate: cand.examDate || cand.examSession?.examDate,
                                        issuedDate: cand.resultDeclaredAt || cand.examSession?.examDate,
                                      })}
                                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                                      title="Print Official Master Certificate"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                            {/* Registration Slip Download */}
                            <button
                              onClick={() => {
                                const ex = cand.examSession || selectedRosterExam || exams[0];
                                if (ex) {
                                  downloadBeltRegistrationSlipPDF({
                                    candidate: cand,
                                    exam: ex,
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition cursor-pointer"
                              title="Download Official Registration Slip (PDF)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteCandidateRecord(cand)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                              title="Delete Candidate"
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
          ) : (
            <div className="bg-stone-900/40 border border-stone-800 rounded-3xl p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-stone-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">No candidates match the selected filter criteria.</p>
                <p className="text-xs text-stone-400">
                  {rosterSearchQuery || rosterStatusFilter !== "All"
                    ? "Try clearing your search query or switching the status filter to 'All'."
                    : "When candidates register online for belt examinations, they will appear here for admin review and admit card approval."}
                </p>
              </div>
              {(rosterSearchQuery || rosterStatusFilter !== "All" || selectedRosterExamId !== "ALL") && (
                <button
                  onClick={() => {
                    setSelectedRosterExamId("ALL");
                    setRosterSearchQuery("");
                    setRosterStatusFilter("All");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-400 transition cursor-pointer"
                >
                  View All Candidates Across All Sessions
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIT CARD ISSUANCE WINDOW / MODAL (MATCHING DAN MODULE) */}
      {/* ========================================================================= */}
      {issuingAdmitCardCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#0e1017] border-2 border-blue-500/60 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* STICKY HEADER */}
            <div className="flex items-start justify-between border-b border-stone-800 p-5 sm:p-6 pb-4 flex-shrink-0 bg-[#0e1017] z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                    ADMIT CARD ISSUANCE
                  </span>
                  <span className="text-xs text-stone-400 font-mono">{issuingAdmitCardCandidate.athleteId}</span>
                  {issuingAdmitCardCandidate.certificateNumber && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-400" />
                      {issuingAdmitCardCandidate.certificateNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white uppercase">{issuingAdmitCardCandidate.athleteName}</h3>
                <p className="text-xs text-amber-400 font-semibold">
                  Target Belt: 🥋 {issuingAdmitCardCandidate.targetBelt} | Roll No: {issuingAdmitCardCandidate.id}
                </p>
              </div>

              <button
                onClick={() => setIssuingAdmitCardCandidate(null)}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-blue-500/50 hover:bg-stone-800 transition flex-shrink-0 cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveAndIssueAdmitCard} className="flex-1 flex flex-col overflow-hidden">
              {/* SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
                {/* Candidate Summary */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-stone-950 rounded-2xl border border-stone-800">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Affiliated Academy:</span>
                    <p className="font-bold text-white mt-0.5 truncate">
                      {issuingAdmitCardCandidate.academyName || issuingAdmitCardCandidate.clubName}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Registration Slip:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="font-mono font-bold text-amber-400">
                        {issuingAdmitCardCandidate.registrationSlipId || "KAC-SLIP-001"}
                      </p>
                      {(() => {
                        const candidateSession =
                          (issuingAdmitCardCandidate as any).examSession ||
                          exams.find((e) => e.candidates?.some((c) => c.id === issuingAdmitCardCandidate.id)) ||
                          selectedRosterExam ||
                          exams[0];

                        return candidateSession ? (
                          <button
                            type="button"
                            onClick={() => downloadBeltRegistrationSlipPDF({
                              candidate: issuingAdmitCardCandidate,
                              exam: candidateSession,
                            })}
                            className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Download Official Registration Slip (PDF)"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Slip</span>
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* MANDATORY EXAMINATION SCHEDULING */}
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
                        value={admitCardExamDate}
                        onChange={(e) => setAdmitCardExamDate(e.target.value)}
                        required
                        className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white text-xs font-semibold [color-scheme:dark]"
                      />
                      {!admitCardExamDate && (
                        <p className="text-[10px] text-rose-400 font-medium mt-1">
                          * Please select an exam date
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-stone-300 text-xs block mb-1 font-bold flex items-center justify-between">
                        <span>Reporting Time <span className="text-rose-400 font-black">*</span></span>
                        <span className="text-[10px] text-stone-500 font-normal">e.g. 07:30 AM</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={admitCardReportingTime}
                          onChange={(e) => setAdmitCardReportingTime(e.target.value)}
                          placeholder="e.g. 07:30 AM"
                          required
                          className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-semibold placeholder:text-stone-600"
                        />
                        <Clock className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {!admitCardReportingTime.trim() && (
                        <p className="text-[10px] text-rose-400 font-medium mt-1">
                          * Please enter candidate reporting time
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-stone-300 text-xs block mb-1 font-bold flex items-center justify-between">
                        <span>Session Start Time (From) <span className="text-rose-400 font-black">*</span></span>
                        <span className="text-[10px] text-stone-500 font-normal">e.g. 07:30 AM</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={admitCardSessionStartTime}
                          onChange={(e) => setAdmitCardSessionStartTime(e.target.value)}
                          placeholder="e.g. 07:30 AM or 08:00 AM"
                          required
                          className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-semibold placeholder:text-stone-600"
                        />
                        <Clock className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-stone-300 text-xs block mb-1 font-bold flex items-center justify-between">
                        <span>Session End Time (To) <span className="text-rose-400 font-black">*</span></span>
                        <span className="text-[10px] text-stone-500 font-normal">e.g. 06:00 PM</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={admitCardSessionEndTime}
                          onChange={(e) => setAdmitCardSessionEndTime(e.target.value)}
                          placeholder="e.g. 05:00 PM or 06:00 PM"
                          required
                          className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-semibold placeholder:text-stone-600"
                        />
                        <Clock className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-stone-300 text-xs block mb-1 font-bold">
                        Chief Examiner &amp; Designation <span className="text-rose-400 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        value={admitCardChiefExaminer}
                        onChange={(e) => setAdmitCardChiefExaminer(e.target.value)}
                        placeholder="e.g. Grandmaster Rajesh Sharma (8th Dan Black Belt, National Technical Director)"
                        required
                        className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white text-xs font-semibold placeholder:text-stone-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-stone-300 text-xs block mb-1 font-bold">
                        Address of Examination Venue / Place <span className="text-rose-400 font-black">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={admitCardExamVenue}
                        onChange={(e) => setAdmitCardExamVenue(e.target.value)}
                        placeholder="e.g. Shiv Chhatrapati Sports Complex, Balewadi, Pune, Maharashtra 411045"
                        required
                        className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white text-xs"
                      />
                      {!admitCardExamVenue.trim() && (
                        <p className="text-[10px] text-rose-400 font-medium mt-1">
                          * Please enter the complete venue address for the admit card
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1 font-medium">Technical Secretariat Remarks</label>
                  <textarea
                    value={admitCardRemarks}
                    onChange={(e) => setAdmitCardRemarks(e.target.value)}
                    rows={2}
                    placeholder="e.g. Candidate registration confirmed. Please carry official sparring gear and dobok."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-stone-300 space-y-1">
                  <p className="text-blue-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Automated Email Notification</span>
                  </p>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Clicking <strong>&quot;Approve Candidate &amp; Issue Admit Card&quot;</strong> will issue the official Admit Card number and immediately dispatch the notification email with hall ticket details, exam date, time, and venue to <strong>{issuingAdmitCardCandidate.email || "candidate email"}</strong>.
                  </p>
                </div>
              </div>

              {/* STICKY FOOTER ACTIONS */}
              <div className="p-4 px-5 sm:px-6 border-t border-stone-800 flex items-center justify-end gap-2 bg-[#0e1017] flex-shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIssuingAdmitCardCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isIssuingAdmitCard ||
                    !admitCardExamDate ||
                    !admitCardReportingTime.trim() ||
                    !admitCardSessionStartTime.trim() ||
                    !admitCardSessionEndTime.trim() ||
                    !admitCardExamVenue.trim()
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold transition shadow-lg text-xs ${
                    !admitCardExamDate ||
                    !admitCardReportingTime.trim() ||
                    !admitCardSessionStartTime.trim() ||
                    !admitCardSessionEndTime.trim() ||
                    !admitCardExamVenue.trim()
                      ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                      : "bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20 cursor-pointer"
                  }`}
                >
                  {isIssuingAdmitCard ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </span>
                  ) : (
                    "✓ Approve Candidate & Issue Admit Card"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INDIVIDUAL CANDIDATE EVALUATION MODAL (EXACT REPLICA OF ATTACHED DESIGN) */}
      {/* ========================================================================= */}
      {evaluatingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#0e1017] border border-stone-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {evaluatingCandidate.id}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">{evaluatingCandidate.athleteId}</span>
                  {evaluatingCandidate.certificateNumber && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-400" />
                      {evaluatingCandidate.certificateNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-1">
                  EVALUATING: {evaluatingCandidate.athleteName}
                </h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  Target: {evaluatingCandidate.targetBelt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingCandidate(null)}
                className="text-xs text-stone-400 hover:text-white transition cursor-pointer font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-5">
              {/* Row 1: 4 Scoring Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Examination Patterns (0-25) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={assessmentForm.formsScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, formsScore: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Sparring (0-25) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={assessmentForm.sparringScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, sparringScore: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Self Defense (0-25) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={assessmentForm.selfDefenseScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, selfDefenseScore: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Fitness / Breaking (0-25) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={assessmentForm.fitnessScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, fitnessScore: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Row 2: 2 Dropdown Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Attendance Status
                  </label>
                  <select
                    value={assessmentForm.attendance}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, attendance: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-xs font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                    Result Classification
                  </label>
                  <select
                    value={assessmentForm.resultStatus}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, resultStatus: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-white text-xs font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Pending Evaluation">Pending Evaluation</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Re-test">Re-test</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Full Width Textarea */}
              <div>
                <label className="text-[11px] text-stone-400 font-medium mb-1.5 block">
                  Examiner Remarks &amp; Feedback
                </label>
                <textarea
                  rows={3}
                  value={assessmentForm.examinerRemarks}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, examinerRemarks: e.target.value })}
                  placeholder="Standard technical promotion evaluation complete."
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Bottom Right Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingCandidate(null)}
                  className="px-6 py-2.5 rounded-full bg-stone-800 text-stone-300 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssessment}
                  className="px-7 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingAssessment ? "Saving..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BELT LEVEL MODAL (DYNAMIC SYLLABUS EDITOR - FIXED HIERARCHY) */}
      {/* ========================================================================= */}
      {isBeltModalOpen && editingBelt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBeltModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Locked Belt Rank
                </span>
                <span className="text-[10px] text-stone-400">
                  {editingBelt.anukkamaNumber ? `Anukkama ${editingBelt.anukkamaNumber}: ${editingBelt.anukkamaName}` : "Official Standard Hierarchy"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{editingBelt.beltEmoji || "🥋"}</span>
                <span>Edit Syllabus: {editingBelt.name}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Updates save live to the database and dynamically reflect on the public syllabus page and diploma certificates.
              </p>
            </div>

            <form onSubmit={handleSaveBelt} className="space-y-4 text-xs">
              {/* Fixed Belt Metadata Header */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 block uppercase">Belt Standard</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    <span>{editingBelt.beltEmoji || "🥋"}</span>
                    <span>{editingBelt.name}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 block uppercase">Anukkama Stage</span>
                  <span className="text-sm font-bold text-amber-400">
                    Anukkama {editingBelt.anukkamaNumber || 1}: {editingBelt.anukkamaName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 block uppercase">Color</span>
                  <span className="text-xs font-mono text-stone-400 capitalize">{editingBelt.beltColorName}</span>
                </div>
              </div>

              {/* Summary Meaning & Significance */}
              <div>
                <label className="block font-bold text-stone-300 uppercase mb-1">Summary Meaning &amp; Significance</label>
                <textarea
                  rows={2}
                  value={beltForm.summary}
                  onChange={(e) => setBeltForm({ ...beltForm, summary: e.target.value })}
                  placeholder="Official symbolic meaning and focus of this belt level..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* 6 Core Syllabus Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    1. Belt Examination Patterns <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.forms}
                    onChange={(e) => setBeltForm({ ...beltForm, forms: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    2. Fundamental Stances &amp; Strikes <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.techniques}
                    onChange={(e) => setBeltForm({ ...beltForm, techniques: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    3. Sparring &amp; Step Drills <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.sparring}
                    onChange={(e) => setBeltForm({ ...beltForm, sparring: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    4. Self-Defense Applications <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.selfDefense}
                    onChange={(e) => setBeltForm({ ...beltForm, selfDefense: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    5. Power Breaking <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.breaking}
                    onChange={(e) => setBeltForm({ ...beltForm, breaking: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">
                    6. Philosophy &amp; Federation Ethics <span className="text-stone-500 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={beltForm.theory}
                    onChange={(e) => setBeltForm({ ...beltForm, theory: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsBeltModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBelt}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingBelt ? "Saving to Database..." : "Save Syllabus to Database"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SESSION MODAL */}
      {/* ========================================================================= */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border-2 border-amber-500/50 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white">
              {editingExam ? "Edit Exam Session" : "Create New Exam Session"}
            </h3>

            <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-300 uppercase mb-1">Session Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">Reporting Time</label>
                  <input
                    type="text"
                    value={formData.reportingTime}
                    onChange={(e) => setFormData({ ...formData, reportingTime: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">Venue Name *</label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">Chief Examiner</label>
                  <input
                    type="text"
                    value={formData.chiefExaminer}
                    onChange={(e) => setFormData({ ...formData, chiefExaminer: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-300 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                  >
                    <option value="Registration Open">Registration Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Results Published">Results Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSession}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSession ? "Saving..." : "Save Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {deleteCandidateSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-red-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Delete Exam Session?</h4>
            <p className="text-xs text-stone-400">{deleteCandidateSession.title}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidateSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-300 bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
              >
                {isDeleting ? "Deleting..." : "Delete Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCandidateRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-red-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Remove Candidate?</h4>
            <p className="text-xs text-stone-400">
              Remove {deleteCandidateRecord.athleteName} ({deleteCandidateRecord.id}) from this session.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidateRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-300 bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCandidate}
                disabled={isDeletingCandidate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
              >
                {isDeletingCandidate ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
