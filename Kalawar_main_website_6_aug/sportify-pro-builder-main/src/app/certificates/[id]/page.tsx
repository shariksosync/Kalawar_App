"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
  Award,
  Printer,
  Download,
  CheckCircle2,
  Share2,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Building2,
  Sparkles,
  Loader2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "@/lib/utils";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useSettings } from "@/lib/settings-context";
import { downloadCertificatePDF, printCertificateSlip } from "@/lib/certificate-pdf";
import { RefereeCertificateView } from "@/components/certificates/RefereeCertificateView";
import { ClubAffiliationCertificateView } from "@/components/certificates/ClubAffiliationCertificateView";
import type { CertificateItem } from "@/types/certificate";

export default function CertificatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { settings } = useSettings();

  const [cert, setCert] = useState<CertificateItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCertificate() {
      if (!id) return;
      try {
        setLoading(true);
        setNotFound(false);
        const res = await fetch(`/api/certificates/${encodeURIComponent(id)}`, { cache: "no-store" });
        const data = await res.json();

        if (data.success && data.certificate) {
          const certificate: CertificateItem = data.certificate;

          // Check if this certificate belongs to a specialized route and redirect
          const isDan =
            certificate.isDanCert ||
            certificate.type?.toLowerCase().includes("dan") ||
            certificate.type?.toLowerCase().includes("black belt") ||
            certificate.number?.startsWith("KAC-DAN") ||
            certificate.position?.toLowerCase().includes("dan");

          const isBelt =
            (certificate.isBeltCert ||
              certificate.type?.toLowerCase().includes("belt examination") ||
              certificate.number?.startsWith("KAC-BELT") ||
              certificate.position?.toLowerCase().includes("grading")) &&
            !isDan;

          const isChamp =
            !isDan &&
            !isBelt &&
            (certificate.type?.toLowerCase().includes("championship") ||
              certificate.type?.toLowerCase().includes("participation") ||
              certificate.number?.startsWith("KAC-CHAMP") ||
              certificate.number?.startsWith("KAL-2026-") ||
              certificate.number?.startsWith("CERT-CHAMP-") ||
              certificate.position?.toLowerCase().includes("medal") ||
              certificate.position?.toLowerCase().includes("place") ||
              certificate.position?.toLowerCase().includes("participant"));

          const isCoach =
            !isDan &&
            !isBelt &&
            !isChamp &&
            (certificate.type?.toLowerCase().includes("coach") ||
              certificate.number?.startsWith("KAL-CO-") ||
              certificate.number?.startsWith("KSM-CO-") ||
              certificate.number?.startsWith("WSF-CO-") ||
              certificate.position?.toLowerCase().includes("coach") ||
              certificate.position?.toLowerCase().includes("coaching"));

          if (isDan) {
            router.replace(`/certificates/dan/${encodeURIComponent(certificate.number || id)}`);
            return;
          }

          if (isBelt) {
            router.replace(`/certificates/belt/${encodeURIComponent(certificate.number || id)}`);
            return;
          }

          if (isChamp) {
            router.replace(`/certificates/championship/${encodeURIComponent(certificate.number || id)}`);
            return;
          }

          if (isCoach) {
            router.replace(`/coach/${encodeURIComponent(certificate.number || certificate.kalawarId || id)}/certificate`);
            return;
          }

          setCert(certificate);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load certificate preview:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [id, router]);

  const isAffiliationCertificate =
    cert?.type === "Club Affiliation Certificate" ||
    cert?.type === "Affiliation Certificate" ||
    cert?.event?.toLowerCase().includes("affiliation") ||
    cert?.number?.startsWith("KAC-AFF") ||
    cert?.number?.startsWith("KSM-CL") ||
    cert?.number?.startsWith("WSF-CL");

  const handlePrint = async () => {
    if (!cert) return;
    if (isAffiliationCertificate) {
      await printCertificateSlip(cert);
      return;
    }
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator
          .share({
            title: `Official Certificate - ${cert?.holder || "Credential"}`,
            text: `Federation authenticated certificate ${cert?.number} for ${cert?.holder}`,
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Certificate verification URL copied to clipboard!");
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!cert) return;
    toast.loading("Generating Official High-Resolution PDF...", { id: "pdf-gen" });
    try {
      await downloadCertificatePDF(cert);
      toast.success("Certificate PDF generated successfully!", { id: "pdf-gen" });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate certificate PDF", { id: "pdf-gen" });
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
          <p className="text-xs text-stone-400">Verifying official federation credentials from national registry...</p>
        </div>
      </SiteLayout>
    );
  }

  if (notFound || !cert) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] bg-[#07080a] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Award className="w-16 h-16 text-stone-700" />
          <h1 className="text-2xl font-bold text-white">Certificate Credential Not Found</h1>
          <p className="text-sm text-stone-400 max-w-md">
            The certificate credential with identifier &quot;{id}&quot; could not be found or has not yet been issued.
          </p>
          <Link
            href="/certificates"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition"
          >
            ← Return to Certificate Verification
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const isRefereeCert =
    cert.type === "Referee / Technical Official Certificate" ||
    cert.position?.toLowerCase().includes("referee") ||
    cert.event?.toLowerCase().includes("referee");

  const isAffiliationCert =
    cert.type === "Club Affiliation Certificate" ||
    cert.type === "Affiliation Certificate" ||
    cert.event?.toLowerCase().includes("affiliation") ||
    cert.number?.startsWith("KAC-AFF") ||
    cert.number?.startsWith("KSM-CL") ||
    cert.number?.startsWith("WSF-CL");

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#07080a] text-stone-100 pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 print:p-0 print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-primary transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Certificate Verification
            </Link>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition cursor-pointer text-center"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-semibold bg-stone-800 border border-stone-700 text-white hover:bg-stone-700 transition cursor-pointer text-center"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11.5px] sm:text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20 cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5" /> Download Official PDF
              </button>
            </div>
          </div>

          {/* Certificate Display Area */}
          <div className="space-y-6">
            {isRefereeCert ? (
              <div className="rounded-3xl overflow-hidden border border-border/60 shadow-2xl bg-slate-950 p-2 sm:p-4">
                <RefereeCertificateView
                  certificate={cert}
                  verificationUrl={
                    typeof window !== "undefined"
                      ? window.location.href
                      : `https://kalawarfederation.org/certificates/${encodeURIComponent(cert.number)}`
                  }
                />
              </div>
            ) : isAffiliationCert ? (
              <div className="rounded-3xl overflow-hidden border border-border/60 shadow-2xl bg-white p-2 sm:p-4">
                <ClubAffiliationCertificateView certificate={cert} />
              </div>
            ) : (
              /* General Certificate of Achievement / Accreditation */
              <div className="rounded-3xl border-4 border-double border-amber-400/80 bg-gradient-to-b from-[#fffef7] to-[#faf5e8] text-stone-900 p-6 sm:p-12 shadow-2xl space-y-6 text-center relative overflow-hidden max-w-4xl mx-auto">
                <div className="border border-amber-600/30 p-6 sm:p-8 rounded-2xl space-y-6">
                  {/* Top Header */}
                  <div className="space-y-1">
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-900">
                      {settings.federationName || "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA"}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-amber-800 font-serif">
                      CERTIFICATE OF ACCREDITATION
                    </h2>
                    <p className="text-xs text-amber-900/70 uppercase tracking-wider font-mono">
                      NATIONAL CERTIFICATE NO: {cert.number}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-3 py-4">
                    <p className="text-sm text-stone-600 italic">This is to officially certify that</p>
                    <p className="text-2xl sm:text-4xl font-black text-amber-950 uppercase tracking-tight font-serif border-b-2 border-amber-400/60 inline-block pb-1">
                      {cert.holder}
                    </p>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Member ID: <strong className="font-mono text-stone-900">{cert.kalawarId || cert.id}</strong> · {cert.state}, India
                    </p>
                    <p className="text-sm sm:text-base text-stone-700 leading-relaxed pt-3 max-w-xl mx-auto">
                      has successfully achieved <strong className="text-amber-900 font-bold">{cert.position}</strong> in recognition of merit and accredited service in{" "}
                      <strong className="text-stone-900">{cert.event}</strong>.
                    </p>
                  </div>

                  {/* Footer Signatures & Live Scannable QR */}
                  <div className="pt-6 border-t border-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-1.5 rounded-xl border border-amber-400 shadow-xs">
                        <QRCode
                          value={
                            typeof window !== "undefined"
                              ? window.location.href
                              : `https://kalawarfederation.org/certificates/${encodeURIComponent(cert.number)}`
                          }
                          size={64}
                        />
                      </div>
                      <div className="text-xs text-stone-600">
                        <p className="font-bold text-stone-900 flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-600" /> Digital Ledger Seal
                        </p>
                        <p>Issued: {formatToDDMMYYYY(cert.issued)}</p>
                        {cert.validUntil && <p>Valid Until: {formatToDDMMYYYY(cert.validUntil)}</p>}
                      </div>
                    </div>

                    <div className="text-right text-xs text-stone-800">
                      <p className="font-bold font-serif text-sm">{cert.issuedBy || "National Technical Board"}</p>
                      <p className="text-[11px] text-stone-600">Governing Council &amp; Federation Secretariat</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credential Verification Card */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 grid place-items-center shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground">Federation Verified Credential</h4>
                  <p className="text-xs text-muted-foreground font-mono break-all sm:break-normal">
                    Credential ID: <strong className="text-primary font-bold">{cert.number}</strong> · Status: Active &amp; Valid
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Conferred: {formatToDDMMYYYY(cert.issued)}</span>
                </div>
                {cert.validUntil && (
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="size-3.5 text-emerald-400" />
                    <span>Expires: {formatToDDMMYYYY(cert.validUntil)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
