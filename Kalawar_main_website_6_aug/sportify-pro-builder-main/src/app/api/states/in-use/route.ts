import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/players-store";
import { states as allKnownStates } from "@/data/people";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const players = await getPlayers();
    
    // Extract unique states used by registered users (Player, Coach, Referee, Club)
    const usedStatesSet = new Set<string>();
    
    players.forEach((p) => {
      const stateName = p.state?.trim();
      if (stateName && stateName !== "National" && stateName !== "Select State") {
        usedStatesSet.add(stateName);
      }
    });

    const inUseStates = Array.from(usedStatesSet).sort((a, b) => a.localeCompare(b));

    // If no states yet, provide common top registered states as graceful fallback
    const fallbackStates = ["Uttar Pradesh", "Delhi", "Maharashtra", "Karnataka", "Bihar", "West Bengal", "Gujarat", "Tamil Nadu", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Kerala", "Telangana", "Andhra Pradesh", "Assam", "Odisha", "Jharkhand", "Uttarakhand", "Goa"];
    const finalStates = inUseStates.length > 0 ? inUseStates : fallbackStates;

    return NextResponse.json({
      success: true,
      states: finalStates,
      allStates: allKnownStates,
    });
  } catch (error) {
    console.error("GET /api/states/in-use error:", error);
    return NextResponse.json({
      success: true,
      states: ["Uttar Pradesh", "Delhi", "Maharashtra"],
      allStates: allKnownStates,
    });
  }
}
