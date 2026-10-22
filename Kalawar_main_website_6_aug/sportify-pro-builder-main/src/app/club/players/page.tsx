"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserCheck,
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
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Eye,
  Trash2,
  GraduationCap,
  X,
  Building2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import type { Player } from "@/data/people";

export default function ClubPlayersListPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const clubIdentifier = useMemo(() => {
    if (!user) return "";
    return user.id || user.name || "";
  }, [user]);

  const loadPlayers = useCallback(async () => {
    if (!clubIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/club/players?clubId=${encodeURIComponent(user?.id || "")}&clubName=${encodeURIComponent(user?.name || "")}`
      );
      const data = await res.json();
      if (data.success) {
        setPlayers(Array.isArray(data.confirmed) ? data.confirmed : []);
        setPendingCount(Array.isArray(data.pending) ? data.pending.length : 0);
      } else {
        setPlayers([]);
      }
    } catch (err) {
      console.error("Failed to load club athletes:", err);
      toast.error("Failed to load club athlete roster");
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
      loadPlayers();
    }
  }, [authLoading, isAuthenticated, clubIdentifier, loadPlayers, router]);

  const handleDelete = async (player: Player) => {
    try {
      setDeletingId(player.id);
      const res = await fetch(`/api/club/players/${encodeURIComponent(player.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove athlete from club roster");
      }

      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      setDeletingPlayer(null);
      toast.success("Athlete Removed From Roster", {
        description: `${player.name} (${player.id}) is no longer affiliated with your club.`,
      });
    } catch (err) {
      toast.error("Action Failed", {
        description: err instanceof Error ? err.message : "Failed to remove athlete",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const disciplines = useMemo(() => {
    const list = Array.from(new Set(players.map((p) => p.discipline).filter(Boolean)));
    return ["All", ...list];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.coachName && p.coachName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.beltRank && p.beltRank.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDiscipline =
        selectedDiscipline === "All" || p.discipline === selectedDiscipline;

      return matchesSearch && matchesDiscipline;
    });
  }, [players, searchQuery, selectedDiscipline]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Club Management Portal"
        title="Affiliated Player List"
        description="Comprehensive roster of verified athletes affiliated with your club / academy across all training divisions."
        image="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1800&q=80"
      />

      <div className="section-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-foreground">
                  Official Club Athletes
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                  {players.length} Affiliated
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified member athletes officially representing your club
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Link
                href="/club/confirm-player"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all shadow-sm animate-pulse"
              >
                <UserCheck className="size-4" />
                <span>{pendingCount} Pending Requests</span>
              </Link>
            )}

            <button
              onClick={() => loadPlayers()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/40 hover:bg-accent text-foreground text-xs font-bold border border-border/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Roster</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes by name, member ID, coach, discipline, belt, state..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border/80 focus:border-primary text-sm placeholder:text-muted-foreground/60 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Discipline Selector */}
          {disciplines.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <Filter className="size-4 text-muted-foreground shrink-0 ml-1 hidden sm:block" />
              {disciplines.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDiscipline(d)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDiscipline === d
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="size-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-bold text-foreground">Loading club athlete roster...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlayers.length === 0 && (
          <div className="py-16 px-4 text-center rounded-3xl bg-card border border-dashed border-border/80 space-y-4">
            <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
              <Users className="size-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                {searchQuery || selectedDiscipline !== "All"
                  ? "No Matching Athletes Found"
                  : "No Affiliated Athletes Yet"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery || selectedDiscipline !== "All"
                  ? "Try changing your search terms or discipline filter."
                  : "When athletes register under your club name and you confirm their requests, they will appear here in your official roster."}
              </p>
            </div>
            {pendingCount > 0 && (
              <Link
                href="/club/confirm-player"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition-all"
              >
                <UserCheck className="size-4" />
                <span>Review {pendingCount} Pending Requests</span>
              </Link>
            )}
          </div>
        )}

        {/* Athletes Grid */}
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
                  className="rounded-3xl bg-card border border-border/80 hover:border-emerald-500/40 p-6 flex flex-col justify-between gap-5 transition-all shadow-md group"
                >
                  <div className="space-y-4">
                    {/* Header with Avatar & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
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
                          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                            {player.name}
                          </h3>
                          <p className="text-[11px] font-mono text-muted-foreground">{player.id}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Affiliated
                      </span>
                    </div>

                    {/* Quick Specs Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-accent/20 border border-border/50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Discipline</span>
                        <p className="font-semibold text-foreground text-xs truncate mt-0.5">
                          {player.discipline}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-accent/20 border border-border/50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Belt Rank</span>
                        <p className="font-semibold text-emerald-400 text-xs truncate mt-0.5">
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
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer(player)}
                      className="py-2.5 px-3 rounded-xl bg-accent/30 hover:bg-accent text-foreground text-xs font-bold border border-border/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="size-3.5" />
                      <span>View Profile</span>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === player.id}
                      onClick={() => setDeletingPlayer(player)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete/Remove Confirmation Dialog */}
      <AnimatePresence>
        {deletingPlayer && (
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
                  <h3 className="text-base font-bold text-foreground">Remove Athlete from Roster?</h3>
                  <p className="text-xs text-muted-foreground">Dissociates athlete from club</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to remove <strong className="text-foreground">{deletingPlayer.name}</strong> ({deletingPlayer.id}) from your club roster? Their affiliation will be set back to Independent.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingPlayer(null)}
                  disabled={deletingId === deletingPlayer.id}
                  className="px-4 py-2 rounded-xl bg-accent text-xs font-bold text-foreground hover:bg-accent/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingPlayer)}
                  disabled={deletingId === deletingPlayer.id}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {deletingId === deletingPlayer.id ? "Removing..." : "Yes, Remove Athlete"}
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
                  <div className="size-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
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
                    <p className="text-xs font-mono text-emerald-400">{selectedPlayer.id}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Official Club Member
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
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Discipline</span>
                  <p className="font-bold text-primary text-sm">{selectedPlayer.discipline}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Belt Rank</span>
                  <p className="font-bold text-emerald-400 text-sm">{selectedPlayer.beltRank || "Standard Division"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Weight Category</span>
                  <p className="font-bold text-foreground text-sm">{selectedPlayer.weightCategory || "Open Category"}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-accent/20 border border-border/60 space-y-1">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Coach / Sensei</span>
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
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlayer;
                    setSelectedPlayer(null);
                    setDeletingPlayer(p);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Remove from Club</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-5 py-2 rounded-xl bg-accent text-xs font-bold text-foreground hover:bg-accent/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
