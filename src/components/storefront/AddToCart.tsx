"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface StockVariant {
  color: string;
  size: string;
  stock: number;
}

interface AddToCartProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
  colors: string[];
  sizes: string[];
  categoryName: string;
  variants: StockVariant[];
}

export default function AddToCart({ product }: { product: AddToCartProduct }) {
  const { items, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Produto sem variações cadastradas: não há estoque por combinação para conferir.
  const hasVariants = product.variants.length > 0;

  const stockOf = (color: string, size: string) =>
    product.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0;
  const colorHasStock = (color: string) =>
    !hasVariants || product.variants.some((v) => v.color === color && v.stock > 0);
  const sizeHasStock = (color: string, size: string) => !hasVariants || stockOf(color, size) > 0;

  const firstAvailable = useMemo(() => {
    if (!hasVariants) return { color: product.colors[0], size: product.sizes[0] };
    const v = product.variants.find((x) => x.stock > 0) ?? product.variants[0];
    return { color: v.color, size: v.size };
  }, [hasVariants, product.colors, product.sizes, product.variants]);

  const [selectedColor, setSelectedColor] = useState(firstAvailable.color);
  const [selectedSize, setSelectedSize] = useState(firstAvailable.size);
  const [justAdded, setJustAdded] = useState(false);

  const liked = isInWishlist(product.id);

  const cartLineId = `${product.id}-${selectedColor}-${selectedSize}`;
  const inCart = items.find((i) => i.id === cartLineId)?.qty ?? 0;
  const stock = hasVariants ? stockOf(selectedColor, selectedSize) : Infinity;
  const remaining = stock - inCart;
  const soldOut = hasVariants && stock <= 0;
  const reachedLimit = !soldOut && remaining <= 0;

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    // Se o tamanho atual não existe nessa cor, vai para o primeiro disponível.
    if (!sizeHasStock(color, selectedSize)) {
      const next = product.sizes.find((s) => sizeHasStock(color, s));
      if (next) setSelectedSize(next);
    }
    setJustAdded(false);
  };

  const handleAddToCart = () => {
    if (soldOut || reachedLimit) return;
    const cleanPriceStr = String(product.price).replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
    const numericPrice = parseFloat(cleanPriceStr) || 0;

    addToCart({
      id: cartLineId,
      productId: product.id,
      name: product.name,
      color: selectedColor,
      size: selectedSize,
      price: product.price,
      numericPrice,
      qty: 1,
      image: product.images[0],
    });
    setJustAdded(true);
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.categoryName,
      imageUrl: product.images[0],
    });
  };

  const stockMessage = soldOut
    ? "Indisponível nesta combinação"
    : stock !== Infinity && stock <= 3
      ? `Restam ${stock} ${stock === 1 ? "unidade" : "unidades"}`
      : null;

  return (
    <div className="space-y-6 border-b border-primary/10 pb-8">
      {/* Cor */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary dark:text-slate-200">
          Cor: <span className="font-normal text-primary/70">{selectedColor}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {product.colors.map((c) => {
            const available = colorHasStock(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selectedColor === c}
                onClick={() => handleSelectColor(c)}
                className={`min-h-11 px-4 rounded-full border text-sm font-medium transition-colors ${
                  selectedColor === c
                    ? "border-primary bg-primary text-white"
                    : "border-primary/25 text-primary hover:border-primary"
                } ${available ? "" : "opacity-50 line-through"}`}
              >
                {c}
                {!available && <span className="sr-only"> (indisponível)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tamanho */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary dark:text-slate-200">
            Tamanho: <span className="font-normal text-primary/70">{selectedSize}</span>
          </p>
          <Link href="/faq#tamanhos" className="text-sm text-accent-blue underline underline-offset-4 hover:text-primary">
            Guia de medidas
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {product.sizes.map((s) => {
            const available = sizeHasStock(selectedColor, s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selectedSize === s}
                disabled={!available}
                onClick={() => {
                  setSelectedSize(s);
                  setJustAdded(false);
                }}
                className={`min-h-12 rounded-md text-sm font-semibold transition-colors ${
                  selectedSize === s
                    ? "bg-primary text-white border border-primary"
                    : "border border-primary/25 text-primary hover:border-primary"
                } disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through disabled:hover:border-primary/25`}
              >
                {s}
                {!available && <span className="sr-only"> (indisponível)</span>}
              </button>
            );
          })}
        </div>
        {stockMessage && (
          <p className={`text-sm font-medium ${soldOut ? "text-dawn-ink" : "text-primary/80"}`} role="status">
            {stockMessage}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={soldOut || reachedLimit}
          className="w-full min-h-12 bg-primary hover:bg-accent-blue text-white font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          {soldOut ? "Indisponível" : reachedLimit ? "Todas as unidades estão na sacola" : "Adicionar à sacola"}
        </button>

        <div aria-live="polite" className="min-h-6">
          {justAdded && (
            <p className="flex items-center justify-between gap-3 text-sm text-primary">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Adicionado à sacola
              </span>
              <Link href="/cart" className="font-semibold text-accent-blue underline underline-offset-4 hover:text-primary">
                Ver sacola
              </Link>
            </p>
          )}
        </div>

        <button
          type="button"
          aria-pressed={liked}
          onClick={handleWishlist}
          className="w-full min-h-12 bg-transparent text-primary dark:text-slate-200 border border-primary/40 font-semibold py-3.5 rounded-full hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <span className={`material-symbols-outlined text-[18px] ${liked ? "text-dawn-ink" : ""}`} style={{ fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0' }}>favorite</span>
          {liked ? "Remover da lista de desejos" : "Salvar na lista de desejos"}
        </button>
      </div>

      <p className="flex items-center gap-2 pt-2 text-sm text-primary/70 dark:text-slate-400">
        <span className="material-symbols-outlined text-lg">chat</span>
        Frete, prazo e pagamento são combinados com a equipe.
      </p>
    </div>
  );
}
