import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import { ProductModel, IProduct } from "@/models/Product";
import { CategoryModel, ICategory } from "@/models/Category";
import {
  defaultProducts,
  defaultCategories,
  type ShopProduct,
  type ShopCategory,
} from "@/data/shop";

// Helper for file storage fallback
async function getStorageFilePath(filename: string): Promise<string> {
  const primary = path.join(process.cwd(), "src", "data", "storage", filename);
  const nested = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    filename
  );

  try {
    await fs.access(primary);
    return primary;
  } catch {
    try {
      await fs.access(nested);
      return nested;
    } catch {
      try {
        await fs.mkdir(path.dirname(primary), { recursive: true });
      } catch {
        // Read-only filesystem
      }
      return primary;
    }
  }
}

async function readFileData<T>(filename: string, defaultData: T): Promise<T> {
  try {
    const file = await getStorageFilePath(filename);
    if (!content.trim()) return defaultData;
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) return defaultData;
    return parsed;
  } catch {
    return defaultData;
  }
}

async function writeFileData<T>(filename: string, data: T): Promise<void> {
  try {
    const file = await getStorageFilePath(filename);
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (err) {
    console.warn(`Notice: Could not write fallback file ${filename} (read-only filesystem):`, err instanceof Error ? err.message : "");
  }
}

export async function generateUniqueProductCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRD-${year}-`;
  try {
    await connectToDatabase();
    const count = await ProductModel.countDocuments();
    const nextNum = String(count + 1).padStart(4, "0");
    let candidate = `${prefix}${nextNum}`;

    let exists = await ProductModel.findOne({ code: candidate });
    let counter = count + 1;
    while (exists) {
      counter++;
      candidate = `${prefix}${String(counter).padStart(4, "0")}`;
      exists = await ProductModel.findOne({ code: candidate });
    }
    return candidate;
  } catch {
    const items = await readFileData<ShopProduct[]>("products.json", defaultProducts);
    const count = items.length + 1;
    return `${prefix}${String(count).padStart(4, "0")}`;
  }
}

// ----------------- PRODUCTS -----------------

export async function getProducts(options?: {
  category?: string;
  search?: string;
  status?: string;
  availabilityStatus?: string;
  featured?: boolean;
}): Promise<ShopProduct[]> {
  try {
    await connectToDatabase();
    const query: Record<string, any> = {};

    if (options?.category && options.category !== "All") {
      query.category = options.category;
    }
    if (options?.status && options.status !== "All") {
      query.status = options.status;
    }
    if (options?.availabilityStatus && options.availabilityStatus !== "All") {
      query.availabilityStatus = options.availabilityStatus;
    }
    if (typeof options?.featured === "boolean") {
      query.featured = options.featured;
    }
    if (options?.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const docs = await ProductModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(formatProductDoc);
  } catch (dbErr) {
    console.warn("Falling back to local JSON product storage:", dbErr);
    const items = await readFileData<ShopProduct[]>("products.json", defaultProducts);

    let filtered = items;
    if (options?.category && options.category !== "All") {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === options.category?.toLowerCase()
      );
    }
    if (options?.status && options.status !== "All") {
      filtered = filtered.filter((p) => p.status === options.status);
    }
    if (options?.availabilityStatus && options.availabilityStatus !== "All") {
      filtered = filtered.filter(
        (p) => p.availabilityStatus === options.availabilityStatus
      );
    }
    if (typeof options?.featured === "boolean") {
      filtered = filtered.filter((p) => p.featured === options.featured);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  }
}

export async function getProductByIdOrCode(
  identifier: string
): Promise<ShopProduct | null> {
  const cleanId = decodeURIComponent(identifier).trim();
  let dbSuccess = false;
  try {
    await connectToDatabase();
    const doc = await ProductModel.findOne({
      $or: [
        { code: cleanId.toUpperCase() },
        { slug: cleanId.toLowerCase() },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    }).lean();

    dbSuccess = true;
    if (doc) return formatProductDoc(doc);
    // If DB connected and product was not found, it is deleted or non-existent
    return null;
  } catch (err) {
    console.warn("DB lookup error for product, falling back to local file:", err);
  }

  // Only fall back to local file if DB connection failed
  if (!dbSuccess) {
    const items = await readFileData<ShopProduct[]>("products.json", []);
    const found = items.find(
      (p) =>
        p.id === cleanId ||
        p.code.toLowerCase() === cleanId.toLowerCase() ||
        p.slug.toLowerCase() === cleanId.toLowerCase()
    );
    return found || null;
  }

  return null;
}

export async function createProduct(
  data: Partial<ShopProduct>
): Promise<ShopProduct> {
  const code = data.code?.trim().toUpperCase() || (await generateUniqueProductCode());
  const slug =
    data.slug ||
    (data.name || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const stock = Number(data.stock ?? 0);
  const availabilityStatus =
    data.availabilityStatus || (stock > 0 ? "In Stock" : "Out of Stock");

  const productData = {
    code,
    name: data.name || "Untitled Product",
    slug,
    category: data.category || "Martial Arts Equipment",
    description: data.description || "",
    price: Number(data.price || 0),
    originalPrice: Number(data.originalPrice || 0),
    stock,
    availabilityStatus,
    images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80"
    ],
    status: data.status || "Active",
    featured: !!data.featured,
    tags: Array.isArray(data.tags) ? data.tags : [],
    rating: typeof data.rating === "number" ? data.rating : 0,
    reviewsCount: typeof data.reviewsCount === "number" ? data.reviewsCount : 0,
    specifications: data.specifications || {},
  };

  try {
    await connectToDatabase();
    const created = await ProductModel.create(productData);
    const formatted = formatProductDoc(created.toObject());

    // Sync to local fallback file
    try {
      const items = await readFileData<ShopProduct[]>("products.json", []);
      items.unshift(formatted);
      await writeFileData("products.json", items);
    } catch {}

    return formatted;
  } catch (dbErr) {
    console.warn("DB failed during create product, saving to file:", dbErr);
    const items = await readFileData<ShopProduct[]>("products.json", []);
    const newProd: ShopProduct = {
      id: `prd-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newProd);
    await writeFileData("products.json", items);
    return newProd;
  }
}

