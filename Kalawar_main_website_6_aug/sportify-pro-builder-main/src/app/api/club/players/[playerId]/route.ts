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
        clubApprovalStatus: "confirmed",
      });
      return NextResponse.json({
        success: true,
        message: `Athlete ${player.name} has been confirmed.`,
        player: updated,
      });
    } else {
      // Reject action: mark rejected and set club to Independent
      const updated = await updatePlayer(playerId, {
        clubApprovalStatus: "rejected",
        club: "Independent / No Affiliated Club",
      });
      return NextResponse.json({
        success: true,
        message: `Athlete ${player.name} affiliation request has been rejected.`,
        player: updated,
      });
    }
  } catch (error) {
    console.error("PATCH /api/club/players/[playerId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update player club status" },
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

    // Disassociate player from club
    const updated = await updatePlayer(playerId, {
      club: "Independent / No Affiliated Club",
      clubApprovalStatus: undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Athlete ${player.name} has been removed from the club roster.`,
      player: updated,
    });
  } catch (error) {
    console.error("DELETE /api/club/players/[playerId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove player from club" },
      { status: 500 }
    );
  }
}
