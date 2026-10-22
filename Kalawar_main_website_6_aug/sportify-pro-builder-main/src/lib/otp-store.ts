/**
 * Secure OTP & 2FA Token Management
 * Kalawar Sports & Martial Arts Federation of India
 */

import crypto from "crypto";
import { connectToDatabase } from "./mongodb";
import { OTPModel } from "@/models/OTP";

export interface OTPEntry {
  email: string;
  code: string;
  action: "login" | "register" | "verify" | "reset";
  tempToken: string;
  expiresAt: number;
  attempts: number;
  userData?: any;
}

declare global {
  var __globalOtpStore: Map<string, OTPEntry> | undefined;
}

// Global in-memory OTP storage to ensure sharing across all Next.js API route bundles
if (!globalThis.__globalOtpStore) {
  globalThis.__globalOtpStore = new Map<string, OTPEntry>();
}
const otpStore = globalThis.__globalOtpStore;

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Creates and stores a new OTP for a given email and action.
 * Writes to shared memory immediately and persists to MongoDB asynchronously.
 */
export function createOTP(
  email: string,
  action: "login" | "register" | "verify" | "reset" = "login",
  userData?: any
): { code: string; tempToken: string; expiresAt: number } {
  const cleanEmail = email.trim().toLowerCase();
  const code = generateOTPCode();
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Generate a random temporary token for client reference
  const tempToken = crypto.randomBytes(24).toString("hex");

  const entry: OTPEntry = {
    email: cleanEmail,
    code,
    action,
    tempToken,
    expiresAt,
    attempts: 0,
    userData,
  };

  // Map in shared memory by both action key and token key
  const emailActionKey = `${cleanEmail}:${action}`;
  const tokenKey = `token:${tempToken}`;

  otpStore.set(emailActionKey, entry);
  otpStore.set(tokenKey, entry);

  console.log(`[OTP] Generated 2FA OTP for ${cleanEmail} (${action}): [${code}] (TempToken: ${tempToken.slice(0, 8)}...)`);

  // Asynchronously persist to MongoDB for durability across server restarts / multi-worker environments
  connectToDatabase()
    .then(async () => {
      // Remove any existing active OTP for this email and action
      await OTPModel.deleteMany({ email: cleanEmail, action });
      await OTPModel.create({
        email: cleanEmail,
        code,
        action,
        tempToken,
        expiresAt: new Date(expiresAt),
        attempts: 0,
        userData,
      });
    })
    .catch((err) => {
      // Non-fatal: in-memory cache remains active
      console.warn("[OTP] MongoDB persistence warning (using in-memory store):", err?.message || err);
    });

  return { code, tempToken, expiresAt };
}

/**
 * Verifies an OTP code for a given email, Player ID, or tempToken.
 * Checks shared in-memory store first, with fallback to MongoDB.
 */
