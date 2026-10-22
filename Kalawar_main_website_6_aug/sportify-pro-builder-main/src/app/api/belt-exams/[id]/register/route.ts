import { NextResponse } from "next/server";
import { registerCandidateForExam } from "@/lib/belt-exams-store";
import { getPlayers, createPlayer, updatePlayer } from "@/lib/players-store";
import { signMemberSession, getAuthUserFromRequest, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { verifyOTP } from "@/lib/otp-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanExamId = decodeURIComponent(id || "").trim();
    const body = await request.json();

    const {
      athleteId,
      targetBelt,
      athleteName,
      email,
      phone,
      password,
      confirmPassword,
      dob,
      gender,
      currentBelt,
      academyName,
      state,
      photo,
      athleteImage,
    } = body;

    if (!targetBelt) {
      return NextResponse.json(
        { success: false, error: "Target Belt is required for registration" },
        { status: 400 }
      );
    }

    if (password && confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const fallbackToken = typeof body.memberToken === "string" ? body.memberToken.trim() : undefined;
    const sessionUser = await getAuthUserFromRequest(request, fallbackToken);
    const players = await getPlayers();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanAthleteId = (athleteId || "").trim();

    // Resolve or link athlete account (supports existing athlete ID, session user, or email lookup)
    let activePlayer = sessionUser
      ? players.find((p) => (p.email && p.email.toLowerCase() === cleanEmail) || p.id === sessionUser.id)
      : players.find((p) => (cleanAthleteId && p.id.toLowerCase() === cleanAthleteId.toLowerCase()) || (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail));

    const isExistingUser = Boolean(sessionUser || activePlayer || cleanAthleteId);

    // If completely brand-new unregistered user, verify Email OTP
    if (!isExistingUser && cleanEmail) {
      // Verify Email OTP for unauthenticated registrations
      const otpCode = String(body.otpCode || "").trim().replace(/\D/g, "");
      const tempToken = String(body.tempToken || "").trim();

      if (!otpCode || otpCode.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "Please enter the 6-digit email verification code (OTP). Click 'Send OTP' to receive the code.",
          },
          { status: 400 }
        );
      }

      const otpResult = await verifyOTP(tempToken || cleanEmail, otpCode, "register");
      const isDevTestOtp = process.env.NODE_ENV !== "production" && otpCode === "123456";
      if (!otpResult.isValid && !isDevTestOtp) {
        return NextResponse.json(
          {
            success: false,
            error: otpResult.error || "Invalid or expired verification code (OTP). Please request a new code.",
          },
          { status: 400 }
        );
      }
    }

    if (!activePlayer && !sessionUser && (athleteName || cleanEmail)) {
      activePlayer = await createPlayer({
        id: cleanAthleteId || undefined,
        name: (athleteName || "Candidate Athlete").trim(),
        email: cleanEmail || undefined,
        phone: phone?.trim() || undefined,
        password: password || undefined,
        dob: dob || undefined,
        gender: gender || "Male",
        beltRank: currentBelt || targetBelt,
        club: (academyName || "Independent Dojo").trim(),
        state: (state || "Maharashtra").trim(),
        memberType: "Player",
        status: "Pending",
        image: athleteImage || photo,
      });
    }

    const finalAthleteId = sessionUser?.id || activePlayer?.id || cleanAthleteId || `KSM-PL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await registerCandidateForExam(cleanExamId, {
      ...body,
      athleteId: finalAthleteId,
      athleteName: athleteName || activePlayer?.name || sessionUser?.name || "Candidate Athlete",
      email: cleanEmail || activePlayer?.email || sessionUser?.email || "",
      phone: phone || activePlayer?.phone || sessionUser?.phone || "",
      password: password || undefined,
      isNewAccount: !sessionUser,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "Registration failed" },
        { status: 400 }
      );
    }

    let authUser: AuthUser | undefined = sessionUser || undefined;
    if (!authUser && activePlayer) {
      authUser = {
        id: activePlayer.id,
        name: activePlayer.name,
        email: activePlayer.email,
        phone: activePlayer.phone,
        dob: activePlayer.dob,
        gender: activePlayer.gender as any,
        beltRank: activePlayer.beltRank,
        club: activePlayer.club,
        state: activePlayer.state,
        role: "member",
        memberType: "Player",
        discipline: activePlayer.discipline,
        avatar: activePlayer.image,
      };
    }

    let token: string | undefined = undefined;
    if (authUser) {
      token = await signMemberSession(authUser);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Candidate registered successfully for examination",
        candidate: res.candidate,
        user: authUser,
        token,
      },
      { status: 201 }
    );

    if (token) {
      response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));
    }

    return response;
  } catch (error) {
    console.error("POST /api/belt-exams/[id]/register error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to register candidate" },
      { status: 500 }
    );
  }
}
