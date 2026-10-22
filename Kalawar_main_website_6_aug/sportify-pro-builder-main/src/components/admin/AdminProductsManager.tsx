"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  Star,
  Eye,
  RefreshCw,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { ShopProduct, ShopCategory } from "@/data/shop";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { AdminFilterSelect } from "./AdminFilterSelect";

export function AdminProductsManager() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [featuredFilter, setFeaturedFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState<{
    code: string;
    name: string;
    category: string;
    description: string;
    price: number | string;
    originalPrice: number | string;
    stock: number | string;
    availabilityStatus: "In Stock" | "Out of Stock" | "Pre-order";
    status: "Active" | "Draft" | "Hidden";
    images: string[];
    featured: boolean;
    tags: string;
    specMaterial: string;
    specSize: string;
  }>({
    code: "",
    name: "",
    category: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "50",
    availabilityStatus: "In Stock",
    status: "Active",
    images: [""],
    featured: false,
    tags: "",
    specMaterial: "",
    specSize: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/shop/products?status=All"),
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
      console.error("Failed to load products in admin:", err);
      toast.error("Failed to load store products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    const year = new Date().getFullYear();
    const randomSuffix = String(products.length + 1).padStart(4, "0");
    const autoSku = `PRD-${year}-${randomSuffix}`;

    setEditingProduct(null);
    setForm({
      code: autoSku,
      name: "",
      category: categories[0]?.name || "Uniforms & Dobok",
      description: "",
      price: "",
      originalPrice: "",
      stock: "40",
      availabilityStatus: "In Stock",
      status: "Active",
      images: [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      ],
      featured: false,
      tags: "Martial Arts, Federation, Official",
      specMaterial: "Federation Approved Fabric",
      specSize: "Standard / Multi-size",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: ShopProduct) => {
    setEditingProduct(p);
    setForm({
      code: p.code,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice || "",
      stock: p.stock,
      availabilityStatus: p.availabilityStatus,
      status: p.status || "Active",
      images: p.images?.length
        ? p.images
        : [
            "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
          ],
      featured: !!p.featured,
      tags: p.tags?.join(", ") || "",
      specMaterial: p.specifications?.Material || "",
      specSize: p.specifications?.Sizes || p.specifications?.Size || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Please fill in product name and price");
      return;
    }

    setIsSubmitting(true);
    try {
      const specifications: Record<string, string> = {};
      if (form.specMaterial.trim())
        specifications["Material"] = form.specMaterial.trim();
      if (form.specSize.trim()) specifications["Sizes"] = form.specSize.trim();

      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : 0,
        stock: Number(form.stock || 0),
        availabilityStatus:
          Number(form.stock) <= 0
            ? "Out of Stock"
            : form.availabilityStatus === "Pre-order"
            ? "Pre-order"
            : "In Stock",
        status: form.status,
        images: form.images.filter((img) => img.trim() !== ""),
        featured: form.featured,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        specifications,
      };

      if (editingProduct) {
        // Update product
        const res = await fetch(
          `/api/shop/products/${encodeURIComponent(editingProduct.code)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update product");
        }
        toast.success("Product updated successfully!");
      } else {
        // Create product
        const res = await fetch("/api/shop/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create product");
        }
        toast.success(`Product created: ${payload.code}`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save product error:", err);
      toast.error(err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Confirmation State
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<ShopProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const handleConfirmDeleteProduct = async () => {
    if (!deleteTargetProduct) return;

    try {
      setIsDeletingProduct(true);
      const code = deleteTargetProduct.code;
      const res = await fetch(
        `/api/shop/products/${encodeURIComponent(code)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete product");
      }
      toast.success(`Product ${code} deleted`);
      setDeleteTargetProduct(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const filtered = products.filter((p) => {
    if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
    if (
      availabilityFilter !== "All" &&
      p.availabilityStatus !== availabilityFilter
    )
      return false;
    if (featuredFilter === "Featured" && !p.featured) return false;
    if (featuredFilter === "Standard" && p.featured) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" /> Product Catalog & Inventory Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Add new federation gear, manage pricing, SKU codes, stock availability, and image gallery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="border-border/70 hover:border-primary text-xs inline-flex items-center gap-1.5 rounded-full border px-3 py-2 transition-colors"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-gold-gradient text-background shadow-gold inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105"
          >
            <Plus className="size-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="luxe-card p-4 rounded-2xl border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs bg-card/40">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU (PRD-...), name..."
              className="w-full bg-background/80 border border-border/70 focus:border-primary rounded-xl pl-9 pr-3 py-1.5 outline-none text-xs"
            />
          </div>

          {/* Filter by Column Dropdown */}
          <AdminFilterSelect
            icon={<Filter className="size-3.5" />}
            label="Filter by:"
            value={filterColumn}
            onChange={(val) => {
              setFilterColumn(val);
              if (val === "all") {
                setCategoryFilter("All");
                setAvailabilityFilter("All");
                setFeaturedFilter("All");
              }
            }}
            options={[
              { value: "all", label: "All Columns" },
              { value: "category", label: "Category" },
              { value: "availability", label: "Stock Status" },
              { value: "featured", label: "Featured" },
            ]}
            minWidth="min-w-[180px]"
          />

          {/* Category Dropdown */}
          {(filterColumn === "all" || filterColumn === "category") && (
            <AdminFilterSelect
              label="Category:"
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: "All", label: `All Categories (${categories.length})` },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              searchable={categories.length > 6}
              minWidth="min-w-[200px]"
            />
          )}

          {/* Availability Filter */}
          {filterColumn === "availability" && (
            <AdminFilterSelect
              label="Stock:"
              value={availabilityFilter}
              onChange={(val) => setAvailabilityFilter(val)}
              options={[
                { value: "All", label: "All Stock Statuses" },
                { value: "In Stock", label: "In Stock" },
                { value: "Out of Stock", label: "Out of Stock" },
                { value: "Pre-order", label: "Pre-order" },
              ]}
              minWidth="min-w-[180px]"
            />
          )}

          {/* Featured Filter */}
          {filterColumn === "featured" && (
            <AdminFilterSelect
              label="Featured:"
              value={featuredFilter}
              onChange={(val) => setFeaturedFilter(val)}
              options={[
                { value: "All", label: "All Products" },
                { value: "Featured", label: "Featured Only" },
                { value: "Standard", label: "Standard Products" },
              ]}
              minWidth="min-w-[180px]"
            />
          )}

          {/* Clear Filter Button */}
          {(filterColumn !== "all" || categoryFilter !== "All" || availabilityFilter !== "All" || featuredFilter !== "All" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterColumn("all");
                setCategoryFilter("All");
                setAvailabilityFilter("All");
                setFeaturedFilter("All");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold border border-destructive/30 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <X className="size-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-muted-foreground text-[11px] font-medium shrink-0">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="luxe-card rounded-3xl border border-border/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-accent/30 text-muted-foreground">
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Product Code (SKU)</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Product Info</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Category</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Price</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Stock / Status</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Visibility</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id || prod.code} className="hover:bg-accent/10 transition-colors">
                    {/* SKU Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {prod.code}
                    </td>

                    {/* Image & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl overflow-hidden bg-background border border-border/60 shrink-0">
                          <img
                            src={
                              prod.images?.[0] ||
                              "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
                            }
                            alt={prod.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-foreground truncate">{prod.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {prod.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                        {prod.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-foreground">₹{prod.price}</span>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <span className="text-[10px] text-muted-foreground line-through block">
                          ₹{prod.originalPrice}
                        </span>
                      )}
                    </td>

                    {/* Stock & Availability */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold uppercase inline-block ${
                            prod.stock > 0 && prod.availabilityStatus !== "Out of Stock"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-destructive/15 text-destructive border border-destructive/30"
                          }`}
                        >
                          {prod.stock > 0
                            ? prod.availabilityStatus === "Pre-order"
                              ? "Pre-order"
                              : "In Stock"
                            : "Out of Stock"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {prod.stock} units
                        </span>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          prod.status === "Active"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {prod.status || "Active"}
                      </span>
                      {prod.featured && (
                        <span className="text-[9px] text-primary block font-bold mt-0.5">
                          ★ Featured
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(prod)}
                          className="size-8 rounded-lg border border-border/70 hover:border-primary text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetProduct(prod)}
                          className="size-8 rounded-lg border border-border/70 hover:border-destructive hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center transition-colors"
                          title="Delete product"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-background border border-border/80 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingProduct ? `Edit Product: ${editingProduct.code}` : "Add New Federation Product"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure product details, unique SKU code, price, stock, and photography.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU Code */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Unique Product Code (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="PRD-2026-0001"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 uppercase font-mono font-bold text-primary outline-none"
                  />
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Master Dobok Uniform"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Selling Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 1499"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none font-bold"
                  />
                </div>

                {/* Original Comparison Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Original MRP (for discount badge)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="e.g. 1999"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Available Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none font-bold"
                  />
                </div>

                {/* Availability Status */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Stock Availability Status
                  </label>
                  <select
                    value={form.availabilityStatus}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        availabilityStatus: e.target.value as any,
                      })
                    }
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none cursor-pointer"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Pre-order">Pre-order</option>
                  </select>
                </div>

                {/* Visibility Status */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Store Visibility
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none cursor-pointer"
                  >
                    <option value="Active">Active (Visible in Store)</option>
                    <option value="Draft">Draft</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Product Description & Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe materials, construction, sizing, federation certifications..."
                  className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                />
              </div>

              {/* Image Upload & Gallery */}
              <ImageUploadField
                label="Product Photos (Primary & Gallery)"
                value={form.images}
                onChange={(imgs) => setForm({ ...form, images: imgs })}
                multiple={true}
                folder="wsf_products"
                maxSizeMB={10}
                helperText="Upload multiple high-res product photos up to 10MB each. The first image is the primary store listing thumbnail."
              />

              {/* Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Fabric / Material Spec
                  </label>
                  <input
                    type="text"
                    value={form.specMaterial}
                    onChange={(e) =>
                      setForm({ ...form, specMaterial: e.target.value })
                    }
                    placeholder="e.g. 65% Poly, 35% Cotton"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Sizes / Dimensions Spec
                  </label>
                  <input
                    type="text"
                    value={form.specSize}
                    onChange={(e) => setForm({ ...form, specSize: e.target.value }) }
                    placeholder="e.g. 120cm to 200cm / S, M, L, XL"
                    className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prod-featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-primary size-4"
                />
                <label
                  htmlFor="prod-featured"
                  className="text-foreground font-semibold cursor-pointer select-none"
                >
                  Feature on Store Homepage & Best Sellers
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-border/70 hover:bg-accent text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold-gradient text-background px-6 py-2.5 rounded-full text-xs font-bold shadow-gold disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Luxury Delete Product Confirmation Modal */}
      {deleteTargetProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeletingProduct && setDeleteTargetProduct(null)}
          />

          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Product?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This will permanently remove the item from the store catalog.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => setDeleteTargetProduct(null)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Product Preview Card */}
            <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 flex items-center gap-3.5 text-xs">
              <div className="size-14 rounded-xl overflow-hidden border border-border/70 bg-background shrink-0">
                {deleteTargetProduct.images?.[0] ? (
                  <img
                    src={deleteTargetProduct.images[0]}
                    alt={deleteTargetProduct.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full grid place-items-center text-muted-foreground font-mono text-[10px]">
                    NO IMG
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate text-sm">
                  {deleteTargetProduct.name}
                </p>
                <p className="font-mono text-[11px] text-primary">
                  {deleteTargetProduct.code} · {deleteTargetProduct.category}
                </p>
                <p className="font-extrabold text-foreground text-xs mt-0.5">
                  ₹{deleteTargetProduct.price} · Stock: {deleteTargetProduct.stock}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this product? It will immediately become unavailable for customer purchases.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => setDeleteTargetProduct(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={handleConfirmDeleteProduct}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDeletingProduct ? (
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
    </div>
  );
}
