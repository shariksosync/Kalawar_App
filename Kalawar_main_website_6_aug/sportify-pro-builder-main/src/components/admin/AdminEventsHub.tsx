"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Trophy,
  Medal,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MapPin,
  Building2,
  Users,
  Award,
  Swords,
  ChevronRight,
  Eye,
  Star,
  Flame,
  ShieldCheck,
  X,
  Save,
  Bed,
  Briefcase,
  Scale,
  Shirt,
  Camera,
  FileCheck,
  Ticket,
  Clock,
  Target,
  Copy,
  RotateCcw,
  BookOpen,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import type { KalawarEvent, AgeWeightCategory } from "@/data/kalawar-events";
import type { SportEvent } from "@/data/events";
import type { DetailedTournamentResult } from "@/data/results-archive";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DatePickerField } from "@/components/admin/DatePickerField";
import { AdminEventCategoriesModal } from "@/components/admin/AdminEventCategoriesModal";
import { AdminEventDisciplinesModal } from "@/components/admin/AdminEventDisciplinesModal";
import { parseVideoSource } from "@/lib/video-utils";
import { cn } from "@/lib/utils";

type SubTabKey = "upcoming" | "championship" | "calendar" | "disciplines" | "results";

const SUB_TABS: { key: SubTabKey; label: string; icon: any; desc: string }[] = [
  { key: "upcoming", label: "Upcoming Events", icon: Trophy, desc: "Live open registration tournaments" },
  { key: "championship", label: "Championship", icon: Swords, desc: "Official national & state championship fixtures" },
  { key: "calendar", label: "Competition Calendar", icon: CalendarDays, desc: "Annual 12-month tournament fixtures" },
  { key: "disciplines", label: "Disciplines", icon: ShieldCheck, desc: "Sanctioned martial arts disciplines & technical formats" },
  { key: "results", label: "Championship Results", icon: Medal, desc: "Historical results, academy rankings & podiums" },
];

const EVENT_CATEGORY_OPTIONS = [
  "National Championship",
  "State Championship & Qualifiers",
  "District & Club Tournament",
  "Selection Trials",
  "Belt & Dan Examination",
  "National Training Camp & Seminar",
  "Referee & Officials Clinic",
] as const;

const DEFAULT_CHAMPIONSHIP_DIVISIONS = [
  { birthYear: "2020 – 2022", ageDivision: "Mighty-Mite (Under 7)", belts: "White, Yellow", weightLimit: "-24.0 kg" },
  { birthYear: "2017 – 2019", ageDivision: "Pee-Wee (Under 10)", belts: "White, Yellow, Orange", weightLimit: "-32.0 kg" },
  { birthYear: "2014 – 2016", ageDivision: "Junior (Under 13)", belts: "White, Yellow, Orange, Green", weightLimit: "-45.0 kg" },
  { birthYear: "2011 – 2013", ageDivision: "Teen (Under 16)", belts: "White, Yellow, Green, Blue", weightLimit: "-58.0 kg" },
  { birthYear: "2008 – 2010", ageDivision: "Juvenile / Youth (16–17)", belts: "White, Blue, Purple", weightLimit: "-68.0 kg" },
  { birthYear: "1997 – 2007", ageDivision: "Senior Adult (18–29)", belts: "White, Blue, Purple, Brown, Black", weightLimit: "-75.0 kg" },
  { birthYear: "1985 – 1996", ageDivision: "Master 1 (30+)", belts: "All Ranks", weightLimit: "-82.0 kg" },
];

const SAMPLE_CHAMPIONSHIP_ACADEMIES = [
  { name: "Kalawar Combat Academy Pune", city: "Pune, Maharashtra", athleteCount: 22 },
  { name: "Mumbai Warriors Dojo", city: "Mumbai, Maharashtra", athleteCount: 18 },
  { name: "Sher-e-Punjab Combat Club", city: "Amritsar, Punjab", athleteCount: 14 },
  { name: "Bengaluru Martial Arts Centre", city: "Bengaluru, Karnataka", athleteCount: 12 },
  { name: "Delhi Strikers Federation Dojo", city: "New Delhi, Delhi NCR", athleteCount: 10 },
];

