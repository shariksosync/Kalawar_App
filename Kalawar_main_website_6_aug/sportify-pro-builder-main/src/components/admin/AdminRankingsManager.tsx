"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  RefreshCw,
  Sliders,
  Lock,
  Unlock,
  Search,
  FileSpreadsheet,
  Printer,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Loader2,
  X,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  AthleteRankingEntry,
  AcademyRankingEntry,
  RankingRulesConfig,
} from "@/lib/rankings-store";

export function AdminRankingsManager() {
  const [athletes, setAthletes] = useState<AthleteRankingEntry[]>([]);
  const [academies, setAcademies] = useState<AcademyRankingEntry[]>([]);
  const [rules, setRules] = useState<RankingRulesConfig | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [lastRecalculatedAt, setLastRecalculatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"athletes" | "academies" | "rules">("athletes");

  // Rules form state
  const [rulesForm, setRulesForm] = useState<Partial<RankingRulesConfig>>({});

  // Manual point adjustment modal
  const [editingAthlete, setEditingAthlete] = useState<AthleteRankingEntry | null>(null);
  const [adjPoints, setAdjPoints] = useState<number>(0);
  const [adjNote, setAdjNote] = useState<string>("");

  const loadRankings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rankings");
      const json = await res.json();
      if (json.success) {
        setAthletes(json.athletes || []);
        setAcademies(json.academies || []);
        setRules(json.rules || null);
        setRulesForm(json.rules || {});
        setIsFrozen(json.isFrozen || false);
        setLastRecalculatedAt(json.lastRecalculatedAt || "");
      }
    } catch (err) {
      console.error("Failed to load rankings in admin:", err);
      toast.error("Failed to load official rankings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await fetch("/api/rankings/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesForm }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Official rankings recalculated successfully!", {
          description: `Processed ${json.totalAthletesRanked} athletes across ${json.totalAcademiesRanked} academies.`,
        });
        await loadRankings();
      } else {
        toast.error(json.error || "Failed to recalculate rankings.");
      }
    } catch (err) {
      toast.error("Error executing recalculation engine.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveRules = async () => {
    try {
      setSavingRules(true);
      const res = await fetch("/api/rankings/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesForm }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Ranking points rules updated & recalculated!");
        await loadRankings();
      } else {
        toast.error(json.error || "Failed to update ranking rules.");
      }
    } catch (err) {
      toast.error("Error saving rules configuration.");
    } finally {
      setSavingRules(false);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const nextState = !isFrozen;
      const res = await fetch("/api/rankings/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFrozen: nextState }),
      });
      const json = await res.json();
      if (json.success) {
        setIsFrozen(nextState);
        toast.success(nextState ? "Official rankings are now FROZEN." : "Rankings UNPROZEN for live updates.");
      }
    } catch {
      toast.error("Failed to toggle freeze state.");
    }
  };

  const filteredAthletes = athletes.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.athleteName.toLowerCase().includes(q) ||
      a.athleteId.toLowerCase().includes(q) ||
      a.clubName.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q)
    );
  });

  const filteredAcademies = academies.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.academyName.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q) ||
      a.district.toLowerCase().includes(q)
    );
  });

  const handleSavePointAdjustment = () => {
    if (!editingAthlete) return;
    const updated = athletes.map((a) => {
      if (a.athleteId === editingAthlete.athleteId) {
        const nextTotal = Math.max(0, a.totalPoints + adjPoints);
        return {
          ...a,
          totalPoints: nextTotal,
          history: [
            ...a.history,
            {
              period: "Admin Manual Adjustment",
              rank: a.currentRank,
              points: nextTotal,
              date: new Date().toISOString().split("T")[0],
              notes: adjNote || "Manual point adjustment by Administrator",
            },
          ],
        };
      }
      return a;
    });

    // Re-sort
    updated.sort((x, y) => y.totalPoints - x.totalPoints);
    updated.forEach((item, idx) => {
      item.currentRank = idx + 1;
    });

    setAthletes(updated);
    setEditingAthlete(null);
    setAdjPoints(0);
    setAdjNote("");
    toast.success(`Points adjusted for ${editingAthlete.athleteName}!`);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-semibold">Loading Official Rankings System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/35 text-[10px] font-black uppercase tracking-wider">
                🏅 Page 15 Engine
              </span>
              {isFrozen && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/35 text-[10px] font-bold">
                  🔒 Standings Frozen
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground mt-1 flex items-center gap-2">
              <Trophy className="size-5 text-primary" /> KALAWAR OFFICIAL RANKINGS MANAGER
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated ranking points derivation from Page 14 verified tournament archives &amp; player registry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleToggleFreeze}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer",
                isFrozen
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30"
                  : "bg-card border border-border hover:bg-accent/40 text-foreground"
              )}
            >
              {isFrozen ? <Lock className="size-3.5 text-blue-400" /> : <Unlock className="size-3.5 opacity-70" />}
              <span>{isFrozen ? "Standings Frozen" : "Freeze Rankings"}</span>
            </button>

            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="bg-gold-gradient text-background font-black text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", recalculating && "animate-spin")} />
              <span>{recalculating ? "Recalculating..." : "⚡ Recalculate Official Rankings"}</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-2xl bg-accent/20 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Ranked Athletes</span>
            <p className="text-lg font-black text-foreground">{athletes.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-accent/20 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Affiliated Academies</span>
            <p className="text-lg font-black text-primary">{academies.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-accent/20 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">National #1 Seed</span>
            <p className="text-sm font-black text-amber-400 truncate">{athletes[0]?.athleteName || "TBA"}</p>
          </div>
          <div className="p-3 rounded-2xl bg-accent/20 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Last Recalculated</span>
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {lastRecalculatedAt ? new Date(lastRecalculatedAt).toLocaleString("en-IN") : "Just now"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        {[
          { key: "athletes", label: "🥋 Athlete Standings", count: athletes.length },
          { key: "academies", label: "🏛️ Dojo Standings", count: academies.length },
          { key: "rules", label: "⚙️ Points System Configuration" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2",
              activeTab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full bg-background/30 text-[10px]">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ATHLETE RANKINGS */}
      {activeTab === "athletes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete name, ID, or academy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {filteredAthletes.length} athletes
            </span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-accent/20 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Athlete &amp; ID</th>
                    <th className="py-3 px-4">Club / Dojo</th>
                    <th className="py-3 px-4">State &amp; District</th>
                    <th className="py-3 px-4 text-center">Medals (🥇 🥈 🥉)</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAthletes.map((ath) => (
                    <tr key={ath.rankingId} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-black">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-7 rounded-lg font-black text-xs flex items-center justify-center",
                              ath.currentRank === 1
                                ? "bg-amber-400 text-stone-950"
                                : ath.currentRank === 2
                                ? "bg-slate-300 text-stone-950"
                                : ath.currentRank === 3
                                ? "bg-amber-700 text-amber-100"
                                : "bg-accent text-foreground"
                            )}
                          >
                            #{ath.currentRank}
                          </span>
                          {ath.rankChange > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-bold">▲+{ath.rankChange}</span>
                          ) : ath.rankChange < 0 ? (
                            <span className="text-[10px] text-rose-400 font-bold">▼{ath.rankChange}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground text-xs sm:text-sm">{ath.athleteName}</p>
                        <span className="font-mono text-[10px] text-muted-foreground">{ath.athleteId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{ath.clubName}</p>
                        <span className="text-[10px] text-amber-400 font-bold">{ath.beltRank}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {ath.district}, {ath.state}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-xs">
                          🥇{ath.medals.gold} 🥈{ath.medals.silver} 🥉{ath.medals.bronze}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-black text-sm text-gold-gradient">
                          {ath.totalPoints} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingAthlete(ath);
                            setAdjPoints(0);
                            setAdjNote("");
                          }}
                          className="px-2.5 py-1 rounded-lg border border-border/80 hover:bg-accent/40 text-[11px] font-bold text-primary cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit className="size-3" /> Adjust Points
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMY RANKINGS */}
      {activeTab === "academies" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search academy or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {filteredAcademies.length} dojos
            </span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-accent/20 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Academy Name</th>
                    <th className="py-3 px-4">State &amp; District</th>
                    <th className="py-3 px-4 text-center">Athletes</th>
                    <th className="py-3 px-4 text-center">Medals (🥇 🥈 🥉)</th>
                    <th className="py-3 px-4 text-right">Total Points</th>
                    <th className="py-3 px-4 text-right">Avg Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAcademies.map((acad) => (
                    <tr key={acad.rank} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-black">
                        <span className="size-7 rounded-lg bg-accent font-black text-xs inline-flex items-center justify-center">
                          #{acad.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary shrink-0" />
                        <span>{acad.academyName}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {acad.district}, {acad.state}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{acad.totalAthletes}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        🥇{acad.gold} 🥈{acad.silver} 🥉{acad.bronze}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-primary">
                        {acad.totalPoints} pts
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {acad.performanceScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TECHNICAL COMMITTEE POINT RULES CONFIG */}
      {activeTab === "rules" && (
        <div className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-6 shadow-xl">
          <div className="border-b border-border/60 pb-4">
            <h3 className="text-base font-black uppercase text-foreground flex items-center gap-2">
              <Sliders className="size-4 text-primary" /> Technical Committee Official Points Weights
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set the point values awarded for tournament medal achievements, match wins, participation, and championship multipliers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Gold */}
            <div className="space-y-1.5">
              <label className="block font-bold text-amber-400">🥇 Gold Medal Points</label>
              <input
                type="number"
                value={rulesForm.goldPoints ?? 100}
                onChange={(e) => setRulesForm({ ...rulesForm, goldPoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Silver */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">🥈 Silver Medal Points</label>
              <input
                type="number"
                value={rulesForm.silverPoints ?? 60}
                onChange={(e) => setRulesForm({ ...rulesForm, silverPoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Bronze */}
            <div className="space-y-1.5">
              <label className="block font-bold text-amber-600">🥉 Bronze Medal Points</label>
              <input
                type="number"
                value={rulesForm.bronzePoints ?? 30}
                onChange={(e) => setRulesForm({ ...rulesForm, bronzePoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Match Win */}
            <div className="space-y-1.5">
              <label className="block font-bold text-foreground">🥊 Match Win Points</label>
              <input
                type="number"
                value={rulesForm.matchWinPoints ?? 10}
                onChange={(e) => setRulesForm({ ...rulesForm, matchWinPoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Participation */}
            <div className="space-y-1.5">
              <label className="block font-bold text-foreground">🎫 Tournament Participation Points</label>
              <input
                type="number"
                value={rulesForm.participationPoints ?? 5}
                onChange={(e) => setRulesForm({ ...rulesForm, participationPoints: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* National Multiplier */}
            <div className="space-y-1.5">
              <label className="block font-bold text-foreground">🏆 National Championship Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={rulesForm.nationalMultiplier ?? 1.5}
                onChange={(e) => setRulesForm({ ...rulesForm, nationalMultiplier: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 font-mono font-bold text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <button
              onClick={handleSaveRules}
              disabled={savingRules}
              className="bg-gold-gradient text-background font-black text-xs px-6 py-2.5 rounded-xl shadow-gold hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="size-3.5" />
              <span>{savingRules ? "Saving..." : "Save Rules & Recalculate"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Point Adjustment Modal */}
      {editingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-primary/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-black text-foreground">Adjust Ranking Points</h3>
                <p className="text-xs text-muted-foreground">{editingAthlete.athleteName} ({editingAthlete.athleteId})</p>
              </div>
              <button
                onClick={() => setEditingAthlete(null)}
                className="size-7 rounded-full bg-accent/40 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-accent/20 border border-border/60 flex justify-between">
                <span className="text-muted-foreground">Current Total Points:</span>
                <strong className="font-mono text-primary text-sm">{editingAthlete.totalPoints} pts</strong>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-foreground">Points Adjustment (+/-)</label>
                <input
                  type="number"
                  placeholder="e.g. +20 or -10"
                  value={adjPoints || ""}
                  onChange={(e) => setAdjPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-foreground">Audit Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. State Championship bonus points"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <button
                onClick={() => setEditingAthlete(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePointAdjustment}
                className="btn-luxe px-5 py-2 text-xs font-bold"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
