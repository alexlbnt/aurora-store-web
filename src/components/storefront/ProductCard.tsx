import React from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  isNew?: boolean;
}

export default function ProductCard({ id, name, price, category, imageUrl, isNew }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-3">
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
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
      </Link>
      
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-widest text-primary/60 dark:text-slate-400 font-bold">{category}</p>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/product/${id}`} className="text-primary dark:text-slate-100 font-serif text-sm lg:text-base group-hover:underline decoration-primary/30 underline-offset-4">
            {name}
          </Link>
          <span className="text-primary dark:text-slate-100 font-medium text-sm whitespace-nowrap">{price}</span>
        </div>
      </div>
    </div>
  );
}
