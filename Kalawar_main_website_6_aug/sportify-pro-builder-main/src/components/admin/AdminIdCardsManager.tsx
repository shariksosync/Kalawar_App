"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Printer,
  Download,
  ExternalLink,
  QrCode,
  RotateCw,
  X,
  Loader2,
  Phone,
  User,
  MapPin,
  Calendar,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Eye,
  Check,
  Clock,
  UserCheck,
  Inbox,
  FileText,
  AlertTriangle,
  Award,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatMemberType } from "@/lib/utils";
import type {
  IdCardEntry,
  IdCardType,
  IdCardStatus,
  IdCardRequestEntry,
} from "@/lib/id-cards-store";
import { downloadIdCardPDF, printIdCard } from "@/lib/id-card-pdf-download";
import { downloadDanIDCardPDF, printDanIDCard } from "@/lib/dan-pdf-download";
import { downloadChampionshipIdCardPDF, printChampionshipIdCard } from "@/lib/championship-id-card-pdf";
import { states } from "@/data/people";
import { INDIA_STATES_DISTRICTS } from "@/data/india-districts";
import {
  REFEREE_LEVELS,
  normalizeRefereeLevel,
  getRefereeDesignation,
} from "@/types/referee";

export interface AdminIdCardsManagerProps {
  districtScope?: string;
  stateScope?: string;
}

