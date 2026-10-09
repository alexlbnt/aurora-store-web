"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { whatsappLink } from "@/lib/contact";

export default function CartClient() {
  const { items, removeFromCart, updateQuantity, cartTotal, cartCount, isMounted } = useCart();

  const formattedSubtotal = `R$ ${cartTotal.toFixed(2).replace('.', ',')}`;

  const cartSummaryText = items.map(item => `- ${item.qty}x ${item.name} (${item.color}, tamanho ${item.size})`).join("\n");
  const whatsappUrl = whatsappLink(`Olá, gostaria de finalizar meu pedido da Aurora:\n\n${cartSummaryText}\n\nTotal: ${formattedSubtotal}`);

  if (!isMounted) {
    return (
      <div className="py-8 md:py-12 min-h-[60vh]">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto mb-10 animate-pulse" />
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 animate-pulse">
          <div className="w-full lg:w-[65%] h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
          <div className="w-full lg:w-[35%] h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 min-h-[60vh]">
        <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 mb-10">Sua sacola</h1>

        {items.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
             <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">shopping_bag</span>
             <h3 className="text-xl font-semibold text-primary dark:text-slate-200 mb-2">Sua sacola está vazia</h3>
             <p className="text-slate-500 mb-6">Escolha uma peça no catálogo e ela aparece aqui.</p>
             <Link href="/catalog" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-accent-blue transition-colors">
               Ver o catálogo
             </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto items-start">
            {/* Cart Items List */}
            <div className="w-full lg:w-[65%] gap-8 flex flex-col">
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-primary/10 text-sm font-semibold text-primary/70 dark:text-slate-400">
                <div className="col-span-6">Produto</div>
                <div className="col-span-3 text-center">Quantidade</div>
                <div className="col-span-3 text-right">Subtotal</div>
              </div>

              <div className="flex flex-col divide-y divide-primary/5">
                {items.map(item => (
                  <div key={item.id} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">

                    {/* Product Info Mobile & Desktop */}
                    <div className="flex gap-4 md:col-span-6 items-start">
                      <div className="relative aspect-[3/4] w-24 rounded bg-primary/5 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                      </div>
                      <div className="flex flex-col gap-1 py-1 flex-1">
                        <Link href={`/product/${item.productId}`} className="text-sm md:text-base font-serif font-bold text-primary dark:text-slate-100 hover:text-accent-blue transition-colors">{item.name}</Link>
                        <p className="text-xs text-primary/60 dark:text-slate-400 font-medium">Cor: {item.color}</p>
                        <p className="text-xs text-primary/60 dark:text-slate-400 font-medium pb-2">Tamanho: {item.size}</p>
                        <div className="md:hidden flex items-center justify-between mt-auto">
                          <span className="text-sm font-bold text-primary dark:text-white">{item.price}</span>
                          {/* Mobile Qty */}
                          <div className="flex items-center border border-primary/20 rounded-full h-11">
                            <button aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => updateQuantity(item.id, item.qty - 1)} className="w-11 hover:bg-primary/5 h-full rounded-l-full text-primary">−</button>
                            <span aria-live="polite" className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                            <button aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => updateQuantity(item.id, item.qty + 1)} className="w-11 hover:bg-primary/5 h-full rounded-r-full text-primary">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-sm text-primary/60 hover:text-dawn-ink underline underline-offset-4 transition-colors w-fit mt-1 min-h-8">
                          Remover<span className="sr-only"> {item.name}</span>
                        </button>
                      </div>
                    </div>

                    {/* Qty & Price Desktop */}
                    <div className="hidden md:flex flex-col items-center justify-center col-span-3">
                      <div className="flex items-center border border-primary/20 rounded-full h-11 w-32 bg-white dark:bg-transparent">
                        <button aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => updateQuantity(item.id, item.qty - 1)} className="flex-1 hover:bg-primary/5 h-full rounded-l-full text-primary dark:text-slate-300 transition-colors">−</button>
                        <span aria-live="polite" className="text-sm font-semibold flex-1 text-center text-primary dark:text-white">{item.qty}</span>
                        <button aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => updateQuantity(item.id, item.qty + 1)} className="flex-1 hover:bg-primary/5 h-full rounded-r-full text-primary dark:text-slate-300 transition-colors">+</button>
                      </div>
                    </div>

                    <div className="hidden md:flex justify-end col-span-3">
                      <span className="text-base font-bold text-primary dark:text-white">R$ {(item.numericPrice * item.qty).toFixed(2).replace('.', ',')}</span>
                    </div>

                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-primary/10 mb-8 lg:mb-0">
                <Link href="/catalog" className="text-primary dark:text-white text-sm font-semibold hover:text-accent-blue flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Continuar comprando
                </Link>
              </div>
            </div>

            {/* Order Summary Checkout WhatsApp Box */}
            <div className="w-full lg:w-[35%] bg-accent-cream dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-primary/10 dark:border-slate-800 sticky top-28">
              <h3 className="text-2xl font-serif text-primary dark:text-white border-b border-primary/10 pb-4 mb-6">Resumo do pedido</h3>

              <div className="space-y-4 mb-6 text-sm text-primary/80 dark:text-slate-300 font-medium">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "itens"})</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Frete</span>
                  <span>A combinar com a equipe</span>
                </div>
              </div>

              <div className="border-t border-primary/5 pt-6 mb-8 flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-semibold text-primary dark:text-white">Total das peças</span>
                  <span className="text-2xl font-semibold text-primary dark:text-white">{formattedSubtotal}</span>
                </div>
                <p className="text-right text-sm text-primary/70 dark:text-slate-400">Pagamento e entrega são combinados com a equipe.</p>
              </div>

              <Link href="/checkout" className="w-full h-14 bg-primary hover:bg-accent-blue text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 mb-3">
                Finalizar pedido pelo site
              </Link>

              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full h-12 border border-primary/40 text-primary hover:bg-primary/5 font-semibold rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Enviar a sacola pelo WhatsApp
              </a>

            </div>
          </div>
        )}
      </div>
    );
}
