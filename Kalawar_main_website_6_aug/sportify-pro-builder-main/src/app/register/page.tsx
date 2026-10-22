"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  User,
  Medal,
  Calendar,
  Phone,
  Mail,
  Building,
  Building2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Award,
  Scale,
  Landmark,
  Sparkles,
  ChevronDown,
  KeyRound,
  RotateCcw,
  X,
  FileText,
  Upload,
  UploadCloud,
  Trash2,
  Loader2,
  AlertCircle,
  Swords,
  Printer,
  Download,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { formatToDDMMYYYY, formatMemberType } from "@/lib/utils";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { IMAGES } from "@/data/images";
import { disciplines, states, type MemberType } from "@/data/people";
import { getDistrictsByState } from "@/data/india-districts";
import type { KalawarEvent } from "@/data/kalawar-events";
import {
  getClubDropdownOptions,
  getCoachDropdownOptions,
  getApprovedStateAssociationDropdownOptions,
  getApprovedDistrictAssociationDropdownOptions,
  extractStateFromOption,
  extractDistrictFromOption,
  INDEPENDENT_CLUB,
  INDEPENDENT_COACH,
} from "@/lib/club-coach-options";
import { REFEREE_LEVELS, DUTY_POSITIONS, type RefereeLevel, type RefereeItem } from "@/types/referee";
import {
  downloadRefereeReceiptPDF,
  printRefereeRegistrationSlip,
} from "@/lib/referee-license-pdf";

import {
  validatePhoneNumber,
  validateEmergencyContact,
  sanitizePhoneInput,
  validateEmail,
  validateFullName,
  validatePassword,
  validateDateOfBirth,
  validateExperienceYears,
  validateMatchesOfficiated,
  validateYearFounded,
  validateMemberCount,
  validateAddress,
  validateNationalId,
} from "@/lib/validation";

interface RegisteredResult {
  id: string;
  name: string;
  username?: string;
  email?: string;
  password?: string;
  memberType: MemberType;
  discipline: string;
  state: string;
  district?: string;
  city?: string;
  club?: string;
  ageGroup?: string;
  weightCategory?: string;
  currentRank?: string;
  level?: string;
  photo?: string;
  registeredOn: string;
  status: string;
}

