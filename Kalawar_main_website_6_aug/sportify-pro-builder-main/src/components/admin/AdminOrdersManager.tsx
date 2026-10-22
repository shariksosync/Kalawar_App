"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  RefreshCw,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Printer,
  X,
  AlertCircle,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderRecord } from "@/lib/orders-store";
import { InvoiceModal } from "@/components/shop/InvoiceModal";
import { AdminFilterSelect } from "./AdminFilterSelect";

const ORDER_STATUS_OPTIONS = [
  "Order Placed",
  "Payment Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  // Selected Order for Modal View / Edit
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Status Update State
  const [newStatus, setNewStatus] = useState<OrderRecord["orderStatus"]>("Order Placed");
  const [statusComment, setStatusComment] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shop/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Admin load orders error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenOrderDetails = (order: OrderRecord) => {
    setActiveOrder(order);
    setNewStatus(order.orderStatus);
    setStatusComment("");
    setCourierName(order.courierName || "");
    setTrackingNumber(order.trackingNumber || "");
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeletingOrder(true);
      const targetId = deleteTarget.orderId;
      const res = await fetch(
        `/api/shop/orders/${encodeURIComponent(targetId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete order");
      }

      toast.success(`Order ${targetId} permanently deleted`);
      if (activeOrder?.orderId === targetId) {
        setActiveOrder(null);
      }
      setDeleteTarget(null);
      await loadOrders();
    } catch (err: any) {
      console.error("Delete order error:", err);
      toast.error(err.message || "Failed to delete order");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(
        `/api/shop/orders/${encodeURIComponent(activeOrder.orderId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderStatus: newStatus,
            comment: statusComment.trim() || undefined,
            courierName: courierName.trim() || undefined,
            trackingNumber: trackingNumber.trim() || undefined,
            updatedBy: "Admin",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order status");
      }

      toast.success(`Order ${activeOrder.orderId} status updated to: ${newStatus}`);
      setActiveOrder(data.order);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const uniqueStates = Array.from(
    new Set(orders.map((o) => o.customer?.state).filter(Boolean))
  ).sort() as string[];

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "All" && o.orderStatus !== statusFilter) return false;
    if (paymentFilter !== "All" && o.payment?.status !== paymentFilter) return false;
    if (paymentMethodFilter !== "All" && o.payment?.method !== paymentMethodFilter) return false;
    if (stateFilter !== "All" && o.customer?.state !== stateFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.orderId.toLowerCase().includes(q);
      const matchInv = o.invoiceNumber.toLowerCase().includes(q);
      const matchName = o.customer.name.toLowerCase().includes(q);
      const matchEmail = o.customer.email.toLowerCase().includes(q);
      const matchPhone = o.customer.phone.toLowerCase().includes(q);
      const matchCity = (o.customer.city || "").toLowerCase().includes(q);
      const matchState = (o.customer.state || "").toLowerCase().includes(q);
      if (!matchId && !matchInv && !matchName && !matchEmail && !matchPhone && !matchCity && !matchState) {
        return false;
      }
    }
    return true;
  });

  // Calculate quick stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment.status === "Paid" ? o.total : 0), 0);
  const pendingShipments = orders.filter((o) => o.orderStatus === "Payment Confirmed" || o.orderStatus === "Processing").length;
  const deliveredCount = orders.filter((o) => o.orderStatus === "Delivered").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Package className="size-5 text-primary" /> Store Orders & Customer Fulfillment
          </h2>
          <p className="text-xs text-muted-foreground">
            Track customer shipments, verify Razorpay payments, update fulfillment status, and generate tax invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="border-border/70 hover:border-primary text-xs inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition-colors"
        >
          <RefreshCw className="size-3.5" /> Refresh Orders
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-card p-4 rounded-2xl border border-border/70">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Total Orders
          </span>
          <p className="text-xl font-extrabold text-foreground mt-1">
            {orders.length}
          </p>
        </div>

        <div className="luxe-card p-4 rounded-2xl border border-border/70">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Paid Revenue
          </span>
          <p className="text-xl font-extrabold text-primary mt-1">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="luxe-card p-4 rounded-2xl border border-border/70">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Pending Dispatch
          </span>
          <p className="text-xl font-extrabold text-amber-400 mt-1">
            {pendingShipments}
          </p>
        </div>

        <div className="luxe-card p-4 rounded-2xl border border-border/70">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Delivered Orders
          </span>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">
            {deliveredCount}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar with Column Selector */}
      <div className="luxe-card p-4 rounded-2xl border border-border/70 space-y-3 bg-card/40 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, customer, city..."
                className="w-full bg-background/80 border border-border/70 focus:border-primary rounded-xl pl-9 pr-3 py-1.5 outline-none text-xs"
              />
            </div>

            {/* Column Selector */}
            <AdminFilterSelect
              icon={<Filter className="size-3.5" />}
              label="Filter by:"
              value={filterColumn}
              onChange={(val) => {
                setFilterColumn(val);
                if (val === "all") {
                  setStatusFilter("All");
                  setPaymentFilter("All");
                  setPaymentMethodFilter("All");
                  setStateFilter("All");
                }
              }}
              options={[
                { value: "all", label: "All Columns" },
                { value: "orderStatus", label: "Order Status" },
                { value: "paymentStatus", label: "Payment Status" },
                { value: "paymentMethod", label: "Payment Method" },
                { value: "state", label: "State / Region" },
              ]}
              minWidth="min-w-[180px]"
            />

            {/* Dynamic Dropdown for selected column */}
            {(filterColumn === "all" || filterColumn === "orderStatus") && (
              <AdminFilterSelect
                label="Status:"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "All", label: "All Order Statuses" },
                  ...ORDER_STATUS_OPTIONS.map((st) => ({ value: st, label: st })),
                ]}
                minWidth="min-w-[180px]"
              />
            )}

            {filterColumn === "paymentStatus" && (
              <AdminFilterSelect
                label="Payment:"
                value={paymentFilter}
                onChange={(val) => setPaymentFilter(val)}
                options={[
                  { value: "All", label: "All Payment Statuses" },
                  { value: "Paid", label: "Paid" },
                  { value: "Pending", label: "Pending" },
                  { value: "Failed", label: "Failed" },
                ]}
                minWidth="min-w-[180px]"
              />
            )}

            {filterColumn === "paymentMethod" && (
              <AdminFilterSelect
                label="Method:"
                value={paymentMethodFilter}
                onChange={(val) => setPaymentMethodFilter(val)}
                options={[
                  { value: "All", label: "All Payment Methods" },
                  { value: "Razorpay", label: "Razorpay" },
                  { value: "UPI", label: "UPI" },
                  { value: "Cash on Delivery", label: "Cash on Delivery" },
                ]}
                minWidth="min-w-[180px]"
              />
            )}

            {filterColumn === "state" && (
              <AdminFilterSelect
                label="State:"
                value={stateFilter}
                onChange={(val) => setStateFilter(val)}
                options={[
                  { value: "All", label: `All States (${uniqueStates.length})` },
                  ...uniqueStates.map((st) => ({ value: st, label: st })),
                ]}
                searchable={uniqueStates.length > 6}
                minWidth="min-w-[180px]"
              />
            )}

            {/* Clear Filter Button */}
            {(filterColumn !== "all" || statusFilter !== "All" || paymentFilter !== "All" || paymentMethodFilter !== "All" || stateFilter !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterColumn("all");
                  setStatusFilter("All");
                  setPaymentFilter("All");
                  setPaymentMethodFilter("All");
                  setStateFilter("All");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold border border-destructive/30 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <X className="size-3" /> Reset
              </button>
            )}
          </div>

          <span className="text-muted-foreground text-[11px] font-medium shrink-0">
            Showing <strong className="text-foreground">{filteredOrders.length}</strong> of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="luxe-card rounded-3xl border border-border/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-accent/30 text-muted-foreground">
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Order ID</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Date</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Customer</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Items</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Amount</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Payment</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Fulfillment Status</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Loading customer orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-accent/10 transition-colors">
                    {/* Order ID & Invoice */}
                    <td className="py-3.5 px-4 font-mono">
                      <strong className="text-primary block font-bold">
                        {ord.orderId}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        {ord.invoiceNumber}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">{ord.customer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ord.customer.phone}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {ord.customer.city}, {ord.customer.state}
                      </p>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">
                        {ord.items.length} {ord.items.length === 1 ? "product" : "products"}
                      </span>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {ord.items[0]?.name}
                        {ord.items.length > 1 ? ` +${ord.items.length - 1} more` : ""}
                      </p>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      ₹{ord.total}
                    </td>

                    {/* Payment Info */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase inline-block ${
                          ord.payment.status === "Paid"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {ord.payment.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">
                        {ord.payment.method}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold inline-block ${
                          ord.orderStatus === "Delivered"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : ord.orderStatus === "Shipped"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : ord.orderStatus === "Processing"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : ord.orderStatus === "Cancelled"
                            ? "bg-destructive/20 text-destructive border border-destructive/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="size-8 rounded-lg border border-border/70 hover:border-primary text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
                          title="Preview & Download Tax Invoice"
                        >
                          <FileText className="size-3.5 text-primary" />
                        </button>
                        <a
                          href={`/orders/${encodeURIComponent(ord.orderId)}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="size-8 rounded-lg border border-border/70 hover:border-primary text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
                          title="Open Printable A4 Invoice in New Tab"
                        >
                          <Printer className="size-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenOrderDetails(ord)}
                          className="bg-card hover:bg-accent border border-border/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                          title="Manage Order"
                        >
                          <Eye className="size-3" /> View / Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ord)}
                          className="size-8 rounded-lg border border-border/70 hover:border-destructive hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center transition-colors"
                          title={`Delete Order ${ord.orderId}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View & Update Order Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
          <div
            onClick={() => setActiveOrder(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-background border border-border/80 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold">
                  Order Management: <span className="font-mono text-primary">{activeOrder.orderId}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Invoice #{activeOrder.invoiceNumber} · Placed on {new Date(activeOrder.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/orders/${encodeURIComponent(activeOrder.orderId)}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border/70 hover:border-primary text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  <Printer className="size-3.5" /> Full Invoice Page
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(activeOrder)}
                  className="bg-gold-gradient text-background px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-gold inline-flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" /> Preview Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(activeOrder)}
                  className="border border-border/70 hover:border-destructive hover:bg-destructive/10 text-muted-foreground hover:text-destructive size-8 rounded-full grid place-items-center transition-colors"
                  title="Delete Order"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="size-8 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Customer & Payment 2-Col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-border/70 bg-card/40 p-4 space-y-1.5">
                <h4 className="font-bold uppercase text-[10px] text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" /> Customer & Delivery Details
                </h4>
                <p className="font-bold text-foreground text-sm">{activeOrder.customer.name}</p>
                <p className="text-muted-foreground">{activeOrder.customer.address}</p>
                <p className="text-muted-foreground">
                  {activeOrder.customer.city}, {activeOrder.customer.state} - {activeOrder.customer.pincode}
                </p>
                <p className="text-muted-foreground pt-1">
                  <strong>Phone:</strong> {activeOrder.customer.phone}
                </p>
                <p className="text-muted-foreground">
                  <strong>Email:</strong> {activeOrder.customer.email}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/40 p-4 space-y-1.5">
                <h4 className="font-bold uppercase text-[10px] text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-primary" /> Payment & Transaction
                </h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment Gateway:</span>
                    <strong className="text-foreground">{activeOrder.payment.method}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-bold text-emerald-400">{activeOrder.payment.status}</span>
                  </div>
                  {activeOrder.payment.razorpayPaymentId && (
                    <div className="flex justify-between">
                      <span>Razorpay Txn ID:</span>
                      <span className="font-mono text-primary text-[11px]">{activeOrder.payment.razorpayPaymentId}</span>
                    </div>
                  )}
                  <div className="border-t border-border/40 pt-1.5 flex justify-between font-bold text-sm text-foreground">
                    <span>Order Total:</span>
                    <span className="text-primary font-extrabold">₹{activeOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase text-[10px] text-muted-foreground tracking-wider">
                Purchased Products ({activeOrder.items.length})
              </h4>
              <div className="divide-y divide-border/40 rounded-2xl border border-border/70 bg-card/40 p-3">
                {activeOrder.items.map((it, idx) => (
                  <div key={it.code || idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg overflow-hidden border border-border/60 bg-background shrink-0">
                        <img src={it.image} alt={it.name} className="size-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{it.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground uppercase">SKU: {it.code} · Qty: {it.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Order Status Form */}
            <form onSubmit={handleUpdateStatus} className="luxe-card p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 text-xs">
              <h4 className="font-bold uppercase text-xs text-foreground tracking-wider flex items-center gap-2">
                <Truck className="size-4 text-primary" /> Update Fulfillment & Dispatch Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Order Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 outline-none font-bold cursor-pointer"
                  >
                    {ORDER_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Courier Partner</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. BlueDart / Delhivery"
                    className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">AWB Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BLD123456789"
                    className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Status Update Comment / Reason</label>
                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="e.g. Package dispatched with BlueDart Express. Estimated delivery in 2-3 business days."
                  className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(activeOrder)}
                  className="text-destructive hover:bg-destructive/10 border border-destructive/30 px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Delete Order
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="bg-gold-gradient text-background px-6 py-2.5 rounded-full text-xs font-bold shadow-gold disabled:opacity-50"
                >
                  {isUpdatingStatus ? "Updating..." : "Update Order Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Delete Order Confirmation Popup Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeletingOrder && setDeleteTarget(null)}
          />

          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Order Record?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This will permanently remove the order.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={() => setDeleteTarget(null)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Order Preview */}
            <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="font-mono font-bold text-primary text-sm">
                  {deleteTarget.orderId}
                </span>
                <span className="font-extrabold text-foreground text-sm">
                  ₹{deleteTarget.total}
                </span>
              </div>
              <p className="font-semibold text-foreground">
                Customer: {deleteTarget.customer.name} ({deleteTarget.customer.phone})
              </p>
              <p className="text-muted-foreground text-[11px]">
                Invoice #{deleteTarget.invoiceNumber} · Payment: {deleteTarget.payment.status} ({deleteTarget.payment.method})
              </p>
              <p className="text-muted-foreground text-[11px]">
                Status: {deleteTarget.orderStatus} · {deleteTarget.items.length} items
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this order and its invoice records? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleConfirmDeleteOrder}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDeletingOrder ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview / Download */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
}
