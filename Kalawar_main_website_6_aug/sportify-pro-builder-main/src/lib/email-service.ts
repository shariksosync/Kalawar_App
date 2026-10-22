/**
 * Comprehensive Transactional Email Service
 * Kalawar Sports & Martial Arts Federation of India
 */

import nodemailer from "nodemailer";

// SMTP Configuration from environment variables (supporting both EMAIL_* and SMTP_* formats)
const SMTP_HOST = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.EMAIL_HOST_USER || process.env.SMTP_USER || "";
const rawPass = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS || "";
const SMTP_PASS = rawPass.replace(/\s+/g, ""); // Strip spaces for Gmail App Password compatibility
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;
const SMTP_FROM = process.env.SMTP_FROM || `"KALAWAR Federation" <${SMTP_USER || "contact@kalawarfederation.org"}>`;

export const FED_NAME = "KALAWAR Sports & Martial Arts Federation of India";
export const FED_PHONE = "+91 91700 87342";
export const FED_EMAIL = "contact@kalawarfederation.org";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.EMAIL_HOST_USER || process.env.SMTP_USER || "";
  const pass = (process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
  }
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Base email dispatch function
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; simulated?: boolean }> {
  try {
    const transport = getTransporter();
    if (transport) {
      await transport.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ""),
      });
      console.log(`[EmailService] Dispatched email to ${to}: "${subject}"`);
      return { success: true };
    }

    // Simulated fallback in dev or when SMTP is not configured
    console.log(`\n================== [EMAIL DISPATCH SIMULATION] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Content Preview: ${text || html.replace(/<[^>]+>/g, "").slice(0, 150)}...`);
    console.log(`==================================================================\n`);
    return { success: true, simulated: true };
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return { success: false };
  }
}

/**
 * Common HTML email layout wrapper
 */
export function wrapEmailTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0f12; color: #e2e8f0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #14171d; border: 1px solid #2d3748; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a202c 0%, #0d0f12 100%); padding: 30px 24px; text-align: center; border-bottom: 2px solid #d4af37; }
    .logo-text { color: #d4af37; font-size: 18px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
    .sub-title { color: #a0aec0; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); }
    .otp-box { background: #1a202c; border: 2px dashed #d4af37; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #d4af37; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f6e05e 100%); color: #000000; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: 800; font-size: 13px; margin-top: 20px; }
    .card { background: #1a202c; border: 1px solid #2d3748; border-radius: 12px; padding: 18px; margin: 16px 0; }
    .footer { background-color: #0d0f12; padding: 24px; text-align: center; border-top: 1px solid #2d3748; font-size: 11px; color: #718096; line-height: 1.6; }
    .footer a { color: #d4af37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-text">${FED_NAME}</h1>
      <p class="sub-title">National Sports & Martial Arts Governing Body</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an official automated notification from ${FED_NAME}.</p>
      <p>Secretariat Desk: ${FED_PHONE} | <a href="mailto:${FED_EMAIL}">${FED_EMAIL}</a></p>
      <p>&copy; ${new Date().getFullYear()} ${FED_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Send 2FA One-Time Password (OTP) for Login, Registration & Verification
 */
export async function send2FAOTPEmail(
  email: string,
  name: string,
  otpCode: string,
  action: "login" | "register" | "verify" | "reset" = "login"
) {
  if (action === "reset") {
    return sendPasswordResetOTPEmail(email, name, otpCode);
  }

  const isLogin = action === "login";
  const actionTitle = isLogin ? "Sign In Verification Code" : "Account Registration Verification Code";
  const actionDesc = isLogin
    ? "A sign-in attempt was initiated for your federation member account."
    : "An application to create a new federation athlete/member account was initiated.";

  const html = wrapEmailTemplate(
    actionTitle,
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge">Two-Factor Authentication (2FA)</span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">${actionTitle}</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.5;">
        Dear <strong>${name}</strong>,<br/>
        ${actionDesc} Use the one-time verification code below to complete your authentication.
      </p>
    </div>

    <div class="otp-box">
      <p style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Your 6-Digit Verification Code</p>
      <div class="otp-code">${otpCode}</div>
      <p style="color: #e53e3e; font-size: 11px; margin-bottom: 0; margin-top: 8px;">⏳ Valid for 5 minutes only</p>
    </div>

    <p style="color: #718096; font-size: 12px; line-height: 1.5;">
      <strong>Security Notice:</strong> Never share this OTP with anyone. The federation secretariat will never ask for your 2FA security code. If you did not request this code, please secure your account immediately.
    </p>
    `
  );

  return sendEmail({
    to: email,
    subject: `🔐 ${otpCode} is your ${FED_NAME} verification code`,
    html,
  });
}

/**
 * 1b. Send Password Reset Verification Code Email
 */
export async function sendPasswordResetOTPEmail(
  email: string,
  name: string,
  otpCode: string
) {
  const html = wrapEmailTemplate(
    "Password Reset Verification Code",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35);">
        Account Security & Recovery
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Reset Your Password</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.5;">
        Dear <strong>${name}</strong>,<br/>
        We received a request to reset the password for your official federation account. Use the 6-digit verification code below to authorize this password change.
      </p>
    </div>

    <div class="otp-box" style="border-color: #f59e0b;">
      <p style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Your Password Reset Code</p>
      <div class="otp-code" style="color: #fbbf24;">${otpCode}</div>
      <p style="color: #ef4444; font-size: 11px; margin-bottom: 0; margin-top: 8px;">⏳ Code expires in 5 minutes</p>
    </div>

    <div class="card" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2);">
      <p style="color: #f87171; font-size: 12px; margin: 0; font-weight: 600;">⚠️ Security Notice</p>
      <p style="color: #cbd5e1; font-size: 12px; margin: 6px 0 0 0; line-height: 1.5;">
        If you did not initiate this password reset request, please ignore this email or notify the federation secretariat immediately. Your current password remains unchanged.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🔑 ${otpCode} - Reset Your ${FED_NAME} Password`,
    html,
  });
}

/**
 * 1c. Send Password Reset Success Notification Email
 */
export async function sendPasswordResetSuccessEmail(
  email: string,
  name: string
) {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = wrapEmailTemplate(
    "Password Successfully Changed",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35);">
        ✓ Security Update Confirmed
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Password Changed Successfully</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.5;">
        Dear <strong>${name}</strong>,<br/>
        The password for your federation member account was successfully updated on <strong>${timestamp} (IST)</strong>.
      </p>
    </div>

    <div class="card" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2);">
      <p style="color: #34d399; font-size: 12px; margin: 0; font-weight: 600;">Account Protection Active</p>
      <p style="color: #cbd5e1; font-size: 12px; margin: 6px 0 0 0; line-height: 1.5;">
        You can now sign in to the Member Portal using your new password. If you did NOT make this change, please contact the secretariat urgently.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `✅ Your ${FED_NAME} Account Password Has Been Changed`,
    html,
  });
}

export interface SendRegistrationReceiptEmailParams {
  email: string;
  name: string;
  memberId: string;
  password?: string;
  memberType?: string;
  discipline?: string;
  state?: string;
  club?: string;
  phone?: string;
  registeredOn?: string;
  ageGroup?: string;
  weightCategory?: string;
  status?: string;
}

/**
 * 2. Send Official Registration Receipt Email with Member Credentials (ID & Password)
 */
export async function sendRegistrationReceiptEmail({
  email,
  name,
  memberId,
  password,
  memberType = "Player",
  discipline = "Kalawar Kaya Yuddha",
  state = "National",
  club,
  phone,
  registeredOn,
  ageGroup,
  weightCategory,
  status = "Pending",
}: SendRegistrationReceiptEmailParams) {
  const receiptNumber = `REC-REG-${memberId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const registrationDate = registeredOn || new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = wrapEmailTemplate(
    "Your Email is Verified Successfully - Registration & Credentials",
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35); padding: 6px 16px; font-weight: 800; font-size: 12px;">
        ✓ Email Verified Successfully
      </span>
      <h2 style="color: #ffffff; margin-top: 14px; font-size: 22px; font-weight: 800;">
        Your Email is Verified Successfully
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; max-width: 500px; margin: 8px auto 0 auto;">
        Dear <strong>${name}</strong>,<br/>
        Your email address (<strong>${email}</strong>) has been verified successfully. Your official application to register as a certified <strong>${memberType}</strong> has been recorded in the National Federation Registry.
      </p>
      <div style="display: inline-block; background: #1a202c; border: 1px solid #d4af37; padding: 6px 16px; border-radius: 8px; font-family: monospace; font-weight: 700; color: #d4af37; margin-top: 10px; font-size: 12px;">
        Receipt Reference: ${receiptNumber}
      </div>
    </div>

    <!-- Credentials Box (ID & Password) -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px 0; color: #f6e05e; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        🔐 Official Account Login Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 7px 0; color: #a0aec0; width: 40%;">Official Member ID:</td>
          <td style="padding: 7px 0; font-weight: 800; color: #d4af37; font-family: monospace; font-size: 15px;">${memberId}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Email Verification:</td>
          <td style="padding: 7px 0; font-weight: 800; color: #34d399; font-size: 13px;">✅ Verified Successfully</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Login Email:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${email}</td>
        </tr>
        ${password
      ? `
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Account Password:</td>
          <td style="padding: 7px 0; font-weight: 800; color: #34d399; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${password}</td>
        </tr>`
      : ""
    }
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Member Classification:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">${memberType}</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; border-top: 1px solid #2d3748; padding-top: 10px;">
        ℹ️ You can sign in using either your <strong>Official Member ID (${memberId})</strong> or your <strong>Email (${email})</strong> along with your password.
      </p>
    </div>

    <!-- Itemized Particulars Card -->
    <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Registration Particulars &amp; Affiliation
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0; width: 40%;">Registered Full Name:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${name}</td>
        </tr>
        ${memberType !== "Club" && discipline
      ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Sports Discipline:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${discipline}</td>
        </tr>`
      : ""
    }
        ${ageGroup
      ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Age Division:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${ageGroup}</td>
        </tr>`
      : ""
    }
        ${weightCategory
      ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Weight Category:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${weightCategory}</td>
        </tr>`
      : ""
    }
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">State Association Unit:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${state}, India</td>
        </tr>
        ${club
      ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Club / Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${club}</td>
        </tr>`
      : ""
    }
        ${phone
      ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Registered Contact:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${phone}</td>
        </tr>`
      : ""
    }
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Registration Date:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${registrationDate}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Accreditation Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #fbbf24;">⏳ ${status.toUpperCase()} (Under Review)</td>
        </tr>
      </table>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin: 26px 0 10px 0;">
      <a href="https://kalawarfederation.org/login" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        Sign In to Member Portal &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        Please store this receipt safely. For any technical support or verification assistance, contact the secretariat desk at <a href="mailto:${FED_EMAIL}" style="color: #d4af37;">${FED_EMAIL}</a>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `✅ Your Email is Verified Successfully - Registration Credentials (${memberId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * Backward compatibility alias for welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  memberId: string,
  memberType: string = "Player",
  discipline: string = "Athletics",
  state: string = "National",
  password?: string
) {
  return sendRegistrationReceiptEmail({
    email,
    name,
    memberId,
    password,
    memberType,
    discipline,
    state,
  });
}

/**
 * 3. Send Call-Back & Contact Enquiry Acknowledgment Email
 */
export async function sendCallbackInquiryEmail(
  email: string,
  name: string,
  inquiryId: string,
  subject: string,
  message: string,
  phone?: string
) {
  const html = wrapEmailTemplate(
    "Enquiry & Call-Back Received",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge">Secretariat Desk</span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">We Have Received Your Enquiry</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.6;">
        Dear <strong>${name}</strong>,<br/>
        Thank you for contacting ${FED_NAME}. Your request for communication / call-back has been registered under Reference ID:
      </p>
      <div style="display: inline-block; background: #1a202c; border: 1px solid #d4af37; padding: 6px 16px; border-radius: 8px; font-family: monospace; font-weight: 700; color: #d4af37; margin-top: 8px;">
        ${inquiryId}
      </div>
    </div>

    <div class="card">
      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Summary of Request</p>
      <p style="margin: 4px 0; font-size: 13px; color: #ffffff;"><strong>Subject:</strong> ${subject}</p>
      ${phone ? `<p style="margin: 4px 0; font-size: 13px; color: #ffffff;"><strong>Call-back Contact:</strong> ${phone}</p>` : ""}
      <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 12px; color: #cbd5e1; font-style: italic;">
        "${message}"
      </div>
    </div>

    <p style="color: #a0aec0; font-size: 12px; line-height: 1.6;">
      An appointed federation official or secretariat officer will contact you within <strong>1 to 2 business days</strong>.
    </p>
    `
  );

  return sendEmail({
    to: email,
    subject: `📋 [${inquiryId}] We received your enquiry - ${FED_NAME}`,
    html,
  });
}

/**
 * 4. Send Order Confirmation Email on Shop Checkout
 */
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: {
    orderId: string;
    items: Array<{ title: string; price: number; quantity: number; selectedSize?: string }>;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    shippingAddress: { address: string; city: string; state: string; pincode: string };
  }
) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #2d3748; color: #ffffff; font-size: 13px;">
        <strong>${item.title}</strong>
        ${item.selectedSize ? `<br/><span style="font-size: 11px; color: #a0aec0;">Size: ${item.selectedSize}</span>` : ""}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #2d3748; text-align: center; color: #a0aec0; font-size: 13px;">x${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #2d3748; text-align: right; font-weight: 700; color: #d4af37; font-size: 13px;">₹${(item.price * item.quantity).toLocaleString("en-IN")}</td>
    </tr>
  `
    )
    .join("");

  const html = wrapEmailTemplate(
    "Order Confirmation Receipt",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge">Order Confirmed</span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Thank You for Your Order!</h2>
      <p style="color: #a0aec0; font-size: 13px;">
        Dear <strong>${name}</strong>, your merchandise & equipment order has been placed successfully.
      </p>
      <div style="display: inline-block; background: #1a202c; border: 1px solid #d4af37; padding: 6px 16px; border-radius: 8px; font-family: monospace; font-weight: 700; color: #d4af37; margin-top: 8px;">
        Order ID: ${order.orderId}
      </div>
    </div>

    <div class="card">
      <p style="margin: 0 0 12px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Itemized Order Summary</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="color: #a0aec0; font-size: 11px; text-transform: uppercase;">
            <th style="text-align: left; padding-bottom: 8px;">Product</th>
            <th style="text-align: center; padding-bottom: 8px;">Qty</th>
            <th style="text-align: right; padding-bottom: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top: 12px; font-weight: 700; color: #ffffff; font-size: 14px;">Total Amount:</td>
            <td style="padding-top: 12px; text-align: right; font-weight: 900; color: #d4af37; font-size: 16px;">₹${order.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="card">
      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Shipping Address</p>
      <p style="margin: 0; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
        ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kalawarfederation.org/orders" class="btn">Track Order Live &rarr;</a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🛍️ Order Confirmed: ${order.orderId} - ${FED_NAME}`,
    html,
  });
}

