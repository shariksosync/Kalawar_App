"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Check, X, Loader2, Swords, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventDiscipline } from "@/lib/event-disciplines-store";
import type { SportEvent } from "@/data/events";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisciplinesChanged?: (disciplines: string[]) => void;
  events?: SportEvent[];
};

export function AdminEventDisciplinesModal({
  open,
  onOpenChange,
  onDisciplinesChanged,
  events = [],
}: Props) {
  const [disciplines, setDisciplines] = useState<EventDiscipline[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDiscName, setNewDiscName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Deleting state
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const loadDisciplines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events/disciplines");
      const json = await res.json();
      if (json.success && Array.isArray(json.tiers)) {
        setDisciplines(json.tiers);
        if (onDisciplinesChanged && Array.isArray(json.disciplines)) {
          onDisciplinesChanged(json.disciplines);
        }
      }
    } catch (err) {
      console.error("Failed to load martial art disciplines:", err);
      toast.error("Failed to load disciplines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDisciplines();
      setNewDiscName("");
      setEditingId(null);
    }
  }, [open]);

  const getEventCountForDiscipline = (discName: string) => {
    return events.filter(
      (e) =>
        e.discipline && e.discipline.trim().toLowerCase() === discName.trim().toLowerCase()
    ).length;
  };

  const handleAddDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDiscName.trim();
    if (!trimmed) {
      toast.error("Please enter a martial art / sport discipline name");
      return;
    }

    if (disciplines.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A discipline with this name already exists");
      return;
    }

    try {
      setIsAdding(true);
      const res = await fetch("/api/events/disciplines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, order: disciplines.length + 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add discipline");
      }

      toast.success("Discipline added successfully", { description: json.tier.name });
      setNewDiscName("");
      await loadDisciplines();
    } catch (err: any) {
      toast.error(err.message || "Failed to add discipline");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (disc: EventDiscipline) => {
    setEditingId(disc.id);
    setEditingName(disc.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (oldDisc: EventDiscipline) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Discipline name cannot be empty");
      return;
    }

    if (trimmed.toLowerCase() === oldDisc.name.toLowerCase()) {
      handleCancelEdit();
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch("/api/events/disciplines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: oldDisc.name, newName: trimmed, order: oldDisc.order }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update discipline");
      }

      toast.success("Discipline renamed & synced", {
        description: `Renamed '${oldDisc.name}' to '${trimmed}' across all scheduled events.`,
      });
      handleCancelEdit();
      await loadDisciplines();
    } catch (err: any) {
      toast.error(err.message || "Failed to update discipline");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDiscipline = async (disc: EventDiscipline) => {
    const count = getEventCountForDiscipline(disc.name);
    if (count > 0) {
      const confirmDelete = window.confirm(
        `Warning: ${count} event(s) are currently tagged as '${disc.name}'. Are you sure you want to delete this discipline from the options?`
      );
      if (!confirmDelete) return;
    }

    try {
      setDeletingName(disc.name);
      const res = await fetch("/api/events/disciplines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: disc.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete discipline");
      }

      toast.success("Discipline removed from options");
      await loadDisciplines();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete discipline");
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
              <Swords className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Manage Disciplines &amp; Martial Arts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Add, rename, or remove sport disciplines. Renaming automatically syncs all existing tournament fixtures.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Add Form */}
        <form onSubmit={handleAddDiscipline} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g. Karate, Taekwondo, Kickboxing, Boxing..."
            value={newDiscName}
            onChange={(e) => setNewDiscName(e.target.value)}
            className="flex-1 bg-background/80 border border-border/70 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isAdding || !newDiscName.trim()}
            className="bg-gold-gradient text-background font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold flex items-center gap-1.5 shrink-0 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isAdding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            <span>Add Discipline</span>
          </button>
        </form>

        {/* Disciplines List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading disciplines...</span>
            </div>
          ) : disciplines.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs">
              No disciplines configured yet.
            </div>
          ) : (
            disciplines.map((disc, idx) => {
              const isEditing = editingId === disc.id;
              const count = getEventCountForDiscipline(disc.name);
              const isDeleting = deletingName === disc.name;

              return (
                <div
                  key={disc.id}
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
                          onClick={() => handleSaveEdit(disc)}
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
                          {disc.name}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1",
                            count > 0
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted/40 text-muted-foreground border border-border/60"
                          )}
                          title={`${count} event(s) assigned`}
                        >
                          <Swords className="size-2.5" /> {count} events
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(disc)}
                        className="size-7 rounded-lg border border-border/70 hover:border-primary hover:text-primary grid place-items-center text-muted-foreground transition-colors cursor-pointer"
                        title="Rename Discipline"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscipline(disc)}
                        disabled={isDeleting}
                        className="size-7 rounded-lg border border-border/70 hover:border-destructive hover:text-destructive grid place-items-center text-muted-foreground transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Discipline"
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
            Disciplines immediately update across all event forms and Upcoming Events filters.
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
