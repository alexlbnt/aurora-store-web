"use client";

import React from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";

export default function WishlistClient() {
  const { items, isMounted } = useWishlist();

  if (!isMounted) {
    return (
      <section className="py-12 md:py-20 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="mb-10 animate-pulse">
          <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3" />
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500 text-3xl font-solid" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
          Meus Favoritos
        </h1>
        <p className="text-slate-500 mt-2">Você tem {items.length} produtos salvos na sua lista.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {items.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              name={product.name}
              price={product.price}
              category={typeof product.category === 'object' ? (product.category as any)?.name : (product.category || 'Aurora')}
              imageUrl={typeof product.imageUrl === 'string' ? product.imageUrl : ((product.imageUrl as any)?.url || 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop')}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="material-symbols-outlined text-5xl text-rose-300 mb-4 block">heart_broken</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Sua lista está vazia</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Explore o nosso catálogo e clique no coração para salvar seus produtos favoritos aqui para encontrá-los facilmente depois.</p>
          <Link href="/catalog" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            Explorar Produtos
          </Link>
        </div>
      )}
    </section>
  );
}
