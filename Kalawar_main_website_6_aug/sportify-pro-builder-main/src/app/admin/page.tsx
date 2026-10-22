"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Newspaper,
  Trophy,
  Medal,
  FileText,
  Images,
  MessageSquare,
  Settings,
  Search,
  ShieldCheck,
  LogOut,
  Scale,
  Landmark,
  ShoppingBag,
  FolderTree,
  Package,
  Loader2,
  Save,
  RefreshCw,
  Building2,
  Star,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Activity,
  DollarSign,
  Award,
  ChevronRight,
  UserPlus,
  Plus,
  ShoppingCart,
  Percent,
  UserCheck,
  Eye,
  Compass,
  Bell,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  FolderDown,
  Camera,
  Film,
  GraduationCap,
  CreditCard,
  Quote,
  Receipt,
  MessageSquareQuote,
  Megaphone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { disciplines, states } from "@/data/people";
import { type WebsiteSettings } from "@/types/settings";
import { useSettings } from "@/lib/settings-context";
import {
  getClubDropdownOptions,
  getCoachDropdownOptions,
  INDEPENDENT_CLUB,
  INDEPENDENT_COACH,
} from "@/lib/club-coach-options";
import { AdminModule, type AdminField, type AdminRecord } from "@/components/admin/AdminModule";
import { AdminProductsManager } from "@/components/admin/AdminProductsManager";
import { AdminCategoriesManager } from "@/components/admin/AdminCategoriesManager";
import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";
import { AdminReviewsManager } from "@/components/admin/AdminReviewsManager";
import { AdminCommonReviewsManager } from "@/components/admin/AdminCommonReviewsManager";
import { AdminEventsHub } from "@/components/admin/AdminEventsHub";
import { AdminDownloadsManager } from "@/components/admin/AdminDownloadsManager";
import { AdminNewsManager } from "@/components/admin/AdminNewsManager";
import { AdminPhotoGalleryManager } from "@/components/admin/AdminPhotoGalleryManager";
import { AdminVideoGalleryManager } from "@/components/admin/AdminVideoGalleryManager";
import { AdminClubsManager } from "@/components/admin/AdminClubsManager";
import { AdminBeltExamManager } from "@/components/admin/AdminBeltExamManager";
import { AdminDanGradingManager } from "@/components/admin/AdminDanGradingManager";
import { AdminRankingsManager } from "@/components/admin/AdminRankingsManager";
import { AdminIdCardsManager } from "@/components/admin/AdminIdCardsManager";
import { AdminVerificationManager } from "@/components/admin/AdminVerificationManager";
import { AdminContactsManager } from "@/components/admin/AdminContactsManager";
import { AdminRefereesManager } from "@/components/admin/AdminRefereesManager";
import { AdminCoachesManager } from "@/components/admin/AdminCoachesManager";
import { AdminCertificatesManager } from "@/components/admin/AdminCertificatesManager";
import { AdminChampionshipManager } from "@/components/admin/AdminChampionshipManager";
import { AdminGovernanceTiersModal } from "@/components/admin/AdminGovernanceTiersModal";
import { AdminReceiptsManager } from "@/components/admin/AdminReceiptsManager";
import { AdminDistrictManager } from "@/components/admin/AdminDistrictManager";
import { AdminStateAssociationManager } from "@/components/admin/AdminStateAssociationManager";
import { AdminDistrictAssociationManager } from "@/components/admin/AdminDistrictAssociationManager";
import { AdminBannersManager } from "@/components/admin/AdminBannersManager";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { federation } from "@/constants/navigation";
import { parseVideoUrl } from "@/lib/video-utils";

const nav = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "banners", label: "Banner Images", icon: Images },
  { key: "products", label: "Shop Products", icon: ShoppingBag },
  { key: "categories", label: "Product Categories", icon: FolderTree },
  { key: "orders", label: "Orders & Payments", icon: Package },
  { key: "reviews", label: "Product Reviews", icon: Star },
  { key: "players", label: "Players", icon: Users },
  { key: "coaches", label: "Coaches", icon: Users },
  { key: "referees", label: "Referees", icon: Scale },
  { key: "leadership", label: "Visionary Leadership", icon: Quote },
  { key: "officials", label: "Federation Officials", icon: Award },
  { key: "clubs", label: "Club Affiliation", icon: Landmark },
  { key: "stateAssociations", label: "State Association", icon: Landmark },
  { key: "districtAssociations", label: "District Association", icon: Building2 },
  { key: "district", label: "District Access", icon: MapPin },
  { key: "beltExams", label: "Belt Examinations", icon: GraduationCap },
  { key: "danGrading", label: "Black Belt & Dan Grading", icon: ShieldCheck },
  { key: "championships", label: "Championships", icon: Trophy },
  { key: "idCards", label: "ID Cards Hub", icon: CreditCard },
  { key: "receipts", label: "Registration Receipts", icon: Receipt },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "news", label: "News", icon: Newspaper },
  { key: "downloads", label: "Downloads & Documents", icon: FolderDown },
  { key: "gallery", label: "Gallery", icon: Images },
  { key: "contacts", label: "Contact Requests", icon: MessageSquare },
  { key: "commonReviews", label: "Common Reviews", icon: MessageSquareQuote },
  { key: "settings", label: "Website Settings", icon: Settings },
] as const;

type Key = (typeof nav)[number]["key"];

const disciplineNames = disciplines.map((d) => d.name);

const fieldConfig: Record<
  Exclude<Key, "overview" | "banners" | "settings" | "products" | "categories" | "orders" | "reviews" | "commonReviews" | "beltExams" | "danGrading" | "championships" | "idCards" | "receipts" | "district" | "stateAssociations" | "districtAssociations">,
  { singular: string; idPrefix: string; statusKey?: string; fields: AdminField[] }
