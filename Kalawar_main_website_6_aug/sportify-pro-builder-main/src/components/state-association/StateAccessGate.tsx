"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, Clock, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { IMAGES } from "@/data/images";

interface StateAccessGateProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  badge?: string;
}

export function StateAccessGate({
  children,
  pageTitle = "State Association Governance",
  pageSubtitle = "Official state-level federation administration.",
  badge = "State Association Unit",
}: StateAccessGateProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setChecking(false);
    }
  }, [isLoading]);

  if (isLoading || checking) {
    return (
      <SiteLayout>
        <PageHero eyebrow="State Governance" title={pageTitle} description={pageSubtitle} image={IMAGES.heroStadium} />
        <div className="shell max-w-5xl py-16 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
          <RefreshCw className="size-8 animate-spin text-amber-400" />
          <p className="text-xs font-semibold text-stone-400">Verifying State Association credentials &amp; permissions...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SiteLayout>
        <PageHero eyebrow="State Governance" title={pageTitle} description={pageSubtitle} image={IMAGES.heroStadium} />
        <div className="shell max-w-lg py-16 text-center space-y-5">
          <div className="size-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase">Authentication Required</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Please log in with your official State Association administrative account to access this state governance module.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="bg-gold-gradient text-stone-950 font-black px-6 py-2.5 rounded-full text-xs shadow-gold inline-flex items-center gap-2"
            >
              Sign In to Member Portal
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const isStateAssoc =
    user.memberType === "StateAssociation" ||
    user.memberType === "State Association" ||
    user.id?.startsWith("KSM-SA-") ||
    user.id?.startsWith("WSF-SA-") ||
    user.role === "admin";

  const userStatus = (user.status || "Pending").trim();
  const isActive = userStatus.toLowerCase() === "active" || user.role === "admin";

  if (!isActive) {
    return (
      <SiteLayout>
        <PageHero eyebrow="State Governance" title={pageTitle} description={pageSubtitle} image={IMAGES.heroStadium} />
        <div className="shell max-w-2xl py-16 px-4">
          <div className="p-8 sm:p-10 rounded-3xl bg-stone-900/90 border-2 border-amber-500/40 shadow-2xl text-center space-y-6">
            <div className="size-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
              <Lock className="size-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 text-[11px] font-bold uppercase font-mono">
                <Clock className="size-3.5" /> Account Status: {userStatus}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Access Restricted – Account Under Verification
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-lg mx-auto">
                Your State Association accreditation for <strong className="text-amber-300">{user.state || "your designated state"}</strong> is currently in <strong className="text-amber-400">{userStatus}</strong> status.
              </p>
              <p className="text-xs text-stone-400 leading-relaxed max-w-lg mx-auto">
                Official club, coach, and player state governance access will automatically unlock once your application is reviewed and marked <strong className="text-emerald-400">Active</strong> by the National Secretariat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">Official Representative:</span>
                <span className="font-bold text-white">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">State Association Unit:</span>
                <span className="font-bold text-amber-300">{user.state || "National Unit"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Association ID:</span>
                <span className="font-mono font-bold text-primary">{user.id}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await refreshUser();
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 inline-flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Refresh Verification Status
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <ArrowLeft className="size-3.5" /> Return to My Profile
              </Link>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero eyebrow={badge} title={pageTitle} description={pageSubtitle} image={IMAGES.heroStadium} />
      <section className="py-6 sm:py-10 bg-background min-h-[600px]">
        <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8">{children}</div>
      </section>
    </SiteLayout>
  );
}
