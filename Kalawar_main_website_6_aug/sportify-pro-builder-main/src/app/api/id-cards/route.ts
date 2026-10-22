import { NextRequest, NextResponse } from "next/server";
import { getIdCards, createIdCard, syncMembersToIdCards, getIdCardRequests } from "@/lib/id-cards-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || searchParams.get("cardType") || undefined;
    const status = searchParams.get("status") || undefined;
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const sync = searchParams.get("sync") === "true";
    const includeRequests = searchParams.get("includeRequests") === "true" || searchParams.get("requests") === "true";

    let cards = sync ? await syncMembersToIdCards() : await getIdCards();
    const requests = includeRequests ? await getIdCardRequests() : [];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      cards = cards.filter(
        (c) =>
          c.holderName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.academyName.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q)
      );
    }

    if (type && type !== "All" && type !== "All Types") {
      cards = cards.filter(
        (c) => c.cardType.toLowerCase() === type.toLowerCase()
      );
    }

    if (status && status !== "All" && status !== "All Status") {
      cards = cards.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (state && state !== "All" && state !== "All States") {
      cards = cards.filter(
        (c) => c.state.toLowerCase() === state.toLowerCase()
      );
    }

    if (district && district !== "All" && district !== "All Districts") {
      cards = cards.filter(
        (c) => c.district.toLowerCase() === district.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      cards,
      requests,
      totalCards: cards.length,
      totalRequests: requests.length,
    });
  } catch (err: any) {
    console.error("GET /api/id-cards error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch ID cards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.holderName) {
      return NextResponse.json(
        { success: false, error: "Holder name is required" },
        { status: 400 }
      );
    }

    const newCard = await createIdCard(body);
    return NextResponse.json({
      success: true,
      card: newCard,
      message: "ID card generated successfully",
    });
  } catch (err: any) {
    console.error("POST /api/id-cards error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create ID card" },
      { status: 500 }
    );
  }
}
