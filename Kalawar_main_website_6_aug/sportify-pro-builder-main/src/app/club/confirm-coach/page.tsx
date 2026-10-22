"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Award,
  Calendar,
  MapPin,
  Shield,
  ArrowRight,
  Sparkles,
  Users,
  AlertTriangle,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import type { Player } from "@/data/people";

export default function ConfirmCoachPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [coaches, setCoaches] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingCoach, setRejectingCoach] = useState<Player | null>(null);

  const clubIdentifier = useMemo(() => {
    if (!user) return "";
    return user.id || user.name || "";
  }, [user]);

  const loadPendingCoaches = useCallback(async () => {
    if (!clubIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/club/coaches?clubId=${encodeURIComponent(user?.id || "")}&clubName=${encodeURIComponent(user?.name || "")}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.pending)) {
        setCoaches(data.pending);
      } else {
        setCoaches([]);
      }
    } catch (err) {
      console.error("Failed to load pending coaches:", err);
      toast.error("Failed to load coach requests");
    } finally {
      setLoading(false);
    }
  }, [clubIdentifier, user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (clubIdentifier) {
      loadPendingCoaches();
    }
  }, [authLoading, isAuthenticated, clubIdentifier, loadPendingCoaches, router]);

  const handleConfirm = async (coach: Player) => {
    try {
      setProcessingId(coach.id);
      const res = await fetch(`/api/club/coaches/${encodeURIComponent(coach.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm coach");
      }

      // Disappear from pending list
      setCoaches((prev) => prev.filter((c) => c.id !== coach.id));
      toast.success("Coach Confirmed Successfully", {
        description: `${coach.name} (${coach.id}) has been confirmed and added to your official roster.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to confirm coach",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (coach: Player) => {
    try {
      setProcessingId(coach.id);
      const res = await fetch(`/api/club/coaches/${encodeURIComponent(coach.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reject coach");
      }

      // Disappear from pending list
      setCoaches((prev) => prev.filter((c) => c.id !== coach.id));
      setRejectingCoach(null);
      toast.info("Coach Affiliation Rejected", {
        description: `${coach.name} affiliation request has been rejected.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to reject coach",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCoaches = useMemo(() => {
    if (!searchQuery.trim()) return coaches;
    const q = searchQuery.toLowerCase();
    return coaches.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.discipline.toLowerCase().includes(q) ||
        (c.qualification && c.qualification.toLowerCase().includes(q)) ||
        (c.specialization && c.specialization.toLowerCase().includes(q))
    );
  }, [coaches, searchQuery]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Club Management Portal"
        title="Confirm Coach Affiliations"
        description="Review credentials and confirm coaches who selected your club or academy during registration. Confirmed coaches will be accredited to your official roster."
        image="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1800&q=80"
      />

      <div className="shell py-8 sm:py-12 space-y-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-3xl bg-card/80 border border-border/80 shadow-md">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Pending Approval Queue</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
                  {coaches.length} {coaches.length === 1 ? "Request" : "Requests"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logged in as <strong className="text-foreground">{user?.name || "Club"}</strong> ({user?.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coach name, sport, ID..."
                className="w-full bg-background/80 border border-border/80 rounded-full pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary outline-none"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadPendingCoaches}
              disabled={loading}
              className="border border-border/80 hover:border-primary/50 bg-card/60 p-2.5 rounded-full text-foreground hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Link to Confirmed Coach List */}
            <Link
              href="/club/coaches"
              className="bg-primary/15 hover:bg-primary hover:text-background text-primary border border-primary/30 px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Users className="size-3.5" />
              <span>Coach List</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Coach Cards Grid */}
        {loading ? (
          <div className="p-16 text-center rounded-3xl border border-border/60 bg-card/40 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Loading pending coach affiliation requests...
            </p>
          </div>
        ) : filteredCoaches.length === 0 ? (
          /* Empty State */
          <div className="p-12 sm:p-16 text-center rounded-3xl border border-border/70 bg-gradient-to-b from-card/80 to-card/40 shadow-xl space-y-4">
            <div className="size-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-extrabold text-foreground">
                {searchQuery ? "No Matching Coach Requests" : "All Coach Requests Reviewed!"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? `No coach requests match "${searchQuery}". Clear your search query to see all pending applications.`
                  : "There are currently no pending coach affiliation requests awaiting your review. All coaches registered with your club have been verified."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/club/coaches"
                className="bg-gold-gradient text-background px-6 py-2.5 rounded-full text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <Users className="size-4" /> View Confirmed Coach Roster
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence>
              {filteredCoaches.map((coach) => (
                <motion.div
                  key={coach.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="luxe-card p-6 rounded-3xl border border-border/80 hover:border-primary/50 transition-all shadow-md flex flex-col justify-between gap-5 relative overflow-hidden"
                >
                  {/* Top Coach Info Header */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="size-16 sm:size-18 rounded-2xl overflow-hidden border-2 border-primary/40 bg-background shrink-0 shadow-sm">
                      {coach.image ? (
                        <img src={coach.image} alt={coach.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                          {coach.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Basic Meta */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                          Awaiting Club Approval
                        </span>
                        <span className="rounded-full bg-accent text-foreground border border-border/80 px-2 py-0.5 text-[10px] font-semibold">
                          {coach.discipline}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-foreground truncate">
                        {coach.name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-primary font-bold">{coach.id}</span>
                        <span>·</span>
                        <span className="truncate">{coach.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coach Credentials & Details */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-accent/20 border border-border/60 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Award className="size-3 text-primary" /> Qualification
                      </span>
                      <p className="font-semibold text-foreground truncate">
                        {coach.qualification || "Certified Coach"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="size-3 text-primary" /> Experience
                      </span>
                      <p className="font-semibold text-foreground">
                        {coach.experienceYears ? `${coach.experienceYears} Years` : "5+ Years"}
                      </p>
                    </div>

                    {coach.specialization && (
                      <div className="space-y-0.5 col-span-2 border-t border-border/40 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Specialization
                        </span>
                        <p className="font-medium text-foreground line-clamp-1">
                          {coach.specialization}
                        </p>
                      </div>
                    )}

                    <div className="space-y-0.5 col-span-2 border-t border-border/40 pt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                      {coach.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3 text-primary" /> {coach.email}
                        </span>
                      )}
                      {coach.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3 text-primary" /> {coach.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Confirm & Reject */}
                  <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                    <button
                      type="button"
                      disabled={processingId === coach.id}
                      onClick={() => handleConfirm(coach)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {processingId === coach.id ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      <span>Confirm Coach</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === coach.id}
                      onClick={() => setRejectingCoach(coach)}
                      className="border border-destructive/40 text-destructive hover:bg-destructive/15 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="size-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Rejection Confirmation Modal */}
      {rejectingCoach && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setRejectingCoach(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-card border border-destructive/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="size-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
              <AlertTriangle className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Reject Coach Affiliation?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to reject the affiliation request from{" "}
                <strong className="text-foreground">{rejectingCoach.name}</strong> ({rejectingCoach.id})? They will be removed from your club queue and converted to Independent Coach status.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCoach(null)}
                className="px-4 py-2 rounded-xl border border-border/80 text-xs font-semibold hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingCoach)}
                className="px-5 py-2 rounded-xl bg-destructive text-white text-xs font-bold shadow-md hover:bg-destructive/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="size-3.5" /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
