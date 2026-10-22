"use client";

import { useState, useTransition } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Search,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Compass,
  Building2,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  Paperclip,
  X,
  Share2,
  Globe,
  Youtube,
  Instagram,
  Facebook,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Reveal } from "@/components/common/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { states } from "@/data/people";
import { useSettings } from "@/lib/settings-context";
import { federation } from "@/constants/navigation";
import { IMAGES } from "@/data/images";
import { validatePhoneNumber, sanitizePhoneInput } from "@/lib/validation";
import {
  ENQUIRY_CATEGORIES,
  type EnquiryCategory,
  type ContactRequest,
} from "@/types/contact";

// Social links configuration
const OFFICIAL_SOCIALS = [
  {
    name: "WhatsApp",
    icon: MessageCircle,
    color: "from-emerald-500 to-green-600",
    link: `https://wa.me/${federation.whatsappNumber}?text=Hello%20KALAWAR%20Secretariat%2C%20I%20have%20an%20official%20enquiry.`,
    handle: "+91 " + federation.rawPhone1,
    desc: "Fastest response for urgent queries",
  },
  {
    name: "Email Secretariat",
    icon: Mail,
    color: "from-blue-500 to-indigo-600",
    link: `mailto:${federation.email}`,
    handle: federation.email,
    desc: "For official documents & affiliations",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-600",
    link: federation.social.instagram,
    handle: "@kalawar_india",
    desc: "Championship coverage, athlete highlights & alerts",
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "from-red-500 to-rose-600",
    link: federation.social.youtube,
    handle: "@bma_action_universe_1988",
    desc: "Fight highlights, martial arts tutorials & live streams",
  },
  {
    name: "Facebook",
    icon: Facebook,
    color: "from-blue-600 to-cyan-600",
    link: federation.social.facebook,
    handle: "Kalawar Martial Arts",
    desc: "Community announcements, tournaments & events",
  },
];

const CONTACT_FAQS = [
  {
    q: "How long does it take for KALAWAR to respond to my enquiry?",
    a: "Our National Secretariat reviews incoming messages daily. You will typically receive an official response within 24 to 48 working hours. Urgent competition and affiliation queries are prioritized.",
  },
  {
    q: "How can I track the live status of my submitted enquiry?",
    a: "Switch to the 'Track Status' tab above and enter your Enquiry Reference ID (e.g. KAC-ENQ-2026-001) along with your registered mobile number or email. You will see real-time updates and any official administrative replies.",
  },
  {
    q: "Where should I submit academy or club affiliation documents?",
    a: "Select 'Academy / Club Affiliation' from the Enquiry Type dropdown, describe your club facilities and current student strength, and attach your registration documents or instructor certifications.",
  },
  {
    q: "Can I verify my Dan grade or Championship Certificate through this portal?",
    a: "Yes. Choose 'Certificate / ID Verification' in the dropdown and attach a scanned copy or provide your Certificate ID. You can also use our Central Verification Portal at /verify for instant automated lookups.",
  },
  {
    q: "What are the visiting hours for the National Headquarters?",
    a: "Visitors and club delegations are welcome Monday through Saturday between 10:00 AM and 5:00 PM IST. We recommend scheduling an appointment in advance via this contact form or WhatsApp.",
  },
];

