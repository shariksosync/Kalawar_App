import { NextResponse } from "next/server";
import {
  RULES_SECTIONS,
  DISCIPLINE_RULES,
  FEDERATION_RULES_OVERVIEW,
} from "@/data/rules-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discipline = searchParams.get("discipline");
  const sectionId = searchParams.get("section");

  if (discipline) {
    const found = DISCIPLINE_RULES.find(
      (d) => d.id.toLowerCase() === discipline.toLowerCase()
    );
    if (!found) {
      return NextResponse.json(
        { success: false, error: "Discipline not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, discipline: found },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  if (sectionId) {
    const found = RULES_SECTIONS.find(
      (s) => s.id.toLowerCase() === sectionId.toLowerCase()
    );
    if (!found) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, section: found },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  return NextResponse.json(
    {
      success: true,
      overview: FEDERATION_RULES_OVERVIEW,
      totalSections: RULES_SECTIONS.length,
      sections: RULES_SECTIONS,
      disciplines: DISCIPLINE_RULES,
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
