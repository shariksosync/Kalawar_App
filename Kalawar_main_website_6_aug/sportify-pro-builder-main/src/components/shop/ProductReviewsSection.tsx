"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MessageSquarePlus,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  Send,
  User,
  Info,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { ShopProduct } from "@/data/shop";
import type { ReviewItem, RatingSummary } from "@/lib/reviews-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductReviewsSectionProps {
  product: ShopProduct;
  onRatingUpdate?: (newRating: number, newCount: number) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor - Needs Improvement",
  2: "Fair - Below Expectations",
  3: "Good - Meets Expectations",
  4: "Very Good - Highly Satisfied",
  5: "Exceptional - Federation Grade",
};

export function ProductReviewsSection({
  product,
  onRatingUpdate,
}: ProductReviewsSectionProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const productIdentifier = product.code || product.id || "";

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: (product.reviewsCount ?? 0) > 0 ? (product.rating || 0) : 0,
    totalReviews: product.reviewsCount || 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [loading, setLoading] = useState(true);

  // User review status (enforces one review per product)
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [userReviewStatus, setUserReviewStatus] = useState<
    "Pending" | "Approved" | "Rejected" | undefined
  >(undefined);

  // Filter & Sort State
  const [starFilter, setStarFilter] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helpful votes tracked in session
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set());

  // Stable callback ref to prevent infinite re-fetch loops
  const onRatingUpdateRef = useRef(onRatingUpdate);
  useEffect(() => {
    onRatingUpdateRef.current = onRatingUpdate;
  }, [onRatingUpdate]);

  const loadReviews = useCallback(async () => {
    if (!productIdentifier) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/shop/products/${encodeURIComponent(productIdentifier)}/reviews`
      );
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.summary) {
          setSummary(data.summary);
          if (onRatingUpdateRef.current) {
            onRatingUpdateRef.current(
              data.summary.averageRating,
              data.summary.totalReviews
            );
          }
        }

        // Check if current user has already submitted a review
        if (data.hasUserReviewed) {
          setHasUserReviewed(true);
          setUserReviewStatus(data.userReviewStatus);
        } else if (
          user?.email &&
          data.reviews?.some(
            (r: any) =>
              r.userEmail?.toLowerCase() === user.email?.toLowerCase()
          )
        ) {
          setHasUserReviewed(true);
          setUserReviewStatus("Approved");
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productIdentifier, user?.email]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle Write Review Click (Guarded for Logged-In Users and Single Submission)
  const handleOpenWriteModal = () => {
    if (!isAuthenticated || !user) {
      toast.error("Please login first to give reviews", {
        description:
          "You need an active athlete or member account to submit a product review.",
      });
      const returnUrl =
        typeof window !== "undefined"
          ? window.location.pathname + "#reviews"
          : "/shop";
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (hasUserReviewed) {
      toast.info("You have already submitted a review for this product", {
        description:
          userReviewStatus === "Pending"
            ? "Your review is currently awaiting administrator moderation."
            : "Your review is published on the store.",
      });
      return;
    }

    setIsModalOpen(true);
  };

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error("Please login first to give reviews");
      setIsModalOpen(false);
      router.push("/login");
      return;
    }

    if (!formTitle.trim()) {
      toast.error("Please enter a review headline");
      return;
    }

    if (!formComment.trim()) {
      toast.error("Please provide your detailed review feedback");
      return;
    }

    try {
      setSubmitting(true);
      const identifier = product.code || product.id;
      const res = await fetch(
        `/api/shop/products/${encodeURIComponent(identifier)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: formRating,
            title: formTitle.trim(),
            comment: formComment.trim(),
            userName: user.name,
            userEmail: user.email,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Review Submitted for Approval", {
          description:
            "Thank you! Your review has been submitted and will appear on the store once approved by the federation administrator.",
        });
        setIsModalOpen(false);
        setFormTitle("");
        setFormComment("");
        setFormRating(5);
        // Hide review button immediately for this user
        setHasUserReviewed(true);
        setUserReviewStatus("Pending");
      } else {
        toast.error(data.error || "Failed to submit review");
        if (data.alreadyReviewed) {
          setHasUserReviewed(true);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review due to a network error");
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote Helpful Review
  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) {
      toast.info("You have already voted this review as helpful");
      return;
    }

    try {
      const res = await fetch(
        `/api/shop/reviews/${encodeURIComponent(reviewId)}/helpful`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (data.success) {
        setVotedReviews((prev) => new Set(prev).add(reviewId));
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpfulVotes: data.helpfulVotes } : r
          )
        );
        toast.success("Thank you for your feedback!");
      }
    } catch (err) {
      console.error("Helpful vote error:", err);
    }
  };

  // Filtered and Sorted Reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    if (starFilter !== "All") {
      list = list.filter((r) => Math.round(r.rating) === starFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [reviews, starFilter, sortBy]);

  const activeRatingScore = summary.totalReviews > 0 ? summary.averageRating : 0;
  const activeReviewsCount = summary.totalReviews;

  return (
    <section id="reviews" className="scroll-mt-32 pt-16 border-t border-border/60">
      <div className="space-y-10">
        {/* Section Title & Action Button / Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Verified Federation Feedback
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Customer & Athlete Reviews
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Authentic feedback and equipment ratings verified by the federation secretariat
            </p>
          </div>

          {/* Action button hides after user submits review */}
          {hasUserReviewed ? (
            <div className="flex items-center gap-2 bg-card/70 border border-border/70 px-4 py-2.5 rounded-full text-xs font-semibold self-start sm:self-auto shadow-sm">
              {userReviewStatus === "Pending" ? (
                <>
                  <Clock className="size-3.5 text-amber-400" />
                  <span className="text-amber-400">Review Submitted & Pending Approval</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">You Reviewed This Product</span>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenWriteModal}
              className="bg-gold-gradient text-background shadow-gold rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <MessageSquarePlus className="size-4" /> Write a Review
            </button>
          )}
        </div>

        {/* Rating Breakdown & Summary Card */}
        <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/70 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-center">
          {/* Left Column: Big Score */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 lg:border-r lg:border-border/60 lg:pr-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-gold-gradient tracking-tight">
                {activeReviewsCount > 0 ? activeRatingScore.toFixed(1) : "0"}
              </span>
              <span className="text-muted-foreground text-sm font-semibold">/ 5.0</span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  activeReviewsCount > 0 && star <= Math.round(activeRatingScore);
                return (
                  <Star
                    key={star}
                    className={`size-5 ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted/20 text-muted-foreground/30"
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              {activeReviewsCount > 0 ? (
                <>
                  Based on{" "}
                  <span className="text-foreground font-bold">{activeReviewsCount}</span>{" "}
                  verified {activeReviewsCount === 1 ? "review" : "reviews"}
                </>
              ) : (
                <span className="text-muted-foreground">
                  No athlete reviews yet. Be the first to review!
                </span>
              )}
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <ShieldCheck className="size-3.5" /> 100% Federation Authenticity Guaranteed
            </div>
          </div>

          {/* Right Column: 5-Star Distribution Bars */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const item = summary.distribution[stars as 1 | 2 | 3 | 4 | 5] || {
                count: 0,
                percentage: 0,
              };
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setStarFilter(starFilter === stars ? "All" : stars)}
                  className={`w-full flex items-center gap-3 text-xs group transition-opacity ${
                    starFilter !== "All" && starFilter !== stars
                      ? "opacity-40"
                      : "opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-muted-foreground group-hover:text-primary">
                    <span>{stars}</span>
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-3 rounded-full bg-accent/40 overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-[11px] text-muted-foreground group-hover:text-foreground font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="size-3.5" /> Filter:
            </span>
            {(["All", 5, 4, 3, 2, 1] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStarFilter(opt)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all shrink-0 ${
                  starFilter === opt
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "border border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {opt === "All" ? "All Stars" : `${opt} ★`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-card/60 border border-border/70 text-foreground text-xs rounded-xl px-3 py-1.5 focus:border-primary focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews Feed */}
        {loading ? (
          <div className="luxe-card p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading approved reviews...</p>
          </div>
        ) : displayedReviews.length === 0 ? (
          /* Empty State */
          <div className="luxe-card p-10 text-center space-y-4 rounded-3xl border border-dashed border-border/80">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center mx-auto text-primary shadow-gold">
              <Star className="size-6 text-muted-foreground/30 fill-transparent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {starFilter !== "All"
                  ? `No ${starFilter}-star reviews found`
                  : "No reviews published yet"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {starFilter !== "All"
                  ? "Try selecting another star rating filter or view all reviews."
                  : hasUserReviewed
                  ? "Your review has been submitted and will appear on the store once approved by the administrator."
                  : "Be the first verified federation athlete to review this gear!"}
              </p>
            </div>
            {starFilter !== "All" ? (
              <button
                type="button"
                onClick={() => setStarFilter("All")}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear Filter
              </button>
            ) : hasUserReviewed ? (
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-4 py-1.5 text-xs font-semibold">
                <Clock className="size-3.5" /> Awaiting administrator moderation
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenWriteModal}
                className="bg-gold-gradient text-background shadow-gold rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-95"
              >
                <MessageSquarePlus className="size-3.5" /> Write First Review
              </button>
            )}
          </div>
        ) : (
          /* Reviews Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedReviews.map((rev) => (
              <div
                key={rev.id}
                className="luxe-card p-6 rounded-2xl border border-border/70 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header: User Avatar, Name, Rating & Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold text-sm shrink-0">
                        {rev.userName ? rev.userName.slice(0, 2).toUpperCase() : "AT"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-foreground">
                            {rev.userName}
                          </h4>
                          {rev.verifiedPurchase && (
                            <span
                              title="Verified Federation Purchase"
                              className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5"
                            >
                              <CheckCircle2 className="size-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {rev.userRole || "Athlete"} ·{" "}
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Star Score */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
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
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1.5">
                    <h5 className="text-sm font-bold text-foreground leading-snug">
                      {rev.title}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {rev.comment}
                    </p>
                  </div>
                </div>

                {/* Helpful Button */}
                <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                      votedReviews.has(rev.id)
                        ? "border-primary/40 bg-primary/10 text-primary font-bold"
                        : "border-border/60 hover:border-primary/40 hover:text-foreground hover:bg-card/40"
                    }`}
                  >
                    <ThumbsUp className="size-3" />
                    <span>Helpful</span>
                    {rev.helpfulVotes > 0 && (
                      <span className="font-mono ml-0.5">({rev.helpfulVotes})</span>
                    )}
                  </button>

                  <span className="text-[10px] text-muted-foreground/70">
                    Official Federation Review
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => !submitting && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg luxe-card p-6 sm:p-8 rounded-3xl border border-border/80 bg-card shadow-2xl z-10 space-y-6 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Official Federation Feedback
                </span>
                <h3 className="text-lg font-black text-foreground mt-0.5">
                  Write a Product Review
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your experience with <span className="font-semibold text-foreground">{product.name}</span>
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="space-y-2 p-4 rounded-2xl bg-accent/20 border border-border/60 text-center">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Overall Rating
                </Label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || formRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`size-7 ${
                            isFilled
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-primary pt-1">
                  {RATING_LABELS[hoverRating || formRating]}
                </p>
              </div>

              {/* Review Headline */}
              <div className="space-y-1.5">
                <Label htmlFor="rev-title" className="text-xs font-semibold text-foreground">
                  Review Headline *
                </Label>
                <Input
                  id="rev-title"
                  type="text"
                  required
                  placeholder="e.g. Excellent grip and federation quality uniform"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-card/60 border-border/70 text-xs"
                />
              </div>

              {/* Review Comment */}
              <div className="space-y-1.5">
                <Label htmlFor="rev-comment" className="text-xs font-semibold text-foreground">
                  Your Detailed Feedback *
                </Label>
                <textarea
                  id="rev-comment"
                  rows={4}
                  required
                  placeholder="Describe the fabric quality, stitching, comfort, durability, and fit..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full bg-card/60 border border-border/70 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Reviewer Note */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary">
                <Info className="size-4 shrink-0" />
                <span>
                  Posting as <strong className="text-foreground">{user?.name}</strong> ({user?.email}) · One review per athlete
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gold-gradient text-background shadow-gold rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Submit Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
