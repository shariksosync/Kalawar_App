"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Landmark,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Award,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Edit,
  FileText,
  X,
  Loader2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { DistrictAccessGate } from "@/components/district-association/DistrictAccessGate";
import { EditRecordModal } from "@/components/district-association/EditRecordModal";
import { getDistrictsByState } from "@/data/india-districts";
import { states } from "@/data/people";
import { extractDistrictFromOption, extractStateFromOption } from "@/lib/club-coach-options";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";

export default function ConfirmClubRequestsPage() {
  const { user } = useAuth();
  const districtScope = user?.district || user?.city || "";
  const stateScope = user?.state || "Maharashtra";

  const [clubs, setClubs] = useState<any[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegType, setSelectedRegType] = useState("All");

  // Modals
  const [viewingClub, setViewingClub] = useState<any | null>(null);
  const [editingClub, setEditingClub] = useState<any | null>(null);
  const [certTargetClub, setCertTargetClub] = useState<any | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    affiliationCertificateId: "",
    levelsOfAffiliation: ["Academy/Club"] as string[],
    levelOfAffiliation: "Academy / Club Affiliation",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    state: stateScope,
    district: districtScope,
    headCoachInstructor: "",
    contactNo: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [clubsRes, idCardsRes] = await Promise.all([
        fetch("/api/clubs"),
        fetch("/api/id-cards"),
      ]);

      const clubsJson = await clubsRes.json().catch(() => ({}));
      const idCardsJson = await idCardsRes.json().catch(() => ({}));

      if (clubsJson?.success && Array.isArray(clubsJson.clubs)) {
        setClubs(clubsJson.clubs);
      }
      if (idCardsJson?.success && Array.isArray(idCardsJson.cards)) {
        setIdCards(idCardsJson.cards);
      }
    } catch (err) {
      console.error("Failed to load clubs or id-cards:", err);
      toast.error("Failed to load club requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for pending club requests strictly belonging to this district
  const districtClubRequests = useMemo(() => {
    const targetDistrict = extractDistrictFromOption(districtScope).toLowerCase().trim();
    return clubs.filter((c) => {
      const cDist = (c.district || c.city || "").toLowerCase().trim();
      const cDistClean = extractDistrictFromOption(c.district || c.city || "").toLowerCase().trim();
      const matchDistrict = !targetDistrict || cDistClean === targetDistrict || cDist === targetDistrict;
      // Pending requests: certificate not yet issued OR status is Pending/Under Review/Apply for Affiliation
      const isUncertified =
        !c.affiliationCertificateId ||
        c.status === "Pending" ||
        c.status === "Under Review" ||
        c.status === "Apply for Affiliation";
      return matchDistrict && isUncertified;
    });
  }, [clubs, districtScope]);

  const filteredRequests = useMemo(() => {
    return districtClubRequests.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.headCoachName && c.headCoachName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchType =
        selectedRegType === "All" ||
        (c.registrationType || "").toLowerCase() === selectedRegType.toLowerCase();

      return matchQuery && matchType;
    });
  }, [districtClubRequests, searchQuery, selectedRegType]);

  // ID Card Generation Check
  const checkHasIdCard = (club: any): boolean => {
    if (!club) return false;
    const cleanId = (club.id || "").toLowerCase().trim();
    const cleanName = (club.name || "").toLowerCase().trim();
    const cleanEmail = (club.email || "").toLowerCase().trim();

    return idCards.some((card) => {
      const cId = (card.id || "").toLowerCase().trim();
      const cName = (card.holderName || card.academyName || "").toLowerCase().trim();
      const cEmail = (card.email || "").toLowerCase().trim();
      return (
        (cleanId && cId === cleanId) ||
        (cleanEmail && cEmail === cleanEmail) ||
        (cleanName && (cName === cleanName || cName.includes(cleanName)))
      );
    });
  };

  const handleOpenApproveModal = (club: any) => {
    const hasId = checkHasIdCard(club);
    if (!hasId) {
      toast.error("id card not generated yet", {
        description: "Official ID card must be generated by Super Admin before an affiliation certificate can be issued.",
      });
      return;
    }

    const existingLevels = (club.levelsOfAffiliation && club.levelsOfAffiliation.length > 0)
      ? club.levelsOfAffiliation
      : club.levelOfAffiliation
      ? club.levelOfAffiliation.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Academy/Club"];

    setCertFormData({
      affiliationCertificateId:
        club.affiliationCertificateId ||
        `KAC-AFF-${new Date().getFullYear()}-${club.id?.replace(/[^0-9]/g, "")?.slice(-3) || "001"}`,
      levelsOfAffiliation: existingLevels,
      levelOfAffiliation: existingLevels.join(", "),
      validFrom: club.validFrom || new Date().toISOString().split("T")[0],
      validUntil:
        club.validUntil ||
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      state: club.state || stateScope || "Maharashtra",
      district: club.district || districtScope || club.city || "",
      headCoachInstructor: club.headCoachName || club.contactPerson || club.presidentName || "",
      contactNo: club.phone || "",
    });
    setCertTargetClub(club);
  };

  const handleConfirmIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTargetClub) return;

    if (!certFormData.affiliationCertificateId.trim()) {
      toast.error("Please enter a valid Affiliation Certificate Number");
      return;
    }
    if (certFormData.levelsOfAffiliation.length === 0) {
      toast.error("Please select at least one Level of Affiliation");
      return;
    }

    const isReissue = Boolean(certTargetClub.affiliationCertificateId);

    setIsIssuingCert(true);
    try {
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

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        const emailDestination = certTargetClub.email;
        toast.success(`Affiliation Certificate Issued & Dispatched to ${certTargetClub.name}!`, {
          description: `Certificate ${certFormData.affiliationCertificateId} assigned to ${certTargetClub.name}${
            emailDestination ? ` & dispatched to ${emailDestination}` : ""
          }`,
        });
        setCertTargetClub(null);
        await loadData();
      } else {
        toast.error(data.error || "Failed to issue certificate.");
      }
    } catch (err) {
      toast.error("Error issuing affiliation certificate.");
    } finally {
      setIsIssuingCert(false);
    }
  };

  const handleDeleteClub = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the club request for "${name}" (${id})?`)) return;
    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        toast.success(`Club request deleted successfully.`);
        await loadData();
      } else {
        toast.error(data.error || "Failed to delete club.");
      }
    } catch {
      toast.error("Error deleting club.");
    }
  };

  return (
    <DistrictAccessGate
      pageTitle="Confirm Club Requests"
      pageSubtitle={`Review, verify, and approve club affiliation requests under ${districtScope || "your district"}.`}
      badge="District Association Unit"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> District Unit: {districtScope || "Jurisdiction"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Confirm Club Requests</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review and approve pending club registrations for <strong className="text-amber-400">{districtScope}</strong>. Approved clubs with generated ID cards can be issued official certificates and moved directly to the Affiliated Club List.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh Roster
          </button>
        </div>

        {/* Filter Controls */}
        <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by club name, ID, coach, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background/80 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Registration Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={selectedRegType}
                onChange={(e) => setSelectedRegType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background/80 border border-border/80 text-xs text-foreground focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Reg Types</option>
                <option value="Apply for Affiliation">Apply for Affiliation</option>
                <option value="Already Affiliated">Already Affiliated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Club Requests Table */}
        <div className="luxe-card rounded-2xl border border-border/80 overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-300 font-bold uppercase tracking-wider text-[11px] border-b border-border/80">
                <tr>
                  <th className="py-3.5 px-4">Academy / Dojo</th>
                  <th className="py-3.5 px-4">Affiliation ID</th>
                  <th className="py-3.5 px-4">Head Coach / Instructor</th>
                  <th className="py-3.5 px-4">Registration Type</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">ID Card Check</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-stone-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-6 animate-spin text-amber-400" />
                        <span className="text-xs text-muted-foreground">Loading pending club requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="size-8 text-emerald-400/60" />
                        <p className="font-semibold text-sm text-foreground">No Pending Club Requests</p>
                        <p className="text-xs text-stone-400 max-w-sm">
                          {searchQuery || selectedRegType !== "All"
                            ? "No club requests match your selected filters."
                            : `All club applications for ${districtScope || "this district"} are currently processed and verified.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((club) => {
                    const hasIdCard = checkHasIdCard(club);

                    return (
                      <tr key={club.id} className="hover:bg-stone-900/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                              {club.logo || club.image ? (
                                <img src={club.logo || club.image} alt={club.name} className="size-full object-cover" />
                              ) : (
                                <Landmark className="size-4 text-amber-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs">{club.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{club.discipline || "Kalawar Martial Arts"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-amber-400 font-bold whitespace-nowrap">
                          {club.id}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-foreground font-semibold">{club.headCoachName || club.contactPerson || club.presidentName || "—"}</span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {club.registrationType || "Apply for Affiliation"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-300">
                          <div>
                            <p className="text-xs font-medium text-foreground">{club.phone || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{club.email || "—"}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                            <MapPin className="size-3 text-amber-400 shrink-0" />
                            <span>{club.district || districtScope}, {club.state || stateScope}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {hasIdCard ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <CheckCircle2 className="size-3" /> Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                              <AlertCircle className="size-3" /> Not Generated
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Action */}
                            <button
                              type="button"
                              onClick={() => setViewingClub(club)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                              title="View Full Details"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => setEditingClub(club)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit className="size-3.5" />
                            </button>

                            {/* Approve & Issue Certificate */}
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(club)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm shadow-amber-500/20 inline-flex items-center gap-1.5 transition cursor-pointer"
                              title="Approve & Issue Certificate"
                            >
                              <Award className="size-3.5" />
                              <span>Approve &amp; Issue</span>
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club.id, club.name)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-800 transition cursor-pointer"
                              title="Delete Request"
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

        {/* VIEW DETAILS MODAL */}
        {viewingClub && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    <Landmark className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{viewingClub.name}</h3>
                    <p className="text-xs font-mono text-amber-400">{viewingClub.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingClub(null)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900 hover:bg-stone-800 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Discipline</span>
                  <p className="font-bold text-foreground">{viewingClub.discipline || "Kalawar Martial Arts"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Head Coach</span>
                  <p className="font-bold text-foreground">{viewingClub.headCoachName || "Not Assigned"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Phone</span>
                  <p className="font-bold text-foreground">{viewingClub.phone || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Email</span>
                  <p className="font-bold text-foreground">{viewingClub.email || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">District &amp; State</span>
                  <p className="font-bold text-foreground">{viewingClub.district || districtScope}, {viewingClub.state || stateScope}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Registered Address</span>
                  <p className="font-bold text-foreground">{viewingClub.registeredAddress || viewingClub.address || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Society / Trust Reg No</span>
                  <p className="font-mono font-bold text-amber-300">{viewingClub.registrationNumber || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Registration Type</span>
                  <p className="font-bold text-amber-400">{viewingClub.registrationType || "Apply for Affiliation"}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingClub(null)}
                  className="px-5 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ISSUE AFFILIATION CERTIFICATE MODAL */}
        {certTargetClub && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-5 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="size-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Issue Official Affiliation Certificate</h3>
                    <p className="text-xs text-stone-400">{certTargetClub.name} ({certTargetClub.id})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertTargetClub(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-900 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmIssueCert} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={certFormData.affiliationCertificateId}
                    onChange={(e) => setCertFormData({ ...certFormData, affiliationCertificateId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Levels of Affiliation *
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {["Academy/Club", "District Level", "State Level", "National Level"].map((lvl) => {
                      const checked = certFormData.levelsOfAffiliation.includes(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            const current = certFormData.levelsOfAffiliation;
                            const next = checked ? current.filter((x) => x !== lvl) : [...current, lvl];
                            setCertFormData({ ...certFormData, levelsOfAffiliation: next, levelOfAffiliation: next.join(", ") });
                          }}
                          className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                            checked
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-stone-900 border-stone-800 text-stone-400 hover:text-white"
                          }`}
                        >
                          <CheckCircle2 className={`size-3.5 ${checked ? "text-amber-400" : "text-stone-600"}`} />
                          <span>{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={certFormData.validFrom}
                      onChange={(e) => setCertFormData({ ...certFormData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={certFormData.validUntil}
                      onChange={(e) => setCertFormData({ ...certFormData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Head Coach / Instructor</label>
                    <input
                      type="text"
                      value={certFormData.headCoachInstructor}
                      onChange={(e) => setCertFormData({ ...certFormData, headCoachInstructor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={certFormData.contactNo}
                      onChange={(e) => setCertFormData({ ...certFormData, contactNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setCertTargetClub(null)}
                    disabled={isIssuingCert}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIssuingCert}
                    className="px-5 py-2 rounded-xl bg-gold-gradient text-stone-950 font-black text-xs shadow-gold hover:opacity-95 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isIssuingCert ? <Loader2 className="size-3.5 animate-spin" /> : <Award className="size-3.5" />}
                    <span>Issue &amp; Email Certificate</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT RECORD MODAL */}
        <EditRecordModal
          isOpen={Boolean(editingClub)}
          onClose={() => setEditingClub(null)}
          recordType="club"
          record={editingClub}
          stateScope={stateScope}
          onSaved={loadData}
        />
      </div>
    </DistrictAccessGate>
  );
}
