"use client";

import {
  downloadRefereeReceiptPDF,
  printRefereeRegistrationSlip,
  downloadRefereeLicensePDF,
  printRefereeLicenseSlip,
} from "@/lib/referee-license-pdf";
import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Scale,
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Copy,
  Check,
  Send,
  ExternalLink,
  Building2,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  Paperclip,
  X,
  Trophy,
  Filter,
  Flame,
  QrCode,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UserCheck,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Phone,
  Mail,
  Lock,
  KeyRound,
  Trash2,
  Printer,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { states } from "@/data/people";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { federation } from "@/constants/navigation";
import { IMAGES } from "@/data/images";
import { validatePhoneNumber, sanitizePhoneInput } from "@/lib/validation";
import {
  REFEREE_LEVELS,
  LEVEL_CRITERIA,
  TECHNICAL_AUTHORITY,
  type RefereeItem,
  type RefereeLevel,
  type CreateRefereeInput,
} from "@/types/referee";

const CERTIFICATION_STAGES = [
  {
    step: 1,
    title: "1. Online Registration",
    desc: "Submit official referee application with personal credentials, Dan rank, and club affiliation details.",
    badge: "Stage 1",
  },
  {
    step: 2,
    title: "2. Document Verification",
    desc: "National Technical Committee verifies Black Belt / Dan certificates and statutory age requirements.",
    badge: "Stage 2",
  },
  {
    step: 3,
    title: "3. Training Seminar",
    desc: "Mandatory attendance at the All-India Referee Standards Clinic & match management workshops.",
    badge: "Stage 3",
  },
  {
    step: 4,
    title: "4. Theory Examination",
    desc: "Comprehensive written test covering statutory scoring, penalties, fouls, and protest procedures.",
    badge: "Stage 4",
  },
  {
    step: 5,
    title: "5. Practical Assessment",
    desc: "Live ring and mat adjudication evaluation under Senior Technical Committee Examiners.",
    badge: "Stage 5",
  },
  {
    step: 6,
    title: "6. Board Certification",
    desc: "Approval by Technical Head Mr. Santosh Kasbe and official promotion to accredited Referee Level.",
    badge: "Stage 6",
  },
  {
    step: 7,
    title: "7. License & ID Issuance",
    desc: "Issuance of official Referee License Number, Digital ID Card, and QR Verification Profile.",
    badge: "Stage 7",
  },
];

const REFEREE_FAQS = [
  {
    q: "What are the minimum rank prerequisites to apply for Referee certification?",
    a: "Candidates must hold at least a 1st Dan Black Belt (or equivalent recognized Kyu grade) for Level 1 Junior Referee, 2nd Dan for Level 2 State Referee, 3rd Dan for Level 3 National Referee, and 4th Dan+ for International Referee accreditation.",
  },
  {
    q: "How long is a KALAWAR Referee License valid?",
    a: "Standard Referee Licenses are issued with 2 years of validity. Officials must attend the biennial National Referee Refresher Clinic to renew their active license.",
  },
  {
    q: "Can uncertified or expired referees officiate in National Championships?",
    a: "Strictly No. Under federation statutory regulations, only active referees with a verified License Number and active status can be appointed to tournament rings and mats.",
  },
  {
    q: "How can championship organizers verify an appointed official's credentials?",
    a: "Organizers can scan the official QR code on the referee's digital ID card or enter their License Number into the verification portal on this page.",
  },
];

