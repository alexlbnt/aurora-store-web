"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  isMounted: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("aurora_wishlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar e sanitizar itens garantindo que todos tenham id e campos válidos
          const sanitized: WishlistItem[] = parsed
            .filter((item: any) => item && typeof item === "object" && item.id)
            .map((item: any) => ({
              id: String(item.id),
              name: String(item.name || "Produto"),
              price: typeof item.price === "string" ? item.price : `R$ ${Number(item.price || 0).toFixed(2).replace(".", ",")}`,
              category: typeof item.category === "string" ? item.category : (item.category?.name || "Aurora"),
              imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : (item.imageUrl?.url || "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop"),
            }));
          setItems(sanitized);
        }
      }
    } catch (e) {
      console.warn("Aviso ao ler favoritos do localStorage:", e);
    }
  }, []);

  const toggleWishlist = (item: WishlistItem) => {
    if (!item || !item.id) return;
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const newState = exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
      try {
        localStorage.setItem("aurora_wishlist", JSON.stringify(newState));
      } catch (e) {}
      return newState;
    });
  };

  const isInWishlist = (id: string) => {
    if (!isMounted || !id) return false;
    return items.some((i) => i.id === id);
  };

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist, isMounted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