function slugifyTitle(val: string): string {
  return (val || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getDefaultFlagshipTemplate(count: number): KalawarEvent {
  const newNum = count + 1;
  const newId = `KE-${String(newNum).padStart(2, "0")}`;
  return {
    id: newId,
    slug: `discipline-${newNum}`,
    name: "New Kalawar Discipline",
    marathiName: "नवीन खेळ प्रकार",
    subtitle: "Martial Arts Combat",
    category: "Combat Striking",
    badge: "Combat Format 🥋",
    objective: "Technical proficiency, tactical intelligence, footwork, and defense विकसित करणे.",
    skills: ["Speed", "Accuracy", "Timing", "Defence", "Footwork", "Reaction"],
    tagline: "Official KALAWAR competitive martial arts discipline sanctioned across national divisions.",
    heroImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
    registrationLive: true,
    nextTournamentName: "All-India Federation National Trophy 2026",
    hasWeightCategories: true,
    introduction: {
      overview: "Official KALAWAR competitive martial discipline featuring standardized technical scoring and safety oversight.",
      philosophy: "Discipline, precision, humility, and maximum economy of motion under pressure.",
      historicalRoots: "Rooted in authentic Indian battlefield close-quarters sciences and modernized for Olympic-standard safety.",
      keyHighlights: [
        "Standardized electronic and referee consensus scoring",
        "Mandatory federation certified protective gear",
        "Open across U-8 to U-19 divisions for Boys and Girls",
        "Official national medals and ranking points awarded",
      ],
    },
    rules: {
      rounds: "3 rounds of 2.0 mins (1 min rest)",
      format: "Standard rectangular combat mat (8m x 8m)",
      legalTargets: [
        "Torso & padded chest protector zone",
        "Headguard area (controlled technical touch)",
        "Lateral abdominal ribs above the beltline",
      ],
      prohibitedTechniques: [
        "Striking to throat, neck, or spine",
        "Attacking a grounded athlete",
        "Holding and striking or unsportsmanlike conduct",
      ],
      foulsAndPenalties: [
        "Tier 1: Official verbal caution",
        "Tier 2: 1 penalty point awarded to opponent",
        "Tier 3: Disqualification from match (Hansoku)",
      ],
      judgingProtocol: "3 Corner Judges + 1 Center Referee with electronic point registration.",
    },
    scoring: {
      system: "Electronic point scoring with majority judge consensus (minimum 2 of 3 judges).",
      pointMatrix: [
        { action: "Clean Single Strike", points: "1 Point", description: "Direct strike to chest guard with full extension." },
        { action: "Combination Flurry", points: "2 Points", description: "Two or more unanswered strikes landing cleanly." },
        { action: "Counter Technique with Evasion", points: "2 Points", description: "Slipping opponent attack and delivering clean counter." },
        { action: "High Technical Amplitude Action", points: "3 Points", description: "Rotational or jumping technique landing on valid target." },
      ],
      criteria: [
        "Clean contact with knuckle/instep padding",
        "Proper martial stance and balance upon impact",
        "Controlled intent without malicious force",
      ],
      winConditions: [
        "Higher cumulative point score at match expiration",
        "8-point superiority gap stoppage",
        "Referee Stoppage of Contest (RSC) for safety",
      ],
    },
    categories: [
      {
        division: "Sub-Junior (U-8, U-10, U-12)",
        description: "Novice & Foundational Youth Brackets",
        genders: "Boys & Girls (Separated)",
      },
      {
        division: "Cadet & Junior (U-14, U-17, U-19)",
        description: "Advanced National Championship Brackets",
        genders: "Boys & Girls (Separated)",
      },
    ],
    equipment: {
      mandatory: [
        "Federation approved 10oz/12oz combat gloves",
        "Padded headguard with safety chin strap",
        "High-density reversible chest protector",
        "Mouthguard & groin cup protection",
      ],
      optional: ["Elastic ankle supports", "Approved hand wraps (gauze/tape)"],
      prohibited: ["Metallic jewelry or hard braces", "Greasing or oils on skin"],
      uniformStandards: "Official KALAWAR black & gold combat uniform sanctioned by the federation technical board.",
    },
    media: {
      photos: [
        {
          src: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
          title: "National Finals Combat Action",
          category: "Championship",
        },
        {
          src: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
          title: "Youth Sparring Bout",
          category: "Junior",
        },
      ],
      videos: [
        {
          title: "Championship Bout Highlights",
          duration: "04:15",
          thumb: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80",
          desc: "Top counter-strikes and technical highlights from the latest national games.",
          videoUrl: "https://www.youtube.com/watch?v=07d2dXHYb94",
        },
      ],
    },
    results: [
      {
        season: "2025–26",
        championship: "All-India Federation National Trophy",
        podium: [
          { position: "Gold", athlete: "Rohan Kapoor", state: "Maharashtra", academy: "Titan Athletic Club" },
          { position: "Silver", athlete: "Amir Khan", state: "Delhi", academy: "Vanguard Institute" },
          { position: "Bronze", athlete: "Vikramjit Singh", state: "Punjab", academy: "Northline Academy" },
        ],
      },
    ],
    relatedEventSlugs: ["kaya-yuddha", "charana-yuddha", "santulana", "sparsha-yuddha", "sangama-kala"],
    ageWeight: [
      {
        group: "U-8",
        ageLimit: "Under 8 Years (Boys & Girls)",
        weightClassesMale: ["Under 15 kg", "15–17 kg", "17–19 kg", "19–21 kg", "21–23 kg", "Above 23 kg"],
        weightClassesFemale: ["Under 15 kg", "15–17 kg", "17–19 kg", "19–21 kg", "21–23 kg", "Above 23 kg"],
        matchDuration: "3 rounds x 1.5 mins",
        active: true,
      },
      {
        group: "U-10",
        ageLimit: "Under 10 Years (Boys & Girls)",
        weightClassesMale: ["Under 18 kg", "18–20 kg", "20–22 kg", "22–24 kg", "24–26 kg", "26–28 kg", "Above 28 kg"],
        weightClassesFemale: ["Under 18 kg", "18–20 kg", "20–22 kg", "22–24 kg", "24–26 kg", "26–28 kg", "Above 28 kg"],
        matchDuration: "3 rounds x 1.5 mins",
        active: true,
      },
      {
        group: "U-12",
        ageLimit: "Under 12 Years (Boys & Girls)",
        weightClassesMale: ["Under 20 kg", "20–23 kg", "23–26 kg", "26–29 kg", "29–32 kg", "32–35 kg", "Above 35 kg"],
        weightClassesFemale: ["Under 20 kg", "20–23 kg", "23–26 kg", "26–29 kg", "29–32 kg", "32–35 kg", "Above 35 kg"],
        matchDuration: "3 rounds x 1.5 mins",
        active: true,
      },
      {
        group: "U-14",
        ageLimit: "Under 14 Years (Boys & Girls)",
        weightClassesMale: ["Under 30 kg", "30–33 kg", "33–36 kg", "36–39 kg", "39–42 kg", "42–45 kg", "45–48 kg", "48–51 kg", "Above 51 kg"],
        weightClassesFemale: ["Under 30 kg", "30–33 kg", "33–36 kg", "36–39 kg", "39–42 kg", "42–45 kg", "45–48 kg", "48–51 kg", "Above 51 kg"],
        matchDuration: "3 rounds x 2.0 mins",
        active: true,
      },
      {
        group: "U-17",
        ageLimit: "Under 17 Years (Boys & Girls)",
        weightClassesMale: ["Under 35 kg", "35–38 kg", "38–41 kg", "41–44 kg", "44–47 kg", "47–50 kg", "50–53 kg", "53–56 kg", "56–59 kg", "59–62 kg", "Above 62 kg"],
        weightClassesFemale: ["Under 35 kg", "35–38 kg", "38–41 kg", "41–44 kg", "44–47 kg", "47–50 kg", "50–53 kg", "53–56 kg", "56–59 kg", "59–62 kg", "Above 62 kg"],
        matchDuration: "3 rounds x 2.0 mins",
        active: true,
      },
      {
        group: "U-19",
        ageLimit: "Under 19 Years (Boys & Girls)",
        weightClassesMale: [
          "Under 40 kg",
          "40–45 kg",
          "45–50 kg",
          "50–55 kg",
          "55–60 kg",
          "60–65 kg",
          "65–70 kg",
          "70–75 kg",
          "75–80 kg",
          "80–85 kg",
          "85–90 kg",
          "Above 90 kg",
        ],
        weightClassesFemale: [
          "Under 40 kg",
          "40–45 kg",
          "45–50 kg",
          "50–55 kg",
          "55–60 kg",
          "60–65 kg",
          "65–70 kg",
          "70–75 kg",
          "75–80 kg",
          "80–85 kg",
          "85–90 kg",
          "Above 90 kg",
        ],
        matchDuration: "3 rounds x 2.0 mins",
        active: true,
      },
      {
        group: "Open Category – All Ages",
        ageLimit: "Open Category – All Ages (Senior & Open Competitors)",
        weightClassesMale: [
          "Open Weight Category (No fixed weight limit - Final grouping/draw as per respective Championship/Event Regulations)",
        ],
        weightClassesFemale: [
          "Open Weight Category (No fixed weight limit - Final grouping/draw as per respective Championship/Event Regulations)",
        ],
        matchDuration: "3 rounds x 2.5 mins",
        active: true,
      },
    ],
  };
}

export function AdminEventsHub() {
  const [activeTab, setActiveTab] = useState<SubTabKey>("upcoming");
  const [query, setQuery] = useState("");

  // Data states
  const [flagshipEvents, setFlagshipEvents] = useState<KalawarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<SportEvent[]>([]);
  const [resultsArchives, setResultsArchives] = useState<DetailedTournamentResult[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingDiscipline, setSyncingDiscipline] = useState(false);

  // Modals state
  const [editingFlagship, setEditingFlagship] = useState<{
    discipline: Partial<KalawarEvent>;
    isNew: boolean;
  } | null>(null);
  const [editingEvent, setEditingEvent] = useState<{
    event: Partial<SportEvent>;
    isNew: boolean;
    presetType: "upcoming" | "championship" | "calendar" | "my-first-championship";
  } | null>(null);
  const [editingArchive, setEditingArchive] = useState<{
    archive: Partial<DetailedTournamentResult>;
    isNew: boolean;
  } | null>(null);
  const [eventModalTab, setEventModalTab] = useState<
    "basic" | "categories" | "fees_dates" | "schedule_draw" | "academies" | "rules_policies" | "media" | "results"
  >("basic");
  const [flagshipModalTab, setFlagshipModalTab] = useState<
    "overview" | "intro" | "rules" | "scoring" | "categories" | "equipment" | "media" | "results" | "subdisciplines"
  >("overview");
  const [activeCategoryAgeGroup, setActiveCategoryAgeGroup] = useState<string>("U-8");
  const [archiveAcademyTab, setArchiveAcademyTab] = useState<"adultMale" | "adultFemale" | "juvenile">("adultMale");
  const [previewVideo, setPreviewVideo] = useState<{ title: string; videoUrl: string } | null>(null);
  const [upcomingStatusFilter, setUpcomingStatusFilter] = useState<"ALL" | "Upcoming" | "Ongoing" | "Completed">("ALL");
  const [championshipStatusFilter, setChampionshipStatusFilter] = useState<"ALL" | "Upcoming" | "Ongoing" | "Completed">("ALL");

  // Dynamic Categories & Disciplines Management
  const [eventCategories, setEventCategories] = useState<string[]>([]);
  const [eventDisciplines, setEventDisciplines] = useState<string[]>([]);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isDisciplinesModalOpen, setIsDisciplinesModalOpen] = useState(false);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customDisciplineMode, setCustomDisciplineMode] = useState(false);
  const [customArchiveCategoryMode, setCustomArchiveCategoryMode] = useState(false);
  const [customArchiveDisciplineMode, setCustomArchiveDisciplineMode] = useState(false);

  // Load all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resFlag, resEvents, resResults, resCategories, resDisciplines] = await Promise.all([
        fetch("/api/kalawar-events")
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/events")
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/results/championships")
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/events/categories")
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/events/disciplines")
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      if (resFlag && resFlag.success && Array.isArray(resFlag.events)) {
        setFlagshipEvents(resFlag.events);
      }
      if (resEvents && resEvents.success && Array.isArray(resEvents.events)) {
        setAllEvents(resEvents.events);
      }
      if (resResults && resResults.success && Array.isArray(resResults.results)) {
        setResultsArchives(resResults.results);
      }
      if (resCategories && resCategories.success && Array.isArray(resCategories.categories)) {
        setEventCategories(resCategories.categories);
      }
      if (resDisciplines && resDisciplines.success && Array.isArray(resDisciplines.disciplines)) {
        setEventDisciplines(resDisciplines.disciplines);
      }
    } catch (err) {
      console.error("Failed to load events hub data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // HANDLERS: FLAGSHIP DISCIPLINES
  // ==========================================
  const handleToggleFlagshipLive = async (evt: KalawarEvent) => {
    const nextVal = !evt.registrationLive;
    try {
      const res = await fetch(`/api/kalawar-events/${evt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationLive: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setFlagshipEvents((prev) =>
          prev.map((item) => (item.id === evt.id ? { ...item, registrationLive: nextVal } : item))
        );
        toast.success(
          `${evt.name} registration is now ${nextVal ? "OPEN (Live)" : "CLOSED"}`
        );
      } else {
        toast.error(data.error || "Failed to toggle status");
      }
    } catch {
      toast.error("Network error while updating registration status");
    }
  };

  const handleSaveFlagship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlagship || !editingFlagship.discipline) return;
    const { discipline, isNew } = editingFlagship;

    if (!discipline.name || !discipline.subtitle) {
      toast.error("Please fill in Discipline Name and Subtitle");
      return;
    }

    const finalId = discipline.id || `KE-${Date.now().toString().slice(-4)}`;
    const finalSlug =
      discipline.slug ||
      discipline.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const payload = {
      ...discipline,
      id: finalId,
      slug: finalSlug,
    };

    try {
      setSaving(true);
      const url = isNew ? "/api/kalawar-events" : `/api/kalawar-events/${discipline.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          isNew
            ? `Flagship discipline "${discipline.name}" created successfully!`
            : `Flagship discipline "${discipline.name}" updated successfully!`
        );
        setEditingFlagship(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save discipline");
      }
    } catch {
      toast.error("An error occurred while saving discipline");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlagship = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Flagship Discipline "${name}" (${id})?`)) return;
    try {
      const res = await fetch(`/api/kalawar-events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Flagship discipline "${name}" deleted successfully`);
        setFlagshipEvents((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error(data.error || "Failed to delete discipline");
      }
    } catch {
      toast.error("An error occurred while deleting discipline");
    }
  };

  const handleCloneFlagship = (evt: KalawarEvent) => {
    const copyId = `KE-${String(flagshipEvents.length + 1).padStart(2, "0")}`;
    const copySlug = `${evt.slug || "discipline"}-copy-${Date.now().toString().slice(-4)}`;
    setEditingFlagship({
      discipline: {
        ...evt,
        id: copyId,
        slug: copySlug,
        name: `${evt.name} (Copy)`,
        marathiName: evt.marathiName ? `${evt.marathiName} (प्रत)` : undefined,
      },
      isNew: true,
    });
    toast.info(`Duplicating "${evt.name}". Review the fields and click Save.`);
  };

  // ==========================================
  // HANDLERS: GENERAL EVENTS (Calendar, Upcoming, My First)
  // ==========================================
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const { event, isNew } = editingEvent;
    if (!event.title || !event.discipline || !event.startDate || !event.endDate) {
      toast.error("Please fill in Title, Discipline, Start Date, and End Date");
      return;
    }

    try {
      setSaving(true);
      const url = isNew ? "/api/events" : `/api/events/${event.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isNew ? "Event fixture created!" : "Event fixture updated!");
        
        // Auto-register custom category to store if not already present
        if (event.category && !eventCategories.includes(event.category)) {
          try {
            await fetch("/api/events/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: event.category }),
            });
          } catch {}
        }

        // Auto-register custom discipline to store if not already present
        if (event.discipline && !eventDisciplines.includes(event.discipline)) {
          try {
            await fetch("/api/events/disciplines", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: event.discipline }),
            });
          } catch {}
        }

        // If this event has a matched discipline in flagshipEvents, keep /api/kalawar-events in sync
        if (matchedDiscipline) {
          try {
            await fetch(`/api/kalawar-events/${matchedDiscipline.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tagline: event.title,
                nextTournamentName: event.title,
                registrationLive: event.registrationLive !== false && event.status !== "Completed",
                heroImage: event.image || matchedDiscipline.heroImage,
                subtitle: event.tier || matchedDiscipline.subtitle,
              }),
            });
          } catch (syncErr) {
            console.warn("Discipline auto-sync failed:", syncErr);
          }
        }

        if (isNew && data.event) {
          setAllEvents((prev) => [data.event, ...prev]);
        } else if (!isNew && data.event) {
          setAllEvents((prev) => prev.map((item) => (item.id === data.event.id ? data.event : item)));
        }

        setEditingEvent(null);
        setCustomCategoryMode(false);
        setCustomDisciplineMode(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save event");
      }
    } catch {
      toast.error("An error occurred while saving event");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete fixture "${title}"?`)) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Fixture deleted successfully");
        setAllEvents((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error(data.error || "Failed to delete fixture");
      }
    } catch {
      toast.error("An error occurred while deleting fixture");
    }
  };

  const handleToggleEventLive = async (evt: SportEvent) => {
    const nextVal = !evt.registrationLive;
    try {
      const res = await fetch(`/api/events/${evt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationLive: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setAllEvents((prev) =>
          prev.map((item) => (item.id === evt.id ? { ...item, registrationLive: nextVal } : item))
        );
        toast.success(`Registration for "${evt.title}" is now ${nextVal ? "LIVE" : "CLOSED"}`);
      } else {
        toast.error(data.error || "Failed to update registration status");
      }
    } catch {
      toast.error("Network error while updating registration status");
    }
  };

  const matchedDiscipline = useMemo(() => {
    if (!editingEvent || !editingEvent.event) return null;
    const evt = editingEvent.event;
    const curId = (evt.id || "").trim().toLowerCase();
    const curDiscipline = (evt.discipline || "").trim().toLowerCase();
    const curTitle = (evt.title || "").trim().toLowerCase();

    return (
      flagshipEvents.find((f) => {
        const fId = (f.id || "").trim().toLowerCase();
        const fName = (f.name || "").trim().toLowerCase();
        const fTagline = (f.tagline || "").trim().toLowerCase();
        const fNext = (f.nextTournamentName || "").trim().toLowerCase();
        return (
          (curId && (fId === curId || fId === `ke-${curId}`)) ||
          (curDiscipline && fName === curDiscipline) ||
          (curTitle && (fTagline === curTitle || fNext === curTitle))
        );
      }) || null
    );
  }, [editingEvent, flagshipEvents]);

  const isDisciplineAdded = Boolean(matchedDiscipline);

  const handleToggleDisciplineSync = async (event: Partial<SportEvent>) => {
    if (!event.title || !event.discipline) {
      toast.error("Please enter Championship Title and Discipline first");
      return;
    }
    try {
      setSyncingDiscipline(true);
      if (isDisciplineAdded && matchedDiscipline) {
        // Remove discipline from /api/kalawar-events
        const res = await fetch(`/api/kalawar-events/${matchedDiscipline.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`"${matchedDiscipline.name}" removed from Sanctioned Martial Arts Disciplines`);
          setFlagshipEvents((prev) => prev.filter((item) => item.id !== matchedDiscipline.id));
          fetchData();
        } else {
          toast.error(data.error || "Failed to remove discipline");
        }
      } else {
        // Add discipline to /api/kalawar-events
        const disciplineId = event.id ? `KE-${event.id}` : `KE-${String(flagshipEvents.length + 1).padStart(2, "0")}`;
        const res = await fetch("/api/kalawar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: disciplineId,
            slug: (event.discipline || "discipline").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: event.discipline,
            subtitle: event.tier || "National Championship",
            category: event.category || "Combat Striking",
            badge: event.tier || "Sanctioned Format 🥋",
            objective: `Official KALAWAR tournament discipline: ${event.discipline}.`,
            skills: ["Speed", "Accuracy", "Timing", "Defence", "Footwork"],
            tagline: event.title,
            heroImage: event.image || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
            registrationLive: event.registrationLive !== false,
            nextTournamentName: event.title,
            hasWeightCategories: true,
            introduction: {
              overview: event.summary || `Official KALAWAR competitive martial discipline: ${event.discipline}.`,
              philosophy: "Discipline, precision, sportsmanship, and athletic excellence.",
              historicalRoots: "Rooted in traditional martial arts and modernized for national-standard safety.",
              keyHighlights: [
                "Standardized electronic and referee consensus scoring",
                "Mandatory federation certified protective gear",
                "Open across age and weight divisions",
                "Official national medals and ranking points awarded",
              ],
            },
            rules: {
              rounds: "3 rounds of 2.0 mins (1 min rest)",
              format: "Standard rectangular combat mat (8m x 8m)",
              legalTargets: [
                "Torso & padded chest protector zone",
                "Headguard area (controlled technical touch)",
                "Lateral abdominal ribs above the beltline",
              ],
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`"${event.discipline}" added to Sanctioned Martial Arts Disciplines on /events!`);
          fetchData();
        } else {
          toast.error(data.error || "Failed to add as sanctioned discipline");
        }
      }
    } catch {
      toast.error("Network error while updating sanctioned discipline");
    } finally {
      setSyncingDiscipline(false);
    }
  };

  const handleSaveArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArchive) return;
    const { archive, isNew } = editingArchive;
    const finalId = archive.id || `championship-${Date.now()}`;
    if (!archive.title || !archive.year) {
      toast.error("Please fill in Championship Title and Year");
      return;
    }

    const finalSlug = (archive.slug && archive.slug.trim()) || slugifyTitle(archive.title || "") || `championship-${Date.now()}`;
    const archivePayload = {
      ...archive,
      id: finalId,
      slug: finalSlug,
    };

    try {
      setSaving(true);
      const url = isNew ? "/api/results/championships" : `/api/results/championships/${finalId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(archivePayload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isNew ? "Championship archive created!" : "Championship archive updated!");

        // Auto-register custom category to store if not already present
        if (archive.category && !eventCategories.includes(archive.category)) {
          try {
            await fetch("/api/events/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: archive.category }),
            });
          } catch {}
        }

        // Auto-register custom discipline to store if not already present
        if (archive.discipline && !eventDisciplines.includes(archive.discipline)) {
          try {
            await fetch("/api/events/disciplines", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: archive.discipline }),
            });
          } catch {}
        }

        setEditingArchive(null);
        setCustomArchiveCategoryMode(false);
        setCustomArchiveDisciplineMode(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save results archive");
      }
    } catch {
      toast.error("An error occurred while saving archive");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArchive = async (id: string, title: string) => {
    if (!confirm(`Delete results archive for "${title}"?`)) return;
    try {
      const res = await fetch(`/api/results/championships/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Results archive deleted");
        setResultsArchives((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error(data.error || "Failed to delete archive");
      }
    } catch {
      toast.error("An error occurred while deleting archive");
    }
  };

  // Filtered views with comprehensive Event ID matching
  const filteredFlagship = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flagshipEvents.filter((e) => {
      if (!q) return true;
      const idMatch = (e.id || "").toLowerCase().includes(q);
      const slugMatch = (e.slug || "").toLowerCase().includes(q);
      const nameMatch = (e.name || "").toLowerCase().includes(q);
      const marathiMatch = (e.marathiName || "").toLowerCase().includes(q);
      const subMatch = (e.subtitle || "").toLowerCase().includes(q);
      const tagMatch = (e.tagline || "").toLowerCase().includes(q);
      const catMatch = (e.category || "").toLowerCase().includes(q);
      const objMatch = (e.objective || "").toLowerCase().includes(q);
      return idMatch || slugMatch || nameMatch || marathiMatch || subMatch || tagMatch || catMatch || objMatch;
    });
  }, [flagshipEvents, query]);

  const filteredCalendar = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter((e) => e.eventType === "calendar" || !e.eventType)
      .filter((e) => {
        if (!q) return true;
        const idMatch = (e.id || "").toLowerCase().includes(q);
        const slugMatch = (e.slug || "").toLowerCase().includes(q);
        const titleMatch = (e.title || "").toLowerCase().includes(q);
        const disciplineMatch = (e.discipline || "").toLowerCase().includes(q);
        const cityMatch = (e.city || "").toLowerCase().includes(q);
        const stateMatch = (e.state || "").toLowerCase().includes(q);
        const venueMatch = (e.venue || "").toLowerCase().includes(q);
        const monthMatch = (e.month || "").toLowerCase().includes(q);
        const yearMatch = String(e.year || "").toLowerCase().includes(q);
        const tierMatch = (e.tier || "").toLowerCase().includes(q);
        const catMatch = (e.category || "").toLowerCase().includes(q);
        return (
          idMatch ||
          slugMatch ||
          titleMatch ||
          disciplineMatch ||
          cityMatch ||
          stateMatch ||
          venueMatch ||
          monthMatch ||
          yearMatch ||
          tierMatch ||
          catMatch
        );
      });
  }, [allEvents, query]);

  const filteredMyFirst = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter(
        (e) =>
          e.eventType === "my-first-championship" ||
          e.tier === "Grassroots Debut" ||
          (e.discipline && e.discipline.toLowerCase().includes("debut")) ||
          (e.title && e.title.toLowerCase().includes("my first"))
      )
      .filter((e) => {
        if (!q) return true;
        const idMatch = (e.id || "").toLowerCase().includes(q);
        const slugMatch = (e.slug || "").toLowerCase().includes(q);
        const titleMatch = (e.title || "").toLowerCase().includes(q);
        const discMatch = (e.discipline || "").toLowerCase().includes(q);
        const cityMatch = (e.city || "").toLowerCase().includes(q);
        const venueMatch = (e.venue || "").toLowerCase().includes(q);
        return idMatch || slugMatch || titleMatch || discMatch || cityMatch || venueMatch;
      });
  }, [allEvents, query]);

  const filteredUpcoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter(
        (e) =>
          (e.eventType === "upcoming" || (!e.eventType && !e.month)) &&
          !(e.id && String(e.id).toUpperCase().startsWith("CHAMP-"))
      )
      .filter((e) => {
        if (upcomingStatusFilter === "ALL") return true;
        return e.status === upcomingStatusFilter;
      })
      .filter((e) => {
        if (!q) return true;
        const idMatch = (e.id || "").toLowerCase().includes(q);
        const slugMatch = (e.slug || "").toLowerCase().includes(q);
        const titleMatch = (e.title || "").toLowerCase().includes(q);
        const discMatch = (e.discipline || "").toLowerCase().includes(q);
        const cityMatch = (e.city || "").toLowerCase().includes(q);
        const stateMatch = (e.state || "").toLowerCase().includes(q);
        const venueMatch = (e.venue || "").toLowerCase().includes(q);
        const catMatch = (e.category || "").toLowerCase().includes(q);
        return idMatch || slugMatch || titleMatch || discMatch || cityMatch || stateMatch || venueMatch || catMatch;
      });
  }, [allEvents, query, upcomingStatusFilter]);

  const upcomingStatusCounts = useMemo(() => {
    const eventsInTab = allEvents.filter(
      (e) =>
        (e.eventType === "upcoming" || (!e.eventType && !e.month)) &&
        !(e.id && String(e.id).toUpperCase().startsWith("CHAMP-"))
    );
    return {
      ALL: eventsInTab.length,
      Upcoming: eventsInTab.filter((e) => e.status === "Upcoming" || !e.status).length,
      Ongoing: eventsInTab.filter((e) => e.status === "Ongoing").length,
      Completed: eventsInTab.filter((e) => e.status === "Completed").length,
    };
  }, [allEvents]);

  const filteredChampionship = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter((e) => e.eventType === "championship" || (e.id && e.id.toUpperCase().startsWith("CHAMP-")))
      .filter((e) => {
        if (championshipStatusFilter === "ALL") return true;
        return e.status === championshipStatusFilter;
      })
      .filter((e) => {
        if (!q) return true;
        const idMatch = (e.id || "").toLowerCase().includes(q);
        const slugMatch = (e.slug || "").toLowerCase().includes(q);
        const titleMatch = (e.title || "").toLowerCase().includes(q);
        const discMatch = (e.discipline || "").toLowerCase().includes(q);
        const cityMatch = (e.city || "").toLowerCase().includes(q);
        const stateMatch = (e.state || "").toLowerCase().includes(q);
        const venueMatch = (e.venue || "").toLowerCase().includes(q);
        const catMatch = (e.category || "").toLowerCase().includes(q);
        return idMatch || slugMatch || titleMatch || discMatch || cityMatch || stateMatch || venueMatch || catMatch;
      });
  }, [allEvents, query, championshipStatusFilter]);

  const championshipStatusCounts = useMemo(() => {
    const eventsInTab = allEvents.filter(
      (e) => e.eventType === "championship" || (e.id && e.id.toUpperCase().startsWith("CHAMP-"))
    );
    return {
      ALL: eventsInTab.length,
      Upcoming: eventsInTab.filter((e) => e.status === "Upcoming" || !e.status).length,
      Ongoing: eventsInTab.filter((e) => e.status === "Ongoing").length,
      Completed: eventsInTab.filter((e) => e.status === "Completed").length,
    };
  }, [allEvents]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resultsArchives.filter((r) => {
      if (!q) return true;
      const idMatch = (r.id || "").toLowerCase().includes(q);
      const slugMatch = (r.slug || "").toLowerCase().includes(q);
      const titleMatch = (r.title || "").toLowerCase().includes(q);
      const discMatch = (r.discipline || "").toLowerCase().includes(q);
      const yrMatch = String(r.year || "").toLowerCase().includes(q);
      const cityMatch = (r.city || "").toLowerCase().includes(q);
      const venueMatch = (r.venue || "").toLowerCase().includes(q);
      return idMatch || slugMatch || titleMatch || discMatch || yrMatch || cityMatch || venueMatch;
    });
  }, [resultsArchives, query]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/75 border border-primary/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider">
              FEDERATION HUB
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Events &amp; Tournaments</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gold-gradient mt-1.5">
            Events &amp; Championships Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Control all 5 Flagship Disciplines, Annual Calendars, My First Championship platform, Upcoming open fixtures, and Verified Results archives.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-full border border-border/80 bg-background/80 hover:bg-card px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
          Refresh Data
        </button>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setQuery("");
              }}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2",
                isActive
                  ? "bg-card border-primary/60 shadow-gold"
                  : "bg-card/40 border-border/70 hover:border-primary/30 hover:bg-card/70"
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "size-8 rounded-xl grid place-items-center text-xs",
                    isActive ? "bg-primary text-background" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                {isActive && (
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <div>
                <h4 className={cn("text-xs sm:text-sm font-black", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {tab.label}
                </h4>
                <p className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/60 border border-border/80 rounded-2xl p-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={
              activeTab === "calendar"
                ? "Search by Event ID (e.g. EVT-01, CAL-2026), Title, City, Month..."
                : activeTab === "upcoming"
                ? "Search by Event ID, Championship Title, Discipline, City..."
                : activeTab === "championship"
                ? "Search by Championship ID (e.g. CHAMP-2026-01), Title, Discipline, City..."
                : activeTab === "disciplines"
                ? "Search by Discipline ID (e.g. DISC-01, KE-01), Name, Subtitle, Slug..."
                : "Search by Archive ID, Championship Title, Year..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-background/90 border border-border/80 rounded-xl pl-9 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary transition-all"
          />
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="size-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {activeTab === "upcoming" && (
            <button
              onClick={() =>
                setEditingEvent({
                  event: {
                    eventType: "upcoming",
                    category: "National Championship",
                    tier: "National Championship",
                    status: "Upcoming",
                    registrationLive: true,
                    slots: 64,
                    entryFee: "₹1,200",
                  },
                  isNew: true,
                  presetType: "upcoming",
                })
              }
              className="btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Upcoming Event
            </button>
          )}

          {activeTab === "championship" && (
            <button
              onClick={() => {
                const currentYear = new Date().getFullYear();
                const champList = allEvents.filter(
                  (e) => e.eventType === "championship" || (e.id && e.id.toUpperCase().startsWith("CHAMP-"))
                );
                const newNum = String(champList.length + 1).padStart(2, "0");
                setEditingEvent({
                  event: {
                    id: `CHAMP-${currentYear}-${newNum}`,
                    eventType: "championship",
                    category: "National Championship",
                    tier: "National Championship",
                    status: "Upcoming",
                    registrationLive: true,
                    slots: 64,
                    entryFee: "₹1,500",
                  },
                  isNew: true,
                  presetType: "championship",
                });
              }}
              className="btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Championship
            </button>
          )}

          {activeTab === "calendar" && (
            <button
              onClick={() =>
                setEditingEvent({
                  event: {
                    eventType: "calendar",
                    category: "National Championship",
                    tier: "National Championship",
                    status: "Upcoming",
                    registrationLive: true,
                    month: "APR",
                    year: 2026,
                    slots: 64,
                    entryFee: "Free",
                  },
                  isNew: true,
                  presetType: "calendar",
                })
              }
              className="btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Calendar Fixture
            </button>
          )}

          {activeTab === "disciplines" && (
            <button
              onClick={() => {
                const newNum = String(flagshipEvents.length + 1).padStart(2, "0");
                setEditingFlagship({
                  discipline: {
                    id: `DISC-${newNum}`,
                    slug: `discipline-${newNum}`,
                    name: "",
                    marathiName: "",
                    subtitle: "Official Federation Discipline",
                    tagline: "",
                    heroImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
                    registrationLive: true,
                    introduction: {
                      overview: "",
                      philosophy: "Discipline, precision, sportsmanship, and athletic excellence.",
                      historicalRoots: "Rooted in traditional martial arts and modernized for national-standard safety.",
                      keyHighlights: [],
                    },
                    rules: {
                      rounds: "3 rounds x 2 mins",
                      format: "Standard Federation Rules",
                      legalTargets: [],
                      prohibitedTechniques: [],
                      foulsAndPenalties: [],
                      judgingProtocol: "Standard Federation Protocol",
                    },
                    scoring: {
                      system: "Electronic point scoring with majority judge consensus.",
                      pointMatrix: [],
                      criteria: [],
                      winConditions: [],
                    },
                    categories: [
                      {
                        division: "Sub-Junior (U-8, U-10, U-12)",
                        description: "Novice & Foundational Youth Brackets",
                        genders: "Boys & Girls (Separated)",
                      },
                      {
                        division: "Cadet & Junior (U-14, U-17, U-19)",
                        description: "Advanced National Championship Brackets",
                        genders: "Boys & Girls (Separated)",
                      },
                    ],
                    equipment: {
                      mandatory: ["Federation approved combat gloves", "Padded headguard with chin strap", "Chest protector"],
                      optional: ["Elastic ankle supports"],
                      prohibited: ["Metallic jewelry"],
                      uniformStandards: "Official KALAWAR combat uniform sanctioned by federation.",
                    },
                    media: {
                      photos: [],
                      videos: [],
                    },
                    results: [],
                    ageWeight: [],
                  },
                  isNew: true,
                });
                setFlagshipModalTab("overview");
              }}
              className="btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Discipline
            </button>
          )}

          {activeTab === "results" && (
            <button
              onClick={() =>
                setEditingArchive({
                  archive: {
                    id: `championship-${Date.now()}`,
                    title: "",
                    slug: "",
                    year: new Date().getFullYear(),
                    category: eventCategories[0] || "National Championship",
                    discipline: eventDisciplines[0] || "Kalawar Kaya Yuddha",
                    totalAthletes: 400,
                    totalAcademies: 30,
                    heroImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
                    academiesResults: { adultMale: [], adultFemale: [], juvenile: [] },
                    athletesResultsByCategory: [],
                  },
                  isNew: true,
                })
              }
              className="btn-luxe px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Results Archive
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: UPCOMING EVENTS
          ========================================================================= */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-md">
            {[
              { key: "ALL", label: "All Statuses", count: upcomingStatusCounts.ALL },
              { key: "Upcoming", label: "Upcoming Events", count: upcomingStatusCounts.Upcoming },
              { key: "Ongoing", label: "OnGoing", count: upcomingStatusCounts.Ongoing },
              { key: "Completed", label: "Completed", count: upcomingStatusCounts.Completed },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setUpcomingStatusFilter(st.key as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer",
                  upcomingStatusFilter === st.key
                    ? "bg-primary text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{st.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    upcomingStatusFilter === st.key
                      ? "bg-background/30 text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUpcoming.map((evt) => (
              <div key={evt.id} className="luxe-card p-5 border border-border/80 bg-card/70 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {evt.status === "Ongoing" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> OnGoing
                      </span>
                    ) : evt.status === "Completed" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border text-[10px] font-bold">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                        Upcoming Events
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleEventLive(evt)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer",
                        evt.registrationLive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-destructive/20 text-destructive border border-destructive/40"
                      )}
                    >
                      {evt.registrationLive ? "Live" : "Closed"}
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-foreground">{evt.title}</h4>
                  <p className="text-xs font-mono text-muted-foreground">{evt.discipline}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary shrink-0" /> {evt.city} • {evt.venue}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-end">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingEvent({
                          event: evt,
                          isNew: false,
                          presetType: "upcoming",
                        })
                      }
                      className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.id, evt.title)}
                      className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CHAMPIONSHIP FIXTURES
          ========================================================================= */}
      {activeTab === "championship" && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-md">
            {[
              { key: "ALL", label: "All Statuses", count: championshipStatusCounts.ALL },
              { key: "Upcoming", label: "Upcoming Championship", count: championshipStatusCounts.Upcoming },
              { key: "Ongoing", label: "OnGoing", count: championshipStatusCounts.Ongoing },
              { key: "Completed", label: "Completed", count: championshipStatusCounts.Completed },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setChampionshipStatusFilter(st.key as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer",
                  championshipStatusFilter === st.key
                    ? "bg-primary text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{st.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    championshipStatusFilter === st.key
                      ? "bg-background/30 text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {filteredChampionship.length === 0 ? (
            <div className="luxe-card p-12 text-center max-w-lg mx-auto bg-card/60 border border-border/80 my-8">
              <Swords className="size-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Championship Fixtures</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                No championship tournaments found matching your current filter. Click &quot;+ Add Championship&quot; above to create one with a dedicated ID.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChampionship.map((evt) => (
                <div key={evt.id} className="luxe-card p-5 border border-border/80 bg-card/70 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          {evt.id}
                        </span>
                        {evt.status === "Ongoing" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> OnGoing
                          </span>
                        ) : evt.status === "Completed" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border text-[10px] font-bold">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                            Championship
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleEventLive(evt)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer",
                          evt.registrationLive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-destructive/20 text-destructive border border-destructive/40"
                        )}
                      >
                        {evt.registrationLive ? "Live" : "Closed"}
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-foreground">{evt.title}</h4>
                    <p className="text-xs font-mono text-muted-foreground">{evt.discipline}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary shrink-0" /> {evt.city} • {evt.venue}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-end">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingEvent({
                            event: evt,
                            isNew: false,
                            presetType: "championship",
                          })
                        }
                        className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                        title="Edit Championship"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 cursor-pointer"
                        title="Delete Championship"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: COMPETITION CALENDAR
          ========================================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card/75 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold">
                    <th className="p-3.5">Event ID</th>
                    <th className="p-3.5">Month / Year</th>
                    <th className="p-3.5">Championship Title</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Tier</th>
                    <th className="p-3.5">Dates &amp; City</th>
                    <th className="p-3.5">Registration</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {filteredCalendar.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No calendar fixtures found{query ? ` matching "${query}"` : ""}.
                      </td>
                    </tr>
                  ) : (
                    filteredCalendar.map((evt) => (
                      <tr key={evt.id} className="hover:bg-accent/20 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 group">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                              {evt.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(evt.id);
                                toast.success(`Copied Event ID "${evt.id}" to clipboard`);
                              }}
                              title={`Copy Event ID: ${evt.id}`}
                              className="size-6 rounded inline-flex items-center justify-center opacity-70 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            >
                              <Copy className="size-3 text-primary/80" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {(() => {
                            const MONTH_MAP = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                            let m = (evt.month || "").toUpperCase().trim();
                            let y = evt.year || 2026;
                            if (evt.startDate) {
                              const d = new Date(evt.startDate);
                              if (!isNaN(d.getTime())) {
                                m = MONTH_MAP[d.getMonth()] || "APR";
                                y = d.getFullYear();
                              }
                            }
                            if (!m) m = "APR";

                            return (
                              <div className="w-14 rounded-xl bg-primary/10 border border-primary/30 py-1 px-1.5 text-center shadow-sm">
                                <span className="block text-[11px] font-black uppercase text-primary leading-tight tracking-wider">
                                  {m}
                                </span>
                                <span className="block text-[10px] font-bold text-muted-foreground leading-tight mt-0.5">
                                  {y}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3.5 font-bold">
                          <div>{evt.title}</div>
                          <span className="text-[10px] text-muted-foreground font-mono">{evt.discipline}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {evt.status === "Ongoing" ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> OnGoing
                            </span>
                          ) : evt.status === "Completed" ? (
                            <span className="px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border text-[10px] font-bold">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                              Upcoming Events
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-background border border-border">
                            {evt.tier || evt.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div>{evt.startDate} to {evt.endDate}</div>
                          <span className="text-[10px] text-muted-foreground">{evt.city} • {evt.venue}</span>
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleEventLive(evt)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer",
                              evt.registrationLive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-destructive/20 text-destructive border border-destructive/40"
                            )}
                          >
                            {evt.registrationLive ? "Live" : "Closed"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Edit Fixture"
                              onClick={() =>
                                setEditingEvent({
                                  event: evt,
                                  isNew: false,
                                  presetType: "calendar",
                                })
                              }
                              className="size-7 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Fixture"
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              className="size-7 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SANCTIONED MARTIAL ARTS DISCIPLINES
          ========================================================================= */}
      {activeTab === "disciplines" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-md">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-foreground">
                Sanctioned Disciplines ({filteredFlagship.length})
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Official combat, agility, and heritage formats governed by the federation.
              </p>
            </div>
            <button
              onClick={() => {
                const newNum = String(flagshipEvents.length + 1).padStart(2, "0");
                setEditingFlagship({
                  discipline: {
                    id: `DISC-${newNum}`,
                    slug: `discipline-${newNum}`,
                    name: "",
                    marathiName: "",
                    subtitle: "Official Federation Discipline",
                    tagline: "",
                    heroImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
                    registrationLive: true,
                    introduction: {
                      overview: "",
                      philosophy: "Discipline, precision, sportsmanship, and athletic excellence.",
                      historicalRoots: "Rooted in traditional martial arts and modernized for national-standard safety.",
                      keyHighlights: [],
                    },
                    rules: {
                      rounds: "3 rounds x 2 mins",
                      format: "Standard Federation Rules",
                      legalTargets: [],
                      prohibitedTechniques: [],
                      foulsAndPenalties: [],
                      judgingProtocol: "Standard Federation Protocol",
                    },
                    scoring: {
                      system: "Electronic point scoring with majority judge consensus.",
                      pointMatrix: [],
                      criteria: [],
                      winConditions: [],
                    },
                    categories: [
                      {
                        division: "Sub-Junior (U-8, U-10, U-12)",
                        description: "Novice & Foundational Youth Brackets",
                        genders: "Boys & Girls (Separated)",
                      },
                      {
                        division: "Cadet & Junior (U-14, U-17, U-19)",
                        description: "Advanced National Championship Brackets",
                        genders: "Boys & Girls (Separated)",
                      },
                    ],
                    equipment: {
                      mandatory: ["Federation approved combat gloves", "Padded headguard with chin strap", "Chest protector"],
                      optional: ["Elastic ankle supports"],
                      prohibited: ["Metallic jewelry"],
                      uniformStandards: "Official KALAWAR combat uniform sanctioned by federation.",
                    },
                    media: {
                      photos: [],
                      videos: [],
                    },
                    results: [],
                    ageWeight: [],
                  },
                  isNew: true,
                });
                setFlagshipModalTab("overview");
              }}
              className="btn-luxe px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Discipline
            </button>
          </div>

          {filteredFlagship.length === 0 ? (
            <div className="luxe-card p-12 text-center max-w-lg mx-auto bg-card/60 border border-border/80 my-8">
              <ShieldCheck className="size-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Disciplines Found</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                No sanctioned martial arts disciplines match your search. Click &quot;+ Add Discipline&quot; above to create one.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFlagship.map((evt) => (
                <div key={evt.id} className="luxe-card border border-border/80 bg-card/75 hover:bg-card/90 flex flex-col justify-between overflow-hidden group shadow-lg">
                  {/* Top Image Preview */}
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                    <img
                      src={evt.heroImage || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80"}
                      alt={evt.name}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md font-mono text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        {evt.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFlagshipLive(evt)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors backdrop-blur-md",
                          evt.registrationLive !== false
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                            : "bg-destructive/30 text-destructive border border-destructive/50"
                        )}
                      >
                        {evt.registrationLive !== false ? "● Active" : "Closed"}
                      </button>
                    </div>
                    {evt.marathiName && (
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-amber-300 border border-primary/30 text-[10px] font-bold">
                        {evt.marathiName}
                      </span>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 space-y-2 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      {evt.subtitle || "Sanctioned Discipline"}
                    </span>
                    <h4 className="text-base font-black text-foreground line-clamp-1">{evt.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {evt.tagline || evt.introduction?.overview || "Official federation discipline format."}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        ⚡ {evt.ageWeight?.length || 0} Age Divisions
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-accent/40 text-foreground border border-border">
                        /{evt.slug}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 border-t border-border/60 bg-background/50 flex items-center justify-between">
                    <a
                      href={`/events/${evt.slug || evt.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      title="Preview Public Page"
                    >
                      <Eye className="size-3.5" /> Preview Page
                    </a>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCloneFlagship(evt)}
                        className="p-1.5 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Duplicate Discipline"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFlagship({
                            discipline: evt,
                            isNew: false,
                          });
                          setFlagshipModalTab("overview");
                        }}
                        className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer transition-colors"
                        title="Edit Discipline"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFlagship(evt.id, evt.name)}
                        className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 cursor-pointer transition-colors"
                        title="Delete Discipline"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CHAMPIONSHIP RESULTS & PODIUMS
          ========================================================================= */}
      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card/75 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold">
                    <th className="p-3.5">Season / Year</th>
                    <th className="p-3.5">Championship Archive</th>
                    <th className="p-3.5">Discipline / Tier</th>
                    <th className="p-3.5">🥇 Gold Spotlight</th>
                    <th className="p-3.5">Venue &amp; City</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No championship archives found.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r) => (
                      <tr key={r.id} className="hover:bg-accent/20">
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/25 font-black text-xs">
                            {r.year}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">
                          <div>{r.title}</div>
                          <span className="text-[10px] text-muted-foreground font-mono">{r.id}</span>
                        </td>
                        <td className="p-3.5">
                          <div>{r.discipline}</div>
                          <span className="text-[10px] text-muted-foreground font-semibold">{r.category}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-amber-400">
                            {r.topPodium?.gold?.athlete || r.athletesResultsByCategory?.[0]?.podium?.[0]?.athlete || "Vikramaditya Shinde"}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {r.topPodium?.gold?.academy || "Balewadi High Performance Academy"}
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {r.venue}, {r.city}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <a
                              href={`/results/${r.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View Public Page"
                              className="size-7 rounded-lg bg-accent/80 hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Eye className="size-3.5" />
                            </a>
                            <button
                              type="button"
                              title="Edit Archive"
                              onClick={() => setEditingArchive({ archive: r, isNew: false })}
                              className="size-7 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Archive"
                              onClick={() => handleDeleteArchive(r.id, r.title)}
                              className="size-7 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CREATE FLAGSHIP DISCIPLINE
          ========================================================================= */}
      {editingFlagship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                  FLAGSHIP DISCIPLINE MANAGEMENT
                </span>
                <h3 className="text-xl font-black text-gold-gradient">
                  {editingFlagship.isNew
                    ? "Create New Flagship Discipline"
                    : `Edit: ${editingFlagship.discipline.name || "Discipline"} (${editingFlagship.discipline.id || ""})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFlagship(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sub-Tabs within Flagship Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs scrollbar-none">
              {[
                { key: "overview", label: "Hero & Basics", icon: Swords },
                { key: "intro", label: "1. Introduction", icon: BookOpen },
                { key: "rules", label: "2. Rules & Format", icon: FileCheck },
                { key: "scoring", label: "3. Scoring System", icon: Target },
                {
                  key: "categories",
                  label: `4. Categories & Weights (${editingFlagship.discipline.ageWeight?.length || 0})`,
                  icon: Scale,
                },
                { key: "equipment", label: "5. Equipment & Gear", icon: ShieldCheck },
                {
                  key: "media",
                  label: `6. Photos & Videos (${(editingFlagship.discipline.media?.photos?.length || 0) + (editingFlagship.discipline.media?.videos?.length || 0)})`,
                  icon: Camera,
                },
                {
                  key: "results",
                  label: `7. Results & Champions (${editingFlagship.discipline.results?.length || 0})`,
                  icon: Award,
                },
                ...(editingFlagship.discipline.slug === "sangama-kala" ||
                editingFlagship.discipline.sangamaKalaSubDisciplines
                  ? [{ key: "subdisciplines", label: "8. Sangama Kala Pillars", icon: Sparkles }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = flagshipModalTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFlagshipModalTab(tab.key as any)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer text-[11px]",
                      isActive
                        ? "bg-primary text-background shadow-gold font-black"
                        : "bg-background/60 text-muted-foreground hover:text-foreground border border-border/80"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveFlagship} className="space-y-6 text-xs">
              {/* TAB 0: HERO & BASICS */}
              {flagshipModalTab === "overview" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Discipline Name *</label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoSlug = editingFlagship.isNew
                            ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                            : editingFlagship.discipline.slug;
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              name: val,
                              slug: autoSlug || editingFlagship.discipline.slug,
                            },
                          });
                        }}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Marathi Name (Format Title)</label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.marathiName || ""}
                        onChange={(e) =>
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, marathiName: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold"
                        placeholder="e.g. काया युद्ध"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Subtitle / Category Format *</label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.subtitle || ""}
                        onChange={(e) =>
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, subtitle: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Hand Striking Combat"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Category Classification</label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.category || "Combat Striking"}
                        onChange={(e) =>
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, category: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Combat Striking"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Badge Icon &amp; Text</label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.badge || ""}
                        onChange={(e) =>
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, badge: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Hand Striking 🥊"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Objective (उद्दिष्ट)</label>
                    <textarea
                      rows={2}
                      value={editingFlagship.discipline.objective || ""}
                      onChange={(e) =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, objective: e.target.value },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="e.g. Hand-striking skills, speed, accuracy, timing, footwork, defence आणि controlled technical performance विकसित करणे."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Core Skills (Comma-separated)</label>
                    <input
                      type="text"
                      value={
                        Array.isArray(editingFlagship.discipline.skills)
                          ? editingFlagship.discipline.skills.join(", ")
                          : editingFlagship.discipline.skills || ""
                      }
                      onChange={(e) =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                      placeholder="e.g. Hand Striking, Speed, Accuracy, Timing, Footwork, Defence, Reaction"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Hero Tagline Summary</label>
                    <textarea
                      rows={2}
                      value={editingFlagship.discipline.tagline || ""}
                      onChange={(e) =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, tagline: e.target.value },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="e.g. The Art of Upper-Body Combat Precision, Speed & Counter-Striking"
                    />
                  </div>

                  <div>
                    <ImageUploadField
                      label="Hero Action Photo"
                      value={editingFlagship.discipline.heroImage || ""}
                      onChange={(val: string) =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, heroImage: val },
                        })
                      }
                      folder="wsf_disciplines"
                      helperText="High-definition landscape poster image for this flagship discipline"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Next Featured Tournament Title
                    </label>
                    <input
                      type="text"
                      value={editingFlagship.discipline.nextTournamentName || ""}
                      onChange={(e) =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            nextTournamentName: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                      placeholder="e.g. All-India Kaya Yuddha National Trophy 2026 (Pune)"
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: INTRODUCTION SECTION */}
              {flagshipModalTab === "intro" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                    <span className="font-black text-primary text-xs uppercase block">
                      Section 1: Introduction &amp; Heritage Philosophy
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Provides athletes and coaches with deep historical context, discipline philosophy, and core highlights.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Discipline Overview (विहंगावलोकन) *
                    </label>
                    <textarea
                      rows={3}
                      value={editingFlagship.discipline.introduction?.overview || ""}
                      onChange={(e) => {
                        const intro = editingFlagship.discipline.introduction || {
                          overview: "",
                          philosophy: "",
                          historicalRoots: "",
                          keyHighlights: [],
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            introduction: { ...intro, overview: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="Detailed introduction explaining this competitive martial discipline..."
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Martial Philosophy &amp; Core Spirit (तत्त्वज्ञान)
                    </label>
                    <textarea
                      rows={3}
                      value={editingFlagship.discipline.introduction?.philosophy || ""}
                      onChange={(e) => {
                        const intro = editingFlagship.discipline.introduction || {
                          overview: "",
                          philosophy: "",
                          historicalRoots: "",
                          keyHighlights: [],
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            introduction: { ...intro, philosophy: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="The guiding ethos, tactical discipline, mental fortitude, and respectful conduct..."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Historical Roots &amp; Evolution (ऐतिहासिक वारसा)
                    </label>
                    <textarea
                      rows={3}
                      value={editingFlagship.discipline.introduction?.historicalRoots || ""}
                      onChange={(e) => {
                        const intro = editingFlagship.discipline.introduction || {
                          overview: "",
                          philosophy: "",
                          historicalRoots: "",
                          keyHighlights: [],
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            introduction: { ...intro, historicalRoots: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="Traditional Indian close-quarters science transformed into modern standardized sport..."
                    />
                  </div>

                  {/* Dynamic Key Highlights List */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-primary" /> Key Discipline Highlights
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const intro = editingFlagship.discipline.introduction || {
                            overview: "",
                            philosophy: "",
                            historicalRoots: "",
                            keyHighlights: [],
                          };
                          const nextHighlights = [...(intro.keyHighlights || []), "New Key Feature / Rule Highlight"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              introduction: { ...intro, keyHighlights: nextHighlights },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Highlight
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.introduction?.keyHighlights || []).map((highlight, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-muted-foreground w-5 text-center shrink-0">
                            {hIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={highlight}
                            onChange={(e) => {
                              const intro = editingFlagship.discipline.introduction || {
                                overview: "",
                                philosophy: "",
                                historicalRoots: "",
                                keyHighlights: [],
                              };
                              const nextHighlights = [...(intro.keyHighlights || [])];
                              nextHighlights[hIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  introduction: { ...intro, keyHighlights: nextHighlights },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Standardized electronic and referee consensus scoring"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const intro = editingFlagship.discipline.introduction || {
                                overview: "",
                                philosophy: "",
                                historicalRoots: "",
                                keyHighlights: [],
                              };
                              const nextHighlights = [...(intro.keyHighlights || [])];
                              nextHighlights.splice(hIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  introduction: { ...intro, keyHighlights: nextHighlights },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RULES & FORMAT SECTION */}
              {flagshipModalTab === "rules" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">
                        Arena Dimensions &amp; Mat Layout
                      </label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.rules?.format || ""}
                        onChange={(e) => {
                          const r = editingFlagship.discipline.rules || {
                            format: "Standard rectangular mat (8m x 8m)",
                            rounds: "3 rounds of 2.0 mins (1 min rest)",
                            legalTargets: [],
                            prohibitedTechniques: [],
                            foulsAndPenalties: [],
                            judgingProtocol: "3 Corner Judges + 1 Center Referee. Majority decision scoring.",
                          };
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              rules: { ...r, format: e.target.value },
                            },
                          });
                        }}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Standard rectangular mat (8m x 8m)"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">
                        Match Rounds &amp; Timing
                      </label>
                      <input
                        type="text"
                        value={editingFlagship.discipline.rules?.rounds || ""}
                        onChange={(e) => {
                          const r = editingFlagship.discipline.rules || {
                            format: "Standard rectangular mat (8m x 8m)",
                            rounds: "3 rounds of 2.0 mins (1 min rest)",
                            legalTargets: [],
                            prohibitedTechniques: [],
                            foulsAndPenalties: [],
                            judgingProtocol: "3 Corner Judges + 1 Center Referee. Majority decision scoring.",
                          };
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              rules: { ...r, rounds: e.target.value },
                            },
                          });
                        }}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. 3 rounds of 2.0 mins (1 min rest)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Judging Protocol &amp; Officiating Panel
                    </label>
                    <input
                      type="text"
                      value={editingFlagship.discipline.rules?.judgingProtocol || ""}
                      onChange={(e) => {
                        const r = editingFlagship.discipline.rules || {
                          format: "Standard rectangular mat (8m x 8m)",
                          rounds: "3 rounds of 2.0 mins (1 min rest)",
                          legalTargets: [],
                          prohibitedTechniques: [],
                          foulsAndPenalties: [],
                          judgingProtocol: "3 Corner Judges + 1 Center Referee. Majority decision scoring.",
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            rules: { ...r, judgingProtocol: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                      placeholder="e.g. 3 Corner Judges + 1 Center Referee with electronic scoring consensus."
                    />
                  </div>

                  {/* LEGAL TARGET ZONES (GREEN) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-emerald-400" /> Authorized / Legal Target Zones (Green)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const r = editingFlagship.discipline.rules || {
                            format: "",
                            rounds: "",
                            legalTargets: [],
                            prohibitedTechniques: [],
                            foulsAndPenalties: [],
                            judgingProtocol: "",
                          };
                          const nextTargets = [...(r.legalTargets || []), "New Legal Target Zone"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              rules: { ...r, legalTargets: nextTargets },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Target Zone
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.rules?.legalTargets || []).map((target, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                          <input
                            type="text"
                            value={target}
                            onChange={(e) => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextTargets = [...(r.legalTargets || [])];
                              nextTargets[tIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, legalTargets: nextTargets },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Torso & padded chest protector zone"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextTargets = [...(r.legalTargets || [])];
                              nextTargets.splice(tIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, legalTargets: nextTargets },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROHIBITED TECHNIQUES & FOULS (RED) */}
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-destructive text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-destructive" /> Prohibited Techniques &amp; Fouls (Red)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const r = editingFlagship.discipline.rules || {
                            format: "",
                            rounds: "",
                            legalTargets: [],
                            prohibitedTechniques: [],
                            foulsAndPenalties: [],
                            judgingProtocol: "",
                          };
                          const nextFouls = [...(r.prohibitedTechniques || []), "New Prohibited Strike/Action"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              rules: { ...r, prohibitedTechniques: nextFouls },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Prohibited Technique
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.rules?.prohibitedTechniques || []).map((foul, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <X className="size-3.5 text-destructive shrink-0" />
                          <input
                            type="text"
                            value={foul}
                            onChange={(e) => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextFouls = [...(r.prohibitedTechniques || [])];
                              nextFouls[fIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, prohibitedTechniques: nextFouls },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Striking to throat, neck, or spine"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextFouls = [...(r.prohibitedTechniques || [])];
                              nextFouls.splice(fIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, prohibitedTechniques: nextFouls },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PENALTY ESCALATION TIERS */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="size-4 text-amber-400" /> Fouls &amp; Penalty Escalation Tiers
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const r = editingFlagship.discipline.rules || {
                            format: "",
                            rounds: "",
                            legalTargets: [],
                            prohibitedTechniques: [],
                            foulsAndPenalties: [],
                            judgingProtocol: "",
                          };
                          const nextTiers = [...(r.foulsAndPenalties || []), "Tier: Penalty Description"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              rules: { ...r, foulsAndPenalties: nextTiers },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Penalty Tier
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.rules?.foulsAndPenalties || []).map((tier, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-amber-400 w-5 text-center shrink-0 font-bold">
                            T{pIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={tier}
                            onChange={(e) => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextTiers = [...(r.foulsAndPenalties || [])];
                              nextTiers[pIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, foulsAndPenalties: nextTiers },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Tier 1: Official verbal caution"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const r = editingFlagship.discipline.rules || {
                                format: "",
                                rounds: "",
                                legalTargets: [],
                                prohibitedTechniques: [],
                                foulsAndPenalties: [],
                                judgingProtocol: "",
                              };
                              const nextTiers = [...(r.foulsAndPenalties || [])];
                              nextTiers.splice(pIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  rules: { ...r, foulsAndPenalties: nextTiers },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SCORING SYSTEM SECTION */}
              {flagshipModalTab === "scoring" && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Scoring System Summary &amp; Consensus Protocol
                    </label>
                    <textarea
                      rows={2}
                      value={editingFlagship.discipline.scoring?.system || ""}
                      onChange={(e) => {
                        const s = editingFlagship.discipline.scoring || {
                          system: "",
                          pointMatrix: [],
                          criteria: [],
                          winConditions: [],
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            scoring: { ...s, system: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="e.g. Electronic point scoring with majority judge consensus (minimum 2 of 3 judges)."
                    />
                  </div>

                  {/* POINT MATRIX TABLE BUILDER */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="size-4 text-primary" /> Official Point Matrix (गुणदान तक्ता)
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Defines techniques, point values, and technical criteria shown in the public scoring matrix.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const s = editingFlagship.discipline.scoring || {
                            system: "",
                            pointMatrix: [],
                            criteria: [],
                            winConditions: [],
                          };
                          const nextMatrix = [
                            ...(s.pointMatrix || []),
                            { action: "New Scoring Technique", points: "1 Point", description: "Clean contact to authorized zone." },
                          ];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              scoring: { ...s, pointMatrix: nextMatrix },
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Point Matrix Row
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border">
                            <th className="p-2.5 w-1/3">Technique / Action</th>
                            <th className="p-2.5 w-28">Points</th>
                            <th className="p-2.5">Technical Description</th>
                            <th className="p-2.5 w-10 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(editingFlagship.discipline.scoring?.pointMatrix || []).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-accent/30 transition-colors">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.action}
                                  onChange={(e) => {
                                    const s = editingFlagship.discipline.scoring || {
                                      system: "",
                                      pointMatrix: [],
                                      criteria: [],
                                      winConditions: [],
                                    };
                                    const nextMatrix = [...(s.pointMatrix || [])];
                                    nextMatrix[rIdx] = { ...nextMatrix[rIdx], action: e.target.value };
                                    setEditingFlagship({
                                      ...editingFlagship,
                                      discipline: {
                                        ...editingFlagship.discipline,
                                        scoring: { ...s, pointMatrix: nextMatrix },
                                      },
                                    });
                                  }}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs font-bold text-foreground"
                                  placeholder="e.g. Clean Single Strike"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.points}
                                  onChange={(e) => {
                                    const s = editingFlagship.discipline.scoring || {
                                      system: "",
                                      pointMatrix: [],
                                      criteria: [],
                                      winConditions: [],
                                    };
                                    const nextMatrix = [...(s.pointMatrix || [])];
                                    nextMatrix[rIdx] = { ...nextMatrix[rIdx], points: e.target.value };
                                    setEditingFlagship({
                                      ...editingFlagship,
                                      discipline: {
                                        ...editingFlagship.discipline,
                                        scoring: { ...s, pointMatrix: nextMatrix },
                                      },
                                    });
                                  }}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs font-black text-amber-400"
                                  placeholder="e.g. 2 Points"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={(e) => {
                                    const s = editingFlagship.discipline.scoring || {
                                      system: "",
                                      pointMatrix: [],
                                      criteria: [],
                                      winConditions: [],
                                    };
                                    const nextMatrix = [...(s.pointMatrix || [])];
                                    nextMatrix[rIdx] = { ...nextMatrix[rIdx], description: e.target.value };
                                    setEditingFlagship({
                                      ...editingFlagship,
                                      discipline: {
                                        ...editingFlagship.discipline,
                                        scoring: { ...s, pointMatrix: nextMatrix },
                                      },
                                    });
                                  }}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                                  placeholder="e.g. Direct strike to chest guard with full extension."
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const s = editingFlagship.discipline.scoring || {
                                      system: "",
                                      pointMatrix: [],
                                      criteria: [],
                                      winConditions: [],
                                    };
                                    const nextMatrix = [...(s.pointMatrix || [])];
                                    nextMatrix.splice(rIdx, 1);
                                    setEditingFlagship({
                                      ...editingFlagship,
                                      discipline: {
                                        ...editingFlagship.discipline,
                                        scoring: { ...s, pointMatrix: nextMatrix },
                                      },
                                    });
                                  }}
                                  className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer mx-auto"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CRITERIA & WIN CONDITIONS */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* VALID CRITERIA */}
                    <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-primary" /> Valid Scoring Criteria
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const s = editingFlagship.discipline.scoring || {
                              system: "",
                              pointMatrix: [],
                              criteria: [],
                              winConditions: [],
                            };
                            const nextCrit = [...(s.criteria || []), "Clean contact with proper form"];
                            setEditingFlagship({
                              ...editingFlagship,
                              discipline: {
                                ...editingFlagship.discipline,
                                scoring: { ...s, criteria: nextCrit },
                              },
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editingFlagship.discipline.scoring?.criteria || []).map((crit, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={crit}
                              onChange={(e) => {
                                const s = editingFlagship.discipline.scoring || {
                                  system: "",
                                  pointMatrix: [],
                                  criteria: [],
                                  winConditions: [],
                                };
                                const nextCrit = [...(s.criteria || [])];
                                nextCrit[cIdx] = e.target.value;
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    scoring: { ...s, criteria: nextCrit },
                                  },
                                });
                              }}
                              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const s = editingFlagship.discipline.scoring || {
                                  system: "",
                                  pointMatrix: [],
                                  criteria: [],
                                  winConditions: [],
                                };
                                const nextCrit = [...(s.criteria || [])];
                                nextCrit.splice(cIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    scoring: { ...s, criteria: nextCrit },
                                  },
                                });
                              }}
                              className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WIN CONDITIONS */}
                    <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="size-3.5 text-amber-400" /> Match Victory Conditions
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const s = editingFlagship.discipline.scoring || {
                              system: "",
                              pointMatrix: [],
                              criteria: [],
                              winConditions: [],
                            };
                            const nextWin = [...(s.winConditions || []), "Higher cumulative point score"];
                            setEditingFlagship({
                              ...editingFlagship,
                              discipline: {
                                ...editingFlagship.discipline,
                                scoring: { ...s, winConditions: nextWin },
                              },
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editingFlagship.discipline.scoring?.winConditions || []).map((win, wIdx) => (
                          <div key={wIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={win}
                              onChange={(e) => {
                                const s = editingFlagship.discipline.scoring || {
                                  system: "",
                                  pointMatrix: [],
                                  criteria: [],
                                  winConditions: [],
                                };
                                const nextWin = [...(s.winConditions || [])];
                                nextWin[wIdx] = e.target.value;
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    scoring: { ...s, winConditions: nextWin },
                                  },
                                });
                              }}
                              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const s = editingFlagship.discipline.scoring || {
                                  system: "",
                                  pointMatrix: [],
                                  criteria: [],
                                  winConditions: [],
                                };
                                const nextWin = [...(s.winConditions || [])];
                                nextWin.splice(wIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    scoring: { ...s, winConditions: nextWin },
                                  },
                                });
                              }}
                              className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DYNAMIC CATEGORY & WEIGHT MATRIX MANAGER */}
              {flagshipModalTab === "categories" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Mode Selector & Quick Restore Toolbar */}
                  <div className="p-4 rounded-2xl bg-background/80 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="size-4 text-primary" /> Category &amp; Weight Matrix Configuration
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Configure Age Divisions (U-8 to U-19) and independent weight brackets for Boys and Girls.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const isSantulana =
                            editingFlagship.discipline.slug === "santulana" ||
                            editingFlagship.discipline.hasWeightCategories === false;
                          if (isSantulana) {
                            setEditingFlagship({
                              ...editingFlagship,
                              discipline: {
                                ...editingFlagship.discipline,
                                hasWeightCategories: false,
                                evaluationCriteria: [
                                  "Speed (गती)",
                                  "Balance (संतुलन)",
                                  "Agility (चपळता)",
                                  "Coordination (समन्वय)",
                                  "Accuracy (अचूकता)",
                                  "Body Control (शरीर नियंत्रण)",
                                  "Reaction (प्रतिक्रिया वेग)",
                                  "Completion Time (वेळ नोंदी)",
                                ],
                                ageWeight: ["U-8", "U-10", "U-12", "U-14", "U-17", "U-19"].map((g) => ({
                                  group: g,
                                  ageLimit: `${g} Division (Boys & Girls)`,
                                  weightClassesMale: ["Open Agility Category (No Weight Restriction)"],
                                  weightClassesFemale: ["Open Agility Category (No Weight Restriction)"],
                                  matchDuration: "Single Course Run",
                                  active: true,
                                })),
                              },
                            });
                            toast.success("Santulana Agility criteria restored!");
                            return;
                          }

                          const officialKayaWeights: Record<string, string[]> = {
                            "U-8": ["Under 15 kg", "15–17 kg", "17–19 kg", "19–21 kg", "21–23 kg", "Above 23 kg"],
                            "U-10": ["Under 18 kg", "18–20 kg", "20–22 kg", "22–24 kg", "24–26 kg", "26–28 kg", "Above 28 kg"],
                            "U-12": ["Under 20 kg", "20–23 kg", "23–26 kg", "26–29 kg", "29–32 kg", "32–35 kg", "Above 35 kg"],
                            "U-14": ["Under 30 kg", "30–33 kg", "33–36 kg", "36–39 kg", "39–42 kg", "42–45 kg", "45–48 kg", "48–51 kg", "Above 51 kg"],
                            "U-17": ["Under 35 kg", "35–38 kg", "38–41 kg", "41–44 kg", "44–47 kg", "47–50 kg", "50–53 kg", "53–56 kg", "56–59 kg", "59–62 kg", "Above 62 kg"],
                            "U-19": [
                              "Under 40 kg",
                              "40–45 kg",
                              "45–50 kg",
                              "50–55 kg",
                              "55–60 kg",
                              "60–65 kg",
                              "65–70 kg",
                              "70–75 kg",
                              "75–80 kg",
                              "80–85 kg",
                              "85–90 kg",
                              "Above 90 kg",
                            ],
                            "Open Category": [
                              "Open Weight Category (No fixed weight limit - Final grouping/draw as per respective Championship/Event Regulations)",
                            ],
                          };

                          const officialCharanaWeights: Record<string, string[]> = {
                            "U-8": ["Under 15 kg", "15–18 kg", "18–21 kg", "21–24 kg", "Above 24 kg"],
                            "U-10": ["Under 18 kg", "18–21 kg", "21–24 kg", "24–27 kg", "27–30 kg", "Above 30 kg"],
                            "U-12": ["Under 20 kg", "20–23 kg", "23–26 kg", "26–29 kg", "29–32 kg", "32–36 kg", "Above 36 kg"],
                            "U-14": ["Under 30 kg", "30–34 kg", "34–38 kg", "38–42 kg", "42–46 kg", "46–50 kg", "50–55 kg", "Above 55 kg"],
                            "U-17": ["Under 35 kg", "35–40 kg", "40–45 kg", "45–50 kg", "50–55 kg", "55–60 kg", "60–65 kg", "Above 65 kg"],
                            "U-19": [
                              "Under 40 kg",
                              "40–45 kg",
                              "45–50 kg",
                              "50–55 kg",
                              "55–60 kg",
                              "60–65 kg",
                              "65–70 kg",
                              "70–75 kg",
                              "75–80 kg",
                              "80–85 kg",
                              "85–90 kg",
                              "Above 90 kg",
                            ],
                            "Open Category": [
                              "Open Weight Category (No fixed weight limit - Final grouping/draw as per respective Championship/Event Regulations)",
                            ],
                          };

                          const targetDict =
                            editingFlagship.discipline.slug === "charana-yuddha" ||
                            editingFlagship.discipline.slug === "sangama-kala"
                              ? officialCharanaWeights
                              : officialKayaWeights;

                          const officialGroups = [
                            "U-8",
                            "U-10",
                            "U-12",
                            "U-14",
                            "U-17",
                            "U-19",
                            "Open Category – All Ages",
                          ];

                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              hasWeightCategories: true,
                              categories: [
                                {
                                  division: "Sub-Junior (U-8, U-10, U-12)",
                                  description: "Novice & Foundational Youth Brackets",
                                  genders: "Boys & Girls (Separated)",
                                },
                                {
                                  division: "Cadet & Junior (U-14, U-17, U-19)",
                                  description: "Advanced National Championship Brackets",
                                  genders: "Boys & Girls (Separated)",
                                },
                                {
                                  division: "Open Category – All Ages",
                                  description: "Open Weight Championship Division (No Fixed Limit)",
                                  genders: "Men & Women (Separated)",
                                },
                              ],
                              ageWeight: officialGroups.map((g) => ({
                                group: g,
                                ageLimit:
                                  g === "Open Category – All Ages"
                                    ? "Open Category – All Ages (Senior & Open Competitors)"
                                    : `${g} Division (Boys & Girls)`,
                                weightClassesMale: targetDict[g] || targetDict["Open Category"] || [],
                                weightClassesFemale: targetDict[g] || targetDict["Open Category"] || [],
                                matchDuration:
                                  g === "Open Category – All Ages"
                                    ? "3 rounds x 2.5 mins"
                                    : g === "U-14" || g === "U-17" || g === "U-19"
                                    ? "3 rounds x 2.0 mins"
                                    : "3 rounds x 1.5 mins",
                                active: true,
                              })),
                            },
                          });
                          setActiveCategoryAgeGroup("U-8");
                          toast.success("Official federation category matrix restored!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="size-3.5" /> Auto-Fill Official Federation Matrix
                      </button>
                    </div>
                  </div>

                  {/* Weight Category Mode Switch */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80">
                    <label className="font-bold text-foreground text-xs">Event Category Format:</label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, hasWeightCategories: true },
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors",
                        editingFlagship.discipline.hasWeightCategories !== false
                          ? "bg-primary text-background font-black"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🥋 Weight Divisions (Combat &amp; Sparring)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, hasWeightCategories: false },
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors",
                        editingFlagship.discipline.hasWeightCategories === false
                          ? "bg-primary text-background font-black"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ⚖️ Agility / Time-Trial (Santulana - No Weight Category)
                    </button>
                  </div>

                  {/* IF SANTULANA: Evaluation Criteria Manager */}
                  {editingFlagship.discipline.hasWeightCategories === false && (
                    <div className="p-4 rounded-2xl bg-card border border-primary/30 space-y-3">
                      <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="size-4 text-amber-400" /> Evaluation &amp; Performance Criteria (No Weight Limit)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Santulana athletes are judged on these 8 performance agility metrics instead of weight classes.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(
                          editingFlagship.discipline.evaluationCriteria || [
                            "Speed (गती)",
                            "Balance (संतुलन)",
                            "Agility (चपळता)",
                            "Coordination (समन्वय)",
                            "Accuracy (अचूकता)",
                            "Body Control (शरीर नियंत्रण)",
                            "Reaction (प्रतिक्रिया वेग)",
                            "Completion Time (वेळ नोंदी)",
                          ]
                        ).map((crit, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border/80"
                          >
                            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                            <input
                              type="text"
                              value={crit}
                              onChange={(e) => {
                                const currentList = [
                                  ...(editingFlagship.discipline.evaluationCriteria || []),
                                ];
                                currentList[cIdx] = e.target.value;
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    evaluationCriteria: currentList,
                                  },
                                });
                              }}
                              className="w-full bg-transparent text-xs text-foreground outline-none font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = [
                                  ...(editingFlagship.discipline.evaluationCriteria || []),
                                ];
                                currentList.splice(cIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    evaluationCriteria: currentList,
                                  },
                                });
                              }}
                              className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentList = [
                            ...(editingFlagship.discipline.evaluationCriteria || []),
                          ];
                          currentList.push("New Performance Metric");
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              evaluationCriteria: currentList,
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="size-3" /> Add Evaluation Metric
                      </button>
                    </div>
                  )}

                  {/* AGE DIVISIONS TABS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(editingFlagship.discipline.ageWeight || []).map((ag, idx) => {
                          const isSelected =
                            activeCategoryAgeGroup === ag.group ||
                            (!activeCategoryAgeGroup && idx === 0);
                          const isActive = ag.active !== false;

                          return (
                            <button
                              key={ag.group || idx}
                              type="button"
                              onClick={() => setActiveCategoryAgeGroup(ag.group)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border",
                                isSelected
                                  ? "bg-primary text-background font-black shadow-sm scale-105 border-primary"
                                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground",
                                !isActive && "opacity-60 border-dashed border-amber-500/40"
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full inline-block",
                                  isActive ? "bg-emerald-400" : "bg-amber-400"
                                )}
                              />
                              <span>{ag.group}</span>
                              <span className="text-[10px] opacity-75 font-mono">
                                ({ag.weightClassesMale?.length || 0} wgts)
                              </span>
                              {!isActive && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-semibold">
                                  Off
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newGroupName = prompt(
                            "Enter new Age Division name (e.g. U-21 or Masters):",
                            "U-21"
                          );
                          if (!newGroupName) return;
                          const currentList = [...(editingFlagship.discipline.ageWeight || [])];
                          currentList.push({
                            group: newGroupName.trim(),
                            ageLimit: `${newGroupName.trim()} Division (Boys & Girls)`,
                            weightClassesMale: ["Under 45 kg", "45–50 kg", "Above 50 kg"],
                            weightClassesFemale: ["Under 40 kg", "40–45 kg", "Above 45 kg"],
                            matchDuration: "3 rounds x 2.0 mins",
                            active: true,
                          });
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, ageWeight: currentList },
                          });
                          setActiveCategoryAgeGroup(newGroupName.trim());
                        }}
                        className="px-3 py-1.5 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/10 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="size-3.5" /> Add Age Division
                      </button>
                    </div>

                    {/* ACTIVE AGE DIVISION EDITOR */}
                    {(() => {
                      const ageList = editingFlagship.discipline.ageWeight || [];
                      const targetIdx = ageList.findIndex((ag) => ag.group === activeCategoryAgeGroup);
                      const currentAge = targetIdx >= 0 ? ageList[targetIdx] : ageList[0];

                      if (!currentAge) {
                        return (
                          <div className="p-8 text-center text-muted-foreground bg-card/60 rounded-2xl">
                            No age divisions defined. Click &ldquo;Add Age Division&rdquo; or &ldquo;Auto-Fill Matrix&rdquo; above.
                          </div>
                        );
                      }

                      const isCurrentActive = currentAge.active !== false;

                      const updateCurrentAge = (partial: Partial<AgeWeightCategory>) => {
                        const nextList = [...ageList];
                        const idx = targetIdx >= 0 ? targetIdx : 0;
                        nextList[idx] = { ...nextList[idx], ...partial };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: { ...editingFlagship.discipline, ageWeight: nextList },
                        });
                      };

                      return (
                        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 space-y-4">
                          {/* Age Group Header Row */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
                            <div className="grid sm:grid-cols-3 gap-3 flex-1">
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                  Division Code / Name
                                </label>
                                <input
                                  type="text"
                                  value={currentAge.group}
                                  onChange={(e) => updateCurrentAge({ group: e.target.value })}
                                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                  Age Limit Description
                                </label>
                                <input
                                  type="text"
                                  value={currentAge.ageLimit}
                                  onChange={(e) => updateCurrentAge({ ageLimit: e.target.value })}
                                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                                  placeholder="e.g. Under 14 Years (Boys & Girls)"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                  Match Duration
                                </label>
                                <input
                                  type="text"
                                  value={currentAge.matchDuration || "3 rounds x 2.0 mins"}
                                  onChange={(e) => updateCurrentAge({ matchDuration: e.target.value })}
                                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                                  placeholder="e.g. 3 rounds x 2.0 mins"
                                />
                              </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 pt-1 lg:pt-4">
                              <button
                                type="button"
                                title={isCurrentActive ? "Click to Deactivate division" : "Click to Activate division"}
                                onClick={() => updateCurrentAge({ active: !isCurrentActive })}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border",
                                  isCurrentActive
                                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                                    : "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-2 rounded-full",
                                    isCurrentActive ? "bg-emerald-400" : "bg-amber-400"
                                  )}
                                />
                                <span>{isCurrentActive ? "Active (Visible)" : "Deactivated (Hidden)"}</span>
                              </button>

                              <button
                                type="button"
                                title="Delete Age Division"
                                onClick={() => {
                                  if (confirm(`Delete age division "${currentAge.group}"?`)) {
                                    const nextList = [...ageList];
                                    const idx = targetIdx >= 0 ? targetIdx : 0;
                                    nextList.splice(idx, 1);
                                    setEditingFlagship({
                                      ...editingFlagship,
                                      discipline: {
                                        ...editingFlagship.discipline,
                                        ageWeight: nextList,
                                      },
                                    });
                                    if (nextList.length > 0) {
                                      setActiveCategoryAgeGroup(nextList[0].group);
                                    }
                                  }
                                }}
                                className="size-8 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 grid place-items-center cursor-pointer shrink-0"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* BOYS & GIRLS WEIGHT BRACKETS */}
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* BOYS COLUMN */}
                            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-blue-400 text-xs uppercase flex items-center gap-1">
                                  👦 Boys Weight Categories ({currentAge.weightClassesMale?.length || 0})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextWeights = [
                                      ...(currentAge.weightClassesMale || []),
                                      "New Weight kg",
                                    ];
                                    updateCurrentAge({ weightClassesMale: nextWeights });
                                  }}
                                  className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Plus className="size-3" /> Add Weight
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {(currentAge.weightClassesMale || []).map((wt, wIdx) => (
                                  <div key={wIdx} className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-muted-foreground w-4">
                                      {wIdx + 1}.
                                    </span>
                                    <input
                                      type="text"
                                      value={wt}
                                      onChange={(e) => {
                                        const nextWeights = [...(currentAge.weightClassesMale || [])];
                                        nextWeights[wIdx] = e.target.value;
                                        updateCurrentAge({ weightClassesMale: nextWeights });
                                      }}
                                      className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground font-semibold"
                                      placeholder="e.g. 15–17 kg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextWeights = [...(currentAge.weightClassesMale || [])];
                                        nextWeights.splice(wIdx, 1);
                                        updateCurrentAge({ weightClassesMale: nextWeights });
                                      }}
                                      className="size-6 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer"
                                    >
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* GIRLS COLUMN */}
                            <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-pink-400 text-xs uppercase flex items-center gap-1">
                                  👧 Girls Weight Categories ({currentAge.weightClassesFemale?.length || 0})
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Copy all Boys weight ranges to Girls"
                                    onClick={() => {
                                      updateCurrentAge({
                                        weightClassesFemale: [...(currentAge.weightClassesMale || [])],
                                      });
                                      toast.success("Copied Boys weights to Girls!");
                                    }}
                                    className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 text-[10px] font-semibold cursor-pointer"
                                  >
                                    Copy Boys
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextWeights = [
                                        ...(currentAge.weightClassesFemale || []),
                                        "New Weight kg",
                                      ];
                                      updateCurrentAge({ weightClassesFemale: nextWeights });
                                    }}
                                    className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Plus className="size-3" /> Add Weight
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {(currentAge.weightClassesFemale || []).map((wt, wIdx) => (
                                  <div key={wIdx} className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-muted-foreground w-4">
                                      {wIdx + 1}.
                                    </span>
                                    <input
                                      type="text"
                                      value={wt}
                                      onChange={(e) => {
                                        const nextWeights = [...(currentAge.weightClassesFemale || [])];
                                        nextWeights[wIdx] = e.target.value;
                                        updateCurrentAge({ weightClassesFemale: nextWeights });
                                      }}
                                      className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground font-semibold"
                                      placeholder="e.g. 15–17 kg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextWeights = [...(currentAge.weightClassesFemale || [])];
                                        nextWeights.splice(wIdx, 1);
                                        updateCurrentAge({ weightClassesFemale: nextWeights });
                                      }}
                                      className="size-6 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer"
                                    >
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* BROAD DIVISION SUMMARIES */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary" /> Broad Division Overview Cards
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentCats = [
                            ...(editingFlagship.discipline.categories || []),
                            { division: "New Division (U-XX)", description: "Division Description", genders: "Boys & Girls (Separated)" },
                          ];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, categories: currentCats },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Division Card
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editingFlagship.discipline.categories || []).map((cat, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-xl bg-background border border-border flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <input
                            type="text"
                            value={cat.division}
                            onChange={(e) => {
                              const currentCats = [...(editingFlagship.discipline.categories || [])];
                              currentCats[cIdx] = { ...currentCats[cIdx], division: e.target.value };
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: { ...editingFlagship.discipline, categories: currentCats },
                              });
                            }}
                            className="w-full sm:w-1/3 bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-bold text-foreground"
                            placeholder="Division Title"
                          />
                          <input
                            type="text"
                            value={cat.description}
                            onChange={(e) => {
                              const currentCats = [...(editingFlagship.discipline.categories || [])];
                              currentCats[cIdx] = { ...currentCats[cIdx], description: e.target.value };
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: { ...editingFlagship.discipline, categories: currentCats },
                              });
                            }}
                            className="w-full sm:flex-1 bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                            placeholder="Division Subtitle / Age brackets"
                          />
                          <input
                            type="text"
                            value={cat.genders}
                            onChange={(e) => {
                              const currentCats = [...(editingFlagship.discipline.categories || [])];
                              currentCats[cIdx] = { ...currentCats[cIdx], genders: e.target.value };
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: { ...editingFlagship.discipline, categories: currentCats },
                              });
                            }}
                            className="w-full sm:w-44 bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-muted-foreground"
                            placeholder="Genders / Eligibility"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentCats = [...(editingFlagship.discipline.categories || [])];
                              currentCats.splice(cIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: { ...editingFlagship.discipline, categories: currentCats },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EQUIPMENT & GEAR SECTION */}
              {flagshipModalTab === "equipment" && (
                <div className="space-y-5 animate-fadeIn">
                  {/* MANDATORY GEAR (EMERALD) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-emerald-400" /> Mandatory Safety &amp; Protective Gear
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const eq = editingFlagship.discipline.equipment || {
                            mandatory: [],
                            optional: [],
                            prohibited: [],
                            uniformStandards: "",
                          };
                          const nextMandatory = [...(eq.mandatory || []), "Federation approved protective gear"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              equipment: { ...eq, mandatory: nextMandatory },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Mandatory Gear
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.equipment?.mandatory || []).map((gear, gIdx) => (
                        <div key={gIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                          <input
                            type="text"
                            value={gear}
                            onChange={(e) => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextMandatory = [...(eq.mandatory || [])];
                              nextMandatory[gIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, mandatory: nextMandatory },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Federation approved 10oz/12oz combat gloves"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextMandatory = [...(eq.mandatory || [])];
                              nextMandatory.splice(gIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, mandatory: nextMandatory },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OPTIONAL GEAR (BLUE) */}
                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Shirt className="size-4 text-blue-400" /> Optional Approved Accessories
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const eq = editingFlagship.discipline.equipment || {
                            mandatory: [],
                            optional: [],
                            prohibited: [],
                            uniformStandards: "",
                          };
                          const nextOptional = [...(eq.optional || []), "Optional approved accessory"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              equipment: { ...eq, optional: nextOptional },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Optional Gear
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.equipment?.optional || []).map((gear, gIdx) => (
                        <div key={gIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" />
                          <input
                            type="text"
                            value={gear}
                            onChange={(e) => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextOptional = [...(eq.optional || [])];
                              nextOptional[gIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, optional: nextOptional },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Elastic ankle supports"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextOptional = [...(eq.optional || [])];
                              nextOptional.splice(gIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, optional: nextOptional },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROHIBITED GEAR (RED) */}
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-destructive text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-destructive" /> Prohibited &amp; Banned Items
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const eq = editingFlagship.discipline.equipment || {
                            mandatory: [],
                            optional: [],
                            prohibited: [],
                            uniformStandards: "",
                          };
                          const nextProhibited = [...(eq.prohibited || []), "Prohibited item / metallic jewelry"];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              equipment: { ...eq, prohibited: nextProhibited },
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3" /> Add Prohibited Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingFlagship.discipline.equipment?.prohibited || []).map((gear, gIdx) => (
                        <div key={gIdx} className="flex items-center gap-2">
                          <X className="size-3.5 text-destructive shrink-0" />
                          <input
                            type="text"
                            value={gear}
                            onChange={(e) => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextProhibited = [...(eq.prohibited || [])];
                              nextProhibited[gIdx] = e.target.value;
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, prohibited: nextProhibited },
                                },
                              });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium"
                            placeholder="e.g. Metallic jewelry or hard plastic braces"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const eq = editingFlagship.discipline.equipment || {
                                mandatory: [],
                                optional: [],
                                prohibited: [],
                                uniformStandards: "",
                              };
                              const nextProhibited = [...(eq.prohibited || [])];
                              nextProhibited.splice(gIdx, 1);
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  equipment: { ...eq, prohibited: nextProhibited },
                                },
                              });
                            }}
                            className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* UNIFORM & APPAREL STANDARDS */}
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Uniform &amp; Apparel Standards (गणवेश नियम)
                    </label>
                    <textarea
                      rows={3}
                      value={editingFlagship.discipline.equipment?.uniformStandards || ""}
                      onChange={(e) => {
                        const eq = editingFlagship.discipline.equipment || {
                          mandatory: [],
                          optional: [],
                          prohibited: [],
                          uniformStandards: "",
                        };
                        setEditingFlagship({
                          ...editingFlagship,
                          discipline: {
                            ...editingFlagship.discipline,
                            equipment: { ...eq, uniformStandards: e.target.value },
                          },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="e.g. Official KALAWAR black & gold combat uniform sanctioned by the federation technical board."
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: PHOTOS & VIDEOS MEDIA SECTION */}
              {flagshipModalTab === "media" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* PHOTO GALLERY BUILDER */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="size-4 text-primary" /> Action Photo Gallery
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Upload high-resolution event action photos displayed on the public discipline gallery.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                          const nextPhotos = [
                            ...(med.photos || []),
                            {
                              src: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
                              title: "Championship Bout Action",
                              category: "Championship",
                            },
                          ];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              media: { ...med, photos: nextPhotos },
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Photo
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {(editingFlagship.discipline.media?.photos || []).map((photo, pIdx) => (
                        <div key={pIdx} className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-3 relative group">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs">Photo #{pIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                const nextPhotos = [...(med.photos || [])];
                                nextPhotos.splice(pIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    media: { ...med, photos: nextPhotos },
                                  },
                                });
                              }}
                              className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <ImageUploadField
                            label="Photo Image"
                            value={photo.src || ""}
                            onChange={(val: string) => {
                              const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                              const nextPhotos = [...(med.photos || [])];
                              nextPhotos[pIdx] = { ...nextPhotos[pIdx], src: val };
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  media: { ...med, photos: nextPhotos },
                                },
                              });
                            }}
                            folder="wsf_disciplines"
                            helperText="Action or podium capture"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Caption / Title
                              </label>
                              <input
                                type="text"
                                value={photo.title || ""}
                                onChange={(e) => {
                                  const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                  const nextPhotos = [...(med.photos || [])];
                                  nextPhotos[pIdx] = { ...nextPhotos[pIdx], title: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: {
                                      ...editingFlagship.discipline,
                                      media: { ...med, photos: nextPhotos },
                                    },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                                placeholder="e.g. Finals Bout Striking"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Category Tag
                              </label>
                              <input
                                type="text"
                                value={photo.category || "Championship"}
                                onChange={(e) => {
                                  const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                  const nextPhotos = [...(med.photos || [])];
                                  nextPhotos[pIdx] = { ...nextPhotos[pIdx], category: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: {
                                      ...editingFlagship.discipline,
                                      media: { ...med, photos: nextPhotos },
                                    },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                                placeholder="e.g. Championship / Junior"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VIDEO HIGHLIGHTS BUILDER */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Play className="size-4 text-amber-400" /> Video Highlights &amp; Showcases
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Feature match stream links, championship reels, and slow-motion technique breakdowns.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                          const nextVideos = [
                            ...(med.videos || []),
                            {
                              title: "Championship Bout Highlights",
                              duration: "04:15",
                              thumb: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80",
                              desc: "Top counter-strikes and technical highlights from the latest national games.",
                            },
                          ];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              media: { ...med, videos: nextVideos },
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Video Showcase
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(editingFlagship.discipline.media?.videos || []).map((video, vIdx) => (
                        <div key={vIdx} className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs">Video #{vIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                const nextVideos = [...(med.videos || [])];
                                nextVideos.splice(vIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    media: { ...med, videos: nextVideos },
                                  },
                                });
                              }}
                              className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Video Title
                              </label>
                              <input
                                type="text"
                                value={video.title || ""}
                                onChange={(e) => {
                                  const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                  const nextVideos = [...(med.videos || [])];
                                  nextVideos[vIdx] = { ...nextVideos[vIdx], title: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: {
                                      ...editingFlagship.discipline,
                                      media: { ...med, videos: nextVideos },
                                    },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-bold text-foreground"
                                placeholder="e.g. National Championship Final"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Duration (e.g. 04:15)
                              </label>
                              <input
                                type="text"
                                value={video.duration || ""}
                                onChange={(e) => {
                                  const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                  const nextVideos = [...(med.videos || [])];
                                  nextVideos[vIdx] = { ...nextVideos[vIdx], duration: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: {
                                      ...editingFlagship.discipline,
                                      media: { ...med, videos: nextVideos },
                                    },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                                placeholder="e.g. 04:15"
                              />
                            </div>
                          </div>

                          {/* Video Platform URL with Auto-Detection & Test Play */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Platform Video URL (YouTube, Vimeo, Drive, MP4, Reel, etc.)
                              </label>
                              {video.videoUrl && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                  {parseVideoSource(video.videoUrl).platformLabel}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={video.videoUrl || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                  const nextVideos = [...(med.videos || [])];
                                  const parsed = parseVideoSource(val);
                                  const autoThumb = !nextVideos[vIdx]?.thumb && parsed.thumbnailUrl ? parsed.thumbnailUrl : nextVideos[vIdx]?.thumb;
                                  nextVideos[vIdx] = { ...nextVideos[vIdx], videoUrl: val, thumb: autoThumb || "" };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: {
                                      ...editingFlagship.discipline,
                                      media: { ...med, videos: nextVideos },
                                    },
                                  });
                                }}
                                className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                                placeholder="e.g. https://www.youtube.com/watch?v=... or https://vimeo.com/... or MP4 link"
                              />
                              {video.videoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewVideo({
                                      title: video.title || "Video Preview",
                                      videoUrl: video.videoUrl || "",
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                >
                                  <Play className="size-3 fill-current" /> Test Play
                                </button>
                              )}
                            </div>
                          </div>

                          <ImageUploadField
                            label="Video Thumbnail Image (Auto-populated from YouTube if blank)"
                            value={video.thumb || ""}
                            onChange={(val: string) => {
                              const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                              const nextVideos = [...(med.videos || [])];
                              nextVideos[vIdx] = { ...nextVideos[vIdx], thumb: val };
                              setEditingFlagship({
                                ...editingFlagship,
                                discipline: {
                                  ...editingFlagship.discipline,
                                  media: { ...med, videos: nextVideos },
                                },
                              });
                            }}
                            folder="wsf_disciplines"
                            helperText="Thumbnail preview for video card"
                          />

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                              Short Description
                            </label>
                            <input
                              type="text"
                              value={video.desc || ""}
                              onChange={(e) => {
                                const med = editingFlagship.discipline.media || { photos: [], videos: [] };
                                const nextVideos = [...(med.videos || [])];
                                nextVideos[vIdx] = { ...nextVideos[vIdx], desc: e.target.value };
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: {
                                    ...editingFlagship.discipline,
                                    media: { ...med, videos: nextVideos },
                                  },
                                });
                              }}
                              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                              placeholder="e.g. Top counter-strikes and highlights from latest national games."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RESULTS & CHAMPIONS SECTION */}
              {flagshipModalTab === "results" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="size-4 text-primary" /> Championship Results &amp; Podium Placers
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Manage tournament seasons, champion athletes, state associations, and club medals.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentResults = [
                            ...(editingFlagship.discipline.results || []),
                            {
                              season: "2025–26",
                              championship: "All-India Federation National Trophy",
                              podium: [
                                { position: "Gold" as const, athlete: "Athlete Name", state: "State", academy: "Academy / Club" },
                                { position: "Silver" as const, athlete: "Athlete Name", state: "State", academy: "Academy / Club" },
                                { position: "Bronze" as const, athlete: "Athlete Name", state: "State", academy: "Academy / Club" },
                              ],
                            },
                          ];
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: { ...editingFlagship.discipline, results: currentResults },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Tournament Season
                      </button>
                    </div>

                    <div className="space-y-5">
                      {(editingFlagship.discipline.results || []).map((res, rIdx) => (
                        <div key={rIdx} className="p-4 rounded-2xl bg-background border border-border space-y-4">
                          <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <span className="font-bold text-foreground text-xs">Season Record #{rIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentResults = [...(editingFlagship.discipline.results || [])];
                                currentResults.splice(rIdx, 1);
                                setEditingFlagship({
                                  ...editingFlagship,
                                  discipline: { ...editingFlagship.discipline, results: currentResults },
                                });
                              }}
                              className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Season Year (e.g. 2025–26)
                              </label>
                              <input
                                type="text"
                                value={res.season || ""}
                                onChange={(e) => {
                                  const currentResults = [...(editingFlagship.discipline.results || [])];
                                  currentResults[rIdx] = { ...currentResults[rIdx], season: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: { ...editingFlagship.discipline, results: currentResults },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-bold text-foreground"
                                placeholder="e.g. 2025–26"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Championship Tournament Title
                              </label>
                              <input
                                type="text"
                                value={res.championship || ""}
                                onChange={(e) => {
                                  const currentResults = [...(editingFlagship.discipline.results || [])];
                                  currentResults[rIdx] = { ...currentResults[rIdx], championship: e.target.value };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: { ...editingFlagship.discipline, results: currentResults },
                                  });
                                }}
                                className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground"
                                placeholder="e.g. All-India Federation National Trophy"
                              />
                            </div>
                          </div>

                          {/* PODIUM PLACINGS TABLE */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Medal Winners &amp; Podium
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentResults = [...(editingFlagship.discipline.results || [])];
                                  const nextPodium = [
                                    ...(currentResults[rIdx].podium || []),
                                    { position: "Bronze" as const, athlete: "Athlete Name", state: "State", academy: "Academy / Club" },
                                  ];
                                  currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                  setEditingFlagship({
                                    ...editingFlagship,
                                    discipline: { ...editingFlagship.discipline, results: currentResults },
                                  });
                                }}
                                className="px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                <Plus className="size-3" /> Add Placer
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(res.podium || []).map((pod, pIdx) => (
                                <div key={pIdx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-card border border-border/80">
                                  <div className="col-span-3">
                                    <select
                                      value={pod.position}
                                      onChange={(e) => {
                                        const currentResults = [...(editingFlagship.discipline.results || [])];
                                        const nextPodium = [...(currentResults[rIdx].podium || [])];
                                        nextPodium[pIdx] = { ...nextPodium[pIdx], position: e.target.value as any };
                                        currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                        setEditingFlagship({
                                          ...editingFlagship,
                                          discipline: { ...editingFlagship.discipline, results: currentResults },
                                        });
                                      }}
                                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground"
                                    >
                                      <option value="Gold">🥇 Gold Medal</option>
                                      <option value="Silver">🥈 Silver Medal</option>
                                      <option value="Bronze">🥉 Bronze Medal</option>
                                    </select>
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      value={pod.athlete}
                                      onChange={(e) => {
                                        const currentResults = [...(editingFlagship.discipline.results || [])];
                                        const nextPodium = [...(currentResults[rIdx].podium || [])];
                                        nextPodium[pIdx] = { ...nextPodium[pIdx], athlete: e.target.value };
                                        currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                        setEditingFlagship({
                                          ...editingFlagship,
                                          discipline: { ...editingFlagship.discipline, results: currentResults },
                                        });
                                      }}
                                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground"
                                      placeholder="Athlete Name"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      value={pod.state}
                                      onChange={(e) => {
                                        const currentResults = [...(editingFlagship.discipline.results || [])];
                                        const nextPodium = [...(currentResults[rIdx].podium || [])];
                                        nextPodium[pIdx] = { ...nextPodium[pIdx], state: e.target.value };
                                        currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                        setEditingFlagship({
                                          ...editingFlagship,
                                          discipline: { ...editingFlagship.discipline, results: currentResults },
                                        });
                                      }}
                                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                                      placeholder="State / Region"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <input
                                      type="text"
                                      value={pod.academy}
                                      onChange={(e) => {
                                        const currentResults = [...(editingFlagship.discipline.results || [])];
                                        const nextPodium = [...(currentResults[rIdx].podium || [])];
                                        nextPodium[pIdx] = { ...nextPodium[pIdx], academy: e.target.value };
                                        currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                        setEditingFlagship({
                                          ...editingFlagship,
                                          discipline: { ...editingFlagship.discipline, results: currentResults },
                                        });
                                      }}
                                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground"
                                      placeholder="Academy / Club"
                                    />
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentResults = [...(editingFlagship.discipline.results || [])];
                                        const nextPodium = [...(currentResults[rIdx].podium || [])];
                                        nextPodium.splice(pIdx, 1);
                                        currentResults[rIdx] = { ...currentResults[rIdx], podium: nextPodium };
                                        setEditingFlagship({
                                          ...editingFlagship,
                                          discipline: { ...editingFlagship.discipline, results: currentResults },
                                        });
                                      }}
                                      className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer ml-auto"
                                    >
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: SANGAMA KALA SUB-DISCIPLINES */}
              {flagshipModalTab === "subdisciplines" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                    <span className="font-black text-amber-400 text-xs uppercase block">
                      Heritage Confluence: 3 Sanctioned Pillars
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Malla Yuddha (Grappling), Danda Yuddha (Staff Sparring), and Anukkama (Forms).
                    </p>
                  </div>

                  {(editingFlagship.discipline.sangamaKalaSubDisciplines || []).map((sub, sIdx) => (
                    <div
                      key={sub.id || sIdx}
                      className="p-4 rounded-2xl bg-card border border-border/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs">
                          {sub.name} ({sub.marathiName})
                        </span>
                        <span className="text-[10px] font-mono text-primary uppercase">{sub.id}</span>
                      </div>
                      <input
                        type="text"
                        value={sub.tagline || ""}
                        onChange={(e) => {
                          const currentSubs = [
                            ...(editingFlagship.discipline.sangamaKalaSubDisciplines || []),
                          ];
                          currentSubs[sIdx] = { ...currentSubs[sIdx], tagline: e.target.value };
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              sangamaKalaSubDisciplines: currentSubs,
                            },
                          });
                        }}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                        placeholder="Tagline..."
                      />
                      <textarea
                        rows={2}
                        value={sub.description || ""}
                        onChange={(e) => {
                          const currentSubs = [
                            ...(editingFlagship.discipline.sangamaKalaSubDisciplines || []),
                          ];
                          currentSubs[sIdx] = { ...currentSubs[sIdx], description: e.target.value };
                          setEditingFlagship({
                            ...editingFlagship,
                            discipline: {
                              ...editingFlagship.discipline,
                              sangamaKalaSubDisciplines: currentSubs,
                            },
                          });
                        }}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground"
                        placeholder="Description..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer */}
              <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFlagship(null)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-luxe px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="size-3.5" /> Save Flagship Discipline &amp; Categories
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT GENERAL EVENT (Calendar, Upcoming, My First)
          ========================================================================= */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                  {editingEvent.event.eventType === "calendar"
                    ? "COMPETITION CALENDAR EVENT"
                    : editingEvent.event.eventType === "championship"
                    ? "CHAMPIONSHIP FIXTURE"
                    : "TOURNAMENT FIXTURE"}
                </span>
                <h3 className="text-xl font-black text-gold-gradient">
                  {editingEvent.isNew
                    ? editingEvent.event.eventType === "championship"
                      ? "Create New Championship Fixture"
                      : "Create New Tournament Fixture"
                    : `Edit: ${editingEvent.event.title || "Tournament Fixture"}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sub-Tab Navigation Bar within Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs scrollbar-none">
              {[
                { key: "basic", label: "1. Basic & Venue", icon: CalendarDays },
                { key: "categories", label: "2. Categories", icon: Target },
                { key: "fees_dates", label: "3. Milestone Dates", icon: Clock },
                { key: "schedule_draw", label: "4. Schedule & Draws", icon: CalendarDays },
                { key: "academies", label: "5. Academies", icon: Building2 },
                { key: "rules_policies", label: "6. Rules & Policies", icon: FileCheck },
                { key: "media", label: "7. Photos & Videos", icon: Camera },
                { key: "results", label: "8. Results & Podiums", icon: Trophy },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = eventModalTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEventModalTab(tab.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer text-[11px]",
                      isActive
                        ? "bg-primary text-background shadow-gold"
                        : "bg-background/60 text-muted-foreground hover:text-foreground border border-border/80"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-6 text-xs">
              {/* TAB 1: BASIC INFO & VENUE */}
              {eventModalTab === "basic" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Championship Title *</label>
                      <input
                        type="text"
                        value={editingEvent.event.title || ""}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, title: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold"
                        placeholder="e.g. All-India Kaya Yuddha National Championship 2026"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="font-bold text-muted-foreground block text-xs">
                          Discipline / Martial Art *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsDisciplinesModalOpen(true)}
                          className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shrink-0"
                          title="Manage Disciplines"
                        >
                          ⚙️ Manage Disciplines
                        </button>
                      </div>
                      {customDisciplineMode ? (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Kalawar Kaya Yuddha, Karate, Kickboxing..."
                              value={editingEvent.event.discipline || ""}
                              autoFocus
                              className="h-10 rounded-xl text-xs font-semibold border border-primary/50 focus:border-primary bg-background px-3 text-foreground flex-1 outline-none"
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  event: { ...editingEvent.event, discipline: e.target.value },
                                })
                              }
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomDisciplineMode(false);
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    discipline: eventDisciplines[0] || "Kalawar Kaya Yuddha",
                                  },
                                });
                              }}
                              className="h-10 px-3 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                              title="Switch back to dropdown list"
                            >
                              <span>↩ Back to list</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-primary font-medium">
                            ✨ Typing custom discipline: Upon saving, this will automatically be added to the dropdown options.
                          </p>
                        </div>
                      ) : (
                        <select
                          value={editingEvent.event.discipline || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__other__") {
                              setCustomDisciplineMode(true);
                              setEditingEvent({
                                ...editingEvent,
                                event: { ...editingEvent.event, discipline: "" },
                              });
                              return;
                            }
                            setEditingEvent({
                              ...editingEvent,
                              event: { ...editingEvent.event, discipline: val },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                          required
                        >
                          <option value="" disabled>Select Martial Art Discipline...</option>
                          {editingEvent.event.discipline &&
                            !eventDisciplines.includes(editingEvent.event.discipline) && (
                              <option value={editingEvent.event.discipline}>
                                {editingEvent.event.discipline}
                              </option>
                            )}
                          {eventDisciplines.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                          <option value="__other__" className="bg-primary/20 text-primary font-bold">
                            ➕ Other (Specify Custom Discipline...)
                          </option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-5 gap-3">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">
                        Event ID {editingEvent.event.eventType === "championship" ? "(Championship ID)" : ""}
                      </label>
                      <input
                        type="text"
                        value={editingEvent.event.id || ""}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, id: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono font-bold text-primary"
                        placeholder="e.g. CHAMP-2026-01"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Event Status *</label>
                      <select
                        value={editingEvent.event.status || "Upcoming"}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, status: e.target.value as any },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-bold"
                      >
                        <option value="Upcoming">🔵 Upcoming Events</option>
                        <option value="Ongoing">🟢 OnGoing Live Event</option>
                        <option value="Completed">🏁 Completed Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Target Page Section</label>
                      <select
                        value={editingEvent.event.eventType || "upcoming"}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, eventType: e.target.value as any },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                      >
                        <option value="upcoming">Upcoming Events (/events/upcoming)</option>
                        <option value="championship">Championship (/events/championship)</option>
                        <option value="calendar">Competition Calendar (/events/calendar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Competition Month</label>
                      <select
                        value={editingEvent.event.month || "APR"}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, month: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-bold"
                      >
                        <option value="JAN">JAN (January)</option>
                        <option value="FEB">FEB (February)</option>
                        <option value="MAR">MAR (March)</option>
                        <option value="APR">APR (April)</option>
                        <option value="MAY">MAY (May)</option>
                        <option value="JUN">JUN (June)</option>
                        <option value="JUL">JUL (July)</option>
                        <option value="AUG">AUG (August)</option>
                        <option value="SEP">SEP (September)</option>
                        <option value="OCT">OCT (October)</option>
                        <option value="NOV">NOV (November)</option>
                        <option value="DEC">DEC (December)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Year</label>
                      <input
                        type="number"
                        value={editingEvent.event.year || 2026}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, year: parseInt(e.target.value) || 2026 },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="font-bold text-muted-foreground block text-xs">
                          Event Category / Competition Level *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCategoriesModalOpen(true)}
                          className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shrink-0"
                          title="Manage Categories"
                        >
                          ⚙️ Manage Categories
                        </button>
                      </div>
                      {customCategoryMode ? (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="e.g. National Championship, Zonal Cup, Selection Trials..."
                              value={editingEvent.event.category || editingEvent.event.tier || ""}
                              autoFocus
                              className="h-10 rounded-xl text-xs font-semibold border border-primary/50 focus:border-primary bg-background px-3 text-foreground flex-1 outline-none"
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    category: e.target.value,
                                    tier: e.target.value,
                                  },
                                })
                              }
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomCategoryMode(false);
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    category: eventCategories[0] || "National Championship",
                                    tier: eventCategories[0] || "National Championship",
                                  },
                                });
                              }}
                              className="h-10 px-3 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                              title="Switch back to dropdown list"
                            >
                              <span>↩ Back to list</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-primary font-medium">
                            ✨ Typing custom category: Upon saving, this will automatically be added to the dropdown options.
                          </p>
                        </div>
                      ) : (
                        <select
                          value={editingEvent.event.category || editingEvent.event.tier || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__other__") {
                              setCustomCategoryMode(true);
                              setEditingEvent({
                                ...editingEvent,
                                event: { ...editingEvent.event, category: "", tier: "" },
                              });
                              return;
                            }
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                category: val,
                                tier: val,
                              },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                          required
                        >
                          <option value="" disabled>Select Event Category...</option>
                          {(editingEvent.event.category || editingEvent.event.tier) &&
                            !eventCategories.includes(editingEvent.event.category || editingEvent.event.tier || "") && (
                              <option value={editingEvent.event.category || editingEvent.event.tier}>
                                {editingEvent.event.category || editingEvent.event.tier}
                              </option>
                            )}
                          {eventCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__other__" className="bg-primary/20 text-primary font-bold">
                            ➕ Other (Specify Custom Category...)
                          </option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Star Rating (1–5 ★)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={editingEvent.event.stars || 4}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, stars: parseInt(e.target.value) || 4 },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-amber-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <DatePickerField
                      label="Start Date"
                      value={editingEvent.event.startDate || ""}
                      onChange={(val) =>
                        setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, startDate: val },
                        })
                      }
                      required
                    />

                    <DatePickerField
                      label="End Date"
                      value={editingEvent.event.endDate || ""}
                      onChange={(val) =>
                        setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, endDate: val },
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">City / State *</label>
                      <input
                        type="text"
                        value={editingEvent.event.city || ""}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, city: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Pune, Maharashtra"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Venue / Stadium *</label>
                      <input
                        type="text"
                        value={editingEvent.event.venue || ""}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, venue: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                        placeholder="e.g. Shiv Chhatrapati Sports Complex, Balewadi"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Full Stadium Address</label>
                    <input
                      type="text"
                      value={editingEvent.event.address || ""}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, address: e.target.value },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                      placeholder="e.g. National Sports Complex, Hall C, Pune - 411045, Maharashtra, India"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Total Available Slots</label>
                      <input
                        type="number"
                        value={editingEvent.event.slots || 128}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, slots: parseInt(e.target.value) || 128 },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="font-bold text-muted-foreground block mb-2">Registration Status</label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              registrationLive: !editingEvent.event.registrationLive,
                            },
                          })
                        }
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold border transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer",
                          editingEvent.event.registrationLive
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-destructive/20 text-destructive border-destructive/40"
                        )}
                      >
                        {editingEvent.event.registrationLive ? "● LIVE (Open)" : "🔒 CLOSED"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <ImageUploadField
                      label="Top Big Hero Poster Photo"
                      value={editingEvent.event.image || ""}
                      onChange={(val: string) =>
                        setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, image: val },
                        })
                      }
                      folder="wsf_events"
                      helperText="High-definition landscape poster image displayed at the top of the event detail page"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Tournament Summary / Overview</label>
                    <textarea
                      rows={3}
                      value={editingEvent.event.summary || ""}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, summary: e.target.value },
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                      placeholder="Brief overview of the championship, sanctioning dojos, and prize pools..."
                    />
                  </div>

                  {/* Arena Google Maps Embed */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <span className="font-bold text-primary uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> Interactive Arena Google Map
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                          Custom Map Query / Address
                        </label>
                        <input
                          type="text"
                          value={editingEvent.event.mapLocation?.address || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                mapLocation: {
                                  ...editingEvent.event.mapLocation,
                                  address: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                          placeholder="e.g. Shiv Chhatrapati Sports Complex, Balewadi"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                          Custom Google Maps Embed URL
                        </label>
                        <input
                          type="text"
                          value={editingEvent.event.mapLocation?.embedUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                mapLocation: {
                                  ...editingEvent.event.mapLocation,
                                  embedUrl: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                          placeholder="https://maps.google.com/maps?q=...&output=embed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CATEGORIES & DIVISIONS MATRIX */}
              {eventModalTab === "categories" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                    <div>
                      <h4 className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="size-4" /> Championship Categories &amp; Division Matrix
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Define eligibility standards by Year of Birth, Age Division, Belt ranks, and weight limits.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, divisions: DEFAULT_CHAMPIONSHIP_DIVISIONS },
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs font-bold hover:border-primary cursor-pointer transition-colors"
                      >
                        ⚡ Load Standard WSF Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = [...(editingEvent.event.divisions || [])];
                          current.push({
                            birthYear: "2015 – 2017",
                            ageDivision: "Junior (Under 12)",
                            belts: "White, Yellow, Orange",
                            weightLimit: "-40.0 kg",
                          });
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, divisions: current },
                          });
                        }}
                        className="btn-luxe px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> Add Division
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-primary/10 text-primary font-black uppercase text-[10px] tracking-wider border-b border-border">
                        <tr>
                          <th className="p-3">Year Of Birth</th>
                          <th className="p-3">Age Division Name</th>
                          <th className="p-3">Eligible Belts / Ranks</th>
                          <th className="p-3">Weight Limit</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {(editingEvent.event.divisions && editingEvent.event.divisions.length > 0
                          ? editingEvent.event.divisions
                          : DEFAULT_CHAMPIONSHIP_DIVISIONS
                        ).map((row, idx) => (
                          <tr key={idx} className="hover:bg-primary/5 transition-colors">
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={row.birthYear}
                                onChange={(e) => {
                                  const current = [
                                    ...(editingEvent.event.divisions || DEFAULT_CHAMPIONSHIP_DIVISIONS),
                                  ];
                                  current[idx] = { ...current[idx], birthYear: e.target.value };
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, divisions: current },
                                  });
                                }}
                                className="w-28 bg-background border border-border rounded-lg px-2 py-1 font-mono text-xs text-primary font-bold"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={row.ageDivision}
                                onChange={(e) => {
                                  const current = [
                                    ...(editingEvent.event.divisions || DEFAULT_CHAMPIONSHIP_DIVISIONS),
                                  ];
                                  current[idx] = { ...current[idx], ageDivision: e.target.value };
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, divisions: current },
                                  });
                                }}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground font-semibold"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={row.belts}
                                onChange={(e) => {
                                  const current = [
                                    ...(editingEvent.event.divisions || DEFAULT_CHAMPIONSHIP_DIVISIONS),
                                  ];
                                  current[idx] = { ...current[idx], belts: e.target.value };
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, divisions: current },
                                  });
                                }}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-muted-foreground"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={row.weightLimit || "Open"}
                                onChange={(e) => {
                                  const current = [
                                    ...(editingEvent.event.divisions || DEFAULT_CHAMPIONSHIP_DIVISIONS),
                                  ];
                                  current[idx] = { ...current[idx], weightLimit: e.target.value };
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, divisions: current },
                                  });
                                }}
                                className="w-24 bg-background border border-border rounded-lg px-2 py-1 text-xs font-mono text-foreground"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = [
                                    ...(editingEvent.event.divisions || DEFAULT_CHAMPIONSHIP_DIVISIONS),
                                  ];
                                  current.splice(idx, 1);
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, divisions: current },
                                  });
                                }}
                                className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MILESTONE DEADLINES & DATES */}
              {eventModalTab === "fees_dates" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Milestone Dates */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <Clock className="size-4" /> 7 Official Milestone Deadlines
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Configure official timeline dates. Blank dates will be automatically computed from the tournament start date.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <DatePickerField
                        label="Early Bird Deadline Date"
                        value={editingEvent.event.prices?.earlyBirdDeadline || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              prices: { ...editingEvent.event.prices, earlyBirdDeadline: val },
                            },
                          })
                        }
                      />

                      <DatePickerField
                        label="Standard Registration Deadline"
                        value={editingEvent.event.prices?.standardDeadline || editingEvent.event.relevantDates?.registrationDeadline || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              prices: { ...editingEvent.event.prices, standardDeadline: val },
                              relevantDates: { ...editingEvent.event.relevantDates, registrationDeadline: val },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <DatePickerField
                        label="Affiliation Deadline"
                        value={editingEvent.event.relevantDates?.affiliationDeadline || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, affiliationDeadline: val },
                            },
                          })
                        }
                      />

                      <DatePickerField
                        label="Registration Checkday"
                        value={editingEvent.event.relevantDates?.registrationCheckday || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, registrationCheckday: val },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <DatePickerField
                        label="Athlete Correction Deadline"
                        value={editingEvent.event.relevantDates?.athleteCorrectionDeadline || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, athleteCorrectionDeadline: val },
                            },
                          })
                        }
                      />

                      <DatePickerField
                        label="Brackets Release Date"
                        value={editingEvent.event.relevantDates?.bracketsReleaseDate || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, bracketsReleaseDate: val },
                            },
                          })
                        }
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <DatePickerField
                        label="Schedule Release Date"
                        value={editingEvent.event.relevantDates?.scheduleReleaseDate || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, scheduleReleaseDate: val },
                            },
                          })
                        }
                      />

                      <DatePickerField
                        label="Professor / Master Correction Period"
                        value={editingEvent.event.relevantDates?.professorCorrectionPeriod || ""}
                        onChange={(val) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              relevantDates: { ...editingEvent.event.relevantDates, professorCorrectionPeriod: val },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEDULE & DRAW FIXTURES */}
              {eventModalTab === "schedule_draw" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <Clock className="size-4" /> Official Schedule &amp; Order of Bouts
                    </span>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          Schedule Document / PDF Link
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.schedule?.schedulePdfUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                schedule: { ...editingEvent.event.schedule, schedulePdfUrl: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://.../schedule.pdf or cloud link"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          Order of Bouts Sheet Link
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.schedule?.orderOfBoutsUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                schedule: { ...editingEvent.event.schedule, orderOfBoutsUrl: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://.../order-of-bouts or Google Sheet"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <Swords className="size-4" /> Brackets &amp; Draw Fixtures
                    </span>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          Brackets Draw Chart Link / PDF URL
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.drawFixtures?.bracketsPdfUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                drawFixtures: {
                                  ...editingEvent.event.drawFixtures,
                                  bracketsPdfUrl: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://.../tournament-brackets.pdf"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          External Interactive Draw URL
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.drawFixtures?.drawUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                drawFixtures: { ...editingEvent.event.drawFixtures, drawUrl: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://challonge.com/... or bracket portal"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Play className="size-4" /> Live Match Day Broadcasting (For Ongoing Events)
                    </span>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          Live Tatami Stream URL (YouTube Live / Twitch)
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.liveResults?.liveStreamUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                liveResults: {
                                  ...editingEvent.event.liveResults,
                                  liveStreamUrl: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">
                          Live Scoreboard / Results Link
                        </label>
                        <input
                          type="url"
                          value={editingEvent.event.drawFixtures?.liveScoreUrl || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                drawFixtures: {
                                  ...editingEvent.event.drawFixtures,
                                  liveScoreUrl: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                          placeholder="https://.../live-scoreboard"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PARTICIPATING ACADEMIES */}
              {eventModalTab === "academies" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                    <div>
                      <h4 className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="size-4" /> Participating Clubs &amp; Dojos
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        List the verified academies competing in this championship fixture.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              participatingAcademies: SAMPLE_CHAMPIONSHIP_ACADEMIES,
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs font-bold hover:border-primary cursor-pointer transition-colors"
                      >
                        ⚡ Autofill Sample Academies
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = [...(editingEvent.event.participatingAcademies || [])];
                          current.push({ name: "", city: "", athleteCount: 10 });
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, participatingAcademies: current },
                          });
                        }}
                        className="btn-luxe px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> Add Academy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(editingEvent.event.participatingAcademies || []).map((acad, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-card border border-border/80 flex items-center gap-3"
                      >
                        <span className="size-7 rounded-lg bg-primary/15 text-primary text-xs font-bold grid place-items-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="grid sm:grid-cols-3 gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="Academy / Dojo Name *"
                            value={acad.name}
                            onChange={(e) => {
                              const current = [...(editingEvent.event.participatingAcademies || [])];
                              current[idx] = { ...current[idx], name: e.target.value };
                              setEditingEvent({
                                ...editingEvent,
                                event: { ...editingEvent.event, participatingAcademies: current },
                              });
                            }}
                            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-semibold"
                          />

                          <input
                            type="text"
                            placeholder="City, State"
                            value={acad.city || ""}
                            onChange={(e) => {
                              const current = [...(editingEvent.event.participatingAcademies || [])];
                              current[idx] = { ...current[idx], city: e.target.value };
                              setEditingEvent({
                                ...editingEvent,
                                event: { ...editingEvent.event, participatingAcademies: current },
                              });
                            }}
                            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground"
                          />

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Athlete Count"
                              value={acad.athleteCount || 0}
                              onChange={(e) => {
                                const current = [...(editingEvent.event.participatingAcademies || [])];
                                current[idx] = { ...current[idx], athleteCount: parseInt(e.target.value) || 0 };
                                setEditingEvent({
                                  ...editingEvent,
                                  event: { ...editingEvent.event, participatingAcademies: current },
                                });
                              }}
                              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-bold w-24"
                            />
                            <span className="text-[11px] text-muted-foreground">Athletes</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const current = [...(editingEvent.event.participatingAcademies || [])];
                            current.splice(idx, 1);
                            setEditingEvent({
                              ...editingEvent,
                              event: { ...editingEvent.event, participatingAcademies: current },
                            });
                          }}
                          className="size-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 grid place-items-center cursor-pointer shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}

                    {(!editingEvent.event.participatingAcademies ||
                      editingEvent.event.participatingAcademies.length === 0) && (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
                        No participating academies added yet. Click &quot;Add Academy&quot; or &quot;Autofill Sample Academies&quot; above.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: RULES, POLICIES & ORGANIZER */}
              {eventModalTab === "rules_policies" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Official Organization */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <Building2 className="size-4" /> Official Organization &amp; Sanctioning
                    </span>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Host Organizer</label>
                        <input
                          type="text"
                          value={editingEvent.event.organization?.organizer || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                organization: {
                                  ...editingEvent.event.organization,
                                  organizer: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                          placeholder="e.g. KALAWAR Sports & Martial Arts Federation of India"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Sanctioning Body</label>
                        <input
                          type="text"
                          value={editingEvent.event.organization?.sanctioningBody || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                organization: {
                                  ...editingEvent.event.organization,
                                  sanctioningBody: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                          placeholder="e.g. World Sports Federation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <FileCheck className="size-4" /> Tournament Guidelines &amp; Policies
                    </span>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Competition Day &amp; Weigh-In Protocol</label>
                        <textarea
                          rows={2}
                          value={editingEvent.event.importantInfo?.competitionDayWeighIn || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                importantInfo: {
                                  ...editingEvent.event.importantInfo,
                                  competitionDayWeighIn: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                          placeholder="Bullpen check-in 1 hour prior, official single attempt weigh-in..."
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">48-Hour Refund Policy</label>
                        <textarea
                          rows={2}
                          value={editingEvent.event.importantInfo?.refundPolicy || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                importantInfo: {
                                  ...editingEvent.event.importantInfo,
                                  refundPolicy: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                          placeholder="Refund window, single-athlete bracket refund terms..."
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Registration &amp; Capacity Policy</label>
                        <textarea
                          rows={2}
                          value={editingEvent.event.importantInfo?.registrationPolicy || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                importantInfo: {
                                  ...editingEvent.event.importantInfo,
                                  registrationPolicy: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                          placeholder="Capacity limits, registration closure terms..."
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Open Class (Absolute Division) Rules</label>
                        <textarea
                          rows={2}
                          value={editingEvent.event.openClass?.description || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                openClass: { available: true, description: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                          placeholder="Absolute division eligibility for medalists..."
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Hotel Accommodations Notice</label>
                        <textarea
                          rows={2}
                          value={editingEvent.event.topNotice?.hotelInfo || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                topNotice: {
                                  ...editingEvent.event.topNotice,
                                  hotelInfo: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                          placeholder="Special negotiated rates at partner hotels..."
                        />
                      </div>

                      <div>
                        <label className="font-bold text-muted-foreground block mb-1">Complimentary T-Shirt Information</label>
                        <input
                          type="text"
                          value={editingEvent.event.tshirtInfo?.description || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                tshirtInfo: { description: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                          placeholder="All registered athletes receive a dry-fit official championship t-shirt..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PHOTOS & UNIVERSAL VIDEOS */}
              {eventModalTab === "media" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section 1: Photos */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-primary uppercase text-xs tracking-wider flex items-center gap-1.5">
                          <Camera className="size-4" /> Official Action Photo Gallery
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Upload high-resolution action photos from the championship arena.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const med = editingEvent.event.media || { photos: [], videos: [] };
                          const nextPhotos = [
                            ...(med.photos || []),
                            {
                              src: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
                              title: "Championship Bout",
                              category: "Action",
                            },
                          ];
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              media: { ...med, photos: nextPhotos },
                            },
                          });
                        }}
                        className="btn-luxe px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> Add Photo
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {(editingEvent.event.media?.photos || []).map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-2xl bg-background border border-border/80 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs">Photo #{pIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextPhotos = [...(med.photos || [])];
                                nextPhotos.splice(pIdx, 1);
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    media: { ...med, photos: nextPhotos },
                                  },
                                });
                              }}
                              className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <ImageUploadField
                            label="Photo Image"
                            value={photo.src}
                            onChange={(val) => {
                              const med = editingEvent.event.media || { photos: [], videos: [] };
                              const nextPhotos = [...(med.photos || [])];
                              nextPhotos[pIdx] = { ...nextPhotos[pIdx], src: val };
                              setEditingEvent({
                                ...editingEvent,
                                event: {
                                  ...editingEvent.event,
                                  media: { ...med, photos: nextPhotos },
                                },
                              });
                            }}
                            folder="wsf_championship_photos"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Title"
                              value={photo.title}
                              onChange={(e) => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextPhotos = [...(med.photos || [])];
                                nextPhotos[pIdx] = { ...nextPhotos[pIdx], title: e.target.value };
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    media: { ...med, photos: nextPhotos },
                                  },
                                });
                              }}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                            />
                            <input
                              type="text"
                              placeholder="Category (e.g. Finals)"
                              value={photo.category || ""}
                              onChange={(e) => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextPhotos = [...(med.photos || [])];
                                nextPhotos[pIdx] = { ...nextPhotos[pIdx], category: e.target.value };
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    media: { ...med, photos: nextPhotos },
                                  },
                                });
                              }}
                              className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Videos with Universal Player */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-primary uppercase text-xs tracking-wider flex items-center gap-1.5">
                          <Play className="size-4" /> Universal Video Showcase &amp; Match Highlights
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Support YouTube, Vimeo, Instagram Reels, Facebook, Google Drive, or direct MP4 video files.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const med = editingEvent.event.media || { photos: [], videos: [] };
                          const nextVideos = [
                            ...(med.videos || []),
                            {
                              title: "Championship Bout Highlights",
                              duration: "04:15",
                              thumb: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80",
                              videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                              desc: "Highlights and victory ceremony.",
                            },
                          ];
                          setEditingEvent({
                            ...editingEvent,
                            event: {
                              ...editingEvent.event,
                              media: { ...med, videos: nextVideos },
                            },
                          });
                        }}
                        className="btn-luxe px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> Add Video Showcase
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editingEvent.event.media?.videos || []).map((vid, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs">Video #{vIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextVideos = [...(med.videos || [])];
                                nextVideos.splice(vIdx, 1);
                                setEditingEvent({
                                  ...editingEvent,
                                  event: {
                                    ...editingEvent.event,
                                    media: { ...med, videos: nextVideos },
                                  },
                                });
                              }}
                              className="size-6 rounded text-destructive hover:bg-destructive/15 grid place-items-center cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Video Title"
                              value={vid.title}
                              onChange={(e) => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextVideos = [...(med.videos || [])];
                                nextVideos[vIdx] = { ...nextVideos[vIdx], title: e.target.value };
                                setEditingEvent({
                                  ...editingEvent,
                                  event: { ...editingEvent.event, media: { ...med, videos: nextVideos } },
                                });
                              }}
                              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-semibold"
                            />
                            <input
                              type="text"
                              placeholder="Duration (e.g. 05:20)"
                              value={vid.duration || ""}
                              onChange={(e) => {
                                const med = editingEvent.event.media || { photos: [], videos: [] };
                                const nextVideos = [...(med.videos || [])];
                                nextVideos[vIdx] = { ...nextVideos[vIdx], duration: e.target.value };
                                setEditingEvent({
                                  ...editingEvent,
                                  event: { ...editingEvent.event, media: { ...med, videos: nextVideos } },
                                });
                              }}
                              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Platform Video URL
                              </label>
                              {vid.videoUrl && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                  {parseVideoSource(vid.videoUrl).platformLabel}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={vid.videoUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const med = editingEvent.event.media || { photos: [], videos: [] };
                                  const nextVideos = [...(med.videos || [])];
                                  const parsed = parseVideoSource(val);
                                  const autoThumb = !nextVideos[vIdx]?.thumb && parsed.thumbnailUrl ? parsed.thumbnailUrl : nextVideos[vIdx]?.thumb;
                                  nextVideos[vIdx] = { ...nextVideos[vIdx], videoUrl: val, thumb: autoThumb || "" };
                                  setEditingEvent({
                                    ...editingEvent,
                                    event: { ...editingEvent.event, media: { ...med, videos: nextVideos } },
                                  });
                                }}
                                className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                                placeholder="https://www.youtube.com/watch?v=... or Vimeo, Instagram Reel, MP4"
                              />
                              {vid.videoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewVideo({
                                      title: vid.title || "Video Preview",
                                      videoUrl: vid.videoUrl,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                >
                                  <Play className="size-3 fill-current" /> Test Play
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: RESULTS & PODIUMS */}
              {eventModalTab === "results" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Results Archive Link */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                      <Trophy className="size-4" /> Link to Championship Results Archive
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Connect this tournament fixture to a published Championship Archive for full team standings and category medals.
                    </p>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Results Archive ID</label>
                      <input
                        type="text"
                        value={editingEvent.event.resultsArchiveId || ""}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, resultsArchiveId: e.target.value },
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono"
                        placeholder="e.g. kaya-yuddha-2026 or western-india-debut-cup-2026"
                      />
                    </div>
                  </div>

                  {/* Quick Top Podiums */}
                  <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                    <span className="text-xs font-bold text-gold-gradient uppercase tracking-wider block">
                      Quick Top Podium Champions
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                        <span className="font-black text-amber-400 text-[10px] block">🥇 GOLD CHAMPION</span>
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={editingEvent.event.liveResults?.topPodium?.gold || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                liveResults: {
                                  ...editingEvent.event.liveResults,
                                  topPodium: {
                                    ...editingEvent.event.liveResults?.topPodium,
                                    gold: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground font-bold"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/30 space-y-1.5">
                        <span className="font-black text-slate-300 text-[10px] block">🥈 SILVER MEDALIST</span>
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={editingEvent.event.liveResults?.topPodium?.silver || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                liveResults: {
                                  ...editingEvent.event.liveResults,
                                  topPodium: {
                                    ...editingEvent.event.liveResults?.topPodium,
                                    silver: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground font-bold"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-amber-800/10 border border-amber-800/30 space-y-1.5">
                        <span className="font-black text-amber-600 text-[10px] block">🥉 BRONZE MEDALIST</span>
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={editingEvent.event.liveResults?.topPodium?.bronze || ""}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              event: {
                                ...editingEvent.event,
                                liveResults: {
                                  ...editingEvent.event.liveResults,
                                  topPodium: {
                                    ...editingEvent.event.liveResults?.topPodium,
                                    bronze: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Editing Section:</span>
                  <span className="text-xs font-black text-primary capitalize">{eventModalTab}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-luxe px-6 py-2 text-xs font-bold inline-flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save Tournament
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT RESULTS ARCHIVE
          ========================================================================= */}
      {editingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-black text-gold-gradient">
                {editingArchive.isNew ? "Create Results Archive" : "Edit Results Archive"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingArchive(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArchive} className="space-y-4 text-xs">
              {/* Title & Year */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-muted-foreground block mb-1">Championship Title *</label>
                  <input
                    type="text"
                    value={editingArchive.archive.title || ""}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      const oldSlug = editingArchive.archive.slug || "";
                      const oldDerivedSlug = slugifyTitle(editingArchive.archive.title || "");
                      const shouldAutoUpdate = !oldSlug || oldSlug === oldDerivedSlug || oldSlug === "national-championship";

                      setEditingArchive({
                        ...editingArchive,
                        archive: {
                          ...editingArchive.archive,
                          title: newTitle,
                          ...(shouldAutoUpdate ? { slug: slugifyTitle(newTitle) } : {}),
                        },
                      });
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold"
                    placeholder="e.g. KALAWAR National Winter Selection Trials 2026"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Year / Season *</label>
                  <input
                    type="number"
                    value={editingArchive.archive.year || 2026}
                    onChange={(e) =>
                      setEditingArchive({
                        ...editingArchive,
                        archive: { ...editingArchive.archive, year: parseInt(e.target.value) || 2026 },
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Championship Series Slug */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="font-bold text-muted-foreground block text-xs">
                    Championship Series Slug *
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Group annual editions
                  </span>
                </div>
                <input
                  type="text"
                  value={editingArchive.archive.slug || ""}
                  onChange={(e) =>
                    setEditingArchive({
                      ...editingArchive,
                      archive: {
                        ...editingArchive.archive,
                        slug: slugifyTitle(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-mono text-xs"
                  placeholder="e.g. winter-selection-trials"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 Annual editions with the same Series Slug group together under one card on the Public Results page.
                </p>
              </div>

              {/* Category & Discipline */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="font-bold text-muted-foreground block text-xs">
                      Tier / Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shrink-0"
                      title="Manage Categories"
                    >
                      ⚙️ Manage Categories
                    </button>
                  </div>
                  {customArchiveCategoryMode ? (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. National Championship, Grand Prix, Selection Trials..."
                          value={editingArchive.archive.category || ""}
                          autoFocus
                          className="h-10 rounded-xl text-xs font-semibold border border-primary/50 focus:border-primary bg-background px-3 text-foreground flex-1 outline-none"
                          onChange={(e) =>
                            setEditingArchive({
                              ...editingArchive,
                              archive: { ...editingArchive.archive, category: e.target.value },
                            })
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomArchiveCategoryMode(false);
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                category: eventCategories[0] || "National Championship",
                              },
                            });
                          }}
                          className="h-10 px-3 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                          title="Switch back to dropdown list"
                        >
                          <span>↩ Back to list</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-primary font-medium">
                        ✨ Typing custom category: Upon saving, this will automatically be added to dropdown options.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={editingArchive.archive.category || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__other__") {
                          setCustomArchiveCategoryMode(true);
                          setEditingArchive({
                            ...editingArchive,
                            archive: { ...editingArchive.archive, category: "" },
                          });
                          return;
                        }
                        setEditingArchive({
                          ...editingArchive,
                          archive: { ...editingArchive.archive, category: val },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                      required
                    >
                      <option value="" disabled>Select Category...</option>
                      {editingArchive.archive.category &&
                        !eventCategories.includes(editingArchive.archive.category) && (
                          <option value={editingArchive.archive.category}>
                            {editingArchive.archive.category}
                          </option>
                        )}
                      {eventCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__other__" className="bg-primary/20 text-primary font-bold">
                        ➕ Other (Specify Custom Category...)
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="font-bold text-muted-foreground block text-xs">
                      Discipline / Martial Art *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDisciplinesModalOpen(true)}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shrink-0"
                      title="Manage Disciplines"
                    >
                      ⚙️ Manage Disciplines
                    </button>
                  </div>
                  {customArchiveDisciplineMode ? (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Kalawar Kaya Yuddha, Karate, Kickboxing..."
                          value={editingArchive.archive.discipline || ""}
                          autoFocus
                          className="h-10 rounded-xl text-xs font-semibold border border-primary/50 focus:border-primary bg-background px-3 text-foreground flex-1 outline-none"
                          onChange={(e) =>
                            setEditingArchive({
                              ...editingArchive,
                              archive: { ...editingArchive.archive, discipline: e.target.value },
                            })
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomArchiveDisciplineMode(false);
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                discipline: eventDisciplines[0] || "Kalawar Kaya Yuddha",
                              },
                            });
                          }}
                          className="h-10 px-3 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                          title="Switch back to dropdown list"
                        >
                          <span>↩ Back to list</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-primary font-medium">
                        ✨ Typing custom discipline: Upon saving, this will automatically be added to dropdown options.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={editingArchive.archive.discipline || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__other__") {
                          setCustomArchiveDisciplineMode(true);
                          setEditingArchive({
                            ...editingArchive,
                            archive: { ...editingArchive.archive, discipline: "" },
                          });
                          return;
                        }
                        setEditingArchive({
                          ...editingArchive,
                          archive: { ...editingArchive.archive, discipline: val },
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                      required
                    >
                      <option value="" disabled>Select Martial Art Discipline...</option>
                      {editingArchive.archive.discipline &&
                        !eventDisciplines.includes(editingArchive.archive.discipline) && (
                          <option value={editingArchive.archive.discipline}>
                            {editingArchive.archive.discipline}
                          </option>
                        )}
                      {eventDisciplines.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="__other__" className="bg-primary/20 text-primary font-bold">
                        ➕ Other (Specify Custom Discipline...)
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <DatePickerField
                    label="Dates"
                    value={editingArchive.archive.date || ""}
                    onChange={(val: string) =>
                      setEditingArchive({
                        ...editingArchive,
                        archive: { ...editingArchive.archive, date: val },
                      })
                    }
                    placeholder="e.g. 2026-04-12 or April 12th – 14th, 2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Venue</label>
                  <input
                    type="text"
                    value={editingArchive.archive.venue || ""}
                    onChange={(e) =>
                      setEditingArchive({
                        ...editingArchive,
                        archive: { ...editingArchive.archive, venue: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  />
                </div>

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">City</label>
                  <input
                    type="text"
                    value={editingArchive.archive.city || ""}
                    onChange={(e) =>
                      setEditingArchive({
                        ...editingArchive,
                        archive: { ...editingArchive.archive, city: e.target.value },
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Championship Cover / Action Photo"
                  value={editingArchive.archive.heroImage || ""}
                  onChange={(val: string) =>
                    setEditingArchive({
                      ...editingArchive,
                      archive: { ...editingArchive.archive, heroImage: val },
                    })
                  }
                  folder="wsf_results"
                  helperText="Upload a tournament cover image or paste direct image URL"
                />
              </div>

              {/* Spotlight Podium Inputs */}
              <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-3">
                <h4 className="font-black text-primary text-xs uppercase tracking-wider">
                  🏆 Top Podium Spotlight Winners
                </h4>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <span className="font-bold text-amber-400 text-[10px] block">🥇 GOLD MEDAL</span>
                    <input
                      type="text"
                      placeholder="Athlete Name"
                      value={editingArchive.archive.topPodium?.gold?.athlete || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              silver: editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" },
                              bronze: editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" },
                              gold: {
                                ...(editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" }),
                                athlete: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Academy / Club"
                      value={editingArchive.archive.topPodium?.gold?.academy || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              silver: editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" },
                              bronze: editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" },
                              gold: {
                                ...(editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" }),
                                academy: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/30 space-y-1.5">
                    <span className="font-bold text-slate-300 text-[10px] block">🥈 SILVER MEDAL</span>
                    <input
                      type="text"
                      placeholder="Athlete Name"
                      value={editingArchive.archive.topPodium?.silver?.athlete || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              gold: editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" },
                              bronze: editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" },
                              silver: {
                                ...(editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" }),
                                athlete: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Academy / Club"
                      value={editingArchive.archive.topPodium?.silver?.academy || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              gold: editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" },
                              bronze: editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" },
                              silver: {
                                ...(editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" }),
                                academy: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-800/10 border border-amber-800/30 space-y-1.5">
                    <span className="font-bold text-amber-600 text-[10px] block">🥉 BRONZE MEDAL</span>
                    <input
                      type="text"
                      placeholder="Athlete Name"
                      value={editingArchive.archive.topPodium?.bronze?.athlete || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              gold: editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" },
                              silver: editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" },
                              bronze: {
                                ...(editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" }),
                                athlete: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Academy / Club"
                      value={editingArchive.archive.topPodium?.bronze?.academy || ""}
                      onChange={(e) =>
                        setEditingArchive({
                          ...editingArchive,
                          archive: {
                            ...editingArchive.archive,
                            topPodium: {
                              ...editingArchive.archive.topPodium,
                              division: editingArchive.archive.topPodium?.division || "National Open Champions",
                              gold: editingArchive.archive.topPodium?.gold || { athlete: "", academy: "", state: "" },
                              silver: editingArchive.archive.topPodium?.silver || { athlete: "", academy: "", state: "" },
                              bronze: {
                                ...(editingArchive.archive.topPodium?.bronze || { athlete: "", academy: "", state: "" }),
                                academy: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1. Results of Academies (Dojo Team Standings) */}
              <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="size-4 text-primary" /> Results of Academies (Dojo Team Standings)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Manage academy rankings and points for Adult Male, Adult Female, and Juvenile / Sub-Junior dojos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const sampleDojos = [
                        { rank: 1, name: "Balewadi High Performance Academy", points: 102, state: "Maharashtra" },
                        { rank: 2, name: "Sher-e-Punjab Combat Club", points: 66, state: "Punjab" },
                        { rank: 3, name: "Deccan Martial Arts Guild", points: 55, state: "Maharashtra" },
                        { rank: 4, name: "Bengaluru Combat Arena", points: 54, state: "Karnataka" },
                        { rank: 5, name: "Delhi Strikers Federation Club", points: 33, state: "Delhi" },
                      ];
                      setEditingArchive({
                        ...editingArchive,
                        archive: {
                          ...editingArchive.archive,
                          academiesResults: {
                            adultMale: (editingArchive.archive.academiesResults?.adultMale?.length || 0) > 0 ? editingArchive.archive.academiesResults!.adultMale : sampleDojos,
                            adultFemale: (editingArchive.archive.academiesResults?.adultFemale?.length || 0) > 0 ? editingArchive.archive.academiesResults!.adultFemale : sampleDojos.map((d, i) => ({ ...d, rank: i + 1, points: Math.max(10, d.points - 20) })),
                            juvenile: (editingArchive.archive.academiesResults?.juvenile?.length || 0) > 0 ? editingArchive.archive.academiesResults!.juvenile : sampleDojos.map((d, i) => ({ ...d, rank: i + 1, points: Math.max(15, d.points - 30) })),
                          },
                        },
                      });
                    }}
                    className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> Auto-Fill Top 5 Template
                  </button>
                </div>

                {/* Sub-tabs for Divisions */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  {[
                    { key: "adultMale", label: `Adult Male (${editingArchive.archive.academiesResults?.adultMale?.length || 0})` },
                    { key: "adultFemale", label: `Adult Female (${editingArchive.archive.academiesResults?.adultFemale?.length || 0})` },
                    { key: "juvenile", label: `Juvenile (${editingArchive.archive.academiesResults?.juvenile?.length || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setArchiveAcademyTab(tab.key as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                        archiveAcademyTab === tab.key
                          ? "bg-primary text-background font-black shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Table of Academies for selected tab */}
                <div className="space-y-2">
                  {((editingArchive.archive.academiesResults?.[archiveAcademyTab]) || []).map((acad, aIdx) => (
                    <div key={aIdx} className="grid grid-cols-12 gap-2 items-center bg-card/60 p-2 rounded-xl border border-border/60 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <input
                          type="number"
                          placeholder="Rank"
                          value={acad.rank}
                          onChange={(e) => {
                            const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                            currentList[aIdx] = { ...currentList[aIdx], rank: parseInt(e.target.value) || aIdx + 1 };
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                academiesResults: {
                                  ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                                  [archiveAcademyTab]: currentList,
                                },
                              },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-center font-bold"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Academy / Dojo Name"
                          value={acad.name}
                          onChange={(e) => {
                            const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                            currentList[aIdx] = { ...currentList[aIdx], name: e.target.value };
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                academiesResults: {
                                  ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                                  [archiveAcademyTab]: currentList,
                                },
                              },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-foreground"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-3">
                        <input
                          type="text"
                          placeholder="State (e.g. Maharashtra)"
                          value={acad.state}
                          onChange={(e) => {
                            const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                            currentList[aIdx] = { ...currentList[aIdx], state: e.target.value };
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                academiesResults: {
                                  ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                                  [archiveAcademyTab]: currentList,
                                },
                              },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-foreground"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <input
                          type="number"
                          placeholder="Points"
                          value={acad.points}
                          onChange={(e) => {
                            const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                            currentList[aIdx] = { ...currentList[aIdx], points: parseInt(e.target.value) || 0 };
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                academiesResults: {
                                  ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                                  [archiveAcademyTab]: currentList,
                                },
                              },
                            });
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-foreground font-mono"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                            currentList.splice(aIdx, 1);
                            setEditingArchive({
                              ...editingArchive,
                              archive: {
                                ...editingArchive.archive,
                                academiesResults: {
                                  ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                                  [archiveAcademyTab]: currentList,
                                },
                              },
                            });
                          }}
                          className="size-7 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const currentList = [...(editingArchive.archive.academiesResults?.[archiveAcademyTab] || [])];
                      currentList.push({
                        rank: currentList.length + 1,
                        name: "",
                        state: "",
                        points: 0,
                      });
                      setEditingArchive({
                        ...editingArchive,
                        archive: {
                          ...editingArchive.archive,
                          academiesResults: {
                            ...(editingArchive.archive.academiesResults || { adultMale: [], adultFemale: [], juvenile: [] }),
                            [archiveAcademyTab]: currentList,
                          },
                        },
                      });
                    }}
                    className="w-full py-2 border border-dashed border-primary/40 rounded-xl text-primary hover:bg-primary/5 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Plus className="size-3.5" /> Add Dojo Rank Entry ({archiveAcademyTab})
                  </button>
                </div>
              </div>

              {/* 2. Athletes Results by Category */}
              <div className="p-4 rounded-2xl bg-background/80 border border-border/80 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-black text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="size-4 text-primary" /> Athletes Results by Category ({editingArchive.archive.athletesResultsByCategory?.length || 0} Categories)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Manage weight, age, and belt categories with 🥇 Gold, 🥈 Silver, and 🥉 Bronze medal winners.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const sampleCategories = [
                        {
                          categoryTitle: "SENIOR MALE / BLACK BELT / -68.00 KG",
                          divisionGroup: "Adult Male" as const,
                          podium: [
                            { place: 1 as const, athlete: "Vikramaditya Shinde", academy: "Balewadi High Performance Academy", state: "Maharashtra" },
                            { place: 2 as const, athlete: "Harpreet Singh", academy: "Sher-e-Punjab Combat Club", state: "Punjab" },
                            { place: 3 as const, athlete: "Rohit Deshmukh", academy: "Pune Combat Center", state: "Maharashtra" },
                          ],
                        },
                        {
                          categoryTitle: "SENIOR FEMALE / BROWN & BLACK BELT / -55.00 KG",
                          divisionGroup: "Adult Female" as const,
                          podium: [
                            { place: 1 as const, athlete: "Ananya Kulkarni", academy: "Deccan Martial Arts Club", state: "Maharashtra" },
                            { place: 2 as const, athlete: "Priya Murugan", academy: "Madras Combat Guild", state: "Tamil Nadu" },
                            { place: 3 as const, athlete: "Neha Rajput", academy: "Jaipur Warrior Academy", state: "Rajasthan" },
                          ],
                        },
                        {
                          categoryTitle: "JUVENILE 1 / BOYS / BLUE BELT / ROOSTER (-53.50 KG)",
                          divisionGroup: "Juvenile / Youth" as const,
                          podium: [
                            { place: 1 as const, athlete: "Aditya Patil", academy: "Shivaji Maratha Dojo", state: "Maharashtra" },
                            { place: 2 as const, athlete: "Deepak Saini", academy: "Delhi State Training Arena", state: "Delhi" },
                            { place: 3 as const, athlete: "K. Mohan", academy: "Bengaluru Combat Guild", state: "Karnataka" },
                          ],
                        },
                      ];
                      setEditingArchive({
                        ...editingArchive,
                        archive: {
                          ...editingArchive.archive,
                          athletesResultsByCategory: (editingArchive.archive.athletesResultsByCategory?.length || 0) > 0
                            ? [...(editingArchive.archive.athletesResultsByCategory || []), ...sampleCategories]
                            : sampleCategories,
                        },
                      });
                    }}
                    className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> Auto-Fill 3 Sample Divisions
                  </button>
                </div>

                {/* List of Category Blocks */}
                <div className="space-y-4">
                  {(editingArchive.archive.athletesResultsByCategory || []).map((cat, cIdx) => (
                    <div key={cIdx} className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-3">
                      {/* Category Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Category Division Title</label>
                          <input
                            type="text"
                            placeholder="e.g. SENIOR MALE / -68KG / BLACK BELT"
                            value={cat.categoryTitle}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              currentList[cIdx] = { ...currentList[cIdx], categoryTitle: e.target.value };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-black uppercase text-foreground"
                          />
                        </div>

                        <div className="w-full sm:w-48">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Division Group</label>
                          <select
                            value={cat.divisionGroup}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              currentList[cIdx] = { ...currentList[cIdx], divisionGroup: e.target.value as any };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer"
                          >
                            <option value="Adult Male">Adult Male</option>
                            <option value="Adult Female">Adult Female</option>
                            <option value="Juvenile / Youth">Juvenile / Youth</option>
                            <option value="Masters">Masters</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          title="Remove Category"
                          onClick={() => {
                            const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                            currentList.splice(cIdx, 1);
                            setEditingArchive({
                              ...editingArchive,
                              archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                            });
                          }}
                          className="size-7 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 inline-flex items-center justify-center cursor-pointer shrink-0 self-end sm:self-center"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {/* Medalists Podiums (Gold, Silver, Bronze) */}
                      <div className="grid sm:grid-cols-3 gap-2.5">
                        {/* Gold (1st Place) */}
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                          <span className="font-bold text-amber-400 text-[10px] block">🥇 1st Place (Gold)</span>
                          <input
                            type="text"
                            placeholder="Athlete Name"
                            value={cat.podium?.find((p) => p.place === 1)?.athlete || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 1);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], athlete: e.target.value };
                              } else {
                                currentPodium.push({ place: 1, athlete: e.target.value, academy: "", state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Academy / Club"
                            value={cat.podium?.find((p) => p.place === 1)?.academy || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 1);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], academy: e.target.value };
                              } else {
                                currentPodium.push({ place: 1, athlete: "", academy: e.target.value, state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={cat.podium?.find((p) => p.place === 1)?.state || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 1);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], state: e.target.value };
                              } else {
                                currentPodium.push({ place: 1, athlete: "", academy: "", state: e.target.value });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                        </div>

                        {/* Silver (2nd Place) */}
                        <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/30 space-y-1.5">
                          <span className="font-bold text-slate-300 text-[10px] block">🥈 2nd Place (Silver)</span>
                          <input
                            type="text"
                            placeholder="Athlete Name"
                            value={cat.podium?.find((p) => p.place === 2)?.athlete || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 2);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], athlete: e.target.value };
                              } else {
                                currentPodium.push({ place: 2, athlete: e.target.value, academy: "", state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Academy / Club"
                            value={cat.podium?.find((p) => p.place === 2)?.academy || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 2);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], academy: e.target.value };
                              } else {
                                currentPodium.push({ place: 2, athlete: "", academy: e.target.value, state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={cat.podium?.find((p) => p.place === 2)?.state || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 2);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], state: e.target.value };
                              } else {
                                currentPodium.push({ place: 2, athlete: "", academy: "", state: e.target.value });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                        </div>

                        {/* Bronze (3rd Place) */}
                        <div className="p-2.5 rounded-xl bg-amber-800/10 border border-amber-800/30 space-y-1.5">
                          <span className="font-bold text-amber-600 text-[10px] block">🥉 3rd Place (Bronze)</span>
                          <input
                            type="text"
                            placeholder="Athlete Name"
                            value={cat.podium?.find((p) => p.place === 3)?.athlete || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 3);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], athlete: e.target.value };
                              } else {
                                currentPodium.push({ place: 3, athlete: e.target.value, academy: "", state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Academy / Club"
                            value={cat.podium?.find((p) => p.place === 3)?.academy || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 3);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], academy: e.target.value };
                              } else {
                                currentPodium.push({ place: 3, athlete: "", academy: e.target.value, state: "" });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={cat.podium?.find((p) => p.place === 3)?.state || ""}
                            onChange={(e) => {
                              const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                              const currentPodium = [...(currentList[cIdx].podium || [])];
                              const pIdx = currentPodium.findIndex((p) => p.place === 3);
                              if (pIdx >= 0) {
                                currentPodium[pIdx] = { ...currentPodium[pIdx], state: e.target.value };
                              } else {
                                currentPodium.push({ place: 3, athlete: "", academy: "", state: e.target.value });
                              }
                              currentList[cIdx] = { ...currentList[cIdx], podium: currentPodium };
                              setEditingArchive({
                                ...editingArchive,
                                archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                              });
                            }}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-foreground text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const currentList = [...(editingArchive.archive.athletesResultsByCategory || [])];
                      currentList.push({
                        categoryTitle: "NEW WEIGHT / BELT CATEGORY",
                        divisionGroup: "Adult Male",
                        podium: [
                          { place: 1, athlete: "", academy: "", state: "" },
                          { place: 2, athlete: "", academy: "", state: "" },
                          { place: 3, athlete: "", academy: "", state: "" },
                        ],
                      });
                      setEditingArchive({
                        ...editingArchive,
                        archive: { ...editingArchive.archive, athletesResultsByCategory: currentList },
                      });
                    }}
                    className="w-full py-2.5 border border-dashed border-primary/40 rounded-xl text-primary hover:bg-primary/5 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Plus className="size-3.5" /> Add New Division Category
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingArchive(null)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-luxe px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Save className="size-3.5" /> Save Results Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                  {parseVideoSource(previewVideo.videoUrl).platformLabel} Playback Preview
                </span>
                <h3 className="text-base font-bold text-foreground line-clamp-1">{previewVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="size-8 rounded-full bg-background border border-border grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/80 shadow-lg">
              {parseVideoSource(previewVideo.videoUrl).type === "direct" ? (
                <video
                  src={parseVideoSource(previewVideo.videoUrl).directUrl}
                  controls
                  autoPlay
                  className="size-full object-contain"
                />
              ) : (
                <iframe
                  src={parseVideoSource(previewVideo.videoUrl).embedUrl}
                  title={previewVideo.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="truncate max-w-md font-mono text-[11px]">{previewVideo.videoUrl}</span>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary/90 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Categories Management Modal */}
      <AdminEventCategoriesModal
        open={isCategoriesModalOpen}
        onOpenChange={setIsCategoriesModalOpen}
        onCategoriesChanged={(cats) => {
          setEventCategories(cats);
        }}
        events={allEvents}
      />

      {/* Event Disciplines Management Modal */}
      <AdminEventDisciplinesModal
        open={isDisciplinesModalOpen}
        onOpenChange={setIsDisciplinesModalOpen}
        onDisciplinesChanged={(discs) => {
          setEventDisciplines(discs);
        }}
        events={allEvents}
      />
    </div>
  );
}
