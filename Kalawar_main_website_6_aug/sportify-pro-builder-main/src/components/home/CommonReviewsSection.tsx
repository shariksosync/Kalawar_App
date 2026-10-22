"use client";

import { useState, useEffect, useRef } from "react";
import {
  Star,
  Plus,
  X,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Award,
  Loader2,
  Sparkles,
  MessageSquareQuote,
  Eye,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { Reveal, Stagger, StaggerItem } from "@/components/common/Reveal";
import type { CommonReviewItem, CommonRatingSummary } from "@/lib/common-reviews-store";

export function CommonReviewsSection() {
  const [reviews, setReviews] = useState<CommonReviewItem[]>([]);
  const [summary, setSummary] = useState<CommonRatingSummary>({
    averageRating: 5.0,
    totalReviews: 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/common-reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load common reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleResetForm = () => {
    setName("");
    setRating(5);
    setHoverRating(0);
    setComment("");
    setPhoto("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsAddModalOpen(false);
    handleResetForm();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size exceeds 2MB limit. Please choose a smaller image.");
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_common_reviews");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success && data.url) {
        setPhoto(data.url);
        toast.success("Photo uploaded successfully!");
      } else {
        // Fallback to base64 reader if upload endpoint fails
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setPhoto(reader.result);
            toast.success("Photo attached!");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhoto(reader.result);
          toast.success("Photo attached!");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a star rating between 1 and 5");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter your review comment");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/common-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rating,
          comment: comment.trim(),
          photo: photo.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review Submitted Successfully!", {
          description:
            "Thank you for your feedback! Your review will appear live once approved by the federation admin.",
        });
        handleCloseModal();
      } else {
        toast.error(data.error || "Failed to submit review. Please try again.");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      toast.error("Network error while submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to extract clean initials from name
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <section className="section-pad bg-card/40 border-y border-border/60 w-full max-w-full overflow-hidden relative">
      {/* Warm Ambient Gold Radial Glow matching the website theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />

      <div className="shell relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Centered Top Header Hierarchy */}
        <div className="text-center max-w-4xl mx-auto">
          {/* 1. Top Eyebrow Capsule Badge */}
          <div className="glass inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-primary border border-primary/30 shadow-gold">
            <Sparkles className="size-3 sm:size-3.5 text-primary shrink-0" />
            <span>Community Feedback</span>
          </div>

          {/* 2. Main Title */}
          <h2 className="mt-3.5 sm:mt-4 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight text-balance leading-[1.18] sm:leading-[1.15]">
            Trusted by Athletes, Coaches & <span className="text-gold-gradient">Martial Arts Dojos</span> Nationwide
          </h2>

          {/* 3. Subheading Description */}
          <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance px-2 sm:px-0">
            Verified experiences from state champions, certified instructors, black belt masters, and dojo heads who train and compete under KALAWAR Sports.
          </p>

          {/* 4. Centered Share Feedback CTA Button */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full max-w-xs sm:w-auto bg-gold-gradient text-background font-black text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-gold hover:opacity-95 active:scale-95 inline-flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider group"
            >
              <Star className="size-3.5 fill-background text-background transition-transform group-hover:rotate-45 shrink-0" />
              <span>Share Your Feedback</span>
            </button>
          </div>
        </div>

        {/* Reviews Cards Feed */}
        {loading ? (
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="luxe-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 animate-pulse h-56 sm:h-64 shadow-luxe"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mt-8 sm:mt-12 luxe-card p-6 sm:p-10 text-center max-w-md mx-auto space-y-3 rounded-2xl sm:rounded-3xl border border-dashed border-border/80 shadow-2xl">
            <Sparkles className="size-8 sm:size-10 text-primary/60 mx-auto" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">Be the First to Review</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share your experience with the KALAWAR Sports & Martial Arts Federation of India.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 bg-gold-gradient text-background font-bold text-xs px-5 py-2.5 rounded-full shadow-gold hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" /> Write First Review
            </button>
          </div>
        ) : (
          <Stagger className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {reviews.map((rev) => {
              const hasPhoto = Boolean(rev.photo);
              const initials = getInitials(rev.name);

              return (
                <StaggerItem key={rev.id}>
                  <div className="luxe-card p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl border border-border/70 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between h-full group hover:-translate-y-1 shadow-luxe hover:shadow-gold/25 bg-card/90">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Top: 5 Stars */}
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`size-3.5 sm:size-4 ${
                              s <= rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Body: Italicized Quote in double quotes */}
                      <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed whitespace-pre-line font-normal break-words">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Divider Line */}
                    <div className="my-4 sm:my-5 border-t border-border/60" />

                    {/* Bottom Row: User Avatar/Initials + Name/Dojo + Right Verified Ribbon Badge */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                        {hasPhoto ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(rev.photo!)}
                            className="relative size-10 sm:size-12 rounded-full overflow-hidden border-2 border-primary/40 group-hover:border-primary transition-all shrink-0 cursor-pointer shadow-sm"
                            title="Click to view full photo"
                          >
                            <img
                              src={rev.photo}
                              alt={rev.name}
                              className="size-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
                              <Eye className="size-3.5" />
                            </div>
                          </button>
                        ) : (
                          <div className="size-10 sm:size-12 rounded-full bg-primary/10 border border-primary/30 text-primary grid place-items-center font-bold text-xs sm:text-sm shrink-0 shadow-inner">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {rev.name}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-primary/90 font-semibold truncate">
                            Verified Review • {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Right Verified Circular Badge */}
                      <div
                        className="size-8 sm:size-10 rounded-full bg-primary/10 border border-primary/30 text-primary grid place-items-center shadow-inner shrink-0 group-hover:border-primary/60 transition-colors"
                        title="Federation Verified Testimonial"
                      >
                        <Award className="size-3.5 sm:size-4.5" />
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}

        {/* ADD REVIEW POPUP MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 overflow-y-auto no-scrollbar">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
              onClick={handleCloseModal}
            />

            {/* Dialog Card strictly compact & clear of navbar */}
            <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md luxe-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-primary/30 bg-[#0c121e] shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-10 space-y-3.5 animate-in zoom-in-95 my-auto max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 border border-primary/30 grid place-items-center text-primary">
                    <Sparkles className="size-3" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Add Your Review
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="size-7 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close review modal"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Row 1: Name & Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <span>Your Name</span>
                      <span className="text-primary font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Master Rajesh Sharma"
                      className="w-full bg-[#080c14] border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Rating */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <span>Rating</span>
                      <span className="text-primary font-black">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#080c14] border border-border/80 h-[34px]">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isFilled =
                            hoverRating > 0
                              ? starValue <= hoverRating
                              : starValue <= rating;

                          return (
                            <button
                              key={starValue}
                              type="button"
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(starValue)}
                              className="p-0.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                              title={`${starValue} Stars`}
                            >
                              <Star
                                className={`size-3.5 sm:size-4 ${
                                  isFilled
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted-foreground/30"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-gold-gradient ml-auto shrink-0">
                        {hoverRating > 0 ? `${hoverRating}★` : `${rating}★`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Comment */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <span>Your Review / Testimonial</span>
                    <span className="text-primary font-black">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with KALAWAR championships, Dan grading, referee clinic, or academy affiliation..."
                    className="w-full bg-[#080c14] border border-border/80 rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Row 3: Compact Photo Upload */}
                <div className="space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  {photo ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-accent/20 border border-border/80">
                      <img
                        src={photo}
                        alt="Upload Preview"
                        className="size-8 rounded-lg object-cover border border-primary/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate">Photo Attached</p>
                        <p className="text-[9.5px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="size-2.5 shrink-0" /> Ready to submit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0"
                        title="Remove photo"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-dashed border-border/80 bg-accent/5 hover:border-primary/50 transition-colors">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="size-3 animate-spin shrink-0" /> Uploading photo...
                          </>
                        ) : (
                          <>
                            <Camera className="size-3.5 shrink-0" />
                            <span>Attach Photo <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span></span>
                          </>
                        )}
                      </button>
                      <span className="text-[9.5px] text-muted-foreground">Max 2MB (JPG/PNG)</span>
                    </div>
                  )}
                </div>

                {/* Subtle 1-line Moderation Notice */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15 text-[10px] text-muted-foreground">
                  <ShieldCheck className="size-3 text-primary shrink-0" />
                  <span className="truncate">Reviewed & approved by admin before appearing live.</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-2.5 pt-0.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-full border border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || uploadingPhoto}
                    className="w-full sm:w-auto bg-gold-gradient text-background px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-3 animate-spin shrink-0" /> Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3 shrink-0" /> Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PHOTO LIGHTBOX MODAL */}
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur-md animate-in fade-in"
              onClick={() => setPreviewPhotoUrl(null)}
            />
            <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-border/80 bg-card shadow-2xl z-10 animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/75 text-white hover:text-primary grid place-items-center transition-colors z-20 cursor-pointer"
                aria-label="Close photo preview"
              >
                <X className="size-4" />
              </button>
              <img
                src={previewPhotoUrl}
                alt="Full Reviewer Portrait"
                className="size-full object-contain max-h-[80vh]"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
