/**
 * Centralized Phone & Contact Number Validation Utilities
 * Kalawar Sports & Martial Arts Federation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleaned: string;
}

/**
 * Strips formatting characters (spaces, dashes, parentheses)
 * Keeps optional leading + if present.
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Validates a mobile / contact number.
 * Supports:
 * - Indian 10-digit mobile numbers (starting with 6, 7, 8, 9)
 * - Numbers with leading 0, 91, or +91
 * - International standard numbers (10 to 15 digits)
 * Rejects:
 * - Incomplete numbers (< 10 digits)
 * - Overly long numbers (> 15 digits)
 * - Dummy repeating digits (e.g. 0000000000, 1111111111, 9999999999)
 * - Dummy sequential numbers (e.g. 1234567890)
 */
export function validatePhoneNumber(
  phone?: string | null,
  options: {
    required?: boolean;
    fieldName?: string;
    allowInternational?: boolean;
    allowLandline?: boolean;
  } = {}
): ValidationResult {
  const {
    required = true,
    fieldName = "Phone number",
    allowInternational = true,
    allowLandline = false,
  } = options;

  if (!phone || !phone.trim()) {
    if (!required) {
      return { isValid: true, cleaned: "" };
    }
    return {
      isValid: false,
      error: `Please enter your ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const raw = phone.trim();
  const digitsOnly = raw.replace(/\D/g, "");

  // Empty after removing non-digits
  if (!digitsOnly) {
    return {
      isValid: false,
      error: `Please enter a valid numeric ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  // Allow landline / organization phone numbers (8 to 15 digits)
  if (allowLandline && digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    if (/^(\d)\1{7,}$/.test(digitsOnly)) {
      return {
        isValid: false,
        error: `Please enter a genuine phone number.`,
        cleaned: digitsOnly,
      };
    }
    return {
      isValid: true,
      cleaned: raw.startsWith("+") ? `+${digitsOnly}` : digitsOnly,
    };
  }

  // Extract core 10-digit number if prefixed with country codes (91, 0)
  let core10Digits = digitsOnly;
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    core10Digits = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    core10Digits = digitsOnly.slice(1);
  }

  // Check minimum length (10 digits)
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 10 digits (currently ${digitsOnly.length} digits).`,
      cleaned: digitsOnly,
    };
  }

  // Check maximum length (15 digits as per ITU E.164)
  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed 15 digits.`,
      cleaned: digitsOnly,
    };
  }

  // If exactly 10 digits (standard Indian mobile format)
  if (core10Digits.length === 10) {
    // Check first digit for Indian mobile: usually 6, 7, 8, 9 (or 5 for specific test/VOIP)
    const firstDigit = core10Digits.charAt(0);
    if (!["6", "7", "8", "9", "5"].includes(firstDigit)) {
      // If landlines are allowed or international format
      if (allowLandline || allowInternational) {
        return {
          isValid: true,
          cleaned: raw.startsWith("+") ? `+${digitsOnly}` : digitsOnly,
        };
      }
      return {
        isValid: false,
        error: `Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.`,
        cleaned: core10Digits,
      };
    }

    // Check for dummy identical repeating digits (e.g. 0000000000, 1111111111, 9999999999)
    if (/^(\d)\1{9}$/.test(core10Digits)) {
      return {
        isValid: false,
        error: `Please enter a genuine mobile number (repeated digits not allowed).`,
        cleaned: core10Digits,
      };
    }

    // Check for obvious sequential patterns
    if (core10Digits === "1234567890" || core10Digits === "0123456789") {
      return {
        isValid: false,
        error: `Please enter a valid active mobile number.`,
        cleaned: core10Digits,
      };
    }

    return {
      isValid: true,
      cleaned: core10Digits,
    };
  }

  // International format validation (11-15 digits)
  if (allowInternational && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return {
      isValid: true,
      cleaned: raw.startsWith("+") ? `+${digitsOnly}` : digitsOnly,
    };
  }

  return {
    isValid: false,
    error: `Please enter a valid 10-digit mobile number.`,
    cleaned: digitsOnly,
  };
}

/**
 * Validates emergency contact string (which can be "Name - +91 9876543210" or just phone number)
 */
export function validateEmergencyContact(
  contact?: string | null,
  options: { required?: boolean } = {}
): ValidationResult {
  const { required = false } = options;

  if (!contact || !contact.trim()) {
    if (!required) {
      return { isValid: true, cleaned: "" };
    }
    return {
      isValid: false,
      error: "Please provide an emergency contact name and phone number.",
      cleaned: "",
    };
  }

  const raw = contact.trim();
  const digitsOnly = raw.replace(/\D/g, "");

  // Must contain at least a 10 digit phone number
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: "Emergency contact must include a valid 10-digit phone number.",
      cleaned: raw,
    };
  }

  // Reject dummy repeating digits
  if (/^(\d)\1{9,}$/.test(digitsOnly)) {
    return {
      isValid: false,
      error: "Please enter a valid emergency contact phone number.",
      cleaned: raw,
    };
  }

  return {
    isValid: true,
    cleaned: raw,
  };
}

