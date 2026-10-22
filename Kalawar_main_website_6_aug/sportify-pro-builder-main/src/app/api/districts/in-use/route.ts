import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/players-store";
import { getDistrictsByState, INDIA_STATES_DISTRICTS } from "@/data/india-districts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state")?.trim();

    const players = await getPlayers();

    // Extract unique districts used by registered users (Player, Coach, Referee, Club)
    const usedDistrictsSet = new Set<string>();

    players.forEach((p) => {
      const pState = (p.state || "").trim().toLowerCase();
      const pDist = (p.district || p.city || "").trim();

      if (stateParam) {
        if (pState === stateParam.toLowerCase() && pDist && pDist !== "Select District" && pDist !== "General Unit") {
          usedDistrictsSet.add(pDist);
        }
      } else if (pDist && pDist !== "Select District" && pDist !== "General Unit") {
        usedDistrictsSet.add(pDist);
      }
    });

    const inUseDistricts = Array.from(usedDistrictsSet).sort((a, b) => a.localeCompare(b));

    // Fallback: If no in-use districts yet for state, provide known districts from INDIA_STATES_DISTRICTS
    const knownStateDistricts = stateParam ? getDistrictsByState(stateParam) : [];
    const finalDistricts = inUseDistricts.length > 0 ? inUseDistricts : knownStateDistricts.slice(0, 15);

    return NextResponse.json({
      success: true,
      districts: finalDistricts,
      allDistricts: knownStateDistricts,
    });
  } catch (error) {
    console.error("GET /api/districts/in-use error:", error);
    return NextResponse.json({
      success: true,
      districts: [],
      allDistricts: [],
    });
  }
}
