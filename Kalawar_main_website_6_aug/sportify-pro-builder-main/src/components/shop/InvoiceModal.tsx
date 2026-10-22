"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Tag,
  Sparkles,
  Award,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { OrderRecord } from "@/lib/orders-store";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { formatToDDMMYYYY } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { settings } = useSettings();

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!order || !isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      await downloadInvoicePDF(invoiceRef.current, {
        filename: `Tax_Invoice_${order.invoiceNumber}_${order.orderId}`,
      });
      toast.success("Tax Invoice Downloaded", {
        description: `Saved as Tax_Invoice_${order.invoiceNumber}_${order.orderId}.pdf`,
      });
    } catch (err) {
      console.error("PDF Download failed:", err);
      toast.error("Failed to generate PDF. You can also use Print Invoice -> Save as PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!invoiceRef.current || isPrinting) return;
    setIsPrinting(true);

    try {
      const invoiceEl = invoiceRef.current;
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.id = "invoice-print-frame";

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error("Unable to access print frame document");
      }

      // Copy all active stylesheets and font declarations from the main application head
      const headStyles = Array.from(
        document.head.querySelectorAll("link[rel='stylesheet'], style")
      )
        .map((tag) => tag.outerHTML)
        .join("\n");

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>Tax Invoice - ${order.invoiceNumber}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${headStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                background: #ffffff !important;
                color: #111827 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              #printable-invoice {
                width: 100% !important;
                max-width: 800px !important;
                box-shadow: none !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 1.5rem !important;
                padding: 32px !important;
                margin: 0 auto !important;
                background: #ffffff !important;
                color: #111827 !important;
                page-break-inside: auto;
              }
              #printable-invoice * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-scrollbar::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              .no-scrollbar {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
              }
            </style>
          </head>
          <body>
            <div style="max-width: 800px; margin: 0 auto; padding: 8px;">
              ${invoiceEl.outerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error("Print invocation error:", printErr);
          window.open(`/orders/${encodeURIComponent(order.orderId)}/invoice`, "_blank");
        } finally {
          setIsPrinting(false);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 450);
    } catch (e) {
      console.error("Direct HTML print error, falling back to invoice page:", e);
      setIsPrinting(false);
      window.open(`/orders/${encodeURIComponent(order.orderId)}/invoice`, "_blank");
    }
  };

  const invoiceDate = formatToDDMMYYYY(order.createdAt, new Date());

  // Calculations for Market Price, Savings, and Payable
  const totalMarketPrice = order.items.reduce((sum, item) => {
    const orig = item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : (item.price === 2000 ? 4000 : Math.round(item.price * 1.5));
    return sum + orig * item.quantity;
  }, 0);

  const totalSaved = Math.max(0, totalMarketPrice - order.subtotal);
  const savingsPercent = totalMarketPrice > 0 ? Math.round((totalSaved / totalMarketPrice) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md print:hidden"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-background border border-border/80 shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[92vh] flex flex-col print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:max-h-none"
        >
          {/* Modal Header Actions (Hidden on Print) */}
          <div className="border-border/60 bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between border-b px-3.5 sm:px-5 py-2.5 sm:py-3.5 shrink-0 gap-2 print:hidden">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2.5">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="bg-primary/20 text-primary border-primary/30 flex size-7 sm:size-8 items-center justify-center rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-extrabold shrink-0">
                  GST
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                    Tax Invoice · <span className="font-mono text-primary">{order.invoiceNumber}</span>
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate">
                    Order ID: {order.orderId}
                  </p>
                </div>
              </div>

              {/* Mobile close button on top row */}
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden text-muted-foreground hover:bg-accent hover:text-foreground grid size-7 place-items-center rounded-full border border-border/60 transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
              <a
                href={`/orders/${encodeURIComponent(order.orderId)}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="border-border/70 hover:border-primary text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="size-3" /> <span className="hidden xs:inline">Full</span> Page
              </a>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloading || isPrinting}
                className="border-border/70 hover:border-primary/80 bg-card/80 hover:bg-accent/40 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
                title="Direct Download Tax Invoice as PDF"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="size-3 animate-spin text-primary" />
                    <span>PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-3 text-primary" />
                    <span>PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="bg-gold-gradient text-background hover:opacity-90 disabled:opacity-75 inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold shadow-gold transition-all"
                title="Print Tax Invoice"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Preparing...
                  </>
                ) : (
                  <>
                    <Printer className="size-3" /> <span>Print</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:grid text-muted-foreground hover:bg-accent hover:text-foreground size-8 place-items-center rounded-full border border-border/60 transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Body Container - Clean Paper Document Styling */}
          <div
            ref={invoiceRef}
            id="printable-invoice"
            className="p-4 sm:p-8 md:p-10 bg-white text-neutral-900 overflow-y-auto space-y-5 sm:space-y-7 rounded-b-2xl sm:rounded-b-3xl print:p-0 print:m-0 print:bg-white print:text-black print:overflow-visible print:rounded-none"
          >
            {/* Header: Federation Branding & Invoice Status */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 border-b border-neutral-200 pb-5 sm:pb-6">
              <div className="space-y-1.5 sm:space-y-2 flex-1 max-w-lg min-w-0">
                <div className="flex items-center gap-3">
                  <div className="size-12 sm:size-13 overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-1 shrink-0">
                    <img
                      src="/logo.png"
                      alt={fedName}
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-neutral-900 leading-tight truncate">
                      {fedName}
                    </h1>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 font-medium">
                      Official Sports & Martial Arts Federation of India
                    </p>
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed space-y-0.5">
                  <p>{fedAddress}</p>
                  <p className="whitespace-normal sm:whitespace-nowrap">
                    <strong>Phone:</strong> {fedPhone}
                  </p>
                  <p className="whitespace-normal sm:whitespace-nowrap break-all sm:break-normal">
                    <strong>Email:</strong> {fedEmail}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1 self-stretch sm:self-auto bg-neutral-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-2xl border border-neutral-200 sm:border-0 min-w-0">
                <div className="flex sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase whitespace-nowrap shrink-0">
                    <CheckCircle2 className="size-3.5" />
                    {order.payment.status === "Paid" ? "PAID IN FULL" : order.orderStatus}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mt-1 text-neutral-900 font-mono break-all sm:break-normal">
                  {order.invoiceNumber}
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-600">
                  <strong>Date:</strong> {invoiceDate}
                </p>
                <p className="text-[11px] sm:text-xs text-neutral-600 font-mono break-all sm:break-normal">
                  <strong>Order ID:</strong> {order.orderId}
                </p>
                {order.payment.razorpayPaymentId && (
                  <p className="text-[10px] sm:text-[11px] font-mono text-neutral-800 break-all sm:break-normal">
                    <strong>Razorpay Txn:</strong> {order.payment.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>

            {/* Billed To & Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 text-xs">
              <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3.5 sm:p-4">
                <h3 className="font-bold text-neutral-700 uppercase text-[10px] tracking-wider mb-2">
                  Billed & Delivered To:
                </h3>
                <p className="text-sm font-bold text-neutral-900">
                  {order.customer.name}
                </p>
                <p className="text-neutral-700 mt-1 leading-relaxed">
                  {order.customer.address}
                  {order.customer.landmark ? `, near ${order.customer.landmark}` : ""}
                  <br />
                  {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                </p>
                <p className="text-neutral-700 mt-2 space-y-0.5">
                  <span><strong>Phone:</strong> {order.customer.phone}</span>
                  <br />
                  <span className="break-all"><strong>Email:</strong> {order.customer.email}</span>
                </p>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3.5 sm:p-4">
                <h3 className="font-bold text-neutral-700 uppercase text-[10px] tracking-wider mb-2">
                  Payment & Fulfillment Summary:
                </h3>
                <div className="space-y-2 text-neutral-700">
                  <div className="flex justify-between items-center gap-2">
                    <span>Payment Gateway:</span>
                    <strong className="text-neutral-900 shrink-0">
                      {order.payment.method}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span>Payment Status:</span>
                    <span className="font-bold text-emerald-700 whitespace-nowrap shrink-0">
                      {order.payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span>Fulfillment Status:</span>
                    <strong className="text-neutral-900 whitespace-nowrap shrink-0">
                      {order.orderStatus}
                    </strong>
                  </div>
                  {order.courierName && (
                    <div className="flex justify-between items-center gap-2">
                      <span>Courier / AWB:</span>
                      <span className="font-mono text-neutral-900 shrink-0 text-[11px] break-all">
                        {order.courierName} ({order.trackingNumber || "N/A"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table with Market Price & Offer Price */}
            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 rounded-xl sm:rounded-2xl border border-neutral-200">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-100 text-neutral-800">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px]">#</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px]">Product & SKU</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px] text-right">Market Price</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px] text-right">Rate</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px] text-center">Qty</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-bold uppercase text-[10px] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {order.items.map((item, idx) => {
                    const origPrice = item.originalPrice && item.originalPrice > item.price
                      ? item.originalPrice
                      : (item.price === 2000 ? 4000 : Math.round(item.price * 1.5));
                    const itemSavings = Math.max(0, (origPrice - item.price) * item.quantity);

                    return (
                      <tr key={item.code || idx} className="hover:bg-neutral-50/60">
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 font-mono text-neutral-600">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 min-w-[140px]">
                          <p className="font-bold text-neutral-900">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-600 uppercase">
                            SKU: {item.code}
                          </p>
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 text-right font-mono text-neutral-400 line-through">
                          ₹{origPrice}
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 text-right font-bold text-neutral-900">
                          ₹{item.price}
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 text-center font-bold text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-3.5 text-right font-extrabold text-neutral-900">
                          ₹{item.price * item.quantity}
                          {itemSavings > 0 && (
                            <span className="block text-[9px] text-emerald-700 font-semibold">
                              Saved ₹{itemSavings}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total Savings Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 border-t border-neutral-200 pt-5 sm:pt-6">
              {/* Savings Ribbon Card */}
              <div className="w-full sm:w-[320px] max-w-[340px] space-y-3 shrink-0">
                {totalSaved > 0 && (
                  <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:p-4 text-xs text-neutral-900">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold whitespace-nowrap">
                      <Tag className="size-4 shrink-0" />
                      <span>Federation Member Savings</span>
                    </div>
                    <p className="text-neutral-700 text-[11px] mt-1.5 leading-relaxed">
                      You saved a total of <strong className="text-emerald-700 font-bold">₹{totalSaved.toLocaleString("en-IN")} ({savingsPercent}%)</strong> on this purchase compared to market price!
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 text-[11px] text-neutral-600 pt-1">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-700 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-emerald-700 font-semibold whitespace-nowrap">
                      Official Federation Certification
                    </p>
                    <p className="text-neutral-600 leading-relaxed">
                      All prices are inclusive of Goods & Services Tax (GST). Computer-generated official tax invoice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Calculations Summary */}
              <div className="w-full sm:w-80 max-w-[340px] space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-neutral-700">
                  <span className="whitespace-nowrap">Total Market Value (MRP):</span>
                  <span className="font-mono line-through text-neutral-400 whitespace-nowrap">
                    ₹{totalMarketPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-emerald-700 font-semibold">
                  <span className="whitespace-nowrap">Total Price Saved:</span>
                  <span className="whitespace-nowrap">- ₹{totalSaved.toLocaleString("en-IN")} ({savingsPercent}%)</span>
                </div>

                <div className="flex justify-between items-center text-neutral-700">
                  <span className="whitespace-nowrap">Subtotal (Offer Rate):</span>
                  <span className="font-bold text-neutral-900 whitespace-nowrap">
                    ₹{order.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-700">
                  <span className="whitespace-nowrap">Shipping & Delivery:</span>
                  <span className="whitespace-nowrap">
                    {order.shippingFee === 0 ? (
                      <strong className="text-emerald-700 font-bold">FREE</strong>
                    ) : (
                      `₹${order.shippingFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-700">
                  <span className="whitespace-nowrap">Taxes (GST 18%):</span>
                  <span className="text-[11px] whitespace-nowrap">Included in Price</span>
                </div>

                {/* Grand Total Payable Highlight */}
                <div className="border-t-2 border-neutral-900 pt-3 flex justify-between items-baseline text-neutral-900">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide block whitespace-nowrap">
                      Total Payable
                    </span>
                    <span className="text-[10px] text-neutral-600 font-mono whitespace-nowrap">
                      Paid via {order.payment.method}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono whitespace-nowrap">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Federation Signatory & Stamp */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 pt-5 sm:pt-6 border-t border-neutral-200 text-[11px]">
              <div className="text-neutral-600">
                <p className="font-semibold text-neutral-900">
                  {fedName}
                </p>
                <p className="text-[10px] mt-0.5">Official Invoicing Desk: {fedEmail}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="h-7 sm:h-8 flex items-center justify-start sm:justify-end">
                  <span className="font-serif italic font-bold text-neutral-900 text-sm">
                    Santosh U. Kasabe
                  </span>
                </div>
                <div className="border-t border-neutral-300 pt-1">
                  <p className="font-bold text-neutral-900">
                    Authorized Signatory
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    National Federation Head
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
