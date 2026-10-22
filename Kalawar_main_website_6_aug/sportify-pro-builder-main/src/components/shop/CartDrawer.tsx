"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    totalItems,
    subtotal,
    shippingFee,
    total,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="relative z-10 flex h-full h-dvh w-full max-w-md flex-col border-l border-border/80 bg-card text-foreground shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border/60 bg-card/80 p-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 text-primary border-primary/30 flex size-10 items-center justify-center rounded-xl border shadow-gold">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Your Shopping Cart
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {totalItems} {totalItems === 1 ? "item" : "items"} selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="hover:bg-accent hover:text-foreground text-muted-foreground grid size-9 place-items-center rounded-full border border-border/60 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            {subtotal > 0 && (
              <div className="shrink-0 border-b border-border/50 bg-accent/20 px-5 py-3 text-xs">
                {subtotal >= freeShippingThreshold ? (
                  <div className="flex items-center gap-2 font-medium text-emerald-400">
                    <Truck className="size-4 shrink-0" />
                    <span>🎉 You unlocked FREE Pan-India shipping!</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Add ₹{remainingForFreeShipping} more for free delivery</span>
                      <span className="font-semibold text-primary">
                        {progressToFreeShipping}%
                      </span>
                    </div>
                    <div className="bg-background/80 mt-1.5 h-1.5 w-full overflow-hidden rounded-full border border-border/40">
                      <div
                        className="bg-gold-gradient h-full transition-all duration-300"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="size-16 rounded-2xl bg-accent/40 text-muted-foreground grid place-items-center mb-4">
                    <ShoppingBag className="size-8 opacity-40" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Your cart is empty
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                    Explore official Kalawar uniforms, sparring protective gear, belts, and competition merchandise.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="bg-gold-gradient text-background mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold"
                  >
                    Browse Federation Shop <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="border-border/60 bg-background/50 hover:border-border/90 flex gap-3.5 rounded-2xl border p-3 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="border-border/60 relative size-20 shrink-0 overflow-hidden rounded-xl border bg-background">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${item.slug || item.id}`}
                            onClick={closeCart}
                            className="hover:text-primary truncate text-xs font-bold text-foreground transition-colors"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0 transition-colors p-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                            {item.code}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-primary">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[11px] text-muted-foreground">
                              (₹{item.price} each)
                            </span>
                          )}
                        </div>

                        <div className="border-border/70 bg-card/80 flex items-center rounded-lg border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-muted-foreground hover:text-foreground grid size-6 place-items-center text-xs transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-muted-foreground hover:text-foreground grid size-6 place-items-center text-xs transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="shrink-0 mt-auto border-border/60 bg-card border-t p-5 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="text-muted-foreground flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">₹{subtotal}</span>
                  </div>
                  <div className="text-muted-foreground flex justify-between">
                    <span>Estimated Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-emerald-400 font-semibold">FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>
                  <div className="border-border/40 text-foreground flex justify-between border-t pt-2 text-sm font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary text-base font-extrabold">
                      ₹{total}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="border-border/70 hover:border-primary flex items-center justify-center rounded-full border py-2.5 text-xs font-semibold transition-colors text-foreground hover:bg-accent/40"
                  >
                    View Full Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="bg-gold-gradient text-background flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold shadow-gold transition-transform hover:scale-[1.02]"
                  >
                    Checkout <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[10px] pt-1">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>100% Genuine Federation Merchandise & Secure Razorpay Payment</span>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
