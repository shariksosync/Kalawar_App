import { NextRequest, NextResponse } from "next/server";
import { getDanCertificateByNumber, getDanApplicationById } from "@/lib/dan-grading-store";
import { getIdCardById } from "@/lib/id-cards-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cert = await getDanCertificateByNumber(id);
    const app = await getDanApplicationById(id);
    const idCard = !cert && !app ? await getIdCardById(id) : null;

    if (!cert && !app && (!idCard || idCard.cardType !== "Dan")) {
      return NextResponse.json(
        { success: false, error: "Dan ID Card credentials not found" },
        { status: 404 }
      );
    }

    const isPassed = !!cert || app?.status === "Passed" || (idCard?.status === "Active" || idCard?.status === "Approved");
    const status = cert ? "Passed" : app?.status || idCard?.status || "Submitted";

    const danRank = cert?.danRank || app?.appliedDanGrade || idCard?.danRank || 1;
    const danRankTitle = cert?.danRankTitle || app?.appliedDanTitle || idCard?.danRankTitle || idCard?.beltRank || `${danRank}st Dan Black Belt`;

    const JAPANESE_TITLES: Record<number, string> = {
      1: "Sho Dan",
      2: "Ni Dan",
      3: "San Dan",
      4: "Yon Dan",
      5: "Go Dan",
      6: "Roku Dan",
      7: "Shichi Dan",
      8: "Hachi Dan",
      9: "Ku Dan",
      10: "Ju Dan",
    };

    const KOREAN_TITLES: Record<number, string> = {
      1: "Il Dan",
      2: "Ee Dan",
      3: "Sam Dan",
      4: "Sa Dan",
      5: "O Dan",
      6: "Yook Dan",
      7: "Chil Dan",
      8: "Pal Dan",
      9: "Goo Dan",
      10: "Sip Dan",
    };

    let photoUrl = cert?.photoUrl || app?.athletePhoto || idCard?.holderPhoto;
    if (!photoUrl || photoUrl.includes("unsplash.com")) {
      try {
        const { getPlayers } = await import("@/lib/players-store");
        const players = await getPlayers();
        const searchId = cert?.athleteId || app?.athleteId || idCard?.id || id;
        const searchEmail = app?.email || idCard?.email;
        const searchName = cert?.candidateName || app?.fullName || idCard?.holderName;
        const player = players.find(
          (p) =>
            (p.id && p.id.toLowerCase() === searchId.toLowerCase()) ||
            (p.email && searchEmail && p.email.toLowerCase() === searchEmail.toLowerCase())
        );
        if (player?.image) {
          photoUrl = player.image;
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      card: {
        id: cert?.idCardNumber || app?.idCardNumber || idCard?.idCardNumber || "KAC-DAN-ID-" + id,
        idCardNumber: cert?.idCardNumber || app?.idCardNumber || idCard?.idCardNumber || "KAC-DAN-ID-" + id,
        certificateNumber: cert?.certificateNumber || app?.certificateNumber || idCard?.certificateNumber || id,
        candidateName: cert?.candidateName || app?.fullName || idCard?.holderName || "Dan Athlete",
        fullName: cert?.candidateName || app?.fullName || idCard?.holderName || "Dan Athlete",
        athleteId: cert?.athleteId || app?.athleteId || idCard?.id || id,
        danRank,
        appliedDanGrade: danRank,
        danRankTitle,
        appliedDanTitle: danRankTitle,
        japaneseTitle: cert?.japaneseTitle || JAPANESE_TITLES[danRank] || "Sho Dan",
        koreanTitle: cert?.koreanTitle || KOREAN_TITLES[danRank] || "Il Dan",
        dob: cert?.dob || app?.dob || "15/08/1998",
        dateOfBirth: cert?.dob || app?.dob || "15/08/1998",
        bloodGroup: (app as any)?.bloodGroup || idCard?.bloodGroup || "",
        discipline: cert?.discipline || app?.discipline || idCard?.discipline || "Kalawar Martial Arts",
        academyName: cert?.academyName || app?.academyName || idCard?.academyName || "Kalawar State Academy",
        academy: cert?.academyName || app?.academyName || idCard?.academyName || "Kalawar State Academy",
        district: (app as any)?.district || idCard?.district || "Pune",
        state: cert?.state || app?.state || idCard?.state || "Maharashtra",
        photoUrl: photoUrl,
        athletePhoto: photoUrl,
        holderPhoto: photoUrl,
        issueDate: cert?.issueDate || app?.certificateIssuedDate || idCard?.issueDate || "2026-09-04",
        validity: "Lifetime Holder",
        validUntil: "Lifetime Holder",
        status,
        isApproved: isPassed,
        presidentName: "MR. SANTOSH KASBE",
        presidentRole: "Founder & President – India | Head – Technical Committee, India",
        emergencyPhone: app?.phone || idCard?.emergencyContact || idCard?.phone || "+91 70833 14435",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load ID card" },
      { status: 500 }
    );
  }
}