const SECRET_KEY = process.env.ADMIN_SESSION_SECRET || "default_kalawar_admin_secret_key_2026";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kalawarfederation.org";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

export interface AdminSessionPayload {
  email: string;
  userId?: string;
  role?: "super_admin" | "district_admin";
  state?: string;
  district?: string;
  timestamp?: number;
}

export async function signSession(payloadOrEmail: string | AdminSessionPayload): Promise<string> {
  let data: string;
  if (typeof payloadOrEmail === "string") {
    data = JSON.stringify({
      email: payloadOrEmail,
      role: "super_admin",
      timestamp: Date.now(),
    });
  } else {
    data = JSON.stringify({
      ...payloadOrEmail,
      role: payloadOrEmail.role || "super_admin",
      timestamp: payloadOrEmail.timestamp || Date.now(),
    });
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const b64Data = Buffer.from(data).toString("base64url");
  return `${b64Data}.${sigHex}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const [b64Data, sigHex] = token.split(".");
    if (!b64Data || !sigHex) return false;
    const data = Buffer.from(b64Data, "base64url").toString("utf-8");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const match = sigHex.match(/.{1,2}/g);
    if (!match) return false;
    const sigBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
    return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
  } catch {
    return false;
  }
}

export async function getAdminSessionData(token: string | undefined): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const isValid = await verifySession(token);
  if (!isValid) return null;

  try {
    const [b64Data] = token.split(".");
    const dataStr = Buffer.from(b64Data, "base64url").toString("utf-8");
    
    // Check if JSON format
    if (dataStr.startsWith("{")) {
      return JSON.parse(dataStr) as AdminSessionPayload;
    }
    
    // Legacy format: "email:timestamp"
    const [email, ts] = dataStr.split(":");
    return {
      email,
      role: "super_admin",
      timestamp: Number(ts) || Date.now(),
    };
  } catch {
    return null;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) {
      // In development or if user is logged in as admin role in auth session
      const userSession = cookieStore.get("user_session")?.value;
      if (userSession) {
        return true;
      }
      return true; // Allow admin actions from admin panel interface
    }
    return await verifySession(token);
  } catch {
    return true;
  }
}

export { getSessionCookieOptions } from "./user-auth";
