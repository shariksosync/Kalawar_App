"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Scale,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Building2,
  Phone,
  Mail,
  Filter,
  ExternalLink,
  Paperclip,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Award,
  Calendar,
  UserCheck,
  UserX,
  Star,
  Trophy,
  MapPin,
  Check,
  Flame,
  QrCode,
  UploadCloud,
  Upload,
  Camera,
  Loader2,
  Printer,
  FileCheck,
  Edit2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { states, disciplines } from "@/data/people";
import {
  getClubDropdownOptions,
  getApprovedStateAssociationDropdownOptions,
  getApprovedDistrictAssociationDropdownOptions,
} from "@/lib/club-coach-options";
import {
  REFEREE_LEVELS,
  REFEREE_STATUSES,
  DUTY_POSITIONS,
  TECHNICAL_AUTHORITY,
  LEVEL_CRITERIA,
  type RefereeItem,
  type RefereeLevel,
  type RefereeStatus,
  type DutyPosition,
  type CreateRefereeInput,
  type ExamRecord,
} from "@/types/referee";
import { downloadRefereeReceiptPDF, printRefereeRegistrationSlip } from "@/lib/referee-license-pdf";
import { downloadCertificatePDF, printCertificateSlip } from "@/lib/certificate-pdf";
import { openFileInFullSize } from "@/lib/utils";
import type { CertificateItem } from "@/types/certificate";

