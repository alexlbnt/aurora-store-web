"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";

export default function AddToCart({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [isAdding, setIsAdding] = useState(false);

  const liked = isInWishlist(product.id);

  const handleAddToCart = () => {
    setIsAdding(true);

    const numericPrice = parseFloat(product.price.replace("R$ ", "").replace(",", "."));
    
    addToCart({
      id: `${product.id}-${selectedColor}-${selectedSize}`,
      productId: product.id,
      name: product.name,
      color: selectedColor,
      size: selectedSize,
      price: product.price,
      numericPrice,
      qty: 1,
      image: product.images[0]
    });

    setTimeout(() => {
      setIsAdding(false);
      router.push("/cart");
    }, 400);
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.categoryName,
      imageUrl: product.images[0]
    });
  };

  return (
    <div className="space-y-6 border-b border-primary/10 pb-8">
      {/* Cor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary dark:text-slate-200 uppercase tracking-widest">Cor: <span className="text-primary/70">{selectedColor}</span></span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {product.colors.map((c: string, i: number) => (
            <button 
              key={i} 
              onClick={() => setSelectedColor(c)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-all outline-none ${selectedColor === c ? 'border-primary dark:border-slate-400 bg-primary/5' : 'border-transparent bg-slate-100 hover:bg-slate-200 text-slate-600'}`} 
              title={c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tamanho */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary dark:text-slate-200 uppercase tracking-widest">Tamanho: <span className="text-primary/70">{selectedSize}</span></span>
          <button className="text-xs font-bold text-primary/60 dark:text-slate-400 underline underline-offset-4 hover:text-primary transition-colors">Guia de Medidas</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {product.sizes.map((s: string, i: number) => (
            <button 
              key={i} 
              onClick={() => setSelectedSize(s)}
              className={`py-3 rounded text-sm font-bold uppercase transition-all flex items-center justify-center ${selectedSize === s ? 'bg-primary text-white border border-primary' : 'border border-primary/20 text-primary dark:text-slate-300 hover:border-primary/60'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="pt-4 space-y-3">
        <button 
          onClick={handleAddToCart}
          disabled={isAdding}
          className="w-full bg-primary hover:bg-primary/90 text-white dark:text-slate-100 font-bold uppercase tracking-widest py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
        >
          {isAdding ? (
             <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
             <span className="material-symbols-outlined">shopping_bag</span>
          )}
          {isAdding ? "Adicionando..." : "Adicionar à Sacola"}
        </button>
        <button 
          onClick={handleWishlist}
          className="w-full bg-transparent text-primary dark:text-slate-200 border border-primary dark:border-slate-500 font-bold uppercase tracking-widest py-4 rounded-full hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
        >
          <span className={`material-symbols-outlined text-[18px] ${liked ? 'text-rose-500' : ''}`} style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
          {liked ? "Remover dos Desejos" : "Lista de Desejos"}
        </button>
      </div>
      
      <div className="flex items-center gap-3 pt-4 text-xs font-bold text-primary/60 dark:text-slate-400 uppercase tracking-widest">
        <span className="material-symbols-outlined text-lg">local_shipping</span>
        Envio em 24h úteis
      </div>
    </div>
  );
}
