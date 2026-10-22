"use client";

import { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { ShopCategory, ShopProduct } from "@/data/shop";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export function AdminCategoriesManager() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<ShopCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    icon: "Package",
    order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/shop/categories"),
        fetch("/api/shop/products?status=All"),
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
    } catch (err) {
      console.error("Failed to load categories in admin:", err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      image:
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      icon: "Package",
      order: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ShopCategory) => {
    setEditingCategory(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      icon: c.icon || "Package",
      order: c.order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter category name");
      return;
    }

    setIsSubmitting(true);
    try {
      const slug =
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        image: form.image.trim(),
        icon: form.icon,
        order: Number(form.order || 0),
      };

      if (editingCategory) {
        const res = await fetch("/api/shop/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id || editingCategory.slug, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update category");
        }
        toast.success("Category updated!");
      } else {
        const res = await fetch("/api/shop/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create category");
        }
        toast.success(`Category created: ${payload.name}`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteTargetCategory) return;
    const id = deleteTargetCategory.id || deleteTargetCategory.slug;
    const name = deleteTargetCategory.name;

    try {
      setIsDeletingCategory(true);
      const res = await fetch(
        `/api/shop/categories?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete category");
      }
      toast.success(`Category "${name}" deleted`);
      setDeleteTargetCategory(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const productCount = products.filter((p) => p.category === name).length;
    if (productCount > 0) {
      if (
        !window.confirm(
          `This category has ${productCount} assigned products. Deleting it will leave those products uncategorized. Proceed?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Delete category "${name}"?`)) return;
    }

    try {
      const res = await fetch(
        `/api/shop/categories?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete category");
      }
      toast.success(`Category "${name}" deleted`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderTree className="size-5 text-primary" /> Product Category Taxonomy
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize federation store catalog into structured gear and merchandise collections.
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
            onClick={handleOpenCreate}
            className="bg-gold-gradient text-background shadow-gold inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105"
          >
            <Plus className="size-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="luxe-card p-4 rounded-2xl border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs bg-card/40">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full bg-background/80 border border-border/70 focus:border-primary rounded-xl pl-9 pr-3 py-1.5 outline-none text-xs"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold border border-destructive/30 transition-colors cursor-pointer"
            >
              <X className="size-3" /> Clear
            </button>
          )}
        </div>

        <div className="text-muted-foreground text-[11px] font-medium shrink-0">
          Showing <strong className="text-foreground">
            {categories.filter((c) => !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase())).length}
          </strong> of {categories.length} categories
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="luxe-card h-48 animate-pulse bg-accent/20 rounded-3xl"
            />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full luxe-card p-12 text-center text-muted-foreground">
            No categories available. Click "Add Category" to create one.
          </div>
        ) : (
          categories
            .filter((c) => !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;

            return (
              <div
                key={cat.id || cat.slug}
                className="luxe-card rounded-3xl border border-border/70 overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all p-5 space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="size-16 rounded-2xl overflow-hidden bg-background border border-border/60 shrink-0">
                    <img
                      src={
                        cat.image ||
                        "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={cat.name}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm truncate">
                        {cat.name}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground block truncate">
                      slug: {cat.slug}
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {cat.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold">
                    {count} {count === 1 ? "Product" : "Products"}
                  </span>

                    <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="size-8 rounded-lg border border-border/70 hover:border-primary grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetCategory(cat)}
                      className="size-8 rounded-lg border border-border/70 hover:border-destructive hover:bg-destructive/10 grid place-items-center text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl bg-background border border-border/80 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingCategory ? "Edit Category" : "Add Product Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sparring Uniforms"
                  className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. sparring-uniforms"
                  className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief overview of items in this category"
                  className="w-full bg-card/80 border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-foreground outline-none"
                />
              </div>

              {/* Category Image Upload */}
              <ImageUploadField
                label="Category Banner Image"
                value={form.image}
                onChange={(imgUrl) => setForm({ ...form, image: imgUrl })}
                multiple={false}
                folder="wsf_categories"
                helperText="Upload an image banner for this category collection."
              />

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
                    : editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Delete Category Confirmation Modal */}
      {deleteTargetCategory && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeletingCategory && setDeleteTargetCategory(null)}
          />

          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Category?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setDeleteTargetCategory(null)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Category Preview */}
            <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="font-bold text-foreground text-sm">
                  {deleteTargetCategory.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  slug: {deleteTargetCategory.slug}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                {deleteTargetCategory.description || "No description provided."}
              </p>
              {products.filter((p) => p.category === deleteTargetCategory.name).length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-300 text-[11px] font-medium">
                  ⚠️ Notice: {products.filter((p) => p.category === deleteTargetCategory.name).length} product(s) are currently assigned to this category.
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete category "{deleteTargetCategory.name}"?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setDeleteTargetCategory(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDeletingCategory ? (
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
