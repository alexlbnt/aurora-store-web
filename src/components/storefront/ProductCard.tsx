"use client";

import React, { useState } from "react";
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="group flex flex-col gap-3 relative">
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? `Remover ${name} da lista de desejos` : `Adicionar ${name} à lista de desejos`}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist({ id, name, price, category, imageUrl });
        }}
        className={`absolute top-2 right-2 z-20 w-10 h-10 rounded-full backdrop-blur shadow flex items-center justify-center transition-colors ${liked ? 'bg-white text-dawn-ink' : 'bg-white/70 text-primary/70 hover:text-dawn-ink hover:bg-white'}`}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
      </button>

      <Link href={`/product/${id}`} className="relative aspect-[3/4] overflow-hidden bg-accent-soft" aria-label={name}>
        {isNew && (
          <span className="absolute top-2 left-2 z-10 bg-primary text-white text-xs font-medium px-2.5 py-1">
            Novo
          </span>
        )}
        {imageFailed ? (
          <div className="absolute inset-0 flex items-center justify-center text-primary/30" role="img" aria-label={`Sem foto de ${name}`}>
            <span className="material-symbols-outlined text-5xl" aria-hidden="true">checkroom</span>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            onError={() => setImageFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </Link>

      <div className="flex flex-col gap-1 px-1">
        <p className="text-xs text-primary/60 dark:text-slate-400">{category}</p>
        <div className="flex justify-between items-start gap-3">
          <Link href={`/product/${id}`} className="text-primary dark:text-slate-100 font-serif text-lg leading-snug group-hover:underline decoration-primary/30 underline-offset-4">
            {name}
          </Link>
          <span className="text-primary dark:text-slate-100 font-semibold text-sm whitespace-nowrap pt-1">{price}</span>
        </div>
      </div>
    </div>
  );
}