export default function RefereesPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "levels" | "process" | "register" | "verify">("directory");
  const [selectedLicenseReferee, setSelectedLicenseReferee] = useState<RefereeItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("verify") && searchParams.get("verify")?.trim()) {
        setActiveTab("verify");
      }
    }
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Technical Committee & Directorate of Adjudication"
        title="🧑⚖️ REFEREE & TECHNICAL OFFICIALS"
        description="Official Referee Training, Certification, Licensing, Appointment & Competition Adjudication System of KALAWAR Sports & Martial Arts Federation of India."
        image={IMAGES.martialArts}
      />

      {/* Technical Authority Banner */}
      <section className="relative -mt-8 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-card/90 to-primary/10 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                  National Technical Authority
                </span>
                <span className="text-xs text-muted-foreground">• Supreme Examination Board</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                {TECHNICAL_AUTHORITY.name}
              </h3>
              <p className="text-xs font-semibold text-primary">
                {TECHNICAL_AUTHORITY.role} • {TECHNICAL_AUTHORITY.committeeRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Apply for Referee Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verify")}
              className="px-4 py-2.5 rounded-full border border-border/80 hover:border-primary text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-primary" />
              <span>Verify Certificate</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Multi-Tab Navigation */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Tabs Ribbon */}
          <div className="flex justify-center mb-10 overflow-x-auto pb-2">
            <div className="inline-flex p-1.5 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-md shadow-md gap-1">
              {[
                { key: "directory", label: "Referee Directory", icon: UserCheck },
                { key: "levels", label: "Referee Levels & Criteria", icon: Scale },
                { key: "process", label: "Certification Roadmap", icon: Award },
                { key: "register", label: "Online Registration", icon: Send },
                { key: "verify", label: "Certificate & QR Verification", icon: QrCode },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: REFEREE DIRECTORY */}
          {activeTab === "directory" && (
            <RefereeDirectoryView
              onSelectReferee={(r) => setSelectedLicenseReferee(r)}
              onApplyClick={() => setActiveTab("register")}
            />
          )}

          {/* TAB 2: LEVELS & ELIGIBILITY */}
          {activeTab === "levels" && <RefereeLevelsView onApplyClick={() => setActiveTab("register")} />}

          {/* TAB 3: CERTIFICATION PROCESS ROADMAP */}
          {activeTab === "process" && <CertificationProcessView onApplyClick={() => setActiveTab("register")} />}

          {/* TAB 4: ONLINE REGISTRATION */}
          {activeTab === "register" && (
            <div className="max-w-3xl mx-auto">
              <RefereeRegistrationForm onSwitchToDirectory={() => setActiveTab("directory")} />
            </div>
          )}

          {/* TAB 5: CERTIFICATE & QR VERIFICATION */}
          {activeTab === "verify" && (
            <div className="max-w-3xl mx-auto">
              <RefereeLicenseVerification onApplyClick={() => setActiveTab("register")} />
            </div>
          )}

        </div>
      </section>

      {/* Digital License Modal */}
      {selectedLicenseReferee && (
        <DigitalLicenseModal
          referee={selectedLicenseReferee}
          onClose={() => setSelectedLicenseReferee(null)}
        />
      )}

      {/* FAQ Accordion */}
      <section className="py-12 sm:py-16 border-t border-border/60 bg-card/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Technical Committee Guidelines"
            title="Frequently Asked Questions"
          />
          <Accordion type="single" collapsible className="mt-8 space-y-3">
            {REFEREE_FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/70 rounded-2xl bg-card/60 px-5 shadow-sm">
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </SiteLayout>
  );
}

/* =========================================================================
   COMPONENT: Referee Directory View (Tab 1)
   ========================================================================= */