/**
 * 5. Send Order Status & Courier Tracking Update Email
 */
export async function sendOrderStatusUpdateEmail(
  email: string,
  name: string,
  orderId: string,
  newStatus: string,
  courierName?: string,
  trackingNumber?: string,
  comment?: string
) {
  let statusBadgeColor = "#3182ce"; // default blue
  if (newStatus === "Delivered") statusBadgeColor = "#38a169";
  if (newStatus === "Shipped") statusBadgeColor = "#d4af37";
  if (newStatus === "Cancelled") statusBadgeColor = "#e53e3e";

  const html = wrapEmailTemplate(
    `Order Status Update: ${newStatus}`,
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background-color: ${statusBadgeColor}25; color: ${statusBadgeColor}; border-color: ${statusBadgeColor}60;">
        ${newStatus}
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Your Order Status Has Been Updated</h2>
      <p style="color: #a0aec0; font-size: 13px;">
        Dear <strong>${name}</strong>, there is a new update regarding your federation store order <strong>${orderId}</strong>.
      </p>
    </div>

    <div class="card" style="border-left: 4px solid ${statusBadgeColor};">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Live Tracking Status</p>
      <p style="margin: 4px 0; font-size: 15px; font-weight: 700; color: #ffffff;">Current Status: <span style="color: ${statusBadgeColor};">${newStatus}</span></p>
      
      ${courierName
      ? `<p style="margin: 6px 0 2px 0; font-size: 13px; color: #a0aec0;">Courier Partner: <strong style="color: #ffffff;">${courierName}</strong></p>`
      : ""
    }
      ${trackingNumber
      ? `<p style="margin: 2px 0; font-size: 13px; color: #a0aec0;">Airway Bill / Tracking No: <strong style="color: #d4af37; font-family: monospace;">${trackingNumber}</strong></p>`
      : ""
    }
      ${comment
      ? `<div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 12px; color: #cbd5e1;"><strong>Note:</strong> ${comment}</div>`
      : ""
    }
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kalawarfederation.org/orders" class="btn">View Order Details &rarr;</a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `📦 [${orderId}] Shipment Update: Status is now "${newStatus}"`,
    html,
  });
}

/**
 * 6. Send Official Certificate on Generation / Issuance with Full Details
 */
