"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  isNew?: boolean;
}

export default function ProductCard({ id, name, price, category, imageUrl, isNew }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const liked = isInWishlist(id);

  return (
    <div className="group flex flex-col gap-3 relative">
      <button 
        onClick={(e) => { 
          e.preventDefault(); 
          toggleWishlist({ id, name, price, category, imageUrl }); 
        }}
        className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full backdrop-blur shadow hover:scale-110 transition-all flex items-center justify-center ${liked ? 'bg-white text-rose-500' : 'bg-white/50 text-slate-500 hover:text-rose-400 hover:bg-white'}`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
      </button>

      <Link href={`/product/${id}`} className="relative aspect-[3/4] overflow-hidden bg-primary/5 rounded">
        {isNew && (
          <span className="absolute top-2 left-2 z-10 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
            Novo
          </span>
        )}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-accent-blue/15 transition-colors duration-300" />
      </Link>
      
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-widest text-accent-blue/80 dark:text-accent-blue/60 font-bold">{category}</p>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/product/${id}`} className="text-primary dark:text-slate-100 font-serif text-sm lg:text-base group-hover:text-accent-blue group-hover:underline decoration-accent-blue/40 underline-offset-4 transition-colors">
            {name}
          </Link>
          <span className="text-primary dark:text-slate-100 font-medium text-sm whitespace-nowrap">{price}</span>
        </div>
      </div>
    </div>
  );
}
