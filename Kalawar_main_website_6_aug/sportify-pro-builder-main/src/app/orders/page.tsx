"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  RefreshCw,
  User,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { InvoiceModal } from "@/components/shop/InvoiceModal";
import { useAuth } from "@/lib/auth-context";
import type { OrderRecord } from "@/lib/orders-store";
import { IMAGES } from "@/data/images";
import { formatToDDMMYYYY } from "@/lib/utils";

export default function MyOrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated || !user) {
        setLoading(false);
        setOrders([]);
        return;
      }

      try {
        setLoading(true);
        // Build url based on logged in user
        const params = new URLSearchParams();
        if (user.id) {
          params.append("userId", user.id);
        } else if (user.email) {
          params.append("email", user.email);
        }

        const res = await fetch(`/api/shop/orders?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadOrders();
    }
  }, [user, isAuthenticated, authLoading]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "All" && o.orderStatus !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.orderId?.toLowerCase().includes(q);
      const matchInv = o.invoiceNumber?.toLowerCase().includes(q);
      const matchName = o.customer?.name?.toLowerCase().includes(q);
      const matchItem = o.items?.some((it) =>
        it.name?.toLowerCase().includes(q) || it.code?.toLowerCase().includes(q)
      );
      if (!matchId && !matchInv && !matchName && !matchItem) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: OrderRecord["orderStatus"]) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Delivered
          </span>
        );
      case "Shipped":
        return (
          <span className="rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Shipped
          </span>
        );
      case "Processing":
        return (
          <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Processing
          </span>
        );
      case "Payment Confirmed":
        return (
          <span className="rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Payment Confirmed
          </span>
        );
      case "Cancelled":
        return (
          <span className="rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold shrink-0">
            Order Placed
          </span>
        );
    }
  };

  // 1. Session verification loading state
  if (authLoading) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="Customer Orders"
          title="My Orders & Order Tracking"
          description="Track live order fulfillment status, courier dispatch tracking numbers, and view/download official GST tax invoices."
          image={IMAGES.training}
        />
        <section className="py-12 sm:py-16">
          <div className="shell max-w-4xl mx-auto space-y-6">
            <div className="luxe-card p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-border/70 animate-pulse bg-card/40">
              <div className="size-12 sm:size-14 rounded-2xl bg-primary/20 mx-auto mb-4 animate-spin flex items-center justify-center">
                <RefreshCw className="size-5 sm:size-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Verifying Account Session...</h3>
              <p className="text-xs text-muted-foreground mt-2">Checking your secure login authentication.</p>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // 2. Unauthenticated state: "Log in first"
  if (!isAuthenticated || !user) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="Account Verification Required"
          title="My Orders & Order Tracking"
          description="Access to your order history, live courier status, and official tax invoices is secured."
          image={IMAGES.training}
        />

        <section className="py-12 sm:py-16">
          <div className="shell max-w-3xl mx-auto">
            <div className="luxe-card rounded-2xl sm:rounded-3xl border border-primary/30 bg-card/90 p-5 sm:p-10 md:p-12 shadow-2xl backdrop-blur-xl text-center space-y-6 sm:space-y-8 relative overflow-hidden">
              {/* Top ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Icon & Badge */}
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-primary shadow-gold">
                  <Lock className="size-3 sm:size-3.5" /> Authentication Required
                </div>

                <div className="mx-auto flex size-16 sm:size-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border-2 border-primary/40 shadow-gold">
                  <ShieldAlert className="size-8 sm:size-10 text-primary animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    Please <span className="text-gold-gradient">Log In First</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    You cannot view or access orders without being logged into your account.
                    Please sign in to your registered athlete or customer profile to track active shipments, view past orders, and download GST tax invoices.
                  </p>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="grid grid-cols-1 sm:flex sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login?redirect=/orders"
                  className="bg-gold-gradient text-background w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold shadow-gold transition-all duration-300 hover:scale-[1.03] hover:shadow-gold-lg"
                >
                  <LogIn className="size-4" /> Log In to Account
                </Link>

                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/60 hover:bg-accent/60 hover:border-primary/50 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-foreground transition-all"
                >
                  <UserPlus className="size-4 text-primary" /> Create Account
                </Link>
              </div>

              {/* Features / Why Login Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-border/60 text-left">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/40 border border-border/50 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Truck className="size-4 shrink-0" /> Live Tracking
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Real-time courier dispatch status, AWB numbers, and delivery timeline.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/40 border border-border/50 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <FileText className="size-4 shrink-0" /> GST Tax Invoices
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Instantly view and download compliant federation PDF tax invoices.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/40 border border-border/50 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <ShieldCheck className="size-4 shrink-0" /> Verified Purchases
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Encrypted order records associated with your registered federation profile.
                  </p>
                </div>
              </div>

              {/* Secondary link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="size-3.5" /> Continue browsing the Federation Store &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // 3. Authenticated State: Show user's orders
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Customer Orders"
        title="My Orders & Order Tracking"
        description="Track live order fulfillment status, courier dispatch tracking numbers, and view/download official GST tax invoices."
        image={IMAGES.training}
      />

      <section className="py-8 sm:py-12">
        <div className="shell">
          {/* User Account Info Bar */}
          <div className="luxe-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-primary/25 mb-6 sm:mb-8 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 sm:size-11 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <User className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">{user.name}</span>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase shrink-0">
                    Logged In
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-mono truncate break-all sm:break-normal">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <Link
                href="/shop"
                className="w-full sm:w-auto bg-card hover:bg-accent border border-border/80 text-xs inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 font-semibold transition-colors shrink-0"
              >
                <ShoppingBag className="size-3.5 text-primary" /> Shop Store
              </Link>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4 pb-6 border-b border-border/60">
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
              {["All", "Payment Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full px-3.5 py-1.5 font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-card/40 border border-border/60"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full bg-card/60 border border-border/80 focus:border-primary rounded-full pl-9 pr-4 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          {/* Orders List View */}
          <div className="pt-6 sm:pt-8 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="luxe-card h-40 animate-pulse bg-accent/20 rounded-2xl sm:rounded-3xl"
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="luxe-card p-6 sm:p-12 text-center max-w-md mx-auto rounded-2xl sm:rounded-3xl border border-border/70 shadow-lg">
                <div className="size-14 sm:size-16 rounded-2xl bg-accent/40 text-muted-foreground grid place-items-center mx-auto mb-4">
                  <Package className="size-7 sm:size-8 opacity-40" />
                </div>
                <h3 className="text-base font-bold text-foreground">No orders found</h3>
                <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                  You have not placed any orders yet, or no orders match the current filter.
                </p>
                <Link
                  href="/shop"
                  className="bg-gold-gradient text-background mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-gold w-full sm:w-auto"
                >
                  <ShoppingBag className="size-3.5" /> Visit Federation Store
                </Link>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="luxe-card rounded-2xl sm:rounded-3xl border border-border/70 p-4 sm:p-6 space-y-4 sm:space-y-5 hover:border-primary/40 transition-all shadow-md bg-card/80"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 sm:pb-4">
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4">
                      <div className="col-span-2 sm:col-auto space-y-0.5 min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          Order Number
                        </span>
                        <Link
                          href={`/orders/${encodeURIComponent(order.orderId)}`}
                          className="font-mono text-xs sm:text-sm font-bold text-primary hover:underline break-all sm:break-normal block"
                        >
                          {order.orderId}
                        </Link>
                      </div>

                      <div className="h-7 w-px bg-border/60 hidden sm:block" />

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          Date Placed
                        </span>
                        <span className="text-xs text-foreground font-medium">
                          {formatToDDMMYYYY(order.createdAt, new Date())}
                        </span>
                      </div>

                      <div className="h-7 w-px bg-border/60 hidden sm:block" />

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          Total Amount
                        </span>
                        <span className="text-xs text-foreground font-extrabold font-mono">
                          ₹{order.total}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {getStatusBadge(order.orderStatus)}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="border-border/80 hover:border-primary text-xs inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium transition-colors cursor-pointer shrink-0"
                      >
                        <FileText className="size-3.5 text-primary" /> Invoice
                      </button>
                      <Link
                        href={`/orders/${encodeURIComponent(order.orderId)}`}
                        className="bg-card hover:bg-accent border border-border/80 text-xs inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold transition-colors shrink-0"
                      >
                        Track <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Items Mini List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                    {order.items.map((item, idx) => (
                      <Link
                        key={item.code || idx}
                        href={`/shop/${encodeURIComponent(item.productId || item.code)}`}
                        className="group flex items-center gap-3 rounded-xl sm:rounded-2xl bg-card/40 hover:bg-card/70 border border-border/40 hover:border-primary/50 p-2.5 transition-all"
                        title={`View ${item.name} in Shop`}
                      >
                        <div className="size-11 sm:size-12 rounded-lg sm:rounded-xl overflow-hidden bg-background border border-border/60 shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/60">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1">
                            <span className="truncate">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">↗</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            Qty: {item.quantity} · ₹{item.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Courier / Shipping Tracking Line */}
                  <div className="border-t border-border/50 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        Delivering to: <strong className="text-foreground">{order.customer.city}, {order.customer.state}</strong>
                      </span>
                    </div>

                    {order.courierName && (
                      <div className="text-[11px] font-mono break-all sm:break-normal">
                        Courier: <span className="text-foreground font-bold">{order.courierName}</span> (AWB: {order.trackingNumber || "Assigned"})
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </SiteLayout>
  );
}
