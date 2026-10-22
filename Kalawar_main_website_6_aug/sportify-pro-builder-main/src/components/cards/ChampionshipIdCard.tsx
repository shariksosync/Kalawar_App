"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { RotateCw, User } from "lucide-react";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import { getChampionshipIdCardWebConfig } from "@/config/championship-id-card-coordinates";

export interface ChampionshipIdCardProps {
  card: {
    id?: string;
    athleteId?: string;
    championshipApplicationId?: string;
    applicantName?: string;
    candidateName?: string;
    holderName?: string;
    athleteName?: string;
    bibNumber?: string;
    eventTitle?: string;
    eventName?: string;
    tournamentTier?: string;
    level?: string;
    discipline?: string;
    ageDivision?: string;
    weightCategory?: string;
    gender?: string;
    beltRank?: string;
    academyName?: string;
    clubName?: string;
    club?: string;
    district?: string;
    city?: string;
    state?: string;
    dob?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    issueDate?: string;
    validity?: string;
    validUntil?: string;
    photoUrl?: string;
    athletePhoto?: string;
    holderPhoto?: string;
    photo?: string;
    status?: string;
  };
  isFlipped?: boolean;
  onFlipToggle?: () => void;
  showFlipButton?: boolean;
  className?: string;
}

export function ChampionshipIdCard({
  card,
  isFlipped: controlledFlipped,
  onFlipToggle,
  showFlipButton = false,
  className = "",
}: ChampionshipIdCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleToggle = () => {
    if (onFlipToggle) {
      onFlipToggle();
    } else {
      setInternalFlipped((prev) => !prev);
    }
  };

  const candidateName = card.holderName || card.applicantName || card.candidateName || card.athleteName || "Competitor";
  const athleteId = card.athleteId || card.id || card.championshipApplicationId || "CHAMP-2026-0001";
  const bibNumber = card.bibNumber || "BIB-001";
  const eventTitle = card.eventTitle || card.eventName || "Championship 2026";
  const discipline = card.discipline || "Kalawar Martial Arts";
  const division = card.ageDivision || "Senior (18-29)";
  const weight = card.weightCategory || "Open Weight";
  const gender = card.gender || "Male";
  const beltRank = card.beltRank || "Competitor";
  const academy = card.academyName || card.clubName || card.club || "Independent Athlete";
  const bloodGroup = card.bloodGroup || "";
  const photoUrl = card.holderPhoto || card.athletePhoto || card.photoUrl || card.photo;

  const config = getChampionshipIdCardWebConfig();

  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/id-cards/championship/${encodeURIComponent(card.id || athleteId)}`
      : `https://kalawar.org/id-cards/championship/${encodeURIComponent(card.id || athleteId)}`;

  const categoryDisplay = `${discipline}${beltRank ? ` · ${beltRank}` : ""}${weight ? ` (${weight})` : ""}`;
  const idNoDisplay = `${bibNumber} · ${athleteId}`;

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

      {/* Interactive CR80 Portrait Card (Matching 501/621 template aspect ratio) */}
      <div
        onClick={handleToggle}
        className={cn(
          "w-full max-w-[430px] relative rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] cursor-pointer transition-transform duration-300 hover:scale-[1.015] bg-stone-950 overflow-hidden border border-amber-500/30",
          config.aspectRatio || "aspect-[501/621]"
        )}
        title="Click to flip Championship ID Card"
      >
        {!isFlipped ? (
          /* =========================================================================
             FRONT SIDE (Exact Artwork Alignment)
             ========================================================================= */
          <div className="relative w-full h-full">
            {/* Background Template Artwork */}
            <img
              src={config.templateFront}
              alt="Championship Participant ID Card Front"
              className="w-full h-full object-contain pointer-events-none select-none block"
            />

            {/* OVERLAY 1: Photo Box */}
            <div
              className="absolute overflow-hidden bg-stone-900 border border-amber-500/40 flex items-center justify-center pointer-events-none shadow-md"
              style={{
                left: config.photo.left,
                top: config.photo.top,
                width: config.photo.width,
                height: config.photo.height,
                borderRadius: config.photo.borderRadius || "8px",
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
                <div className="size-full bg-gradient-to-br from-[#1c1917] to-[#0c0a09] text-amber-400 flex flex-col items-center justify-center font-black text-xl select-none">
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

            {/* OVERLAY 3: Right 8 Form Fields (Aligned on Underlines) */}
            {/* 1. Participant Name */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.participantName.fontWeightClass,
                config.participantName.fontSizeClass,
                config.participantName.colorClass
              )}
              style={{
                left: config.participantName.left,
                top: config.participantName.top,
                maxWidth: config.participantName.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {candidateName}
            </div>

            {/* 2. Team / Dojo Name */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.teamDojoName.fontWeightClass,
                config.teamDojoName.fontSizeClass,
                config.teamDojoName.colorClass
              )}
              style={{
                left: config.teamDojoName.left,
                top: config.teamDojoName.top,
                maxWidth: config.teamDojoName.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {academy}
            </div>

            {/* 3. Category */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.category.fontWeightClass,
                config.category.fontSizeClass,
                config.category.colorClass
              )}
              style={{
                left: config.category.left,
                top: config.category.top,
                maxWidth: config.category.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {categoryDisplay}
            </div>

            {/* 4. Age Group */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.ageGroup.fontWeightClass,
                config.ageGroup.fontSizeClass,
                config.ageGroup.colorClass
              )}
              style={{
                left: config.ageGroup.left,
                top: config.ageGroup.top,
                maxWidth: config.ageGroup.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {division}
            </div>

            {/* 5. Gender */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.gender.fontWeightClass,
                config.gender.fontSizeClass,
                config.gender.colorClass
              )}
              style={{
                left: config.gender.left,
                top: config.gender.top,
                maxWidth: config.gender.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {gender}
            </div>

            {/* 6. Event(s) */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.events.fontWeightClass,
                config.events.fontSizeClass,
                config.events.colorClass
              )}
              style={{
                left: config.events.left,
                top: config.events.top,
                maxWidth: config.events.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {eventTitle}
            </div>

            {/* 7. ID No. */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.idNo.fontWeightClass,
                config.idNo.fontSizeClass,
                config.idNo.colorClass
              )}
              style={{
                left: config.idNo.left,
                top: config.idNo.top,
                maxWidth: config.idNo.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {idNoDisplay}
            </div>

            {/* 8. Blood Group */}
            <div
              className={cn(
                "absolute truncate leading-none pointer-events-none",
                config.bloodGroup.fontWeightClass,
                config.bloodGroup.fontSizeClass,
                config.bloodGroup.colorClass
              )}
              style={{
                left: config.bloodGroup.left,
                top: config.bloodGroup.top,
                maxWidth: config.bloodGroup.maxWidth || "34%",
                transform: "translateY(-94%)",
              }}
            >
              {bloodGroup}
            </div>
          </div>
        ) : (
          /* =========================================================================
             BACK SIDE (Exact Artwork Alignment)
             ========================================================================= */
          <div className="relative w-full h-full">
            {/* Background Template Artwork */}
            <img
              src={config.templateBack}
              alt="Championship Participant ID Card Back"
              className="w-full h-full object-contain pointer-events-none select-none block"
            />

            {/* Back Scannable Event QR Code (in bottom-right box) */}
            <div
              className="absolute bg-white p-[1.5px] rounded-[2px] flex items-center justify-center pointer-events-none overflow-hidden shadow-md"
              style={{
                left: config.qrCodeBack.left,
                top: config.qrCodeBack.top,
                width: config.qrCodeBack.width,
                aspectRatio: "1/1",
              }}
            >
              <QRCode
                value={verificationUrl}
                size={80}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
