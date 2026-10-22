"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Scale,
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
  FileText,
  X,
  Loader2,
  Calendar,
  ShieldCheck,
  ExternalLink,
  Printer,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { DistrictAccessGate } from "@/components/district-association/DistrictAccessGate";
import { extractDistrictFromOption } from "@/lib/club-coach-options";
import {
  REFEREE_LEVELS,
  type RefereeItem,
  type RefereeLevel,
} from "@/types/referee";
import { RefereeCertificateView } from "@/components/certificates/RefereeCertificateView";
import {
  downloadCertificatePDF,
  printCertificateSlip,
} from "@/lib/certificate-pdf";
import { openFileInFullSize } from "@/lib/utils";

export default function AffiliatedRefereesPage() {
  const { user } = useAuth();
  const districtScope = user?.district || user?.city || "";
  const stateScope = user?.state || "Maharashtra";

  const [referees, setReferees] = useState<RefereeItem[]>([]);
  const [idCards, setIdCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegType, setSelectedRegType] = useState("All");
  const [selectedCertIssued, setSelectedCertIssued] = useState("All");

  // Modals
  const [viewingReferee, setViewingReferee] = useState<RefereeItem | null>(null);
  const [certTargetReferee, setCertTargetReferee] = useState<RefereeItem | null>(null);
  const [isReissuingCert, setIsReissuingCert] = useState(false);

  // Certificate Form Data for Reissue
  const [certFormData, setCertFormData] = useState({
    licenseNumber: "",
    level: "Level 1 – Junior Referee" as RefereeLevel,
    currentRank: "1st Dan Black Belt",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
    state: stateScope,
    district: districtScope,
    academy: "Independent Official",
    contactNo: "",
    email: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [refereesRes, idCardsRes] = await Promise.all([
        fetch("/api/referees"),
        fetch("/api/id-cards"),
      ]);

      const refereesJson = await refereesRes.json().catch(() => ({}));
      const idCardsJson = await idCardsRes.json().catch(() => ({}));

      if (refereesJson?.success && Array.isArray(refereesJson.referees)) {
        setReferees(refereesJson.referees);
      }
      if (idCardsJson?.success && Array.isArray(idCardsJson.cards)) {
        setIdCards(idCardsJson.cards);
      }
    } catch (err) {
      console.error("Failed to load referees or id-cards:", err);
      toast.error("Failed to load affiliated referees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for affiliated referees belonging to this district
  const districtAffiliatedReferees = useMemo(() => {
    const targetDistrict = extractDistrictFromOption(districtScope).toLowerCase().trim();
    return referees.filter((r) => {
      const rDist = (r.district || "").toLowerCase().trim();
      const rDistClean = extractDistrictFromOption(r.district || "").toLowerCase().trim();
      const matchDistrict = !targetDistrict || rDistClean === targetDistrict || rDist === targetDistrict;

      // Affiliated referees: have licenseNumber OR status is Active / Certified
      const isAffiliated =
        Boolean(r.licenseNumber) ||
        r.status === "Active" ||
        r.status === "Certified";

      return matchDistrict && isAffiliated;
    });
  }, [referees, districtScope]);

  const filteredReferees = useMemo(() => {
    return districtAffiliatedReferees.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.licenseNumber && r.licenseNumber.toLowerCase().includes(q)) ||
        (r.kalawarId && r.kalawarId.toLowerCase().includes(q)) ||
        (r.academy && r.academy.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.currentRank && r.currentRank.toLowerCase().includes(q));

      const matchType =
        selectedRegType === "All" ||
        (r.level || "").toLowerCase() === selectedRegType.toLowerCase() ||
        (r.level || "").toLowerCase().includes(selectedRegType.toLowerCase());

      const matchCert =
        selectedCertIssued === "All" ||
        (selectedCertIssued === "Yes" && Boolean(r.licenseNumber)) ||
        (selectedCertIssued === "No" && !r.licenseNumber);

      return matchQuery && matchType && matchCert;
    });
  }, [districtAffiliatedReferees, searchQuery, selectedRegType, selectedCertIssued]);

  // ID Card Generation Check
  const checkHasIdCard = (ref: RefereeItem): boolean => {
    if (!ref) return false;
    const cleanId = (ref.id || "").toLowerCase().trim();
    const cleanKalawarId = (ref.kalawarId || "").toLowerCase().trim();
    const cleanEmail = (ref.email || "").toLowerCase().trim();
    const cleanName = (ref.name || "").toLowerCase().trim();

    return idCards.some((card) => {
      const cId = (card.id || card.kalawarId || "").toLowerCase().trim();
      const cName = (card.holderName || card.name || "").toLowerCase().trim();
      const cEmail = (card.email || "").toLowerCase().trim();
      return (
        (cleanId && (cId === cleanId || cId === cleanKalawarId)) ||
        (cleanKalawarId && cId === cleanKalawarId) ||
        (cleanEmail && cEmail === cleanEmail) ||
        (cleanName && (cName === cleanName || cName.includes(cleanName)))
      );
    });
  };

  const handleOpenReissueModal = (referee: RefereeItem) => {
    const defaultLicenseNo =
      referee.licenseNumber ||
      `KAC-REF-${new Date().getFullYear()}-${referee.id?.replace(/[^0-9]/g, "")?.slice(-3) || "001"}`;

    const defaultLevel: RefereeLevel =
      REFEREE_LEVELS.find((lvl) => lvl.toLowerCase() === (referee.level || "").toLowerCase()) ||
      (referee.level as RefereeLevel) ||
      "Level 1 – Junior Referee";

    setCertFormData({
      licenseNumber: defaultLicenseNo,
      level: defaultLevel,
      currentRank: referee.currentRank || "1st Dan Black Belt",
      validFrom: referee.licenseIssuedDate ? referee.licenseIssuedDate.split("T")[0] : new Date().toISOString().split("T")[0],
      validUntil: referee.licenseValidUntil
        ? referee.licenseValidUntil.split("T")[0]
        : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
      state: referee.state || stateScope,
      district: referee.district || districtScope,
      academy: referee.academy || "Independent Official",
      contactNo: referee.phone || "",
      email: referee.email || "",
    });
    setCertTargetReferee(referee);
  };

  const handleReissueCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTargetReferee) return;

    if (!certFormData.licenseNumber.trim()) {
      toast.error("Certificate / License number is required");
      return;
    }

    try {
      setIsReissuingCert(true);
      // 1. Update Referee record
      const res = await fetch(`/api/referees/${encodeURIComponent(certTargetReferee.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
          level: certFormData.level,
          licenseNumber: certFormData.licenseNumber.trim(),
          licenseIssuedDate: certFormData.validFrom,
          licenseValidUntil: certFormData.validUntil,
          currentRank: certFormData.currentRank,
          state: certFormData.state,
          district: certFormData.district,
          academy: certFormData.academy,
          phone: certFormData.contactNo,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || "Failed to re-issue certificate.");
      }

      // 2. Re-create / Record Certificate in registry with automated email dispatch
      await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: certFormData.licenseNumber.trim(),
          holder: certTargetReferee.name,
          kalawarId: certTargetReferee.kalawarId || certTargetReferee.id,
          email: certFormData.email || certTargetReferee.email,
          phone: certFormData.contactNo || certTargetReferee.phone,
          state: certFormData.state,
          district: certFormData.district,
          academy: certFormData.academy,
          type: "Referee / Technical Official Certificate",
          event: "National Technical Official & Referee Accreditation",
          position: certFormData.level,
          rankOrBelt: certFormData.currentRank,
          issued: certFormData.validFrom,
          validUntil: certFormData.validUntil,
          issuedBy: "Mr. Santosh Kasbe (Head, Technical Committee)",
          status: "Valid",
          notes: `Re-issued accreditation for ${certFormData.level}. License: ${certFormData.licenseNumber.trim()}`,
        }),
      });

      const recipient = certFormData.email || certTargetReferee.email;
      toast.success(`Referee Certificate Re-Issued Successfully!`, {
        description: `Certificate #${certFormData.licenseNumber.trim()} assigned to ${certTargetReferee.name}${
          recipient ? ` & dispatched to ${recipient}` : ""
        }`,
      });

      setCertTargetReferee(null);
      await loadData();
    } catch (err: any) {
      console.error("Re-issue certificate error:", err);
      toast.error(err.message || "Failed to re-issue certificate.");
    } finally {
      setIsReissuingCert(false);
    }
  };

  const handleDeleteReferee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove official "${name}" (${id})?`)) return;
    try {
      const res = await fetch(`/api/referees/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        toast.success(`Referee removed successfully.`);
        await loadData();
      } else {
        toast.error(data.error || "Failed to delete referee.");
      }
    } catch {
      toast.error("Error deleting referee.");
    }
  };

  const handleDownloadCert = async (referee: RefereeItem) => {
    if (!referee.licenseNumber) {
      toast.error("No certificate has been issued for this referee yet.");
      return;
    }
    try {
      toast.loading("Generating official certificate PDF...", { id: "cert-dl" });
      await downloadCertificatePDF({
        id: referee.id,
        number: referee.licenseNumber,
        holder: referee.name,
        kalawarId: referee.kalawarId || referee.id,
        email: referee.email,
        phone: referee.phone,
        type: "Referee / Technical Official Certificate",
        event: "National Technical Official & Referee Accreditation",
        position: referee.level || "Level 1 – Junior Referee",
        issued: referee.licenseIssuedDate ? referee.licenseIssuedDate.split("T")[0] : new Date().toISOString().split("T")[0],
        validUntil: referee.licenseValidUntil ? referee.licenseValidUntil.split("T")[0] : "",
        state: referee.state,
        district: referee.district,
        academy: referee.academy || "Independent Official",
        status: "Valid",
      } as any);
      toast.success("Certificate downloaded successfully!", { id: "cert-dl" });
    } catch (err) {
      console.error("Certificate download error:", err);
      toast.error("Failed to generate PDF.", { id: "cert-dl" });
    }
  };

  const handlePrintCert = (referee: RefereeItem) => {
    if (!referee.licenseNumber) {
      toast.error("No certificate has been issued for this referee yet.");
      return;
    }
    printCertificateSlip({
      id: referee.id,
      number: referee.licenseNumber,
      holder: referee.name,
      kalawarId: referee.kalawarId || referee.id,
      email: referee.email,
      phone: referee.phone,
      type: "Referee / Technical Official Certificate",
      event: "National Technical Official & Referee Accreditation",
      position: referee.level || "Level 1 – Junior Referee",
      issued: referee.licenseIssuedDate ? referee.licenseIssuedDate.split("T")[0] : new Date().toISOString().split("T")[0],
      validUntil: referee.licenseValidUntil ? referee.licenseValidUntil.split("T")[0] : "",
      state: referee.state,
      district: referee.district,
      academy: referee.academy || "Independent Official",
      status: "Valid",
    } as any);
  };

  return (
    <DistrictAccessGate
      pageTitle="Affiliated Referee List"
      pageSubtitle={`Directory of accredited and certified referees under ${districtScope || "your district"}.`}
      badge="District Referee Directorate"
    >
      <div className="space-y-6">
        {/* TOP STATS & ACTIONS BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-card/60 border border-border/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Scale className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Affiliated Referees
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {filteredReferees.length}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                District: <span className="font-semibold text-foreground">{districtScope || "All Districts"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-border/80 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by referee name, ID, license #, rank, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3 relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedRegType}
              onChange={(e) => setSelectedRegType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs text-foreground focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
            >
              <option value="All">All Referee Levels</option>
              {REFEREE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 relative">
            <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedCertIssued}
              onChange={(e) => setSelectedCertIssued(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs text-foreground focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
            >
              <option value="All">All Certificate Status</option>
              <option value="Yes">Certificate Issued</option>
              <option value="No">Certificate Not Issued</option>
            </select>
          </div>
        </div>

        {/* AFFILIATED REFEREES TABLE VIEW */}
        <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="size-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Loading affiliated referees...</p>
            </div>
          ) : filteredReferees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-muted border border-border/80 text-muted-foreground flex items-center justify-center mx-auto">
                <Scale className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Affiliated Referees Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No active or certified referees currently match the criteria in {districtScope || "this district"}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Official / Referee</th>
                    <th className="py-3 px-4">Level / Grade</th>
                    <th className="py-3 px-4">Rank &amp; Academy</th>
                    <th className="py-3 px-4">Super Admin ID Card</th>
                    <th className="py-3 px-4">Certificate Issued</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredReferees.map((r) => {
                    const hasIdCard = checkHasIdCard(r);
                    const hasCert = Boolean(r.licenseNumber);
                    return (
                      <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full overflow-hidden bg-muted border border-border/80 shrink-0 flex items-center justify-center">
                              {r.photo ? (
                                <img src={r.photo} alt={r.name} className="size-full object-cover" />
                              ) : (
                                <Scale className="size-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{r.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{r.id}</p>
                              {r.kalawarId && r.kalawarId !== r.id && (
                                <p className="text-[9.5px] font-mono text-amber-400">ID: {r.kalawarId}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {r.level || "Level 1 – Junior Referee"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-foreground">{r.currentRank || "None / Unranked"}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {r.academy || "Independent Official"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          {hasIdCard ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="size-3" />
                              Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertCircle className="size-3" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* CERTIFICATE ISSUED COLUMN */}
                        <td className="py-3.5 px-4">
                          {hasCert ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                                <Award className="size-3 text-amber-400" />
                                {r.licenseNumber}
                              </span>
                              {r.licenseValidUntil && (
                                <p className="text-[9.5px] text-muted-foreground mt-0.5">
                                  Valid: {r.licenseValidUntil.split("T")[0]}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Not Issued
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW BUTTON */}
                            <button
                              type="button"
                              onClick={() => setViewingReferee(r)}
                              className="p-1.5 rounded-lg border border-border/80 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
                              title="View Official Profile & Credentials"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* REISSUE CERTIFICATE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleOpenReissueModal(r)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                              title="Reissue Certificate"
                            >
                              <Award className="size-3.5" />
                              <span>Reissue Certificate</span>
                            </button>

                            {/* DOWNLOAD CERTIFICATE PDF */}
                            {hasCert && (
                              <button
                                type="button"
                                onClick={() => handleDownloadCert(r)}
                                className="p-1.5 rounded-lg border border-border/80 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 transition cursor-pointer"
                                title="Download Official Certificate PDF"
                              >
                                <Download className="size-3.5" />
                              </button>
                            )}

                            {/* PRINT CERTIFICATE */}
                            {hasCert && (
                              <button
                                type="button"
                                onClick={() => handlePrintCert(r)}
                                className="p-1.5 rounded-lg border border-border/80 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                title="Print Certificate Slip"
                              >
                                <Printer className="size-3.5" />
                              </button>
                            )}

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleDeleteReferee(r.id, r.name)}
                              className="p-1.5 rounded-lg border border-border/80 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="size-3.5" />
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

        {/* RE-ISSUE CERTIFICATE POPUP MODAL (Matching club affiliation module layout) */}
        {certTargetReferee && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-5 max-h-[92vh] overflow-y-auto bg-stone-950 text-stone-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="size-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Re-Issue Official Referee Certificate</h3>
                    <p className="text-xs text-stone-400">
                      {certTargetReferee.name} ({certTargetReferee.id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertTargetReferee(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-900 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleReissueCertSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Certificate / License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={certFormData.licenseNumber}
                    onChange={(e) => setCertFormData({ ...certFormData, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-400"
                    placeholder="e.g. KAC-REF-2026-012"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Accreditation Level *
                  </label>
                  <select
                    value={certFormData.level}
                    onChange={(e) => setCertFormData({ ...certFormData, level: e.target.value as RefereeLevel })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  >
                    {REFEREE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Current Rank / Dan Belt</label>
                    <input
                      type="text"
                      value={certFormData.currentRank}
                      onChange={(e) => setCertFormData({ ...certFormData, currentRank: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                      placeholder="e.g. 1st Dan Black Belt"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Academy / Organization</label>
                    <input
                      type="text"
                      value={certFormData.academy}
                      onChange={(e) => setCertFormData({ ...certFormData, academy: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
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
                    <label className="block font-bold text-stone-300 mb-1">State / UT</label>
                    <input
                      type="text"
                      value={certFormData.state}
                      onChange={(e) => setCertFormData({ ...certFormData, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">District</label>
                    <input
                      type="text"
                      value={certFormData.district}
                      onChange={(e) => setCertFormData({ ...certFormData, district: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Notification Email</label>
                    <input
                      type="email"
                      value={certFormData.email}
                      onChange={(e) => setCertFormData({ ...certFormData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">Contact Phone</label>
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
                    onClick={() => setCertTargetReferee(null)}
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

        {/* REFEREE DETAILS & CERTIFICATE PREVIEW MODAL */}
        {viewingReferee && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 max-h-[92vh] overflow-y-auto bg-card text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full overflow-hidden bg-muted border border-border/80 flex items-center justify-center">
                    {viewingReferee.photo ? (
                      <img src={viewingReferee.photo} alt={viewingReferee.name} className="size-full object-cover" />
                    ) : (
                      <Scale className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{viewingReferee.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {viewingReferee.id} {viewingReferee.kalawarId ? `• ID: ${viewingReferee.kalawarId}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingReferee(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-muted cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* OFFICIAL CERTIFICATE PREVIEW IF ISSUED */}
              {viewingReferee.licenseNumber && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Accreditation Certificate</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadCert(viewingReferee)}
                        className="px-2.5 py-1 rounded-lg border border-border/80 hover:bg-accent text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="size-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintCert(viewingReferee)}
                        className="px-2.5 py-1 rounded-lg border border-border/80 hover:bg-accent text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="size-3" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                  <RefereeCertificateView
                    certificate={{
                      id: viewingReferee.id,
                      number: viewingReferee.licenseNumber,
                      holder: viewingReferee.name,
                      kalawarId: viewingReferee.kalawarId || viewingReferee.id,
                      email: viewingReferee.email,
                      phone: viewingReferee.phone,
                      type: "Referee / Technical Official Certificate",
                      event: "National Technical Official & Referee Accreditation",
                      position: viewingReferee.level || "Level 1 – Junior Referee",
                      issued: viewingReferee.licenseIssuedDate ? viewingReferee.licenseIssuedDate.split("T")[0] : new Date().toISOString().split("T")[0],
                      validUntil: viewingReferee.licenseValidUntil ? viewingReferee.licenseValidUntil.split("T")[0] : "",
                      state: viewingReferee.state,
                      district: viewingReferee.district,
                      academy: viewingReferee.academy || "Independent Official",
                      status: "Valid",
                    } as any}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Certificate / License Number</p>
                  <p className="font-mono font-bold text-amber-400">
                    {viewingReferee.licenseNumber || "Not Issued Yet"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Accredited Level</p>
                  <p className="font-bold text-foreground">{viewingReferee.level || "Level 1 – Junior Referee"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Martial Arts Rank</p>
                  <p className="font-bold text-foreground">{viewingReferee.currentRank || "None / Unranked"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Affiliated Academy</p>
                  <p className="font-bold text-foreground">{viewingReferee.academy || "Independent Official"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{viewingReferee.email}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground font-mono">{viewingReferee.phone}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">License Validity Period</p>
                  <p className="font-medium text-foreground">
                    {viewingReferee.licenseIssuedDate ? viewingReferee.licenseIssuedDate.split("T")[0] : "—"} to{" "}
                    {viewingReferee.licenseValidUntil ? viewingReferee.licenseValidUntil.split("T")[0] : "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Super Admin ID Card</p>
                  <p className="font-bold">
                    {checkHasIdCard(viewingReferee) ? (
                      <span className="text-emerald-400">Generated &amp; Active</span>
                    ) : (
                      <span className="text-amber-400">Not Generated</span>
                    )}
                  </p>
                </div>
              </div>

              {/* UPLOADED DOCUMENTS / PROOFS */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Documents &amp; Proofs</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingReferee.certificationDocument && (
                    <button
                      type="button"
                      onClick={() => openFileInFullSize(viewingReferee.certificationDocument)}
                      className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="size-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">
                            {viewingReferee.certificationDocumentName || "Dan / Rank Proof Document"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Rank Proof</p>
                        </div>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-amber-400 shrink-0 ml-2" />
                    </button>
                  )}

                  {viewingReferee.aadhaarDoc && (
                    <button
                      type="button"
                      onClick={() => openFileInFullSize(viewingReferee.aadhaarDoc)}
                      className="p-3 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <ShieldCheck className="size-4 text-primary shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">
                            {viewingReferee.aadhaarDocName || "Identity / Aadhaar Proof"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Identity Proof</p>
                        </div>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setViewingReferee(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingReferee;
                    setViewingReferee(null);
                    handleOpenReissueModal(target);
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="size-3.5" />
                  <span>Reissue Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DistrictAccessGate>
  );
}
