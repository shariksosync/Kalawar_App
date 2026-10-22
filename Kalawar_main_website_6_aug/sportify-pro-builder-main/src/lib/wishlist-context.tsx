"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import type { ShopProduct } from "@/data/shop";

export interface WishlistItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  stock: number;
  availabilityStatus: "In Stock" | "Out of Stock" | "Pre-order";
}

interface WishlistContextType {
  items: WishlistItem[];
  totalWishlistItems: number;
  isWishlistOpen: boolean;
  isInWishlist: (identifier: string) => boolean;
  toggleWishlist: (product: ShopProduct) => boolean;
  addToWishlist: (product: ShopProduct) => void;
  removeFromWishlist: (identifier: string) => void;
  clearWishlist: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlistDrawer: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "kalawar_shop_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount (accessible by both logged-in and guest users)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load wishlist from storage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save wishlist to storage:", e);
    }
  }, [items, isLoaded]);

  const isInWishlist = useCallback(
    (identifier: string) => {
      if (!identifier) return false;
      const clean = identifier.toLowerCase().trim();
      return items.some(
        (i) =>
          i.id.toLowerCase() === clean ||
          i.code.toLowerCase() === clean ||
          i.slug.toLowerCase() === clean
      );
    },
    [items]
  );

  const addToWishlist = useCallback((product: ShopProduct) => {
    const defaultImage =
      product.images?.[0] ||
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80";

    const newItem: WishlistItem = {
      id: product.id || product.code,
      code: product.code,
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: product.price,
      originalPrice: product.originalPrice,
      image: defaultImage,
      category: product.category,
      stock: product.stock,
      availabilityStatus: product.availabilityStatus || (product.stock > 0 ? "In Stock" : "Out of Stock"),
    };

    setItems((prev) => {
      const exists = prev.some(
        (i) => i.id === newItem.id || i.code.toLowerCase() === newItem.code.toLowerCase()
      );
      if (exists) return prev;
      return [newItem, ...prev];
    });

    toast.success("Saved to Wishlist", {
      description: `${product.name} has been added to your saved wishlist.`,
    });
  }, []);

  const removeFromWishlist = useCallback((identifier: string) => {
    const clean = identifier.toLowerCase().trim();
    setItems((prev) => {
      const item = prev.find(
        (i) =>
          i.id.toLowerCase() === clean ||
          i.code.toLowerCase() === clean ||
          i.slug.toLowerCase() === clean
      );
      const filtered = prev.filter(
        (i) =>
          i.id.toLowerCase() !== clean &&
          i.code.toLowerCase() !== clean &&
          i.slug.toLowerCase() !== clean
      );
      if (item) {
        toast.info("Removed from Wishlist", {
          description: `${item.name} was removed from your wishlist.`,
        });
      }
      return filtered;
    });
  }, []);

  const toggleWishlist = useCallback(
    (product: ShopProduct): boolean => {
      const id = product.id || product.code;
      if (isInWishlist(id) || isInWishlist(product.code)) {
        removeFromWishlist(id);
        return false;
      } else {
        addToWishlist(product);
        return true;
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {}
    toast.info("Wishlist Cleared", {
      description: "All saved items have been removed.",
    });
  }, []);

  const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);
  const toggleWishlistDrawer = useCallback(
    () => setIsWishlistOpen((prev) => !prev),
    []
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        totalWishlistItems: items.length,
        isWishlistOpen,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        openWishlist,
        closeWishlist,
        toggleWishlistDrawer,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