> = {
  players: {
    singular: "Player",
    idPrefix: "KSM-PL",
    statusKey: "status",
    fields: [
      { key: "image", label: "Athlete Profile Photo", type: "image", required: false, hideInTable: true },
      { key: "name", label: "Full Name", required: true, placeholder: "e.g. Aarav Mehra" },
      { key: "username", label: "Username", required: false, placeholder: "e.g. aarav123", hideInTable: true },
      { key: "email", label: "Email Address", required: true, placeholder: "name@example.com" },
      { key: "password", label: "Password", type: "password", required: false, placeholder: "Enter password or view current", hideInTable: true },
      { key: "phone", label: "Phone Number", required: true, placeholder: "+91 98765 43210" },
      { key: "state", label: "State Association", type: "select", options: states, required: true },
      { key: "discipline", label: "Discipline / Sport", type: "select", options: disciplineNames, required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: false, hideInTable: true },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Non-binary", "Prefer not to say"] as const,
        required: false,
        hideInTable: true,
      },
      { key: "ageGroup", label: "Age Group / Category", required: false, placeholder: "e.g. U-14, U-17, Senior", hideInTable: true },
      { key: "weightCategory", label: "Weight Category", required: false, placeholder: "e.g. 35–38 kg, Open Weight", hideInTable: true },
      { key: "beltRank", label: "Belt Rank / Dan", required: false, placeholder: "e.g. 1st Dan Black Belt, Brown Belt", hideInTable: true },
      {
        key: "bloodGroup",
        label: "Blood Group",
        type: "select",
        options: ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const,
        required: false,
        hideInTable: true,
      },
      { key: "club", label: "Club / Academy", required: false, placeholder: "e.g. Titan Athletic Club" },
      { key: "coachName", label: "Coach Name", required: false, placeholder: "e.g. Coach David", hideInTable: true },
      { key: "idNumber", label: "Aadhaar / National ID", required: false, placeholder: "XXXX-XXXX-XXXX", hideInTable: true },
      {
        key: "emergencyContact",
        label: "Emergency Contact (Name & Phone)",
        required: false,
        placeholder: "e.g. Priya Mehra (+91 98111 22233)",
        hideInTable: true,
      },
      { key: "city", label: "District Association", required: false, placeholder: "e.g. Pune, Mumbai, Varanasi", hideInTable: true },
      { key: "pincode", label: "PIN Code", required: false, placeholder: "e.g. 400001", hideInTable: true },
      {
        key: "address",
        label: "Residential Address",
        required: false,
        placeholder: "e.g. 102, Shanti Heights, MG Road",
        hideInTable: true,
        fullWidth: true,
      },
      { key: "points", label: "Points", type: "number", required: false },
      { key: "status", label: "Status", type: "select", options: ["Active", "Pending", "Incomplete", "Suspended"] as const },
    ],
  },
  coaches: {
    singular: "Coach",
    idPrefix: "KSM-CO",
    statusKey: "status",
    fields: [
      { key: "image", label: "Coach Profile Photo", type: "image", required: false, hideInTable: true },
      { key: "name", label: "Full Name", required: true, placeholder: "e.g. Coach David" },
      { key: "email", label: "Email Address", required: true, placeholder: "coach@example.com" },
      { key: "phone", label: "Phone Number", required: true, placeholder: "+91 98765 43210" },
      { key: "discipline", label: "Discipline / Sport", type: "select", options: disciplineNames, required: true },
      { key: "state", label: "State Association", type: "select", options: states, required: true },
      {
        key: "level",
        label: "Coaching Qualification / License",
        type: "select",
        options: [
          "Level 0 - Trainee Coach",
          "Level 1 - State Certified",
          "Level 2 - National Coach",
          "Level 3 - Master Performance Coach",
          "International WSF/Olympic Certified",
          "Level A",
          "Level B",
          "Level C",
        ] as const,
      },
      {
        key: "academy",
        label: "Affiliated Academy / Club",
        type: "select",
        options: [INDEPENDENT_CLUB],
        placeholder: "e.g. Meridian Sports Academy",
      },
      { key: "experience", label: "Experience (yrs)", type: "number" },
      {
        key: "specialization",
        label: "Coaching Specialization",
        placeholder: "e.g. High Performance & Youth Development",
        hideInTable: true,
        fullWidth: true,
      },
      {
        key: "idNumber",
        label: "National ID / Passport Number",
        placeholder: "ID Number for verification",
        hideInTable: true,
      },
      { key: "dob", label: "Date of Birth", type: "date", required: false, hideInTable: true },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Non-binary", "Prefer not to say"] as const,
        required: false,
        hideInTable: true,
      },
      {
        key: "emergencyContact",
        label: "Emergency Contact (Name & Phone)",
        required: false,
        placeholder: "e.g. Priya (+91 98111 22233)",
        hideInTable: true,
      },
      { key: "city", label: "District Association", required: false, placeholder: "e.g. Pune, Mumbai, Varanasi", hideInTable: true },
      { key: "pincode", label: "PIN Code", required: false, placeholder: "e.g. 400001", hideInTable: true },
      {
        key: "address",
        label: "Residential / Complex Address",
        required: false,
        placeholder: "e.g. Flat 101, Sports Enclave",
        hideInTable: true,
        fullWidth: true,
      },
      {
        key: "bio",
        label: "Coach Profile / Biography",
        type: "textarea",
        required: false,
        hideInTable: true,
        fullWidth: true,
        placeholder: "Brief biography, achievements, coaching philosophy...",
      },
      { key: "status", label: "Status", type: "select", options: ["Verified", "Pending", "Suspended"] as const },
    ],
  },
  referees: {
    singular: "Referee",
    idPrefix: "KSM-RF",
    statusKey: "status",
    fields: [
      { key: "photo", label: "Referee Profile Photo", type: "image", required: false, hideInTable: true },
      { key: "name", label: "Full Name", required: true, placeholder: "e.g. Michael Scott" },
      { key: "email", label: "Email Address", required: true, placeholder: "referee@example.com" },
      { key: "phone", label: "Phone Number", required: true, placeholder: "+91 98765 43210" },
      { key: "discipline", label: "Discipline / Sport", type: "select", options: disciplineNames, required: true },
      {
        key: "grade",
        label: "Officiating Grade / License",
        type: "select",
        options: [
          "National Grade A Referee",
          "State Official Grade B",
          "Chief Technical Official (CTO)",
          "International Federation Badge",
          "International",
          "National",
          "State Grade A",
          "State Grade B",
        ] as const,
      },
      { key: "state", label: "State Association", type: "select", options: states, required: true },
      {
        key: "academy",
        label: "Affiliated Academy / Club",
        type: "select",
        options: [INDEPENDENT_CLUB],
        placeholder: "e.g. Meridian Sports Academy",
      },
      { key: "matches", label: "Matches Officiated", type: "number" },
      { key: "experience", label: "Experience (yrs)", type: "number" },
      {
        key: "idNumber",
        label: "National ID / Passport Number",
        placeholder: "ID Number for verification",
        hideInTable: true,
      },
      { key: "dob", label: "Date of Birth", type: "date", required: false, hideInTable: true },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Non-binary", "Prefer not to say"] as const,
        required: false,
        hideInTable: true,
      },
      {
        key: "currentRank",
        label: "Current Dan Rank / Belt",
        required: false,
        placeholder: "e.g. 2nd Dan Black Belt",
        hideInTable: true,
      },
      { key: "district", label: "District / City", required: false, placeholder: "e.g. Pune, Thane", hideInTable: true },
      {
        key: "licenseNumber",
        label: "Certificate / Accreditation Code",
        required: false,
        placeholder: "e.g. KAC-ACT-REF-2026-001",
        hideInTable: true,
      },
      {
        key: "bio",
        label: "Official Technical Biography",
        type: "textarea",
        required: false,
        hideInTable: true,
        fullWidth: true,
        placeholder: "Technical qualifications, officiating background, seminars attended...",
      },
      { key: "status", label: "Status", type: "select", options: ["Verified", "Pending", "Suspended"] as const },
    ],
  },
  clubs: {
    singular: "Club Affiliation",
    idPrefix: "KSM-CL",
    statusKey: "status",
    fields: [
      { key: "name", label: "Club / Academy Name", required: true, placeholder: "e.g. Apex Sports Club" },
      { key: "email", label: "Official Email Address", required: true, placeholder: "club@example.com" },
      { key: "phone", label: "Phone Number", required: true, placeholder: "+91 98765 43210" },
      { key: "discipline", label: "Primary Discipline", type: "select", options: disciplineNames, required: true },
      { key: "state", label: "State Association", type: "select", options: states, required: true },
      { key: "president", label: "President Name", placeholder: "e.g. Rajesh Sharma" },
      { key: "secretary", label: "Secretary Name", placeholder: "e.g. Sunita Rao", hideInTable: true },
      {
        key: "registeredAddress",
        label: "Registered Facility Address & City",
        placeholder: "Full facility address and sports complex details",
        hideInTable: true,
        fullWidth: true,
      },
      { key: "members", label: "Registered Member Athletes", type: "number" },
      { key: "founded", label: "Year Founded", type: "number" },
      {
        key: "affiliationDocument",
        label: "Affiliation Document",
        placeholder: "Affiliation Certificate / Deed",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Affiliated", "Pending", "Under Review", "Suspended"] as const,
      },
    ],
  },
  events: {
    singular: "Event",
    idPrefix: "EVT",
    statusKey: "status",
    fields: [
      { key: "image", label: "Banner Image", type: "image", required: false },
      { key: "title", label: "Title" },
      { key: "discipline", label: "Discipline", type: "select", options: disciplineNames },
      { key: "category", label: "Category", type: "select", options: ["Championship", "League", "Trials", "Camp"] },
      { key: "city", label: "City" },
      { key: "venue", label: "Venue" },
      { key: "startDate", label: "Start Date", type: "date", minFutureDate: true },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Upcoming", "Ongoing", "Completed"] },
      { key: "slots", label: "Slots / Capacity", type: "number" },
      { key: "summary", label: "Summary", type: "textarea", required: false },
    ],
  },
  news: {
    singular: "Article",
    idPrefix: "N",
    statusKey: "status",
    fields: [
      { key: "image", label: "Cover Image", type: "image", required: false },
      { key: "title", label: "Headline" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["Championships", "Development", "Governance", "Athletes"],
      },
      {
        key: "tag",
        label: "Tag / Badge",
        type: "select",
        options: ["Latest", "Trending", "Featured"],
      },
      { key: "author", label: "Author / Bureau" },
      { key: "date", label: "Date", type: "date" },
      { key: "readTime", label: "Read Time (e.g. 4 min read)", required: false },
      { key: "excerpt", label: "Excerpt / Summary", type: "textarea" },
      { key: "body", label: "Article Content (paragraphs)", type: "textarea", required: false },
      { key: "status", label: "Status", type: "select", options: ["Published", "Draft"] },
    ],
  },

  gallery: {
    singular: "Media item",
    idPrefix: "MED",
    statusKey: "status",
    fields: [
      {
        key: "type",
        label: "Media Type",
        type: "select",
        options: ["photo", "video"],
        required: true,
      },
      {
        key: "title",
        label: "Title / Caption",
        required: true,
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "Ceremony",
          "Football",
          "Athletics",
          "Basketball",
          "Swimming",
          "Cricket",
          "Volleyball",
          "Martial Arts",
          "Badminton",
          "Gymnastics",
          "Training",
          "General",
        ],
      },
      {
        key: "src",
        label: "Photo Image",
        type: "image",
        required: true,
        showWhen: { key: "type", equals: "photo" },
      },
      {
        key: "span",
        label: "Grid Layout Span",
        type: "select",
        options: ["normal", "tall", "wide"],
        showWhen: { key: "type", equals: "photo" },
      },
      {
        key: "src",
        label: "Video URL / Stream Link (YouTube, MP4, etc.)",
        required: true,
        showWhen: { key: "type", equals: "video" },
      },
      {
        key: "thumb",
        label: "Video Poster / Thumbnail Image",
        type: "image",
        required: false,
        showWhen: { key: "type", equals: "video" },
      },
      {
        key: "duration",
        label: "Video Duration (e.g. 08:15)",
        required: false,
        showWhen: { key: "type", equals: "video" },
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Published", "Draft"],
      },
    ],
  },
  contacts: {
    singular: "Contact Request",
    idPrefix: "REQ",
    statusKey: "status",
    fields: [
      { key: "name", label: "Full Name", required: true },
      { key: "email", label: "Email Address", required: true },
      { key: "phone", label: "Phone" },
      { key: "subject", label: "Subject", required: true },
      { key: "message", label: "Message", type: "textarea", required: true },
      { key: "status", label: "Status", type: "select", options: ["New", "In Progress", "Resolved"] },
    ],
  },
  leadership: {
    singular: "Visionary Leader",
    idPrefix: "LDR",
    statusKey: "status",
    fields: [
      { key: "image", label: "Portrait / Profile Photo", type: "image", required: false },
      { key: "name", label: "Full Name", required: true, placeholder: "e.g. Mr. Santosh Uddhav Kasabe" },
      { key: "role", label: "Designation / Title", required: true, placeholder: "e.g. Founder & President – India" },
      { key: "tag", label: "Badge / Tagline", placeholder: "e.g. Founder's Vision, Executive Governance" },
      { key: "addressTitle", label: "Address Header", placeholder: "e.g. Founder's Address, Executive Leadership Address" },
      { key: "quote", label: "Highlight Quote Headline", type: "textarea", fullWidth: true, placeholder: "“Martial arts is not merely a sport...”" },
      { key: "message", label: "Full Message Body / Address Paragraphs", type: "textarea", fullWidth: true, required: true, placeholder: "Enter the detailed address or message paragraphs..." },
      { key: "organization", label: "Federation Affiliation / Subtitle", placeholder: "e.g. Founder & President, KALAWAR Sports & Martial Arts Federation of India", hideInTable: true },
      { key: "order", label: "Display Priority Order", type: "number", hideInTable: true, placeholder: "1, 2, 3..." },
      { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] as const },
    ],
  },
  officials: {
    singular: "Federation Official",
    idPrefix: "OFF",
    statusKey: "status",
    fields: [
      { key: "image", label: "Photo", type: "image", required: false },
      { key: "name", label: "Full Name", required: true, placeholder: "e.g. Mr. Santosh Uddhav Kasabe" },
      { key: "role", label: "Designation / Role", required: true, placeholder: "e.g. Founder & President – India" },
      {
        key: "category",
        label: "Governance Level / Tier",
        type: "select",
        required: true,
        options: [
          "Founder & President",
          "Director / Working President",
          "National Officials",
          "Technical Committee",
          "State Officials",
          "District Officials",
        ],
      },
      { key: "state", label: "State Association", type: "select", options: ["", ...states] },
      { key: "district", label: "District Unit", placeholder: "e.g. Pune, Bangalore Urban", hideInTable: true },
      { key: "email", label: "Official Email", placeholder: "official@kalawarmartialarts.org" },
      { key: "phone", label: "Official Phone", placeholder: "+91 98765 43210" },
      { key: "bio", label: "Profile / Biography", type: "textarea", fullWidth: true, hideInTable: true, placeholder: "Brief profile, background, Dan grade, or sporting achievements" },
      { key: "order", label: "Display Priority Order", type: "number", hideInTable: true, placeholder: "1, 2, 3..." },
      { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  },
  downloads: {
    singular: "Document",
    idPrefix: "K-DOC",
    statusKey: "status",
    fields: [
      { key: "title", label: "Document Name", required: true, placeholder: "e.g. Official Rule Book PDF 2026-27" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "Rule Book & Regulations",
          "Registration Forms",
          "Official Forms",
          "Certificates & Documents",
        ] as const,
        required: true,
      },
      { key: "description", label: "Description", type: "textarea", required: true, fullWidth: true },
      { key: "version", label: "Version (e.g. v2026.1)", required: true, placeholder: "v2026.1" },
      { key: "publishedDate", label: "Published Date", required: true, placeholder: "15 Jan 2026" },
      { key: "updatedDate", label: "Updated Date", required: true, placeholder: "28 Feb 2026" },
      { key: "year", label: "Applicable Year", required: true, placeholder: "2026" },
      { key: "event", label: "Tournament / Scope", required: false, placeholder: "National Championship" },
      { key: "type", label: "File Type", type: "select", options: ["PDF", "DOCX", "ZIP"] as const, required: true },
      { key: "size", label: "File Size", required: false, placeholder: "5.4 MB" },
      { key: "docCode", label: "Document Reference Code", required: true, placeholder: "K-DOC-RB-2026" },
      { key: "status", label: "Publication Status", type: "select", options: ["Published", "Draft", "Archived"] as const, required: true },
    ],
  },
};

const initialSeed: Record<
  Exclude<Key, "overview" | "banners" | "settings" | "products" | "categories" | "orders" | "reviews" | "commonReviews" | "beltExams" | "danGrading" | "championships" | "idCards" | "receipts" | "district" | "stateAssociations" | "districtAssociations">,
  AdminRecord[]
