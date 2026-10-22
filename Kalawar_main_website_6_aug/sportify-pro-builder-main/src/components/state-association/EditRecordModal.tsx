"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  CheckCircle,
  CheckCircle2,
  X,
  Loader2,
  GraduationCap,
  Plus,
  Trash2,
  Landmark,
  ShieldCheck,
  MapPin,
  Award,
  Clock,
  Activity,
  Trophy,
  Phone,
  Mail,
  Calendar,
  Image as ImageIcon,
  FileCheck,
  UploadCloud,
  HeartPulse,
  Droplet,
  UserCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { states, disciplines } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";

export interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "club" | "coach" | "player";
  record: any | null;
  stateScope?: string;
  onSaved?: () => void;
  onSuccess?: () => void;
}

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

const disciplineNames = disciplines.map((d) => (typeof d === "string" ? d : d.name));

export function EditRecordModal({
  isOpen,
  onClose,
  recordType,
  record,
  stateScope,
  onSaved,
  onSuccess,
}: EditRecordModalProps) {
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [newAchievementInput, setNewAchievementInput] = useState("");
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [availableClubs, setAvailableClubs] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Fetch coaches & clubs for dynamic linking
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/coaches")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.coaches || [];
        setAvailableCoaches(list);
      })
      .catch(() => {});

    fetch("/api/clubs")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.clubs || [];
        setAvailableClubs(list);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (record) {
      const stateVal = record.state || stateScope || "Maharashtra";
      const batchesVal = Array.isArray(record.batches)
        ? JSON.parse(JSON.stringify(record.batches))
        : record.batches
        ? typeof record.batches === "string"
          ? JSON.parse(record.batches)
          : []
        : [];

      const facilitiesVal = Array.isArray(record.facilities)
        ? [...record.facilities]
        : [];

      const achievementsVal = Array.isArray(record.achievements)
        ? [...record.achievements]
        : [];

      const coachIdsVal = Array.isArray(record.coachIds)
        ? [...record.coachIds]
        : record.coachId
        ? [record.coachId]
        : [];

      setDraft({
        ...record,
        id: record.id || "",
        image: record.image || record.photo || record.logo || "",
        logo: record.logo || record.image || record.photo || "",
        name: record.name || record.fullName || "",
        email: record.email || "",
        phone: record.phone || record.contactNo || "",
        alternatePhone: record.alternatePhone || "",
        state: stateVal,
        discipline: record.discipline || "Kalawar Martial Arts",
        dob: record.dob || record.dateOfBirth || "",
        gender: record.gender || "Male",
        ageGroup: record.ageGroup || record.category || "",
        weightCategory: record.weightCategory || record.weight || "",
        beltRank: record.beltRank || record.danBelt || record.currentRank || "1st Dan Black Belt",
        bloodGroup: record.bloodGroup || "",
        club: record.club || record.academy || "",
        coachName: record.coachName || record.assignedCoach || "",
        idNumber: record.idNumber || record.aadhaar || "",
        emergencyContact: record.emergencyContact || "",
        city: record.city || record.district || "",
        district: record.district || record.city || "",
        pincode: record.pincode || record.pinCode || "",
        address: record.address || record.registeredAddress || "",
        registeredAddress: record.registeredAddress || record.address || "",
        status: record.status || "Active",
        points: record.points || 0,
        // Coach specific
        qualification: record.qualification || record.level || "Level 1 - State Certified",
        level: record.level || record.qualification || "Level 1 - State Certified",
        specialization: record.specialization || "",
        experienceYears: record.experienceYears ?? record.experience ?? 4,
        bio: record.bio || "",
        affiliationDocument: record.affiliationDocument || record.documentUrl || "",
        affiliationDocumentName: record.affiliationDocumentName || "",
        // Club specific
        registrationNumber: record.registrationNumber || "",
        affiliationCertificateId: record.affiliationCertificateId || "",
        validFrom: record.validFrom || record.affiliationDate || "2026-01-01",
        validUntil: record.validUntil || record.validityDate || "2027-12-31",
        paymentStatus: record.paymentStatus || "Paid",
        paymentMethod: record.paymentMethod || "Razorpay",
        registrationType: record.registrationType || "Apply for Affiliation",
        headCoachName: record.headCoachName || record.contactPerson || "",
        presidentName: record.presidentName || "",
        secretaryName: record.secretaryName || "",
        yearFounded: record.yearFounded || "",
        memberCount: record.memberCount || "",
        website: record.website || "",
        timings: record.timings || "Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM",
        batches: batchesVal,
        facilities: facilitiesVal,
        achievements: achievementsVal,
        coachIds: coachIdsVal,
        // Academic history for players
        academicHistory: Array.isArray(record.academicHistory)
          ? JSON.parse(JSON.stringify(record.academicHistory))
          : [],
      });
    }
  }, [record, stateScope]);

  if (!isOpen || !record) return null;

  const availableDistricts = getDistrictsByState(draft.state || stateScope || "Maharashtra");

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds 2MB limit", { description: "Please upload an image under 2MB." });
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(10);
      const formattedSize = formatFileSize(file.size);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `kalawar_${recordType}s`);

      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const res = await new Promise<{ ok: boolean; data?: any }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 90);
            setUploadProgress((curr) => Math.max(curr, pct));
          }
        };
        xhr.onload = () => {
          clearInterval(timer);
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch {
            resolve({ ok: false });
          }
        };
        xhr.onerror = () => {
          clearInterval(timer);
          resolve({ ok: false });
        };
        xhr.send(fd);
      });

      if (!res.ok || !res.data?.url) {
        throw new Error(res.data?.error || "Failed to upload image");
      }

      setUploadProgress(100);
      setDraft((prev) => ({
        ...prev,
        image: res.data.url,
        photo: res.data.url,
        logo: res.data.url,
        imageName: file.name,
        imageSize: formattedSize,
      }));
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds 2MB limit", { description: "Please upload a document under 2MB." });
      return;
    }

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `kalawar_docs_${recordType}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload document");
      }

      setDraft((prev) => ({
        ...prev,
        affiliationDocument: data.url,
        affiliationDocumentName: file.name,
        documentUrl: data.url,
      }));
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      console.error("Doc upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleToggleFacility = (fac: string) => {
    const list = draft.facilities || [];
    if (list.includes(fac)) {
      setDraft({ ...draft, facilities: list.filter((f: string) => f !== fac) });
    } else {
      setDraft({ ...draft, facilities: [...list, fac] });
    }
  };

  const handleAddCustomFacility = () => {
    if (!customFacilityInput.trim()) return;
    const item = customFacilityInput.trim();
    const list = draft.facilities || [];
    if (!list.includes(item)) {
      setDraft({ ...draft, facilities: [...list, item] });
    }
    setCustomFacilityInput("");
  };

  const handleRemoveFacility = (fac: string) => {
    const list = draft.facilities || [];
    setDraft({ ...draft, facilities: list.filter((f: string) => f !== fac) });
  };

  const handleAddAchievement = () => {
    if (!newAchievementInput.trim()) return;
    const item = newAchievementInput.trim();
    const list = draft.achievements || [];
    setDraft({ ...draft, achievements: [...list, item] });
    setNewAchievementInput("");
  };

  const handleRemoveAchievement = (idx: number) => {
    const list = draft.achievements || [];
    setDraft({ ...draft, achievements: list.filter((_: any, i: number) => i !== idx) });
  };

  const handleAddBatchSlot = () => {
    const batches = draft.batches || [];
    setDraft({
      ...draft,
      batches: [...batches, { name: "Evening Batch", time: "05:00 PM - 06:30 PM (All Ages)" }],
    });
  };

  const handleBatchChange = (index: number, field: "name" | "time", value: string) => {
    const batches = [...(draft.batches || [])];
    batches[index] = { ...batches[index], [field]: value };
    setDraft({ ...draft, batches });
  };

  const handleRemoveBatch = (index: number) => {
    const batches = (draft.batches || []).filter((_: any, i: number) => i !== index);
    setDraft({ ...draft, batches });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name?.trim()) {
      toast.error(
        recordType === "club"
          ? "Club / Academy Name is required"
          : "Full Name is required"
      );
      return;
    }

    try {
      setIsSaving(true);
      let endpoint = `/api/players/${encodeURIComponent(record.id)}`;
      if (recordType === "club") {
        endpoint = `/api/clubs/${encodeURIComponent(record.id)}`;
      } else if (recordType === "coach") {
        endpoint = `/api/coaches/${encodeURIComponent(record.id)}`;
      }

      const payload = {
        ...draft,
        id: record.id,
        memberType: recordType === "coach" ? "Coach" : recordType === "club" ? "Club" : "Player",
      };

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        toast.success(
          `${recordType === "club" ? "Academy" : recordType === "coach" ? "Coach" : "Athlete"} profile updated successfully!`,
          {
            description: `Saved records for ${draft.name} (${record.id})`,
          }
        );
        onSaved?.();
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || "Failed to save details");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-gold-500/40 bg-stone-950 text-stone-200 rounded-3xl shadow-2xl">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-900/90 border-b border-stone-800 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {recordType === "club" ? (
              <Landmark className="w-5 h-5 text-amber-400" />
            ) : recordType === "coach" ? (
              <User className="w-5 h-5 text-amber-400" />
            ) : (
              <UserCheck className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <DialogTitle className="text-base font-bold text-white">
                {recordType === "club"
                  ? "Edit Affiliated Academy & Dojo"
                  : recordType === "coach"
                  ? "Edit Coach Profile & Credentials"
                  : "Edit Athlete & Player Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-400 font-mono">
                {recordType === "club"
                  ? `Official Federation Registry • ${draft.id || record.id}`
                  : recordType === "coach"
                  ? `Federation Official Registry • ${draft.id || record.id}`
                  : `Federation Athlete Registry • ${draft.id || record.id}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* ========================================================================= */}
          {/* 1. CLUB EDIT FORM (MATCHES ADMIN PANEL EXACTLY)                           */}
          {/* ========================================================================= */}
          {recordType === "club" && (
            <>
              {/* SECTION 1: Visual Branding (Academy Logo) */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>1. Visual Branding (Academy Logo)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    Academy Logo (Square Icon / Emblem)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />

                  {draft.logo || draft.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/60 p-3">
                      <div className="flex items-center gap-4">
                        <div className="size-20 rounded-xl bg-black/60 border border-stone-700 flex items-center justify-center p-2 overflow-hidden shrink-0">
                          <img
                            src={draft.logo || draft.image}
                            alt="Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-bold text-stone-200 truncate">
                            {draft.imageName || "Academy Logo Attached"}
                          </p>
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="size-3" /> Logo active on public registry
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                            >
                              Replace Logo
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, logo: "", image: "" })}
                              className="text-xs text-red-400 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-800 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-950/60 hover:bg-stone-900/60"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="size-8 text-amber-400 animate-spin" />
                          <p className="text-xs font-bold text-stone-200">
                            Uploading Logo ({uploadProgress}%)...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-10 rounded-full bg-amber-400/15 text-amber-400 grid place-items-center">
                            <Upload className="size-5" />
                          </div>
                          <p className="text-xs font-bold text-stone-200">
                            Click to Upload Image
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Supports JPG, PNG, WEBP, GIF (Up to 2MB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Identification & Official Affiliation */}
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
                      value={draft.name || ""}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
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
                      value={draft.id || ""}
                      onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60 text-amber-400"
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
                      value={draft.discipline || "Kalawar Martial Arts"}
                      onChange={(e) => setDraft({ ...draft, discipline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Society / Trust Registration No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MAH/1482/2018/PUNE"
                      value={draft.registrationNumber || ""}
                      onChange={(e) => setDraft({ ...draft, registrationNumber: e.target.value })}
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
                      value={draft.affiliationCertificateId || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, affiliationCertificateId: e.target.value })
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocUpload(file);
                    }}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {draft.affiliationDocument ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono text-stone-200 truncate">
                          {draft.affiliationDocumentName ||
                            draft.affiliationDocument.split("/").pop() ||
                            "Document Attached"}
                        </span>
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
                            {draft.affiliationDocument ? "Replace Document" : "Upload Document (<2MB)"}
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
                      value={draft.validFrom || ""}
                      onChange={(e) => setDraft({ ...draft, validFrom: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Valid Until Date
                    </label>
                    <input
                      type="date"
                      value={draft.validUntil || ""}
                      onChange={(e) => setDraft({ ...draft, validUntil: e.target.value })}
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
                      value={draft.status || "Active"}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
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
                      value={draft.paymentStatus || "Paid"}
                      onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    >
                      <option value="Paid">Paid (Verified)</option>
                      <option value="Pending">Pending Payment</option>
                      <option value="Cash Verification Required">Cash Verification Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Payment Mode
                    </label>
                    <select
                      value={draft.paymentMethod || "Razorpay"}
                      onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}
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

              {/* SECTION 3: Location & Registered Dojo Address */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>3. Location &amp; Registered Dojo Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      State Association *
                    </label>
                    <select
                      value={draft.state || stateScope || "Maharashtra"}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        const dists = getDistrictsByState(nextState);
                        setDraft({
                          ...draft,
                          state: nextState,
                          district: dists[0] || "",
                        });
                      }}
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
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      District *
                    </label>
                    <select
                      value={draft.district || ""}
                      onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      <option value="">Select District</option>
                      {availableDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      City / Area / Town
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shivajinagar / Bandra"
                      value={draft.city || ""}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })}
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
                      value={draft.registeredAddress || draft.address || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
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
                      value={draft.pincode || ""}
                      onChange={(e) => setDraft({ ...draft, pincode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Certified Coaches & Staff Roster */}
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
                      value={draft.headCoachName || ""}
                      onChange={(e) => setDraft({ ...draft, headCoachName: e.target.value })}
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
                      value={draft.presidentName || ""}
                      onChange={(e) => setDraft({ ...draft, presidentName: e.target.value })}
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
                      value={draft.secretaryName || ""}
                      onChange={(e) => setDraft({ ...draft, secretaryName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                {/* Link registered coaches with Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Link Registered Coaches from Federation Database:
                  </label>
                  <select
                    value={
                      Array.isArray(draft.coachIds) && draft.coachIds.length > 0
                        ? draft.coachIds[0]
                        : ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedCoach = availableCoaches.find((c) => c.id === selectedId);
                      setDraft({
                        ...draft,
                        coachIds: selectedId ? [selectedId] : [],
                        headCoachName: draft.headCoachName || selectedCoach?.name || "",
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

              {/* SECTION 5: Batch Timings */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>5. Batch Timings</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Official Training Hours / Timings
                  </label>
                  <input
                    type="text"
                    placeholder="Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM"
                    value={draft.timings || ""}
                    onChange={(e) => setDraft({ ...draft, timings: e.target.value })}
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
                        Configure the batch cards displayed under Disciplines &amp; Timings
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
                    {(draft.batches || []).map((batch: any, idx: number) => (
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
                            value={batch.name || ""}
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
                            value={batch.time || ""}
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

                    {(draft.batches || []).length === 0 && (
                      <div className="p-3 rounded-xl bg-stone-950 border border-dashed border-stone-800 text-center text-xs text-stone-400">
                        No specific batch slots added. Click &quot;+ Add Batch&quot; above to add customized batch schedules.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 6: Facilities & Amenities Checklist */}
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
                      const checked = (draft.facilities || []).includes(fac);
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
                  {(draft.facilities || []).filter((f: string) => !STANDARD_FACILITIES.includes(f)).length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-stone-400 uppercase">
                        Custom Added Amenities:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(draft.facilities || [])
                          .filter((f: string) => !STANDARD_FACILITIES.includes(f))
                          .map((customFac: string) => (
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

              {/* SECTION 7: Academy Honors & Achievements */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>7. Academy Honors &amp; Achievements</span>
                </h4>

                <div className="space-y-2">
                  <div className="space-y-2">
                    {(draft.achievements || []).map((ach: string, idx: number) => (
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

              {/* SECTION 8: Contact, Statistics & Academy Bio */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>8. Contact, Statistics &amp; Academy Bio</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Founded Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2016"
                      value={draft.yearFounded || ""}
                      onChange={(e) => setDraft({ ...draft, yearFounded: e.target.value })}
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
                      value={draft.memberCount || ""}
                      onChange={(e) => setDraft({ ...draft, memberCount: e.target.value })}
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
                      value={draft.website || ""}
                      onChange={(e) => setDraft({ ...draft, website: e.target.value })}
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
                      value={draft.phone || ""}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
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
                      value={draft.alternatePhone || ""}
                      onChange={(e) => setDraft({ ...draft, alternatePhone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@kalawar-academy.org"
                    value={draft.email || ""}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Academy Bio &amp; Institutional Overview
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Official description of the academy, teaching philosophy, training facilities..."
                    value={draft.bio || ""}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 2. COACH EDIT FORM (MATCHES ADMIN PANEL 4 FIELDSETS)                      */}
          {/* ========================================================================= */}
          {recordType === "coach" && (
            <>
              {/* FIELDSET 1: PERSONAL & IDENTITY DETAILS */}
              <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/70 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Personal &amp; Identity Details</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">Section 1 of 4</span>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                    Coach Profile Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />

                  {draft.image || draft.photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/60 p-3">
                      <div className="flex items-center gap-4">
                        <div className="size-20 rounded-xl bg-black/60 border border-stone-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                          <img
                            src={draft.image || draft.photo}
                            alt="Coach Preview"
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-bold text-stone-200 truncate">
                            {draft.imageName || "Coach Profile Photo Attached"}
                          </p>
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="size-3" /> Photo verified
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                            >
                              Replace Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, image: "", photo: "" })}
                              className="text-xs text-red-400 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-stone-800 rounded-xl p-5 text-center cursor-pointer hover:border-amber-400 transition-colors bg-stone-900/40"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="size-6 text-amber-400 animate-spin" />
                          <p className="text-xs font-bold text-stone-200">
                            Uploading Photo ({uploadProgress}%)...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className="size-5 text-amber-400" />
                          <p className="text-xs font-semibold text-stone-300">
                            Click to upload Coach Photo (PNG/JPG max 2MB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coach Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Rajesh Sharma"
                      value={draft.name || ""}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Federation Coach ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={draft.id || ""}
                      onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-400 outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Registration Type Dropdown */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center justify-between">
                      <span>Registration Type <span className="text-red-400">*</span></span>
                      <span className="text-[10px] text-amber-400 font-mono">Mandatory field</span>
                    </label>
                    <select
                      required
                      value={draft.registrationType || "Apply For Coach"}
                      onChange={(e) => setDraft({ ...draft, registrationType: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white font-semibold outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Choose Registration type">Choose Registration type</option>
                      <option value="Apply For Coach">Apply For Coach</option>
                      <option value="Already a Coach">Already a Coach</option>
                      <option value="Senior Master Coach">Senior Master Coach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      value={draft.dob || ""}
                      onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">Gender</label>
                    <select
                      value={draft.gender || "Male"}
                      onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-400" />
                      <span>Blood Group</span>
                    </label>
                    <select
                      value={draft.bloodGroup || ""}
                      onChange={(e) => setDraft({ ...draft, bloodGroup: e.target.value })}
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

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Govt ID / Aadhaar / Passport Ref</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234-5678-9012 or Passport No."
                      value={draft.idNumber || ""}
                      onChange={(e) => setDraft({ ...draft, idNumber: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coach Bio / Professional Statement
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write a brief professional summary about martial arts experience, credentials, or achievements..."
                      value={draft.bio || ""}
                      onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
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
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Primary Email Address</span>
                    </label>
                    <input
                      type="email"
                      placeholder="coach@example.com"
                      value={draft.email || ""}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mobile / Phone Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={draft.phone || ""}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      <span>Emergency Contact (Name &amp; Phone Number)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma (Spouse / Parent) - +91 98765 43210"
                      value={draft.emergencyContact || ""}
                      onChange={(e) => setDraft({ ...draft, emergencyContact: e.target.value })}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      State Association Unit
                    </label>
                    <select
                      value={draft.state || stateScope || "Maharashtra"}
                      onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {states.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      District Association *
                    </label>
                    <select
                      value={draft.city || draft.district || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, city: e.target.value, district: e.target.value })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">Select District Association</option>
                      {availableDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Full Residential Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="House / Flat No., Street, Landmark, Area"
                      value={draft.address || draft.registeredAddress || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          address: e.target.value,
                          registeredAddress: e.target.value,
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Postal / PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 411001"
                      value={draft.pincode || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        })
                      }
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
                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Primary Discipline
                    </label>
                    <select
                      value={draft.discipline || "Kalawar Martial Arts"}
                      onChange={(e) => setDraft({ ...draft, discipline: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {disciplineNames.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coaching Qualification / License
                    </label>
                    <select
                      value={draft.qualification || draft.level || "Level 1 - State Certified"}
                      onChange={(e) =>
                        setDraft({ ...draft, qualification: e.target.value, level: e.target.value })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {COACH_QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Coaching Specialization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. High Performance & Youth Development"
                      value={draft.specialization || ""}
                      onChange={(e) => setDraft({ ...draft, specialization: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Belt Rank / Dan Grade
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3rd Dan Black Belt / Senior Master"
                      value={draft.beltRank || ""}
                      onChange={(e) => setDraft({ ...draft, beltRank: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-600 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={draft.experienceYears ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, experienceYears: Number(e.target.value) || 0 })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Affiliated Academy / Club
                    </label>
                    <select
                      value={draft.club || draft.academy || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, club: e.target.value, academy: e.target.value })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Independent (No Affiliation)">Independent (No Affiliation)</option>
                      {availableClubs.map((cl) => (
                        <option key={cl.id} value={cl.name}>
                          {cl.name} ({cl.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-400 mb-1">
                      Accreditation Status
                    </label>
                    <select
                      value={draft.status || "Verified"}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Verified">Verified / Active</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Incomplete">Incomplete</option>
                    </select>
                  </div>

                  {/* Proof Document Upload */}
                  <div className="md:col-span-2 space-y-2 pt-2 border-t border-stone-800">
                    <label className="block text-xs font-semibold text-stone-300">
                      Prior Coaching License / Black Belt Proof Document
                    </label>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocUpload(file);
                      }}
                      className="hidden"
                    />

                    {draft.affiliationDocument ? (
                      <div className="p-3 rounded-xl bg-stone-950 border border-amber-400/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-stone-200">
                            {draft.affiliationDocumentName ||
                              draft.affiliationDocument.split("/").pop() ||
                              "Coach_Credential_Document.pdf"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              affiliationDocument: "",
                              affiliationDocumentName: "",
                            })
                          }
                          className="text-xs text-red-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => docInputRef.current?.click()}
                        className="border border-dashed border-stone-800 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 transition-colors"
                      >
                        <span className="text-xs text-amber-400 hover:underline font-semibold flex items-center justify-center gap-1.5">
                          {isUploadingDoc ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Uploading document...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" /> Click to upload certificate proof (PDF/PNG/JPG max 2MB)
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 3. PLAYER EDIT FORM (MATCHES ADMIN PANEL ATHLETE SECTIONS)                */}
          {/* ========================================================================= */}
          {recordType === "player" && (
            <>
              {/* SECTION 1: Athlete Photo & Core Identity */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>1. Athlete Photo &amp; Core Identity</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    Athlete Profile Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />

                  {draft.image || draft.photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/60 p-3">
                      <div className="flex items-center gap-4">
                        <div className="size-20 rounded-xl bg-black/60 border border-stone-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                          <img
                            src={draft.image || draft.photo}
                            alt="Athlete Preview"
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-bold text-stone-200 truncate">
                            {draft.imageName || "Athlete Photo Attached"}
                          </p>
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="size-3" /> Profile Photo Active
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                            >
                              Replace Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, image: "", photo: "" })}
                              className="text-xs text-red-400 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-800 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-950/60 hover:bg-stone-900/60"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="size-8 text-amber-400 animate-spin" />
                          <p className="text-xs font-bold text-stone-200">
                            Uploading Athlete Photo ({uploadProgress}%)...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-10 rounded-full bg-amber-400/15 text-amber-400 grid place-items-center">
                            <Upload className="size-5" />
                          </div>
                          <p className="text-xs font-bold text-stone-200">
                            Click to Upload Athlete Profile Photo
                          </p>
                          <p className="text-[11px] text-stone-400">
                            PNG, JPG, WebP up to 2MB (Cloudinary)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Athlete Full Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Mehra"
                      value={draft.name || ""}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Federation Athlete ID <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={draft.id || ""}
                      onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-gold-500/60 text-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Email Address <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="athlete@example.com"
                      value={draft.email || ""}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Phone Number <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={draft.phone || ""}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={draft.dob || ""}
                      onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Gender</label>
                    <select
                      value={draft.gender || "Male"}
                      onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Blood Group
                    </label>
                    <select
                      value={draft.bloodGroup || ""}
                      onChange={(e) => setDraft({ ...draft, bloodGroup: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      <option value="">Select Blood Group</option>
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Aadhaar / National ID
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      value={draft.idNumber || ""}
                      onChange={(e) => setDraft({ ...draft, idNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Emergency Contact (Name &amp; Phone)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Mehra (+91 98111 22233)"
                      value={draft.emergencyContact || ""}
                      onChange={(e) => setDraft({ ...draft, emergencyContact: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Sports Accreditation & Affiliations */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>2. Sports Accreditation &amp; Affiliations</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Discipline / Sport <span className="text-primary">*</span>
                    </label>
                    <select
                      value={draft.discipline || "Kalawar Martial Arts"}
                      onChange={(e) => setDraft({ ...draft, discipline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      {disciplineNames.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Belt Rank / Dan
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Dan Black Belt, Brown Belt"
                      value={draft.beltRank || ""}
                      onChange={(e) => setDraft({ ...draft, beltRank: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Age Group / Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. U-14, U-17, Senior"
                      value={draft.ageGroup || ""}
                      onChange={(e) => setDraft({ ...draft, ageGroup: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Weight Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 35–38 kg, Open Weight"
                      value={draft.weightCategory || ""}
                      onChange={(e) => setDraft({ ...draft, weightCategory: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Club / Academy
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Titan Athletic Club"
                      value={draft.club || ""}
                      onChange={(e) => setDraft({ ...draft, club: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Coach Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Coach David"
                      value={draft.coachName || ""}
                      onChange={(e) => setDraft({ ...draft, coachName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Accreditation Status
                    </label>
                    <select
                      value={draft.status || "Active"}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      {["Active", "Pending", "Incomplete", "Suspended", "Verified"].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Regional Location & Address */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>3. Regional Location &amp; Residential Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      State Association *
                    </label>
                    <select
                      value={draft.state || stateScope || "Maharashtra"}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        const dists = getDistrictsByState(nextState);
                        setDraft({
                          ...draft,
                          state: nextState,
                          district: dists[0] || "",
                        });
                      }}
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
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      District Association *
                    </label>
                    <select
                      value={draft.district || draft.city || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, district: e.target.value, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 cursor-pointer"
                    >
                      <option value="">Select District Association</option>
                      {availableDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      placeholder="400001"
                      value={draft.pincode || ""}
                      onChange={(e) => setDraft({ ...draft, pincode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Full Residential Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="102, Shanti Heights, MG Road"
                      value={draft.address || draft.registeredAddress || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          address: e.target.value,
                          registeredAddress: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Academic & Academy Transfer History */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>4. Academic &amp; Academy Transfer History</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full">
                    {((draft.academicHistory as any[]) || []).length} Recorded
                  </span>
                </div>

                <div className="space-y-3">
                  {((draft.academicHistory as any[]) || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
                        <span className="text-xs font-bold text-stone-200">
                          Academy Record #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (draft.academicHistory as any[]).filter(
                              (_: any, i: number) => i !== idx
                            );
                            setDraft({ ...draft, academicHistory: next });
                          }}
                          className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-0.5 rounded-lg font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="size-3" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Academy / Institute Name *
                          </label>
                          <input
                            type="text"
                            value={item.academy || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], academy: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            placeholder="e.g. Apex Martial Arts Academy"
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Degree / Certification
                          </label>
                          <input
                            type="text"
                            value={item.degree || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], degree: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            placeholder="e.g. Black Belt 1st Dan"
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            value={item.fieldOfStudy || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], fieldOfStudy: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            placeholder="e.g. Taekwondo / Athletics"
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Starting Date
                          </label>
                          <input
                            type="date"
                            value={item.startDate || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], startDate: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Ending Date
                          </label>
                          <input
                            type="date"
                            value={item.endDate || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], endDate: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                            Description / Notes
                          </label>
                          <textarea
                            rows={2}
                            value={item.description || ""}
                            onChange={(e) => {
                              const next = [...(draft.academicHistory as any[])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setDraft({ ...draft, academicHistory: next });
                            }}
                            placeholder="Training milestones, tournament achievements..."
                            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const current = (draft.academicHistory as any[]) || [];
                      setDraft({
                        ...draft,
                        academicHistory: [
                          ...current,
                          {
                            academy: "",
                            degree: "",
                            fieldOfStudy: "",
                            startDate: "",
                            endDate: "",
                            description: "",
                          },
                        ],
                      });
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-amber-400/40 text-amber-400 hover:bg-amber-400/5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5" /> + Add Academy History Entry
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Modal Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800 sticky bottom-0 bg-stone-950/95 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploadingImage || isUploadingDoc}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImage || isUploadingDoc}
              className="bg-gold-gradient text-stone-950 px-7 py-2.5 rounded-xl text-xs font-extrabold shadow-gold hover:opacity-95 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              <span>
                {recordType === "club"
                  ? "Update Academy Profile"
                  : recordType === "coach"
                  ? "Save Coach Profile"
                  : "Save Athlete Profile"}
              </span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