export async function updateProduct(
  identifier: string,
  updateData: Partial<ShopProduct>
): Promise<ShopProduct | null> {
  const cleanId = decodeURIComponent(identifier).trim();

  // Auto adjust availability based on stock
  if (updateData.stock !== undefined) {
    if (Number(updateData.stock) <= 0) {
      updateData.availabilityStatus = "Out of Stock";
    } else if (updateData.availabilityStatus !== "Pre-order") {
      updateData.availabilityStatus = "In Stock";
    }
  }

  let updatedProduct: ShopProduct | null = null;

  try {
    await connectToDatabase();
    const doc = await ProductModel.findOneAndUpdate(
      {
        $or: [
          { code: cleanId.toUpperCase() },
          { slug: cleanId.toLowerCase() },
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
        ],
      },
      { $set: updateData },
      { returnDocument: "after" }
    ).lean();

    if (doc) updatedProduct = formatProductDoc(doc);
  } catch (err) {
    console.warn("DB update failed for product:", err);
  }

  // Always sync to local file storage as well
  try {
    const items = await readFileData<ShopProduct[]>("products.json", []);
    const idx = items.findIndex(
      (p) =>
        p.id === cleanId ||
        p.code.toLowerCase() === cleanId.toLowerCase() ||
        p.slug.toLowerCase() === cleanId.toLowerCase()
    );
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      await writeFileData("products.json", items);
      if (!updatedProduct) updatedProduct = items[idx];
    }
  } catch (fileErr) {
    console.warn("File fallback update note:", fileErr);
  }

  return updatedProduct;
}

export async function deleteProduct(identifier: string): Promise<boolean> {
  const cleanId = decodeURIComponent(identifier).trim();
  let deleted = false;

  try {
    await connectToDatabase();
    const res = await ProductModel.findOneAndDelete({
      $or: [
        { code: cleanId.toUpperCase() },
        { slug: cleanId.toLowerCase() },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    });
    if (res) deleted = true;
  } catch (err) {
    console.warn("DB delete failed for product:", err);
  }

  // Always delete from local file storage as well
  try {
    const items = await readFileData<ShopProduct[]>("products.json", []);
    const filtered = items.filter(
      (p) =>
        p.id !== cleanId &&
        p.code.toLowerCase() !== cleanId.toLowerCase() &&
        p.slug.toLowerCase() !== cleanId.toLowerCase()
    );
    if (filtered.length !== items.length) {
      await writeFileData("products.json", filtered);
      deleted = true;
    }
  } catch (fileErr) {
    console.warn("File fallback delete note:", fileErr);
  }

  return deleted;
}

// ----------------- CATEGORIES -----------------

export async function getCategories(): Promise<ShopCategory[]> {
  try {
    await connectToDatabase();
    const docs = await CategoryModel.find({}).sort({ order: 1, name: 1 }).lean();
    if (docs.length === 0) {
      await seedDefaultCategories();
      const recheck = await CategoryModel.find({}).sort({ order: 1, name: 1 }).lean();
      return recheck.map((c: any) => ({
        id: c._id ? c._id.toString() : c.slug,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        icon: c.icon || "Package",
        order: c.order || 0,
      }));
    }

    return docs.map((c: any) => ({
      id: c._id ? c._id.toString() : c.slug,
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      icon: c.icon || "Package",
      order: c.order || 0,
    }));
  } catch (err) {
    console.warn("Falling back to local JSON categories:", err);
    return readFileData<ShopCategory[]>("categories.json", defaultCategories);
  }
}

export async function createCategory(
  data: Partial<ShopCategory>
): Promise<ShopCategory> {
  const slug =
    data.slug ||
    (data.name || "category")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const catData = {
    name: data.name || "New Category",
    slug,
    description: data.description || "",
    image: data.image || "",
    icon: data.icon || "Package",
    order: data.order || 0,
  };

  try {
    await connectToDatabase();
    const created = await CategoryModel.create(catData);
    return {
      id: created._id.toString(),
      name: created.name,
      slug: created.slug,
      description: created.description || "",
      image: created.image || "",
      icon: created.icon || "Package",
      order: created.order || 0,
    };
  } catch (dbErr) {
    const list = await readFileData<ShopCategory[]>(
      "categories.json",
      defaultCategories
    );
    const newCat: ShopCategory = {
      id: `cat-${Date.now()}`,
      ...catData,
    };
    list.push(newCat);
    await writeFileData("categories.json", list);
    return newCat;
  }
}

export async function updateCategory(
  identifier: string,
  updateData: Partial<ShopCategory>
): Promise<ShopCategory | null> {
  const cleanId = decodeURIComponent(identifier).trim();
  try {
    await connectToDatabase();
    const doc = await CategoryModel.findOneAndUpdate(
      {
        $or: [
          { slug: cleanId.toLowerCase() },
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
        ],
      },
      { $set: updateData },
      { returnDocument: "after" }
    ).lean();

    if (doc) {
      return {
        id: (doc as any)._id.toString(),
        name: (doc as any).name,
        slug: (doc as any).slug,
        description: (doc as any).description || "",
        image: (doc as any).image || "",
        icon: (doc as any).icon || "Package",
        order: (doc as any).order || 0,
      };
    }
  } catch (err) {
    console.warn("DB error updating category:", err);
  }

  const list = await readFileData<ShopCategory[]>(
    "categories.json",
    defaultCategories
  );
  const idx = list.findIndex(
    (c) => c.id === cleanId || c.slug.toLowerCase() === cleanId.toLowerCase()
  );
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updateData };
    await writeFileData("categories.json", list);
    return list[idx];
  }
  return null;
}

