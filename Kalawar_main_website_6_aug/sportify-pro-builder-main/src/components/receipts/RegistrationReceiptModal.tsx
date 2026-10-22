"use client";

import { useState } from "react";
import {
  Receipt,
  Download,
  Printer,
  X,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  Sparkles,
  Award,
  Medal,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { formatToDDMMYYYY } from "@/lib/utils";
import type { RegistrationReceiptItem } from "@/types/receipt";
import { downloadRegistrationReceiptPDF, printRegistrationReceiptPDF } from "@/lib/receipt-pdf-download";
import { downloadBeltRegistrationSlipPDF, printBeltRegistrationSlipPDF } from "@/lib/belt-pdf-download";
import { downloadDanPaymentSlipPDF, printDanPaymentSlipPDF } from "@/lib/dan-payment-slip";
import { downloadChampionshipRegistrationReceiptPDF, printChampionshipRegistrationReceiptPDF } from "@/lib/championship-pdf";
import { downloadRefereeReceiptPDF, printRefereeRegistrationSlip } from "@/lib/referee-license-pdf";

interface RegistrationReceiptModalProps {
  receipt: RegistrationReceiptItem | null;
  isOpen: boolean;
  onClose: () => void;
  federationName?: string;
}

export function RegistrationReceiptModal({
  receipt,
  isOpen,
  onClose,
  federationName = "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA",
}: RegistrationReceiptModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !receipt) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = async () => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await downloadBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await downloadDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await downloadChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await downloadRefereeReceiptPDF(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await downloadRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else {
        toast.info("Generating registration slip PDF...");
      }
    } catch (err) {
      console.error("Failed to download slip PDF:", err);
      toast.error("Failed to generate PDF slip");
    }
  };

  const handlePrint = async () => {
    try {
      if (receipt.category === "member_registration" && receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else if (receipt.category === "belt_exam" && receipt.rawBeltCandidate) {
        await printBeltRegistrationSlipPDF(receipt.rawBeltCandidate);
      } else if (receipt.category === "black_belt_dan" && receipt.rawDanApp) {
        await printDanPaymentSlipPDF(receipt.rawDanApp);
      } else if (receipt.category === "championship" && receipt.rawChampApp) {
        await printChampionshipRegistrationReceiptPDF(receipt.rawChampApp);
      } else if (receipt.category === "referee" && receipt.rawReferee) {
        await printRefereeRegistrationSlip(receipt.rawReferee);
      } else if (receipt.rawPlayer) {
        await printRegistrationReceiptPDF(receipt.rawPlayer, federationName);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Failed to print slip:", err);
      toast.error("Failed to trigger print dialog");
    }
  };

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${receipt.qrVerificationUrl || `/id-cards/${encodeURIComponent(receipt.memberId || "")}`}`
      : `https://kalawarmartialarts.org${receipt.qrVerificationUrl || ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-auto rounded-2xl sm:rounded-3xl bg-card border-2 border-primary/40 shadow-2xl shadow-primary/10 overflow-hidden text-foreground">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-amber-500/20 via-primary/30 to-amber-500/20 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 sm:size-9 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shadow-inner shrink-0">
              <Receipt className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground truncate">Official Registration Slip</h3>
              <p className="text-[11px] text-muted-foreground font-mono break-all sm:break-normal">{receipt.receiptNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-accent/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground grid place-items-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body / Paper Slip UI */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Slip Header Box */}
          <div className="text-center space-y-1.5 border-b border-border/80 pb-4 sm:pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="size-3" />
              National Secretariat Official Slip
            </div>
            <h2 className="text-sm sm:text-lg font-black uppercase text-foreground tracking-wide">
              {federationName}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-primary">
              {receipt.title}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(receipt.receiptNumber, "Slip Number")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-[11px] sm:text-xs font-bold hover:bg-amber-400/20 transition-colors cursor-pointer"
                title="Click to copy Slip Number"
              >
                <span className="break-all sm:break-normal">REF: {receipt.receiptNumber}</span>
                {copiedField === "Slip Number" ? <Check className="size-3 text-emerald-400 shrink-0" /> : <Copy className="size-3 shrink-0" />}
              </button>
              <span className="text-xs text-muted-foreground">
                Date: {formatToDDMMYYYY(receipt.issuedAt, new Date())}
              </span>
            </div>
          </div>

          {/* Candidate / Member Credential Hero */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-400/5 border border-amber-400/20 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <User className="size-3 text-primary" /> Candidate / Recipient
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground mt-0.5 break-words">{receipt.recipientName}</div>
              {receipt.email && (
                <div className="text-[11px] text-muted-foreground font-mono break-all sm:break-normal">{receipt.email}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3 text-primary" /> Registration / Member ID
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-primary break-all sm:break-normal">
                  {receipt.memberId || receipt.receiptNumber}
                </span>
                {receipt.memberId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(receipt.memberId!, "Member ID")}
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    title="Copy Member ID"
                  >
                    {copiedField === "Member ID" ? <Check className="size-3.5 text-emerald-400 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
                  </button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">{receipt.categoryLabel}</div>
            </div>
          </div>

          {/* Particulars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            {receipt.discipline && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Discipline</span>
                <span className="font-semibold text-foreground break-words">{receipt.discipline}</span>
              </div>
            )}
            {receipt.metadata?.level && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Accreditation Level</span>
                <span className="font-semibold text-foreground break-words">{receipt.metadata.level}</span>
              </div>
            )}
            {(receipt.metadata?.beltRank || receipt.metadata?.targetRank) && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Belt / Rank Division</span>
                <span className="font-semibold text-foreground break-words">{receipt.metadata.targetRank || receipt.metadata.beltRank}</span>
              </div>
            )}
            {receipt.metadata?.eventName && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Championship Event</span>
                <span className="font-semibold text-foreground break-words">{receipt.metadata.eventName}</span>
              </div>
            )}
            {receipt.metadata?.bibNumber && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Bib Number</span>
                <span className="font-mono font-bold text-primary break-all sm:break-normal">{receipt.metadata.bibNumber}</span>
              </div>
            )}
            {receipt.metadata?.chiefExaminer && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Chief Examiner</span>
                <span className="font-semibold text-foreground break-words">{receipt.metadata.chiefExaminer}</span>
              </div>
            )}
            {receipt.metadata?.instructorName && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Instructor / Master</span>
                <span className="font-semibold text-foreground break-words">{receipt.metadata.instructorName}</span>
              </div>
            )}
            {receipt.academyOrClub && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Affiliated Club / Academy</span>
                <span className="font-semibold text-foreground break-words">{receipt.academyOrClub}</span>
              </div>
            )}
            {receipt.state && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">State Association Unit</span>
                <span className="font-semibold text-foreground">{receipt.state}, India</span>
              </div>
            )}
            <div className="p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/80">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registration Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 mt-0.5">
                <CheckCircle2 className="size-3.5 shrink-0" /> {receipt.status} (Recorded)
              </span>
            </div>
          </div>

          {/* QR Verification Seal Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/20 border border-border/80 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
            <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
              <QRCode value={verifyUrl} size={70} level="M" />
            </div>
            <div className="space-y-1 text-center sm:text-left text-xs">
              <div className="font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="size-4 text-primary shrink-0" /> Digital Verification Seal
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scan QR code to verify live registration authenticity on the national portal ledger.
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-mono break-all sm:break-normal">
                Official National Registry · KALAWAR Federation of India
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-muted/40 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto border border-border/80 hover:border-primary text-foreground rounded-xl sm:rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
          >
            <Printer className="size-3.5 text-primary" /> Print Slip
          </button>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl sm:rounded-full border border-border/80 hover:bg-accent/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl sm:rounded-full bg-gold-gradient text-stone-950 font-bold px-4 sm:px-5 py-2.5 text-xs shadow-gold inline-flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer text-center"
            >
              <Download className="size-3.5" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