> = {
  players: [],
  coaches: [],
  referees: [],
  leadership: [],
  officials: [],
  clubs: [],
  events: [],
  news: [],
  downloads: [],
  gallery: [],
  contacts: [],
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Key>("overview");
  const [gallerySubTab, setGallerySubTab] = useState<"photos" | "videos">("photos");
  const [q, setQ] = useState("");
  const [data, setData] = useState(initialSeed);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingReferees, setLoadingReferees] = useState(true);
  const [loadingLeadership, setLoadingLeadership] = useState(true);
  const [loadingOfficials, setLoadingOfficials] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingMedalTally, setLoadingMedalTally] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminSession, setAdminSession] = useState<{
    authenticated: boolean;
    role?: "super_admin" | "district_admin";
    userId?: string;
    email?: string;
    state?: string;
    district?: string;
  } | null>(null);

  const visibleNav = useMemo(() => {
    if (adminSession?.role === "district_admin") {
      return nav.filter((n) => n.key === "clubs");
    }
    return nav.filter((n) => n.key !== "district");
  }, [adminSession?.role]);

  // Dynamic player fields with Club & Coach dropdowns including IDs
  const playerFields = useMemo(() => {
    const clubOpts = getClubDropdownOptions(data.clubs);
    const coachOpts = getCoachDropdownOptions(data.coaches);

    return fieldConfig.players.fields.map((f) => {
      if (f.key === "club") {
        return {
          ...f,
          type: "select" as const,
          options: clubOpts,
          allowOther: true,
          otherOptionLabel: "Other",
          placeholder: "Enter your desired Club / Academy name",
        };
      }
      if (f.key === "coachName") {
        return {
          ...f,
          type: "select" as const,
          options: coachOpts,
          allowOther: true,
          otherOptionLabel: "Other",
          placeholder: "Enter your desired Coach / Trainer name",
        };
      }
      return f;
    });
  }, [data.clubs, data.coaches]);

  // Dynamic coach fields with Club dropdown including IDs
  const coachFields = useMemo(() => {
    const clubOpts = getClubDropdownOptions(data.clubs);
    return fieldConfig.coaches.fields.map((f) => {
      if (f.key === "academy" || f.key === "club") {
        return {
          ...f,
          label: "Affiliated Academy / Club",
          type: "select" as const,
          options: clubOpts,
        };
      }
      return f;
    });
  }, [data.clubs]);

  // Dynamic referee fields with Club dropdown including IDs
  const refereeFields = useMemo(() => {
    const clubOpts = getClubDropdownOptions(data.clubs);
    return fieldConfig.referees.fields.map((f) => {
      if (f.key === "academy" || f.key === "club") {
        return {
          ...f,
          label: "Affiliated Academy / Club",
          type: "select" as const,
          options: clubOpts,
        };
      }
      return f;
    });
  }, [data.clubs]);

  // Dynamic governance level / tier options with Other conversion & management modal
  const [governanceTiers, setGovernanceTiers] = useState<string[]>([
    "Founder & President",
    "Director / Working President",
    "National Officials",
    "Technical Committee",
    "State Officials",
    "District Officials",
  ]);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);

  const loadGovernanceTiers = useCallback(async () => {
    try {
      const res = await fetch("/api/officials/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.categories)) {
        setGovernanceTiers(json.categories);
      }
    } catch (err) {
      console.error("Failed to load governance categories:", err);
    }
  }, []);

  const officialsFields = useMemo(() => {
    return fieldConfig.officials.fields.map((f) => {
      if (f.key === "category") {
        return {
          ...f,
          options: governanceTiers,
          allowOther: true,
          manageActionLabel: "⚙️ Manage Levels / Tiers",
          onManageAction: () => setIsTiersModalOpen(true),
        };
      }
      return f;
    });
  }, [governanceTiers]);

  // Fetch players from persistence API
  const loadPlayers = useCallback(async () => {
    try {
      setLoadingPlayers(true);
      const res = await fetch("/api/players");
      const json = await res.json();
      if (json.success && Array.isArray(json.players)) {
        const playerRecords: AdminRecord[] = json.players
          .filter((p: any) => !p.memberType || p.memberType === "Player")
          .map((p: any) => ({
            id: p.id,
            image: p.image || "",
            name: p.name || "",
            username: p.username || "",
            email: p.email || "",
            password: p.rawPassword || p.password || "",
            rawPassword: p.rawPassword || "",
            phone: p.phone || "",
            state: p.state || states[0] || "Maharashtra",
            discipline: p.discipline || disciplineNames[0] || "Football",
            dob: p.dob || "",
            gender: p.gender || "Male",
            ageGroup: p.ageGroup || "",
            weightCategory: p.weightCategory || "",
            beltRank: p.beltRank || "",
            bloodGroup: p.bloodGroup || "",
            club: p.club || "Independent",
            coachName: p.coachName || "",
            idNumber: p.idNumber || "",
            emergencyContact: p.emergencyContact || "",
            city: p.city || "",
            pincode: p.pincode || "",
            address: p.address || "",
            points: String(p.points ?? 0),
            status: p.status || "Pending",
            academicHistory: p.academicHistory || [],
          }));
        setData((prev) => ({ ...prev, players: playerRecords }));
      }
    } catch (error) {
      console.error("Failed to load players:", error);
      toast.error("Could not load players from database");
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  // Fetch coaches from persistence API
  const loadCoaches = useCallback(async () => {
    try {
      setLoadingCoaches(true);
      const res = await fetch("/api/coaches");
      const json = await res.json();
      if (json.success && Array.isArray(json.coaches)) {
        const coachRecords: AdminRecord[] = json.coaches.map((c: any) => ({
          id: c.id,
          image: c.image || "",
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          discipline: c.discipline || disciplineNames[0] || "Football",
          state: c.state || states[0] || "Maharashtra",
          level: c.qualification || c.level || "Level 2 - National Coach",
          academy: c.club || c.academy || "Independent",
          experience: String(c.experienceYears ?? c.experience ?? 4),
          specialization: c.specialization || "",
          idNumber: c.idNumber || "",
          dob: c.dob || "",
          gender: c.gender || "Male",
          emergencyContact: c.emergencyContact || "",
          city: c.city || "",
          pincode: c.pincode || "",
          address: c.address || "",
          bio: c.bio || "",
          status: c.status || "Pending",
        }));
        setData((prev) => ({ ...prev, coaches: coachRecords }));
      }
    } catch (error) {
      console.error("Failed to load coaches:", error);
      toast.error("Could not load coaches from database");
    } finally {
      setLoadingCoaches(false);
    }
  }, []);

  // Fetch referees from persistence API
  const loadReferees = useCallback(async () => {
    try {
      setLoadingReferees(true);
      const res = await fetch("/api/referees");
      const json = await res.json();
      if (json.success && Array.isArray(json.referees)) {
        const refereeRecords: AdminRecord[] = json.referees.map((r: any) => ({
          id: r.id,
          photo: r.photo || r.image || "",
          name: r.name || "",
          email: r.email || "",
          phone: r.phone || "",
          discipline: r.discipline || disciplineNames[0] || "Football",
          grade: r.officiatingGrade || r.grade || r.level || "National Grade A Referee",
          state: r.state || states[0] || "Maharashtra",
          academy: r.club || r.academy || "Independent",
          matches: String(r.matchesOfficiated ?? r.matches ?? 0),
          experience: String(r.experienceYears ?? r.experience ?? r.martialArtsExperience ?? 0),
          idNumber: r.idNumber || r.kalawarId || "",
          dob: r.dob || "",
          gender: r.gender || "Male",
          currentRank: r.currentRank || "",
          district: r.district || "",
          licenseNumber: r.licenseNumber || "",
          bio: r.bio || "",
          status: r.status || "Pending",
        }));
        setData((prev) => ({ ...prev, referees: refereeRecords }));
      }
    } catch (error) {
      console.error("Failed to load referees:", error);
      toast.error("Could not load referees from database");
    } finally {
      setLoadingReferees(false);
    }
  }, []);

  // Fetch visionary leadership from persistence API
  const loadLeadership = useCallback(async () => {
    try {
      setLoadingLeadership(true);
      const res = await fetch("/api/leadership?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.leadership)) {
        const records: AdminRecord[] = json.leadership.map((l: any) => ({
          id: l.id,
          image: l.image || "",
          name: l.name || "",
          role: l.role || "",
          tag: l.tag || "",
          addressTitle: l.addressTitle || "",
          quote: l.quote || "",
          message: l.message || "",
          organization: l.organization || "",
          order: String(l.order ?? 0),
          status: l.status || "Active",
          createdAt: l.createdAt || "",
          updatedAt: l.updatedAt || "",
        }));
        setData((prev) => ({ ...prev, leadership: records }));
      }
    } catch (error) {
      console.error("Failed to load visionary leadership:", error);
      toast.error("Could not load visionary leadership from database");
    } finally {
      setLoadingLeadership(false);
    }
  }, []);

  // Fetch officials from persistence API
  const loadOfficials = useCallback(async () => {
    try {
      setLoadingOfficials(true);
      const res = await fetch("/api/officials?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.officials)) {
        const records: AdminRecord[] = json.officials.map((o: any) => ({
          id: o.id,
          name: o.name || "",
          role: o.role || "",
          category: o.category || "National Officials",
          state: o.state || "",
          district: o.district || "",
          image: o.image || "",
          bio: o.bio || "",
          email: o.email || "",
          phone: o.phone || "",
          order: String(o.order ?? 0),
          status: o.status || "Active",
        }));
        setData((prev) => ({ ...prev, officials: records }));
      }
    } catch (error) {
      console.error("Failed to load officials:", error);
      toast.error("Could not load officials from database");
    } finally {
      setLoadingOfficials(false);
    }
  }, []);

  // Fetch clubs from persistence API
  const loadClubs = useCallback(async () => {
    try {
      setLoadingClubs(true);
      const res = await fetch("/api/clubs");
      const json = await res.json();
      if (json.success && Array.isArray(json.clubs)) {
        const clubRecords: AdminRecord[] = json.clubs.map((c: any) => ({
          id: c.id,
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          discipline: c.discipline || disciplineNames[0] || "Football",
          state: c.state || states[0] || "Maharashtra",
          president: c.presidentName || c.president || "President",
          secretary: c.secretaryName || c.secretary || "",
          registeredAddress: c.registeredAddress || "",
          members: String(c.memberCount ?? c.members ?? 0),
          founded: String(c.yearFounded ?? c.founded ?? 2020),
          affiliationDocument: c.affiliationDocument || "",
          affiliationDocumentName: c.affiliationDocumentName || "",
          affiliationDocumentSize: c.affiliationDocumentSize || "",
          status: c.status || "Pending",
        }));
        setData((prev) => ({ ...prev, clubs: clubRecords }));
      }
    } catch (error) {
      console.error("Failed to load clubs:", error);
      toast.error("Could not load clubs from database");
    } finally {
      setLoadingClubs(false);
    }
  }, []);

  // Fetch events from persistence API
  const loadEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch("/api/events");
      const json = await res.json();
      if (json.success && Array.isArray(json.events)) {
        const eventRecords: AdminRecord[] = json.events.map((e: any) => ({
          id: e.id,
          image: e.image || "",
          title: e.title,
          discipline: e.discipline,
          category: e.category || "Championship",
          city: e.city,
          venue: e.venue,
          startDate: e.startDate,
          endDate: e.endDate,
          status: e.status || "Upcoming",
          entryFee: e.entryFee || "Free",
          slots: String(e.slots ?? 64),
          summary: e.summary || "",
        }));
        setData((prev) => ({ ...prev, events: eventRecords }));
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      toast.error("Could not load events from database");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch news from persistence API
  const loadNews = useCallback(async () => {
    try {
      setLoadingNews(true);
      const res = await fetch("/api/news?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.news)) {
        const newsRecords: AdminRecord[] = json.news.map((n: any) => ({
          id: n.id,
          image: n.image || "",
          title: n.title,
          category: n.category || "Governance",
          tag: n.tag || "Latest",
          author: n.author || "Media Bureau",
          date: n.date,
          readTime: n.readTime || "3 min read",
          excerpt: n.excerpt,
          body: Array.isArray(n.body) ? n.body.join("\n\n") : n.body || "",
          status: n.status || "Published",
        }));
        setData((prev) => ({ ...prev, news: newsRecords }));
      }
    } catch (error) {
      console.error("Failed to load news:", error);
      toast.error("Could not load news articles from database");
    } finally {
      setLoadingNews(false);
    }
  }, []);

  // Fetch results from persistence API
  const loadResults = useCallback(async () => {
    try {
      setLoadingResults(true);
      const res = await fetch("/api/results?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.results)) {
        const resultRecords: AdminRecord[] = json.results.map((r: any) => ({
          id: r.id,
          tournament: r.tournament,
          discipline: r.discipline,
          season: r.season,
          winner: r.winner,
          runnerUp: r.runnerUp || "",
          thirdPlace: r.thirdPlace || "",
          mvp: r.mvp || "",
          goldMedals: String(r.medals?.gold ?? 0),
          silverMedals: String(r.medals?.silver ?? 0),
          bronzeMedals: String(r.medals?.bronze ?? 0),
          image: r.image || "",
          status: r.status || "Verified",
        }));
        setData((prev) => ({ ...prev, results: resultRecords }));
      }
    } catch (error) {
      console.error("Failed to load results:", error);
      toast.error("Could not load tournament results from database");
    } finally {
      setLoadingResults(false);
    }
  }, []);

  // Fetch medal tally from persistence API
  const loadMedalTally = useCallback(async () => {
    try {
      setLoadingMedalTally(true);
      const res = await fetch("/api/medal-tally");
      const json = await res.json();
      if (json.success && Array.isArray(json.tally)) {
        const tallyRecords: AdminRecord[] = json.tally.map((m: any) => ({
          id: m.id,
          state: m.state,
          gold: String(m.gold ?? 0),
          silver: String(m.silver ?? 0),
          bronze: String(m.bronze ?? 0),
        }));
        setData((prev) => ({ ...prev, medalTally: tallyRecords }));
      }
    } catch (error) {
      console.error("Failed to load medal tally:", error);
      toast.error("Could not load medal tally from database");
    } finally {
      setLoadingMedalTally(false);
    }
  }, []);

  // Fetch gallery from persistence API
  const loadGallery = useCallback(async () => {
    try {
      setLoadingGallery(true);
      const res = await fetch("/api/gallery?all=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.items)) {
        const galleryRecords: AdminRecord[] = json.items.map((g: any) => ({
          id: g.id,
          type: g.type || "photo",
          title: g.title,
          category: g.category || "General",
          src: g.src,
          thumb: g.thumb || "",
          duration: g.duration || "",
          span: g.span || "normal",
          status: g.status || "Published",
        }));
        setData((prev) => ({ ...prev, gallery: galleryRecords }));
      }
    } catch (error) {
      console.error("Failed to load gallery items:", error);
      toast.error("Could not load gallery items from database");
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  // Fetch contacts from persistence API
  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await fetch("/api/contact");
      if (!res.ok) return;
      const json = await res.json().catch(() => ({ success: false }));
      if (json.success && Array.isArray(json.contacts)) {
        const contactRecords: AdminRecord[] = json.contacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || "",
          subject: c.subject,
          message: c.message,
          status: c.status || "New",
        }));
        setData((prev) => ({ ...prev, contacts: contactRecords }));
      }
    } catch (error) {
      console.error("Failed to load contact requests:", error);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Fetch certificates from persistence API
  const loadCertificates = useCallback(async () => {
    try {
      setLoadingCertificates(true);
      const res = await fetch("/api/certificates?all=true");
      if (!res.ok) return;
      const json = await res.json().catch(() => ({ success: false }));
      if (json.success && Array.isArray(json.certificates)) {
        const certRecords: AdminRecord[] = json.certificates.map((c: any) => ({
          id: c.id || c.number || (c._id ? c._id.toString() : `CERT-${Math.random().toString().slice(2, 6)}`),
          number: c.number || c.id || "",
          holder: c.holder || "",
          email: c.email || "",
          state: c.state || "",
          type: c.type || "Certificate of Excellence",
          event: c.event || "",
          position: c.position || "Gold Medal",
          issued: c.issued || "",
          status: c.status || "Issued",
        }));
        setData((prev) => ({ ...prev, certificates: certRecords }));
      }
    } catch (error) {
      console.error("Failed to load certificates:", error);
    } finally {
      setLoadingCertificates(false);
    }
  }, []);

  // Fetch downloads from persistence API
  const loadDownloads = useCallback(async () => {
    try {
      setLoadingDownloads(true);
      const res = await fetch("/api/downloads?all=true");
      if (!res.ok) return;
      const json = await res.json().catch(() => ({ success: false }));
      if (json.success && Array.isArray(json.downloads)) {
        const docRecords: AdminRecord[] = json.downloads.map((d: any) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          description: d.description || "",
          version: d.version || "v2026.1",
          publishedDate: d.publishedDate || "",
          updatedDate: d.updatedDate || "",
          year: d.year || "2026",
          event: d.event || "Federation Direct / General",
          type: d.type || "PDF",
          size: d.size || "1.0 MB",
          docCode: d.docCode || "",
          status: d.status || "Published",
        }));
        setData((prev) => ({ ...prev, downloads: docRecords }));
      }
    } catch (error) {
      console.error("Failed to load downloads:", error);
    } finally {
      setLoadingDownloads(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
    loadCoaches();
    loadReferees();
    loadLeadership();
    loadGovernanceTiers();
    loadOfficials();
    loadClubs();
    loadEvents();
    loadNews();
    loadResults();
    loadMedalTally();
    loadGallery();
    loadContacts();
    loadCertificates();
    loadDownloads();
  }, [loadPlayers, loadCoaches, loadReferees, loadLeadership, loadGovernanceTiers, loadOfficials, loadClubs, loadEvents, loadNews, loadResults, loadMedalTally, loadGallery, loadContacts, loadCertificates, loadDownloads]);

  const setRows = (key: keyof typeof initialSeed) => (rows: AdminRecord[]) =>
    setData((prev) => ({ ...prev, [key]: rows }));

  // Handlers for Players API CRUD operations
  const handleCreatePlayer = async (draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: draft.image || "",
        name: draft.name,
        username: draft.username || "",
        email: draft.email,
        password: draft.password || "",
        phone: draft.phone,
        state: draft.state,
        discipline: draft.discipline,
        dob: draft.dob,
        gender: draft.gender,
        ageGroup: draft.ageGroup,
        weightCategory: draft.weightCategory,
        beltRank: draft.beltRank,
        bloodGroup: draft.bloodGroup,
        club: draft.club,
        coachName: draft.coachName,
        idNumber: draft.idNumber,
        emergencyContact: draft.emergencyContact,
        city: draft.city,
        pincode: draft.pincode,
        address: draft.address,
        points: Number(draft.points) || 0,
        status: draft.status || "Active",
        academicHistory: draft.academicHistory || [],
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create player");
    }
    toast.success("Player created in database", { description: json.player.name });
    return {
      id: json.player.id,
      image: json.player.image || draft.image || "",
      name: json.player.name,
      username: json.player.username || draft.username || "",
      email: json.player.email || draft.email || "",
      password: json.player.rawPassword || draft.password || "",
      rawPassword: json.player.rawPassword || draft.rawPassword || "",
      phone: json.player.phone || draft.phone || "",
      state: json.player.state || draft.state,
      discipline: json.player.discipline || draft.discipline,
      dob: json.player.dob || draft.dob || "",
      gender: json.player.gender || draft.gender || "Male",
      ageGroup: json.player.ageGroup || draft.ageGroup || "",
      weightCategory: json.player.weightCategory || draft.weightCategory || "",
      beltRank: json.player.beltRank || draft.beltRank || "",
      bloodGroup: json.player.bloodGroup || draft.bloodGroup || "",
      club: json.player.club || draft.club || "Independent",
      coachName: json.player.coachName || draft.coachName || "",
      idNumber: json.player.idNumber || draft.idNumber || "",
      emergencyContact: json.player.emergencyContact || draft.emergencyContact || "",
      city: json.player.city || draft.city || "",
      pincode: json.player.pincode || draft.pincode || "",
      address: json.player.address || draft.address || "",
      points: String(json.player.points ?? draft.points ?? 0),
      status: json.player.status || draft.status || "Active",
      academicHistory: json.player.academicHistory || draft.academicHistory || [],
    };
  };

  const handleUpdatePlayer = async (id: string, draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: draft.image,
        name: draft.name,
        username: draft.username !== undefined ? draft.username : undefined,
        email: draft.email,
        password: draft.password || undefined,
        phone: draft.phone,
        state: draft.state,
        discipline: draft.discipline,
        dob: draft.dob,
        gender: draft.gender,
        ageGroup: draft.ageGroup,
        weightCategory: draft.weightCategory,
        beltRank: draft.beltRank,
        bloodGroup: draft.bloodGroup,
        club: draft.club,
        coachName: draft.coachName,
        idNumber: draft.idNumber,
        emergencyContact: draft.emergencyContact,
        city: draft.city,
        pincode: draft.pincode,
        address: draft.address,
        points: Number(draft.points) || 0,
        status: draft.status,
        academicHistory: draft.academicHistory || [],
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update player");
    }
    toast.success("Player updated in database", { description: json.player.name });
    return {
      id: json.player.id,
      image: json.player.image || draft.image || "",
      name: json.player.name,
      username: json.player.username || draft.username || "",
      email: json.player.email || draft.email || "",
      password: json.player.rawPassword || draft.password || "",
      rawPassword: json.player.rawPassword || draft.rawPassword || "",
      phone: json.player.phone || draft.phone || "",
      state: json.player.state || draft.state,
      discipline: json.player.discipline || draft.discipline,
      dob: json.player.dob || draft.dob || "",
      gender: json.player.gender || draft.gender || "Male",
      ageGroup: json.player.ageGroup || draft.ageGroup || "",
      weightCategory: json.player.weightCategory || draft.weightCategory || "",
      beltRank: json.player.beltRank || draft.beltRank || "",
      bloodGroup: json.player.bloodGroup || draft.bloodGroup || "",
      club: json.player.club || draft.club || "Independent",
      coachName: json.player.coachName || draft.coachName || "",
      idNumber: json.player.idNumber || draft.idNumber || "",
      emergencyContact: json.player.emergencyContact || draft.emergencyContact || "",
      city: json.player.city || draft.city || "",
      pincode: json.player.pincode || draft.pincode || "",
      address: json.player.address || draft.address || "",
      points: String(json.player.points ?? draft.points ?? 0),
      status: json.player.status || draft.status || "Active",
      academicHistory: json.player.academicHistory || draft.academicHistory || [],
    };
  };

  const handleDeletePlayer = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete player");
    }
    return true;
  };

  // Handlers for Coaches API CRUD operations
  const handleCreateCoach = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: draft.image || "",
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        state: draft.state,
        qualification: draft.level,
        club: draft.academy,
        experienceYears: Number(draft.experience) || 0,
        specialization: draft.specialization,
        idNumber: draft.idNumber,
        dob: draft.dob,
        gender: draft.gender,
        emergencyContact: draft.emergencyContact,
        city: draft.city,
        pincode: draft.pincode,
        address: draft.address,
        bio: draft.bio,
        status: draft.status || "Verified",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create coach");
    }
    toast.success("Coach created in database", { description: json.coach.name });
    return {
      id: json.coach.id,
      image: json.coach.image || draft.image || "",
      name: json.coach.name,
      email: json.coach.email || draft.email || "",
      phone: json.coach.phone || draft.phone || "",
      discipline: json.coach.discipline,
      state: json.coach.state || draft.state,
      level: json.coach.qualification || draft.level,
      academy: json.coach.club || draft.academy,
      experience: String(json.coach.experienceYears ?? draft.experience),
      specialization: json.coach.specialization || draft.specialization || "",
      idNumber: json.coach.idNumber || draft.idNumber || "",
      dob: json.coach.dob || draft.dob || "",
      gender: json.coach.gender || draft.gender || "Male",
      emergencyContact: json.coach.emergencyContact || draft.emergencyContact || "",
      city: json.coach.city || draft.city || "",
      pincode: json.coach.pincode || draft.pincode || "",
      address: json.coach.address || draft.address || "",
      bio: json.coach.bio || draft.bio || "",
      status: json.coach.status,
    };
  };

  const handleUpdateCoach = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/coaches/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: draft.image,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        state: draft.state,
        qualification: draft.level,
        club: draft.academy,
        experienceYears: Number(draft.experience) || 0,
        specialization: draft.specialization,
        idNumber: draft.idNumber,
        dob: draft.dob,
        gender: draft.gender,
        emergencyContact: draft.emergencyContact,
        city: draft.city,
        pincode: draft.pincode,
        address: draft.address,
        bio: draft.bio,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update coach");
    }
    toast.success("Coach updated in database", { description: json.coach.name });
    return {
      id: json.coach.id,
      image: json.coach.image || draft.image || "",
      name: json.coach.name,
      email: json.coach.email || draft.email || "",
      phone: json.coach.phone || draft.phone || "",
      discipline: json.coach.discipline,
      state: json.coach.state || draft.state,
      level: json.coach.qualification || draft.level,
      academy: json.coach.club || draft.academy,
      experience: String(json.coach.experienceYears ?? draft.experience),
      specialization: json.coach.specialization || draft.specialization || "",
      idNumber: json.coach.idNumber || draft.idNumber || "",
      dob: json.coach.dob || draft.dob || "",
      gender: json.coach.gender || draft.gender || "Male",
      emergencyContact: json.coach.emergencyContact || draft.emergencyContact || "",
      city: json.coach.city || draft.city || "",
      pincode: json.coach.pincode || draft.pincode || "",
      address: json.coach.address || draft.address || "",
      bio: json.coach.bio || draft.bio || "",
      status: json.coach.status,
    };
  };

  const handleDeleteCoach = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/coaches/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete coach");
    }
    return true;
  };

  // Handlers for Referees API CRUD operations
  const handleCreateReferee = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/referees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photo: draft.photo || draft.image || "",
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        officiatingGrade: draft.grade,
        level: draft.grade,
        state: draft.state,
        district: draft.district,
        academy: draft.academy || draft.club || "",
        currentRank: draft.currentRank,
        matchesOfficiated: Number(draft.matches) || 0,
        experienceYears: Number(draft.experience) || 0,
        martialArtsExperience: draft.experience ? `${draft.experience} Years` : "3 Years",
        idNumber: draft.idNumber,
        kalawarId: draft.idNumber,
        dob: draft.dob,
        gender: draft.gender,
        licenseNumber: draft.licenseNumber,
        bio: draft.bio,
        status: draft.status || "Verified",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create referee");
    }
    toast.success("Referee registered in database", { description: json.referee.name });
    return {
      id: json.referee.id,
      photo: json.referee.photo || json.referee.image || draft.photo || "",
      name: json.referee.name,
      email: json.referee.email || draft.email || "",
      phone: json.referee.phone || draft.phone || "",
      discipline: json.referee.discipline || draft.discipline,
      grade: json.referee.officiatingGrade || json.referee.level || draft.grade,
      state: json.referee.state || draft.state,
      district: json.referee.district || draft.district || "",
      academy: json.referee.academy || json.referee.club || draft.academy || "",
      currentRank: json.referee.currentRank || draft.currentRank || "",
      matches: String(json.referee.matchesOfficiated ?? draft.matches),
      experience: String(json.referee.experienceYears ?? json.referee.martialArtsExperience ?? draft.experience),
      idNumber: json.referee.idNumber || json.referee.kalawarId || draft.idNumber || "",
      dob: json.referee.dob || draft.dob || "",
      gender: json.referee.gender || draft.gender || "Male",
      licenseNumber: json.referee.licenseNumber || draft.licenseNumber || "",
      bio: json.referee.bio || draft.bio || "",
      status: json.referee.status,
    };
  };

  const handleUpdateReferee = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/referees/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photo: draft.photo || draft.image,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        officiatingGrade: draft.grade,
        level: draft.grade,
        state: draft.state,
        district: draft.district,
        academy: draft.academy || draft.club || "",
        currentRank: draft.currentRank,
        matchesOfficiated: Number(draft.matches) || 0,
        experienceYears: Number(draft.experience) || 0,
        martialArtsExperience: draft.experience ? `${draft.experience} Years` : undefined,
        idNumber: draft.idNumber,
        kalawarId: draft.idNumber,
        dob: draft.dob,
        gender: draft.gender,
        licenseNumber: draft.licenseNumber,
        bio: draft.bio,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update referee");
    }
    toast.success("Referee updated in database", { description: json.referee.name });
    return {
      id: json.referee.id,
      photo: json.referee.photo || json.referee.image || draft.photo || "",
      name: json.referee.name,
      email: json.referee.email || draft.email || "",
      phone: json.referee.phone || draft.phone || "",
      discipline: json.referee.discipline || draft.discipline,
      grade: json.referee.officiatingGrade || json.referee.level || draft.grade,
      state: json.referee.state || draft.state,
      district: json.referee.district || draft.district || "",
      academy: json.referee.academy || json.referee.club || draft.academy || "",
      currentRank: json.referee.currentRank || draft.currentRank || "",
      matches: String(json.referee.matchesOfficiated ?? draft.matches),
      experience: String(json.referee.experienceYears ?? json.referee.martialArtsExperience ?? draft.experience),
      idNumber: json.referee.idNumber || json.referee.kalawarId || draft.idNumber || "",
      dob: json.referee.dob || draft.dob || "",
      gender: json.referee.gender || draft.gender || "Male",
      licenseNumber: json.referee.licenseNumber || draft.licenseNumber || "",
      bio: json.referee.bio || draft.bio || "",
      status: json.referee.status,
    };
  };

  const handleDeleteReferee = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/referees/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete referee");
    }
    return true;
  };

  // Handlers for Visionary Leadership API CRUD operations
  const handleCreateLeadership = async (draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch("/api/leadership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        role: draft.role,
        tag: draft.tag || "Leadership Vision",
        addressTitle: draft.addressTitle || "President's Address",
        quote: draft.quote || "",
        message: draft.message || "",
        organization: draft.organization || "",
        image: draft.image || "",
        order: draft.order ? Number(draft.order) : 0,
        status: draft.status || "Active",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create leadership entry");
    }
    toast.success("Visionary leader added", { description: json.leader.name });
    loadLeadership();
    return {
      id: json.leader.id,
      name: json.leader.name,
      role: json.leader.role,
      tag: json.leader.tag || "",
      addressTitle: json.leader.addressTitle || "",
      quote: json.leader.quote || "",
      message: json.leader.message || "",
      organization: json.leader.organization || "",
      image: json.leader.image || "",
      order: String(json.leader.order ?? 0),
      status: json.leader.status || "Active",
    };
  };

  const handleUpdateLeadership = async (id: string, draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch(`/api/leadership/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        role: draft.role,
        tag: draft.tag || "Leadership Vision",
        addressTitle: draft.addressTitle || "President's Address",
        quote: draft.quote || "",
        message: draft.message || "",
        organization: draft.organization || "",
        image: draft.image || "",
        order: draft.order ? Number(draft.order) : 0,
        status: draft.status || "Active",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update leadership entry");
    }
    toast.success("Visionary leader updated", { description: json.leader.name });
    loadLeadership();
    return {
      id: json.leader.id,
      name: json.leader.name,
      role: json.leader.role,
      tag: json.leader.tag || "",
      addressTitle: json.leader.addressTitle || "",
      quote: json.leader.quote || "",
      message: json.leader.message || "",
      organization: json.leader.organization || "",
      image: json.leader.image || "",
      order: String(json.leader.order ?? 0),
      status: json.leader.status || "Active",
    };
  };

  const handleDeleteLeadership = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/leadership/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete leadership entry");
    }
    toast.success("Visionary leader removed");
    loadLeadership();
    return true;
  };

  // Handlers for Officials API CRUD operations
  const handleCreateOfficial = async (draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch("/api/officials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        role: draft.role,
        category: draft.category,
        state: draft.state || "",
        district: draft.district || "",
        image: draft.image || "",
        bio: draft.bio || "",
        email: draft.email || "",
        phone: draft.phone || "",
        order: draft.order ? Number(draft.order) : 0,
        status: draft.status || "Active",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create official");
    }
    toast.success("Federation official added", { description: json.official.name });
    loadOfficials();
    loadGovernanceTiers();
    return {
      id: json.official.id,
      name: json.official.name,
      role: json.official.role,
      category: json.official.category,
      state: json.official.state || "",
      district: json.official.district || "",
      image: json.official.image || "",
      bio: json.official.bio || "",
      email: json.official.email || "",
      phone: json.official.phone || "",
      order: String(json.official.order ?? 0),
      status: json.official.status || "Active",
    };
  };

  const handleUpdateOfficial = async (id: string, draft: Record<string, any>): Promise<AdminRecord> => {
    const res = await fetch(`/api/officials/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        role: draft.role,
        category: draft.category,
        state: draft.state || "",
        district: draft.district || "",
        image: draft.image || "",
        bio: draft.bio || "",
        email: draft.email || "",
        phone: draft.phone || "",
        order: draft.order ? Number(draft.order) : 0,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update official");
    }
    toast.success("Federation official updated", { description: json.official.name });
    loadOfficials();
    loadGovernanceTiers();
    return {
      id: json.official.id,
      name: json.official.name,
      role: json.official.role,
      category: json.official.category,
      state: json.official.state || "",
      district: json.official.district || "",
      image: json.official.image || "",
      bio: json.official.bio || "",
      email: json.official.email || "",
      phone: json.official.phone || "",
      order: String(json.official.order ?? 0),
      status: json.official.status || "Active",
    };
  };

  const handleDeleteOfficial = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/officials/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete official");
    }
    toast.success("Federation official removed");
    loadOfficials();
    return true;
  };

  // Handlers for Clubs API CRUD operations
  const handleCreateClub = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        state: draft.state,
        presidentName: draft.president,
        secretaryName: draft.secretary,
        registeredAddress: draft.registeredAddress,
        memberCount: Number(draft.members) || 0,
        yearFounded: draft.founded,
        affiliationDocument: draft.affiliationDocument,
        affiliationDocumentName: draft.affiliationDocumentName,
        affiliationDocumentSize: draft.affiliationDocumentSize,
        status: draft.status || "Affiliated",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create club affiliation");
    }
    toast.success("Club affiliation registered in database", { description: json.club.name });
    return {
      id: json.club.id,
      name: json.club.name,
      email: json.club.email || draft.email || "",
      phone: json.club.phone || draft.phone || "",
      discipline: json.club.discipline,
      state: json.club.state || draft.state,
      president: json.club.presidentName || draft.president,
      secretary: json.club.secretaryName || draft.secretary || "",
      registeredAddress: json.club.registeredAddress || draft.registeredAddress || "",
      members: String(json.club.memberCount ?? draft.members),
      founded: String(json.club.yearFounded ?? draft.founded),
      affiliationDocument: json.club.affiliationDocument || draft.affiliationDocument || "",
      affiliationDocumentName: json.club.affiliationDocumentName || draft.affiliationDocumentName || "",
      affiliationDocumentSize: json.club.affiliationDocumentSize || draft.affiliationDocumentSize || "",
      status: json.club.status,
    };
  };

  const handleUpdateClub = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/clubs/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        discipline: draft.discipline,
        state: draft.state,
        presidentName: draft.president,
        secretaryName: draft.secretary,
        registeredAddress: draft.registeredAddress,
        memberCount: Number(draft.members) || 0,
        yearFounded: draft.founded,
        affiliationDocument: draft.affiliationDocument,
        affiliationDocumentName: draft.affiliationDocumentName,
        affiliationDocumentSize: draft.affiliationDocumentSize,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update club affiliation");
    }
    toast.success("Club affiliation updated in database", { description: json.club.name });
    return {
      id: json.club.id,
      name: json.club.name,
      email: json.club.email || draft.email || "",
      phone: json.club.phone || draft.phone || "",
      discipline: json.club.discipline,
      state: json.club.state || draft.state,
      president: json.club.presidentName || draft.president,
      secretary: json.club.secretaryName || draft.secretary || "",
      registeredAddress: json.club.registeredAddress || draft.registeredAddress || "",
      members: String(json.club.memberCount ?? draft.members),
      founded: String(json.club.yearFounded ?? draft.founded),
      affiliationDocument: json.club.affiliationDocument || draft.affiliationDocument || "",
      affiliationDocumentName: json.club.affiliationDocumentName || draft.affiliationDocumentName || "",
      affiliationDocumentSize: json.club.affiliationDocumentSize || draft.affiliationDocumentSize || "",
      status: json.club.status,
    };
  };

  const handleDeleteClub = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/clubs/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete club affiliation");
    }
    return true;
  };

  // Handlers for Events API CRUD operations
  const handleCreateEvent = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        discipline: draft.discipline,
        category: draft.category || "Championship",
        city: draft.city,
        venue: draft.venue,
        startDate: draft.startDate,
        endDate: draft.endDate,
        status: draft.status || "Upcoming",
        entryFee: draft.entryFee || "Free",
        slots: Number(draft.slots) || 64,
        image: draft.image,
        summary: draft.summary,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create event");
    }
    toast.success("Event created in database", { description: json.event.title });
    return {
      id: json.event.id,
      image: json.event.image || "",
      title: json.event.title,
      discipline: json.event.discipline,
      category: json.event.category || draft.category,
      city: json.event.city,
      venue: json.event.venue,
      startDate: json.event.startDate,
      endDate: json.event.endDate,
      status: json.event.status,
      entryFee: json.event.entryFee,
      slots: String(json.event.slots),
      summary: json.event.summary || "",
    };
  };

  const handleUpdateEvent = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        discipline: draft.discipline,
        category: draft.category,
        city: draft.city,
        venue: draft.venue,
        startDate: draft.startDate,
        endDate: draft.endDate,
        status: draft.status,
        entryFee: draft.entryFee,
        slots: Number(draft.slots) || 64,
        image: draft.image,
        summary: draft.summary,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update event");
    }
    toast.success("Event updated in database", { description: json.event.title });
    return {
      id: json.event.id,
      image: json.event.image || "",
      title: json.event.title,
      discipline: json.event.discipline,
      category: json.event.category || draft.category,
      city: json.event.city,
      venue: json.event.venue,
      startDate: json.event.startDate,
      endDate: json.event.endDate,
      status: json.event.status,
      entryFee: json.event.entryFee,
      slots: String(json.event.slots),
      summary: json.event.summary || "",
    };
  };

  const handleDeleteEvent = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete event");
    }
    return true;
  };

  // Handlers for News API CRUD operations
  const handleCreateNews = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        category: draft.category || "Governance",
        tag: draft.tag || "Latest",
        author: draft.author || "Media Bureau",
        date: draft.date,
        readTime: draft.readTime,
        excerpt: draft.excerpt,
        body: draft.body,
        image: draft.image,
        status: draft.status || "Published",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create article");
    }
    toast.success("Article published in database", { description: json.article.title });
    return {
      id: json.article.id,
      image: json.article.image || "",
      title: json.article.title,
      category: json.article.category,
      tag: json.article.tag,
      author: json.article.author,
      date: json.article.date,
      readTime: json.article.readTime,
      excerpt: json.article.excerpt,
      body: Array.isArray(json.article.body) ? json.article.body.join("\n\n") : json.article.body || "",
      status: json.article.status,
    };
  };

  const handleUpdateNews = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        category: draft.category,
        tag: draft.tag,
        author: draft.author,
        date: draft.date,
        readTime: draft.readTime,
        excerpt: draft.excerpt,
        body: draft.body,
        image: draft.image,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update article");
    }
    toast.success("Article updated in database", { description: json.article.title });
    return {
      id: json.article.id,
      image: json.article.image || "",
      title: json.article.title,
      category: json.article.category,
      tag: json.article.tag,
      author: json.article.author,
      date: json.article.date,
      readTime: json.article.readTime,
      excerpt: json.article.excerpt,
      body: Array.isArray(json.article.body) ? json.article.body.join("\n\n") : json.article.body || "",
      status: json.article.status,
    };
  };

  const handleDeleteNews = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete article");
    }
    return true;
  };

  // Handlers for Results API CRUD operations
  const handleCreateResult = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament: draft.tournament,
        discipline: draft.discipline,
        season: draft.season,
        winner: draft.winner,
        runnerUp: draft.runnerUp,
        thirdPlace: draft.thirdPlace,
        mvp: draft.mvp,
        medals: {
          gold: Number(draft.goldMedals) || 0,
          silver: Number(draft.silverMedals) || 0,
          bronze: Number(draft.bronzeMedals) || 0,
        },
        image: draft.image,
        status: draft.status || "Verified",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create result");
    }
    toast.success("Tournament result created", { description: json.result.tournament });
    return {
      id: json.result.id,
      tournament: json.result.tournament,
      discipline: json.result.discipline,
      season: json.result.season,
      winner: json.result.winner,
      runnerUp: json.result.runnerUp || "",
      thirdPlace: json.result.thirdPlace || "",
      mvp: json.result.mvp || "",
      goldMedals: String(json.result.medals?.gold ?? 0),
      silverMedals: String(json.result.medals?.silver ?? 0),
      bronzeMedals: String(json.result.medals?.bronze ?? 0),
      image: json.result.image || "",
      status: json.result.status,
    };
  };

  const handleUpdateResult = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/results/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament: draft.tournament,
        discipline: draft.discipline,
        season: draft.season,
        winner: draft.winner,
        runnerUp: draft.runnerUp,
        thirdPlace: draft.thirdPlace,
        mvp: draft.mvp,
        medals: {
          gold: Number(draft.goldMedals) || 0,
          silver: Number(draft.silverMedals) || 0,
          bronze: Number(draft.bronzeMedals) || 0,
        },
        image: draft.image,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update result");
    }
    toast.success("Tournament result updated", { description: json.result.tournament });
    return {
      id: json.result.id,
      tournament: json.result.tournament,
      discipline: json.result.discipline,
      season: json.result.season,
      winner: json.result.winner,
      runnerUp: json.result.runnerUp || "",
      thirdPlace: json.result.thirdPlace || "",
      mvp: json.result.mvp || "",
      goldMedals: String(json.result.medals?.gold ?? 0),
      silverMedals: String(json.result.medals?.silver ?? 0),
      bronzeMedals: String(json.result.medals?.bronze ?? 0),
      image: json.result.image || "",
      status: json.result.status,
    };
  };

  const handleDeleteResult = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/results/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete result");
    }
    return true;
  };

  // Handlers for Medal Tally API CRUD operations
  const handleCreateMedalTally = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/medal-tally", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: draft.state,
        gold: Number(draft.gold) || 0,
        silver: Number(draft.silver) || 0,
        bronze: Number(draft.bronze) || 0,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create medal tally entry");
    }
    toast.success("Medal tally entry added", { description: json.entry.state });
    return {
      id: json.entry.id,
      state: json.entry.state,
      gold: String(json.entry.gold ?? 0),
      silver: String(json.entry.silver ?? 0),
      bronze: String(json.entry.bronze ?? 0),
    };
  };

  const handleUpdateMedalTally = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/medal-tally/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: draft.state,
        gold: Number(draft.gold) || 0,
        silver: Number(draft.silver) || 0,
        bronze: Number(draft.bronze) || 0,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update medal tally entry");
    }
    toast.success("Medal tally entry updated", { description: json.entry.state });
    return {
      id: json.entry.id,
      state: json.entry.state,
      gold: String(json.entry.gold ?? 0),
      silver: String(json.entry.silver ?? 0),
      bronze: String(json.entry.bronze ?? 0),
    };
  };

  const handleDeleteMedalTally = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/medal-tally/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete medal tally entry");
    }
    return true;
  };

  // Handlers for Gallery API CRUD operations
  const handleCreateGallery = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: draft.type || "photo",
        title: draft.title,
        category: draft.category || "General",
        src: draft.src,
        thumb: draft.thumb,
        duration: draft.duration,
        span: draft.span || "normal",
        status: draft.status || "Published",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to add media item");
    }
    toast.success("Media item added to gallery", { description: json.item.title });
    return {
      id: json.item.id,
      type: json.item.type,
      title: json.item.title,
      category: json.item.category,
      src: json.item.src,
      thumb: json.item.thumb || "",
      duration: json.item.duration || "",
      span: json.item.span || "normal",
      status: json.item.status,
    };
  };

  const handleUpdateGallery = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: draft.type,
        title: draft.title,
        category: draft.category,
        src: draft.src,
        thumb: draft.thumb,
        duration: draft.duration,
        span: draft.span,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update media item");
    }
    toast.success("Media item updated", { description: json.item.title });
    return {
      id: json.item.id,
      type: json.item.type,
      title: json.item.title,
      category: json.item.category,
      src: json.item.src,
      thumb: json.item.thumb || "",
      duration: json.item.duration || "",
      span: json.item.span || "normal",
      status: json.item.status,
    };
  };

  const handleDeleteGallery = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete media item");
    }
    return true;
  };

  // Handlers for Contact Requests CRUD operations
  const handleCreateContact = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        subject: draft.subject,
        message: draft.message,
        status: draft.status || "New",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create contact request");
    }
    toast.success("Contact request recorded", { description: json.contact.subject });
    return {
      id: json.contact.id,
      name: json.contact.name,
      email: json.contact.email,
      phone: json.contact.phone || "",
      subject: json.contact.subject,
      message: json.contact.message,
      status: json.contact.status,
    };
  };

  const handleUpdateContact = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update contact request");
    }
    toast.success("Contact request updated", { description: `${id} is now ${draft.status}` });
    return {
      id: json.contact.id,
      name: json.contact.name,
      email: json.contact.email,
      phone: json.contact.phone || "",
      subject: json.contact.subject,
      message: json.contact.message,
      status: json.contact.status,
    };
  };

  const handleDeleteContact = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete contact request");
    }
    return true;
  };

  // Handlers for Certificates CRUD operations
  const handleCreateCertificate = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: draft.number,
        holder: draft.holder,
        email: draft.email,
        state: draft.state,
        type: draft.type || "Championship Winner",
        event: draft.event,
        position: draft.position || "Gold Medal",
        issued: draft.issued || new Date().toISOString().split("T")[0],
        status: draft.status || "Issued",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create certificate");
    }
    toast.success("Certificate issued successfully", { description: `${json.certificate.number} for ${json.certificate.holder}` });
    return {
      id: json.certificate.id,
      number: json.certificate.number,
      holder: json.certificate.holder,
      email: json.certificate.email || draft.email || "",
      state: json.certificate.state || draft.state || "",
      type: json.certificate.type,
      event: json.certificate.event,
      position: json.certificate.position,
      issued: json.certificate.issued,
      status: json.certificate.status,
    };
  };

  const handleUpdateCertificate = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: draft.number,
        holder: draft.holder,
        email: draft.email,
        state: draft.state,
        type: draft.type,
        event: draft.event,
        position: draft.position,
        issued: draft.issued,
        status: draft.status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update certificate");
    }
    toast.success("Certificate record updated", { description: json.certificate.number });
    return {
      id: json.certificate.id,
      number: json.certificate.number,
      holder: json.certificate.holder,
      email: json.certificate.email || draft.email || "",
      state: json.certificate.state || draft.state || "",
      type: json.certificate.type,
      event: json.certificate.event,
      position: json.certificate.position,
      issued: json.certificate.issued,
      status: json.certificate.status,
    };
  };

  const handleDeleteCertificate = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete certificate");
    }
    loadCertificates();
    return true;
  };

  // Handlers for Downloads API CRUD operations
  const handleCreateDownload = async (draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create document");
    }
    toast.success("Document added to Download Center", { description: json.download.title });
    loadDownloads();
    return {
      id: json.download.id,
      title: json.download.title,
      category: json.download.category,
      description: json.download.description || "",
      version: json.download.version || "v2026.1",
      publishedDate: json.download.publishedDate || "",
      updatedDate: json.download.updatedDate || "",
      year: json.download.year || "2026",
      event: json.download.event || "Federation Direct / General",
      type: json.download.type || "PDF",
      size: json.download.size || "1.0 MB",
      docCode: json.download.docCode || "",
      status: json.download.status || "Published",
    };
  };

  const handleUpdateDownload = async (id: string, draft: Record<string, string>): Promise<AdminRecord> => {
    const res = await fetch(`/api/downloads/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update document");
    }
    toast.success("Document updated successfully", { description: json.download.title });
    loadDownloads();
    return {
      id: json.download.id,
      title: json.download.title,
      category: json.download.category,
      description: json.download.description || "",
      version: json.download.version || "v2026.1",
      publishedDate: json.download.publishedDate || "",
      updatedDate: json.download.updatedDate || "",
      year: json.download.year || "2026",
      event: json.download.event || "Federation Direct / General",
      type: json.download.type || "PDF",
      size: json.download.size || "1.0 MB",
      docCode: json.download.docCode || "",
      status: json.download.status || "Published",
    };
  };

  const handleDeleteDownload = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/downloads/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to delete document");
    }
    toast.success("Document removed from Download Center");
    loadDownloads();
    return true;
  };

  const pending =
    data.players.filter((p) => p.status === "Pending").length +
    data.coaches.filter((c) => c.status === "Pending").length +
    data.referees.filter((r) => r.status === "Pending" || r.status === "In Review").length +
    data.clubs.filter((cl) => cl.status === "Pending" || cl.status === "Under Review").length +
    (data.contacts ? data.contacts.filter((c) => c.status === "New").length : 0);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wsf_admin_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.authenticated) {
          setAdminSession(json);
          if (json.role === "district_admin") {
            setTab("clubs");
          }
        }
      })
      .catch((err) => console.error("Admin session error:", err));
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("wsf_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.info("Logged out");
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <div className="bg-background flex min-h-screen w-full">
      {/* Left Sidebar */}
      <aside
        className={cn(
          "border-border/60 bg-card/60 hidden shrink-0 flex-col justify-between border-r transition-all duration-300 ease-in-out lg:flex",
          sidebarCollapsed ? "w-20 p-3" : "w-72 p-5"
        )}
      >
        <div>
          {/* Top Brand & Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className={cn("flex items-center gap-3 min-w-0", sidebarCollapsed && "justify-center w-full")}>
              <div
                className={cn(
                  "shrink-0 overflow-hidden rounded-full bg-white shadow-gold transition-all duration-300 flex items-center justify-center",
                  sidebarCollapsed ? "size-10" : "size-11"
                )}
              >
                <img src="/logo.png" alt={federation.name} className="size-full object-contain" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-gold-gradient text-sm font-black tracking-wider uppercase leading-tight truncate">
                    KALAWAR SPORTS
                  </p>
                  <p className="text-gold-gradient text-[10px] font-bold uppercase leading-tight tracking-tight mt-0.5 truncate">
                    &amp; Martial Arts Federation
                  </p>
                  <p className="text-[9px] font-semibold text-primary/70 uppercase tracking-widest mt-1 truncate">
                    {adminSession?.role === "district_admin" ? `${adminSession.district || "District"} Unit` : "Admin Portal"}
                  </p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="size-8 rounded-lg bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground grid place-items-center transition-colors shrink-0 cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )}
          </div>

          {sidebarCollapsed && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="size-8 rounded-lg bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={cn("mt-6 space-y-1", sidebarCollapsed && "mt-4")}>
            {visibleNav.map((n) => {
              const badgeCount =
                n.key === "players"
                  ? data.players.filter((p) => p.status === "Pending").length
                  : n.key === "coaches"
                    ? data.coaches.filter((c) => c.status === "Pending").length
                    : n.key === "referees"
                      ? data.referees.filter((r) => r.status === "Pending" || r.status === "In Review").length
                      : n.key === "clubs"
                        ? data.clubs.filter((cl) => cl.status === "Pending" || cl.status === "Under Review").length
                        : 0;

              const isActive = tab === n.key;

              return (
                <button
                  key={n.key}
                  onClick={() => {
                    setTab(n.key);
                    setQ("");
                  }}
                  title={sidebarCollapsed ? n.label : undefined}
                  className={cn(
                    "flex w-full items-center rounded-xl text-sm transition-all relative group cursor-pointer",
                    sidebarCollapsed ? "justify-center p-3" : "justify-between px-4 py-2.5",
                    isActive
                      ? "bg-accent text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <n.icon className="size-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{n.label}</span>}
                  </span>
                  {badgeCount > 0 && (
                    sidebarCollapsed ? (
                      <span className="absolute top-2 right-2 size-2.5 rounded-full bg-amber-500 ring-2 ring-card animate-pulse" />
                    ) : (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {badgeCount}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Left Corner: Admin Profile & Log Out */}
        <div className={cn("border-border/60 border-t pt-4 space-y-2.5", sidebarCollapsed && "pt-3")}>
          <div
            className={cn(
              "flex items-center rounded-xl bg-accent/30 p-2.5",
              sidebarCollapsed ? "justify-center" : "gap-3"
            )}
            title={
              sidebarCollapsed
                ? adminSession?.role === "district_admin"
                  ? `${adminSession.district} District Secretariat`
                  : `National Administrator (${federation.email})`
                : undefined
            }
          >
            <div className="size-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {adminSession?.role === "district_admin" ? "DA" : "AD"}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {adminSession?.role === "district_admin"
                    ? `${adminSession.district} Secretariat`
                    : "National Administrator"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {adminSession?.role === "district_admin"
                    ? `${adminSession.state || "District Unit"}`
                    : federation.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={sidebarCollapsed ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer",
              sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-4 py-2.5"
            )}
          >
            <LogOut className="size-4 shrink-0" />
            {!sidebarCollapsed && <span>{loggingOut ? "Logging out..." : "Log out"}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 transition-all duration-300">
        <header className="border-border/60 bg-card/40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 sm:px-6 py-4 sm:flex sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:grid size-9 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground place-items-center transition-colors shrink-0 cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-4 text-primary" /> : <PanelLeftClose className="size-4" />}
            </button>
            <h1 className="truncate text-lg font-semibold capitalize flex items-center gap-2">
              {visibleNav.find((n) => n.key === tab)?.label || (tab === "clubs" ? "Club Affiliation" : tab)}
              {adminSession?.role === "district_admin" && adminSession.district && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 capitalize">
                  📍 {adminSession.district} District Unit ({adminSession.state})
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="border-border/70 bg-background/60 flex items-center gap-2 rounded-full border px-4 py-2">
              <Search className="text-muted-foreground size-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search records"
                className="w-28 bg-transparent text-xs outline-none sm:w-44"
              />
            </div>
            {/* Mobile Log Out Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out"
              title="Log out"
              className="border-border/70 bg-background/60 hover:border-destructive hover:text-destructive flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium lg:hidden"
            >
              <LogOut className="size-4 text-destructive" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          <div className="flex gap-2 overflow-x-auto lg:hidden">
            {visibleNav.map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  setTab(n.key);
                  setQ("");
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
                  tab === n.key
                    ? "bg-gold-gradient border-transparent text-background"
                    : "border-border/70",
                )}
              >
                {n.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <Overview
              data={data}
              counts={{
                players: data.players.length,
                coaches: data.coaches.length,
                referees: data.referees.length,
                leadership: data.leadership ? data.leadership.length : 0,
                officials: data.officials ? data.officials.length : 0,
                clubs: data.clubs.length,
                events: data.events.length,
                news: data.news.length,
                pending,
              }}
              onNavigate={(navKey) => {
                setTab(navKey as any);
                setQ("");
              }}
            />
          ) : tab === "banners" ? (
            <AdminBannersManager />
          ) : tab === "settings" ? (
            <SettingsPanel />
          ) : tab === "players" ? (
            <AdminModule
              key={tab}
              moduleKey={tab}
              singular={fieldConfig[tab].singular}
              idPrefix={fieldConfig[tab].idPrefix}
              statusKey={fieldConfig[tab].statusKey}
              fields={playerFields}
              rows={data[tab]}
              onRowsChange={setRows(tab)}
              query={q}
              onCreate={handleCreatePlayer}
              onUpdate={handleUpdatePlayer}
              onDelete={handleDeletePlayer}
              isLoading={loadingPlayers}
            />
          ) : tab === "coaches" ? (
            <AdminCoachesManager />
          ) : tab === "referees" ? (
            <AdminRefereesManager />
          ) : tab === "leadership" ? (
            <AdminModule
              key={tab}
              moduleKey={tab}
              singular={fieldConfig[tab].singular}
              idPrefix={fieldConfig[tab].idPrefix}
              statusKey={fieldConfig[tab].statusKey}
              fields={fieldConfig[tab].fields}
              rows={data[tab]}
              onRowsChange={setRows(tab)}
              query={q}
              onCreate={handleCreateLeadership}
              onUpdate={handleUpdateLeadership}
              onDelete={handleDeleteLeadership}
              isLoading={loadingLeadership}
            />
          ) : tab === "officials" ? (
            <>
              <AdminModule
                key={tab}
                moduleKey={tab}
                singular={fieldConfig[tab].singular}
                idPrefix={fieldConfig[tab].idPrefix}
                statusKey={fieldConfig[tab].statusKey}
                fields={officialsFields}
                rows={data[tab]}
                onRowsChange={setRows(tab)}
                query={q}
                onCreate={handleCreateOfficial}
                onUpdate={handleUpdateOfficial}
                onDelete={handleDeleteOfficial}
                isLoading={loadingOfficials}
              />
              <AdminGovernanceTiersModal
                open={isTiersModalOpen}
                onOpenChange={setIsTiersModalOpen}
                onTiersChanged={(cats) => {
                  setGovernanceTiers(cats);
                  loadOfficials();
                }}
                officials={data.officials || []}
              />
            </>
          ) : tab === "clubs" ? (
            <AdminClubsManager
              districtScope={adminSession?.role === "district_admin" ? adminSession.district : undefined}
              stateScope={adminSession?.role === "district_admin" ? adminSession.state : undefined}
            />
          ) : tab === "stateAssociations" ? (
            <AdminStateAssociationManager />
          ) : tab === "districtAssociations" ? (
            <AdminDistrictAssociationManager />
          ) : tab === "district" ? (
            <AdminDistrictManager />
          ) : tab === "beltExams" ? (
            <AdminBeltExamManager />
          ) : tab === "danGrading" ? (
            <AdminDanGradingManager />
          ) : tab === "championships" ? (
            <AdminChampionshipManager />
          ) : tab === "idCards" ? (
            <AdminIdCardsManager
              districtScope={adminSession?.role === "district_admin" ? adminSession.district : undefined}
              stateScope={adminSession?.role === "district_admin" ? adminSession.state : undefined}
            />
          ) : tab === "receipts" ? (
            <AdminReceiptsManager />
          ) : tab === "events" ? (
            <AdminEventsHub />
          ) : tab === "news" ? (
            <AdminNewsManager />
          ) : tab === "gallery" ? (
            <div className="space-y-6">
              {/* Dual Gallery Sub-Tab Switcher */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-900 border border-stone-800 w-fit">
                <button
                  type="button"
                  onClick={() => setGallerySubTab("photos")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
                    gallerySubTab === "photos"
                      ? "bg-gold-500 text-stone-950 shadow-md shadow-gold-500/20"
                      : "text-stone-400 hover:text-white"
                  )}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 Photo Albums Manager</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGallerySubTab("videos")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
                    gallerySubTab === "videos"
                      ? "bg-gold-500 text-stone-950 shadow-md shadow-gold-500/20"
                      : "text-stone-400 hover:text-white"
                  )}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎥 Video Gallery Manager</span>
                </button>
              </div>

              {gallerySubTab === "photos" ? (
                <AdminPhotoGalleryManager />
              ) : (
                <AdminVideoGalleryManager />
              )}
            </div>
          ) : tab === "contacts" ? (
            <AdminContactsManager />
          ) : tab === "commonReviews" ? (
            <AdminCommonReviewsManager />
          ) : tab === "downloads" ? (
            <AdminDownloadsManager />
          ) : tab === "products" ? (
            <AdminProductsManager />
          ) : tab === "categories" ? (
            <AdminCategoriesManager />
          ) : tab === "orders" ? (
            <AdminOrdersManager />
          ) : tab === "reviews" ? (
            <AdminReviewsManager />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Overview({
  data,
  counts,
  onNavigate,
}: {
  data: Record<string, AdminRecord[]>;
  counts: {
    players: number;
    coaches: number;
    referees: number;
    leadership?: number;
    officials?: number;
    clubs: number;
    events: number;
    news: number;
    pending: number;
  };
  onNavigate: (tab: string) => void;
}) {
  const [shopStats, setShopStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    paidOrdersCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadShopData() {
      try {
        setLoadingOrders(true);
        const [prodRes, ordRes] = await Promise.all([
          fetch("/api/shop/products?status=All"),
          fetch("/api/shop/orders"),
        ]);
        const prodData = await prodRes.json();
        const ordData = await ordRes.json();

        const prods = Array.isArray(prodData.products) ? prodData.products.length : 0;
        const ords = Array.isArray(ordData.orders) ? ordData.orders : [];
        const paidOrds = ords.filter((o: any) => o.payment?.status === "Paid");
        const rev = paidOrds.reduce(
          (sum: number, o: any) => sum + (o.total || 0),
          0
        );

        setShopStats({
          products: prods,
          orders: ords.length,
          revenue: rev,
          paidOrdersCount: paidOrds.length,
        });
        setRecentOrders(ords.slice(0, 5));
      } catch (err) {
        console.error("Overview load shop data error:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadShopData();
  }, []);

  // Compute discipline distribution dynamically from players
  const disciplineCounts: Record<string, number> = {};
  (data.players || []).forEach((p) => {
    const disc = p.discipline || "Martial Arts";
    disciplineCounts[disc] = (disciplineCounts[disc] || 0) + 1;
  });
  const totalPlayersForDiscipline = Math.max(1, (data.players || []).length);
  const disciplineEntries = Object.entries(disciplineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Compute state distribution dynamically from players
  const stateCounts: Record<string, number> = {};
  (data.players || []).forEach((p) => {
    const st = p.state || "National";
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  });
  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Extract pending moderation items
  const pendingPlayers = (data.players || []).filter((p) => p.status === "Pending");
  const pendingCoaches = (data.coaches || []).filter((c) => c.status === "Pending");
  const pendingReferees = (data.referees || []).filter(
    (r) => r.status === "Pending" || r.status === "In Review"
  );
  const pendingClubs = (data.clubs || []).filter(
    (cl) => cl.status === "Pending" || cl.status === "Under Review"
  );
  const pendingContacts = (data.contacts || []).filter((c) => c.status === "New");

  return (
    <div className="space-y-8">
      {/* 1. Executive Hero & Quick Actions Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-bold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Live System Operational
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 text-[11px] font-bold text-primary">
                <ShieldCheck className="size-3.5" /> Official Executive Hub
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/40 border border-border/70 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                Season 2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              National Executive <span className="text-gold-gradient">Command Center</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Real-time administrative operations, digital registry verification, official tournament governance, and nationwide martial arts management for KALAWAR Sports & Martial Arts Federation of India.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("players")}
              className="bg-gold-gradient text-background font-bold text-xs px-4 py-2.5 rounded-full shadow-gold hover:opacity-90 inline-flex items-center gap-1.5 transition-all active:scale-95"
            >
              <UserPlus className="size-3.5" /> + Register Athlete
            </button>
            <button
              type="button"
              onClick={() => onNavigate("events")}
              className="bg-card hover:bg-accent border border-border/80 text-foreground font-semibold text-xs px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-all"
            >
              <CalendarDays className="size-3.5 text-primary" /> + Add Event
            </button>
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="border border-border/70 hover:border-primary/60 text-muted-foreground hover:text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-all"
              title="Open Public Federation Store in New Tab"
            >
              <span>Public Store</span>
              <ExternalLink className="size-3 text-primary" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Top Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Athletes */}
        <div
          onClick={() => onNavigate("players")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center group-hover:scale-110 transition-transform">
              <Users className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              View <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Athletes / Players
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {counts.players.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>{(data.players || []).filter((p) => p.status === "Active" || !p.status).length} Active Athletes</span>
          </div>
        </div>

        {/* Coaches & Referees */}
        <div
          onClick={() => onNavigate("coaches")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Award className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              View <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Technical Officials
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {(counts.coaches + counts.referees).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
            <span className="text-primary">{counts.coaches} Coaches</span>
            <span>·</span>
            <span className="text-amber-400">{counts.referees} Referees</span>
            {counts.officials !== undefined && (
              <>
                <span>·</span>
                <span className="text-emerald-400 font-bold">{counts.officials} Officials</span>
              </>
            )}
          </div>
        </div>

        {/* Visionary Leadership */}
        <div
          onClick={() => onNavigate("leadership")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Quote className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              Manage <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Visionary Leadership
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {(counts.leadership ?? (data.leadership || []).length).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span>Founder & President Messages</span>
          </div>
        </div>

        {/* Federation Officials */}
        <div
          onClick={() => onNavigate("officials")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Award className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              Manage <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Federation Governance
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {(counts.officials ?? (data.officials || []).length).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>National, State & Technical Officials</span>
          </div>
        </div>

        {/* Clubs & Academies */}
        <div
          onClick={() => onNavigate("clubs")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 grid place-items-center group-hover:scale-110 transition-transform">
              <Landmark className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              View <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Affiliated Clubs
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {counts.clubs.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
            <span className="size-1.5 rounded-full bg-blue-400" />
            <span>Accredited Dojos</span>
          </div>
        </div>

        {/* Store Revenue */}
        <div
          onClick={() => onNavigate("orders")}
          className="luxe-card p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:border-primary/60 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-primary/20 border border-primary/30 text-primary grid place-items-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              Orders <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Store Paid Revenue
            </p>
            <p className="text-2xl font-black text-gold-gradient mt-0.5">
              ₹{shopStats.revenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
            <span>{shopStats.orders} Total Orders</span>
            <span>·</span>
            <span className="text-emerald-400">{shopStats.paidOrdersCount} Paid</span>
          </div>
        </div>

        {/* Tournaments & Events */}
        <div
          onClick={() => onNavigate("events")}
          className="luxe-card p-5 rounded-2xl border border-border/70 hover:border-primary/50 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 grid place-items-center group-hover:scale-110 transition-transform">
              <CalendarDays className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-0.5">
              View <ChevronRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Championships
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5">
              {counts.events.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-medium">
            <span className="size-1.5 rounded-full bg-purple-400" />
            <span>Season 2026 Calendar</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Moderation Queue (Rendered prominently if actionable items exist) */}
      {counts.pending > 0 && (
        <div className="luxe-card p-6 rounded-3xl border border-amber-500/40 bg-amber-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 grid place-items-center">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Action Required: Pending Applications</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.2 text-xs font-black">
                    {counts.pending}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registrations and applications awaiting federation approval and verification.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pendingPlayers.length > 0 && (
              <div
                onClick={() => onNavigate("players")}
                className="p-4 rounded-2xl bg-background/60 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Athletes</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px]">
                    {pendingPlayers.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Latest: {pendingPlayers[0]?.name} ({pendingPlayers[0]?.state})
                </p>
                <p className="text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                  Review in Players <ArrowRight className="size-3" />
                </p>
              </div>
            )}

            {pendingCoaches.length > 0 && (
              <div
                onClick={() => onNavigate("coaches")}
                className="p-4 rounded-2xl bg-background/60 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Coaches</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px]">
                    {pendingCoaches.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Latest: {pendingCoaches[0]?.name} ({pendingCoaches[0]?.state})
                </p>
                <p className="text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                  Review in Coaches <ArrowRight className="size-3" />
                </p>
              </div>
            )}

            {pendingReferees.length > 0 && (
              <div
                onClick={() => onNavigate("referees")}
                className="p-4 rounded-2xl bg-background/60 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Referees</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px]">
                    {pendingReferees.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Latest: {pendingReferees[0]?.name} ({pendingReferees[0]?.discipline})
                </p>
                <p className="text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                  Review in Referees <ArrowRight className="size-3" />
                </p>
              </div>
            )}

            {pendingClubs.length > 0 && (
              <div
                onClick={() => onNavigate("clubs")}
                className="p-4 rounded-2xl bg-background/60 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Club Affiliations</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px]">
                    {pendingClubs.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Latest: {pendingClubs[0]?.name} ({pendingClubs[0]?.state})
                </p>
                <p className="text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                  Review in Clubs <ArrowRight className="size-3" />
                </p>
              </div>
            )}

            {pendingContacts.length > 0 && (
              <div
                onClick={() => onNavigate("contacts")}
                className="p-4 rounded-2xl bg-background/60 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Inquiries</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px]">
                    {pendingContacts.length} New
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  From: {pendingContacts[0]?.name}
                </p>
                <p className="text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                  View Messages <ArrowRight className="size-3" />
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Two-Column Live Activity & Participation Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Store Orders & Latest News */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Store Orders Card */}
          <div className="luxe-card p-6 md:p-7 rounded-3xl border border-border/70 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center">
                  <Package className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Recent Store Orders</h3>
                  <p className="text-xs text-muted-foreground">Latest transactions and purchases</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View All ({shopStats.orders})</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading transactions...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders recorded yet. As customers purchase equipment, orders will appear here in real-time.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    onClick={() => onNavigate("orders")}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-accent/20 rounded-xl px-2.5 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {ord.orderId}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          · {ord.customer?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {ord.items?.length || 1} item(s) · {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <p className="text-xs font-extrabold text-foreground">₹{ord.total}</p>
                        <span
                          className={`text-[9px] font-bold uppercase rounded-full px-2 py-0.2 border inline-block mt-0.5 ${
                            ord.payment?.status === "Paid"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {ord.payment?.status || "Pending"}
                        </span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest News & Federation Media */}
          <div className="luxe-card p-6 md:p-7 rounded-3xl border border-border/70 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center">
                  <Newspaper className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Official Newsroom & Media</h3>
                  <p className="text-xs text-muted-foreground">Press releases, announcements, and coverage</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("news")}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Manage News ({counts.news})</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(data.news || []).slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  onClick={() => onNavigate("news")}
                  className="p-4 rounded-2xl bg-card/40 border border-border/60 hover:border-primary/40 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-bold uppercase text-primary">{n.category || "Announcement"}</span>
                    <span>{n.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                    {n.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Martial Arts Distribution & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Martial Arts Discipline Distribution */}
          <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center">
                <Activity className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Discipline Distribution</h3>
                <p className="text-xs text-muted-foreground">Athlete registrations by style</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {disciplineEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No discipline data registered.</p>
              ) : (
                disciplineEntries.map(([disc, count]) => {
                  const pct = Math.round((count / totalPlayersForDiscipline) * 100);
                  return (
                    <div key={disc} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{disc}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-accent/40 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gold-gradient h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top State Associations */}
          <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary grid place-items-center">
                <Landmark className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Top State Units</h3>
                <p className="text-xs text-muted-foreground">Athletes registered by region</p>
              </div>
            </div>

            <div className="space-y-3">
              {topStates.length === 0 ? (
                <p className="text-xs text-muted-foreground">No state unit data yet.</p>
              ) : (
                topStates.map(([st, count], idx) => (
                  <div key={st} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold grid place-items-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground">{st}</span>
                    </div>
                    <span className="font-bold text-primary">{count} athletes</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Federation Governance Hub
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate("championships")}
                className="p-3 rounded-2xl bg-card/60 border border-border/60 hover:border-primary text-left transition-all hover:bg-accent/40 flex flex-col justify-between space-y-2"
              >
                <Trophy className="size-4 text-primary" />
                <span className="font-bold text-foreground">Championships</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("clubs")}
                className="p-3 rounded-2xl bg-card/60 border border-border/60 hover:border-primary text-left transition-all hover:bg-accent/40 flex flex-col justify-between space-y-2"
              >
                <Landmark className="size-4 text-amber-400" />
                <span className="font-bold text-foreground">Clubs</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("reviews")}
                className="p-3 rounded-2xl bg-card/60 border border-border/60 hover:border-primary text-left transition-all hover:bg-accent/40 flex flex-col justify-between space-y-2"
              >
                <Star className="size-4 text-amber-400" />
                <span className="font-bold text-foreground">Reviews</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="p-3 rounded-2xl bg-card/60 border border-border/60 hover:border-primary text-left transition-all hover:bg-accent/40 flex flex-col justify-between space-y-2"
              >
                <Settings className="size-4 text-primary" />
                <span className="font-bold text-foreground">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings>({
    federationName: "KALAWAR Sports & Martial Arts Federation of India",
    contactEmail: "kalawarmartialartsindia@gmail.com",
    contactPhone: "+91 70833 14435 / +91 95614 27125",
    activeSeason: "2026",
    address: "National Headquarters, India",
    googleMapsUrl: "https://share.google/31PQfjzetEDIADnHy",
    acceptRegistrations: true,
    publishResults: true,
    maintenanceMode: false,
    enableShop: true,
    announcementBanner: "🏆 National Championship 2026 Registrations Open • Join KALAWAR Sports Federation",
    announcementBannerEnabled: true,
  });

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Could not load website settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { bannerSlides, ...settingsToSave } = settings;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settingsToSave,
          acceptRegistrations: true,
          publishResults: true,
          enableShop: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        await refreshSettings();
        toast.success("Website settings updated successfully", {
          description: `${data.settings.federationName} · Season ${data.settings.activeSeason}`,
        });
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="luxe-card p-16 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading website configuration...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="luxe-card p-6 md:p-8 space-y-8">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-gold shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-foreground">
                Website & Federation Settings
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Manage official federation profile details, contact information, and system mode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            title="Reload settings"
            className="border-border/70 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="size-3.5 text-primary" /> Reload
          </button>
        </div>

        {/* Section 1: Federation Profile Details */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Federation Profile
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="federationName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Federation Official Name
              </Label>
              <Input
                id="federationName"
                value={settings.federationName}
                onChange={(e) => setSettings({ ...settings, federationName: e.target.value })}
                placeholder="Federation Official Name"
                className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Email Address
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="contact@federation.org"
                  className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactPhone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Phone Numbers
                </Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="+91 00000 00000 / +91 00000 00000"
                  className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="activeSeason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Season Year
                </Label>
                <Input
                  id="activeSeason"
                  value={settings.activeSeason}
                  onChange={(e) => setSettings({ ...settings, activeSeason: e.target.value })}
                  placeholder="2026"
                  className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Headquarters Location
                </Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="National HQ, India"
                  className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="googleMapsUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Google Maps / Driving Directions URL
                </Label>
                <Input
                  id="googleMapsUrl"
                  value={settings.googleMapsUrl || ""}
                  onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
                  placeholder="https://share.google/31PQfjzetEDIADnHy"
                  className="bg-card/40 border-border/70 focus-visible:border-primary focus-visible:ring-primary/20 h-11 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Website Announcement Bar (Top Marquee Ticker) */}
        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Megaphone className="size-3.5" />
            Website Announcement Bar (Top Marquee Ticker)
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Megaphone className="size-4 text-primary" />
                  <Label htmlFor="announcementBannerEnabled" className="text-sm font-bold text-foreground cursor-pointer">
                    Show Top Announcement Bar
                  </Label>
                </div>
                <p className="text-muted-foreground text-xs pl-6">
                  Displays a continuous smooth marquee ticker badge above the navigation bar across all pages
                </p>
              </div>
              <div className="pl-6 sm:pl-0 shrink-0">
                <Switch
                  id="announcementBannerEnabled"
                  checked={settings.announcementBannerEnabled !== false}
                  onCheckedChange={(checked) => setSettings({ ...settings, announcementBannerEnabled: checked })}
                />
              </div>
            </div>

            {settings.announcementBannerEnabled !== false && (
              <div className="space-y-4 pt-3 border-t border-border/50">
                <div className="grid gap-2">
                  <Label htmlFor="announcementBanner" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Announcement Banner Text
                  </Label>
                  <Input
                    id="announcementBanner"
                    value={settings.announcementBanner || ""}
                    onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                    placeholder="e.g. 🏆 National Championship 2026 Registrations Open • Join KALAWAR Sports Federation"
                    className="bg-card/60 border-border/70 text-xs font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Tip: You can include emojis (e.g. 🏆, 🥋, 📢, ⭐) to give the ticker a bold, eye-catching look.
                  </p>
                </div>

                {/* Live Preview Ticker Box */}
                <div className="rounded-xl border border-primary/20 bg-background/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Sparkles className="size-3.5" />
                      Live Announcement Bar Preview
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="rounded-lg bg-gold-gradient text-background px-4 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-2 shadow-sm overflow-hidden select-none">
                    <Trophy className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {settings.announcementBanner?.trim() || "— Please enter announcement text above —"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Website Opening Intro Video Settings */}
        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Film className="size-3.5" />
            Website Opening Intro Video (Step 1)
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Film className="size-4 text-primary" />
                  <Label htmlFor="introVideoEnabled" className="text-sm font-bold text-foreground cursor-pointer">
                    Enable Full-Screen Intro Video
                  </Label>
                </div>
                <p className="text-muted-foreground text-xs pl-6">
                  Plays a high-impact cinematic KALAWAR martial arts video when visitors arrive on the homepage
                </p>
              </div>
              <div className="pl-6 sm:pl-0 shrink-0">
                <Switch
                  id="introVideoEnabled"
                  checked={settings.introVideoEnabled ?? true}
                  onCheckedChange={(checked) => setSettings({ ...settings, introVideoEnabled: checked })}
                />
              </div>
            </div>

            {settings.introVideoEnabled !== false && (() => {
              const parsed = parseVideoUrl(settings.introVideoUrl || "");
              return (
                <div className="space-y-4 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="introVideoUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Video URL (YouTube / Google Drive / MP4 / Vimeo)
                        </Label>
                        {settings.introVideoUrl && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                              parsed.type === "youtube"
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : parsed.type === "drive"
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : parsed.type === "vimeo"
                                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                : parsed.type === "direct"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            )}
                          >
                            {parsed.platformLabel}
                          </span>
                        )}
                      </div>
                      <Input
                        id="introVideoUrl"
                        value={settings.introVideoUrl || ""}
                        onChange={(e) => setSettings({ ...settings, introVideoUrl: e.target.value })}
                        placeholder="https://youtu.be/... or Google Drive / MP4 link"
                        className="bg-card/60 border-border/70 text-xs font-mono"
                      />
                      {parsed.type === "drive" ? (
                        <p className="text-[11px] text-blue-400/90 font-medium">
                          ℹ️ Google Drive detected! Ensure link sharing permission is set to <strong>&quot;Anyone with the link can view&quot;</strong> in Google Drive.
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Supports YouTube links, Google Drive share links, Vimeo, or direct MP4/WebM files
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="introVideoFrequency" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Playback Frequency
                      </Label>
                      <select
                        id="introVideoFrequency"
                        value={settings.introVideoFrequency || "once_per_session"}
                        onChange={(e) => setSettings({ ...settings, introVideoFrequency: e.target.value as any })}
                        className="w-full bg-card/60 border border-border/70 rounded-md px-3 h-10 text-xs text-foreground focus:border-primary outline-none"
                      >
                        <option value="once_per_session">Once Per Session (Recommended - doesn&apos;t disrupt returning users)</option>
                        <option value="always">Every Visit / Page Load</option>
                        <option value="never">Disabled / Never</option>
                      </select>
                      <p className="text-[11px] text-muted-foreground">
                        Controls whether intro re-triggers on refresh or only for first-time session visits
                      </p>
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="introVideoTitle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Intro Federation Overlay Title
                      </Label>
                      <Input
                        id="introVideoTitle"
                        value={settings.introVideoTitle || ""}
                        onChange={(e) => setSettings({ ...settings, introVideoTitle: e.target.value })}
                        placeholder="KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"
                        className="bg-card/60 border-border/70 text-xs"
                      />
                    </div>
                  </div>

                  {/* Live Video Preview Tester Box */}
                  {settings.introVideoUrl && (
                    <div className="rounded-xl border border-primary/20 bg-background/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-primary">
                          <Film className="size-3.5" />
                          Live Intro Video Tester ({parsed.platformLabel})
                        </span>
                        <span className="text-[10.5px] text-muted-foreground font-mono">
                          {parsed.videoId ? `ID: ${parsed.videoId}` : "Direct Media"}
                        </span>
                      </div>

                      <div className="relative w-full aspect-video max-h-52 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-border/50">
                        {parsed.type === "youtube" && parsed.videoId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=0&controls=1&rel=0`}
                            allow="autoplay; encrypted-media; fullscreen"
                            className="w-full h-full border-0"
                            title="Admin Preview YouTube"
                          />
                        ) : parsed.type === "drive" && parsed.videoId ? (
                          <video
                            src={parsed.directUrl}
                            poster={parsed.thumbnailUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : parsed.type === "vimeo" && parsed.videoId ? (
                          <iframe
                            src={`https://player.vimeo.com/video/${parsed.videoId}?autoplay=0&controls=1`}
                            allow="autoplay; fullscreen"
                            className="w-full h-full border-0"
                            title="Admin Preview Vimeo"
                          />
                        ) : (
                          <video
                            src={parsed.directUrl || settings.introVideoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section 3: System Status & Maintenance Mode */}
        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            System Control
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-primary/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <Label htmlFor="maintenanceMode" className="text-sm font-bold text-foreground cursor-pointer">
                  Maintenance Mode
                </Label>
              </div>
              <p className="text-muted-foreground text-xs pl-6">
                Temporarily display a maintenance notice to public visitors while site updates are underway
              </p>
            </div>
            <div className="pl-6 sm:pl-0 shrink-0">
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs order-2 sm:order-1">
            {settings.updatedAt ? `Last saved: ${new Date(settings.updatedAt).toLocaleTimeString()}` : "Ready to save"}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-gold-gradient text-background shadow-gold rounded-full px-8 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 order-1 sm:order-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="size-4" /> Save Website Settings
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
