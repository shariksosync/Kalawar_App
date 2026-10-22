import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ChampionshipApplicationModel } from "@/models/ChampionshipApplication";
import type { ChampionshipApplication } from "@/types/championship";
import { getPlayers, createPlayer, updatePlayer } from "@/lib/players-store";
import { signMemberSession, getAuthUserFromRequest, getSessionCookieOptions, type AuthUser } from "@/lib/user-auth";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { sendChampionshipRegistrationConfirmationEmail } from "@/lib/email-service";
import { verifyOTP } from "@/lib/otp-store";
import fs from "fs/promises";
import path from "path";

const STORAGE_FILE_PATH = path.join(process.cwd(), "src", "data", "storage", "championship-applications.json");
let cachedApps: ChampionshipApplication[] = [];

async function ensureFileStorage(): Promise<string> {
  try {
    await fs.mkdir(path.dirname(STORAGE_FILE_PATH), { recursive: true });
    try {
      await fs.access(STORAGE_FILE_PATH);
    } catch {
      await fs.writeFile(STORAGE_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    }
    return STORAGE_FILE_PATH;
  } catch {
    return STORAGE_FILE_PATH;
  }
}

async function getFileApplications(): Promise<ChampionshipApplication[]> {
  try {
    const file = await ensureFileStorage();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    cachedApps = parsed;
    return parsed;
  } catch {
    return cachedApps;
  }
}

async function saveFileApplication(app: ChampionshipApplication): Promise<void> {
  try {
    const file = await ensureFileStorage();
    const list = await getFileApplications();
    const idx = list.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      list[idx] = app;
    } else {
      list.unshift(app);
    }
    cachedApps = list;
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save to championship-applications.json:", err);
  }
}

