"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  Smartphone,
  ExternalLink,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

export interface ShareData {
  title: string;
  text?: string;
  url?: string;
  image?: string;
  price?: number;
  code?: string;
  category?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

export function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Compute full URL safely
  const shareUrl =
    data.url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `Check out ${data.title}${data.price ? ` (₹${data.price})` : ""} on Kalawar Sports & Martial Arts Federation:`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error("Could not share");
        }
      }
    }
  };

  const sharePlatforms = [
    {
      name: "WhatsApp",
      description: "Chat or Status",
      color: "from-emerald-500 to-green-600",
      bgHover: "hover:border-emerald-500/50 hover:bg-emerald-500/10",
      iconBg: "bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.03C9.36 7.03 9.08 7.09 8.84 7.35C8.6 7.61 7.92 8.25 7.92 9.54C7.92 10.83 8.86 12.08 9 12.26C9.13 12.44 10.83 15.08 13.44 16.2C15.62 17.13 16.06 16.95 16.54 16.9C17.02 16.86 18.07 16.27 18.29 15.66C18.5 15.06 18.5 14.53 18.44 14.43C18.37 14.33 18.19 14.27 17.92 14.13C17.65 14 16.32 13.34 16.07 13.25C15.82 13.16 15.65 13.12 15.47 13.38C15.3 13.65 14.78 14.27 14.63 14.44C14.47 14.62 14.32 14.64 14.05 14.5C13.78 14.37 12.92 14.09 11.89 13.17C11.09 12.45 10.55 11.57 10.39 11.3C10.24 11.03 10.37 10.89 10.51 10.75C10.63 10.63 10.78 10.43 10.92 10.27C11.06 10.11 11.11 10 11.2 9.81C11.29 9.63 11.24 9.47 11.18 9.35C11.11 9.23 10.6 7.97 10.39 7.46C10.18 6.97 9.97 7.04 9.8 7.03C9.64 7.03 9.47 7.03 9.53 7.03Z" />
        </svg>
      ),
      getUrl: () =>
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `*${data.title}*${data.price ? ` - ₹${data.price}` : ""}\nCheck it out here: ${shareUrl}`
        )}`,
    },
    {
      name: "Facebook",
      description: "Feed & Stories",
      color: "from-blue-600 to-indigo-600",
      bgHover: "hover:border-blue-500/50 hover:bg-blue-500/10",
      iconBg: "bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      getUrl: () =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Snapchat",
      description: "Send to Snaps",
      color: "from-yellow-400 to-amber-500",
      bgHover: "hover:border-yellow-400/50 hover:bg-yellow-400/10",
      iconBg: "bg-[#FFFC00]/20 text-yellow-400 border-yellow-400/30",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.016 2c-3.791 0-6.19 2.531-6.19 5.56 0 1.25.438 2.532 1.047 3.328.172.235.125.407-.063.532-.422.281-1.078.687-1.468 1.046-.422.391-.454.813-.188 1.25.328.532 1.063.922 1.938 1.094.234.047.375.203.359.438-.078.781-.156 1.484-.187 1.843-.078.86.375 1.407 1.25 1.407.469 0 1.031-.172 1.688-.453.406-.172.672-.125.968.14.735.657 1.547 1.016 2.516 1.016.969 0 1.781-.359 2.516-1.016.297-.265.562-.312.968-.14.657.281 1.219.453 1.688.453.875 0 1.328-.547 1.25-1.407-.031-.359-.109-1.062-.187-1.843-.016-.235.125-.391.359-.438.875-.172 1.61-.562 1.938-1.094.266-.437.234-.859-.188-1.25-.39-.359-1.046-.765-1.468-1.046-.188-.125-.235-.297-.063-.532.609-.796 1.047-2.078 1.047-3.328 0-3.029-2.399-5.56-6.19-5.56z" />
        </svg>
      ),
      getUrl: () =>
        `https://www.snapchat.com/share?link=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "X / Twitter",
      description: "Post to timeline",
      color: "from-slate-200 to-slate-400",
      bgHover: "hover:border-zinc-400/50 hover:bg-zinc-800/40",
      iconBg: "bg-white/10 text-white border-white/20",
      icon: (
        <svg className="size-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      getUrl: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Check out ${data.title}${data.price ? ` (₹${data.price})` : ""} at Kalawar Sports:`
        )}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      description: "Direct message",
      color: "from-sky-400 to-blue-500",
      bgHover: "hover:border-sky-400/50 hover:bg-sky-400/10",
      iconBg: "bg-[#229ED9]/20 text-[#229ED9] border-[#229ED9]/30",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.61 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.89 8.01-3.45 3.81-1.59 4.6-1.87 5.12-1.88.11 0 .37.03.53.17.14.12.18.28.2.45-.01.07.01.21 0 .28z" />
        </svg>
      ),
      getUrl: () =>
        `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(
          `${data.title}${data.price ? ` - ₹${data.price}` : ""}`
        )}`,
    },
    {
      name: "Email",
      description: "Send via Email",
      color: "from-amber-500 to-orange-600",
      bgHover: "hover:border-amber-500/50 hover:bg-amber-500/10",
      iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: <Mail className="size-5" />,
      getUrl: () =>
        `mailto:?subject=${encodeURIComponent(
          `Check out: ${data.title}`
        )}&body=${encodeURIComponent(
          `Hi,\n\nI thought you might like this official product from Kalawar Sports & Martial Arts Federation:\n\n${data.title}\n${data.price ? `Price: ₹${data.price}\n` : ""}\nView details and order here:\n${shareUrl}`
        )}`,
    },
  ];

  const handleShareClick = (platform: (typeof sharePlatforms)[0]) => {
    const url = platform.getUrl();
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer,width=650,height=600");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="luxe-card relative w-full max-w-lg rounded-3xl border border-border/80 bg-background/95 p-6 sm:p-7 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                  <Share2 className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {data.price !== undefined ? "Share Product" : "Share Article"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {data.price !== undefined ? "Share with athletes, coaches & martial arts groups" : "Share this federation news story"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent/40 grid place-items-center transition-colors cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Product/Article Card Preview */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-accent/20 p-3 min-w-0">
              {data.image ? (
                <div className="size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl bg-background border border-border/60">
                  <img
                    src={data.image}
                    alt={data.title}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="size-14 sm:size-16 shrink-0 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-primary font-bold text-lg">
                  KS
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {data.category && (
                    <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-semibold truncate">
                      {data.category}
                    </span>
                  )}
                  {data.code && (
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                      {data.code}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">
                  {data.title}
                </h4>
                {typeof data.price === "number" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-primary">
                      ₹{data.price}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      (GST incl.)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Share via Social Apps
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {sharePlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    type="button"
                    onClick={() => handleShareClick(platform)}
                    className={`flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/50 p-2.5 text-left transition-all ${platform.bgHover} group cursor-pointer`}
                  >
                    <div
                      className={`size-9 shrink-0 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110 ${platform.iconBg}`}
                    >
                      {platform.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                        <span className="truncate">{platform.name}</span>
                        <ExternalLink className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {platform.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Native Mobile Share Button (if supported) */}
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 py-2.5 text-xs font-bold text-primary transition-all shadow-xs cursor-pointer"
              >
                <Smartphone className="size-4" />
                <span>Share via Other Apps on your Device</span>
              </button>
            )}

            {/* Copy Link Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Product Link
                </span>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <QrCode className="size-3" />
                  <span>{showQR ? "Hide QR Code" : "Show QR Code"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-xl border border-border/80 bg-accent/20 px-3 py-2 text-xs font-mono text-muted-foreground select-all outline-none truncate"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-gold-gradient text-background shadow-gold hover:opacity-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code Section (Expandable) */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-black border border-border/80 space-y-2">
                    <QRCode
                      value={shareUrl}
                      size={140}
                      style={{ height: "auto", maxWidth: "100%", width: "140px" }}
                      viewBox="0 0 140 140"
                    />
                    <p className="text-[10px] text-zinc-600 font-medium text-center">
                      Scan with any smartphone camera to view this product instantly
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
