import { NextResponse } from "next/server";
import { getContactById, updateContact, deleteContact } from "@/lib/contact-store";
import { sendEmail, wrapEmailTemplate, FED_NAME } from "@/lib/email-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contact = await getContactById(id);
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateContact(id, body, body.actionBy || "Admin Secretariat");

    // Optional dispatch of reply email if admin wrote a reply and requested send
    if (body.sendEmailToUser && body.adminReply && updated.email) {
      try {
        const html = wrapEmailTemplate(
          `Response to Enquiry: ${updated.subject}`,
          `
          <p style="color: #ffffff; font-size: 14px;">Dear <strong>${updated.name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
            The secretariat desk of <strong>${FED_NAME}</strong> has reviewed your enquiry regarding:
          </p>
          <div style="background: rgba(255,255,255,0.05); border-left: 3px solid #d4af37; padding: 12px; margin: 12px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #a0aec0;">Reference ID: <strong style="color: #d4af37;">${updated.id}</strong></p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #ffffff;"><strong>Subject:</strong> ${updated.subject}</p>
          </div>
          <div style="margin: 16px 0; padding: 16px; background: rgba(0,0,0,0.4); border: 1px solid #d4af37; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #d4af37; text-transform: uppercase;">Official Response:</p>
            <p style="margin: 0; font-size: 13px; color: #f8fafc; line-height: 1.7; white-space: pre-wrap;">${body.adminReply}</p>
          </div>
          <p style="color: #a0aec0; font-size: 12px; line-height: 1.5;">
            Current Status: <strong style="color: #10b981;">${updated.status}</strong><br/>
            You can check your live enquiry status anytime on our website at <a href="https://kalawarmartialarts.org/contact" style="color: #d4af37;">kalawarmartialarts.org/contact</a>.
          </p>
          `
        );

        await sendEmail({
          to: updated.email,
          subject: `📩 Official Response to Enquiry [${updated.id}] - ${FED_NAME}`,
          html,
        });
      } catch (mailErr) {
        console.warn("Admin response email dispatch warning:", mailErr);
      }
    }

    return NextResponse.json({ success: true, contact: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteContact(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