function RefereeDirectoryView({
  onSelectReferee,
  onApplyClick,
}: {
  onSelectReferee: (referee: RefereeItem) => void;
  onApplyClick: () => void;
}) {
  const REFEREES_PER_PAGE = 9;
  const [referees, setReferees] = useState<RefereeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReferees = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/referees");
        const data = await res.json();
        if (data.success && Array.isArray(data.referees)) {
          setReferees(data.referees);
        }
      } catch (err) {
        console.error("Failed to load referee directory:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReferees();
  }, []);

  // Reset pagination to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter, stateFilter]);

  const filtered = referees.filter((r) => {
    const matchLevel = levelFilter === "All" || r.level === levelFilter;
    const matchState = stateFilter === "All" || r.state === stateFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.licenseNumber && r.licenseNumber.toLowerCase().includes(q)) ||
      r.state.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      (r.academy && r.academy.toLowerCase().includes(q));

    return matchLevel && matchState && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / REFEREES_PER_PAGE);
  const paginatedReferees = filtered.slice(
    (currentPage - 1) * REFEREES_PER_PAGE,
    currentPage * REFEREES_PER_PAGE
  );

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "International / Chief Referee":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Level 3 – National Referee":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "Level 2 – State Referee":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-card/90 border border-border/80 shadow-md backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, License, State..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs sm:text-sm focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs font-semibold focus:border-primary outline-none"
          >
            <option value="All">All Referee Levels</option>
            {REFEREE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-border/80 bg-background/80 text-xs font-semibold focus:border-primary outline-none"
          >
            <option value="All">All States</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count Summary */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{(currentPage - 1) * REFEREES_PER_PAGE + 1}–{Math.min(currentPage * REFEREES_PER_PAGE, filtered.length)}</strong> of <strong className="text-foreground">{filtered.length}</strong> Certified Technical Officials
          </span>
          {totalPages > 1 && (
            <span className="font-semibold text-primary">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Grid of Referees */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="font-bold text-foreground">Loading Certified Official Registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl border border-border/80 bg-card/60">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">No Official Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register as a new technical official.
          </p>
          <button
            type="button"
            onClick={onApplyClick}
            className="mt-4 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90"
          >
            Apply for Certification
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedReferees.map((referee) => (
              <div
                key={referee.id}
                className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 shadow-md hover:border-primary/50 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badge & Level */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(
                        referee.level
                      )}`}
                    >
                      {referee.level}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {referee.status}
                    </span>
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center font-bold text-primary text-base shrink-0 group-hover:scale-105 transition-transform">
                      {referee.photo && !referee.photo.includes("1500648767791-00dcc994a43e") ? (
                        <img src={referee.photo} alt={referee.name} className="w-full h-full object-cover" />
                      ) : (
                        referee.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {referee.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{referee.currentRank}</p>
                      <p className="text-[11px] text-primary font-mono font-bold mt-0.5">
                        {referee.licenseNumber || referee.id}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info Matrix */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/40 border border-border/60 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">State / UT</span>
                      <span className="font-semibold text-foreground truncate block">{referee.state}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Experience</span>
                      <span className="font-semibold text-foreground truncate block">{referee.martialArtsExperience || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">District</span>
                      <span className="font-semibold text-foreground truncate block">{referee.district || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Officiated</span>
                      <span className="font-semibold text-primary block">{referee.matchesOfficiated || 0} Matches</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 pb-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 350, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-card border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-primary" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                          : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 350, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-card border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   COMPONENT: Referee Levels & Eligibility View (Tab 2)
   ========================================================================= */
function RefereeLevelsView({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        align="center"
        eyebrow="Accreditation Standards"
        title="Official Referee Levels & Criteria"
        description="Structured ranking matrix approved by the National Technical Committee for transparent, merit-based match adjudication."
      />

      <div className="grid md:grid-cols-2 gap-6">
        {(Object.keys(LEVEL_CRITERIA) as RefereeLevel[]).map((level) => {
          const crit = LEVEL_CRITERIA[level];
          return (
            <div
              key={level}
              className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-black uppercase">
                    {level}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">Min Age: {crit.minAge}+ Yrs</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-foreground mt-1">{level}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {crit.description}
                </p>

                {/* Requirements Grid */}
                <div className="mt-5 p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2 text-xs">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Eligibility Requirements
                  </p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong className="text-foreground">Required Rank:</strong> {crit.minRank}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong className="text-foreground">Minimum Experience:</strong> {crit.minExpYears} Years
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Pass Statutory Theory Examination (40/50 Minimum)</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Pass Practical Ring Assessment & Referee Clinic</span>
                    </p>
                  </div>
                </div>

                {/* Authorized Duties */}
                <div className="mt-4">
                  <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">
                    Authorized Duties & Roles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {crit.duties.map((duty, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-card border border-border/80 text-[11px] font-medium text-foreground"
                      >
                        {duty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={onApplyClick}
                  className="w-full py-2.5 rounded-2xl bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Apply for {level}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENT: 7-Stage Certification Process Flow (Tab 3)
   ========================================================================= */
function CertificationProcessView({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        align="center"
        eyebrow="Official Pathway"
        title="7-Stage Referee Certification Roadmap"
        description="From application submission to national license issuance — the verified route to becoming an accredited KALAWAR Technical Official."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {CERTIFICATION_STAGES.map((st) => (
          <div
            key={st.step}
            className="p-6 rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md shadow-md flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-sm flex items-center justify-center mb-4">
                {st.step}
              </div>
              <h4 className="font-bold text-base text-foreground">{st.title}</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{st.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-bold text-primary">
              <span>{st.badge}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border border-primary/30 text-center max-w-2xl mx-auto shadow-xl">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="text-lg sm:text-xl font-black text-foreground">Ready to Officiate National Matches?</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Begin your journey as an accredited KALAWAR Technical Official. Submit your credentials online today.
        </p>
        <button
          type="button"
          onClick={onApplyClick}
          className="mt-5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:opacity-90 transition-all"
        >
          Submit Referee Application
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENT: Online Referee Registration Form (Tab 4 - Fresh Accounts Only)
   ========================================================================= */
function RefereeRegistrationForm({ onSwitchToDirectory }: { onSwitchToDirectory: () => void }) {
  const { setUser } = useAuth();

  // Form State - ALWAYS BLANK, Fresh candidate details
  const [formData, setFormData] = useState<CreateRefereeInput>({
    name: "",
    dob: "",
    gender: "Male",
    email: "",
    phone: "",
    state: "Maharashtra",
    district: "",
    academy: "",
    kalawarId: "",
    currentRank: "1st Dan Black Belt",
    martialArtsExperience: "3 Years",
    level: "Level 1 – Junior Referee",
    bio: "",
  });

  // Password & OTP State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Real Upload Attachments (Base64)
  const [photo, setPhoto] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoSize, setPhotoSize] = useState("");

  const [danCertificateDoc, setDanCertificateDoc] = useState("");
  const [danCertificateDocName, setDanCertificateDocName] = useState("");
  const [danCertificateDocSize, setDanCertificateDocSize] = useState("");

  const [aadhaarDoc, setAadhaarDoc] = useState("");
  const [aadhaarDocName, setAadhaarDocName] = useState("");
  const [aadhaarDocSize, setAadhaarDocSize] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const danCertInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Document Preview Modal
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    docData: string;
    docName: string;
  } | null>(null);

  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReferee, setSubmittedReferee] = useState<RefereeItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Generic File Upload Handler
  const handleFileUpload = (
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
        setPhoto(dataUrl);
        setPhotoName(file.name);
        setPhotoSize(sizeFormatted);
        toast.success("Passport Photo Selected", { description: `${file.name} (${sizeFormatted})` });
      } else if (type === "danCert") {
        setDanCertificateDoc(dataUrl);
        setDanCertificateDocName(file.name);
        setDanCertificateDocSize(sizeFormatted);
        toast.success("Dan Rank Proof Attached", { description: `${file.name} (${sizeFormatted})` });
      } else if (type === "aadhaar") {
        setAadhaarDoc(dataUrl);
        setAadhaarDocName(file.name);
        setAadhaarDocSize(sizeFormatted);
        toast.success("ID Proof Document Attached", { description: `${file.name} (${sizeFormatted})` });
      }
    };
    reader.readAsDataURL(file);
  };

  // Send Registration 2FA OTP with Duplicate Email Guard
  const handleSendOtp = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address first.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter your full legal name first.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, name: formData.name.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409 || data.existingAccount) {
          toast.error("This email ID is already registered, use a different ID.", {
            description: "Only fresh accounts can register for referee accreditation.",
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Failed to send verification code.");
      }

      setTempToken(data.tempToken || "");
      setOtpSent(true);
      setOtpCountdown(60);
      toast.success("Verification Code Sent!", {
        description: `A 6-digit verification code has been sent to ${data.maskedEmail || cleanEmail}.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone, {
      required: true,
      fieldName: "Mobile number",
    });
    if (!phoneValidation.isValid) {
      toast.error("Invalid Phone Number", { description: phoneValidation.error });
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!otpCode || otpCode.trim().length < 6) {
      if (!otpSent) {
        toast.info("Please request and enter your 6-digit Email Verification Code (OTP).");
        handleSendOtp();
      } else {
        toast.error("Please enter the 6-digit verification code (OTP) sent to your email.");
      }
      return;
    }

    if (!photo) {
      toast.error("Please upload your official passport size photo.");
      return;
    }

    if (!declaration) {
      toast.error("Please accept the Statutory Fair Adjudication Declaration.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        password,
        confirmPassword,
        otpCode: otpCode.trim(),
        tempToken,
        photo,
        certificationDocument: danCertificateDoc,
        certificationDocumentName: danCertificateDocName,
        certificationDocumentSize: danCertificateDocSize,
        aadhaarDoc,
        aadhaarDocName,
        aadhaarDocSize,
      };

      const res = await fetch("/api/referees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409 || data.existingAccount) {
          toast.error("This email ID is already registered, use a different ID.", {
            description: "Please enter a fresh email address to create your referee account.",
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Failed to submit referee application");
      }

      // DOUBLE LAYER AUTO-LOGIN: Layer 2 Client-side state & localStorage synchronization
      if (data.user) {
        setUser(data.user, data.token || null);
      }

      setSubmittedReferee(data.referee);
      toast.success("Referee Registration Submitted Successfully!", {
        description: `Official ID: ${data.referee?.id} · Credentials dispatched to your email.`,
      });
      window.scrollTo({ top: 250, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Reference ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // POST-SUBMISSION VIEW: Rich Registration Slip & Receipt Modal
  if (submittedReferee) {
    const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/referees?verify=${encodeURIComponent(submittedReferee.licenseNumber || submittedReferee.id)}`;

    return (
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
                {submittedReferee.photo && !submittedReferee.photo.includes("1500648767791-00dcc994a43e") ? (
                  <img src={submittedReferee.photo} alt={submittedReferee.name} className="w-full h-full object-cover" />
                ) : (
                  submittedReferee.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{submittedReferee.name}</h3>
                <p className="text-xs font-semibold text-primary">{submittedReferee.level}</p>
                <p className="text-xs text-muted-foreground font-mono">{submittedReferee.state}, India</p>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-md self-center sm:self-auto shrink-0">
              <QRCode value={verifyUrl} size={64} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Referee ID</span>
              <span className="font-black text-primary">{submittedReferee.id}</span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Current Rank</span>
              <span className="font-bold text-foreground truncate block">{submittedReferee.currentRank}</span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold block">Status</span>
              <span className="font-bold text-amber-400 block">{submittedReferee.status}</span>
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
              <p className="text-base font-mono font-black text-primary">{submittedReferee.id}</p>
            </div>
            <button
              type="button"
              onClick={() => copyId(submittedReferee.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId ? "Copied" : "Copy Reference ID"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Print Slip, Download PDF, Directory */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => printRefereeRegistrationSlip(submittedReferee)}
            className="px-5 py-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Print Slip</span>
          </button>

          <button
            type="button"
            onClick={() => downloadRefereeReceiptPDF(submittedReferee)}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Slip (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToDirectory}
            className="px-5 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>View Referee Directory</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
      <div className="border-b border-border/80 pb-4">
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
          Official Accreditation • Dedicated Referee Account
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-foreground mt-2">
          Online Referee Registration Application
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Apply for statutory accreditation under the KALAWAR Technical Committee. Enter fresh official credentials below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Legal Name & DOB */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Ramesh V. Jadhav"
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Date of Birth</span>
            </label>
            <input
              type="date"
              value={formData.dob}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFormData((prev) => ({ ...prev, dob: e.target.value }))}
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all cursor-pointer font-mono"
            />
          </div>
        </div>

        {/* Mobile Number & Email Address */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Mobile Number (WhatsApp) <span className="text-rose-500">*</span></span>
            </label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))
              }
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm font-mono focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>New Email Address (For Login &amp; Notifications) <span className="text-rose-500">*</span></span>
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* State / UT & District */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>State / UT <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">District / City</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
              placeholder="e.g. Pune, Nagpur, Mumbai"
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Rank & Experience */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Current Rank / Black Belt Dan <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.currentRank}
              onChange={(e) => setFormData((prev) => ({ ...prev, currentRank: e.target.value }))}
              placeholder="e.g. 2nd Dan Black Belt"
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Total Martial Arts Experience <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.martialArtsExperience}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, martialArtsExperience: e.target.value }))
              }
              placeholder="e.g. 8 Years"
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Applying Referee Level & Affiliated Academy */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Applying for Referee Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.level}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, level: e.target.value as RefereeLevel }))
              }
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm font-semibold focus:border-primary outline-none transition-all"
            >
              {REFEREE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Affiliated Club / Academy</label>
            <input
              type="text"
              value={formData.academy}
              onChange={(e) => setFormData((prev) => ({ ...prev, academy: e.target.value }))}
              placeholder="e.g. Pune Martial Arts Academy"
              className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs sm:text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Create Password & Confirm Password */}
        <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-3xl bg-muted/30 border border-border/70">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Create Referee Password <span className="text-rose-500">*</span></span>
            </label>
            <div className="relative">
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 pr-10 text-xs sm:text-sm font-mono focus:border-primary outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Min 6 chars. Emailed to you upon submission.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Confirm Password <span className="text-rose-500">*</span></span>
            </label>
            <div className="relative">
              <input
                required
                minLength={6}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 pr-10 text-xs sm:text-sm font-mono focus:border-primary outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Email OTP 2FA Verification Box */}
          <div className="sm:col-span-2 p-4 rounded-2xl bg-card border border-primary/40 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>Email 2FA Verification Code (OTP) <span className="text-rose-500">*</span></span>
              </span>
              {otpSent && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Code dispatched to {formData.email || "your email"}
                </span>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                className="flex-1 px-4 py-2.5 bg-background border border-border/80 rounded-xl text-xs sm:text-sm font-mono tracking-widest text-center focus:border-primary outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || (otpSent && otpCountdown > 0)}
                className="px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : otpCountdown > 0 ? (
                  `Resend in ${otpCountdown}s`
                ) : otpSent ? (
                  "Resend OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Click <strong>Send OTP</strong> to receive a code. Existing emails will be rejected.
            </p>
          </div>
        </div>

        {/* Real File & Document Uploads */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Official Credentials &amp; Photo Attachments
          </h4>

          {/* Hidden File Inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={(e) => handleFileUpload("photo", e)}
          />
          <input
            ref={danCertInputRef}
            type="file"
            accept="image/png, image/jpeg, application/pdf"
            className="hidden"
            onChange={(e) => handleFileUpload("danCert", e)}
          />
          <input
            ref={aadhaarInputRef}
            type="file"
            accept="image/png, image/jpeg, application/pdf"
            className="hidden"
            onChange={(e) => handleFileUpload("aadhaar", e)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Passport Photo */}
            <div className="p-4 rounded-3xl bg-muted/30 border border-border/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Passport Photograph <span className="text-rose-500">*</span>
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Clear headshot for official ID card</p>
              </div>

              {photo ? (
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-card border border-border">
                  <img src={photo} alt="Photo" className="w-12 h-12 rounded-xl object-cover border border-border" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate">{photoName || "Photo.jpg"}</p>
                    <span className="text-[9px] text-muted-foreground">{photoSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDocModal({ title: "Passport Photo", docData: photo, docName: photoName })}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
                      title="Preview Photo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto("");
                        setPhotoName("");
                        setPhotoSize("");
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Upload Passport Photo</span>
                </button>
              )}
            </div>

            {/* 2. Dan Certificate Proof */}
            <div className="p-4 rounded-3xl bg-muted/30 border border-border/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-foreground block">Black Belt / Dan Certificate</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF or Image of current rank</p>
              </div>

              {danCertificateDoc ? (
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-card border border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate">{danCertificateDocName || "Dan_Cert.pdf"}</p>
                    <span className="text-[9px] text-muted-foreground">{danCertificateDocSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDocModal({
                          title: "Dan Certificate Proof",
                          docData: danCertificateDoc,
                          docName: danCertificateDocName,
                        })
                      }
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDanCertificateDoc("");
                        setDanCertificateDocName("");
                        setDanCertificateDocSize("");
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => danCertInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Attach Dan Certificate</span>
                </button>
              )}
            </div>

            {/* 3. Aadhaar / Govt ID Proof */}
            <div className="p-4 rounded-3xl bg-muted/30 border border-border/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-foreground block">Government ID / Aadhaar</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Statutory age &amp; address proof</p>
              </div>

              {aadhaarDoc ? (
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-card border border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate">{aadhaarDocName || "ID_Proof.pdf"}</p>
                    <span className="text-[9px] text-muted-foreground">{aadhaarDocSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDocModal({
                          title: "Government ID Proof",
                          docData: aadhaarDoc,
                          docName: aadhaarDocName,
                        })
                      }
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarDoc("");
                        setAadhaarDocName("");
                        setAadhaarDocSize("");
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => aadhaarInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-background/50 hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Attach Govt ID Proof</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statutory Declaration */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-start gap-3">
          <input
            required
            id="referee-declaration"
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            className="mt-1 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="referee-declaration" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            <strong className="text-foreground">Statutory Adjudication Declaration:</strong> I solemnly declare that all statements provided are true and correct. I agree to abide by the official KALAWAR Martial Arts Statutory Rulebook, maintain absolute impartiality in tournament adjudication, and attend mandatory Technical Committee clinics.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Submitting Application &amp; Creating Account...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Referee Application</span>
            </>
          )}
        </button>
      </form>

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
                className="p-1 rounded-full bg-muted hover:bg-muted/80 text-foreground"
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
                  alt={previewDocModal.docName}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   COMPONENT: Certificate & QR Verification (Tab 5)
   ========================================================================= */
function RefereeLicenseVerification({ onApplyClick }: { onApplyClick?: () => void }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [referee, setReferee] = useState<RefereeItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [urlVerifiedId, setUrlVerifiedId] = useState<string | null>(null);

  const loadCertificate = async () => {
    try {
      setIsLoading(true);
      const verifyParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("verify")
          : null;

      if (verifyParam && verifyParam.trim()) {
        setUrlVerifiedId(verifyParam.trim());
        const res = await fetch(`/api/referees?q=${encodeURIComponent(verifyParam.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.referees) && data.referees.length > 0) {
          setReferee(data.referees[0]);
          return;
        }
      }

      if (user) {
        const userEmail = (user.email || "").toLowerCase().trim();
        const userId = (user.id || "").toLowerCase().trim();
        const userKalawarId = (user.kalawarId || "").toLowerCase().trim();

        const res = await fetch("/api/referees");
        const data = await res.json();
        if (data.success && Array.isArray(data.referees)) {
          const match = data.referees.find((r: RefereeItem) => {
            const rEmail = (r.email || "").toLowerCase().trim();
            const rId = (r.id || "").toLowerCase().trim();
            const rKalawarId = (r.kalawarId || "").toLowerCase().trim();
            const rLicense = (r.licenseNumber || "").toLowerCase().trim();

            if (userEmail && rEmail === userEmail) return true;
            if (userId && (rId === userId || rKalawarId === userId)) return true;
            if (userKalawarId && (rKalawarId === userKalawarId || rId === userKalawarId || rLicense === userKalawarId)) return true;
            return false;
          });

          if (match) {
            setReferee(match);
            return;
          }
        }
      }

      setReferee(null);
    } catch (err) {
      console.error("Failed to load referee verification:", err);
      setReferee(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCertificate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDownloadPDF = async () => {
    if (!referee) return;
    try {
      setIsDownloading(true);
      await downloadRefereeLicensePDF(referee);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!referee) return;
    const url = `${window.location.origin}/referees?verify=${encodeURIComponent(referee.licenseNumber || referee.id)}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-10 sm:p-14 text-center shadow-xl flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div>
          <h3 className="text-base font-bold text-foreground">Checking Referee Accreditation</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Verifying technical official records and digital credentials...
          </p>
        </div>
      </div>
    );
  }

  // If a registered referee is found (auto-detected or via QR code link)
  if (referee) {
    const qrUrl = typeof window !== "undefined"
      ? `${window.location.origin}/referees?verify=${encodeURIComponent(referee.licenseNumber || referee.id)}`
      : `https://kalawarfederation.org/referees?verify=${referee.licenseNumber || referee.id}`;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        {/* Top Header Card */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Technical Official
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground mt-1">
                Referee Certificate & Verification
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={loadCertificate}
            className="px-3.5 py-2 rounded-xl border border-border/80 hover:bg-muted/50 text-xs font-bold transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            title="Refresh Accreditation Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* High-Contrast Official Certificate Card */}
        <div className="rounded-3xl border-2 border-amber-500/40 bg-[#0d0f14] text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-4 sm:p-5 text-center relative shadow-md">
            <div className="flex justify-center mb-1">
              <Scale className="w-7 h-7 text-black drop-shadow-sm" />
            </div>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
              KALAWAR SPORTS & MARTIAL ARTS FEDERATION
            </h3>
            <p className="text-[10px] sm:text-xs text-zinc-950 font-black uppercase tracking-widest mt-0.5">
              National Technical Official Accreditation & License
            </p>
          </div>

          {/* Profile & Info Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Top Row: Photo + Name + Badges */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900 border-2 border-amber-500/60 overflow-hidden flex items-center justify-center font-black text-amber-400 text-2xl shrink-0 shadow-lg">
                {referee.photo && !referee.photo.includes("1500648767791-00dcc994a43e") ? (
                  <img src={referee.photo} alt={referee.name} className="w-full h-full object-cover" />
                ) : (
                  referee.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-black text-xl sm:text-2xl text-white">{referee.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ACCREDITED OFFICIAL
                  </span>
                </div>
                <p className="text-sm text-amber-400 font-black mt-1">{referee.currentRank}</p>
                <p className="text-xs sm:text-sm text-zinc-300 font-semibold">{referee.level}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {referee.state}, India
                  </span>
                  {referee.discipline && (
                    <span>• {referee.discipline}</span>
                  )}
                  {referee.academy && (
                    <span>• {referee.academy}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Credential Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Official ID</span>
                <span className="font-black text-amber-400 break-all">{referee.licenseNumber || referee.id}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Status</span>
                <span className="font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  {referee.status}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Validity</span>
                <span className="text-zinc-200">
                  {referee.licenseValidUntil ? referee.licenseValidUntil.split("T")[0] : "Perpetual"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Officiated</span>
                <span className="text-zinc-200">{referee.matchesOfficiated || 0} Bouts</span>
              </div>
            </div>

            {/* Official Seal & Live QR Code */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/20 gap-4">
              <div className="text-center sm:text-left text-xs">
                <p className="font-bold text-zinc-300">Supreme Examination Board</p>
                <p className="text-sm text-amber-400 font-bold mt-0.5">{TECHNICAL_AUTHORITY.name}</p>
                <p className="text-[10px] text-zinc-400">{TECHNICAL_AUTHORITY.role} • {TECHNICAL_AUTHORITY.committeeRole}</p>
              </div>

              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-md shrink-0">
                <div className="w-16 h-16 flex items-center justify-center">
                  <QRCode value={qrUrl} size={64} />
                </div>
                <div className="text-left text-[10px] text-black pr-2">
                  <p className="font-black">DIGITAL SEAL</p>
                  <p className="text-zinc-700 font-medium">Scan to verify</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-2"
              title="Copy Public Verification Link"
            >
              <Paperclip className="w-4 h-4 text-amber-400" />
              <span>Copy Link</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => printRefereeLicenseSlip(referee)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download receipt PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no referee profile was found (unregistered user or non-referee account)
  return (
    <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-8 sm:p-12 shadow-xl text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center mb-4 shadow-inner">
        <Award className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-foreground">
        {user ? "No Referee Registration Found" : "Referee Certificate & Credentials Portal"}
      </h2>

      <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
        {user ? (
          <>
            You are logged in as <span className="font-bold text-foreground">{user.name}</span> ({user.email}), but we could not find an official Referee registration linked to this account.
          </>
        ) : (
          <>
            To access and verify your official Referee Certificate, digital accreditation credentials, and match appointment eligibility, please complete your online referee registration.
          </>
        )}
      </p>

      {urlVerifiedId && (
        <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium max-w-md mx-auto">
          No active official found matching verification query: <span className="font-mono font-bold">{urlVerifiedId}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onApplyClick}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-primary via-amber-500 to-amber-600 text-primary-foreground font-black text-sm shadow-xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
        >
          <Award className="w-5 h-5" />
          <span>Apply for Referee Registration First</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENT: Digital License Modal (Opaque High-Contrast Luxury Theme)
   ========================================================================= */
function DigitalLicenseModal({
  referee,
  onClose,
}: {
  referee: RefereeItem;
  onClose: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadRefereeLicensePDF(referee);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/referees?verify=${encodeURIComponent(referee.licenseNumber || referee.id)}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied to clipboard!");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#0d0f14] border-2 border-amber-500/50 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Gold Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-4 text-center relative shadow-md">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex justify-center mb-0.5">
            <Scale className="w-6 h-6 text-black drop-shadow-sm" />
          </div>
          <h4 className="font-black text-xs uppercase tracking-wider text-black">
            KALAWAR Sports & Martial Arts Federation
          </h4>
          <p className="text-[10px] text-zinc-900 font-bold uppercase tracking-widest">
            National Technical Official Credential
          </p>
        </div>

        {/* Card Dark Opaque Body */}
        <div className="p-6 space-y-4 bg-[#0d0f14]">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-amber-500/60 overflow-hidden flex items-center justify-center font-black text-amber-400 text-xl shrink-0 shadow-lg">
              {referee.photo && !referee.photo.includes("1500648767791-00dcc994a43e") ? (
                <img src={referee.photo} alt={referee.name} className="w-full h-full object-cover" />
              ) : (
                referee.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-lg text-white truncate">{referee.name}</h3>
              <p className="text-xs text-amber-400 font-bold">{referee.currentRank}</p>
              <p className="text-xs text-zinc-300 font-medium">{referee.level}</p>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{referee.state}, India</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Official ID</span>
              <span className="font-black text-amber-400">{referee.licenseNumber || referee.id}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Status</span>
              <span className="font-black text-emerald-400">{referee.status}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Valid Until</span>
              <span className="text-zinc-200">
                {referee.licenseValidUntil ? referee.licenseValidUntil.split("T")[0] : "Perpetual"}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Officiated</span>
              <span className="text-zinc-200">{referee.matchesOfficiated} Bouts</span>
            </div>
          </div>

          {/* Signature & Seal */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-amber-500/20">
            <div className="text-left text-[11px]">
              <p className="font-bold text-zinc-300">Authorized Signature</p>
              <p className="text-xs text-amber-400 font-bold">{TECHNICAL_AUTHORITY.name}</p>
              <p className="text-[9px] text-zinc-400">Head, Technical Committee India</p>
            </div>
            <div className="p-1.5 rounded-xl bg-white shrink-0">
              <QrCode className="w-10 h-10 text-black" />
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Copy Public Verification Link"
          >
            <Paperclip className="w-3.5 h-3.5 text-amber-400" />
            <span>Copy Link</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printRefereeLicenseSlip(referee)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download receipt PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