export default function ContactPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<"form" | "track">("form");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;
  const fedMapUrl = settings.googleMapsUrl || (federation as any).googleMapsUrl || "https://share.google/31PQfjzetEDIADnHy";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="National Secretariat & Communications"
        title="📞 CONTACT KALAWAR"
        description="Connect with KALAWAR Sports & Martial Arts Federation of India. Submit official enquiries, affiliation queries, event support, or track your live request status."
        image={IMAGES.stadiumNight}
      />

      {/* Quick Action Ribbon */}
      <section className="relative -mt-6 sm:-mt-8 z-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 xl:gap-4">
          <a
            href={`tel:${fedPhone.replace(/[^0-9+]/g, "")}`}
            className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 p-3 sm:p-3.5 xl:p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg hover:border-primary/50 hover:shadow-primary/10 transition-all group min-w-0"
          >
            <div className="size-8 sm:size-8.5 xl:size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Phone className="size-4 sm:size-4.5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground tracking-wider leading-tight">
                Call Helpline
              </p>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight mt-0.5">
                +91 {federation.rawPhone1}
              </p>
            </div>
          </a>

          <a
            href={`https://wa.me/${federation.whatsappNumber}?text=Hello%20KALAWAR%20Secretariat%2C%20I%20have%20an%20official%20enquiry.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 p-3 sm:p-3.5 xl:p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all group min-w-0"
          >
            <div className="size-8 sm:size-8.5 xl:size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <MessageCircle className="size-4 sm:size-4.5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground tracking-wider leading-tight">
                WhatsApp Desk
              </p>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight mt-0.5">
                +91 {federation.whatsappNumber}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${fedEmail}`}
            className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 p-3 sm:p-3.5 xl:p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all group min-w-0"
          >
            <div className="size-8 sm:size-8.5 xl:size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Mail className="size-4 sm:size-4.5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground tracking-wider leading-tight">
                Official Email
              </p>
              <p
                className="text-xs sm:text-xs lg:text-[10.5px] xl:text-[11.5px] 2xl:text-xs font-bold text-foreground whitespace-nowrap tracking-tight leading-tight mt-0.5"
                title={fedEmail}
              >
                {fedEmail}
              </p>
            </div>
          </a>

          <a
            href={fedMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 p-3 sm:p-3.5 xl:p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all group min-w-0"
          >
            <div className="size-8 sm:size-8.5 xl:size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <MapPin className="size-4 sm:size-4.5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground tracking-wider leading-tight">
                  HQ Location
                </p>
                <ExternalLink className="size-3 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground break-words leading-tight mt-0.5 group-hover:text-amber-400 transition-colors">
                Maharashtra, India
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Main Dual Tab Section */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          
          {/* Tab Selector */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="w-full sm:w-auto inline-flex flex-col sm:flex-row p-1 sm:p-1.5 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-md shadow-md gap-1 sm:gap-0">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "form"
                    ? "bg-gold-gradient text-background shadow-gold font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Send className="size-3.5 sm:size-4 shrink-0" />
                <span>Submit Official Enquiry</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("track")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "track"
                    ? "bg-gold-gradient text-background shadow-gold font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="size-3.5 sm:size-4 shrink-0" />
                <span>Track Enquiry Status</span>
              </button>
            </div>
          </div>

          {activeTab === "form" ? (
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Official Federation Info Card */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-5 sm:p-7 shadow-xl">
                  <div className="flex items-center gap-3 pb-4 sm:pb-5 border-b border-border/60">
                    <div className="size-11 sm:size-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="size-5 sm:size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base lg:text-lg text-foreground leading-snug">
                        {fedName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-primary font-bold">
                        National Governing Body
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 text-xs sm:text-sm">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Registered Office
                        </p>
                        <p className="font-semibold text-foreground mt-0.5 leading-relaxed break-words">
                          {fedAddress}, India
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                        <Mail className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Secretariat Email
                        </p>
                        <a
                          href={`mailto:${fedEmail}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors block break-all mt-0.5 text-xs sm:text-sm"
                          title={fedEmail}
                        >
                          {fedEmail}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                        <Phone className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Helpdesk Numbers
                        </p>
                        <div className="space-y-0.5 mt-0.5 font-semibold text-foreground">
                          <p>+91 {federation.rawPhone1} (Helpline 1)</p>
                          <p>+91 {federation.rawPhone2} (Helpline 2)</p>
                        </div>
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                        <Clock className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Working Hours
                        </p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {federation.hours}
                        </p>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">
                          Sunday &amp; Public Holidays: Closed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Banner */}
                  <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <ShieldCheck className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Official Verification Notice</p>
                      <p className="text-[10.5px] sm:text-[11px] text-muted-foreground leading-snug mt-0.5">
                        All communications from this portal are stamped with an authentic KALAWAR reference code.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response SLA Card */}
                <div className="rounded-3xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-md flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Standard Response SLA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Average reply time: <span className="font-bold text-emerald-400">within 24-48 hours</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: 11-Category Contact Form */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur-md p-5 sm:p-8 shadow-xl">
                  <div className="mb-5 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      Submit Official Enquiry
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Fill out the form below. Your request will be routed directly to the appropriate federation division.
                    </p>
                  </div>

                  <OfficialContactForm onSwitchToTrack={() => setActiveTab("track")} />
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Live Enquiry Status Tracker */
            <div className="max-w-3xl mx-auto">
              <EnquiryStatusTracker />
            </div>
          )}

        </div>
      </section>

      {/* Google Map Section */}
      <section id="google-map" className="py-10 sm:py-14 bg-card/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Headquarters Location</p>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                Find KALAWAR National Office
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {fedAddress}, Maharashtra, India
              </p>
            </div>
            <a
              href={fedMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient text-background text-xs sm:text-sm font-bold shadow-gold hover:opacity-90 transition-all shrink-0 w-full sm:w-auto"
            >
              <Compass className="size-4" />
              <span>Get Driving Directions</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border/80 shadow-2xl h-72 sm:h-96 relative bg-muted/40">
            <iframe
              title="KALAWAR National Headquarters Map"
              src="https://maps.google.com/maps?q=KALAWAR+Sports+%26+Martial+Arts+Federation+of+India&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full grayscale contrast-125 opacity-90 hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3.5 sm:p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="size-8 sm:size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Visiting Instructions</p>
                  <p className="text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Appointments recommended. Bring official photo ID at registration reception.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Social Media Channels */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Stay Connected"
            title="Official Digital Channels"
            description="Follow KALAWAR across official social networks for live tournament streams, rankings updates, and official press releases."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 mt-8 sm:mt-10">
            {OFFICIAL_SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl sm:rounded-3xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 sm:p-5 hover:border-primary/50 hover:shadow-xl transition-all group flex items-start gap-3.5 sm:gap-4"
                >
                  <div
                    className={`size-11 sm:size-12 rounded-2xl bg-gradient-to-br ${social.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="size-5 sm:size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {social.name}
                      </h4>
                      <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-xs font-medium text-primary mt-0.5 break-all">
                      {social.handle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {social.desc}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-10 sm:py-16 border-t border-border/60 bg-card/20">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Secretariat Helpdesk"
            title="Frequently Asked Questions"
          />
          <Accordion type="single" collapsible className="mt-6 sm:mt-8 space-y-3">
            {CONTACT_FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border/70 rounded-2xl bg-card/60 px-4 sm:px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left text-xs sm:text-sm md:text-base font-semibold hover:no-underline py-3.5 sm:py-4">
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
   COMPONENT: 11-Category Contact Form
   ========================================================================= */
function OfficialContactForm({ onSwitchToTrack }: { onSwitchToTrack: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    district: "",
    category: "General Enquiry" as EnquiryCategory,
    subject: "",
    message: "",
  });

  const [attachment, setAttachment] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<ContactRequest | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit. Please upload a file under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result as string,
        size: file.size,
      });
      toast.success(`Attached ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneValidation = validatePhoneNumber(formData.phone, {
        required: true,
        fieldName: "Contact phone number",
      });
      if (!phoneValidation.isValid) {
        toast.error("Invalid Phone Number", {
          description: phoneValidation.error,
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        attachments: attachment ? [attachment.url] : [],
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit official enquiry.");
      }

      setSubmittedEnquiry(data.contact);
      toast.success("Enquiry Registered Successfully!", {
        description: `Reference ID: ${data.contact?.id}`,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        state: "",
        district: "",
        category: "General Enquiry",
        subject: "",
        message: "",
      });
      setAttachment(null);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Submission Failed", {
        description:
          err instanceof Error
            ? err.message
            : "Please check your network and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRefId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Enquiry ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2500);
  };

  if (submittedEnquiry) {
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-8 text-center animate-in fade-in duration-300">
        <div className="size-14 sm:size-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="size-7 sm:size-8" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-foreground">
          Enquiry Registered Successfully!
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2">
          Your enquiry has been logged into the National Secretariat Management System. Please save your reference ID for live status tracking.
        </p>

        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-card/90 border border-border/80 shadow-md">
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Enquiry Reference ID
            </p>
            <p className="text-base sm:text-lg font-mono font-black text-primary">
              {submittedEnquiry.id}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyRefId(submittedEnquiry.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold transition-all cursor-pointer"
          >
            {copiedId ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>{copiedId ? "Copied" : "Copy ID"}</span>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onSwitchToTrack}
            className="px-6 py-2.5 rounded-full bg-gold-gradient text-background text-xs sm:text-sm font-bold shadow-gold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Search className="size-4" />
            <span>Track Live Status Now</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmittedEnquiry(null)}
            className="px-6 py-2.5 rounded-full border border-border/80 hover:border-primary text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* Name and Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Rahul Sharma"
            className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={16}
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                phone: sanitizePhoneInput(e.target.value),
              }))
            }
            placeholder="e.g. 9876543210 or +91 98765 43210"
            className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Email and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            Official / Personal Email <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="name@example.com"
            className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            Enquiry Category <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as EnquiryCategory,
                }))
              }
              className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer pr-9"
            >
              {ENQUIRY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* State and District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            State / UT
          </label>
          <div className="relative">
            <select
              value={formData.state}
              onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer pr-9"
            >
              <option value="">Select State (Optional)</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              <option value="Other / International">Other / International</option>
            </select>
            <ChevronDown className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            District / City
          </label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
            placeholder="e.g. Pune, Mumbai, Jaipur"
            className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          Subject / Summary <span className="text-rose-500">*</span>
        </label>
        <input
          required
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
          placeholder="e.g. Club Affiliation Application / National Championship Query"
          className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          Detailed Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Please describe your enquiry, requirements, or questions in detail..."
          className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-3 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
        />
      </div>

      {/* Attachment Section */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          Document / ID Attachment{" "}
          <span className="text-muted-foreground font-normal">(Optional, Max 2MB)</span>
        </label>

        {attachment ? (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/80">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">
                {attachment.name}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                ({(attachment.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={removeAttachment}
              className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-border/80 hover:border-primary/50 bg-background/40 hover:bg-background/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
            <Upload className="size-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors text-center">
              Click to upload document or image
            </span>
            <span className="text-[10.5px] text-muted-foreground mt-0.5 text-center">
              Supports PDF, PNG, JPG (e.g. ID card, certificates, registration docs)
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold-gradient text-background py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-gold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="size-4 animate-spin" />
            <span>Submitting Enquiry...</span>
          </>
        ) : (
          <>
            <Send className="size-4" />
            <span>Submit Official Enquiry</span>
          </>
        )}
      </button>
    </form>
  );
}

/* =========================================================================
   COMPONENT: Enquiry Status Tracker (Tab 2)
   ========================================================================= */
function EnquiryStatusTracker() {
  const [trackingId, setTrackingId] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ContactRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim() || !contactInfo.trim()) {
      toast.error("Please enter both Enquiry Reference ID and Mobile/Email.");
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const res = await fetch("/api/contact/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: trackingId.trim(),
          phoneOrEmail: contactInfo.trim(),
          contactInfo: contactInfo.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult(null);
        toast.error(data.error || "No matching enquiry found.");
        return;
      }

      setResult(data.enquiry);
      toast.success("Enquiry Record Located!");
    } catch (err) {
      console.error("Tracking lookup error:", err);
      toast.error("Failed to connect to tracker service.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "Submitted":
        return 1;
      case "Under Review":
        return 2;
      case "Replied":
        return 3;
      case "Closed":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Tracker Card */}
      <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-5 sm:p-8 shadow-xl">
        <div className="text-center max-w-md mx-auto mb-5 sm:mb-6">
          <div className="size-11 sm:size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
            <Search className="size-5 sm:size-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Track Enquiry Status
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Check the live processing status and view official administrative responses using your Reference ID.
          </p>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Enquiry Reference ID <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="e.g. KAC-ENQ-2026-001"
                className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Registered Phone or Email <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. 9876543210 or name@example.com"
                className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-background/80 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold-gradient text-background py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-gold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Searching Records...</span>
              </>
            ) : (
              <>
                <Search className="size-4" />
                <span>Check Live Status</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tracking Result View */}
      {result && (
        <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-5 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">REFERENCE ID:</span>
                <span className="text-sm sm:text-base font-mono font-black text-primary">
                  {result.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submitted on{" "}
                {result.createdAt
                  ? new Date(result.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "long",
                    })
                  : "N/A"}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto bg-primary/10 text-primary border border-primary/20">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span>Status: {result.status}</span>
            </div>
          </div>

          {/* 4-Step Visual Progress Stepper */}
          <div className="py-3 sm:py-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Processing Pipeline
            </p>

            <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center relative">
              {/* Progress Line */}
              <div className="absolute top-3.5 sm:top-4 left-5 sm:left-6 right-5 sm:right-6 h-0.5 bg-border/80 -z-0" />
              <div
                className="absolute top-3.5 sm:top-4 left-5 sm:left-6 h-0.5 bg-primary transition-all duration-500 -z-0"
                style={{
                  width: `${((getStatusStep(result.status) - 1) / 3) * 100}%`,
                }}
              />

              {[
                { step: 1, label: "Submitted" },
                { step: 2, label: "Under Review" },
                { step: 3, label: "Replied" },
                { step: 4, label: "Closed" },
              ].map((s) => {
                const currentStep = getStatusStep(result.status);
                const isPassed = currentStep >= s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div key={s.step} className="flex flex-col items-center z-10">
                    <div
                      className={`size-7 sm:size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-gold-gradient text-background shadow-gold ring-3 ring-primary/20"
                          : "bg-muted text-muted-foreground border border-border/80"
                      }`}
                    >
                      {isPassed ? <Check className="size-3.5 sm:size-4" /> : s.step}
                    </div>
                    <span
                      className={`text-[9.5px] xs:text-[10px] sm:text-xs font-bold mt-1.5 sm:mt-2 leading-tight ${
                        isCurrent
                          ? "text-primary font-black"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enquiry Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs sm:text-sm">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Applicant Name
              </p>
              <p className="font-semibold text-foreground mt-0.5">{result.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Category
              </p>
              <p className="font-semibold text-primary mt-0.5">
                {result.category || "General Enquiry"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Subject
              </p>
              <p className="font-semibold text-foreground mt-0.5">{result.subject}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Location
              </p>
              <p className="font-semibold text-foreground mt-0.5">
                {[result.district, result.state].filter(Boolean).join(", ") || "India"}
              </p>
            </div>
          </div>

          {/* User Message */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Your Submitted Message
            </p>
            <div className="p-4 rounded-2xl bg-card border border-border/70 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result.message}
            </div>
          </div>

          {/* Official Administrative Reply (if present) */}
          {result.adminReply ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="size-5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Official Federation Response
                </h4>
                {result.repliedAt && (
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {new Date(result.repliedAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {result.adminReply}
              </p>
              {result.repliedBy && (
                <p className="text-[11px] font-bold text-primary mt-3">
                  — {result.repliedBy}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Awaiting Official Review</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Our secretariat officers are currently evaluating your enquiry. You will receive an official update shortly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {hasSearched && !isLoading && !result && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="size-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground">No Matching Record Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Please double-check your Enquiry Reference ID (e.g. KAC-ENQ-2026-001) and registered phone or email address.
          </p>
        </div>
      )}
    </div>
  );
}
