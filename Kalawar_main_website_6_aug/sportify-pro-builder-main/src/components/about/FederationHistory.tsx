"use client";

import { Calendar, Award, Trophy, Users, ShieldCheck, Flag } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";

const historyMilestones = [
  {
    year: "2018",
    title: "Inception & Foundational Vision",
    icon: Flag,
    description:
      "Founded by Mr. Santosh Uddhav Kasabe with a visionary charter to unite martial arts academies, standardize Dan ranks, and create legitimate athletic pathways for Indian youth.",
    highlight: "Registered as a national non-profit sports development body",
  },
  {
    year: "2020",
    title: "Multi-State Expansion & Standardized Dan Syllabus",
    icon: ShieldCheck,
    description:
      "Formulated the standardized national black belt grading curriculum across traditional and modern disciplines. Expanded presence to 12 state chapters with certified examiner panels.",
    highlight: "1st National Technical Board convened",
  },
  {
    year: "2022",
    title: "Inaugural All-India Championship & Referee Clinics",
    icon: Trophy,
    description:
      "Successfully organized the inaugural All-India National Martial Arts & Multi-Sport Championship with over 2,500 athletes. Launched national referee and judge accreditation clinics.",
    highlight: "Over 2,500 competitor entries",
  },
  {
    year: "2024",
    title: "Digital Accreditation & Online Verification Portal",
    icon: Award,
    description:
      "Pioneered QR-coded digital certificate issuance, online player & club affiliations, and real-time tournament management software ensuring 100% credential transparency.",
    highlight: "Zero counterfeit certificate integrity system",
  },
  {
    year: "2026",
    title: "Nationwide Movement Across 28+ States",
    icon: Users,
    description:
      "Today, KALAWAR Sports & Martial Arts Federation of India governs units across 28+ states, certifying over 850 black belts, supporting 150+ dojos, and empowering 25,000+ athletes.",
    highlight: "Active across all zones of India",
  },
];

export function FederationHistory() {
  return (
    <section className="section-pad border-t border-border/60 bg-gradient-to-b from-card/30 via-background to-card/20">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Our Journey of Excellence"
          title="Federation History & Milestones"
          description="From humble grassroots dojos to an all-India athletic federation recognized for martial arts mastery, integrity, and certified coaching."
        />

        <div className="mt-8 sm:mt-14 relative">
          {/* Central spine line for desktop */}
          <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent -translate-x-1/2" />

          <div className="space-y-6 sm:space-y-8 lg:space-y-12">
            {historyMilestones.map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = milestone.icon;

              return (
                <div
                  key={milestone.year}
                  className={`flex flex-col lg:flex-row items-center gap-4 sm:gap-6 ${
                    isEven ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content card */}
                  <div className="w-full lg:w-[46%]">
                    <Reveal delay={idx * 0.08} className="luxe-card p-5 sm:p-7 border border-border/80 hover:border-primary/50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-lg sm:text-2xl font-black text-gold-gradient tracking-tight">
                          {milestone.year}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {milestone.highlight}
                        </span>
                      </div>

                      <h3 className="mt-2.5 sm:mt-3 text-base sm:text-lg font-bold text-foreground">
                        {milestone.title}
                      </h3>
                      <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </Reveal>
                  </div>

                  {/* Center badge icon */}
                  <div className="hidden lg:flex size-11 rounded-full bg-background border-2 border-primary text-primary items-center justify-center shadow-gold shrink-0 z-10">
                    <Icon className="size-5" />
                  </div>

                  {/* Empty counterpart spacer */}
                  <div className="hidden lg:block lg:w-[46%]" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