export async function sendCertificateEmail(
  email: string,
  name: string,
  certificate: {
    number: string;
    type: string;
    event: string;
    position: string;
    issued: string;
    discipline?: string;
    club?: string;
    state?: string;
    memberId?: string;
  }
) {
  const verificationUrl = `https://kalawarfederation.org/certificates?number=${encodeURIComponent(certificate.number)}`;

  const html = wrapEmailTemplate(
    `Official Certificate of ${certificate.type}`,
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(212, 175, 55, 0.2); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.4); padding: 5px 16px;">
        Official National Credential Conferral
      </span>
      <h2 style="color: #ffffff; margin-top: 14px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Certificate of <span style="color: #d4af37;">${certificate.type}</span>
      </h2>
      <p style="color: #a0aec0; font-size: 13px; max-width: 500px; margin: 8px auto 0 auto; line-height: 1.6;">
        The Governing Council & Technical Accreditation Board of <strong>${FED_NAME}</strong> hereby issues this formal certificate of merit, recognition, and athletic achievement.
      </p>
    </div>

    <!-- Official Conferral Card -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 24px; border-radius: 14px; position: relative;">
      <div style="text-align: center; border-bottom: 1px dashed #2d3748; padding-bottom: 16px; margin-bottom: 18px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #a0aec0; font-weight: 700; letter-spacing: 1.5px;">
          This is to officially certify that
        </span>
        <h3 style="margin: 6px 0 0 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
          <span style="color: #d4af37;">${name}</span>
        </h3>
        <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 13px; font-style: italic;">
          has successfully achieved distinguished honors and is conferred the status of
        </p>
        <div style="display: inline-block; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; color: #d4af37; padding: 6px 18px; border-radius: 20px; font-weight: 800; font-size: 14px; margin-top: 10px;">
          ★ ${certificate.position} ★
        </div>
      </div>

      <!-- Credential Breakdown Table -->
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #a0aec0; width: 42%;">Championship / Event:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">${certificate.event}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Award Classification:</td>
          <td style="padding: 7px 0; font-weight: 600; color: #ffffff;">${certificate.type}</td>
        </tr>
        ${certificate.discipline
      ? `
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Sports Discipline:</td>
          <td style="padding: 7px 0; font-weight: 600; color: #ffffff;">${certificate.discipline}</td>
        </tr>`
      : ""
    }
        ${certificate.memberId
      ? `
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Athlete / Member ID:</td>
          <td style="padding: 7px 0; font-weight: 700; font-family: monospace; color: #d4af37;">${certificate.memberId}</td>
        </tr>`
      : ""
    }
        ${certificate.state
      ? `
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Affiliated State Unit:</td>
          <td style="padding: 7px 0; font-weight: 600; color: #ffffff;">${certificate.state}</td>
        </tr>`
      : ""
    }
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Official Certificate No:</td>
          <td style="padding: 7px 0; font-weight: 800; font-family: monospace; color: #d4af37; font-size: 14px;">${certificate.number}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Date of Official Issue:</td>
          <td style="padding: 7px 0; color: #ffffff; font-weight: 600;">${certificate.issued}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #a0aec0;">Accreditation Status:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #48bb78;">✔ Verified & Authenticated</td>
        </tr>
      </table>

      <!-- Official Signatures Block -->
      <div style="margin-top: 22px; padding-top: 16px; border-top: 1px solid #2d3748;">
        <table style="width: 100%; text-align: center; font-size: 11px; color: #a0aec0;">
          <tr>
            <td style="width: 33%; padding: 4px;">
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #d4af37; height: 26px;">S. R. Kalawar</div>
              <div style="border-top: 1px solid #4a5568; margin-top: 4px; padding-top: 4px; font-weight: 700; color: #ffffff;">President</div>
              <div style="font-size: 9px;">Governing Council</div>
            </td>
            <td style="width: 33%; padding: 4px;">
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #d4af37; height: 26px;">Dr. A. Verma</div>
              <div style="border-top: 1px solid #4a5568; margin-top: 4px; padding-top: 4px; font-weight: 700; color: #ffffff;">General Secretary</div>
              <div style="font-size: 9px;">National Secretariat</div>
            </td>
            <td style="width: 33%; padding: 4px;">
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #d4af37; height: 26px;">M. K. Das</div>
              <div style="border-top: 1px solid #4a5568; margin-top: 4px; padding-top: 4px; font-weight: 700; color: #ffffff;">Technical Director</div>
              <div style="font-size: 9px;">Examination Board</div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Actions & Digital Verification -->
    <div style="text-align: center; margin: 26px 0 16px 0;">
      <a href="${verificationUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        View & Verify Official Credential &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        This credential contains a tamper-evident digital seal. Anyone can verify this award by scanning its QR code or entering Reference Number <strong>${certificate.number}</strong> at <a href="https://kalawarfederation.org/certificates" style="color: #d4af37;">kalawarfederation.org/certificates</a>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🏆 Official Certificate Issued: ${certificate.type} (${certificate.number}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 7. Send Academic Transfer History Reminder Email (Profile Status: Incomplete)
 */
export async function sendAcademicHistoryReminderEmail(
  email: string,
  name: string,
  memberId: string
) {
  const html = wrapEmailTemplate(
    "Please Complete Your Profile by filling your Academic history",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(237, 137, 54, 0.2); color: #ed8936; border-color: rgba(237, 137, 54, 0.4);">
        Action Required · Profile Incomplete
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Please Complete Your Profile by filling your Academic history</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.6;">
        Dear <strong>${name}</strong> (Member ID: <strong style="color: #d4af37; font-family: monospace;">${memberId}</strong>),<br/>
        Please Complete Your Profile by filling your Academic history. Your athlete registration is currently marked as <strong style="color: #ed8936;">Incomplete</strong> because your past and current sports academies or school history has not been added.
      </p>
    </div>

    <div class="card" style="border-left: 4px solid #ed8936;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Academic History Fields to Fill</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.7;">
        <li><strong>Academy / Institution:</strong> Sports academy, school, or club name</li>
        <li><strong>Degree / Rank:</strong> Belt rank, diploma, certificate, or level achieved</li>
        <li><strong>Field of Study:</strong> Sport discipline, martial art, or specialization</li>
        <li><strong>Tenure Dates:</strong> Starting date and ending date</li>
        <li><strong>Description:</strong> Key achievements, training milestones, and tournament notes</li>
      </ul>
      <p style="margin-top: 12px; font-size: 12px; color: #a0aec0;">
        You can add multiple past and current academies if you have trained at different institutions.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://kalawarfederation.org/profile" class="btn">
        Fill Academic History in Profile &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        Once you submit your academic history, your profile state will automatically transition to <strong>Pending</strong> for official federation verification.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `⚠️ Please Complete Your Profile by filling your Academic history (${memberId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 8. Send Confirmation Email when Academic History is submitted (Status shifted to Pending)
 */
export async function sendProfileSubmittedPendingEmail(
  email: string,
  name: string,
  memberId: string,
  academyCount: number = 1
) {
  const html = wrapEmailTemplate(
    "Academic History Received · Status Pending Verification",
    `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(66, 153, 225, 0.2); color: #63b3ed; border-color: rgba(66, 153, 225, 0.4);">
        Profile Updated · Status: Pending
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px;">Academic Transfer History Received</h2>
      <p style="color: #a0aec0; font-size: 13px; line-height: 1.6;">
        Dear <strong>${name}</strong>,<br/>
        Thank you for submitting your Academic Transfer History (<strong>${academyCount}</strong> ${academyCount === 1 ? "academy record" : "academy records"}). Your official athlete registration state has successfully shifted from <strong style="color: #ed8936;">Incomplete</strong> to <strong style="color: #63b3ed;">Pending Verification</strong>.
      </p>
    </div>

    <div class="card" style="border-left: 4px solid #63b3ed;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Status Progression</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Member ID:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${memberId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Current Status:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #63b3ed;">⏳ Pending Verification</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Academies Listed:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${academyCount} Recorded</td>
        </tr>
      </table>
    </div>

    <p style="color: #a0aec0; font-size: 12px; line-height: 1.6;">
      The Federation Accreditation Committee &amp; Secretariat are reviewing your credentials. You will be notified once your athlete ID is fully activated.
    </p>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="https://kalawarfederation.org/profile" class="btn">
        View My Profile Portal &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `📋 Academic History Received: Status Shifted to Pending (${memberId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 9. Send Dan Grading Payment Confirmation Slip Email (Upon registration / payment)
 */
export interface SendDanPaymentConfirmationSlipEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  trackingId: string;
  appliedDanTitle: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  currentBeltTitle: string;
  academyName: string;
  state: string;
  instructorName: string;
  date: string;
  password?: string;
  isNewAccount?: boolean;
}

export async function sendDanPaymentConfirmationSlipEmail({
  email,
  candidateName,
  athleteId,
  trackingId,
  appliedDanTitle,
  amount,
  paymentMethod,
  paymentStatus,
  currentBeltTitle,
  academyName,
  state,
  instructorName,
  date,
  password,
  isNewAccount = false,
}: SendDanPaymentConfirmationSlipEmailParams) {
  const downloadUrl = `https://kalawarfederation.org/dan-grading?track=${encodeURIComponent(trackingId)}&tab=tracker`;
  const loginUrl = `https://kalawarfederation.org/login?redirect=${encodeURIComponent(`/dan-grading?track=${trackingId}&tab=tracker`)}`;

  const credentialsBlock = password
    ? `
    <!-- Credentials Box (ID & Password) -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px 0; color: #f6e05e; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        🔐 Your Official Account Login Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 40%;">Official Member / Athlete ID:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #d4af37; font-family: monospace; font-size: 14px;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Login Email:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Account Password:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #34d399; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Member Classification:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">Player / Dan Candidate</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; border-top: 1px solid #2d3748; padding-top: 10px;">
        ℹ️ You are automatically logged in. In future sessions, you can sign in at <a href="${loginUrl}" style="color: #d4af37;">kalawarfederation.org/login</a> using your <strong>Email</strong> and password.
      </p>
    </div>`
    : "";

  const html = wrapEmailTemplate(
    "Dan Examination Registration Confirmed",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.35);">
        ✓ Registration Confirmed &amp; Logged
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        Registration Confirmation Slip
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        Your examination registration for <strong>${appliedDanTitle}</strong> has been successfully received and recorded in the federation examination ledger.
      </p>
    </div>

    ${credentialsBlock}

    <!-- Details Card -->
    <div class="card" style="border-left: 4px solid #d4af37; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Official Registration Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Tracking ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Current Rank:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${currentBeltTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Applied Dan Rank:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #f6e05e;">🥋 ${appliedDanTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Academy / Dojang:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${academyName}, ${state}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Instructor / Master:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${instructorName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Registration Date:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Registration Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #34d399;">✓ CONFIRMED (Under Technical Review)</td>
        </tr>
      </table>
    </div>

    <!-- Review Notice Card -->
    <div class="card" style="border-left: 4px solid #38bdf8; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Next Step: Technical Committee Verification &amp; Admit Card
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        The Technical Examination Committee is auditing your prerequisite belt tenure and submitted verification proofs. Once approved, your <strong>Official Examination Admit Card &amp; Hall Ticket</strong> will be issued with the confirmed Date of Exam and Venue Address, and you will receive an automated email alert.
      </p>
    </div>

    <!-- Download CTA Button -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <a href="${downloadUrl}" class="btn" style="padding: 12px 28px; font-size: 13px;">
        View &amp; Download Registration Slip PDF &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Dan Examination Registration Confirmed (${trackingId}) - ${FED_NAME}`,
    html,
  });
}

export const sendDanRegistrationConfirmationSlipEmail = sendDanPaymentConfirmationSlipEmail;

/**
 * 10. Send Dan Grading Admit Card Issued Notification Email (Upon Admin Approval)
 */
export interface SendDanAdmitCardIssuedEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  trackingId: string;
  appliedDanTitle: string;
  examSessionTitle?: string;
  sessionDate: string;
  sessionVenue: string;
  reportingTime?: string;
  amount?: number;
}

export async function sendDanCashPaymentApprovedEmail(params: SendDanAdmitCardIssuedEmailParams) {
  return sendDanAdmitCardIssuedEmail(params);
}

export async function sendDanAdmitCardIssuedEmail({
  email,
  candidateName,
  athleteId,
  trackingId,
  appliedDanTitle,
  examSessionTitle = "National Black Belt & Dan Grading Examination",
  sessionDate,
  sessionVenue,
  reportingTime = "07:30 AM",
}: SendDanAdmitCardIssuedEmailParams) {
  const downloadUrl = `https://kalawarfederation.org/dan-grading?track=${encodeURIComponent(trackingId)}&tab=tracker`;

  const html = wrapEmailTemplate(
    "Dan Examination Admit Card Issued",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.35);">
        ✓ Admit Card Officially Issued
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        Dan Examination Admit Card Issued!
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        The Technical Examination Board &amp; Secretariat have verified your registration and officially approved your candidacy. Your <strong>Official Examination Admit Card &amp; Hall Ticket</strong> is now issued.
      </p>
    </div>

    <!-- Approved Details Card -->
    <div class="card" style="border-left: 4px solid #34d399; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Examination Schedule &amp; Candidate Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Tracking ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Applied Dan Rank:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">🥋 ${appliedDanTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Date of Examination:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #f6e05e;">📅 ${sessionDate}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Reporting Time:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">⏰ ${reportingTime}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Address of Examination:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">📍 ${sessionVenue}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Candidate Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #34d399;">✓ APPROVED &amp; ADMIT CARD ISSUED</td>
        </tr>
      </table>
    </div>

    <!-- Instructions Card -->
    <div class="card" style="border-left: 4px solid #d4af37; background: #0f1218;">
      <p style="margin: 0 0 8px 0; color: #d4af37; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Important Examination Mandates:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        <li>Please download and print your official Admit Card using the link below.</li>
        <li>Carry your printed Admit Card and original Aadhaar Card / National Photo ID to the exam venue.</li>
        <li>Report in full clean Dobok/Uniform 45 minutes prior to commencement with full safety gear.</li>
        <li>Candidates for 4th Dan &amp; above must bring 2 printed bound copies of their Master Research Thesis.</li>
      </ul>
    </div>

    <!-- Download CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${downloadUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        Download Official Admit Card PDF &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        You can also track your status anytime at <a href="https://kalawarfederation.org/dan-grading" style="color: #d4af37;">kalawarfederation.org/dan-grading</a> using Tracking ID: <strong>${trackingId}</strong> or Athlete ID: <strong>${athleteId}</strong>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Dan Examination Admit Card Issued (${trackingId} · ${athleteId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 10B. Send Dan Grading Certificate & Diploma Conferred Notification Email (Upon Result Passed)
 */
export interface SendDanCertificateIssuedEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  certificateNumber: string;
  idCardNumber?: string;
  danRankTitle: string;
  score?: number;
  grade?: string;
  issueDate?: string;
}

export async function sendDanCertificateIssuedEmail({
  email,
  candidateName,
  athleteId,
  certificateNumber,
  idCardNumber = "",
  danRankTitle,
  score,
  grade = "A (Distinction)",
  issueDate = new Date().toISOString().split("T")[0],
}: SendDanCertificateIssuedEmailParams) {
  const diplomaUrl = `https://kalawarfederation.org/certificates/dan/${encodeURIComponent(certificateNumber)}`;
  const idCardUrl = `https://kalawarfederation.org/id-cards/dan/${encodeURIComponent(certificateNumber)}`;

  const html = wrapEmailTemplate(
    "Official Black Belt Dan Diploma Conferred",
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(212, 175, 55, 0.2); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.4); padding: 5px 16px;">
        ★ Dan Examination Conferred &amp; Ratified ★
      </span>
      <h2 style="color: #ffffff; margin-top: 14px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">
        Congratulations! Black Belt Diploma Conferred
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; max-width: 500px; margin: 8px auto 0 auto; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        The National Black Belt Council &amp; Technical Examination Board of <strong>${FED_NAME}</strong> have officially ratified your Dan examination results and conferred your Black Belt rank.
      </p>
    </div>

    <!-- Official Conferral Card -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 22px; border-radius: 14px;">
      <p style="margin: 0 0 12px 0; color: #d4af37; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; text-align: center;">
        Official Federation Black Belt Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Conferred Dan Rank:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #f6e05e; font-size: 14px;">🥋 ${danRankTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Diploma Certificate No:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${certificateNumber}</td>
        </tr>
        ${idCardNumber ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Official Dan ID Card No:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${idCardNumber}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        ${score !== undefined ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Evaluation Score &amp; Grade:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #34d399;">${score} / 100 (${grade})</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Date of Ratification:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${issueDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Credential Status:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #34d399;">✓ PERMANENT FEDERATION RECORD</td>
        </tr>
      </table>
    </div>

    <!-- Actions Box -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${diplomaUrl}" class="btn" style="padding: 13px 28px; font-size: 13px; margin-right: 8px;">
        View Official 12x16 Dan Diploma &rarr;
      </a>
      <a href="${idCardUrl}" class="btn" style="padding: 13px 28px; font-size: 13px; background: #2d3748; color: #ffffff; border: 1px solid #4a5568;">
        View Official Dan ID Card &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        You can also verify and view credentials online at any time via <a href="https://kalawarfederation.org/dan-grading?tab=verify" style="color: #d4af37;">kalawarfederation.org/dan-grading</a>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Official Dan Diploma & Black Belt Credential Conferred (${certificateNumber}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 9B. Send Dan Examination Documents Required / Re-upload Request Notification Email
 */
export interface SendDanDocumentsRequiredEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  trackingId: string;
  appliedDanTitle: string;
  remarks?: string;
}

export async function sendDanDocumentsRequiredEmail({
  email,
  candidateName,
  athleteId,
  trackingId,
  appliedDanTitle,
  remarks = "Additional or clearer verification documents are required by the Technical Committee.",
}: SendDanDocumentsRequiredEmailParams) {
  const uploadUrl = `https://kalawarfederation.org/dan-grading?track=${encodeURIComponent(trackingId)}&tab=tracker`;

  const html = wrapEmailTemplate(
    "Action Required · Additional Documents Requested",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.35);">
        ⚠️ Action Required · Document Re-upload Requested
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        Dan Grading Document Update Needed
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        The Federation Technical Examination Board has reviewed your application for <strong>${appliedDanTitle}</strong>. Before your registration can be approved and your official Admit Card issued, you are requested to re-upload or update specific verification documents.
      </p>
    </div>

    <!-- Committee Remarks Card -->
    <div class="card" style="border-left: 4px solid #f59e0b; margin-bottom: 20px; background: #14110b;">
      <p style="margin: 0 0 8px 0; color: #f59e0b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Technical Committee Instructions &amp; Missing Documents:
      </p>
      <div style="color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1.6; background: rgba(0, 0, 0, 0.3); padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.25);">
        "${remarks}"
      </div>
    </div>

    <!-- Candidate & Application Details Card -->
    <div class="card" style="border-left: 4px solid #d4af37; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Application Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Tracking ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Target Applied Rank:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">🥋 ${appliedDanTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #f59e0b;">⏳ DOCUMENTS REQUIRED (ACTION PENDING)</td>
        </tr>
      </table>
    </div>

    <!-- How to Re-upload Guide -->
    <div class="card" style="border-left: 4px solid #38bdf8; background: #0c1520;">
      <p style="margin: 0 0 8px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        How to Submit Your Updated Documents:
      </p>
      <ol style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        <li>Click the button below to open your live <strong>Dan Examination Tracker</strong>.</li>
        <li>Review the requested documents under the <strong>Re-upload Documents</strong> section.</li>
        <li>Attach clear, legible PDF or high-resolution image copies (max 8MB).</li>
        <li>Click <strong>"Submit Updated Documents"</strong> to instantly return your application to the Technical Committee for final verification.</li>
      </ol>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${uploadUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px; background: linear-gradient(135deg, #f59e0b, #d4af37); color: #000000; font-weight: 800;">
        Re-upload Documents &amp; Update Application &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        You can also visit <a href="https://kalawarfederation.org/dan-grading" style="color: #d4af37;">kalawarfederation.org/dan-grading</a> and search using your Tracking ID: <strong>${trackingId}</strong> or Athlete ID: <strong>${athleteId}</strong>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `📄 Action Required: Additional Documents Requested (${trackingId} · ${athleteId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 9B. Send Dan Grading Application Under Review Email
 */
export interface SendDanUnderReviewEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  trackingId: string;
  appliedDanTitle: string;
  remarks?: string;
}

export async function sendDanUnderReviewEmail({
  email,
  candidateName,
  athleteId,
  trackingId,
  appliedDanTitle,
  remarks,
}: SendDanUnderReviewEmailParams) {
  const portalUrl = `https://kalawarfederation.org/dan-grading?track=${encodeURIComponent(trackingId)}&tab=tracker`;

  const html = wrapEmailTemplate(
    "Application Under Technical Committee Review",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(6, 182, 212, 0.15); color: #06b6d4; border-color: rgba(6, 182, 212, 0.35);">
        🔍 Application Under Technical Review &amp; Scrutiny
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        Dan Grading Application Under Review
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        Your candidate credentials and documents for <strong>${appliedDanTitle}</strong> are currently under active technical scrutiny by the Federation Examination Board.
      </p>
    </div>

    <!-- Details Card -->
    <div class="card" style="border-left: 4px solid #06b6d4; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Application Status Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Tracking ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Target Applied Rank:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">🥋 ${appliedDanTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Current Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #06b6d4;">⏳ UNDER VERIFICATION &amp; BOARD SCRUTINY</td>
        </tr>
      </table>
    </div>

    ${remarks
      ? `
    <div class="card" style="border-left: 4px solid #d4af37; margin-bottom: 20px; background: #14110b;">
      <p style="margin: 0 0 8px 0; color: #d4af37; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Technical Committee Remarks:
      </p>
      <div style="color: #ffffff; font-size: 13px; line-height: 1.6;">
        "${remarks}"
      </div>
    </div>
    `
      : ""
    }

    <!-- Next Steps Card -->
    <div class="card" style="border-left: 4px solid #38bdf8; background: #0c1520; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        What Happens Next:
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        The Technical Examination Board is verifying your prerequisite belt tenure and submitted proofs. Once approved, your confirmed <strong>Date of Exam</strong>, <strong>Reporting Time</strong>, and <strong>Venue Address</strong> will be assigned, and your official <strong>Examination Admit Card</strong> will be issued.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${portalUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        Track Live Status in Candidate Portal &rarr;
      </a>
      <p style="color: #718096; font-size: 11px; margin-top: 14px; line-height: 1.5;">
        You can check live grading updates anytime at <a href="https://kalawarfederation.org/dan-grading" style="color: #d4af37;">kalawarfederation.org/dan-grading</a>.
      </p>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🔍 Application Under Review (${trackingId} · ${athleteId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 10. Send Belt Examination Candidate Registration Slip Email
 */
export interface SendBeltExamRegistrationSlipEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  candidateId: string;
  targetBelt: string;
  currentBelt?: string;
  registrationSlipId?: string;
  academyName?: string;
  examSessionTitle?: string;
  sessionDate?: string;
  sessionVenue?: string;
  reportingTime?: string;
  password?: string;
  isNewAccount?: boolean;
}

export async function sendBeltExamRegistrationSlipEmail({
  email,
  candidateName,
  athleteId,
  candidateId,
  targetBelt,
  currentBelt = "Current Belt",
  registrationSlipId,
  academyName = "Federation Martial Arts Academy",
  examSessionTitle = "National Belt Grading Examination",
  sessionDate = "Scheduled Official Exam Date",
  sessionVenue = "Federation Sports Arena",
  reportingTime = "08:00 AM",
  password,
  isNewAccount = false,
}: SendBeltExamRegistrationSlipEmailParams) {
  const slipId = registrationSlipId || `KAC-BELT-REG-${new Date().getFullYear()}-${candidateId.split("-").pop() || "001"}`;
  const portalUrl = `https://kalawarfederation.org/belt-exams?candidate=${encodeURIComponent(candidateId)}`;
  const loginUrl = `https://kalawarfederation.org/login?redirect=${encodeURIComponent(`/belt-exams?candidate=${candidateId}`)}`;

  const credentialsBlock = password
    ? `
    <!-- Credentials Box (ID & Password) -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px 0; color: #f6e05e; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        🔐 Your Official Account Login Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 40%;">Official Member / Athlete ID:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #d4af37; font-family: monospace; font-size: 14px;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Login Email:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Account Password:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #34d399; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Member Classification:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">Player / Belt Candidate</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; border-top: 1px solid #2d3748; padding-top: 10px;">
        ℹ️ You are automatically logged in. In future sessions, you can sign in at <a href="${loginUrl}" style="color: #d4af37;">kalawarfederation.org/login</a> using your <strong>Email</strong> and password.
      </p>
    </div>`
    : "";

  const html = wrapEmailTemplate(
    "Belt Examination Registration Slip · Application Submitted",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(212, 175, 55, 0.15); color: #d4af37; border-color: rgba(212, 175, 55, 0.35);">
        ✓ Application Submitted · Registration Slip Generated
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        Belt Examination Registration Received
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Student ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        Your candidate registration for the upcoming Belt Grading Examination has been successfully recorded in the National Secretariat Registry. Your official registration slip details are below.
      </p>
    </div>

    ${credentialsBlock}

    <!-- Registration Summary Card -->
    <div class="card" style="border-left: 4px solid #d4af37; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Candidate Registration Summary
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Registration Slip No:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${slipId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Candidate Roll No:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${candidateId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Current &amp; Target Belt:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${currentBelt} &rarr; 🥋 ${targetBelt}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Affiliated Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${academyName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Exam Session:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${examSessionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Examination Date:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #f6e05e;">${sessionDate} · ${reportingTime}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Venue:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${sessionVenue}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #f59e0b;">⏳ UNDER ADMIN SCRUTINY FOR ADMIT CARD</td>
        </tr>
      </table>
    </div>

    <!-- Next Steps Card -->
    <div class="card" style="border-left: 4px solid #3b82f6; background: #0f1218;">
      <p style="margin: 0 0 8px 0; color: #60a5fa; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Next Stage in Examination Workflow:
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        The Technical Committee Secretariat will review candidate credentials. Once approved, your <strong>Official Admit Card &amp; Hall Ticket</strong> will be issued and emailed to you.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${portalUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        Track Examination Status &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Belt Examination Registration Slip (${candidateId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 11. Send Belt Examination Admit Card Issued Email
 */
export interface SendBeltExamAdmitCardIssuedEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  candidateId: string;
  admitCardNumber?: string;
  targetBelt: string;
  academyName?: string;
  examSessionTitle?: string;
  sessionDate?: string;
  sessionVenue?: string;
  reportingTime?: string;
}

export async function sendBeltExamAdmitCardIssuedEmail({
  email,
  candidateName,
  athleteId,
  candidateId,
  admitCardNumber,
  targetBelt,
  academyName = "Federation Martial Arts Academy",
  examSessionTitle = "National Belt Grading Examination",
  sessionDate = "Scheduled Official Exam Date",
  sessionVenue = "Federation Sports Arena",
  reportingTime = "08:00 AM",
}: SendBeltExamAdmitCardIssuedEmailParams) {
  const admitNo = admitCardNumber || `KAC-BELT-ADM-${new Date().getFullYear()}-${candidateId.split("-").pop() || "001"}`;
  const downloadUrl = `https://kalawarfederation.org/belt-exams?candidate=${encodeURIComponent(candidateId)}`;

  const html = wrapEmailTemplate(
    "Belt Grading Candidate Approved · Admit Card Issued",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.35);">
        ✓ Candidate Approved · Admit Card Generated
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        Belt Examination Admit Card Issued!
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Student ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        The Federation Technical Examination Board has reviewed and approved your application. Your <strong>Official Examination Admit Card &amp; Hall Ticket</strong> is now generated and ready for download.
      </p>
    </div>

    <!-- Approved Details Card -->
    <div class="card" style="border-left: 4px solid #34d399; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Examination &amp; Candidate Summary
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Admit Card Number:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${admitNo}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Candidate Roll No:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${candidateId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Target Belt Grade:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">🥋 ${targetBelt}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Affiliated Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${academyName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Exam Session:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${examSessionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Date &amp; Reporting Time:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #f6e05e;">${sessionDate} · ${reportingTime} (Mandatory 30m Prior)</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Exam Venue:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${sessionVenue}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Candidate Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #34d399;">✓ ADMIT CARD READY FOR DOWNLOAD</td>
        </tr>
      </table>
    </div>

    <!-- Instructions Card -->
    <div class="card" style="border-left: 4px solid #d4af37; background: #0f1218;">
      <p style="margin: 0 0 8px 0; color: #d4af37; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Mandatory Examination Guidelines:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        <li>Please print your official Admit Card and bring it to the examination venue.</li>
        <li>Candidates must wear a clean official Dobok/Gi with current belt tied properly.</li>
        <li>Mandatory safety protective gear (Headgear, Chest Guard, Shin/Forearm, Groin, Mouthguard) is required.</li>
        <li>Reporting at least 30 minutes before reporting time is strictly mandatory.</li>
      </ul>
    </div>

    <!-- Download CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${downloadUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        View &amp; Print Admit Card &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Belt Examination Admit Card Issued (${candidateId}) - ${FED_NAME}`,
    html,
  });
}

/**
 * 12. Send Belt Examination Result Declared Email
 */
export interface SendBeltExamResultDeclaredEmailParams {
  email: string;
  candidateName: string;
  athleteId: string;
  candidateId: string;
  targetBelt: string;
  resultStatus: "Passed" | "Failed" | "Re-test" | "Pending" | string;
  score?: number;
  grade?: string;
  certificateNumber?: string;
  academyName?: string;
  examinerRemarks?: string;
}

export async function sendBeltExamResultDeclaredEmail({
  email,
  candidateName,
  athleteId,
  candidateId,
  targetBelt,
  resultStatus,
  score = 85,
  grade = "Pass",
  certificateNumber,
  academyName = "Federation Martial Arts Academy",
  examinerRemarks,
}: SendBeltExamResultDeclaredEmailParams) {
  const isPassed = resultStatus === "Passed";
  const certUrl = certificateNumber
    ? `https://kalawarfederation.org/certificates/belt/${encodeURIComponent(certificateNumber)}`
    : `https://kalawarfederation.org/belt-exams?candidate=${encodeURIComponent(candidateId)}`;

  const html = wrapEmailTemplate(
    isPassed ? "Belt Examination Result Declared · Promoted!" : "Belt Examination Result Declared",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: ${isPassed ? "rgba(52, 211, 153, 0.15)" : "rgba(239, 68, 68, 0.15)"}; color: ${isPassed ? "#34d399" : "#ef4444"}; border-color: ${isPassed ? "rgba(52, 211, 153, 0.35)" : "rgba(239, 68, 68, 0.35)"};">
        ${isPassed ? "🎉 EXAMINATION PASSED · PROMOTION RATIFIED" : "RESULT DECLARED · RE-TEST REQUIRED"}
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${isPassed ? `Congratulations! You are Promoted to ${targetBelt}` : "Belt Examination Assessment Result"}
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${candidateName}</strong> (Student ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        The official assessment results for the Belt Grading Examination have been declared by the Grandmaster Examination Board.
      </p>
    </div>

    <!-- Result Card -->
    <div class="card" style="border-left: 4px solid ${isPassed ? "#34d399" : "#ef4444"}; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Candidate Roll No:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${candidateId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Target Belt Rank:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37;">🥋 ${targetBelt}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Result Status:</td>
          <td style="padding: 5px 0; font-weight: 800; color: ${isPassed ? "#34d399" : "#ef4444"};">${resultStatus.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Assessment Grade:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${grade} (${score}/100)</td>
        </tr>
        ${certificateNumber ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Certificate No:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${certificateNumber}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${academyName}</td>
        </tr>
        ${examinerRemarks ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Examiner Remarks:</td>
          <td style="padding: 5px 0; color: #cbd5e1; font-style: italic;">"${examinerRemarks}"</td>
        </tr>
        ` : ""}
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${certUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        ${isPassed ? "View & Download Belt Certificate &rarr;" : "View Examination Breakdown &rarr;"}
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🥋 Belt Examination Result Declared: ${resultStatus.toUpperCase()} (${targetBelt}) - ${FED_NAME}`,
    html,
  });
}

// Backwards compatibility alias
export const sendBeltCashPaymentApprovedEmail = sendBeltExamAdmitCardIssuedEmail;
export type SendBeltCashPaymentApprovedEmailParams = SendBeltExamAdmitCardIssuedEmailParams;

/**
 * Dispatches notification when Championship match results are published by the tournament committee.
 */
export async function sendChampionshipResultPublishedEmail({
  to,
  candidateName,
  eventTitle,
  level = "District",
  place = "Participant",
  points = 0,
  notes,
  trackingUrl,
}: {
  to: string;
  candidateName: string;
  eventTitle: string;
  level?: string;
  place?: string;
  points?: number;
  notes?: string;
  trackingUrl?: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const isGold = place.toLowerCase().includes("gold");
  const isSilver = place.toLowerCase().includes("silver");
  const isBronze = place.toLowerCase().includes("bronze");
  const isMedalist = isGold || isSilver || isBronze;

  const medalBadgeColor = isGold ? "#f59e0b" : isSilver ? "#94a3b8" : isBronze ? "#d97706" : "#38bdf8";
  const medalIcon = isGold ? "🥇" : isSilver ? "🥈" : isBronze ? "🥉" : "🏅";
  const medalTitle = isGold ? "Gold Medalist" : isSilver ? "Silver Medalist" : isBronze ? "Bronze Medalist" : "Official Participant";

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarindia.org";
  const portalLink = trackingUrl || `${appOrigin}/championship/register`;

  const html = wrapEmailTemplate(
    `Tournament Match Result: ${medalTitle} (${level} Championship)`,
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        🏆 Official Match Result Ratified
      </div>
      <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
        ${eventTitle}
      </h2>
      <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 600;">
        ${level.toUpperCase()} LEVEL CHAMPIONSHIP
      </p>
    </div>

    <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
      Dear <strong style="color: #ffffff;">${candidateName}</strong>,
    </p>

    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.7; margin-bottom: 22px;">
      The Tournament Adjudication &amp; Technical Committee of <strong>${FED_NAME}</strong> has reviewed, validated, and officially published your performance results for the <strong>${eventTitle}</strong>.
    </p>

    <!-- Placement Box -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95)); border: 2px solid ${medalBadgeColor}; border-radius: 16px; padding: 22px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 38px; margin-bottom: 6px;">${medalIcon}</div>
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">
        Official Podium Placement
      </div>
      <div style="font-size: 22px; font-weight: 900; color: ${medalBadgeColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        ${place === "Participant" ? "Official Participation" : `${place} Medal`}
      </div>

      <div style="display: inline-block; padding: 4px 16px; border-radius: 10px; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 12px; font-weight: 700; color: #f1f5f9;">
        Ranking Points Awarded: <strong style="color: #fbbf24;">${points} pts</strong>
      </div>
    </div>

    ${notes ? `
    <!-- Special Technical Notes -->
    <div style="background-color: #14171d; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px;">
        📝 Special Technical Notes / Bout Score
      </h4>
      <p style="margin: 0; font-size: 12.5px; color: #e2e8f0; line-height: 1.6; font-style: italic;">
        "${notes}"
      </p>
    </div>
    ` : ""}

    <!-- Action Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${portalLink}" style="display: inline-block; padding: 14px 32px; border-radius: 30px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000000; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
        Access Candidate Tracking Portal &rarr;
      </a>
    </div>

    <p style="color: #64748b; font-size: 11.5px; text-align: center; margin-top: 24px; line-height: 1.6;">
      You can track match rankings, download your competitor slip, and review published results directly on the Candidate Portal.
    </p>
    `
  );

  return sendEmail({
    to,
    subject: `🏆 Match Result Published: ${place} (${level} Championship) - ${FED_NAME}`,
    html,
  });
}

/**
 * Dispatches notification when an official QR-verified Championship Certificate is issued.
 */
export async function sendChampionshipCertificateIssuedEmail({
  to,
  candidateName,
  eventTitle,
  level = "District",
  awardType = "Participation & Merit",
  certificateNumber,
  verifyUrl,
  portalUrl,
}: {
  to: string;
  candidateName: string;
  eventTitle: string;
  level?: string;
  awardType?: string;
  certificateNumber: string;
  verifyUrl?: string;
  portalUrl?: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarindia.org";
  const certVerifyLink = verifyUrl || `${appOrigin}/certificates/championship/${encodeURIComponent(certificateNumber)}`;
  const candidatePortalLink = portalUrl || `${appOrigin}/championship/register`;
  const myCertsLink = `${appOrigin}/my-certificates`;

  const html = wrapEmailTemplate(
    `Official Championship Diploma Issued - ${certificateNumber}`,
    `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        🛡️ National Registry Credential Conferred
      </div>
      <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
        Certificate of Championship Excellence
      </h2>
      <p style="margin: 0; font-size: 13px; color: #fbbf24; font-weight: 700;">
        ${level.toUpperCase()} LEVEL CHAMPIONSHIP &bull; ${awardType.toUpperCase()}
      </p>
    </div>

    <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
      Dear <strong style="color: #ffffff;">${candidateName}</strong>,
    </p>

    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.7; margin-bottom: 22px;">
      Congratulations! <strong>${FED_NAME}</strong> has officially issued your QR-verified Championship Diploma for distinguished achievement in the <strong>${eventTitle}</strong>.
    </p>

    <!-- Certificate Details Box -->
    <div style="background-color: #14171d; border: 1px solid #334155; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Certificate Serial No:</td>
          <td style="padding: 6px 0; color: #f59e0b; font-weight: 800; font-family: monospace; text-align: right;">${certificateNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Tournament:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 700; text-align: right;">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Championship Tier:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-weight: 700; text-align: right;">${level} Level</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Award Conferred:</td>
          <td style="padding: 6px 0; color: #34d399; font-weight: 800; text-align: right;">${awardType}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Verification Status:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; text-align: right;">✓ QR Authenticated</td>
        </tr>
      </table>
    </div>

    <!-- Multi-Portal Access Guide -->
    <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 18px; margin-bottom: 26px;">
      <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #e2e8f0; letter-spacing: 0.5px;">
        📲 Where Can You View &amp; Download Your Certificate?
      </h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #94a3b8; line-height: 1.8;">
        <li><strong style="color: #cbd5e1;">1. Candidate Portal:</strong> Access your secure candidate session at <a href="${candidatePortalLink}" style="color: #fbbf24; text-decoration: none;">Track Registration &amp; Candidate Portal</a> with OTP authentication to view or print your diploma.</li>
        <li><strong style="color: #cbd5e1;">2. Member Dashboard:</strong> If you have an active account under <strong>Player, Referee, Coach, or Club</strong>, log in and visit your <a href="${myCertsLink}" style="color: #38bdf8; text-decoration: none;">My Certificates</a> tab to view and download all your federation credentials.</li>
        <li><strong style="color: #cbd5e1;">3. Public QR Verification:</strong> Anyone scanning your certificate's QR code can verify its authenticity on the national registry.</li>
      </ul>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${certVerifyLink}" style="display: inline-block; padding: 14px 32px; border-radius: 30px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
        View &amp; Verify Official Certificate &rarr;
      </a>
    </div>

    <p style="color: #64748b; font-size: 11.5px; text-align: center; margin-top: 24px; line-height: 1.6;">
      Issued under the seal of the National Championship Board &bull; ${FED_NAME}
    </p>
    `
  );

  return sendEmail({
    to,
    subject: `📜 Official Certificate Conferred: ${certificateNumber} (${level} Championship) - ${FED_NAME}`,
    html,
  });
}

/**
 * 12. Send Championship Registration Confirmation Email (with Credentials if newly created)
 */
export interface SendChampionshipRegistrationConfirmationEmailParams {
  email: string;
  applicantName: string;
  athleteId: string;
  trackingId: string;
  eventTitle: string;
  eventDate?: string;
  eventVenue?: string;
  eventCity?: string;
  discipline?: string;
  ageDivision?: string;
  weightCategory?: string;
  beltRank?: string;
  clubName?: string;
  password?: string;
  isNewAccount?: boolean;
}

export async function sendChampionshipRegistrationConfirmationEmail({
  email,
  applicantName,
  athleteId,
  trackingId,
  eventTitle,
  eventDate,
  eventVenue,
  eventCity,
  discipline = "Kalawar Kaya Yuddha",
  ageDivision = "Senior",
  weightCategory = "Open Weight",
  beltRank = "Registered Grade",
  clubName = "Direct Entry",
  password,
  isNewAccount = false,
}: SendChampionshipRegistrationConfirmationEmailParams) {
  const portalUrl = `https://kalawarfederation.org/championship/register?tab=track&trackingId=${encodeURIComponent(trackingId)}`;
  const loginUrl = `https://kalawarfederation.org/login?redirect=${encodeURIComponent(`/championship/register?tab=track&trackingId=${trackingId}`)}`;

  const credentialsBlock = password
    ? `
    <!-- Credentials Box (ID & Password) -->
    <div class="card" style="border: 2px solid #d4af37; background: linear-gradient(135deg, #181d26 0%, #11141a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px 0; color: #f6e05e; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        🔐 Your Official Account Login Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 40%;">Official Member / Athlete ID:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #d4af37; font-family: monospace; font-size: 14px;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Login Email:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Account Password:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #34d399; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Member Classification:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">Player / Athlete</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; border-top: 1px solid #2d3748; padding-top: 10px;">
        ℹ️ You are automatically logged in. In future sessions, you can sign in at <a href="${loginUrl}" style="color: #d4af37;">kalawarfederation.org/login</a> using your <strong>Email</strong> and password.
      </p>
    </div>`
    : "";

  const venueDisplay = eventVenue ? `${eventVenue}${eventCity ? `, ${eventCity}` : ""}` : eventCity || "National Federation Arena";

  const html = wrapEmailTemplate(
    "Championship Registration Confirmed",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.35);">
        🏆 Championship Registration Logged
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        Championship Registration Confirmed
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${applicantName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        Your championship entry for <strong>${eventTitle}</strong> has been successfully received and recorded in the National Championship Registry.
      </p>
    </div>

    ${credentialsBlock}

    <!-- Details Card -->
    <div class="card" style="border-left: 4px solid #d4af37; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Championship Entry Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Reference / Tracking ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete / Competitor ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Tournament / Event:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${eventTitle}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Scheduled Dates:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #f6e05e;">${eventDate}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Venue &amp; Location:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${venueDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Discipline:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${discipline}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Division &amp; Weight:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${ageDivision} &bull; ${weightCategory}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Belt Grade:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${beltRank}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Club / Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${clubName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #34d399;">✓ REGISTERED (Under Technical Scrutiny &amp; Verification)</td>
        </tr>
      </table>
    </div>

    <!-- Review Notice Card -->
    <div class="card" style="border-left: 4px solid #38bdf8; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Next Step: Technical Committee Verification &amp; Competitor Pass
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        The Technical Championship Committee is reviewing your registration documents. Once approved, your <strong>Official Championship Admit Card / Competitor Pass with BIB Number</strong> will be issued, and you can download it directly from the Candidate Portal.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <a href="${portalUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        Track Championship Application &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to: email,
    subject: `🏆 Championship Registration Confirmed (${trackingId}) - ${FED_NAME}`,
    html,
  });
}

export interface SendChampionshipApplicationApprovedEmailParams {
  to: string;
  applicantName: string;
  athleteId: string;
  bibNumber: string;
  eventTitle: string;
  eventDate?: string;
  eventVenue?: string;
  eventCity?: string;
  discipline?: string;
  ageDivision?: string;
  weightCategory?: string;
  beltRank?: string;
  clubName?: string;
  level?: string;
  idCardUrl?: string;
}

/**
 * Sends official notification when a Championship application is APPROVED and Championship ID Card is issued.
 */
export async function sendChampionshipApplicationApprovedEmail({
  to,
  applicantName,
  athleteId,
  bibNumber,
  eventTitle,
  eventDate,
  eventVenue,
  eventCity,
  discipline,
  ageDivision,
  weightCategory,
  beltRank,
  clubName,
  level = "District",
  idCardUrl,
}: SendChampionshipApplicationApprovedEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarindia.org";
  const passUrl = idCardUrl || `${appOrigin}/my-id-card`;
  const venueDisplay = eventVenue ? `${eventVenue}${eventCity ? `, ${eventCity}` : ""}` : eventCity || "Federation Championship Arena";

  const html = wrapEmailTemplate(
    `Championship Entry Approved: ${eventTitle} (BIB: ${bibNumber})`,
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border-color: rgba(52, 211, 153, 0.35);">
        ✓ Official Entry Approved &amp; ID Card Issued
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        Championship Application Approved
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${applicantName}</strong> (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>),<br/>
        Congratulations! The Championship Adjudication &amp; Technical Committee has verified your credentials and <strong>APPROVED</strong> your entry for <strong>${eventTitle}</strong>.
      </p>
    </div>

    <!-- Bib & Accreditation Box -->
    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.95)); border: 2px solid #d4af37; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 22px;">
      <p style="color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin: 0 0 6px 0;">Official Assigned Competitor Number</p>
      <div style="font-size: 32px; font-weight: 900; color: #d4af37; font-family: monospace; letter-spacing: 2px;">
        ${bibNumber}
      </div>
      <div style="margin-top: 8px; font-size: 12px; color: #34d399; font-weight: 700;">
        🪪 Official Championship ID Card / Competitor Pass is now ACTIVE
      </div>
    </div>

    <!-- Particulars Table -->
    <div class="card" style="border-left: 4px solid #34d399; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Confirmed Competition Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Tournament / Event:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${eventTitle} (${level} Level)</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Competitor Bib:</td>
          <td style="padding: 5px 0; font-weight: 800; color: #d4af37; font-family: monospace;">${bibNumber}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Athlete ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-family: monospace;">${athleteId}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Event Dates:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #f6e05e;">${eventDate}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Venue:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${venueDisplay}</td>
        </tr>
        ${discipline ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Discipline:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${discipline}</td>
        </tr>` : ""}
        ${ageDivision || weightCategory ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Division &amp; Weight:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${ageDivision || ""} ${weightCategory ? `&bull; ${weightCategory}` : ""}</td>
        </tr>` : ""}
        ${beltRank ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Belt Grade:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${beltRank}</td>
        </tr>` : ""}
        ${clubName ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Academy / Club:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${clubName}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Accreditation Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #34d399;">✓ APPROVED &amp; ACCREDITED</td>
        </tr>
      </table>
    </div>

    <!-- Instructions Card -->
    <div class="card" style="border-left: 4px solid #d4af37; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #d4af37; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Important Instructions for Tournament Day:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.7;">
        <li>Please produce your <strong>Official Championship ID Card</strong> at the accreditation and weigh-in desk.</li>
        <li>You can access and download your 2-Page Print-Ready ID card directly from your Member Portal anytime.</li>
        <li>Keep your official Bib Number ready for match calls and bout reporting.</li>
      </ul>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <a href="${passUrl}" class="btn" style="padding: 14px 32px; font-size: 14px; letter-spacing: 0.5px;">
        🪪 View &amp; Download My Championship ID Card &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to,
    subject: `🥋 Championship Entry Approved & ID Card Issued: ${eventTitle} (${bibNumber}) - ${FED_NAME}`,
    html,
  });
}

export interface SendChampionshipApplicationRejectedEmailParams {
  to: string;
  applicantName: string;
  athleteId?: string;
  trackingId?: string;
  eventTitle: string;
  rejectionReason?: string;
  discipline?: string;
  level?: string;
  reapplyUrl?: string;
}

/**
 * Sends official notification when a Championship application is REJECTED.
 */
export async function sendChampionshipApplicationRejectedEmail({
  to,
  applicantName,
  athleteId,
  trackingId,
  eventTitle,
  rejectionReason = "Document verification incomplete or qualification criteria not met.",
  discipline,
  level = "District",
  reapplyUrl,
}: SendChampionshipApplicationRejectedEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarindia.org";
  const contactLink = reapplyUrl || `${appOrigin}/contact`;

  const html = wrapEmailTemplate(
    `Championship Application Update: ${eventTitle}`,
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.35);">
        ⚠️ Application Status Update
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        Application Not Approved
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${applicantName}</strong>${athleteId ? ` (Athlete ID: <strong style="color: #d4af37; font-family: monospace;">${athleteId}</strong>)` : ""},<br/>
        We regret to inform you that your application for the <strong>${eventTitle}</strong> (${level} Championship) could not be approved at this time.
      </p>
    </div>

    <!-- Reason Box -->
    <div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05); margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #f87171; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Committee Review Remarks / Reason for Rejection:
      </p>
      <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.6; font-weight: 600;">
        ${rejectionReason}
      </p>
    </div>

    <!-- Application Summary -->
    <div class="card" style="border-left: 4px solid #64748b; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Application Reference
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${trackingId ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Tracking Reference ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #d4af37; font-family: monospace;">${trackingId}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Championship / Tournament:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${eventTitle}</td>
        </tr>
        ${discipline ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Discipline:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${discipline}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Current Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #f87171;">❌ REJECTED / DISQUALIFIED</td>
        </tr>
      </table>
    </div>

    <!-- Assistance Box -->
    <div class="card" style="border-left: 4px solid #38bdf8; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Need Clarification or Want to Re-Apply?
      </p>
      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        If you believe this was in error or you have updated documents (e.g., medical fitness, age proof, or club authorization), please contact our Secretariat Desk or re-submit your registration before the deadline.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <a href="${contactLink}" class="btn" style="background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%); color: #000000; padding: 12px 28px; font-size: 13px;">
        Contact Federation Helpdesk &rarr;
      </a>
    </div>
    `
  );

  return sendEmail({
    to,
    subject: `⚠️ Championship Application Update: ${eventTitle} - ${FED_NAME}`,
    html,
  });
}

/**
 * Dispatches formal Referee Registration Confirmation & Credentials Email
 */
export async function sendRefereeRegistrationConfirmationEmail(options: {
  to: string;
  applicantName: string;
  refereeId: string;
  password?: string;
  appliedLevel: string;
  currentRank: string;
  state: string;
  district?: string;
  academy?: string;
  kalawarId?: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const {
    to,
    applicantName,
    refereeId,
    password,
    appliedLevel,
    currentRank,
    state,
    district = "",
    academy = "",
    kalawarId = "",
  } = options;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarfederation.org";
  const directoryLink = `${siteUrl}/referees`;
  const verificationLink = `${siteUrl}/referees?verify=${encodeURIComponent(refereeId)}`;
  const loginLink = `${siteUrl}/login`;

  const html = wrapEmailTemplate(
    "Referee Registration & Account Credentials",
    `
    <div style="text-align: center; margin-bottom: 22px;">
      <span class="badge" style="background-color: rgba(217, 119, 6, 0.15); color: #fbbf24; border-color: rgba(217, 119, 6, 0.35);">
        🧑‍⚖️ Technical Official Registration
      </span>
      <h2 style="color: #ffffff; margin-top: 12px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        Referee Application & Account Created
      </h2>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
        Dear <strong>${applicantName}</strong>,<br/>
        Your application for accreditation under the <strong>National Technical & Examination Committee</strong> has been successfully registered. Your dedicated Referee account is active.
      </p>
    </div>

    <!-- Credentials Callout Box -->
    <div class="card" style="border-left: 4px solid #d4af37; background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(26, 31, 46, 0.9) 100%); margin-bottom: 20px; padding: 18px;">
      <p style="margin: 0 0 10px 0; color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; text-align: center;">
        🔑 Your Referee Portal Login Credentials
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 40%;">Official Referee ID:</td>
          <td style="padding: 6px 0; font-weight: 900; color: #d4af37; font-family: monospace; font-size: 15px;">${refereeId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Login Email:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${to}</td>
        </tr>
        ${password ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Account Password:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #38bdf8; font-family: monospace;">${password}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Account Role:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #10b981;">Referee Official (Dedicated Account)</td>
        </tr>
      </table>
      <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        💡 Please keep your password secure. You can use your email and password to log in anytime at <a href="${loginLink}" style="color: #fbbf24; text-decoration: underline;">${loginLink}</a>.
      </p>
    </div>

    <!-- Application Summary -->
    <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Application Details
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Applicant Name:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${applicantName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Applying For Level:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #fbbf24;">${appliedLevel}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Martial Arts Rank:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${currentRank}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">State / Jurisdiction:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${state}${district ? ` (${district})` : ""}</td>
        </tr>
        ${academy ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Affiliated Academy:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${academy}</td>
        </tr>` : ""}
        ${kalawarId ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Member ID:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #d4af37; font-family: monospace;">${kalawarId}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Application Status:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #38bdf8;">Under Technical Committee Review</td>
        </tr>
      </table>
    </div>

    <!-- Next Steps Roadmap -->
    <div class="card" style="border-left: 4px solid #10b981; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; color: #10b981; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
        Certification & Examination Roadmap
      </p>
      <ol style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; line-height: 1.7;">
        <li><strong>Document Verification:</strong> Technical examiners are reviewing your credentials and rank proof.</li>
        <li><strong>Standards Clinic Invitation:</strong> You will be notified of the next All-India Referee Standards Clinic.</li>
        <li><strong>Theory & Practical Assessment:</strong> Under Supreme Examination Board head Mr. Santosh Kasbe.</li>
        <li><strong>Official License & ID Card:</strong> Accredited officials receive digital license and listing in the directory.</li>
      </ol>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 26px 0 16px 0;">
      <a href="${verificationLink}" class="btn" style="background: linear-gradient(135deg, #d4af37 0%, #aa7c11 100%); color: #000000; padding: 12px 26px; font-size: 13px; font-weight: 700; margin-right: 8px;">
        Verify Registration Online &rarr;
      </a>
      <a href="${directoryLink}" class="btn" style="background: #1e293b; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 600;">
        Referee Directory
      </a>
    </div>
    `
  );

  return sendEmail({
    to,
    subject: `🧑‍⚖️ Referee Registration & Account Credentials: ${refereeId} - ${FED_NAME}`,
    html,
  });
}

/**
 * 15. Send Official Club Affiliation Certificate Notification Email (Upon Issue / Re-Issue)
 */
export interface SendClubAffiliationCertificateEmailParams {
  to: string;
  clubName: string;
  clubId: string;
  certificateNumber: string;
  levelOfAffiliation: string;
  headCoachName?: string;
  presidentName?: string;
  secretaryName?: string;
  state?: string;
  district?: string;
  validFrom?: string;
  validUntil?: string;
  contactNo?: string;
  isReissue?: boolean;
}

export async function sendClubAffiliationCertificateEmail({
  to,
  clubName,
  clubId,
  certificateNumber,
  levelOfAffiliation,
  headCoachName,
  presidentName,
  secretaryName,
  state,
  district,
  validFrom,
  validUntil,
  contactNo,
  isReissue = false,
}: SendClubAffiliationCertificateEmailParams) {
  if (!to || !to.includes("@")) {
    console.warn("[EmailService] Cannot send Club Affiliation Certificate email: Invalid recipient address.");
    return { success: false };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarfederation.org";
  const certificateLink = `${appUrl}/clubs/${encodeURIComponent(clubId)}/certificate`;
  const clubProfileLink = `${appUrl}/clubs/${encodeURIComponent(clubId)}`;

  const actionTitle = isReissue
    ? "Official Affiliation Certificate Re-Issued & Validated"
    : "Official Affiliation Certificate Conferred & Issued";

  const actionBadge = isReissue ? "Certificate Re-Issued" : "Official Affiliation Credential";

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); padding: 5px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
        🏛️ ${actionBadge}
      </span>
      <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        ${actionTitle}
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
        ${isReissue
          ? `The official Federation Affiliation Certificate for <strong style="color: #fbbf24;">${clubName}</strong> has been successfully updated, re-issued, and authenticated under the Supreme Executive Board.`
          : `We are pleased to announce that <strong style="color: #fbbf24;">${clubName}</strong> has been officially accredited as an authorized Affiliated Institution under the KALAWAR Sports & Martial Arts Federation of India.`
        }
      </p>
    </div>

    <!-- Certificate Serial Box -->
    <div class="card" style="border-left: 4px solid #d4af37; background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 23, 29, 0.95) 100%); margin-bottom: 20px; padding: 20px; text-align: center;">
      <p style="margin: 0 0 6px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
        Official Affiliation Certificate Serial Number
      </p>
      <p style="margin: 0; font-size: 24px; font-weight: 900; color: #fbbf24; font-family: monospace; letter-spacing: 2px;">
        ${certificateNumber}
      </p>
      <p style="margin: 6px 0 0 0; color: #10b981; font-size: 11px; font-weight: 600;">
        ✓ Authenticated &amp; Cryptographically Registered in National Federation Archives
      </p>
    </div>

    <!-- Affiliation Details Box -->
    <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 20px; background: #14171d;">
      <p style="margin: 0 0 12px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Institution &amp; Accreditation Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 42%;">Academy / Club Name:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${clubName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Federation ID:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #fbbf24; font-family: monospace;">${clubId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Level of Affiliation:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #38bdf8;">${levelOfAffiliation || "Academy / Club Affiliation"}</td>
        </tr>
        ${headCoachName ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Chief Instructor / Head Coach:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${headCoachName}</td>
        </tr>` : ""}
        ${presidentName ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">President:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${presidentName}</td>
        </tr>` : ""}
        ${secretaryName ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">General Secretary:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${secretaryName}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Territorial Jurisdiction:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${state || "Maharashtra"}${district ? ` (${district})` : ""}</td>
        </tr>
        ${(validFrom || validUntil) ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Validity Period:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #10b981;">${validFrom || "2026-01-01"} &mdash; ${validUntil || "2026-12-31"}</td>
        </tr>` : ""}
        ${contactNo ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Official Contact:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${contactNo}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Accrediting Authority:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #fbbf24;">Mr. Santosh Kasbe (Founder &amp; President – India)</td>
        </tr>
      </table>
    </div>

    <!-- Privileges & Rights -->
    <div class="card" style="border-left: 4px solid #10b981; background: #0f1218; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #10b981; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Official Affiliation Rights &amp; Privileges
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; line-height: 1.7;">
        <li>Authorized to conduct official KALAWAR Belt Grading and Dan Certification tests.</li>
        <li>Direct athlete and delegation entry in State, Zonal, and National Martial Arts Championships.</li>
        <li>Listing in the Official National Federation Academy &amp; Dojang Registry.</li>
        <li>Access to official tournament software, referee clinics, and national ranking leaderboards.</li>
      </ul>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${certificateLink}" class="btn" style="background: linear-gradient(135deg, #d4af37 0%, #f6e05e 100%); color: #000000; padding: 14px 30px; font-size: 13px; font-weight: 800; margin-right: 8px; text-decoration: none; border-radius: 30px; display: inline-block;">
        View &amp; Download Affiliation Certificate &rarr;
      </a>
      <a href="${clubProfileLink}" class="btn" style="background: #1e293b; color: #ffffff; padding: 14px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 30px; display: inline-block;">
        Academy Profile
      </a>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
      Direct Certificate Verification URL: <a href="${certificateLink}" style="color: #fbbf24; text-decoration: underline;">${certificateLink}</a>
    </p>
  `;

  const html = wrapEmailTemplate(
    `Official Affiliation Certificate: ${clubName} (${certificateNumber})`,
    bodyContent
  );

  const subject = isReissue
    ? `🔄 Affiliation Certificate Re-Issued: ${clubName} (${certificateNumber}) - ${FED_NAME}`
    : `🏆 Official Affiliation Certificate Issued: ${clubName} (${certificateNumber}) - ${FED_NAME}`;

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * 16. Send Referee / Technical Official Theory & Practical Exam Results Notification Email
 */
export interface SendRefereeExamResultEmailParams {
  email: string;
  name: string;
  refereeId: string;
  level?: string;
  currentRank?: string;
  discipline?: string;
  theoryScore: number;
  theoryMaxScore?: number;
  practicalScore: number;
  practicalMaxScore?: number;
  examDate?: string;
  examiner?: string;
  remarks?: string;
  isPassed?: boolean;
}

export async function sendRefereeExamResultEmail({
  email,
  name,
  refereeId,
  level = "Level 1 – Junior Referee",
  currentRank = "Black Belt",
  discipline = "Kalawar Kaya Yuddha",
  theoryScore,
  theoryMaxScore = 50,
  practicalScore,
  practicalMaxScore = 50,
  examDate = new Date().toISOString().split("T")[0],
  examiner = "Technical Committee Examination Board",
  remarks,
  isPassed,
}: SendRefereeExamResultEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  if (!email || !email.includes("@")) {
    console.warn("[EmailService] Cannot send Referee Exam Result email: Invalid recipient address.");
    return { success: false };
  }

  const thScore = Number(theoryScore) || 0;
  const thMax = Number(theoryMaxScore) || 50;
  const prScore = Number(practicalScore) || 0;
  const prMax = Number(practicalMaxScore) || 50;

  const thPct = thMax > 0 ? Math.round((thScore / thMax) * 100) : 0;
  const prPct = prMax > 0 ? Math.round((prScore / prMax) * 100) : 0;

  const thPassed = thScore >= thMax * 0.6;
  const prPassed = prScore >= prMax * 0.6;
  const passed = isPassed !== undefined ? isPassed : (thPassed && prPassed);

  const totalScore = thScore + prScore;
  const totalMax = thMax + prMax;
  const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarfederation.org";
  const portalUrl = `${appOrigin}/referees?verify=${encodeURIComponent(refereeId)}`;
  const loginUrl = `${appOrigin}/login`;

  const statusBadgeColor = passed ? "#10b981" : "#ef4444";

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: ${passed ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}60; padding: 5px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
        🧑‍⚖️ Technical Evaluation Scorecard
      </span>
      <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
        ${passed ? "Official Examination Passed & Qualified!" : "Official Examination Assessment Results"}
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
        Dear <strong style="color: #ffffff;">${name}</strong> (<strong style="color: #fbbf24; font-family: monospace;">${refereeId}</strong>),<br/>
        The National Technical &amp; Examination Committee of <strong>${FED_NAME}</strong> has published and recorded your official Theory &amp; Practical Assessment scores for <strong style="color: #38bdf8;">${level}</strong>.
      </p>
    </div>

    <!-- Aggregate Qualification Box -->
    <div class="card" style="border: 2px solid ${statusBadgeColor}; background: linear-gradient(135deg, ${passed ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)"} 0%, rgba(20, 23, 29, 0.95) 100%); margin-bottom: 20px; padding: 20px; text-align: center; border-radius: 14px;">
      <p style="margin: 0 0 6px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
        Overall Assessment Result
      </p>
      <div style="font-size: 24px; font-weight: 900; color: ${statusBadgeColor}; letter-spacing: 1px;">
        ${passed ? "✔ PASSED &amp; QUALIFIED" : "⚠ DID NOT QUALIFY"}
      </div>
      <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px; font-weight: 700;">
        Aggregate Score: <span style="color: #fbbf24;">${totalScore} / ${totalMax}</span> (${totalPct}%)
      </p>
    </div>

    <!-- Detailed Scores Breakdown Table -->
    <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 20px; background: #14171d;">
      <p style="margin: 0 0 12px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Section-Wise Performance Evaluation
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #2d3748; color: #a0aec0; font-size: 11px; text-transform: uppercase;">
            <th style="text-align: left; padding: 6px 0;">Evaluation Section</th>
            <th style="text-align: center; padding: 6px 0;">Score</th>
            <th style="text-align: center; padding: 6px 0;">Pct</th>
            <th style="text-align: right; padding: 6px 0;">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px 0; color: #ffffff; font-weight: 600;">
              📘 Statutory Theory &amp; Rules
            </td>
            <td style="padding: 10px 0; text-align: center; font-weight: 700; color: #fbbf24; font-family: monospace;">
              ${thScore} / ${thMax}
            </td>
            <td style="padding: 10px 0; text-align: center; color: #94a3b8; font-weight: 600;">
              ${thPct}%
            </td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: ${thPassed ? "#10b981" : "#ef4444"};">
              ${thPassed ? "✓ Passed" : "✗ Failed"}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #ffffff; font-weight: 600;">
              🥋 Practical Ring &amp; Mat Adjudication
            </td>
            <td style="padding: 10px 0; text-align: center; font-weight: 700; color: #fbbf24; font-family: monospace;">
              ${prScore} / ${prMax}
            </td>
            <td style="padding: 10px 0; text-align: center; color: #94a3b8; font-weight: 600;">
              ${prPct}%
            </td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: ${prPassed ? "#10b981" : "#ef4444"};">
              ${prPassed ? "✓ Passed" : "✗ Failed"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Official Particulars & Examiner Remarks -->
    <div class="card" style="border-left: 4px solid #fbbf24; margin-bottom: 20px; background: #14171d;">
      <p style="margin: 0 0 12px 0; color: #fbbf24; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Assessment Particulars &amp; Board Notes
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0; color: #a0aec0; width: 40%;">Candidate Name:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #ffffff;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Official Referee ID:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #fbbf24; font-family: monospace;">${refereeId}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Accredited Level:</td>
          <td style="padding: 5px 0; font-weight: 700; color: #38bdf8;">${level}</td>
        </tr>
        ${currentRank ? `
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Martial Arts Rank:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${currentRank}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Examination Date:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${examDate}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #a0aec0;">Chief Examiner / Board:</td>
          <td style="padding: 5px 0; font-weight: 600; color: #ffffff;">${examiner}</td>
        </tr>
      </table>

      ${remarks ? `
      <div style="margin-top: 14px; padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; font-size: 12px; color: #cbd5e1; border-left: 2px solid #fbbf24;">
        <strong style="color: #fbbf24;">Examiner Evaluation Notes:</strong><br/>
        "${remarks}"
      </div>` : ""}
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${portalUrl}" class="btn" style="background: linear-gradient(135deg, #d4af37 0%, #f6e05e 100%); color: #000000; padding: 14px 30px; font-size: 13px; font-weight: 800; margin-right: 8px; text-decoration: none; border-radius: 30px; display: inline-block;">
        View Official Referee Profile &rarr;
      </a>
      <a href="${loginUrl}" class="btn" style="background: #1e293b; color: #ffffff; padding: 14px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 30px; display: inline-block;">
        Sign In to Portal
      </a>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
      Issued under the authority of Mr. Santosh Kasbe &bull; Head of Technical Examination Committee &bull; ${FED_NAME}
    </p>
  `;

  const html = wrapEmailTemplate(
    `Official Examination Results: ${name} (${refereeId})`,
    bodyContent
  );

  const subject = passed
    ? `🏆 Examination Passed & Qualified: ${level} (${refereeId}) - ${FED_NAME}`
    : `📋 Official Technical Assessment Results: ${refereeId} - ${FED_NAME}`;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * 17. Send Official Tournament Mat / Ring Duty Appointment Email
 */
export interface SendRefereeAppointmentEmailParams {
  email: string;
  name: string;
  refereeId: string;
  level?: string;
  currentRank?: string;
  licenseNumber?: string;
  championshipName: string;
  eventDate: string;
  ringOrMatNumber: string;
  position: string;
  location?: string;
  category?: string;
  appointedBy?: string;
}

export async function sendRefereeAppointmentEmail({
  email,
  name,
  refereeId,
  level = "State Referee",
  currentRank = "Black Belt",
  licenseNumber,
  championshipName,
  eventDate,
  ringOrMatNumber = "Mat 1",
  position = "Mat / Ring Referee",
  location = "National Indoor Stadium",
  category = "All Categories",
  appointedBy = "Technical Committee",
}: SendRefereeAppointmentEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  if (!email || !email.includes("@")) {
    console.warn("[EmailService] Cannot send Referee Appointment email: Invalid recipient address.");
    return { success: false };
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://kalawarfederation.org";
  const portalUrl = `${appOrigin}/referees?verify=${encodeURIComponent(refereeId)}`;
  const directoryUrl = `${appOrigin}/referees`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(212, 175, 55, 0.15); color: #fbbf24; border: 1px solid rgba(212, 175, 55, 0.35); padding: 5px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
        🏆 Official Tournament Duty Call
      </span>
      <h2 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
        Official Technical Duty Appointment
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
        Dear Official <strong style="color: #ffffff;">${name}</strong>,<br/>
        By order of the <strong>Technical Committee &amp; Governing Council</strong>, you are officially appointed to officiate at the upcoming championship.
      </p>
    </div>

    <!-- Assigned Duty Highlight Box -->
    <div class="card" style="border: 2px solid #fbbf24; background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 23, 29, 0.95) 100%); margin-bottom: 20px; padding: 20px; text-align: center; border-radius: 14px;">
      <p style="margin: 0 0 6px 0; color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
        Designated Ring / Mat Assignment
      </p>
      <div style="font-size: 26px; font-weight: 900; color: #fbbf24; letter-spacing: 1px;">
        ${ringOrMatNumber} &bull; ${position}
      </div>
      <p style="margin: 6px 0 0 0; color: #34d399; font-size: 12px; font-weight: 700;">
        ✓ Official Appointment Confirmed &amp; Ratified
      </p>
    </div>

    <!-- Tournament & Duty Particulars Table -->
    <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 20px; background: #14171d;">
      <p style="margin: 0 0 12px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Championship Assignment Particulars
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #a0aec0; width: 40%;">Championship / Event:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #ffffff;">${championshipName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Scheduled Date:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #fbbf24;">📅 ${eventDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Venue Location:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">📍 ${location}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Assigned Ring / Mat:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #38bdf8;">${ringOrMatNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Duty Designation:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${position}</td>
        </tr>
        ${category ? `
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Category / Bouts:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #cbd5e1;">${category}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Appointed Official:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${name} (${level})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Referee ID / License:</td>
          <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #fbbf24;">
            ${licenseNumber || refereeId}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a0aec0;">Appointing Authority:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${appointedBy}</td>
        </tr>
      </table>
    </div>

    <!-- Official Mandates & Reporting Instructions -->
    <div class="card" style="border-left: 4px solid #fbbf24; background: #0f1218; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; color: #fbbf24; font-size: 11px; text-transform: uppercase; font-weight: 700;">
        Official Technical Directives &amp; Reporting Guidelines:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.7;">
        <li>Please report to the Chief Referee Desk <strong>45 minutes prior</strong> to the opening ceremony.</li>
        <li>Wear the official Federation Referee uniform (Navy blue blazer, white shirt, grey trousers, official federation tie, black soft officiating shoes).</li>
        <li>Carry your official Referee Accreditation ID Card and whistle.</li>
        <li>Attend the mandatory Morning Technical Briefing under Mr. Santosh Kasbe.</li>
      </ul>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${portalUrl}" class="btn" style="background: linear-gradient(135deg, #d4af37 0%, #f6e05e 100%); color: #000000; padding: 14px 30px; font-size: 13px; font-weight: 800; margin-right: 8px; text-decoration: none; border-radius: 30px; display: inline-block;">
        View Appointment in Profile &rarr;
      </a>
      <a href="${directoryUrl}" class="btn" style="background: #1e293b; color: #ffffff; padding: 14px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 30px; display: inline-block;">
        Referee Roster
      </a>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
      Authorized by Technical Committee Head &bull; Mr. Santosh Kasbe &bull; ${FED_NAME}
    </p>
  `;

  const html = wrapEmailTemplate(
    `Official Duty Appointment: ${championshipName} (${ringOrMatNumber})`,
    bodyContent
  );

  const subject = `🥋 Official Appointment: ${position} (${ringOrMatNumber}) - ${championshipName}`;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
