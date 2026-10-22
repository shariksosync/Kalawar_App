import { NextResponse } from "next/server";
import { getBeltExams } from "@/lib/belt-exams-store";
import { getAllDanApplications } from "@/lib/dan-grading-store";
import { getPlayers } from "@/lib/players-store";

export interface CertifiedBeltCandidate {
  id: string;
  name: string;
  rank: string;
  athleteId: string;
  certificateNumber: string;
  district: string;
  state: string;
  club: string;
  examType: "Belt Examination" | "Black Belt Examination";
  examTitle: string;
  examDate?: string;
  issuedDate?: string;
  image?: string;
  certificateUrl?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state") || "";
    const districtParam = searchParams.get("district") || "";
    const examTypeParam = searchParams.get("examType") || searchParams.get("beltType") || "";
    const searchParam = searchParams.get("query") || searchParams.get("q") || searchParams.get("search") || "";

    // 1. Fetch Players for fallback enrichment (districts, clubs, avatars)
    const players = await getPlayers().catch(() => []);
    const playerMap = new Map<string, any>();
    for (const p of players) {
      if (p.id) {
        playerMap.set(p.id.toLowerCase().trim(), p);
      }
    }

    const candidates: CertifiedBeltCandidate[] = [];
    const seenCertificates = new Set<string>();

    // 2. Extract certified candidates from Belt Examinations (Candidate Roster & Results)
    try {
      const beltExamSessions = await getBeltExams();
      for (const session of beltExamSessions) {
        if (!session.candidates || !Array.isArray(session.candidates)) continue;
        for (const cand of session.candidates) {
          const certNo = (cand.certificateNumber || "").trim();
          const isPassed = cand.resultStatus === "Passed" || cand.status === "Result Declared";
          
          // Only show candidates who have been issued an official certificate
          if (certNo || (isPassed && cand.certificateNumber)) {
            const cleanCert = certNo || (isPassed ? `KAC-BELT-${cand.id}` : "");
            if (!cleanCert) continue;

            const player = cand.athleteId ? playerMap.get(cand.athleteId.toLowerCase().trim()) : null;
            const state = (cand.state || session.state || player?.state || "").trim();
            const district = ((cand as any).city || session.city || player?.district || player?.city || "").trim();
            const club = (cand.academyName || cand.clubName || player?.club || "").trim();
            const image = cand.athleteImage || player?.image || "";

            const dedupeKey = `BELT_${cleanCert.toLowerCase()}_${(cand.athleteId || cand.id).toLowerCase()}`;
            if (!seenCertificates.has(dedupeKey)) {
              seenCertificates.add(dedupeKey);
              candidates.push({
                id: cand.id || `CAND-${candidates.length + 1}`,
                name: cand.athleteName || player?.name || "Martial Arts Athlete",
                rank: cand.targetBelt || "Color Belt",
                athleteId: cand.athleteId || cand.id,
                certificateNumber: cleanCert,
                district: district || (state ? `${state} Central` : "General"),
                state: state || "National",
                club: club || "Kalawar Sports Academy",
                examType: "Belt Examination",
                examTitle: session.title || "Belt Promotion Examination",
                examDate: cand.examDate || session.examDate,
                issuedDate: cand.resultDeclaredAt || cand.evaluatedAt || session.examDate,
                image,
                certificateUrl: `/certificates/belt/${encodeURIComponent(cleanCert)}`,
              });
            }
          }
        }
      }
    } catch (beltErr) {
      console.error("Error aggregating Belt Exam candidates:", beltErr);
    }

