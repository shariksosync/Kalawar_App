"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Check,
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { StateAccessGate } from "@/components/state-association/StateAccessGate";
import { EditRecordModal } from "@/components/state-association/EditRecordModal";
import { getDistrictsByState } from "@/data/india-districts";
import { extractStateFromOption, extractDistrictFromOption } from "@/lib/club-coach-options";

export default function ConfirmPlayerRequestsPage() {
  const { user } = useAuth();
  const stateScope = user?.state || "Maharashtra";

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Modals
  const [viewingPlayer, setViewingPlayer] = useState<any | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);

  const availableDistricts = useMemo(() => getDistrictsByState(stateScope), [stateScope]);

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
      toast.error("Failed to load player requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter for pending player requests strictly belonging to this state
  const statePlayerRequests = useMemo(() => {
    const targetState = extractStateFromOption(stateScope).toLowerCase().trim();
    return players.filter((p) => {
      // Must be a player (or empty memberType / Athlete)
      const isPlayerRole =
        !p.memberType ||
        p.memberType === "Player" ||
        p.memberType === "Athlete" ||
        p.role === "Player";
      const stateClean = extractStateFromOption(p.state || "").toLowerCase().trim();
      const matchState = stateClean === targetState || (p.state || "").toLowerCase().trim() === targetState;
      // Pending requests: status is Pending or Under Review
      const isPending =
        p.status === "Pending" ||
        p.status === "Under Review" ||
        p.status === "Registered" ||
        !p.status;
      return isPlayerRole && matchState && isPending;
    });
  }, [players, stateScope]);

  const filteredRequests = useMemo(() => {
    return statePlayerRequests.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.discipline && p.discipline.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.club && p.club.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      const distClean = extractDistrictFromOption(p.district || p.city || "").toLowerCase().trim();
      const targetDistClean = extractDistrictFromOption(selectedDistrict).toLowerCase().trim();
      const matchDist =
        selectedDistrict === "All" ||
        distClean === targetDistClean ||
        (p.district || p.city || "").toLowerCase().trim() === selectedDistrict.toLowerCase().trim();

      return matchQuery && matchDist;
    });
  }, [statePlayerRequests, searchQuery, selectedDistrict]);

  const handleApprovePlayer = async (player: any) => {
    try {
      setApprovingId(player.id);
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to approve player.");
      }

      toast.success(`Player ${player.name} Approved!`, {
        description: `Status updated to Active. Player moved to Affiliated Player List.`,
      });

      await loadData();
    } catch (err: any) {
      console.error("Approve player error:", err);
      toast.error(err.message || "Failed to approve player.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeletePlayer = async (player: any) => {
    if (!confirm(`Are you sure you want to delete player request for "${player.name}" (${player.id})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/players/${encodeURIComponent(player.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete player request.");
      }

      toast.success(`Player request for ${player.name} deleted.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete player request.");
    }
  };

  return (
    <StateAccessGate>
      <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 lg:p-8">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Confirm Player Requests</h1>
                  <p className="text-sm text-stone-400">
                    Review and approve player registrations under <span className="text-amber-400 font-bold">{stateScope}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-200 flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
                <span>Refresh Requests</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player name, ID, club, phone, belt..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-500 focus:border-amber-400 outline-none"
              />
            </div>

            {/* District Filter */}
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="All">All Districts ({availableDistricts.length})</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-semibold">Loading player requests for {stateScope}...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 bg-stone-800/80 rounded-2xl text-stone-500">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Pending Player Requests</h3>
                <p className="text-xs text-stone-400 max-w-md">
                  There are no unapproved player requests matching your filter criteria in {stateScope}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 whitespace-nowrap">Player ID &amp; Name</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Discipline &amp; Belt Rank</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Club / Academy</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">District &amp; State</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {filteredRequests.map((player) => (
                      <tr key={player.id} className="hover:bg-stone-800/30 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {player.image || player.photo ? (
                              <img
                                src={player.image || player.photo}
                                alt={player.name}
                                className="w-9 h-9 rounded-full object-cover border border-stone-800 bg-stone-900 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 flex-shrink-0 font-bold">
                                {player.name?.charAt(0) || "P"}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-sm">{player.name}</div>
                              <div className="text-[11px] text-stone-400 font-mono">{player.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-white font-semibold">{player.discipline || "Martial Arts"}</div>
                          <div className="text-amber-400 text-[11px] font-bold mt-0.5">
                            {player.beltRank || player.category || "White Belt"}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-stone-200 font-medium">{player.club || "Independent"}</div>
                          <div className="text-stone-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-500" />
                            <span>{player.phone || "No phone"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-stone-200 font-medium">{player.district || player.city || "N/A"}</div>
                          <div className="text-[11px] text-amber-400/80 font-bold">{player.state}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            <span>{player.status || "Pending"}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {/* View */}
                            <button
                              onClick={() => setViewingPlayer(player)}
                              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                              title="View Player Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Details */}
                            <button
                              onClick={() => setEditingPlayer(player)}
                              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 transition"
                              title="Edit Player Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve */}
                            <button
                              onClick={() => handleApprovePlayer(player)}
                              disabled={approvingId === player.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                              title="Approve Player"
                            >
                              {approvingId === player.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeletePlayer(player)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                              title="Delete Player Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* View Modal */}
        {viewingPlayer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{viewingPlayer.name}</h3>
                    <p className="text-xs text-stone-400 font-mono">ID: {viewingPlayer.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPlayer(null)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Discipline</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.discipline || "Martial Arts"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Belt Rank / Category</span>
                  <span className="text-amber-400 font-semibold">{viewingPlayer.beltRank || viewingPlayer.category || "White Belt"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Club / Academy</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.club || "Independent"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Location</span>
                  <span className="text-stone-200 font-semibold">
                    {viewingPlayer.district || viewingPlayer.city || "N/A"}, {viewingPlayer.state}
                  </span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Date of Birth</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.dob || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Gender</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.gender || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Email</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.email || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 font-bold block">Contact Phone</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.phone || "N/A"}</span>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1 sm:col-span-2">
                  <span className="text-stone-500 font-bold block">Residential Address</span>
                  <span className="text-stone-200 font-semibold">{viewingPlayer.address || "N/A"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-800">
                <button
                  onClick={() => setViewingPlayer(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingPlayer && (
          <EditRecordModal
            isOpen={Boolean(editingPlayer)}
            onClose={() => setEditingPlayer(null)}
            record={editingPlayer}
            recordType="player"
            onSuccess={() => {
              setEditingPlayer(null);
              loadData();
            }}
          />
        )}
      </div>
    </StateAccessGate>
  );
}
