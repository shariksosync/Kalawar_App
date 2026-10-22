"use client";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  ShieldCheck,
  Award,
  ExternalLink,
  Send,
  Building2,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";

export function OfficialContactSection() {
  const { settings } = useSettings();

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;
  const fedMapUrl = settings.googleMapsUrl || (federation as any).googleMapsUrl || "https://share.google/31PQfjzetEDIADnHy";

  return (
    <section id="contact-details" className="section-pad bg-card/40 border-t border-border/60 relative overflow-hidden">
      <div className="shell relative">
        <SectionHeading
          align="center"
          eyebrow="Official Secretariat"
          title="Federation Headquarters & Contact Details"
          description={`Connect directly with the governing secretariat of ${fedName} for affiliations, championships, and credentials.`}
        />

        <div className="mt-8 sm:mt-14 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Address */}
          <Reveal delay={0.05} className="luxe-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="size-10 sm:size-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-4 sm:mb-5">
                <MapPin className="size-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">National Headquarters</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {fedAddress}
              </p>
              <p className="text-[11px] text-primary/80 mt-1 font-medium">Maharashtra, India</p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60">
              <a
                href={fedMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1.5"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </Reveal>

          {/* Card 2: Phone */}
          <Reveal delay={0.1} className="luxe-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="size-10 sm:size-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-4 sm:mb-5">
                <Phone className="size-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Direct Telephones</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Primary Helpline & Secretariat Lines:
              </p>
              <div className="mt-3 space-y-1.5 text-xs font-semibold text-foreground">
                <div>
                  <a
                    href="tel:7083314435"
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span>+91 70833 14435</span>
                  </a>
                </div>
                <div>
                  <a
                    href="tel:9561427125"
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span>+91 95614 27125</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60">
              <a
                href={`https://wa.me/${federation.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                WhatsApp Hotline Available →
              </a>
            </div>
          </Reveal>

          {/* Card 3: Email */}
          <Reveal delay={0.15} className="luxe-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="size-10 sm:size-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-4 sm:mb-5">
                <Mail className="size-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Official Email Desks</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                For administrative, verification, and tournament correspondence:
              </p>
              <div className="mt-3 text-xs font-semibold">
                <a
                  href={`mailto:${fedEmail}`}
                  className="text-primary hover:underline break-all"
                >
                  {fedEmail}
                </a>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Responses within 24-48 hours
              </span>
            </div>
          </Reveal>

          {/* Card 4: Hours */}
          <Reveal delay={0.2} className="luxe-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="size-10 sm:size-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-4 sm:mb-5">
                <Clock className="size-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">Working Hours</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {federation.hours}
              </p>
              <p className="text-[11px] text-muted-foreground mt-2">
                Closed on Sundays & Gazetted National Holidays.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-border/60">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Support Active
              </span>
            </div>
          </Reveal>
        </div>

        {/* Quick Action Routing Bar */}
        <Reveal delay={0.25} className="mt-6 sm:mt-8 luxe-card p-5 sm:p-8 border border-primary/30 bg-gradient-to-r from-card via-accent/20 to-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-foreground">
                Need to Affiliate Your Dojo or Verify Documentation?
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Submit an inquiry directly to the federation secretariat or start your club affiliation online.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
              <a href="/contact" className="btn-luxe px-5 sm:px-6 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto">
                <Send className="size-3.5" /> Submit Official Inquiry
              </a>
              <a
                href="/affiliation"
                className="rounded-full border border-primary/40 bg-background px-4 sm:px-5 py-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-background transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Building2 className="size-3.5" /> Apply for Club Affiliation
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
