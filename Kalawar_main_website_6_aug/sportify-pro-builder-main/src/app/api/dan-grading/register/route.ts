import { NextRequest, NextResponse } from "next/server";
import { createDanApplication } from "@/lib/dan-grading-store";
import { sendDanRegistrationConfirmationSlipEmail } from "@/lib/email-service";
import { getPlayers, createPlayer, updatePlayer } from "@/lib/players-store";
import { signMemberSession, getAuthUserFromRequest, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { verifyOTP } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fullName,
      athleteId,
      appliedDanGrade,
      phone,
      state,
      email,
      password,
      confirmPassword,
      dob,
      gender,
      currentBeltTitle,
      academyName,
      passportPhotoUrl,
      photoUrl,
    } = body;

    if (!fullName || !appliedDanGrade || !phone || !state) {
      return NextResponse.json(
        {
          success: false,
          error: "Full Name, Applied Dan Grade, Phone, and State are mandatory.",
        },
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

    if (!activePlayer && !sessionUser && (fullName || cleanEmail)) {
      activePlayer = await createPlayer({
        id: cleanAthleteId || undefined,
        name: fullName.trim(),
        email: cleanEmail || undefined,
        phone: phone?.trim() || undefined,
        password: password || undefined,
        dob: dob || undefined,
        gender: gender || "Male",
        beltRank: currentBeltTitle || "Black Belt Candidate",
        club: (academyName || "Independent Dojang").trim(),
        state: (state || "Maharashtra").trim(),
        memberType: "Player",
        status: "Pending",
        image: passportPhotoUrl || photoUrl,
      });
    }

    const finalAthleteId = sessionUser?.id || activePlayer?.id || cleanAthleteId || `KSM-PL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const application = await createDanApplication({
      ...body,
      athleteId: finalAthleteId,
      fullName: fullName || activePlayer?.name || sessionUser?.name || "Candidate Athlete",
      email: cleanEmail || activePlayer?.email || sessionUser?.email || "",
      phone: phone || activePlayer?.phone || sessionUser?.phone || "",
    });

    if (application.email) {
      try {
        await sendDanRegistrationConfirmationSlipEmail({
          email: application.email,
          candidateName: application.fullName,
          athleteId: application.athleteId,
          trackingId: application.id,
          appliedDanTitle: application.appliedDanTitle,
          amount: application.paymentAmount || 0,
          paymentMethod: application.paymentMethod || "Online Registration",
          paymentStatus: "Confirmed",
          currentBeltTitle: application.currentBeltTitle,
          academyName: application.academyName,
          state: application.state,
          instructorName: application.instructorName,
          date: application.appliedDate || new Date().toISOString().split("T")[0],
          password: password || undefined,
          isNewAccount: !sessionUser,
        });
        console.log(`[Dan Grading] Dispatched Registration Confirmation Slip email to ${application.email} for Tracking ID ${application.id}`);
      } catch (emailErr) {
        console.error("[Dan Grading] Failed to send registration confirmation email:", emailErr);
      }
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
        message: "Dan Examination Application registered successfully!",
        application,
        user: authUser,
        token,
      },
      { status: 201 }
    );

    if (token) {
      response.cookies.set("member_session", token, getSessionCookieOptions(request, 60 * 60 * 24 * 30));
    }

    return response;
  } catch (error: any) {
    console.error("API /api/dan-grading/register Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register Dan application" },
      { status: 500 }
    );
  }
}