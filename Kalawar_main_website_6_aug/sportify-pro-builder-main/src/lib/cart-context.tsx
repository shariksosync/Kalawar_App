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

export interface CartItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  category: string;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  isCartOpen: boolean;
  addToCart: (product: ShopProduct, quantity?: number) => void;
  removeFromCart: (identifier: string) => void;
  updateQuantity: (identifier: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "kalawar_shop_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load cart from storage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save cart to storage:", e);
    }
  }, [items, isLoaded]);

  const addToCart = useCallback(
    (product: ShopProduct, quantity: number = 1) => {
      if (product.availabilityStatus === "Out of Stock" || product.stock <= 0) {
        toast.error("This product is currently out of stock", {
          id: `cart-out-of-stock-${product.id}`,
        });
        return;
      }

      const existing = items.find(
        (i) => i.id === product.id || i.code === product.code
      );
      const maxStock = product.stock || 999;

      if (existing) {
        const currentQty = existing.quantity;
        const newQty = Math.min(currentQty + quantity, maxStock);

        if (newQty === currentQty && currentQty >= maxStock) {
          toast.error(`Maximum available stock (${maxStock}) reached in cart`, {
            id: `cart-max-stock-${product.id}`,
          });
          return;
        }

        setItems((prev) =>
          prev.map((i) =>
            i.id === product.id || i.code === product.code
              ? { ...i, quantity: newQty }
              : i
          )
        );

        toast.success(`Updated ${product.name} quantity to ${newQty}`, {
          id: `cart-notify-${product.id}`,
        });
      } else {
        const initialQty = Math.min(Math.max(1, quantity), maxStock);
        const newItem: CartItem = {
          id: product.id || product.code,
          code: product.code,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          quantity: initialQty,
          image:
            product.images?.[0] ||
            "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
          category: product.category,
          stock: maxStock,
        };

        setItems((prev) => [...prev, newItem]);

        toast.success(`Added ${product.name} to cart`, {
          id: `cart-notify-${product.id}`,
        });
      }

      setIsCartOpen(true);
    },
    [items]
  );

  const removeFromCart = useCallback(
    (identifier: string) => {
      const target = items.find(
        (i) => i.id === identifier || i.code === identifier
      );
      if (target) {
        toast.info(`Removed ${target.name} from cart`, {
          id: `cart-remove-${identifier}`,
        });
      }
      setItems((prev) =>
        prev.filter((i) => i.id !== identifier && i.code !== identifier)
      );
    },
    [items]
  );

  const updateQuantity = useCallback(
    (identifier: string, quantity: number) => {
      const target = items.find(
        (i) => i.id === identifier || i.code === identifier
      );
      if (target && quantity > (target.stock || 999)) {
        toast.error(`Only ${target.stock} units available in stock`, {
          id: `cart-stock-limit-${identifier}`,
        });
      }
      setItems((prev) =>
        prev
          .map((item) => {
            if (item.id === identifier || item.code === identifier) {
              if (quantity <= 0) return null;
              const cappedQty = Math.min(quantity, item.stock || 999);
              return { ...item, quantity: cappedQty };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
      );
    },
    [items]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Free shipping on orders over ₹999, else ₹99 flat rate
  const shippingFee = subtotal === 0 || subtotal >= 999 ? 0 : 99;
  const tax = 0; // GST included in merchandise MRP
  const total = subtotal + shippingFee + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        shippingFee,
        tax,
        total,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
