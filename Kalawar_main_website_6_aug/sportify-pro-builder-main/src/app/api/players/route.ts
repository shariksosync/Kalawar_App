import { NextResponse } from "next/server";
import { getPlayers, createPlayer, isEmailAlreadyRegistered, isUsernameAlreadyRegistered, type CreatePlayerInput } from "@/lib/players-store";
import { createReferee } from "@/lib/referees-store";
import { signMemberSession, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import {
  validatePhoneNumber,
  validateEmergencyContact,
  validateFullName,
  validateEmail,
  validateDateOfBirth,
  validatePassword,
  validateExperienceYears,
  validateMatchesOfficiated,
  validateYearFounded,
  validateMemberCount,
  validateAddress,
  validateNationalId,
} from "@/lib/validation";
import { verifyOTP } from "@/lib/otp-store";
import {
  sendRegistrationReceiptEmail,
  sendAcademicHistoryReminderEmail,
  sendRefereeRegistrationConfirmationEmail,
} from "@/lib/email-service";

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json({
      success: true,
      count: players.length,
      players,
    });
  } catch (error) {
    console.error("GET /api/players error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch players" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePlayerInput & {
      isRegistration?: boolean;
      tempToken?: string;
      otpCode?: string;
    };

    const memberType = String(body.memberType || "Player");
    const isClub = memberType.toLowerCase() === "club";

    // 1. Full Name / Club Name Validation
    const nameVal = validateFullName(body.name, {
      required: true,
      fieldName: isClub ? "Club / Academy name" : "Full name",
      minLength: isClub ? 3 : 2,
      isClub,
    });
    if (!nameVal.isValid) {
      return NextResponse.json(
        { success: false, error: nameVal.error || "Full name is required" },
        { status: 400 },
      );
    }
    body.name = nameVal.cleaned;

    // 2. Email Validation & Unique Guard
    if (body.email && body.email.trim()) {
      const emailVal = validateEmail(body.email, { required: true });
      if (!emailVal.isValid) {
        return NextResponse.json(
          { success: false, error: "Wrong email ID" },
          { status: 400 },
        );
      }
      body.email = emailVal.cleaned;

      // Duplicate email guard across all user roles
      const emailCheck = await isEmailAlreadyRegistered(body.email);
      if (emailCheck.isRegistered) {
        return NextResponse.json(
          {
            success: false,
            error: `This email address is already registered (${emailCheck.existingRecord?.memberType || "Member"}: ${emailCheck.existingRecord?.name}). Please sign in or use a different email address.`,
          },
          { status: 409 },
        );
      }
    } else if (body.isRegistration) {
      return NextResponse.json(
        { success: false, error: "Wrong email ID: Email address is required for registration" },
        { status: 400 },
      );
    }

    // 3. Phone Validation
    if (body.phone && body.phone.trim()) {
      const phoneVal = validatePhoneNumber(body.phone, {
        required: true,
        fieldName: "Phone number",
      });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid phone number format" },
          { status: 400 },
        );
      }
      body.phone = phoneVal.cleaned;
    } else if (body.isRegistration) {
      return NextResponse.json(
        { success: false, error: "Phone number is required for registration" },
        { status: 400 },
      );
    }

    // 4. Password validation on public registration
    if (body.isRegistration && body.password) {
      const passVal = validatePassword(body.password, undefined, { minLength: 6 });
      if (!passVal.isValid) {
        return NextResponse.json(
          { success: false, error: passVal.error || "Password must be at least 6 characters long" },
          { status: 400 },
        );
      }
    }

    // 5. Username Validation across ALL roles
    if (body.username && String(body.username).trim()) {
      const cleanUsername = String(body.username).trim().toLowerCase().replace(/\s+/g, "");
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
      const usernameCheck = await isUsernameAlreadyRegistered(cleanUsername);
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
    } else if (body.isRegistration && (memberType === "Player" || memberType === "Coach" || memberType === "Referee" || memberType === "StateAssociation" || memberType === "DistrictAssociation")) {
      return NextResponse.json(
        { success: false, error: `Username is required for ${memberType} registration` },
        { status: 400 },
      );
    }

    // 6. Role-Specific Validations
    if (memberType === "Player") {
      if (body.dob) {
        const dobVal = validateDateOfBirth(body.dob, { required: body.isRegistration, minAge: 4, maxAge: 100 });
        if (!dobVal.isValid) {
          return NextResponse.json(
            { success: false, error: dobVal.error || "Invalid date of birth" },
            { status: 400 },
          );
        }
      }
      if (body.emergencyContact && body.emergencyContact.trim()) {
        const emergencyVal = validateEmergencyContact(body.emergencyContact, { required: false });
        if (!emergencyVal.isValid) {
          return NextResponse.json(
            { success: false, error: emergencyVal.error || "Invalid emergency contact number" },
            { status: 400 },
          );
        }
      }
    } else if (memberType === "Coach") {
      if (body.isRegistration) {
        if (!body.registrationType || body.registrationType.trim() === "" || body.registrationType === "Choose Registration type") {
          return NextResponse.json(
            { success: false, error: "Choose Registration type it is mandatory" },
            { status: 400 },
          );
        }
      }
      if (body.experienceYears !== undefined && body.experienceYears !== null && String(body.experienceYears).trim()) {
        const expVal = validateExperienceYears(body.experienceYears, { required: true, min: 0, max: 60 });
        if (!expVal.isValid) {
          return NextResponse.json(
            { success: false, error: expVal.error || "Invalid coaching experience in years" },
            { status: 400 },
          );
        }
      }
    } else if (memberType === "Referee") {
      if (body.experienceYears !== undefined && body.experienceYears !== null && String(body.experienceYears).trim()) {
        const expVal = validateExperienceYears(body.experienceYears, { required: true, min: 0, max: 60 });
        if (!expVal.isValid) {
          return NextResponse.json(
            { success: false, error: expVal.error || "Invalid officiating experience in years" },
            { status: 400 },
          );
        }
      }
      if (body.matchesOfficiated !== undefined && body.matchesOfficiated !== null && String(body.matchesOfficiated).trim()) {
        const matchesVal = validateMatchesOfficiated(body.matchesOfficiated, { required: false, min: 0, max: 5000 });
        if (!matchesVal.isValid) {
          return NextResponse.json(
            { success: false, error: matchesVal.error || "Invalid matches count" },
            { status: 400 },
          );
        }
      }
    } else if (memberType === "Club") {
      if (body.yearFounded) {
        const yearVal = validateYearFounded(body.yearFounded, { required: true });
        if (!yearVal.isValid) {
          return NextResponse.json(
            { success: false, error: yearVal.error || "Invalid year founded" },
            { status: 400 },
          );
        }
      }
      if (body.registeredAddress && body.registeredAddress.trim()) {
        const addrVal = validateAddress(body.registeredAddress, { required: true, minLength: 8 });
        if (!addrVal.isValid) {
          return NextResponse.json(
            { success: false, error: addrVal.error || "Invalid facility address" },
            { status: 400 },
          );
        }
      }
    }

    if (body.idNumber && body.idNumber.trim()) {
      const idVal = validateNationalId(body.idNumber, { required: false });
      if (!idVal.isValid) {
        return NextResponse.json(
          { success: false, error: idVal.error || "Invalid ID format" },
          { status: 400 },
        );
      }
    }

    // 2FA Email Verification on Public Registration (bypassed for Player registration)
    if (memberType !== "Player" && body.isRegistration && body.tempToken) {
      if (!body.otpCode || body.otpCode.length < 6) {
        return NextResponse.json(
          { success: false, error: "Please enter the 6-digit email verification code" },
          { status: 400 },
        );
      }

      const tokenOrEmail = String(body.tempToken || body.email || "").trim();
      const otpResult = await verifyOTP(tokenOrEmail, body.otpCode, "register");
      if (!otpResult.isValid) {
        return NextResponse.json(
          { success: false, error: otpResult.error || "Invalid or expired verification code" },
          { status: 400 },
        );
      }
    }

    const player = await createPlayer(body);

    let refereeRecord: any = null;
    if (memberType === "Referee") {
      try {
        const refInput = {
          name: player.name,
          username: player.username || (body as any).username || "",
          password: (body as any).password || "",
          rawPassword: (body as any).password || "",
          dob: player.dob || (body as any).dob || "",
          gender: (player.gender as any) || (body as any).gender || "Male",
          email: player.email || body.email || "",
          phone: player.phone || body.phone || "",
          state: player.state || body.state || "",
          district: (body as any).district || (body as any).city || player.district || "",
          discipline: player.discipline || "Kalawar Martial Arts",
          academy: player.club || (body as any).academy || "Independent",
          kalawarId: player.id,
          currentRank: player.beltRank || (body as any).currentRank || "1st Dan Black Belt",
          martialArtsExperience: (body as any).martialArtsExperience || ((body as any).experienceYears ? `${(body as any).experienceYears} Years` : "3 Years"),
          level: (body as any).level || (body as any).officiatingGrade || "Level 1 – Junior Referee",
          status: "Application Submitted" as any,
          photo: (body as any).photo || player.image || "",
          certificationDocument: (body as any).certificationDocument || (body as any).affiliationDocument || "",
          certificationDocumentName: (body as any).certificationDocumentName || (body as any).affiliationDocumentName || "",
          certificationDocumentSize: (body as any).certificationDocumentSize || (body as any).affiliationDocumentSize || "",
          aadhaarDoc: (body as any).aadhaarDoc || "",
          aadhaarDocName: (body as any).aadhaarDocName || "",
          aadhaarDocSize: (body as any).aadhaarDocSize || "",
          documents: (body as any).aadhaarDoc ? [(body as any).aadhaarDoc] : [],
          bio: (body as any).bio || `Accredited Referee Candidate (${(body as any).level || "Level 1 – Junior Referee"})`,
        };
        refereeRecord = await createReferee(refInput);
        if (player.email) {
          sendRefereeRegistrationConfirmationEmail({
            to: player.email,
            applicantName: player.name,
            refereeId: refereeRecord.id || player.id,
            password: body.password || undefined,
            appliedLevel: refereeRecord.level,
            currentRank: refereeRecord.currentRank,
            state: refereeRecord.state,
            district: refereeRecord.district,
            academy: refereeRecord.academy,
            kalawarId: player.id,
          }).catch((err) => console.warn("[Players Route] Referee confirmation email error:", err));
        }
      } catch (refErr) {
        console.warn("[Players Route] Error creating referee application record:", refErr);
      }
    }

    // Send Official Registration Receipt & Credentials Email (for non-referees, since referees get their dedicated confirmation email)
    if (player.email && memberType !== "Referee") {
      try {
        await sendRegistrationReceiptEmail({
          email: player.email,
          name: player.name,
          memberId: player.id,
          password: body.password || undefined,
          memberType: player.memberType || "Player",
          discipline: player.discipline,
          state: player.state,
          club: player.club,
          phone: player.phone,
          registeredOn: player.registeredOn,
          ageGroup: player.ageGroup,
          weightCategory: player.weightCategory,
          status: player.status || "Pending",
        });
        if (player.status === "Incomplete") {
          await sendAcademicHistoryReminderEmail(player.email, player.name, player.id);
        }
      } catch (emailErr) {
        console.warn("Registration receipt email delivery note:", emailErr);
      }
    }

    let authUser: AuthUser | undefined = undefined;
    let token: string | undefined = undefined;

    // If registered via public portal or created, prepare member auth session
    if (body.isRegistration || body.status === "Pending" || !body.status) {
      authUser = {
        id: player.id,
        name: player.name,
        email: player.email,
        phone: player.phone,
        dob: player.dob,
        gender: player.gender as any,
        beltRank: player.beltRank,
        club: player.club,
        state: player.state,
        role: "member",
        memberType: (player.memberType as any) || (player.id.startsWith("KSM-CL") || player.id.startsWith("WSF-CL") ? "Club" : "Player"),
        discipline: player.discipline,
        avatar: player.image,
      };
      token = await signMemberSession(authUser);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Player registered successfully",
        player,
        user: authUser,
        token,
      },
      { status: 201 },
    );

    if (token) {
      response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));
    }

    return response;
  } catch (error) {
    console.error("POST /api/players error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create player",
      },
      { status: 500 },
    );
  }
}