export async function verifyOTP(
  identifier: string, // Email, TempToken, or Identifier
  enteredCode: string,
  action?: "login" | "register" | "verify" | "reset"
): Promise<{ isValid: boolean; error?: string; userData?: any; email?: string; tempToken?: string }> {
  const cleanInput = String(identifier || "").trim();
  const cleanCode = String(enteredCode || "").trim().replace(/\D/g, "");

  if (!cleanInput) {
    return {
      isValid: false,
      error: "Missing verification session token or identifier.",
    };
  }

  if (!cleanCode || cleanCode.length < 6) {
    return {
      isValid: false,
      error: "Please enter the complete 6-digit verification code.",
    };
  }

  let entry: OTPEntry | undefined;
  const matchedKeys: string[] = [];

  // 1. Try resolving from shared global memory
  if (cleanInput.startsWith("token:")) {
    const k = cleanInput;
    if (otpStore.has(k)) {
      entry = otpStore.get(k);
      matchedKeys.push(k);
    }
  } else if (otpStore.has(`token:${cleanInput}`)) {
    const k = `token:${cleanInput}`;
    entry = otpStore.get(k);
    matchedKeys.push(k);
  } else if (action && otpStore.has(`${cleanInput.toLowerCase()}:${action}`)) {
    const k = `${cleanInput.toLowerCase()}:${action}`;
    entry = otpStore.get(k);
    matchedKeys.push(k);
  } else {
    // Search across actions in memory
    for (const act of ["login", "register", "verify", "reset"] as const) {
      const k = `${cleanInput.toLowerCase()}:${act}`;
      if (otpStore.has(k)) {
        entry = otpStore.get(k);
        matchedKeys.push(k);
        break;
      }
    }
  }

  // 2. If not found in memory, query MongoDB
  if (!entry) {
    try {
      await connectToDatabase();
      const rawToken = cleanInput.startsWith("token:") ? cleanInput.replace(/^token:/, "") : cleanInput;
      const query: any = {
        $or: [
          { tempToken: rawToken },
          { email: cleanInput.toLowerCase() },
        ],
      };
      if (action) {
        query.action = action;
      }

      const dbDoc = await OTPModel.findOne(query).sort({ createdAt: -1 });
      if (dbDoc) {
        entry = {
          email: dbDoc.email,
          code: dbDoc.code,
          action: dbDoc.action,
          tempToken: dbDoc.tempToken,
          expiresAt: new Date(dbDoc.expiresAt).getTime(),
          attempts: dbDoc.attempts || 0,
          userData: dbDoc.userData,
        };
      }
    } catch (mongoErr) {
      console.warn("[OTP] MongoDB lookup warning:", mongoErr);
    }
  }

  if (!entry) {
    return {
      isValid: false,
      error: "No active verification code found or code has expired. Please request a new one.",
    };
  }

  // Also collect associated keys for cleanup
  if (entry.tempToken) {
    matchedKeys.push(`token:${entry.tempToken}`);
  }
  if (entry.email && entry.action) {
    matchedKeys.push(`${entry.email.toLowerCase()}:${entry.action}`);
  }

  // 3. Check expiration
  if (Date.now() > entry.expiresAt) {
    for (const k of matchedKeys) {
      otpStore.delete(k);
    }
    OTPModel.deleteMany({
      $or: [{ tempToken: entry.tempToken }, { email: entry.email }],
    }).catch(() => {});

    return {
      isValid: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // 4. Check attempt limit
  if (entry.attempts >= MAX_ATTEMPTS) {
    for (const k of matchedKeys) {
      otpStore.delete(k);
    }
    OTPModel.deleteMany({
      $or: [{ tempToken: entry.tempToken }, { email: entry.email }],
    }).catch(() => {});

    return {
      isValid: false,
      error: "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  // 5. Check code match
  if (entry.code !== cleanCode) {
    entry.attempts += 1;
    // Update attempts in MongoDB
    OTPModel.updateOne(
      { $or: [{ tempToken: entry.tempToken }, { email: entry.email }] },
      { $inc: { attempts: 1 } }
    ).catch(() => {});

    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      isValid: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // 6. Verification succeeded - clean up OTP from memory and MongoDB
  const { userData, email, tempToken } = entry;
  for (const k of matchedKeys) {
    otpStore.delete(k);
  }

  OTPModel.deleteMany({
    $or: [{ tempToken }, { email }],
  }).catch(() => {});

  console.log(`[OTP] Successfully verified 2FA code for ${email} (${entry.action})`);

  return {
    isValid: true,
    userData,
    email,
    tempToken,
  };
}

/**
 * Masks an email for privacy display: e.g. "tridev@gmail.com" -> "t***v@gmail.com"
 */
export function getMaskedEmail(email?: string): string {
  if (!email || !email.includes("@")) return "registered email";
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  const maskedLocal = `${localPart[0]}${"*".repeat(Math.max(3, localPart.length - 2))}${localPart[localPart.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Finds an active OTP entry by token or email
 */
export async function findActiveOTP(
  identifier: string
): Promise<OTPEntry | null> {
  const cleanInput = identifier.trim();
  if (!cleanInput) return null;

  // Check in memory
  if (cleanInput.startsWith("token:") && otpStore.has(cleanInput)) {
    return otpStore.get(cleanInput) || null;
  }
  if (otpStore.has(`token:${cleanInput}`)) {
    return otpStore.get(`token:${cleanInput}`) || null;
  }

  for (const act of ["login", "register", "verify", "reset"] as const) {
    const k = `${cleanInput.toLowerCase()}:${act}`;
    if (otpStore.has(k)) {
      return otpStore.get(k) || null;
    }
  }

  // Check DB
  try {
    await connectToDatabase();
    const rawToken = cleanInput.startsWith("token:") ? cleanInput.replace(/^token:/, "") : cleanInput;
    const doc = await OTPModel.findOne({
      $or: [{ tempToken: rawToken }, { email: cleanInput.toLowerCase() }],
      expiresAt: { $gt: new Date() },
    });
    if (doc) {
      return {
        email: doc.email,
        code: doc.code,
        action: doc.action,
        tempToken: doc.tempToken,
        expiresAt: new Date(doc.expiresAt).getTime(),
        attempts: doc.attempts || 0,
        userData: doc.userData,
      };
    }
  } catch {}

  return null;
}
