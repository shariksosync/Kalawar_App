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
import { StateAccessGate } from "@/components/state-association/StateAccessGate";
import { EditRecordModal } from "@/components/state-association/EditRecordModal";
import { getDistrictsByState } from "@/data/india-districts";
import { states } from "@/data/people";
import { extractStateFromOption, extractDistrictFromOption } from "@/lib/club-coach-options";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";

export default function ConfirmClubRequestsPage() {
  const { user } = useAuth();
  const stateScope = user?.state || "Maharashtra";

  const [clubs, setClubs] = useState<any[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
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
    state: "Maharashtra",
    district: "",
    headCoachInstructor: "",
    contactNo: "",
  });

  const availableDistricts = useMemo(() => getDistrictsByState(stateScope), [stateScope]);

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

  // Filter for pending club requests strictly belonging to this state
  const stateClubRequests = useMemo(() => {
    const targetState = extractStateFromOption(stateScope).toLowerCase().trim();
    return clubs.filter((c) => {
      const stateClean = extractStateFromOption(c.state || "").toLowerCase().trim();
      const matchState = stateClean === targetState || (c.state || "").toLowerCase().trim() === targetState;
      // Pending requests: certificate not yet issued OR status is Pending/Under Review/Apply for Affiliation
      const isUncertified =
        !c.affiliationCertificateId ||
        c.status === "Pending" ||
        c.status === "Under Review" ||
        c.status === "Apply for Affiliation";
      return matchState && isUncertified;
    });
  }, [clubs, stateScope]);

  const filteredRequests = useMemo(() => {
    return stateClubRequests.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.headCoachName && c.headCoachName.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const distClean = extractDistrictFromOption(c.district || c.city || "").toLowerCase().trim();
      const targetDistClean = extractDistrictFromOption(selectedDistrict).toLowerCase().trim();
      const matchDist =
        selectedDistrict === "All" ||
        distClean === targetDistClean ||
        (c.district || c.city || "").toLowerCase().trim() === selectedDistrict.toLowerCase().trim();

      const matchType =
        selectedRegType === "All" ||
        (c.registrationType || "").toLowerCase() === selectedRegType.toLowerCase();

      return matchQuery && matchDist && matchType;
    });
  }, [stateClubRequests, searchQuery, selectedDistrict, selectedRegType]);

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
      district: club.district || club.city || "",
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
        toast.success(`Club request ${name} deleted successfully.`);
        await loadData();
      } else {
        toast.error(data.error || "Failed to delete request.");
      }
    } catch {
      toast.error("Error deleting club request.");
    }
  };

  return (
    <StateAccessGate
      pageTitle="Confirm Club Requests"
      pageSubtitle={`Review, verify, and approve incoming club affiliation applications exclusively within ${stateScope}.`}
      badge={`${stateScope} State Association`}
    >
      <div className="space-y-6 text-stone-200">
        {/* Header Stats Strip */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-[#141720] to-stone-900 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Landmark className="size-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-black tracking-wider">
                State Secretariat · {stateScope}
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Pending Club Affiliations</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
              {filteredRequests.length} Pending Club Requests
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="size-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by club name, ID, coach, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-stone-500 outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold max-w-[180px]"
            >
              <option value="All">All Districts ({stateScope})</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Registration Type Filter */}
            <select
              value={selectedRegType}
              onChange={(e) => setSelectedRegType(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer font-semibold"
            >
              <option value="All">All Registration Types</option>
              <option value="Apply for Affiliation">Apply for Affiliation</option>
              <option value="Already Affiliated">Already Affiliated</option>
            </select>

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
                  <th className="py-3 px-4 whitespace-nowrap">Club ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Academy &amp; Head Coach</th>
                  <th className="py-3 px-4 whitespace-nowrap">District / Location</th>
                  <th className="py-3 px-4 whitespace-nowrap">Contact Info</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">ID Card</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <RefreshCw className="size-6 animate-spin mx-auto text-amber-400 mb-2" />
                      <p>Loading club requests...</p>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <CheckCircle2 className="size-10 mx-auto text-emerald-500 mb-2" />
                      <p className="font-bold text-sm text-stone-300">No Pending Club Requests</p>
                      <p className="text-xs text-stone-500 mt-1">
                        All club applications in {stateScope} have been reviewed or accredited.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((club) => {
                    const hasIdCard = checkHasIdCard(club);
                    return (
                      <tr key={club.id} className="hover:bg-stone-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">{club.id}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-white text-xs">{club.name}</p>
                          <span className="text-[11px] text-stone-400">Coach: {club.headCoachName || "Not Assigned"}</span>
                        </td>
                        <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                          <span className="font-semibold text-white block">{club.district || club.city || "General Unit"}</span>
                          <span className="text-[10px] text-stone-400">{stateScope}</span>
                        </td>
                        <td className="py-3 px-4 text-stone-300 font-mono text-[11px] whitespace-nowrap">
                          <div>{club.phone || "—"}</div>
                          <div className="text-[10px] text-stone-400 truncate max-w-[150px]">{club.email}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap border ${
                              club.registrationType === "Already Affiliated"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {club.registrationType || "Apply for Affiliation"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {hasIdCard ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
                              <ShieldCheck className="size-3" /> Generated
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
                              <AlertCircle className="size-3" /> Missing
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => setViewingClub(club)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="View Club Details"
                            >
                              <Eye className="size-3.5 text-sky-400" />
                            </button>

                            {/* Edit Details */}
                            <button
                              type="button"
                              onClick={() => setEditingClub(club)}
                              className="p-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                              title="Edit Club Details"
                            >
                              <Edit className="size-3.5 text-amber-400" />
                            </button>

                            {/* Approve & Issue Certificate */}
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(club)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                              title="Approve & Issue Certificate"
                            >
                              <Award className="size-3.5" />
                              <span>Approve &amp; Issue</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club.id, club.name)}
                              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0e1017] border-2 border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative text-stone-200">
              <div className="flex items-start justify-between border-b border-stone-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{viewingClub.id}</span>
                  <h3 className="text-lg font-bold text-white uppercase">{viewingClub.name}</h3>
                </div>
                <button
                  onClick={() => setViewingClub(null)}
                  className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-stone-950 border border-stone-800">
                  <div>
                    <span className="text-stone-500 block">Head Coach</span>
                    <span className="font-bold text-white">{viewingClub.headCoachName || "None"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">District</span>
                    <span className="font-bold text-amber-300">{viewingClub.district || viewingClub.city || "—"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Phone</span>
                    <span className="font-mono text-white">{viewingClub.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Email</span>
                    <span className="font-mono text-white truncate block">{viewingClub.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Registration Type</span>
                    <span className="font-bold text-emerald-400">{viewingClub.registrationType || "Apply for Affiliation"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Year Founded</span>
                    <span className="text-white">{viewingClub.yearFounded || "—"}</span>
                  </div>
                </div>

                {viewingClub.registeredAddress && (
                  <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
                    <span className="text-stone-500 block mb-1">Registered Address</span>
                    <p className="text-stone-300">{viewingClub.registeredAddress}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setViewingClub(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ISSUE CERTIFICATE MODAL */}
        {certTargetClub && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6">
              <div className="flex items-start justify-between border-b border-stone-800 pb-4">
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
                  onClick={() => setCertTargetClub(null)}
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
                    onClick={() => setCertTargetClub(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIssuingCert}
                    className="bg-gold-gradient text-stone-950 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

        {/* EDIT DETAILS MODAL */}
        <EditRecordModal
          isOpen={!!editingClub}
          onClose={() => setEditingClub(null)}
          recordType="club"
          record={editingClub}
          stateScope={stateScope}
          onSaved={loadData}
        />
      </div>
    </StateAccessGate>
  );
}
