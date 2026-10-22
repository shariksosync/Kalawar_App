"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  MapPin,
  Award,
  Phone,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  Loader2,
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Filter,
  Download,
  FileCheck,
  Inbox,
  ArrowUpRight,
  UploadCloud,
  Printer,
  QrCode,
  Share2,
  Building2,
  GraduationCap,
  Scale,
  Briefcase,
  UserCheck,
  AlertCircle,
  User,
  Droplet,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { states, disciplines } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import type { Player } from "@/data/people";
import { cn, formatToDDMMYYYY, openFileInFullSize, downloadFile } from "@/lib/utils";
import { ImageUploadField } from "./ImageUploadField";
import { downloadRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { getClubDropdownOptions, INDEPENDENT_CLUB, getApprovedStateAssociationDropdownOptions, getApprovedDistrictAssociationDropdownOptions } from "@/lib/club-coach-options";
import {
  downloadCoachCertificatePDF,
  printCoachCertificate,
} from "@/lib/certificate-pdf";

const COACH_QUALIFICATIONS = [
  "Level 0 - Trainee Coach",
  "Level 1 - State Certified",
  "Level 2 - National Coach",
  "Level 3 - Master Performance Coach",
  "International WSF/Olympic Certified",
  "Level A - Elite Head Coach",
  "Level B - Senior Technical Coach",
  "Level C - Assistant Instructor",
];

export function AdminCoachesManager() {
  const [coaches, setCoaches] = useState<Player[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Player[]>([]);
  const [clubOptions, setClubOptions] = useState<string[]>([INDEPENDENT_CLUB]);
  const [rawStateAssocs, setRawStateAssocs] = useState<any[]>([]);
  const [rawDistrictAssocs, setRawDistrictAssocs] = useState<any[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Section Tab Navigation
  const [activeSectionTab, setActiveSectionTab] = useState<"active" | "applications" | "registered_requests">("active");

  // Filters for Section 1 (Active Coaches)
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filters for Section 2 (Applications - Apply For Coach)
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [appStateFilter, setAppStateFilter] = useState("All");
  const [appStatusFilter, setAppStatusFilter] = useState("All");

  // Filters for Section 3 (Registered Coach Requests - Already a Coach)
  const [alreadySearchQuery, setAlreadySearchQuery] = useState("");
  const [alreadyStateFilter, setAlreadyStateFilter] = useState("All");
  const [alreadyStatusFilter, setAlreadyStatusFilter] = useState("All");
  const [alreadyDocFilter, setAlreadyDocFilter] = useState("All");

  // Document Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Player | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Coach Certificate Studio Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certCoach, setCertCoach] = useState<Player | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    id: "",
    number: "",
    holder: "",
    coachLevel: "Level 2 - National Coach",
    discipline: "Kalawar Martial Arts",
    danBelt: "3rd Dan Black Belt",
    dob: "1990-08-15",
    academyClub: "Independent National Academy",
    district: "Pune",
    state: "Maharashtra",
    examDate: "2026-01-12",
    venue: "National Sports Complex, Pune",
    issueDate: "2026-01-15",
    validUntil: "2028-12-31",
    photo: "",
    email: "",
    phone: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    image: "",
    state: "",
    tempStateAssociation: "",
    tempDistrictAssociation: "",
    discipline: "Kalawar Martial Arts",
    registrationType: "Apply For Coach",
    qualification: "Level 2 - National Coach",
    club: INDEPENDENT_CLUB,
    experienceYears: "4",
    specialization: "",
    beltRank: "",
    idNumber: "",
    dob: "",
    gender: "Male",
    bloodGroup: "",
    emergencyContact: "",
    city: "",
    pincode: "",
    address: "",
    bio: "",
    status: "Verified",
    affiliationDocument: "",
    affiliationDocumentName: "",
    affiliationDocumentSize: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [coachesRes, clubsRes, idCardsRes, stateAssocsRes, districtAssocsRes] = await Promise.all([
        fetch("/api/coaches"),
        fetch("/api/clubs?all=true"),
        fetch("/api/id-cards?includeRequests=true"),
        fetch("/api/state-associations"),
        fetch("/api/district-associations"),
      ]);

      const coachesData = await coachesRes.json();
      if (coachesData.success && Array.isArray(coachesData.coaches)) {
        setCoaches(coachesData.coaches);
      }

      const clubsData = await clubsRes.json();
      if (clubsData.success && Array.isArray(clubsData.clubs)) {
        setAvailableClubs(clubsData.clubs);
        setClubOptions(getClubDropdownOptions(clubsData.clubs));
      }

      const idCardsData = await idCardsRes.json().catch(() => ({ success: false }));
      if (idCardsData.success && Array.isArray(idCardsData.cards)) {
        setIdCards(idCardsData.cards);
      }

      const stateAssocsData = await stateAssocsRes.json().catch(() => ({ success: false }));
      if (stateAssocsData.success && Array.isArray(stateAssocsData.associations)) {
        setRawStateAssocs(stateAssocsData.associations);
      }

      const districtAssocsData = await districtAssocsRes.json().catch(() => ({ success: false }));
      if (districtAssocsData.success && Array.isArray(districtAssocsData.associations)) {
        setRawDistrictAssocs(districtAssocsData.associations);
      }
    } catch (err) {
      console.error("Failed to load coaches in admin:", err);
      toast.error("Failed to load coaches from database");
    } finally {
      setLoading(false);
    }
  };

  const approvedStateOptions = useMemo(() => {
    return getApprovedStateAssociationDropdownOptions(rawStateAssocs);
  }, [rawStateAssocs]);

  const isCoachIdCardIssued = (coach: Player | null | undefined): boolean => {
    if (!coach) return false;
    const coachIdClean = (coach.id || "").toLowerCase().trim();
    const coachNameClean = (coach.name || "").toLowerCase().trim();

    if ((coach as any).idCardNumber || (coach as any).idNumber || (coach as any).idCardId) {
      return true;
    }

    return idCards.some((card: any) => {
      const cardIdClean = (card.id || "").toLowerCase().trim();
      const cardHolderClean = (card.holderName || "").toLowerCase().trim();
      const isMatchingId = Boolean(coachIdClean && cardIdClean === coachIdClean);
      const isMatchingName = Boolean(coachNameClean && cardHolderClean === coachNameClean);
      const isActiveStatus = card.status === "Active" || card.status === "Approved" || card.status === "Valid";
      return (isMatchingId || isMatchingName) && isActiveStatus;
    });
  };

  const handleOpenCertWithIdCheck = (coach: Player) => {
    if (!isCoachIdCardIssued(coach)) {
      toast.warning("Generate ID Card for the USER First !", {
        description: `Coach ${coach.name} (${coach.id}) does not have an active ID card issued yet. Please generate their ID card in the ID Cards Hub first.`,
      });
      return;
    }
    handleOpenCertModal(coach);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Split Active vs Pending / Inactive Coaches
  const activeCoaches = useMemo(() => {
    return coaches.filter(
      (c) => c.status === "Verified" || c.status === "Active" || c.status === "Affiliated"
    );
  }, [coaches]);

  const pendingCoaches = useMemo(() => {
    return coaches.filter(
      (c) => c.status !== "Verified" && c.status !== "Active" && c.status !== "Affiliated"
    );
  }, [coaches]);

  // Helper to determine if coach registered as Already a Coach
  const isAlreadyCoach = (c: Player) => {
    if (c.registrationType === "Already a Coach" || c.registrationType === "Already Affiliated") return true;
    if (c.registrationType === "Apply For Coach" || c.registrationType === "Apply for Affiliation") return false;
    return Boolean(c.affiliationDocument);
  };

  // Split Pending into: Apply For Coach (Section 2) vs Already a Coach (Section 3)
  const applyApplications = useMemo(() => {
    return pendingCoaches.filter((c) => !isAlreadyCoach(c));
  }, [pendingCoaches]);

  const alreadyCoachRequests = useMemo(() => {
    return pendingCoaches.filter((c) => isAlreadyCoach(c));
  }, [pendingCoaches]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = coaches.length;
    const approved = activeCoaches.length;
    const applyAppsCount = applyApplications.length;
    const alreadyAppsCount = alreadyCoachRequests.length;
    const pending = pendingCoaches.filter((c) => c.status === "Pending" || !c.status).length;
    const underReview = pendingCoaches.filter((c) => c.status === "Under Review" || c.status === "Incomplete").length;
    const statesCount = new Set(coaches.map((c) => c.state).filter(Boolean)).size;
    const totalExperience = activeCoaches.reduce((acc, c) => acc + (Number(c.experienceYears) || 0), 0);
    return {
      total,
      approved,
      applyAppsCount,
      alreadyAppsCount,
      pending,
      underReview,
      statesCount,
      totalExperience,
    };
  }, [coaches, activeCoaches, pendingCoaches, applyApplications, alreadyCoachRequests]);

  const getCoachCertificateNumber = (coach: Player | any): string => {
    if (!coach) return "";
    if (coach.affiliationCertificateId) return coach.affiliationCertificateId;
    if (coach.certificateNumber) return coach.certificateNumber;
    if (coach.id) {
      if (coach.id.startsWith("KAL-CO-")) return coach.id;
      const numDigits = coach.id.replace(/[^0-9]/g, "").slice(-4);
      return `KAL-CO-${numDigits || "2026-001"}`;
    }
    return "KAL-CO-2026-001";
  };

  // Filtered List for Section 1: Active Coaches
  const filteredActiveCoaches = useMemo(() => {
    return activeCoaches.filter((c) => {
      if (stateFilter !== "All" && c.state?.toLowerCase() !== stateFilter.toLowerCase()) return false;
      if (levelFilter !== "All" && (c.qualification || c.level || "") !== levelFilter) return false;
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const certNo = getCoachCertificateNumber(c).toLowerCase();
        const matchCert = certNo.includes(q) || (c.affiliationCertificateId || "").toLowerCase().includes(q) || ((c as any).certificateNumber || "").toLowerCase().includes(q);
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchState = c.state?.toLowerCase().includes(q);
        const matchClub = c.club?.toLowerCase().includes(q);
        const matchDiscipline = c.discipline?.toLowerCase().includes(q);
        const matchQual = c.qualification?.toLowerCase().includes(q) || c.level?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCert && !matchCity && !matchState && !matchClub && !matchDiscipline && !matchQual) {
          return false;
        }
      }
      return true;
    });
  }, [activeCoaches, stateFilter, levelFilter, statusFilter, searchQuery]);

  // Filtered List for Section 2: Applications (Apply For Coach)
  const filteredApplyApplications = useMemo(() => {
    return applyApplications.filter((c) => {
      if (appStateFilter !== "All" && c.state?.toLowerCase() !== appStateFilter.toLowerCase()) return false;
      if (appStatusFilter !== "All" && (c.status || "Pending") !== appStatusFilter) return false;
      if (appSearchQuery.trim()) {
        const q = appSearchQuery.toLowerCase();
        const certNo = getCoachCertificateNumber(c).toLowerCase();
        const matchCert = certNo.includes(q) || (c.affiliationCertificateId || "").toLowerCase().includes(q) || ((c as any).certificateNumber || "").toLowerCase().includes(q);
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchClub = c.club?.toLowerCase().includes(q);
        const matchState = c.state?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCert && !matchEmail && !matchPhone && !matchClub && !matchState) {
          return false;
        }
      }
      return true;
    });
  }, [applyApplications, appStateFilter, appStatusFilter, appSearchQuery]);

  // Filtered List for Section 3: Registered Coach Requests (Already a Coach)
  const filteredAlreadyCoachRequests = useMemo(() => {
    return alreadyCoachRequests.filter((c) => {
      if (alreadyStateFilter !== "All" && c.state?.toLowerCase() !== alreadyStateFilter.toLowerCase()) return false;
      if (alreadyStatusFilter !== "All" && (c.status || "Pending") !== alreadyStatusFilter) return false;
      if (alreadyDocFilter === "with_doc" && !c.affiliationDocument) return false;
      if (alreadyDocFilter === "no_doc" && c.affiliationDocument) return false;
      if (alreadySearchQuery.trim()) {
        const q = alreadySearchQuery.toLowerCase();
        const certNo = getCoachCertificateNumber(c).toLowerCase();
        const matchCert = certNo.includes(q) || (c.affiliationCertificateId || "").toLowerCase().includes(q) || ((c as any).certificateNumber || "").toLowerCase().includes(q);
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchClub = c.club?.toLowerCase().includes(q);
        const matchState = c.state?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCert && !matchEmail && !matchPhone && !matchClub && !matchState) {
          return false;
        }
      }
      return true;
    });
  }, [alreadyCoachRequests, alreadyStateFilter, alreadyStatusFilter, alreadyDocFilter, alreadySearchQuery]);

  const handleOpenCreate = () => {
    setEditingCoach(null);
    const randId = `KSM-CO-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setFormData({
      id: randId,
      name: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      image: "",
      state: "",
      tempStateAssociation: "",
      tempDistrictAssociation: "",
      discipline: disciplines[0]?.name || "Kalawar Martial Arts",
      registrationType: "Apply For Coach",
      qualification: "Level 2 - National Coach",
      club: INDEPENDENT_CLUB,
      experienceYears: "4",
      specialization: "",
      beltRank: "",
      idNumber: "",
      dob: "",
      gender: "Male",
      bloodGroup: "",
      emergencyContact: "",
      city: "",
      pincode: "",
      address: "",
      bio: "",
      status: "Verified",
      affiliationDocument: "",
      affiliationDocumentName: "",
      affiliationDocumentSize: "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coach: Player) => {
    setEditingCoach(coach);

    const existingTempState = typeof coach.tempStateAssociation === "string" ? coach.tempStateAssociation.trim() : "";
    const existingTempDistrict = typeof coach.tempDistrictAssociation === "string" ? coach.tempDistrictAssociation.trim() : "";
    const rawState = typeof coach.state === "string" ? coach.state.trim() : "";
    const rawDistrict = typeof coach.district === "string" ? coach.district.trim() : (typeof coach.city === "string" ? coach.city.trim() : "");

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

    setFormData({
      id: coach.id,
      name: coach.name || "",
      username: coach.username || "",
      password: coach.rawPassword || coach.password || "",
      email: coach.email || "",
      phone: coach.phone || "",
      image: coach.image || "",
      state: initialDynamicState,
      tempStateAssociation: initialTempState,
      tempDistrictAssociation: initialTempDistrict,
      discipline: coach.discipline || disciplines[0]?.name || "Kalawar Martial Arts",
      registrationType: coach.registrationType || (coach.affiliationDocument ? "Already a Coach" : "Apply For Coach"),
      qualification: coach.qualification || coach.level || "Level 2 - National Coach",
      club: coach.club || INDEPENDENT_CLUB,
      experienceYears: String(coach.experienceYears ?? 4),
      specialization: coach.specialization || "",
      beltRank: coach.beltRank || "",
      idNumber: coach.idNumber || "",
      dob: coach.dob || "",
      gender: coach.gender || "Male",
      bloodGroup: coach.bloodGroup || "",
      emergencyContact: coach.emergencyContact || "",
      city: initialDynamicDistrict,
      pincode: coach.pincode || "",
      address: coach.address || coach.registeredAddress || "",
      bio: coach.bio || "",
      status: coach.status || "Verified",
      affiliationDocument: coach.affiliationDocument || "",
      affiliationDocumentName: coach.affiliationDocumentName || "",
      affiliationDocumentSize: coach.affiliationDocumentSize || "",
    });
    setIsModalOpen(true);
  };

  const handleModalDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds 2MB limit. Please upload a document under 2MB.");
      return;
    }

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "kalawar_coach_documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload document");
      }

      setFormData((prev) => ({
        ...prev,
        affiliationDocument: data.url,
        affiliationDocumentName: file.name,
      }));
      toast.success("Coach credential proof uploaded successfully!");
    } catch (err: any) {
      console.error("Doc upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) {
        docInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Coach full name is required");
      return;
    }
    if (!formData.registrationType || formData.registrationType === "Choose Registration type") {
      toast.error("Choose Registration type it is mandatory", {
        description: "Please select either 'Apply For Coach' or 'Already a Coach'.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const isEdit = Boolean(editingCoach);
      const url = isEdit
        ? "/api/coaches/" + encodeURIComponent(editingCoach!.id)
        : "/api/coaches";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        memberType: "Coach",
        experienceYears: Number(formData.experienceYears) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save coach");
      }

      toast.success(
        isEdit
          ? "Coach profile updated successfully!"
          : "New coach registered & accredited successfully!"
      );
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save coach error:", err);
      toast.error(err.message || "An error occurred while saving coach");
    } finally {
      setIsSaving(false);
    }
  };

  const handle1ClickApprove = async (coach: Player) => {
    try {
      const res = await fetch("/api/coaches/" + encodeURIComponent(coach.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Verified",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coach ${coach.name} Approved & Accredited!`, {
          description: `Status updated to Verified. ID: ${coach.id}`,
        });
        await loadData();
      } else {
        toast.error(data.error || "Failed to approve coach");
      }
    } catch {
      toast.error("Failed to approve coach");
    }
  };

  const handleRejectCoach = async (coach: Player) => {
    try {
      const res = await fetch("/api/coaches/" + encodeURIComponent(coach.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Suspended",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info(`Coach ${coach.name} marked as Suspended / Action Required`);
        await loadData();
      }
    } catch {
      toast.error("Failed to update coach status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const targetId = deleteCandidate.id;
    const cleanLowerId = targetId.toLowerCase();

    // Optimistically remove from local state immediately
    setCoaches((prev) => prev.filter((c) => c.id.toLowerCase() !== cleanLowerId));
    setDeleteCandidate(null);

    try {
      setIsDeleting(true);
      const res = await fetch("/api/coaches/" + encodeURIComponent(targetId), {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Coach removed from registry");
        await loadData();
      } else {
        toast.error(data.error || "Failed to delete coach");
        await loadData();
      }
    } catch {
      toast.error("Error deleting coach");
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      activeSectionTab === "active"
        ? filteredActiveCoaches
        : activeSectionTab === "applications"
        ? filteredApplyApplications
        : filteredAlreadyCoachRequests;

    if (listToExport.length === 0) {
      toast.error("No coach records to export in the selected view.");
      return;
    }

    const headers = [
      "Coach ID",
      "Full Name",
      "Registration Type",
      "Status",
      "Discipline",
      "Qualification / Level",
      "Specialization / Dan Rank",
      "Club / Academy",
      "Certificate ID",
      "State",
      "City / District",
      "Contact Phone",
      "Email",
      "DOB",
      "Gender",
      "Experience (Years)",
      "Registered Date",
    ];

    const rows = listToExport.map((c) => [
      `"${c.id || ""}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.registrationType || "").replace(/"/g, '""')}"`,
      `"${c.status || "Active"}"`,
      `"${(c.discipline || "").replace(/"/g, '""')}"`,
      `"${(c.qualification || (c as any).level || "").replace(/"/g, '""')}"`,
      `"${(c.specialization || c.beltRank || "").replace(/"/g, '""')}"`,
      `"${(c.club || "").replace(/"/g, '""')}"`,
      `"${(c.affiliationCertificateId || "").replace(/"/g, '""')}"`,
      `"${(c.state || "").replace(/"/g, '""')}"`,
      `"${(c.city || (c as any).district || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.dob || "").replace(/"/g, '""')}"`,
      `"${(c.gender || "").replace(/"/g, '""')}"`,
      `"${c.experienceYears ?? ""}"`,
      `"${(c.registeredOn || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const tabSuffix =
      activeSectionTab === "active"
        ? "Active_Coaches"
        : activeSectionTab === "applications"
        ? "Coach_Applications"
        : "Already_Coach_Requests";
    link.setAttribute("download", `KALAWAR_Coaches_${tabSuffix}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export ready", { description: `${listToExport.length} coach records exported to CSV` });
  };

  const openDocumentPreview = (url: string, title: string) => {
    setPreviewDocUrl(url);
    setPreviewDocTitle(title);
  };

  const handleDownloadRegistrationSlip = async (coach: Player) => {
    try {
      await downloadRegistrationReceiptPDF(coach);
    } catch (err) {
      console.error("Download registration slip error:", err);
      toast.error("Failed to download registration slip");
    }
  };

  const handlePrintRegistrationSlip = (coach: Player) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print registration receipt.");
      return;
    }
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Coach Registration Slip - ${coach.id}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            body { background: #fff; color: #1e293b; padding: 20px; }
            .receipt { max-width: 650px; margin: 0 auto; border: 2px solid #d4af37; border-radius: 16px; padding: 24px; }
            .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 14px; margin-bottom: 18px; }
            .logo-text { font-size: 17px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .subtitle { font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; background: #fef3c7; color: #b45309; margin-top: 8px; }
            .cred-box { background: #f8fafc; border: 1.5px dashed #d4af37; border-radius: 10px; padding: 14px; margin: 16px 0; }
            .grid { width: 100%; border-collapse: collapse; margin-top: 14px; }
            .grid td { padding: 7px 8px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
            .grid td.label { font-weight: 600; color: #64748b; width: 40%; }
            .grid td.val { font-weight: 700; color: #0f172a; }
            .footer { margin-top: 22px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10.5px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo-text">KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA</div>
              <div class="subtitle">Official Coach Accreditation & Member Registration Slip</div>
              <div class="badge">RECEIPT REF: REC-COACH-${coach.id}</div>
            </div>
            <div class="cred-box">
              <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">Verified Coach ID</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: monospace;">${coach.id}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary Email: ${coach.email || "Registered Coach"}</div>
            </div>
            <table class="grid">
              <tr><td class="label">Coach Full Name</td><td class="val">${coach.name.toUpperCase()}</td></tr>
              <tr><td class="label">Licensing Level</td><td class="val">${coach.qualification || coach.level || "Level 2 - National Coach"}</td></tr>
              <tr><td class="label">Primary Discipline</td><td class="val">${coach.discipline || "Kalawar Martial Arts"}</td></tr>
              <tr><td class="label">State Association Unit</td><td class="val">${coach.state}, India</td></tr>
              <tr><td class="label">Affiliated Academy / Club</td><td class="val">${coach.club || "Independent"}</td></tr>
              <tr><td class="label">Experience</td><td class="val">${coach.experienceYears || "4"} Years</td></tr>
              <tr><td class="label">Registration Type</td><td class="val" style="color: #b45309; font-weight: 800;">${coach.registrationType || "Apply For Coach"}</td></tr>
              <tr><td class="label">Accreditation Status</td><td class="val" style="color: #15803d;">${coach.status || "Verified"} (Recorded in National Ledger)</td></tr>
            </table>
            <div class="footer">
              <p>This is an authentic digital registration receipt issued by KALAWAR Sports & Martial Arts Federation of India.</p>
              <p>Official Member Portal: https://kalawarmartialarts.org | Secretariat: contact@kalawarfederation.org</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleOpenCertModal = (coach: Player) => {
    setCertCoach(coach);
    const defaultCertNo = getCoachCertificateNumber(coach);

    setCertFormData({
      id: coach.id,
      number: defaultCertNo,
      holder: coach.name || "",
      coachLevel: coach.qualification || coach.level || "Level 2 - National Coach",
      discipline: coach.discipline || "Kalawar Martial Arts",
      danBelt: coach.specialization || "3rd Dan Black Belt",
      dob: coach.dob || "1990-08-15",
      academyClub: coach.club || INDEPENDENT_CLUB,
      district: coach.city || "Pune",
      state: coach.state || "Maharashtra",
      examDate: coach.registeredOn || "2026-01-12",
      venue: "National Sports Complex, Pune",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: `${new Date().getFullYear() + 2}-12-31`,
      photo: coach.image || "",
      email: coach.email || "",
      phone: coach.phone || "",
    });
    setIsCertModalOpen(true);
  };

  const handleSaveAndIssueCert = async () => {
    if (!certCoach) return;
    if (!isCoachIdCardIssued(certCoach)) {
      toast.warning("Generate ID Card for the USER First !", {
        description: `Coach ${certCoach.name} (${certCoach.id}) must have an active ID card issued before issuing an official certificate.`,
      });
      return;
    }
    if (!certFormData.number.trim()) {
      toast.error("Certificate number is required");
      return;
    }
    if (!certFormData.holder.trim()) {
      toast.error("Coach name is required");
      return;
    }

    if (certFormData.coachLevel === "Level 0") {
      toast.error("Level 0 Coaches do not hold an official certificate", {
        description: "Please select Level 1, Level 2, Level 3, or International to issue an official certificate.",
      });
      return;
    }

    try {
      setIsIssuingCert(true);
      // 1. Save certificate to /api/certificates
      const certPayload = {
        number: certFormData.number,
        kalawarId: certCoach.id,
        holder: certFormData.holder,
        type: "Coach Certificate",
        event: "KALAWAR Coach Examination & Certification Programme",
        position: `Authorized ${certFormData.coachLevel}`,
        qualification: certFormData.coachLevel,
        discipline: certFormData.discipline,
        rankOrBelt: certFormData.danBelt,
        beltRank: certFormData.danBelt,
        danRank: certFormData.danBelt,
        dob: certFormData.dob,
        academy: certFormData.academyClub,
        club: certFormData.academyClub,
        district: certFormData.district,
        state: certFormData.state,
        examDate: certFormData.examDate,
        venue: certFormData.venue,
        issued: certFormData.issueDate,
        issueDate: certFormData.issueDate,
        validUntil: certFormData.validUntil,
        image: certFormData.photo,
        photo: certFormData.photo,
        email: certFormData.email,
        phone: certFormData.phone,
        status: "Valid",
        issuedBy: "Mr. Santosh Kasbe (Founder & President)",
      };

      const certRes = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certPayload),
      });

      // 2. Update coach profile with affiliationCertificateId
      await fetch("/api/coaches/" + encodeURIComponent(certCoach.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliationCertificateId: certFormData.number,
          qualification: certFormData.coachLevel,
          discipline: certFormData.discipline,
          specialization: certFormData.danBelt,
          dob: certFormData.dob,
          club: certFormData.academyClub,
          city: certFormData.district,
          state: certFormData.state,
          status: "Verified",
        }),
      });

      setCertCoach((prev) =>
        prev
          ? {
              ...prev,
              affiliationCertificateId: certFormData.number,
              status: "Verified",
            }
          : prev
      );

      toast.success(`Coach Certificate ${certFormData.number} Issued Successfully!`, {
        description: `National certificate recorded and linked to ${certFormData.holder}`,
      });

      await loadData();
    } catch (err: any) {
      console.error("Issue cert error:", err);
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIsIssuingCert(false);
    }
  };

  const handleDownloadCertPDF = () => {
    if (certFormData.coachLevel === "Level 0") {
      toast.error("Level 0 Coaches do not hold an official certificate.", {
        description: "Select Level 1, Level 2, Level 3, or International to download an official certificate.",
      });
      return;
    }
    downloadCoachCertificatePDF(certFormData);
  };

  const handlePrintCert = () => {
    if (certFormData.coachLevel === "Level 0") {
      toast.error("Level 0 Coaches do not hold an official certificate.", {
        description: "Select Level 1, Level 2, Level 3, or International to print an official certificate.",
      });
      return;
    }
    printCoachCertificate(certFormData);
  };

  const isCertIssued = Boolean(
    certCoach?.affiliationCertificateId ||
    (certCoach as any)?.certificateNumber ||
    (certCoach as any)?.hasIssuedCert
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-gold-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-stone-950 uppercase">
              Federation Governance
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Module 11 • Official Coaches &amp; Technical Instructors Registry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-400" />
            <span>Coach &amp; Master Instructor Management</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Manage active accredited coaches, review incoming coaching license applications, verify prior martial arts credentials &amp; diplomas, and issue official coaching certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-stone-800 hover:border-gold-500/50 bg-stone-900 text-stone-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Coaches to CSV"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-amber-400")} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-gold-gradient text-background px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register New Coach</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION TAB SWITCHER */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-1.5 rounded-2xl bg-stone-950 border border-stone-800 shadow-inner">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Section 1 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveSectionTab("active")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeSectionTab === "active"
                ? "bg-stone-900 text-amber-400 border border-gold-500/40 shadow-md"
                : "text-stone-400 hover:text-white hover:bg-stone-900/40"
            )}
          >
            <Award className="w-4 h-4" />
            <span>1. Active Certified Coaches &amp; Masters</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                activeSectionTab === "active"
                  ? "bg-amber-400 text-stone-950"
                  : "bg-stone-800 text-stone-400"
              )}
            >
              {stats.approved}
            </span>
          </button>

          {/* Section 2 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveSectionTab("applications")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer relative",
              activeSectionTab === "applications"
                ? "bg-stone-900 text-amber-400 border border-gold-500/40 shadow-md"
                : "text-stone-400 hover:text-white hover:bg-stone-900/40"
            )}
          >
            <Inbox className="w-4 h-4" />
            <span>2. Coach Applications &amp; Requests</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                stats.applyAppsCount > 0
                  ? "bg-amber-500 text-stone-950 animate-pulse"
                  : "bg-stone-800 text-stone-400"
              )}
            >
              {stats.applyAppsCount}
            </span>
          </button>

          {/* Section 3 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveSectionTab("registered_requests")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer relative",
              activeSectionTab === "registered_requests"
                ? "bg-stone-900 text-amber-400 border border-gold-500/40 shadow-md"
                : "text-stone-400 hover:text-white hover:bg-stone-900/40"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Registered Coach Requests</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                stats.alreadyAppsCount > 0
                  ? "bg-emerald-500 text-stone-950 font-black"
                  : "bg-stone-800 text-stone-400"
              )}
            >
              {stats.alreadyAppsCount}
            </span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 pr-3 text-[11px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{stats.approved} Active</span>
          <span className="text-stone-700">•</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{stats.applyAppsCount} New Apply</span>
          <span className="text-stone-700">•</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{stats.alreadyAppsCount} Already Coach</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ACTIVE CERTIFIED COACHES & MASTERS                             */}
      {/* ========================================================================= */}
      {activeSectionTab === "active" && (
        <div className="space-y-6">
          {/* Active KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">Active Coaches</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
              <p className="text-[10px] text-stone-400">Federation approved &amp; verified</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Total Experience</span>
                <Briefcase className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats.totalExperience} Years</p>
              <p className="text-[10px] text-stone-400">Combined coaching tenure</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">States &amp; UTs</span>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-400">{stats.statesCount}</p>
              <p className="text-[10px] text-stone-400">Nationwide coaching footprint</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Affiliated Dojos</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-400">{availableClubs.length}</p>
              <p className="text-[10px] text-stone-400">Registered partner academies</p>
            </div>
          </div>

          {/* Active Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search active coaches by name, ID, cert no. (e.g. KAL-CO-5273), city, state, club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All States ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All Qualifications</option>
                {COACH_QUALIFICATIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Coaches Roster Cards */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4 text-center rounded-3xl bg-stone-900/50 border border-stone-800">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-stone-400 text-xs font-mono">Loading certified coaches directory...</p>
            </div>
          ) : filteredActiveCoaches.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
              <GraduationCap className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-stone-300 text-sm font-semibold">No active coaches match the selected filters</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStateFilter("All");
                  setLevelFilter("All");
                }}
                className="text-amber-400 text-xs underline font-mono"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredActiveCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-gold-500/40 transition-all p-5 flex flex-col justify-between gap-4 shadow-lg group relative"
                >
                  <div className="space-y-3">
                    {/* Card Top: Photo, Name, ID & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-800 border border-stone-700 shrink-0">
                          {coach.image ? (
                            <img
                              src={coach.image}
                              alt={coach.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-500">
                              <Users className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                            {coach.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                              {coach.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/35">
                              CERT: {getCoachCertificateNumber(coach)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                              <Check className="w-3 h-3" /> VERIFIED
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-1.5 text-xs text-stone-300 pt-1 border-t border-stone-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-semibold text-amber-300 truncate">
                            {coach.qualification || coach.level || "Level 2 - National Coach"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-stone-400 shrink-0">
                          Cert: <span className="text-cyan-400 font-bold">{getCoachCertificateNumber(coach)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400">
                        <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">{coach.club || "Independent"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{coach.state}, India</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400">
                        <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Experience: {coach.experienceYears || "4"} Years</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadRegistrationSlip(coach)}
                        title="Download Official Registration Receipt Slip"
                        className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintRegistrationSlip(coach)}
                        title="Print Registration Receipt"
                        className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCertWithIdCheck(coach)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Issue / View Official Coach Certificate"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Certificate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coach)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(coach)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-stone-500 hover:text-red-400 transition-colors"
                        title="Delete Coach"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: COACH APPLICATIONS & REQUESTS (Apply For Coach)                */}
      {/* ========================================================================= */}
      {activeSectionTab === "applications" && (
        <div className="space-y-6">
          {/* Applications Search & Filters */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search fresh applicants by name, ID, cert no. (e.g. KAL-CO-5273), email, phone, or state..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={appStateFilter}
                onChange={(e) => setAppStateFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All States</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          {filteredApplyApplications.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
              <Inbox className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-stone-300 text-sm font-semibold">No pending coach applications (Apply For Coach)</p>
              <p className="text-stone-500 text-xs">Incoming fresh coach applications will appear here for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApplyApplications.map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-2xl bg-stone-900/90 border border-amber-500/20 hover:border-amber-500/40 p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-stone-950">
                          APPLY FOR COACH
                        </span>
                        <span className="text-xs font-mono text-stone-400">{coach.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/35">
                          CERT: {getCoachCertificateNumber(coach)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{coach.name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {coach.qualification || coach.level || "Level 0"} • {coach.discipline}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {coach.status || "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950 p-3 rounded-xl border border-stone-800">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">State</span>
                      <span className="text-stone-300 font-semibold">{coach.state}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Experience</span>
                      <span className="text-stone-300 font-semibold">{coach.experienceYears || "0"} Years</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Phone</span>
                      <span className="text-stone-300 font-semibold">{coach.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Email</span>
                      <span className="text-stone-300 font-semibold truncate block">{coach.email || "—"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coach)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Review Details
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectCoach(coach)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(coach)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-stone-400 hover:text-red-400 transition-colors"
                        title="Delete Applicant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCertWithIdCheck(coach)}
                        className="px-4 py-1.5 rounded-lg bg-gold-gradient text-stone-950 text-xs font-bold shadow-md hover:scale-102 active:scale-98 transition-transform flex items-center gap-1.5 cursor-pointer"
                        title="Approve Applicant & Issue Official Certificate"
                      >
                        <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve &amp; Issue Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: REGISTERED COACH REQUESTS (Already a Coach)                    */}
      {/* ========================================================================= */}
      {activeSectionTab === "registered_requests" && (
        <div className="space-y-6">
          {/* Registered Search & Filters */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search registered coach requests by name, ID, cert no. (e.g. KAL-CO-5273), or state..."
                value={alreadySearchQuery}
                onChange={(e) => setAlreadySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={alreadyStateFilter}
                onChange={(e) => setAlreadyStateFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All States</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={alreadyDocFilter}
                onChange={(e) => setAlreadyDocFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-gold-500/60"
              >
                <option value="All">All Document Statuses</option>
                <option value="with_doc">Attached Document Proof</option>
                <option value="no_doc">No Document</option>
              </select>
            </div>
          </div>

          {/* Registered List */}
          {filteredAlreadyCoachRequests.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
              <ShieldCheck className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-stone-300 text-sm font-semibold">No pending requests for Already a Coach</p>
              <p className="text-stone-500 text-xs">Requests from existing coaches with prior certification will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlreadyCoachRequests.map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-2xl bg-stone-900/90 border border-cyan-500/20 hover:border-cyan-500/40 p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400 text-stone-950">
                          ALREADY A COACH
                        </span>
                        <span className="text-xs font-mono text-stone-400">{coach.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/35">
                          CERT: {getCoachCertificateNumber(coach)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{coach.name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {coach.qualification || coach.level || "Level 1 - State Certified"} • {coach.discipline}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {coach.status || "Pending"}
                    </span>
                  </div>

                  {/* Attached Document Proof Box */}
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-200 truncate">
                          {coach.affiliationDocument ? "Verification Documents" : "No Proof Uploaded"}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {coach.affiliationDocument ? "Click view to inspect prior certificate" : "Manual verification required"}
                        </p>
                      </div>
                    </div>

                    {coach.affiliationDocument && (
                      <button
                        type="button"
                        onClick={() => openDocumentPreview(coach.affiliationDocument!, `${coach.name} - Verification Documents`)}
                        className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Proof</span>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coach)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Edit Record
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCertWithIdCheck(coach)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Issue / Preview Coach Certificate"
                      >
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Certificate</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectCoach(coach)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                      >
                        Hold
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(coach)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-stone-400 hover:text-red-400 transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handle1ClickApprove(coach)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-md hover:scale-102 transition-transform flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verify &amp; Accredit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{previewDocTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-[300px]">
              {previewDocUrl.endsWith(".pdf") ? (
                <iframe src={previewDocUrl} className="w-full h-[60vh] rounded-xl border border-stone-800" />
              ) : (
                <img src={previewDocUrl} alt="Credential Proof" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
              )}
            </div>
            <div className="p-4 border-t border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => openFileInFullSize(previewDocUrl, previewDocTitle || "Coach Credential Document")}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Full Size</span>
              </button>
              <button
                type="button"
                onClick={() => downloadFile(previewDocUrl, (previewDocTitle || "Coach_Credential_Document").replace(/\s+/g, "_") + (previewDocUrl.endsWith(".pdf") ? ".pdf" : ".jpg"))}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT COACH MODAL                                                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  <span>{editingCoach ? "Edit Coach Profile" : "Register New Coach"}</span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Official national coaching accreditation record and license details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
              {/* FIELDSET 1: COACH PROFILE & IDENTITY */}
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/70 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Coach Identity &amp; Personal Details</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">Section 1 of 4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                      Coach Profile Photo
                    </label>
                    <ImageUploadField
                      value={formData.image}
                      onChange={(url) => setFormData({ ...formData, image: url })}
                      label="Upload Coach Photo"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coach Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* ID */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Federation Coach ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-400 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Registration Type Dropdown (Mandatory) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center justify-between">
                      <span>Registration Type <span className="text-red-400">*</span></span>
                      <span className="text-[10px] text-amber-400 font-mono">Mandatory field</span>
                    </label>
                    <select
                      required
                      value={formData.registrationType}
                      onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white font-semibold outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Choose Registration type">Choose Registration type</option>
                      <option value="Apply For Coach">Apply For Coach</option>
                      <option value="Already a Coach">Already a Coach</option>
                      <option value="Senior Master Coach">Senior Master Coach</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-400" />
                      <span>Blood Group</span>
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Govt ID / Aadhaar / Passport Ref */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Govt ID / Aadhaar / Passport Ref</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234-5678-9012 or Passport No."
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Coach Bio / Statement */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coach Bio / Professional Statement
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write a brief professional summary about martial arts experience, credentials, or achievements..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* FIELDSET 2: CONTACT & EMERGENCY DETAILS */}
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/70 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Contact &amp; Emergency Details</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">Section 2 of 4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Username</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. coach123"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Account Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password or view current"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Primary Email Address</span>
                    </label>
                    <input
                      type="email"
                      placeholder="coach@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mobile / Phone Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      <span>Emergency Contact (Name &amp; Phone Number)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma (Spouse / Parent) - +91 98765 43210"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* FIELDSET 3: REGIONAL FEDERATION & RESIDENTIAL ADDRESS */}
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/70 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Regional Federation &amp; Residential Address</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">Section 3 of 4</span>
                </div>

                {/* Preserved Legacy Association Data Card (Hidden for new registrations) */}
                {Boolean(formData.tempStateAssociation || formData.tempDistrictAssociation) && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Preserved Legacy Association Data
                      </span>
                      <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md font-mono">
                        Admin Reference Only
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {formData.tempStateAssociation ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Temporary State Association
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={formData.tempStateAssociation}
                            className="w-full bg-stone-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-200 font-medium cursor-default"
                          />
                        </div>
                      ) : null}
                      {formData.tempDistrictAssociation ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Temporary District Association
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={formData.tempDistrictAssociation}
                            className="w-full bg-stone-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-200 font-medium cursor-default"
                          />
                        </div>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-amber-400/80">
                      ℹ️ This coach originally registered with legacy state/district data. Select the active dynamic State &amp; District Associations below to officially link their profile.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State Association */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">State Association Unit</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">Select State Association</option>
                      {approvedStateOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      {formData.state && !approvedStateOptions.includes(formData.state) && (
                        <option value={formData.state}>{formData.state}</option>
                      )}
                    </select>
                  </div>

                  {/* District Association */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">District Association</label>
                    {(() => {
                      const dynamicDistOpts = getApprovedDistrictAssociationDropdownOptions(rawDistrictAssocs, formData.state);
                      const staticDistOpts = getDistrictsByState(formData.state || "Maharashtra");
                      const distOptions = dynamicDistOpts.length > 0 ? dynamicDistOpts : (staticDistOpts || []);
                      const currentVal = formData.city || (formData as any).district || "";

                      return (
                        <select
                          value={currentVal}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value, district: e.target.value } as any)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="">Select District Association</option>
                          {distOptions.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                          {currentVal && !distOptions.includes(currentVal) && (
                            <option value={currentVal}>{currentVal}</option>
                          )}
                        </select>
                      );
                    })()}
                  </div>

                  {/* Full Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Full Residential Address</label>
                    <textarea
                      rows={2}
                      placeholder="House / Flat No., Street, Landmark, Area"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  {/* Postal / PIN Code */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Postal / PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 411001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* FIELDSET 4: COACHING & SPORTS ACCREDITATION */}
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/70 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Coaching &amp; Sports Accreditation</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">Section 4 of 4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discipline */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Primary Discipline</label>
                    <select
                      value={formData.discipline}
                      onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {disciplines.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Coaching Qualification */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Coaching Qualification / License</label>
                    <select
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {COACH_QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Coaching Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. High Performance &amp; Youth Development"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Belt Rank / Dan Grade */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Belt Rank / Dan Grade</label>
                    <input
                      type="text"
                      placeholder="e.g. 3rd Dan Black Belt / Senior Master"
                      value={formData.beltRank}
                      onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Experience in Years */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Affiliated Club */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Affiliated Academy / Club</label>
                    <select
                      value={formData.club}
                      onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {clubOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Accreditation Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Verified">Verified / Active</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Incomplete">Incomplete</option>
                    </select>
                  </div>

                  {/* Document Proof Upload */}
                  <div className="md:col-span-2 space-y-2 pt-2 border-t border-stone-800">
                    <label className="block text-xs font-semibold text-stone-300">
                      Prior Coaching License / Black Belt Proof Document
                    </label>
                    {formData.affiliationDocument ? (
                      <div className="p-3 rounded-xl bg-stone-950 border border-amber-400/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-stone-200">
                            {formData.affiliationDocumentName || "Coach_Credential_Document.pdf"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, affiliationDocument: "", affiliationDocumentName: "" })}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-stone-800 rounded-xl p-4 text-center">
                        <input
                          ref={docInputRef}
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleModalDocUpload}
                          className="hidden"
                          id="modalDocUpload"
                        />
                        <label
                          htmlFor="modalDocUpload"
                          className="cursor-pointer text-xs text-amber-400 hover:underline font-semibold flex items-center justify-center gap-1.5"
                        >
                          {isUploadingDoc ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Uploading document...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" /> Click to upload certificate proof (PDF/PNG/JPG max 2MB)
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gold-gradient text-stone-950 text-xs font-extrabold shadow-gold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <span>Save Coach Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COACH CERTIFICATE STUDIO & ISSUANCE MODAL                                 */}
      {/* ========================================================================= */}
      {isCertModalOpen && certCoach && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-stone-900 border border-gold-500/40 rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Top Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between gap-4 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official Coach Certificate Studio
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-stone-950 uppercase">
                      Portrait A4
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Certificate issuance, metadata configuration, and high-res vector PDF generation for <strong className="text-white">{certCoach.name}</strong> ({certCoach.id})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCertModalOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Certificate Details Form */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-stone-950/60 space-y-4">
              {/* Level 0 Notice Banner */}
              {certFormData.coachLevel === "Level 0" && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Level 0: No Official Certificate Issued</p>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                      Level 0 is an introductory non-certified grade and does not have an official certificate. To issue an official certificate in the national ledger, select Level 1 (State Certified), Level 2 (National Coach), Level 3 (Master Coach), or International WSF.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Certificate Information
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">Dynamic Live Bind</span>
                </div>

                {/* Certificate Number */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1 flex items-center justify-between">
                    <span>Certificate Number (UID) <span className="text-amber-400">*</span></span>
                    <span className="text-[10px] font-mono text-amber-400">Pre-printed prefix: KAL-CO-</span>
                  </label>
                  <input
                    type="text"
                    value={certFormData.number}
                    onChange={(e) => setCertFormData({ ...certFormData, number: e.target.value })}
                    placeholder="KAL-CO-2026-001"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Coach Full Name (Conferred Upon) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={certFormData.holder}
                    onChange={(e) => setCertFormData({ ...certFormData, holder: e.target.value })}
                    placeholder="e.g. MASTER RAJESH SHARMA"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white uppercase outline-none focus:border-amber-400"
                  />
                </div>

                {/* Level & Discipline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Coach Level / Title
                    </label>
                    <select
                      value={certFormData.coachLevel}
                      onChange={(e) => setCertFormData({ ...certFormData, coachLevel: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      {COACH_QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Primary Discipline
                    </label>
                    <input
                      type="text"
                      value={certFormData.discipline}
                      onChange={(e) => setCertFormData({ ...certFormData, discipline: e.target.value })}
                      placeholder="Kalawar Martial Arts"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Dan Rank & DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Dan / Belt Rank
                    </label>
                    <input
                      type="text"
                      value={certFormData.danBelt}
                      onChange={(e) => setCertFormData({ ...certFormData, danBelt: e.target.value })}
                      placeholder="3rd Dan Black Belt"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={certFormData.dob}
                      onChange={(e) => setCertFormData({ ...certFormData, dob: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Academy / Club */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Academy / Club / Dojo
                  </label>
                  <input
                    type="text"
                    value={certFormData.academyClub}
                    onChange={(e) => setCertFormData({ ...certFormData, academyClub: e.target.value })}
                    placeholder="Independent National Academy"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* District & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">District / City</label>
                    <input
                      type="text"
                      value={certFormData.district}
                      onChange={(e) => setCertFormData({ ...certFormData, district: e.target.value })}
                      placeholder="Pune"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">State Association</label>
                    <select
                      value={certFormData.state}
                      onChange={(e) => setCertFormData({ ...certFormData, state: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      {states.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam Date & Venue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Examination Date</label>
                    <input
                      type="date"
                      value={certFormData.examDate}
                      onChange={(e) => setCertFormData({ ...certFormData, examDate: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Examination Venue</label>
                    <input
                      type="text"
                      value={certFormData.venue}
                      onChange={(e) => setCertFormData({ ...certFormData, venue: e.target.value })}
                      placeholder="National Sports Complex, Pune"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Issue Date & Valid Until */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={certFormData.issueDate}
                      onChange={(e) => setCertFormData({ ...certFormData, issueDate: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={certFormData.validUntil}
                      onChange={(e) => setCertFormData({ ...certFormData, validUntil: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Photo Field */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">Passport Photo URL</label>
                  <input
                    type="text"
                    value={certFormData.photo}
                    onChange={(e) => setCertFormData({ ...certFormData, photo: e.target.value })}
                    placeholder="https://... / coach image URL"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions Bar */}
            <div className="p-4 sm:p-5 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-950">
              <div className="flex items-center gap-2">
                {isCertIssued ? (
                  <Link
                    href={`/coach/${encodeURIComponent(certCoach.id)}/certificate`}
                    target="_blank"
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Fullscreen Certificate</span>
                  </Link>
                ) : (
                  <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Approve &amp; issue certificate to unlock printing and download</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintCert}
                  disabled={!isCertIssued}
                  className={cn(
                    "px-4 py-2 rounded-xl bg-stone-900 border text-xs font-bold flex items-center gap-1.5 transition-colors",
                    !isCertIssued
                      ? "border-stone-800/60 text-stone-600 opacity-40 cursor-not-allowed"
                      : "border-stone-800 text-stone-200 hover:text-white hover:bg-stone-800 cursor-pointer"
                  )}
                  title={!isCertIssued ? "Issue certificate first to enable printing" : "Print Certificate"}
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCertPDF}
                  disabled={!isCertIssued}
                  className={cn(
                    "px-4 py-2 rounded-xl bg-stone-800 border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm",
                    !isCertIssued
                      ? "border-stone-800/60 text-stone-600 opacity-40 cursor-not-allowed"
                      : "border-amber-500/40 text-amber-300 hover:bg-stone-700 cursor-pointer"
                  )}
                  title={!isCertIssued ? "Issue certificate first to enable download" : "Download Official PDF"}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndIssueCert}
                  disabled={isIssuingCert}
                  className="px-5 py-2 rounded-xl bg-gold-gradient text-stone-950 text-xs font-extrabold shadow-gold hover:scale-102 active:scale-98 transition-transform disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isIssuingCert ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording in Ledger...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve &amp; Issue Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Coach Record / Application?</h3>
                <p className="text-xs text-stone-400">This action will remove this applicant or coach from the federation registry.</p>
              </div>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300">
              <span className="font-bold text-white">{deleteCandidate.name}</span> ({deleteCandidate.id})
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
