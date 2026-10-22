"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Package,
  ShoppingBag,
  ArrowRight,
  Printer,
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { InvoiceModal } from "@/components/shop/InvoiceModal";
import type { OrderRecord } from "@/lib/orders-store";
import { federation } from "@/constants/navigation";

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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
        console.error("Failed to load confirmed order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

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
        <div className="shell py-24 text-center">
          <h1 className="text-2xl font-bold">Order Details Not Found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We could not locate the details for reference: {id}
          </p>
          <Link
            href="/orders"
            className="bg-gold-gradient text-background mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold"
          >
            Go to My Orders <ArrowRight className="size-4" />
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="shell max-w-4xl space-y-6 sm:space-y-8">
          {/* Celebratory Banner */}
          <div className="luxe-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
            <div className="size-16 sm:size-20 rounded-2xl sm:rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 grid place-items-center mx-auto shadow-lg">
              <CheckCircle2 className="size-8 sm:size-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-emerald-400">
                Payment & Order Confirmed
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-foreground">
                Thank You for Your Order, {order.customer.name.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Your federation equipment order has been successfully placed. We have sent the confirmation and official tax invoice to <strong className="break-all">{order.customer.email}</strong>.
              </p>
            </div>

            {/* Key Order Meta Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 max-w-lg mx-auto">
              <div className="rounded-xl bg-card/80 border border-border/70 px-3.5 py-2 text-xs">
                <span className="text-muted-foreground block text-[10px]">Order Reference</span>
                <strong className="text-primary font-mono text-xs sm:text-sm break-all">{order.orderId}</strong>
              </div>
              <div className="rounded-xl bg-card/80 border border-border/70 px-3.5 py-2 text-xs">
                <span className="text-muted-foreground block text-[10px]">Tax Invoice</span>
                <strong className="text-foreground font-mono text-xs sm:text-sm break-all">{order.invoiceNumber}</strong>
              </div>
              <div className="rounded-xl bg-card/80 border border-border/70 px-3.5 py-2 text-xs">
                <span className="text-muted-foreground block text-[10px]">Total Paid</span>
                <strong className="text-foreground text-xs sm:text-sm font-extrabold font-mono">₹{order.total}</strong>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-4 border-t border-border/60 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="bg-gold-gradient text-background hover:opacity-95 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-gold transition-all w-full sm:w-auto"
              >
                <FileText className="size-4" /> Preview & Download Invoice
              </button>

              <Link
                href={`/orders/${encodeURIComponent(order.orderId)}`}
                className="border-border/80 hover:border-primary inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold transition-colors w-full sm:w-auto"
              >
                <Truck className="size-4 text-primary" /> Track Order Status
              </Link>

              <Link
                href="/shop"
                className="border-border/80 hover:border-primary text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium transition-colors w-full sm:w-auto"
              >
                <ShoppingBag className="size-4" /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Details Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Delivery Address */}
            <div className="luxe-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Shipping Address
              </h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">{order.customer.name}</p>
                <p className="leading-relaxed">{order.customer.address}</p>
                <p>
                  {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                </p>
                <p className="pt-1">Phone: {order.customer.phone}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="luxe-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" /> Payment Method
              </h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">{order.payment.method}</p>
                <p className="text-emerald-400 font-semibold">Status: {order.payment.status}</p>
                {order.payment.razorpayPaymentId && (
                  <p className="font-mono text-[10px] text-muted-foreground break-all">
                    Txn: {order.payment.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>

            {/* Federation Assurance */}
            <div className="luxe-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Federation Guarantee
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All merchandise is certified by {federation.short}. In case of sizing exchange queries, reach out at {federation.phone1}.
              </p>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="luxe-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/70 space-y-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3">
              Items in this Order ({order.items.length})
            </h2>

            <div className="divide-y divide-border/50">
              {order.items.map((item, idx) => (
                <div
                  key={item.code || idx}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <Link
                    href={`/shop/${encodeURIComponent(item.productId || item.code)}`}
                    className="group flex items-center gap-3 min-w-0 transition-opacity hover:opacity-95 w-full sm:w-auto"
                    title={`View ${item.name} in Shop`}
                  >
                    <div className="size-12 sm:size-14 rounded-lg sm:rounded-xl overflow-hidden border border-border/60 bg-background shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/60">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1">
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">↗</span>
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase">
                        SKU: {item.code}
                      </p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </Link>
                  <div className="w-full sm:w-auto sm:text-right shrink-0 flex sm:block justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                    <span className="font-bold text-foreground text-sm font-mono">
                      ₹{item.price * item.quantity}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      (₹{item.price} each)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Modal for Preview / Download */}
      <InvoiceModal
        order={order}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </SiteLayout>
  );
}
