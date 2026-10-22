import { NextRequest, NextResponse } from "next/server";
import { approveIdCardRequest, rejectIdCardRequest, getIdCardRequests } from "@/lib/id-cards-store";

export async function GET() {
  try {
    const requests = await getIdCardRequests();
    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (err: any) {
    console.error("GET /api/id-cards/approve error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch ID card requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, action = "approve", overrides, reason } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "Member / Player ID is required" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      const rejected = await rejectIdCardRequest(playerId, reason);
      return NextResponse.json({
        success: true,
        message: "ID card request rejected successfully",
        rejected,
      });
    }

    // Default: Approve & Issue ID Card
    const newCard = await approveIdCardRequest(playerId, overrides);
    if (!newCard) {
      return NextResponse.json(
        { success: false, error: "Failed to approve and issue ID card" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card: newCard,
      message: `Official ID card ${newCard.id} successfully issued for ${newCard.holderName}!`,
    });
  } catch (err: any) {
    console.error("POST /api/id-cards/approve error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process ID card request" },
      { status: 500 }
    );
  }
}