    // 3. Extract certified candidates from Black Belt & Dan Grading (Dan Registry & Credentials)
    try {
      const danApplications = await getAllDanApplications();
      for (const app of danApplications) {
        const certNo = (app.certificateNumber || "").trim();
        const isPassed = app.status === "Passed";

        // Only show candidates who have been issued an official certificate
        if (certNo || isPassed) {
          const cleanCert = certNo || (isPassed ? `KAC-DAN-${app.id}` : "");
          if (!cleanCert) continue;

          const player = app.athleteId ? playerMap.get(app.athleteId.toLowerCase().trim()) : null;
          const state = (app.state || player?.state || "").trim();
          const district = ((app as any).district || (app as any).city || player?.district || player?.city || "").trim();
          const club = (app.academyName || player?.club || "").trim();
          const image = app.athletePhoto || player?.image || "";

          const rankTitle =
            app.appliedDanTitle ||
            (app.appliedDanGrade ? `${app.appliedDanGrade}th Dan Black Belt` : "Black Belt");

          const dedupeKey = `DAN_${cleanCert.toLowerCase()}_${(app.athleteId || app.id).toLowerCase()}`;
          if (!seenCertificates.has(dedupeKey)) {
            seenCertificates.add(dedupeKey);
            candidates.push({
              id: app.id || `DAN-${candidates.length + 1}`,
              name: app.fullName || player?.name || "Black Belt Candidate",
              rank: rankTitle,
              athleteId: app.athleteId || app.id,
              certificateNumber: cleanCert,
              district: district || (state ? `${state} Central` : "General"),
              state: state || "National",
              club: club || "Black Belt Academy",
              examType: "Black Belt Examination",
              examTitle: `${rankTitle} Official Grading`,
              examDate: app.examDate || app.appliedDate,
              issuedDate: app.certificateIssuedDate || app.appliedDate,
              image,
              certificateUrl: `/certificates/dan/${encodeURIComponent(cleanCert)}`,
            });
          }
        }
      }
    } catch (danErr) {
      console.error("Error aggregating Dan Grading candidates:", danErr);
    }

    // Also check players' belt history for any accredited promotions with certificates
    try {
      for (const p of players) {
        if (p.beltHistory && Array.isArray(p.beltHistory)) {
          for (const bh of p.beltHistory) {
            const certNo = (bh.certificateNumber || bh.certificateNo || "").trim();
            if (certNo) {
              const isDan =
                (bh.belt && bh.belt.toLowerCase().includes("dan")) ||
                (bh.belt && bh.belt.toLowerCase().includes("black"));
              const examType: "Belt Examination" | "Black Belt Examination" = isDan
                ? "Black Belt Examination"
                : "Belt Examination";
              const dedupeKey = `${examType === "Black Belt Examination" ? "DAN" : "BELT"}_${certNo.toLowerCase()}_${(p.id || "").toLowerCase()}`;

              if (!seenCertificates.has(dedupeKey)) {
                seenCertificates.add(dedupeKey);
                candidates.push({
                  id: `BH-${certNo}`,
                  name: p.name,
                  rank: bh.belt || "Color Belt",
                  athleteId: p.id,
                  certificateNumber: certNo,
                  district: p.district || p.city || "Central",
                  state: p.state || "National",
                  club: bh.academyName || p.club || "Federation Dojo",
                  examType,
                  examTitle: bh.sessionName || "Official Belt Promotion",
                  examDate: bh.promotedDate || bh.date,
                  issuedDate: bh.promotedDate || bh.date,
                  image: p.image || "",
                  certificateUrl:
                    examType === "Black Belt Examination"
                      ? `/certificates/dan/${encodeURIComponent(certNo)}`
                      : `/certificates/belt/${encodeURIComponent(certNo)}`,
                });
              }
            }
          }
        }
      }
    } catch (pErr) {
      console.error("Error checking player beltHistory:", pErr);
    }

    // Extract dynamic unique dropdown options before filtering
    const allDistricts = Array.from(
      new Set(
        candidates
          .map((c) => c.district.trim())
          .filter((d) => d.length > 0 && d.toLowerCase() !== "general" && d.toLowerCase() !== "central")
      )
    ).sort((a, b) => a.localeCompare(b));

    const allStates = Array.from(
      new Set(
        candidates
          .map((c) => c.state.trim())
          .filter((s) => s.length > 0 && s.toLowerCase() !== "national")
      )
    ).sort((a, b) => a.localeCompare(b));

    // Filter results according to query parameters
    let filtered = candidates;

    if (stateParam && stateParam !== "All") {
      filtered = filtered.filter(
        (c) => c.state.toLowerCase() === stateParam.toLowerCase()
      );
    }

    if (districtParam && districtParam !== "All") {
      filtered = filtered.filter(
        (c) => c.district.toLowerCase() === districtParam.toLowerCase()
      );
    }

    if (examTypeParam && examTypeParam !== "All") {
      filtered = filtered.filter((c) => {
        if (examTypeParam === "Black Belt Examination") {
          return c.examType === "Black Belt Examination";
        }
        if (examTypeParam === "Belt Examination") {
          return c.examType === "Belt Examination";
        }
        return true;
      });
    }

    if (searchParam && searchParam.trim()) {
      const q = searchParam.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q) ||
          c.athleteId.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.rank.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      totalCount: candidates.length,
      filteredCount: filtered.length,
      districts: allDistricts,
      states: allStates,
      candidates: filtered,
    });
  } catch (error) {
    console.error("GET /api/certified-belts-candidates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch certified belt candidates" },
      { status: 500 }
    );
  }
}
