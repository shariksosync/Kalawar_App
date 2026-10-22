"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Check,
  RefreshCw,
  Move,
  Crop,
  Shield,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PhotoCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (blob: Blob, dataUrl: string) => Promise<void> | void;
  aspectRatio?: number; // width / height (default: 138 / 178 = 0.7753)
  cropShape?: "rect" | "round";
  title?: string;
  isSaving?: boolean;
}

export function PhotoCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio: customAspectRatio,
  cropShape = "rect",
  title = "Adjust ID Card Photo",
  isSaving = false,
}: PhotoCropperModalProps) {
  const isRound = cropShape === "round";
  const aspectRatio = customAspectRatio ?? (isRound ? 1 : 138 / 178);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [localImageSrc, setLocalImageSrc] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Target crop viewport dimensions in pixels (modal preview)
  const CROP_BOX_HEIGHT = isRound ? 260 : 280;
  const CROP_BOX_WIDTH = isRound ? 260 : Math.round(CROP_BOX_HEIGHT * aspectRatio); // ~214px

  // Calculate base display dimensions of the image to cover CROP_BOX at zoom = 1
  const { displayedWidth, displayedHeight } = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) {
      return { displayedWidth: CROP_BOX_WIDTH, displayedHeight: CROP_BOX_HEIGHT };
    }
    const imgRatio = naturalSize.width / naturalSize.height;
    if (imgRatio > aspectRatio) {
      // Wider than crop box: match height to crop box, width scales accordingly
      const h = CROP_BOX_HEIGHT;
      const w = Math.round(h * imgRatio);
      return { displayedWidth: w, displayedHeight: h };
    } else {
      // Taller than crop box: match width to crop box, height scales accordingly
      const w = CROP_BOX_WIDTH;
      const h = Math.round(w / imgRatio);
      return { displayedWidth: w, displayedHeight: h };
    }
  }, [naturalSize, aspectRatio, CROP_BOX_WIDTH, CROP_BOX_HEIGHT]);

  // Reset to default auto-crop (Head & Shoulders centered, top-aligned)
  const resetToDefaultCrop = useCallback(() => {
    setRotation(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Load image dimensions and convert to object URL to prevent CORS canvas taint
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    let active = true;
    let createdUrl = "";

    if (imageSrc.startsWith("data:") || imageSrc.startsWith("blob:")) {
      setLocalImageSrc(imageSrc);
      const img = new Image();
      img.onload = () => {
        if (!active) return;
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        resetToDefaultCrop();
      };
      img.src = imageSrc;
      return;
    }

    // Remote URL: fetch as blob to avoid canvas security error
    fetch(imageSrc, { mode: "cors" })
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setLocalImageSrc(createdUrl);
        const img = new Image();
        img.onload = () => {
          if (!active) return;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          resetToDefaultCrop();
        };
        img.src = createdUrl;
      })
      .catch(() => {
        if (!active) return;
        setLocalImageSrc(imageSrc);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (!active) return;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          resetToDefaultCrop();
        };
        img.src = imageSrc;
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [imageSrc, isOpen, resetToDefaultCrop]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.max(0.5, Math.min(3.5, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate cropped canvas blob and dataUrl
  const generateCroppedImage = useCallback(async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return null;

    // High resolution output canvas (600 x 783)
    const exportWidth = 600;
    const exportHeight = Math.round(exportWidth / aspectRatio); // ~783

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill background with white in case of transparent PNG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Scale factor between modal display viewport and high-res export canvas
    const scaleFactor = exportWidth / CROP_BOX_WIDTH;

    ctx.save();
    // Move canvas center to origin
    ctx.translate(exportWidth / 2, exportHeight / 2);

    // Apply offset translated to canvas scale
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Image draw dimensions on the high-res canvas
    const drawW = displayedWidth * zoom * scaleFactor;
    const drawH = displayedHeight * zoom * scaleFactor;

    try {
      ctx.drawImage(
        imageRef.current,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );
    } catch (err) {
      console.error("Canvas drawImage error (possible CORS):", err);
      return null;
    }

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          resolve({ blob, dataUrl });
        },
        "image/jpeg",
        0.95
      );
    });
  }, [aspectRatio, CROP_BOX_WIDTH, displayedHeight, displayedWidth, naturalSize, offset, rotation, zoom]);

  // Update live preview whenever adjustments change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!isOpen || !imageRef.current) return;
      const res = await generateCroppedImage();
      if (active && res) {
        setPreviewUrl(res.dataUrl);
      }
    }, 60);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, zoom, rotation, offset, displayedWidth, displayedHeight, generateCroppedImage]);

  // Handle Save
  const handleSave = async () => {
    setIsExporting(true);
    try {
      const result = await generateCroppedImage();
      if (result) {
        await onCropComplete(result.blob, result.dataUrl);
      }
    } catch (err) {
      console.error("Crop save error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Crop className="size-4.5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Drag photo to position, use slider or mouse wheel to zoom
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving || isExporting}
              className="size-8 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Top Auto-Crop Tip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Default Auto-Crop Active:</strong> Centered and framed for official player ID card.
                </span>
              </div>
              <button
                type="button"
                onClick={resetToDefaultCrop}
                className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg border border-amber-500/30 transition-colors shrink-0 ml-2 cursor-pointer"
              >
                Reset Auto-Crop
              </button>
            </div>

            {/* Main Interactive Crop Area + Live Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Interactive Viewport Canvas (Left / Col 7) */}
              <div className="md:col-span-7 flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Move className="size-3.5 text-primary" /> Drag & Position Frame
                </span>

                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  style={{
                    width: `${CROP_BOX_WIDTH}px`,
                    height: `${CROP_BOX_HEIGHT}px`,
                  }}
                  className={`relative ${
                    isRound ? "rounded-full" : "rounded-xl"
                  } overflow-hidden cursor-grab active:cursor-grabbing border-2 border-primary shadow-2xl bg-neutral-950 select-none flex items-center justify-center ${
                    isDragging ? "cursor-grabbing" : ""
                  }`}
                >
                  {/* Background grid overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />

                  {/* Circular or grid guidelines */}
                  {isRound ? (
                    <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-dashed border-amber-400/50 z-10 flex items-center justify-center">
                      <div className="size-16 rounded-full border border-amber-400/30" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30 border border-white/20 z-10">
                      <div className="border-r border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div className="border-r border-b border-white/40" />
                      <div />
                    </div>
                  )}

                  {/* The Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={localImageSrc || imageSrc}
                    alt="Crop preview"
                    draggable={false}
                    crossOrigin="anonymous"
                    style={{
                      width: `${displayedWidth}px`,
                      height: `${displayedHeight}px`,
                      minWidth: `${displayedWidth}px`,
                      minHeight: `${displayedHeight}px`,
                      maxWidth: "none",
                      maxHeight: "none",
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.05s ease-out",
                      position: "absolute",
                    }}
                    className="pointer-events-none select-none origin-center"
                  />
                </div>
              </div>

              {/* Live ID Card Preview Card (Right / Col 5) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Eye className="size-3.5 text-primary" /> Live ID Card Preview
                </span>

                {/* ID Card Mockup Box */}
                <div className="relative w-[190px] h-[228px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border-2 border-amber-500/50 p-3 shadow-xl flex flex-col items-center justify-between text-center overflow-hidden">
                  <div className="w-full flex items-center justify-between border-b border-amber-500/30 pb-1">
                    <span className="text-[8px] font-black text-amber-400 tracking-wider">
                      {isRound ? "CLUB / ACADEMY ID" : "OFFICIAL ID"}
                    </span>
                    <Shield className="size-2.5 text-amber-400" />
                  </div>

                  {/* Photo Frame in ID card */}
                  <div
                    className={`${
                      isRound
                        ? "w-[92px] h-[92px] rounded-full"
                        : "w-[84px] h-[110px] rounded-md"
                    } border-2 border-amber-400 overflow-hidden bg-slate-800 shadow-md relative my-1 flex items-center justify-center`}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="ID Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[9px] font-medium">
                        Loading...
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-0.5 border-t border-slate-700/80 pt-1">
                    <div className="h-1.5 w-16 bg-slate-600 rounded-full mx-auto" />
                    <div className="h-1.5 w-12 bg-amber-400/60 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-3">
              {/* Zoom Control */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                  className="p-1 hover:bg-accent/40 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.1).toFixed(2))))}
                  className="p-1 hover:bg-accent/40 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="size-4" />
                </button>
                <span className="text-xs font-mono text-foreground font-semibold w-12 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/30 hover:bg-accent/50 text-foreground rounded-lg border border-border/70 transition-colors font-semibold cursor-pointer"
                  >
                    <RotateCw className="size-3.5" />
                    Rotate 90°
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/30 hover:bg-accent/50 text-foreground rounded-lg border border-border/70 transition-colors font-semibold cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    Center
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Ratio: 138 × 178 (ID Standard)
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border/60 bg-muted/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isExporting}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isExporting}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving || isExporting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Applying Crop...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Save & Apply Photo
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