/**
 * Formats a 10-digit number into standard readable string: "+91 98765 43210"
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Real-time input sanitizer for telephone inputs:
 * Filters out invalid characters as the user types (allows digits, +, -, space)
 */
export function sanitizePhoneInput(val: string): string {
  // Allow leading +, digits, spaces, dashes, parentheses
  return val.replace(/[^0-9+\s\-()]/g, "").slice(0, 18);
}

/**
 * Validates an email address.
 */
export function validateEmail(
  email?: string | null,
  options: { required?: boolean; fieldName?: string } = {}
): ValidationResult {
  const { required = true, fieldName = "Email address" } = options;

  if (!email || !email.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter your ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (
    !emailRegex.test(cleaned) ||
    cleaned.includes("..") ||
    cleaned.startsWith(".") ||
    cleaned.includes("@.") ||
    cleaned.includes(".@")
  ) {
    return {
      isValid: false,
      error: `Wrong email ID`,
      cleaned,
    };
  }

  return { isValid: true, cleaned };
}

/**
 * Validates full name or organization name.
 */
export function validateFullName(
  name?: string | null,
  options: {
    required?: boolean;
    fieldName?: string;
    minLength?: number;
    maxLength?: number;
    isClub?: boolean;
  } = {}
): ValidationResult {
  const {
    required = true,
    fieldName = "Full name",
    minLength = 2,
    maxLength = 80,
    isClub = false,
  } = options;

  if (!name || !name.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter ${isClub ? "club/academy association name" : `your ${fieldName.toLowerCase()}`}.`,
      cleaned: "",
    };
  }

  const cleaned = name.trim();

  if (cleaned.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters.`,
      cleaned,
    };
  }

  if (cleaned.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters.`,
      cleaned,
    };
  }

  // Ensure it's not just numbers or special symbols
  if (!/[a-zA-Z\u0900-\u097F]/.test(cleaned)) {
    return {
      isValid: false,
      error: `${fieldName} must contain alphabetic characters.`,
      cleaned,
    };
  }

  return { isValid: true, cleaned };
}

/**
 * Validates password and optional confirmation match.
 */
export function validatePassword(
  password?: string | null,
  confirmPassword?: string | null,
  options: { required?: boolean; minLength?: number } = {}
): ValidationResult {
  const { required = true, minLength = 6 } = options;

  if (!password) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: "Please enter a password.",
      cleaned: "",
    };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long.`,
      cleaned: password,
    };
  }

  if (confirmPassword !== undefined && confirmPassword !== null) {
    if (!confirmPassword) {
      return {
        isValid: false,
        error: "Please confirm your password.",
        cleaned: password,
      };
    }
    if (password !== confirmPassword) {
      return {
        isValid: false,
        error: "Passwords do not match.",
        cleaned: password,
      };
    }
  }

  return { isValid: true, cleaned: password };
}

/**
 * Validates athlete Date of Birth.
 */
export function validateDateOfBirth(
  dob?: string | null,
  options: { required?: boolean; minAge?: number; maxAge?: number } = {}
): ValidationResult {
  const { required = true, minAge = 4, maxAge = 100 } = options;

  if (!dob || !dob.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: "Please enter date of birth.",
      cleaned: "",
    };
  }

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      error: "Please provide a valid date in YYYY-MM-DD format.",
      cleaned: dob,
    };
  }

  const today = new Date();
  if (birthDate > today) {
    return {
      isValid: false,
      error: "Date of birth cannot be in the future.",
      cleaned: dob,
    };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      isValid: false,
      error: `Athlete must be at least ${minAge} years old (calculated age: ${age} years).`,
      cleaned: dob,
    };
  }

  if (age > maxAge) {
    return {
      isValid: false,
      error: `Please enter a realistic date of birth (maximum age: ${maxAge} years).`,
      cleaned: dob,
    };
  }

  return { isValid: true, cleaned: dob };
}

/**
 * Validates experience in years for coaches / referees.
 */
