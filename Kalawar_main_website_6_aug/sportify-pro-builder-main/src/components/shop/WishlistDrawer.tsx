"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export function WishlistDrawer() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    totalWishlistItems,
    isWishlistOpen,
    closeWishlist,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isWishlistOpen) {
        closeWishlist();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWishlistOpen, closeWishlist]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isWishlistOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isWishlistOpen]);

  const handleMoveToCart = (item: any) => {
    addToCart(
      {
        id: item.id,
        code: item.code,
        name: item.name,
        slug: item.slug,
        category: item.category,
        description: "",
        price: item.price,
        originalPrice: item.originalPrice,
        stock: item.stock,
        availabilityStatus: item.availabilityStatus,
        images: [item.image],
        status: "Active",
        featured: false,
      },
      1
    );
    removeFromWishlist(item.id);
  };

  const handleMoveAllToCart = () => {
    const inStockItems = items.filter((i) => i.stock > 0);
    if (inStockItems.length === 0) {
      toast.error("No items in your wishlist are currently in stock");
      return;
    }

    inStockItems.forEach((item) => {
      addToCart(
        {
          id: item.id,
          code: item.code,
          name: item.name,
          slug: item.slug,
          category: item.category,
          description: "",
          price: item.price,
          originalPrice: item.originalPrice,
          stock: item.stock,
          availabilityStatus: item.availabilityStatus,
          images: [item.image],
          status: "Active",
          featured: false,
        },
        1
      );
    });

    clearWishlist();
    closeWishlist();
    openCart();
    toast.success(`Moved ${inStockItems.length} items to shopping cart!`);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isWishlistOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeWishlist}
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
                <div className="bg-rose-500/15 text-rose-400 border-rose-500/30 flex size-10 items-center justify-center rounded-xl border shadow-gold">
                  <Heart className="size-5 fill-rose-500/40" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Saved in Wishlist
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {totalWishlistItems} {totalWishlistItems === 1 ? "item" : "items"} saved for later
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWishlist}
                className="border-border/60 hover:bg-accent grid size-8 place-items-center rounded-full border text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close wishlist drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Area */}
            {items.length === 0 ? (
              /* Empty State */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="size-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 grid place-items-center text-rose-400 shadow-gold">
                  <Heart className="size-10 stroke-[1.5]" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-base font-bold text-foreground">
                    Your Wishlist is empty
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Explore federation merchandise & equipment and tap the heart icon to save your favorite products.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeWishlist}
                  className="bg-gold-gradient text-background shadow-gold rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-95"
                >
                  <ShoppingBag className="size-3.5" /> Explore Federation Shop
                </Link>
              </div>
            ) : (
              /* Items List */
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-border/40">
                  {items.map((item) => {
                    const isOutOfStock = item.stock <= 0;

                    return (
                      <div
                        key={item.id}
                        className="pt-4 first:pt-0 flex gap-4 items-start group"
                      >
                        {/* Thumbnail */}
                        <Link
                          href={`/shop/${item.slug || item.code.toLowerCase()}`}
                          onClick={closeWishlist}
                          className="size-20 shrink-0 rounded-xl overflow-hidden border border-border/70 bg-background block relative"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/shop/${item.slug || item.code.toLowerCase()}`}
                              onClick={closeWishlist}
                              className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1 block"
                            >
                              {item.name}
                            </Link>

                            <button
                              type="button"
                              onClick={() => removeFromWishlist(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] text-muted-foreground font-mono block">
                            {item.code} · {item.category}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary">
                              ₹{item.price}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{item.originalPrice}
                              </span>
                            )}
                          </div>

                          {/* Stock & Quick Move Button */}
                          <div className="flex items-center justify-between pt-1">
                            {isOutOfStock ? (
                              <span className="text-[10px] text-destructive font-semibold">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> In Stock
                              </span>
                            )}

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleMoveToCart(item)}
                              className="border border-border/80 hover:border-primary/60 hover:bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-40"
                            >
                              <ShoppingBag className="size-3" /> Move to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Toolbar */}
                <div className="shrink-0 border-t border-border/60 bg-card/80 p-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    className="w-full bg-gold-gradient text-background shadow-gold rounded-full py-3 text-xs font-bold uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="size-4" /> Move All to Cart
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={clearWishlist}
                      className="text-muted-foreground hover:text-destructive transition-colors text-[11px] font-semibold"
                    >
                      Clear Wishlist
                    </button>
                    <Link
                      href="/shop"
                      onClick={closeWishlist}
                      className="text-primary hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <span>Continue Shopping</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
