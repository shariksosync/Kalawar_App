"use client";

import {
  Target,
  Eye,
  Award,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Phone,
  Mail,
  Compass,
  Zap,
  Globe2,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import { IMAGES } from "@/data/images";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";
import { RecognitionDetails } from "@/components/about/RecognitionDetails";
import { FederationStructure } from "@/components/about/FederationStructure";
import { FederationHistory } from "@/components/about/FederationHistory";
import { LeadershipMessages } from "@/components/about/LeadershipMessages";
import { OfficialsDirectory } from "@/components/about/OfficialsDirectory";
import { OfficialContactSection } from "@/components/about/OfficialContactSection";

const objectives = [
  "Promote, standardize, and regulate martial arts & multi-sport disciplines across all states of India",
  "Provide authentic Dan (Black Belt) rank certifications with tamper-proof digital QR verification",
  "Accredit master instructors, coaches, dojos, and national referees to international standards",
  "Expand grassroots youth training, student fitness, and specialized self-defense programs nationwide",
  "Conduct transparent, high-standard district, state, zonal, and national championships",
  "Instill ethical discipline, humility, sportsmanship, and mental resilience among young athletes",
];

const stats = [
  { label: "States Represented", value: "28+", suffix: "" },
  { label: "Affiliated Clubs & Dojos", value: "150+", suffix: "" },
  { label: "Certified Black Belts", value: "850+", suffix: "" },
  { label: "Athletes Trained", value: "25,000+", suffix: "" },
];

export default function AboutPage() {
  const { settings } = useSettings();

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;

  return (
    <SiteLayout>
      {/* 1. Page Hero: Federation Introduction */}
      <PageHero
        eyebrow="About the Federation"
        title={fedName}
        description="Pioneering martial arts excellence, standardized Dan grading, youth character development, and recognized national athletic pathways across India."
        image={IMAGES.crowd}
      />

      {/* 2. Quick Accreditation & Contact Bar */}
      <section className="border-b border-border/60 bg-accent/20 py-4 sm:py-5">
        <div className="shell flex flex-col items-start lg:items-center justify-between gap-4 lg:flex-row">
          <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
            <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <FileCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground truncate sm:whitespace-normal">
                Legally Registered National Federation
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
                Certificate & Registration documentation available with digital verification
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 text-xs font-semibold w-full lg:w-auto">
            <a
              href={`mailto:${fedEmail}`}
              className="flex items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-background px-3.5 py-2 text-primary hover:bg-primary hover:text-background transition-colors min-w-0 flex-1 sm:flex-initial text-center"
            >
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{fedEmail}</span>
            </a>
            <a
              href={`tel:${fedPhone.replace(/[^0-9+]/g, "")}`}
              className="bg-gold-gradient text-background flex items-center justify-center gap-1.5 rounded-full px-4 py-2 font-bold shadow-gold min-w-0 flex-1 sm:flex-initial text-center whitespace-nowrap"
            >
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{fedPhone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Founder & President Leadership Messages (Visionary Leadership - Dynamic Admin Updated) */}
      <LeadershipMessages />

      {/* 4. Founder / President & Officials Directory (Federation Governance & Leadership - Dynamic Admin Updated) */}
      <OfficialsDirectory />

      {/* 5. Federation Introduction & Overview (National Governing Body) */}
      <section className="section-pad">
        <div className="shell">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-4">
                <Globe2 className="size-3.5" /> National Governing Body
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
                Empowering India's Athletes Through Discipline, Mastery & Integrity
              </h2>
              <div className="gold-rule mt-4 sm:mt-5" />

              <div className="mt-5 sm:mt-6 space-y-3.5 sm:space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong>{fedName}</strong> is the premier national governing institution dedicated to standardizing, advancing, and democratizing martial arts disciplines, combat sports, and multi-sport athletics throughout the Republic of India.
                </p>
                <p>
                  Rooted in traditional martial arts ethics and elevated by modern sporting science, the federation serves as the unified umbrella for state associations, district committees, and affiliated dojos. We bridge the gap between grassroots dojo sparring and official national podiums.
                </p>
                <p>
                  Through standardized Dan syllabus examination, referee clinic certification, fair selection trials, and digital credential verification, we ensure every athlete, coach, and master instructor receives the respect and official standing they deserve.
                </p>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 text-xs font-semibold">
                <a href="#structure" className="btn-luxe px-5 py-2.5 text-center">
                  Explore Federation Structure
                </a>
                <a
                  href="#officials"
                  className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-foreground hover:border-primary/50 transition-colors text-center"
                >
                  Meet Governing Officials
                </a>
              </div>
            </div>

            {/* Core Values Pillars */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <Reveal className="luxe-card p-5 sm:p-6 border border-border/80 bg-card/60">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-primary flex items-center justify-center mb-3 sm:mb-4">
                  <ShieldCheck className="size-5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">Standardized Grading</h4>
                <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground leading-relaxed">
                  Legitimate, syllabus-compliant Dan black belt rank examinations certified by master examiner boards.
                </p>
              </Reveal>

              <Reveal delay={0.08} className="luxe-card p-5 sm:p-6 border border-border/80 bg-card/60">
                <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 sm:mb-4">
                  <Compass className="size-5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">Ethical Governance</h4>
                <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground leading-relaxed">
                  Transparent selection trials, codified referee guidelines, and anti-doping adherence.
                </p>
              </Reveal>

              <Reveal delay={0.16} className="luxe-card p-5 sm:p-6 border border-border/80 bg-card/60">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 sm:mb-4">
                  <Zap className="size-5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">Grassroots Growth</h4>
                <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground leading-relaxed">
                  Empowering rural and urban clubs across 28+ states with coach workshops and tournament access.
                </p>
              </Reveal>

              <Reveal delay={0.24} className="luxe-card p-5 sm:p-6 border border-border/80 bg-card/60">
                <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 sm:mb-4">
                  <Award className="size-5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">Digital Verification</h4>
                <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground leading-relaxed">
                  Tamper-proof digital certificates, athlete passports, and real-time validation for every member.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Vision & Mission */}
      <section className="section-pad border-t border-border/60 bg-accent/15">
        <div className="shell grid gap-6 lg:grid-cols-2">
          <Reveal className="luxe-card p-6 sm:p-8 lg:p-9 bg-card/80 border border-border/80">
            <div className="size-11 sm:size-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Target className="size-5 sm:size-6" />
            </div>
            <h2 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-bold text-foreground">Our Mission</h2>
            <div className="gold-rule mt-3 sm:mt-4" />
            <p className="text-muted-foreground mt-4 sm:mt-5 text-xs sm:text-sm leading-relaxed">
              To build an empowering, transparent, and structured martial arts and athletic ecosystem across India.
              We are dedicated to providing every aspiring martial artist and athlete with authentic rank certification,
              world-class training seminars, competitive national platforms, and certified coaching pathways that turn talent into championship caliber.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="luxe-card p-6 sm:p-8 lg:p-9 bg-card/80 border border-border/80">
            <div className="size-11 sm:size-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Eye className="size-5 sm:size-6" />
            </div>
            <h2 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-bold text-foreground">Our Vision</h2>
            <div className="gold-rule mt-3 sm:mt-4" />
            <p className="text-muted-foreground mt-4 sm:mt-5 text-xs sm:text-sm leading-relaxed">
              To be India's premier federation recognized globally for excellence in martial arts education, ethical governance,
              inclusive self-defense development for women and youth, and the consistent nurturing of disciplined champions representing India
              with dignity on prestigious international platforms.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5. National Objectives & Key Achievements */}
      <section className="section-pad border-t border-border/60">
        <div className="shell grid gap-8 lg:gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="National Charter" title="Federation Objectives" />
            <ul className="mt-6 sm:mt-10 space-y-3 sm:space-y-4">
              {objectives.map((o, i) => (
                <Reveal key={o} delay={i * 0.05}>
                  <li className="flex gap-2.5 sm:gap-3">
                    <CheckCircle2 className="text-primary mt-0.5 size-4.5 sm:size-5 shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{o}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Key Achievements" title="Growth & Reach Across India" />
            <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((s) => (
                <Reveal key={s.label} className="luxe-card p-4 sm:p-6 border border-border/80 bg-card/60">
                  <Award className="text-primary size-5 sm:size-6" />
                  <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black text-gold-gradient tracking-tight">
                    {s.value}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs tracking-wider uppercase font-semibold">
                    {s.label}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Federation History (Timeline) */}
      <FederationHistory />

      {/* 7. Recognition / Registration Details */}
      <RecognitionDetails />

      {/* 8. Federation Structure: India -> State -> District -> Academy */}
      <div id="structure">
        <FederationStructure />
      </div>

      {/* 9. Official Contact Details & Headquarters Secretariat */}
      <OfficialContactSection />
    </SiteLayout>
  );
}
