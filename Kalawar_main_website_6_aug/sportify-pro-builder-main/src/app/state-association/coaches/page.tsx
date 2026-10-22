"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { StateAccessGate } from "@/components/state-association/StateAccessGate";
import { EditRecordModal } from "@/components/state-association/EditRecordModal";
import { getDistrictsByState } from "@/data/india-districts";
import { disciplines, states } from "@/data/people";
import { extractStateFromOption, extractDistrictFromOption } from "@/lib/club-coach-options";
import {
  printCoachCertificate,
  downloadCoachCertificatePDF,
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

export default function AffiliatedCoachesPage() {
  const { user } = useAuth();
  const stateScope = user?.state || "Maharashtra";

  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedRegType, setSelectedRegType] = useState("All");
  const [selectedCertIssued, setSelectedCertIssued] = useState("All");

  // Modals
  const [viewingCoach, setViewingCoach] = useState<any | null>(null);
  const [editingCoach, setEditingCoach] = useState<any | null>(null);
  const [certCoach, setCertCoach] = useState<any | null>(null);
  const [isReissuingCert, setIsReissuingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    number: "",
    holder: "",
    coachLevel: "Level 1 - State Certified",
    discipline: "Kalawar Martial Arts",
    danBelt: "1st Dan Black Belt",
    dob: "1995-01-01",
    academyClub: "State Association Dojo",
    district: "",
    state: "",
    examDate: new Date().toISOString().split("T")[0],
    venue: "State Martial Arts Training Center",
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: `${new Date().getFullYear() + 2}-12-31`,
    photo: "",
    email: "",
    phone: "",
  });

  const availableDistricts = useMemo(() => getDistrictsByState(stateScope), [stateScope]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coaches");
      const json = await res.json().catch(() => ({}));
      if (json?.success && Array.isArray(json.coaches)) {
        setCoaches(json.coaches);
      }
    } catch (err) {
      console.error("Failed to load coaches:", err);
      toast.error("Failed to load affiliated coaches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for affiliated coaches belonging to this state
  const stateAffiliatedCoaches = useMemo(() => {
    const targetState = extractStateFromOption(stateScope).toLowerCase().trim();
    return coaches.filter((c) => {
      const stateClean = extractStateFromOption(c.state || "").toLowerCase().trim();
      const matchState = stateClean === targetState || (c.state || "").toLowerCase().trim() === targetState;
      // Affiliated coaches: have certificate ID OR status is Verified / Active
      const isAffiliated =
        Boolean(c.affiliationCertificateId) ||
        c.status === "Verified" ||
        c.status === "Active";
      return matchState && isAffiliated;
    });
  }, [coaches, stateScope]);

  const filteredCoaches = useMemo(() => {
    return stateAffiliatedCoaches.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.discipline && c.discipline.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
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
  }, [stateAffiliatedCoaches, searchQuery, selectedDistrict, selectedRegType, selectedCertIssued]);

  const handleOpenReissueModal = (coach: any) => {
    setCertCoach(coach);
    setCertFormData({
      number:
        coach.affiliationCertificateId ||
        `KSM-CCH-${new Date().getFullYear()}-${coach.id?.replace(/[^0-9]/g, "")?.slice(-4) || "001"}`,
      holder: coach.name || "",
      coachLevel: coach.qualification || coach.level || "Level 1 - State Certified",
      discipline: coach.discipline || "Kalawar Martial Arts",
      danBelt: coach.specialization || coach.beltRank || "1st Dan Black Belt",
      dob: coach.dob || "1995-01-01",
      academyClub: coach.club || "State Association Dojo",
      district: coach.district || coach.city || "Pune",
      state: coach.state || stateScope,
      examDate: coach.examDate || new Date().toISOString().split("T")[0],
      venue: coach.venue || "State Martial Arts Training Center",
      issueDate: coach.issueDate || new Date().toISOString().split("T")[0],
      validUntil: coach.validUntil || `${new Date().getFullYear() + 2}-12-31`,
      photo: coach.image || coach.photo || "",
      email: coach.email || "",
      phone: coach.phone || "",
    });
  };

  const handleReissueCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCoach) return;

    try {
      setIsReissuingCert(true);

      // Save certificate record
      const certPayload = {
        number: certFormData.number,
        kalawarId: certCoach.id,
        holder: certFormData.holder,
        type: "Coach Certificate",
        event: "KALAWAR State Coach Examination & Certification",
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
        issuedBy: `State Association (${stateScope})`,
      };

      await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certPayload),
      });

      // Update coach profile
      const res = await fetch(`/api/coaches/${encodeURIComponent(certCoach.id)}`, {
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

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update coach record.");
      }

      toast.success("Coach Certificate Re-issued Successfully!", {
        description: `Certificate ${certFormData.number} has been recorded for ${certFormData.holder}.`,
      });

      setCertCoach(null);
      await loadData();
    } catch (err: any) {
      console.error("Re-issue coach cert error:", err);
      toast.error(err.message || "Failed to re-issue coach certificate.");
    } finally {
      setIsReissuingCert(false);
    }
  };

  const handlePrintCert = (coach: any) => {
    try {
      const certData = {
        number: coach.affiliationCertificateId || coach.id,
        holder: coach.name,
        coachLevel: coach.qualification || coach.level || "Level 1 - State Certified",
        discipline: coach.discipline || "Kalawar Martial Arts",
        danBelt: coach.specialization || coach.beltRank || "1st Dan Black Belt",
        dob: coach.dob || "1995-01-01",
        academyClub: coach.club || "State Association Dojo",
        district: coach.district || coach.city || "Pune",
        state: coach.state || stateScope,
        examDate: coach.examDate || new Date().toISOString().split("T")[0],
        venue: coach.venue || "State Martial Arts Training Center",
        issueDate: coach.issueDate || new Date().toISOString().split("T")[0],
        validUntil: coach.validUntil || `${new Date().getFullYear() + 2}-12-31`,
        photo: coach.image || coach.photo || "",
      };
      printCoachCertificate(certData);
    } catch (err) {
      console.error("Print coach cert error:", err);
      toast.error("Failed to print coach certificate.");
    }
  };

  const handleDownloadCert = (coach: any) => {
    try {
      const certData = {
        number: coach.affiliationCertificateId || coach.id,
        holder: coach.name,
        coachLevel: coach.qualification || coach.level || "Level 1 - State Certified",
        discipline: coach.discipline || "Kalawar Martial Arts",
        danBelt: coach.specialization || coach.beltRank || "1st Dan Black Belt",
        dob: coach.dob || "1995-01-01",
        academyClub: coach.club || "State Association Dojo",
        district: coach.district || coach.city || "Pune",
        state: coach.state || stateScope,
        examDate: coach.examDate || new Date().toISOString().split("T")[0],
        venue: coach.venue || "State Martial Arts Training Center",
        issueDate: coach.issueDate || new Date().toISOString().split("T")[0],
        validUntil: coach.validUntil || `${new Date().getFullYear() + 2}-12-31`,
        photo: coach.image || coach.photo || "",
      };
      downloadCoachCertificatePDF(certData);
    } catch (err) {
      console.error("Download coach cert error:", err);
      toast.error("Failed to download coach certificate.");
    }
  };

  const handleDeleteCoach = async (coach: any) => {
    if (!confirm(`Are you sure you want to delete coach "${coach.name}" (${coach.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/coaches/${encodeURIComponent(coach.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete coach.");
      }

      toast.success(`Coach ${coach.name} deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coach.");
    }
  };

  return (
    <StateAccessGate
      pageTitle="Affiliated Coach List"
      pageSubtitle={`Officially accredited coaches & instructors in ${stateScope}.`}
      badge={`${stateScope} State Association`}
    >
      <div className="space-y-6 text-stone-100">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Affiliated Coach List</h1>
                <p className="text-sm text-stone-400">
                  Officially accredited coaches &amp; instructors in <span className="text-amber-400 font-bold">{stateScope}</span>
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
                placeholder="Search coach name, ID, discipline, phone..."
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
                <option value="Apply For Coach">Apply For Coach</option>
                <option value="Already a Coach">Already a Coach</option>
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
                <span className="text-xs font-semibold">Loading affiliated coaches in {stateScope}...</span>
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 bg-stone-800/80 rounded-2xl text-stone-500">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Affiliated Coaches Found</h3>
                <p className="text-xs text-stone-400 max-w-md">
                  No affiliated coaches match your search/filter criteria in {stateScope}. Newly approved coaches will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 whitespace-nowrap">Coach ID &amp; Name</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Discipline &amp; Level</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">District &amp; State</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Registration Type</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Certificate ID</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Certificate Issued</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {filteredCoaches.map((coach) => {
                      const hasCert = Boolean(coach.affiliationCertificateId);

                      return (
                        <tr key={coach.id} className="hover:bg-stone-800/30 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {coach.image || coach.photo ? (
                                <img
                                  src={coach.image || coach.photo}
                                  alt={coach.name}
                                  className="w-9 h-9 rounded-full object-cover border border-stone-800 bg-stone-900 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 flex-shrink-0 font-bold">
                                  {coach.name?.charAt(0) || "C"}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white text-sm">{coach.name}</div>
                                <div className="text-[11px] text-stone-400 font-mono">{coach.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="text-white font-semibold">{coach.discipline || "Kalawar Martial Arts"}</div>
                            <div className="text-stone-400 text-[11px] mt-0.5">
                              {coach.qualification || coach.level || "State Certified Coach"}
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="text-stone-200 font-medium">{coach.district || coach.city || "N/A"}</div>
                            <div className="text-[11px] text-amber-400/80 font-bold">{coach.state}</div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap border ${
                                coach.registrationType === "Already a Coach"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {coach.registrationType || "Apply For Coach"}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {coach.affiliationCertificateId ? (
                              <span className="inline-flex items-center font-mono text-[11px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                                {coach.affiliationCertificateId}
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
                                onClick={() => setViewingCoach(coach)}
                                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                                title="View Coach Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Details */}
                              <button
                                onClick={() => setEditingCoach(coach)}
                                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 transition"
                                title="Edit Coach Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Certificate */}
                              <button
                                onClick={() => handlePrintCert(coach)}
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
                                onClick={() => handleDownloadCert(coach)}
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
                                onClick={() => handleOpenReissueModal(coach)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[11px] flex items-center gap-1 transition"
                                title="Reissue Coach Certificate"
                              >
                                <Award className="w-3 h-3" />
                                <span>Re-issue</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteCoach(coach)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                title="Delete Coach"
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

        {/* View Coach Modal */}
        {viewingCoach && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{viewingCoach.name}</h3>
                    <p className="text-xs text-stone-400 font-mono">ID: {viewingCoach.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingCoach(null)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Discipline</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.discipline || "Kalawar Martial Arts"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Qualification / Level</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.qualification || viewingCoach.level || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Academy / Club</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.club || "Independent"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Location</span>
                  <span className="text-stone-200 font-semibold">
                    {viewingCoach.district || viewingCoach.city || "N/A"}, {viewingCoach.state}
                  </span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Email</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.email || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Phone</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.phone || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1 sm:col-span-2">
                  <span className="text-stone-500 font-bold block">Residential Address</span>
                  <span className="text-stone-200 font-semibold">{viewingCoach.address || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Certificate ID</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {viewingCoach.affiliationCertificateId || "Not Issued"}
                  </span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Status</span>
                  <span className="text-emerald-400 font-bold">{viewingCoach.status || "Verified"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-800">
                <button
                  onClick={() => setViewingCoach(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingCoach && (
          <EditRecordModal
            isOpen={Boolean(editingCoach)}
            onClose={() => setEditingCoach(null)}
            record={editingCoach}
            recordType="coach"
            onSuccess={() => {
              setEditingCoach(null);
              loadData();
            }}
          />
        )}

        {/* Re-Issue Certificate Modal */}
        {certCoach && (
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
                  onClick={() => setCertCoach(null)}
                  className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
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
                  {certCoach.affiliationCertificateId ? (
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
                    onClick={() => printCoachCertificate(certFormData)}
                    className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 hover:text-white hover:bg-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print Certificate"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>Print Certificate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCoachCertificatePDF(certFormData)}
                    className="px-4 py-2 rounded-xl bg-stone-800 border border-amber-500/40 text-amber-300 hover:bg-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    title="Download Official PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReissueCertSubmit}
                    disabled={isReissuingCert}
                    className="px-5 py-2 rounded-xl bg-gold-gradient text-stone-950 text-xs font-extrabold shadow-gold hover:scale-102 active:scale-98 transition-transform disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isReissuingCert ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Recording in Ledger...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>{certCoach.affiliationCertificateId ? "Re-Issue & Update Certificate" : "Approve & Issue Certificate"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </StateAccessGate>
  );
}
