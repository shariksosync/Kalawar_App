"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { IMAGES } from "@/data/images";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { setUser } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim()) {
      toast.error("Please enter your Username or Email");
      return;
    }
    if (!password) {
      toast.error("Please enter your account password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.error || "Invalid credentials");
      }

      setUser(data.user, data.token || null);
      toast.success("Welcome back!", {
        description: `Signed in as ${data.user.name}`,
      });

      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        router.push(redirectParam);
      } else if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setErrorMsg(msg);
      toast.error("Sign In Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={IMAGES.stadiumNight}
          alt=""
          className="size-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/95" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 text-xs font-medium transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> Return to Homepage
        </Link>

        <div className="luxe-card border border-primary/25 bg-card/85 p-8 shadow-gold backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white shadow-gold overflow-hidden">
              <img src="/logo.png" alt="KALAWAR Federation" className="size-full object-contain" />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {redirectParam === "/orders" ? (
                <>
                  <Package className="size-3" /> My Orders Sign In
                </>
              ) : (
                <>
                  <Sparkles className="size-3" /> Athlete & Member Portal
                </>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Member <span className="text-gold-gradient">Sign In</span>
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {redirectParam === "/orders"
                ? "Sign in to your account to view your past orders, track shipments, and download tax invoices."
                : "Sign in with your username or registered email, and password."}
            </p>
          </div>

          {errorMsg && (
            <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Username or Registered Email
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. username or name@domain.com"
                  className="border-border/70 bg-background/60 focus:border-primary w-full rounded-xl border px-4 py-2.5 pl-10 text-sm outline-none transition-colors"
                />
                <User className="text-muted-foreground absolute left-3 top-3 size-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">
                  Account Password
                </label>
                <Link
                  href={redirectParam ? `/forgot-password?redirect=${encodeURIComponent(redirectParam)}` : "/forgot-password"}
                  className="text-[11px] font-semibold text-primary hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-border/70 bg-background/60 focus:border-primary w-full rounded-xl border px-4 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors"
                />
                <Lock className="text-muted-foreground absolute left-3 top-3 size-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-3 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gold-gradient text-background mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            <p>Don't have an official federation profile yet?</p>
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : "/register"}
              className="text-primary hover:underline mt-1.5 inline-block font-semibold"
            >
              Register as a New Athlete or Official &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
