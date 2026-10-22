import { NextResponse } from "next/server";
import { trackContactEnquiry } from "@/lib/contact-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enquiryId, phoneOrEmail, contactInfo, phone, email } = body;
    const searchContact = (phoneOrEmail || contactInfo || phone || email || "").trim();

    if (!enquiryId || !enquiryId.trim()) {
      return NextResponse.json(
        { success: false, error: "Enquiry Reference ID is required" },
        { status: 400 }
      );
    }
    if (!searchContact) {
      return NextResponse.json(
        { success: false, error: "Registered Mobile Number or Email is required" },
        { status: 400 }
      );
    }

    const record = await trackContactEnquiry(enquiryId.trim(), searchContact);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "No enquiry found matching this Reference ID and Mobile/Email combination. Please verify your details and try again.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiry: {
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone,
        state: record.state,
        district: record.district,
        subject: record.subject,
        category: record.category,
        message: record.message,
        attachmentUrl: record.attachmentUrl,
        attachmentName: record.attachmentName,
        attachmentSize: record.attachmentSize,
        status: record.status,
        assignedTo: record.assignedTo,
        adminReply: record.adminReply,
        repliedAt: record.repliedAt,
        repliedBy: record.repliedBy,
        history: record.history,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Tracking API error:", err);
    return NextResponse.json(
      { success: false, error: "An error occurred while tracking enquiry." },
      { status: 500 }
    );
  }
}
