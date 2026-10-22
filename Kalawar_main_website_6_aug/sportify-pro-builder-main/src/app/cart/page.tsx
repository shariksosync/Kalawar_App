"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { useCart } from "@/lib/cart-context";
import { IMAGES } from "@/data/images";
import { toast } from "sonner";

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    shippingFee,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "KALAWAR10" || clean === "CHAMPION10") {
      const disc = Math.round(subtotal * 0.1);
      setDiscountAmount(disc);
      setAppliedPromo(clean);
      toast.success(`Coupon "${clean}" applied: 10% discount!`);
    } else if (clean === "FIRST50") {
      const disc = Math.min(50, subtotal);
      setDiscountAmount(disc);
      setAppliedPromo(clean);
      toast.success(`Coupon "${clean}" applied: ₹50 discount!`);
    } else {
      toast.error("Invalid or expired coupon code");
    }
  };

  const finalTotal = Math.max(0, total - discountAmount);

  const freeShippingThreshold = 999;
  const progressToFree = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Shopping Cart"
        title="Review Your Federation Gear"
        description="Verify selected tournament gear, uniforms, and rank merchandise before proceeding to secure Razorpay checkout."
        image={IMAGES.sparring}
      />

      <section className="py-12">
        <div className="shell">
          {items.length === 0 ? (
            /* Empty Cart View */
            <div className="luxe-card p-12 text-center max-w-md mx-auto my-8 border border-border/80">
              <div className="size-16 rounded-2xl bg-accent/40 text-muted-foreground grid place-items-center mx-auto mb-4">
                <ShoppingBag className="size-8 opacity-40" />
              </div>
              <h2 className="text-xl font-bold">Your cart is currently empty</h2>
              <p className="text-muted-foreground text-xs mt-2 max-w-xs mx-auto">
                Discover federation-sanctioned martial arts uniforms, sparring guards, belts, and team merchandise.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/shop"
                  className="bg-gold-gradient text-background inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold"
                >
                  Explore Store <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/orders"
                  className="border-border/70 hover:border-primary inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold"
                >
                  My Orders
                </Link>
              </div>
            </div>
          ) : (
            /* Cart Items Grid */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Free Shipping Progress bar */}
                <div className="luxe-card p-4 rounded-2xl border border-border/70 text-xs">
                  {subtotal >= freeShippingThreshold ? (
                    <div className="flex items-center gap-2 font-medium text-emerald-400">
                      <Truck className="size-4 shrink-0" />
                      <span>🎉 Congratulations! Your order qualifies for <strong>FREE Pan-India Shipping</strong>!</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Add ₹{freeShippingThreshold - subtotal} more for Free Pan-India Delivery</span>
                        <span className="font-bold text-primary">{progressToFree}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/40">
                        <div
                          className="bg-gold-gradient h-full transition-all duration-300"
                          style={{ width: `${progressToFree}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Table / Cards */}
                <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Cart Items ({totalItems})
                    </h2>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Clear Cart
                    </button>
                  </div>

                  <div className="divide-y divide-border/50">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Image & Title */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="size-20 rounded-2xl overflow-hidden border border-border/60 bg-background shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                              {item.code}
                            </span>
                            <Link
                              href={`/shop/${item.slug || item.id}`}
                              className="block text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                            >
                              {item.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Category: {item.category}
                            </p>
                            <span className="text-xs font-bold text-primary sm:hidden">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          {/* Quantity selector */}
                          <div className="border-border/70 bg-card/60 flex items-center rounded-xl border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="text-muted-foreground hover:text-foreground grid size-8 place-items-center transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="text-muted-foreground hover:text-foreground grid size-8 place-items-center transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right hidden sm:block min-w-[70px]">
                            <span className="text-sm font-extrabold text-foreground">
                              ₹{item.price * item.quantity}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              ₹{item.price} each
                            </span>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/60 flex justify-between items-center text-xs">
                    <Link
                      href="/shop"
                      className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="size-3.5" /> Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Coupon */}
              <div className="space-y-6">
                {/* Coupon Code Input */}
                <div className="luxe-card p-5 rounded-3xl border border-border/70 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" /> Promo / Discount Code
                  </h3>
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. KALAWAR10"
                      className="bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-xs flex-1 uppercase outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-card hover:bg-accent border border-border/80 px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      Apply
                    </button>
                  </form>
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5">
                      <span>✓ "{appliedPromo}" (-₹{discountAmount})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setDiscountAmount(0);
                        }}
                        className="text-[10px] underline hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="luxe-card p-6 rounded-3xl border border-border/70 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3">
                    Order Summary
                  </h2>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-foreground">₹{subtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Discount Applied</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated Pan-India Shipping</span>
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
                      <span>Inclusive</span>
                    </div>

                    <div className="border-t border-border/60 pt-3 flex justify-between text-base font-extrabold text-foreground">
                      <span>Total Pay</span>
                      <span className="text-primary text-lg font-extrabold">
                        ₹{finalTotal}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="bg-gold-gradient text-background w-full py-3.5 rounded-full text-xs font-bold shadow-gold inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] mt-2"
                  >
                    Proceed to Checkout <ArrowRight className="size-4" />
                  </Link>

                  <div className="border-t border-border/40 pt-4 text-[10px] text-muted-foreground flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="size-3.5" />
                      <span>Razorpay Secured SSL Checkout</span>
                    </div>
                    <p>
                      Official tax invoices will be issued and available for immediate download upon payment confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