async function normalizeAndSaveChampionshipDoc(
  dataUrlOrPath: string | undefined,
  prefix: string,
  originalName?: string
): Promise<string | undefined> {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== "string") return dataUrlOrPath;
  if (!dataUrlOrPath.startsWith("data:")) return dataUrlOrPath;

  try {
    const matches = dataUrlOrPath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrlOrPath;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    let ext = "jpg";
    if (mimeType.includes("png")) ext = "png";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("pdf")) ext = "pdf";
    else if (originalName && originalName.includes(".")) {
      ext = originalName.split(".").pop() || "jpg";
    }

    const cleanBase = originalName
      ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
      : "doc";
    const fileName = `${prefix}_${Date.now()}_${cleanBase}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "championship-docs");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    return `/uploads/championship-docs/${fileName}`;
  } catch (err) {
    console.error(`Championship: Failed to normalize base64 doc for ${prefix}:`, err);
    return dataUrlOrPath;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const eventId = searchParams.get("eventId");
    const query = searchParams.get("q") || searchParams.get("search");

    let applications: ChampionshipApplication[] = [];

    try {
      await connectToDatabase();
      const filter: any = {};
      if (status && status !== "All") filter.status = status;
      if (eventId && eventId !== "All") filter.eventId = eventId;

      if (query && query.trim()) {
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        filter.$or = [
          { id: { $regex: regex } },
          { applicantName: { $regex: regex } },
          { email: { $regex: regex } },
          { phone: { $regex: regex } },
          { athleteId: { $regex: regex } },
          { clubName: { $regex: regex } },
          { bibNumber: { $regex: regex } },
          { eventTitle: { $regex: regex } },
          { discipline: { $regex: regex } },
        ];
      }

      const docs = await ChampionshipApplicationModel.find(filter).sort({ createdAt: -1 }).lean();
      if (Array.isArray(docs)) {
        applications = docs as any;
        return NextResponse.json({
          success: true,
          count: applications.length,
          applications,
        });
      }
    } catch (dbErr) {
      console.warn("Championship GET DB lookup fallback to file storage:", dbErr);
    }

    const fileApps = await getFileApplications();
    applications = fileApps.filter((a) => {
      if (status && status !== "All" && a.status !== status) return false;
      if (eventId && eventId !== "All" && a.eventId !== eventId) return false;
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          a.id?.toLowerCase().includes(q) ||
          a.applicantName?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q) ||
          a.athleteId?.toLowerCase().includes(q) ||
          a.clubName?.toLowerCase().includes(q) ||
          a.bibNumber?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error("GET /api/championships/applications error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fallbackToken = typeof body.memberToken === "string" ? body.memberToken.trim() : undefined;
    const sessionUser = await getAuthUserFromRequest(request, fallbackToken);
    const players = await getPlayers();

    const {
      eventId = "CHAMP-NAT-2026",
      eventTitle = "Official KALAWAR National Championship",
      applicantName: rawApplicantName,
      athleteName,
      email: rawEmail,
      phone: rawPhone,
      city: rawCity,
      eventCity,
      beltRank: rawBeltRank,
      photo: rawPhoto,
      athletePhoto,
      idProofDoc: rawIdProofDoc,
      idProofDocument,
      discipline = "Kalawar Kaya Yuddha",
      password,
      confirmPassword,
    } = body;

    const applicantName = (rawApplicantName || athleteName || sessionUser?.name || "").trim();
    const email = (rawEmail || sessionUser?.email || "").trim().toLowerCase();
    const phone = (rawPhone || sessionUser?.phone || "").trim();
    const city = (rawCity || eventCity || sessionUser?.state || "Pune").trim();
    const beltRank = (rawBeltRank || sessionUser?.beltRank || "Senior Division").trim();
    const photo = rawPhoto || athletePhoto || sessionUser?.avatar || "/images/placeholder-avatar.jpg";
    const idProofDoc = rawIdProofDoc || idProofDocument || "/uploads/default-id-proof.pdf";

    if (!eventId || !eventTitle) {
      return NextResponse.json(
        { success: false, error: "Event details (ID and Title) are required." },
        { status: 400 }
      );
    }

    if (!applicantName) {
      return NextResponse.json(
        { success: false, error: "Applicant / Competitor Name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email Address is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Contact Phone number is required." },
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanAthleteId = (body.athleteId || "").trim();

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

    if (!activePlayer && !sessionUser) {
      activePlayer = await createPlayer({
        name: applicantName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password: password || undefined,
        dob: body.dob || undefined,
        gender: body.gender || "Male",
        beltRank: beltRank,
        club: (body.clubName || body.club || "Independent").trim(),
        state: (body.state || "Maharashtra").trim(),
        discipline: discipline as any,
        memberType: "Player",
        status: "Pending",
        image: photo,
      });
    }

    // Safely normalize Base64 documents to static file URLs to avoid MongoDB 16MB BSON limit and network payload bloat
    const [savedPhotoUrl, savedIdProofUrl] = await Promise.all([
      normalizeAndSaveChampionshipDoc(photo, "champ_photo", body.athletePhotoName || "passport_photo.jpg"),
      normalizeAndSaveChampionshipDoc(idProofDoc, "champ_id_proof", body.idProofDocName || "id_proof.pdf"),
    ]);

    const finalPhoto = savedPhotoUrl || photo;
    const finalIdProof = savedIdProofUrl || idProofDoc;

    const currentYear = new Date().getFullYear();

    // Collision-proof ID generator
    async function generateNextChampionshipAppId(year: number): Promise<string> {
      const regex = new RegExp(`^CHAMP-${year}-(\\d+)$`, "i");
      let highestNum = 0;

      try {
        await connectToDatabase();
        const docs = await ChampionshipApplicationModel.find(
          { id: { $regex: new RegExp(`^CHAMP-${year}-\\d+$`, "i") } },
          "id"
        ).lean();

        for (const doc of docs) {
          if (doc && doc.id) {
            const match = doc.id.match(regex);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > highestNum) highestNum = num;
            }
          }
        }
      } catch (err) {
        console.warn("Could not query highest championship app id from mongo:", err);
      }

      // Check file storage too
      const fileApps = await getFileApplications();
      for (const app of fileApps) {
        if (app && app.id) {
          const match = app.id.match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > highestNum) highestNum = num;
          }
        }
      }

      const nextNum = highestNum + 1;
      return `CHAMP-${year}-${String(nextNum).padStart(4, "0")}`;
    }

    let assignedId = body.id?.trim();
    if (!assignedId) {
      assignedId = await generateNextChampionshipAppId(currentYear);
    }

    const appData: ChampionshipApplication = {
      id: assignedId,
      eventId,
      eventTitle,
      eventDate: body.eventDate || "",
      eventVenue: body.eventVenue || body.eventLocation || "",
      eventCity: city || body.eventCity || "",
      applicantName,
      athleteName: applicantName,
      dob: body.dob || "",
      gender: body.gender || "Male",
      email,
      phone,
      whatsapp: body.whatsapp || phone,
      emergencyContact: body.emergencyContact || {
        name: body.emergencyContactName || "",
        phone: body.emergencyContactPhone || "",
        relation: body.emergencyContactRelation || "",
      },
      athleteId: (activePlayer?.id || sessionUser?.id || body.athleteId || "").trim(),
      clubName: (body.clubName || body.club || "Independent / Direct Entry").trim(),
      coachName: (body.coachName || "").trim(),
      state: (body.state || "Maharashtra").trim(),
      discipline: discipline as any,
      ageDivision: (body.ageDivision || "Senior Adult (18-29)").trim(),
      weightCategory: (body.weightCategory || "Open Weight").trim(),
      beltRank,
      openClass: Boolean(body.openClass),
      photo: finalPhoto,
      athletePhoto: finalPhoto,
      idProofDoc: finalIdProof,
      idProofDocument: finalIdProof,
      entryFee: body.entryFee || "Free Entry",
      paymentStatus: (body.paymentStatus as any) || "Exempt",
      paymentReference: body.paymentReference?.trim() || "",
      paymentMode: body.paymentMode || "Direct",
      status: "Pending",
      bibNumber: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let newApp: any = null;
    try {
      await connectToDatabase();
      newApp = await ChampionshipApplicationModel.create(appData);
    } catch (dbErr) {
      console.warn("Championship DB create fallback to file storage:", dbErr);
    }
    await saveFileApplication(appData);

    if (!newApp) {
      newApp = appData;
    }

    // Dispatch Confirmation & Credentials Email
    if (newApp.email) {
      sendChampionshipRegistrationConfirmationEmail({
        email: newApp.email || email,
        applicantName: newApp.applicantName || applicantName,
        athleteId: (newApp.athleteId || activePlayer?.id || sessionUser?.id || "").trim(),
        trackingId: newApp.id,
        eventTitle: newApp.eventTitle || eventTitle,
        eventDate: newApp.eventDate,
        eventVenue: newApp.eventVenue,
        eventCity: newApp.eventCity,
        discipline: newApp.discipline,
        ageDivision: newApp.ageDivision,
        weightCategory: newApp.weightCategory,
        beltRank: newApp.beltRank,
        clubName: newApp.clubName,
        password: password || undefined,
        isNewAccount: !sessionUser,
      }).catch((err) => console.warn("[Championship] Registration email failed:", err));
    }

    // Create session for auto-login if new player registration
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
        message: "Championship registration submitted successfully!",
        application: newApp,
        trackingId: newApp.id,
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
    console.error("POST /api/championships/applications error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create application" },
      { status: 500 }
    );
  }
}
