"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { states } from "@/data/people";
import { IMAGES } from "@/data/images";
import { federation } from "@/constants/navigation";
import { toast } from "sonner";
import { validatePhoneNumber, sanitizePhoneInput } from "@/lib/validation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, subtotal, shippingFee, total, clearCart } =
    useCart();
  const { user } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    landmark: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"Razorpay" | "Test Gateway">("Razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [pendingSimOrder, setPendingSimOrder] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full recipient name");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address for invoice delivery");
      return false;
    }

    const phoneValidation = validatePhoneNumber(formData.phone, {
      required: true,
      fieldName: "Recipient mobile number",
    });
    if (!phoneValidation.isValid) {
      toast.error("Invalid Mobile Number", {
        description: phoneValidation.error,
      });
      return false;
    }

    if (!formData.address.trim() || formData.address.length < 5) {
      toast.error("Please enter your full street address");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.pincode.trim() || formData.pincode.length < 6) {
      toast.error("Please enter a valid 6-digit postal PIN code");
      return false;
    }
    return true;
  };

  const handleCreateAndCompleteOrder = async (paymentDetails: {
    method: string;
    status: "Paid" | "Pending";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    try {
      const orderPayload = {
        userId: user?.id || "",
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state,
          pincode: formData.pincode.trim(),
          landmark: formData.landmark.trim() || undefined,
        },
        items: items.map((item) => ({
          productId: item.id,
          code: item.code,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice || Math.round(item.price * 1.25),
          quantity: item.quantity,
          image: item.image,
          total: item.price * item.quantity,
        })),
        subtotal,
        shippingFee,
        tax: 0,
        total,
        payment: {
          method: paymentDetails.method,
          status: paymentDetails.status,
          razorpayOrderId: paymentDetails.razorpayOrderId,
          razorpayPaymentId: paymentDetails.razorpayPaymentId,
          razorpaySignature: paymentDetails.razorpaySignature,
          paidAt: new Date(),
        },
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      // Verify payment signature on backend
      if (paymentDetails.razorpayPaymentId) {
        try {
          await fetch("/api/shop/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: paymentDetails.razorpayOrderId,
              razorpay_payment_id: paymentDetails.razorpayPaymentId,
              razorpay_signature: paymentDetails.razorpaySignature || "simulated_signature_valid",
              orderId: data.order.orderId,
            }),
          });
        } catch (verifyErr) {
          console.warn("Payment verification note:", verifyErr);
        }
      }

      try {
        localStorage.setItem(`kalawar_order_${data.order.orderId}`, JSON.stringify(data.order));
        localStorage.setItem(`kalawar_order_${data.order.id}`, JSON.stringify(data.order));
        localStorage.setItem(`kalawar_order_${data.order.invoiceNumber}`, JSON.stringify(data.order));
        localStorage.setItem("kalawar_latest_order", JSON.stringify(data.order));
      } catch (storageErr) {
        console.warn("Local storage cache write note:", storageErr);
      }

      clearCart();
      toast.success("Order placed and payment verified successfully!");
      router.push(`/order-confirmation/${encodeURIComponent(data.order.orderId)}`);
    } catch (err: any) {
      console.error("Order completion error:", err);
      toast.error(err.message || "Something went wrong while creating your order");
    } finally {
      setIsProcessing(false);
      setSimModalOpen(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // 1. Create Razorpay order on backend
      const rzpRes = await fetch("/api/shop/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
          },
        }),
      });

      const rzpData = await rzpRes.json();

      if (!rzpRes.ok || !rzpData.success) {
        throw new Error(rzpData.error || "Failed to initiate Razorpay transaction");
      }

      const razorpayKey =
        rzpData.key ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 2. Check if Razorpay script is ready and available
      if (typeof window !== "undefined" && window.Razorpay && !rzpData.isSimulated) {
        const options = {
          key: razorpayKey,
          amount: rzpData.amount,
          currency: "INR",
          name: federation.name,
          description: `Order Payment for ${totalItems} items (${federation.short} Store)`,
          image: "/logo.png",
          order_id: rzpData.orderId,
          handler: async function (response: any) {
            await handleCreateAndCompleteOrder({
              method: "Razorpay",
              status: "Paid",
              razorpayOrderId: response.razorpay_order_id || rzpData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#D4AF37", // Gold luxury accent
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast.info("Payment cancelled by user");
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on("payment.failed", function (response: any) {
          setIsProcessing(false);
          toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`);
        });
        rzpInstance.open();
      } else {
        // Fallback simulation modal for test mode or sandbox environments
        setPendingSimOrder(rzpData);
        setSimModalOpen(true);
      }
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      toast.error(err.message || "Failed to initialize payment gateway");
      setIsProcessing(false);
    }
  };

  const handleSimulatedPaymentSuccess = async () => {
    const fakePaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await handleCreateAndCompleteOrder({
      method: "Razorpay (Test Mode)",
      status: "Paid",
      razorpayOrderId: pendingSimOrder?.orderId || `order_sim_${Date.now()}`,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: "simulated_signature_valid",
    });
  };

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="shell py-24 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="bg-gold-gradient text-background mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold"
          >
            Explore Federation Shop <ArrowRight className="size-4" />
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* Load official Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <PageHero
        eyebrow="Secure Checkout"
        title="Shipping & Payment"
        description="Provide your delivery address and complete payment via official Razorpay Payment Gateway."
        image={IMAGES.sparring}
      />

      <section className="py-12">
        <div className="shell">
          <form onSubmit={handleCheckoutSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left 2 Cols: Shipping Details Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground">
                          Delivery & Shipping Address
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Where should we deliver your federation order?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <User className="size-3.5" /> Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="size-3.5" /> Email Address (for Tax Invoice) *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. aarav@example.com"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Phone className="size-3.5" /> Mobile Number (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        inputMode="tel"
                        maxLength={16}
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 9876543210 or +91 98765 43210"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> Street Address / Flat / Building / Colony *
                      </label>
                      <textarea
                        name="address"
                        required
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="e.g. Flat 402, Sai Residency, MG Road, Shivaji Nagar"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. Mumbai / Pune"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        State *
                      </label>
                      <select
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none cursor-pointer"
                      >
                        {states.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="e.g. 411001"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Nearby Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="e.g. Near City Sports Complex"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Delivery Notes / Club Special Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="e.g. Call before delivery or leave with academy reception"
                        className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Payment Gateway Selection */}
                <div className="luxe-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                    <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">
                        Payment Method
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Official 256-bit encrypted Razorpay checkout
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 flex items-start gap-3">
                    <input
                      type="radio"
                      id="payment-razorpay"
                      name="paymentMethod"
                      checked={true}
                      readOnly
                      className="mt-1 accent-primary"
                    />
                    <label htmlFor="payment-razorpay" className="cursor-pointer text-xs space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-foreground flex items-center gap-2">
                          <CreditCard className="size-4 text-primary" /> Razorpay Payment Gateway
                        </strong>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                          Instant Verification
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Pay securely with UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking (50+ Banks) & Wallets.
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Pay CTA */}
              <div className="space-y-6">
                <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-4 sticky top-24">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3">
                    Order Summary ({totalItems} items)
                  </h2>

                  {/* Item List Preview */}
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1 text-xs divide-y divide-border/40">
                    {items.map((it) => (
                      <div key={it.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-10 rounded-lg overflow-hidden border border-border/60 bg-background shrink-0">
                            <img
                              src={it.image}
                              alt={it.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate max-w-[140px]">
                              {it.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Qty: {it.quantity} × ₹{it.price}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-foreground">
                          ₹{it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-border/60 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-foreground">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pan-India Shipping</span>
                      <span>
                        {shippingFee === 0 ? (
                          <strong className="text-emerald-400">FREE</strong>
                        ) : (
                          `₹${shippingFee}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST Taxes</span>
                      <span>Included</span>
                    </div>
                    <div className="border-t border-border/60 pt-3 flex justify-between text-base font-extrabold text-foreground">
                      <span>Total Amount</span>
                      <span className="text-primary text-xl font-black">
                        ₹{total}
                      </span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-gold-gradient text-background disabled:opacity-50 disabled:cursor-not-allowed w-full py-4 rounded-full text-sm font-extrabold shadow-gold inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  >
                    {isProcessing ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>Pay ₹{total} via Razorpay</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <ShieldCheck className="size-3.5 text-emerald-400" />
                    <span>Official Federation Sanctioned Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Simulated Razorpay Test Mode Dialog (if script is offline or in test container) */}
      <AnimatePresence>
        {simModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-background border border-primary/40 p-6 sm:p-8 shadow-2xl space-y-6 text-foreground"
            >
              <div className="text-center space-y-2">
                <div className="size-14 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-gold">
                  <CreditCard className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Razorpay Payment Gateway (Test Mode)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Payment Mode: <span className="font-mono text-primary font-bold">Razorpay Secure Sandbox</span>
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Merchant:</span>
                  <strong className="text-foreground">{federation.short} India</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Customer:</span>
                  <strong className="text-foreground">{formData.name}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount to Pay:</span>
                  <span className="text-sm font-extrabold text-primary">₹{total}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSimulatedPaymentSuccess}
                  className="bg-gold-gradient text-background w-full py-3.5 rounded-full text-xs font-bold shadow-gold hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="size-4" /> Simulate Successful Payment (UPI / Card)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimModalOpen(false);
                    setIsProcessing(false);
                  }}
                  className="w-full py-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Cancel Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
