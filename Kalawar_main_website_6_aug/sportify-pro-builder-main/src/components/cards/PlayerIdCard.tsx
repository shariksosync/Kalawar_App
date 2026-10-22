"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { RotateCw } from "lucide-react";
import { cn, formatToDDMMYYYY } from "@/lib/utils";
import type { IdCardEntry } from "@/lib/id-cards-store";
import { PLAYER_ID_CARD_WEB_CONFIG } from "@/config/player-id-card-coordinates";
import { COACH_ID_CARD_WEB_CONFIG } from "@/config/coach-id-card-coordinates";
import { REFEREE_ID_CARD_WEB_CONFIG, getRefereeIdCardWebConfig } from "@/config/referee-id-card-coordinates";
import { CLUB_ID_CARD_WEB_CONFIG } from "@/config/club-id-card-coordinates";

interface PlayerIdCardProps {
  card: IdCardEntry;
  isFlipped?: boolean;
  onFlipToggle?: () => void;
  showFlipButton?: boolean;
  className?: string;
}

export function PlayerIdCard({
  card,
  isFlipped: controlledFlipped,
  onFlipToggle,
  showFlipButton = false,
  className = "",
}: PlayerIdCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleToggle = () => {
    if (onFlipToggle) {
      onFlipToggle();
    } else {
      setInternalFlipped((prev) => !prev);
    }
  };

  const verificationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/id-cards/${encodeURIComponent(card.id)}`
      : `https://kalawar.org/id-cards/${encodeURIComponent(card.id)}`;

  const isCoach =
    card.cardType === "Coach" ||
    (card as any).memberType === "Coach" ||
    (card.designation && card.designation.toLowerCase().includes("coach")) ||
    card.id?.startsWith("KSM-CO") ||
    card.id?.startsWith("WSF-CO") ||
    card.id?.startsWith("KAC-CO");

  const isReferee =
    card.cardType === "Referee" ||
    (card as any).memberType === "Referee" ||
    (card.designation && card.designation.toLowerCase().includes("referee")) ||
    card.id?.startsWith("KSM-RF") ||
    card.id?.startsWith("WSF-RF") ||
    card.id?.startsWith("KAC-RF");

  const isClub =
    card.cardType === "Club" ||
    (card as any).memberType === "Club" ||
    (card.designation && card.designation.toLowerCase().includes("club")) ||
    card.id?.startsWith("KSM-CL") ||
    card.id?.startsWith("WSF-CL") ||
    card.id?.startsWith("KAC-CL");

  // Determine Referee tier: Trainee, Junior, State, National
  const refereeTier = (() => {
    if (!isReferee) return null;
    const levelStr = (card.refereeLevel || "").toLowerCase();
    if (levelStr) {
      if (levelStr.includes("national") || levelStr.includes("level 3") || levelStr.includes("chief") || levelStr.includes("international")) return "national";
      if (levelStr.includes("state") || levelStr.includes("level 2")) return "state";
      if (levelStr.includes("junior") || levelStr.includes("level 1")) return "junior";
      if (levelStr.includes("trainee") || levelStr.includes("level 0")) return "trainee";
    }
    const desStr = (card.designation || "").toLowerCase();
    if (desStr.includes("national") || desStr.includes("level 3") || desStr.includes("chief") || desStr.includes("international")) return "national";
    if (desStr.includes("state") || desStr.includes("level 2")) return "state";
    if (desStr.includes("junior") || desStr.includes("level 1")) return "junior";
    return "trainee"; // default / Level 0 Trainee
  })();

  const refereeWebConfig = isReferee ? getRefereeIdCardWebConfig(refereeTier) : null;

  const frontTemplate = isClub
    ? CLUB_ID_CARD_WEB_CONFIG.templateFront
    : isReferee && refereeWebConfig
    ? refereeWebConfig.templateFront
    : isCoach
    ? COACH_ID_CARD_WEB_CONFIG.templateFront
    : PLAYER_ID_CARD_WEB_CONFIG.templateFront;
  const frontTemplate2x = isClub
    ? CLUB_ID_CARD_WEB_CONFIG.templateFront2x
    : isReferee && refereeWebConfig
    ? refereeWebConfig.templateFront2x
    : isCoach
    ? COACH_ID_CARD_WEB_CONFIG.templateFront2x
    : PLAYER_ID_CARD_WEB_CONFIG.templateFront2x;

  const backTemplate = isClub
    ? CLUB_ID_CARD_WEB_CONFIG.templateBack
    : isReferee && refereeWebConfig
    ? refereeWebConfig.templateBack
    : isCoach
    ? COACH_ID_CARD_WEB_CONFIG.templateBack
    : PLAYER_ID_CARD_WEB_CONFIG.templateBack;
  const backTemplate2x = isClub
    ? CLUB_ID_CARD_WEB_CONFIG.templateBack2x
    : isReferee && refereeWebConfig
    ? refereeWebConfig.templateBack2x
    : isCoach
    ? COACH_ID_CARD_WEB_CONFIG.templateBack2x
    : PLAYER_ID_CARD_WEB_CONFIG.templateBack2x;

  const cardTitle = isClub
    ? "Club Identity Card"
    : isReferee
    ? `${refereeTier ? refereeTier.charAt(0).toUpperCase() + refereeTier.slice(1) : ""} Referee Identity Card`
    : isCoach
    ? "Coach Identity Card"
    : "Player Identity Card";

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Flip action button if requested */}
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

      {/* Interactive 3D Card Container with CR80 master template proportions */}
      <div
        onClick={handleToggle}
        className={cn(
          "w-full max-w-[440px] relative rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] cursor-pointer transition-transform duration-300 hover:scale-[1.015] bg-black overflow-hidden",
          isClub
            ? CLUB_ID_CARD_WEB_CONFIG.aspectRatio
            : isReferee
            ? REFEREE_ID_CARD_WEB_CONFIG.aspectRatio
            : isCoach
            ? COACH_ID_CARD_WEB_CONFIG.aspectRatio
            : PLAYER_ID_CARD_WEB_CONFIG.aspectRatio
        )}
        title="Click to flip ID Card"
      >
        {!isFlipped ? (
          /* =========================================================================
             FRONT SIDE (Master Template Artwork with Dynamic Overlays)
             ========================================================================= */
          <div className="relative w-full h-full">
            {/* Master Front Template Background Image */}
            <picture>
              <source srcSet={frontTemplate2x} type="image/png" />
              <img
                src={frontTemplate}
                alt={`${cardTitle} Front`}
                className="w-full h-full object-contain pointer-events-none select-none block"
              />
            </picture>

            {isClub ? (
              /* =========================================================================
                 CLUB ID CARD FRONT OVERLAYS
                 ========================================================================= */
              <>
                {/* OVERLAY 1: Circular Logo / Head Coach Image (strictly inside golden circular frame) */}
                <div
                  className="absolute overflow-hidden rounded-full bg-slate-900/90 flex items-center justify-center pointer-events-none shadow-md border border-amber-400/40"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.photo.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.photo.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.photo.width,
                    aspectRatio: CLUB_ID_CARD_WEB_CONFIG.photo.aspectRatio,
                  }}
                >
                  {(card.holderPhoto || (card as any).logo || (card as any).image) ? (
                    <img
                      src={card.holderPhoto || (card as any).logo || (card as any).image}
                      alt={card.holderName}
                      className="w-full h-full object-cover object-center select-none rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl select-none">
                      {card.holderName ? card.holderName.charAt(0).toUpperCase() : "🏛️"}
                    </div>
                  )}
                </div>

                {/* OVERLAY 2: Club ID No. inside White Pill Badge below photo (strictly centered at x=17.27%, y=76.64%) */}
                <div
                  className="absolute flex items-center justify-center pointer-events-none font-sans font-bold text-[#0f172a] text-[6px] sm:text-[7px] md:text-[8px] tracking-tight text-center overflow-hidden"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.idBadge.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.idBadge.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.idBadge.width,
                    height: CLUB_ID_CARD_WEB_CONFIG.idBadge.height,
                  }}
                >
                  <span className="truncate px-0.5 font-bold leading-none">{card.id}</span>
                </div>

                {/* OVERLAY 3: Right 9 Dynamic Club Fields (aligned precisely after colon ':' along gold underline tracks) */}
                {/* Line 1: CLUB NAME */}
                <div
                  className="absolute truncate font-sans font-black uppercase text-[#0f172a] text-[8px] sm:text-[9.5px] md:text-[10.5px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.clubName.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.clubName.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.clubName.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.clubName.transform,
                  }}
                >
                  {card.academyName || card.holderName}
                </div>

                {/* Line 2: REGISTRATION NO. */}
                <div
                  className="absolute truncate font-mono font-bold text-[#92400e] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.registrationNo.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.registrationNo.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.registrationNo.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.registrationNo.transform,
                  }}
                >
                  {(card as any).registrationNumber || card.id}
                </div>

                {/* Line 3: HEAD COACH */}
                <div
                  className="absolute truncate font-sans font-bold text-[#1e293b] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.headCoach.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.headCoach.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.headCoach.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.headCoach.transform,
                  }}
                >
                  {(card as any).headCoach || (card as any).president || card.holderName}
                </div>

                {/* Line 4: CONTACT NO. */}
                <div
                  className="absolute truncate font-sans font-bold text-[#1e293b] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.contactNo.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.contactNo.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.contactNo.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.contactNo.transform,
                  }}
                >
                  {card.phone || card.emergencyContact || "+91 98220 12345"}
                </div>

                {/* Line 5: ADDRESS */}
                <div
                  className="absolute truncate font-sans font-medium text-[#1e293b] text-[7px] sm:text-[8px] md:text-[9px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.address.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.address.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.address.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.address.transform,
                  }}
                >
                  {(card as any).address || `${card.district || "Pune"}, ${card.state || "Maharashtra"}`}
                </div>

                {/* Line 6: DISTRICT */}
                <div
                  className="absolute truncate font-sans font-bold text-[#1e293b] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.district.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.district.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.district.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.district.transform,
                  }}
                >
                  {card.district || "Pune"}
                </div>

                {/* Line 7: STATE */}
                <div
                  className="absolute truncate font-sans font-bold text-[#1e293b] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.state.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.state.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.state.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.state.transform,
                  }}
                >
                  {card.state || "Maharashtra"}
                </div>

                {/* Line 8: VALIDITY */}
                <div
                  className="absolute truncate font-sans font-black text-[#047857] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.validity.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.validity.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.validity.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.validity.transform,
                  }}
                >
                  {formatToDDMMYYYY(card.validUntil, "31/12/2028")}
                </div>

                {/* Line 9: CLUB CATEGORY */}
                <div
                  className="absolute truncate font-sans font-black text-[#92400e] text-[7.5px] sm:text-[9px] md:text-[10px] leading-tight pointer-events-none"
                  style={{
                    left: CLUB_ID_CARD_WEB_CONFIG.clubCategory.left,
                    top: CLUB_ID_CARD_WEB_CONFIG.clubCategory.top,
                    width: CLUB_ID_CARD_WEB_CONFIG.clubCategory.width,
                    transform: CLUB_ID_CARD_WEB_CONFIG.clubCategory.transform,
                  }}
                >
                  {(card as any).clubCategory || (card as any).type || "Affiliated Academy"}
                </div>

                {/* Optional signature image if available (no Authorized Signatory fallback text) */}
                {(card as any).signature && (
                  <div
                    className="absolute pointer-events-none flex items-center justify-end"
                    style={{
                      left: CLUB_ID_CARD_WEB_CONFIG.signature.left,
                      top: CLUB_ID_CARD_WEB_CONFIG.signature.top,
                      width: CLUB_ID_CARD_WEB_CONFIG.signature.width,
                      height: CLUB_ID_CARD_WEB_CONFIG.signature.height,
                    }}
                  >
                    <img
                      src={(card as any).signature}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </>
            ) : (
              /* =========================================================================
                 PLAYER / COACH / REFEREE FRONT OVERLAYS
                 ========================================================================= */
              <>
                {/* OVERLAY 1: Photo Box (strictly fitted inside yellow border frame) */}
                <div
                  className="absolute overflow-hidden rounded-[8px] bg-slate-100 flex items-center justify-center pointer-events-none shadow-inner"
                  style={{
                    left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.photo.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.photo.left : PLAYER_ID_CARD_WEB_CONFIG.photo.left,
                    top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.photo.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.photo.top : PLAYER_ID_CARD_WEB_CONFIG.photo.top,
                    width: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.photo.width : isCoach ? COACH_ID_CARD_WEB_CONFIG.photo.width : PLAYER_ID_CARD_WEB_CONFIG.photo.width,
                    height: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.photo.height : isCoach ? COACH_ID_CARD_WEB_CONFIG.photo.height : PLAYER_ID_CARD_WEB_CONFIG.photo.height,
                  }}
                >
                  {card.holderPhoto ? (
                    <img
                      src={card.holderPhoto}
                      alt={card.holderName}
                      className="w-full h-full object-cover object-center select-none"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 flex items-center justify-center font-black text-2xl sm:text-3xl select-none">
                      {card.holderName ? card.holderName.charAt(0).toUpperCase() : (isReferee ? "R" : isCoach ? "C" : "P")}
                    </div>
                  )}
                </div>

                {/* OVERLAY 2: Front Live Dynamic QR Code (replaces sample placeholder) */}
                <div
                  className="absolute bg-white p-[1.5px] rounded-[3px] flex items-center justify-center pointer-events-none overflow-hidden"
                  style={{
                    left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeFront.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeFront.left : PLAYER_ID_CARD_WEB_CONFIG.qrCodeFront.left,
                    top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeFront.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeFront.top : PLAYER_ID_CARD_WEB_CONFIG.qrCodeFront.top,
                    width: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeFront.width : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeFront.width : PLAYER_ID_CARD_WEB_CONFIG.qrCodeFront.width,
                    aspectRatio: "1/1",
                  }}
                >
                  <QRCode
                    value={verificationUrl}
                    size={96}
                    className="w-full h-full"
                  />
                </div>

            {/* OVERLAY 3: 10 Dynamic Fields directly ON the printed underlines (baseline aligned) */}
            {/* Line 1: Referee / Coach / Player Name */}
            <div
              className="absolute truncate font-sans font-extrabold uppercase text-[#0f172a] text-[9.5px] sm:text-[11px] md:text-[12px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.name.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.name.left : PLAYER_ID_CARD_WEB_CONFIG.name.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.name.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.name.top : PLAYER_ID_CARD_WEB_CONFIG.name.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.name.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.name.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.name.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.name.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.name.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.name.transform || "translateY(-88%)"),
              }}
            >
              {card.holderName}
            </div>

            {/* Line 2: ID No. */}
            <div
              className="absolute truncate font-mono font-black text-[#b45309] text-[9.5px] sm:text-[11px] md:text-[12px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.idNo.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.idNo.left : PLAYER_ID_CARD_WEB_CONFIG.idNo.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.idNo.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.idNo.top : PLAYER_ID_CARD_WEB_CONFIG.idNo.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.idNo.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.idNo.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.idNo.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.idNo.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.idNo.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.idNo.transform || "translateY(-88%)"),
              }}
            >
              {card.id}
            </div>

            {/* Line 3: Date of Birth */}
            <div
              className="absolute truncate font-sans font-bold text-[#1e293b] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.dob.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.dob.left : PLAYER_ID_CARD_WEB_CONFIG.dob.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.dob.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.dob.top : PLAYER_ID_CARD_WEB_CONFIG.dob.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.dob.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.dob.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.dob.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.dob.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.dob.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.dob.transform || "translateY(-88%)"),
              }}
            >
              {formatToDDMMYYYY((card as any).dob, "14/05/2008")}
            </div>

            {/* Line 4: Blood Group */}
            <div
              className="absolute truncate font-sans font-black text-[#be123c] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.bloodGroup.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.bloodGroup.left : PLAYER_ID_CARD_WEB_CONFIG.bloodGroup.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.bloodGroup.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.bloodGroup.top : PLAYER_ID_CARD_WEB_CONFIG.bloodGroup.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.bloodGroup.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.bloodGroup.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.bloodGroup.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.bloodGroup.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.bloodGroup.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.bloodGroup.transform || "translateY(-88%)"),
              }}
            >
              {card.bloodGroup && card.bloodGroup.trim().length > 0 ? card.bloodGroup : ""}
            </div>

            {/* Line 5: Discipline */}
            <div
              className="absolute truncate font-sans font-bold text-[#1e293b] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.discipline.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.discipline.left : PLAYER_ID_CARD_WEB_CONFIG.discipline.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.discipline.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.discipline.top : PLAYER_ID_CARD_WEB_CONFIG.discipline.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.discipline.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.discipline.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.discipline.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.discipline.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.discipline.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.discipline.transform || "translateY(-88%)"),
              }}
            >
              {card.discipline || "Kalawar Martial Arts"}
            </div>

            {/* Line 6: Belt / Rank / Level */}
            <div
              className="absolute truncate font-sans font-black text-[#92400e] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.beltRank.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.beltRank.left : PLAYER_ID_CARD_WEB_CONFIG.beltRank.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.beltRank.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.beltRank.top : PLAYER_ID_CARD_WEB_CONFIG.beltRank.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.beltRank.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.beltRank.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.beltRank.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.beltRank.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.beltRank.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.beltRank.transform || "translateY(-88%)"),
              }}
            >
              {card.beltRank || (isReferee ? "Brown Belt / 1st Dan" : "1st Dan Black Belt")}
            </div>

            {/* Line 7: Club / Academy */}
            <div
              className="absolute truncate font-sans font-bold text-[#1e293b] text-[8px] sm:text-[9.5px] md:text-[10.5px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.academy.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.academy.left : PLAYER_ID_CARD_WEB_CONFIG.academy.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.academy.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.academy.top : PLAYER_ID_CARD_WEB_CONFIG.academy.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.academy.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.academy.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.academy.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.academy.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.academy.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.academy.transform || "translateY(-88%)"),
              }}
            >
              {card.academyName || "KALAWAR Academy"}
            </div>

            {/* Line 8: District */}
            <div
              className="absolute truncate font-sans font-bold text-[#1e293b] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.district.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.district.left : PLAYER_ID_CARD_WEB_CONFIG.district.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.district.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.district.top : PLAYER_ID_CARD_WEB_CONFIG.district.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.district.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.district.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.district.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.district.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.district.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.district.transform || "translateY(-88%)"),
              }}
            >
              {card.district || "Pune"}
            </div>

            {/* Line 9: State */}
            <div
              className="absolute truncate font-sans font-bold text-[#1e293b] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
              style={{
                left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.state.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.state.left : PLAYER_ID_CARD_WEB_CONFIG.state.left,
                top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.state.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.state.top : PLAYER_ID_CARD_WEB_CONFIG.state.top,
                width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.state.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.state.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.state.width || "35.5%"),
                transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.state.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.state.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.state.transform || "translateY(-88%)"),
              }}
            >
              {card.state || "Maharashtra"}
            </div>

                {/* Line 10: Validity */}
                <div
                  className="absolute truncate font-sans font-black text-[#047857] text-[8.5px] sm:text-[10px] md:text-[11px] leading-tight pointer-events-none"
                  style={{
                    left: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.validity.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.validity.left : PLAYER_ID_CARD_WEB_CONFIG.validity.left,
                    top: isReferee ? REFEREE_ID_CARD_WEB_CONFIG.validity.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.validity.top : PLAYER_ID_CARD_WEB_CONFIG.validity.top,
                    width: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.validity.width || "35.5%") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.validity.width || "35.5%") : (PLAYER_ID_CARD_WEB_CONFIG.validity.width || "35.5%"),
                    transform: isReferee ? (REFEREE_ID_CARD_WEB_CONFIG.validity.transform || "translateY(-92%)") : isCoach ? (COACH_ID_CARD_WEB_CONFIG.validity.transform || "translateY(-92%)") : (PLAYER_ID_CARD_WEB_CONFIG.validity.transform || "translateY(-88%)"),
                  }}
                >
                  {formatToDDMMYYYY(card.validUntil, "31/12/2027")}
                </div>
              </>
            )}
          </div>
        ) : (
          /* =========================================================================
             BACK SIDE (Master Template Artwork with Dynamic Overlays)
             ========================================================================= */
          <div className="relative w-full h-full">
            {/* Master Back Template Background Image */}
            <picture>
              <source srcSet={backTemplate2x} type="image/png" />
              <img
                src={backTemplate}
                alt={`${cardTitle} Back`}
                className="w-full h-full object-contain pointer-events-none select-none block"
              />
            </picture>

            {/* Dynamic Live QR Code Overlay on Back */}
            <div
              className="absolute bg-white p-[2px] rounded-[3px] flex items-center justify-center pointer-events-none overflow-hidden shadow-sm"
              style={{
                left: isClub ? CLUB_ID_CARD_WEB_CONFIG.qrCodeBack.left : isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeBack.left : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeBack.left : PLAYER_ID_CARD_WEB_CONFIG.qrCodeBack.left,
                top: isClub ? CLUB_ID_CARD_WEB_CONFIG.qrCodeBack.top : isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeBack.top : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeBack.top : PLAYER_ID_CARD_WEB_CONFIG.qrCodeBack.top,
                width: isClub ? CLUB_ID_CARD_WEB_CONFIG.qrCodeBack.width : isReferee ? REFEREE_ID_CARD_WEB_CONFIG.qrCodeBack.width : isCoach ? COACH_ID_CARD_WEB_CONFIG.qrCodeBack.width : PLAYER_ID_CARD_WEB_CONFIG.qrCodeBack.width,
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
