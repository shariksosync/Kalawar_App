"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Images,
  UploadCloud,
  RefreshCw,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Type,
  FileImage,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { defaultBannerSlides, type BannerSlide } from "@/types/settings";
import { useSettings } from "@/lib/settings-context";
import { MAX_BANNER_IMAGE_SIZE_MB } from "@/lib/upload-limits";

const TOTAL_BANNERS = 5;

export function AdminBannersManager() {
  const { refreshSettings } = useSettings();
  const [banners, setBanners] = useState<BannerSlide[]>(defaultBannerSlides);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Live Preview Carousel States
  const [previewSlide, setPreviewSlide] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/banners", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
        const loaded: BannerSlide[] = [...data.banners];
        while (loaded.length < TOTAL_BANNERS) {
          const idx = loaded.length;
          const def = defaultBannerSlides[idx] || defaultBannerSlides[0];
          loaded.push({ ...def, id: `slide-${idx + 1}` });
        }
        setBanners(loaded.slice(0, TOTAL_BANNERS));
      } else {
        setBanners(defaultBannerSlides);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
      toast.error("Failed to load banner images.");
      setBanners(defaultBannerSlides);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const activeBanners = banners.filter((b) => b.active !== false && b.image?.trim());

  // Carousel Live Preview Progress Timer (8s interval)
  useEffect(() => {
    if (previewPaused || activeBanners.length <= 1) return;

    const intervalTime = 60;
    const duration = 8000;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setPreviewProgress((old) => {
        if (old >= 100) {
          setPreviewSlide((curr) => (curr + 1) % activeBanners.length);
          return 0;
        }
        return old + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [previewPaused, activeBanners.length]);

  // Adjust preview slide index if active list shrinks
  useEffect(() => {
    if (previewSlide >= activeBanners.length && activeBanners.length > 0) {
      setPreviewSlide(0);
    }
  }, [activeBanners.length, previewSlide]);

  const handleUpdateBanner = (index: number, field: keyof BannerSlide, value: any) => {
    setBanners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetSlot = (index: number) => {
    const def = defaultBannerSlides[index] || defaultBannerSlides[0];
    handleUpdateBanner(index, "image", def.image);
    handleUpdateBanner(index, "title", def.title || "");
    handleUpdateBanner(index, "alt", def.alt || "");
    handleUpdateBanner(index, "link", def.link || "");
    handleUpdateBanner(index, "active", true);
    toast.info(`Slot ${index + 1} reset to default`);
  };

  const handleResetAll = () => {
    if (!confirm("Are you sure you want to reset all 5 banner images to federation defaults?")) {
      return;
    }
    setBanners(defaultBannerSlides);
    toast.info("All 5 banner slots reset to default images");
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    if (file.size > MAX_BANNER_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Please upload an image ${MAX_BANNER_IMAGE_SIZE_MB}MB or smaller.`);
      return;
    }

    setUploadingIndex(index);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kalawar_banners");

      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 15;
        });
      }, 120);

      const res = await new Promise<{ ok: boolean; data?: any }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 90);
            setUploadProgress((curr) => Math.max(curr, pct));
          }
        };
        xhr.onload = () => {
          clearInterval(timer);
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch {
            resolve({ ok: false });
          }
        };
        xhr.onerror = () => {
          clearInterval(timer);
          resolve({ ok: false });
        };
        xhr.send(formData);
      });

      if (res.ok && res.data?.success && res.data?.url) {
        setUploadProgress(100);
        await new Promise((r) => setTimeout(r, 300));
        handleUpdateBanner(index, "image", res.data.url);
        toast.success(`Banner ${index + 1} uploaded to Cloudinary successfully!`);
        return;
      }

      // Fallback to Data URL
      const reader = new FileReader();
      reader.onload = () => {
        handleUpdateBanner(index, "image", reader.result as string);
        toast.success(`Banner ${index + 1} attached successfully!`);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Upload failed, please paste an image URL directly.");
    } finally {
      setUploadingIndex(null);
      setUploadProgress(0);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save banner images");
      }

      toast.success("All 5 banner images saved successfully!", {
        description: "Homepage hero carousel has been updated live.",
      });
      await refreshSettings();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save banner changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <Images className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Banner Images Module</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 font-mono">
                5 Slides
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Customize all 5 widescreen hero banners displayed on the public homepage with Cloudinary uploads, custom links, and active controls.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadBanners}
            disabled={loading || saving}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-200 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            disabled={saving}
            className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 rounded-xl text-xs font-bold text-stone-300 flex items-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="px-5 py-2 bg-gold-gradient text-stone-950 font-black rounded-xl text-xs shadow-gold hover:opacity-95 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Banner Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LIVE MINIATURE CAROUSEL PREVIEW */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Live Homepage Carousel Preview</h3>
            <span className="text-[11px] text-stone-400">
              ({activeBanners.length} of {TOTAL_BANNERS} active)
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
            Recommended Dimensions: 1672 × 941 (16:9 Widescreen)
          </p>
        </div>

        {/* Miniature Carousel Box */}
        <div
          onMouseEnter={() => setPreviewPaused(true)}
          onMouseLeave={() => setPreviewPaused(false)}
          className="relative w-full overflow-hidden rounded-2xl bg-black border border-stone-800 select-none shadow-2xl"
          style={{ aspectRatio: "1672 / 941" }}
        >
          {/* Gold Progress Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 transition-all duration-75 ease-linear"
              style={{ width: `${previewProgress}%` }}
            />
          </div>

          {activeBanners.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-500">
              <FileImage className="w-10 h-10" />
              <p className="text-xs font-semibold">No active banner slides. Toggle at least one banner on below.</p>
            </div>
          ) : (
            activeBanners.map((slide, idx) => {
              const isActive = idx === previewSlide;
              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 size-full transition-opacity duration-700 ease-in-out ${
                    isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={slide.image || "/images/banners/slide1.png"}
                    alt={slide.alt || "Banner Preview"}
                    className="size-full w-full h-full object-contain object-center"
                  />

                  {/* Caption Overlay if Title Exists */}
                  {slide.title && (
                    <div className="absolute bottom-6 left-6 z-20 max-w-md bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-xs font-bold text-amber-400">{slide.title}</p>
                      {slide.link && (
                        <p className="text-[10px] text-stone-300 font-mono mt-0.5 truncate">
                          Link: {slide.link}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Prev/Next buttons */}
          {activeBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPreviewSlide((curr) => (curr - 1 + activeBanners.length) % activeBanners.length);
                  setPreviewProgress(0);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-black/70 hover:bg-amber-500/20 text-white hover:text-amber-400 border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewSlide((curr) => (curr + 1) % activeBanners.length);
                  setPreviewProgress(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-black/70 hover:bg-amber-500/20 text-white hover:text-amber-400 border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-1.5">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPreviewSlide(idx);
                    setPreviewProgress(0);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === previewSlide ? "w-6 bg-amber-400" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5 BANNER EDITING CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Configure 5 Banner Slots</span>
          </h3>
          <span className="text-xs text-stone-400">Total Slots: 5</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {banners.map((banner, index) => {
            const isUploading = uploadingIndex === index;
            const isFirst = index === 0;

            return (
              <div
                key={banner.id || index}
                className={`bg-stone-900/80 border rounded-3xl p-5 space-y-4 transition-all ${
                  banner.active !== false
                    ? "border-stone-800 hover:border-amber-500/40 shadow-lg"
                    : "border-stone-800/50 opacity-60 bg-stone-950/60"
                }`}
              >
                {/* Slot Card Header */}
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="size-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Banner Slide {index + 1}</span>
                        {isFirst && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 uppercase">
                            Hero Primary
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Active Toggle Switch */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] font-semibold text-stone-400">
                        {banner.active !== false ? "Active" : "Disabled"}
                      </span>
                      <input
                        type="checkbox"
                        checked={banner.active !== false}
                        onChange={(e) => handleUpdateBanner(index, "active", e.target.checked)}
                        className="size-4 rounded border-stone-700 bg-stone-950 text-amber-400 focus:ring-amber-400 cursor-pointer"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleResetSlot(index)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                      title="Reset slot to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Banner Image Preview Container */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-stone-800 flex items-center justify-center group" style={{ aspectRatio: "1672 / 941" }}>
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.alt || `Banner ${index + 1}`}
                      className="size-full object-contain object-center"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-stone-600">
                      <FileImage className="w-8 h-8" />
                      <span className="text-[11px]">No image assigned</span>
                    </div>
                  )}

                  {/* Upload Overlay Loader */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
                      <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                      <span className="text-xs font-bold text-white">Uploading to Cloudinary...</span>
                      <div className="w-40 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload & Direct URL Controls */}
                <div className="space-y-3 text-xs">
                  {/* Cloudinary Upload Trigger */}
                  <div>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[index] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(index, file);
                      }}
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={isUploading}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-amber-400" />
                        <span>Upload New Image</span>
                      </button>

                      {banner.image && (
                        <a
                          href={banner.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-400 hover:text-amber-400 transition flex items-center justify-center"
                          title="Open image in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] text-stone-400">
                      Maximum image size: {MAX_BANNER_IMAGE_SIZE_MB} MB
                    </p>
                  </div>

                  {/* Direct Image URL Input */}
                  <div>
                    <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <FileImage className="w-3 h-3 text-amber-400" />
                      <span>Image URL / Path *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={banner.image}
                      onChange={(e) => handleUpdateBanner(index, "image", e.target.value)}
                      placeholder="/images/banners/slide1.png or https://res.cloudinary.com/..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  {/* Optional Title & Action Link in 2-col */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                        <Type className="w-3 h-3 text-amber-400" />
                        <span>Title / Headline (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={banner.title || ""}
                        onChange={(e) => handleUpdateBanner(index, "title", e.target.value)}
                        placeholder="e.g. National Championship 2026"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-amber-400" />
                        <span>Action Target Link (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={banner.link || ""}
                        onChange={(e) => handleUpdateBanner(index, "link", e.target.value)}
                        placeholder="e.g. /championship/register"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Alt Text / Accessibility Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={banner.alt || ""}
                      onChange={(e) => handleUpdateBanner(index, "alt", e.target.value)}
                      placeholder="e.g. Kalawar Sports Championship Official Poster"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-xs text-stone-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Changes will apply directly to the homepage hero slider.</span>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-gold-gradient text-stone-950 font-black rounded-xl text-xs shadow-gold hover:opacity-95 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Banner Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All 5 Banners</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
