import { NextRequest, NextResponse } from "next/server";
import { getIdCardById, updateIdCard, deleteIdCard } from "@/lib/id-cards-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    let card = await getIdCardById(params.id);

    if (!card) {
      return NextResponse.json(
        { success: false, error: "ID card credential not found" },
        { status: 404 }
      );
    }

    // If card holder photo is missing or generic, check player store or dan applications for actual athlete photo
    if (!card.holderPhoto || card.holderPhoto.includes("unsplash.com")) {
      try {
        const { getPlayers } = await import("@/lib/players-store");
        const players = await getPlayers();
        const player = players.find(
          (p) =>
            (p.id && p.id.toLowerCase() === params.id.toLowerCase()) ||
            (p.email && card?.email && p.email.toLowerCase() === card.email.toLowerCase())
        );
        if (player?.image) {
          card = { ...card, holderPhoto: player.image };
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch ID card" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const updated = await updateIdCard(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "ID card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card: updated,
      message: "ID card updated successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update ID card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const card = await getIdCardById(params.id);

    const cleanId = (params.id || "").trim();
    if (!cleanId) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const deleted = await deleteIdCard(cleanId);

    if (!deleted && !card) {
      return NextResponse.json(
        { success: false, error: "ID card not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `ID card ${cleanId} deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete ID card" },
      { status: 500 }
    );
  }
}
