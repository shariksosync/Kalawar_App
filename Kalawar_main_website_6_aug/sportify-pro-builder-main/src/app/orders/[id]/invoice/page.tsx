"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Tag,
  Award,
  Loader2,
} from "lucide-react";
import type { OrderRecord } from "@/lib/orders-store";
import { federation } from "@/constants/navigation";
import { useSettings } from "@/lib/settings-context";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { formatToDDMMYYYY } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { settings } = useSettings();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fedName = settings.federationName || federation.name;
  const fedEmail = settings.contactEmail || federation.email;
  const fedPhone = settings.contactPhone || federation.phone;
  const fedAddress = settings.address || federation.address;

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;

      // 1. Instant Cache Check for 0ms render
      try {
        const cached =
          localStorage.getItem(`kalawar_order_${id}`) ||
          localStorage.getItem("kalawar_latest_order");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (
            parsed.orderId === id ||
            parsed.id === id ||
            parsed.invoiceNumber === id
          ) {
            setOrder(parsed);
            setLoading(false);
          }
        }
      } catch {}

      // 2. Fresh Server Fetch
      try {
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Failed to load invoice order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (!loading && order && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("print") === "1" || searchParams.get("autoPrint") === "1") {
        const timer = setTimeout(() => {
          window.print();
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, order]);

  const handleDownload = async () => {
    if (!order || isDownloading) return;
    const invoiceElement = document.getElementById("printable-invoice");
    if (!invoiceElement) return;

    try {
      setIsDownloading(true);
      await downloadInvoicePDF(invoiceElement, {
        filename: `Tax_Invoice_${order.invoiceNumber}_${order.orderId}`,
      });
      toast.success("Tax Invoice Downloaded", {
        description: `Saved as Tax_Invoice_${order.invoiceNumber}_${order.orderId}.pdf`,
      });
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF. You can also use Print Invoice -> Save as PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground print:hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Generating official tax invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-bold">Invoice Record Not Found</h1>
          <p className="text-xs text-muted-foreground">
            No order was found matching ID: {id}
          </p>
          <Link
            href="/orders"
            className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold shadow-gold"
          >
            <ArrowLeft className="size-3.5" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-neutral-950 text-foreground py-6 sm:py-8 px-3 sm:px-6 print:p-0 print:bg-white print:text-black">
      {/* Top Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 bg-background/90 backdrop-blur-md border border-border/80 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl print:hidden">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="size-8 sm:size-9 rounded-full border border-border/70 hover:border-primary grid place-items-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 sm:gap-2 truncate">
              <FileText className="size-3.5 sm:size-4 text-primary shrink-0" />
              <span className="truncate">Tax Invoice: <span className="font-mono text-primary">{order.invoiceNumber}</span></span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono truncate">
              Order Ref: {order.orderId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="border border-border/80 hover:border-primary/70 bg-card/70 hover:bg-accent/40 text-foreground font-semibold text-xs inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto"
            title="Direct Download Tax Invoice as PDF"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span className="truncate">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="size-3.5 text-primary" />
                <span className="truncate">Download PDF</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-gold-gradient text-background hover:opacity-95 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-gold transition-all active:scale-[0.98] w-full sm:w-auto"
            title="Print Tax Invoice"
          >
            <Printer className="size-3.5" /> <span className="truncate">Print Invoice</span>
          </button>
        </div>
      </div>

      {/* A4 Tax Invoice Card - Clean Paper Document Styling */}
      <div
        id="printable-invoice"
        className="max-w-4xl mx-auto bg-white text-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-2xl p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black print:rounded-none"
      >
        {/* Header: Federation Info & Invoice Meta */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 border-b border-neutral-200 pb-5 sm:pb-6">
          <div className="space-y-2 flex-1 max-w-lg min-w-0">
            <div className="flex items-center gap-3">
              <div className="size-12 sm:size-14 overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-1 shrink-0">
                <img
                  src="/logo.png"
                  alt={fedName}
                  className="size-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-neutral-900 leading-tight truncate">
                  {fedName}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-neutral-600 font-medium leading-snug">
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

          <div className="text-left sm:text-right space-y-1 self-stretch sm:self-auto bg-neutral-50 sm:bg-transparent p-3.5 sm:p-0 rounded-xl sm:rounded-2xl border border-neutral-200 sm:border-0 min-w-0">
            <div className="flex sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase whitespace-nowrap shrink-0">
                <CheckCircle2 className="size-3.5" />
                {order.payment.status === "Paid" ? "PAID IN FULL" : order.orderStatus}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-neutral-900 font-mono break-all sm:break-normal">
              {order.invoiceNumber}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-600">
              <strong>Invoice Date:</strong> {invoiceDate}
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

        {/* Customer Address & Payment Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs">
          <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
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

          <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
            <h3 className="font-bold text-neutral-700 uppercase text-[10px] tracking-wider mb-2">
              Payment & Dispatch Info:
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
                  <span>Courier Partner:</span>
                  <span className="font-mono text-neutral-900 shrink-0 text-[11px] break-all">
                    {order.courierName} ({order.trackingNumber || "N/A"})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table with Market Price vs Federation Offer Price */}
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 rounded-xl sm:rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-neutral-800">
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px]">#</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px]">Product & SKU Code</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px] text-right">Market Price</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px] text-right">Rate</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px] text-center">Qty</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase text-[10px] text-right">Amount</th>
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
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono text-neutral-600">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 min-w-[140px]">
                      <p className="font-bold text-neutral-900">
                        {item.name}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-600 uppercase">
                        SKU: {item.code}
                      </p>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono text-neutral-400 line-through">
                      ₹{origPrice}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-bold text-neutral-900">
                      ₹{item.price}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-bold text-neutral-900">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-neutral-900">
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

        {/* Calculations, Savings & Total Payable */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 border-t border-neutral-200 pt-5 sm:pt-6">
          {/* Savings Ribbon */}
          <div className="w-full sm:w-[320px] max-w-[340px] space-y-3 shrink-0">
            {totalSaved > 0 && (
              <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:p-4 text-xs text-neutral-900">
                <div className="flex items-center gap-2 text-emerald-700 font-bold whitespace-nowrap">
                  <Tag className="size-4 shrink-0" />
                  <span>Total Federation Savings</span>
                </div>
                <p className="text-neutral-700 text-[11px] mt-1.5 leading-relaxed">
                  You saved <strong className="text-emerald-700 font-bold">₹{totalSaved.toLocaleString("en-IN")} ({savingsPercent}%)</strong> on this order compared to regular market rates!
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

          {/* Amount Calculation Summary */}
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

            {/* Total Payable */}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 pt-6 sm:pt-8 border-t border-neutral-200 text-[11px]">
          <div className="text-neutral-600">
            <p className="font-semibold text-neutral-900">
              {fedName}
            </p>
            <p className="text-[10px] mt-0.5">Invoicing & Equipment Helpdesk: {fedEmail}</p>
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
    </div>
  );
}
