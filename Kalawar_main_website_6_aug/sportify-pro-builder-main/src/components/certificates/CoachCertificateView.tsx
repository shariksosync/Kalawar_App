"use client";

import React from "react";
import QRCode from "react-qr-code";
import { formatToDDMMYYYY } from "@/lib/utils";
import type { Player } from "@/data/people";
import type { CertificateItem } from "@/types/certificate";

interface CoachCertificateViewProps {
  coach?: Player | any;
  certificate?: CertificateItem | any;
  className?: string;
  verificationUrl?: string;
}

export function CoachCertificateView({
  coach,
  certificate,
  className = "",
  verificationUrl,
}: CoachCertificateViewProps) {
  const data = coach || certificate || {};

  const certNumber =
    data.affiliationCertificateId ||
    data.certificateNumber ||
    data.number ||
    (data.id ? (data.id.startsWith("KAL-CO-") ? data.id : `KAL-CO-${data.id.replace(/[^0-9]/g, "").slice(-4) || "2026-001"}`) : "KAL-CO-2026-001");

  // Format cert suffix if template has "Certificate No. : KAL-CO-" or "KSM-CO-"
  const certSuffix = certNumber.replace(/^KAL-CO-/i, "").replace(/^KSM-CO-/i, "").replace(/^WSF-CO-/i, "");

  const coachName = (
    data.name ||
    data.holder ||
    data.coachName ||
    "Authorized Master Coach"
  ).toUpperCase();

  const coachLevel =
    data.qualification ||
    data.level ||
    data.coachLevel ||
    "Level 2 - National Coach";

  const discipline =
    data.discipline ||
    "Kalawar Martial Arts";

  const danBelt =
    data.beltRank ||
    data.danRank ||
    data.rankOrBelt ||
    data.specialization ||
    "3rd Dan Black Belt";

  const dob = formatToDDMMYYYY(data.dob, "15/08/1990");

  const academyClub =
    data.club ||
    data.academy ||
    data.academyName ||
    "Independent / National Academy";

  const district =
    data.district ||
    data.city ||
    "Pune";

  const state =
    data.state ||
    "Maharashtra";

  const examDate = formatToDDMMYYYY(data.examDate || data.registeredOn, "12/01/2026");

  const venue =
    data.venue ||
    "National Sports Complex, Pune";

  const rawIssue = data.issueDate || data.issued || data.registeredOn || new Date().toISOString();
  const issueDate = formatToDDMMYYYY(rawIssue, "15/01/2026");

  const rawValid = data.validUntil || `${new Date().getFullYear() + 2}-12-31`;
  const validUntil = formatToDDMMYYYY(rawValid, "31/12/2028");

  const coachPhoto =
    data.image ||
    data.photo ||
    "";

  const qrUrl =
    verificationUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/certificates?number=${encodeURIComponent(certNumber)}`
      : `https://kalawarfederation.org/certificates?number=${encodeURIComponent(certNumber)}`);

  return (
    <div
      className={`relative w-full aspect-[1786/2526] rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 select-none ${className}`}
    >
      {/* Background Template Artwork Image */}
      <img
        src="/certificates/coach-templates/coach-certificate-template.png"
        alt="KALAWAR Coach Certificate Artwork Template"
        className="w-full h-full object-cover pointer-events-none select-none block"
      />

      {/* =========================================================================
          DYNAMIC PIXEL-MAPPED OVERLAYS
          ========================================================================= */}

      {/* 1. Certificate Number (Directly on underline after KAL-CO-) */}
      <div
        className="absolute font-mono font-black text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13.5px] lg:text-[15.5px] leading-none pointer-events-none"
        style={{
          left: "52.0%",
          top: "38.1%",
          transform: "translateY(-90%)",
        }}
      >
        {certSuffix || certNumber}
      </div>

      {/* 2. Coach Full Name (Center Under "This is to certify that" resting on underline) */}
      <div
        className="absolute w-[82%] text-center font-black tracking-tight text-[#0f172a] uppercase pointer-events-none"
        style={{
          top: "44.4%",
          left: "50%",
          transform: "translate(-50%, -90%)",
          fontSize: "clamp(12px, 2.5vw, 28px)",
          letterSpacing: "-0.01em",
          color: "#991b1b", // Deep burgundy-gold tone matching certificate header
          textShadow: "0 1px 1px rgba(0,0,0,0.1)",
        }}
      >
        {coachName}
      </div>

      {/* 3. Left Column Details Table Values (Aligned directly above table row underlines) */}
      {/* Coach Level */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "57.7%", width: "34%" }}
      >
        {coachLevel}
      </div>

      {/* Discipline */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "59.6%", width: "34%" }}
      >
        {discipline}
      </div>

      {/* Dan / Belt */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "61.5%", width: "34%" }}
      >
        {danBelt}
      </div>

      {/* Date of Birth */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "63.4%", width: "34%" }}
      >
        {dob}
      </div>

      {/* Academy / Club */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "65.3%", width: "34%" }}
      >
        {academyClub}
      </div>

      {/* District */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "67.2%", width: "34%" }}
      >
        {district}
      </div>

      {/* State */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "69.1%", width: "34%" }}
      >
        {state}
      </div>

      {/* Examination Date */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "71.0%", width: "34%" }}
      >
        {examDate}
      </div>

      {/* Venue */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "73.0%", width: "34%" }}
      >
        {venue}
      </div>

      {/* Issue Date */}
      <div
        className="absolute font-bold text-[#0f172a] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "74.9%", width: "34%" }}
      >
        {issueDate}
      </div>

      {/* Valid Until */}
      <div
        className="absolute font-bold text-[#b91c1c] text-[7.5px] sm:text-[9.5px] md:text-[11.5px] lg:text-[13px] leading-none pointer-events-none truncate"
        style={{ left: "30.5%", top: "76.8%", width: "34%" }}
      >
        {validUntil}
      </div>

      {/* 4. Right Side Passport Profile Photo Box (Pixel-perfect fit in gold frame) */}
      {coachPhoto && (
        <div
          className="absolute overflow-hidden bg-stone-100 shadow-inner"
          style={{
            left: "70.16%",
            top: "57.21%",
            width: "19.09%",
            height: "12.55%",
            borderRadius: "12.5%",
            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
            isolation: "isolate",
            transform: "translateZ(0)",
          }}
        >
          <img
            src={coachPhoto}
            alt={coachName}
            style={{ borderRadius: "inherit" }}
            className="w-full h-full object-cover object-top block"
          />
        </div>
      )}

      {/* 5. Live Scannable Dynamic QR Code (Pixel-calibrated fit over template dummy QR) */}
      <div
        className="absolute bg-white flex items-center justify-center shadow-xs"
        style={{
          left: "73.3%",
          top: "70.65%",
          width: "12.65%",
          aspectRatio: "1 / 1",
        }}
      >
        <div className="w-full h-full flex items-center justify-center p-0.5">
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
