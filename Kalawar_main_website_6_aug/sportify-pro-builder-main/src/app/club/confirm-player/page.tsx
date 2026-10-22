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

export default function ClubConfirmPlayerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingPlayer, setRejectingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const clubIdentifier = useMemo(() => {
    if (!user) return "";
    return user.id || user.name || "";
  }, [user]);

  const loadPendingPlayers = useCallback(async () => {
    if (!clubIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/club/players?clubId=${encodeURIComponent(user?.id || "")}&clubName=${encodeURIComponent(user?.name || "")}`
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
  }, [clubIdentifier, user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (clubIdentifier) {
      loadPendingPlayers();
    }
  }, [authLoading, isAuthenticated, clubIdentifier, loadPendingPlayers, router]);

  const handleConfirm = async (player: Player) => {
    try {
      setProcessingId(player.id);
      const res = await fetch(`/api/club/players/${encodeURIComponent(player.id)}`, {
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
        description: `${player.name} (${player.id}) has been confirmed and added to your official club roster.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to confirm athlete",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingPlayer) return;
    const playerToReject = rejectingPlayer;
    try {
      setProcessingId(playerToReject.id);
      const res = await fetch(`/api/club/players/${encodeURIComponent(playerToReject.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reject request");
      }

      setPlayers((prev) => prev.filter((p) => p.id !== playerToReject.id));
      setRejectingPlayer(null);
      toast.info("Request Rejected", {
        description: `${playerToReject.name}'s affiliation request has been removed.`,
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
        p.discipline.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        (p.beltRank && p.beltRank.toLowerCase().includes(q))
    );
  }, [players, searchQuery]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Club Management Portal"
        title="Confirm Player Requests"
        description="Review, verify and approve athlete membership applications requesting affiliation with your club / dojo."
        image="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1800&q=80"
      />

      <div className="section-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-foreground">
                  Pending Athlete Requests
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">
                  {players.length} Pending
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Athletes waiting for your club approval to join tournaments & official rosters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadPendingPlayers()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/40 hover:bg-accent text-foreground text-xs font-bold border border-border/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh List</span>
            </button>

            <Link
              href="/club/players"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm"
            >
              <Users className="size-4" />
              <span>View Affiliated Players</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending athletes by name, member ID, discipline, belt rank, or state..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border/80 focus:border-primary text-sm placeholder:text-muted-foreground/60 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="size-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-bold text-foreground">Loading pending athlete requests...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlayers.length === 0 && (
          <div className="py-16 px-4 text-center rounded-3xl bg-card border border-dashed border-border/80 space-y-4">
            <div className="size-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                {searchQuery ? "No Matching Athlete Requests" : "All Clear! No Pending Requests"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? "No pending athlete requests match your search criteria. Try a different query."
                  : "All athlete affiliation requests for your club have been reviewed. When new athletes register under your club name, they will appear here for confirmation."}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-accent text-xs font-bold text-foreground"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Players Cards Grid */}
        {!loading && filteredPlayers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-3xl bg-card border border-border/80 hover:border-amber-500/40 p-6 flex flex-col justify-between gap-5 transition-all shadow-md group"
                >
                  <div className="space-y-4">
                    {/* Header with Avatar & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                          {player.image ? (
                            <img
                              src={player.image}
                              alt={player.name}
                              className="size-full rounded-2xl object-cover"
                            />
                          ) : (
                            player.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {player.name}
                          </h3>
                          <p className="text-[11px] font-mono text-muted-foreground">{player.id}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <Clock className="size-3" /> Pending
                      </span>
                    </div>

                    {/* Quick Specs Badges */}
                    <div className="text-xs">
                      <div className="p-2.5 rounded-xl bg-accent/20 border border-border/50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Belt Rank</span>
                        <p className="font-semibold text-amber-400 text-xs truncate mt-0.5">
                          {player.beltRank || "Standard Division"}
                        </p>
                      </div>
                    </div>

                    {/* Key Info Details */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                      {player.coachName && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">Coach: <strong className="text-foreground">{player.coachName}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{player.city ? `${player.city}, ` : ""}{player.state}</span>
                      </div>
                      {player.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{player.phone}</span>
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

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer(player)}
                      className="w-full py-2 rounded-xl bg-accent/30 hover:bg-accent text-foreground text-xs font-bold border border-border/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="size-3.5" />
                      <span>View Full Athlete Profile</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={processingId === player.id}
                        onClick={() => handleConfirm(player)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <UserCheck className="size-3.5" />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === player.id}
                        onClick={() => setRejectingPlayer(player)}
                        className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <AnimatePresence>
        {rejectingPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-card border border-border p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="size-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reject Player Request?</h3>
                  <p className="text-xs text-muted-foreground">Action cannot be undone automatically</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to reject the affiliation request from{" "}
                <strong className="text-foreground">{rejectingPlayer.name}</strong> ({rejectingPlayer.id})? Their profile club affiliation will be reset to Independent.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPlayer(null)}
                  disabled={processingId === rejectingPlayer.id}
                  className="px-4 py-2 rounded-xl bg-accent text-xs font-bold text-foreground hover:bg-accent/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processingId === rejectingPlayer.id}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {processingId === rejectingPlayer.id ? "Rejecting..." : "Yes, Reject Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Athlete Profile Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-black text-xl">
                    {selectedPlayer.image ? (
                      <img
                        src={selectedPlayer.image}
                        alt={selectedPlayer.name}
                        className="size-full rounded-2xl object-cover"
                      />
                    ) : (
                      selectedPlayer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedPlayer.name}</h3>
                    <p className="text-xs font-mono text-primary">{selectedPlayer.id}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      Pending Club Verification
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="p-2 rounded-xl bg-accent/40 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Grid of Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Current Belt Rank</span>
                  <p className="font-bold text-amber-400 text-sm">{selectedPlayer.beltRank || "White Belt"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Weight Category</span>
                  <p className="font-bold text-foreground text-sm">{selectedPlayer.weightCategory || "Open Category"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Assigned Coach</span>
                  <p className="font-bold text-foreground text-sm">{selectedPlayer.coachName || "Independent"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Date of Birth / Age</span>
                  <p className="font-bold text-foreground text-sm">
                    {selectedPlayer.dob || "N/A"} ({selectedPlayer.age || "N/A"} yrs)
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Gender</span>
                  <p className="font-bold text-foreground text-sm">{selectedPlayer.gender || "Male"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Phone Number</span>
                  <p className="font-bold text-foreground text-sm">{selectedPlayer.phone || "Not provided"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Email Address</span>
                  <p className="font-bold text-foreground text-sm truncate">{selectedPlayer.email || "Not provided"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1 sm:col-span-2">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">State & District</span>
                  <p className="font-bold text-foreground text-sm">
                    {selectedPlayer.city ? `${selectedPlayer.city}, ` : ""}{selectedPlayer.state} {selectedPlayer.pincode ? `(${selectedPlayer.pincode})` : ""}
                  </p>
                </div>

                {selectedPlayer.bio && (
                  <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1 sm:col-span-2">
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Athlete Bio / Statement</span>
                    <p className="text-xs text-foreground/90 italic">{selectedPlayer.bio}</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2 rounded-xl bg-accent text-xs font-bold text-foreground hover:bg-accent/80 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlayer;
                    setSelectedPlayer(null);
                    setRejectingPlayer(p);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
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
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  Confirm Athlete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
