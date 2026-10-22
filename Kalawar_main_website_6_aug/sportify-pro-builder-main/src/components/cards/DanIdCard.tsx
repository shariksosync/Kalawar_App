"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { RotateCw, User } from "lucide-react";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import { getDanIdCardWebConfig } from "@/config/dan-id-card-coordinates";

export interface DanIdCardProps {
  card: {
    id?: string;
    athleteId?: string;
    candidateName?: string;
    fullName?: string;
    danRank?: number;
    danRankTitle?: string;
    currentBeltTitle?: string;
    dob?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    discipline?: string;
    academyName?: string;
    academy?: string;
    district?: string;
    state?: string;
    issueDate?: string;
    validity?: string;
    validUntil?: string;
    photoUrl?: string;
    athletePhoto?: string;
    certificateNumber?: string;
    idCardNumber?: string;
    emergencyPhone?: string;
  };
  isFlipped?: boolean;
  onFlipToggle?: () => void;
  showFlipButton?: boolean;
  className?: string;
}

export function DanIdCard({
  card,
  isFlipped: controlledFlipped,
  onFlipToggle,
  showFlipButton = false,
  className = "",
}: DanIdCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleToggle = () => {
    if (onFlipToggle) {
      onFlipToggle();
    } else {
      setInternalFlipped((prev) => !prev);
    }
  };

  const candidateName = card.candidateName || card.fullName || "Athlete";
  const athleteId = card.athleteId || card.id || "KSM-PL-8801";
  const danRank = Number(card.danRank) || 1;
  const danRankTitle = card.danRankTitle || `${danRank}st Dan Black Belt`;
  const dob = card.dob || card.dateOfBirth ? formatToDDMMYYYY(card.dob || card.dateOfBirth, "15/08/1998") : "15/08/1998";
  const bloodGroup = card.bloodGroup || "";
  const discipline = card.discipline || "Kalawar Martial Arts";
  const academyName = card.academyName || card.academy || "Kalawar Martial Arts Academy";
  const district = card.district || "Pune";
  const state = card.state || "Maharashtra";
  const validity = card.validity || card.validUntil ? formatToDDMMYYYY(card.validity || card.validUntil, "31/12/2028") : "LIFETIME HOLDER";
  const photoUrl = card.photoUrl || card.athletePhoto;
  const certNumber = card.certificateNumber || card.idCardNumber || card.athleteId || "KAC-DAN-2026-0001";

  const config = getDanIdCardWebConfig(danRank);

  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates/dan/${encodeURIComponent(certNumber)}`
      : `https://kalawar.org/certificates/dan/${encodeURIComponent(certNumber)}`;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {showFlipButton && (
        <button
          type="button"
          onClick={handleToggle}
          className="mb-4 bg-card/90 hover:bg-accent border border-primary/40 text-foreground font-bold text-xs px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <RotateCw className="size-3.5 text-primary" />
          <span>{isFlipped ? "Flip to Front Side" : "Flip to Back Side"}</span>
        </button>
      )}

      {/* Interactive CR80 Portrait Card (502/633 aspect ratio) */}
      <div
        onClick={handleToggle}
        className={cn(
          "w-full max-w-[430px] relative rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] cursor-pointer transition-transform duration-300 hover:scale-[1.015] bg-black overflow-hidden",
          config.aspectRatio || "aspect-[502/633]"
        )}
        title="Click to flip Black Belt / Dan ID Card"
      >
        {!isFlipped ? (
          /* =========================================================================
             FRONT SIDE (Dan Template Artwork with Dynamic Overlays)
             ========================================================================= */
          <div className="relative w-full h-full">
            {/* Background Template Artwork */}
            <img
              src={config.templateFront}
              alt={`Black Belt & ${danRank} Dan ID Card Front`}
              className="w-full h-full object-contain pointer-events-none select-none block"
            />

            {/* OVERLAY 1: Photo Box */}
            <div
              className="absolute overflow-hidden bg-slate-900 flex items-center justify-center pointer-events-none shadow-md"
              style={{
                left: config.photo.left,
                top: config.photo.top,
                width: config.photo.width,
                height: config.photo.height,
                borderRadius: config.photo.borderRadius || "6px",
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={candidateName}
                  className="w-full h-full object-cover object-center select-none"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="size-full bg-gradient-to-br from-[#161922] to-[#0a0c10] text-amber-400 flex flex-col items-center justify-center font-black text-xl select-none">
                  <User className="w-8 h-8 text-amber-400/80 mb-0.5" />
                  <span className="text-[10px] text-amber-300/80 tracking-wider">
                    {candidateName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* OVERLAY 2: Front Live Dynamic QR Code */}
            <div
              className="absolute bg-white p-[1.5px] rounded-[3px] flex items-center justify-center pointer-events-none overflow-hidden"
              style={{
                left: config.qrCodeFront.left,
                top: config.qrCodeFront.top,
                width: config.qrCodeFront.width,
                aspectRatio: "1/1",
              }}
            >
              <QRCode
                value={verificationUrl}
                size={96}
                className="w-full h-full"
              />
            </div>

            {/* OVERLAY 3: Right 10 Dynamic Form Lines */}
            {/* 1. Name */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.name.fontWeightClass,
                config.name.fontSizeClass,
                config.name.colorClass
              )}
              style={{
                left: config.name.left,
                top: config.name.top,
                maxWidth: config.name.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {candidateName}
            </div>

            {/* 2. Belt Color */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.beltColor.fontWeightClass,
                config.beltColor.fontSizeClass,
                config.beltColor.colorClass
              )}
              style={{
                left: config.beltColor.left,
                top: config.beltColor.top,
                maxWidth: config.beltColor.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              Black Belt &amp; {danRank} Dan
            </div>

            {/* 3. Membership No. */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.membershipNo.fontWeightClass,
                config.membershipNo.fontSizeClass,
                config.membershipNo.colorClass
              )}
              style={{
                left: config.membershipNo.left,
                top: config.membershipNo.top,
                maxWidth: config.membershipNo.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {athleteId}
            </div>

            {/* 4. Date of Birth */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.dob.fontWeightClass,
                config.dob.fontSizeClass,
                config.dob.colorClass
              )}
              style={{
                left: config.dob.left,
                top: config.dob.top,
                maxWidth: config.dob.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {dob}
            </div>

            {/* 5. Blood Group */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.bloodGroup.fontWeightClass,
                config.bloodGroup.fontSizeClass,
                config.bloodGroup.colorClass
              )}
              style={{
                left: config.bloodGroup.left,
                top: config.bloodGroup.top,
                maxWidth: config.bloodGroup.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {bloodGroup}
            </div>

            {/* 6. Discipline */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.discipline.fontWeightClass,
                config.discipline.fontSizeClass,
                config.discipline.colorClass
              )}
              style={{
                left: config.discipline.left,
                top: config.discipline.top,
                maxWidth: config.discipline.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {discipline}
            </div>

            {/* 7. Club / Academy */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.academy.fontWeightClass,
                config.academy.fontSizeClass,
                config.academy.colorClass
              )}
              style={{
                left: config.academy.left,
                top: config.academy.top,
                maxWidth: config.academy.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {academyName}
            </div>

            {/* 8. District */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.district.fontWeightClass,
                config.district.fontSizeClass,
                config.district.colorClass
              )}
              style={{
                left: config.district.left,
                top: config.district.top,
                maxWidth: config.district.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {district}
            </div>

            {/* 9. State */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.state.fontWeightClass,
                config.state.fontSizeClass,
                config.state.colorClass
              )}
              style={{
                left: config.state.left,
                top: config.state.top,
                maxWidth: config.state.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {state}
            </div>

            {/* 10. Validity */}
            <div
              className={cn(
                "absolute truncate leading-tight pointer-events-none",
                config.validity.fontWeightClass,
                config.validity.fontSizeClass,
                config.validity.colorClass
              )}
              style={{
                left: config.validity.left,
                top: config.validity.top,
                maxWidth: config.validity.maxWidth || "38%",
                transform: "translateY(-90%)",
              }}
            >
              {validity}
            </div>
          </div>
        ) : (
          /* =========================================================================
             BACK SIDE (Dan Template Artwork with Verification QR)
             ========================================================================= */
          <div className="relative w-full h-full">
            <img
              src={config.templateBack}
              alt={`Black Belt & ${danRank} Dan ID Card Back`}
              className="w-full h-full object-contain pointer-events-none select-none block"
            />

            {/* Dynamic Live QR Code Overlay on Back */}
            <div
              className="absolute bg-white p-[1.5px] rounded-[3px] flex items-center justify-center pointer-events-none overflow-hidden shadow-sm"
              style={{
                left: config.qrCodeBack.left,
                top: config.qrCodeBack.top,
                width: config.qrCodeBack.width,
                aspectRatio: "1/1",
              }}
            >
              <QRCode
                value={verificationUrl}
                size={96}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