export async function deleteCategory(identifier: string): Promise<boolean> {
  const cleanId = decodeURIComponent(identifier).trim();
  try {
    await connectToDatabase();
    const res = await CategoryModel.findOneAndDelete({
      $or: [
        { slug: cleanId.toLowerCase() },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    });
    if (res) return true;
  } catch (err) {
    console.warn("DB error deleting category:", err);
  }

  const list = await readFileData<ShopCategory[]>(
    "categories.json",
    defaultCategories
  );
  const filtered = list.filter(
    (c) => c.id !== cleanId && c.slug.toLowerCase() !== cleanId.toLowerCase()
  );
  if (filtered.length !== list.length) {
    await writeFileData("categories.json", filtered);
    return true;
  }
  return false;
}

// ----------------- SEED HELPERS -----------------

async function seedDefaultCategories() {
  try {
    for (const cat of defaultCategories) {
      await CategoryModel.findOneAndUpdate(
        { slug: cat.slug },
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          icon: cat.icon,
          order: cat.order,
        },
        { upsert: true, returnDocument: "after" }
      );
    }
  } catch (e) {
    console.error("Error seeding categories:", e);
  }
}

async function seedDefaultCatalog() {
  try {
    await seedDefaultCategories();
    for (const prod of defaultProducts) {
      await ProductModel.findOneAndUpdate(
        { code: prod.code },
        {
          code: prod.code,
          name: prod.name,
          slug: prod.slug,
          category: prod.category,
          description: prod.description,
          price: prod.price,
          originalPrice: prod.originalPrice,
          stock: prod.stock,
          availabilityStatus: prod.availabilityStatus,
          images: prod.images,
          status: prod.status,
          featured: prod.featured,
          tags: prod.tags,
          rating: prod.rating,
          reviewsCount: prod.reviewsCount,
          specifications: prod.specifications,
        },
        { upsert: true, returnDocument: "after" }
      );
    }
  } catch (e) {
    console.error("Error seeding products:", e);
  }
}

function formatProductDoc(doc: any): ShopProduct {
  const stockNum = typeof doc.stock === "number" ? doc.stock : Number(doc.stock || 0);
  const availability: "In Stock" | "Out of Stock" | "Pre-order" =
    stockNum <= 0
      ? "Out of Stock"
      : doc.availabilityStatus === "Pre-order"
      ? "Pre-order"
      : "In Stock";

  return {
    id: doc._id ? doc._id.toString() : doc.code,
    code: doc.code,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    price: doc.price,
    originalPrice: doc.originalPrice,
    stock: stockNum,
    availabilityStatus: availability,
    images: Array.isArray(doc.images) ? doc.images : [],
    status: doc.status || "Active",
    featured: !!doc.featured,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    rating: doc.rating || 4.8,
    reviewsCount: doc.reviewsCount || 0,
    specifications:
      doc.specifications instanceof Map
        ? Object.fromEntries(doc.specifications)
        : doc.specifications || {},
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}
