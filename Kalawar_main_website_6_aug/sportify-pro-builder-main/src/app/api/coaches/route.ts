import { NextResponse } from "next/server";
import { getCoaches, createPlayer, isEmailAlreadyRegistered, type CreatePlayerInput } from "@/lib/players-store";
import {
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validateExperienceYears,
} from "@/lib/validation";

export async function GET() {
  try {
    const coaches = await getCoaches();
    return NextResponse.json({
      success: true,
      count: coaches.length,
      coaches,
    });
  } catch (error) {
    console.error("GET /api/coaches error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coaches" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePlayerInput;

    const nameVal = validateFullName(body.name, { required: true, fieldName: "Coach name", minLength: 2 });
    if (!nameVal.isValid) {
      return NextResponse.json(
        { success: false, error: nameVal.error || "Coach name is required" },
        { status: 400 },
      );
    }
    body.name = nameVal.cleaned;

    if (body.email && body.email.trim()) {
      const emailVal = validateEmail(body.email, { required: true });
      if (!emailVal.isValid) {
        return NextResponse.json(
          { success: false, error: emailVal.error || "Invalid email format" },
          { status: 400 },
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
          { status: 409 },
        );
      }
    }

    if (body.phone && body.phone.trim()) {
      const phoneVal = validatePhoneNumber(body.phone, { required: true, fieldName: "Phone number" });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid phone number format" },
          { status: 400 },
        );
      }
      body.phone = phoneVal.cleaned;
    }

    if (body.experienceYears !== undefined && body.experienceYears !== null && String(body.experienceYears).trim()) {
      const expVal = validateExperienceYears(body.experienceYears, { required: false, min: 0, max: 60 });
      if (!expVal.isValid) {
        return NextResponse.json(
          { success: false, error: expVal.error || "Invalid coaching experience in years" },
          { status: 400 },
        );
      }
    }

    const coach = await createPlayer({
      ...body,
      memberType: "Coach",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Coach registered successfully",
        coach,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/coaches error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create coach",
      },
      { status: 500 },
    );
  }
}
