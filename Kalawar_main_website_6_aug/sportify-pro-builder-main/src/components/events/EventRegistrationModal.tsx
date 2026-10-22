"use client";

import { useState } from "react";
import {
  X,
  Trophy,
  Calendar,
  MapPin,
  Send,
  User,
  Mail,
  Phone,
  Building2,
  Medal,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import type { SportEvent } from "@/data/events";
import { formatEventDisplayDate } from "@/lib/utils";

interface EventRegistrationModalProps {
  event: SportEvent;
  isOpen: boolean;
  onClose: () => void;
  defaultDivision?: string;
}

export function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  defaultDivision = "",
}: EventRegistrationModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [academyName, setAcademyName] = useState("");
  const [division, setDivision] = useState(defaultDivision);
  const [beltRank, setBeltRank] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in your full name, email address, and phone number.");
      return;
    }

    try {
      setIsSubmitting(true);

      const notesContent = message.trim() ? `Additional Notes: ${message.trim()}` : "";
      const constructedMessage = [
        `Tournament Registration Request for: ${event.title}`,
        `Event Date: ${formatEventDisplayDate(event.startDate, event.month ? `${event.month} ${event.year}` : "")}`,
        `Location: ${event.venue ? `${event.venue}, ${event.city}` : (event.city || "Official Arena")}`,
        `Athlete Division: ${division.trim() || "Not specified"}`,
        `Belt / Dan Rank: ${beltRank.trim() || "Not specified"}`,
        `Club / Academy / Dojo: ${academyName.trim() || "Independent / Direct Entry"}`,
        notesContent,
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        state: state.trim(),
        district: district.trim(),
        subject: `Event Registration: ${event.title}`,
        category: "Event Registration",
        eventId: event.id,
        eventName: event.title,
        eventDate: event.startDate,
        division: division.trim(),
        beltRank: beltRank.trim(),
        academyName: academyName.trim(),
        tag: `Event: ${event.title}`,
        message: constructedMessage,
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit registration request.");
      }

      const generatedId = data.contact?.id || "KAC-REG";
      setSubmittedRef(generatedId);
      toast.success("Event registration submitted successfully!", {
        description: `Your registration reference number is ${generatedId}.`,
      });
    } catch (err: any) {
      console.error("Event registration error:", err);
      toast.error(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedRef(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setState("");
    setDistrict("");
    setAcademyName("");
    setDivision(defaultDivision);
    setBeltRank("");
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/80 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {submittedRef ? (
          /* Success State */
          <div className="py-8 text-center space-y-6">
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold uppercase">
                Reference ID: {submittedRef}
              </span>
              <h3 className="text-2xl font-bold text-foreground font-heading">
                Registration Request Received
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Thank you for applying to participate in <strong>{event.title}</strong>. Your
                entry has been routed directly to the Federation Organizing Secretariat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tournament</span>
                <span className="font-semibold text-foreground">{event.title}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Athlete Name</span>
                <span className="font-semibold text-foreground">{fullName}</span>
              </div>
              {division && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Division</span>
                  <span className="font-semibold text-foreground">{division}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Status</span>
                <span className="font-bold text-amber-400">Under Review</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition-all"
              >
                Close &amp; Back to Event
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                <Trophy className="size-3.5" /> Official Tournament Entry
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading">
                Register for {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="size-3.5 text-primary" />
                  {formatEventDisplayDate(
                    event.startDate,
                    event.month ? `${event.month} ${event.year}` : ""
                  )}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5 text-primary" />
                  {event.venue ? `${event.venue}, ${event.city}` : (event.city || "Official Tournament Arena")}
                </span>
                {event.tier && (
                  <span className="px-2 py-0.5 rounded-md bg-accent/40 text-foreground font-semibold">
                    {event.tier}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <User className="size-3 text-primary" /> Athlete / Coach Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Mail className="size-3 text-primary" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Phone className="size-3 text-primary" /> Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <MapPin className="size-3 text-primary" /> State / UT
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* District / City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Building2 className="size-3 text-primary" /> City / District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Club / Academy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Building2 className="size-3 text-primary" /> Club / Dojo / Academy
                  </label>
                  <input
                    type="text"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    placeholder="e.g. Pune Warriors Club"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Division */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Trophy className="size-3 text-primary" /> Division / Weight Class
                  </label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="e.g. Senior Kumite -75kg"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Belt Rank */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Award className="size-3 text-primary" /> Belt / Dan Rank
                  </label>
                  <input
                    type="text"
                    value={beltRank}
                    onChange={(e) => setBeltRank(e.target.value)}
                    placeholder="e.g. Black Belt 1st Dan"
                    className="w-full h-10 px-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Message / Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Additional Remarks / Medical Notes / Queries
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mention any specific requirements, coach contact, previous championship records, or questions for the organizing committee..."
                  className="w-full p-3.5 rounded-xl bg-background border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Federation Notice */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upon submission, your application will be verified by the tournament committee.
                  Official fixtures, reporting instructions, and confirmation will be sent to your
                  registered contact details.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-full border border-border/70 hover:bg-accent/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-full bg-gold-gradient text-background font-bold text-xs uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="size-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Submit Event Registration
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