export function AdminIdCardsManager({ districtScope, stateScope }: AdminIdCardsManagerProps = {}) {
  const [activeTab, setActiveTab] = useState<"requests" | "issued">("requests");
  const [cards, setCards] = useState<IdCardEntry[]>([]);
  const [requests, setRequests] = useState<IdCardRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(districtScope || "All");
  const [selectedRole, setSelectedRole] = useState<string>(districtScope ? "Club" : "All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const allUniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    Object.values(INDIA_STATES_DISTRICTS).forEach((list) => {
      list.forEach((d) => set.add(d));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Approve Request Modal State
  const [approvingRequest, setApprovingRequest] = useState<IdCardRequestEntry | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveForm, setApproveForm] = useState({
    designation: "",
    refereeLevel: "",
    discipline: "Kalawar Martial Arts",
    beltRank: "1st Dan Black Belt",
    validUntil: "",
    authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
    authorizedSignatoryRole: "Founder & President – India",
  });

  // Review Profile Modal State
  const [reviewingRequest, setReviewingRequest] = useState<IdCardRequestEntry | null>(null);

  // Reject Request Modal State
  const [rejectingRequest, setRejectingRequest] = useState<IdCardRequestEntry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Create / Edit Manual Card Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<IdCardEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Referee Profile Dynamic Sync State
  const [isSyncingReferee, setIsSyncingReferee] = useState(false);
  const [refereeSyncInfo, setRefereeSyncInfo] = useState<{
    synced: boolean;
    liveLevel?: string;
    previousLevel?: string;
    hasUpdate?: boolean;
  } | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState<Partial<IdCardEntry>>({
    cardType: "Athlete",
    holderName: "",
    holderPhoto: "",
    designation: "",
    discipline: "Kalawar Martial Arts",
    beltRank: "1st Dan Black Belt",
    academyName: "",
    state: "Maharashtra",
    district: "Pune",
    bloodGroup: "",
    emergencyContact: "",
    phone: "",
    email: "",
    status: "Active",
    validUntil: "2027-12-31",
  });

  const fetchFreshRefereeData = async (refereeId: string, currentCardLevel?: string) => {
    try {
      setIsSyncingReferee(true);
      const res = await fetch(`/api/referees/${encodeURIComponent(refereeId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.referee) {
        const ref = json.referee;
        const liveLevel = normalizeRefereeLevel(ref.level || "Level 1 – Junior Referee");
        const normCurrentLevel = currentCardLevel ? normalizeRefereeLevel(currentCardLevel) : "";
        const hasUpdate = Boolean(normCurrentLevel && normCurrentLevel !== liveLevel);

        setFormData((prev) => ({
          ...prev,
          refereeLevel: liveLevel,
          designation: getRefereeDesignation(liveLevel),
          beltRank: ref.currentRank && ref.currentRank !== "None / Unranked" ? ref.currentRank : prev.beltRank,
          academyName: ref.academy || prev.academyName,
          discipline: ref.discipline || prev.discipline,
          state: ref.state || prev.state,
          district: ref.district || prev.district,
          holderPhoto: ref.photo || prev.holderPhoto,
        }));

        setRefereeSyncInfo({
          synced: true,
          liveLevel,
          previousLevel: currentCardLevel,
          hasUpdate,
        });

        if (hasUpdate) {
          toast.info(`Updated Referee Level Detected: ${liveLevel}`, {
            description: `Live profile is ${liveLevel} (card currently has ${currentCardLevel}). Save to apply updates to ID card.`,
          });
        }

        return ref;
      }
    } catch (e) {
      console.warn("Could not fetch fresh referee profile:", e);
    } finally {
      setIsSyncingReferee(false);
    }
    return null;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/id-cards?includeRequests=true");
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setCards(Array.isArray(json.cards) ? json.cards : []);
        setRequests(Array.isArray(json.requests) ? json.requests : []);
      }
    } catch (err) {
      console.error("Failed to load ID cards data in admin:", err);
      toast.error("Failed to load ID cards and requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Handlers for Requests ──────────────────────────────────────────────────

  const handleOpenApproveModal = (req: IdCardRequestEntry) => {
    const isDan = req.memberType === "Dan" || req.cardType === "Dan" || !!req.danRank;
    const isClub = !isDan && req.memberType === "Club";
    const isCoach = !isDan && req.memberType === "Coach";
    const isReferee = !isDan && (req.memberType === "Referee" || req.id.startsWith("KSM-RF-") || req.id.startsWith("WSF-RF-"));

    if (isDan) {
      const danRank = req.danRank || 1;
      const defaultDanTitle = req.danRankTitle || req.beltRank || `${danRank}st Dan Black Belt`;
      setApproveForm({
        designation: defaultDanTitle,
        refereeLevel: "",
        discipline: req.discipline || "Kalawar Martial Arts",
        beltRank: defaultDanTitle,
        validUntil: "Lifetime Holder",
        authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
        authorizedSignatoryRole: "Founder & President – India",
      });
      setApprovingRequest(req);
      return;
    }

    // Use the stored level field if present (set during registration in Referee store).
    // Only keyword-infer as a last resort — and never default to Level 0 for referees.
    const storedLevel = (req as any).level as string | undefined;
    const LEVEL_MAP: Record<string, { designation: string; refereeLevel: string }> = {
      "Level 0 – Trainee Referee": { designation: "Trainee Referee (Level 0)", refereeLevel: "Level 0 – Trainee Referee" },
      "Level 1 – Junior Referee": { designation: "Junior Referee (Level 1)", refereeLevel: "Level 1 – Junior Referee" },
      "Level 2 – State Referee": { designation: "State Referee (Level 2)", refereeLevel: "Level 2 – State Referee" },
      "Level 3 – National Referee": { designation: "National Referee (Level 3)", refereeLevel: "Level 3 – National Referee" },
      "International / Chief Referee": { designation: "International Chief Referee", refereeLevel: "International / Chief Referee" },
    };

    let defaultRefDesignation = "Junior Referee (Level 1)";
    let defaultRefereeLevel = "Level 1 – Junior Referee";

    if (isReferee) {
      if (storedLevel && LEVEL_MAP[storedLevel]) {
        defaultRefDesignation = LEVEL_MAP[storedLevel].designation;
        defaultRefereeLevel = LEVEL_MAP[storedLevel].refereeLevel;
      } else {
        // Keyword fallback — only if no stored level
        const refText = `${(req as any).officiatingGrade || ""} ${req.beltRank || ""}`.toLowerCase();
        if (refText.includes("national") || refText.includes("level 3")) {
          defaultRefDesignation = "National Referee (Level 3)";
          defaultRefereeLevel = "Level 3 – National Referee";
        } else if (refText.includes("state") || refText.includes("level 2")) {
          defaultRefDesignation = "State Referee (Level 2)";
          defaultRefereeLevel = "Level 2 – State Referee";
        } else if (refText.includes("trainee") || refText.includes("level 0")) {
          defaultRefDesignation = "Trainee Referee (Level 0)";
          defaultRefereeLevel = "Level 0 – Trainee Referee";
        }
        // else keep Level 1 default — safer than defaulting to Level 0
      }
    }

    const defaultDesignation = isClub
      ? "Affiliated Martial Arts Dojo"
      : isCoach
      ? "Certified Coach"
      : isReferee
      ? defaultRefDesignation
      : "Senior Registered Athlete";

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setApproveForm({
      designation: defaultDesignation,
      refereeLevel: isReferee ? defaultRefereeLevel : "",
      discipline: req.discipline || "Kalawar Martial Arts",
      beltRank: req.beltRank || (isClub ? "" : isReferee ? "None / Unranked" : "1st Dan Black Belt"),
      validUntil: nextYear.toISOString().split("T")[0],
      authorizedSignatory: "Mr. Santosh Uddhav Kasabe",
      authorizedSignatoryRole: "Founder & President – India",
    });
    setApprovingRequest(req);

    if (isReferee && req.id) {
      fetch(`/api/referees/${encodeURIComponent(req.id)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json?.success && json.referee) {
            const ref = json.referee;
            const liveLevel = ref.level || defaultRefereeLevel;
            const LEVEL_TO_DESIG: Record<string, string> = {
              "Level 0 – Trainee Referee": "Trainee Referee (Level 0)",
              "Level 1 – Junior Referee": "Junior Referee (Level 1)",
              "Level 2 – State Referee": "State Referee (Level 2)",
              "Level 3 – National Referee": "National Referee (Level 3)",
              "International / Chief Referee": "International Chief Referee",
            };
            setApproveForm((prev) => ({
              ...prev,
              refereeLevel: liveLevel,
              designation: LEVEL_TO_DESIG[liveLevel] || prev.designation,
              beltRank: ref.currentRank && ref.currentRank !== "None / Unranked" ? ref.currentRank : prev.beltRank,
              discipline: ref.discipline || prev.discipline,
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvingRequest) return;

    try {
      setIsApproving(true);
      const isDan = approvingRequest.memberType === "Dan" || approvingRequest.cardType === "Dan" || !!approvingRequest.danRank;
      const res = await fetch("/api/id-cards/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: approvingRequest.id,
          action: "approve",
          overrides: {
            cardType: isDan ? "Dan" : approvingRequest.cardType,
            danRank: approvingRequest.danRank,
            danRankTitle: approvingRequest.danRankTitle || approveForm.beltRank,
            danApplicationId: approvingRequest.danApplicationId,
            designation: approveForm.designation.trim(),
            // Send the authoritative refereeLevel so the server never needs to keyword-infer
            ...(approveForm.refereeLevel ? { refereeLevel: approveForm.refereeLevel } : {}),
            discipline: approveForm.discipline.trim(),
            beltRank: approveForm.beltRank.trim() || undefined,
            validUntil: approveForm.validUntil,
            authorizedSignatory: approveForm.authorizedSignatory.trim(),
            authorizedSignatoryRole: approveForm.authorizedSignatoryRole.trim(),
          },
        }),
      });

      const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.ok && json.success && json.card) {
        toast.success(`ID Card issued for ${approvingRequest.name}!`, {
          description: `KALAWAR ID: ${json.card.id}`,
        });
        setApprovingRequest(null);
        await loadData();
      } else {
        toast.error(json.error || "Failed to approve ID card request.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while issuing ID card.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;

    try {
      setIsRejecting(true);
      const res = await fetch("/api/id-cards/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: rejectingRequest.id,
          action: "reject",
          reason: rejectReason.trim() || "Requirements not fulfilled.",
        }),
      });

      const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.ok && json.success) {
        toast.info(`Request for ${rejectingRequest.name} marked as rejected.`);
        setRejectingRequest(null);
        setRejectReason("");
        await loadData();
      } else {
        toast.error(json.error || "Failed to reject request.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsRejecting(false);
    }
  };

  // ── Handlers for Manual Issued Cards ───────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingCard(null);
    setFormData({
      cardType: districtScope ? "Club" : "Athlete",
      holderName: "",
      holderPhoto: "",
      designation: districtScope ? "Affiliated Martial Arts Dojo" : "Senior Registered Athlete",
      discipline: "Kalawar Martial Arts",
      beltRank: districtScope ? undefined : "1st Dan Black Belt",
      academyName: "",
      state: stateScope || "Maharashtra",
      district: districtScope || "Pune",
      bloodGroup: "",
      emergencyContact: "+91 98765 43210",
      phone: "+91 98765 43210",
      email: "member@kalawar.org",
      status: "Active",
      validUntil: "2027-12-31",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: IdCardEntry) => {
    setEditingCard(card);
    setRefereeSyncInfo(null);
    const isReferee =
      card.cardType === "Referee" ||
      (card.designation && card.designation.toLowerCase().includes("referee")) ||
      (card.id && (card.id.toUpperCase().startsWith("KSM-RF-") || card.id.toUpperCase().startsWith("WSF-RF-"))) ||
      !!card.refereeLevel;

    let resolvedRefereeLevel = card.refereeLevel ? normalizeRefereeLevel(card.refereeLevel) : undefined;
    if (isReferee && !resolvedRefereeLevel) {
      resolvedRefereeLevel = normalizeRefereeLevel(card.designation);
    }

    setFormData({
      ...card,
      cardType: isReferee ? "Referee" : card.cardType,
      refereeLevel: isReferee ? (resolvedRefereeLevel || "Level 0 – Trainee Referee") : undefined,
      designation: isReferee ? getRefereeDesignation(resolvedRefereeLevel) : card.designation,
    });
    setIsModalOpen(true);

    // If Referee card, dynamically fetch live profile from Referee DB to override stale snapshot
    if (isReferee && card.id) {
      fetchFreshRefereeData(card.id, resolvedRefereeLevel);
    }
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo file exceeds 2MB limit.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "kalawar_idcards");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setFormData((prev) => ({ ...prev, holderPhoto: json.url }));
        toast.success("Photo uploaded successfully!");
      } else {
        toast.error(json.error || "Failed to upload photo.");
      }
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast.error(err.message || "Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveCard = async () => {
    if (!formData.holderName?.trim()) {
      toast.error("Please enter the holder's full name.");
      return;
    }

    const payload = { ...formData };
    const isReferee =
      payload.cardType === "Referee" ||
      (payload.id && (payload.id.toUpperCase().startsWith("KSM-RF-") || payload.id.toUpperCase().startsWith("WSF-RF-"))) ||
      !!payload.refereeLevel;

    if (isReferee) {
      payload.cardType = "Referee";
      if (payload.refereeLevel) {
        payload.refereeLevel = normalizeRefereeLevel(payload.refereeLevel);
        payload.designation = getRefereeDesignation(payload.refereeLevel);
      }
    }

    try {
      setIsSaving(true);
      if (editingCard) {
        // Update
        const res = await fetch(`/api/id-cards/${encodeURIComponent(editingCard.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
        if (res.ok && json.success) {
          toast.success(
            payload.cardType === "Referee"
              ? "Updated Referee ID Card issued successfully!"
              : "ID card updated successfully!",
            {
              description: `${payload.holderName} • ${payload.refereeLevel || payload.designation}`,
            }
          );
          await loadData();
          setIsModalOpen(false);
        } else {
          toast.error(json.error || "Failed to update ID card.");
        }
      } else {
        // Create
        const res = await fetch("/api/id-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
        if (res.ok && json.success) {
          toast.success("New ID card generated successfully!", {
            description: `KALAWAR ID: ${json.card.id}`,
          });
          await loadData();
          setIsModalOpen(false);
        } else {
          toast.error(json.error || "Failed to create ID card.");
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving the ID card.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (card: IdCardEntry, nextStatus: IdCardStatus) => {
    try {
      const res = await fetch(`/api/id-cards/${encodeURIComponent(card.id)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, notes: `Status changed by Admin to ${nextStatus}` }),
      });
      const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.ok && json.success) {
        toast.success(`ID Card ${card.id} status changed to ${nextStatus}.`);
        await loadData();
      } else {
        toast.error(json.error || "Failed to update status.");
      }
    } catch {
      toast.error("Error updating status.");
    }
  };

  const handleRenewCard = async (card: IdCardEntry) => {
    try {
      const res = await fetch(`/api/id-cards/${encodeURIComponent(card.id)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      });
      const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.ok && json.success) {
        toast.success(`ID Card ${card.id} renewed for 1 year!`);
        await loadData();
      } else {
        toast.error(json.error || "Failed to renew ID card.");
      }
    } catch {
      toast.error("Error renewing card.");
    }
  };

  const handleDeleteCard = async (id: string, holderName?: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ID card "${id}"${
          holderName ? ` for ${holderName}` : ""
        }?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/id-cards/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      if (res.ok && json.success) {
        toast.success(`ID card ${id} permanently deleted from registry.`);
        await loadData();
      } else {
        toast.error(json.error || "Failed to delete ID card.");
      }
    } catch {
      toast.error("Error deleting card.");
    }
  };

  const handleExportCSV = () => {
    if (districtScope) {
      toast.error("Export CSV is locked for District Admin accounts.");
      return;
    }
    const headers = "KALAWAR ID,Type,Holder Name,Designation,Discipline,Belt Rank,Academy,State,District,Status,Issue Date,Valid Until\n";
    const rows = cards
      .map(
        (c) =>
          `"${c.id}","${c.cardType}","${c.holderName}","${c.designation}","${c.discipline}","${c.beltRank || ""}","${c.academyName}","${c.state}","${c.district}","${c.status}","${c.issueDate}","${c.validUntil}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kalawar_ID_Cards_Roster_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("ID cards roster exported to CSV!");
  };

  // ── Scoping & Filtering Logic ──────────────────────────────────────────────
  const scopedRequests = useMemo(() => {
    if (districtScope) {
      const target = districtScope.toLowerCase().trim();
      return requests.filter((r) => {
        // Exclude State & District Association users
        const isAssociationUser =
          r.memberType === "StateAssociation" ||
          r.memberType === "DistrictAssociation" ||
          (r as any).role === "state_association" ||
          (r as any).role === "state_admin" ||
          (r as any).role === "district_association" ||
          (r as any).role === "district_admin" ||
          (r.id && (r.id.toUpperCase().startsWith("KSM-SA") || r.id.toUpperCase().startsWith("WSF-SA") || r.id.toUpperCase().startsWith("KSM-DA") || r.id.toUpperCase().startsWith("WSF-DA")));
        if (isAssociationUser) return false;

        // District Admin ONLY sees Club users belonging to their district
        const isClub = r.memberType === "Club" || r.cardType === "Club";
        const matchesDist =
          (r.district || "").toLowerCase().trim() === target ||
          (r.city || "").toLowerCase().trim() === target ||
          (r.address || "").toLowerCase().includes(target);
        return isClub && matchesDist;
      });
    }

    // Super Admin filtering
    return requests.filter((r) => {
      // Exclude State & District Association users from ID Card Hub requests
      const isAssociationUser =
        r.memberType === "StateAssociation" ||
        r.memberType === "DistrictAssociation" ||
        (r as any).role === "state_association" ||
        (r as any).role === "state_admin" ||
        (r as any).role === "district_association" ||
        (r as any).role === "district_admin" ||
        (r.id && (r.id.toUpperCase().startsWith("KSM-SA") || r.id.toUpperCase().startsWith("WSF-SA") || r.id.toUpperCase().startsWith("KSM-DA") || r.id.toUpperCase().startsWith("WSF-DA")));
      if (isAssociationUser) return false;

      const targetDist = selectedDistrict.toLowerCase().trim();
      const matchesDist =
        selectedDistrict === "All" ||
        (r.district || "").toLowerCase().trim() === targetDist ||
        (r.city || "").toLowerCase().trim() === targetDist ||
        (r.address || "").toLowerCase().includes(targetDist);

      const matchesRole = (() => {
        if (selectedRole === "All") return true;
        if (selectedRole === "Dan") {
          return r.memberType === "Dan" || r.cardType === "Dan" || !!r.danRank;
        }
        if (selectedRole === "Player" || selectedRole === "Athlete") {
          return r.memberType === "Player" || r.memberType === "Athlete";
        }
        return (
          r.memberType?.toLowerCase() === selectedRole.toLowerCase() ||
          r.cardType?.toLowerCase() === selectedRole.toLowerCase()
        );
      })();

      return matchesDist && matchesRole;
    });
  }, [requests, districtScope, selectedDistrict, selectedRole]);

  const scopedCards = useMemo(() => {
    if (districtScope) {
      const target = districtScope.toLowerCase().trim();
      return cards.filter((c) => {
        // District Admin ONLY sees Club ID cards belonging to their district
        const isClub = c.cardType === "Club" || (c.id && c.id.toUpperCase().startsWith("KSM-CL-"));
        const matchesDist = (c.district || "").toLowerCase().trim() === target;
        return isClub && matchesDist;
      });
    }

    // Super Admin filtering
    return cards.filter((c) => {
      const targetDist = selectedDistrict.toLowerCase().trim();
      const matchesDist =
        selectedDistrict === "All" ||
        (c.district || "").toLowerCase().trim() === targetDist;

      const matchesRole = (() => {
        if (selectedRole === "All") return true;
        if (selectedRole === "Dan") {
          return c.cardType === "Dan" || (c.beltRank && c.beltRank.toLowerCase().includes("dan"));
        }
        if (selectedRole === "Referee:all") {
          return c.cardType === "Referee" || (c.designation && c.designation.toLowerCase().includes("referee"));
        }
        if (selectedRole.startsWith("Referee:")) {
          const tier = selectedRole.split(":")[1];
          if (c.cardType !== "Referee" && (!c.designation || !c.designation.toLowerCase().includes("referee"))) return false;
          const text = `${c.cardType || ""} ${c.designation || ""} ${c.beltRank || ""}`.toLowerCase();
          if (tier === "national") return text.includes("national") || text.includes("level 3") || text.includes("chief") || text.includes("international");
          if (tier === "state") return text.includes("state") || text.includes("level 2");
          if (tier === "junior") return text.includes("junior") || text.includes("level 1");
          if (tier === "trainee") return !text.includes("junior") && !text.includes("state") && !text.includes("national");
          return true;
        }
        return c.cardType?.toLowerCase() === selectedRole.toLowerCase();
      })();

      const matchesStatus =
        selectedStatus === "All" ||
        c.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesDist && matchesRole && matchesStatus;
    });
  }, [cards, districtScope, selectedDistrict, selectedRole, selectedStatus]);

  // ── Filtered Collections ───────────────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopedRequests;
    return scopedRequests.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.club && r.club.toLowerCase().includes(q)) ||
        (r.state && r.state.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    });
  }, [scopedRequests, searchQuery]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopedCards;
    return scopedCards.filter((c) => {
      return (
        c.holderName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.academyName.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
  }, [scopedCards, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-amber-400" />
        <p className="text-xs text-stone-400 font-semibold">Loading ID Cards Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-stone-200">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-[#141720] to-stone-900 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/35 text-[10px] font-black uppercase tracking-wider font-mono">
                🪪 ID Cards Governance Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Verification &amp; Issuance
              </span>
              {districtScope && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                  <MapPin className="size-3" /> {districtScope} Unit
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 flex items-center gap-2">
              <CreditCard className="size-6 text-amber-400" /> {districtScope ? `${districtScope.toUpperCase()} CLUB ID CARDS HUB` : "KALAWAR OFFICIAL ID CARDS HUB"}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {districtScope
                ? `Review, verify, and approve official ID card applications exclusively for ${districtScope}${stateScope ? `, ${stateScope}` : ""} affiliated clubs and dojos.`
                : "Review new account ID requests, verify credentials, issue official QR cards, and manage active ID credentials."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {districtScope ? (
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl border border-stone-800 bg-stone-900/60 text-xs font-semibold text-stone-500 inline-flex items-center gap-1.5 cursor-not-allowed opacity-60"
                title="CSV export is locked for District Administrator accounts"
              >
                <Lock className="size-3.5 text-stone-500" /> Export CSV (Locked)
              </button>
            ) : (
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-400" /> Export CSV
              </button>
            )}

            <button
              onClick={handleOpenCreate}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> + Issue Manual ID Card
            </button>
          </div>
        </div>

        {districtScope && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <MapPin className="size-3.5" />
              </div>
              <p className="text-stone-300">
                <strong className="text-amber-300">{districtScope} District Club Jurisdiction Active:</strong> Managing {scopedRequests.length} club ID requests &amp; {scopedCards.length} issued club cards.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                {scopedRequests.filter((r) => r.requestStatus === "Pending").length} Pending Club Approvals
              </span>
            </div>
          </div>
        )}

        {/* Top Navigation Tabs: Requests vs Issued */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer",
              activeTab === "requests"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-black"
                : "bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700"
            )}
          >
            <Inbox className="size-4" />
            <span>ID Card Requests</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                activeTab === "requests"
                  ? "bg-stone-950/40 text-stone-950"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              )}
            >
              {scopedRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("issued")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer",
              activeTab === "issued"
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-black"
                : "bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700"
            )}
          >
            <ShieldCheck className="size-4" />
            <span>All Issued ID Cards</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                activeTab === "issued"
                  ? "bg-stone-950/40 text-stone-950"
                  : "bg-stone-700 text-stone-300"
              )}
            >
              {scopedCards.length}
            </span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: ID CARD REQUESTS (Pending Admin Approval)                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Description & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="size-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={districtScope ? `Search ${districtScope} club requests by name, ID, phone...` : "Search requests by name, ID, phone, or club..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              {/* District Filter */}
              {districtScope ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 shadow-sm"
                  title="District locked for your district administrator account"
                >
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <span>District: {districtScope}</span>
                </div>
              ) : (
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold max-w-[180px]"
                >
                  <option value="All">All Districts</option>
                  {allUniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Role / Category Filter */}
              {districtScope ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 shadow-sm"
                  title="Role locked to Club / Academy for district administration"
                >
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <span>Role: Clubs Only</span>
                </div>
              ) : (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold"
                >
                  <option value="All">All Member Categories</option>
                  <option value="Club">Clubs / Academies</option>
                  <option value="Player">Athletes / Players</option>
                  <option value="Coach">Coaches</option>
                  <option value="Referee">Referees / Judges</option>
                  <option value="Dan">🥋 Dan Black Belt Holders</option>
                </select>
              )}

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-2xl border border-stone-800 bg-stone-900/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/80 text-stone-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role &amp; Discipline</th>
                    <th className="py-3 px-4">Club &amp; Location</th>
                    <th className="py-3 px-4">Registered On</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <Inbox className="size-10 mx-auto text-stone-600 mb-2" />
                        <p className="font-bold text-sm text-stone-300">No Pending ID Card Requests</p>
                        <p className="text-xs text-stone-500 mt-1">
                          All registered member accounts and Dan applications have been processed or approved.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isPending = req.requestStatus === "Pending";
                      const isRejected = req.requestStatus === "Rejected";
                      const isDanReq = req.memberType === "Dan" || req.cardType === "Dan" || !!req.danRank;

                      return (
                        <tr key={req.id} className="hover:bg-stone-800/40 transition">
                          {/* Member ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {req.athleteId || req.id}
                            {req.athleteId && req.athleteId !== req.id && (
                              <span className="block text-[9px] text-stone-500 font-mono">{req.id}</span>
                            )}
                          </td>

                          {/* User Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-full bg-stone-800 border border-stone-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-amber-400">
                                {req.image ? (
                                  <img
                                    src={req.image}
                                    alt={req.name}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  req.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs">{req.name}</p>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {req.email || req.phone || "No direct email"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Discipline */}
                          <td className="py-3.5 px-4">
                            {isDanReq ? (
                              <>
                                <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                                  <span>🥋 Dan Candidate</span>
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-500/30">
                                    {req.danRank ? `${req.danRank} Dan` : "Dan"}
                                  </span>
                                </span>
                                <span className="text-[10px] text-amber-400 font-bold">
                                  {req.beltRank || req.danRankTitle || "Black Belt"} · {req.discipline}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-white block">
                                  {formatMemberType(req.memberType || "Athlete")}
                                </span>
                                <span className="text-[10px] text-amber-400 font-bold">
                                  {req.discipline} {req.beltRank ? `· ${req.beltRank}` : ""}
                                </span>
                              </>
                            )}
                          </td>

                          {/* Club & Location */}
                          <td className="py-3.5 px-4 text-stone-300">
                            <p className="font-semibold text-white truncate max-w-xs">
                              {req.club || "Independent Dojo"}
                            </p>
                            <span className="text-[10px] text-stone-400">
                              {req.district || req.city}, {req.state}
                            </span>
                          </td>

                          {/* Registered Date */}
                          <td className="py-3.5 px-4 font-mono text-stone-400 text-[11px]">
                            {req.registeredOn || "2026-01-01"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                                isPending
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  : isRejected
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              )}
                            >
                              {isPending ? "Awaiting Approval" : req.requestStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setReviewingRequest(req)}
                                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition inline-flex items-center gap-1 cursor-pointer border border-stone-700"
                                title="Review Full Registration Profile"
                              >
                                <Eye className="size-3 text-amber-400" />
                                <span>Review</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(req)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition inline-flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                                title="Approve & Generate Official ID Card"
                              >
                                <Check className="size-3.5 stroke-[3]" />
                                <span>Approve &amp; Issue</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRequest(req);
                                  setRejectReason("");
                                }}
                                className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                title="Reject ID Card Request"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: ALL ISSUED ID CARDS (Approved / Active Roster)                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "issued" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Stats Strip */}
          {districtScope ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Total District Club IDs</span>
                <p className="text-xl font-black text-amber-400">{scopedCards.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Active Cards</span>
                <p className="text-xl font-black text-emerald-400">
                  {scopedCards.filter((c) => c.status === "Active" || c.status === "Approved").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Pending Cards</span>
                <p className="text-xl font-black text-amber-300">
                  {scopedCards.filter((c) => c.status === "Pending" || c.status === "Under Verification").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Inactive / Expired</span>
                <p className="text-xl font-black text-rose-400">
                  {scopedCards.filter((c) => c.status === "Expired" || c.status === "Suspended").length}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Total Issued IDs</span>
                <p className="text-xl font-black text-white">{cards.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Championship Passes</span>
                <p className="text-xl font-black text-amber-400">
                  {cards.filter((c) => c.cardType === "Championship").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Dan Holders</span>
                <p className="text-xl font-black text-amber-300">
                  {cards.filter((c) => c.cardType === "Dan" || (c.beltRank && c.beltRank.toLowerCase().includes("dan"))).length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Athletes</span>
                <p className="text-xl font-black text-amber-400">
                  {cards.filter((c) => c.cardType === "Athlete" || c.cardType === "Student").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Coaches</span>
                <p className="text-xl font-black text-emerald-400">
                  {cards.filter((c) => c.cardType === "Coach").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Referees</span>
                <p className="text-xl font-black text-sky-400">
                  {cards.filter((c) => c.cardType === "Referee").length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Clubs</span>
                <p className="text-xl font-black text-amber-300">
                  {cards.filter((c) => c.cardType === "Club").length}
                </p>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="size-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={districtScope ? `Search ${districtScope} club cards by KALAWAR ID, name, academy...` : "Search by KALAWAR ID, name, or academy..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              {/* District Filter */}
              {districtScope ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 shadow-sm"
                  title="District locked for your district administrator account"
                >
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <span>District: {districtScope}</span>
                </div>
              ) : (
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold max-w-[180px]"
                >
                  <option value="All">All Districts</option>
                  {allUniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Role / Category Filter */}
              {districtScope ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 shadow-sm"
                  title="Role locked to Club / Academy for district administration"
                >
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <span>Role: Clubs Only</span>
                </div>
              ) : (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold"
                >
                  <option value="All">All Card Types</option>
                  <option value="Club">Clubs / Academies</option>
                  <option value="Athlete">Athlete / Competitor</option>
                  <option value="Coach">Coach</option>
                  <option value="Referee:all">All Referees</option>
                  <option value="Referee:trainee">Trainee Referee (Level 0)</option>
                  <option value="Referee:junior">Junior Referee (Level 1)</option>
                  <option value="Referee:state">State Referee (Level 2)</option>
                  <option value="Referee:national">National Referee (Level 3)</option>
                  <option value="Dan">🥋 Dan Black Belt Holders</option>
                  <option value="Championship">🏆 Championship Competitor Passes</option>
                  <option value="Official">Federation Official</option>
                </select>
              )}

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Expired">Expired</option>
                <option value="Suspended">Suspended</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
                title="Refresh issued cards"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ID CARDS TABLE */}
          <div className="rounded-2xl border border-stone-800 bg-stone-900/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/80 text-stone-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">KALAWAR ID</th>
                    <th className="py-3 px-4">Holder Name</th>
                    <th className="py-3 px-4">Role / Category</th>
                    <th className="py-3 px-4">Academy &amp; Location</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredCards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <CreditCard className="size-10 mx-auto text-stone-600 mb-2" />
                        <p className="font-bold text-sm text-stone-300">No Issued ID Cards Found</p>
                        <p className="text-xs text-stone-500 mt-1">
                          {districtScope
                            ? `No active or issued club ID cards found matching the criteria in ${districtScope}.`
                            : "No issued ID cards found matching the selected filters or search query."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCards.map((card) => {
                      const isActive = card.status === "Active" || card.status === "Approved";
                      const isSuspended = card.status === "Suspended";
                      const isExpired = card.status === "Expired";
                      const isDanCard = card.cardType === "Dan";
                      const isChampionshipCard = card.cardType === "Championship";

                      return (
                        <tr key={card.id} className="hover:bg-stone-800/30 transition-colors">
                          {/* ID */}
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          <Link
                            href={
                              isDanCard
                                ? `/id-cards/dan/${encodeURIComponent(card.id)}`
                                : isChampionshipCard
                                ? `/id-cards/championship/${encodeURIComponent(card.id)}`
                                : `/id-cards/${encodeURIComponent(card.id)}`
                            }
                            target="_blank"
                            className="hover:underline flex items-center gap-1"
                            title="View Public 3D Digital Card"
                          >
                            <span>{card.id}</span>
                            <ExternalLink className="size-3 opacity-60" />
                          </Link>
                        </td>

                        {/* Holder */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-stone-800 border border-stone-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-amber-400">
                              {card.holderPhoto ? (
                                <img
                                  src={card.holderPhoto}
                                  alt={card.holderName}
                                  className="size-full object-cover"
                                />
                              ) : (
                                card.holderName.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{card.holderName}</p>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {card.email || card.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Designation */}
                        <td className="py-3 px-4">
                          {isDanCard ? (
                            <>
                              <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                                <span>🥋 {card.designation || card.danRankTitle || "Black Belt Holder"}</span>
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-500/30">
                                  {card.danRank ? `${card.danRank} Dan` : "Dan"}
                                </span>
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">
                                {card.discipline || "Kalawar Martial Arts"}
                              </span>
                            </>
                          ) : isChampionshipCard ? (
                            <>
                              <span className="font-bold text-amber-400 block flex items-center gap-1.5">
                                <span>🏆 {card.designation || "Championship Competitor"}</span>
                                {card.bibNumber && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-500/30">
                                    {card.bibNumber}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold truncate block max-w-xs">
                                {card.eventTitle || "Championship"} {card.tournamentTier ? `· ${card.tournamentTier}` : ""}
                              </span>
                            </>
                          ) : card.cardType === "Referee" || (card.designation && card.designation.toLowerCase().includes("referee")) || (card.id && (card.id.toUpperCase().startsWith("KSM-RF-") || card.id.toUpperCase().startsWith("WSF-RF-"))) || !!card.refereeLevel ? (
                            (() => {
                              const normLevel = normalizeRefereeLevel(card.refereeLevel || card.designation);
                              const tierLabel = getRefereeDesignation(normLevel);
                              const hasBelt =
                                card.beltRank &&
                                card.beltRank.toUpperCase() !== "NONE" &&
                                card.beltRank !== "None / Unranked" &&
                                card.beltRank.trim() !== "";

                              return (
                                <>
                                  <span className="font-bold text-white block">{tierLabel}</span>
                                  <span className="text-[10px] text-amber-400 font-bold inline-flex items-center gap-1 mt-0.5">
                                    <span>Official Referee Credential</span>
                                    {hasBelt && <span className="text-stone-300">· {card.beltRank}</span>}
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <span className="font-semibold text-white block">{card.designation}</span>
                              <span className="text-[10px] text-amber-400 font-bold">
                                {card.cardType}{" "}
                                {card.beltRank &&
                                card.beltRank.toUpperCase() !== "NONE" &&
                                card.beltRank !== "None / Unranked" &&
                                card.beltRank.trim() !== ""
                                  ? `· ${card.beltRank}`
                                  : ""}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Academy & State */}
                        <td className="py-3 px-4 text-stone-300">
                          <p className="font-semibold text-white truncate max-w-xs">{card.academyName}</p>
                          <span className="text-[10px] text-stone-400">{card.district}, {card.state}</span>
                        </td>

                        {/* Validity */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-white block">{card.validUntil}</span>
                          <span className="text-[9px] text-stone-400">Issued: {card.issueDate}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              isActive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : isSuspended
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : isExpired
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-stone-800 text-stone-400 border-stone-700"
                            )}
                          >
                            {card.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => isDanCard ? printDanIDCard(card as any) : isChampionshipCard ? printChampionshipIdCard(card) : printIdCard(card)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Print ID Card (Front & Back)"
                            >
                              <Printer className="size-3.5 text-sky-400" />
                            </button>

                            <button
                              onClick={() => isDanCard ? downloadDanIDCardPDF(card as any) : isChampionshipCard ? downloadChampionshipIdCardPDF(card) : downloadIdCardPDF(card)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Download PDF Badge"
                            >
                              <Download className="size-3.5 text-emerald-400" />
                            </button>

                            <button
                              onClick={() => handleRenewCard(card)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Renew Validity for 1 Year"
                            >
                              <RotateCw className="size-3.5 text-amber-400" />
                            </button>

                            <button
                              onClick={() =>
                                handleStatusChange(card, isActive ? "Suspended" : "Active")
                              }
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title={isActive ? "Suspend Card" : "Activate Card"}
                            >
                              {isActive ? <Lock className="size-3.5 text-rose-400" /> : <Unlock className="size-3.5 text-emerald-400" />}
                            </button>

                            <button
                              onClick={() => handleOpenEdit(card)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="size-3.5 text-amber-400" />
                            </button>

                            <button
                              onClick={() => handleDeleteCard(card.id, card.holderName)}
                              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              title={`Delete ID Card (${card.id})`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: APPROVE & ISSUE ID CARD                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border-2 border-emerald-500 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  {approvingRequest.id}
                </span>
                <h3 className="text-lg font-bold text-white uppercase mt-0.5">
                  Approve &amp; Issue ID Card
                </h3>
                <p className="text-xs text-stone-400">
                  Candidate: <strong className="text-white">{approvingRequest.name}</strong> ({formatMemberType(approvingRequest.memberType)})
                </p>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="size-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5 text-stone-300">
                <p><strong>Discipline:</strong> {approvingRequest.discipline}</p>
                <p><strong>Academy:</strong> {approvingRequest.club || "Independent Dojo"}</p>
                <p><strong>State / Location:</strong> {approvingRequest.state} ({approvingRequest.district || approvingRequest.city})</p>
                <p><strong>Contact:</strong> {approvingRequest.phone || approvingRequest.email || "Registered Account"}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-stone-400 uppercase text-[10px] mb-1">
                    {approvingRequest.memberType === "Referee" || approvingRequest.id.startsWith("KSM-RF-") || approvingRequest.id.startsWith("WSF-RF-") ? "Referee Official Grade / Tier" : "Official Designation *"}
                  </label>
                  {approvingRequest.memberType === "Referee" || approvingRequest.id.startsWith("KSM-RF-") || approvingRequest.id.startsWith("WSF-RF-") ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-amber-500/40">
                        <span className="text-amber-400 font-bold text-xs">{approveForm.refereeLevel || "Level 1 – Junior Referee"}</span>
                        <span className="text-[10px] text-stone-400 inline-flex items-center gap-1 font-medium bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                          <Lock className="size-3 text-amber-400" /> Read-only
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        💡 <em>Note: To change a referee&apos;s level or rank, please use the Referee Management Module.</em>
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={approveForm.designation}
                      onChange={(e) => setApproveForm({ ...approveForm, designation: e.target.value })}
                      required
                      placeholder="e.g. Senior Registered Athlete"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-400 uppercase text-[10px] mb-1">
                    Belt Rank / Certification Division
                  </label>
                  <input
                    type="text"
                    value={approveForm.beltRank}
                    onChange={(e) => setApproveForm({ ...approveForm, beltRank: e.target.value })}
                    placeholder="e.g. 1st Dan Black Belt / Senior Grade"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-400 uppercase text-[10px] mb-1">
                      Valid Until Date / Status *
                    </label>
                    <input
                      type="text"
                      value={approveForm.validUntil}
                      onChange={(e) => setApproveForm({ ...approveForm, validUntil: e.target.value })}
                      required
                      placeholder="Lifetime Holder or YYYY-MM-DD"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-400 uppercase text-[10px] mb-1">
                      Authorized Signatory
                    </label>
                    <input
                      type="text"
                      value={approveForm.authorizedSignatory}
                      onChange={(e) => setApproveForm({ ...approveForm, authorizedSignatory: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {approvingRequest.memberType === "Dan" || approvingRequest.cardType === "Dan" || !!approvingRequest.danRank ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <Award className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Approving this Dan request will officially issue the <strong>{approveForm.beltRank || "Dan Black Belt"}</strong> ID Card, generate live scannable QR verification, update the Dan grading registry, and immediately grant access to the user on their <strong>My ID Card</strong> portal under the Dan tab.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed">
                  Approving this request will generate the official KALAWAR ID Card with live scannable QR verification and immediately grant access to the user on their member portal.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isApproving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isApproving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5 stroke-[3]" />
                )}
                <span>Confirm &amp; Issue ID Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REVIEW CANDIDATE APPLICATION PROFILE                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  {reviewingRequest.athleteId || reviewingRequest.id}
                </span>
                <h3 className="text-lg font-bold text-white uppercase mt-0.5">
                  Registration Particulars
                </h3>
                <p className="text-xs text-stone-400">{reviewingRequest.name}</p>
              </div>
              <button
                onClick={() => setReviewingRequest(null)}
                className="size-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                <div className="size-14 rounded-xl bg-stone-800 border border-stone-700 overflow-hidden shrink-0 flex items-center justify-center text-lg font-black text-amber-400">
                  {reviewingRequest.image ? (
                    <img
                      src={reviewingRequest.image}
                      alt={reviewingRequest.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    reviewingRequest.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">{reviewingRequest.name}</h4>
                  <p className="text-amber-400 font-semibold">{formatMemberType(reviewingRequest.memberType)} · {reviewingRequest.discipline}</p>
                  <p className="text-stone-400 text-[11px]">Registered: {reviewingRequest.registeredOn}</p>
                </div>
              </div>

              {/* Dan-specific Examination Details */}
              {(reviewingRequest.cardType === "Dan" || reviewingRequest.memberType === "Dan" || reviewingRequest.danRank) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-black text-xs uppercase flex items-center gap-1.5">
                      <Award className="size-4 text-amber-400" /> Dan Examination Registration
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                      {reviewingRequest.danRank ? `${reviewingRequest.danRank} Dan Candidate` : "Dan Candidate"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Applied Dan Rank</span>
                      <span className="font-bold text-amber-300">{reviewingRequest.danRankTitle || reviewingRequest.beltRank}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Current Belt Rank</span>
                      <span className="font-semibold text-white">{reviewingRequest.currentBeltTitle || "Previous Dan / Color Belt"}</span>
                    </div>
                    {reviewingRequest.instructorName && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-stone-400 uppercase block font-bold">Instructor / Master</span>
                        <span className="font-semibold text-white">{reviewingRequest.instructorName}</span>
                      </div>
                    )}
                  </div>

                  {/* Document Links */}
                  <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
                    <span className="text-[10px] text-stone-400 uppercase block font-bold">Submitted Examination Documents</span>
                    <div className="flex flex-wrap gap-2">
                      {reviewingRequest.aadhaarDoc && (
                        <a
                          href={reviewingRequest.aadhaarDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-[11px] text-stone-300 hover:text-amber-300 inline-flex items-center gap-1 transition"
                        >
                          <FileText className="size-3 text-amber-400" /> Aadhaar / ID
                        </a>
                      )}
                      {reviewingRequest.currentCertDoc && (
                        <a
                          href={reviewingRequest.currentCertDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-[11px] text-stone-300 hover:text-amber-300 inline-flex items-center gap-1 transition"
                        >
                          <Award className="size-3 text-amber-400" /> Current Certificate
                        </a>
                      )}
                      {reviewingRequest.medicalFitnessDoc && (
                        <a
                          href={reviewingRequest.medicalFitnessDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-[11px] text-stone-300 hover:text-amber-300 inline-flex items-center gap-1 transition"
                        >
                          <ShieldCheck className="size-3 text-emerald-400" /> Medical Fitness
                        </a>
                      )}
                      {reviewingRequest.thesisDoc && (
                        <a
                          href={reviewingRequest.thesisDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-[11px] text-stone-300 hover:text-amber-300 inline-flex items-center gap-1 transition"
                        >
                          <FileText className="size-3 text-sky-400" /> Thesis / Dissertation
                        </a>
                      )}
                      {reviewingRequest.paymentProofDoc && (
                        <a
                          href={reviewingRequest.paymentProofDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400 text-[11px] text-stone-300 hover:text-amber-300 inline-flex items-center gap-1 transition"
                        >
                          <FileSpreadsheet className="size-3 text-amber-400" /> Registration Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 bg-stone-950/80 p-4 rounded-2xl border border-stone-800/80 text-stone-300">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Belt Rank</span>
                  <span className="font-semibold text-white">{reviewingRequest.beltRank || "Standard"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Blood Group</span>
                  <span className="font-semibold text-white">{reviewingRequest.bloodGroup || "Not Specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Phone</span>
                  <span className="font-semibold text-white font-mono">{reviewingRequest.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Emergency Contact</span>
                  <span className="font-semibold text-white font-mono">{reviewingRequest.emergencyContact || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Email Address</span>
                  <span className="font-semibold text-white font-mono truncate block">{reviewingRequest.email || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">Affiliated Club / Academy</span>
                  <span className="font-semibold text-white">{reviewingRequest.club || "Independent Dojo"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">State &amp; District</span>
                  <span className="font-semibold text-white">{reviewingRequest.district || reviewingRequest.city}, {reviewingRequest.state}</span>
                </div>
                {reviewingRequest.address && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">Residential Address</span>
                    <span className="text-stone-300">{reviewingRequest.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const req = reviewingRequest;
                  setReviewingRequest(null);
                  handleOpenApproveModal(req);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="size-3.5 stroke-[3]" /> Proceed to Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REJECT ID CARD REQUEST                                            */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border border-rose-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="size-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Reject ID Card Request</h3>
                <p className="text-xs text-stone-400">{rejectingRequest.name} ({rejectingRequest.id})</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-stone-400 font-bold">Reason for Rejection / Revision Remarks</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Identity documents incomplete or belt rank proof required."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white text-xs outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                <span>Reject Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE / EDIT MANUAL ID CARD                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1017] border-2 border-amber-500 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {editingCard ? "Edit KALAWAR ID Card" : "Issue New Official ID Card"}
                </h3>
                <p className="text-xs text-stone-400">
                  Digital identification accreditation and verification system
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Card Type */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  ID Card Category *
                </label>
                <select
                  value={formData.cardType === "Referee" ? "Referee" : formData.cardType || "Athlete"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Referee") {
                      // Set Referee card type; keep existing refereeLevel or default to Level 1
                      const currentLevel = formData.refereeLevel || "Level 1 – Junior Referee";
                      const LEVEL_TO_DESIG: Record<string, string> = {
                        "Level 0 – Trainee Referee": "Trainee Referee (Level 0)",
                        "Level 1 – Junior Referee": "Junior Referee (Level 1)",
                        "Level 2 – State Referee": "State Referee (Level 2)",
                        "Level 3 – National Referee": "National Referee (Level 3)",
                        "International / Chief Referee": "International Chief Referee",
                      };
                      setFormData({
                        ...formData,
                        cardType: "Referee",
                        refereeLevel: currentLevel,
                        designation: LEVEL_TO_DESIG[currentLevel] || "Junior Referee (Level 1)",
                      });
                    } else if (val === "Dan") {
                      setFormData({
                        ...formData,
                        cardType: "Dan",
                        refereeLevel: undefined,
                        designation: "1st Dan Black Belt (Sho Dan)",
                        beltRank: "1st Dan Black Belt",
                        validUntil: "Lifetime Holder",
                      });
                    } else {
                      const defaultDesignationMap: Record<string, string> = {
                        Athlete: "Senior Registered Athlete",
                        Coach: "Certified Coach",
                        Club: "Affiliated Martial Arts Dojo",
                        Official: "Federation Official",
                      };
                      setFormData({
                        ...formData,
                        cardType: val as IdCardType,
                        refereeLevel: undefined,
                        designation:
                          formData.designation?.toLowerCase().includes("referee")
                            ? defaultDesignationMap[val] || "Senior Registered Athlete"
                            : formData.designation || defaultDesignationMap[val] || "Senior Registered Athlete",
                      });
                    }
                  }}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold"
                >
                  <option value="Dan">🥋 Dan / Black Belt Holder</option>
                  <option value="Athlete">Athlete / Competitor</option>
                  <option value="Coach">Coach</option>
                  <option value="Referee">Referee</option>
                  <option value="Club">Club / Academy</option>
                  <option value="Official">Federation Official</option>
                </select>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  Passport Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {formData.holderPhoto ? (
                      <img
                        src={formData.holderPhoto}
                        alt="Holder"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Camera className="size-6 text-stone-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-300 inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="size-3.5 animate-spin text-amber-400" />
                      ) : (
                        <UploadCloud className="size-3.5 text-amber-400" />
                      )}
                      <span>Upload Photo</span>
                    </button>
                    <p className="text-[10px] text-stone-500">Max size 2MB (JPG, PNG, WebP)</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  Holder Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Mehra"
                  value={formData.holderName || ""}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  Official Designation / Role Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Registered Athlete (Kumite)"
                  value={formData.designation || ""}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Discipline */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Discipline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Martial Arts"
                    value={formData.discipline || ""}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Belt Rank */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Belt Rank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Dan Black Belt"
                    value={formData.beltRank || ""}
                    onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Academy */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  Academy / Affiliated Dojo Club
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vanguard Martial Arts Institute"
                  value={formData.academyName || ""}
                  onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="member@kalawar.org"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* State */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    State
                  </label>
                  <select
                    value={formData.state || "Maharashtra"}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    District / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={formData.district || ""}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. O+ve"
                    value={formData.bloodGroup || ""}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-400 uppercase text-[10px]">
                    Emergency Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.emergencyContact || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Valid Until */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-400 uppercase text-[10px]">
                  Valid Until Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={formData.validUntil || ""}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingCard ? "Update Card" : "Generate ID Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
