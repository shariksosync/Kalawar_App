import { NextRequest, NextResponse } from "next/server";
import { updateDanApplicationStatus, getDanExamSessionById } from "@/lib/dan-grading-store";
import {
  sendDanCashPaymentApprovedEmail,
  sendDanDocumentsRequiredEmail,
  sendDanUnderReviewEmail,
} from "@/lib/email-service";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, status, remarks, extraUpdates } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { success: false, error: "Application ID and target Status are required." },
        { status: 400 }
      );
    }

    // Ensure admitCardIssued is strictly false when requesting documents, putting under review, or rejecting
    const sanitizedExtraUpdates = { ...(extraUpdates || {}) };
    if (
      status === "Documents Required" ||
      status === "Under Verification" ||
      status === "Submitted" ||
      status === "Rejected"
    ) {
      sanitizedExtraUpdates.admitCardIssued = false;
    }

    const updated = await updateDanApplicationStatus(
      applicationId,
      status,
      remarks,
      sanitizedExtraUpdates
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    // 1. Trigger ONLY "Documents Required" Re-upload Email if admin requests more documents
    if (status === "Documents Required" && updated.email) {
      try {
        await sendDanDocumentsRequiredEmail({
          email: updated.email,
          candidateName: updated.fullName,
          athleteId: updated.athleteId,
          trackingId: updated.id,
          appliedDanTitle: updated.appliedDanTitle,
          remarks: remarks || updated.adminVerificationRemarks || "Please re-upload clear copies of required documents.",
        });
        console.log(`[Dan Grading] Dispatched Documents Required email to ${updated.email} for Tracking ID ${updated.id}, Athlete ID ${updated.athleteId}`);
      } catch (docEmailErr) {
        console.error("[Dan Grading] Error sending documents required email:", docEmailErr);
      }
    }

    // 2. Trigger ONLY "Under Verification / Under Review" Email if admin marks application under review
    else if ((status === "Under Verification" || status === "Submitted") && updated.email) {
      try {
        await sendDanUnderReviewEmail({
          email: updated.email,
          candidateName: updated.fullName,
          athleteId: updated.athleteId,
          trackingId: updated.id,
          appliedDanTitle: updated.appliedDanTitle,
          remarks: remarks || updated.adminVerificationRemarks,
        });
        console.log(`[Dan Grading] Dispatched Under Review email to ${updated.email} for Tracking ID ${updated.id}, Athlete ID ${updated.athleteId}`);
      } catch (reviewEmailErr) {
        console.error("[Dan Grading] Error sending under review email:", reviewEmailErr);
      }
    }

    // 3. Trigger Admit Card Notification Email ONLY if candidate is officially Approved & Eligible for Exam
    else if (
      (status === "Eligible" || status === "Exam Scheduled" || extraUpdates?.admitCardIssued === true) &&
      status !== "Documents Required" &&
      status !== "Under Verification" &&
      status !== "Submitted" &&
      status !== "Rejected" &&
      updated.email
    ) {
      try {
        let sessionTitle = "National Black Belt & Dan Grading Examination";
        let sessionDate = updated.examDate || extraUpdates?.examDate || "Scheduled Official Exam Date";
        let sessionVenue = updated.examVenue || extraUpdates?.examVenue || "Federation National Combat Arena, Maharashtra";
        let reportingTime = updated.examTime || extraUpdates?.examTime || "07:30 AM";

        if (updated.examId && (!updated.examVenue || !updated.examDate)) {
          const session = await getDanExamSessionById(updated.examId);
          if (session) {
            sessionTitle = session.title || sessionTitle;
            if (!sessionDate || sessionDate === "Scheduled Official Exam Date") {
              sessionDate = session.examDate || sessionDate;
            }
            if (!sessionVenue || sessionVenue === "Federation National Combat Arena, Maharashtra") {
              sessionVenue = `${session.venueName}, ${session.city}, ${session.state}`;
            }
            reportingTime = session.reportingTime || reportingTime;
          }
        }

        await sendDanCashPaymentApprovedEmail({
          email: updated.email,
          candidateName: updated.fullName,
          athleteId: updated.athleteId,
          trackingId: updated.id,
          appliedDanTitle: updated.appliedDanTitle,
          examSessionTitle: sessionTitle,
          sessionDate,
          sessionVenue,
          reportingTime,
          amount: updated.paymentAmount || 3500,
        });
        console.log(`[Dan Grading] Dispatched Admit Card Issued email to ${updated.email} for Tracking ID ${updated.id}, Athlete ID ${updated.athleteId}`);
      } catch (emailErr) {
        console.error("[Dan Grading] Error sending approval email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Status successfully updated to " + status,
      application: updated,
    });
  } catch (error: any) {
    console.error("API /api/dan-grading/status Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}