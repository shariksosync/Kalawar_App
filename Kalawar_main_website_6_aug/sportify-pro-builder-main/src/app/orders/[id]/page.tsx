"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  MapPin,
  CreditCard,
  Printer,
  Download,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Tag,
  Gift,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { InvoiceModal } from "@/components/shop/InvoiceModal";
import type { OrderRecord } from "@/lib/orders-store";
import { federation } from "@/constants/navigation";
import { formatToDDMMYYYY } from "@/lib/utils";

const TRACKING_STEPS = [
  {
    status: "Order Placed",
    label: "Order Placed",
    desc: "Order has been registered with the federation store",
  },
  {
    status: "Payment Confirmed",
    label: "Payment Confirmed",
    desc: "Payment verified via Razorpay Gateway",
  },
  {
    status: "Processing",
    label: "Processing & Packaging",
    desc: "Equipment being inspected, verified, and packed",
  },
  {
    status: "Shipped",
    label: "Dispatched / In Transit",
    desc: "Handed over to federation logistics partner",
  },
  {
    status: "Delivered",
    label: "Delivered",
    desc: "Package safely delivered to recipient address",
  },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Failed to load order details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const getStepIndex = (status: string) => {
    switch (status) {
      case "Order Placed":
        return 0;
      case "Payment Confirmed":
        return 1;
      case "Processing":
        return 2;
      case "Shipped":
        return 3;
      case "Delivered":
        return 4;
      case "Cancelled":
        return -1;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout>
        <div className="shell py-16 sm:py-24 text-center max-w-md mx-auto space-y-4">
          <div className="size-14 sm:size-16 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
            <AlertCircle className="size-7 sm:size-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground text-xs">
            We could not find any order matching identifier: <strong className="break-all">{id}</strong>
          </p>
          <div className="pt-4 grid grid-cols-1 sm:flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-border/80 text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="size-4" /> Go Back
            </button>
            <Link
              href="/orders"
              className="bg-gold-gradient text-background inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-gold"
            >
              All My Orders <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === "Cancelled";

  // Compute MRP Market Value, Total Savings & Discounts
  const totalMarketPrice = order.items.reduce((sum, item) => {
    const orig = item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : (item.price === 2000 ? 4000 : Math.round(item.price * 1.5));
    return sum + orig * item.quantity;
  }, 0);

  const totalSaved = Math.max(0, totalMarketPrice - order.subtotal);
  const savingsPercent = totalMarketPrice > 0 ? Math.round((totalSaved / totalMarketPrice) * 100) : 0;

  return (
    <SiteLayout>
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="shell max-w-4xl space-y-6 sm:space-y-8">
          {/* Header & Back Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5 sm:pb-6">
            <div className="space-y-1 min-w-0">
              <Link
                href="/orders"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 font-medium transition-colors"
              >
                <ArrowLeft className="size-3.5 shrink-0" /> Back to My Orders
              </Link>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-mono break-all sm:break-normal">
                  {order.orderId}
                </h1>
                <span className="rounded-full bg-primary/10 text-primary border border-primary/25 px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-mono font-bold shrink-0">
                  Invoice #{order.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Placed on {formatToDDMMYYYY(order.createdAt, new Date())}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <a
                href={`/orders/${encodeURIComponent(order.orderId)}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="border-border/80 hover:border-primary text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors w-full sm:w-auto"
                title="Open and print full tax invoice"
              >
                <Printer className="size-3.5 text-primary" /> Full Invoice Page
              </a>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="bg-gold-gradient text-background hover:opacity-90 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-gold transition-all w-full sm:w-auto"
              >
                <FileText className="size-3.5" /> View & Print Invoice
              </button>
            </div>
          </div>

          {/* Member Savings Celebration Callout */}
          {totalSaved > 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 grid place-items-center shrink-0">
                  <Tag className="size-5 sm:size-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                    Federation Member Discount Applied
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    You saved a total of{" "}
                    <strong className="text-emerald-400 font-extrabold">
                      ₹{totalSaved.toLocaleString("en-IN")} ({savingsPercent}% OFF)
                    </strong>{" "}
                    on this purchase compared to the original market price!
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto rounded-xl bg-background/60 border border-emerald-500/30 px-4 py-2 flex sm:block justify-between items-center sm:text-right shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider sm:block">
                  Total Saved
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono sm:block">
                  ₹{totalSaved.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* Visual Tracking Progress Timeline */}
          <div className="luxe-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/70 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5 sm:pb-4">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Truck className="size-4 text-primary" /> Live Fulfillment Tracker
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase shrink-0 ${
                  isCancelled
                    ? "bg-destructive/15 text-destructive border border-destructive/30"
                    : order.orderStatus === "Delivered"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-primary/15 text-primary border border-primary/30"
                }`}
              >
                {order.orderStatus}
              </span>
            </div>

            {isCancelled ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 text-center space-y-2">
                <AlertCircle className="size-8 text-destructive mx-auto" />
                <h3 className="font-bold text-foreground text-sm">This order has been cancelled</h3>
                <p className="text-xs text-muted-foreground">
                  If you have questions regarding refunds or cancellation, please reach out to federation support.
                </p>
              </div>
            ) : (
              <div className="relative py-2 sm:py-4">
                {/* Desktop progress bar line */}
                <div className="absolute top-8 left-6 right-6 hidden md:block h-1 bg-border/60 z-0">
                  <div
                    className="h-full bg-gold-gradient transition-all duration-500"
                    style={{
                      width: `${(Math.max(0, currentStep) / (TRACKING_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 relative z-10">
                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step.status}
                        className="flex md:flex-col items-start md:items-center md:text-center gap-3 sm:gap-3.5"
                      >
                        <div
                          className={`size-9 sm:size-10 rounded-full grid place-items-center shrink-0 text-xs font-bold transition-all ${
                            isCompleted
                              ? "bg-primary text-background shadow-gold"
                              : isCurrent
                              ? "bg-gold-gradient text-background shadow-gold ring-4 ring-primary/20 animate-pulse"
                              : "bg-card border border-border text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="size-4 sm:size-5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <p
                            className={`font-bold text-xs ${
                              isCompleted || isCurrent
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier Tracking info if available */}
            {order.courierName && (
              <div className="rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Courier Partner
                  </p>
                  <p className="font-bold text-foreground text-xs sm:text-sm">
                    {order.courierName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    AWB Tracking Number
                  </p>
                  <p className="font-mono text-primary font-extrabold text-xs sm:text-sm break-all sm:break-normal">
                    {order.trackingNumber || "Assigned in dispatch"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Timeline History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="luxe-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/70 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="size-3.5 text-primary" /> Activity Log & Updates
              </h3>
              <div className="space-y-3 divide-y divide-border/40 text-xs">
                {order.statusHistory.map((hist, i) => (
                  <div key={i} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4">
                    <div>
                      <p className="font-bold text-foreground">{hist.status}</p>
                      {hist.comment && (
                        <p className="text-muted-foreground text-[11px] mt-0.5">{hist.comment}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {new Date(hist.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Details & Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Delivery Details */}
            <div className="luxe-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Delivery Address
              </h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground text-sm">{order.customer.name}</p>
                <p className="leading-relaxed">{order.customer.address}</p>
                {order.customer.landmark && (
                  <p className="text-[11px]">Landmark: {order.customer.landmark}</p>
                )}
                <p>
                  {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                </p>
                <div className="pt-2 border-t border-border/40 space-y-0.5 text-[11px]">
                  <p><strong>Phone:</strong> {order.customer.phone}</p>
                  <p><strong>Email:</strong> <span className="break-all">{order.customer.email}</span></p>
                </div>
              </div>
            </div>

            {/* Payment & Detailed Financial Breakdown */}
            <div className="luxe-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" /> Payment & Financial Summary
              </h3>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div className="flex justify-between items-center gap-2">
                  <span>Payment Gateway:</span>
                  <strong className="text-foreground shrink-0">{order.payment.method}</strong>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span>Payment Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="size-3.5" /> {order.payment.status}
                  </span>
                </div>
                {order.payment.razorpayPaymentId && (
                  <div className="flex justify-between items-center gap-2">
                    <span>Razorpay Txn ID:</span>
                    <span className="font-mono text-primary text-[10px] shrink-0 break-all">{order.payment.razorpayPaymentId}</span>
                  </div>
                )}

                <div className="border-t border-border/50 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Market Value (MRP):</span>
                    <span className="font-mono line-through">₹{totalMarketPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Total Discount Saved:</span>
                    <span>- ₹{totalSaved.toLocaleString("en-IN")} ({savingsPercent}% OFF)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal (Offer Rate):</span>
                    <span className="text-foreground font-medium">₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping & Delivery:</span>
                    <span className="text-emerald-400 font-semibold">
                      {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes (GST 18%):</span>
                    <span className="text-[11px]">Included in Price</span>
                  </div>
                </div>

                <div className="border-t-2 border-primary/40 pt-2.5 flex justify-between items-baseline text-foreground">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide block">
                      Total Paid
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      via {order.payment.method}
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-extrabold text-primary font-mono">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Items Detailed List */}
          <div className="luxe-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/70 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Package className="size-4 text-primary" /> Ordered Products ({order.items.length})
              </h2>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Itemized MRP & Savings Breakdown
              </span>
            </div>

            <div className="divide-y divide-border/50">
              {order.items.map((item, idx) => {
                const origPrice = item.originalPrice && item.originalPrice > item.price
                  ? item.originalPrice
                  : (item.price === 2000 ? 4000 : Math.round(item.price * 1.5));
                const itemSavings = Math.max(0, (origPrice - item.price) * item.quantity);
                const itemDiscountPercent = origPrice > 0 ? Math.round(((origPrice - item.price) / origPrice) * 100) : 0;

                return (
                  <div
                    key={item.code || idx}
                    className="py-3.5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs"
                  >
                    <Link
                      href={`/shop/${encodeURIComponent(item.productId || item.code)}`}
                      className="group flex items-center gap-3 sm:gap-4 min-w-0 transition-opacity hover:opacity-95 w-full sm:w-auto"
                      title={`View ${item.name} in Shop`}
                    >
                      <div className="size-14 sm:size-16 rounded-xl sm:rounded-2xl overflow-hidden border border-border/60 bg-background shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/60 shadow-sm">
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                        <p className="font-bold text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity font-normal shrink-0">
                            ↗
                          </span>
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground uppercase">
                          SKU: {item.code}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                          <span className="text-muted-foreground">
                            Qty: <strong className="text-foreground">{item.quantity}</strong>
                          </span>
                          <span className="text-muted-foreground line-through font-mono">
                            MRP: ₹{origPrice}
                          </span>
                          <span className="text-primary font-bold">
                            Offer: ₹{item.price}
                          </span>
                          {itemDiscountPercent > 0 && (
                            <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] sm:text-[10px] font-bold">
                              {itemDiscountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="w-full sm:w-auto sm:text-right shrink-0 flex sm:block justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30 space-y-0.5">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-foreground block">
                        ₹{item.price * item.quantity}
                      </span>
                      {itemSavings > 0 && (
                        <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold block">
                          You saved ₹{itemSavings.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground block font-mono">
                        (₹{item.price} × {item.quantity})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Preview Modal */}
      <InvoiceModal
        order={order}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </SiteLayout>
  );
}
