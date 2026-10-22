"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  User,
  Sparkles,
  X,
  Camera,
  Download,
  Eye,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";
import type { CommonReviewItem } from "@/lib/common-reviews-store";

export function AdminCommonReviewsManager() {
  const [reviews, setReviews] = useState<CommonReviewItem[]>([]);
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

  // Modal State for Photo Full Preview & Delete Confirmation
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommonReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "All") queryParams.set("status", statusFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/common-reviews?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error(data.error || "Failed to load common reviews");
      }
    } catch (err) {
      console.error("Admin load common reviews error:", err);
      toast.error("Network error while fetching reviews");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Status Update (Approve / Reject)
  const handleUpdateStatus = async (
    review: CommonReviewItem,
    newStatus: "Approved" | "Rejected"
  ) => {
    try {
      setActionLoadingId(review.id);

      // Optimistic local state update
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
      );

      const res = await fetch(`/api/admin/common-reviews/${encodeURIComponent(review.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          newStatus === "Approved"
            ? `Approved: Review by "${review.name}"`
            : `Rejected: Review by "${review.name}"`,
          {
            description:
              newStatus === "Approved"
                ? `Review is now published live on the public Homepage.`
                : `Review has been hidden from public Homepage.`,
          }
        );
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

  // Delete Review
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        `/api/admin/common-reviews/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Review Permanently Deleted", {
          description: `Review by "${deleteTarget.name}" was removed.`,
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

  // Download Photo Function
  const handleDownloadPhoto = async (photoUrl: string, reviewerName: string) => {
    try {
      const cleanName = reviewerName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `Review_Photo_${cleanName}.jpg`;

      // If it's a data URL, download directly
      if (photoUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = photoUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Photo download started");
        return;
      }

      // If URL, fetch blob and download
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Photo downloaded successfully!");
    } catch (err) {
      console.error("Download photo error:", err);
      // Fallback open in new tab
      window.open(photoUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <MessageSquareQuote className="size-6 text-primary" /> Common Reviews Moderation
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, approve, preview photos, and download community reviews displayed on the Homepage.
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-card p-5 border border-border/70 rounded-2xl space-y-1">
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
            Total Reviews
          </p>
          <p className="text-2xl font-black text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Submitted by community</p>
        </div>

        <div className="luxe-card p-5 border border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              Pending Moderation
            </p>
            {stats.pending > 0 && (
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          <p className="text-[11px] text-muted-foreground">Awaiting your approval</p>
        </div>

        <div className="luxe-card p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl space-y-1">
          <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            Approved & Live
          </p>
          <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
          <p className="text-[11px] text-muted-foreground">Visible on public Homepage</p>
        </div>

        <div className="luxe-card p-5 border border-primary/30 bg-primary/5 rounded-2xl space-y-1">
          <p className="text-primary text-[11px] font-bold uppercase tracking-wider">
            Average Score
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

      {/* Main Review Management Container */}
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
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
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
                placeholder="Search reviews by name, words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/60 border border-border/70 rounded-full pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={loadReviews}
              title="Refresh reviews list"
              className="border-border/70 hover:border-primary/60 bg-card/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground text-xs font-medium size-9 rounded-full border transition-all grid place-items-center shrink-0 cursor-pointer"
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
                ? "Great! There are no reviews pending approval."
                : "No reviews in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isActionLoading = actionLoadingId === rev.id;
              const hasPhoto = Boolean(rev.photo);

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
                  {/* Left: Reviewer Photo, Rating, Details, Comment */}
                  <div className="flex-1 space-y-3">
                    {/* Top Row: Reviewer Name, Date & Status Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Reviewer Photo with preview & download triggers */}
                        {hasPhoto ? (
                          <div className="relative group/thumb">
                            <img
                              src={rev.photo}
                              alt={rev.name}
                              className="size-12 rounded-xl object-cover border border-primary/30 shadow-sm cursor-pointer"
                              onClick={() => setPreviewPhoto({ url: rev.photo!, name: rev.name })}
                            />
                            <div
                              onClick={() => setPreviewPhoto({ url: rev.photo!, name: rev.name })}
                              className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/thumb:opacity-100 transition-opacity grid place-items-center text-white cursor-pointer"
                              title="Click to preview photo"
                            >
                              <Eye className="size-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="size-12 rounded-xl bg-primary/10 border border-primary/25 text-primary grid place-items-center font-bold text-base shadow-inner">
                            {rev.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{rev.name}</h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({new Date(rev.createdAt).toLocaleString("en-IN")})
                            </span>
                          </div>

                          {/* Photo Actions for Admin */}
                          {hasPhoto && (
                            <div className="flex items-center gap-3 text-[11px] text-primary mt-1">
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ url: rev.photo!, name: rev.name })}
                                className="inline-flex items-center gap-1 hover:underline font-semibold cursor-pointer"
                              >
                                <Eye className="size-3" /> Full Preview
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => handleDownloadPhoto(rev.photo!, rev.name)}
                                className="inline-flex items-center gap-1 hover:underline font-semibold text-emerald-400 cursor-pointer"
                              >
                                <Download className="size-3" /> Download Photo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {rev.status === "Pending" ? (
                          <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-0.5 text-[10px] font-extrabold uppercase inline-flex items-center gap-1">
                            <Clock className="size-3" /> Pending Approval
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

                    {/* Star Rating & Comment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
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
                        <span className="text-xs font-bold text-foreground">{rev.rating}.0 Stars</span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line pl-0.5">
                        "{rev.comment}"
                      </p>
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
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
                          className="border border-border/80 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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
                          className="border border-border/80 hover:border-amber-500/60 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 rounded-full px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                          title="Hide review from public Homepage"
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
                          className="bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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
                      className="size-8 rounded-full border border-border/60 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center transition-all disabled:opacity-50 ml-1 cursor-pointer"
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

      {/* PHOTO FULL PREVIEW & DOWNLOAD MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setPreviewPhoto(null)}
          />
          <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden border border-primary/40 bg-card shadow-2xl z-10 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Reviewer Photo Preview
                </h3>
                <p className="text-xs text-muted-foreground">Uploaded by {previewPhoto.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPhoto(previewPhoto.url, previewPhoto.name)}
                  className="bg-gold-gradient text-background px-3.5 py-1.5 rounded-full text-xs font-bold shadow-gold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" /> Download Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-hidden rounded-2xl border border-border/70 bg-black/40 flex items-center justify-center p-2">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* LUXURY PERMANENT DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Common Review?
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
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-2">
                <span className="font-semibold text-foreground">{deleteTarget.name}</span>
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  ★ {deleteTarget.rating}.0
                </span>
              </div>
              <p className="text-muted-foreground line-clamp-3 italic text-[11px]">
                "{deleteTarget.comment}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
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
