"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  id: string;
  /** Endereço da página; sem ele, usa o id (o produto redireciona para o endereço legível). */
  href?: string;
  name: string;
  price: string;
  category: string;
  /** Vazio ou null: mostra um espaço neutro no lugar da foto. */
  imageUrl: string | null;
  isNew?: boolean;
  soldOut?: boolean;
}

export default function ProductCard({ id, href, name, price, category, imageUrl, isNew, soldOut }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const liked = isInWishlist(id);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUrl && !imageFailed;
  const link = href || `/product/${id}`;

  return (
    <div className="group flex flex-col gap-3 relative">
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? `Remover ${name} da lista de desejos` : `Adicionar ${name} à lista de desejos`}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist({ id, name, price, category, imageUrl: imageUrl ?? "" });
        }}
        className={`absolute top-2 right-2 z-20 w-10 h-10 rounded-full backdrop-blur shadow flex items-center justify-center transition-colors ${liked ? 'bg-white text-dawn-ink' : 'bg-white/70 text-primary/70 hover:text-dawn-ink hover:bg-white'}`}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
      </button>

      <Link href={link} className="relative aspect-[3/4] overflow-hidden bg-accent-soft" aria-label={soldOut ? `${name} (esgotado)` : name}>
        {soldOut ? (
          <span className="absolute top-2 left-2 z-10 bg-white/90 text-primary text-xs font-semibold px-2.5 py-1">
            Esgotado
          </span>
        ) : isNew && (
          <span className="absolute top-2 left-2 z-10 bg-primary text-white text-xs font-medium px-2.5 py-1">
            Novo
          </span>
        )}
        {showImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            onError={() => setImageFailed(true)}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none ${soldOut ? "opacity-60 grayscale-[40%]" : ""}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-primary/30" role="img" aria-label={`Sem foto de ${name}`}>
            <span className="material-symbols-outlined text-5xl" aria-hidden="true">checkroom</span>
            <span className="font-serif text-lg" aria-hidden="true">Aurora</span>
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-1 px-1">
        <p className="text-xs text-primary/60 dark:text-slate-400">{category}</p>
        <div className="flex justify-between items-start gap-3">
          <Link href={link} className="text-primary dark:text-slate-100 font-serif text-lg leading-snug group-hover:underline decoration-primary/30 underline-offset-4">
            {name}
          </Link>
          <span className="text-primary dark:text-slate-100 font-semibold text-sm whitespace-nowrap pt-1">{price}</span>
        </div>
      </div>
    </div>
  );
}