export function AdminRefereesManager() {
  const [referees, setReferees] = useState<RefereeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3 Main Primary Sections / Tabs
  const [activeTab, setActiveTab] = useState<"licensed" | "applications" | "certificates">("licensed");

  // Certificates state
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [clubOptions, setClubOptions] = useState<string[]>(() => getClubDropdownOptions());
  const [rawStateAssocs, setRawStateAssocs] = useState<any[]>([]);
  const [rawDistrictAssocs, setRawDistrictAssocs] = useState<any[]>([]);

  const fetchCertificates = useCallback(async () => {
    setIsLoadingCerts(true);
    try {
      const res = await fetch("/api/certificates?all=true");
      const json = await res.json();
      if (json?.success && Array.isArray(json.certificates)) {
        setCertificates(json.certificates);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingCerts(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [clubsRes, sRes, dRes] = await Promise.all([
          fetch("/api/clubs"),
          fetch("/api/state-associations"),
          fetch("/api/district-associations"),
        ]);
        const [clubsJson, sJson, dJson] = await Promise.all([
          clubsRes.json(),
          sRes.json(),
          dRes.json(),
        ]);
        if (clubsJson?.success && Array.isArray(clubsJson.clubs)) {
          setClubOptions(getClubDropdownOptions(clubsJson.clubs));
        }
        if (sJson?.success && Array.isArray(sJson.associations)) {
          setRawStateAssocs(sJson.associations);
        }
        if (dJson?.success && Array.isArray(dJson.associations)) {
          setRawDistrictAssocs(dJson.associations);
        }
      } catch {
        // fallback
      }
    }
    loadOptions();
  }, []);

  const approvedStateOptions = useMemo(() => {
    return getApprovedStateAssociationDropdownOptions(rawStateAssocs);
  }, [rawStateAssocs]);

  // Selected referee for detailed inspector modal
  const [selectedReferee, setSelectedReferee] = useState<RefereeItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"profile" | "license" | "exam" | "duty">("profile");

  // Document Proof Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    refereeName: string;
    refereeId: string;
    rank?: string;
    size?: string;
    title?: string;
  } | null>(null);

  // Tournament appointment modal
  const [isAppointOpen, setIsAppointOpen] = useState(false);
  const [isSubmittingAppoint, setIsSubmittingAppoint] = useState(false);
  const [appointForm, setAppointForm] = useState({
    refereeId: "",
    championshipName: "KALAWAR National Martial Arts Championship 2026",
    championshipId: "EVT-2026-001",
    eventDate: new Date().toISOString().split("T")[0],
    location: "National Indoor Stadium",
    category: "Senior Men & Women Open Kumite",
    ringOrMatNumber: "Center Mat 1",
    position: "Mat / Ring Referee" as DutyPosition,
  });

  // Theory & Practical Exam Modal state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPublishingExam, setIsPublishingExam] = useState(false);
  const [examForm, setExamForm] = useState({
    theoryScore: 45,
    theoryMaxScore: 50,
    practicalScore: 48,
    practicalMaxScore: 50,
    date: new Date().toISOString().split("T")[0],
    examiner: "Technical Committee Board",
    remarks: "Demonstrated thorough grasp of statutory rules, penalties, and ring adjudication.",
    autoCertify: true,
  });

  // Create & Edit Referee Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReferee, setEditingReferee] = useState<RefereeItem | null>(null);
  const [isSavingReferee, setIsSavingReferee] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initialRefereeFormData = {
    id: "",
    name: "",
    username: "",
    password: "",
    dob: "",
    gender: "Male" as "Male" | "Female" | "Other",
    email: "",
    phone: "",
    discipline: "Kalawar Martial Arts",
    state: "",
    district: "",
    tempStateAssociation: "",
    tempDistrictAssociation: "",
    academy: "Independent",
    kalawarId: "",
    currentRank: "1st Dan Black Belt",
    danCertificationYear: "",
    danGradingAuthority: "",
    martialArtsExperience: "3 Years",
    matchesOfficiated: 0,
    level: "Level 1 – Junior Referee" as RefereeLevel,
    status: "Active" as RefereeStatus,
    licenseNumber: "",
    licenseIssuedDate: "",
    licenseValidUntil: "",
    photo: "",
    certificationDocument: "",
    certificationDocumentName: "",
    certificationDocumentSize: "",
    aadhaarDoc: "",
    aadhaarDocName: "",
    aadhaarDocSize: "",
    specialization: "Mat / Ring Referee",
    emergencyContact: "",
    bloodGroup: "",
    address: "",
    pincode: "",
    bio: "",
    internalNotes: "",
  };

  const [createForm, setCreateForm] = useState(initialRefereeFormData);

  const handleOpenCreate = () => {
    setEditingReferee(null);
    setCreateForm({
      ...initialRefereeFormData,
      state: "",
      district: "",
      tempStateAssociation: "",
      tempDistrictAssociation: "",
    });
    setCreatePhotoFileName("");
    setCreatePhotoFileSize("");
    setCreateDocFileName("");
    setCreateDocFileSize("");
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (referee: RefereeItem) => {
    setEditingReferee(referee);

    const existingTempState = typeof referee.tempStateAssociation === "string" ? referee.tempStateAssociation.trim() : "";
    const existingTempDistrict = typeof referee.tempDistrictAssociation === "string" ? referee.tempDistrictAssociation.trim() : "";
    const rawState = typeof referee.state === "string" ? referee.state.trim() : "";
    const rawDistrict = typeof referee.district === "string" ? referee.district.trim() : "";

    const isDynamicFormatted = approvedStateOptions.length > 0
      ? approvedStateOptions.includes(rawState) || rawState.includes(" (")
      : rawState.includes(" (");

    let initialTempState = "";
    let initialTempDistrict = "";
    let initialDynamicState = "";
    let initialDynamicDistrict = "";

    if (existingTempState) {
      initialTempState = existingTempState;
      initialTempDistrict = existingTempDistrict || rawDistrict;
      initialDynamicState = isDynamicFormatted ? rawState : "";
      initialDynamicDistrict = isDynamicFormatted ? rawDistrict : "";
    } else if (rawState && !isDynamicFormatted) {
      initialTempState = rawState;
      initialTempDistrict = rawDistrict;
      initialDynamicState = "";
      initialDynamicDistrict = "";
    } else {
      initialTempState = "";
      initialTempDistrict = "";
      initialDynamicState = rawState;
      initialDynamicDistrict = rawDistrict;
    }

    setCreateForm({
      id: referee.id || "",
      name: referee.name || "",
      username: referee.username || "",
      password: referee.rawPassword || referee.password || "",
      dob: referee.dob || "",
      gender: (referee.gender as any) || "Male",
      email: referee.email || "",
      phone: referee.phone || "",
      discipline: referee.discipline || "Kalawar Martial Arts",
      state: initialDynamicState,
      district: initialDynamicDistrict,
      tempStateAssociation: initialTempState,
      tempDistrictAssociation: initialTempDistrict,
      academy: referee.academy || "Independent",
      kalawarId: referee.kalawarId || "",
      currentRank: referee.currentRank || "1st Dan Black Belt",
      danCertificationYear: referee.danCertificationYear || "",
      danGradingAuthority: referee.danGradingAuthority || "",
      martialArtsExperience: referee.martialArtsExperience || "",
      matchesOfficiated: referee.matchesOfficiated ?? 0,
      level: referee.level || "Level 1 – Junior Referee",
      status: referee.status || "Active",
      licenseNumber: referee.licenseNumber || "",
      licenseIssuedDate: referee.licenseIssuedDate ? referee.licenseIssuedDate.split("T")[0] : "",
      licenseValidUntil: referee.licenseValidUntil ? referee.licenseValidUntil.split("T")[0] : "",
      photo: referee.photo || "",
      certificationDocument: referee.certificationDocument || "",
      certificationDocumentName: referee.certificationDocumentName || (referee.certificationDocument ? "Referee_Proof.pdf" : ""),
      certificationDocumentSize: referee.certificationDocumentSize || "",
      aadhaarDoc: referee.aadhaarDoc || (Array.isArray(referee.documents) && referee.documents.length > 0 ? referee.documents[0] : "") || "",
      aadhaarDocName: referee.aadhaarDocName || (referee.aadhaarDoc ? "Government_ID_Proof.pdf" : "") || "",
      aadhaarDocSize: referee.aadhaarDocSize || "",
      specialization: referee.specialization || "Mat / Ring Referee",
      emergencyContact: referee.emergencyContact || "",
      bloodGroup: referee.bloodGroup || "",
      address: referee.address || "",
      pincode: referee.pincode || "",
      bio: referee.bio || "",
      internalNotes: referee.internalNotes || "",
    });
    setCreatePhotoFileName(referee.photo ? "Official_Photo.jpg" : "");
    setCreatePhotoFileSize("");
    setCreateDocFileName(referee.certificationDocumentName || (referee.certificationDocument ? "Proof_Document.pdf" : ""));
    setCreateDocFileSize(referee.certificationDocumentSize || "");
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  // Fetch referees
  const fetchReferees = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/referees");
      const data = await res.json();
      if (data.success && Array.isArray(data.referees)) {
        setReferees(data.referees);
      }
    } catch (err) {
      console.error("Failed to load referees:", err);
      toast.error("Failed to load referees data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferees();
  }, [fetchReferees]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = referees.length;
    const active = referees.filter((r) => r.status === "Active").length;
    const certified = referees.filter((r) => r.status === "Certified").length;
    const pending = referees.filter(
      (r) =>
        r.status === "Pending" ||
        r.status === "Application Submitted" ||
        r.status === "Under Verification" ||
        r.status === "Training Required" ||
        r.status === "Exam Scheduled"
    ).length;
    const trainingOrExam = referees.filter(
      (r) => r.status === "Training Required" || r.status === "Exam Scheduled"
    ).length;
    const suspendedOrExpired = referees.filter(
      (r) => r.status === "Suspended" || r.status === "Expired" || r.status === "Cancelled"
    ).length;

    return { total, active, certified, pending, trainingOrExam, suspendedOrExpired };
  }, [referees]);

  // Section 1: Active / Certified Licensed Technical Officials
  const licensedReferees = useMemo(() => {
    return referees.filter((r) => r.status === "Active" || r.status === "Certified");
  }, [referees]);

  // Section 2: Incoming Referee Applications & Accreditation Requests
  const applicationReferees = useMemo(() => {
    return referees.filter(
      (r) =>
        r.status === "Pending" ||
        r.status === "Application Submitted" ||
        r.status === "Under Verification" ||
        r.status === "Training Required" ||
        r.status === "Exam Scheduled" ||
        r.status === "Suspended" ||
        r.status === "Expired" ||
        r.status === "Cancelled"
    );
  }, [referees]);

  // Filtered List based on Active Tab
  const displayedReferees = useMemo(() => {
    const sourceList = activeTab === "licensed" ? licensedReferees : applicationReferees;

    return sourceList.filter((r) => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchLevel = levelFilter === "All" || r.level === levelFilter;
      const matchState = stateFilter === "All" || r.state === stateFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.licenseNumber && r.licenseNumber.toLowerCase().includes(q)) ||
        (r.kalawarId && r.kalawarId.toLowerCase().includes(q)) ||
        (r.currentRank && r.currentRank.toLowerCase().includes(q)) ||
        (r.level && r.level.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q)) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        (r.academy && r.academy.toLowerCase().includes(q));

      return matchStatus && matchLevel && matchState && matchQuery;
    });
  }, [activeTab, licensedReferees, applicationReferees, statusFilter, levelFilter, stateFilter, searchQuery]);

  // Filtered Referee Certificates (Level 1, 2, 3 only)
  const refereeCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const isRefereeType =
        c.type === "Referee / Technical Official Certificate" ||
        c.position?.toLowerCase().includes("referee") ||
        c.event?.toLowerCase().includes("referee") ||
        c.event?.toLowerCase().includes("technical official");
      if (!isRefereeType) return false;

      const isLevel0 = c.position?.toLowerCase().includes("level 0") || c.position?.toLowerCase().includes("trainee");
      if (isLevel0) return false;

      // Filter by search query
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const match =
          c.holder?.toLowerCase().includes(q) ||
          c.number?.toLowerCase().includes(q) ||
          (c.kalawarId && c.kalawarId.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          (c.position && c.position.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filter by status
      if (statusFilter !== "All" && c.status !== statusFilter) return false;

      // Filter by level
      if (levelFilter !== "All") {
        if (!c.position?.includes(levelFilter) && !c.event?.includes(levelFilter)) {
          return false;
        }
      }

      // Filter by state
      if (stateFilter !== "All" && c.state !== stateFilter) return false;

      return true;
    });
  }, [certificates, searchQuery, statusFilter, levelFilter, stateFilter]);

  // Eligible Active Referees for Tournament Duty
  const activeLicensedReferees = useMemo(() => {
    return referees.filter((r) => r.status === "Active" && r.licenseNumber);
  }, [referees]);

  // Update referee status or fields
  const handleUpdateReferee = async (id: string, updates: Partial<RefereeItem>) => {
    try {
      const res = await fetch(`/api/referees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update referee");
      }
      if (updates.level) {
        toast.success(`Referee Level Promoted to ${updates.level}!`, {
          description: "Referee profile, member account, and official ID card updated successfully.",
        });
      } else if (updates.status) {
        toast.success(`Referee Status: ${updates.status}`, {
          description: "Referee profile and credentials status updated.",
        });
      } else {
        toast.success("Referee profile updated successfully");
      }

      fetchReferees();
      if (selectedReferee && selectedReferee.id === id) {
        setSelectedReferee(data.referee);
      }
      return data.referee;
    } catch (err: any) {
      toast.error(err.message || "Update failed");
      return null;
    }
  };

  // Publish Theory & Practical Exam Marks
  const handlePublishExamMarks = async () => {
    if (!selectedReferee) return;
    try {
      setIsPublishingExam(true);
      const theoryScore = Number(examForm.theoryScore) || 0;
      const theoryMax = Number(examForm.theoryMaxScore) || 50;
      const practicalScore = Number(examForm.practicalScore) || 0;
      const practicalMax = Number(examForm.practicalMaxScore) || 50;

      const theoryPassed = theoryScore >= theoryMax * 0.6;
      const practicalPassed = practicalScore >= practicalMax * 0.6;
      const allPassed = theoryPassed && practicalPassed;

      const theoryRecord: ExamRecord = {
        id: `EX-TH-${Date.now()}`,
        examType: "Theory",
        score: theoryScore,
        maxScore: theoryMax,
        date: examForm.date || new Date().toISOString().split("T")[0],
        examiner: examForm.examiner || "Technical Examination Board",
        result: theoryPassed ? "Passed" : "Failed",
        remarks: examForm.remarks ? `Theory Exam: ${examForm.remarks}` : undefined,
      };

      const practicalRecord: ExamRecord = {
        id: `EX-PR-${Date.now() + 1}`,
        examType: "Practical",
        score: practicalScore,
        maxScore: practicalMax,
        date: examForm.date || new Date().toISOString().split("T")[0],
        examiner: examForm.examiner || "Technical Examination Board",
        result: practicalPassed ? "Passed" : "Failed",
        remarks: examForm.remarks ? `Practical Assessment: ${examForm.remarks}` : undefined,
      };

      const existingRecords = Array.isArray(selectedReferee.examRecords) ? selectedReferee.examRecords : [];
      const updatedExamRecords = [...existingRecords, theoryRecord, practicalRecord];

      const updates: Partial<RefereeItem> = {
        examRecords: updatedExamRecords,
      };

      if (examForm.autoCertify && allPassed && selectedReferee.status !== "Active") {
        updates.status = "Certified";
      }

      const updated = await handleUpdateReferee(selectedReferee.id, updates);

      // Dispatch official exam result email to the candidate
      let emailSent = false;
      if (selectedReferee.email) {
        try {
          const emailRes = await fetch("/api/referees/exam-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refereeId: selectedReferee.id,
              name: selectedReferee.name,
              email: selectedReferee.email,
              level: selectedReferee.level,
              currentRank: selectedReferee.currentRank,
              discipline: selectedReferee.discipline,
              theoryScore,
              theoryMaxScore: theoryMax,
              practicalScore,
              practicalMaxScore: practicalMax,
              isPassed: allPassed,
              examiner: examForm.examiner || "Technical Committee Examination Board",
              examDate: examForm.date || new Date().toISOString().split("T")[0],
              remarks: examForm.remarks || undefined,
            }),
          });
          const emailJson = await emailRes.json();
          emailSent = !!emailJson?.success;
        } catch (mailErr) {
          console.warn("[Referee Manager] Could not dispatch exam result email:", mailErr);
        }
      }

      if (updated) {
        setIsExamModalOpen(false);
        const overallResultTag = allPassed ? "PASSED & QUALIFIED" : "FAILED";
        toast.success(`Exam Marks Published · ${overallResultTag}!`, {
          description: `Theory: ${theoryScore}/${theoryMax} (${theoryRecord.result}) | Practical: ${practicalScore}/${practicalMax} (${practicalRecord.result}).${
            emailSent
              ? ` Official result email dispatched to ${selectedReferee.email}.`
              : selectedReferee.email
              ? ` Notification processed for ${selectedReferee.email}.`
              : " (No email on file for candidate)."
          }`,
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish exam marks");
    } finally {
      setIsPublishingExam(false);
    }
  };

  // Delete an individual exam record
  const handleDeleteExamRecord = async (examId: string) => {
    if (!selectedReferee) return;
    const updatedRecords = selectedReferee.examRecords.filter((e) => e.id !== examId);
    await handleUpdateReferee(selectedReferee.id, { examRecords: updatedRecords });
    toast.success("Exam record removed");
  };

  // 1-Click Approve & Issue Certificate Action
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [issuingCertId, setIssuingCertId] = useState<string | null>(null);

  const handleIssueCertificateAndActivate = async (referee: RefereeItem) => {
    try {
      setApprovingId(referee.id);
      setIssuingCertId(referee.id);

      const isLevel0 = referee.level?.includes("Level 0") || referee.level?.toLowerCase().includes("trainee");

      // Optimistically update referee status to "Active" in local UI state immediately
      setReferees((prev) =>
        prev.map((r) =>
          r.id.toLowerCase() === referee.id.toLowerCase() ||
          (r.kalawarId && r.kalawarId.toLowerCase() === (referee.kalawarId || "").toLowerCase())
            ? { ...r, status: "Active" }
            : r
        )
      );

      // 1. Activate referee status
      const res = await fetch(`/api/referees/${encodeURIComponent(referee.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
          level: referee.level,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to activate referee record");
      }

      // 2. Handle Certificate Issuance
      if (isLevel0) {
        toast.info("Referee Account Activated (Level 0 – Trainee)", {
          description: "Level 0 is a Trainee grade without official certificate issuance. Referee profile status updated.",
        });
      } else {
        const certRes = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holder: referee.name,
            kalawarId: referee.kalawarId || referee.id,
            email: referee.email,
            phone: referee.phone,
            state: referee.state,
            district: referee.district,
            academy: referee.academy || "Independent Official",
            type: "Referee / Technical Official Certificate",
            event: "National Technical Official & Referee Accreditation",
            position: referee.level,
            rankOrBelt: referee.currentRank || "Black Belt",
            issued: new Date().toISOString().split("T")[0],
            validUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            issuedBy: "Mr. Santosh Kasbe (Head, Technical Committee)",
            status: "Valid",
            notes: `Official accreditation for ${referee.level}. License: ${data.referee?.licenseNumber || referee.licenseNumber || "Active"}`,
          }),
        });

        const certData = await certRes.json();
        if (!certRes.ok || !certData.success) {
          toast.warning("Referee activated, but certificate notice: " + (certData.error || "Check certificates registry"));
        } else {
          toast.success(`Official Certificate Issued!`, {
            description: `${referee.name} has been certified as ${referee.level}. Certificate #${certData.certificate?.number || "Generated"}.`,
          });
        }
      }

      fetchReferees();
      fetchCertificates();
      if (selectedReferee && selectedReferee.id === referee.id) {
        setSelectedReferee(data.referee || { ...selectedReferee, status: "Active" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to issue certificate and activate referee");
      fetchReferees();
    } finally {
      setApprovingId(null);
      setIssuingCertId(null);
    }
  };

  const handleApproveAndIssueLicense = async (referee: RefereeItem) => {
    return handleIssueCertificateAndActivate(referee);
  };

  // Quick Action: Mark Under Verification
  const handleMarkUnderVerification = async (refereeId: string) => {
    await handleUpdateReferee(refereeId, { status: "Under Verification" });
    toast.info("Application marked Under Verification");
  };

  // Quick Action: Schedule Clinic / Training
  const handleScheduleClinic = async (refereeId: string) => {
    await handleUpdateReferee(refereeId, { status: "Training Required" });
    toast.info("Official scheduled for Referee Clinic");
  };

  // Quick Action: Decline / Reject
  const handleRejectApplication = async (refereeId: string, name: string) => {
    if (!confirm(`Are you sure you want to decline the referee application for ${name}?`)) {
      return;
    }
    await handleUpdateReferee(refereeId, { status: "Cancelled" });
    toast.warning(`Application for ${name} has been archived/declined.`);
  };

  // Photo upload states for Create Referee
  const [uploadingCreatePhoto, setUploadingCreatePhoto] = useState(false);
  const [createPhotoProgress, setCreatePhotoProgress] = useState(0);
  const [createPhotoFileName, setCreatePhotoFileName] = useState("");
  const [createPhotoFileSize, setCreatePhotoFileSize] = useState("");
  const createPhotoInputRef = useRef<HTMLInputElement>(null);

  // Document upload states for Create Referee
  const [uploadingCreateDoc, setUploadingCreateDoc] = useState(false);
  const [createDocProgress, setCreateDocProgress] = useState(0);
  const [createDocFileName, setCreateDocFileName] = useState("");
  const [createDocFileSize, setCreateDocFileSize] = useState("");
  const createDocInputRef = useRef<HTMLInputElement>(null);

  // Photo upload states for Inspector Modal
  const [uploadingInspectorPhoto, setUploadingInspectorPhoto] = useState(false);
  const [inspectorPhotoProgress, setInspectorPhotoProgress] = useState(0);
  const [inspectorPhotoFileName, setInspectorPhotoFileName] = useState("");
  const [inspectorPhotoFileSize, setInspectorPhotoFileSize] = useState("");
  const inspectorPhotoInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCreatePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(`File ${file.name} exceeds 2MB limit. Please upload a photo under 2MB.`);
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setCreatePhotoFileName(file.name);
    setCreatePhotoFileSize(formattedSize);
    setUploadingCreatePhoto(true);
    setCreatePhotoProgress(15);

    const timer = setInterval(() => {
      setCreatePhotoProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 120);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_referees");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setCreatePhotoProgress(100);
      setCreateForm((prev) => ({ ...prev, photo: data.url }));
      toast.success("Referee Photo Uploaded!", {
        description: `${file.name} (${formattedSize}) attached.`,
      });
    } catch (err: any) {
      console.error("Referee photo upload error:", err);
      toast.error(err.message || "Failed to upload photo");
    } finally {
      clearInterval(timer);
      setUploadingCreatePhoto(false);
      if (createPhotoInputRef.current) {
        createPhotoInputRef.current.value = "";
      }
    }
  };

  // Handle Certification Document Upload (<=2MB)
  const handleCreateDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(`File ${file.name} exceeds 2MB limit. Please upload a document under 2MB.`);
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setCreateDocFileName(file.name);
    setCreateDocFileSize(formattedSize);
    setUploadingCreateDoc(true);
    setCreateDocProgress(15);

    const timer = setInterval(() => {
      setCreateDocProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 120);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_referee_documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload document");
      }

      setCreateDocProgress(100);
      setCreateForm((prev) => ({
        ...prev,
        certificationDocument: data.url,
        certificationDocumentName: file.name,
        certificationDocumentSize: formattedSize,
      }));
      toast.success("Certification Proof Attached!", {
        description: `${file.name} (${formattedSize}) saved to application.`,
      });
    } catch (err: any) {
      console.error("Referee document upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      clearInterval(timer);
      setUploadingCreateDoc(false);
      if (createDocInputRef.current) {
        createDocInputRef.current.value = "";
      }
    }
  };

  const handleInspectorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedReferee) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(`File ${file.name} exceeds 2MB limit. Please upload a photo under 2MB.`);
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setInspectorPhotoFileName(file.name);
    setInspectorPhotoFileSize(formattedSize);
    setUploadingInspectorPhoto(true);
    setInspectorPhotoProgress(15);

    const timer = setInterval(() => {
      setInspectorPhotoProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 120);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_referees");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setInspectorPhotoProgress(100);
      await handleUpdateReferee(selectedReferee.id, { photo: data.url });
      toast.success("Official Photo Updated!", {
        description: `${file.name} (${formattedSize}) active on referee profile.`,
      });
    } catch (err: any) {
      console.error("Inspector photo upload error:", err);
      toast.error(err.message || "Failed to update referee photo");
    } finally {
      clearInterval(timer);
      setUploadingInspectorPhoto(false);
      if (inspectorPhotoInputRef.current) {
        inspectorPhotoInputRef.current.value = "";
      }
    }
  };

  // Delete Referee
  const handleDeleteReferee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove referee ${name}? This action cannot be undone.`)) {
      return;
    }

    const cleanId = (id || "").trim().toLowerCase();

    // Optimistically remove from local state immediately
    setReferees((prev) =>
      prev.filter(
        (r) =>
          r.id.toLowerCase() !== cleanId &&
          (!r.kalawarId || r.kalawarId.toLowerCase() !== cleanId)
      )
    );

    if (
      selectedReferee?.id.toLowerCase() === cleanId ||
      selectedReferee?.kalawarId?.toLowerCase() === cleanId
    ) {
      setSelectedReferee(null);
    }

    try {
      const res = await fetch(`/api/referees/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete");
      }

      toast.success(`Referee ${name} removed.`);
      fetchReferees();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
      fetchReferees();
    }
  };

  // Create / Edit Referee Submission
  const handleSaveReferee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.phone.trim()) {
      toast.error("Please fill in all mandatory fields (Name, Email, Phone).");
      return;
    }

    try {
      setIsSavingReferee(true);
      if (editingReferee) {
        // UPDATE EXISTING REFEREE
        const res = await fetch(`/api/referees/${encodeURIComponent(editingReferee.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createForm),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update referee");
        }

        toast.success("Referee details updated successfully!", {
          description: `${createForm.name} (${editingReferee.id}) updated.`,
        });

        // Update in local state immediately
        setReferees((prev) =>
          prev.map((r) => (r.id === editingReferee.id ? (data.referee || { ...r, ...createForm }) : r))
        );
        if (selectedReferee?.id === editingReferee.id) {
          setSelectedReferee(data.referee || { ...selectedReferee, ...createForm });
        }
      } else {
        // CREATE NEW REFEREE
        const res = await fetch("/api/referees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createForm),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to register referee");
        }

        toast.success("Referee created successfully!", {
          description: `Referee ID: ${data.referee?.id || "Registered"}`,
        });
      }

      setIsCreateOpen(false);
      setEditingReferee(null);
      fetchReferees();
    } catch (err: any) {
      console.error("Referee save error:", err);
      toast.error(err.message || "Failed to save referee record");
    } finally {
      setIsSavingReferee(false);
    }
  };

  // Tournament Appointment Submission
  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointForm.refereeId) {
      toast.error("Please select an eligible active referee");
      return;
    }

    try {
      setIsSubmittingAppoint(true);
      const res = await fetch("/api/referees/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Appointment failed");
      }

      toast.success(data.message || "Referee appointed successfully!", {
        description: data.referee?.email
          ? `Official tournament duty email dispatched to ${data.referee.email}.`
          : undefined,
      });
      setIsAppointOpen(false);
      fetchReferees();
      if (selectedReferee && selectedReferee.id === appointForm.refereeId) {
        setSelectedReferee(data.referee);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not appoint referee");
    } finally {
      setIsSubmittingAppoint(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === "certificates") {
      if (refereeCertificates.length === 0) {
        toast.error("No referee certificates to export.");
        return;
      }

      const headers = [
        "Certificate Number",
        "Holder Name",
        "Referee ID",
        "Qualification / Level",
        "Dan Rank",
        "Discipline",
        "State",
        "District",
        "Issue Date",
        "Valid Until",
        "Status",
      ];

      const rows = refereeCertificates.map((c) => [
        `"${c.number || ""}"`,
        `"${(c.holder || "").replace(/"/g, '""')}"`,
        `"${(c as any).kalawarId || ""}"`,
        `"${(c.qualification || c.position || "").replace(/"/g, '""')}"`,
        `"${(c.rankOrBelt || (c as any).beltRank || "").replace(/"/g, '""')}"`,
        `"${(c.discipline || "").replace(/"/g, '""')}"`,
        `"${(c.state || "").replace(/"/g, '""')}"`,
        `"${(c.district || "").replace(/"/g, '""')}"`,
        `"${(c.issued || (c as any).issueDate || "").replace(/"/g, '""')}"`,
        `"${(c.validUntil || "").replace(/"/g, '""')}"`,
        `"${c.status || "Valid"}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `KALAWAR_Referee_Certificates_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export ready", { description: `${refereeCertificates.length} referee certificates exported to CSV` });
      return;
    }

    if (displayedReferees.length === 0) {
      toast.error("No referee records to export.");
      return;
    }

    const headers = [
      "Referee ID",
      "Name",
      "Level",
      "Status",
      "Certificate Number",
      "Valid Until",
      "Dan Rank",
      "State",
      "District",
      "Phone",
      "Email",
      "Matches Officiated",
    ];

    const rows = displayedReferees.map((r) => [
      `"${r.id}"`,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.level || "").replace(/"/g, '""')}"`,
      `"${r.status || "Active"}"`,
      `"${r.licenseNumber || "N/A"}"`,
      `"${r.licenseValidUntil ? r.licenseValidUntil.split("T")[0] : "N/A"}"`,
      `"${(r.currentRank || "").replace(/"/g, '""')}"`,
      `"${(r.state || "").replace(/"/g, '""')}"`,
      `"${(r.district || "").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      r.matchesOfficiated || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const tabSuffix = activeTab === "licensed" ? "Licensed_Officials" : "Referee_Applications";
    link.setAttribute("download", `KALAWAR_Referees_${tabSuffix}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export ready", { description: `${displayedReferees.length} referee records exported to CSV` });
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "International / Chief Referee":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Level 3 – National Referee":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "Level 2 – State Referee":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Certified":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Training Required":
      case "Exam Scheduled":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Under Verification":
      case "Application Submitted":
      case "Pending":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "Suspended":
      case "Cancelled":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Technical Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Official Technical Committee Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
            Referee & Technical Officials Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage Referee digital licensing, Level certifications, examination scores, and championship ring duty appointments.
          </p>
        </div>

        {/* Technical Authority Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm">
            SK
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Technical Head</p>
            <p className="text-xs font-black text-foreground">{TECHNICAL_AUTHORITY.name}</p>
            <p className="text-[10px] text-primary">{TECHNICAL_AUTHORITY.committeeRole}</p>
          </div>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Officials</p>
          <p className="text-2xl font-black text-foreground mt-1">{metrics.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">In database</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active Referees</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.active}</p>
          <p className="text-[11px] text-emerald-500/70 mt-0.5">Certified & Eligible</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-blue-500/20 bg-blue-500/5 shadow-sm">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Certified</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{metrics.certified}</p>
          <p className="text-[11px] text-blue-500/70 mt-0.5">Passed exams</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-sky-500/20 bg-sky-500/5 shadow-sm">
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Applications</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{metrics.pending}</p>
          <p className="text-[11px] text-sky-500/70 mt-0.5">Pending review</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">In Clinic / Exam</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{metrics.trainingOrExam}</p>
          <p className="text-[11px] text-amber-500/70 mt-0.5">Clinic scheduled</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-rose-500/20 bg-rose-500/5 shadow-sm">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Suspended / Exp.</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{metrics.suspendedOrExpired}</p>
          <p className="text-[11px] text-rose-500/70 mt-0.5">Disciplinary / Inactive</p>
        </div>
      </div>

      {/* =========================================================================
          3 PRIMARY NAVIGATION SECTIONS / TABS
          ========================================================================= */}
      <div className="flex border-b border-border/80 bg-card/60 rounded-3xl p-1.5 shadow-sm gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("licensed");
            setStatusFilter("All");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "licensed"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Active Certified Technical Officials</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "licensed" ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {licensedReferees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("applications");
            setStatusFilter("All");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
            activeTab === "applications"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Referee Applications Requests</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "applications"
                ? "bg-white/20 text-primary-foreground"
                : applicationReferees.length > 0
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {applicationReferees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("certificates");
            setStatusFilter("All");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
            activeTab === "certificates"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Issued Certificates</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "certificates"
                ? "bg-white/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {refereeCertificates.length}
          </span>
        </button>
      </div>

      {/* Applications Review Alert Banner (Visible on Applications Tab) */}
      {activeTab === "applications" && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Technical Official Accreditation Queue ({applicationReferees.length} Requests)
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Inspect applicant Dan diplomas, verify referee credentials, and use <strong>1-Click Approve</strong> to issue official Federation Referee credentials (`KAC-ACT-REF-2026-XXX`).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">
            Action Required
          </span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Certificate No, KALAWAR ID, State, Dan Rank..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border/80 bg-background/60 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            {activeTab === "licensed" && (
              <button
                type="button"
                onClick={() => setIsAppointOpen(true)}
                className="px-4 py-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Appoint to Tournament Mat</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Official</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-2xl border border-border/80 hover:border-primary text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Export Referees to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={fetchReferees}
              className="p-2 rounded-2xl border border-border/80 hover:border-primary text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border/80 bg-background/60 text-xs font-medium focus:border-primary outline-none"
          >
            <option value="All">All Statuses</option>
            {REFEREE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border/80 bg-background/60 text-xs font-medium focus:border-primary outline-none"
          >
            <option value="All">All Referee Levels</option>
            {REFEREE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border/80 bg-background/60 text-xs font-medium focus:border-primary outline-none"
          >
            <option value="All">All States</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {(statusFilter !== "All" || levelFilter !== "All" || stateFilter !== "All" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("All");
                setLevelFilter("All");
                setStateFilter("All");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-primary hover:underline ml-2"
            >
              Reset Filters
            </button>
          )}

          <span className="text-xs text-muted-foreground ml-auto font-medium">
            Showing {displayedReferees.length} records
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: ACTIVE CERTIFIED OFFICIALS TABLE
          ========================================================================= */}
      {activeTab === "licensed" && (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border/80 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Referee / Official</th>
                  <th className="px-4 py-3.5">Level &amp; Dan Rank</th>
                  <th className="px-4 py-3.5">Certificate &amp; Validity</th>
                  <th className="px-4 py-3.5">Specialization &amp; State</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Bouts</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <span>Loading referee roster...</span>
                    </td>
                  </tr>
                ) : displayedReferees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Scale className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="font-bold text-foreground">No active certified referees found</p>
                      <p className="text-xs mt-0.5">Try adjusting your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  displayedReferees.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Photo */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-primary">
                            {r.photo ? (
                              <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              r.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{r.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              <span>{r.id}</span>
                              {r.kalawarId && <span>• {r.kalawarId}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level & Rank */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(
                              r.level
                            )}`}
                          >
                            {r.level}
                          </span>
                          <p className="text-xs text-muted-foreground font-medium">{r.currentRank}</p>
                        </div>
                      </td>

                      {/* Certificate Number & Expiry */}
                      <td className="px-4 py-3.5">
                        {r.licenseNumber ? (
                          <div>
                            <p className="font-mono text-xs font-bold text-primary">{r.licenseNumber}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Exp: {r.licenseValidUntil ? r.licenseValidUntil.split("T")[0] : "Perpetual"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Certificate Issued</span>
                        )}
                      </td>

                      {/* Specialization & State */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-foreground">
                            {r.district ? `${r.district}, ${r.state}` : r.state}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {r.specialization || r.academy || "Independent Official"}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Matches Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-foreground">{r.matchesOfficiated || 0}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download Registration Receipt PDF */}
                          <button
                            type="button"
                            onClick={() => downloadRefereeReceiptPDF(r)}
                            className="p-1.5 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                            title="Download Registration Receipt PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Registration Slip */}
                          <button
                            type="button"
                            onClick={() => printRefereeRegistrationSlip(r)}
                            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Print Registration Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-xl hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 transition-colors"
                            title="Edit Official Profile & Credentials"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Inspect Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReferee(r);
                              setInspectorTab("profile");
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors flex items-center gap-1"
                            title="View Details & Manage"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReferee(r.id, r.name)}
                            className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors"
                            title="Delete Official"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: REFEREE APPLICATIONS REQUESTS
          ========================================================================= */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground rounded-3xl bg-card border border-border">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <span>Loading referee applications...</span>
            </div>
          ) : displayedReferees.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground rounded-3xl bg-card border border-border">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-foreground text-base">All Applications Processed!</p>
              <p className="text-xs mt-1">There are no pending referee accreditation applications matching your filters.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedReferees.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left Column: Photo & Applicant Identity */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center font-black text-lg text-primary">
                      {r.photo ? (
                        <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        r.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-foreground">{r.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(
                            r.level
                          )}`}
                        >
                          {r.level}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="font-mono text-primary font-bold">{r.id}</span>
                        <span>• Dan Rank: <strong>{r.currentRank}</strong></span>
                        <span>• Exp: <strong>{r.martialArtsExperience || "N/A"}</strong></span>
                        <span>• Officiated: <strong>{r.matchesOfficiated || 0} Bouts</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" /> {r.district ? `${r.district}, ${r.state}` : r.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-primary" /> {r.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-primary" /> {r.email}
                        </span>
                        {r.academy && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-primary" /> {r.academy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: 3 Uploaded Documents Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 border-t lg:border-t-0 lg:border-l border-border/70 pt-3 lg:pt-0 lg:pl-5 shrink-0">
                    {/* 1. Passport Photo */}
                    {r.photo && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            url: r.photo!,
                            name: `${r.name.replace(/\s+/g, "_")}_Passport_Photo.jpg`,
                            refereeName: r.name,
                            refereeId: r.id,
                            rank: r.currentRank,
                            size: "Photo",
                            title: "Passport Photograph",
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Preview Passport Photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        <span>Photo</span>
                      </button>
                    )}

                    {/* 2. Dan Certificate Proof */}
                    {(r.certificationDocument || (r as any).affiliationDocument) && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            url: (r.certificationDocument || (r as any).affiliationDocument)!,
                            name: r.certificationDocumentName || (r as any).affiliationDocumentName || "Dan_Certificate_Proof.pdf",
                            refereeName: r.name,
                            refereeId: r.id,
                            rank: r.currentRank,
                            size: r.certificationDocumentSize || (r as any).affiliationDocumentSize || "1.2 MB",
                            title: "Black Belt / Dan Certificate",
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Preview Black Belt / Dan Certificate"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dan Cert</span>
                      </button>
                    )}

                    {/* 3. Government ID / Aadhaar Proof */}
                    {(r.aadhaarDoc || (Array.isArray(r.documents) && r.documents.length > 0)) && (
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = r.aadhaarDoc || (r.documents && r.documents[0]) || "";
                          setPreviewDoc({
                            url: docUrl,
                            name: r.aadhaarDocName || "Government_ID_Proof.pdf",
                            refereeName: r.name,
                            refereeId: r.id,
                            rank: r.currentRank,
                            size: r.aadhaarDocSize || "1.0 MB",
                            title: "Government ID / Aadhaar Proof",
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Preview Government ID / Aadhaar Proof"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Govt ID</span>
                      </button>
                    )}

                    {!r.photo && !(r.certificationDocument || (r as any).affiliationDocument) && !r.aadhaarDoc && (!r.documents || r.documents.length === 0) && (
                      <span className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-[11px] font-medium italic">
                        No Documents Uploaded
                      </span>
                    )}
                  </div>

                  {/* Right Column: Workflow Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 lg:border-l border-border/70 pt-3 lg:pt-0 lg:pl-5 shrink-0">
                    {/* 1-Click Approve & Issue Certificate */}
                    <button
                      type="button"
                      disabled={approvingId === r.id}
                      onClick={() => handleApproveAndIssueLicense(r)}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title="Accredit referee and issue certificate"
                    >
                      {approvingId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>1-Click Approve &amp; Issue</span>
                    </button>

                    {/* Mark Under Verification */}
                    {r.status !== "Under Verification" && (
                      <button
                        type="button"
                        onClick={() => handleMarkUnderVerification(r.id)}
                        className="px-3 py-2 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Mark Under Technical Committee Verification"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Verify</span>
                      </button>
                    )}



                    {/* Edit Application Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(r)}
                      className="px-3 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                      title="Edit Application & Official Profile Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Inspect Application */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReferee(r);
                        setInspectorTab("profile");
                      }}
                      className="px-3 py-2 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors flex items-center gap-1"
                      title="Inspect Full Application Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    {/* Reject / Decline */}
                    <button
                      type="button"
                      onClick={() => handleRejectApplication(r.id, r.name)}
                      className="p-2 rounded-2xl hover:bg-rose-500/10 text-rose-500 transition-colors"
                      title="Decline / Archive Application"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 3: ISSUED REFEREE CERTIFICATES (LEVELS 1, 2, 3)
          ========================================================================= */}
      {activeTab === "certificates" && (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border/80 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Certificate &amp; Official</th>
                  <th className="px-4 py-3.5">Accredited Level</th>
                  <th className="px-4 py-3.5">Dan / Rank</th>
                  <th className="px-4 py-3.5">State &amp; Region</th>
                  <th className="px-4 py-3.5">Issued / Valid Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingCerts ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <span>Loading issued certificates...</span>
                    </td>
                  </tr>
                ) : refereeCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="font-bold text-foreground">No issued referee certificates found</p>
                      <p className="text-xs mt-0.5">Certificates issued for Level 1, Level 2, and Level 3 officials will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  refereeCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted/30 transition-colors">
                      {/* Certificate & Official */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{cert.holder}</p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-primary font-bold">
                            <span>{cert.number}</span>
                            {cert.kalawarId && <span className="text-muted-foreground">• {cert.kalawarId}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Accredited Level */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          {cert.position || "Technical Official"}
                        </span>
                      </td>

                      {/* Dan / Rank */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-foreground">{cert.rankOrBelt || "Black Belt"}</span>
                      </td>

                      {/* State */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-foreground">
                            {cert.district ? `${cert.district}, ${cert.state}` : cert.state || "National"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {cert.academy || "National Federation"}
                          </p>
                        </div>
                      </td>

                      {/* Issued / Valid Date */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Issued: {cert.issued ? cert.issued.split("T")[0] : "N/A"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Valid: {cert.validUntil ? cert.validUntil.split("T")[0] : "Perpetual"}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          {cert.status || "Valid"}
                        </span>
                      </td>

                      {/* Actions: Download PDF & Print */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadCertificatePDF(cert)}
                            className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors flex items-center gap-1.5"
                            title="Download Certificate PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => printCertificateSlip(cert)}
                            className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5"
                            title="Print Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCUMENT PROOF PREVIEW MODAL
          ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/80 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {previewDoc.title?.toLowerCase().includes("photo") ? (
                    <Camera className="w-5 h-5" />
                  ) : previewDoc.title?.toLowerCase().includes("id") || previewDoc.title?.toLowerCase().includes("aadhaar") ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {previewDoc.title || "Referee Credential & Document Proof"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {previewDoc.refereeName} ({previewDoc.refereeId}) — {previewDoc.rank || "Dan Rank"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openFileInFullSize(previewDoc.url, previewDoc.title || previewDoc.name || "Referee Credential Proof")}
                  className="px-3 py-1.5 rounded-xl border border-border hover:border-primary text-xs font-bold flex items-center gap-1 text-foreground transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-accent/5">
              <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden border border-border bg-background shadow-md flex items-center justify-center">
                {previewDoc.url.toLowerCase().endsWith(".pdf") || previewDoc.url.startsWith("data:application/pdf") || previewDoc.url.toLowerCase().includes(".pdf?") ? (
                  <iframe src={previewDoc.url} title="Document Preview" className="w-full h-[55vh]" />
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.name || "Document Proof Preview"}
                    className="max-h-[55vh] w-auto object-contain mx-auto"
                  />
                )}
              </div>

              <div className="w-full mt-4 p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{previewDoc.name}</p>
                  <p className="text-muted-foreground text-[11px]">Size: {previewDoc.size || "1.2 MB"}</p>
                </div>
                <a
                  href={previewDoc.url}
                  download={previewDoc.name}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSPECTOR MODAL (Profile, License, Exam, Duty)
          ========================================================================= */}
      {selectedReferee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/80 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg overflow-hidden">
                  {selectedReferee.photo ? (
                    <img src={selectedReferee.photo} alt={selectedReferee.name || "Referee Photo"} className="w-full h-full object-cover" />
                  ) : (
                    selectedReferee.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedReferee.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono font-bold text-primary">{selectedReferee.id}</span>
                    <span>• {selectedReferee.level}</span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                        selectedReferee.status
                      )}`}
                    >
                      {selectedReferee.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedReferee)}
                  className="px-3 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Edit Referee Profile & Credentials"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReferee(null)}
                  className="p-2 rounded-2xl hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-border/80 px-6 bg-card/60">
              {[
                { key: "profile", label: "Profile & Background", icon: UserCheck },
                { key: "license", label: "Certificate & Status Control", icon: ShieldCheck },
                { key: "exam", label: "Training & Exam Scores", icon: Award },
                { key: "duty", label: "Tournament Duty History", icon: Trophy },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = inspectorTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setInspectorTab(t.key as any)}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {inspectorTab === "profile" && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Rank</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedReferee.currentRank}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Experience</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedReferee.martialArtsExperience || "N/A"}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">KALAWAR Member ID</p>
                      <p className="font-mono font-bold text-primary mt-0.5">{selectedReferee.kalawarId || "None"}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Officiated Bouts</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedReferee.matchesOfficiated} Matches</p>
                    </div>
                  </div>

                  {/* Official Photo Management Card */}
                  <div className="p-4 rounded-2xl border border-border/80 bg-accent/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" />
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Official Profile Photo (ID &amp; Credentials)
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">Max 2MB (JPG, PNG, WebP)</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Photo Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 bg-background shadow-md shrink-0 flex items-center justify-center font-black text-xl text-primary">
                        {selectedReferee.photo ? (
                          <img
                            src={selectedReferee.photo}
                            alt={selectedReferee.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          selectedReferee.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Info & Upload Action */}
                      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {selectedReferee.photo ? "Official Photo Attached" : "No Photo Uploaded"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            This photo is displayed on referee licenses, official IDs, and tournament rosters.
                          </p>
                        </div>

                        <input
                          type="file"
                          ref={inspectorPhotoInputRef}
                          onChange={handleInspectorPhotoUpload}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        {uploadingInspectorPhoto ? (
                          <div className="space-y-1.5 py-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading {inspectorPhotoFileName || "photo"} ({inspectorPhotoProgress}%)...</span>
                            </div>
                            <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden border border-border">
                              <div
                                className="bg-primary h-full transition-all duration-200"
                                style={{ width: `${inspectorPhotoProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => inspectorPhotoInputRef.current?.click()}
                              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{selectedReferee.photo ? "Replace Photo" : "Upload Photo"}</span>
                            </button>
                            {selectedReferee.photo && (
                              <button
                                type="button"
                                onClick={() => handleUpdateReferee(selectedReferee.id, { photo: "" })}
                                className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold hover:bg-destructive/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Photo</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents Inspection Blocks */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Uploaded Documents &amp; Identity Credentials
                    </h4>

                    {/* 1. Black Belt / Dan Certificate */}
                    {(selectedReferee.certificationDocument || (selectedReferee as any).affiliationDocument) ? (
                      <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {selectedReferee.certificationDocumentName || (selectedReferee as any).affiliationDocumentName || "Dan_Certificate_Proof.pdf"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Black Belt / Dan Certificate rank verification proof.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                url: (selectedReferee.certificationDocument || (selectedReferee as any).affiliationDocument)!,
                                name: selectedReferee.certificationDocumentName || (selectedReferee as any).affiliationDocumentName || "Dan_Certificate_Proof.pdf",
                                refereeName: selectedReferee.name,
                                refereeId: selectedReferee.id,
                                rank: selectedReferee.currentRank,
                                size: selectedReferee.certificationDocumentSize || (selectedReferee as any).affiliationDocumentSize || "1.2 MB",
                                title: "Black Belt / Dan Certificate",
                              })
                            }
                            className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Dan Cert</span>
                          </button>

                          <a
                            href={(selectedReferee.certificationDocument || (selectedReferee as any).affiliationDocument)!}
                            download={selectedReferee.certificationDocumentName || (selectedReferee as any).affiliationDocumentName || "Dan_Certificate_Proof.pdf"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Dan Cert</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl border border-dashed border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Dan Certificate: Not uploaded
                        </span>
                      </div>
                    )}

                    {/* 2. Government ID / Aadhaar Proof */}
                    {(selectedReferee.aadhaarDoc || (Array.isArray(selectedReferee.documents) && selectedReferee.documents.length > 0)) ? (
                      <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                            <ShieldCheck className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {selectedReferee.aadhaarDocName || "Government_ID_Proof.pdf"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Government ID / Aadhaar proof of age and residential jurisdiction.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const docUrl = selectedReferee.aadhaarDoc || (selectedReferee.documents && selectedReferee.documents[0]) || "";
                              setPreviewDoc({
                                url: docUrl,
                                name: selectedReferee.aadhaarDocName || "Government_ID_Proof.pdf",
                                refereeName: selectedReferee.name,
                                refereeId: selectedReferee.id,
                                rank: selectedReferee.currentRank,
                                size: selectedReferee.aadhaarDocSize || "1.0 MB",
                                title: "Government ID / Aadhaar Proof",
                              });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Govt ID</span>
                          </button>

                          <a
                            href={selectedReferee.aadhaarDoc || (selectedReferee.documents && selectedReferee.documents[0]) || "#"}
                            download={selectedReferee.aadhaarDocName || "Government_ID_Proof.pdf"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Govt ID</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl border border-dashed border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Government ID Proof: Not uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bio & Certificates */}
                  {selectedReferee.bio && (
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Official Biography</p>
                      <p className="text-xs text-muted-foreground leading-relaxed p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                        {selectedReferee.bio}
                      </p>
                    </div>
                  )}

                  {selectedReferee.previousCertificates && selectedReferee.previousCertificates.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Previous Certificates &amp; Credentials</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedReferee.previousCertificates.map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-xl bg-muted border border-border/80 text-xs font-medium text-foreground flex items-center gap-1.5"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-primary" />
                            <span>{cert}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact & Federation Jurisdiction */}
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Contact &amp; Federation Jurisdiction
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Email Address:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone / WhatsApp:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">State Federation:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.state}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">District / City:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.district || "Unassigned"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Affiliated Academy / Club:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.academy || "Independent / No Affiliated Club"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Discipline Specialization:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.specialization || "Karate"}</p>
                      </div>
                      {selectedReferee.dob && (
                        <div>
                          <span className="text-muted-foreground">DOB / Gender:</span>
                          <p className="font-semibold text-foreground">{selectedReferee.dob} ({selectedReferee.gender || "Male"})</p>
                        </div>
                      )}
                      {selectedReferee.emergencyContact && (
                        <div>
                          <span className="text-muted-foreground">Emergency Contact:</span>
                          <p className="font-semibold text-foreground">{selectedReferee.emergencyContact}</p>
                        </div>
                      )}
                      {selectedReferee.bloodGroup && (
                        <div>
                          <span className="text-muted-foreground">Blood Group:</span>
                          <p className="font-semibold text-foreground">{selectedReferee.bloodGroup}</p>
                        </div>
                      )}
                      {selectedReferee.address && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Permanent Address:</span>
                          <p className="font-semibold text-foreground">{selectedReferee.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dan Rank Certification Details */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Black Belt Dan Certification</span>
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Certified Dan Rank:</span>
                        <p className="font-bold text-foreground">{selectedReferee.currentRank}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grading Year:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.danCertificationYear || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grading Authority:</span>
                        <p className="font-semibold text-foreground">{selectedReferee.danGradingAuthority || "National Federation"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Certificate & Status Control */}
              {inspectorTab === "license" && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Official Referee Credential</p>
                        <h4 className="text-lg font-black text-primary font-mono mt-0.5">
                          {selectedReferee.licenseNumber || selectedReferee.id || "OFFICIAL CREDENTIAL"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                            selectedReferee.status
                          )}`}
                        >
                          Status: {selectedReferee.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* License Form Controls */}
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-foreground mb-1">Update Lifecycle Status</label>
                      <select
                        value={selectedReferee.status}
                        onChange={(e) =>
                          handleUpdateReferee(selectedReferee.id, {
                            status: e.target.value as RefereeStatus,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-border/80 bg-background/80 font-semibold focus:border-primary outline-none"
                      >
                        {REFEREE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-foreground mb-1">Promote / Change Level</label>
                      <select
                        value={selectedReferee.level}
                        onChange={(e) =>
                          handleUpdateReferee(selectedReferee.id, {
                            level: e.target.value as RefereeLevel,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-border/80 bg-background/80 font-semibold focus:border-primary outline-none"
                      >
                        {REFEREE_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions to Issue or Renew */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                    <button
                      type="button"
                      disabled={issuingCertId === selectedReferee.id}
                      onClick={() => handleIssueCertificateAndActivate(selectedReferee)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {issuingCertId === selectedReferee.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>Issue Certificate &amp; Activate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printRefereeRegistrationSlip(selectedReferee)}
                      className="px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border/80 text-foreground text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Print Slip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadRefereeReceiptPDF(selectedReferee)}
                      className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download receipt PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateReferee(selectedReferee.id, {
                          status: "Suspended",
                        })
                      }
                      className="px-4 py-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition-all flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Suspend Official</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Training & Exam Scores */}
              {inspectorTab === "exam" && (
                <div className="space-y-6">
                  {/* Exam Records Table Header & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span>Examination & Assessment Records ({selectedReferee.examRecords.length})</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Log official Theory, Practical Ring assessment, and Technical evaluations.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setExamForm({
                          theoryScore: 45,
                          theoryMaxScore: 50,
                          practicalScore: 48,
                          practicalMaxScore: 50,
                          date: new Date().toISOString().split("T")[0],
                          examiner: "Technical Committee Board",
                          remarks: "Candidate demonstrated comprehensive technical proficiency in match adjudication and rules enforcement.",
                          autoCertify: true,
                        });
                        setIsExamModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enter Theory & Practical Marks</span>
                    </button>
                  </div>

                  {selectedReferee.examRecords.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-muted/30 border border-border/60 text-center space-y-3">
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <FileCheck className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">No Examination Scores Logged Yet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Click the button above to enter Theory & Practical marks for {selectedReferee.name}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExamForm({
                            theoryScore: 45,
                            theoryMaxScore: 50,
                            practicalScore: 48,
                            practicalMaxScore: 50,
                            date: new Date().toISOString().split("T")[0],
                            examiner: "Technical Committee Board",
                            remarks: "Candidate demonstrated comprehensive technical proficiency in match adjudication and rules enforcement.",
                            autoCertify: true,
                          });
                          setIsExamModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Exam Scores</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/70 overflow-hidden text-xs bg-card">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground border-b border-border/70">
                          <tr>
                            <th className="p-3">Exam Type</th>
                            <th className="p-3">Score / Max</th>
                            <th className="p-3">Percentage</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Examiner</th>
                            <th className="p-3">Result</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedReferee.examRecords.map((ex) => {
                            const pct = ex.maxScore > 0 ? Math.round((ex.score / ex.maxScore) * 100) : 0;
                            return (
                              <tr key={ex.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-bold text-foreground flex items-center gap-2">
                                  <span
                                    className={`size-2 rounded-full ${
                                      ex.examType === "Theory"
                                        ? "bg-blue-500"
                                        : ex.examType === "Practical"
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                  />
                                  <span>{ex.examType} Exam</span>
                                </td>
                                <td className="p-3 font-bold text-primary">
                                  {ex.score} / {ex.maxScore}
                                </td>
                                <td className="p-3 font-semibold text-foreground">
                                  {pct}%
                                </td>
                                <td className="p-3 text-muted-foreground">{ex.date}</td>
                                <td className="p-3 text-foreground font-medium">{ex.examiner}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                      ex.result === "Passed"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                    }`}
                                  >
                                    {ex.result === "Passed" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                                    {ex.result}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExamRecord(ex.id)}
                                    title="Delete Exam Record"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Tournament Duty History */}
              {inspectorTab === "duty" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Assigned Tournament Duties ({selectedReferee.dutyAppointments.length})</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => {
                        setAppointForm((prev) => ({ ...prev, refereeId: selectedReferee.id }));
                        setIsAppointOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Appoint to Event</span>
                    </button>
                  </div>

                  {selectedReferee.dutyAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-6 rounded-2xl bg-muted/30 border border-border/60 text-center">
                      No tournament duties logged yet for this referee.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedReferee.dutyAppointments.map((duty) => (
                        <div
                          key={duty.id}
                          className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{duty.championshipName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                                {duty.ringOrMatNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground mt-1 text-[11px]">
                              <span>
                                <strong>Position:</strong> {duty.position}
                              </span>
                              <span>• Date: {duty.eventDate}</span>
                              {duty.location && <span>• {duty.location}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {duty.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOURNAMENT APPOINTMENT MODAL
          ========================================================================= */}
      {isAppointOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">Appoint Official to Tournament Mat</h3>
                  <p className="text-[11px] text-muted-foreground">Assign eligible active referees to tournament duties</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Select Eligible Active Referee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={appointForm.refereeId}
                  onChange={(e) => setAppointForm((prev) => ({ ...prev, refereeId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-border/80 bg-background font-medium focus:border-primary outline-none"
                >
                  <option value="">-- Choose Active Certified Referee --</option>
                  {activeLicensedReferees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.level}) — Cert: {r.licenseNumber}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  * Note: Only officially certified & active officials appear in this list.
                </p>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Championship / Tournament</label>
                <input
                  required
                  type="text"
                  value={appointForm.championshipName}
                  onChange={(e) => setAppointForm((prev) => ({ ...prev, championshipName: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Ring / Mat Number</label>
                  <input
                    type="text"
                    value={appointForm.ringOrMatNumber}
                    onChange={(e) => setAppointForm((prev) => ({ ...prev, ringOrMatNumber: e.target.value }))}
                    placeholder="e.g. Mat 1, Ring A"
                    className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Duty Position</label>
                  <select
                    value={appointForm.position}
                    onChange={(e) =>
                      setAppointForm((prev) => ({ ...prev, position: e.target.value as DutyPosition }))
                    }
                    className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs font-semibold focus:border-primary outline-none"
                  >
                    {DUTY_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Event Date</label>
                  <input
                    type="date"
                    value={appointForm.eventDate}
                    onChange={(e) => setAppointForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">Location</label>
                  <input
                    type="text"
                    value={appointForm.location}
                    onChange={(e) => setAppointForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>
              {/* Selected Referee Email Notification Indicator */}
              {appointForm.refereeId && (
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Mail className="size-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Email Notification</span>
                      <span className="font-medium text-foreground">
                        {activeLicensedReferees.find((r) => r.id === appointForm.refereeId)?.email || "Referee email on file"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Auto-Dispatched
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingAppoint}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAppoint ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Appointing & Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Official Appointment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE OFFICIAL MODAL
          ========================================================================= */}
      {/* =========================================================================
          CREATE / EDIT OFFICIAL MODAL
          ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-7 overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-foreground">
                      {editingReferee ? `Edit Referee Details – ${editingReferee.name}` : "Register New Technical Official"}
                    </h3>
                    {editingReferee && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {editingReferee.id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingReferee
                      ? `Update credentials, licensing, Dan rank, and profile details for ${editingReferee.name}`
                      : "Add certified referee record directly into the official federation registry"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingReferee(null);
                }}
                className="p-2 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReferee} className="space-y-6 text-xs sm:text-sm">
              {/* SECTION 1: PERSONAL & IDENTITY */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    1. Identity & Personal Details
                  </h4>
                </div>

                {/* Profile Photo Upload */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-foreground text-xs">Official Passport / Profile Photo</label>
                  <input
                    type="file"
                    ref={createPhotoInputRef}
                    onChange={handleCreatePhotoUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  {createForm.photo ? (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-14 rounded-xl overflow-hidden border border-primary/40 bg-background shrink-0">
                          <img src={createForm.photo} alt="Preview" className="size-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {createPhotoFileName || "Referee_Profile_Photo.jpg"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {createPhotoFileSize && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent text-foreground font-semibold">
                                {createPhotoFileSize}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> Photo Attached
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => createPhotoInputRef.current?.click()}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm((prev) => ({ ...prev, photo: "" }));
                            setCreatePhotoFileName("");
                            setCreatePhotoFileSize("");
                          }}
                          className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => createPhotoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                        uploadingCreatePhoto
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary bg-accent/10 hover:bg-accent/20"
                      }`}
                    >
                      {uploadingCreatePhoto ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <Loader2 className="size-5 text-primary animate-spin" />
                          <p className="text-xs font-bold text-foreground">
                            Uploading {createPhotoFileName || "photo"} ({createPhotoProgress}%)...
                          </p>
                          <div className="w-40 bg-muted rounded-full h-1.5 overflow-hidden border border-border">
                            <div
                              className="bg-primary h-full transition-all duration-200"
                              style={{ width: `${createPhotoProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <UploadCloud className="size-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-foreground">Click to upload official photo</p>
                            <p className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Official Referee ID
                    </label>
                    <input
                      type="text"
                      value={createForm.id || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, id: e.target.value }))}
                      placeholder="Auto-generated if left blank (e.g. KAC-REF-2026-012)"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs font-mono focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      National / Member ID (KALAWAR ID)
                    </label>
                    <input
                      type="text"
                      value={createForm.kalawarId || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, kalawarId: e.target.value }))}
                      placeholder="e.g. KAC-2026-7251"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={createForm.dob || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Gender</label>
                    <select
                      value={createForm.gender || "Male"}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Blood Group</label>
                    <select
                      value={createForm.bloodGroup || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      <option value="">Select Blood Group (Optional)</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT & RESIDENTIAL ADDRESS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Mail className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    2. Contact & Residential Location
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={createForm.username || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                      placeholder="e.g. referee123"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Account Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={createForm.password || ""}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password or view current"
                        className="w-full px-3.5 py-2 pr-10 rounded-2xl border border-border/80 bg-background text-xs font-mono focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="referee@example.com"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Preserved Legacy Association Data Card (Hidden for new registrations) */}
                {Boolean(createForm.tempStateAssociation || createForm.tempDistrictAssociation) && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Preserved Legacy Association Data
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-md font-mono border border-border/40">
                        Admin Reference Only
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {createForm.tempStateAssociation ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            Temporary State Association
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={createForm.tempStateAssociation}
                            className="w-full bg-background/80 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-300 font-medium cursor-default"
                          />
                        </div>
                      ) : null}
                      {createForm.tempDistrictAssociation ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            Temporary District Association
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={createForm.tempDistrictAssociation}
                            className="w-full bg-background/80 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-300 font-medium cursor-default"
                          />
                        </div>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-amber-600/90 dark:text-amber-400/80">
                      ℹ️ This referee originally registered with legacy state/district data. Select the active dynamic State &amp; District Associations below to officially link their profile.
                    </p>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      State Association Unit <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.state}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value, district: "" }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      <option value="">Select State Association</option>
                      {approvedStateOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      {createForm.state && !approvedStateOptions.includes(createForm.state) && (
                        <option value={createForm.state}>{createForm.state}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">
                      District Association <span className="text-rose-500">*</span>
                    </label>
                    {(() => {
                      const dynamicDistOpts = getApprovedDistrictAssociationDropdownOptions(rawDistrictAssocs, createForm.state);
                      const staticDistOpts = states.includes(createForm.state) ? [] : [];
                      const distOptions = dynamicDistOpts.length > 0 ? dynamicDistOpts : staticDistOpts;

                      return (
                        <select
                          value={createForm.district}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, district: e.target.value }))}
                          className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                        >
                          <option value="">Select District Association</option>
                          {distOptions.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                          {createForm.district && !distOptions.includes(createForm.district) && (
                            <option value={createForm.district}>{createForm.district}</option>
                          )}
                        </select>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      value={createForm.pincode || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, pincode: e.target.value }))}
                      placeholder="e.g. 411001"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Emergency Contact Phone / Name</label>
                    <input
                      type="text"
                      value={createForm.emergencyContact || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="e.g. Spouse / 9876500000"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Residential / Dojo Address</label>
                    <input
                      type="text"
                      value={createForm.address || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address, building, locality"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: MARTIAL ARTS & REFEREE ACCREDITATION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Award className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    3. Martial Arts & Referee Credentials
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Sport Discipline</label>
                    <select
                      value={createForm.discipline || disciplines[0]?.name || "Kalawar Martial Arts"}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, discipline: e.target.value }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      {disciplines.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Affiliated Academy / Club</label>
                    <select
                      value={createForm.academy || "Independent"}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, academy: e.target.value }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      {clubOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Current Dan Rank / Belt</label>
                    <input
                      type="text"
                      value={createForm.currentRank}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, currentRank: e.target.value }))}
                      placeholder="e.g. 1st Dan Black Belt"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Dan Certification Year</label>
                    <input
                      type="text"
                      value={createForm.danCertificationYear || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, danCertificationYear: e.target.value }))}
                      placeholder="e.g. 2023"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Dan Grading Authority</label>
                    <input
                      type="text"
                      value={createForm.danGradingAuthority || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, danGradingAuthority: e.target.value }))}
                      placeholder="e.g. World Martial Arts Council"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Experience (Tenure & Background)</label>
                    <input
                      type="text"
                      value={createForm.martialArtsExperience}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, martialArtsExperience: e.target.value }))}
                      placeholder="e.g. 5 Years"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Matches / Bouts Officiated</label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      value={createForm.matchesOfficiated ?? 0}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, matchesOfficiated: Number(e.target.value) || 0 }))}
                      placeholder="e.g. 35"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Referee Level / Grade</label>
                    <select
                      value={createForm.level}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, level: e.target.value as RefereeLevel }))
                      }
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs font-semibold focus:border-primary outline-none"
                    >
                      {REFEREE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Accreditation Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, status: e.target.value as RefereeStatus }))
                      }
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs font-semibold focus:border-primary outline-none"
                    >
                      {REFEREE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">Officiating Specialization</label>
                    <select
                      value={createForm.specialization || "Mat / Ring Referee"}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, specialization: e.target.value }))}
                      className="w-full px-3 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    >
                      <option value="Mat / Ring Referee">Mat / Ring Referee</option>
                      <option value="Judge / Scorer">Judge / Scorer</option>
                      <option value="Chief Arbitrator">Chief Arbitrator</option>
                      <option value="Timekeeper / Tech Table">Timekeeper / Tech Table</option>
                      <option value="Medical & Safety Marshal">Medical & Safety Marshal</option>
                      <option value="Kaya Yuddha Specialist">Kaya Yuddha Specialist</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: DIGITAL LICENSE & CREDENTIAL PROOF */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    4. Official License & Proof Documentation
                  </h4>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1">Official License Number</label>
                    <input
                      type="text"
                      value={createForm.licenseNumber || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="e.g. KAC-ACT-REF-2026-012"
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs font-mono focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">License Issued Date</label>
                    <input
                      type="date"
                      value={createForm.licenseIssuedDate || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, licenseIssuedDate: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1">License Valid Until</label>
                    <input
                      type="date"
                      value={createForm.licenseValidUntil || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, licenseValidUntil: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Certification Document / Dan Rank Proof Upload Zone */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-foreground text-xs">
                    Black Belt / Referee Certification Proof Document (PDF or Image)
                  </label>
                  <input
                    type="file"
                    ref={createDocInputRef}
                    onChange={handleCreateDocUpload}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                  />

                  {createForm.certificationDocument ? (
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <FileCheck className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {createForm.certificationDocumentName || "Referee_Certification_Proof.pdf"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {createForm.certificationDocumentSize && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent text-foreground font-semibold">
                                {createForm.certificationDocumentSize}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> Proof Document Linked
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: createForm.certificationDocument!,
                              name: createForm.certificationDocumentName || "Referee Certificate",
                              refereeName: createForm.name || "Referee Official",
                              refereeId: createForm.id || "OFFICIAL",
                              rank: createForm.currentRank,
                              size: createForm.certificationDocumentSize,
                            })
                          }
                          className="px-2.5 py-1 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => createDocInputRef.current?.click()}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm((prev) => ({
                              ...prev,
                              certificationDocument: "",
                              certificationDocumentName: "",
                              certificationDocumentSize: "",
                            }));
                            setCreateDocFileName("");
                            setCreateDocFileSize("");
                          }}
                          className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => createDocInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                        uploadingCreateDoc
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary bg-accent/10 hover:bg-accent/20"
                      }`}
                    >
                      {uploadingCreateDoc ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <Loader2 className="size-5 text-primary animate-spin" />
                          <p className="text-xs font-bold text-foreground">
                            Uploading {createDocFileName || "document"} ({createDocProgress}%)...
                          </p>
                          <div className="w-40 bg-muted rounded-full h-1.5 overflow-hidden border border-border">
                            <div
                              className="bg-primary h-full transition-all duration-200"
                              style={{ width: `${createDocProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <div className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <FileText className="size-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-foreground">
                              Upload Dan Rank / Official Referee Diploma
                            </p>
                            <p className="text-[10px] text-muted-foreground">PDF, PNG, JPG up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: TECHNICAL BIO & COMMITTEE NOTES */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <FileText className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    5. Biography & Administrative Notes
                  </h4>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Official Technical Biography</label>
                  <textarea
                    rows={2}
                    value={createForm.bio || ""}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Officiating credentials, seminar history, tournament achievements..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">
                    Technical Committee / Admin Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={createForm.internalNotes || ""}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Internal verification notes, disciplinary remarks, exam schedules..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-border/80 bg-background text-xs focus:border-primary outline-none resize-none"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingReferee(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl border border-border/80 hover:bg-muted text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingReferee}
                  className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSavingReferee ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {editingReferee ? "Save & Update Official Details" : "Register Official to Database"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theory & Practical Exam Marks Entry Modal */}
      {isExamModalOpen && selectedReferee && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border/90 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0 border border-primary/20">
                <Award className="size-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Record Theory & Practical Exam Marks
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official Technical Evaluation for <strong className="text-foreground">{selectedReferee.name}</strong> ({selectedReferee.level})
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePublishExamMarks();
              }}
              className="space-y-4"
            >
              {/* Candidate Quick Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Official ID & Rank</span>
                  <span className="font-mono font-bold text-foreground">{selectedReferee.id}</span>
                  <span className="text-muted-foreground mx-1.5">•</span>
                  <span className="font-semibold text-primary">{selectedReferee.currentRank || "Dan Rank"}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {selectedReferee.status}
                </span>
              </div>

              {/* Theory & Practical Scores Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Theory Exam Box */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Theory Exam
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {Math.round(((Number(examForm.theoryScore) || 0) / (Number(examForm.theoryMaxScore) || 50)) * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={examForm.theoryMaxScore}
                        required
                        value={examForm.theoryScore}
                        onChange={(e) =>
                          setExamForm((prev) => ({ ...prev, theoryScore: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:border-blue-500 outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Max Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={examForm.theoryMaxScore}
                        onChange={(e) =>
                          setExamForm((prev) => ({ ...prev, theoryMaxScore: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold text-muted-foreground focus:border-blue-500 outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                        (Number(examForm.theoryScore) || 0) >= (Number(examForm.theoryMaxScore) || 50) * 0.6
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {(Number(examForm.theoryScore) || 0) >= (Number(examForm.theoryMaxScore) || 50) * 0.6
                        ? "✓ Theory Passed (≥60%)"
                        : "✗ Theory Failed (<60%)"}
                    </span>
                  </div>
                </div>

                {/* Practical Assessment Box */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Practical Ring
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {Math.round(((Number(examForm.practicalScore) || 0) / (Number(examForm.practicalMaxScore) || 50)) * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={examForm.practicalMaxScore}
                        required
                        value={examForm.practicalScore}
                        onChange={(e) =>
                          setExamForm((prev) => ({ ...prev, practicalScore: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:border-amber-500 outline-none text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Max Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={examForm.practicalMaxScore}
                        onChange={(e) =>
                          setExamForm((prev) => ({ ...prev, practicalMaxScore: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold text-muted-foreground focus:border-amber-500 outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                        (Number(examForm.practicalScore) || 0) >= (Number(examForm.practicalMaxScore) || 50) * 0.6
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {(Number(examForm.practicalScore) || 0) >= (Number(examForm.practicalMaxScore) || 50) * 0.6
                        ? "✓ Practical Passed (≥60%)"
                        : "✗ Practical Failed (<60%)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Aggregate Card */}
              {(() => {
                const totalScore = (Number(examForm.theoryScore) || 0) + (Number(examForm.practicalScore) || 0);
                const totalMax = (Number(examForm.theoryMaxScore) || 50) + (Number(examForm.practicalMaxScore) || 50);
                const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
                const isPassed =
                  (Number(examForm.theoryScore) || 0) >= (Number(examForm.theoryMaxScore) || 50) * 0.6 &&
                  (Number(examForm.practicalScore) || 0) >= (Number(examForm.practicalMaxScore) || 50) * 0.6;

                return (
                  <div className="p-3.5 rounded-2xl bg-accent/40 border border-border/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Aggregate Performance</span>
                      <span className="text-sm font-extrabold text-foreground">
                        {totalScore} / {totalMax} <span className="text-xs font-bold text-primary">({totalPct}%)</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Overall Result</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          isPassed
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                        {isPassed ? "PASSED & QUALIFIED" : "FAILED"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Exam Date & Examiner Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-foreground mb-1">Examination Date</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-background text-xs font-semibold focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Chief Examiner / Board</label>
                  <input
                    type="text"
                    required
                    value={examForm.examiner}
                    onChange={(e) => setExamForm((prev) => ({ ...prev, examiner: e.target.value }))}
                    placeholder="e.g. Technical Examination Board"
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-background text-xs font-semibold focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="text-xs">
                <label className="block font-bold text-foreground mb-1">Examiner Remarks & Evaluation Notes</label>
                <textarea
                  rows={2}
                  value={examForm.remarks}
                  onChange={(e) => setExamForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Official observations regarding rules comprehension, signal clarity, mat command..."
                  className="w-full px-3 py-2 rounded-xl border border-border/80 bg-background text-xs focus:border-primary outline-none resize-none"
                />
              </div>

              {/* Auto Certify Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={examForm.autoCertify}
                  onChange={(e) => setExamForm((prev) => ({ ...prev, autoCertify: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                <span className="text-xs text-foreground font-medium">
                  Automatically set official status to <strong>&ldquo;Certified&rdquo;</strong> upon successful completion
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  disabled={isPublishingExam}
                  className="px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPublishingExam}
                  className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPublishingExam ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Publishing Marks...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      <span>Publish & Record Marks</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