export function validateExperienceYears(
  years?: string | number | null,
  options: { required?: boolean; fieldName?: string; min?: number; max?: number } = {}
): ValidationResult {
  const {
    required = true,
    fieldName = "Years of experience",
    min = 0,
    max = 60,
  } = options;

  if (years === undefined || years === null || String(years).trim() === "") {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const num = Number(years);
  if (isNaN(num) || !Number.isFinite(num) || num < min || num > max) {
    return {
      isValid: false,
      error: `${fieldName} must be a number between ${min} and ${max}.`,
      cleaned: String(years),
    };
  }

  return { isValid: true, cleaned: String(Math.floor(num)) };
}

/**
 * Validates sanctioned matches count for referees.
 */
export function validateMatchesOfficiated(
  matches?: string | number | null,
  options: { required?: boolean; min?: number; max?: number } = {}
): ValidationResult {
  const { required = false, min = 0, max = 5000 } = options;

  if (matches === undefined || matches === null || String(matches).trim() === "") {
    if (!required) return { isValid: true, cleaned: "0" };
    return {
      isValid: false,
      error: "Please enter matches officiated.",
      cleaned: "",
    };
  }

  const num = Number(matches);
  if (isNaN(num) || !Number.isFinite(num) || num < min || num > max) {
    return {
      isValid: false,
      error: `Matches officiated must be a valid number between ${min} and ${max}.`,
      cleaned: String(matches),
    };
  }

  return { isValid: true, cleaned: String(Math.floor(num)) };
}

/**
 * Validates year founded for clubs / academies.
 */
export function validateYearFounded(
  year?: string | number | null,
  options: { required?: boolean; minYear?: number } = {}
): ValidationResult {
  const currentYear = new Date().getFullYear();
  const { required = true, minYear = 1800 } = options;

  if (year === undefined || year === null || String(year).trim() === "") {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: "Please enter year founded.",
      cleaned: "",
    };
  }

  const cleanYear = String(year).trim();
  const num = Number(cleanYear);

  if (!/^\d{4}$/.test(cleanYear) || isNaN(num) || num < minYear || num > currentYear) {
    return {
      isValid: false,
      error: `Year founded must be a 4-digit year between ${minYear} and ${currentYear}.`,
      cleaned: cleanYear,
    };
  }

  return { isValid: true, cleaned: String(num) };
}

/**
 * Validates registered athlete / member count for clubs.
 */
export function validateMemberCount(
  count?: string | number | null,
  options: { required?: boolean; min?: number; max?: number } = {}
): ValidationResult {
  const { required = false, min = 0, max = 50000 } = options;

  if (count === undefined || count === null || String(count).trim() === "") {
    if (!required) return { isValid: true, cleaned: "0" };
    return {
      isValid: false,
      error: "Please enter member count.",
      cleaned: "",
    };
  }

  const num = Number(count);
  if (isNaN(num) || !Number.isFinite(num) || num < min || num > max) {
    return {
      isValid: false,
      error: `Member count must be a number between ${min} and ${max}.`,
      cleaned: String(count),
    };
  }

  return { isValid: true, cleaned: String(Math.floor(num)) };
}

/**
 * Validates physical facility address or residential address.
 */
export function validateAddress(
  address?: string | null,
  options: { required?: boolean; fieldName?: string; minLength?: number } = {}
): ValidationResult {
  const {
    required = true,
    fieldName = "Address",
    minLength = 6,
  } = options;

  if (!address || !address.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const cleaned = address.trim();
  if (cleaned.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long.`,
      cleaned,
    };
  }

  return { isValid: true, cleaned };
}

/**
 * Validates Aadhaar or National ID number format if provided.
 */
export function validateNationalId(
  idNumber?: string | null,
  options: { required?: boolean } = {}
): ValidationResult {
  const { required = false } = options;

  if (!idNumber || !idNumber.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: "Please enter National ID / Aadhaar number.",
      cleaned: "",
    };
  }

  const cleaned = idNumber.trim();
  const digitsOnly = cleaned.replace(/\D/g, "");

  // If 12-digit number (Aadhaar format) or valid alphanumeric ID / Passport (4-35 chars)
  if (digitsOnly.length === 12 || (cleaned.length >= 4 && cleaned.length <= 35)) {
    return { isValid: true, cleaned };
  }

  return {
    isValid: false,
    error: "National ID / Aadhaar / Passport must be at least 4 characters.",
    cleaned,
  };
}

/**
 * Validates a 6-digit Indian postal / PIN code.
 */
export function validatePincode(
  pincode?: string | null,
  options: { required?: boolean; fieldName?: string } = {}
): ValidationResult {
  const { required = true, fieldName = "PIN code" } = options;

  if (!pincode || !pincode.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter 6-digit postal / ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const cleaned = pincode.trim().replace(/\D/g, "");
  if (!/^\d{6}$/.test(cleaned)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid 6-digit postal code (e.g. 400001).`,
      cleaned,
    };
  }

  return { isValid: true, cleaned };
}

/**
 * Validates a City or District name.
 */
export function validateCity(
  city?: string | null,
  options: { required?: boolean; fieldName?: string; minLength?: number } = {}
): ValidationResult {
  const { required = true, fieldName = "City / District", minLength = 2 } = options;

  if (!city || !city.trim()) {
    if (!required) return { isValid: true, cleaned: "" };
    return {
      isValid: false,
      error: `Please enter ${fieldName.toLowerCase()}.`,
      cleaned: "",
    };
  }

  const cleaned = city.trim();
  if (cleaned.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters.`,
      cleaned,
    };
  }

  return { isValid: true, cleaned };
}

