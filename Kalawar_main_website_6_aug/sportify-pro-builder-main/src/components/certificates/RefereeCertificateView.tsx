"use client";

import React from "react";
import QRCode from "react-qr-code";
import { formatToDDMMYYYY } from "@/lib/utils";
import type { CertificateItem } from "@/types/certificate";

interface RefereeCertificateViewProps {
  certificate: CertificateItem;
  className?: string;
  verificationUrl?: string;
}

export function RefereeCertificateView({
  certificate,
  className = "",
  verificationUrl,
}: RefereeCertificateViewProps) {
  const isLevel3 =
    certificate.position?.includes("Level 3") ||
    certificate.event?.includes("Level 3");
  const isLevel2 =
    certificate.position?.includes("Level 2") ||
    certificate.event?.includes("Level 2");

  const templateSrc = isLevel3
    ? "/certificates/referee-templates/referee-level-3.png"
    : isLevel2
    ? "/certificates/referee-templates/referee-level-2.png"
    : "/certificates/referee-templates/referee-level-1.png";

  const qrUrl =
    verificationUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/certificates?number=${encodeURIComponent(certificate.number)}`
      : `https://kalawarfederation.org/certificates?number=${encodeURIComponent(certificate.number)}`);

  return (
    <div
      className={`relative w-full aspect-[297/210] rounded-2xl overflow-hidden shadow-2xl border border-border/60 bg-slate-900 select-none ${className}`}
      style={{
        backgroundImage: `url('${templateSrc}')`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Candidate / Referee Full Name */}
      <div
        className="absolute w-full text-center font-black tracking-tight text-slate-900 uppercase"
        style={{
          top: isLevel2 ? "43.8%" : "46.5%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(12px, 2.2vw, 24px)",
          letterSpacing: "-0.01em",
        }}
      >
        {certificate.holder}
      </div>

      {/* Left Column Dynamic Values */}
      <div
        className="absolute text-slate-900 font-bold flex flex-col justify-between"
        style={{
          top: isLevel2 ? "59.5%" : "62.0%",
          left: isLevel2 ? "29.0%" : "27.2%",
          width: isLevel2 ? "20%" : "20%",
          height: isLevel2 ? "13.2%" : "12.5%",
          fontSize: "clamp(7px, 1.05vw, 12px)",
          lineHeight: 1.1,
        }}
      >
        <div className="truncate">{certificate.number}</div>
        <div className="truncate">{formatToDDMMYYYY((certificate as any).dob, "15/08/1996")}</div>
        <div className="truncate">{certificate.academy || "Kalawar Combat Club"}</div>
        <div className="truncate">{certificate.district || "Mumbai"}</div>
        <div className="truncate">{certificate.state || "Maharashtra"}</div>
      </div>

      {/* Right Column Dynamic Values */}
      <div
        className="absolute text-slate-900 font-bold flex flex-col justify-between"
        style={{
          top: isLevel2 ? "59.5%" : "61.8%",
          left: isLevel2 ? "65.0%" : "63.8%",
          width: isLevel2 ? "18%" : "18%",
          height: isLevel2 ? "15.8%" : "14.5%",
          fontSize: "clamp(7px, 1.05vw, 12px)",
          lineHeight: 1.1,
        }}
      >
        <div className="truncate">{(certificate as any).discipline || "Kalawar Martial Arts"}</div>
        <div className="truncate">{certificate.rankOrBelt || "1st Dan Black Belt"}</div>
        <div className="truncate">{formatToDDMMYYYY((certificate as any).examDate || certificate.issued, "10/02/2026")}</div>
        <div className="truncate">{(certificate as any).venue || "National Sports Complex, Pune"}</div>
        <div className="truncate">{formatToDDMMYYYY(certificate.issued, "10/02/2026")}</div>
        <div className="truncate text-red-700 font-black">{formatToDDMMYYYY(certificate.validUntil, certificate.validUntil || "2 Years")}</div>
      </div>

      {/* Dynamic Live Scannable QR Code */}
      <div
        className="absolute bg-white flex items-center justify-center"
        style={{
          top: isLevel2 ? "58.8%" : "62.5%",
          left: isLevel2 ? "85.4%" : "85.3%",
          width: isLevel2 ? "8.0%" : "7.6%",
          aspectRatio: "1/1",
        }}
      >
        <div className="w-full h-full">
          <QRCode
            value={qrUrl}
            size={256}
            style={{ height: "100%", maxWidth: "100%", width: "100%" }}
            viewBox="0 0 256 256"
          />
        </div>
      </div>
    </div>
  );
}
