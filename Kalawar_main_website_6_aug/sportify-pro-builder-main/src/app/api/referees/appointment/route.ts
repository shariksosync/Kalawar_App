import { NextResponse } from "next/server";
import { appointRefereeToDuty } from "@/lib/referees-store";
import { type DutyPosition } from "@/types/referee";
import { sendRefereeAppointmentEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      refereeId,
      championshipId,
      championshipName,
      eventDate,
      location,
      category,
      ringOrMatNumber,
      position,
      appointedBy,
    } = body;

    if (!refereeId || !championshipName || !eventDate || !position) {
      return NextResponse.json(
        {
          success: false,
          error: "Referee ID, Championship Name, Event Date, and Duty Position are required.",
        },
        { status: 400 }
      );
    }

    const updatedReferee = await appointRefereeToDuty(refereeId, {
      championshipId: championshipId || "",
      championshipName: championshipName.trim(),
      eventDate: eventDate.trim(),
      location: location || "",
      category: category || "All Categories",
      ringOrMatNumber: ringOrMatNumber || "Mat 1",
      position: position as DutyPosition,
      appointedBy: appointedBy || "Technical Committee",
      status: "Confirmed",
    });

    // Send official appointment email with full details to the referee's email
    let emailDispatched = false;
    if (updatedReferee.email) {
      try {
        const mailResult = await sendRefereeAppointmentEmail({
          email: updatedReferee.email,
          name: updatedReferee.name,
          refereeId: updatedReferee.id,
          level: updatedReferee.level,
          currentRank: updatedReferee.currentRank,
          licenseNumber: updatedReferee.licenseNumber,
          championshipName: championshipName.trim(),
          eventDate: eventDate.trim(),
          ringOrMatNumber: ringOrMatNumber || "Mat 1",
          position: position as string,
          location: location || "",
          category: category || "All Categories",
          appointedBy: appointedBy || "Technical Committee",
        });
        emailDispatched = !!mailResult?.success;
      } catch (mailError) {
        console.warn("[Appointment Route] Could not send appointment email:", mailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Official ${updatedReferee.name} appointed to ${position} (${ringOrMatNumber || "Mat 1"}).${
        updatedReferee.email ? ` Notification email sent to ${updatedReferee.email}.` : ""
      }`,
      referee: updatedReferee,
      emailSent: emailDispatched,
    });
  } catch (error: any) {
    console.error("POST /api/referees/appointment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to appoint referee to tournament duty.",
      },
      { status: 400 }
    );
  }
}
