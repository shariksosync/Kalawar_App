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
  Eye,
  GraduationCap,
  X,
  Dumbbell,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import type { Player } from "@/data/people";
import { formatMemberType } from "@/lib/utils";

export default function ConfirmPlayerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingPlayer, setRejectingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const coachIdentifier = useMemo(() => {
    if (!user) return "";
    return user.id || user.name || "";
  }, [user]);

  const loadPendingPlayers = useCallback(async () => {
    if (!coachIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/coach/players?coachId=${encodeURIComponent(user?.id || "")}&coachName=${encodeURIComponent(user?.name || "")}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.pending)) {
        setPlayers(data.pending);
      } else {
        setPlayers([]);
      }
    } catch (err) {
      console.error("Failed to load pending players:", err);
      toast.error("Failed to load athlete requests");
    } finally {
      setLoading(false);
    }
  }, [coachIdentifier, user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (coachIdentifier) {
      loadPendingPlayers();
    }
  }, [authLoading, isAuthenticated, coachIdentifier, loadPendingPlayers, router]);

  const handleConfirm = async (player: Player) => {
    try {
      setProcessingId(player.id);
      const res = await fetch(`/api/coach/players/${encodeURIComponent(player.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm athlete");
      }

      // Disappear from pending list
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      toast.success("Athlete Confirmed Successfully", {
        description: `${player.name} (${player.id}) has been confirmed and added to your official coaching roster.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to confirm athlete",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (player: Player) => {
    try {
      setProcessingId(player.id);
      const res = await fetch(`/api/coach/players/${encodeURIComponent(player.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reject athlete request");
      }

      // Disappear from pending list
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      setRejectingPlayer(null);
      toast.info("Request Rejected", {
        description: `${player.name}'s coaching affiliation request has been declined.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to reject request",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const q = searchQuery.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.discipline && p.discipline.toLowerCase().includes(q)) ||
        (p.beltRank && p.beltRank.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.club && p.club.toLowerCase().includes(q))
    );
  }, [players, searchQuery]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Coach Management Portal"
        title="Confirm Athlete Requests"
        description="Review, authenticate, and officially confirm athletes & students registered under your mentorship."
        image="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1800&q=80"
      />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-card/60 border border-border/80 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-gold">
              <UserCheck className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>Pending Approvals</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  {players.length} Pending
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Mentor: <span className="font-semibold text-foreground">{user?.name}</span> ({user?.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/coach/players"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border/70 transition-colors shadow-sm"
            >
              <Users className="size-4 text-emerald-400" />
              <span>View Confirmed Athlete Roster</span>
            </Link>
            <button
              onClick={loadPendingPlayers}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:border-primary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {players.length > 0 && (
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by athlete name, ID, discipline, belt, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">Checking for pending athlete registrations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && players.length === 0 && (
          <div className="text-center py-16 px-4 bg-card/40 border border-border/70 rounded-3xl backdrop-blur-sm max-w-2xl mx-auto space-y-5">
            <div className="size-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">No Pending Athlete Requests</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All athletes who selected you as their official coach have been reviewed. New registration requests will appear here automatically.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/coach/players"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity"
              >
                <Users className="size-4" />
                <span>Go to Confirmed Athlete List</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* No Results from search */}
        {!loading && players.length > 0 && filteredPlayers.length === 0 && (
          <div className="text-center py-12 bg-card/30 border border-border/60 rounded-2xl">
            <Search className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">No matching athletes found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
          </div>
        )}

        {/* Pending Athletes Grid */}
        {!loading && filteredPlayers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPlayers.map((player) => {
                const isProcessing = processingId === player.id;
                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all flex flex-col justify-between gap-5 shadow-lg group relative overflow-hidden"
                  >
                    {/* Top Status Stripe */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-500" />

                    {/* Athlete Basic Info */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0 relative flex items-center justify-center font-black text-primary text-base group-hover:border-primary/50 transition-colors">
                          {player.image && !player.image.includes("1500648767791-00dcc994a43e") && !player.image.includes("avatar-1.jpg") ? (
                            <img
                              src={player.image}
                              alt={player.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            player.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <Clock className="size-2.5" /> Pending Confirmation
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground truncate mt-1 group-hover:text-primary transition-colors">
                            {player.name}
                          </h3>
                          <p className="text-xs font-mono font-bold text-gold-gradient tracking-wide">
                            {player.id}
                          </p>
                        </div>
                      </div>

                      {/* Details Badges */}
                      <div className="text-xs">
                        <div className="p-2.5 rounded-xl bg-accent/30 border border-border/50">
                          <span className="text-[10px] text-muted-foreground block font-medium">Belt / Category</span>
                          <span className="font-bold text-foreground truncate block">
                            {player.beltRank || player.weightCategory || "Athlete"}
                          </span>
                        </div>
                      </div>

                      {/* Meta Information List */}
                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                        {player.state && (
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{player.city ? `${player.city}, ` : ""}{player.state}</span>
                          </div>
                        )}
                        {player.club && player.club !== "Independent" && (
                          <div className="flex items-center gap-2">
                            <Building2 className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{player.club}</span>
                          </div>
                        )}
                        {player.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="size-3.5 text-primary shrink-0" />
                            <span className="font-mono text-[11px] truncate">{player.phone}</span>
                          </div>
                        )}
                        {player.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{player.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(player)}
                        className="w-full py-1.5 rounded-xl bg-accent/50 hover:bg-accent text-foreground text-xs font-semibold border border-border/60 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="size-3.5 text-muted-foreground" />
                        <span>View Full Athlete Profile</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectingPlayer(player)}
                          disabled={isProcessing}
                          className="py-2.5 px-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirm(player)}
                          disabled={isProcessing}
                          className="py-2.5 px-3 rounded-xl bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          <span>Confirm</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Athlete Full Profile Details Modal */}
        <AnimatePresence>
          {selectedPlayer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-card border border-border/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center font-black text-primary text-base">
                      {selectedPlayer.image && !selectedPlayer.image.includes("1500648767791-00dcc994a43e") && !selectedPlayer.image.includes("avatar-1.jpg") ? (
                        <img
                          src={selectedPlayer.image}
                          alt={selectedPlayer.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        selectedPlayer.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{selectedPlayer.name}</h3>
                      <p className="text-xs font-mono font-bold text-gold-gradient">{selectedPlayer.id}</p>
                      <p className="text-xs text-muted-foreground">{formatMemberType(selectedPlayer.memberType || "Athlete")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="size-8 rounded-full bg-accent hover:bg-accent/80 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Belt / Weight Class</span>
                    <p className="font-bold text-foreground text-sm">{selectedPlayer.beltRank || selectedPlayer.weightCategory || "—"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Affiliated Club</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.club || "Independent"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Assigned Coach</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.coachName || "—"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Phone Number</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.phone || "—"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Email Address</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.email || "—"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Date of Birth & Age</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.dob || "—"} ({selectedPlayer.age || "—"} yrs)</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Gender & Blood Group</span>
                    <p className="font-semibold text-foreground">{selectedPlayer.gender || "—"} · {selectedPlayer.bloodGroup || "—"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1 sm:col-span-2">
                    <span className="text-[11px] text-muted-foreground font-semibold">Address & State</span>
                    <p className="font-semibold text-foreground">
                      {[selectedPlayer.address, selectedPlayer.city, selectedPlayer.state, selectedPlayer.pincode].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  {selectedPlayer.emergencyContact && (
                    <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 space-y-1 sm:col-span-2">
                      <span className="text-[11px] text-muted-foreground font-semibold">Emergency Contact</span>
                      <p className="font-semibold text-foreground">{selectedPlayer.emergencyContact}</p>
                    </div>
                  )}
                </div>

                {/* Academic & Training History if present */}
                {selectedPlayer.academicHistory && selectedPlayer.academicHistory.length > 0 && (
                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <GraduationCap className="size-4 text-primary" /> Academic &amp; Dojo Training History
                    </h4>
                    <div className="space-y-2">
                      {selectedPlayer.academicHistory.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-accent/20 border border-border/50 text-xs">
                          <p className="font-bold text-foreground">{item.academy}</p>
                          <p className="text-muted-foreground text-[11px]">{item.degree} {item.fieldOfStudy ? `in ${item.fieldOfStudy}` : ""}</p>
                          <p className="text-primary font-mono text-[10px] mt-0.5">{item.startDate} — {item.endDate || "Present"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedPlayer;
                      setSelectedPlayer(null);
                      setRejectingPlayer(p);
                    }}
                    className="px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-colors"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedPlayer;
                      setSelectedPlayer(null);
                      handleConfirm(p);
                    }}
                    className="px-5 py-2 rounded-xl bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity"
                  >
                    Confirm Athlete
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Reject Confirmation Dialog */}
        <AnimatePresence>
          {rejectingPlayer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-card border border-destructive/40 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
                <div className="size-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
                  <AlertTriangle className="size-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">Reject Athlete Request?</h3>
                  <p className="text-xs text-muted-foreground">
                    Are you sure you want to decline <span className="font-bold text-foreground">{rejectingPlayer.name}</span> ({rejectingPlayer.id}) from your coaching roster?
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingPlayer(null)}
                    className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold border border-border/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(rejectingPlayer)}
                    className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors cursor-pointer shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </section>
    </SiteLayout>
  );
}
