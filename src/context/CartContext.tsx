"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { createLocalStore, mountedStore } from "@/lib/local-store";

export interface CartItem {
  id: string; // unique identifier (often variantId or slug-color-size)
  productId: string;
  name: string;
  color: string;
  size: string;
  price: string;
  numericPrice: number;
  qty: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  /** Aplica preços atuais (em reais) informados pelo servidor, por id da linha. */
  updatePrices: (prices: Record<string, number>) => void;
  cartCount: number;
  cartTotal: number;
  isMounted: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const EMPTY_CART: CartItem[] = [];

const parseCart = (raw: unknown): CartItem[] =>
  Array.isArray(raw)
    ? raw.filter((item): item is CartItem => !!item && typeof item === "object" && "id" in item && !!item.id)
    : EMPTY_CART;

const cartStore = createLocalStore("aurora_cart", parseCart, EMPTY_CART);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const isMounted = useSyncExternalStore(mountedStore.subscribe, mountedStore.getSnapshot, mountedStore.getServerSnapshot);

  const saveCart = (newItems: CartItem[]) => cartStore.set(newItems);

  const addToCart = (newItem: CartItem) => {
    const existing = items.find((i) => i.id === newItem.id);
    saveCart(
      existing
        ? items.map((i) => (i.id === newItem.id ? { ...i, qty: i.qty + newItem.qty } : i))
        : [...items, newItem]
    );
  };

  const removeFromCart = (id: string) => {
    saveCart(items.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    const updated = items.map(i => i.id === id ? { ...i, qty } : i);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const updatePrices = (prices: Record<string, number>) => {
    saveCart(
      items.map((i) =>
        prices[i.id] !== undefined
          ? { ...i, numericPrice: prices[i.id], price: `R$ ${prices[i.id].toFixed(2).replace(".", ",")}` }
          : i
      )
    );
  };

  const cartCount = isMounted ? items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0) : 0;
  const cartTotal = isMounted ? items.reduce((acc, item) => {
    const rawPrice = item.numericPrice ?? (parseFloat(String(item.price || "0").replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0);
    const validPrice = typeof rawPrice === "number" && !isNaN(rawPrice) ? rawPrice : 0;
    const validQty = typeof item.qty === "number" && !isNaN(item.qty) && item.qty > 0 ? item.qty : 1;
    return acc + (validPrice * validQty);
  }, 0) : 0;

  return (
    <CartContext.Provider value={{ items: isMounted ? items : [], addToCart, removeFromCart, updateQuantity, clearCart, updatePrices, cartCount, cartTotal, isMounted }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
