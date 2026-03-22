"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("aurora_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("aurora_cart", JSON.stringify(newItems));
  };

  const addToCart = (newItem: CartItem) => {
    const existingIndex = items.findIndex(i => i.id === newItem.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].qty += newItem.qty;
      saveCart(updated);
    } else {
      saveCart([...items, newItem]);
    }
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

  const cartCount = isMounted ? items.reduce((acc, item) => acc + item.qty, 0) : 0;
  const cartTotal = isMounted ? items.reduce((acc, item) => acc + (item.numericPrice * item.qty), 0) : 0;

  return (
    <CartContext.Provider value={{ items: isMounted ? items : [], addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
