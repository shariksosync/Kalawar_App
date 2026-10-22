import { NextRequest, NextResponse } from "next/server";
import { getDanApplicationById, updateDanApplicationStatus } from "@/lib/dan-grading-store";
import { sendDanUnderReviewEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      aadhaarDoc,
      aadhaarDocName,
      currentCertDoc,
      currentCertDocName,
      medicalFitnessDoc,
      medicalFitnessDocName,
      thesisDoc,
      thesisDocName,
      paymentProofDoc,
      paymentProofDocName,
      paymentProofDocSize,
    } = body;

    if (!applicationId || !applicationId.trim()) {
      return NextResponse.json(
        { success: false, error: "Application Tracking ID or Athlete ID is required." },
        { status: 400 }
      );
    }

    const existing = await getDanApplicationById(applicationId.trim());
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Dan application with ID "${applicationId}" not found.` },
        { status: 404 }
      );
    }

    // Build extra updates with newly uploaded docs
    const extraUpdates: Record<string, any> = {};

    if (aadhaarDoc) {
      extraUpdates.aadhaarDoc = aadhaarDoc;
      extraUpdates.aadhaarDocName = aadhaarDocName || "aadhaar_updated.pdf";
    }
    if (currentCertDoc) {
      extraUpdates.currentCertDoc = currentCertDoc;
      extraUpdates.currentCertDocName = currentCertDocName || "current_belt_updated.pdf";
    }
    if (medicalFitnessDoc) {
      extraUpdates.medicalFitnessDoc = medicalFitnessDoc;
      extraUpdates.medicalFitnessDocName = medicalFitnessDocName || "medical_fitness_updated.pdf";
    }
    if (thesisDoc) {
      extraUpdates.thesisDoc = thesisDoc;
      extraUpdates.thesisDocName = thesisDocName || "master_thesis_updated.pdf";
    }
    if (paymentProofDoc) {
      extraUpdates.paymentProofDoc = paymentProofDoc;
      extraUpdates.paymentProofDocName = paymentProofDocName || "payment_receipt_updated.png";
      if (paymentProofDocSize) {
        extraUpdates.paymentProofDocSize = paymentProofDocSize;
      }
    }

    if (Object.keys(extraUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Please attach at least one document to submit updates." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().split("T")[0];
    const prevRemarks = existing.adminVerificationRemarks ? `${existing.adminVerificationRemarks} | ` : "";
    const updatedRemarks = `${prevRemarks}[Updated documents submitted by candidate on ${now}]`;

    // Revert status to "Under Verification" so Technical Committee reviews the new documents
    const updated = await updateDanApplicationStatus(
      existing.id,
      "Under Verification",
      updatedRemarks,
      extraUpdates
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update application records." },
        { status: 500 }
      );
    }

    if (updated.email) {
      try {
        await sendDanUnderReviewEmail({
          email: updated.email,
          candidateName: updated.fullName,
          athleteId: updated.athleteId,
          trackingId: updated.id,
          appliedDanTitle: updated.appliedDanTitle,
          remarks: "Updated verification documents received. Application is now under technical evaluation.",
        });
      } catch (mailErr) {
        console.warn("Could not dispatch under review email on re-upload:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification documents updated successfully! Application is now under Technical Committee review.",
      application: updated,
    });
  } catch (error: any) {
    console.error("API /api/dan-grading/update-docs Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update documents." },
      { status: 500 }
    );
  }
}
