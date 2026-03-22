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
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("aurora_wishlist");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleWishlist = (item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      const newState = exists ? prev.filter(i => i.id !== item.id) : [...prev, item];
      localStorage.setItem("aurora_wishlist", JSON.stringify(newState));
      return newState;
    });
  };

  const isInWishlist = (id: string) => {
    if (!isMounted) return false;
    return items.some(i => i.id === id);
  };

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
