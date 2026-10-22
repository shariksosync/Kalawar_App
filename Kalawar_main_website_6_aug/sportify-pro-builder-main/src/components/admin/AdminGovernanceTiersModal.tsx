"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Check, X, Loader2, Award, Users, AlertCircle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GovernanceTier } from "@/lib/governance-tiers-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTiersChanged?: (categories: string[]) => void;
  officials?: Array<{ category?: string; [key: string]: any }>;
};

export function AdminGovernanceTiersModal({
  open,
  onOpenChange,
  onTiersChanged,
  officials = [],
}: Props) {
  const [tiers, setTiers] = useState<GovernanceTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline editing state
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Deleting state
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/officials/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.tiers)) {
        setTiers(json.tiers);
        if (onTiersChanged && Array.isArray(json.categories)) {
          onTiersChanged(json.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load governance tiers:", err);
      toast.error("Failed to load governance levels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTiers();
      setNewTierName("");
      setEditingTierId(null);
    }
  }, [open]);

  const getOfficialCountForTier = (tierName: string) => {
    return officials.filter(
      (o) => o.category?.trim().toLowerCase() === tierName.trim().toLowerCase()
    ).length;
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTierName.trim();
    if (!trimmed) {
      toast.error("Please enter a governance level name");
      return;
    }

    if (tiers.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A governance level with this name already exists");
      return;
    }

    try {
      setIsAdding(true);
      const res = await fetch("/api/officials/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, order: tiers.length + 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add level");
      }

      toast.success("Governance Level added successfully", { description: json.tier.name });
      setNewTierName("");
      await loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add level");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (tier: GovernanceTier) => {
    setEditingTierId(tier.id);
    setEditingName(tier.name);
  };

  const handleCancelEdit = () => {
    setEditingTierId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (oldTier: GovernanceTier) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Governance level name cannot be empty");
      return;
    }

    if (trimmed.toLowerCase() === oldTier.name.toLowerCase()) {
      handleCancelEdit();
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch("/api/officials/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: oldTier.name, newName: trimmed, order: oldTier.order }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update level");
      }

      toast.success("Governance level renamed & synced", {
        description: `Renamed '${oldTier.name}' to '${trimmed}' across all officials.`,
      });
      handleCancelEdit();
      await loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update governance level");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTier = async (tier: GovernanceTier) => {
    const count = getOfficialCountForTier(tier.name);
    if (count > 0) {
      const confirmDelete = window.confirm(
        `Warning: ${count} official(s) are currently assigned to '${tier.name}'. Are you sure you want to delete this level from the options?`
      );
      if (!confirmDelete) return;
    }

    try {
      setDeletingName(tier.name);
      const res = await fetch("/api/officials/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tier.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete level");
      }

      toast.success("Governance Level removed from options");
      await loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete governance level");
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border/80 p-6 sm:rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Award className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Manage Governance Levels &amp; Tiers
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Add, rename, or remove governance hierarchy tiers. Renaming a level automatically syncs all existing officials.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Add Form */}
        <form onSubmit={handleAddTier} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g. Senior Vice President, Advisory Board..."
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            className="flex-1 bg-background/80 border border-border/70 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isAdding || !newTierName.trim()}
            className="bg-gold-gradient text-background font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold flex items-center gap-1.5 shrink-0 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isAdding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            <span>Add Level</span>
          </button>
        </form>

        {/* Tiers List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading governance tiers...</span>
            </div>
          ) : tiers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs">
              No governance levels configured yet.
            </div>
          ) : (
            tiers.map((tier, idx) => {
              const isEditing = editingTierId === tier.id;
              const count = getOfficialCountForTier(tier.name);
              const isDeleting = deletingName === tier.name;

              return (
                <div
                  key={tier.id}
                  className={cn(
                    "rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors",
                    isEditing
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/70 bg-card/60 hover:bg-accent/30"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="size-6 rounded-lg bg-accent/60 border border-border/80 text-[10px] font-bold text-muted-foreground flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          className="w-full bg-background border border-primary/50 rounded-lg px-2.5 py-1 text-xs font-bold text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(tier)}
                          disabled={isUpdating}
                          className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 grid place-items-center cursor-pointer shrink-0"
                          title="Save change"
                        >
                          {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="size-7 rounded-lg bg-accent/60 text-muted-foreground hover:text-foreground border border-border/80 grid place-items-center cursor-pointer shrink-0"
                          title="Cancel"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {tier.name}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1",
                            count > 0
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted/40 text-muted-foreground border border-border/60"
                          )}
                          title={`${count} official(s) assigned`}
                        >
                          <Users className="size-2.5" /> {count}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tier)}
                        className="size-7 rounded-lg border border-border/70 hover:border-primary hover:text-primary grid place-items-center text-muted-foreground transition-colors cursor-pointer"
                        title="Rename Level"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier)}
                        disabled={isDeleting}
                        className="size-7 rounded-lg border border-border/70 hover:border-destructive hover:text-destructive grid place-items-center text-muted-foreground transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Level"
                      >
                        {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-primary shrink-0" />
            Levels immediately update across the dropdowns, table filters, and public About page.
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-foreground text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
