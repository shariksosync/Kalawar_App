import { NextRequest, NextResponse } from "next/server";
import { getPlayerById, getPlayers, updatePlayer, deletePlayer, isEmailAlreadyRegistered, isUsernameAlreadyRegistered } from "@/lib/players-store";
import { verifyMemberSession, signMemberSession, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    console.error("GET /api/players/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player" },
      { status: 500 },
    );
  }
}

import { validatePhoneNumber, validateEmergencyContact, validatePincode, validateCity, validateEmail } from "@/lib/validation";
import { sendProfileSubmittedPendingEmail } from "@/lib/email-service";

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingPlayer = await getPlayerById(id);

    if (body.username && typeof body.username === "string" && body.username.trim()) {
      const cleanUsername = body.username.trim().toLowerCase().replace(/\s+/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters long" },
          { status: 400 },
        );
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
        return NextResponse.json(
          { success: false, error: "Username can only contain letters, numbers, underscores, dots, or hyphens" },
          { status: 400 },
        );
      }
      const usernameCheck = await isUsernameAlreadyRegistered(cleanUsername, id);
      if (usernameCheck.isRegistered) {
        return NextResponse.json(
          {
            success: false,
            error: `This username is already taken by a registered ${usernameCheck.existingRecord?.memberType || "member"}. Please choose another username.`,
          },
          { status: 409 },
        );
      }
      body.username = cleanUsername;
    }

    if (body.email && typeof body.email === "string" && body.email.trim()) {
      const emailVal = validateEmail(body.email, { required: false });
      if (!emailVal.isValid) {
        return NextResponse.json(
          { success: false, error: "Wrong email ID" },
          { status: 400 },
        );
      }
      const cleanEmail = emailVal.cleaned;
      if (!existingPlayer?.email || existingPlayer.email.trim().toLowerCase() !== cleanEmail) {
        const emailCheck = await isEmailAlreadyRegistered(cleanEmail, id);
        if (emailCheck.isRegistered) {
          return NextResponse.json(
            {
              success: false,
              error: `This email address is already registered to another member (${emailCheck.existingRecord?.name}).`,
            },
            { status: 400 },
          );
        }
      }
      body.email = cleanEmail;
    }

    if (body.phone && typeof body.phone === "string" && body.phone.trim()) {
      const phoneVal = validatePhoneNumber(body.phone, {
        required: false,
        fieldName: "Phone number",
      });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid phone number format" },
          { status: 400 },
        );
      }
      body.phone = phoneVal.cleaned;
    }

    if (body.emergencyContact && typeof body.emergencyContact === "string" && body.emergencyContact.trim()) {
      const emergencyVal = validateEmergencyContact(body.emergencyContact, { required: false });
      if (!emergencyVal.isValid) {
        return NextResponse.json(
          { success: false, error: emergencyVal.error || "Invalid emergency contact number" },
          { status: 400 },
        );
      }
    }

    if (body.pincode && typeof body.pincode === "string" && body.pincode.trim()) {
      const pinVal = validatePincode(body.pincode, { required: false });
      if (!pinVal.isValid) {
        return NextResponse.json(
          { success: false, error: pinVal.error || "Invalid PIN code format" },
          { status: 400 },
        );
      }
      body.pincode = pinVal.cleaned;
    }

    if (body.city && typeof body.city === "string" && body.city.trim()) {
      const cityVal = validateCity(body.city, { required: false });
      if (!cityVal.isValid) {
        return NextResponse.json(
          { success: false, error: cityVal.error || "Invalid city" },
          { status: 400 },
        );
      }
    }

    const updated = await updatePlayer(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    // If status transitioned from Incomplete to Pending upon filling Academic History, notify player via email
    if (
      existingPlayer &&
      existingPlayer.status === "Incomplete" &&
      updated.status === "Pending" &&
      updated.email
    ) {
      try {
        await sendProfileSubmittedPendingEmail(
          updated.email,
          updated.name,
          updated.id,
          updated.academicHistory?.length || 1
        );
      } catch (emailErr) {
        console.warn("Pending status transition email note:", emailErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Player updated successfully",
      player: updated,
    });

    // Refresh member session cookie if the logged-in member updated their own profile
    try {
      const memberToken = request.cookies.get("member_session")?.value;
      if (memberToken) {
        const currentUser = await verifyMemberSession(memberToken);
        if (currentUser && currentUser.id.toLowerCase() === id.toLowerCase()) {
          const authUser: AuthUser = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: "member",
            discipline: updated.discipline,
            avatar: updated.image,
          };
          const token = await signMemberSession(authUser);
          response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));
        }
      }
    } catch (sessionErr) {
      console.warn("Session refresh note:", sessionErr);
    }

    // Sync profile updates (photo, name, discipline, belt rank, club, status) to ID Card
    try {
      const { updateIdCard } = await import("@/lib/id-cards-store");
      await updateIdCard(id, {
        ...(body.image ? { holderPhoto: body.image } : {}),
        ...(body.name ? { holderName: body.name } : {}),
        ...(body.beltRank ? { beltRank: body.beltRank } : {}),
        ...(body.discipline ? { discipline: body.discipline } : {}),
        ...(body.club ? { academyName: body.club } : {}),
        ...(body.status ? { status: body.status === "Suspended" ? "Suspended" : "Active" } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(body.emergencyContact ? { emergencyContact: body.emergencyContact } : {}),
        ...(body.bloodGroup ? { bloodGroup: body.bloodGroup } : {}),
      });
    } catch (syncErr) {
      console.warn("ID card sync note on player update:", syncErr);
    }

    return response;
  } catch (error) {
    console.error("PUT /api/players/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update player",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await deletePlayer(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    // Also remove from ID cards registry
    try {
      const { deleteIdCard } = await import("@/lib/id-cards-store");
      await deleteIdCard(id);
    } catch (delErr) {
      console.warn("ID card delete note:", delErr);
    }

    const response = NextResponse.json({
      success: true,
      message: "Player profile deleted successfully",
    });

    // If current user is deleting their own account, clear session cookie
    try {
      const memberToken = request.cookies.get("member_session")?.value;
      if (memberToken) {
        const currentUser = await verifyMemberSession(memberToken);
        if (currentUser && currentUser.id.toLowerCase() === id.toLowerCase()) {
          response.cookies.delete("member_session");
        }
      }
    } catch {}

    return response;
  } catch (error) {
    console.error("DELETE /api/players/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete player",
      },
      { status: 500 },
    );
  }
}
