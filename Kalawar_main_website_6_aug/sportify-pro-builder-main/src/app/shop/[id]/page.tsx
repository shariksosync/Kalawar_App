"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Star,
  Shield,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Share2,
  Plus,
  Minus,
  Zap,
  Sparkles,
  Package,
  Heart,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Reveal } from "@/components/common/Reveal";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { ShopProduct } from "@/data/shop";
import { toast } from "sonner";
import { ProductReviewsSection } from "@/components/shop/ProductReviewsSection";
import { ShareModal } from "@/components/shop/ShareModal";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleRatingUpdate = useCallback((newRating: number, newCount: number) => {
    setProduct((prev) => {
      if (!prev) return null;
      if (prev.rating === newRating && prev.reviewsCount === newCount) return prev;
      return { ...prev, rating: newRating, reviewsCount: newCount };
    });
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/shop/products/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          setSelectedImage(
            data.product.images?.[0] ||
              "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
          );

          // Fetch related products in the same category
          try {
            const relRes = await fetch(
              `/api/shop/products?category=${encodeURIComponent(
                data.product.category
              )}`
            );
            const relData = await relRes.json();
            if (relData.success && Array.isArray(relData.products)) {
              setRelatedProducts(
                relData.products
                  .filter((p: ShopProduct) => p.code !== data.product.code)
                  .slice(0, 4)
              );
            }
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
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

  if (!product) {
    return (
      <SiteLayout>
        <div className="shell py-24 text-center">
          <div className="size-16 rounded-2xl bg-accent/40 text-muted-foreground grid place-items-center mx-auto mb-4">
            <Package className="size-8 opacity-40" />
          </div>
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The product you requested might have been moved or is no longer available.
          </p>
          <Link
            href="/shop"
            className="bg-gold-gradient text-background mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-gold"
          >
            <ArrowLeft className="size-4" /> Back to Federation Shop
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : null;

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  return (
    <SiteLayout>
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border/60 bg-accent/10 pt-28 pb-4">
        <div className="shell flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
            <span>/</span>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="hover:text-foreground"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`inline-flex items-center gap-1.5 transition-colors text-xs px-2.5 py-1 rounded-full border cursor-pointer ${
                isInWishlist(product.id) || isInWishlist(product.code)
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold"
                  : "border-border/60 hover:border-rose-500/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart
                className={`size-3.5 ${
                  isInWishlist(product.id) || isInWishlist(product.code)
                    ? "fill-rose-500 text-rose-500"
                    : ""
                }`}
              />
              <span>
                {isInWishlist(product.id) || isInWishlist(product.code)
                  ? "Wishlisted"
                  : "Wishlist"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Share product with others"
              className="border-border/60 hover:border-primary/50 hover:bg-accent/40 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-all text-xs px-2.5 py-1 rounded-full border cursor-pointer"
            >
              <Share2 className="size-3.5 text-primary" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="luxe-card relative aspect-square w-full overflow-hidden rounded-3xl border border-border/70 bg-background">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="size-full object-cover"
                />

                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {discountPercent && (
                    <span className="bg-destructive text-destructive-foreground rounded-full px-3 py-1 text-xs font-extrabold shadow-sm">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {product.featured && (
                    <span className="bg-gold-gradient text-background rounded-full px-3 py-1 text-xs font-bold shadow-gold">
                      Federation Choice
                    </span>
                  )}
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <span className="glass-strong border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    {product.code}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShareModalOpen(true);
                    }}
                    aria-label="Share product"
                    title="Share product"
                    className="glass-strong size-8 rounded-full border border-border/80 hover:border-primary/60 text-foreground hover:text-primary grid place-items-center transition-all cursor-pointer"
                  >
                    <Share2 className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product);
                    }}
                    aria-label={
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    title={
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "Remove from Wishlist"
                        : "Save to Wishlist"
                    }
                    className={`glass-strong size-8 rounded-full border grid place-items-center transition-all group cursor-pointer ${
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "border-rose-500/70 text-rose-500"
                        : "border-border/80 hover:border-rose-500/60 text-foreground hover:text-rose-400"
                    }`}
                  >
                    <Heart
                      className={`size-4 transition-transform group-active:scale-125 ${
                        isInWishlist(product.id) || isInWishlist(product.code)
                          ? "fill-rose-500 text-rose-500"
                          : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border transition-all ${
                        selectedImage === img
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-border/60 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info & Purchase Controls */}
            <div className="space-y-6">
              {/* Header Info */}
              <div className="space-y-2 border-b border-border/60 pb-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-0.5 text-xs font-semibold">
                    {product.category}
                  </span>
                  <a
                    href="#reviews"
                    title="Jump to athlete reviews"
                    className="flex items-center gap-1.5 text-amber-400 hover:opacity-85 transition-opacity cursor-pointer group"
                  >
                    <Star
                      className={`size-4 ${
                        (product.reviewsCount ?? 0) > 0 && (product.rating ?? 0) > 0
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 fill-transparent"
                      }`}
                    />
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {(product.reviewsCount ?? 0) > 0 && typeof product.rating === "number"
                        ? product.rating.toFixed(1)
                        : "0"}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:underline">
                      ({product.reviewsCount ?? 0}{" "}
                      {product.reviewsCount === 1 ? "review" : "reviews"})
                    </span>
                  </a>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-primary">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    (GST inclusive)
                  </span>
                </div>

                {/* Stock status indicator */}
                <div className="pt-2">
                  {isOutOfStock ? (
                    <span className="rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
                      ✕ Out of Stock
                    </span>
                  ) : product.stock < 6 ? (
                    <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="size-3.5" /> In Stock ({product.stock} units available)
                    </span>
                  ) : product.stock < 20 ? (
                    <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Few Products Left In Stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" /> In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications / Highlights */}
              {product.specifications &&
                Object.keys(product.specifications).length > 0 && (
                  <div className="luxe-card p-5 space-y-3.5 rounded-2xl border border-border/70">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Product Specifications
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      {Object.entries(product.specifications).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-start gap-2.5 border-b border-border/40 pb-2.5"
                        >
                          <span className="text-muted-foreground font-medium shrink-0 min-w-[90px]">
                            {k}:
                          </span>
                          <span className="text-foreground font-semibold min-w-0 leading-relaxed">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quantity & CTA Buttons */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quantity:
                  </span>
                  <div className="border-border/70 bg-card/60 flex items-center rounded-xl border">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 grid size-9 place-items-center transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock || isOutOfStock}
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 grid size-9 place-items-center transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 border-border/80 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-card/40 flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold transition-all hover:bg-accent/40"
                  >
                    <ShoppingBag className="size-4 text-primary" /> Add to Cart
                  </button>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="flex-1 bg-gold-gradient text-background disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold shadow-gold transition-transform hover:scale-[1.02]"
                  >
                    <Zap className="size-4" /> Buy Now
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    title={
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "Remove from Wishlist"
                        : "Save to Wishlist"
                    }
                    className={`size-12 shrink-0 rounded-full border grid place-items-center transition-all cursor-pointer ${
                      isInWishlist(product.id) || isInWishlist(product.code)
                        ? "border-rose-500/60 bg-rose-500/10 text-rose-400"
                        : "border-border/80 hover:border-rose-500/50 bg-card/40 text-muted-foreground hover:text-rose-400 hover:bg-accent/40"
                    }`}
                  >
                    <Heart
                      className={`size-5 ${
                        isInWishlist(product.id) || isInWishlist(product.code)
                          ? "fill-rose-500 text-rose-500"
                          : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    aria-label="Share product"
                    title="Share product with others"
                    className="size-12 shrink-0 rounded-full border border-border/80 hover:border-primary/60 bg-card/40 text-muted-foreground hover:text-primary hover:bg-accent/40 grid place-items-center transition-all cursor-pointer"
                  >
                    <Share2 className="size-5" />
                  </button>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="border-border/60 bg-accent/20 grid grid-cols-3 gap-3 rounded-2xl border p-4 text-center text-[11px] text-muted-foreground">
                <div className="space-y-1">
                  <Shield className="size-4 mx-auto text-primary" />
                  <p className="font-bold text-foreground">100% Authentic</p>
                  <p className="text-[10px]">Official Federation Seal</p>
                </div>
                <div className="space-y-1 border-x border-border/60">
                  <Truck className="size-4 mx-auto text-primary" />
                  <p className="font-bold text-foreground">Fast Dispatch</p>
                  <p className="text-[10px]">Pan-India Courier</p>
                </div>
                <div className="space-y-1">
                  <RotateCcw className="size-4 mx-auto text-primary" />
                  <p className="font-bold text-foreground">Easy Exchange</p>
                  <p className="text-[10px]">Size Fit Guarantee</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Customer & Athlete Reviews Section */}
          <ProductReviewsSection
            product={product}
            onRatingUpdate={handleRatingUpdate}
          />

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-border/60 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Related Federation Gear</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Other athletes also checked these items from {product.category}
                  </p>
                </div>
                <Link
                  href={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View all in category →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rel) => (
                  <Link
                    key={rel.id || rel.code}
                    href={`/shop/${rel.slug || rel.id}`}
                    className="luxe-card group rounded-2xl overflow-hidden border border-border/60 hover:border-primary/50 transition-all flex flex-col justify-between p-4"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-background mb-3">
                      <img
                        src={rel.images?.[0] || selectedImage}
                        alt={rel.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {rel.code}
                      </span>
                      <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary">
                        {rel.name}
                      </h3>
                      <p className="text-sm font-extrabold text-primary">₹{rel.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={{
          title: product.name,
          text: product.description,
          image: selectedImage || product.images?.[0],
          price: product.price,
          code: product.code,
          category: product.category,
        }}
      />
    </SiteLayout>
  );
}
