"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { IMAGES } from "@/data/images";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  // Step state: "REQUEST" | "VERIFY" | "SUCCESS"
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST");

  // Step 1: Identifier state
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 2: Verification & New Password state
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Timer countdown for resending code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "VERIFY" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus OTP input upon switching to verification step
  useEffect(() => {
    if (step === "VERIFY") {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Step 1: Request Password Reset OTP
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim()) {
      toast.error("Please enter your Player ID or registered email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not find a registered account with these details.");
      }

      setTempToken(data.tempToken);
      setMaskedEmail(data.maskedEmail || "registered email");
      setStep("VERIFY");
      setCountdown(60);
      setCanResend(false);

      toast.success("Security Code Dispatched!", {
        description: `A 6-digit verification code has been sent to ${data.maskedEmail}`,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to process password reset request";
      setErrorMsg(msg);
      toast.error("Request Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Submit New Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!otpCode || otpCode.trim().length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResetting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Password reset failed. Please check the code.");
      }

      setStep("SUCCESS");
      toast.success("Password Updated Successfully!", {
        description: "Your new password is now active. You can proceed to sign in.",
      });
    } catch (err: any) {
      const msg = err.message || "Invalid or expired verification code";
      setErrorMsg(msg);
      toast.error("Reset Failed", { description: msg });
    } finally {
      setIsResetting(false);
    }
  };

  // Resend OTP Code
  const handleResendOTP = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          tempToken,
          action: "reset",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend verification code");
      }

      if (data.tempToken) {
        setTempToken(data.tempToken);
      }
      if (data.maskedEmail) {
        setMaskedEmail(data.maskedEmail);
      }

      setCountdown(60);
      setCanResend(false);
      setOtpCode("");

      toast.success("Fresh Code Sent!", {
        description: "Please check your email inbox and spam folder.",
      });
    } catch (err: any) {
      toast.error(err.message || "Could not resend verification code");
    } finally {
      setIsResending(false);
    }
  };

  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background image & dark gradients */}
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
          href={loginHref}
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 text-xs font-medium transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Return to Sign In
        </Link>

        <div className="luxe-card border border-primary/25 bg-card/85 p-8 shadow-gold backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white shadow-gold overflow-hidden">
              <img src="/logo.png" alt="KALAWAR Federation" className="size-full object-contain" />
            </div>

            {step === "REQUEST" && (
              <>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <KeyRound className="size-3" /> Password Recovery
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Reset <span className="text-gold-gradient">Password</span>
                </h1>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Enter your official Member ID (e.g. KSM-PL-10240) or registered email to receive a secure recovery code.
                </p>
              </>
            )}

            {step === "VERIFY" && (
              <>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <ShieldCheck className="size-3" /> Identity Verification
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Set New <span className="text-gold-gradient">Password</span>
                </h1>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Enter the 6-digit verification code sent to <br />
                  <strong className="text-foreground font-mono">{maskedEmail}</strong>
                </p>
              </>
            )}

            {step === "SUCCESS" && (
              <>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="size-3" /> Password Reset Complete
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Password <span className="text-gold-gradient">Updated!</span>
                </h1>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Your federation account password has been successfully changed. You can now sign in with your new credentials.
                </p>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: IDENTIFIER SUBMIT FORM */}
          {step === "REQUEST" && (
            <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Player ID or Registered Email
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. KSM-PL-10240 or name@domain.com"
                    className="border-border/70 bg-background/60 focus:border-primary w-full rounded-xl border px-4 py-2.5 pl-10 text-sm outline-none transition-colors"
                  />
                  <User className="text-muted-foreground absolute left-3 top-3 size-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gold-gradient text-background mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Verifying Account...
                  </>
                ) : (
                  <>
                    Send Recovery Code <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="mt-6 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
                <p>Remembered your password?</p>
                <Link
                  href={loginHref}
                  className="text-primary hover:underline mt-1.5 inline-block font-semibold"
                >
                  Back to Member Sign In &rarr;
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP & NEW PASSWORD FORM */}
          {step === "VERIFY" && (
            <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[12px] font-mono text-2xl font-extrabold rounded-2xl border-2 border-primary/50 bg-background/80 py-2.5 text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                  />
                  <KeyRound className="text-primary/60 absolute left-4 top-1/2 -translate-y-1/2 size-5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="border-border/70 bg-background/60 focus:border-primary w-full rounded-xl border px-4 py-2.5 pl-10 pr-10 text-sm outline-none transition-colors"
                  />
                  <Lock className="text-muted-foreground absolute left-3 top-3 size-4" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute right-3 top-3 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting || otpCode.length < 6 || newPassword.length < 6}
                className="bg-gold-gradient text-background mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-gold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" /> Save New Password
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST");
                    setOtpCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setErrorMsg("");
                  }}
                  className="hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="size-3" /> Change ID/Email
                </button>

                <button
                  type="button"
                  disabled={!canResend || isResending}
                  onClick={handleResendOTP}
                  className="text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className={`size-3 ${isResending ? "animate-spin" : ""}`} />
                  {canResend ? "Resend Code" : `Resend in ${countdown}s`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === "SUCCESS" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Credentials Successfully Updated</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Your password has been changed securely. An email notification has been dispatched to your registered address.
                </p>
              </div>

              <Link
                href={loginHref}
                className="bg-gold-gradient text-background flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-gold hover:scale-[1.02] transition-transform text-center cursor-pointer"
              >
                Sign In with New Password <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Security / Help Note */}
        <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <HelpCircle className="size-3.5 text-primary" />
          <span>Need further assistance? Contact the <Link href="/contact" className="text-primary hover:underline font-medium">Federation Secretariat</Link></span>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
