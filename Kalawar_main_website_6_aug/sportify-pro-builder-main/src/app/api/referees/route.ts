import { NextResponse } from "next/server";
import {
  getReferees,
  createReferee,
  type CreateRefereeInput,
} from "@/lib/referees-store";
import { getPlayers, createPlayer } from "@/lib/players-store";
import {
  signMemberSession,
  getSessionCookieOptions,
  type AuthUser,
} from "@/lib/user-auth";
import { verifyOTP } from "@/lib/otp-store";
import { sendRefereeRegistrationConfirmationEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || undefined;
    const status = searchParams.get("status") || undefined;
    const state = searchParams.get("state") || undefined;
    const q = searchParams.get("q") || undefined;
    const activeLicenseOnly = searchParams.get("activeLicenseOnly") === "true";

    const referees = await getReferees({
      level,
      status,
      state,
      q,
      activeLicenseOnly,
    });

    return NextResponse.json({
      success: true,
      count: referees.length,
      referees,
    });
  } catch (error: any) {
    console.error("GET /api/referees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch referees." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = (body.name || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const state = (body.state || "Maharashtra").trim();
    const district = (body.district || "").trim();
    const currentRank = (body.currentRank || "1st Dan Black Belt").trim();
    const martialArtsExperience = (body.martialArtsExperience || "3 Years").trim();
    const level = body.level || "Level 1 – Junior Referee";
    const academy = (body.academy || "").trim();
    const kalawarId = (body.kalawarId || "").trim().toUpperCase();
    const dob = (body.dob || "").trim();
    const gender = body.gender || "Male";
    const photo = body.photo || "";
    const certificationDocument = body.certificationDocument || body.danCertificateDoc || "";
    const certificationDocumentName = body.certificationDocumentName || body.danCertificateDocName || "";
    const certificationDocumentSize = body.certificationDocumentSize || body.danCertificateDocSize || "";
    const aadhaarDoc = body.aadhaarDoc || body.idProofDoc || "";
    const aadhaarDocName = body.aadhaarDocName || body.idProofDocName || "";
    const aadhaarDocSize = body.aadhaarDocSize || body.idProofDocSize || "";
    const password = body.password || "";
    const confirmPassword = body.confirmPassword || "";
    const otpCode = (body.otpCode || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Full Legal Name is required." },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }
    if (!state) {
      return NextResponse.json(
        { success: false, error: "State / UT is required." },
        { status: 400 }
      );
    }

    // 1. DUPLICATE EMAIL GUARD: Only fresh accounts can register as Referee
    const allPlayers = await getPlayers();
    const existingPlayer = allPlayers.find(
      (p) => p.email && p.email.toLowerCase() === email
    );
    const allReferees = await getReferees();
    const existingReferee = allReferees.find(
      (r) => r.email && r.email.toLowerCase() === email
    );

    if (existingPlayer || existingReferee) {
      return NextResponse.json(
        {
          success: false,
          error: "This email ID is already registered, use a different ID.",
          existingAccount: true,
        },
        { status: 409 }
      );
    }

    // 2. PASSWORD VALIDATION
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    // 3. OTP VERIFICATION
    if (!otpCode || otpCode.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please enter the 6-digit Email Verification Code (OTP)." },
        { status: 400 }
      );
    }

    const otpValid = verifyOTP(email, otpCode);
    if (!otpValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired Email Verification Code (OTP). Please request a new code." },
        { status: 400 }
      );
    }

    // 4. CREATE REFEREE OFFICIAL ACCREDITATION RECORD FIRST (Generates KAC-REF-2026-XXX)
    const refereeInput: CreateRefereeInput = {
      name,
      username,
      password,
      rawPassword: password,
      dob,
      gender,
      email,
      phone,
      state,
      district,
      discipline: "Kalawar Martial Arts",
      academy: academy || "Independent Official",
      kalawarId: kalawarId || "",
      currentRank,
      martialArtsExperience,
      level,
      status: "Application Submitted",
      photo,
      certificationDocument,
      certificationDocumentName,
      certificationDocumentSize,
      aadhaarDoc,
      aadhaarDocName,
      aadhaarDocSize,
      documents: aadhaarDoc ? [aadhaarDoc] : [],
      bio: body.bio?.trim() || `Accredited Referee Candidate (${level})`,
    };

    const referee = await createReferee(refereeInput);

    // 5. CREATE FRESH USER WITH DEDICATED REFEREE ROLE
    const newPlayer = await createPlayer({
      name,
      username,
      rawPassword: password,
      email,
      phone,
      dob,
      gender,
      state,
      district,
      city: district,
      club: academy || "Independent Official",
      beltRank: currentRank,
      memberType: "Referee", // Dedicated Referee role
      officiatingGrade: level,
      experienceYears: martialArtsExperience,
      discipline: "Kalawar Martial Arts",
      image: photo,
      password: password,
      affiliationDocument: certificationDocument,
      affiliationDocumentName: certificationDocumentName,
      affiliationDocumentSize: certificationDocumentSize,
      idNumber: referee.id,
      aadhaarDoc,
      aadhaarDocName,
      aadhaarDocSize,
    } as any);

    if (!referee.kalawarId) {
      referee.kalawarId = newPlayer.id;
    }

    // 6. DISPATCH CONFIRMATION & CREDENTIALS EMAIL (Contains ID & Password)
    sendRefereeRegistrationConfirmationEmail({
      to: email,
      applicantName: name,
      refereeId: referee.id,
      password: password,
      appliedLevel: level,
      currentRank,
      state,
      district,
      academy,
      kalawarId: referee.kalawarId || newPlayer.id,
    }).catch((err) => console.warn("[Referee Registration] Confirmation email error:", err));

    // 7. DOUBLE LAYER AUTO-LOGIN: Layer 1 (Server Session Token & HttpOnly Cookie)
    const authUser: AuthUser = {
      id: newPlayer.id,
      name: newPlayer.name,
      email: newPlayer.email,
      phone: newPlayer.phone,
      dob: newPlayer.dob,
      gender: newPlayer.gender as any,
      beltRank: newPlayer.beltRank,
      club: newPlayer.club,
      state: newPlayer.state,
      role: "member",
      memberType: "Referee", // Dedicated Referee Role
      discipline: newPlayer.discipline,
      avatar: newPlayer.image,
    };

    const token = await signMemberSession(authUser);

    const response = NextResponse.json(
      {
        success: true,
        message: "Referee registration application submitted successfully.",
        referee,
        user: authUser,
        token,
      },
      { status: 201 }
    );

    // Set HttpOnly 30-day session cookie for both localhost and production
    response.cookies.set(
      "member_session",
      token,
      getSessionCookieOptions(request, 60 * 60 * 24 * 30)
    );

    return response;
  } catch (error: any) {
    console.error("POST /api/referees error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to register referee application",
      },
      { status: 500 }
    );
  }
}

