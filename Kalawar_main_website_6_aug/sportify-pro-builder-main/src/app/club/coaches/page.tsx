"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Award,
  Calendar,
  MapPin,
  Shield,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  UserCheck,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import type { Player } from "@/data/people";

export default function ClubCoachListPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [coaches, setCoaches] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<Player | null>(null);
  const [deletingCoach, setDeletingCoach] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const clubIdentifier = useMemo(() => {
    if (!user) return "";
    return user.id || user.name || "";
  }, [user]);

  const loadConfirmedCoaches = useCallback(async () => {
    if (!clubIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/club/coaches?clubId=${encodeURIComponent(user?.id || "")}&clubName=${encodeURIComponent(user?.name || "")}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.confirmed)) {
        setCoaches(data.confirmed);
      } else {
        setCoaches([]);
      }
    } catch (err) {
      console.error("Failed to load confirmed coaches:", err);
      toast.error("Failed to load coach list");
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
      loadConfirmedCoaches();
    }
  }, [authLoading, isAuthenticated, clubIdentifier, loadConfirmedCoaches, router]);

  const handleDelete = async (coach: Player) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/club/coaches/${encodeURIComponent(coach.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove coach from club");
      }

      setCoaches((prev) => prev.filter((c) => c.id !== coach.id));
      setDeletingCoach(null);
      toast.success("Coach Removed from Roster", {
        description: `${coach.name} has been dissociated from your club.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to remove coach",
      });
    } finally {
      setIsDeleting(false);
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
        (c.specialization && c.specialization.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }, [coaches, searchQuery]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Club Management Portal"
        title="Official Coach Roster"
        description="View and manage all verified coaching personnel officially confirmed and accredited to your sports club or academy."
        image="https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1800&q=80"
      />

      <div className="shell py-8 sm:py-12 space-y-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-3xl bg-card/80 border border-border/80 shadow-md">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Accredited Coaches</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black">
                  {coaches.length} {coaches.length === 1 ? "Coach" : "Coaches"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official roster for <strong className="text-foreground">{user?.name || "Club"}</strong> ({user?.id})
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
              onClick={loadConfirmedCoaches}
              disabled={loading}
              className="border border-border/80 hover:border-primary/50 bg-card/60 p-2.5 rounded-full text-foreground hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh coach list"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Link to Confirm Coach Queue */}
            <Link
              href="/club/confirm-coach"
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserCheck className="size-3.5" />
              <span>Pending Requests</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Confirmed Coaches Grid */}
        {loading ? (
          <div className="p-16 text-center rounded-3xl border border-border/60 bg-card/40 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Loading confirmed coaches...
            </p>
          </div>
        ) : filteredCoaches.length === 0 ? (
          /* Empty State */
          <div className="p-12 sm:p-16 text-center rounded-3xl border border-border/70 bg-gradient-to-b from-card/80 to-card/40 shadow-xl space-y-4">
            <div className="size-16 rounded-3xl bg-primary/15 border border-primary/30 text-primary mx-auto flex items-center justify-center">
              <Users className="size-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-extrabold text-foreground">
                {searchQuery ? "No Matching Coaches Found" : "No Confirmed Coaches Yet"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? `No accredited coaches match "${searchQuery}". Clear your search query to see all coaches.`
                  : "You have not confirmed any coaches for your club yet. Check your pending requests to review and confirm coaches."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/club/confirm-coach"
                className="bg-gold-gradient text-background px-6 py-2.5 rounded-full text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <UserCheck className="size-4" /> Check Pending Coach Requests
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredCoaches.map((coach) => (
                <motion.div
                  key={coach.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="luxe-card p-6 rounded-3xl border border-border/80 hover:border-emerald-500/50 transition-all shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group"
                >
                  {/* Top Coach Meta */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="size-14 sm:size-16 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-background shrink-0 shadow-sm">
                      {coach.image ? (
                        <img src={coach.image} alt={coach.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
                          {coach.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Basic Meta */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="size-2.5" /> Confirmed
                        </span>
                        <span className="rounded-full bg-accent text-foreground border border-border/80 px-2 py-0.2 text-[10px] font-medium">
                          {coach.discipline}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-foreground truncate">
                        {coach.name}
                      </h3>

                      <p className="font-mono text-primary text-xs font-bold truncate">
                        {coach.id}
                      </p>
                    </div>
                  </div>

                  {/* Coach Credentials & Contact */}
                  <div className="space-y-2.5 p-3.5 rounded-2xl bg-accent/20 border border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Award className="size-3 text-primary" /> Grade / Level
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {coach.qualification || "Certified Coach"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="size-3 text-primary" /> Experience
                      </span>
                      <span className="font-semibold text-foreground">
                        {coach.experienceYears ? `${coach.experienceYears} Years` : "5+ Years"}
                      </span>
                    </div>

                    {coach.specialization && (
                      <div className="border-t border-border/40 pt-2 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Specialization
                        </span>
                        <p className="font-medium text-foreground line-clamp-1">
                          {coach.specialization}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: View Details & Delete */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setSelectedCoach(coach)}
                      className="flex-1 bg-primary/15 hover:bg-primary hover:text-background text-primary font-bold py-2 px-3 rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingCoach(coach)}
                      className="border border-destructive/40 text-destructive hover:bg-destructive/15 font-bold p-2 rounded-xl text-xs transition-colors inline-flex items-center justify-center cursor-pointer"
                      title="Remove coach from club"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* View Coach Details Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setSelectedCoach(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-card border border-primary/30 p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header with Close */}
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-4">
                <div className="size-16 sm:size-20 rounded-2xl overflow-hidden border-2 border-primary/40 bg-background shrink-0">
                  {selectedCoach.image ? (
                    <img src={selectedCoach.image} alt={selectedCoach.name} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                      {selectedCoach.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Confirmed Coach
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-foreground mt-1">
                    {selectedCoach.name}
                  </h3>
                  <p className="font-mono text-xs font-bold text-primary">
                    {selectedCoach.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="p-2 rounded-xl bg-accent/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-accent/20 border border-border/60">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discipline</span>
                  <p className="font-semibold text-foreground mt-0.5">{selectedCoach.discipline}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Region</span>
                  <p className="font-semibold text-foreground mt-0.5">{selectedCoach.state}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qualification Level</span>
                  <p className="font-semibold text-foreground mt-0.5">{selectedCoach.qualification || "Certified Coach"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Experience</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedCoach.experienceYears ? `${selectedCoach.experienceYears} Years` : "5+ Years"}
                  </p>
                </div>
                {selectedCoach.idNumber && (
                  <div className="col-span-2 border-t border-border/40 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">National ID / Passport</span>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{selectedCoach.idNumber}</p>
                  </div>
                )}
              </div>

              {/* Specialization */}
              {selectedCoach.specialization && (
                <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Coaching Specialization &amp; Focus
                  </span>
                  <p className="font-medium text-foreground leading-relaxed">
                    {selectedCoach.specialization}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </span>
                <div className="space-y-1.5 text-xs">
                  {selectedCoach.email && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="size-3.5 text-primary" />
                      <span>{selectedCoach.email}</span>
                    </div>
                  )}
                  {selectedCoach.phone && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="size-3.5 text-primary" />
                      <span>{selectedCoach.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="size-3.5 text-primary" />
                    <span>Registered On: {selectedCoach.registeredOn || "2026"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="bg-gold-gradient text-background px-6 py-2.5 rounded-full text-xs font-bold shadow-gold hover:opacity-95 transition-opacity cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Coach Confirmation Modal */}
      {deletingCoach && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeleting && setDeletingCoach(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-card border border-destructive/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="size-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
              <AlertTriangle className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Remove Coach from Club Roster?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to remove <strong className="text-foreground">{deletingCoach.name}</strong> ({deletingCoach.id}) from your affiliated coaching roster? They will be detached from your club and shifted to Independent Coach status.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCoach(null)}
                className="px-4 py-2 rounded-xl border border-border/80 text-xs font-semibold hover:bg-accent/40 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deletingCoach)}
                className="px-5 py-2 rounded-xl bg-destructive text-white text-xs font-bold shadow-md hover:bg-destructive/90 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                <span>Remove Coach</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
