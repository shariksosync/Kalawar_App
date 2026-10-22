import { NextResponse } from "next/server";
import { getPlayerById, updatePlayer } from "@/lib/players-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const body = await request.json();
    const { action } = body as { action: "confirm" | "reject" };

    if (!action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'confirm' or 'reject'." },
        { status: 400 }
      );
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    if (action === "confirm") {
      const updated = await updatePlayer(playerId, {
        coachApprovalStatus: "confirmed",
      });
      return NextResponse.json({
        success: true,
        message: `Athlete ${player.name} has been confirmed under your coaching roster.`,
        player: updated,
      });
    } else {
      // Reject action: mark rejected and set coachName to Independent
      const updated = await updatePlayer(playerId, {
        coachApprovalStatus: "rejected",
        coachName: "Independent / No Coach",
      });
      return NextResponse.json({
        success: true,
        message: `Athlete ${player.name} affiliation request has been rejected.`,
        player: updated,
      });
    }
  } catch (error) {
    console.error("PATCH /api/coach/players/[playerId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update player coach status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const player = await getPlayerById(playerId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    // Disassociate player from coach
    const updated = await updatePlayer(playerId, {
      coachName: "Independent / No Coach",
      coachApprovalStatus: undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Athlete ${player.name} has been removed from your coaching roster.`,
      player: updated,
    });
  } catch (error) {
    console.error("DELETE /api/coach/players/[playerId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove player from roster" },
      { status: 500 }
    );
  }
}
