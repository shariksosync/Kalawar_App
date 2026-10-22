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
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { StateAccessGate } from "@/components/state-association/StateAccessGate";
import { EditRecordModal } from "@/components/state-association/EditRecordModal";
import { states } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import { extractStateFromOption, extractDistrictFromOption } from "@/lib/club-coach-options";
import {
  printClubAffiliationCertificate,
  downloadClubAffiliationCertificatePDF,
} from "@/lib/certificate-pdf";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";

export default function AffiliatedClubsPage() {
  const { user } = useAuth();
  const stateScope = user?.state || "Maharashtra";

  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedRegType, setSelectedRegType] = useState("All");
  const [selectedCertIssued, setSelectedCertIssued] = useState("All");

  // Modals
  const [viewingClub, setViewingClub] = useState<any | null>(null);
  const [editingClub, setEditingClub] = useState<any | null>(null);
  const [certTargetClub, setCertTargetClub] = useState<any | null>(null);
  const [isReissuingCert, setIsReissuingCert] = useState(false);
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
      const res = await fetch("/api/clubs");
      const json = await res.json().catch(() => ({}));
      if (json?.success && Array.isArray(json.clubs)) {
        setClubs(json.clubs);
      }
    } catch (err) {
      console.error("Failed to load clubs:", err);
      toast.error("Failed to load affiliated clubs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for affiliated clubs belonging to this state
  const stateAffiliatedClubs = useMemo(() => {
    const targetState = extractStateFromOption(stateScope).toLowerCase().trim();
    return clubs.filter((c) => {
      const stateClean = extractStateFromOption(c.state || "").toLowerCase().trim();
      const matchState = stateClean === targetState || (c.state || "").toLowerCase().trim() === targetState;
      // Affiliated clubs: have certificate ID OR status is Verified / Active
      const isAffiliated =
        Boolean(c.affiliationCertificateId) ||
        c.status === "Verified" ||
        c.status === "Active" ||
        c.status === "Affiliated";
      return matchState && isAffiliated;
    });
  }, [clubs, stateScope]);

  const filteredClubs = useMemo(() => {
    return stateAffiliatedClubs.filter((c) => {
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

      const matchCert =
        selectedCertIssued === "All" ||
        (selectedCertIssued === "Yes" && Boolean(c.affiliationCertificateId)) ||
        (selectedCertIssued === "No" && !c.affiliationCertificateId);

      return matchQuery && matchDist && matchType && matchCert;
    });
  }, [stateAffiliatedClubs, searchQuery, selectedDistrict, selectedRegType, selectedCertIssued]);

  const handleOpenReissueModal = (club: any) => {
    setCertTargetClub(club);
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
  };

  const handleReissueCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTargetClub) return;

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
      setIsReissuingCert(true);
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

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to re-issue certificate.");
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

      setCertTargetClub(null);
      await loadData();
    } catch (err: any) {
      console.error("Re-issue certificate error:", err);
      toast.error(err.message || "Failed to re-issue certificate.");
    } finally {
      setIsReissuingCert(false);
    }
  };

  const handlePrintCert = async (club: any) => {
    try {
      toast.loading("Preparing certificate for printing...", { id: "print-cert" });
      await printClubAffiliationCertificate(club);
      toast.success("Printing initialized", { id: "print-cert" });
    } catch (err) {
      console.error("Print cert error:", err);
      toast.error("Failed to print certificate", { id: "print-cert" });
    }
  };

  const handleDownloadCert = async (club: any) => {
    try {
      toast.loading("Downloading official certificate PDF...", { id: "dl-cert" });
      await downloadClubAffiliationCertificatePDF(club);
      toast.success("Certificate downloaded successfully", { id: "dl-cert" });
    } catch (err) {
      console.error("Download cert error:", err);
      toast.error("Failed to download certificate", { id: "dl-cert" });
    }
  };

  const handleDeleteClub = async (club: any) => {
    if (!confirm(`Are you sure you want to delete club "${club.name}" (${club.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(club.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete club.");
      }

      toast.success(`Club ${club.name} deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete club.");
    }
  };

  return (
    <StateAccessGate
      pageTitle="Affiliated Club List"
      pageSubtitle={`Officially accredited martial arts clubs & academies in ${stateScope}.`}
      badge={`${stateScope} State Association`}
    >
      <div className="space-y-6 text-stone-100">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Affiliated Club List</h1>
                <p className="text-sm text-stone-400">
                  Officially accredited martial arts clubs &amp; academies in <span className="text-amber-400 font-bold">{stateScope}</span>
                </p>
              </div>
            </div>
          </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-200 flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
                <span>Refresh Registry</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search club name, ID, coach, phone..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 focus:border-amber-400 outline-none"
              />
            </div>

            {/* District Filter */}
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="All">All Districts ({availableDistricts.length})</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Registration Type Filter */}
            <div>
              <select
                value={selectedRegType}
                onChange={(e) => setSelectedRegType(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="All">All Registration Types</option>
                <option value="Apply for Affiliation">Apply for Affiliation</option>
                <option value="Already Affiliated">Already Affiliated</option>
              </select>
            </div>

            {/* Certificate Issued Filter */}
            <div>
              <select
                value={selectedCertIssued}
                onChange={(e) => setSelectedCertIssued(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="All">All Certificate Status</option>
                <option value="Yes">Certificate Issued (Yes)</option>
                <option value="No">Certificate Not Issued (No)</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-semibold">Loading affiliated clubs in {stateScope}...</span>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 bg-stone-800/80 rounded-2xl text-stone-500">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Affiliated Clubs Found</h3>
                <p className="text-xs text-stone-400 max-w-md">
                  No affiliated clubs match your search/filter criteria in {stateScope}. Newly approved requests will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 whitespace-nowrap">Club ID &amp; Name</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Head Coach / Contact</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">District &amp; State</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Registration Type</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Certificate ID</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Certificate Issued</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {filteredClubs.map((club) => {
                      const hasCert = Boolean(club.affiliationCertificateId);

                      return (
                        <tr key={club.id} className="hover:bg-stone-800/30 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {club.logo || club.image ? (
                                <img
                                  src={club.logo || club.image}
                                  alt={club.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-stone-800 bg-stone-900 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 flex-shrink-0 font-bold">
                                  {club.name?.charAt(0) || "C"}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white text-sm">{club.name}</div>
                                <div className="text-[11px] text-stone-400 font-mono">{club.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="text-white font-semibold">{club.headCoachName || "N/A"}</div>
                            <div className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-stone-500" />
                              <span>{club.phone || "No phone"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="text-stone-200 font-medium">{club.district || club.city || "N/A"}</div>
                            <div className="text-[11px] text-amber-400/80 font-bold">{club.state}</div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap border ${
                                club.registrationType === "Already Affiliated"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {club.registrationType || "Apply for Affiliation"}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {club.affiliationCertificateId ? (
                              <span className="inline-flex items-center font-mono text-[11px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                                {club.affiliationCertificateId}
                              </span>
                            ) : (
                              <span className="text-stone-500 italic text-[11px] whitespace-nowrap">Not assigned</span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {hasCert ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                <span>No</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {/* View */}
                              <button
                                onClick={() => setViewingClub(club)}
                                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="View Club Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Details */}
                              <button
                                onClick={() => setEditingClub(club)}
                                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 transition"
                                title="Edit Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Certificate */}
                              <button
                                onClick={() => handlePrintCert(club)}
                                disabled={!hasCert}
                                className={`p-2 rounded-lg border transition ${
                                  hasCert
                                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border-stone-700 cursor-pointer"
                                    : "bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-40"
                                }`}
                                title={hasCert ? "Print Certificate" : "Issue certificate first"}
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-400" />
                              </button>

                              {/* Download Certificate */}
                              <button
                                onClick={() => handleDownloadCert(club)}
                                disabled={!hasCert}
                                className={`p-2 rounded-lg border transition ${
                                  hasCert
                                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-pointer"
                                    : "bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-40"
                                }`}
                                title={hasCert ? "Download Certificate PDF" : "Issue certificate first"}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Reissue Certificate */}
                              <button
                                onClick={() => handleOpenReissueModal(club)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[11px] flex items-center gap-1 transition"
                                title="Reissue Certificate"
                              >
                                <Award className="w-3 h-3" />
                                <span>Re-issue</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteClub(club)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                title="Delete Club"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* View Club Modal */}
        {viewingClub && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{viewingClub.name}</h3>
                    <p className="text-xs text-stone-400 font-mono">ID: {viewingClub.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingClub(null)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Head Coach / President</span>
                  <span className="text-stone-200 font-semibold">{viewingClub.headCoachName || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Location</span>
                  <span className="text-stone-200 font-semibold">
                    {viewingClub.district || viewingClub.city || "N/A"}, {viewingClub.state}
                  </span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Email</span>
                  <span className="text-stone-200 font-semibold">{viewingClub.email || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Phone</span>
                  <span className="text-stone-200 font-semibold">{viewingClub.phone || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1 sm:col-span-2">
                  <span className="text-stone-500 font-bold block">Full Address</span>
                  <span className="text-stone-200 font-semibold">{viewingClub.address || viewingClub.location || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Affiliation Certificate ID</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {viewingClub.affiliationCertificateId || "Not Issued"}
                  </span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Status</span>
                  <span className="text-emerald-400 font-bold">{viewingClub.status || "Verified"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-800">
                <button
                  onClick={() => setViewingClub(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingClub && (
          <EditRecordModal
            isOpen={Boolean(editingClub)}
            onClose={() => setEditingClub(null)}
            record={editingClub}
            recordType="club"
            onSuccess={() => {
              setEditingClub(null);
              loadData();
            }}
          />
        )}

        {/* Re-Issue Certificate Modal */}
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

              <form onSubmit={handleReissueCertSubmit} className="space-y-4">
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
                    disabled={isReissuingCert}
                    className="bg-gold-gradient text-stone-950 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isReissuingCert ? (
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
    </StateAccessGate>
  );
}