const MEMBER_ROLES: {
  type: MemberType;
  title: string;
  badge: string;
  icon: typeof User;
  desc: string;
  prefix: string;
}[] = [
  {
    type: "Player",
    title: "Player / Athlete",
    badge: "Athlete Passport",
    icon: User,
    desc: "Official athlete registration for tournament participation and rankings.",
    prefix: "KSM-PL",
  },
  {
    type: "Coach",
    title: "Coach / Trainer",
    badge: "Accreditation",
    icon: Award,
    desc: "Accreditation and licensing for certified sports coaches.",
    prefix: "KSM-CO",
  },
  {
    type: "Referee",
    title: "Referee / Official",
    badge: "Technical License",
    icon: Scale,
    desc: "Officiating license application and match management accreditation.",
    prefix: "KSM-RF",
  },
  {
    type: "Club",
    title: "Club / Academy Affiliation",
    badge: "Institution",
    icon: Landmark,
    desc: "Affiliation for clubs, academies, and sports institutions.",
    prefix: "KSM-CL",
  },
  {
    type: "DistrictAssociation",
    title: "District Association",
    badge: "District Governance",
    icon: Building2,
    desc: "Official district governing association and regional administration onboarding.",
    prefix: "KSM-DA",
  },
  {
    type: "StateAssociation",
    title: "State Association",
    badge: "State Governance",
    icon: Building,
    desc: "Official state governing association and regional administration onboarding.",
    prefix: "KSM-SA",
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UnifiedRegistrationContent() {
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { settings, loading } = useSettings();

  const [clubOptions, setClubOptions] = useState<string[]>(() => getClubDropdownOptions());
  const [coachOptions, setCoachOptions] = useState<string[]>(() => getCoachDropdownOptions());
  const [rawStateAssociations, setRawStateAssociations] = useState<any[]>([]);
  const [rawDistrictAssociations, setRawDistrictAssociations] = useState<any[]>([]);

  useEffect(() => {
    async function loadDynamicOptions() {
      try {
        const [clubsRes, coachesRes, stateAssocRes, districtAssocRes] = await Promise.all([
          fetch("/api/clubs"),
          fetch("/api/coaches"),
          fetch("/api/state-associations"),
          fetch("/api/district-associations"),
        ]);
        const [clubsJson, coachesJson, stateAssocJson, districtAssocJson] = await Promise.all([
          clubsRes.json(),
          coachesRes.json(),
          stateAssocRes.json(),
          districtAssocRes.json(),
        ]);
        if (clubsJson?.success && Array.isArray(clubsJson.clubs)) {
          setClubOptions(getClubDropdownOptions(clubsJson.clubs));
        }
        if (coachesJson?.success && Array.isArray(coachesJson.coaches)) {
          setCoachOptions(getCoachDropdownOptions(coachesJson.coaches));
        }
        if (stateAssocJson?.success && Array.isArray(stateAssocJson.associations)) {
          setRawStateAssociations(stateAssocJson.associations);
        }
        if (districtAssocJson?.success && Array.isArray(districtAssocJson.associations)) {
          setRawDistrictAssociations(districtAssocJson.associations);
        }
      } catch (err) {
        console.warn("Using default options for registration dropdowns.");
      }
    }
    loadDynamicOptions();
  }, []);

  const queryType = searchParams.get("type");
  const initialRole: MemberType =
    queryType && ["player", "coach", "referee", "club", "stateassociation", "state_association", "state-association", "state", "districtassociation", "district_association", "district-association", "district"].includes(queryType.toLowerCase())
      ? queryType.toLowerCase().includes("district")
        ? "DistrictAssociation"
        : queryType.toLowerCase().includes("state")
        ? "StateAssociation"
        : (queryType.charAt(0).toUpperCase() + queryType.slice(1).toLowerCase() as MemberType)
      : "Player";

  const [selectedRole, setSelectedRole] = useState<MemberType>(initialRole);

  // Form State
  const [kalawarDisciplines, setKalawarDisciplines] = useState<KalawarEvent[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stateAssociation, setStateAssociation] = useState(initialRole === "StateAssociation" ? (states[0] || "Maharashtra") : "");
  const [customStateName, setCustomStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [customDistrictName, setCustomDistrictName] = useState("");

  // Approved State Association options for dropdowns (e.g. Santosh Kasbe ( Maharashtra ))
  const approvedStateOptions = useMemo(
    () => getApprovedStateAssociationDropdownOptions(rawStateAssociations),
    [rawStateAssociations]
  );

  // Resolved state name to filter constituent or approved district associations
  const selectedStateName = useMemo(() => {
    if (selectedRole === "StateAssociation") {
      return stateAssociation === "Other" ? customStateName.trim() : stateAssociation.trim();
    }
    return stateAssociation === "Other" ? customStateName.trim() : extractStateFromOption(stateAssociation);
  }, [selectedRole, stateAssociation, customStateName]);

  // Districts already registered for the selected state (to exclude duplicate District Association registrations)
  const takenDistrictsForSelectedState = useMemo(() => {
    if (!selectedStateName) return new Set<string>();
    const stateNorm = selectedStateName.trim().toLowerCase();
    const taken = new Set<string>();

    for (const da of rawDistrictAssociations) {
      const daState = String(da.state || "").trim().toLowerCase();
      const daStateAssoc = extractStateFromOption(String(da.stateAssociation || "")).trim().toLowerCase();

      if (daState === stateNorm || daStateAssoc === stateNorm || (!daState && !daStateAssoc)) {
        const distName = String(da.district || da.city || "").trim().toLowerCase();
        if (distName) {
          taken.add(distName);
        }
      }
    }
    return taken;
  }, [rawDistrictAssociations, selectedStateName]);

  // For District Association form: constituent districts of selected state (excluding taken districts)
  const constituentDistricts = useMemo(() => {
    const allDistricts = getDistrictsByState(selectedStateName);
    if (selectedRole !== "DistrictAssociation") {
      return allDistricts;
    }
    return allDistricts.filter((dst) => !takenDistrictsForSelectedState.has(dst.trim().toLowerCase()));
  }, [selectedStateName, selectedRole, takenDistrictsForSelectedState]);

  // For Player, Coach, Club, Referee forms: approved district associations for selected state (e.g. Sharik ( Kolhapur))
  const approvedDistrictOptions = useMemo(() => {
    return getApprovedDistrictAssociationDropdownOptions(rawDistrictAssociations, selectedStateName);
  }, [rawDistrictAssociations, selectedStateName]);
  const [discipline, setDiscipline] = useState<string>("Kalawar Martial Arts");
  const [ageGroup, setAgeGroup] = useState("");
  const [weightCategory, setWeightCategory] = useState("");
  const [club, setClub] = useState(INDEPENDENT_CLUB);
  const [customClub, setCustomClub] = useState("");
  const [dob, setDob] = useState("");
  const [coachName, setCoachName] = useState(INDEPENDENT_COACH);
  const [customCoach, setCustomCoach] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [gender, setGender] = useState("Male");

  // Coach fields
  const [coachRegistrationType, setCoachRegistrationType] = useState<string>("");
  const [qualification, setQualification] = useState("Level 0 - Trainee Coach");
  const [experienceYears, setExperienceYears] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [coachDocument, setCoachDocument] = useState("");
  const [coachDocumentName, setCoachDocumentName] = useState("");
  const [coachDocumentSize, setCoachDocumentSize] = useState("");
  const [isUploadingCoachDoc, setIsUploadingCoachDoc] = useState(false);
  const [coachUploadProgress, setCoachUploadProgress] = useState(0);

  // Referee fields & attachments
  const [refereeLevel, setRefereeLevel] = useState<RefereeLevel>(REFEREE_LEVELS[0] || "Level 1 – Junior Referee");
  const [refereeDanRank, setRefereeDanRank] = useState("1st Dan Black Belt");
  const [refereeSpecialization, setRefereeSpecialization] = useState("Mat / Ring Referee");
  const [matchesOfficiated, setMatchesOfficiated] = useState("");
  const [refereePhoto, setRefereePhoto] = useState("");
  const [refereePhotoName, setRefereePhotoName] = useState("");
  const [refereePhotoSize, setRefereePhotoSize] = useState("");
  const [refereeDanCertDoc, setRefereeDanCertDoc] = useState("");
  const [refereeDanCertName, setRefereeDanCertName] = useState("");
  const [refereeDanCertSize, setRefereeDanCertSize] = useState("");
  const [refereeAadhaarDoc, setRefereeAadhaarDoc] = useState("");
  const [refereeAadhaarName, setRefereeAadhaarName] = useState("");
  const [refereeAadhaarSize, setRefereeAadhaarSize] = useState("");
  const [refereeDeclaration, setRefereeDeclaration] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    docData: string;
    docName?: string;
  } | null>(null);

  // Club fields
  const [registrationType, setRegistrationType] = useState<string>("");
  const [yearFounded, setYearFounded] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [headCoachName, setHeadCoachName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [website, setWebsite] = useState("");
  const [affiliationDocument, setAffiliationDocument] = useState("");
  const [affiliationDocumentName, setAffiliationDocumentName] = useState("");
  const [affiliationDocumentSize, setAffiliationDocumentSize] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const refereePhotoInputRef = useRef<HTMLInputElement>(null);
  const refereeDanCertInputRef = useRef<HTMLInputElement>(null);
  const refereeAadhaarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/kalawar-events")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.events)) {
          setKalawarDisciplines(data.events);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic Kalawar category calculations
  const matchedKalawar = kalawarDisciplines.find(
    (k) =>
      k.name.toLowerCase() === discipline.toLowerCase() ||
      k.slug.toLowerCase() === discipline.toLowerCase() ||
      discipline.toLowerCase().includes(k.slug.replace("-", " "))
  );

  const isSantulana =
    matchedKalawar?.hasWeightCategories === false ||
    discipline.toLowerCase().includes("santulana");

  const DEFAULT_AGE_DIVISIONS = ["U-8", "U-10", "U-12", "U-14", "U-17", "U-19", "Seniors / Open", "Masters"];

  const DEFAULT_WEIGHT_CLASSES = [
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
  ];

  const currentAgeDiv =
    matchedKalawar?.ageWeight?.find((a) => a.group === ageGroup) ||
    matchedKalawar?.ageWeight?.[0];

  const currentWeightClasses = currentAgeDiv
    ? gender === "Female"
      ? currentAgeDiv.weightClassesFemale
      : currentAgeDiv.weightClassesMale
    : [];

  const availableAgeGroups =
    matchedKalawar?.ageWeight && matchedKalawar.ageWeight.length > 0
      ? matchedKalawar.ageWeight.map((a) => a.group)
      : DEFAULT_AGE_DIVISIONS;

  const availableWeightClasses = isSantulana
    ? ["Open Weight (Agility & Balance Evaluation)"]
    : currentWeightClasses && currentWeightClasses.length > 0
    ? currentWeightClasses
    : DEFAULT_WEIGHT_CLASSES;

  useEffect(() => {
    if (queryType) {
      const lower = queryType.toLowerCase().replace(/[_-]/g, "");
      if (lower.includes("state")) {
        setSelectedRole("StateAssociation");
      } else {
        const formatted = (queryType.charAt(0).toUpperCase() +
          queryType.slice(1).toLowerCase()) as MemberType;
        if (["Player", "Coach", "Referee", "Club"].includes(formatted)) {
          setSelectedRole(formatted);
        }
      }
    }

    const qDiscipline = searchParams.get("discipline");
    const qGroup = searchParams.get("group");
    const qGender = searchParams.get("gender");

    if (qDiscipline || qGroup || qGender) {
      if (qDiscipline) {
        setDiscipline(qDiscipline);
      }

      if (qGender) {
        const normalizedGender = qGender.toLowerCase().startsWith("f") ? "Female" : "Male";
        setGender(normalizedGender);
      }

      if (qGroup) {
        setAgeGroup(qGroup);
      }
    }

    const qRegType = searchParams.get("regType") || searchParams.get("registrationType");
    if (qRegType) {
      const lower = qRegType.toLowerCase();
      if (lower === "apply" || lower === "apply for affiliation" || lower.includes("apply")) {
        setRegistrationType("Apply for Affiliation");
        setCoachRegistrationType("Apply For Coach");
      } else if (lower === "already" || lower === "already affiliated" || lower.includes("already")) {
        setRegistrationType("Already Affiliated");
        setCoachRegistrationType("Already a Coach");
      }
    }
  }, [queryType, searchParams]);

  // Referee file upload handler using FileReader (Base64)
  const handleRefereeFileUpload = (
    type: "photo" | "danCert" | "aadhaar",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large", { description: "Maximum allowed file size is 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeFormatted = formatFileSize(file.size);

      if (type === "photo") {
        setRefereePhoto(dataUrl);
        setRefereePhotoName(file.name);
        setRefereePhotoSize(sizeFormatted);
        clearError("refereePhoto");
        toast.success("Passport Photo Selected", { description: `${file.name} (${sizeFormatted})` });
      } else if (type === "danCert") {
        setRefereeDanCertDoc(dataUrl);
        setRefereeDanCertName(file.name);
        setRefereeDanCertSize(sizeFormatted);
        toast.success("Dan Rank Proof Attached", { description: `${file.name} (${sizeFormatted})` });
      } else if (type === "aadhaar") {
        setRefereeAadhaarDoc(dataUrl);
        setRefereeAadhaarName(file.name);
        setRefereeAadhaarSize(sizeFormatted);
        toast.success("ID Proof Document Attached", { description: `${file.name} (${sizeFormatted})` });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoachDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload a document under 2MB." });
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setIsUploadingCoachDoc(true);
    setCoachUploadProgress(5);
    setCoachDocumentName(file.name);
    setCoachDocumentSize(formattedSize);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_coach_documents");

      const timer = setInterval(() => {
        setCoachUploadProgress((prev) => {
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
            setCoachUploadProgress((curr) => Math.max(curr, pct));
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

      if (res.ok && res.data?.success && res.data?.url) {
        setCoachUploadProgress(100);
        await new Promise((r) => setTimeout(r, 450));
        setCoachDocument(res.data.url);
        toast.success("Coach credential proof attached", { description: `${file.name} (${formattedSize})` });
        return;
      }

      // Fallback
      setCoachUploadProgress(100);
      await new Promise((r) => setTimeout(r, 350));
      const reader = new FileReader();
      reader.onload = () => {
        setCoachDocument(reader.result as string);
        toast.success("Coach credential proof attached", { description: `${file.name} (${formattedSize})` });
      };
      reader.readAsDataURL(file);
    } catch {
      setCoachUploadProgress(100);
      const reader = new FileReader();
      reader.onload = () => {
        setCoachDocument(reader.result as string);
        toast.success("Coach credential proof attached", { description: `${file.name} (${formattedSize})` });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCoachDoc(false);
      setCoachUploadProgress(0);
    }
  };

  const handleAffiliationDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload an affiliation document under 2MB." });
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setIsUploadingDoc(true);
    setUploadProgress(5);
    setAffiliationDocumentName(file.name);
    setAffiliationDocumentSize(formattedSize);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_affiliation_documents");

      const timer = setInterval(() => {
        setUploadProgress((prev) => {
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
        xhr.send(formData);
      });

      if (res.ok && res.data?.success && res.data?.url) {
        setUploadProgress(100);
        await new Promise((r) => setTimeout(r, 450));
        setAffiliationDocument(res.data.url);
        toast.success("Affiliation document uploaded", { description: `${file.name} (${formattedSize})` });
        return;
      }

      // Fallback
      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 350));
      const reader = new FileReader();
      reader.onload = () => {
        setAffiliationDocument(reader.result as string);
        toast.success("Affiliation document attached", { description: `${file.name} (${formattedSize})` });
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadProgress(100);
      const reader = new FileReader();
      reader.onload = () => {
        setAffiliationDocument(reader.result as string);
        toast.success("Affiliation document attached", { description: `${file.name} (${formattedSize})` });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(0);
    }
  };

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRoleChange = (role: MemberType) => {
    setSelectedRole(role);
    setErrors({});
    if (role === "StateAssociation") {
      setStateAssociation(states[0] || "Maharashtra");
    } else {
      setStateAssociation("");
    }
    setCustomStateName("");
    setDistrict("");
    setCustomDistrictName("");
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<RegisteredResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 2FA Email Verification State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  // Countdown timer for 2FA resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show2FAModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [show2FAModal, countdown]);

  const activeRoleConfig = MEMBER_ROLES.find((r) => r.type === selectedRole) || MEMBER_ROLES[0];

  const verifyUsernameNotTaken = async (val: string) => {
    const clean = val.trim().toLowerCase().replace(/\s+/g, "");
    if (!clean) {
      setUsernameAvailable(null);
      return;
    }
    if (clean.length < 3) {
      setUsernameAvailable(false);
      setErrors((prev) => ({ ...prev, username: "Username must be at least 3 characters." }));
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
      setUsernameAvailable(false);
      setErrors((prev) => ({ ...prev, username: "Username can only contain letters, numbers, underscores, dots, or hyphens." }));
      return;
    }
    setUsernameChecking(true);
    try {
      const resp = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
      const json = await resp.json();
      if (!json.available) {
        setUsernameAvailable(false);
        setErrors((prev) => ({ ...prev, username: json.error || "This username is already taken. Please choose another username." }));
      } else {
        setUsernameAvailable(true);
        clearError("username");
      }
    } catch {
      // ignore
    } finally {
      setUsernameChecking(false);
    }
  };

  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!clean) {
      setUsernameAvailable(null);
      return;
    }
    if (clean.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
      return;
    }
    const timer = setTimeout(() => {
      verifyUsernameNotTaken(clean);
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const verifyEmailNotTaken = async (val: string) => {
    const clean = val.trim();
    if (!clean) return;
    const res = validateEmail(clean, { required: true });
    if (!res.isValid) {
      setErrors((prev) => ({ ...prev, email: "Wrong email ID" }));
      return;
    }
    try {
      const resp = await fetch(`/api/auth/check-email?email=${encodeURIComponent(clean)}`);
      const json = await resp.json();
      if (!json.available) {
        setErrors((prev) => ({ ...prev, email: json.error || "This email address is already registered." }));
      } else {
        clearError("email");
      }
    } catch {
      // ignore
    }
  };

  // Comprehensive Form Validator for all user types
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Common: Full Name / Club Name
    const isClub = selectedRole === "Club";
    const nameVal = validateFullName(name, {
      required: true,
      fieldName: isClub ? "Club / Academy Association Name" : "Full Name",
      minLength: isClub ? 3 : 2,
      isClub,
    });
    if (!nameVal.isValid) {
      newErrors.name = nameVal.error || "Invalid name";
    }

    // 2. Common: Email Address
    const emailVal = validateEmail(email, { required: true });
    if (!emailVal.isValid) {
      newErrors.email = emailVal.error || "Invalid email address";
    }

    // 3. Common: Phone Number
    const phoneVal = validatePhoneNumber(phone, { required: true, fieldName: "Contact number" });
    if (!phoneVal.isValid) {
      newErrors.phone = phoneVal.error || "Invalid phone number";
    }

    // 4. Common: State / State Association & Discipline
    if (selectedRole === "StateAssociation") {
      if (!stateAssociation || !stateAssociation.trim()) {
        newErrors.stateAssociation = "Please select a state.";
      }
      if (stateAssociation === "Other" && (!customStateName || !customStateName.trim())) {
        newErrors.customStateName = "Please enter your state name.";
      }
    } else {
      if (!stateAssociation || !stateAssociation.trim()) {
        newErrors.stateAssociation = "Please select a State Association.";
      }
      if (stateAssociation === "Other" && (!customStateName || !customStateName.trim())) {
        newErrors.customStateName = "Please enter your State Association name.";
      }
    }

    if (selectedRole !== "Club" && selectedRole !== "StateAssociation" && selectedRole !== "DistrictAssociation" && (!discipline || !discipline.trim())) {
      newErrors.discipline = "Please select a sport discipline.";
    }

    // 5. Common: Password & Confirm Password
    const passVal = validatePassword(password, confirmPassword, { minLength: 6 });
    if (!passVal.isValid) {
      if (!password || password.length < 6) {
        newErrors.password = passVal.error || "Password must be at least 6 characters.";
      } else {
        newErrors.confirmPassword = passVal.error || "Passwords do not match.";
      }
    }

    // Username validation for all roles
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      newErrors.username = "Username is required.";
    } else if (cleanUsername.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      newErrors.username = "Username can only contain letters, numbers, underscores, dots, or hyphens.";
    }

    // Role-specific validation rules
    if (selectedRole === "Player") {

      // Date of Birth
      const dobVal = validateDateOfBirth(dob, { required: true, minAge: 4, maxAge: 100 });
      if (!dobVal.isValid) {
        newErrors.dob = dobVal.error || "Please enter a valid date of birth.";
      }

      // Gender
      if (!gender || !gender.trim()) {
        newErrors.gender = "Please select gender.";
      }

      // Age Group
      if (!ageGroup || !ageGroup.trim() || ageGroup === "Select Age") {
        newErrors.ageGroup = "Please select Age Division / Age Group.";
      }

      // Weight Category
      if (!isSantulana && (!weightCategory || !weightCategory.trim() || weightCategory === "Select Category")) {
        newErrors.weightCategory = "Please select Weight Category.";
      }

      // National ID / Aadhaar (optional format check)
      if (idNumber.trim()) {
        const idVal = validateNationalId(idNumber, { required: false });
        if (!idVal.isValid) {
          newErrors.idNumber = idVal.error || "Invalid ID number format.";
        }
      }

      // Emergency Contact (optional format check)
      if (emergencyContact.trim()) {
        const emVal = validateEmergencyContact(emergencyContact, { required: false });
        if (!emVal.isValid) {
          newErrors.emergencyContact = emVal.error || "Invalid emergency contact number.";
        }
      }

      // PIN Code (optional format check if filled at registration)
      if (pincode.trim()) {
        const pinClean = pincode.trim().replace(/\D/g, "");
        if (pinClean.length !== 6) {
          newErrors.pincode = "Please enter a valid 6-digit PIN Code.";
        }
      }

      // District Association *
      if (!district || !district.trim()) {
        newErrors.district = "Please select your District Association.";
      }
      if (district === "Other" && (!customDistrictName || !customDistrictName.trim())) {
        newErrors.customDistrictName = "Please enter your District Association name.";
      }

      // Custom Club / Academy if Other is chosen
      if (club === "Other" && !customClub.trim()) {
        newErrors.customClub = "Please enter your Affiliated Club / Academy name.";
      }

      // Custom Coach / Trainer if Other is chosen
      if (coachName === "Other" && !customCoach.trim()) {
        newErrors.customCoach = "Please enter your Assigned Coach / Trainer name.";
      }
    } else if (selectedRole === "Coach") {
      // District Association *
      if (!district || !district.trim()) {
        newErrors.district = "Please select your District Association.";
      }
      if (district === "Other" && (!customDistrictName || !customDistrictName.trim())) {
        newErrors.customDistrictName = "Please enter your District Association name.";
      }

      // Registration Type for Coach (Mandatory)
      if (!coachRegistrationType || coachRegistrationType.trim() === "" || coachRegistrationType === "Choose Registration type") {
        newErrors.coachRegistrationType = "Choose Registration type it is mandatory";
      }

      // Mandatory Document proof when Already a Coach is selected
      if (coachRegistrationType === "Already a Coach") {
        if (!coachDocument || !coachDocument.trim()) {
          newErrors.coachDocument = "Official Coach Certification or Black Belt proof is required for Already a Coach.";
        }
      }

      // Qualification
      if (!qualification || !qualification.trim()) {
        newErrors.qualification = "Please select coaching qualification.";
      }

      // Experience Years
      const expVal = validateExperienceYears(experienceYears, {
        required: true,
        fieldName: "Coaching experience",
        min: 0,
        max: 60,
      });
      if (!expVal.isValid) {
        newErrors.experienceYears = expVal.error || "Please enter valid coaching experience in years (0-60).";
      }

      // Custom Academy / Club if Other is chosen
      if (club === "Other" && !customClub.trim()) {
        newErrors.customClub = "Please enter your Affiliated Academy / Club name.";
      }

      // National ID / Passport (optional)
      if (idNumber.trim()) {
        const idVal = validateNationalId(idNumber, { required: false });
        if (!idVal.isValid) {
          newErrors.idNumber = idVal.error || "Invalid ID number format.";
        }
      }
    } else if (selectedRole === "Referee") {
      // District Association *
      if (!district || !district.trim()) {
        newErrors.district = "Please select your District Association.";
      }
      if (district === "Other" && (!customDistrictName || !customDistrictName.trim())) {
        newErrors.customDistrictName = "Please enter your District Association name.";
      }

      // Current Dan Rank *
      if (!refereeDanRank || !refereeDanRank.trim()) {
        newErrors.refereeDanRank = "Please enter your current Dan rank / belt.";
      }

      // Applying for Referee Level *
      if (!refereeLevel || !refereeLevel.trim()) {
        newErrors.refereeLevel = "Please select referee level.";
      }

      // Total Martial Arts Experience *
      const expVal = validateExperienceYears(experienceYears, {
        required: true,
        fieldName: "Martial arts experience",
        min: 0,
        max: 60,
      });
      if (!expVal.isValid) {
        newErrors.experienceYears = expVal.error || "Please enter valid martial arts experience in years (0-60).";
      }

      // Passport Photograph * (Mandatory for Official ID card)
      if (!refereePhoto || !refereePhoto.trim()) {
        newErrors.refereePhoto = "Please upload your official passport size photo.";
      }

      // Statutory Declaration * (Mandatory)
      if (!refereeDeclaration) {
        newErrors.refereeDeclaration = "Please accept the Statutory Fair Adjudication Declaration.";
      }

      // Matches Officiated (optional)
      if (matchesOfficiated.trim()) {
        const matchesVal = validateMatchesOfficiated(matchesOfficiated, { required: false, min: 0, max: 5000 });
        if (!matchesVal.isValid) {
          newErrors.matchesOfficiated = matchesVal.error || "Matches officiated must be between 0 and 5000.";
        }
      }

      // National ID / Passport (optional)
      if (idNumber.trim()) {
        const idVal = validateNationalId(idNumber, { required: false });
        if (!idVal.isValid) {
          newErrors.idNumber = idVal.error || "Invalid ID number format.";
        }
      }
    } else if (selectedRole === "Club") {
      // District Association Unit
      if (!district || !district.trim()) {
        newErrors.district = "Please select your district association unit.";
      }
      if (district === "Other" && (!customDistrictName || !customDistrictName.trim())) {
        newErrors.customDistrictName = "Please enter your District Association name.";
      }

      // Head Coach Name
      const coachVal = validateFullName(headCoachName, {
        required: true,
        fieldName: "Head Coach name",
        minLength: 2,
      });
      if (!coachVal.isValid) {
        newErrors.headCoachName = coachVal.error || "Please enter Head Coach name.";
      }

      // Year Founded
      const yearVal = validateYearFounded(yearFounded, { required: true, minYear: 1800 });
      if (!yearVal.isValid) {
        newErrors.yearFounded = yearVal.error || "Please enter a valid 4-digit year founded.";
      }

      // President Name
      const presVal = validateFullName(presidentName, {
        required: true,
        fieldName: "President name",
        minLength: 2,
      });
      if (!presVal.isValid) {
        newErrors.presidentName = presVal.error || "Please enter president name.";
      }

      // Secretary Name (optional)
      if (secretaryName.trim()) {
        const secVal = validateFullName(secretaryName, {
          required: false,
          fieldName: "Secretary name",
          minLength: 2,
        });
        if (!secVal.isValid) {
          newErrors.secretaryName = secVal.error || "Invalid secretary name.";
        }
      }

      // Member Count (optional)
      if (memberCount.trim()) {
        const countVal = validateMemberCount(memberCount, { required: false, min: 0, max: 50000 });
        if (!countVal.isValid) {
          newErrors.memberCount = countVal.error || "Member count must be between 0 and 50000.";
        }
      }

      // Alternate Phone (optional)
      if (alternatePhone.trim()) {
        const altPhoneVal = validatePhoneNumber(alternatePhone, {
          required: false,
          fieldName: "Alternate phone number",
          allowLandline: true,
        });
        if (!altPhoneVal.isValid) {
          newErrors.alternatePhone = altPhoneVal.error || "Invalid alternate phone number.";
        }
      }

      // Registered Address
      const addrVal = validateAddress(registeredAddress, {
        required: true,
        fieldName: "Registered facility address",
        minLength: 8,
      });
      if (!addrVal.isValid) {
        newErrors.registeredAddress = addrVal.error || "Please enter full facility address (min. 8 characters).";
      }

      // Registration Type for Club (Mandatory: must not be empty or unselected)
      if (!registrationType || registrationType.trim() === "" || registrationType === "Choose Registration Type") {
        newErrors.registrationType = "Choose Registration Type it is mandatory";
      }

      // Mandatory Affiliation Document ONLY when "Already Affiliated" is selected
      if (registrationType === "Already Affiliated") {
        if (!affiliationDocument || !affiliationDocument.trim()) {
          newErrors.affiliationDocument = "Official Affiliation Document is mandatory for Already Affiliated clubs. Please upload your Affiliation Certificate or Registration Deed.";
        }
      }
    } else if (selectedRole === "StateAssociation") {
      // Year Founded (optional format check)
      if (yearFounded.trim()) {
        const yearVal = validateYearFounded(yearFounded, { required: false, minYear: 1800 });
        if (!yearVal.isValid) {
          newErrors.yearFounded = yearVal.error || "Please enter a valid 4-digit year founded.";
        }
      }

      // President Name (optional format check)
      if (presidentName.trim()) {
        const presVal = validateFullName(presidentName, {
          required: false,
          fieldName: "President name",
          minLength: 2,
        });
        if (!presVal.isValid) {
          newErrors.presidentName = presVal.error || "Invalid president name.";
        }
      }

      // Secretary Name (optional format check)
      if (secretaryName.trim()) {
        const secVal = validateFullName(secretaryName, {
          required: false,
          fieldName: "Secretary name",
          minLength: 2,
        });
        if (!secVal.isValid) {
          newErrors.secretaryName = secVal.error || "Invalid secretary name.";
        }
      }
    } else if (selectedRole === "DistrictAssociation") {
      // District *
      if (!district || !district.trim()) {
        newErrors.district = "Please select a district.";
      }
      if (district === "Other" && (!customDistrictName || !customDistrictName.trim())) {
        newErrors.customDistrictName = "Please enter your district name.";
      }
      if (district === "Other" && customDistrictName.trim()) {
        if (takenDistrictsForSelectedState.has(customDistrictName.trim().toLowerCase())) {
          newErrors.customDistrictName = `A District Association for "${customDistrictName.trim()}" is already registered in this state.`;
        }
      }

      // Year Founded (optional format check)
      if (yearFounded.trim()) {
        const yearVal = validateYearFounded(yearFounded, { required: false, minYear: 1800 });
        if (!yearVal.isValid) {
          newErrors.yearFounded = yearVal.error || "Please enter a valid 4-digit year founded.";
        }
      }

      // President Name (optional format check)
      if (presidentName.trim()) {
        const presVal = validateFullName(presidentName, {
          required: false,
          fieldName: "President name",
          minLength: 2,
        });
        if (!presVal.isValid) {
          newErrors.presidentName = presVal.error || "Invalid president name.";
        }
      }

      // Secretary Name (optional format check)
      if (secretaryName.trim()) {
        const secVal = validateFullName(secretaryName, {
          required: false,
          fieldName: "Secretary name",
          minLength: 2,
        });
        if (!secVal.isValid) {
          newErrors.secretaryName = secVal.error || "Invalid secretary name.";
        }
      }
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      if (newErrors.email) {
        toast.error("Wrong email ID", {
          description: "Please enter a valid email address (e.g. player@example.com).",
        });
      } else if (newErrors.coachRegistrationType) {
        toast.error("Choose Registration type it is mandatory", {
          description: "Please select either 'Apply For Coach' or 'Already a Coach' to proceed with coach registration.",
        });
      } else if (newErrors.registrationType) {
        toast.error("Choose Registration Type it is mandatory", {
          description: "Please select either 'Apply for Affiliation' or 'Already Affiliated' to proceed with club registration.",
        });
      } else {
        const firstError = newErrors[errorKeys[0]];
        toast.error("Form Validation Error", {
          description: firstError,
        });
      }
      return false;
    }

    return true;
  };

  // Step 1: Validate Form and Request 2FA Email OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (errors.email) {
      toast.error("Invalid or duplicate email", { description: errors.email });
      return;
    }

    const chosenState =
      stateAssociation === "Other" ? customStateName.trim() : stateAssociation.trim();

    const chosenDistrict =
      selectedRole === "StateAssociation"
        ? (city.trim() || "")
        : (district === "Other" ? customDistrictName.trim() : district.trim());

    const payload: Record<string, any> = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      state: chosenState,
      district: chosenDistrict,
      city: chosenDistrict || city.trim(),
      discipline: selectedRole === "Referee" || selectedRole === "StateAssociation" || selectedRole === "DistrictAssociation" ? "Kalawar Martial Arts" : (discipline || "Kalawar Martial Arts"),
      memberType: selectedRole,
      password,
      status: selectedRole === "Referee" ? "Application Submitted" : "Pending",
      points: 0,
      isRegistration: true,
    };

    if (selectedRole === "Player") {
      payload.username = username.trim().toLowerCase();
      payload.dob = dob;
      payload.gender = gender;
      payload.ageGroup = ageGroup;
      payload.weightCategory = isSantulana ? "Open Weight (Agility & Balance Evaluation)" : weightCategory;
      payload.club = (club === "Other" ? customClub.trim() : club.trim()) || INDEPENDENT_CLUB;
      payload.coachName = (coachName === "Other" ? customCoach.trim() : coachName.trim()) || INDEPENDENT_COACH;
      payload.idNumber = idNumber.trim();
      payload.emergencyContact = emergencyContact.trim();
      payload.city = chosenDistrict || city.trim();
      payload.district = chosenDistrict;
      payload.stateAssociation = chosenState;
      payload.districtAssociation = chosenDistrict;
      if (address.trim()) payload.address = address.trim();
      if (pincode.trim()) payload.pincode = pincode.trim().replace(/\D/g, "");
    } else if (selectedRole === "Coach") {
      payload.registrationType = coachRegistrationType;
      payload.qualification = qualification;
      payload.experienceYears = experienceYears.trim();
      payload.specialization = specialization.trim();
      payload.club = (club === "Other" ? customClub.trim() : club.trim()) || INDEPENDENT_CLUB;
      payload.idNumber = idNumber.trim();
      payload.city = chosenDistrict || city.trim();
      payload.district = chosenDistrict;
      payload.stateAssociation = chosenState;
      payload.districtAssociation = chosenDistrict;
      payload.affiliationDocument = coachDocument;
      payload.affiliationDocumentName = coachDocumentName;
      payload.affiliationDocumentSize = coachDocumentSize;
    } else if (selectedRole === "Referee") {
      payload.dob = dob;
      payload.city = chosenDistrict || city.trim();
      payload.district = chosenDistrict || city.trim();
      payload.state = chosenState;
      payload.stateAssociation = chosenState;
      payload.districtAssociation = chosenDistrict;
      payload.officiatingGrade = refereeLevel;
      payload.level = refereeLevel;
      payload.beltRank = refereeDanRank.trim();
      payload.currentRank = refereeDanRank.trim();
      payload.specialization = refereeSpecialization;
      payload.experienceYears = experienceYears.trim();
      payload.martialArtsExperience = experienceYears.trim() ? `${experienceYears.trim()} Years` : "3 Years";
      payload.matchesOfficiated = matchesOfficiated.trim() ? Number(matchesOfficiated) : 0;
      payload.academy = club.trim() || "Independent";
      payload.club = club.trim() || "Independent";
      payload.idNumber = idNumber.trim();
      payload.photo = refereePhoto;
      payload.certificationDocument = refereeDanCertDoc;
      payload.certificationDocumentName = refereeDanCertName;
      payload.certificationDocumentSize = refereeDanCertSize;
      payload.affiliationDocument = refereeDanCertDoc;
      payload.affiliationDocumentName = refereeDanCertName;
      payload.affiliationDocumentSize = refereeDanCertSize;
      payload.aadhaarDoc = refereeAadhaarDoc;
      payload.aadhaarDocName = refereeAadhaarName;
      payload.aadhaarDocSize = refereeAadhaarSize;
    } else if (selectedRole === "Club") {
      payload.discipline = "Kalawar Martial Arts";
      payload.disciplines = ["Kalawar Martial Arts"];
      payload.registrationType = registrationType;
      payload.district = chosenDistrict;
      payload.city = chosenDistrict;
      payload.state = chosenState;
      payload.stateAssociation = chosenState;
      payload.districtAssociation = chosenDistrict;
      payload.headCoachName = headCoachName.trim();
      payload.registrationNumber = registrationNumber.trim();
      payload.yearFounded = yearFounded.trim();
      payload.registeredAddress = registeredAddress.trim();
      payload.presidentName = presidentName.trim();
      payload.secretaryName = secretaryName.trim();
      payload.memberCount = memberCount.trim();
      payload.alternatePhone = alternatePhone.trim();
      payload.website = website.trim();
      payload.club = name.trim();
      payload.affiliationDocument = affiliationDocument;
      payload.affiliationDocumentName = affiliationDocumentName;
      payload.affiliationDocumentSize = affiliationDocumentSize;
    } else if (selectedRole === "StateAssociation") {
      if (yearFounded.trim()) payload.yearFounded = yearFounded.trim();
      if (presidentName.trim()) payload.presidentName = presidentName.trim();
      if (secretaryName.trim()) payload.secretaryName = secretaryName.trim();
      if (city.trim()) {
        payload.city = city.trim();
        payload.district = city.trim();
      }
      if (address.trim()) payload.address = address.trim();
      payload.status = "Pending";
    } else if (selectedRole === "DistrictAssociation") {
      if (yearFounded.trim()) payload.yearFounded = yearFounded.trim();
      if (presidentName.trim()) payload.presidentName = presidentName.trim();
      if (secretaryName.trim()) payload.secretaryName = secretaryName.trim();
      payload.district = chosenDistrict;
      payload.city = chosenDistrict || city.trim();
      payload.state = chosenState;
      payload.stateAssociation = chosenState;
      payload.districtAssociation = chosenDistrict;
      if (address.trim()) payload.address = address.trim();
      payload.status = "Pending";
    }

    // For Player registration: remove OTP, directly finalize registration
    if (selectedRole === "Player") {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to complete player registration");
        }

        const finalEmail = data.player?.email || email.trim().toLowerCase();
        const finalPassword = password;

        setRegisteredResult({
          id: data.player.id,
          name: data.player.name,
          username: data.player?.username || username.trim() || undefined,
          email: finalEmail,
          password: finalPassword,
          memberType: "Player",
          discipline: data.player.discipline,
          state: data.player.state,
          district: data.player.district || chosenDistrict,
          city: data.player.city || chosenDistrict,
          club: data.player.club || (club === "Other" ? customClub.trim() : club.trim()) || INDEPENDENT_CLUB,
          ageGroup: data.player.ageGroup || ageGroup,
          weightCategory: data.player.weightCategory || (isSantulana ? "Open Weight (Agility & Balance Evaluation)" : weightCategory),
          currentRank: data.player.beltRank,
          photo: data.player.image,
          registeredOn: data.player.registeredOn,
          status: data.player.status || "Pending",
        });

        // Update global auth state with user and session token
        const authUser = data.user || {
          id: data.player.id,
          name: data.player.name,
          email: data.player.email,
          phone: data.player.phone,
          dob: data.player.dob,
          gender: data.player.gender,
          beltRank: data.player.beltRank,
          club: data.player.club,
          state: data.player.state,
          district: data.player.district,
          status: data.player.status,
          role: "member",
          memberType: "Player",
          discipline: data.player.discipline,
          avatar: data.player.image,
        };
        setUser(authUser, data.token || null);

        toast.success("Email Verified & Registration Complete!", {
          description: `Your email is verified successfully! Official Member ID: ${data.player.id}`,
        });
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: err.message }));
        }
        toast.error("Registration Failed", {
          description: err.message || "Could not complete player registration",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Trigger 2FA OTP Email for other member types
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error && data.error.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: data.error }));
        }
        throw new Error(data.error || "Failed to send 2FA verification code");
      }

      setPendingPayload(payload);
      setTempToken(data.tempToken);
      setMaskedEmail(data.maskedEmail || email.trim());
      setCountdown(60);
      setCanResend(false);
      setOtpCode("");
      setShow2FAModal(true);

      toast.info("2FA Verification Required", {
        description: `We've sent a 6-digit verification code to ${data.maskedEmail}`,
      });
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message || "Could not initiate verification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and Finalize Registration
  const handleFinalizeRegistrationWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPayload || !tempToken) return;

    if (!otpCode || otpCode.trim().length < 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingPayload,
          tempToken,
          otpCode: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired verification code");
      }

      setShow2FAModal(false);

      const finalEmail = data.player.email || (pendingPayload?.email as string) || email;
      const finalPassword = (pendingPayload?.password as string) || password;

      setRegisteredResult({
        id: data.player.id,
        name: data.player.name,
        username: data.player?.username || (pendingPayload?.username as string) || username.trim() || undefined,
        email: finalEmail,
        password: finalPassword,
        memberType: data.player.memberType || selectedRole,
        discipline: data.player.discipline,
        state: data.player.state,
        district: data.player.district || (pendingPayload?.district as string) || city,
        city: data.player.city || (pendingPayload?.city as string) || city,
        club: data.player.club || (pendingPayload?.academy as string) || (pendingPayload?.club as string) || club,
        ageGroup: data.player.ageGroup || (selectedRole === "Player" ? ageGroup : undefined),
        weightCategory: data.player.weightCategory || (selectedRole === "Player" ? (isSantulana ? "Open Weight (Agility & Balance Evaluation)" : weightCategory) : undefined),
        currentRank: data.player.beltRank || (pendingPayload?.currentRank as string) || refereeDanRank,
        level: (pendingPayload?.level as string) || refereeLevel,
        photo: (pendingPayload?.photo as string) || refereePhoto || data.player.image,
        registeredOn: data.player.registeredOn,
        status: data.player.status || (selectedRole === "Referee" ? "Application Submitted" : "Pending"),
      });

      // Update global auth state with user and session token
      const authUser = data.user || {
        id: data.player.id,
        name: data.player.name,
        email: data.player.email,
        phone: data.player.phone,
        dob: data.player.dob,
        gender: data.player.gender,
        beltRank: data.player.beltRank,
        club: data.player.club,
        state: data.player.state,
        district: data.player.district,
        status: data.player.status,
        role: "member",
        memberType: data.player.memberType || selectedRole,
        discipline: data.player.discipline,
        avatar: data.player.image,
      };
      setUser(authUser, data.token || null);

      toast.success("Registration Complete!", {
        description: `Official Registration Receipt & Credentials dispatched to ${finalEmail}. Official Member ID: ${data.player.id}`,
      });
    } catch (error: any) {
      toast.error("Verification Failed", {
        description: error.message || "Please check the code and try again",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Resend Registration 2FA Code
  const handleResendRegistrationOTP = async () => {
    if (!canResend || isResending || !email) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend code");
      }
      if (data.tempToken) {
        setTempToken(data.tempToken);
      }
      setCountdown(60);
      setCanResend(false);
      setOtpCode("");
      toast.success("New 2FA Code Sent!", {
        description: "Please check your email inbox.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyId = () => {
    if (registeredResult?.id) {
      navigator.clipboard.writeText(registeredResult.id);
      setCopied(true);
      toast.success("Registration ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [copiedPass, setCopiedPass] = useState(false);
  const handleCopyPassword = () => {
    if (registeredResult?.password) {
      navigator.clipboard.writeText(registeredResult.password);
      setCopiedPass(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const [copiedUsername, setCopiedUsername] = useState(false);
  const handleCopyUsername = () => {
    if (registeredResult?.username) {
      navigator.clipboard.writeText(registeredResult.username);
      setCopiedUsername(true);
      toast.success("Username copied to clipboard");
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  const handlePrintReceipt = () => {
    if (!registeredResult) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Registration Receipt - ${registeredResult.id}</title>
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
            .grid td.label { font-weight: 700; color: #64748b; width: 40%; text-transform: uppercase; font-size: 10px; }
            .grid td.val { font-weight: 800; color: #0f172a; }
            .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #64748b; text-align: center; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo-text">KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA</div>
              <div class="subtitle">National Secretariat · Official Registration Receipt</div>
              <div class="badge">Receipt Ref: REC-REG-${registeredResult.id.replace(/[^a-zA-Z0-9]/g, "")}</div>
            </div>
            <div class="cred-box">
              <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; margin-bottom: 8px;">Official Account Login Credentials</p>
              <p style="font-size: 13px; margin: 4px 0;"><strong>Official Member ID:</strong> <span style="font-family: monospace; color: #d4af37; font-size: 14px; font-weight: 900;">${registeredResult.id}</span></p>
              ${registeredResult.email ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Login Email:</strong> <span style="font-family: monospace; color: #0f172a;">${registeredResult.email}</span></p>` : ""}
              ${registeredResult.password ? `<p style="font-size: 13px; margin: 4px 0;"><strong>Account Password:</strong> <span style="font-family: monospace; color: #15803d; font-weight: 800;">${registeredResult.password}</span></p>` : ""}
            </div>
            <table class="grid">
              <tr><td class="label">Member Name</td><td class="val">${registeredResult.name.toUpperCase()}</td></tr>
              <tr><td class="label">Classification / Role</td><td class="val">${formatMemberType(registeredResult.memberType)}</td></tr>
              ${registeredResult.discipline ? `<tr><td class="label">Sports Discipline</td><td class="val">${registeredResult.discipline}</td></tr>` : ""}
              ${registeredResult.ageGroup ? `<tr><td class="label">Age Division</td><td class="val">${registeredResult.ageGroup}</td></tr>` : ""}
              ${registeredResult.weightCategory ? `<tr><td class="label">Weight Category</td><td class="val">${registeredResult.weightCategory}</td></tr>` : ""}
              <tr><td class="label">State Association Unit</td><td class="val">${registeredResult.state}${registeredResult.district ? ` (${registeredResult.district} District)` : ""}, India</td></tr>
              ${registeredResult.club ? `<tr><td class="label">Affiliated Club / Academy</td><td class="val">${registeredResult.club}</td></tr>` : ""}
              <tr><td class="label">Registration Date</td><td class="val">${formatToDDMMYYYY(registeredResult.registeredOn, new Date())}</td></tr>
              <tr><td class="label">Accreditation Status</td><td class="val" style="color: #15803d;">${registeredResult.status || "Pending"} (Recorded in National Ledger)</td></tr>
            </table>
            <div class="footer">
              <p>This is an authentic digital registration receipt issued by KALAWAR Sports & Martial Arts Federation of India.</p>
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

  const resetForm = () => {
    setRegisteredResult(null);
    setErrors({});
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setDob("");
    setGender("Male");
    setAgeGroup("");
    setWeightCategory("");
    setClub(INDEPENDENT_CLUB);
    setCustomClub("");
    setCoachName(INDEPENDENT_COACH);
    setCustomCoach("");
    setIdNumber("");
    setEmergencyContact("");
    setCity("");
    setDistrict("");
    setCustomDistrictName("");
    setStateAssociation(selectedRole === "StateAssociation" ? (states[0] || "Maharashtra") : "");
    setCustomStateName("");
    setAddress("");
    setPincode("");
    setRegisteredAddress("");
    setPresidentName("");
    setSecretaryName("");
    setQualification("Level 0 - Trainee Coach");
    setExperienceYears("");
    setSpecialization("");
    setRefereeLevel("Level 1 – Junior Referee");
    setRefereeDanRank("1st Dan Black Belt");
    setRefereeSpecialization("Mat / Ring Referee");
    setRefereePhoto("");
    setRefereePhotoName("");
    setRefereePhotoSize("");
    setRefereeDanCertDoc("");
    setRefereeDanCertName("");
    setRefereeDanCertSize("");
    setRefereeAadhaarDoc("");
    setRefereeAadhaarName("");
    setRefereeAadhaarSize("");
    setRefereeDeclaration(false);
    setMatchesOfficiated("");
    setRegistrationType("");
    setYearFounded("");
    setMemberCount("");
    setHeadCoachName("");
    setRegistrationNumber("");
    setAlternatePhone("");
    setWebsite("");
    setAffiliationDocument("");
    setAffiliationDocumentName("");
    setAffiliationDocumentSize("");
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Federation Portal"
        title="Registration"
        description="Official onboarding portal for Athletes, Coaches, Referees, and Club Affiliations with KALAWAR Sports & Martial Arts Federation of India."
        image={IMAGES.training}
      />

      <section className="pb-16 sm:pb-24">
        <div className="shell max-w-3xl px-3.5 sm:px-6">
          {!loading && settings.acceptRegistrations === false ? (
            <div className="luxe-card p-12 sm:p-16 text-center rounded-3xl space-y-4 border border-border/80">
              <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
                <Lock className="size-7" />
              </div>
              <h2 className="text-2xl font-bold">Online Registrations Closed</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Online registrations for Season {settings.activeSeason} are currently paused by the {settings.federationName} secretariat.
                For urgent offline registrations, Dan grading inquiries, or club affiliation renewals, please contact our secretariat desk.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold hover:opacity-90 transition-opacity"
                >
                  Contact Secretariat
                </Link>
                <Link
                  href="/login"
                  className="border border-border/80 hover:border-primary inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold transition-colors"
                >
                  Sign In to Member Portal
                </Link>
              </div>
            </div>
          ) : registeredResult ? (
            registeredResult.memberType === "Referee" ? (
              <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-card via-card/95 to-amber-500/10 p-6 sm:p-10 shadow-2xl animate-in fade-in duration-300 max-w-3xl mx-auto text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Dedicated Referee Account Created &amp; Logged In
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-2">
                    Referee Application Registered!
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                    Your technical official application has been recorded under the Supreme Examination Board. Your account credentials have been emailed to you.
                  </p>
                </div>

                {/* Official Slip Card Box */}
                <div className="p-6 rounded-3xl bg-card border border-border/90 shadow-lg text-left space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center font-black text-primary text-xl shrink-0">
                        {registeredResult.photo ? (
                          <img src={registeredResult.photo} alt={registeredResult.name} className="w-full h-full object-cover" />
                        ) : (
                          registeredResult.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{registeredResult.name}</h3>
                        <p className="text-xs font-semibold text-primary">{registeredResult.level || "Level 1 – Junior Referee"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{registeredResult.state}, India</p>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-2xl shadow-md self-center sm:self-auto shrink-0">
                      <QRCode
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/referees?verify=${encodeURIComponent(registeredResult.id)}`}
                        size={64}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Referee ID</span>
                      <span className="font-black text-primary">{registeredResult.id}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Current Rank</span>
                      <span className="font-bold text-foreground truncate block">{registeredResult.currentRank || "1st Dan Black Belt"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Status</span>
                      <span className="font-bold text-amber-400 block">{registeredResult.status || "Application Submitted"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Role</span>
                      <span className="font-bold text-emerald-400 block">Referee Official</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Official Registration Reference No.
                      </p>
                      <p className="text-base font-mono font-black text-primary">{registeredResult.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied" : "Copy Reference ID"}</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Print Slip, Download PDF, Directory, Dashboard */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const refItem: any = {
                        id: registeredResult.id,
                        name: registeredResult.name,
                        level: registeredResult.level || "Level 1 – Junior Referee",
                        currentRank: registeredResult.currentRank || "1st Dan Black Belt",
                        state: registeredResult.state,
                        district: registeredResult.district || registeredResult.city || "",
                        email: registeredResult.email,
                        phone: phone,
                        status: registeredResult.status || "Application Submitted",
                        photo: registeredResult.photo,
                        registeredOn: registeredResult.registeredOn,
                      };
                      printRefereeRegistrationSlip(refItem);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-primary" />
                    <span>Print Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const refItem: any = {
                        id: registeredResult.id,
                        name: registeredResult.name,
                        level: registeredResult.level || "Level 1 – Junior Referee",
                        currentRank: registeredResult.currentRank || "1st Dan Black Belt",
                        state: registeredResult.state,
                        district: registeredResult.district || registeredResult.city || "",
                        email: registeredResult.email,
                        phone: phone,
                        status: registeredResult.status || "Application Submitted",
                        photo: registeredResult.photo,
                        registeredOn: registeredResult.registeredOn,
                      };
                      downloadRefereeReceiptPDF(refItem);
                    }}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Slip (PDF)</span>
                  </button>

                  <Link
                    href="/referees"
                    className="px-5 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>View Referee Directory</span>
                  </Link>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="border-border/80 hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Register Another Member
                  </button>
                </div>
              </div>
            ) : (
              <div className="luxe-card overflow-hidden p-8 sm:p-10 border border-primary/30">
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 className="size-8 shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Registration Complete!</h2>
                    <p className="text-xs text-muted-foreground">
                      Your {formatMemberType(registeredResult.memberType)} application has been recorded in the KALAWAR National Database.
                    </p>
                  </div>
                </div>

                {/* Receipt Dispatched Notification */}
                {registeredResult.email && (
                  <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3 text-xs text-emerald-300">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Your Email is Verified Successfully!</span>
                      <p className="text-muted-foreground mt-0.5">
                        Your email <span className="font-mono font-semibold text-primary">{registeredResult.email}</span> has been verified and registered. An official registration receipt and login credentials have been dispatched to your inbox.
                      </p>
                    </div>
                  </div>
                )}

                {/* Credentials & Identification Card */}
                <div className="mt-6 rounded-2xl bg-card/90 border border-border/80 p-6 space-y-6">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Official Login Credentials & Member ID
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Save these credentials to access the KALAWAR National Member Portal anytime.
                    </p>
                  </div>

                  <div
                    className={`grid gap-3.5 ${
                      registeredResult.memberType === "Player" && registeredResult.username
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-1 sm:grid-cols-3"
                    }`}
                  >
                    {/* Member ID */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          Official {formatMemberType(registeredResult.memberType)} ID
                        </span>
                        <div className="text-gold-gradient text-xl font-black tracking-tight mt-1 font-mono break-all">
                          {registeredResult.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied ID" : "Copy ID"}
                      </button>
                    </div>

                    {/* Dedicated LOGIN USERNAME card (STRICTLY FOR PLAYER ONLY) */}
                    {registeredResult.memberType === "Player" && registeredResult.username && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            Login Username
                          </span>
                          <div className="text-gold-gradient text-lg sm:text-xl font-black tracking-tight mt-1 font-mono break-all">
                            {registeredResult.username}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUsername}
                          className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {copiedUsername ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                          {copiedUsername ? "Copied Username" : "Copy Username"}
                        </button>
                      </div>
                    )}

                    {/* Login Email */}
                    {registeredResult.email && (
                      <div className="rounded-xl border border-border/80 bg-background/60 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Login Email
                          </span>
                          <div className="text-foreground text-sm font-semibold tracking-tight mt-1 truncate font-mono">
                            {registeredResult.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (registeredResult.email) {
                              navigator.clipboard.writeText(registeredResult.email);
                              toast.success("Email copied to clipboard");
                            }
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md border border-border/80 bg-accent/40 px-2.5 py-1 text-[11px] font-semibold hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Copy className="size-3.5" />
                          Copy Email
                        </button>
                      </div>
                    )}

                    {/* Password */}
                    {registeredResult.password && (
                      <div className="rounded-xl border border-border/80 bg-background/60 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Account Password
                          </span>
                          <div className="text-foreground text-sm font-semibold tracking-tight mt-1 font-mono">
                            {registeredResult.password}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md border border-border/80 bg-accent/40 px-2.5 py-1 text-[11px] font-semibold hover:bg-accent transition-colors cursor-pointer"
                        >
                          {copiedPass ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                          {copiedPass ? "Copied Password" : "Copy Password"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Member Name</span>
                      <p className="font-semibold">{registeredResult.name}</p>
                    </div>
                    {registeredResult.username && (
                      <div>
                        <span className="text-xs text-muted-foreground">Username</span>
                        <p className="font-semibold text-primary font-mono">@{registeredResult.username}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">Member Type</span>
                      <p className="font-semibold text-primary">{formatMemberType(registeredResult.memberType)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Discipline</span>
                      <p className="font-semibold">{registeredResult.discipline}</p>
                    </div>
                    {registeredResult.memberType === "Player" && registeredResult.ageGroup && (
                      <div>
                        <span className="text-xs text-muted-foreground">Age Division</span>
                        <p className="font-semibold">{registeredResult.ageGroup}</p>
                      </div>
                    )}
                    {registeredResult.memberType === "Player" && registeredResult.weightCategory && (
                      <div>
                        <span className="text-xs text-muted-foreground">Weight Category</span>
                        <p className="font-semibold text-primary">{registeredResult.weightCategory}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">State Association</span>
                      <p className="font-semibold">{registeredResult.state}</p>
                    </div>
                    {registeredResult.club && (
                      <div>
                        <span className="text-xs text-muted-foreground">Club / Academy</span>
                        <p className="font-semibold">{registeredResult.club}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">Registration Date</span>
                      <p className="font-semibold">{formatToDDMMYYYY(registeredResult.registeredOn, new Date())}</p>
                    </div>
                    {registeredResult.status === "Pending" && (
                      <div>
                        <span className="text-xs text-muted-foreground">Status</span>
                        <p>
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                            Pending
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-accent/30 p-4 text-xs text-muted-foreground flex items-start gap-3">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <p>
                    You are automatically logged in! You can access your official credentials, ranking, and federation documents from the
                    <strong> Member &gt; My Profile</strong> menu in the navbar.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center">
                  <Link
                    href="/dashboard"
                    className="bg-gold-gradient text-background rounded-full px-6 py-3 text-xs font-bold shadow-gold inline-flex items-center gap-2"
                  >
                    Go to Member Dashboard <ArrowRight className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-semibold transition-colors"
                  >
                    <Printer className="size-3.5" />
                    Print / Save Receipt Slip
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border-border/80 hover:border-primary inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-semibold transition-colors"
                  >
                    Register Another Member
                  </button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} noValidate className="luxe-card grid gap-4 sm:gap-5 p-4 sm:p-8 rounded-2xl sm:rounded-3xl sm:grid-cols-2 border border-border/80">
              {/* Top Role Selector Cards */}
              <div className="sm:col-span-2 space-y-3.5 sm:space-y-4 border-b border-border/60 pb-5 sm:pb-6">
                <div>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Member Type
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold mt-1">Who is registering?</h2>
                </div>

                {/* Role Selector Badges / Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 md:grid-cols-6 pt-1">
                  {MEMBER_ROLES.map((r) => {
                    const isSelected = selectedRole === r.type;
                    const Icon = r.icon;
                    return (
                      <button
                        type="button"
                        key={r.type}
                        onClick={() => handleRoleChange(r.type)}
                        className={`flex flex-col items-center justify-center rounded-2xl border p-3 sm:p-3.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/15 shadow-sm text-primary ring-1 ring-primary/40 font-semibold"
                            : "border-border/60 bg-background/50 hover:border-border hover:bg-background/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-5 mb-1 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {r.type === "StateAssociation" ? "State Association" : r.type === "DistrictAssociation" ? "District Association" : r.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{r.prefix}-XXXXX</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-accent/25 border border-primary/20 p-2.5 sm:p-3 text-xs flex items-center gap-2 sm:gap-2.5 text-primary">
                  <Sparkles className="size-4 shrink-0" />
                  <span className="leading-relaxed">
                    Form configured for <strong>{activeRoleConfig.title}</strong> · Official ID Prefix:{" "}
                    <strong>{activeRoleConfig.prefix}-XXXXX</strong>
                  </span>
                </div>
              </div>


              {/* SECTION 1: COMMON GENERAL INFORMATION */}
              <div className="sm:col-span-2 pt-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="size-4 text-primary" /> General & Contact Details
                </h3>
              </div>

              {selectedRole === "StateAssociation" ? (
                <>
                  {/* State Association Name * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>State Association Name *</span>
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.name ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>}
                  </label>

                  {/* Username * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Username *</span>
                    </span>
                    <div className="relative mt-1.5">
                      <input
                        required
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                          clearError("username");
                          setUsernameAvailable(null);
                        }}
                        onBlur={() => {
                          verifyUsernameNotTaken(username);
                        }}
                        placeholder=""
                        className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${
                          errors.username
                            ? "border-destructive ring-1 ring-destructive"
                            : usernameAvailable === true
                            ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                            : "border-border/70 focus:border-primary"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {usernameChecking && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                        {!usernameChecking && usernameAvailable === true && (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        )}
                        {!usernameChecking && errors.username && (
                          <AlertCircle className="size-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {usernameAvailable === true && !errors.username && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Username is available</span>
                      </p>
                    )}
                    {errors.username && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.username}</span>
                      </p>
                    )}
                  </label>

                  {/* Email Address * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" />
                      <span>Email Address *</span>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      onBlur={() => {
                        verifyEmailNotTaken(email);
                      }}
                      placeholder="state.association@example.com"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.email ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </label>

                  {/* Mobile Number * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Phone className="size-3.5 text-primary" />
                      <span>Mobile Number *</span>
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        clearError("phone");
                      }}
                      placeholder="+91"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.phone ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1 font-medium">{errors.phone}</p>}
                  </label>

                  {/* Select State * (All states dropdown + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary" />
                        <span>Select State *</span>
                      </span>
                      <select
                        required
                        value={stateAssociation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateAssociation(val);
                          if (val !== "Other") setCustomStateName("");
                          clearError("stateAssociation");
                          clearError("customStateName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.stateAssociation || errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">Select State *</option>
                        {states.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {stateAssociation === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customStateName}
                          onChange={(e) => {
                            setCustomStateName(e.target.value);
                            clearError("customStateName");
                          }}
                          placeholder="Enter custom State name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customStateName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customStateName}</p>
                        )}
                      </div>
                    )}
                    {errors.stateAssociation && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.stateAssociation}</p>
                    )}
                  </div>

                  {/* Year Founded */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      <span>Year Founded</span>
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      value={yearFounded}
                      onChange={(e) => {
                        setYearFounded(e.target.value.replace(/\D/g, "").slice(0, 4));
                        clearError("yearFounded");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.yearFounded ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.yearFounded && <p className="text-xs text-destructive mt-1 font-medium">{errors.yearFounded}</p>}
                  </label>

                  {/* President Name (Optional) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>President Name (Optional)</span>
                    </span>
                    <input
                      value={presidentName}
                      onChange={(e) => {
                        setPresidentName(e.target.value);
                        clearError("presidentName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.presidentName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.presidentName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.presidentName}</p>
                    )}
                  </label>

                  {/* Secretary Name (Optional) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Secretary Name (Optional)</span>
                    </span>
                    <input
                      value={secretaryName}
                      onChange={(e) => {
                        setSecretaryName(e.target.value);
                        clearError("secretaryName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.secretaryName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.secretaryName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.secretaryName}</p>
                    )}
                  </label>

                  {/* Full Residential Address */}
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      <span>Full Residential Address</span>
                    </span>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearError("address");
                      }}
                      placeholder="Flat / House No., Building, Street / Locality, Landmark"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors resize-none ${
                        errors.address ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1 font-medium">{errors.address}</p>}
                  </label>
                </>
              ) : selectedRole === "DistrictAssociation" ? (
                <>
                  {/* District Association Name * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>District Association Name *</span>
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.name ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>}
                  </label>

                  {/* Username * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Username *</span>
                    </span>
                    <div className="relative mt-1.5">
                      <input
                        required
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                          clearError("username");
                          setUsernameAvailable(null);
                        }}
                        onBlur={() => {
                          verifyUsernameNotTaken(username);
                        }}
                        placeholder=""
                        className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${
                          errors.username
                            ? "border-destructive ring-1 ring-destructive"
                            : usernameAvailable === true
                            ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                            : "border-border/70 focus:border-primary"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {usernameChecking && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                        {!usernameChecking && usernameAvailable === true && (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        )}
                        {!usernameChecking && errors.username && (
                          <AlertCircle className="size-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {usernameAvailable === true && !errors.username && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Username is available</span>
                      </p>
                    )}
                    {errors.username && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.username}</span>
                      </p>
                    )}
                  </label>

                  {/* Email Address * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" />
                      <span>Email Address *</span>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      onBlur={() => {
                        verifyEmailNotTaken(email);
                      }}
                      placeholder="district.association@example.com"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.email ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </label>

                  {/* Mobile Number * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Phone className="size-3.5 text-primary" />
                      <span>Mobile Number *</span>
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        clearError("phone");
                      }}
                      placeholder="+91"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.phone ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1 font-medium">{errors.phone}</p>}
                  </label>

                  {/* State Association * (Approved state association users dropdown + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Building className="size-3.5 text-primary" />
                        <span>State Association *</span>
                      </span>
                      <select
                        required
                        value={stateAssociation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateAssociation(val);
                          if (val !== "Other") setCustomStateName("");
                          setDistrict("");
                          setCustomDistrictName("");
                          clearError("stateAssociation");
                          clearError("customStateName");
                          clearError("district");
                          clearError("customDistrictName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.stateAssociation || errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">Select State Association *</option>
                        {approvedStateOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {stateAssociation === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customStateName}
                          onChange={(e) => {
                            setCustomStateName(e.target.value);
                            clearError("customStateName");
                          }}
                          placeholder="Enter custom State Association name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customStateName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customStateName}</p>
                        )}
                      </div>
                    )}
                    {errors.stateAssociation && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.stateAssociation}</p>
                    )}
                  </div>

                  {/* Select District * (Constituent districts of selected state + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary" />
                        <span>Select District *</span>
                      </span>
                      <select
                        required
                        value={district}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDistrict(val);
                          if (val !== "Other") setCustomDistrictName("");
                          clearError("district");
                          clearError("customDistrictName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.district || errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">
                          {!selectedStateName
                            ? "Select State Association First"
                            : constituentDistricts.length > 0
                            ? "Select District *"
                            : "Select District *"}
                        </option>
                        {constituentDistricts.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {district === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customDistrictName}
                          onChange={(e) => {
                            setCustomDistrictName(e.target.value);
                            clearError("customDistrictName");
                          }}
                          placeholder="Enter custom District name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customDistrictName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customDistrictName}</p>
                        )}
                      </div>
                    )}
                    {errors.district && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.district}</p>
                    )}
                  </div>

                  {/* Year Founded */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      <span>Year Founded</span>
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      value={yearFounded}
                      onChange={(e) => {
                        setYearFounded(e.target.value.replace(/\D/g, "").slice(0, 4));
                        clearError("yearFounded");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.yearFounded ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.yearFounded && <p className="text-xs text-destructive mt-1 font-medium">{errors.yearFounded}</p>}
                  </label>

                  {/* President Name (Optional) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>President Name (Optional)</span>
                    </span>
                    <input
                      value={presidentName}
                      onChange={(e) => {
                        setPresidentName(e.target.value);
                        clearError("presidentName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.presidentName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.presidentName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.presidentName}</p>
                    )}
                  </label>

                  {/* Secretary Name (Optional) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Secretary Name (Optional)</span>
                    </span>
                    <input
                      value={secretaryName}
                      onChange={(e) => {
                        setSecretaryName(e.target.value);
                        clearError("secretaryName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.secretaryName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.secretaryName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.secretaryName}</p>
                    )}
                  </label>

                  {/* Full Residential Address */}
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      <span>Full Residential Address</span>
                    </span>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearError("address");
                      }}
                      placeholder="Flat / House No., Building, Street / Locality, Landmark"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors resize-none ${
                        errors.address ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1 font-medium">{errors.address}</p>}
                  </label>
                </>
              ) : selectedRole === "Referee" ? (
                <>
                  {/* Full Legal Name */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Full Legal Name *</span>
                    <input
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.name ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>}
                  </label>

                  {/* Username * */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>Username *</span>
                    </span>
                    <div className="relative mt-1.5">
                      <input
                        required
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                          clearError("username");
                          setUsernameAvailable(null);
                        }}
                        onBlur={() => {
                          verifyUsernameNotTaken(username);
                        }}
                        placeholder=""
                        className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${
                          errors.username
                            ? "border-destructive ring-1 ring-destructive"
                            : usernameAvailable === true
                            ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                            : "border-border/70 focus:border-primary"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {usernameChecking && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                        {!usernameChecking && usernameAvailable === true && (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        )}
                        {!usernameChecking && errors.username && (
                          <AlertCircle className="size-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {usernameAvailable === true && !errors.username && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Username is available</span>
                      </p>
                    )}
                    {errors.username && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.username}</span>
                      </p>
                    )}
                  </label>

                  {/* Date of Birth */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      <span>Date of Birth</span>
                    </span>
                    <input
                      type="date"
                      value={dob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setDob(e.target.value);
                        clearError("dob");
                      }}
                      className="bg-background/60 mt-1.5 w-full rounded-xl border border-border/70 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors font-mono cursor-pointer"
                    />
                  </label>

                  {/* Mobile Number (WhatsApp) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Phone className="size-3.5 text-primary" />
                      <span>Mobile Number (WhatsApp) *</span>
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        clearError("phone");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.phone ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1 font-medium">{errors.phone}</p>}
                  </label>

                  {/* New Email Address */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" />
                      <span>New Email Address (For Login & Notifications) *</span>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      placeholder="club.academy@example.com"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      onBlur={() => {
                        verifyEmailNotTaken(email);
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.email ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </label>

                  {/* State Association * (Approved state association users dropdown + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Building className="size-3.5 text-primary" />
                        <span>State Association *</span>
                      </span>
                      <select
                        required
                        value={stateAssociation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateAssociation(val);
                          if (val !== "Other") setCustomStateName("");
                          setDistrict("");
                          setCustomDistrictName("");
                          clearError("stateAssociation");
                          clearError("customStateName");
                          clearError("district");
                          clearError("customDistrictName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.stateAssociation || errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">Select State Association *</option>
                        {approvedStateOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {stateAssociation === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customStateName}
                          onChange={(e) => {
                            setCustomStateName(e.target.value);
                            clearError("customStateName");
                          }}
                          placeholder="Enter custom State Association name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customStateName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customStateName}</p>
                        )}
                      </div>
                    )}
                    {errors.stateAssociation && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.stateAssociation}</p>
                    )}
                  </div>

                  {/* District Association * (Approved district association users dropdown + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary" />
                        <span>District Association *</span>
                      </span>
                      <select
                        required
                        value={district}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDistrict(val);
                          if (val !== "Other") setCustomDistrictName("");
                          setCity(val);
                          clearError("district");
                          clearError("customDistrictName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.district || errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">
                          {!selectedStateName
                            ? "Select State Association First"
                            : approvedDistrictOptions.length > 0
                            ? "Select District Association *"
                            : "No District Association found (Select Other)"}
                        </option>
                        {approvedDistrictOptions.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {district === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customDistrictName}
                          onChange={(e) => {
                            setCustomDistrictName(e.target.value);
                            clearError("customDistrictName");
                          }}
                          placeholder="Enter custom District Association name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customDistrictName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customDistrictName}</p>
                        )}
                      </div>
                    )}
                    {errors.district && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.district}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Name */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">
                      {selectedRole === "Club" ? "Club / Academy Association Name *" : "Full Name *"}
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.name ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>}
                  </label>

                  {/* Username for Player, Coach, Club */}
                  {(selectedRole === "Player" || selectedRole === "Coach" || selectedRole === "Club") && (
                    <label className="block text-sm">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <User className="size-3.5 text-primary" />
                        <span>Username *</span>
                      </span>
                      <div className="relative mt-1.5">
                        <input
                          required
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                            clearError("username");
                            setUsernameAvailable(null);
                          }}
                          onBlur={() => {
                            verifyUsernameNotTaken(username);
                          }}
                          placeholder=""
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${
                            errors.username
                              ? "border-destructive ring-1 ring-destructive"
                              : usernameAvailable === true
                              ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                              : "border-border/70 focus:border-primary"
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          {usernameChecking && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                          {!usernameChecking && usernameAvailable === true && (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          )}
                          {!usernameChecking && errors.username && (
                            <AlertCircle className="size-4 text-destructive" />
                          )}
                        </div>
                      </div>
                      {usernameAvailable === true && !errors.username && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          <span>Username is available</span>
                        </p>
                      )}
                      {errors.username && (
                        <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{errors.username}</span>
                        </p>
                      )}
                    </label>
                  )}

                  {/* Email */}
                  <label className="block text-sm">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Email Address *</span>
                      {errors.email && (
                        <span className="text-destructive font-semibold text-[11px] flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          Wrong email ID
                        </span>
                      )}
                    </div>
                    <input
                      required
                      type="email"
                      value={email}
                      placeholder="e.g. player@example.com"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      onBlur={() => {
                        verifyEmailNotTaken(email);
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.email ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </label>

                  {/* Phone */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Mobile / Contact Number *</span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => {
                        setPhone(sanitizePhoneInput(e.target.value));
                        clearError("phone");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.phone ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.phone ? (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.phone}</p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        10-digit Indian mobile number with optional +91
                      </span>
                    )}
                  </label>

                  {/* State Association * (Approved state association users dropdown + Other) */}
                  <div className="block text-sm">
                    <label className="block">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Building className="size-3.5 text-primary" />
                        <span>State Association *</span>
                      </span>
                      <select
                        required
                        value={stateAssociation}
                        onChange={(e) => {
                          const nextState = e.target.value;
                          setStateAssociation(nextState);
                          if (nextState !== "Other") setCustomStateName("");
                          setDistrict("");
                          setCustomDistrictName("");
                          clearError("stateAssociation");
                          clearError("customStateName");
                          clearError("district");
                          clearError("customDistrictName");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                          errors.stateAssociation || errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        <option value="">Select State Association *</option>
                        {approvedStateOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    {stateAssociation === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customStateName}
                          onChange={(e) => {
                            setCustomStateName(e.target.value);
                            clearError("customStateName");
                          }}
                          placeholder="Enter custom State Association name *"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customStateName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        />
                        {errors.customStateName && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customStateName}</p>
                        )}
                      </div>
                    )}
                    {errors.stateAssociation && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.stateAssociation}</p>
                    )}
                  </div>

                  {/* District Dropdown (Mandatory for Club, Player, and Coach) */}
                  {(selectedRole === "Club" || selectedRole === "Player" || selectedRole === "Coach") && (
                    <div className="block text-sm">
                      <label className="block">
                        <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary" />
                          <span>District Association *</span>
                        </span>
                        <select
                          required
                          value={district}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDistrict(val);
                            if (val !== "Other") setCustomDistrictName("");
                            setCity(val);
                            clearError("district");
                            clearError("customDistrictName");
                          }}
                          className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                            errors.district || errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                        >
                          <option value="">
                            {!selectedStateName
                              ? "Select State Association First"
                              : approvedDistrictOptions.length > 0
                              ? "Select District Association *"
                              : "No District Association found (Select Other)"}
                          </option>
                          {approvedDistrictOptions.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      {district === "Other" && (
                        <div className="mt-2">
                          <input
                            type="text"
                            required
                            value={customDistrictName}
                            onChange={(e) => {
                              setCustomDistrictName(e.target.value);
                              clearError("customDistrictName");
                            }}
                            placeholder="Enter custom District Association name *"
                            className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                              errors.customDistrictName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                            }`}
                          />
                          {errors.customDistrictName && (
                            <p className="text-xs text-destructive mt-1 font-medium">{errors.customDistrictName}</p>
                          )}
                        </div>
                      )}
                      {errors.district && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.district}</p>
                      )}
                    </div>
                  )}

                  {/* Discipline / Sport (Hidden for Club, Player, and Coach Registration) */}
                  {selectedRole !== "Club" && selectedRole !== "Player" && selectedRole !== "Coach" && (
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-muted-foreground text-xs">
                        Discipline / Sport *
                      </span>
                      <select
                        required
                        value={discipline}
                        onChange={(e) => {
                          const nextDiscipline = e.target.value;
                          const nextMatched = kalawarDisciplines.find(
                            (k) =>
                              k.name.toLowerCase() === nextDiscipline.toLowerCase() ||
                              k.slug.toLowerCase() === nextDiscipline.toLowerCase() ||
                              nextDiscipline.toLowerCase().includes(k.slug.replace("-", " "))
                          );
                          const defaultGroup = nextMatched?.ageWeight?.[0]?.group || "U-14";
                          const isSant = nextMatched?.hasWeightCategories === false || nextDiscipline.toLowerCase().includes("santulana");
                          const defaultWeight = isSant
                            ? "Open Weight (Agility & Balance Evaluation)"
                            : (gender === "Female"
                                ? nextMatched?.ageWeight?.[0]?.weightClassesFemale?.[0]
                                : nextMatched?.ageWeight?.[0]?.weightClassesMale?.[0]) || "Open Weight";

                          setDiscipline(nextDiscipline);
                          if (selectedRole === "Player") {
                            setAgeGroup(defaultGroup);
                            setWeightCategory(defaultWeight);
                          }
                          clearError("discipline");
                        }}
                        className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                          errors.discipline ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                        }`}
                      >
                        {kalawarDisciplines.length > 0 && (
                          <optgroup label="🥋 KALAWAR Official Flagship Disciplines">
                            {kalawarDisciplines.map((k) => (
                              <option key={k.id} value={k.name}>
                                {k.name} ({k.marathiName || k.subtitle})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="General Sports & Athletics">
                          {disciplines.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {errors.discipline && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errors.discipline}</p>
                      )}
                    </label>
                  )}
                </>
              )}

              {/* SECTION 2: DYNAMIC ROLE-SPECIFIC FIELDS */}

              {/* PLAYER SPECIFIC FIELDS */}
              {selectedRole === "Player" && (
                <>
                  <div className="sm:col-span-2 border-t border-border/60 pt-4 mt-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Medal className="size-4 text-primary" /> Athlete Details
                    </h3>
                  </div>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Date of Birth *</span>
                    <input
                      required
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        clearError("dob");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.dob ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.dob && <p className="text-xs text-destructive mt-1 font-medium">{errors.dob}</p>}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Gender *</span>
                    <select
                      required
                      value={gender}
                      onChange={(e) => {
                        const nextGender = e.target.value;
                        setGender(nextGender);
                        if (matchedKalawar && currentAgeDiv) {
                          const isSant = matchedKalawar.hasWeightCategories === false || matchedKalawar.slug === "santulana";
                          const defWt = isSant
                            ? "Open Weight (Agility & Balance Evaluation)"
                            : (nextGender === "Female"
                                ? currentAgeDiv.weightClassesFemale?.[0]
                                : currentAgeDiv.weightClassesMale?.[0]) || "Open Weight";
                          setWeightCategory(defWt);
                        }
                        clearError("gender");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.gender ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="text-xs text-destructive mt-1 font-medium">{errors.gender}</p>}
                  </label>

                  {/* Age Division / Age Group */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Age Division / Age Group *</span>
                    <select
                      required
                      value={ageGroup}
                      onChange={(e) => {
                        const nextGroup = e.target.value;
                        setAgeGroup(nextGroup);
                        const matchedDiv = matchedKalawar?.ageWeight?.find((a) => a.group === nextGroup);
                        if (matchedDiv) {
                          const isSant =
                            matchedKalawar?.hasWeightCategories === false ||
                            discipline.toLowerCase().includes("santulana");
                          const defWt = isSant
                            ? "Open Weight (Agility & Balance Evaluation)"
                            : (gender === "Female"
                                ? matchedDiv.weightClassesFemale?.[0]
                                : matchedDiv.weightClassesMale?.[0]) || "";
                          setWeightCategory(defWt);
                        } else {
                          setWeightCategory("");
                        }
                        clearError("ageGroup");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.ageGroup ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      <option value="">Select Age</option>
                      {availableAgeGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {errors.ageGroup && <p className="text-xs text-destructive mt-1 font-medium">{errors.ageGroup}</p>}
                  </label>

                  {/* Weight Category */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Weight Category *</span>
                    <select
                      required
                      disabled={isSantulana}
                      value={isSantulana ? "Open Weight (Agility & Balance Evaluation)" : weightCategory}
                      onChange={(e) => {
                        setWeightCategory(e.target.value);
                        clearError("weightCategory");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.weightCategory ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      } ${isSantulana ? "opacity-75 cursor-not-allowed" : ""}`}
                    >
                      <option value="">Select Category</option>
                      {availableWeightClasses.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                    {errors.weightCategory && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.weightCategory}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Affiliated Club / Academy</span>
                    <select
                      value={club}
                      onChange={(e) => {
                        setClub(e.target.value);
                        if (e.target.value !== "Other") setCustomClub("");
                        clearError("customClub");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.customClub ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      {clubOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {club === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customClub}
                          onChange={(e) => {
                            setCustomClub(e.target.value);
                            clearError("customClub");
                          }}
                          placeholder="Enter your desired Club / Academy name"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customClub ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                          required
                        />
                        {errors.customClub && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customClub}</p>
                        )}
                      </div>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Assigned Coach / Trainer</span>
                    <select
                      value={coachName}
                      onChange={(e) => {
                        setCoachName(e.target.value);
                        if (e.target.value !== "Other") setCustomCoach("");
                        clearError("customCoach");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.customCoach ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      {coachOptions.map((co) => (
                        <option key={co} value={co}>
                          {co}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {coachName === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customCoach}
                          onChange={(e) => {
                            setCustomCoach(e.target.value);
                            clearError("customCoach");
                          }}
                          placeholder="Enter your desired Coach / Trainer name"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customCoach ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                          required
                        />
                        {errors.customCoach && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customCoach}</p>
                        )}
                      </div>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Aadhaar / National ID</span>
                    <input
                      value={idNumber}
                      onChange={(e) => {
                        setIdNumber(e.target.value);
                        clearError("idNumber");
                      }}
                      placeholder="XXXX-XXXX-XXXX or ID Number"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.idNumber ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.idNumber && <p className="text-xs text-destructive mt-1 font-medium">{errors.idNumber}</p>}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Emergency Contact</span>
                    <input
                      value={emergencyContact}
                      onChange={(e) => {
                        setEmergencyContact(e.target.value);
                        clearError("emergencyContact");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.emergencyContact ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.emergencyContact && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.emergencyContact}</p>
                    )}
                  </label>

                  {/* Athlete Address & Location */}
                  <div className="sm:col-span-2 border-t border-border/40 pt-3 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" /> Residential Address
                    </span>
                  </div>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Postal / PIN Code</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(val);
                        clearError("pincode");
                      }}
                      placeholder="e.g. 400001"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.pincode ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.pincode && <p className="text-xs text-destructive mt-1 font-medium">{errors.pincode}</p>}
                  </label>

                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs">Full Residential Address</span>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearError("address");
                      }}
                      placeholder="Flat / House No., Building, Street / Locality, Landmark"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors resize-none ${
                        errors.address ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1 font-medium">{errors.address}</p>}
                  </label>
                </>
              )}

              {/* COACH SPECIFIC FIELDS */}
              {selectedRole === "Coach" && (
                <>
                  <div className="sm:col-span-2 border-t border-border/60 pt-4 mt-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Award className="size-4 text-primary" /> Coaching Accreditation Details
                    </h3>
                  </div>

                  {/* Registration Type Dropdown */}
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs font-semibold flex items-center justify-between">
                      <span>Registration Type <span className="text-destructive font-bold">*</span></span>
                      {coachRegistrationType && coachRegistrationType !== "Choose Registration type" && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          coachRegistrationType === "Apply For Coach"
                            ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
                            : "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                        }`}>
                          {coachRegistrationType}
                        </span>
                      )}
                    </span>
                    <select
                      required
                      value={coachRegistrationType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCoachRegistrationType(val);
                        clearError("coachRegistrationType");
                        if (val !== "Already a Coach") {
                          clearError("coachDocument");
                        }
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                        errors.coachRegistrationType ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      <option value="">Choose Registration type</option>
                      <option value="Apply For Coach">Apply For Coach</option>
                      <option value="Already a Coach">Already a Coach</option>
                    </select>
                    {errors.coachRegistrationType && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5" /> {errors.coachRegistrationType}
                      </p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Coaching Qualification *</span>
                    <select
                      required
                      value={qualification}
                      onChange={(e) => {
                        setQualification(e.target.value);
                        clearError("qualification");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.qualification ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      <option value="Level 0 - Trainee Coach">Level 0 - Trainee Coach</option>
                      <option value="Level 1 - State Certified">Level 1 - State Certified</option>
                      <option value="Level 2 - National Coach">Level 2 - National Coach</option>
                      <option value="Level 3 - Master Performance Coach">Level 3 - Master Performance Coach</option>
                      <option value="International WSF/Olympic Certified">International WSF/Olympic Certified</option>
                    </select>
                    {errors.qualification && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.qualification}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Years of Coaching Experience *</span>
                    <input
                      required
                      type="number"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={(e) => {
                        setExperienceYears(e.target.value);
                        clearError("experienceYears");
                      }}
                      placeholder="e.g. 6"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.experienceYears ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.experienceYears && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.experienceYears}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Current Affiliated Academy / Club</span>
                    <select
                      value={club}
                      onChange={(e) => {
                        setClub(e.target.value);
                        if (e.target.value !== "Other") setCustomClub("");
                        clearError("customClub");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                        errors.customClub ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      {clubOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {club === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customClub}
                          onChange={(e) => {
                            setCustomClub(e.target.value);
                            clearError("customClub");
                          }}
                          placeholder="Enter your desired Academy / Club name"
                          className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                            errors.customClub ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                          }`}
                          required
                        />
                        {errors.customClub && (
                          <p className="text-xs text-destructive mt-1 font-medium">{errors.customClub}</p>
                        )}
                      </div>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Coaching Specialization</span>
                    <input
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Youth Development & Sprint Mechanics"
                      className="border-border/70 bg-background/60 focus:border-primary mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    />
                  </label>

                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs">National ID / Passport Number</span>
                    <input
                      value={idNumber}
                      onChange={(e) => {
                        setIdNumber(e.target.value);
                        clearError("idNumber");
                      }}
                      placeholder="ID Number for verification"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.idNumber ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.idNumber && <p className="text-xs text-destructive mt-1 font-medium">{errors.idNumber}</p>}
                  </label>

                  {/* Document Proof Upload for Already a Coach */}
                  {coachRegistrationType === "Already a Coach" && (
                    <div className="sm:col-span-2 space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5">
                          <FileText className="size-3.5 text-primary" /> Prior Coaching License / Black Belt Diploma Proof *
                        </span>
                        <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 2MB</span>
                      </div>

                      {coachDocument ? (
                        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                              <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {coachDocumentName || "Coach_Certification_Proof.pdf"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {coachDocumentSize && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent text-foreground font-semibold">
                                    {coachDocumentSize}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="size-3" /> Ready to submit
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                              Replace
                              <input
                                type="file"
                                accept=".pdf,image/png,image/jpeg,image/webp"
                                onChange={handleCoachDocUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setCoachDocument("");
                                setCoachDocumentName("");
                                setCoachDocumentSize("");
                              }}
                              className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`border-2 border-dashed rounded-xl p-5 text-center block cursor-pointer transition-colors ${
                            errors.coachDocument
                              ? "border-destructive bg-destructive/5"
                              : isUploadingCoachDoc
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary bg-accent/10 hover:bg-accent/20"
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            onChange={handleCoachDocUpload}
                            disabled={isUploadingCoachDoc}
                            className="hidden"
                          />
                          {isUploadingCoachDoc ? (
                            <div className="flex flex-col items-center gap-2 py-1">
                              <Loader2 className="size-5 text-primary animate-spin" />
                              <p className="text-xs font-semibold text-foreground">
                                Uploading {coachDocumentName || "credential proof"} ({coachUploadProgress}%)...
                              </p>
                              <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden border border-border">
                                <div
                                  className="bg-primary h-full transition-all duration-200"
                                  style={{ width: `${coachUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 py-1">
                              <UploadCloud className="size-6 text-primary" />
                              <p className="text-xs font-semibold text-foreground">
                                Click to attach Coaching Certificate, License, or Black Belt Proof
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Required for Existing Coaches to verify prior credentials. Max 2MB.
                              </p>
                            </div>
                          )}
                        </label>
                      )}
                      {errors.coachDocument && (
                        <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="size-3.5" /> {errors.coachDocument}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* REFEREE SPECIFIC FIELDS */}
              {selectedRole === "Referee" && (
                <>
                  <div className="sm:col-span-2 border-t border-border/60 pt-4 mt-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Scale className="size-4 text-primary" /> Technical Official & Referee Accreditation
                    </h3>
                  </div>

                  {/* Dan Rank */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Current Rank / Black Belt Dan *</span>
                    <input
                      required
                      type="text"
                      value={refereeDanRank}
                      onChange={(e) => {
                        setRefereeDanRank(e.target.value);
                        clearError("refereeDanRank");
                      }}
                      placeholder="e.g. 2nd Dan Black Belt"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.refereeDanRank ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.refereeDanRank && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.refereeDanRank}</p>
                    )}
                  </label>

                  {/* Experience Years */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Total Martial Arts Experience *</span>
                    <input
                      required
                      type="text"
                      value={experienceYears}
                      onChange={(e) => {
                        setExperienceYears(e.target.value);
                        clearError("experienceYears");
                      }}
                      placeholder="e.g. 8 Years"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.experienceYears ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.experienceYears && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.experienceYears}</p>
                    )}
                  </label>

                  {/* Applying Referee Level */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Applying for Referee Level *</span>
                    <select
                      required
                      value={refereeLevel}
                      onChange={(e) => {
                        setRefereeLevel(e.target.value as RefereeLevel);
                        clearError("refereeLevel");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-semibold transition-colors ${
                        errors.refereeLevel ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      {REFEREE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                    {errors.refereeLevel && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.refereeLevel}</p>
                    )}
                  </label>

                  {/* Affiliated Club / Academy */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Affiliated Club / Academy</span>
                    <input
                      type="text"
                      value={club === INDEPENDENT_CLUB ? "" : club}
                      onChange={(e) => setClub(e.target.value)}
                      placeholder=""
                      className="border-border/70 bg-background/60 focus:border-primary mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
                    />
                  </label>

                  {/* Official Credentials & Photo Attachments */}
                  <div className="sm:col-span-2 space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary" /> Official Credentials &amp; Photo Attachments
                      </h4>
                      <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 5MB</span>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                      ref={refereePhotoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => handleRefereeFileUpload("photo", e)}
                    />
                    <input
                      ref={refereeDanCertInputRef}
                      type="file"
                      accept="image/png, image/jpeg, application/pdf"
                      className="hidden"
                      onChange={(e) => handleRefereeFileUpload("danCert", e)}
                    />
                    <input
                      ref={refereeAadhaarInputRef}
                      type="file"
                      accept="image/png, image/jpeg, application/pdf"
                      className="hidden"
                      onChange={(e) => handleRefereeFileUpload("aadhaar", e)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* 1. Passport Photo */}
                      <div className={`p-4 rounded-2xl bg-muted/30 border flex flex-col justify-between space-y-3 ${
                        errors.refereePhoto ? "border-destructive ring-1 ring-destructive" : "border-border/80"
                      }`}>
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            Passport Photograph <span className="text-rose-500">*</span>
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Clear headshot for official ID card</p>
                        </div>

                        {refereePhoto ? (
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border">
                            <img src={refereePhoto} alt="Photo" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-foreground truncate">{refereePhotoName || "Photo.jpg"}</p>
                              <span className="text-[9px] text-muted-foreground">{refereePhotoSize}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: "Passport Photo", docData: refereePhoto, docName: refereePhotoName })}
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                                title="Preview Photo"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRefereePhoto("");
                                  setRefereePhotoName("");
                                  setRefereePhotoSize("");
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 cursor-pointer"
                                title="Remove Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => refereePhotoInputRef.current?.click()}
                            className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Upload Passport Photo</span>
                          </button>
                        )}
                        {errors.refereePhoto && (
                          <p className="text-xs text-destructive font-medium">{errors.refereePhoto}</p>
                        )}
                      </div>

                      {/* 2. Dan Certificate Proof */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Black Belt / Dan Certificate</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">PDF or Image of current rank</p>
                        </div>

                        {refereeDanCertDoc ? (
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-foreground truncate">{refereeDanCertName || "Dan_Cert.pdf"}</p>
                              <span className="text-[9px] text-muted-foreground">{refereeDanCertSize}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: "Dan Certificate Proof",
                                    docData: refereeDanCertDoc,
                                    docName: refereeDanCertName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRefereeDanCertDoc("");
                                  setRefereeDanCertName("");
                                  setRefereeDanCertSize("");
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => refereeDanCertInputRef.current?.click()}
                            className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Attach Dan Certificate</span>
                          </button>
                        )}
                      </div>

                      {/* 3. Aadhaar / Govt ID Proof */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Government ID / Aadhaar</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Statutory age &amp; address proof</p>
                        </div>

                        {refereeAadhaarDoc ? (
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-foreground truncate">{refereeAadhaarName || "ID_Proof.pdf"}</p>
                              <span className="text-[9px] text-muted-foreground">{refereeAadhaarSize}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    title: "Government ID Proof",
                                    docData: refereeAadhaarDoc,
                                    docName: refereeAadhaarName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRefereeAadhaarDoc("");
                                  setRefereeAadhaarName("");
                                  setRefereeAadhaarSize("");
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => refereeAadhaarInputRef.current?.click()}
                            className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-primary" />
                            <span>Attach Govt ID Proof</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statutory Declaration */}
                  <div className={`sm:col-span-2 p-4 rounded-2xl bg-muted/40 border flex items-start gap-3 ${
                    errors.refereeDeclaration ? "border-destructive ring-1 ring-destructive" : "border-border/70"
                  }`}>
                    <input
                      required
                      id="referee-declaration"
                      type="checkbox"
                      checked={refereeDeclaration}
                      onChange={(e) => {
                        setRefereeDeclaration(e.target.checked);
                        clearError("refereeDeclaration");
                      }}
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="referee-declaration" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      <strong className="text-foreground">Statutory Adjudication Declaration:</strong> I solemnly declare that all statements provided are true and correct. I agree to abide by the official KALAWAR Martial Arts Statutory Rulebook, maintain absolute impartiality in tournament adjudication, and attend mandatory Technical Committee clinics.
                    </label>
                  </div>
                  {errors.refereeDeclaration && (
                    <p className="sm:col-span-2 text-xs text-destructive font-medium -mt-3">{errors.refereeDeclaration}</p>
                  )}
                </>
              )}

              {/* CLUB AFFILIATION SPECIFIC FIELDS */}
              {selectedRole === "Club" && (
                <>
                  <div className="sm:col-span-2 border-t border-border/60 pt-4 mt-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Landmark className="size-4 text-primary" /> Club & Academy Affiliation Details
                    </h3>
                  </div>

                  {/* Registration Type Dropdown */}
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs font-semibold flex items-center justify-between">
                      <span>Registration Type <span className="text-destructive font-bold">*</span></span>
                      {registrationType && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          registrationType === "Apply for Affiliation"
                            ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
                            : "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                        }`}>
                          {registrationType}
                        </span>
                      )}
                    </span>
                    <select
                      required
                      value={registrationType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegistrationType(val);
                        clearError("registrationType");
                        if (val !== "Already Affiliated") {
                          clearError("affiliationDocument");
                        }
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors cursor-pointer ${
                        errors.registrationType ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    >
                      <option value="">Choose Registration Type</option>
                      <option value="Apply for Affiliation">Apply for Affiliation</option>
                      <option value="Already Affiliated">Already Affiliated</option>
                    </select>
                    {errors.registrationType && (
                      <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3.5" /> {errors.registrationType}
                      </p>
                    )}
                  </label>

                  {/* Chief Instructor / Head Coach */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Head Coach *</span>
                    <input
                      required
                      value={headCoachName}
                      onChange={(e) => {
                        setHeadCoachName(e.target.value);
                        clearError("headCoachName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.headCoachName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.headCoachName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.headCoachName}</p>
                    )}
                  </label>

                  {/* Govt / Society / Trust Reg No (Optional) */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Govt / Society / Trust Reg No (Optional)</span>
                    <input
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. MH/2018/PUN/009823 or Trust No."
                      className="bg-background/60 mt-1.5 w-full rounded-xl border border-border/70 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Year Founded *</span>
                    <input
                      required
                      value={yearFounded}
                      onChange={(e) => {
                        setYearFounded(e.target.value);
                        clearError("yearFounded");
                      }}
                      placeholder="e.g. 2015"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.yearFounded ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.yearFounded && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.yearFounded}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Registered Member Athletes</span>
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      value={memberCount}
                      onChange={(e) => {
                        setMemberCount(e.target.value);
                        clearError("memberCount");
                      }}
                      placeholder="e.g. 120"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.memberCount ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.memberCount && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.memberCount}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">President Name *</span>
                    <input
                      required
                      value={presidentName}
                      onChange={(e) => {
                        setPresidentName(e.target.value);
                        clearError("presidentName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.presidentName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.presidentName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.presidentName}</p>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Secretary Name</span>
                    <input
                      value={secretaryName}
                      onChange={(e) => {
                        setSecretaryName(e.target.value);
                        clearError("secretaryName");
                      }}
                      placeholder=""
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.secretaryName ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.secretaryName && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.secretaryName}</p>
                    )}
                  </label>

                  {/* Alternate Phone */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Alternate / Landline Phone (Optional)</span>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => {
                        setAlternatePhone(sanitizePhoneInput(e.target.value));
                        clearError("alternatePhone");
                      }}
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none font-mono transition-colors ${
                        errors.alternatePhone ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.alternatePhone && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.alternatePhone}</p>
                    )}
                  </label>

                  {/* Website */}
                  <label className="block text-sm">
                    <span className="text-muted-foreground text-xs">Official Website URL (Optional)</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example-academy.com"
                      className="bg-background/60 mt-1.5 w-full rounded-xl border border-border/70 focus:border-primary px-4 py-2.5 text-sm outline-none font-mono transition-colors"
                    />
                  </label>

                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted-foreground text-xs">Registered Facility Address & City *</span>
                    <input
                      required
                      value={registeredAddress}
                      onChange={(e) => {
                        setRegisteredAddress(e.target.value);
                        clearError("registeredAddress");
                      }}
                      placeholder="Full facility address and sports complex details"
                      className={`bg-background/60 mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                        errors.registeredAddress ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                      }`}
                    />
                    {errors.registeredAddress && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.registeredAddress}</p>
                    )}
                  </label>

                  {/* Affiliation Document Upload (MANDATORY & SHOWN ONLY WHEN Already Affiliated is selected) */}
                  {registrationType === "Already Affiliated" && (
                    <div className="sm:col-span-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-sm">
                        <span className="text-muted-foreground text-xs font-semibold flex items-center justify-between">
                          <span>Official Affiliation Document / Certificate (PDF or Image) <span className="text-destructive font-bold">*</span></span>
                          <span className="text-[10px] text-primary/80 font-normal">
                            Locked from edits after registration
                          </span>
                        </span>
                        <div className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-colors ${
                          errors.affiliationDocument
                            ? "border-destructive bg-destructive/5 ring-1 ring-destructive"
                            : "border-primary/30 bg-primary/5 hover:border-primary/60"
                        }`}>
                          {isUploadingDoc ? (
                            <div className="flex flex-col items-center justify-center gap-3.5 w-full py-4 px-3 animate-in fade-in zoom-in-95 duration-200">
                              {/* Animated Percentage Gauge Ring */}
                              <div className="relative flex items-center justify-center">
                                <div className="absolute size-16 rounded-full bg-primary/20 animate-ping" />
                                <div className="size-16 rounded-2xl bg-gradient-to-tr from-primary/30 via-amber-500/20 to-primary/10 border-2 border-primary/70 flex flex-col items-center justify-center text-primary shadow-xl backdrop-blur-sm">
                                  <span className="text-sm font-black font-mono tracking-tight text-primary">
                                    {uploadProgress}%
                                  </span>
                                </div>
                              </div>

                              <div className="text-center space-y-1 max-w-sm w-full">
                                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-foreground">
                                  {uploadProgress === 100 ? (
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                      <CheckCircle2 className="size-4" /> Upload Complete (100%)
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5">
                                      <Loader2 className="size-3.5 animate-spin text-primary" />
                                      <span>Uploading Affiliation Document...</span>
                                    </span>
                                  )}
                                </div>

                                {affiliationDocumentName && (
                                  <p className="text-xs font-mono font-semibold text-primary truncate max-w-xs mx-auto">
                                    {affiliationDocumentName} {affiliationDocumentSize && `(${affiliationDocumentSize})`}
                                  </p>
                                )}

                                <p className="text-[11px] text-muted-foreground font-medium">
                                  {uploadProgress < 30
                                    ? "Reading & encrypting certificate payload..."
                                    : uploadProgress < 85
                                    ? "Streaming document to secure federation vault..."
                                    : uploadProgress < 100
                                    ? "Verifying digital checksum & compliance..."
                                    : "Certificate attached and verified."}
                                </p>
                              </div>

                              {/* Precise 0% to 100% Progress Bar */}
                              <div className="w-full max-w-xs space-y-1">
                                <div className="w-full bg-accent/60 rounded-full h-2 overflow-hidden border border-border/80 relative">
                                  <div
                                    className="h-full bg-gold-gradient rounded-full transition-all duration-200 ease-out shadow-gold"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground px-0.5">
                                  <span>0%</span>
                                  <span className="text-primary font-bold">{uploadProgress}%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </div>
                          ) : affiliationDocument ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full bg-card/80 border border-primary/30 rounded-xl p-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                  <FileText className="size-5" />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
                                      {affiliationDocumentName || "Affiliation_Document.pdf"}
                                    </p>
                                    {affiliationDocumentSize && (
                                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono font-bold shrink-0">
                                        {affiliationDocumentSize}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                    <CheckCircle2 className="size-3" /> Ready to submit (Will be locked upon registration)
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={affiliationDocument}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-background text-xs font-semibold transition-colors flex items-center gap-1"
                                >
                                  <Eye className="size-3.5" /> View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAffiliationDocument("");
                                    setAffiliationDocumentName("");
                                    setAffiliationDocumentSize("");
                                  }}
                                  className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
                                  title="Remove file"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center cursor-pointer w-full group">
                              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/30 group-hover:border-primary flex items-center justify-center text-primary mb-2 transition-all group-hover:scale-105">
                                <UploadCloud className="size-6 text-primary group-hover:translate-y-[-2px] transition-transform" />
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                Click to upload Affiliation Certificate / Registration Deed *
                              </span>
                              <span className="text-[11px] text-muted-foreground mt-1">
                                Supports PDF, PNG, JPG, or DOCX (Max 2MB)
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                                disabled={isUploadingDoc}
                                onChange={(e) => {
                                  clearError("affiliationDocument");
                                  handleAffiliationDocUpload(e);
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                        {errors.affiliationDocument && (
                          <p className="text-xs text-destructive mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="size-3.5" /> {errors.affiliationDocument}
                          </p>
                        )}
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* SECTION 3: ACCOUNT SECURITY & PASSWORD */}
              <div className="sm:col-span-2 border-t border-b border-border/60 py-3.5 my-2 space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="size-4 text-primary" /> Member Account Password
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set a password for your account to sign in to the Member Portal and access official credentials.
                </p>
              </div>

              {/* Password */}
              <label className="block text-sm">
                <span className="text-muted-foreground text-xs">Account Password * (Min. 6 chars)</span>
                <div className="relative mt-1.5">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    placeholder="••••••••"
                    className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-11 text-sm outline-none transition-colors ${
                      errors.password ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1 font-medium">{errors.password}</p>}
              </label>

              {/* Confirm Password */}
              <label className="block text-sm">
                <span className="text-muted-foreground text-xs">Confirm Password *</span>
                <div className="relative mt-1.5">
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirmPassword");
                    }}
                    placeholder="••••••••"
                    className={`bg-background/60 w-full rounded-xl border px-4 py-2.5 pr-11 text-sm outline-none transition-colors ${
                      errors.confirmPassword ? "border-destructive ring-1 ring-destructive" : "border-border/70 focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.confirmPassword}</p>
                )}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold-gradient text-background mt-3 sm:mt-4 rounded-xl sm:rounded-full py-3.5 px-6 text-xs sm:text-sm font-extrabold shadow-gold sm:col-span-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer w-full text-center"
              >
                {isSubmitting
                  ? "Submitting Application..."
                  : `Submit ${activeRoleConfig.title} Registration`}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 2FA REGISTRATION OTP VERIFICATION MODAL */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow2FAModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="luxe-card relative w-full max-w-md rounded-3xl border border-primary/40 bg-background/95 p-6 sm:p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Verify Email Address
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Two-Factor Authentication Step
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="size-8 rounded-full border border-border/70 text-muted-foreground hover:text-foreground grid place-items-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We've sent a 6-digit security OTP code to your registered email:
                </p>
                <p className="text-sm font-mono font-bold text-primary">{maskedEmail}</p>
              </div>

              <form onSubmit={handleFinalizeRegistrationWithOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[10px] font-mono text-2xl font-extrabold rounded-2xl border-2 border-primary/50 bg-background/80 py-3 text-foreground focus:border-primary outline-none"
                    />
                    <KeyRound className="text-primary/60 absolute left-4 top-1/2 -translate-y-1/2 size-4.5 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOTP || otpCode.length < 6}
                  className="bg-gold-gradient text-background flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-gold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifyingOTP ? "Verifying & Finalizing..." : "Verify & Complete Registration"}
                </button>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <button
                    type="button"
                    onClick={() => setShow2FAModal(false)}
                    className="hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!canResend || isResending}
                    onClick={handleResendRegistrationOTP}
                    className="text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw className={`size-3 ${isResending ? "animate-spin" : ""}`} />
                    {canResend ? "Resend Code" : `Resend in ${countdown}s`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Document / Image Preview Modal */}
      {previewDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewDocModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">{previewDocModal.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="p-1 rounded-full bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center p-2 bg-muted/20 rounded-2xl">
              {previewDocModal.docData.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewDocModal.docData}
                  className="w-full h-[60vh] rounded-xl border border-border"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDocModal.docData}
                  alt={previewDocModal.docName || "Preview"}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

export default function UnifiedRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-32 text-center text-sm">Loading Registration Portal...</div>}>
      <UnifiedRegistrationContent />
    </Suspense>
  );
}
