"use client";

import React from "react";
import QRCode from "react-qr-code";
import { Check } from "lucide-react";
import { formatToDDMMYYYY } from "@/lib/utils";
import { resolveAffiliationLevels } from "@/lib/certificate-pdf";
import { clubCertificatePreviewCoordinates } from "@/config/club-certificate-coordinates";
import type { Player } from "@/data/people";
import type { CertificateItem } from "@/types/certificate";

interface ClubAffiliationCertificateViewProps {
  club?: Player | any;
  certificate?: CertificateItem | any;
  className?: string;
}

export function ClubAffiliationCertificateView({
  club,
  certificate,
  className = "",
}: ClubAffiliationCertificateViewProps) {
  const data = club || certificate || {};

  const affiliationNo =
    data.affiliationCertificateId ||
    data.affiliationNumber ||
    data.certificateNumber ||
    data.number ||
    data.id ||
    "KAC-AFF-2026-001";

  const rawDate = data.issueDate || data.issued || data.createdAt || new Date().toISOString();
  const dateObj = new Date(rawDate);
  const isValidDate = !isNaN(dateObj.getTime());
  const day = isValidDate ? String(dateObj.getDate()).padStart(2, "0") : "16";
  const month = isValidDate ? String(dateObj.getMonth() + 1).padStart(2, "0") : "09";
  const year = isValidDate ? String(dateObj.getFullYear()) : "2026";

  const clubName = (
    data.name ||
    data.academyName ||
    data.holder ||
    data.academy ||
    "Official Martial Arts Club"
  ).toUpperCase();

  const state = data.state || "Maharashtra";
  const district = data.district || data.city || "Pune";
  const academyName = data.name || data.academyName || data.academy || clubName;
  const headCoach =
    data.headCoachName ||
    data.headCoach ||
    data.presidentName ||
    data.president ||
    data.instructor ||
    data.holder ||
    "Authorized Head Coach";
  const contactNo =
    data.phone ||
    data.contactNo ||
    data.emergencyContact ||
    data.mobile ||
    data.alternatePhone ||
    "+91 98220 12345";

  // President and Secretary names for the bottom boxes
  const presidentName = data.presidentName || data.president || "";
  const secretaryName = data.secretaryName || data.secretary || "";

  const {
    isState: isStateAffiliation,
    isDistrict: isDistrictAffiliation,
    isClub: isClubAffiliation,
    isDojo: isDojoAffiliation,
  } = resolveAffiliationLevels(data);

  const rawFromDate = data.validFrom || data.issued || "2026-01-01";
  const fromDateObj = new Date(rawFromDate);
  const isValidFrom = !isNaN(fromDateObj.getTime());
  const fromDay = isValidFrom ? String(fromDateObj.getDate()).padStart(2, "0") : "01";
  const fromMonth = isValidFrom ? String(fromDateObj.getMonth() + 1).padStart(2, "0") : "01";

  const rawToDate = data.validUntil || data.validTo || "2026-12-31";
  const toDateObj = new Date(rawToDate);
  const isValidTo = !isNaN(toDateObj.getTime());
  const toDay = isValidTo ? String(toDateObj.getDate()).padStart(2, "0") : "31";
  const toMonth = isValidTo ? String(toDateObj.getMonth() + 1).padStart(2, "0") : "12";
  const toYear2Digit = isValidTo ? String(toDateObj.getFullYear()).slice(-2) : "26";

  const certLookupId =
    data.kalawarId ||
    data.id ||
    data.affiliationCertificateId ||
    data.affiliationNumber ||
    data.certificateNumber ||
    data.number ||
    affiliationNo;

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/clubs/${encodeURIComponent(certLookupId)}/certificate`
      : `https://kalawar.org/clubs/${encodeURIComponent(certLookupId)}/certificate`;

  const coords = clubCertificatePreviewCoordinates;

  return (
    <div
      className={`relative w-full aspect-[1240/1754] select-none rounded-2xl overflow-hidden shadow-2xl bg-white ${className}`}
      style={{
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Lightweight 1x Master Artwork Background (~337 KB optimized for CDN) */}
      <img
        src={coords.templatePath}
        alt="Club Affiliation Certificate Template"
        className="w-full h-full object-cover pointer-events-none select-none block"
      />

      {/* =========================================================================
          DYNAMIC OVERLAY FIELDS (Pixel-mapped to 1240 x 1754 template)
          ========================================================================= */}

      {/* 1. Top Left: Affiliation No. */}
      <div
        className="absolute font-mono font-black text-[#0f172a] text-[9px] sm:text-[11px] md:text-[13px] lg:text-[14.5px] leading-none pointer-events-none truncate"
        style={{
          left: coords.affiliationNo.left,
          top: coords.affiliationNo.top,
          width: coords.affiliationNo.width,
          transform: coords.affiliationNo.transform,
        }}
      >
        {affiliationNo}
      </div>

      {/* 2. Top Right: Date - Day (DD) & Month (MM) */}
      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9px] sm:text-[11px] md:text-[12.5px] lg:text-[14px] leading-none pointer-events-none text-center"
        style={{
          left: coords.issueDay.left,
          top: coords.issueDay.top,
          width: coords.issueDay.width,
          transform: coords.issueDay.transform,
        }}
      >
        {day}
      </div>

      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9px] sm:text-[11px] md:text-[12.5px] lg:text-[14px] leading-none pointer-events-none text-center"
        style={{
          left: coords.issueMonth.left,
          top: coords.issueMonth.top,
          width: coords.issueMonth.width,
          transform: coords.issueMonth.transform,
        }}
      >
        {month}
      </div>

      {/* 3. Main Certification Line: "This is to certify that _______________" */}
      <div
        className="absolute font-serif font-black text-[#0f172a] text-[12px] sm:text-[15px] md:text-[18px] lg:text-[21px] leading-none pointer-events-none text-center truncate tracking-wide"
        style={{
          left: coords.clubName.left,
          top: coords.clubName.top,
          width: coords.clubName.width,
          transform: coords.clubName.transform,
        }}
      >
        {clubName}
      </div>

      {/* 4. LEVEL OF AFFILIATION Checkboxes */}
      {/* Box 1: STATE AFFILIATION */}
      {isStateAffiliation && (
        <div
          className="absolute flex items-center justify-center pointer-events-none text-[#b45309]"
          style={{
            left: coords.checkboxes.state.left,
            top: coords.checkboxes.state.top,
            width: coords.checkboxes.state.width,
            height: coords.checkboxes.state.height,
          }}
        >
          <Check className="w-full h-full stroke-[3.5]" />
        </div>
      )}

      {/* Box 2: DISTRICT AFFILIATION */}
      {isDistrictAffiliation && (
        <div
          className="absolute flex items-center justify-center pointer-events-none text-[#b45309]"
          style={{
            left: coords.checkboxes.district.left,
            top: coords.checkboxes.district.top,
            width: coords.checkboxes.district.width,
            height: coords.checkboxes.district.height,
          }}
        >
          <Check className="w-full h-full stroke-[3.5]" />
        </div>
      )}

      {/* Box 3: ACADEMY / CLUB AFFILIATION (Default) */}
      {isClubAffiliation && (
        <div
          className="absolute flex items-center justify-center pointer-events-none text-[#b45309]"
          style={{
            left: coords.checkboxes.club.left,
            top: coords.checkboxes.club.top,
            width: coords.checkboxes.club.width,
            height: coords.checkboxes.club.height,
          }}
        >
          <Check className="w-full h-full stroke-[3.5]" />
        </div>
      )}

      {/* Box 4: DOJO / MARTIAL ARTS CLASSES AFFILIATION */}
      {isDojoAffiliation && (
        <div
          className="absolute flex items-center justify-center pointer-events-none text-[#b45309]"
          style={{
            left: coords.checkboxes.dojo.left,
            top: coords.checkboxes.dojo.top,
            width: coords.checkboxes.dojo.width,
            height: coords.checkboxes.dojo.height,
          }}
        >
          <Check className="w-full h-full stroke-[3.5]" />
        </div>
      )}

      {/* 5. Unit Details (5 Horizontal Underlines) */}
      {/* Line 1: State */}
      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13px] lg:text-[15px] leading-none pointer-events-none truncate"
        style={{
          left: coords.unitDetails.left,
          top: coords.unitDetails.stateTop,
          width: coords.unitDetails.width,
          transform: coords.unitDetails.transform,
        }}
      >
        {state}
      </div>

      {/* Line 2: District */}
      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13px] lg:text-[15px] leading-none pointer-events-none truncate"
        style={{
          left: coords.unitDetails.left,
          top: coords.unitDetails.districtTop,
          width: coords.unitDetails.width,
          transform: coords.unitDetails.transform,
        }}
      >
        {district}
      </div>

      {/* Line 3: Academy / Club / Dojo */}
      <div
        className="absolute font-sans font-extrabold text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13px] lg:text-[15px] leading-none pointer-events-none truncate"
        style={{
          left: coords.unitDetails.left,
          top: coords.unitDetails.academyTop,
          width: coords.unitDetails.width,
          transform: coords.unitDetails.transform,
        }}
      >
        {academyName}
      </div>

      {/* Line 4: Head Coach / Instructor */}
      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13px] lg:text-[15px] leading-none pointer-events-none truncate"
        style={{
          left: coords.unitDetails.left,
          top: coords.unitDetails.headCoachTop,
          width: coords.unitDetails.width,
          transform: coords.unitDetails.transform,
        }}
      >
        {headCoach}
      </div>

      {/* Line 5: Contact No. */}
      <div
        className="absolute font-sans font-bold text-[#0f172a] text-[9.5px] sm:text-[11.5px] md:text-[13px] lg:text-[15px] leading-none pointer-events-none truncate"
        style={{
          left: coords.unitDetails.left,
          top: coords.unitDetails.contactNoTop,
          width: coords.unitDetails.width,
          transform: coords.unitDetails.transform,
        }}
      >
        {contactNo}
      </div>

      {/* 6. Validity Range (Inside Validity Box) */}
      <div
        className="absolute font-sans font-bold text-[#047857] text-[9px] sm:text-[10.5px] md:text-[12px] lg:text-[13.5px] leading-none pointer-events-none text-center"
        style={{
          left: coords.validity.fromDay.left,
          top: coords.validity.fromDay.top,
          width: coords.validity.fromDay.width,
          transform: coords.validity.transform,
        }}
      >
        {fromDay}
      </div>

      <div
        className="absolute font-sans font-bold text-[#047857] text-[9px] sm:text-[10.5px] md:text-[12px] lg:text-[13.5px] leading-none pointer-events-none text-center"
        style={{
          left: coords.validity.fromMonth.left,
          top: coords.validity.fromMonth.top,
          width: coords.validity.fromMonth.width,
          transform: coords.validity.transform,
        }}
      >
        {fromMonth}
      </div>

      <div
        className="absolute font-sans font-bold text-[#047857] text-[9px] sm:text-[10.5px] md:text-[12px] lg:text-[13.5px] leading-none pointer-events-none text-center"
        style={{
          left: coords.validity.toDay.left,
          top: coords.validity.toDay.top,
          width: coords.validity.toDay.width,
          transform: coords.validity.transform,
        }}
      >
        {toDay}
      </div>

      <div
        className="absolute font-sans font-bold text-[#047857] text-[9px] sm:text-[10.5px] md:text-[12px] lg:text-[13.5px] leading-none pointer-events-none text-center"
        style={{
          left: coords.validity.toMonth.left,
          top: coords.validity.toMonth.top,
          width: coords.validity.toMonth.width,
          transform: coords.validity.transform,
        }}
      >
        {toMonth}
      </div>

      <div
        className="absolute font-sans font-bold text-[#047857] text-[9px] sm:text-[10.5px] md:text-[12px] lg:text-[13.5px] leading-none pointer-events-none text-center"
        style={{
          left: coords.validity.toYear2Digit.left,
          top: coords.validity.toYear2Digit.top,
          width: coords.validity.toYear2Digit.width,
          transform: coords.validity.transform,
        }}
      >
        {toYear2Digit}
      </div>

      {/* 7. Dynamic Cryptographic Verification QR Code (Inside Validity Box on the right) */}
      <div
        className="absolute p-0.5 bg-white rounded-lg shadow-sm border border-amber-400/40 flex items-center justify-center pointer-events-none"
        style={{
          left: coords.qrCode.left,
          top: coords.qrCode.top,
          width: coords.qrCode.width,
          aspectRatio: coords.qrCode.aspectRatio,
        }}
      >
        <QRCode value={verifyUrl} size={128} className="w-full h-full" />
      </div>

      {/* 8. Bottom Signatory Box Overlays: President Name & Secretary Name */}
      {presidentName && (
        <div
          className="absolute font-sans font-bold text-[#0f172a] text-[8px] sm:text-[9.5px] md:text-[11px] lg:text-[12.5px] leading-none pointer-events-none truncate"
          style={{
            left: coords.presidentName.left,
            top: coords.presidentName.top,
            width: coords.presidentName.width,
            transform: coords.presidentName.transform,
          }}
          title={presidentName}
        >
          {presidentName}
        </div>
      )}

      {secretaryName && (
        <div
          className="absolute font-sans font-bold text-[#0f172a] text-[8px] sm:text-[9.5px] md:text-[11px] lg:text-[12.5px] leading-none pointer-events-none truncate"
          style={{
            left: coords.secretaryName.left,
            top: coords.secretaryName.top,
            width: coords.secretaryName.width,
            transform: coords.secretaryName.transform,
          }}
          title={secretaryName}
        >
          {secretaryName}
        </div>
      )}
    </div>
  );
}
