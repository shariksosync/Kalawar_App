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
  Calendar,
  ShieldCheck,
  UserCheck,
  Printer,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { DistrictAccessGate } from "@/components/district-association/DistrictAccessGate";
import { EditRecordModal } from "@/components/district-association/EditRecordModal";
import { getDistrictsByState } from "@/data/india-districts";
import { extractDistrictFromOption, extractStateFromOption } from "@/lib/club-coach-options";
import { states, disciplines } from "@/data/people";
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

export default function ConfirmCoachRequestsPage() {
  const { user } = useAuth();
  const districtScope = user?.district || user?.city || "";
  const stateScope = user?.state || "Maharashtra";

  const [coaches, setCoaches] = useState<any[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegType, setSelectedRegType] = useState("All");

  // Modals
  const [viewingCoach, setViewingCoach] = useState<any | null>(null);
  const [editingCoach, setEditingCoach] = useState<any | null>(null);
  const [certCoach, setCertCoach] = useState<any | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certFormData, setCertFormData] = useState({
    number: "",
    holder: "",
    coachLevel: "Level 1 - State Certified",
    discipline: "Kalawar Martial Arts",
    danBelt: "1st Dan Black Belt",
    dob: "1995-01-01",
    academyClub: "District Association Dojo",
    district: districtScope,
    state: stateScope,
    examDate: new Date().toISOString().split("T")[0],
    venue: "District Sports Complex",
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: `${new Date().getFullYear() + 2}-12-31`,
    photo: "",
    email: "",
    phone: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [coachesRes, idCardsRes] = await Promise.all([
        fetch("/api/coaches"),
        fetch("/api/id-cards"),
      ]);

      const coachesJson = await coachesRes.json().catch(() => ({}));
      const idCardsJson = await idCardsRes.json().catch(() => ({}));

      if (coachesJson?.success && Array.isArray(coachesJson.coaches)) {
        setCoaches(coachesJson.coaches);
      }
      if (idCardsJson?.success && Array.isArray(idCardsJson.cards)) {
        setIdCards(idCardsJson.cards);
      }
    } catch (err) {
      console.error("Failed to load coaches or id-cards:", err);
      toast.error("Failed to load coach requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for pending coach requests strictly belonging to this district
  const districtCoachRequests = useMemo(() => {
    const targetDistrict = extractDistrictFromOption(districtScope).toLowerCase().trim();
    return coaches.filter((c) => {
      const cDist = (c.district || c.city || "").toLowerCase().trim();
      const cDistClean = extractDistrictFromOption(c.district || c.city || "").toLowerCase().trim();
      const matchDistrict = !targetDistrict || cDistClean === targetDistrict || cDist === targetDistrict;
      // Pending requests: certificate not yet issued OR status is Pending/Under Review/Apply For Coach
      const isUncertified =
        !c.affiliationCertificateId ||
        c.status === "Pending" ||
        c.status === "Under Review" ||
        c.status === "Apply For Coach";
      return matchDistrict && isUncertified;
    });
  }, [coaches, districtScope]);

  const filteredRequests = useMemo(() => {
    return districtCoachRequests.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.discipline && c.discipline.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchType =
        selectedRegType === "All" ||
        (c.registrationType || "").toLowerCase() === selectedRegType.toLowerCase();

      return matchQuery && matchType;
    });
  }, [districtCoachRequests, searchQuery, selectedRegType]);

  // ID Card Generation Check
  const checkHasIdCard = (coach: any): boolean => {
    if (!coach) return false;
    const cleanId = (coach.id || "").toLowerCase().trim();
    const cleanName = (coach.name || "").toLowerCase().trim();
    const cleanEmail = (coach.email || "").toLowerCase().trim();

    return idCards.some((card) => {
      const cId = (card.id || card.kalawarId || "").toLowerCase().trim();
      const cName = (card.holderName || card.name || "").toLowerCase().trim();
      const cEmail = (card.email || "").toLowerCase().trim();
      return (
        (cleanId && cId === cleanId) ||
        (cleanEmail && cEmail === cleanEmail) ||
        (cleanName && (cName === cleanName || cName.includes(cleanName)))
      );
    });
  };

  const handleOpenApproveModal = (coach: any) => {
    const hasId = checkHasIdCard(coach);
    if (!hasId) {
      toast.error("id card not generated yet", {
        description: `Coach ${coach.name} (${coach.id}) does not have an ID card generated by Super Admin yet.`,
      });
      return;
    }

    const defaultCertNo = `KSM-CCH-${new Date().getFullYear()}-${coach.id?.replace(/[^0-9]/g, "")?.slice(-4) || "001"}`;

    setCertCoach(coach);
    setCertFormData({
      number: defaultCertNo,
      holder: coach.name || "",
      coachLevel: coach.qualification || coach.level || "Level 1 - State Certified",
      discipline: coach.discipline || "Kalawar Martial Arts",
      danBelt: coach.specialization || coach.beltRank || "1st Dan Black Belt",
      dob: coach.dob || "1995-01-01",
      academyClub: coach.club || "District Association Dojo",
      district: coach.district || districtScope || "District",
      state: coach.state || stateScope,
      examDate: new Date().toISOString().split("T")[0],
      venue: "District Sports Complex",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: `${new Date().getFullYear() + 2}-12-31`,
      photo: coach.image || coach.photo || "",
      email: coach.email || "",
      phone: coach.phone || "",
    });
  };

  const handleSaveAndIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCoach) return;

    if (!certFormData.number.trim()) {
      toast.error("Certificate number is required");
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
        event: "KALAWAR District Coach Examination & Certification",
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
        status: "Approved",
        isCoachCert: true,
      };

      const certRes = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certPayload),
      });

      const certJson = await certRes.json();
      if (!certRes.ok || !certJson.success) {
        throw new Error(certJson.error || "Failed to create certificate record.");
      }

      // 2. Update coach record to status Approved & assign affiliationCertificateId
      const coachRes = await fetch(`/api/coaches/${encodeURIComponent(certCoach.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliationCertificateId: certFormData.number,
          qualification: certFormData.coachLevel,
          level: certFormData.coachLevel,
          discipline: certFormData.discipline,
          status: "Approved",
          paymentStatus: "Paid",
        }),
      });

      const coachJson = await coachRes.json();
      if (!coachRes.ok || !coachJson.success) {
        throw new Error(coachJson.error || "Failed to update coach status.");
      }

      toast.success(`Official Coach Certificate Issued for ${certCoach.name}!`, {
        description: `Certificate #${certFormData.number} has been generated and coach moved to Affiliated Coach List.`,
      });

      setCertCoach(null);
      await loadData();
    } catch (err: any) {
      console.error("Issue coach cert error:", err);
      toast.error(err.message || "Failed to issue coach certificate.");
    } finally {
      setIsIssuingCert(false);
    }
  };

  const handleDeleteCoach = async (coach: any) => {
    if (!confirm(`Are you sure you want to delete coach request for "${coach.name}" (${coach.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/coaches/${encodeURIComponent(coach.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete coach request.");
      }

      toast.success(`Coach request for ${coach.name} deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coach request.");
    }
  };

  return (
    <DistrictAccessGate
      pageTitle="Confirm Coach Requests"
      pageSubtitle={`Review and approve coach credentials and applications in ${districtScope || "your district"}.`}
      badge="District Association Unit"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> District Unit: {districtScope || "Jurisdiction"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Confirm Coach Requests</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review and approve pending coach accreditations for <strong className="text-amber-400">{districtScope}</strong>. Approved coaches with generated ID cards can be issued official credentials and moved directly to the Affiliated Coach List.
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

        {/* Filter Toolbar */}
        <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coach by name, ID, discipline, phone, email..."
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
                <option value="Apply For Coach">Apply For Coach</option>
                <option value="Already a Coach">Already a Coach</option>
                <option value="Senior Master Coach">Senior Master Coach</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coach Requests Table */}
        <div className="luxe-card rounded-2xl border border-border/80 overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-300 font-bold uppercase tracking-wider text-[11px] border-b border-border/80">
                <tr>
                  <th className="py-3.5 px-4">Coach Name / ID</th>
                  <th className="py-3.5 px-4">Discipline &amp; Belt</th>
                  <th className="py-3.5 px-4">Qualification Level</th>
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
                        <span className="text-xs text-muted-foreground">Loading pending coach requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="size-8 text-emerald-400/60" />
                        <p className="font-semibold text-sm text-foreground">No Pending Coach Requests</p>
                        <p className="text-xs text-stone-400 max-w-sm">
                          {searchQuery || selectedRegType !== "All"
                            ? "No coach requests match your selected filters."
                            : `All coach applications for ${districtScope || "this district"} are currently processed.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((coach) => {
                    const hasIdCard = checkHasIdCard(coach);

                    return (
                      <tr key={coach.id} className="hover:bg-stone-900/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                              {coach.image || coach.photo ? (
                                <img src={coach.image || coach.photo} alt={coach.name} className="size-full object-cover" />
                              ) : (
                                <UserCheck className="size-4 text-amber-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs">{coach.name}</p>
                              <p className="font-mono text-[10px] text-amber-400">{coach.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-foreground text-xs">{coach.discipline || "Kalawar Martial Arts"}</p>
                            <p className="text-[10px] text-muted-foreground">{coach.beltRank || coach.specialization || "1st Dan Black Belt"}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {coach.qualification || coach.level || "Level 1 - State Certified"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                            {coach.registrationType || "Apply For Coach"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-300">
                          <div>
                            <p className="text-xs font-medium text-foreground">{coach.phone || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{coach.email || "—"}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                            <MapPin className="size-3 text-amber-400 shrink-0" />
                            <span>{coach.district || districtScope}, {coach.state || stateScope}</span>
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
                              onClick={() => setViewingCoach(coach)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                              title="View Full Details"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => setEditingCoach(coach)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit className="size-3.5" />
                            </button>

                            {/* Approve & Issue Certificate */}
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(coach)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm shadow-amber-500/20 inline-flex items-center gap-1.5 transition cursor-pointer"
                              title="Approve & Issue Certificate"
                            >
                              <Award className="size-3.5" />
                              <span>Approve &amp; Issue</span>
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCoach(coach)}
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
        {viewingCoach && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    <UserCheck className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{viewingCoach.name}</h3>
                    <p className="text-xs font-mono text-amber-400">{viewingCoach.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCoach(null)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900 hover:bg-stone-800 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Discipline</span>
                  <p className="font-bold text-foreground">{viewingCoach.discipline || "Kalawar Martial Arts"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Coach Level</span>
                  <p className="font-bold text-foreground">{viewingCoach.qualification || viewingCoach.level || "Level 1 - State Certified"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Dan / Belt Rank</span>
                  <p className="font-bold text-foreground">{viewingCoach.beltRank || viewingCoach.specialization || "1st Dan Black Belt"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Affiliated Club</span>
                  <p className="font-bold text-foreground">{viewingCoach.club || "District Association Dojo"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Phone</span>
                  <p className="font-bold text-foreground">{viewingCoach.phone || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Email</span>
                  <p className="font-bold text-foreground">{viewingCoach.email || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">District &amp; State</span>
                  <p className="font-bold text-foreground">{viewingCoach.district || districtScope}, {viewingCoach.state || stateScope}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Registration Type</span>
                  <p className="font-bold text-amber-400">{viewingCoach.registrationType || "Apply For Coach"}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingCoach(null)}
                  className="px-5 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ISSUE OFFICIAL COACH CERTIFICATE MODAL */}
        {certCoach && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-5 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="size-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Approve &amp; Issue Coach Certificate</h3>
                    <p className="text-xs text-stone-400">{certCoach.name} ({certCoach.id})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertCoach(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-900 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAndIssueCert} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={certFormData.number}
                    onChange={(e) => setCertFormData({ ...certFormData, number: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Coach Full Name</label>
                    <input
                      type="text"
                      required
                      value={certFormData.holder}
                      onChange={(e) => setCertFormData({ ...certFormData, holder: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Coach Level / Credential</label>
                    <select
                      value={certFormData.coachLevel}
                      onChange={(e) => setCertFormData({ ...certFormData, coachLevel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {COACH_QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Discipline</label>
                    <input
                      type="text"
                      value={certFormData.discipline}
                      onChange={(e) => setCertFormData({ ...certFormData, discipline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Dan / Belt Grade</label>
                    <input
                      type="text"
                      value={certFormData.danBelt}
                      onChange={(e) => setCertFormData({ ...certFormData, danBelt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={certFormData.issueDate}
                      onChange={(e) => setCertFormData({ ...certFormData, issueDate: e.target.value })}
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setCertCoach(null)}
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
                    <span>Approve &amp; Issue Certificate</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT RECORD MODAL */}
        <EditRecordModal
          isOpen={Boolean(editingCoach)}
          onClose={() => setEditingCoach(null)}
          recordType="coach"
          record={editingCoach}
          stateScope={stateScope}
          onSaved={loadData}
        />
      </div>
    </DistrictAccessGate>
  );
}
