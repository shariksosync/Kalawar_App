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
import { DistrictAccessGate } from "@/components/district-association/DistrictAccessGate";
import { EditRecordModal } from "@/components/district-association/EditRecordModal";
import { states } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import { extractDistrictFromOption, extractStateFromOption } from "@/lib/club-coach-options";
import {
  printClubAffiliationCertificate,
  downloadClubAffiliationCertificatePDF,
} from "@/lib/certificate-pdf";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";

export default function AffiliatedClubsPage() {
  const { user } = useAuth();
  const districtScope = user?.district || user?.city || "";
  const stateScope = user?.state || "Maharashtra";

  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
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
    state: stateScope,
    district: districtScope,
    headCoachInstructor: "",
    contactNo: "",
  });

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

  // Filter for affiliated clubs belonging to this district
  const districtAffiliatedClubs = useMemo(() => {
    const targetDistrict = extractDistrictFromOption(districtScope).toLowerCase().trim();
    return clubs.filter((c) => {
      const cDist = (c.district || c.city || "").toLowerCase().trim();
      const cDistClean = extractDistrictFromOption(c.district || c.city || "").toLowerCase().trim();
      const matchDistrict = !targetDistrict || cDistClean === targetDistrict || cDist === targetDistrict;
      // Affiliated clubs: have certificate ID OR status is Verified / Active / Affiliated
      const isAffiliated =
        Boolean(c.affiliationCertificateId) ||
        c.status === "Verified" ||
        c.status === "Active" ||
        c.status === "Affiliated";
      return matchDistrict && isAffiliated;
    });
  }, [clubs, districtScope]);

  const filteredClubs = useMemo(() => {
    return districtAffiliatedClubs.filter((c) => {
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

      const matchCert =
        selectedCertIssued === "All" ||
        (selectedCertIssued === "Yes" && Boolean(c.affiliationCertificateId)) ||
        (selectedCertIssued === "No" && !c.affiliationCertificateId);

      return matchQuery && matchType && matchCert;
    });
  }, [districtAffiliatedClubs, searchQuery, selectedRegType, selectedCertIssued]);

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
      district: club.district || districtScope || club.city || "",
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

      toast.success(`Club "${club.name}" deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete club.");
    }
  };

  return (
    <DistrictAccessGate
      pageTitle="Affiliated Club List"
      pageSubtitle={`Official directory of recognized martial arts dojos & academies under ${districtScope || "your district"}.`}
      badge="District Association Unit"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <Building2 className="size-3.5" /> District Unit: {districtScope || "Jurisdiction"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Affiliated Club List</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Official recognized registry of affiliated clubs and martial arts schools in <strong className="text-amber-400">{districtScope}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer justify-center flex-1 md:flex-initial"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search affiliated club by name, ID, head coach, contact..."
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
            {/* Certificate Issued Filter */}
            <div className="flex items-center gap-1.5">
              <Award className="size-3.5 text-muted-foreground" />
              <select
                value={selectedCertIssued}
                onChange={(e) => setSelectedCertIssued(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background/80 border border-border/80 text-xs text-foreground focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Certificates</option>
                <option value="Yes">Certificate Issued</option>
                <option value="No">Certificate Not Issued</option>
              </select>
            </div>

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

        {/* Club Roster Table */}
        <div className="luxe-card rounded-2xl border border-border/80 overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-300 font-bold uppercase tracking-wider text-[11px] border-b border-border/80">
                <tr>
                  <th className="py-3.5 px-4">Academy / Dojo</th>
                  <th className="py-3.5 px-4">Affiliation ID</th>
                  <th className="py-3.5 px-4">Certificate Issued</th>
                  <th className="py-3.5 px-4">Head Coach / Instructor</th>
                  <th className="py-3.5 px-4">Registration Type</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-stone-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-6 animate-spin text-amber-400" />
                        <span className="text-xs text-muted-foreground">Loading affiliated clubs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="size-8 text-amber-400/60" />
                        <p className="font-semibold text-sm text-foreground">No Affiliated Clubs Found</p>
                        <p className="text-xs text-stone-400 max-w-sm">
                          {searchQuery || selectedRegType !== "All" || selectedCertIssued !== "All"
                            ? "No affiliated clubs match your selected filters."
                            : `No clubs are currently affiliated in ${districtScope || "this district"}.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClubs.map((club) => {
                    const hasCertificate = Boolean(club.affiliationCertificateId);

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
                          {hasCertificate ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                <Check className="size-3" /> Yes
                              </span>
                              <p className="font-mono text-[10px] text-stone-400 truncate max-w-[140px]">
                                {club.affiliationCertificateId}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                              <X className="size-3" /> No
                            </span>
                          )}
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

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Action */}
                            <button
                              type="button"
                              onClick={() => setViewingClub(club)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* Reissue Certificate */}
                            <button
                              type="button"
                              onClick={() => handleOpenReissueModal(club)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                              title="Re-issue Official Certificate"
                            >
                              <Award className="size-3.5" />
                              <span>Re-issue</span>
                            </button>

                            {/* Print Cert */}
                            {hasCertificate && (
                              <button
                                type="button"
                                onClick={() => handlePrintCert(club)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                                title="Print Official Certificate"
                              >
                                <Printer className="size-3.5" />
                              </button>
                            )}

                            {/* Download PDF */}
                            {hasCertificate && (
                              <button
                                type="button"
                                onClick={() => handleDownloadCert(club)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                                title="Download PDF Certificate"
                              >
                                <Download className="size-3.5" />
                              </button>
                            )}

                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => setEditingClub(club)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit className="size-3.5" />
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteClub(club)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-800 transition cursor-pointer"
                              title="Delete Club"
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
                  <span className="text-stone-400">Affiliation Certificate ID</span>
                  <p className="font-mono font-bold text-emerald-400">{viewingClub.affiliationCertificateId || "Not Issued"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Affiliation Level</span>
                  <p className="font-bold text-foreground">{viewingClub.levelOfAffiliation || "Academy / Club"}</p>
                </div>
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

        {/* RE-ISSUE AFFILIATION CERTIFICATE MODAL */}
        {certTargetClub && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-5 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="size-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Re-issue Affiliation Certificate</h3>
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

              <form onSubmit={handleReissueCertSubmit} className="space-y-4 text-xs">
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
                    disabled={isReissuingCert}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReissuingCert}
                    className="px-5 py-2 rounded-xl bg-gold-gradient text-stone-950 font-black text-xs shadow-gold hover:opacity-95 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isReissuingCert ? <Loader2 className="size-3.5 animate-spin" /> : <Award className="size-3.5" />}
                    <span>Re-issue &amp; Email Certificate</span>
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
