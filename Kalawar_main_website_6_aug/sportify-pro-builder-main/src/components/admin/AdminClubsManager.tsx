"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  MapPin,
  Award,
  Users,
  Phone,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  FileText,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Check,
  DollarSign,
  Clock,
  ExternalLink,
  RefreshCw,
  Landmark,
  Sparkles,
  Filter,
  Image as ImageIcon,
  Trophy,
  Activity,
  Globe,
  Camera,
  Download,
  FileCheck,
  Inbox,
  ArrowUpRight,
  UploadCloud,
  Printer,
  QrCode,
  Share2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { getDistrictsByState } from "@/data/india-districts";
import { states, type Player, type BatchScheduleEntry } from "@/data/people";
import { cn, formatToDDMMYYYY, openFileInFullSize } from "@/lib/utils";
import { ImageUploadField } from "./ImageUploadField";
import {
  getApprovedStateAssociationDropdownOptions,
  getApprovedDistrictAssociationDropdownOptions,
} from "@/lib/club-coach-options";
import {
  printClubAffiliationCertificate,
  downloadClubAffiliationCertificatePDF,
  resolveAffiliationLevels,
} from "@/lib/certificate-pdf";
import { downloadRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";

const DEFAULT_BATCHES: BatchScheduleEntry[] = [
  { name: "Cadet / Junior Batch", time: "05:00 PM - 06:30 PM (Ages 6-14)" },
  { name: "Senior Competitors", time: "06:30 PM - 08:30 PM (Ages 15+)" },
  { name: "Morning Sparring", time: "06:00 AM - 08:00 AM (Elite squad)" },
  { name: "Special Batch", time: "07:00 PM - 08:30 PM (All Belts)" },
];

const STANDARD_DISCIPLINES = [
  "Taekwondo",
  "Karate",
  "Kickboxing",
  "Judo",
  "Mixed Martial Arts",
  "Muay Thai",
  "Boxing",
  "Kung Fu",
  "Brazilian Jiu-Jitsu",
  "Self Defense",
];

const STANDARD_FACILITIES = [
  "Federation Approved Combat Tatami Mats",
  "Electronic Scoring PSS Arena",
  "Strength & Conditioning Gym",
  "First-Aid & Sports Medicine Station",
  "Air Conditioned Dojang",
  "Heavy Punching Bags & Makiwara",
  "Padded Sparring Rings",
  "Locker Rooms & Showers",
  "CCTV Monitored Training Area",
  "Video Analysis & Tactics Lab",
];

export interface AdminClubsManagerProps {
  districtScope?: string;
  stateScope?: string;
}

export function AdminClubsManager({ districtScope, stateScope }: AdminClubsManagerProps = {}) {
  const [clubs, setClubs] = useState<Player[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<Player[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Section Tab Navigation
  const [activeSectionTab, setActiveSectionTab] = useState<"active" | "applications" | "affiliated_requests">("active");

  // Filters for Section 1 (Active Clubs)
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState(stateScope || "All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Filters for Section 2 (Applications - Apply for Affiliation)
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [appStateFilter, setAppStateFilter] = useState("All");
  const [appStatusFilter, setAppStatusFilter] = useState("All");
  const [appDocFilter, setAppDocFilter] = useState("All");

  // Filters for Section 3 (Affiliated Applicants Requests - Already Affiliated)
  const [alreadySearchQuery, setAlreadySearchQuery] = useState("");
  const [alreadyStateFilter, setAlreadyStateFilter] = useState("All");
  const [alreadyStatusFilter, setAlreadyStatusFilter] = useState("All");

  // Document Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("");

  // Certificate Live Preview Modal State
  const [previewCertClub, setPreviewCertClub] = useState<Player | null>(null);

  // Issue Certificate Modal State
  const [isIssueCertModalOpen, setIsIssueCertModalOpen] = useState(false);
  const [certTargetClub, setCertTargetClub] = useState<Player | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    affiliationCertificateId: "",
    levelOfAffiliation: "Academy/Club",
    levelsOfAffiliation: ["Academy/Club"] as string[],
    state: "Maharashtra",
    district: "Pune",
    academyClubDojo: "",
    headCoachInstructor: "",
    contactNo: "",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
  });

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Player | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rawStateAssocs, setRawStateAssocs] = useState<any[]>([]);
  const [rawDistrictAssocs, setRawDistrictAssocs] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    username: "",
    password: "",
    registrationNumber: "",
    logo: "",
    image: "",
    state: "",
    district: "",
    city: "",
    tempStateAssociation: "",
    tempDistrictAssociation: "",
    address: "",
    registeredAddress: "",
    pincode: "",
    discipline: "Kalawar Martial Arts",
    disciplines: ["Kalawar Martial Arts", "Taekwondo", "Karate"] as string[],
    headCoachName: "",
    coachIds: [] as string[],
    presidentName: "",
    secretaryName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    website: "",
    yearFounded: "2020",
    memberCount: "150",
    timings: "Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
    affiliationCertificateId: "",
    registrationType: "Apply for Affiliation",
    affiliationDocument: "",
    paymentStatus: "Paid",
    paymentMethod: "Razorpay",
    status: "Affiliated",
    bio: "",
    facilities: [
      "Federation Approved Combat Tatami Mats",
      "Electronic Scoring PSS Arena",
      "Strength & Conditioning Gym",
      "First-Aid & Sports Medicine Station",
    ] as string[],
    achievements: [
      "Officially Affiliated with KALAWAR National Federation",
      "Authorized Belt Grading & Certificate Examination Center",
      "Active Delegation in State & National Championships",
    ] as string[],
    photos: [] as string[],
    batches: DEFAULT_BATCHES as BatchScheduleEntry[],
  });

  // Modal Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Helper inputs for modal dynamic lists
  const [customDisciplineInput, setCustomDisciplineInput] = useState("");
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [newAchievementInput, setNewAchievementInput] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [clubsRes, coachesRes, idCardsRes, stateAssocsRes, districtAssocsRes] = await Promise.all([
        fetch("/api/clubs?all=true"),
        fetch("/api/coaches"),
        fetch("/api/id-cards?includeRequests=true"),
        fetch("/api/state-associations"),
        fetch("/api/district-associations"),
      ]);

      const clubsData = await clubsRes.json();
      if (clubsData.success && Array.isArray(clubsData.clubs)) {
        setClubs(clubsData.clubs);
      }

      const coachesData = await coachesRes.json();
      if (coachesData.success && Array.isArray(coachesData.coaches)) {
        setAvailableCoaches(coachesData.coaches);
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
      console.error("Failed to load clubs in admin:", err);
      toast.error("Failed to load clubs from database");
    } finally {
      setLoading(false);
    }
  };

  const approvedStateOptions = useMemo(() => {
    return getApprovedStateAssociationDropdownOptions(rawStateAssocs);
  }, [rawStateAssocs]);

  const isClubIdCardIssued = (club: Player | null | undefined): boolean => {
    if (!club) return false;
    const clubIdClean = (club.id || "").toLowerCase().trim();
    const clubNameClean = (club.name || "").toLowerCase().trim();

    if ((club as any).idCardNumber || (club as any).idNumber || (club as any).idCardId) {
      return true;
    }

    return idCards.some((card: any) => {
      const cardIdClean = (card.id || "").toLowerCase().trim();
      const cardHolderClean = (card.holderName || "").toLowerCase().trim();
      const cardAcademyClean = (card.academyName || "").toLowerCase().trim();
      const isMatchingId = Boolean(clubIdClean && cardIdClean === clubIdClean);
      const isMatchingName = Boolean(
        clubNameClean && (cardHolderClean === clubNameClean || cardAcademyClean === clubNameClean)
      );
      const isActiveStatus = card.status === "Active" || card.status === "Approved" || card.status === "Valid";
      return (isMatchingId || isMatchingName) && isActiveStatus;
    });
  };

  const handleOpenCertWithIdCheck = (club: Player) => {
    if (!isClubIdCardIssued(club)) {
      toast.warning("Generate ID Card for the USER First !", {
        description: `Club ${club.name} (${club.id}) does not have an active ID card issued yet. Please generate their ID card in the ID Cards Hub first.`,
      });
      return;
    }
    handleOpenIssueCert(club);
  };

  const handleVerifyAndAccredit = async (club: Player) => {
    try {
      const res = await fetch("/api/clubs/" + encodeURIComponent(club.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Affiliated",
          paymentStatus: "Paid",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`VERIFIED! ${club.name} Accredited Successfully`, {
          description: "Moved to Active Affiliated Academies & Dojos.",
        });
        await loadData();
      } else {
        toast.error(data.error || "Failed to verify academy");
      }
    } catch (err) {
      toast.error("Error verifying academy");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply District Scope if District Admin is logged in
  const scopedClubs = useMemo(() => {
    if (!districtScope) return clubs;
    return clubs.filter(
      (c) => c.district?.toLowerCase() === districtScope.toLowerCase()
    );
  }, [clubs, districtScope]);

  // Split Active vs Applications
  const activeClubs = useMemo(() => {
    return scopedClubs.filter(
      (c) => c.status === "Affiliated" || c.status === "Active" || c.status === "Verified"
    );
  }, [scopedClubs]);

  // Split Pending into: Apply for Affiliation vs Already Affiliated Requests
  const pendingApplications = useMemo(() => {
    return scopedClubs.filter(
      (c) => c.status !== "Affiliated" && c.status !== "Active" && c.status !== "Verified"
    );
  }, [scopedClubs]);

  // Helper to determine if a club is already affiliated
  const isAlreadyAffiliatedClub = (c: Player) => {
    if (c.registrationType === "Already Affiliated") return true;
    if (c.registrationType === "Apply for Affiliation") return false;
    return Boolean(c.affiliationDocument);
  };

  const applyApplications = useMemo(() => {
    return pendingApplications.filter((c) => !isAlreadyAffiliatedClub(c));
  }, [pendingApplications]);

  const alreadyAffiliatedRequests = useMemo(() => {
    return pendingApplications.filter((c) => isAlreadyAffiliatedClub(c));
  }, [pendingApplications]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = scopedClubs.length;
    const approved = activeClubs.length;
    const applyAppsCount = applyApplications.length;
    const alreadyAppsCount = alreadyAffiliatedRequests.length;
    const pending = pendingApplications.filter((c) => c.status === "Pending" || !c.status).length;
    const underReview = pendingApplications.filter((c) => c.status === "Under Review").length;
    const totalApplications = pendingApplications.length;
    const withDocCount = scopedClubs.filter((c) => Boolean(c.affiliationDocument)).length;
    const statesCount = new Set(scopedClubs.map((c) => c.state).filter(Boolean)).size;
    const totalAthletes = activeClubs.reduce((acc, c) => acc + (Number(c.memberCount) || 0), 0);
    return {
      total,
      approved,
      applyAppsCount,
      alreadyAppsCount,
      pending,
      underReview,
      totalApplications,
      withDocCount,
      statesCount,
      totalAthletes,
    };
  }, [scopedClubs, activeClubs, pendingApplications, applyApplications, alreadyAffiliatedRequests]);

  // Filtered List for Section 1: Active Clubs
  const filteredActiveClubs = useMemo(() => {
    return activeClubs.filter((c) => {
      if (stateFilter !== "All" && c.state?.toLowerCase() !== stateFilter.toLowerCase())
        return false;
      if (paymentFilter !== "All" && c.paymentStatus !== paymentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchCert =
          (c.affiliationCertificateId || "").toLowerCase().includes(q) ||
          (c.affiliationNumber || "").toLowerCase().includes(q) ||
          ((c as any).certificateNumber || "").toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchDistrict = c.district?.toLowerCase().includes(q);
        const matchCoach =
          c.headCoachName?.toLowerCase().includes(q) || c.coachName?.toLowerCase().includes(q);
        const matchReg = c.registrationNumber?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCert && !matchCity && !matchDistrict && !matchCoach && !matchReg)
          return false;
      }
      return true;
    });
  }, [activeClubs, stateFilter, paymentFilter, searchQuery]);

  // Filtered List for Section 2: Affiliation Applications & Requests (Apply for Affiliation)
  const filteredApplyApplications = useMemo(() => {
    return applyApplications.filter((c) => {
      if (appStateFilter !== "All" && c.state?.toLowerCase() !== appStateFilter.toLowerCase())
        return false;
      if (appStatusFilter !== "All" && (c.status || "Pending") !== appStatusFilter)
        return false;
      if (appDocFilter === "with_doc" && !c.affiliationDocument) return false;
      if (appDocFilter === "no_doc" && c.affiliationDocument) return false;
      if (appSearchQuery.trim()) {
        const q = appSearchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchDistrict = c.district?.toLowerCase().includes(q);
        const matchCoach =
          c.headCoachName?.toLowerCase().includes(q) || c.coachName?.toLowerCase().includes(q);
        const matchPres = c.presidentName?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchReg = c.registrationNumber?.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchId &&
          !matchCity &&
          !matchDistrict &&
          !matchCoach &&
          !matchPres &&
          !matchPhone &&
          !matchEmail &&
          !matchReg
        )
          return false;
      }
      return true;
    });
  }, [applyApplications, appStateFilter, appStatusFilter, appDocFilter, appSearchQuery]);

  // Backward compatibility alias
  const filteredApplications = filteredApplyApplications;

  // Filtered List for Section 3: Affiliated Applicants Requests (Already Affiliated)
  const filteredAlreadyAffiliatedRequests = useMemo(() => {
    return alreadyAffiliatedRequests.filter((c) => {
      if (alreadyStateFilter !== "All" && c.state?.toLowerCase() !== alreadyStateFilter.toLowerCase())
        return false;
      if (alreadyStatusFilter !== "All" && (c.status || "Pending") !== alreadyStatusFilter)
        return false;
      if (alreadySearchQuery.trim()) {
        const q = alreadySearchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchDistrict = c.district?.toLowerCase().includes(q);
        const matchCoach =
          c.headCoachName?.toLowerCase().includes(q) || c.coachName?.toLowerCase().includes(q);
        const matchPres = c.presidentName?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchReg = c.registrationNumber?.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchId &&
          !matchCity &&
          !matchDistrict &&
          !matchCoach &&
          !matchPres &&
          !matchPhone &&
          !matchEmail &&
          !matchReg
        )
          return false;
      }
      return true;
    });
  }, [alreadyAffiliatedRequests, alreadyStateFilter, alreadyStatusFilter, alreadySearchQuery]);

  const handleOpenCreate = () => {
    setEditingClub(null);
    const year = new Date().getFullYear();
    const randomSuffix = String(clubs.length + 1).padStart(4, "0");
    const nextId = "KSM-CL-" + year + "-" + randomSuffix;
    const nextCert = "KAC-AFF-" + year + "-" + String(clubs.length + 1).padStart(3, "0");

    setFormData({
      id: nextId,
      name: "",
      username: "",
      password: "",
      registrationNumber: "",
      logo: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80",
      image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80",
      state: "",
      district: "",
      city: "",
      tempStateAssociation: "",
      tempDistrictAssociation: "",
      address: "",
      registeredAddress: "",
      pincode: "",
      discipline: "Kalawar Martial Arts",
      disciplines: ["Kalawar Martial Arts", "Taekwondo", "Karate", "Kickboxing"],
      headCoachName: "",
      coachIds: [],
      presidentName: "",
      secretaryName: "",
      phone: "",
      alternatePhone: "",
      email: "",
      website: "",
      yearFounded: "2020",
      memberCount: "150",
      timings: "Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM",
      validFrom: year + "-01-01",
      validUntil: year + "-12-31",
      affiliationCertificateId: nextCert,
      registrationType: "Apply for Affiliation",
      affiliationDocument: "",
      paymentStatus: "Paid",
      paymentMethod: "Razorpay",
      status: "Affiliated",
      bio: "",
      facilities: [
        "Federation Approved Combat Tatami Mats",
        "Electronic Scoring PSS Arena",
        "Strength & Conditioning Gym",
        "First-Aid & Sports Medicine Station",
      ],
      achievements: [
        "Officially Affiliated with KALAWAR National Federation",
        "Authorized Belt Grading & Certificate Examination Center",
        "Active Delegation in State & National Championships",
      ],
      photos: [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
      ],
      batches: DEFAULT_BATCHES,
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (club: Player) => {
    setEditingClub(club);

    const existingTempState = typeof club.tempStateAssociation === "string" ? club.tempStateAssociation.trim() : "";
    const existingTempDistrict = typeof club.tempDistrictAssociation === "string" ? club.tempDistrictAssociation.trim() : "";
    const rawState = typeof club.state === "string" ? club.state.trim() : "";
    const rawDistrict = typeof club.district === "string" ? club.district.trim() : (typeof club.city === "string" ? club.city.trim() : "");

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
      id: club.id,
      name: club.name || "",
      username: club.username || "",
      password: club.rawPassword || club.password || "",
      registrationNumber: club.registrationNumber || "",
      logo: club.logo || club.image || "",
      image: club.image || club.logo || "",
      state: initialDynamicState,
      district: initialDynamicDistrict,
      city: initialDynamicDistrict,
      tempStateAssociation: initialTempState,
      tempDistrictAssociation: initialTempDistrict,
      address: club.address || club.registeredAddress || "",
      registeredAddress: club.registeredAddress || club.address || "",
      pincode: club.pincode || "",
      discipline: club.discipline || "Kalawar Martial Arts",
      disciplines:
        club.disciplines && club.disciplines.length > 0
          ? club.disciplines
          : [club.discipline || "Kalawar Martial Arts"],
      headCoachName: club.headCoachName || club.coachName || "",
      coachIds: club.coachIds || [],
      presidentName: club.presidentName || "",
      secretaryName: club.secretaryName || "",
      phone: club.phone || "",
      alternatePhone: club.alternatePhone || "",
      email: club.email || "",
      website: club.website || "",
      yearFounded: String(club.yearFounded || "2020"),
      memberCount: String(club.memberCount || "150"),
      timings:
        club.timings || "Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM",
      validFrom: club.validFrom || "2026-01-01",
      validUntil: club.validUntil || "2026-12-31",
      affiliationCertificateId:
        club.affiliationCertificateId || ("KAC-AFF-2026-" + club.id.slice(-3)),
      registrationType:
        club.registrationType ||
        (club.affiliationDocument ? "Already Affiliated" : "Apply for Affiliation"),
      affiliationDocument: club.affiliationDocument || "",
      paymentStatus: club.paymentStatus || "Paid",
      paymentMethod: club.paymentMethod || "Razorpay",
      status: club.status || "Affiliated",
      bio: club.bio || "",
      facilities:
        club.facilities && club.facilities.length > 0
          ? club.facilities
          : [
              "Federation Approved Combat Tatami Mats",
              "Electronic Scoring PSS Arena",
              "Strength & Conditioning Gym",
              "First-Aid & Sports Medicine Station",
            ],
      achievements:
        club.achievements && club.achievements.length > 0
          ? club.achievements
          : [
              "Officially Affiliated with KALAWAR National Federation",
              "Authorized Belt Grading & Certificate Examination Center",
              "Active Delegation in State & National Championships",
            ],
      photos:
        club.photos && club.photos.length > 0
          ? club.photos
          : [
              "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
            ],
      batches:
        club.batches && club.batches.length > 0 ? club.batches : DEFAULT_BATCHES,
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleToggleDiscipline = (disc: string) => {
    setFormData((prev) => {
      const exists = prev.disciplines.includes(disc);
      const next = exists
        ? prev.disciplines.filter((d) => d !== disc)
        : [...prev.disciplines, disc];
      return {
        ...prev,
        disciplines: next,
        discipline: next[0] || "Kalawar Martial Arts",
      };
    });
  };

  const handleAddCustomDiscipline = () => {
    const trimmed = customDisciplineInput.trim();
    if (!trimmed) return;
    if (!formData.disciplines.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        disciplines: [...prev.disciplines, trimmed],
      }));
    }
    setCustomDisciplineInput("");
  };

  const handleRemoveDiscipline = (disc: string) => {
    setFormData((prev) => {
      const next = prev.disciplines.filter((d) => d !== disc);
      return {
        ...prev,
        disciplines: next,
        discipline: next[0] || "Kalawar Martial Arts",
      };
    });
  };

  const handleBatchChange = (index: number, field: "name" | "time", value: string) => {
    setFormData((prev) => {
      const next = [...prev.batches];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, batches: next };
    });
  };

  const handleAddBatchSlot = () => {
    setFormData((prev) => ({
      ...prev,
      batches: [
        ...prev.batches,
        { name: "Special Batch", time: "07:00 PM - 08:30 PM (All Belts)" },
      ],
    }));
  };

  const handleRemoveBatch = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      batches: prev.batches.filter((_, i) => i !== index),
    }));
  };

  const handleToggleFacility = (fac: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(fac);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== fac)
          : [...prev.facilities, fac],
      };
    });
  };

  const handleAddCustomFacility = () => {
    const trimmed = customFacilityInput.trim();
    if (!trimmed) return;
    if (!formData.facilities.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        facilities: [...prev.facilities, trimmed],
      }));
    }
    setCustomFacilityInput("");
  };

  const handleRemoveFacility = (fac: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f !== fac),
    }));
  };

  const handleAddAchievement = () => {
    const trimmed = newAchievementInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, trimmed],
    }));
    setNewAchievementInput("");
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const handleToggleCoach = (coachId: string) => {
    setFormData((prev) => {
      const exists = prev.coachIds.includes(coachId);
      return {
        ...prev,
        coachIds: exists
          ? prev.coachIds.filter((id) => id !== coachId)
          : [...prev.coachIds, coachId],
      };
    });
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
      fd.append("folder", "wsf_club_documents");

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
      }));
      toast.success("Affiliation proof document uploaded successfully!");
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
      toast.error("Academy name is required");
      return;
    }
    if (!formData.id.trim()) {
      toast.error("Affiliation number is required");
      return;
    }

    try {
      setIsSaving(true);
      const isEdit = Boolean(editingClub);
      const url = isEdit
        ? "/api/clubs/" + encodeURIComponent(editingClub!.id)
        : "/api/clubs";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        memberType: "Club",
        club: formData.name.trim(),
        address: formData.registeredAddress || formData.address,
        registeredAddress: formData.registeredAddress || formData.address,
        memberCount: Number(formData.memberCount) || 150,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save club");
      }

      toast.success(
        isEdit
          ? "Academy profile updated successfully!"
          : "New academy registered & affiliated successfully!"
      );
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save club error:", err);
      toast.error(err.message || "An error occurred while saving academy");
    } finally {
      setIsSaving(false);
    }
  };

  const handle1ClickApprove = async (club: Player) => {
    try {
      const currentYear = new Date().getFullYear();
      const isReissue = Boolean(club.affiliationCertificateId);
      const nextCert =
        club.affiliationCertificateId ||
        `KAC-AFF-${currentYear}-${String(Math.floor(100 + Math.random() * 900))}`;

      const res = await fetch("/api/clubs/" + encodeURIComponent(club.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Affiliated",
          paymentStatus: "Paid",
          affiliationCertificateId: nextCert,
          validFrom: club.validFrom || `${currentYear}-01-01`,
          validUntil: club.validUntil || `${currentYear}-12-31`,
          sendCertificateEmail: true,
          isReissue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `APPROVED! ${club.name} is now Affiliated with Certificate ID: ${nextCert}`,
          {
            description: `Official Affiliation Certificate email dispatched to ${club.email || "registered academy contact"}.`,
          }
        );
        await loadData();
      } else {
        toast.error(data.error || "Failed to approve application");
      }
    } catch (err) {
      toast.error("Error approving club application");
    }
  };

  const handleMarkUnderReview = async (club: Player) => {
    try {
      const res = await fetch("/api/clubs/" + encodeURIComponent(club.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Under Review" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info(`${club.name} has been marked as 'Under Review'`);
        await loadData();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const targetId = deleteCandidate.id;
    const cleanLowerId = targetId.toLowerCase();

    // Optimistically remove from UI state immediately
    setClubs((prev) => prev.filter((c) => c.id.toLowerCase() !== cleanLowerId));
    setDeleteCandidate(null);

    try {
      setIsDeleting(true);
      const res = await fetch(
        "/api/clubs/" + encodeURIComponent(targetId),
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Academy removed from affiliation registry");
        await loadData();
      } else {
        toast.error(data.error || "Failed to delete academy");
        await loadData();
      }
    } catch (err) {
      toast.error("Error deleting academy");
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      activeSectionTab === "active"
        ? filteredActiveClubs
        : activeSectionTab === "applications"
        ? filteredApplyApplications
        : filteredAlreadyAffiliatedRequests;

    if (listToExport.length === 0) {
      toast.error("No club/academy records to export in the selected view.");
      return;
    }

    const headers = [
      "Academy ID",
      "Academy / Club Name",
      "Registration Type",
      "Status",
      "President Name",
      "Secretary Name",
      "Head Coach",
      "Primary Discipline",
      "Affiliation Certificate ID",
      "Affiliation Level",
      "State",
      "District / City",
      "Registered Address",
      "PIN Code",
      "Phone",
      "Email",
      "Founded Year",
      "Active Athletes",
      "Payment Status",
      "Valid From",
      "Valid Until",
    ];

    const rows = listToExport.map((c) => [
      `"${c.id || ""}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.registrationType || "").replace(/"/g, '""')}"`,
      `"${c.status || "Affiliated"}"`,
      `"${(c.presidentName || c.name || "").replace(/"/g, '""')}"`,
      `"${(c.secretaryName || "").replace(/"/g, '""')}"`,
      `"${(c.headCoachName || "").replace(/"/g, '""')}"`,
      `"${(c.discipline || "").replace(/"/g, '""')}"`,
      `"${(c.affiliationCertificateId || c.affiliationNumber || (c as any).certificateNumber || "").replace(/"/g, '""')}"`,
      `"${(c.levelOfAffiliation || c.clubCategory || "").replace(/"/g, '""')}"`,
      `"${(c.state || "").replace(/"/g, '""')}"`,
      `"${(c.district || c.city || "").replace(/"/g, '""')}"`,
      `"${(c.address || c.registeredAddress || "").replace(/"/g, '""')}"`,
      `"${(c.pincode || "").replace(/"/g, '""')}"`,
      `"${(c.phone || c.alternatePhone || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${c.yearFounded ?? ""}"`,
      `"${c.memberCount ?? ""}"`,
      `"${c.paymentStatus || "Paid"}"`,
      `"${(c.validFrom || "").replace(/"/g, '""')}"`,
      `"${(c.validUntil || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const tabSuffix =
      activeSectionTab === "active"
        ? "Active_Clubs"
        : activeSectionTab === "applications"
        ? "Club_Applications"
        : "Already_Affiliated_Requests";
    link.setAttribute("download", `KALAWAR_Clubs_${tabSuffix}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export ready", { description: `${listToExport.length} club/academy records exported to CSV` });
  };

  const openDocumentPreview = (url: string, title: string) => {
    setPreviewDocUrl(url);
    setPreviewDocTitle(title);
  };

  const handleDirectDownloadDocument = async (url: string, filename?: string) => {
    const toastId = toast.loading("Downloading document...");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch file content");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const cleanName = filename || url.split("/").pop() || "affiliation-document";
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Document downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Direct download error:", err);
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;
      fallbackLink.target = "_blank";
      fallbackLink.download = filename || "affiliation-document";
      fallbackLink.click();
      toast.dismiss(toastId);
    }
  };

  const handlePrintDocument = (url: string, title?: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print documents.");
      return;
    }
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith("data:image/");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || "Affiliation Document Proof"}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; background: #fff; color: #000; text-align: center; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h2 { margin: 0 0 5px 0; font-size: 18px; }
            .header p { margin: 0; font-size: 12px; color: #666; }
            img { max-width: 100%; max-height: 85vh; object-fit: contain; }
            iframe { width: 100%; height: 85vh; border: none; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${title || "Affiliation Document Proof"}</h2>
            <p>Kalawar Martial Arts & Sports Federation • Official Affiliation Record</p>
          </div>
          ${isImage ? `<img src="${url}" alt="Affiliation Document" onload="window.print();" />` : `<iframe src="${url}" onload="window.print();"></iframe>`}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleQuickDownloadCert = async (club: Player) => {
    try {
      await downloadClubAffiliationCertificatePDF(club);
    } catch (err) {
      console.error("Quick download cert error:", err);
      toast.error("Failed to download certificate PDF");
    }
  };

  const handleQuickPrintCert = (club: Player) => {
    try {
      printClubAffiliationCertificate(club);
    } catch (err) {
      console.error("Quick print cert error:", err);
      toast.error("Failed to print certificate");
    }
  };

  const handleDownloadRegistrationSlip = async (club: Player) => {
    try {
      await downloadRegistrationReceiptPDF(club);
    } catch (err) {
      console.error("Download registration slip error:", err);
      toast.error("Failed to download registration slip");
    }
  };

  const handlePrintRegistrationSlip = (club: Player) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print registration receipt.");
      return;
    }
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Registration Receipt - ${club.id}</title>
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
              <div class="subtitle">Official Club Affiliation & Member Registration Receipt Slip</div>
              <div class="badge">RECEIPT REF: REC-REG-${club.id}</div>
            </div>
            <div class="cred-box">
              <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">Verified Membership ID</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: monospace;">${club.id}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary Email: ${club.email || "Registered Member"}</div>
            </div>
            <table class="grid">
              <tr><td class="label">Club / Academy Name</td><td class="val">${club.name.toUpperCase()}</td></tr>
              <tr><td class="label">Classification / Role</td><td class="val">${club.memberType || "Club"}</td></tr>
              ${club.discipline ? `<tr><td class="label">Primary Discipline</td><td class="val">${club.discipline}</td></tr>` : ""}
              <tr><td class="label">State Association Unit</td><td class="val">${club.state}, India</td></tr>
              ${club.headCoachName ? `<tr><td class="label">Chief Coach / Sensei</td><td class="val">${club.headCoachName}</td></tr>` : ""}
              ${club.affiliationCertificateId ? `<tr><td class="label">Affiliation Certificate No.</td><td class="val" style="font-family: monospace; color: #b45309;">${club.affiliationCertificateId}</td></tr>` : ""}
              <tr><td class="label">Registration Date</td><td class="val">${formatToDDMMYYYY(club.registeredOn, "Recorded")}</td></tr>
              <tr><td class="label">Accreditation Status</td><td class="val" style="color: #15803d;">${club.status || "Affiliated"} (Recorded in National Ledger)</td></tr>
            </table>
            <div class="footer">
              <p>This is an authentic digital registration receipt issued by KALAWAR Sports & Martial Arts Federation of India.</p>
              <p>Official Member Portal: https://kalawarmartialarts.org/login | Secretariat: contact@kalawarfederation.org</p>
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

  const handleOpenIssueCert = (club: Player) => {
    setCertTargetClub(club);
    const currentYear = new Date().getFullYear();
    const existingCertId =
      club.affiliationCertificateId ||
      `KAC-AFF-${currentYear}-${club.id.replace(/[^0-9]/g, "").slice(-3) || Math.floor(100 + Math.random() * 900)}`;

    const resolved = resolveAffiliationLevels(club);
    const activeLevels: string[] = [];
    if (resolved.isState) activeLevels.push("State");
    if (resolved.isDistrict) activeLevels.push("District");
    if (resolved.isClub) activeLevels.push("Academy/Club");
    if (resolved.isDojo) activeLevels.push("Dojo");

    const finalLevels = activeLevels.length > 0 ? activeLevels : ["Academy/Club"];

    setCertFormData({
      affiliationCertificateId: existingCertId,
      levelOfAffiliation: finalLevels.join(", "),
      levelsOfAffiliation: finalLevels,
      state: club.state || "Maharashtra",
      district: club.district || club.city || "Pune",
      academyClubDojo: club.name || "",
      headCoachInstructor: club.headCoachName || club.coachName || "Authorized Head Coach",
      contactNo: club.phone || club.alternatePhone || "+91 98220 12345",
      validFrom: club.validFrom || `${currentYear}-01-01`,
      validUntil: club.validUntil || `${currentYear}-12-31`,
    });
    setIsIssueCertModalOpen(true);
  };

  const handleConfirmIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTargetClub) return;
    if (!isClubIdCardIssued(certTargetClub)) {
      toast.warning("Generate ID Card for the USER First !", {
        description: `Club ${certTargetClub.name} (${certTargetClub.id}) must have an active ID card issued before issuing an official certificate.`,
      });
      return;
    }
    if (!certFormData.affiliationCertificateId.trim()) {
      toast.error("Certificate number is required");
      return;
    }
    if (certFormData.levelsOfAffiliation.length === 0) {
      toast.error("Please select at least one Level of Affiliation");
      return;
    }

    const isReissue = Boolean(certTargetClub.affiliationCertificateId);

    try {
      setIsIssuingCert(true);
      const res = await fetch(`/api/clubs/${encodeURIComponent(certTargetClub.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliationCertificateId: certFormData.affiliationCertificateId.trim(),
          levelOfAffiliation: certFormData.levelsOfAffiliation.join(", "),
          levelsOfAffiliation: certFormData.levelsOfAffiliation,
          clubCategory: certFormData.levelsOfAffiliation.join(", "),
          level: certFormData.levelsOfAffiliation.join(", "),
          validFrom: certFormData.validFrom,
          validUntil: certFormData.validUntil,
          state: certFormData.state,
          district: certFormData.district,
          headCoachName: certFormData.headCoachInstructor,
          phone: certFormData.contactNo,
          status: "Affiliated",
          paymentStatus: "Paid",
          sendCertificateEmail: true,
          isReissue,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to issue certificate");
      }

      const emailDestination = certTargetClub.email;
      toast.success(
        `Affiliation Certificate ${isReissue ? "Re-Issued" : "Issued"} Successfully!`,
        {
          description: `Certificate ${certFormData.affiliationCertificateId} assigned to ${certTargetClub.name}${
            emailDestination ? ` & dispatched to ${emailDestination}` : ""
          }`,
        }
      );

      setIsIssueCertModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Issue certificate error:", err);
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIsIssuingCert(false);
    }
  };

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
              Module 12 • Official Dojang &amp; Club Affiliation Registry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-amber-400" />
            <span>Club &amp; Academy Affiliation Management</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Manage active accredited dojos, review incoming academy registration requests, verify uploaded society/trust affiliation documents, and issue official digital affiliation certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-stone-800 hover:border-gold-500/50 bg-stone-900 text-stone-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Academies to CSV"
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
            <span>Register New Academy</span>
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
            <Building2 className="w-4 h-4" />
            <span>1. Active Affiliated Academies &amp; Dojos</span>
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
            <span>2. Affiliation Applications &amp; Requests</span>
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
            onClick={() => setActiveSectionTab("affiliated_requests")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer relative",
              activeSectionTab === "affiliated_requests"
                ? "bg-stone-900 text-amber-400 border border-gold-500/40 shadow-md"
                : "text-stone-400 hover:text-white hover:bg-stone-900/40"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Affiliated Applicants Requests</span>
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
          <span>{stats.alreadyAppsCount} Already Affiliated</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ACTIVE AFFILIATED ACADEMIES & DOJOS                            */}
      {/* ========================================================================= */}
      {activeSectionTab === "active" && (
        <div className="space-y-6">
          {/* Active KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">Active Dojos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
              <p className="text-[10px] text-stone-400">Federation approved &amp; listed</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Total Athletes</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats.totalAthletes.toLocaleString()}</p>
              <p className="text-[10px] text-stone-400">Enrolled across all clubs</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">States &amp; UTs</span>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-400">{stats.statesCount}</p>
              <p className="text-[10px] text-stone-400">Nationwide presence</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Coaches Roster</span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-400">{availableCoaches.length}</p>
              <p className="text-[10px] text-stone-400">Certified federation masters</p>
            </div>
          </div>

          {/* Active Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search active academies by name, ID, cert no. (e.g. KAC-AFF-2026-524), city, state, or chief instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* State Filter */}
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All States ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending Payment</option>
              </select>
            </div>
          </div>

          {/* Active Clubs Grid */}
          {loading ? (
            <div className="py-20 text-center rounded-2xl bg-stone-900/50 border border-stone-800">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-stone-400">Loading active affiliated dojos...</p>
            </div>
          ) : filteredActiveClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActiveClubs.map((club) => {
                const logo =
                  club.logo ||
                  club.image ||
                  "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80";
                const headCoach = club.headCoachName || club.coachName || "Head Coach";

                return (
                  <div
                    key={club.id}
                    className="rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-gold-500/40 transition-all flex flex-col justify-between overflow-hidden shadow-lg group"
                  >
                    <div className="p-5 space-y-3.5">
                      {/* Top Bar: Logo + Affiliation Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-950 border border-stone-800 shrink-0">
                          <img
                            src={logo}
                            alt={club.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                            {club.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Affiliated</span>
                          </span>
                        </div>
                      </div>

                      {/* Club Name & Location */}
                      <div>
                        <h3 className="text-sm font-extrabold text-white line-clamp-1">{club.name}</h3>
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {club.city ? `${club.city}, ` : ""}
                            {club.state}
                          </span>
                        </p>
                      </div>

                      {/* Society / Trust Reg No (if exists) */}
                      {club.registrationNumber && (
                        <div className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800/60 text-[10px] text-stone-400 flex items-center justify-between">
                          <span>Society / Trust Reg:</span>
                          <span className="font-mono text-stone-200 font-bold">
                            {club.registrationNumber}
                          </span>
                        </div>
                      )}

                      {/* Head Instructor Box */}
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs space-y-0.5">
                        <p className="text-[10px] text-stone-400 font-bold uppercase">Chief Instructor:</p>
                        <p className="text-stone-200 font-semibold truncate flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{headCoach}</span>
                        </p>
                      </div>

                      {/* Disciplines tags */}
                      {club.disciplines && club.disciplines.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {club.disciplines.slice(0, 3).map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[10px] text-stone-300 font-medium"
                            >
                              {d}
                            </span>
                          ))}
                          {club.disciplines.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[10px] text-stone-500 font-medium">
                              +{club.disciplines.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Certificate Accreditation Badge / ID */}
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/20 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Affiliation Certificate</span>
                          </span>
                          <span className="font-mono text-[10px] text-stone-300 font-bold bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                            {club.affiliationCertificateId || "Not Issued"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span>Validity:</span>
                          <span className="text-emerald-400 font-medium">
                            {club.validFrom || "2026-01-01"} ~ {club.validUntil || "2026-12-31"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom stats row */}
                      <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-800/60">
                        <span>
                          Athletes: <strong className="text-white">{club.memberCount || 150}</strong>
                        </span>
                        <span className="text-[11px] font-mono text-amber-400">
                          {club.validUntil ? "Session 2026-27" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-3 bg-stone-950/90 border-t border-stone-800/80 space-y-2">
                      {/* Certificate Primary Quick Actions */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickDownloadCert(club)}
                          className="px-2 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Download Official PDF Certificate"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPrintCert(club)}
                          className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Print Official Certificate"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Print</span>
                        </button>
                        <a
                          href={`/clubs/${encodeURIComponent(club.id)}/certificate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Preview Live Certificate in New Tab"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Preview</span>
                        </a>
                      </div>

                      {/* Secondary Management Actions */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-stone-900">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCertWithIdCheck(club)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Issue or Modify Certificate Number / Validity"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{club.affiliationCertificateId ? "Re-Issue Cert" : "Issue Cert"}</span>
                          </button>
                          <Link
                            href={"/clubs/" + encodeURIComponent(club.id)}
                            target="_blank"
                            className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 text-[10px] font-medium transition-colors"
                            title="View Public Profile"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDownloadRegistrationSlip(club)}
                            className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download Official Registration Receipt Slip PDF"
                          >
                            <Receipt className="w-3 h-3 text-amber-400" />
                            <span>Slip PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintRegistrationSlip(club)}
                            className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
                            title="Print Official Registration Receipt Slip"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(club)}
                            className="p-1 rounded-lg bg-stone-900 hover:bg-gold-500/20 text-stone-400 hover:text-amber-300 border border-stone-800 transition-colors cursor-pointer"
                            title="Edit Academy Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(club)}
                            className="p-1 rounded-lg bg-stone-900 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors cursor-pointer"
                            title="Delete Academy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-stone-900/50 border border-stone-800 p-8 space-y-3">
              <Building2 className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-sm text-stone-300 font-semibold">
                No active affiliated dojos found matching filters
              </p>
              <button
                onClick={handleOpenCreate}
                className="bg-gold-gradient text-background px-4 py-2 rounded-xl text-xs font-bold shadow-gold cursor-pointer"
              >
                Register New Academy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: AFFILIATION APPLICATIONS & REGISTRATION REQUESTS (APPLY FOR AFFILIATION) */}
      {/* ========================================================================= */}
      {activeSectionTab === "applications" && (
        <div className="space-y-6">
          {/* Applications KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-semibold">New Applications</span>
                <Inbox className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{stats.applyAppsCount}</p>
              <p className="text-[10px] text-stone-400">Apply for Affiliation queue</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Pending Action</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {applyApplications.filter((c) => c.status === "Pending" || !c.status).length}
              </p>
              <p className="text-[10px] text-stone-400">Awaiting federation review</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Under Review</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-400">
                {applyApplications.filter((c) => c.status === "Under Review").length}
              </p>
              <p className="text-[10px] text-stone-400">Being audited by committee</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">With Doc Proof</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {applyApplications.filter((c) => Boolean(c.affiliationDocument)).length}
              </p>
              <p className="text-[10px] text-stone-400">Society / Trust proof attached</p>
            </div>
          </div>

          {/* Applications Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search requests by academy, reg number, phone, email, city, or chief instructor..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* State Filter */}
              <select
                value={appStateFilter}
                onChange={(e) => setAppStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All States ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Suspended">Suspended</option>
              </select>

              {/* Document Proof Filter */}
              <select
                value={appDocFilter}
                onChange={(e) => setAppDocFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All Documents</option>
                <option value="with_doc">With Document Proof</option>
                <option value="no_doc">No Document Proof</option>
              </select>
            </div>
          </div>

          {/* Applications List / Cards */}
          {loading ? (
            <div className="py-20 text-center rounded-2xl bg-stone-900/50 border border-stone-800">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-stone-400">Loading affiliation applications...</p>
            </div>
          ) : filteredApplyApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplyApplications.map((app) => {
                const isUnderReview = app.status === "Under Review";
                const logo =
                  app.logo ||
                  app.image ||
                  "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80";

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-gold-500/40 transition-all shadow-xl space-y-4"
                  >
                    {/* Header: Name, IDs, and Badges */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shrink-0">
                          <img src={logo} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white truncate">{app.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                              {app.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Apply for Affiliation
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {app.city ? `${app.city}, ` : ""}
                              {app.state}
                            </span>
                            {app.yearFounded && (
                              <>
                                <span className="text-stone-700">•</span>
                                <span>Est. {app.yearFounded}</span>
                              </>
                            )}
                            {app.memberCount && (
                              <>
                                <span className="text-stone-700">•</span>
                                <span>{app.memberCount} Athletes</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                            isUnderReview
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          )}
                        >
                          {app.status || "Pending"}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                            app.paymentStatus === "Paid"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-stone-800 text-stone-400 border-stone-700"
                          )}
                        >
                          {app.paymentStatus === "Paid" ? "Paid" : "Payment Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Content Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Column 1: Institutional & Legal Identification */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Legal &amp; Institutional Registry</span>
                        </p>
                        <div className="space-y-1.5 text-stone-300">
                          <div>
                            <span className="text-stone-500 block text-[10px]">Society / Trust Reg No:</span>
                            <span className="font-mono font-bold text-white">
                              {app.registrationNumber || "Not Provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">Head Coach / Chief Instructor:</span>
                            <span className="font-semibold text-stone-200">
                              {app.headCoachName || app.coachName || "Not specified"}
                            </span>
                          </div>
                          {(app.presidentName || app.secretaryName) && (
                            <div className="pt-1 text-[11px] text-stone-400">
                              {app.presidentName && <div>Pres: {app.presidentName}</div>}
                              {app.secretaryName && <div>Sec: {app.secretaryName}</div>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Contact & Regional Unit */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Contact &amp; Regional Unit</span>
                        </p>
                        <div className="space-y-1 text-stone-300 text-[11px]">
                          <p className="text-stone-400 line-clamp-2">
                            {app.registeredAddress || app.address || `${app.city || ""}, ${app.state}`}
                          </p>
                          {app.phone && (
                            <a
                              href={`tel:${app.phone}`}
                              className="text-stone-200 hover:text-amber-400 flex items-center gap-1 font-mono pt-1"
                            >
                              <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{app.phone}</span>
                            </a>
                          )}
                          {app.email && (
                            <a
                              href={`mailto:${app.email}`}
                              className="text-stone-300 hover:text-amber-400 flex items-center gap-1 truncate"
                            >
                              <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{app.email}</span>
                            </a>
                          )}
                          {app.website && (
                            <a
                              href={app.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{app.website}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Uploaded Document Proof & Disciplines */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2.5 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Affiliation Proof Document</span>
                          </p>

                          {app.affiliationDocument ? (
                            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-[11px] font-mono text-stone-200 truncate">
                                  {app.affiliationDocument.split("/").pop() || "Affiliation Document"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDocumentPreview(
                                      app.affiliationDocument!,
                                      `${app.name} - Affiliation Proof`
                                    )
                                  }
                                  className="flex-1 px-2 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                                <a
                                  href={app.affiliationDocument}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDirectDownloadDocument(app.affiliationDocument!, `${app.name}-affiliation-proof`)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                                  title="Download Original File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintDocument(app.affiliationDocument!, `${app.name} - Affiliation Proof`)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                                  title="Print Document"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-stone-900/50 border border-dashed border-stone-800 text-center text-[11px] text-stone-500 italic">
                              No document proof uploaded with this request.
                            </div>
                          )}
                        </div>

                        {app.disciplines && app.disciplines.length > 0 && (
                          <div className="pt-2 border-t border-stone-800/80">
                            <span className="text-[10px] text-stone-500 block mb-1">Disciplines:</span>
                            <div className="flex flex-wrap gap-1">
                              {app.disciplines.map((d) => (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded bg-stone-900 text-[10px] text-stone-300 border border-stone-800"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Approve & Issue Certificate */}
                        <button
                          type="button"
                          onClick={() => handleOpenCertWithIdCheck(app)}
                          className="bg-gold-gradient text-background px-4 py-2 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-4 h-4 stroke-[2.5]" />
                          <span>Approve &amp; Issue Certificate</span>
                        </button>

                        {/* Mark Under Review */}
                        {!isUnderReview && (
                          <button
                            type="button"
                            onClick={() => handleMarkUnderReview(app)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark Under Review</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Inspect & Edit Application */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(app)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect Full</span>
                        </button>

                        {/* Reject / Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(app)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Reject / Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-stone-900/50 border border-stone-800 p-8 space-y-3">
              <Inbox className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-sm text-stone-300 font-semibold">
                No pending affiliation applications found
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When new martial arts clubs or established academies apply through the public registration portal with "Apply for Affiliation", their requests will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: AFFILIATED APPLICANTS REQUESTS (ALREADY AFFILIATED)              */}
      {/* ========================================================================= */}
      {activeSectionTab === "affiliated_requests" && (
        <div className="space-y-6">
          {/* Section 3 KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">Affiliated Applicants</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{stats.alreadyAppsCount}</p>
              <p className="text-[10px] text-stone-400">Already affiliated submissions</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Pending Approval</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {alreadyAffiliatedRequests.filter((c) => c.status === "Pending" || !c.status).length}
              </p>
              <p className="text-[10px] text-stone-400">Awaiting verification</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Under Audit</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-400">
                {alreadyAffiliatedRequests.filter((c) => c.status === "Under Review").length}
              </p>
              <p className="text-[10px] text-stone-400">Reviewing proof document</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Verified Documents</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {alreadyAffiliatedRequests.filter((c) => Boolean(c.affiliationDocument)).length}
              </p>
              <p className="text-[10px] text-stone-400">Mandatory proof uploaded</p>
            </div>
          </div>

          {/* Section 3 Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search affiliated applicants by academy, reg number, phone, email, city, or chief instructor..."
                value={alreadySearchQuery}
                onChange={(e) => setAlreadySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* State Filter */}
              <select
                value={alreadyStateFilter}
                onChange={(e) => setAlreadyStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All States ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={alreadyStatusFilter}
                onChange={(e) => setAlreadyStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Section 3 Request Cards */}
          {loading ? (
            <div className="py-20 text-center rounded-2xl bg-stone-900/50 border border-stone-800">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-stone-400">Loading affiliated applicants requests...</p>
            </div>
          ) : filteredAlreadyAffiliatedRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredAlreadyAffiliatedRequests.map((app) => {
                const isUnderReview = app.status === "Under Review";
                const logo =
                  app.logo ||
                  app.image ||
                  "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=80";

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-3xl bg-stone-900/90 border border-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-xl space-y-4"
                  >
                    {/* Header: Name, IDs, and Badges */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shrink-0">
                          <img src={logo} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white truncate">{app.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                              {app.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Already Affiliated Applicant</span>
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {app.city ? `${app.city}, ` : ""}
                              {app.state}
                            </span>
                            {app.yearFounded && (
                              <>
                                <span className="text-stone-700">•</span>
                                <span>Est. {app.yearFounded}</span>
                              </>
                            )}
                            {app.memberCount && (
                              <>
                                <span className="text-stone-700">•</span>
                                <span>{app.memberCount} Athletes</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                            isUnderReview
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {app.status || "Pending"}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                            app.paymentStatus === "Paid"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-stone-800 text-stone-400 border-stone-700"
                          )}
                        >
                          {app.paymentStatus === "Paid" ? "Paid" : "Payment Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Content Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Column 1: Institutional & Legal Identification */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Legal &amp; Institutional Registry</span>
                        </p>
                        <div className="space-y-1.5 text-stone-300">
                          <div>
                            <span className="text-stone-500 block text-[10px]">Society / Trust Reg No:</span>
                            <span className="font-mono font-bold text-white">
                              {app.registrationNumber || "Not Provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">Head Coach / Chief Instructor:</span>
                            <span className="font-semibold text-stone-200">
                              {app.headCoachName || app.coachName || "Not specified"}
                            </span>
                          </div>
                          {(app.presidentName || app.secretaryName) && (
                            <div className="pt-1 text-[11px] text-stone-400">
                              {app.presidentName && <div>Pres: {app.presidentName}</div>}
                              {app.secretaryName && <div>Sec: {app.secretaryName}</div>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Contact & Regional Unit */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Contact &amp; Regional Unit</span>
                        </p>
                        <div className="space-y-1 text-stone-300 text-[11px]">
                          <p className="text-stone-400 line-clamp-2">
                            {app.registeredAddress || app.address || `${app.city || ""}, ${app.state}`}
                          </p>
                          {app.phone && (
                            <a
                              href={`tel:${app.phone}`}
                              className="text-stone-200 hover:text-amber-400 flex items-center gap-1 font-mono pt-1"
                            >
                              <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{app.phone}</span>
                            </a>
                          )}
                          {app.email && (
                            <a
                              href={`mailto:${app.email}`}
                              className="text-stone-300 hover:text-amber-400 flex items-center gap-1 truncate"
                            >
                              <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{app.email}</span>
                            </a>
                          )}
                          {app.website && (
                            <a
                              href={app.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{app.website}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Prominent Affiliation Proof Document Card */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-emerald-500/30 space-y-2.5 flex flex-col justify-between shadow-inner">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Uploaded Affiliation Certificate / Document</span>
                          </p>

                          {app.affiliationDocument ? (
                            <div className="p-3 rounded-xl bg-stone-900 border border-emerald-500/30 space-y-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-mono text-white font-medium truncate">
                                  {app.affiliationDocument.split("/").pop() || "Official Affiliation Document"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDocumentPreview(
                                      app.affiliationDocument!,
                                      `${app.name} - Official Affiliation Document Proof`
                                    )
                                  }
                                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview Proof</span>
                                </button>
                                <a
                                  href={app.affiliationDocument}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition-colors"
                                  title="Open document in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDirectDownloadDocument(app.affiliationDocument!, `${app.name}-affiliation-proof`)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                                  title="Download Original Document"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintDocument(app.affiliationDocument!, `${app.name} - Affiliation Document Proof`)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                                  title="Print Document"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-stone-900/50 border border-dashed border-red-500/30 text-center text-[11px] text-red-400 italic">
                              No affiliation certificate uploaded.
                            </div>
                          )}
                        </div>

                        {app.disciplines && app.disciplines.length > 0 && (
                          <div className="pt-2 border-t border-stone-800/80">
                            <span className="text-[10px] text-stone-500 block mb-1">Disciplines:</span>
                            <div className="flex flex-wrap gap-1">
                              {app.disciplines.map((d) => (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded bg-stone-900 text-[10px] text-stone-300 border border-stone-800"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Verify & Accredit */}
                        <button
                          type="button"
                          onClick={() => handleVerifyAndAccredit(app)}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer"
                          title="Verify & Accredit without generating a new certificate"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Verify &amp; Accredit</span>
                        </button>

                        {/* Issue Certificate */}
                        <button
                          type="button"
                          onClick={() => handleOpenCertWithIdCheck(app)}
                          className="bg-gold-gradient text-background px-4 py-2 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer"
                          title="Issue Official Affiliation Certificate"
                        >
                          <Award className="w-4 h-4 stroke-[2.5]" />
                          <span>Issue Certificate</span>
                        </button>

                        {/* Mark Under Review */}
                        {!isUnderReview && (
                          <button
                            type="button"
                            onClick={() => handleMarkUnderReview(app)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark Under Review</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Inspect & Edit Application */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(app)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect Full</span>
                        </button>

                        {/* Reject / Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(app)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Reject / Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-stone-900/50 border border-stone-800 p-8 space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm text-stone-300 font-semibold">
                No already affiliated applicant requests found
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When existing affiliated clubs submit verification with their official affiliation certificate, their requests will appear here for verification and certificate re-issuance.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900/90 border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {previewDocTitle || "Affiliation Proof Document"}
                  </h3>
                  <p className="text-[10px] text-stone-400">Official Club Registration Proof</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintDocument(previewDocUrl, previewDocTitle || "Affiliation Proof Document")}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-stone-700 cursor-pointer"
                  title="Print Document"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectDownloadDocument(previewDocUrl, previewDocTitle || "affiliation-proof-document")}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 hover:bg-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Direct Download Document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => openFileInFullSize(previewDocUrl, previewDocTitle || "Affiliation Proof Document")}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Open in full size"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-stone-900/40 flex items-center justify-center min-h-[400px]">
              {previewDocUrl.toLowerCase().includes(".pdf") ||
              previewDocUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewDocUrl}
                  className="w-full h-[70vh] rounded-2xl border border-stone-800 bg-white"
                  title="PDF Document Preview"
                />
              ) : (
                <div className="max-h-[70vh] max-w-full overflow-auto rounded-2xl border border-stone-800 bg-stone-950 p-2 flex items-center justify-center">
                  <img
                    src={previewDocUrl}
                    alt="Affiliation Document Preview"
                    className="max-h-[66vh] max-w-full object-contain rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE ADD / EDIT MODAL                                         */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900/90 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingClub ? "Edit Affiliated Academy & Dojo" : "Register New Affiliated Academy"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* SECTION A: Visual Branding (Academy Logo) */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>1. Visual Branding (Academy Logo)</span>
                </h4>

                <div>
                  <ImageUploadField
                    label="Academy Logo (Square Icon / Emblem)"
                    value={formData.logo}
                    onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                    folder="clubs/logos"
                    helperText="Click to upload academy logo (Max 2MB)."
                  />
                </div>
              </div>

              {/* SECTION B: Identification & Accreditation */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. Identification &amp; Official Affiliation</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Club / Academy Association Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kalawar Tiger Combat Academy"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Affiliation Number (ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="KSM-CL-2026-0001"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Discipline *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.discipline || "Kalawar Martial Arts"}
                      onChange={(e) =>
                        setFormData({ ...formData, discipline: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Society / Trust Registration No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MAH/1482/2018/PUNE or Trust Reg #7890"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationNumber: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Certificate Reference ID
                    </label>
                    <input
                      type="text"
                      placeholder="KAC-AFF-2026-001"
                      value={formData.affiliationCertificateId}
                      onChange={(e) =>
                        setFormData({ ...formData, affiliationCertificateId: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                {/* Upload Affiliation Proof Document */}
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 space-y-2">
                  <label className="block text-xs font-bold text-stone-300">
                    Uploaded Society / Trust Registration Proof Document:
                  </label>
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={handleModalDocUpload}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {formData.affiliationDocument ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono text-stone-200 truncate">
                          {formData.affiliationDocument.split("/").pop() || "Document Attached"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openDocumentPreview(
                              formData.affiliationDocument,
                              `${formData.name || "Club"} - Affiliation Document`
                            )
                          }
                          className="px-2 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-[11px] font-bold border border-amber-400/30 cursor-pointer"
                        >
                          Preview
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic">No proof document uploaded yet.</p>
                    )}

                    <button
                      type="button"
                      disabled={isUploadingDoc}
                      onClick={() => docInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUploadingDoc ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {formData.affiliationDocument ? "Replace Document" : "Upload Document (<2MB)"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Valid From Date
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Valid Until Date
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Affiliation Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    >
                      <option value="Affiliated">Affiliated (Approved)</option>
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    >
                      <option value="Paid">Paid (Verified)</option>
                      <option value="Pending">Pending Payment</option>
                      <option value="Cash Verification Required">
                        Cash Verification Required
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Payment Mode
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    >
                      <option value="Razorpay">Razorpay Online</option>
                      <option value="Cash">Cash / Offline</option>
                      <option value="Bank Transfer">NEFT / Bank Transfer</option>
                      <option value="UPI">UPI Direct</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION C: Location & Dojo Address */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>3. Location &amp; Registered Dojo Address</span>
                </h4>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                      ℹ️ This club originally registered with legacy state/district data. Select the active dynamic State &amp; District Associations below to officially link their profile.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      State Association *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        setFormData({
                          ...formData,
                          state: nextState,
                          district: "",
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
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

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      District Association *
                    </label>
                    {(() => {
                      const dynamicDistOpts = getApprovedDistrictAssociationDropdownOptions(rawDistrictAssocs, formData.state);
                      const staticDistOpts = getDistrictsByState(formData.state || "Maharashtra");
                      const distOptions = dynamicDistOpts.length > 0 ? dynamicDistOpts : (staticDistOpts || []);
                      const currentVal = formData.district || formData.city || "";

                      return (
                        <select
                          value={currentVal}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value, city: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
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

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      City / Area / Town
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shivajinagar / Navrangpura"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Registered Facility Address
                    </label>
                    <input
                      type="text"
                      placeholder="Plot / Complex number, Street, Landmark"
                      value={formData.registeredAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registeredAddress: e.target.value,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 411005"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: Instructors & Coach Roster Linking */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>4. Certified Coaches &amp; Staff Roster</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Head Coach *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grandmaster Rajesh Sharma (8th Dan)"
                      value={formData.headCoachName}
                      onChange={(e) => setFormData({ ...formData, headCoachName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      President Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Vikram Deshmukh"
                      value={formData.presidentName}
                      onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      General Secretary
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Kulkarni"
                      value={formData.secretaryName}
                      onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                {/* Link registered coaches */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Link Registered Coaches from Federation Database:
                  </label>
                  <select
                    value={formData.coachIds[0] || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedCoach = availableCoaches.find((c) => c.id === selectedId);
                      setFormData({
                        ...formData,
                        coachIds: selectedId ? [selectedId] : [],
                        headCoachName: formData.headCoachName || selectedCoach?.name || "",
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                  >
                    <option value="">Select Coach from Federation Database</option>
                    {availableCoaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name} ({coach.id}) {coach.qualification ? `— ${coach.qualification}` : coach.discipline ? `— ${coach.discipline}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION E: Batch Timings */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>5. Batch Timings</span>
                </h4>

                {/* General Timings */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Official Training Hours / Timings
                  </label>
                  <input
                    type="text"
                    placeholder="Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM"
                    value={formData.timings}
                    onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                {/* Specific Batch Schedules */}
                <div className="space-y-3 pt-3 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-stone-300">
                        Specific Batch Schedules &amp; Age Brackets
                      </label>
                      <p className="text-[11px] text-stone-400">
                        Configure the batch cards displayed under Disciplines &amp; Timings on the public profile
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBatchSlot}
                      className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Batch</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.batches.map((batch, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
                            Batch Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Cadet / Junior Batch"
                            value={batch.name}
                            onChange={(e) => handleBatchChange(idx, "name", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>
                        <div className="flex-[1.5] w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
                            Timing &amp; Target Group
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 05:00 PM - 06:30 PM (Ages 6-14)"
                            value={batch.time}
                            onChange={(e) => handleBatchChange(idx, "time", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>
                        <div className="sm:pt-4 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBatch(idx)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors cursor-pointer"
                            title="Remove batch slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.batches.length === 0 && (
                      <div className="p-3 rounded-xl bg-stone-950 border border-dashed border-stone-800 text-center text-xs text-stone-400">
                        No specific batch slots added. Click &quot;+ Add Batch&quot; above to add customized batch schedules.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION F: Facilities & Infrastructure */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>6. Facilities &amp; Amenities Checklist</span>
                </h4>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-300">
                    Standard Facilities (Click to toggle):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STANDARD_FACILITIES.map((fac) => {
                      const checked = formData.facilities.includes(fac);
                      return (
                        <button
                          key={fac}
                          type="button"
                          onClick={() => handleToggleFacility(fac)}
                          className={cn(
                            "p-2.5 rounded-xl text-xs text-left border flex items-center gap-2.5 transition-all cursor-pointer",
                            checked
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                              : "bg-stone-900/70 border-stone-800 text-stone-400 hover:text-white"
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              "w-4 h-4 shrink-0",
                              checked ? "text-emerald-400" : "text-stone-600"
                            )}
                          />
                          <span className="truncate">{fac}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Facilities List */}
                  {formData.facilities.filter((f) => !STANDARD_FACILITIES.includes(f)).length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-stone-400 uppercase">
                        Custom Added Amenities:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.facilities
                          .filter((f) => !STANDARD_FACILITIES.includes(f))
                          .map((customFac) => (
                            <span
                              key={customFac}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold"
                            >
                              <span>{customFac}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFacility(customFac)}
                                className="text-amber-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Facility */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add custom facility (e.g. Sauna & Recovery Bath)..."
                      value={customFacilityInput}
                      onChange={(e) => setCustomFacilityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomFacility();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFacility}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add Facility
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION G: Achievements & Honors */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>7. Academy Honors &amp; Achievements</span>
                </h4>

                <div className="space-y-2">
                  <div className="space-y-2">
                    {formData.achievements.map((ach, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 text-stone-200 min-w-0">
                          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">{ach}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAchievement(idx)}
                          className="p-1 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Achievement Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. All-India Inter-Club Taekwondo Championship 2025 - Gold Medal..."
                      value={newAchievementInput}
                      onChange={(e) => setNewAchievementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAchievement();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add Honor
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION H: Dojo Photo Gallery */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>8. Dojo Photo Gallery</span>
                </h4>

                <ImageUploadField
                  label="Upload Dojo Photos from Device"
                  value={formData.photos}
                  onChange={(photos) => setFormData((prev) => ({ ...prev, photos }))}
                  multiple={true}
                  folder="clubs/gallery"
                  helperText="Click to upload high-resolution images from your device (Max 2MB per photo)."
                />
              </div>

              {/* SECTION I: Contact, Statistics & Academy Bio */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>9. Contact, Statistics &amp; Academy Bio</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Founded Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2016"
                      value={formData.yearFounded}
                      onChange={(e) => setFormData({ ...formData, yearFounded: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Active Member Athletes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 180"
                      value={formData.memberCount}
                      onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Official Website
                    </label>
                    <input
                      type="text"
                      placeholder="https://example-academy.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Primary Phone (WhatsApp Enabled)
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Alternate Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98220 99999"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Username</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. academy123"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Account Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password or view current"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60"
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@kalawar-academy.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Academy Bio &amp; Institutional Overview
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Official description of the academy, teaching philosophy, training facilities, and federation track record..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold-gradient text-background px-7 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Registry...</span>
                    </>
                  ) : (
                    <span>{editingClub ? "Update Academy Profile" : "Register Academy"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-950 border border-red-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Academy Record?</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteCandidate.name}</strong> (
              {deleteCandidate.id}) from the official federation affiliation registry?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIVE CERTIFICATE PREVIEW MODAL                                         */}
      {/* ========================================================================= */}
      {previewCertClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewCertClub(null)}
        >
          <div
            className="w-full max-w-2xl bg-stone-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Official Affiliation Certificate</h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {previewCertClub.name} • {previewCertClub.affiliationCertificateId || "KAC-AFF-2026-..."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertClub(null)}
                className="p-1.5 rounded-full bg-stone-900 text-stone-400 hover:text-white border border-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Component Render */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20 max-w-lg mx-auto">
              <ClubAffiliationCertificateView
                club={previewCertClub}
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const certId = previewCertClub.affiliationCertificateId || previewCertClub.id;
                    const url = `${typeof window !== "undefined" ? window.location.origin : "https://kalawarmartialarts.org"}/certificates?number=${encodeURIComponent(certId)}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Verification link copied to clipboard!");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Verify Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = previewCertClub;
                    setPreviewCertClub(null);
                    handleOpenCertWithIdCheck(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-Issue / Modify</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPrintCert(previewCertClub)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDownloadCert(previewCertClub)}
                  className="bg-gold-gradient text-background px-5 py-2 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ISSUE / RE-ISSUE CERTIFICATE MODAL                                     */}
      {/* ========================================================================= */}
      {isIssueCertModalOpen && certTargetClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
          onClick={() => setIsIssueCertModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-stone-950 border-2 border-gold-500/40 rounded-3xl p-6 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {certTargetClub.affiliationCertificateId
                      ? "Re-Issue / Renew Affiliation Certificate"
                      : "Issue Official Affiliation Certificate"}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {certTargetClub.name} ({certTargetClub.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueCertModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-900 text-stone-400 hover:text-white border border-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssueCert} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-300 space-y-1 leading-relaxed">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Official Affiliation Credential &amp; Email Dispatch
                </p>
                <p className="text-[11px] text-stone-400">
                  This action will issue an official accredited certificate with cryptographic QR verification, saved permanently to the registry, and automatically send an email with certificate details and direct access links to{" "}
                  <strong className="text-amber-300">
                    {certTargetClub.email || "registered academy contact"}
                  </strong>.
                </p>
              </div>

              {/* Certificate Number */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Affiliation Certificate No *
                </label>
                <input
                  type="text"
                  value={certFormData.affiliationCertificateId}
                  onChange={(e) =>
                    setCertFormData({ ...certFormData, affiliationCertificateId: e.target.value })
                  }
                  placeholder="e.g. KAC-AFF-2026-001"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-gold-500/60"
                />
              </div>

              {/* Level of Affiliation Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-300">
                    Level of Affiliation (Choose one or more to tick on letter) *
                  </label>
                  <span className="text-[11px] text-amber-400/80 font-mono">
                    {certFormData.levelsOfAffiliation.length} Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "State", label: "State Affiliation" },
                    { id: "District", label: "District Affiliation" },
                    { id: "Academy/Club", label: "Academy / Club Affiliation" },
                    { id: "Dojo", label: "Dojo / Martial Arts Classes" },
                  ].map((item) => {
                    const isChecked = certFormData.levelsOfAffiliation.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-amber-500/15 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30"
                            : "bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const next = checked
                              ? [...certFormData.levelsOfAffiliation, item.id]
                              : certFormData.levelsOfAffiliation.filter((id) => id !== item.id);
                            setCertFormData({
                              ...certFormData,
                              levelsOfAffiliation: next,
                              levelOfAffiliation: next.join(", "),
                            });
                          }}
                          className="w-4 h-4 rounded border-stone-700 text-amber-500 bg-stone-950 focus:ring-amber-500/40 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold leading-tight">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Unit Details: State & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">State *</label>
                  <select
                    value={certFormData.state}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      const dists = getDistrictsByState(nextState);
                      setCertFormData({
                        ...certFormData,
                        state: nextState,
                        district: dists.includes(certFormData.district) ? certFormData.district : (dists[0] || ""),
                      });
                    }}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">District / City *</label>
                  <select
                    value={certFormData.district}
                    onChange={(e) => setCertFormData({ ...certFormData, district: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                  >
                    <option value="">Select District</option>
                    {certFormData.district &&
                      !getDistrictsByState(certFormData.state).includes(certFormData.district) && (
                        <option value={certFormData.district}>{certFormData.district}</option>
                      )}
                    {getDistrictsByState(certFormData.state).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Head Coach & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Head Coach / Chief Instructor *
                  </label>
                  <input
                    type="text"
                    value={certFormData.headCoachInstructor}
                    onChange={(e) =>
                      setCertFormData({ ...certFormData, headCoachInstructor: e.target.value })
                    }
                    placeholder="Head Coach Name"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Contact No *</label>
                  <input
                    type="text"
                    value={certFormData.contactNo}
                    onChange={(e) => setCertFormData({ ...certFormData, contactNo: e.target.value })}
                    placeholder="+91 98220 12345"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Valid From *</label>
                  <input
                    type="date"
                    value={certFormData.validFrom}
                    onChange={(e) => setCertFormData({ ...certFormData, validFrom: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={certFormData.validUntil}
                    onChange={(e) => setCertFormData({ ...certFormData, validUntil: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsIssueCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuingCert}
                  className="bg-gold-gradient text-background px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isIssuingCert ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{certTargetClub.affiliationCertificateId ? "Re-Issuing & Dispatching Email..." : "Issuing & Dispatching Email..."}</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>{certTargetClub.affiliationCertificateId ? "Re-Issue & Email Certificate" : "Issue & Email Certificate"}</span>
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
