"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Edit,
  FileText,
  X,
  Loader2,
  ShieldCheck,
  UserCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { DistrictAccessGate } from "@/components/district-association/DistrictAccessGate";
import { EditRecordModal } from "@/components/district-association/EditRecordModal";
import { extractDistrictFromOption, extractStateFromOption } from "@/lib/club-coach-options";

export default function AffiliatedPlayersPage() {
  const { user } = useAuth();
  const districtScope = user?.district || user?.city || "";
  const stateScope = user?.state || "Maharashtra";

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [viewingPlayer, setViewingPlayer] = useState<any | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/players");
      const json = await res.json().catch(() => ({}));

      if (json?.success && Array.isArray(json.players)) {
        setPlayers(json.players);
      }
    } catch (err) {
      console.error("Failed to load players:", err);
      toast.error("Failed to load affiliated players.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for active players strictly belonging to this district
  const districtActivePlayers = useMemo(() => {
    const targetDistrict = extractDistrictFromOption(districtScope).toLowerCase().trim();
    return players.filter((p) => {
      const isPlayerRole =
        !p.memberType ||
        p.memberType === "Player" ||
        p.memberType === "Athlete" ||
        p.role === "Player";
      const pDist = (p.district || p.city || "").toLowerCase().trim();
      const pDistClean = extractDistrictFromOption(p.district || p.city || "").toLowerCase().trim();
      const matchDistrict = !targetDistrict || pDistClean === targetDistrict || pDist === targetDistrict;
      // Active players: status is Active or Verified or Approved
      const isActive =
        p.status === "Active" ||
        p.status === "Verified" ||
        p.status === "Approved";
      return isPlayerRole && matchDistrict && isActive;
    });
  }, [players, districtScope]);

  const filteredPlayers = useMemo(() => {
    return districtActivePlayers.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.discipline && p.discipline.toLowerCase().includes(q)) ||
        (p.club && p.club.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      return matchQuery;
    });
  }, [districtActivePlayers, searchQuery]);

  const handleDeletePlayer = async (player: any) => {
    if (!confirm(`Are you sure you want to delete player "${player.name}" (${player.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete player.");
      }

      toast.success(`Player "${player.name}" deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete player.");
    }
  };

  return (
    <DistrictAccessGate
      pageTitle="Affiliated Player List"
      pageSubtitle={`Official registry of active players and competitors in ${districtScope || "your district"}.`}
      badge="District Association Unit"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <UserCheck className="size-3.5" /> District Unit: {districtScope || "Jurisdiction"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Affiliated Player List</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Official recognized registry of active athletes, players, and practitioners registered under <strong className="text-amber-400">{districtScope}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh Roster
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="luxe-card p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search active player by name, ID, discipline, academy, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background/80 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Player Roster Table */}
        <div className="luxe-card rounded-2xl border border-border/80 overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/90 text-stone-300 font-bold uppercase tracking-wider text-[11px] border-b border-border/80">
                <tr>
                  <th className="py-3.5 px-4">Athlete Name / ID</th>
                  <th className="py-3.5 px-4">Discipline &amp; Belt</th>
                  <th className="py-3.5 px-4">Affiliated Academy / Club</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-stone-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-6 animate-spin text-amber-400" />
                        <span className="text-xs text-muted-foreground">Loading active athletes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="size-8 text-amber-400/60" />
                        <p className="font-semibold text-sm text-foreground">No Affiliated Players Found</p>
                        <p className="text-xs text-stone-400 max-w-sm">
                          {searchQuery
                            ? "No athlete records match your search query."
                            : `No active athletes are currently registered in ${districtScope || "this district"}.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-stone-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                            {player.image || player.photo ? (
                              <img src={player.image || player.photo} alt={player.name} className="size-full object-cover" />
                            ) : (
                              <UserCheck className="size-4 text-amber-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-xs">{player.name}</p>
                            <p className="font-mono text-[10px] text-amber-400">{player.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{player.discipline || "Kalawar Martial Arts"}</p>
                          <p className="text-[10px] text-muted-foreground">{player.beltRank || player.category || "Athlete"}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-foreground font-semibold">{player.club || player.academy || "Independent"}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <Check className="size-3" /> Active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-300">
                        <div>
                          <p className="text-xs font-medium text-foreground">{player.phone || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{player.email || "—"}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                          <MapPin className="size-3 text-amber-400 shrink-0" />
                          <span>{player.district || districtScope}, {player.state || stateScope}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Action */}
                          <button
                            type="button"
                            onClick={() => setViewingPlayer(player)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Edit Action */}
                          <button
                            type="button"
                            onClick={() => setEditingPlayer(player)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="size-3.5" />
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(player)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-800 transition cursor-pointer"
                            title="Delete Player"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW DETAILS MODAL */}
        {viewingPlayer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="luxe-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    <UserCheck className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{viewingPlayer.name}</h3>
                    <p className="text-xs font-mono text-amber-400">{viewingPlayer.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPlayer(null)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-900 hover:bg-stone-800 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Discipline</span>
                  <p className="font-bold text-foreground">{viewingPlayer.discipline || "Kalawar Martial Arts"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Belt Rank / Category</span>
                  <p className="font-bold text-foreground">{viewingPlayer.beltRank || viewingPlayer.category || "Athlete"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Assigned Club / Dojo</span>
                  <p className="font-bold text-foreground">{viewingPlayer.club || viewingPlayer.academy || "Independent"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Assigned Coach</span>
                  <p className="font-bold text-foreground">{viewingPlayer.coachName || viewingPlayer.assignedCoach || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Phone</span>
                  <p className="font-bold text-foreground">{viewingPlayer.phone || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Email</span>
                  <p className="font-bold text-foreground">{viewingPlayer.email || "—"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">District &amp; State</span>
                  <p className="font-bold text-foreground">{viewingPlayer.district || districtScope}, {viewingPlayer.state || stateScope}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                  <span className="text-stone-400">Status</span>
                  <p className="font-bold text-emerald-400">{viewingPlayer.status || "Active"}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingPlayer(null)}
                  className="px-5 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT RECORD MODAL */}
        <EditRecordModal
          isOpen={Boolean(editingPlayer)}
          onClose={() => setEditingPlayer(null)}
          recordType="player"
          record={editingPlayer}
          stateScope={stateScope}
          onSaved={loadData}
        />
      </div>
    </DistrictAccessGate>
  );
}
