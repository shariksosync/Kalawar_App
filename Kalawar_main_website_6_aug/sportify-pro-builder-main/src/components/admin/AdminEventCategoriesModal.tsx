"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Check, X, Loader2, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/lib/event-categories-store";
import type { SportEvent } from "@/data/events";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesChanged?: (categories: string[]) => void;
  events?: SportEvent[];
};

export function AdminEventCategoriesModal({
  open,
  onOpenChange,
  onCategoriesChanged,
  events = [],
}: Props) {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Deleting state
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.tiers)) {
        setCategories(json.tiers);
        if (onCategoriesChanged && Array.isArray(json.categories)) {
          onCategoriesChanged(json.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load event categories:", err);
      toast.error("Failed to load event categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      setNewCatName("");
      setEditingId(null);
    }
  }, [open]);

  const getEventCountForCategory = (catName: string) => {
    return events.filter(
      (e) =>
        (e.category && e.category.trim().toLowerCase() === catName.trim().toLowerCase()) ||
        (e.tier && e.tier.trim().toLowerCase() === catName.trim().toLowerCase())
    ).length;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Please enter a category / competition level name");
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A category with this name already exists");
      return;
    }

    try {
      setIsAdding(true);
      const res = await fetch("/api/events/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, order: categories.length + 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add category");
      }

      toast.success("Event category added successfully", { description: json.tier.name });
      setNewCatName("");
      await loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to add category");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (cat: EventCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (oldCat: EventCategory) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (trimmed.toLowerCase() === oldCat.name.toLowerCase()) {
      handleCancelEdit();
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch("/api/events/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: oldCat.name, newName: trimmed, order: oldCat.order }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update category");
      }

      toast.success("Event category renamed & synced", {
        description: `Renamed '${oldCat.name}' to '${trimmed}' across all scheduled events.`,
      });
      handleCancelEdit();
      await loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (cat: EventCategory) => {
    const count = getEventCountForCategory(cat.name);
    if (count > 0) {
      const confirmDelete = window.confirm(
        `Warning: ${count} event(s) are currently tagged as '${cat.name}'. Are you sure you want to delete this category from the options?`
      );
      if (!confirmDelete) return;
    }

    try {
      setDeletingName(cat.name);
      const res = await fetch("/api/events/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cat.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete category");
      }

      toast.success("Event Category removed from options");
      await loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
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
              <Trophy className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Manage Event Categories &amp; Competition Levels
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Add, rename, or remove event categories. Renaming automatically syncs all existing tournament fixtures.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Add Form */}
        <form onSubmit={handleAddCategory} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g. Zonal Championship, Invitational Cup..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-background/80 border border-border/70 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isAdding || !newCatName.trim()}
            className="bg-gold-gradient text-background font-bold text-xs px-4 py-2.5 rounded-xl shadow-gold flex items-center gap-1.5 shrink-0 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isAdding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            <span>Add Category</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs">
              No categories configured yet.
            </div>
          ) : (
            categories.map((cat, idx) => {
              const isEditing = editingId === cat.id;
              const count = getEventCountForCategory(cat.name);
              const isDeleting = deletingName === cat.name;

              return (
                <div
                  key={cat.id}
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
                          onClick={() => handleSaveEdit(cat)}
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
                          {cat.name}
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
                          <Trophy className="size-2.5" /> {count} events
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="size-7 rounded-lg border border-border/70 hover:border-primary hover:text-primary grid place-items-center text-muted-foreground transition-colors cursor-pointer"
                        title="Rename Category"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={isDeleting}
                        className="size-7 rounded-lg border border-border/70 hover:border-destructive hover:text-destructive grid place-items-center text-muted-foreground transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Category"
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
            Categories immediately update across all event forms, Calendar, and Upcoming Events filters.
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
