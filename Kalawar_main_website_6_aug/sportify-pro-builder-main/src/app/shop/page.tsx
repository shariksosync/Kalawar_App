"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Star,
  Check,
  Package,
  Shield,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Heart,
  Share2,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/layout/SiteLayout";
import { Reveal } from "@/components/common/Reveal";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useSettings } from "@/lib/settings-context";
import type { ShopProduct, ShopCategory } from "@/data/shop";
import { IMAGES } from "@/data/images";
import { ShareModal } from "@/components/shop/ShareModal";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { settings, loading: settingsLoading } = useSettings();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const categoryParam = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<ShopProduct | null>(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadShopData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/shop/products"),
          fetch("/api/shop/categories"),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success && Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
        if (catData.success && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error("Failed to load shop data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    if (catName === "All") {
      router.push("/shop");
    } else {
      router.push(`/shop?category=${encodeURIComponent(catName)}`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Status filter: only active products in store
        if (p.status && p.status !== "Active") return false;

        // Category filter
        if (selectedCategory !== "All" && p.category !== selectedCategory) {
          return false;
        }

        // Availability filter
        if (availabilityFilter === "In Stock" && p.availabilityStatus !== "In Stock") {
          return false;
        }

        // Price filter
        if (p.price > priceRange) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCode = p.code.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchCode && !matchDesc && !matchCat && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "newest") return (b.code > a.code ? 1 : -1);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [
    products,
    selectedCategory,
    availabilityFilter,
    priceRange,
    searchQuery,
    sortBy,
  ]);

  const maxAvailablePrice = useMemo(() => {
    if (products.length === 0) return 5000;
    return Math.max(...products.map((p) => p.price), 5000);
  }, [products]);

  const fedName = settings?.federationName || "KALAWAR Sports & Martial Arts Federation of India";

  if (!settingsLoading && settings?.enableShop === false) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="Federation Store"
          title="Equipment Store Offline"
          description={`The official equipment shop for ${fedName} is temporarily paused.`}
          image={IMAGES.sparring}
        />
        <section className="py-24">
          <div className="shell max-w-2xl mx-auto text-center luxe-card p-12 sm:p-16 rounded-3xl space-y-4">
            <div className="size-16 rounded-full bg-accent/40 text-primary flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="size-7" />
            </div>
            <h2 className="text-2xl font-bold">Equipment Store Temporarily Paused</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Online merchandise and equipment orders are currently closed for seasonal inventory audit.
              For team orders or urgent tournament gear, please contact the federation secretariat at {settings?.contactEmail}.
            </p>
            <div className="pt-4">
              <Link
                href="/contact"
                className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-lg hover:opacity-90 transition-opacity"
              >
                Contact Secretariat
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Federation Store"
        title="Official Sports & Martial Arts Equipment"
        description="Authentic uniforms, sanctioned tournament protective gear, master rank belts, and high-performance federation athletic apparel."
        image={IMAGES.sparring}
      />

      {/* Trust Badges Banner */}
      <div className="border-y border-border/60 bg-accent/20 py-3 sm:py-4">
        <div className="shell px-3 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-xs text-muted-foreground">
          <div className="p-2.5 sm:p-3 rounded-xl bg-card/40 border border-border/40 flex items-center gap-2 sm:gap-2.5">
            <div className="size-7 sm:size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Shield className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-foreground leading-tight">100% Certified</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">Federation approved standards</p>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-card/40 border border-border/40 flex items-center gap-2 sm:gap-2.5">
            <div className="size-7 sm:size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Truck className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-foreground leading-tight">Pan-India Delivery</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">Free delivery on orders ₹999+</p>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-card/40 border border-border/40 flex items-center gap-2 sm:gap-2.5">
            <div className="size-7 sm:size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-foreground leading-tight">Secure Razorpay</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">UPI, Cards, NetBanking</p>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-card/40 border border-border/40 flex items-center gap-2 sm:gap-2.5">
            <div className="size-7 sm:size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-foreground leading-tight">Official Invoicing</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">GST tax invoices on every order</p>
            </div>
          </div>
        </div>
      </div>

      <section className="py-8 sm:py-12">
        <div className="shell px-3 sm:px-6">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between pb-6 sm:pb-8 border-b border-border/60">
            {/* Search Input */}
            <div className="relative flex-1 w-full max-w-none sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU (PRD-...), category..."
                className="w-full bg-card/60 border border-border/80 focus:border-primary rounded-full pl-10 pr-9 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Mobile Filter Trigger */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 bg-card/75 border border-border/80 hover:border-primary/60 rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Filter className="size-3.5 text-primary" />
                <span>Filters</span>
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground hidden sm:inline font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-card/75 border border-border/80 focus:border-primary rounded-full px-3 sm:px-3.5 py-2 text-xs text-foreground outline-none cursor-pointer"
                >
                  <option value="featured">Featured / Best Sellers</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>

              {/* Orders Link */}
              <Link
                href="/orders"
                className="border-border/70 hover:border-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 sm:px-4 py-2 text-xs font-medium transition-colors bg-card/75"
              >
                <Package className="size-3.5 text-primary" />
                <span>Track My Orders</span>
              </Link>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block space-y-6">
              {/* Category Filter */}
              <div className="luxe-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("All")}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      selectedCategory === "All"
                        ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>All Products</span>
                    <span className="text-[10px] opacity-70">{products.length}</span>
                  </button>

                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat.name).length;
                    const isActive = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                          isActive
                            ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="luxe-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Availability
                </h3>
                <div className="space-y-1.5 text-xs">
                  {["All", "In Stock"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === status}
                        onChange={() => setAvailabilityFilter(status)}
                        className="accent-primary"
                      />
                      <span>{status === "All" ? "All Items" : "In Stock Only"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="luxe-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Max Price
                  </h3>
                  <span className="text-xs font-bold text-primary">₹{priceRange}</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={maxAvailablePrice}
                  step={100}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₹200</span>
                  <span>₹{maxAvailablePrice}+</span>
                </div>
              </div>

              {/* Reset Filters */}
              {(selectedCategory !== "All" ||
                availabilityFilter !== "All" ||
                searchQuery ||
                priceRange < maxAvailablePrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setAvailabilityFilter("All");
                    setSearchQuery("");
                    setPriceRange(maxAvailablePrice);
                    router.push("/shop");
                  }}
                  className="w-full text-center py-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="size-3" /> Reset all filters
                </button>
              )}
            </aside>

            {/* Product Grid Area */}
            <div className="lg:col-span-3">
              {/* Category Pills Header */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
                <button
                  type="button"
                  onClick={() => handleCategorySelect("All")}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === "All"
                      ? "bg-gold-gradient text-background shadow-gold"
                      : "bg-card/60 border border-border/70 hover:border-primary text-muted-foreground"
                  }`}
                >
                  All Gear ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      selectedCategory === cat.name
                        ? "bg-gold-gradient text-background shadow-gold"
                        : "bg-card/60 border border-border/70 hover:border-primary text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="luxe-card h-80 animate-pulse bg-accent/20 rounded-3xl"
                    />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                /* No Products Found */
                <div className="luxe-card p-12 text-center max-w-md mx-auto">
                  <div className="size-16 rounded-2xl bg-accent/40 text-muted-foreground grid place-items-center mx-auto mb-4">
                    <ShoppingBag className="size-8 opacity-40" />
                  </div>
                  <h3 className="text-base font-bold">No products found</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    Try adjusting your category filter, search keyword, or price range.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setAvailabilityFilter("All");
                      setSearchQuery("");
                      setPriceRange(maxAvailablePrice);
                    }}
                    className="bg-gold-gradient text-background mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold shadow-gold"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                /* Product Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.stock <= 0;
                    const discountPercent =
                      product.originalPrice && product.originalPrice > product.price
                        ? Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100
                          )
                        : null;

                    return (
                      <Reveal key={product.id || product.code}>
                        <div className="luxe-card group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 transition-all duration-300 hover:border-primary/50 hover:shadow-gold/10">
                          {/* Image Box */}
                          <div className="relative aspect-square w-full overflow-hidden bg-background">
                            <img
                              src={
                                product.images?.[0] ||
                                "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
                              }
                              alt={product.name}
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Badge overlays */}
                            <div className="absolute left-3 top-3 flex flex-col gap-1">
                              {discountPercent && (
                                <span className="bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow-sm">
                                  {discountPercent}% OFF
                                </span>
                              )}
                              {product.featured && (
                                <span className="bg-gold-gradient text-background rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-gold">
                                  Featured
                                </span>
                              )}
                            </div>

                            {/* Unique SKU Tag, Share & Wishlist Button */}
                            <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10">
                              <span className="glass-strong border border-border/80 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                                {product.code}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShareProduct(product);
                                }}
                                aria-label={`Share ${product.name}`}
                                title={`Share ${product.name}`}
                                className="glass-strong size-7 rounded-full border border-border/80 hover:border-primary/60 text-foreground/80 hover:text-primary grid place-items-center transition-all cursor-pointer"
                              >
                                <Share2 className="size-3" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleWishlist(product);
                                }}
                                aria-label={
                                  isInWishlist(product.id) || isInWishlist(product.code)
                                    ? "Remove from wishlist"
                                    : "Save to wishlist"
                                }
                                title={
                                  isInWishlist(product.id) || isInWishlist(product.code)
                                    ? "Remove from Wishlist"
                                    : "Save to Wishlist"
                                }
                                className={`glass-strong size-7 rounded-full border grid place-items-center transition-all cursor-pointer ${
                                  isInWishlist(product.id) || isInWishlist(product.code)
                                    ? "border-rose-500/70 text-rose-500"
                                    : "border-border/80 hover:border-rose-500/60 text-foreground/80 hover:text-rose-400"
                                }`}
                              >
                                <Heart
                                  className={`size-3.5 ${
                                    isInWishlist(product.id) || isInWishlist(product.code)
                                      ? "fill-rose-500 text-rose-500"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Out of stock overlay */}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
                                <span className="rounded-full bg-destructive/20 text-destructive border border-destructive/30 px-3 py-1 text-xs font-bold uppercase">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex flex-1 flex-col justify-between p-5">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="truncate">{product.category}</span>
                                <div className="flex items-center gap-1 text-amber-400">
                                  <Star
                                    className={`size-3 ${
                                      (product.reviewsCount ?? 0) > 0 && (product.rating ?? 0) > 0
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground/30 fill-transparent"
                                    }`}
                                  />
                                  <span className="font-bold text-foreground text-[10px]">
                                    {(product.reviewsCount ?? 0) > 0 && typeof product.rating === "number"
                                      ? product.rating.toFixed(1)
                                      : "0"}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    ({product.reviewsCount ?? 0})
                                  </span>
                                </div>
                              </div>

                              <Link
                                href={`/shop/${product.slug || product.id}`}
                                className="block font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                              >
                                {product.name}
                              </Link>

                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            </div>

                            {/* Price & Action */}
                            <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-extrabold text-foreground">
                                    ₹{product.price}
                                  </span>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {isOutOfStock ? (
                                    <span className="text-destructive font-semibold">
                                      Out of Stock
                                    </span>
                                  ) : product.stock < 6 ? (
                                    <span className="text-amber-400 font-bold">
                                      Only {product.stock} left in stock
                                    </span>
                                  ) : product.stock < 20 ? (
                                    <span className="text-amber-400 font-semibold">
                                      Few Products Left
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 font-semibold">
                                      In Stock
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => addToCart(product, 1)}
                                  className="bg-gold-gradient text-background disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold shadow-gold transition-all"
                                  aria-label={`Add ${product.name} to cart`}
                                >
                                  <ShoppingBag className="size-3.5" />
                                  <span>Add</span>
                                </button>
                                <Link
                                  href={`/shop/${product.slug || product.id}`}
                                  className="border-border/70 hover:border-primary text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-full border transition-colors"
                                  aria-label="View product details"
                                >
                                  <ArrowRight className="size-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="glass-strong border-r border-border/80 relative z-10 flex h-full w-4/5 max-w-sm flex-col bg-background p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h2 className="text-base font-bold">Filters & Categories</h2>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="size-8 rounded-full border border-border/60 grid place-items-center"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleCategorySelect("All");
                      setMobileFilterOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent"
                  >
                    All Products
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id || c.slug}
                      onClick={() => {
                        handleCategorySelect(c.name);
                        setMobileFilterOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent truncate"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  Stock
                </h3>
                <div className="space-y-1 text-xs">
                  {["All", "In Stock"].map((st) => (
                    <label key={st} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={availabilityFilter === st}
                        onChange={() => setAvailabilityFilter(st)}
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setMobileFilterOpen(false)}
                className="bg-gold-gradient text-background w-full py-2.5 rounded-full text-xs font-semibold shadow-gold cursor-pointer"
              >
                Apply Filters
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {shareProduct && (
        <ShareModal
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          data={{
            title: shareProduct.name,
            text: shareProduct.description,
            image: shareProduct.images?.[0],
            price: shareProduct.price,
            code: shareProduct.code,
            category: shareProduct.category,
            url:
              typeof window !== "undefined"
                ? `${window.location.origin}/shop/${shareProduct.slug || shareProduct.id}`
                : undefined,
          }}
        />
      )}
    </SiteLayout>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-background text-foreground">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
