"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";

export function RecognitionDetails() {
  const { settings } = useSettings();
  const fedName = settings.federationName || federation.name;

  const recognitionPoints = [
    {
      title: "Legally Registered National Body",
      description:
        "Duly registered under the Indian Societies Registration & Trust Acts as a non-profit apex sports and martial arts promotion organization.",
      badge: "Govt. Compliant",
    },
    {
      title: "Standardized National Dan Grading Authority",
      description:
        "Authorized apex curriculum provider for Black Belt (Dan) grading, Master Instructor licenses, and national referee certifications.",
      badge: "Authentic Dan Ranks",
    },
    {
      title: "Digital QR-Verified Credentials",
      description:
        "All competitor, coaching, and Dan certificates feature cryptographic serials and QR codes instantly verifiable on our national portal.",
      badge: "100% Verifiable",
    },
  ];

  return (
    <section className="section-pad relative overflow-hidden bg-card/40 border-y border-border/60">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="shell relative">
        <SectionHeading
          align="center"
          eyebrow="Government & Legal Accreditation"
          title="Recognition & Registration Details"
          description={`Official credentials, statutory registration, and recognized governing authority of ${fedName}.`}
        />

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {recognitionPoints.map((item, idx) => (
            <Reveal key={item.title} delay={idx * 0.08} className="luxe-card p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-4 sm:mt-5 text-sm sm:text-base font-semibold text-foreground leading-snug">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] text-primary font-medium">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>Statutory Compliance Verified</span>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
