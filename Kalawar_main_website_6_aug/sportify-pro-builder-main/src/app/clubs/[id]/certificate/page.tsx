"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Download,
  Building,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/data/people";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";
import {
  downloadClubAffiliationCertificatePDF,
  printClubAffiliationCertificate,
} from "@/lib/certificate-pdf";

export default function ClubCertificatePage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = decodeURIComponent(rawId || "");

  const [club, setClub] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClub() {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Try primary club lookup
        const res = await fetch(`/api/clubs/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.club) {
          setClub(data.club);
          return;
        }

        // 2. Dual-lookup fallback to certificates registry
        const certRes = await fetch(`/api/certificates/${encodeURIComponent(id)}`);
        if (certRes.ok) {
          const certData = await certRes.json();
          const cert = certData.certificate || certData.data || (certData.success ? certData : null);
          if (cert) {
            const resolvedClub: any = {
              id: cert.kalawarId || cert.id,
              name: cert.holder || cert.academy || "Official Martial Arts Club",
              memberType: "Club",
              state: cert.state || "Maharashtra",
              district: cert.district || "Pune",
              email: cert.email,
              phone: cert.phone,
              headCoachName: cert.headCoachName,
              presidentName: cert.presidentName,
              secretaryName: cert.secretaryName,
              levelOfAffiliation: cert.levelOfAffiliation || cert.position,
              levelsOfAffiliation: cert.levelsOfAffiliation || (cert.levelOfAffiliation ? [cert.levelOfAffiliation] : []),
              clubCategory: cert.clubCategory,
              affiliationCertificateId: cert.affiliationCertificateId || cert.number || cert.id,
              validFrom: cert.issued,
              validUntil: cert.validUntil,
              status: cert.status === "Valid" ? "Affiliated" : cert.status,
            };
            setClub(resolvedClub);
          }
        }
      } catch (err) {
        console.error("Failed to load certificate data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClub();
  }, [id]);

  const handlePrint = () => {
    if (club) {
      printClubAffiliationCertificate(club);
    }
  };

  const handleDownload = () => {
    if (club) {
      downloadClubAffiliationCertificatePDF(club);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Certificate verification link copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-xs text-stone-400 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p>Loading official digital affiliation certificate...</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-stone-300 space-y-4">
        <Building className="w-12 h-12 text-stone-600" />
        <h2 className="text-xl font-bold text-white">Certificate Not Found</h2>
        <Link
          href="/clubs"
          className="px-4 py-2 rounded-xl bg-gold-gradient text-background text-xs font-bold"
        >
          Return to Clubs Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-900 py-6 sm:py-10 px-3 sm:px-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* Top Action Header (Hidden in Print) */}
      <div className="w-full max-w-4xl mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/clubs/${encodeURIComponent(club.id)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Academy Profile</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy Verification Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-stone-800 border border-amber-500/40 text-amber-300 hover:bg-stone-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gold-gradient text-background shadow-gold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Visual Canvas */}
      <div className="w-full max-w-4xl flex justify-center">
        <ClubAffiliationCertificateView club={club} />
      </div>
    </div>
  );
}