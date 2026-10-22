"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  ThumbsUp,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ReviewItem } from "@/lib/reviews-store";

export function AdminReviewsManager() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageScore: 0.0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State for luxury delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "All") queryParams.set("status", statusFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load reviews");
      }
    } catch (err) {
      console.error("Admin load reviews error:", err);
      toast.error("Network error while fetching reviews");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle Status Update (Approve / Reject)
  const handleUpdateStatus = async (
    review: ReviewItem,
    newStatus: "Approved" | "Rejected"
  ) => {
    try {
      setActionLoadingId(review.id);

      // Optimistic local state update
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
      );

      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(review.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          newStatus === "Approved"
            ? `Approved: "${review.title}"`
            : `Rejected: "${review.title}"`,
          {
            description:
              newStatus === "Approved"
                ? `Review is now live and product (${review.productCode}) rating was updated.`
                : `Review has been hidden from public store.`,
          }
        );
        // Refresh dataset and stats
        await loadReviews();
      } else {
        toast.error(data.error || "Failed to update review status");
        await loadReviews();
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Network error while updating review");
      await loadReviews();
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm and execute permanent deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const targetId = deleteTarget.id;
      const targetTitle = deleteTarget.title;

      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review Permanently Deleted", {
          description: `"${targetTitle}" was removed and product rating was updated.`,
        });
        setDeleteTarget(null);
        await loadReviews();
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch (err) {
      console.error("Delete review error:", err);
      toast.error("Network error while deleting review");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-card p-5 border border-border/70 rounded-2xl space-y-1">
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
            Total Reviews
          </p>
          <p className="text-2xl font-black text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Across all store products</p>
        </div>

        <div className="luxe-card p-5 border border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              Pending Approval
            </p>
            {stats.pending > 0 && (
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          <p className="text-[11px] text-muted-foreground">Awaiting moderation</p>
        </div>

        <div className="luxe-card p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl space-y-1">
          <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            Approved & Live
          </p>
          <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
          <p className="text-[11px] text-muted-foreground">Visible on public store</p>
        </div>

        <div className="luxe-card p-5 border border-primary/30 bg-primary/5 rounded-2xl space-y-1">
          <p className="text-primary text-[11px] font-bold uppercase tracking-wider">
            Store Avg Rating
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-gold-gradient">
              {stats.approved > 0 ? stats.averageScore.toFixed(1) : "0"}
            </p>
            <span className="text-xs text-muted-foreground font-semibold">/ 5.0</span>
          </div>
          <p className="text-[11px] text-muted-foreground">From approved reviews</p>
        </div>
      </div>

      {/* Main Review Management Card */}
      <div className="luxe-card p-6 md:p-8 space-y-6 rounded-3xl border border-border/70">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All Reviews", value: "All", count: stats.total, highlight: false },
              {
                label: "Pending",
                value: "Pending",
                count: stats.pending,
                highlight: stats.pending > 0,
              },
              { label: "Approved", value: "Approved", count: stats.approved, highlight: false },
              { label: "Rejected", value: "Rejected", count: stats.rejected, highlight: false },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === tab.value
                    ? "bg-gold-gradient text-background shadow-gold"
                    : "border border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.value
                      ? "bg-background/20 text-background font-black"
                      : tab.highlight
                      ? "bg-amber-500/20 text-amber-400 font-bold"
                      : "bg-accent/40 text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Reload */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reviews, athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/60 border border-border/70 rounded-full pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={loadReviews}
              title="Refresh reviews list"
              className="border-border/70 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground text-xs font-medium size-9 rounded-full border transition-all grid place-items-center shrink-0"
            >
              <RefreshCw className={`size-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Reviews List Feed */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Loading reviews dataset...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-border/80">
            <Sparkles className="size-8 text-primary/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No Reviews Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "No reviews matched your search criteria."
                : statusFilter === "Pending"
                ? "Great job! There are no reviews pending approval."
                : "No customer reviews in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isActionLoading = actionLoadingId === rev.id;

              return (
                <div
                  key={rev.id}
                  className={`p-5 md:p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                    rev.status === "Pending"
                      ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                      : rev.status === "Approved"
                      ? "border-border/70 bg-card/40 hover:border-primary/40"
                      : "border-destructive/30 bg-destructive/5 opacity-75"
                  }`}
                >
                  {/* Left & Middle: Product & Review Content */}
                  <div className="flex-1 space-y-3">
                    {/* Top Meta: Product info, Reviewer, Status Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                      {/* Product Tag */}
                      <div className="flex items-center gap-2">
                        {rev.productImage ? (
                          <img
                            src={rev.productImage}
                            alt={rev.productName}
                            className="size-8 rounded-lg object-cover border border-border/60"
                          />
                        ) : (
                          <div className="size-8 rounded-lg bg-accent/40 border border-border/60 grid place-items-center text-muted-foreground text-[10px] font-bold">
                            PRD
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/shop/${rev.productCode.toLowerCase()}`}
                            target="_blank"
                            className="text-xs font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            <span>{rev.productName}</span>
                            <ExternalLink className="size-3 opacity-60" />
                          </Link>
                          <span className="text-[10px] text-muted-foreground font-mono ml-2">
                            ({rev.productCode})
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {rev.status === "Pending" ? (
                          <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-0.5 text-[10px] font-extrabold uppercase inline-flex items-center gap-1">
                            <Clock className="size-3" /> Pending Review
                          </span>
                        ) : rev.status === "Approved" ? (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-extrabold uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Approved & Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-3 py-0.5 text-[10px] font-extrabold uppercase inline-flex items-center gap-1">
                            <XCircle className="size-3" /> Rejected / Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {/* Gold Stars */}
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3.5 ${
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-foreground">{rev.rating}.0</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <h4 className="text-xs font-bold text-foreground">{rev.title}</h4>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Reviewer Details Footer */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <User className="size-3 text-primary" />
                        <span>{rev.userName}</span>
                      </div>
                      <span>({rev.userEmail})</span>
                      <span>·</span>
                      <span className="rounded-full bg-primary/15 text-primary border border-primary/25 px-2 py-0.2 text-[9px] font-bold uppercase">
                        {rev.userRole || "Athlete"}
                      </span>
                      <span>·</span>
                      <span>{new Date(rev.createdAt).toLocaleString("en-IN")}</span>
                      {rev.helpfulVotes > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-semibold inline-flex items-center gap-1">
                            <ThumbsUp className="size-3" /> {rev.helpfulVotes} helpful
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Moderation Buttons */}
                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-border/60 pt-3 lg:pt-0 lg:pl-6">
                    {rev.status === "Pending" ? (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(rev, "Approved")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(rev, "Rejected")}
                          className="border border-border/80 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : rev.status === "Approved" ? (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(rev, "Rejected")}
                          className="border border-border/80 hover:border-amber-500/60 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 rounded-full px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                          title="Hide review from public store"
                        >
                          <XCircle className="size-3.5" />
                          <span>Hide</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUpdateStatus(rev, "Approved")}
                          className="bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Re-Approve</span>
                        </button>
                      </>
                    )}

                    {/* Delete Trigger Button */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => setDeleteTarget(rev)}
                      className="size-8 rounded-full border border-border/60 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center transition-all disabled:opacity-50 ml-1"
                      title="Permanently delete review"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Luxury Premium Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95">
            {/* Header with Danger Pill */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Customer Review?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Review Preview Card */}
            <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-2">
                <span className="font-semibold text-foreground">
                  {deleteTarget.productName} ({deleteTarget.productCode})
                </span>
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  ★ {deleteTarget.rating}.0
                </span>
              </div>
              <p className="font-bold text-foreground line-clamp-1">
                "{deleteTarget.title}"
              </p>
              <p className="text-muted-foreground line-clamp-2 italic text-[11px]">
                {deleteTarget.comment}
              </p>
              <p className="text-[10px] text-muted-foreground pt-1">
                By: {deleteTarget.userName} ({deleteTarget.userEmail})
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently removing this review will automatically recalculate and synchronize the product's live average rating and review count across the federation store.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
