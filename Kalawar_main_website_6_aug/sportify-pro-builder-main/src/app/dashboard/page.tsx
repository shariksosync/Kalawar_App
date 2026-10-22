"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Award,
  CalendarDays,
  FileText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  Building,
  Briefcase,
  Droplet,
  Shield,
  HeartPulse,
  LogOut,
  UploadCloud,
  X,
  Share2,
  RefreshCw,
  Info,
  GraduationCap,
  Plus,
  School,
  Users,
  UserCheck,
  Download,
  ExternalLink,
  CreditCard,
  Printer,
  Receipt,
  Image as ImageIcon,
  Trophy,
  Activity,
  Globe,
  Building2,
  Landmark,
  FileCheck,
} from "lucide-react";
import QRCode from "react-qr-code";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Reveal } from "@/components/common/Reveal";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import type { Player, Discipline, MemberType, AcademicHistoryEntry, BatchScheduleEntry } from "@/data/people";
import { disciplines, states } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import { REFEREE_LEVELS, DUTY_POSITIONS, normalizeRefereeLevel } from "@/types/referee";
import {
  getClubDropdownOptions,
  getCoachDropdownOptions,
  resolveSelectedOption,
  INDEPENDENT_CLUB,
  INDEPENDENT_COACH,
} from "@/lib/club-coach-options";
import { IMAGES } from "@/data/images";
import { toast } from "sonner";
import { ShareModal } from "@/components/shop/ShareModal";
import {
  validatePhoneNumber,
  validateEmergencyContact,
  sanitizePhoneInput,
  validateAddress,
  validatePincode,
  validateCity,
} from "@/lib/validation";
import { downloadFile, formatToDDMMYYYY, formatMemberType } from "@/lib/utils";
import { PhotoCropperModal } from "@/components/ui/PhotoCropperModal";
import { downloadRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const DEFAULT_BATCHES: BatchScheduleEntry[] = [
  { name: "Cadet / Junior Batch", time: "05:00 PM - 06:30 PM (Ages 6-14)" },
  { name: "Senior Competitors", time: "06:30 PM - 08:30 PM (Ages 15+)" },
  { name: "Morning Sparring", time: "06:00 AM - 08:00 AM (Elite squad)" },
  { name: "Special Batch", time: "07:00 PM - 08:30 PM (All Belts)" },
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

type TabType = "overview" | "documents" | "personal" | "sports" | "academy" | "address" | "security";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, setUser, refreshUser } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  const [clubOptions, setClubOptions] = useState<string[]>(() => getClubDropdownOptions());
  const [coachOptions, setCoachOptions] = useState<string[]>(() => getCoachDropdownOptions());

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [hasNotifiedIncomplete, setHasNotifiedIncomplete] = useState(false);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [newAchievementInput, setNewAchievementInput] = useState("");

  // Change Avatar Modal State
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarFileSize, setAvatarFileSize] = useState("");
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Cropper Modal State
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  // Change Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete Account Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Registration Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Print Registration Receipt
  const handlePrintReceipt = () => {
    if (!player) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Registration Receipt - ${player.id}</title>
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
              <div class="logo-text">${settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}</div>
              <div class="subtitle">Official Member Registration Receipt Slip</div>
              <div class="badge">RECEIPT REF: REC-REG-${player.id}</div>
            </div>
            <div class="cred-box">
              <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">Verified Membership ID</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: monospace;">${player.id}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary Email: ${player.email || "Registered Member"}</div>
            </div>
            <table class="grid">
              <tr><td class="label">Member Name</td><td class="val">${player.name.toUpperCase()}</td></tr>
              <tr><td class="label">Classification / Role</td><td class="val">${formatMemberType(player.memberType)}</td></tr>
              ${player.discipline ? `<tr><td class="label">Sports Discipline</td><td class="val">${player.discipline}</td></tr>` : ""}
              ${player.ageGroup ? `<tr><td class="label">Age Division</td><td class="val">${player.ageGroup}</td></tr>` : ""}
              ${player.weightCategory ? `<tr><td class="label">Weight Category</td><td class="val">${player.weightCategory}</td></tr>` : ""}
              <tr><td class="label">State Association Unit</td><td class="val">${player.state}, India</td></tr>
              ${player.club ? `<tr><td class="label">Affiliated Club / Academy</td><td class="val">${player.club}</td></tr>` : ""}
              <tr><td class="label">Registration Date</td><td class="val">${formatToDDMMYYYY(player.registeredOn, "Recorded")}</td></tr>
              <tr><td class="label">Accreditation Status</td><td class="val" style="color: #15803d;">${player.status || "Active"} (Recorded in National Ledger)</td></tr>
            </table>
            <div class="footer">
              <p>This is an authentic digital registration receipt issued by ${settings.federationName || "KALAWAR Sports & Martial Arts Federation of India"}.</p>
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

  // Load Profile Function
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const res = await fetch(`/api/players/${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.player) {
            setPlayer(data.player);
            return;
          }
        }
      }

      // Fallback: If logged in or guest, attempt to fetch from players API
      const res = await fetch("/api/players");
      const data = await res.json();
      if (data.success && Array.isArray(data.players) && data.players.length > 0) {
        if (user?.id) {
          const found = data.players.find(
            (p: Player) =>
              p.id.toLowerCase() === user.id.toLowerCase() ||
              (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
          );
          if (found) {
            setPlayer(found);
            return;
          }
        }
        // If not authenticated or no matching ID, take the first profile for preview
        setPlayer(data.players[0]);
      } else {
        setPlayer(null);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("receipt") === "true") {
        setReceiptModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    async function loadDynamicOptions() {
      try {
        const [clubsRes, coachesRes] = await Promise.all([
          fetch("/api/clubs"),
          fetch("/api/coaches"),
        ]);
        const [clubsJson, coachesJson] = await Promise.all([
          clubsRes.json(),
          coachesRes.json(),
        ]);
        if (clubsJson?.success && Array.isArray(clubsJson.clubs)) {
          setClubOptions(getClubDropdownOptions(clubsJson.clubs));
        }
        if (coachesJson?.success && Array.isArray(coachesJson.coaches)) {
          setCoachOptions(getCoachDropdownOptions(coachesJson.coaches));
        }
      } catch (err) {
        console.warn("Using default clubs & coaches for profile edit dropdowns.");
      }
    }
    loadDynamicOptions();
  }, []);

  // Notify player with toast if Photo, Address, or Academic History is missing
  useEffect(() => {
    if (player && !hasNotifiedIncomplete) {
      const isPlayer = !player.memberType || player.memberType === "Player";
      const hasPhoto = Boolean(player.image && player.image.trim().length > 0 && !player.image.includes("1500648767791-00dcc994a43e") && !player.image.includes("avatar-1.jpg"));
      const hasCity = Boolean(player.city && player.city.trim().length >= 2);
      const hasAddr = Boolean((player.address || player.registeredAddress) && (player.address || player.registeredAddress)!.trim().length >= 4);
      const hasPin = Boolean(player.pincode && /^\d{6}$/.test(player.pincode.trim().replace(/\D/g, "")));
      const hasAddressComplete = hasCity && hasAddr && hasPin;
      const hasAcademicHistory = Boolean(
        player.academicHistory &&
        player.academicHistory.length > 0 &&
        player.academicHistory.some((a) => a.academy && a.academy.trim().length >= 2)
      );

      const isIncomplete =
        player.status === "Incomplete" ||
        !hasPhoto ||
        !hasAddressComplete ||
        !hasAcademicHistory;

      if (isPlayer && isIncomplete) {
        toast.warning("Profile Incomplete", {
          description: "Please Complete Your Profile: Upload your official Photo, provide your Residential Address (City, Address, PIN), and Academic history.",
          duration: 7000,
        });
        setHasNotifiedIncomplete(true);
      }
    }
  }, [player, hasNotifiedIncomplete]);

  // Check if player's official ID card has been approved by admin
  const [userHasApprovedIdCard, setUserHasApprovedIdCard] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkIdCardStatus() {
      if (!player?.id) {
        setUserHasApprovedIdCard(null);
        return;
      }
      try {
        const res = await fetch(`/api/id-cards/${encodeURIComponent(player.id)}`);
        const data = await res.json();
        if (data.success && data.card && (data.card.status === "Active" || data.card.status === "Approved")) {
          setUserHasApprovedIdCard(true);
        } else {
          setUserHasApprovedIdCard(false);
        }
      } catch {
        setUserHasApprovedIdCard(false);
      }
    }
    checkIdCardStatus();
  }, [player?.id]);

  // Batch helpers for Club
  const handleAddBatchSlot = () => {
    const current = editForm.batches || [];
    setEditForm({
      ...editForm,
      batches: [...current, { name: "", time: "" }],
    });
  };

  const handleRemoveBatch = (index: number) => {
    const current = editForm.batches || [];
    setEditForm({
      ...editForm,
      batches: current.filter((_, i) => i !== index),
    });
  };

  const handleBatchChange = (index: number, field: "name" | "time", value: string) => {
    const current = [...(editForm.batches || [])];
    current[index] = { ...current[index], [field]: value };
    setEditForm({ ...editForm, batches: current });
  };

  // Facility helpers for Club
  const handleToggleFacility = (fac: string) => {
    const current = editForm.facilities || [];
    if (current.includes(fac)) {
      setEditForm({ ...editForm, facilities: current.filter((f) => f !== fac) });
    } else {
      setEditForm({ ...editForm, facilities: [...current, fac] });
    }
  };

  const handleAddCustomFacility = () => {
    if (!customFacilityInput.trim()) return;
    const current = editForm.facilities || [];
    if (!current.includes(customFacilityInput.trim())) {
      setEditForm({ ...editForm, facilities: [...current, customFacilityInput.trim()] });
    }
    setCustomFacilityInput("");
  };

  const handleRemoveFacility = (fac: string) => {
    const current = editForm.facilities || [];
    setEditForm({ ...editForm, facilities: current.filter((f) => f !== fac) });
  };

  // Achievement helpers for Club
  const handleAddAchievement = () => {
    if (!newAchievementInput.trim()) return;
    const current = editForm.achievements || [];
    setEditForm({ ...editForm, achievements: [...current, newAchievementInput.trim()] });
    setNewAchievementInput("");
  };

  const handleRemoveAchievement = (index: number) => {
    const current = editForm.achievements || [];
    setEditForm({ ...editForm, achievements: current.filter((_, i) => i !== index) });
  };

  // Open Edit Modal with current data
  const handleOpenEdit = () => {
    if (!player) return;
    setEditForm({
      ...player,
      name: player.name || "",
      username: player.username || "",
      dob: player.dob || "",
      gender: player.gender || "Male",
      bloodGroup: player.bloodGroup || "",
      email: player.email || "",
      phone: player.phone || "",
      alternatePhone: player.alternatePhone || "",
      emergencyContact: player.emergencyContact || "",
      bio: player.bio || "",
      state: player.state || states[0] || "Maharashtra",
      district: player.district || "",
      city: player.city || "",
      address: player.address || player.registeredAddress || "",
      registeredAddress: player.registeredAddress || player.address || "",
      pincode: player.pincode || "",
      discipline: player.discipline || "Kalawar Martial Arts",
      disciplines: player.disciplines || [],
      club: player.club || "Independent",
      coachName: player.coachName || "",
      beltRank: player.beltRank || "",
      ageGroup: player.ageGroup || "",
      weightCategory: player.weightCategory || "",
      idNumber: player.idNumber || "",
      qualification: player.qualification || "",
      experienceYears: player.experienceYears || "",
      specialization: player.specialization || "Mat / Ring Referee",
      officiatingGrade: player.officiatingGrade || (player as any).level || "Level 0 – Trainee Referee",
      level: (player as any).level || player.officiatingGrade || "Level 0 – Trainee Referee",
      matchesOfficiated: player.matchesOfficiated || "",
      yearFounded: player.yearFounded || "",
      registrationNumber: player.registrationNumber || "",
      affiliationCertificateId: player.affiliationCertificateId || "",
      headCoachName: player.headCoachName || "",
      presidentName: player.presidentName || "",
      secretaryName: player.secretaryName || "",
      memberCount: player.memberCount || "",
      website: player.website || "",
      timings: player.timings || "",
      logo: player.logo || "",
      image: player.image || "",
      batches: player.batches && player.batches.length > 0 ? JSON.parse(JSON.stringify(player.batches)) : [...DEFAULT_BATCHES],
      facilities: player.facilities ? [...player.facilities] : [],
      achievements: player.achievements ? [...player.achievements] : [],
      photos: player.photos ? [...player.photos] : [],
      affiliationDocument: player.affiliationDocument || "",
      affiliationDocumentName: player.affiliationDocumentName || "",
      affiliationDocumentSize: player.affiliationDocumentSize || "",
      academicHistory:
        player.academicHistory && player.academicHistory.length > 0
          ? JSON.parse(JSON.stringify(player.academicHistory))
          : [{ academy: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" }],
    });
    setCustomFacilityInput("");
    setNewAchievementInput("");
    setEditModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDocumentUpload = async (file: File, updateDirectly = false) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload a document under 2MB." });
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setUploadingDoc(true);
    setDocUploadProgress(5);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "wsf_club_documents");

      const timer = setInterval(() => {
        setDocUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          const step = Math.floor(Math.random() * 12) + 6;
          return Math.min(90, prev + step);
        });
      }, 100);

      const res = await new Promise<{ ok: boolean; data?: any }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 90);
            setDocUploadProgress((curr) => Math.max(curr, pct));
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
        xhr.send(formData);
      });

      if (!res.ok || !res.data?.success || !res.data?.url) {
        throw new Error(res.data?.error || "Failed to upload document");
      }

      setDocUploadProgress(100);
      await new Promise((r) => setTimeout(r, 400));

      const docUrl = res.data.url;
      const docName = file.name;
      const docSize = formattedSize;

      setEditForm((prev) => ({
        ...prev,
        affiliationDocument: docUrl,
        affiliationDocumentName: docName,
        affiliationDocumentSize: docSize,
      }));

      if (updateDirectly && player?.id) {
        const updateRes = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliationDocument: docUrl,
            affiliationDocumentName: docName,
            affiliationDocumentSize: docSize,
          }),
        });
        const updateData = await updateRes.json();
        if (updateData.success && updateData.player) {
          setPlayer(updateData.player);
          toast.success("Affiliation Document Updated!", {
            description: `${docName} (${docSize}) attached to your profile.`,
          });
          return;
        }
      }

      toast.success("Document attached", { description: `${docName} (${docSize})` });
    } catch (err: any) {
      console.error("Doc upload error:", err);
      toast.error("Document upload failed", {
        description: err.message || "Could not upload file to storage",
      });
    } finally {
      setUploadingDoc(false);
      setDocUploadProgress(0);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player?.id) return;

    const isClub = player.memberType === "Club" || editForm.memberType === "Club" || player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL");

    if (editForm.phone && editForm.phone.trim()) {
      const phoneValidation = validatePhoneNumber(editForm.phone, {
        required: false,
        fieldName: "Phone number",
      });
      if (!phoneValidation.isValid) {
        toast.error("Invalid Phone Number", {
          description: phoneValidation.error,
        });
        return;
      }
    }

    if (!isClub && editForm.emergencyContact && editForm.emergencyContact.trim()) {
      const emergencyValidation = validateEmergencyContact(editForm.emergencyContact, {
        required: false,
      });
      if (!emergencyValidation.isValid) {
        toast.error("Invalid Emergency Contact", {
          description: emergencyValidation.error,
        });
        return;
      }
    }

    // Photo/Logo check
    const hasPhoto = isClub
      ? Boolean((editForm.logo && editForm.logo.trim().length > 0) || (editForm.image && editForm.image.trim().length > 0) || (player.logo && player.logo.trim().length > 0) || (player.image && player.image.trim().length > 0))
      : Boolean((editForm.image && editForm.image.trim().length > 0) || (player.image && player.image.trim().length > 0));

    if (!hasPhoto && !isClub) {
      toast.error("Profile Photo Required", {
        description: "Please upload your official profile photo before saving changes.",
      });
      return;
    }

    // Clean academic history entries
    const cleanedHistory = (editForm.academicHistory || []).filter(
      (a) => a.academy && a.academy.trim()
    );

    const isPlayer = !isClub && (!player.memberType || player.memberType === "Player");

    if (isPlayer) {
      const cityVal = validateCity(editForm.city, { required: true, fieldName: "City / District" });
      if (!cityVal.isValid) {
        toast.error("City / District Required", { description: cityVal.error });
        return;
      }

      const addrVal = validateAddress(editForm.address, {
        required: true,
        fieldName: "Full Residential Address",
        minLength: 4,
      });
      if (!addrVal.isValid) {
        toast.error("Residential Address Required", { description: addrVal.error });
        return;
      }

      const pinVal = validatePincode(editForm.pincode, { required: true, fieldName: "Postal / PIN Code" });
      if (!pinVal.isValid) {
        toast.error("Postal / PIN Code Required", { description: pinVal.error });
        return;
      }

      if (!cleanedHistory || cleanedHistory.length === 0) {
        toast.error("Academic & Sports History Required", {
          description: "Please add at least 1 past or current sports academy, school, or training institute.",
        });
        return;
      }

      if (editForm.username && editForm.username.trim().length > 0 && editForm.username.trim().length < 3) {
        toast.error("Invalid Username", { description: "Username must be at least 3 characters long." });
        return;
      }
    }

    const isReferee = player.memberType === "Referee" || player.id.startsWith("KSM-RF-") || player.id.startsWith("WSF-RF-");
    const normalizedLevel = (editForm.level || editForm.officiatingGrade)
      ? normalizeRefereeLevel(editForm.level || editForm.officiatingGrade)
      : undefined;

    const resolvedAddress = editForm.registeredAddress || editForm.address || "";
    const resolvedLogo = editForm.logo || (isClub ? editForm.image : undefined);
    const resolvedImage = isClub ? (editForm.image || editForm.logo) : editForm.image;

    const payload = {
      ...editForm,
      ...(isPlayer && editForm.username !== undefined ? { username: editForm.username.trim().toLowerCase() } : {}),
      ...(isClub ? {
        address: resolvedAddress,
        registeredAddress: resolvedAddress,
        logo: resolvedLogo,
        image: resolvedImage,
      } : {
        academicHistory: cleanedHistory,
      }),
      ...(isReferee && normalizedLevel ? { level: normalizedLevel, officiatingGrade: normalizedLevel } : {}),
      ...(isReferee && editForm.beltRank ? { currentRank: editForm.beltRank } : {}),
      ...(editForm.affiliationDocument ? {
        certificationDocument: editForm.affiliationDocument,
        certificationDocumentName: editForm.affiliationDocumentName,
        certificationDocumentSize: editForm.affiliationDocumentSize,
      } : {}),
    };

    setIsSaving(true);
    try {
      const prevStatus = player.status;
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setPlayer(data.player);
      setEditModalOpen(false);

      if (data.player.status === "Pending" && prevStatus === "Incomplete") {
        toast.success("Profile Completed & Verified!", {
          description: "Your Address & Academic History have been submitted. Profile state shifted to Pending Verification.",
        });
      } else {
        toast.success("Profile Updated Successfully!", {
          description: isClub
            ? "Your official academy profile details have been synchronized."
            : "Your official federation profile details have been synchronized.",
        });
      }

      // Update global auth context
      setUser({
        id: data.player.id,
        name: data.player.name,
        email: data.player.email,
        role: user?.role || "member",
        discipline: data.player.discipline,
        avatar: data.player.logo || data.player.image,
      });
    } catch (error: any) {
      console.error("Save profile error:", error);
      toast.error(error.message || "Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Upload / Select (Open Crop Modal)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !player?.id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File Type", {
        description: "Please upload a valid image file (JPG, PNG, WebP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File Exceeds 5MB Limit", {
        description: `Selected file is ${formatFileSize(file.size)}. Maximum allowed size is 5MB.`,
      });
      return;
    }

    setAvatarFileName(file.name);
    setAvatarFileSize(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropSourceUrl(dataUrl);
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle saving cropped photo
  const handleCropComplete = async (blob: Blob, dataUrl: string) => {
    if (!player?.id) return;
    const isClub = player.memberType === "Club" || player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL");
    setIsApplyingCrop(true);
    try {
      const formData = new FormData();
      const croppedFile = new File([blob], `${isClub ? "club-logo" : "player-id"}-${player.id}.jpg`, { type: "image/jpeg" });
      formData.append("file", croppedFile);
      formData.append("folder", isClub ? "clubs/logos" : "wsf_athletes");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let finalUrl = dataUrl;
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          finalUrl = json.url;
        }
      }

      await handleApplyAvatar(finalUrl, false);
      setUploadedPreviewUrl(finalUrl);
      setCropperModalOpen(false);
      setAvatarModalOpen(false);
      toast.success(isClub ? "Academy Logo Saved!" : "Profile Photo Saved!", {
        description: isClub
          ? "Your official academy emblem / logo has been updated."
          : "Your photo has been fitted and saved to standard ID card specifications.",
      });
    } catch (err: any) {
      console.error("Failed to save cropped image:", err);
      toast.error(err.message || "Failed to save cropped photo");
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleApplyAvatar = async (imageUrl: string, closeModal = true) => {
    if (!player?.id || !imageUrl.trim()) return;
    const isClub = player.memberType === "Club" || player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL");

    try {
      const payload = isClub
        ? { logo: imageUrl.trim(), image: imageUrl.trim() }
        : { image: imageUrl.trim() };

      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile photo");
      }

      setPlayer(data.player);
      setEditForm((prev) => ({
        ...prev,
        image: data.player.image,
        logo: data.player.logo || data.player.image,
      }));
      if (closeModal) {
        setAvatarModalOpen(false);
      }

      setUser({
        id: data.player.id,
        name: data.player.name,
        email: data.player.email,
        role: user?.role || "member",
        discipline: data.player.discipline,
        avatar: data.player.logo || data.player.image,
      });
    } catch (err: any) {
      toast.error(err.message || "Could not update avatar");
    }
  };

  // Change Password Handler (UPDATE Security)
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player?.id) return;

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordModalOpen(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast.success("Password Updated Successfully!", {
        description: "Your login security credentials have been updated.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Delete / Deactivate Profile (DELETE Operation)
  const handleDeleteAccount = async () => {
    if (!player?.id) return;

    if (deleteConfirmText.trim().toLowerCase() !== player.id.toLowerCase()) {
      toast.error(`Please type "${player.id}" to confirm deletion`);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete account");
      }

      await logout();
      setDeleteModalOpen(false);
      toast.success("Profile Deleted", {
        description: "Your federation profile has been permanently removed.",
      });
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyId = () => {
    if (player?.id) {
      navigator.clipboard.writeText(player.id);
      setCopied(true);
      toast.success("Member ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || authLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading member profile...</p>
        </div>
      </SiteLayout>
    );
  }

  const fedName = settings?.federationName || "KALAWAR Sports & Martial Arts Federation of India";
  const displayName = player?.name || user?.name || "Athlete";
  const isCoach =
    player?.memberType === "Coach" ||
    user?.memberType === "Coach" ||
    (player?.id && (player.id.startsWith("KSM-CO") || player.id.startsWith("WSF-CO") || player.id.startsWith("KAC-CO"))) ||
    (user?.id && (user.id.startsWith("KSM-CO") || user.id.startsWith("WSF-CO") || user.id.startsWith("KAC-CO")));
  const isClub =
    player?.memberType === "Club" ||
    user?.memberType === "Club" ||
    (player?.id && (player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL") || player.id.startsWith("KAC-CL"))) ||
    (user?.id && (user.id.startsWith("KSM-CL") || user.id.startsWith("WSF-CL") || user.id.startsWith("KAC-CL")));
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Member Portal"
        title="My Profile & Credentials"
        description={`Manage your official athlete profile, personal details, sports affiliation, tournament medals, and federation credentials.`}
        image={IMAGES.training}
      />

      <section className="py-12">
        <div className="shell max-w-6xl">
          {player ? (
            <div className="space-y-8">
              {/* Approval Pending Status Alert Banner */}
              {player.status === "Pending" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-200">
                        Membership Application Under Review
                      </p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Your {formatMemberType(player.memberType)} registration is undergoing verification by the federation secretariat. You may update your profile details at any time using the Edit Profile button.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Profile Incomplete Status Alert Banner */}
              {player.status === "Incomplete" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertCircle className="size-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-200">
                        Profile Incomplete — Mandatory Requirements Missing
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Official Athlete profiles require a verified Profile Photo, Residential Address (City, Address, PIN), and Academic History to proceed to federation verification.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${player.image && !player.image.includes("1500648767791-00dcc994a43e") && !player.image.includes("avatar-1.jpg") ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/40"}`}>
                          Photo: {player.image && !player.image.includes("1500648767791-00dcc994a43e") && !player.image.includes("avatar-1.jpg") ? "Complete" : "Missing"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${player.city && (player.address || player.registeredAddress) && player.pincode ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/40"}`}>
                          Address &amp; PIN: {player.city && (player.address || player.registeredAddress) && player.pincode ? "Complete" : "Missing"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${player.academicHistory && player.academicHistory.length > 0 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/40"}`}>
                          Academy History: {player.academicHistory && player.academicHistory.length > 0 ? "Complete" : "Missing"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(!player.image || player.image.includes("1500648767791-00dcc994a43e") || player.image.includes("avatar-1.jpg")) && (
                      <button
                        type="button"
                        onClick={() => setAvatarModalOpen(true)}
                        className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-full px-4 py-2 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Upload Photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="bg-gold-gradient text-background rounded-full px-4 py-2 text-xs font-bold shadow-gold cursor-pointer"
                    >
                      Complete Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Main Profile Header Card */}
              <div className="luxe-card p-5 sm:p-8 rounded-3xl border border-border/80 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
                  {/* Avatar + Basic Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
                    {/* Avatar with Edit Overlay */}
                    <div className="relative group shrink-0">
                      <div className="size-20 sm:size-24 rounded-2xl overflow-hidden border-2 border-primary/40 bg-background shadow-gold/20 shadow-lg">
                        {(() => {
                          const isClub = player.memberType === "Club" || player.id?.startsWith("KSM-CL") || player.id?.startsWith("WSF-CL");
                          const displayImg = isClub ? (player.logo || player.image) : player.image;
                          const hasValidImg = Boolean(
                            displayImg &&
                            !displayImg.includes("1500648767791-00dcc994a43e") &&
                            !displayImg.includes("avatar-1.jpg")
                          );

                          return hasValidImg ? (
                            <img
                              src={displayImg}
                              alt={player.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="size-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-2xl">
                              {initials}
                            </div>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAvatarModalOpen(true)}
                        title={player.memberType === "Club" ? "Update Academy Logo" : "Change profile photo"}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold cursor-pointer backdrop-blur-2xs"
                      >
                        <Camera className="size-5 text-primary" />
                        <span>{player.memberType === "Club" ? "Logo" : "Change"}</span>
                      </button>
                    </div>

                    {/* Name, Member Type, ID & Badges */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider">
                          {formatMemberType(player.memberType)}
                        </span>
                        <span className="rounded-full bg-accent text-foreground border border-border/80 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-semibold">
                          Kalawar Martial Arts
                        </span>
                        {player.status === "Active" ? (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Active Member
                          </span>
                        ) : player.status === "Suspended" ? (
                          <span className="rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold inline-flex items-center gap-1">
                            <AlertCircle className="size-3" /> Suspended
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="size-3" /> Pending Review
                          </span>
                        )}
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight break-words">
                        {player.name}
                      </h1>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground pt-0.5">
                        <button
                          type="button"
                          onClick={handleCopyId}
                          title="Click to copy official member ID"
                          className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          <span>{player.id}</span>
                          {copied ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3 opacity-70" />
                          )}
                        </button>
                        <span>·</span>
                        {(!player.memberType || player.memberType === "Player") && player.username && (
                          <>
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-md">
                              <span>@{player.username}</span>
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span>{player.state}</span>
                        <span>·</span>
                        <span>{player.club || "Independent"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Action Buttons (CRUD Trigger) */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="col-span-2 sm:col-span-1 bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs font-bold shadow-gold hover:opacity-95 transition-all cursor-pointer"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit Profile</span>
                    </button>

                    <Link
                      href="/my-id-card"
                      className="border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-bold transition-all text-center"
                      title="View Official Digital ID Card"
                    >
                      <CreditCard className="size-3.5" />
                      <span>My ID Card</span>
                    </Link>

                    <Link
                      href="/my-certificates"
                      className="border border-border/80 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-foreground inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold transition-all text-center"
                      title="View issued certificates"
                    >
                      <Award className="size-3.5 text-primary" />
                      <span>Certificates</span>
                    </Link>

                    <Link
                      href="/my-receipts"
                      className="border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-bold transition-all cursor-pointer text-center"
                      title="View & Download Official Registration Receipts Hub"
                    >
                      <Receipt className="size-3.5" />
                      <span>Receipt Slip</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShareModalOpen(true)}
                      className="col-span-2 sm:col-span-1 border border-border/80 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-foreground inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2.5 text-[11.5px] sm:text-xs font-semibold transition-all cursor-pointer text-center"
                      title="Share athlete profile"
                    >
                      <Share2 className="size-3.5 text-primary" />
                      <span>Share Profile</span>
                    </button>
                  </div>
                </div>

                {/* Quick Bio preview if filled */}
                {player.bio && (
                  <div className="mt-6 pt-5 border-t border-border/60">
                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-accent/20 p-3.5 rounded-2xl border border-border/50">
                      "{player.bio}"
                    </p>
                  </div>
                )}
              </div>

              {/* Tournament Ranking & Medal Statistics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="luxe-card p-5 rounded-2xl border border-border/70 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Federation Rank
                  </span>
                  <p className="text-2xl font-extrabold text-foreground">
                    #{player.rank || 1}
                  </p>
                  <p className="text-[10px] text-muted-foreground">National Standing</p>
                </div>

                <div className="luxe-card p-5 rounded-2xl border border-border/70 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Ranking Points
                  </span>
                  <p className="text-2xl font-extrabold text-primary">
                    {player.points || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Official Merit Score</p>
                </div>

                <div className="luxe-card p-5 rounded-2xl border border-border/70 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Medals Won
                  </span>
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-0.5 text-amber-400 text-sm font-extrabold" title="Gold Medals">
                      🥇 {player.medals?.gold || 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-slate-300 text-sm font-extrabold" title="Silver Medals">
                      🥈 {player.medals?.silver || 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 text-sm font-extrabold" title="Bronze Medals">
                      🥉 {player.medals?.bronze || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tournament Podiums</p>
                </div>

                <div className="luxe-card p-5 rounded-2xl border border-border/70 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Member Since
                  </span>
                  <p className="text-lg font-bold text-foreground truncate">
                    {formatToDDMMYYYY(player.registeredOn, "2026")}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold">Registered</p>
                </div>
              </div>

              {/* Incomplete Profile Alert Banner */}
              {(() => {
                const isPlayer = !player.memberType || player.memberType === "Player";
                const hasCity = Boolean(player.city && player.city.trim().length >= 2);
                const hasAddr = Boolean((player.address || player.registeredAddress) && (player.address || player.registeredAddress)!.trim().length >= 4);
                const hasPin = Boolean(player.pincode && /^\d{6}$/.test(player.pincode.trim().replace(/\D/g, "")));
                const hasAddressComplete = hasCity && hasAddr && hasPin;
                const hasAcademicHistory = Boolean(
                  player.academicHistory &&
                  player.academicHistory.length > 0 &&
                  player.academicHistory.some((a) => a.academy && a.academy.trim().length >= 2)
                );
                const isProfileIncomplete = isPlayer && (
                  player.status === "Incomplete" ||
                  !hasAddressComplete ||
                  !hasAcademicHistory
                );

                if (!isProfileIncomplete) return null;

                return (
                  <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-primary/10 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 grid place-items-center shrink-0 shadow-sm">
                          <AlertCircle className="size-5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                              ⚠️ Profile State: Incomplete
                            </span>
                            <span className="text-xs font-bold text-foreground">Action Required</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            To complete your athlete onboarding and attain official <strong className="text-foreground">Pending Verification</strong> status, please provide both your residential address details and previous/current sports academies or schools.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              hasAddressComplete
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            }`}>
                              <MapPin className="size-3" />
                              {hasAddressComplete ? "Address & PIN: Complete" : "Address & PIN: Missing"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              hasAcademicHistory
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            }`}>
                              <GraduationCap className="size-3" />
                              {hasAcademicHistory ? "Academy History: Complete" : "Academy History: Missing"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEdit();
                        }}
                        className="bg-gold-gradient text-background font-bold text-xs px-5 py-2.5 rounded-full shadow-gold hover:opacity-95 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        <Edit3 className="size-4" /> + Complete Required Details
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Official Registration Receipt Card */}
              <div className="luxe-card p-5 sm:p-6 rounded-3xl border border-primary/30 bg-gradient-to-r from-card/90 via-primary/5 to-card/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center shrink-0 shadow-sm">
                    <Receipt className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gold-gradient font-bold text-xs uppercase tracking-wider">
                        Official Registration Receipt
                      </span>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold font-mono">
                        REC-REG-{player.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      View or print your official digitized registration voucher, credentials, and state federation ledger enrollment details.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                  <Link
                    href="/my-receipts"
                    className="border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none"
                  >
                    <Receipt className="size-3.5" />
                    <span>View All Receipts</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="border border-border/80 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-foreground inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-none"
                  >
                    <Printer className="size-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>

              {/* Club Portal Quick Action Banners */}
              {player.memberType === "Club" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/club/confirm-coach"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-primary/10 border border-primary/30 hover:border-primary transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <UserCheck className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <span>Confirm Coach Requests</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review &amp; approve coach affiliation requests
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/club/coaches"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>Affiliated Coach List</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          View confirmed coaches &amp; manage club staff roster
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/club/confirm-player"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-primary/10 border border-primary/30 hover:border-primary transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <UserCheck className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <span>Confirm Player Requests</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review &amp; approve athlete affiliation requests
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/club/players"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>Affiliated Player List</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          View confirmed athletes &amp; manage club player roster
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Coach Portal Quick Action Banners */}
              {player.memberType === "Coach" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/coach/confirm-player"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-primary/10 border border-primary/30 hover:border-primary transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <UserCheck className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <span>Confirm Player Requests</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review &amp; approve athlete mentorship requests
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/coach/players"
                    className="group p-5 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>Affiliated Player List</span>
                          <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          View confirmed athletes &amp; manage coaching roster
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Navigation Tabs for Profile Details */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 pb-3">
                {[
                  { id: "overview", label: "All Details (Read View)", icon: User },
                  { id: "documents", label: "Official Documents & Certificates", icon: FileText },
                  { id: "personal", label: "Personal & Contact", icon: Phone },
                  { id: "sports", label: "Sports & Rank", icon: Award },
                  ...((!player.memberType || player.memberType === "Player")
                    ? [{ id: "academy", label: "Academy & Academic History", icon: GraduationCap }]
                    : []),
                  { id: "address", label: "Address & Location", icon: MapPin },
                  { id: "security", label: "Security & Account", icon: Lock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent hover:border-border/60"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW (Displays EVERY Field & Detail Filled By User) */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Section 0.5: For Coaches - Coaching Accreditation & License Status */}
                  {isCoach && (
                    <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-card via-card to-amber-500/5 space-y-5 shadow-lg">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Briefcase className="size-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              Coach Accreditation &amp; License Record
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Official Coaching License, Specialization &amp; Federation Credentials
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
                          {player.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Coach Full Name
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.name}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Primary Discipline
                          </span>
                          <p className="font-bold text-primary text-sm">{player.discipline}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Coaching Qualification / License
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.qualification || "State Certified Coach"}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Coaching Specialization / Dan Rank
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.specialization || player.beltRank || "1st Dan Black Belt"}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Coaching Experience
                          </span>
                          <p className="font-bold text-foreground text-sm">
                            {player.experienceYears ? `${player.experienceYears} Years` : "Experienced Professional"}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Affiliated Club / Academy
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.club || "Independent Dojo"}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            State Association
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.state}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Registration Type
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.registrationType || "Certified Coach"}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Accreditation Status
                          </span>
                          <p className="font-bold text-emerald-400 text-sm">{player.status || "Active"}</p>
                        </div>
                      </div>

                      {/* Official Proof Document / License Certificate */}
                      {player.affiliationDocument && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="p-4 rounded-2xl bg-card/80 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                <FileText className="size-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                    Official Coach License / Certification Proof
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Verified &amp; Attached
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                                  {player.affiliationDocumentName || "Coach_License_Proof.pdf"} {player.affiliationDocumentSize && `(${player.affiliationDocumentSize})`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <a
                                href={player.affiliationDocument}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/80 hover:bg-accent text-foreground text-xs font-semibold border border-border transition-colors"
                              >
                                <Eye className="size-3.5" /> View
                              </a>
                              <button
                                type="button"
                                onClick={() => downloadFile(player.affiliationDocument, player.affiliationDocumentName || "Coach_License_Proof.pdf")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                <Download className="size-3.5" /> Download
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 0: For Clubs - Governance & Official Affiliation Document */}
                  {player.memberType === "Club" && (
                    <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 space-y-5">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                            <Building className="size-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              Club Governance &amp; Federation Status
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Registered institutional leadership and official state affiliation
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-bold font-mono">
                          {player.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Club / Academy Name
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.name}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Primary Discipline
                          </span>
                          <p className="font-bold text-primary text-sm">{player.discipline}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            State Unit Affiliation
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.state}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            President / Director
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.presidentName || player.name}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Secretary Name
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.secretaryName || "Not specified"}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Year Founded &amp; Athletes
                          </span>
                          <p className="font-bold text-foreground text-sm">
                            Est. {player.yearFounded || "N/A"} · {player.memberCount || 0} Registered Athletes
                          </p>
                        </div>
                      </div>

                      {/* Official Affiliation Document Card inside Overview */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="p-4 rounded-2xl bg-card/80 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                              <FileText className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                  Official Affiliation Document / Certificate
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  player.affiliationDocument
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                }`}>
                                  {player.affiliationDocument ? "Verified & Attached" : "Pending Attachment"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                                {player.affiliationDocumentName || (player.affiliationDocument ? "Official_Affiliation_Document.pdf" : "No document attached yet")} {player.affiliationDocumentSize && `(${player.affiliationDocumentSize})`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {player.affiliationDocument ? (
                              <>
                                <a
                                  href={player.affiliationDocument}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/80 hover:bg-accent text-foreground text-xs font-semibold border border-border transition-colors"
                                >
                                  <Eye className="size-3.5" /> View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(player.affiliationDocument, player.affiliationDocumentName || "Official_Affiliation_Document.pdf")}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                  <Download className="size-3.5" /> Download
                                </button>
                              </>
                            ) : (
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer">
                                <UploadCloud className="size-3.5" /> Attach Document
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDocumentUpload(file, true);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section A: Personal & Contact Information */}
                  <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <User className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Personal & Contact Details
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Official identification and athlete contact records
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Full Legal Name
                        </span>
                        <p className="font-bold text-foreground text-sm">{player.name}</p>
                      </div>

                      {(!player.memberType || player.memberType === "Player") && (
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                            <User className="size-3 text-primary" /> Login Username
                          </span>
                          <p className="font-bold text-foreground text-sm font-mono">
                            {player.username ? `@${player.username}` : "Not set (Click Edit to add)"}
                          </p>
                        </div>
                      )}

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Date of Birth & Age
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {formatToDDMMYYYY(player.dob, "Not specified")} ({player.age || calculateAge(player.dob)} years)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Gender
                        </span>
                        <p className="font-bold text-foreground text-sm">{player.gender || "Male"}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                          <Droplet className="size-3 text-rose-400" /> Blood Group
                        </span>
                        <p className="font-bold text-rose-400 text-sm">
                          {player.bloodGroup || "Not provided (Click Edit to add)"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                          <Mail className="size-3 text-primary" /> Primary Email
                        </span>
                        <p className="font-bold text-foreground text-sm truncate">
                          {player.email || "No email on record"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                          <Phone className="size-3 text-primary" /> Phone Number
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.phone || "No phone on record"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1 sm:col-span-2 lg:col-span-3">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                          <HeartPulse className="size-3 text-rose-400" /> Emergency Contact
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.emergencyContact || "No emergency contact provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Sports & Federation Details */}
                  <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <Award className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Sports, Discipline & Federation Details
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Martial arts rank, affiliated club/dojo, and coach credentials
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Discipline / Sport
                        </span>
                        <p className="font-bold text-primary text-sm">{player.discipline}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Affiliated Club / Academy
                        </span>
                        <p className="font-bold text-foreground text-sm">{player.club || "Independent"}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Coach / Master / Sensei
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.coachName || "Independent athlete"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Belt Rank / Grade
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.beltRank || "Standard Division"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Weight Division / Class
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.weightCategory || "Open Weight"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Govt ID / Aadhaar / Passport Ref
                        </span>
                        <p className="font-bold text-foreground text-sm font-mono">
                          {player.idNumber ? `Verified (•••${player.idNumber.slice(-4)})` : "Not linked"}
                        </p>
                      </div>

                      {/* Optional Coach / Referee Specific details if present */}
                      {player.qualification && (
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Qualification
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.qualification}</p>
                        </div>
                      )}
                      {player.experienceYears && (
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Experience
                          </span>
                          <p className="font-bold text-foreground text-sm">
                            {player.experienceYears} Years
                          </p>
                        </div>
                      )}
                      {player.specialization && (
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Specialization
                          </span>
                          <p className="font-bold text-foreground text-sm">{player.specialization}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B.2: Academic & Academy Transfer History */}
                  {(!player.memberType || player.memberType === "Player") && (
                  <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <GraduationCap className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">
                              Academic &amp; Academy Transfer History
                            </h3>
                            <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-bold">
                              {player.academicHistory?.length || 0} Recorded
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Sports academies, degrees, certifications, and educational milestones
                          </p>
                        </div>
                      </div>
                    </div>

                    {player.academicHistory && player.academicHistory.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {player.academicHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                  <School className="size-3.5 text-primary shrink-0" />
                                  {item.academy}
                                </p>
                                {item.fieldOfStudy && (
                                  <p className="text-[11px] text-primary font-medium mt-0.5">
                                    {item.fieldOfStudy}
                                  </p>
                                )}
                              </div>
                              {item.degree && (
                                <span className="inline-block rounded-full bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                                  {item.degree}
                                </span>
                              )}
                            </div>

                            {(item.startDate || item.endDate) && (
                              <p className="text-[10px] font-mono text-muted-foreground">
                                📅 {item.startDate ? formatToDDMMYYYY(item.startDate) : "N/A"} → {item.endDate ? formatToDDMMYYYY(item.endDate) : "Present"}
                              </p>
                            )}

                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>No academy history records added. Please Complete Your Profile by filling your Academic history.</span>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Section B.3: Belt Examination & Promotion Milestones */}
                  {player.beltHistory && player.beltHistory.length > 0 && (
                    <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-5">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                            <Award className="size-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-foreground">
                                Official Belt Examination &amp; Promotion Milestones
                              </h3>
                              <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                                {player.beltHistory.length} Passed
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Ratified Kyu/Gup belt gradings, Dan promotions, official scores, and verified diploma links
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {player.beltHistory.map((bh, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-gradient-to-br from-card/90 via-card/60 to-amber-500/5 border border-primary/25 space-y-3 shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 font-extrabold text-xs">
                                  🥋 {bh.belt}
                                </span>
                                {bh.previousBelt && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Promoted from: <span className="font-semibold text-foreground">{bh.previousBelt}</span>
                                  </p>
                                )}
                              </div>

                              {bh.grade && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  {bh.grade} {bh.score ? `(${bh.score}/100)` : ""}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                              <div>
                                <span className="text-muted-foreground text-[10px]">Exam / Promotion Date</span>
                                <p className="font-bold text-foreground">{formatToDDMMYYYY(bh.promotedDate || bh.date, "Verified")}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-[10px]">Chief Examiner</span>
                                <p className="font-bold text-foreground truncate">{bh.examinerName || bh.examiner || "Technical Board"}</p>
                              </div>
                            </div>

                            {(bh.certificateNumber || bh.certificateNo) && (
                              <div className="flex items-center justify-between pt-1 text-[11px]">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  Cert: {bh.certificateNumber || bh.certificateNo}
                                </span>
                                <Link
                                  href={`/certificates/${bh.belt.toLowerCase().includes("dan") ? "dan" : "belt"}/${encodeURIComponent(bh.certificateNumber || bh.certificateNo || "")}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                >
                                  <FileText className="size-3" /> View Certificate
                                </Link>
                              </div>
                            )}

                            {bh.remarks && (
                              <p className="text-[11px] text-muted-foreground italic bg-accent/20 p-2 rounded-xl border border-border/40">
                                "{bh.remarks}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Address & Location Details */}
                  <div className="luxe-card p-6 sm:p-7 rounded-3xl border border-border/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Address & Regional Federation
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            State unit affiliation and residential address
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          State / Region
                        </span>
                        <p className="font-bold text-foreground text-sm">{player.state}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          District Association
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.district || player.city || "Not provided"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1 sm:col-span-2">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Full Residential Address
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {player.address || player.registeredAddress || "No address provided"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Postal / PIN Code
                        </span>
                        <p className="font-bold text-foreground text-sm font-mono">
                          {player.pincode || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: OFFICIAL DOCUMENTS & CERTIFICATES */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            Official Documents, Certificates &amp; Verification
                          </h3>
                          <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold">
                            {player.memberType === "Club" ? "Club Verification Records" : "Member Credentials"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Official federation documents, affiliation deeds, certificates, and compliance records.
                        </p>
                      </div>
                    </div>

                    {player.memberType === "Club" ? (
                      <div className="space-y-4">
                        {/* Club Official Affiliation Document Card */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-primary/30 space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                            <div className="flex items-center gap-3.5">
                              <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                                <FileText className="size-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-bold text-foreground">
                                    Official Affiliation Certificate / Registration Deed
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="size-3" /> {player.affiliationDocument ? "Verified & Attached" : "Pending Attachment"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Official state / national federation affiliation license and founding deed.
                                </p>
                              </div>
                            </div>

                            {player.affiliationDocument && (
                              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <a
                                  href={player.affiliationDocument}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/70 hover:bg-accent text-foreground text-xs font-bold border border-border transition-colors shadow-sm"
                                >
                                  <Eye className="size-3.5" /> View Document
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(player.affiliationDocument, player.affiliationDocumentName || "Official_Affiliation_Document.pdf")}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                  <Download className="size-3.5" /> Download Document
                                </button>
                              </div>
                            )}
                          </div>

                          {player.affiliationDocument ? (
                            <div className="p-4 rounded-xl bg-accent/20 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attached Document File</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-mono font-bold text-foreground text-xs truncate max-w-sm">
                                    {player.affiliationDocumentName || "Official_Affiliation_Document.pdf"}
                                  </p>
                                  {player.affiliationDocumentSize && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono font-bold">
                                      {player.affiliationDocumentSize}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold cursor-pointer border border-primary/30 transition-colors shrink-0">
                                <UploadCloud className="size-3.5" /> Update Document
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                  disabled={uploadingDoc}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDocumentUpload(file, true);
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center text-center gap-3">
                              {uploadingDoc ? (
                                <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in">
                                  <div className="relative flex items-center justify-center">
                                    <div className="absolute size-14 rounded-full bg-primary/20 animate-ping" />
                                    <div className="size-14 rounded-2xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary font-mono text-xs font-black">
                                      {docUploadProgress}%
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold text-foreground">
                                    {docUploadProgress === 100 ? "Upload Complete (100%)" : `Uploading Affiliation Document (${docUploadProgress}%)...`}
                                  </p>
                                  <div className="w-full bg-accent/60 rounded-full h-2 overflow-hidden border border-border/80">
                                    <div
                                      className="h-full bg-gold-gradient rounded-full transition-all duration-200"
                                      style={{ width: `${docUploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="size-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
                                    <UploadCloud className="size-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="text-sm font-bold text-foreground">No Affiliation Document Attached</h5>
                                    <p className="text-xs text-muted-foreground max-w-sm">
                                      Attach your club registration deed or official state certificate to complete verification.
                                    </p>
                                  </div>
                                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer">
                                    <UploadCloud className="size-4" /> Click to Upload Document Now
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDocumentUpload(file, true);
                                      }}
                                    />
                                  </label>
                                  <span className="text-[11px] text-muted-foreground">Supports PDF, PNG, JPG, or DOCX (Max 2MB)</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Member Identity & Registration Document */}
                        <div className="p-5 rounded-2xl bg-accent/20 border border-border/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                                <ShieldCheck className="size-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">KSM Official Registration</h4>
                                <p className="text-[11px] text-muted-foreground">ID: {player.id}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Official federation registration recognized across all national and state tournaments.
                          </p>
                        </div>

                        {/* State Affiliation Record */}
                        <div className="p-5 rounded-2xl bg-accent/20 border border-border/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                                <Award className="size-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">State Unit Affiliation</h4>
                                <p className="text-[11px] text-muted-foreground">{player.state}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-bold">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Affiliated with {player.state} State Martial Arts Association.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL & CONTACT */}
              {activeTab === "personal" && (
                <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Personal & Contact Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Detailed bio, contact details, and emergency communication records
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Full Name:</span>
                      <p className="text-base font-bold text-foreground">{player.name}</p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Date of Birth:</span>
                      <p className="text-base font-bold text-foreground">
                        {formatToDDMMYYYY(player.dob, "Not set")} ({player.age || calculateAge(player.dob)} years old)
                      </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Gender:</span>
                      <p className="text-base font-bold text-foreground">{player.gender || "Male"}</p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1 text-rose-400">
                        <Droplet className="size-3.5" /> Blood Group:
                      </span>
                      <p className="text-base font-bold text-rose-400">
                        {player.bloodGroup || "Not specified"}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Primary Email:</span>
                      <p className="text-base font-bold text-foreground">{player.email || "None"}</p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Phone Number:</span>
                      <p className="text-base font-bold text-foreground">{player.phone || "None"}</p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60 md:col-span-2">
                      <span className="text-muted-foreground font-semibold">Emergency Contact:</span>
                      <p className="text-base font-bold text-foreground">
                        {player.emergencyContact || "No emergency contact provided"}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60 md:col-span-2">
                      <span className="text-muted-foreground font-semibold">Athlete Bio:</span>
                      <p className="text-sm text-foreground/90 leading-relaxed italic">
                        {player.bio || "No athlete biography added yet. Click 'Edit Details' to write your athlete intro."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SPORTS & RANK */}
              {activeTab === "sports" && (
                <div className="space-y-6">
                  {/* Card 1: Sports Credentials Grid */}
                  <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Sports, Martial Arts &amp; Ranking Records
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Martial arts rank, division, coach credentials, and medals record
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                      <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                        <span className="text-muted-foreground font-semibold">Primary Discipline:</span>
                        <p className="text-base font-bold text-primary">{player.discipline}</p>
                      </div>
                      <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                        <span className="text-muted-foreground font-semibold">Club / Dojo / Academy:</span>
                        <p className="text-base font-bold text-foreground">{player.club || "Independent"}</p>
                      </div>
                      {player.memberType === "Referee" || player.id.startsWith("KSM-RF-") || player.id.startsWith("WSF-RF-") ? (
                        <>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Official Referee Level:</span>
                            <p className="text-base font-bold text-amber-400">
                              {(player as any).level || player.officiatingGrade || "Level 0 – Trainee Referee"}
                            </p>
                          </div>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Current Dan Rank / Belt:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                              <p className="text-base font-extrabold text-foreground">
                                {player.beltRank || (player as any).currentRank || "1st Dan Black Belt"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Duty Specialization:</span>
                            <p className="text-base font-bold text-foreground">
                              {player.specialization || "Mat / Ring Referee"}
                            </p>
                          </div>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Officiating Experience:</span>
                            <p className="text-base font-bold text-foreground">
                              {player.experienceYears ? `${player.experienceYears} Years` : "Registered Official"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Coach / Master Name:</span>
                            <p className="text-base font-bold text-foreground">
                              {player.coachName || "Independent athlete"}
                            </p>
                          </div>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Current Belt Rank / Grade:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                              <p className="text-base font-extrabold text-foreground">
                                {player.beltRank || "White Belt (10th Gup / Novice)"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                            <span className="text-muted-foreground font-semibold">Weight Category:</span>
                            <p className="text-base font-bold text-foreground">
                              {player.weightCategory || "Open Category"}
                            </p>
                          </div>
                        </>
                      )}
                      <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                        <span className="text-muted-foreground font-semibold">Official Govt ID Ref:</span>
                        <p className="text-base font-bold text-foreground font-mono">
                          {player.idNumber ? `Verified (•••${player.idNumber.slice(-4)})` : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Belt Career Progression Timeline & Grading Record */}
                  <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Award className="size-5 text-primary" />
                          <h3 className="text-base font-bold text-foreground">
                            Belt Career Progression &amp; Examination History
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Official timeline of belt promotion gradings, master examiners, marks, and verified certificates.
                        </p>
                      </div>

                      <Link
                        href="/belt-exams"
                        className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-background shadow-gold hover:opacity-90 transition-opacity shrink-0"
                      >
                        <Award className="size-3.5" />
                        <span>Belt Exam Portal &amp; Syllabus</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>

                    {player.beltHistory && player.beltHistory.length > 0 ? (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-primary/30">
                        {player.beltHistory.map((item, idx) => (
                          <div key={idx} className="relative group">
                            {/* Timeline Node Dot */}
                            <div className="absolute -left-6 top-1.5 size-4.5 rounded-full border-2 border-primary bg-background grid place-items-center">
                              <span className="size-2 rounded-full bg-primary" />
                            </div>

                            <div className="p-5 rounded-2xl bg-accent/20 border border-border/70 hover:border-primary/50 transition-all space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                                <div>
                                  <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                                    <span>🥋 {item.belt}</span>
                                    {idx === 0 && (
                                      <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-bold">
                                        Current Belt
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.sessionName || "Official National Federation Grading Examination"}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  {item.promotedDate && (
                                    <span className="text-[11px] font-mono text-muted-foreground bg-accent/40 px-2.5 py-0.5 rounded-lg">
                                      📅 {formatToDDMMYYYY(item.promotedDate)}
                                    </span>
                                  )}
                                  {item.score !== undefined && (
                                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                                      Score: {item.score}/100
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  {item.examiner && (
                                    <p className="text-muted-foreground">
                                      Chief Examiner: <strong className="text-foreground">{item.examiner}</strong>
                                    </p>
                                  )}
                                  {item.certificateNo && (
                                    <p className="font-mono text-[11px] text-primary">
                                      Certificate Ref: <strong>{item.certificateNo}</strong>
                                    </p>
                                  )}
                                </div>

                                {item.certificateNo && (
                                  <Link
                                    href={`/certificates/belt/${encodeURIComponent(item.certificateNo)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold border border-primary/30 transition-colors w-fit"
                                  >
                                    <FileText className="size-3.5" />
                                    <span>View Official Belt Certificate</span>
                                    <ExternalLink className="size-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/80 bg-accent/10 p-6 text-center space-y-3">
                        <Award className="size-8 text-primary mx-auto opacity-70" />
                        <div className="max-w-md mx-auto space-y-1">
                          <p className="text-sm font-bold text-foreground">No Official Belt Gradings Recorded Yet</p>
                          <p className="text-xs text-muted-foreground">
                            When you pass official belt examinations conducted by the federation, your belt grade, master assessment, and digital certificate will automatically appear here.
                          </p>
                        </div>
                        <Link
                          href="/belt-exams"
                          className="inline-flex items-center gap-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-4 py-2 text-xs font-bold transition-all"
                        >
                          <span>Explore Upcoming Belt Exam Sessions</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3.5: ACADEMY & ACADEMIC HISTORY (ONLY for Player) */}
              {(!player.memberType || player.memberType === "Player") && activeTab === "academy" && (
                <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          Academic &amp; Academy Transfer History
                        </h3>
                        <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold">
                          {player.academicHistory?.length || 0} Recorded
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Past and current martial arts academies, sports institutions, degrees, and qualifications
                      </p>
                    </div>
                  </div>

                  {player.academicHistory && player.academicHistory.length > 0 ? (
                    <div className="space-y-4">
                      {player.academicHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-accent/20 border border-border/70 hover:border-primary/50 transition-all space-y-3 relative"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                                <GraduationCap className="size-4.5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  {item.academy}
                                </h4>
                                {item.fieldOfStudy && (
                                  <p className="text-xs text-primary font-medium">
                                    {item.fieldOfStudy}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {item.degree && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 text-[11px] font-semibold">
                                  {item.degree}
                                </span>
                              )}
                              {(item.startDate || item.endDate) && (
                                <span className="text-[11px] text-muted-foreground font-mono bg-accent/40 px-2.5 py-0.5 rounded-lg">
                                  📅 {item.startDate ? formatToDDMMYYYY(item.startDate) : "N/A"} → {item.endDate ? formatToDDMMYYYY(item.endDate) : "Present"}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 rounded-2xl bg-accent/10 border-2 border-dashed border-border/80 space-y-3">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                        <GraduationCap className="size-6" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-foreground">
                          No Academic Transfer History Found
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Please Complete Your Profile by filling your Academic history. Add all sports academies or schools you have trained at using the <strong>Edit Profile</strong> button.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ADDRESS & LOCATION */}
              {activeTab === "address" && (
                <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Regional Affiliation & Residential Address
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Location registered with the state federation unit
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">State / Union Territory:</span>
                      <p className="text-base font-bold text-foreground">{player.state}</p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">District Association:</span>
                      <p className="text-base font-bold text-foreground">
                        {player.district || player.city || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60 sm:col-span-2">
                      <span className="text-muted-foreground font-semibold">Full Residential Address:</span>
                      <p className="text-base font-bold text-foreground">
                        {player.address || player.registeredAddress || "No address provided"}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-2xl bg-accent/20 border border-border/60">
                      <span className="text-muted-foreground font-semibold">Postal / PIN Code:</span>
                      <p className="text-base font-bold text-foreground font-mono">
                        {player.pincode || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY & DANGER ZONE */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Security Settings Box */}
                  <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Account Security & Credentials
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Manage your login password and account credentials
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPasswordModalOpen(true)}
                        className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Lock className="size-3.5" /> Change Password
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {(!player.memberType || player.memberType === "Player") && (
                        <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                            Login Username
                          </span>
                          <p className="font-mono font-bold text-primary text-sm">
                            {player.username ? `@${player.username}` : "Not set (Click Edit Profile to add)"}
                          </p>
                        </div>
                      )}
                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Login Email
                        </span>
                        <p className="font-mono font-bold text-foreground text-sm truncate">
                          {player.email || "Not set"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                          Official Member ID
                        </span>
                        <p className="font-mono font-bold text-foreground text-sm">
                          {player.id}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs space-y-3">
                      <p className="text-muted-foreground">
                        {(!player.memberType || player.memberType === "Player")
                          ? "Your account is secured with password protection. Athletes can log into the portal using either their registered Username or Email address."
                          : `Your account is secured with password protection. Use your Member ID (${player.id}) or registered email to log into the portal.`}
                      </p>
                    </div>
                  </div>

                  {/* Danger Zone: Account Deletion (DELETE Operation) */}
                  <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-destructive/40 bg-destructive/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-destructive/20 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-destructive">
                          Danger Zone
                        </h3>
                        <p className="text-xs text-destructive/80">
                          Permanent account deactivation and data removal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmText("");
                          setDeleteModalOpen(true);
                        }}
                        className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="size-3.5" /> Delete Profile
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently delete your official athlete membership profile and remove your credentials from the federation database. This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No Profile Found - Register State */
            <div className="luxe-card p-12 text-center max-w-xl mx-auto border border-border/80 rounded-3xl space-y-4">
              <div className="size-16 rounded-2xl bg-accent/40 text-primary grid place-items-center mx-auto">
                <Sparkles className="size-8" />
              </div>
              <h2 className="text-2xl font-bold">No Profile Found</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You haven't registered an athlete or member profile with {fedName} yet. Register now to receive your official Member ID and start tracking your ranking.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link
                  href="/register?type=player"
                  className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                >
                  Register as Athlete <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="border-border/70 hover:border-primary rounded-full border px-6 py-3 text-xs font-semibold"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. EDIT PROFILE MODAL (Full CRUD - UPDATE / CREATE fields)               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-3xl rounded-3xl border border-border/80 bg-background/95 p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {(() => {
                const isClubModal = editForm.memberType === "Club" || player?.memberType === "Club" || player?.id?.startsWith("KSM-CL") || player?.id?.startsWith("WSF-CL") || user?.memberType === "Club" || user?.id?.startsWith("KSM-CL") || user?.id?.startsWith("WSF-CL");

                return (
                  <>
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                          {isClubModal ? <Landmark className="size-4.5" /> : <Edit3 className="size-4.5" />}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">
                            {isClubModal ? "Edit Affiliated Academy & Dojo Details" : "Edit Profile Details"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {isClubModal
                              ? "Update your official academy visual branding, batches, facilities & registry info"
                              : "Update your official federation details and contact info"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditModalOpen(false)}
                        className="size-8 rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent/40 grid place-items-center transition-colors cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      {isClubModal ? (
                        /* =========================================================================
                           CLUB / ACADEMY EDIT PROFILE MODAL (9 Sections matching Admin Panel)
                           ========================================================================= */
                        <div className="space-y-6">
                          {/* SECTION 1: Visual Branding (Academy Logo) */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <ImageIcon className="size-3.5" /> Visual Branding (Academy Logo)
                            </h4>

                            <div>
                              <ImageUploadField
                                label="Academy Logo (Square Icon / Emblem)"
                                value={editForm.logo || ""}
                                onChange={(url) => setEditForm((prev) => ({ ...prev, logo: url }))}
                                folder="clubs/logos"
                                helperText="Click to upload academy logo (Max 2MB)."
                              />
                            </div>
                          </div>

                          {/* SECTION 2: Identification & Official Affiliation */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <ShieldCheck className="size-3.5" /> Identification &amp; Official Affiliation
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Academy / Club Full Name *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Kalawar Tiger Combat Academy"
                                  value={editForm.name || ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Society / Trust Registration No.</label>
                                <input
                                  type="text"
                                  placeholder="e.g. MAH/1482/2018/PUNE or Trust Reg #7890"
                                  value={editForm.registrationNumber || ""}
                                  onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground font-mono focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Founded Year</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 2016"
                                  value={editForm.yearFounded ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, yearFounded: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Active Member Athletes</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 180"
                                  value={editForm.memberCount ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, memberCount: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Official Website</label>
                                <input
                                  type="text"
                                  placeholder="https://example-academy.com"
                                  value={editForm.website || ""}
                                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>
                            </div>

                            {/* Uploaded Affiliation Proof Document */}
                            <div className="pt-2">
                              <label className="font-semibold text-xs text-foreground block mb-2">
                                Uploaded Society / Trust Registration Proof Document:
                              </label>
                              {uploadingDoc ? (
                                <div className="p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2.5 animate-in fade-in">
                                  <div className="relative flex items-center justify-center">
                                    <div className="absolute size-10 rounded-full bg-primary/20 animate-ping" />
                                    <div className="size-10 rounded-xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary font-mono text-xs font-black">
                                      {docUploadProgress}%
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold text-foreground">
                                    {docUploadProgress === 100 ? "Upload Complete (100%)" : `Uploading Document (${docUploadProgress}%)...`}
                                  </p>
                                  <div className="w-40 bg-accent/60 rounded-full h-1.5 overflow-hidden border border-border/80">
                                    <div
                                      className="h-full bg-gold-gradient rounded-full transition-all duration-200"
                                      style={{ width: `${docUploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : editForm.affiliationDocument ? (
                                <div className="p-3.5 rounded-xl bg-accent/20 border border-border/70 space-y-2">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <FileText className="size-4.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-xs font-bold text-foreground truncate max-w-xs">
                                            {editForm.affiliationDocumentName || "Official_Affiliation_Document.pdf"}
                                          </p>
                                          {editForm.affiliationDocumentSize && (
                                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono font-bold">
                                              {editForm.affiliationDocumentSize}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                          Document attached and ready to save
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <a
                                        href={editForm.affiliationDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-accent text-foreground border border-border/70 text-[11px] font-semibold hover:bg-accent/80 transition-colors"
                                      >
                                        <Eye className="size-3 inline mr-1" /> View
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => downloadFile(editForm.affiliationDocument, editForm.affiliationDocumentName || "Official_Affiliation_Document.pdf")}
                                        className="px-2.5 py-1 rounded-lg bg-gold-gradient text-background text-[11px] font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer"
                                      >
                                        <Download className="size-3 inline mr-1" /> Download
                                      </button>
                                      <label className="px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-[11px] font-semibold cursor-pointer transition-colors">
                                        <UploadCloud className="size-3 inline mr-1" /> Replace
                                        <input
                                          type="file"
                                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleDocumentUpload(file, false);
                                          }}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditForm({
                                            ...editForm,
                                            affiliationDocument: "",
                                            affiliationDocumentName: "",
                                            affiliationDocumentSize: "",
                                          });
                                        }}
                                        className="p-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
                                        title="Remove document"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <label className="border-2 border-dashed border-primary/40 hover:border-primary rounded-xl p-4 text-center cursor-pointer transition-colors bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1.5 group block">
                                  <UploadCloud className="size-5 text-primary group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                    Click to upload Society / Trust Registration Proof Document (PDF / Image / DOCX)
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">Max 2MB</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleDocumentUpload(file, false);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* SECTION 3: Location & Registered Dojo Address (Single clean section) */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <MapPin className="size-3.5" /> Location &amp; Registered Dojo Address
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">State Association *</label>
                                <select
                                  value={editForm.state || states[0]}
                                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                >
                                  {states.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">District</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Pune / Ahmedabad"
                                  value={editForm.district || ""}
                                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">City / Area / Town</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Shivajinagar / Navrangpura"
                                  value={editForm.city || ""}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="font-semibold text-foreground block mb-1.5">Registered Facility Address</label>
                                <input
                                  type="text"
                                  placeholder="Plot / Complex number, Street, Landmark"
                                  value={editForm.registeredAddress || editForm.address || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      registeredAddress: e.target.value,
                                      address: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">Postal / PIN Code</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 411005"
                                  value={editForm.pincode || ""}
                                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground font-mono focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SECTION 4: Certified Coaches & Staff Roster / Leadership */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Award className="size-3.5" /> Certified Coaches &amp; Staff Roster
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">
                                  Head Coach *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Grandmaster Rajesh Sharma (8th Dan)"
                                  value={editForm.headCoachName || ""}
                                  onChange={(e) => setEditForm({ ...editForm, headCoachName: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">President Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Master Vikram Deshmukh"
                                  value={editForm.presidentName || ""}
                                  onChange={(e) => setEditForm({ ...editForm, presidentName: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-semibold text-foreground block mb-1.5">General Secretary</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Sunita Kulkarni"
                                  value={editForm.secretaryName || ""}
                                  onChange={(e) => setEditForm({ ...editForm, secretaryName: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SECTION 5: Batch Timings */}
                          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Clock className="size-3.5" /> Batch Timings
                            </h4>

                            {/* Official Training Hours / Timings */}
                            <div className="text-xs space-y-1.5">
                              <label className="font-semibold text-foreground block">
                                Official Training Hours / Timings
                              </label>
                              <input
                                type="text"
                                placeholder="Mon - Sat: 06:00 AM - 09:30 AM & 05:00 PM - 09:00 PM"
                                value={editForm.timings || ""}
                                onChange={(e) => setEditForm({ ...editForm, timings: e.target.value })}
                                className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                              />
                            </div>

                            {/* Specific Batch Schedules & Age Brackets */}
                            <div className="space-y-3 pt-2 border-t border-border/40">
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-xs font-bold text-foreground block">
                                    Specific Batch Schedules &amp; Age Brackets
                                  </label>
                                  <p className="text-[11px] text-muted-foreground">
                                    Configure the batch schedules displayed on public profile and federation records
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleAddBatchSlot}
                                  className="px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Plus className="size-3.5" />
                                  <span>Add Batch</span>
                                </button>
                              </div>

                              <div className="space-y-2.5">
                                {(editForm.batches || []).map((batch, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-card border border-border/70 flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                                  >
                                    <div className="flex-1 w-full sm:w-auto">
                                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                        Batch Title
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Cadet / Junior Batch"
                                        value={batch.name}
                                        onChange={(e) => handleBatchChange(idx, "name", e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg bg-accent/20 border border-border/80 text-foreground text-xs focus:border-primary outline-none"
                                      />
                                    </div>
                                    <div className="flex-[1.5] w-full sm:w-auto">
                                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                        Timing &amp; Target Group
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 05:00 PM - 06:30 PM (Ages 6-14)"
                                        value={batch.time}
                                        onChange={(e) => handleBatchChange(idx, "time", e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg bg-accent/20 border border-border/80 text-foreground text-xs focus:border-primary outline-none"
                                      />
                                    </div>
                                    <div className="sm:pt-4 self-end sm:self-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBatch(idx)}
                                        className="p-1.5 rounded-lg bg-accent hover:bg-destructive/20 text-muted-foreground hover:text-destructive border border-border/60 transition-colors cursor-pointer"
                                        title="Remove batch slot"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {(!editForm.batches || editForm.batches.length === 0) && (
                                  <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                                    No specific batch slots added. Click &quot;+ Add Batch&quot; above to add customized batch schedules.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* SECTION 6: Facilities & Amenities Checklist */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Activity className="size-3.5" /> Facilities &amp; Amenities Checklist
                            </h4>

                            <div className="space-y-2.5">
                              <label className="block text-xs font-semibold text-foreground">
                                Standard Facilities (Click to toggle):
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {STANDARD_FACILITIES.map((fac) => {
                                  const checked = (editForm.facilities || []).includes(fac);
                                  return (
                                    <button
                                      key={fac}
                                      type="button"
                                      onClick={() => handleToggleFacility(fac)}
                                      className={`p-2.5 rounded-xl text-xs text-left border flex items-center gap-2.5 transition-all cursor-pointer ${
                                        checked
                                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
                                          : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`size-4 shrink-0 ${checked ? "text-emerald-400" : "text-muted-foreground/50"}`}
                                      />
                                      <span className="truncate">{fac}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Custom Added Facilities */}
                              {(editForm.facilities || []).filter((f) => !STANDARD_FACILITIES.includes(f)).length > 0 && (
                                <div className="pt-2 space-y-1.5">
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                    Custom Added Amenities:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(editForm.facilities || [])
                                      .filter((f) => !STANDARD_FACILITIES.includes(f))
                                      .map((customFac) => (
                                        <span
                                          key={customFac}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold"
                                        >
                                          <span>{customFac}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveFacility(customFac)}
                                            className="text-primary hover:text-destructive transition-colors cursor-pointer"
                                          >
                                            <X className="size-3" />
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
                                  className="flex-1 px-3.5 py-2 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:border-primary outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomFacility}
                                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground border border-border/70 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  + Add Facility
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 7: Academy Honors & Achievements */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Trophy className="size-3.5" /> Academy Honors &amp; Achievements
                            </h4>

                            <div className="space-y-2.5">
                              <div className="space-y-2">
                                {(editForm.achievements || []).map((ach, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-card border border-border/70 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-2 text-foreground min-w-0">
                                      <Trophy className="size-4 text-amber-400 shrink-0" />
                                      <span className="truncate">{ach}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAchievement(idx)}
                                      className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {(!editForm.achievements || editForm.achievements.length === 0) && (
                                  <div className="p-3 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                                    No honors/achievements added yet. Use the field below to add tournament trophies, state gold medals, etc.
                                  </div>
                                )}
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
                                  className="flex-1 px-3.5 py-2 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:border-primary outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddAchievement}
                                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground border border-border/70 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  + Add Honor
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 8: Dojo Photo Gallery */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Camera className="size-3.5" /> Dojo Photo Gallery
                            </h4>

                            <ImageUploadField
                              label="Upload Dojo Photos from Device"
                              value={editForm.photos || []}
                              onChange={(photos) => setEditForm((prev) => ({ ...prev, photos }))}
                              multiple={true}
                              folder="clubs/gallery"
                              helperText="Click to upload high-resolution images from your device (Max 2MB per photo)."
                            />
                          </div>

                          {/* SECTION 9: Contact, Statistics & Academy Bio */}
                          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Phone className="size-3.5" /> Contact &amp; Institutional Overview
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Primary Phone (WhatsApp Enabled)</label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  maxLength={16}
                                  placeholder="+91 98765 43210"
                                  value={editForm.phone || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      phone: sanitizePhoneInput(e.target.value),
                                    })
                                  }
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground font-mono focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Alternate Phone</label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  maxLength={16}
                                  placeholder="+91 98220 99999"
                                  value={editForm.alternatePhone || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      alternatePhone: sanitizePhoneInput(e.target.value),
                                    })
                                  }
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground font-mono focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Official Email</label>
                                <input
                                  type="email"
                                  placeholder="contact@kalawar-academy.org"
                                  value={editForm.email || ""}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">
                                  Academy Bio &amp; Institutional Overview
                                </label>
                                <textarea
                                  rows={4}
                                  placeholder="Official description of the academy, teaching philosophy, training facilities, and federation track record..."
                                  value={editForm.bio || ""}
                                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* =========================================================================
                           ATHLETE / COACH / REFEREE EDIT PROFILE MODAL
                           ========================================================================= */
                        <div className="space-y-6">
                          {/* Fieldset 1: Personal Details */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <User className="size-3.5" /> Personal Details
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Full Legal Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={editForm.name || ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              {(!editForm.memberType || editForm.memberType === "Player") && (
                                <div className="space-y-1.5">
                                  <label className="font-semibold text-foreground">Username</label>
                                  <input
                                    type="text"
                                    value={editForm.username || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                                      })
                                    }
                                    placeholder="e.g. johndoe"
                                    className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none font-mono"
                                  />
                                  <p className="text-[10px] text-muted-foreground">Unique login username for athlete sign in.</p>
                                </div>
                              )}

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Date of Birth</label>
                                <input
                                  type="date"
                                  value={editForm.dob || ""}
                                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Gender</label>
                                <select
                                  value={editForm.gender || "Male"}
                                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Blood Group</label>
                                <select
                                  value={editForm.bloodGroup || ""}
                                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
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

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">
                                  {user?.memberType === "Coach" ? "Coach Bio / Statement" : user?.memberType === "Referee" ? "Referee Bio / Statement" : "Athlete Bio / Intro Statement"}
                                </label>
                                <textarea
                                  rows={2}
                                  value={editForm.bio || ""}
                                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                  placeholder="Write a brief intro about your sporting journey, belts, or achievements..."
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none resize-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fieldset 2: Contact Information */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Phone className="size-3.5" /> Contact &amp; Emergency Details
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Primary Email Address</label>
                                <input
                                  type="email"
                                  value={editForm.email || ""}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Mobile / Phone Number</label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  maxLength={16}
                                  value={editForm.phone || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      phone: sanitizePhoneInput(e.target.value),
                                    })
                                  }
                                  placeholder="e.g. 9876543210 or +91 98765 43210"
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none font-mono"
                                />
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">
                                  Emergency Contact (Name &amp; Phone Number)
                                </label>
                                <input
                                  type="text"
                                  value={editForm.emergencyContact || ""}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, emergencyContact: e.target.value })
                                  }
                                  placeholder="e.g. Ramesh Sharma (Father) - +91 98765 43210"
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fieldset 3: Address & Location (Unified Single Section) */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <MapPin className="size-3.5" /> Address &amp; Location
                              </h4>
                              {(!editForm.memberType || editForm.memberType === "Player") && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  * Mandatory for Athletes
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">
                                  State Association / Region <span className="text-primary">*</span>
                                </label>
                                <select
                                  value={editForm.state || states[0] || "Maharashtra"}
                                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                >
                                  {states.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">
                                  District Association {(!editForm.memberType || editForm.memberType === "Player") && <span className="text-primary">*</span>}
                                </label>
                                <select
                                  required={!editForm.memberType || editForm.memberType === "Player"}
                                  value={editForm.district || editForm.city || ""}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, city: e.target.value, district: e.target.value })
                                  }
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                >
                                  <option value="">Select District Association</option>
                                  {getDistrictsByState(editForm.state || "Maharashtra").map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">
                                  Full Residential Address {(!editForm.memberType || editForm.memberType === "Player") && <span className="text-primary">*</span>}
                                </label>
                                <textarea
                                  rows={2}
                                  required={!editForm.memberType || editForm.memberType === "Player"}
                                  value={editForm.address || editForm.registeredAddress || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      address: e.target.value,
                                      registeredAddress: e.target.value,
                                    })
                                  }
                                  placeholder="House / Flat No., Street, Landmark, Area"
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none resize-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">
                                  Postal / PIN Code {(!editForm.memberType || editForm.memberType === "Player") && <span className="text-primary">*</span>}
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  required={!editForm.memberType || editForm.memberType === "Player"}
                                  value={editForm.pincode || ""}
                                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                  placeholder="e.g. 411001"
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fieldset 4: Sports, Club & Martial Arts Info */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                              <Award className="size-3.5" /> Sports, Rank &amp; Club Affiliation
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <label className="font-semibold text-foreground">Discipline / Sport</label>
                                <select
                                  value={editForm.discipline || disciplines[0]?.name || "Kalawar Martial Arts"}
                                  onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value as Discipline })}
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                >
                                  {disciplines.map((d) => (
                                    <option key={d.name} value={d.name}>
                                      {d.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Current Affiliated Academy / Club</label>
                                {(() => {
                                  const resolvedClub = resolveSelectedOption(editForm.club, clubOptions, INDEPENDENT_CLUB);
                                  return (
                                    <select
                                      value={resolvedClub}
                                      onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none transition-colors cursor-pointer"
                                    >
                                      {resolvedClub && !clubOptions.includes(resolvedClub) && (
                                        <option value={resolvedClub}>{resolvedClub}</option>
                                      )}
                                      {clubOptions.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                  );
                                })()}
                              </div>

                              {(!user?.memberType || user?.memberType === "Player") && (
                                <div className="space-y-1.5">
                                  <label className="font-semibold text-foreground">Assigned Coach / Trainer</label>
                                  {(() => {
                                    const resolvedCoach = resolveSelectedOption(editForm.coachName, coachOptions, INDEPENDENT_COACH);
                                    return (
                                      <select
                                        value={resolvedCoach}
                                        onChange={(e) => setEditForm({ ...editForm, coachName: e.target.value })}
                                        className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none transition-colors cursor-pointer"
                                      >
                                        {resolvedCoach && !coachOptions.includes(resolvedCoach) && (
                                          <option value={resolvedCoach}>{resolvedCoach}</option>
                                        )}
                                        {coachOptions.map((co) => (
                                          <option key={co} value={co}>
                                            {co}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })()}
                                </div>
                              )}

                              {(user?.memberType === "Coach" || player?.memberType === "Coach" || isCoach) && (
                                <>
                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Coaching Qualification / License</label>
                                    <input
                                      type="text"
                                      value={editForm.qualification || ""}
                                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                                      placeholder="e.g. Level 1 - State Certified Coach"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Coaching Specialization / Belt Rank</label>
                                    <input
                                      type="text"
                                      value={editForm.specialization || ""}
                                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                      placeholder="e.g. 3rd Dan Black Belt / Combat Sports"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Coaching Experience (Years)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      value={editForm.experienceYears ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })}
                                      placeholder="e.g. 6"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Coach Registration Type</label>
                                    <select
                                      value={editForm.registrationType || "Already a Coach"}
                                      onChange={(e) => setEditForm({ ...editForm, registrationType: e.target.value })}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                    >
                                      <option value="Already a Coach">Already a Coach</option>
                                      <option value="Apply For Coach">Apply For Coach</option>
                                      <option value="Senior Master Coach">Senior Master Coach</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {(user?.memberType === "Referee" || player?.memberType === "Referee" || editForm.memberType === "Referee" || player?.id?.startsWith("KSM-RF") || player?.id?.startsWith("WSF-RF") || user?.id?.startsWith("KSM-RF") || user?.id?.startsWith("WSF-RF")) && (
                                <>
                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="font-semibold text-foreground">Official Referee Level / Grade *</label>
                                    <select
                                      value={(editForm as any).level || editForm.officiatingGrade || REFEREE_LEVELS[0]}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditForm({ ...editForm, level: val as any, officiatingGrade: val });
                                      }}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none font-semibold cursor-pointer"
                                    >
                                      {REFEREE_LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                          {lvl}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Current Dan Rank / Belt *</label>
                                    <input
                                      type="text"
                                      value={editForm.beltRank || ""}
                                      onChange={(e) => setEditForm({ ...editForm, beltRank: e.target.value })}
                                      placeholder="e.g. 1st Dan Black Belt, 3rd Dan"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Primary Duty Preference / Specialization</label>
                                    <select
                                      value={editForm.specialization || DUTY_POSITIONS[1]}
                                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                    >
                                      {DUTY_POSITIONS.map((pos) => (
                                        <option key={pos} value={pos}>
                                          {pos}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Years Officiating / Experience</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      value={editForm.experienceYears ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })}
                                      placeholder="e.g. 4"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Sanctioned Matches Officiated</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="5000"
                                      value={editForm.matchesOfficiated ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, matchesOfficiated: e.target.value })}
                                      placeholder="e.g. 30"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>
                                </>
                              )}

                              {(!user?.memberType || user?.memberType === "Player") && (
                                <>
                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Age Division / Age Group</label>
                                    <select
                                      value={editForm.ageGroup || ""}
                                      onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                    >
                                      <option value="">Select Age</option>
                                      {editForm.ageGroup &&
                                        !["U-8", "U-10", "U-12", "U-14", "U-17", "U-19", "Seniors / Open", "Masters"].includes(
                                          editForm.ageGroup
                                        ) && <option value={editForm.ageGroup}>{editForm.ageGroup}</option>}
                                      {["U-8", "U-10", "U-12", "U-14", "U-17", "U-19", "Seniors / Open", "Masters"].map((g) => (
                                        <option key={g} value={g}>
                                          {g}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Belt Rank / Grade / Division</label>
                                    <input
                                      type="text"
                                      value={editForm.beltRank || ""}
                                      onChange={(e) => setEditForm({ ...editForm, beltRank: e.target.value })}
                                      placeholder="e.g. Black Belt 1st Dan, Senior Division"
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="font-semibold text-foreground">Weight Division / Category</label>
                                    <select
                                      value={editForm.weightCategory || ""}
                                      onChange={(e) => setEditForm({ ...editForm, weightCategory: e.target.value })}
                                      className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none cursor-pointer"
                                    >
                                      <option value="">Select Category</option>
                                      {editForm.weightCategory &&
                                        ![
                                          "-25 kg",
                                          "-30 kg",
                                          "30-35 kg",
                                          "35-38 kg",
                                          "38-42 kg",
                                          "42-45 kg",
                                          "45-50 kg",
                                          "50-55 kg",
                                          "55-60 kg",
                                          "60-65 kg",
                                          "65-70 kg",
                                          "70-75 kg",
                                          "75-80 kg",
                                          "+80 kg",
                                          "Open Weight",
                                          "Open Weight (Agility & Balance Evaluation)",
                                        ].includes(editForm.weightCategory) && (
                                          <option value={editForm.weightCategory}>{editForm.weightCategory}</option>
                                        )}
                                      {[
                                        "-25 kg",
                                        "-30 kg",
                                        "30-35 kg",
                                        "35-38 kg",
                                        "38-42 kg",
                                        "42-45 kg",
                                        "45-50 kg",
                                        "50-55 kg",
                                        "55-60 kg",
                                        "60-65 kg",
                                        "65-70 kg",
                                        "70-75 kg",
                                        "75-80 kg",
                                        "+80 kg",
                                        "Open Weight",
                                        "Open Weight (Agility & Balance Evaluation)",
                                      ].map((w) => (
                                        <option key={w} value={w}>
                                          {w}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </>
                              )}

                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-semibold text-foreground">Govt ID / Aadhaar / Passport Ref</label>
                                <input
                                  type="text"
                                  value={editForm.idNumber || ""}
                                  onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                                  placeholder="e.g. XXXX-XXXX-1234"
                                  className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fieldset 5: Academic & Academy Transfer History (ONLY for Player) */}
                          {(!editForm.memberType || editForm.memberType === "Player") && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                  <GraduationCap className="size-3.5" /> Academic &amp; Academy Transfer History
                                </h4>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  * Mandatory for Athletes (Min. 1 Record)
                                </span>
                              </div>

                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Add previous and current sports academies or schools you have trained at. A student can add multiple academies with degree, specialization, and dates.
                              </p>

                              <div className="space-y-3.5">
                                {(editForm.academicHistory || []).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 sm:p-5 rounded-2xl bg-accent/20 border border-border/80 space-y-3 relative group"
                                  >
                                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <School className="size-3.5 text-primary" /> Academy Record #{idx + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = (editForm.academicHistory || []).filter((_, i) => i !== idx);
                                          setEditForm({ ...editForm, academicHistory: next });
                                        }}
                                        className="text-xs text-destructive hover:bg-destructive/15 px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Remove this academy entry"
                                      >
                                        <Trash2 className="size-3" /> Remove
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="font-semibold text-foreground">
                                          Academy / Institute Name <span className="text-primary">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={item.academy || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], academy: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          placeholder="e.g. Apex Martial Arts Academy or National Sports Institute"
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Degree / Rank / Level</label>
                                        <input
                                          type="text"
                                          value={item.degree || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], degree: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          placeholder="e.g. Black Belt 1st Dan / Diploma in Sports"
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Field of Study / Discipline</label>
                                        <input
                                          type="text"
                                          value={item.fieldOfStudy || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], fieldOfStudy: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          placeholder="e.g. Taekwondo, Combat Training, Athletics"
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Starting Date</label>
                                        <input
                                          type="date"
                                          value={item.startDate || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], startDate: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Ending Date</label>
                                        <input
                                          type="date"
                                          value={item.endDate || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], endDate: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="font-semibold text-foreground">Description / Notes</label>
                                        <textarea
                                          rows={2}
                                          value={item.description || ""}
                                          onChange={(e) => {
                                            const next = [...(editForm.academicHistory || [])];
                                            next[idx] = { ...next[idx], description: e.target.value };
                                            setEditForm({ ...editForm, academicHistory: next });
                                          }}
                                          placeholder="Key training milestones, tournaments attended, belt promotion notes..."
                                          className="w-full rounded-xl border border-border/80 bg-accent/20 px-3.5 py-2.5 text-xs text-foreground focus:border-primary outline-none resize-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = editForm.academicHistory || [];
                                    setEditForm({
                                      ...editForm,
                                      academicHistory: [
                                        ...current,
                                        { academy: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" },
                                      ],
                                    });
                                  }}
                                  className="w-full py-3 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/5 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Plus className="size-4" /> + Add Another Academy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submit / Cancel Buttons */}
                      <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setEditModalOpen(false)}
                          className="border border-border/80 rounded-full px-5 py-2.5 text-xs font-semibold hover:bg-accent/40 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-gold-gradient text-background rounded-full px-6 py-2.5 text-xs font-bold shadow-gold disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="size-3.5" />
                              <span>{isClubModal ? "Update Academy Profile" : "Save Changes"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. CHANGE AVATAR MODAL (Upload / Preset Picker)                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {avatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAvatarModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-md rounded-3xl border border-border/80 bg-background/95 p-6 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                    <Camera className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {isClub ? "Update Academy Logo" : "Update Profile Photo"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isClub ? "Upload official Academy Emblem / Logo (1:1 square crop, Max 2MB)" : "Upload your official ID photo (Max file size: 2MB)"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="size-8 rounded-full border border-border/70 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Uploaded / Current Photo Card */}
              {(() => {
                const currentImg = isClub ? (player?.logo || player?.image) : player?.image;
                const isValidImg = Boolean(
                  currentImg &&
                  !currentImg.includes("1500648767791-00dcc994a43e") &&
                  !currentImg.includes("avatar-1.jpg")
                );
                const displaySrc = uploadedPreviewUrl || (isValidImg ? currentImg : null);

                if (!displaySrc && !avatarFileName) return null;

                return (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-14 rounded-xl overflow-hidden border-2 border-primary/40 bg-background shadow-sm shrink-0 flex items-center justify-center">
                        {displaySrc ? (
                          <img
                            src={displaySrc}
                            alt="Profile Preview"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {avatarFileName || (isClub ? `${player?.name || "Academy"}_Logo.png` : `${player?.name || "Member"}_Photo.jpg`)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {avatarFileSize && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-foreground border border-border/70 font-semibold">
                              {avatarFileSize}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> {isClub ? "Active Logo" : "Active Photo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {displaySrc && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropSourceUrl(displaySrc);
                            setCropperModalOpen(true);
                          }}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="size-3.5" /> Adjust Crop
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Upload Zone */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isClub ? "Upload Academy Emblem / Logo" : "Upload From Device"}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer ${
                    uploadingAvatar
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/80 hover:border-primary/60 bg-accent/10 hover:bg-accent/20"
                  }`}
                >
                  {uploadingAvatar ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <RefreshCw className="size-7 text-primary animate-spin" />
                      <p className="text-xs font-bold text-foreground">
                        Uploading {avatarFileName || (isClub ? "logo" : "photo")}...
                      </p>
                      <div className="w-48 bg-background rounded-full h-1.5 overflow-hidden border border-border/60 mt-1">
                        <div
                          className="bg-primary h-full transition-all duration-300 rounded-full"
                          style={{ width: `${avatarUploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {avatarUploadProgress}% · {avatarFileSize || "Processing"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="size-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                        <UploadCloud className="size-5.5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground">
                          {isClub ? "Click to select academy logo / emblem from device" : "Click to select a photo from your device"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          JPG, PNG, WebP up to <strong className="text-foreground">2MB</strong> (1:1 Square recommended)
                        </p>
                      </div>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="bg-gold-gradient text-background rounded-full px-6 py-2 text-xs font-bold shadow-gold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. CHANGE PASSWORD MODAL (UPDATE Security)                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-md rounded-3xl border border-border/80 bg-background/95 p-6 sm:p-7 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                    <Lock className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Change Account Password
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Update your security credentials for member login
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="size-8 rounded-full border border-border/70 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">New Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-border/80 bg-accent/20 pl-3.5 pr-10 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-border/80 bg-accent/20 pl-3.5 pr-10 py-2.5 text-xs text-foreground focus:border-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="border border-border/80 rounded-full px-4 py-2 text-xs font-semibold hover:bg-accent/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="bg-gold-gradient text-background rounded-full px-5 py-2 text-xs font-bold shadow-gold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. DELETE ACCOUNT CONFIRMATION MODAL (DELETE Operation)                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-md rounded-3xl border border-destructive/60 bg-background/95 p-6 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="size-10 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-destructive">
                    Delete Profile Record?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action is permanent and cannot be reversed
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-3">
                <p>
                  Deleting your profile will permanently remove your athlete membership, rankings, tournament medal records, and login access from {fedName}.
                </p>
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 space-y-1 text-destructive">
                  <p className="font-bold">To confirm, please type your Member ID below:</p>
                  <p className="font-mono font-bold select-all">{player?.id}</p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${player?.id}" to confirm`}
                  className="w-full rounded-xl border border-destructive/50 bg-destructive/5 px-3.5 py-2.5 text-xs text-foreground focus:border-destructive outline-none font-mono"
                />
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="border border-border/80 rounded-full px-4 py-2 text-xs font-semibold hover:bg-accent/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    isDeleting ||
                    deleteConfirmText.trim().toLowerCase() !== player?.id?.toLowerCase()
                  }
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground rounded-full px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-40 hover:opacity-90 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Profile Modal */}
      {player && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          data={{
            title: `${player.name} - Official ${formatMemberType(player.memberType)} (${player.discipline})`,
            text: `Official Member ID: ${player.id} | ${player.state} | ${player.club || "Independent"} | Kalawar Sports & Martial Arts Federation of India`,
            image: player.image,
            code: player.id,
            category: player.discipline,
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. OFFICIAL REGISTRATION RECEIPT PREVIEW MODAL                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {receiptModalOpen && player && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-2xl rounded-3xl border border-primary/40 bg-card/95 p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/15 border border-primary/30 text-primary grid place-items-center shrink-0">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Official Registration Receipt</h3>
                    <p className="text-xs text-muted-foreground">
                      National Registration Record &amp; Member Accreditation Voucher
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="size-8 rounded-full border border-border/80 hover:border-primary grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Receipt Content Body */}
              <div className="rounded-2xl border-2 border-primary/30 bg-background/80 p-5 sm:p-6 space-y-5">
                {/* Organization Header */}
                <div className="text-center pb-4 border-b border-border/60 space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                    {settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}
                  </p>
                  <h4 className="text-base font-extrabold text-foreground tracking-tight">
                    DIGITAL REGISTRATION RECEIPT SLIP
                  </h4>
                  <div className="inline-block mt-1 rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 text-[10.5px] font-mono font-bold text-primary">
                    REF: REC-REG-{player.id}
                  </div>
                </div>

                {/* Member ID & Credentials Banner */}
                <div className="rounded-xl bg-accent/40 border border-primary/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Verified Member ID
                    </span>
                    <p className="text-gold-gradient font-mono text-xl font-black">{player.id}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-0.5">
                      {(!player.memberType || player.memberType === "Player") && player.username && (
                        <p>
                          Username: <span className="font-mono text-primary font-semibold">@{player.username}</span>
                        </p>
                      )}
                      <p>
                        Email: <span className="font-mono text-foreground">{player.email || "Registered Account"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      <span>{copied ? "Copied" : "Copy ID"}</span>
                    </button>
                  </div>
                </div>

                {/* Particulars Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-2 pt-1 border-b border-border/60 pb-5">
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Member Name</span>
                    <p className="font-bold text-foreground mt-0.5">{player.name}</p>
                  </div>
                  {(!player.memberType || player.memberType === "Player") && player.username && (
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Username</span>
                      <p className="font-bold text-primary font-mono mt-0.5">@{player.username}</p>
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Member Classification</span>
                    <p className="font-bold text-primary mt-0.5">{formatMemberType(player.memberType)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Discipline</span>
                    <p className="font-semibold text-foreground mt-0.5">{player.discipline || "Kalawar Martial Arts"}</p>
                  </div>
                  {player.ageGroup && (
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Age Division</span>
                      <p className="font-semibold text-foreground mt-0.5">{player.ageGroup}</p>
                    </div>
                  )}
                  {player.weightCategory && (
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Weight Category</span>
                      <p className="font-semibold text-foreground mt-0.5">{player.weightCategory}</p>
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">State Association</span>
                    <p className="font-semibold text-foreground mt-0.5">{player.state}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Affiliated Club</span>
                    <p className="font-semibold text-foreground mt-0.5">{player.club || "Independent"}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Registration Date</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatToDDMMYYYY(player.registeredOn, "Recorded")}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Accreditation Status</span>
                    <p className="font-bold text-emerald-400 mt-0.5">
                      {player.status || "Active"} · Recorded in National Ledger
                    </p>
                  </div>
                </div>

                {/* Footer Stamp & QR */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg border border-primary/30 shadow-xs">
                      <QRCode value={`https://kalawarmartialarts.org/id-cards/${encodeURIComponent(player.id)}`} size={52} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Digital Authorization Seal</p>
                      <p className="text-[10px]">Scannable for instant verification</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right text-xs">
                    <p className="font-bold text-foreground">KALAWAR Secretariat Desk</p>
                    <p className="text-[10px] text-muted-foreground">contact@kalawarfederation.org</p>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="border border-border/80 hover:border-primary/60 rounded-full px-5 py-2.5 text-xs font-semibold hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-5 py-2.5 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Printer className="size-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (player) {
                      downloadRegistrationReceiptPDF(player, settings.federationName);
                    }
                  }}
                  className="bg-gold-gradient text-background rounded-full px-6 py-2.5 text-xs font-bold shadow-gold hover:opacity-95 transition-opacity cursor-pointer inline-flex items-center gap-2"
                >
                  <Download className="size-4" />
                  <span>Download PDF Slip</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Photo Cropper Modal */}
      <PhotoCropperModal
        isOpen={cropperModalOpen}
        imageSrc={cropSourceUrl}
        onClose={() => setCropperModalOpen(false)}
        onCropComplete={handleCropComplete}
        cropShape={player?.memberType === "Club" ? "round" : "rect"}
        aspectRatio={
          player?.memberType === "Club"
            ? 1
            : player?.memberType === "Referee"
            ? 142 / 170
            : player?.memberType === "Coach"
            ? 144 / 178
            : 138 / 178
        }
        isSaving={isApplyingCrop}
        title={player?.memberType === "Club" ? "Adjust & Crop Club Logo" : "Adjust & Crop Profile Photo"}
      />
    </SiteLayout>
  );
}

function calculateAge(dobString?: string): number {
  if (!dobString) return 20;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 20;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(10, Math.min(60, age));
}
