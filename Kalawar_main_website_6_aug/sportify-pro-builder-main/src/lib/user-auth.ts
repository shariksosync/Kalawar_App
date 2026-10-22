import { getPlayers } from "./players-store";
import { ADMIN_EMAIL } from "./admin-auth";

function getSecretKeys(): string[] {
  const keys: string[] = [];
  if (process.env.ADMIN_SESSION_SECRET) keys.push(process.env.ADMIN_SESSION_SECRET);
  keys.push("kalawar_gold_admin_secure_secret_token_2026");
  keys.push("default_kalawar_admin_secret_key_2026");
  return Array.from(new Set(keys));
}

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | string;
  beltRank?: string;
  club?: string;
  state?: string;
  district?: string;
  city?: string;
  role: "member" | "admin";
  memberType?: "Player" | "Coach" | "Referee" | "Club" | "StateAssociation" | "DistrictAssociation" | string;
  status?: string;
  discipline?: string;
  avatar?: string;
  kalawarId?: string;
};

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_wsf_secure_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, storedPasswordHash?: string): Promise<boolean> {
  if (!storedPasswordHash) return true; // Graceful fallback if athlete has no password yet
  const calculated = await hashPassword(password);
  return calculated === storedPasswordHash || password === storedPasswordHash;
}

export async function signMemberSession(user: AuthUser): Promise<string> {
  // Never put large Base64 data URLs in JWT token payload to prevent HTTP 16KB header overflow
  const safeUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    dob: user.dob,
    gender: user.gender,
    beltRank: user.beltRank,
    club: user.club,
    state: user.state,
    district: user.district,
    role: user.role,
    memberType: user.memberType,
    status: user.status,
    discipline: user.discipline,
    avatar: user.avatar && !user.avatar.startsWith("data:") ? user.avatar : undefined,
  };
  const payload = JSON.stringify({ ...safeUser, timestamp: Date.now() });
  const encoder = new TextEncoder();
  const secret = getSecretKeys()[0];
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const b64Data = Buffer.from(payload).toString("base64url");
  return `${b64Data}.${sigHex}`;
}

export async function verifyMemberSession(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const [b64Data, sigHex] = token.split(".");
    if (!b64Data || !sigHex) return null;
    const payload = Buffer.from(b64Data, "base64url").toString("utf-8");
    const encoder = new TextEncoder();

    const match = sigHex.match(/.{1,2}/g);
    if (!match) return null;
    const sigBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));

    const secretKeys = getSecretKeys();
    let isValid = false;

    for (const secret of secretKeys) {
      try {
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"],
        );
        isValid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
        if (isValid) break;
      } catch {}
    }

    if (!isValid) return null;

    const parsed = JSON.parse(payload) as AuthUser & { timestamp?: number };
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      dob: parsed.dob,
      gender: parsed.gender,
      beltRank: parsed.beltRank,
      club: parsed.club,
      state: parsed.state,
      district: parsed.district,
      role: parsed.role,
      memberType: parsed.memberType,
      status: parsed.status,
      discipline: parsed.discipline,
      avatar: parsed.avatar,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(req?: Request | any, maxAgeSeconds: number = 60 * 60 * 24 * 30) {
  let isHttps = false;
  if (req) {
    try {
      const proto = typeof req.headers?.get === "function" ? req.headers.get("x-forwarded-proto") : undefined;
      const url = req.url || "";
      isHttps = proto === "https" || url.startsWith("https://");
    } catch {}
  } else if (typeof window !== "undefined") {
    isHttps = window.location.protocol === "https:";
  } else {
    isHttps = !!process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");
  }

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function parseCookieValue(cookieHeader: string | null | undefined, cookieName: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function getAuthUserFromToken(token?: string): Promise<AuthUser | null> {
  if (!token || typeof token !== "string") return null;
  return verifyMemberSession(token.trim());
}

export async function getAuthUserFromRequest(request: any, fallbackToken?: string): Promise<AuthUser | null> {
  try {
    const authHeader = typeof request?.headers?.get === "function" ? request.headers.get("authorization") : undefined;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;
    const customHeaderToken = typeof request?.headers?.get === "function" ? request.headers.get("x-member-token") : undefined;

    // Cookie extraction from multiple sources
    let cookieMemberToken: string | undefined = undefined;
    let cookieAdminToken: string | undefined = undefined;

    // 1. NextRequest style .cookies.get()
    if (typeof request?.cookies?.get === "function") {
      cookieMemberToken = request.cookies.get("member_session")?.value;
      cookieAdminToken = request.cookies.get("admin_session")?.value;
    }

    // 2. Raw request headers 'cookie'
    if (!cookieMemberToken && typeof request?.headers?.get === "function") {
      const rawCookie = request.headers.get("cookie");
      if (rawCookie) {
        cookieMemberToken = parseCookieValue(rawCookie, "member_session");
        cookieAdminToken = cookieAdminToken || parseCookieValue(rawCookie, "admin_session");
      }
    }

    // 3. Next.js server cookie store (next/headers)
    if (!cookieMemberToken) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieMemberToken = cookieStore.get("member_session")?.value;
        cookieAdminToken = cookieAdminToken || cookieStore.get("admin_session")?.value;
      } catch {}
    }

    const memberToken = bearerToken || customHeaderToken || fallbackToken || cookieMemberToken;
    if (memberToken) {
      const user = await verifyMemberSession(memberToken);
      if (user) return user;
    }

    const adminToken = cookieAdminToken;
    if (adminToken) {
      const isAdminValid = await import("./admin-auth").then((m) => m.verifySession(adminToken));
      if (isAdminValid) {
        return {
          id: "KSM-ADMIN-01",
          name: "Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

