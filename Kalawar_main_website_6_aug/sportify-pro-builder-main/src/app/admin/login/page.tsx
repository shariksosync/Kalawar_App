"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IMAGES } from "@/data/images";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const err = data.error || "Invalid email or password";
        setErrorMsg(err);
        toast.error("Authentication Failed", { description: err });
        setLoading(false);
        return;
      }

      toast.success("Welcome back!", { description: "Redirecting to Admin Dashboard..." });
      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
      toast.error("Error", { description: "Failed to connect to authentication service." });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background Stadium with deep luxury overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={IMAGES.stadiumNight}
          alt=""
          className="size-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/95" />
      </div>

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute -top-24 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-[440px]">
        {/* Back Link Pill */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all mb-6 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 text-primary" />
          <span>Return to Homepage</span>
        </Link>

        {/* Premium Login Card */}
        <div className="relative rounded-3xl border border-amber-500/30 bg-card/90 p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(234,179,8,0.18)] backdrop-blur-2xl overflow-hidden">
          {/* Top Golden Light Reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Header */}
          <div className="text-center">
            {/* Logo Crest with Dual Gold Ring Glow */}
            <div className="relative mx-auto size-24 p-1 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <div className="size-full rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="KALAWAR Sports & Martial Arts Federation of India"
                  className="size-full object-contain"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
              <Sparkles className="size-3 text-amber-400" /> National Admin Portal
            </div>

            {/* Title */}
            <h1 className="mt-3 text-center uppercase">
              <span className="block text-gold-gradient text-2xl font-black tracking-wider drop-shadow-sm">
                KALAWAR SPORTS
              </span>
              <span className="block text-amber-200/90 text-xs sm:text-[13px] font-bold tracking-normal mt-0.5">
                &amp; Martial Arts Federation of India
              </span>
            </h1>

            <p className="mt-2.5 text-xs text-muted-foreground/90 leading-relaxed max-w-xs mx-auto text-center">
              Sign in with verified secretariat credentials to access national federation administration.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-5 rounded-2xl border border-destructive/50 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Admin Email Address or User ID
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. info@kalawarmartialarts.org or admin_kolhapur"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 bg-background/80 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground/80">
                  Security Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 bg-background/80 py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gold-gradient text-background mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-gold hover:shadow-gold-hover hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Sign In to Admin Portal
                </>
              )}
            </button>
          </form>

          {/* Official Federated Accreditation Footer */}
          <div className="mt-7 pt-5 border-t border-border/50 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground/90">
              <ShieldCheck className="size-3.5 text-amber-400" />
              <span>Secretariat Access • 256-Bit SSL Encrypted</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
              Official National Governance System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
