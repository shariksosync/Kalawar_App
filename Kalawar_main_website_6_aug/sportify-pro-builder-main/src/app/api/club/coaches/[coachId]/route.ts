import { NextResponse } from "next/server";
import { getPlayerById, updatePlayer } from "@/lib/players-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;
    const body = await request.json();
    const { action } = body as { action: "confirm" | "reject" };

    if (!action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'confirm' or 'reject'." },
        { status: 400 }
      );
    }

    const coach = await getPlayerById(coachId);
    if (!coach) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    if (action === "confirm") {
      const updated = await updatePlayer(coachId, {
        clubApprovalStatus: "confirmed",
      });
      return NextResponse.json({
        success: true,
        message: `Coach ${coach.name} has been confirmed.`,
        coach: updated,
      });
    } else {
      // Reject action: mark rejected and set club to Independent
      const updated = await updatePlayer(coachId, {
        clubApprovalStatus: "rejected",
        club: "Independent / No Affiliated Club",
      });
      return NextResponse.json({
        success: true,
        message: `Coach ${coach.name} affiliation request has been rejected.`,
        coach: updated,
      });
    }
  } catch (error) {
    console.error("PATCH /api/club/coaches/[coachId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update coach affiliation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;
    const coach = await getPlayerById(coachId);
    if (!coach) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    // Disassociate coach from club
    const updated = await updatePlayer(coachId, {
      club: "Independent / No Affiliated Club",
      clubApprovalStatus: undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Coach ${coach.name} has been removed from the club roster.`,
      coach: updated,
    });
  } catch (error) {
    console.error("DELETE /api/club/coaches/[coachId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove coach from club" },
      { status: 500 }
    );
  }
}
