"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  label?: string;
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  folder?: string;
  helperText?: string;
  maxSizeMB?: number;
}

export function ImageUploadField({
  label = "Image",
  value,
  onChange,
  multiple = false,
  folder = "kalawar_uploads",
  helperText,
  maxSizeMB = 2,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images: string[] = multiple
    ? Array.isArray(value)
      ? value.filter(Boolean)
      : value ? [value] : []
    : typeof value === "string" && value ? [value] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size limit
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
          toast.error(
            `File "${file.name}" exceeds the ${maxSizeMB}MB limit. Please upload files under ${maxSizeMB}MB.`
          );
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to upload image");
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        if (multiple) {
          const updated = [...images, ...uploadedUrls];
          onChange(updated);
        } else {
          onChange(uploadedUrls[0]);
        }
        toast.success(
          uploadedUrls.length === 1
            ? "Image uploaded successfully!"
            : `${uploadedUrls.length} images uploaded successfully!`
        );
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = images.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  const handleSetPrimary = (index: number) => {
    if (!multiple || index === 0) return;
    const selected = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([selected, ...rest]);
    toast.success("Set as primary product image");
  };

  return (
    <div className="space-y-2.5">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <label className="font-semibold text-muted-foreground text-xs flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-primary" /> {label}
        </label>
      </div>

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="hidden"
      />

      {/* Upload Dropzone / Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-accent/10 p-5 text-center transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="size-7 text-primary animate-spin" />
            <p className="text-xs font-semibold text-primary">
              Uploading image to Cloudinary...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 grid place-items-center text-primary group-hover:scale-110 transition-transform">
              <UploadCloud className="size-5" />
            </div>
            <p className="text-xs font-bold text-foreground">
              Click to Upload {multiple ? "Images" : "Image"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Supports JPG, PNG, WEBP, GIF (Up to {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {multiple ? `Uploaded Images (${images.length})` : "Current Image Preview"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => (
              <div
                key={imgUrl + index}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/80 bg-card/60 shadow-sm"
              >
                <img
                  src={imgUrl}
                  alt={`Product Preview ${index + 1}`}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute(
                      "src",
                      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
                    );
                  }}
                />

                {/* Primary Badge for Multi-Image */}
                {multiple && index === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-primary text-background font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                    <Star className="size-2.5 fill-current" /> Primary
                  </span>
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                  {multiple && index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(index);
                      }}
                      className="size-7 rounded-full bg-background text-foreground hover:text-primary grid place-items-center shadow"
                      title="Set as Primary Image"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="size-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 grid place-items-center shadow"
                    title="Remove Image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
