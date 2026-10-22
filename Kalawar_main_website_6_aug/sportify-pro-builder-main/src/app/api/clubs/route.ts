import { NextResponse } from "next/server";
import { getClubs, createPlayer, isEmailAlreadyRegistered, isUsernameAlreadyRegistered, type CreatePlayerInput } from "@/lib/players-store";
import {
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validateYearFounded,
  validateAddress,
} from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("q") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const discipline = searchParams.get("discipline") || "";
    const status = searchParams.get("status") || "";
    const all = searchParams.get("all") === "true" || searchParams.get("all") === "1";

    const allClubs = await getClubs();

    const filtered = allClubs.filter((club) => {
      // If not admin request (all=true), strictly show only Approved & Active clubs
      if (!all) {
        const isApproved =
          club.status === "Affiliated" ||
          club.status === "Active" ||
          club.status === "Verified";
        if (!isApproved) return false;
      } else if (status && status !== "All") {
        if (club.status !== status) return false;
      }

      if (state && state !== "All") {
        if (club.state?.toLowerCase() !== state.toLowerCase()) return false;
      }

      if (district && district !== "All") {
        if (club.district?.toLowerCase() !== district.toLowerCase()) return false;
      }

      if (discipline && discipline !== "All") {
        const matchesPrimary = club.discipline?.toLowerCase() === discipline.toLowerCase();
        const matchesArray = club.disciplines?.some(
          (d) => d.toLowerCase() === discipline.toLowerCase()
        );
        if (!matchesPrimary && !matchesArray) return false;
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = club.name?.toLowerCase().includes(q);
        const matchId = club.id?.toLowerCase().includes(q);
        const matchCity = club.city?.toLowerCase().includes(q);
        const matchDistrict = club.district?.toLowerCase().includes(q);
        const matchState = club.state?.toLowerCase().includes(q);
        const matchCoach = club.headCoachName?.toLowerCase().includes(q);
        const matchPres = club.presidentName?.toLowerCase().includes(q);
        const matchDisc = club.disciplines?.some((d) => d.toLowerCase().includes(q));

        if (
          !matchName &&
          !matchId &&
          !matchCity &&
          !matchDistrict &&
          !matchState &&
          !matchCoach &&
          !matchPres &&
          !matchDisc
        ) {
          return false;
        }
      }

      return true;
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      clubs: filtered,
    });
  } catch (error) {
    console.error("GET /api/clubs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePlayerInput;

    const nameVal = validateFullName(body.name, {
      required: true,
      fieldName: "Club name",
      minLength: 3,
      isClub: true,
    });
    if (!nameVal.isValid) {
      return NextResponse.json(
        { success: false, error: nameVal.error || "Club name is required" },
        { status: 400 }
      );
    }
    body.name = nameVal.cleaned;

    if (body.username && typeof body.username === "string" && body.username.trim()) {
      const cleanUsername = body.username.trim().toLowerCase().replace(/\s+/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters long" },
          { status: 400 }
        );
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
        return NextResponse.json(
          { success: false, error: "Username can only contain letters, numbers, underscores, dots, or hyphens" },
          { status: 400 }
        );
      }
      const usernameCheck = await isUsernameAlreadyRegistered(cleanUsername);
      if (usernameCheck.isRegistered) {
        return NextResponse.json(
          {
            success: false,
            error: `This username is already taken by a registered ${usernameCheck.existingRecord?.memberType || "member"}. Please choose another username.`,
          },
          { status: 409 }
        );
      }
      body.username = cleanUsername;
    }

    if (body.email && body.email.trim()) {
      const emailVal = validateEmail(body.email, { required: true });
      if (!emailVal.isValid) {
        return NextResponse.json(
          { success: false, error: emailVal.error || "Invalid email format" },
          { status: 400 }
        );
      }
      body.email = emailVal.cleaned;

      const emailCheck = await isEmailAlreadyRegistered(body.email);
      if (emailCheck.isRegistered) {
        return NextResponse.json(
          {
            success: false,
            error: `This email address is already registered (${emailCheck.existingRecord?.memberType || "Member"}: ${emailCheck.existingRecord?.name}). Please sign in or use a different email address.`,
          },
          { status: 409 }
        );
      }
    }

    if (body.phone && body.phone.trim()) {
      const phoneVal = validatePhoneNumber(body.phone, {
        required: false,
        fieldName: "Phone number",
        allowLandline: true,
      });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid phone number format" },
          { status: 400 }
        );
      }
      body.phone = phoneVal.cleaned;
    }

    if (body.yearFounded && String(body.yearFounded).trim()) {
      const yearVal = validateYearFounded(body.yearFounded, { required: false });
      if (!yearVal.isValid) {
        return NextResponse.json(
          { success: false, error: yearVal.error || "Invalid year founded" },
          { status: 400 }
        );
      }
    }

    if (body.registeredAddress && body.registeredAddress.trim()) {
      const addrVal = validateAddress(body.registeredAddress, {
        required: false,
        minLength: 2,
      });
      if (!addrVal.isValid) {
        return NextResponse.json(
          { success: false, error: addrVal.error || "Invalid facility address" },
          { status: 400 }
        );
      }
    }

    const currentYear = new Date().getFullYear();
    const club = await createPlayer({
      ...body,
      memberType: "Club",
      club: body.club || body.name.trim(),
      affiliationCertificateId: body.affiliationCertificateId || undefined,
      validFrom: body.validFrom || `${currentYear}-01-01`,
      validUntil: body.validUntil || `${currentYear}-12-31`,
      status: body.status || "Pending",
      paymentStatus: body.paymentStatus || "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club affiliation registered successfully",
        club,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/clubs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create club affiliation",
      },
      { status: 500 }
    );
  }
}
