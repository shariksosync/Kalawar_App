import { NextResponse } from "next/server";
import { getContacts, createContact, type CreateContactInput } from "@/lib/contact-store";
import { validatePhoneNumber } from "@/lib/validation";
import { sendCallbackInquiryEmail } from "@/lib/email-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || undefined;

    const contacts = await getContacts({ status, category, q });
    return NextResponse.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("GET /api/contact error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateContactInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required" },
        { status: 400 }
      );
    }
    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    if (body.phone && typeof body.phone === "string" && body.phone.trim()) {
      const phoneVal = validatePhoneNumber(body.phone, {
        required: false,
        fieldName: "Contact phone number",
      });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid contact phone number" },
          { status: 400 }
        );
      }
      body.phone = phoneVal.cleaned;
    }

    if (!body.subject || !body.subject.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    const contact = await createContact(body);

    // Send Call-Back / Enquiry Confirmation Email
    try {
      await sendCallbackInquiryEmail(
        contact.email,
        contact.name,
        contact.id,
        contact.subject,
        contact.message,
        contact.phone
      );
    } catch (emailErr) {
      console.warn("Contact email dispatch note:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your enquiry has been received successfully. Our secretariat will respond shortly.",
        contact,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit contact request",
      },
      { status: 400 }
    );
  }
}
