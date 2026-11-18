"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { createLocalStore, mountedStore } from "@/lib/local-store";

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

const EMPTY_WISHLIST: WishlistItem[] = [];

type StoredWishlistItem = {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  category?: unknown;
  imageUrl?: unknown;
};

/** Favoritos salvos em versões antigas podiam ter preço numérico e categoria/imagem como objeto. */
export const parseWishlist = (raw: unknown): WishlistItem[] => {
  if (!Array.isArray(raw)) return EMPTY_WISHLIST;
  return raw
    .filter((item): item is StoredWishlistItem => !!item && typeof item === "object" && !!(item as StoredWishlistItem).id)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name || "Produto"),
      price: typeof item.price === "string" ? item.price : `R$ ${Number(item.price || 0).toFixed(2).replace(".", ",")}`,
      category:
        typeof item.category === "string" ? item.category : String((item.category as { name?: unknown } | null)?.name || "Aurora"),
      imageUrl:
        typeof item.imageUrl === "string" ? item.imageUrl : String((item.imageUrl as { url?: unknown } | null)?.url || ""),
    }));
};

const wishlistStore = createLocalStore("aurora_wishlist", parseWishlist, EMPTY_WISHLIST);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot, wishlistStore.getServerSnapshot);
  const isMounted = useSyncExternalStore(mountedStore.subscribe, mountedStore.getSnapshot, mountedStore.getServerSnapshot);

  const toggleWishlist = (item: WishlistItem) => {
    if (!item || !item.id) return;
    const exists = items.some((i) => i.id === item.id);
    wishlistStore.set(exists ? items.filter((i) => i.id !== item.id) : [...items, item]);
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
