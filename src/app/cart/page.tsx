"use client";

import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();

  const formattedSubtotal = `R$ ${cartTotal.toFixed(2).replace('.', ',')}`;

  const phoneNumber = "5562999742701"; 
  const cartSummaryText = items.map(item => `- ${item.qty}x ${item.name} (${item.color}, tamanho ${item.size})`).join('%0A');
  const message = `Olá, gostaria de finalizar meu pedido da Aurora:%0A%0A${cartSummaryText}%0A%0A*Total: ${formattedSubtotal}*`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <StorefrontLayout>
      <div className="py-8 md:py-12 min-h-[60vh]">
        <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-10 text-center">Sua Sacola</h1>

        {items.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
             <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">shopping_bag</span>
             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Sua sacola está vazia</h3>
             <p className="text-slate-500 mb-6">Explore o nosso catálogo e adicione produtos para prosseguir com o pedido.</p>
             <Link href="/catalog" className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
               Explorar Produtos
             </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto items-start">
            {/* Cart Items List */}
            <div className="w-full lg:w-[65%] gap-8 flex flex-col">
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-primary/10 text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-slate-400">
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
                          <div className="flex items-center border border-primary/20 rounded-full h-8">
                            <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="px-3 hover:bg-primary/5 h-full rounded-l-full text-primary">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="px-3 hover:bg-primary/5 h-full rounded-r-full text-primary">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs text-primary/40 hover:text-red-500 font-bold uppercase tracking-wider transition-colors w-fit flex items-center gap-1 mt-1">
                          Remover
                        </button>
                      </div>
                    </div>

                    {/* Qty & Price Desktop */}
                    <div className="hidden md:flex flex-col items-center justify-center col-span-3">
                      <div className="flex items-center border border-primary/20 rounded-full h-10 w-28 bg-white dark:bg-transparent shadow-sm">
                        <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="flex-1 hover:bg-primary/5 h-full rounded-l-full text-primary dark:text-slate-300 transition-colors">-</button>
                        <span className="text-sm font-bold flex-1 text-center text-primary dark:text-white">{item.qty}</span>
                        <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="flex-1 hover:bg-primary/5 h-full rounded-r-full text-primary dark:text-slate-300 transition-colors">+</button>
                      </div>
                    </div>

                    <div className="hidden md:flex justify-end col-span-3">
                      <span className="text-base font-bold text-primary dark:text-white">R$ {(item.numericPrice * item.qty).toFixed(2).replace('.', ',')}</span>
                    </div>

                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-primary/10 mb-8 lg:mb-0">
                <Link href="/catalog" className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider hover:text-accent-blue flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Continuar Comprando
                </Link>
              </div>
            </div>

            {/* Order Summary Checkout WhatsApp Box */}
            <div className="w-full lg:w-[35%] bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 sticky top-28 shadow-sm">
              <h3 className="text-xl font-serif text-primary dark:text-white font-bold border-b border-primary/5 pb-4 mb-6">Resumo do Pedido</h3>

              <div className="space-y-4 mb-6 text-sm text-primary/80 dark:text-slate-300 font-medium">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Frete</span>
                  <span className="text-emerald-600 font-bold">Grátis</span>
                </div>
              </div>

              <div className="border-t border-primary/5 pt-6 mb-8 flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary dark:text-white">{formattedSubtotal}</span>
                </div>
                <p className="text-right text-xs text-primary/60 dark:text-slate-400">em até 6x sem juros</p>
              </div>

              <Link href="/checkout" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm mb-4">
                <span className="material-symbols-outlined">lock</span>
                Ir para Pagamento
              </Link>
              <p className="text-center text-[10px] uppercase font-bold tracking-widest text-primary/50 dark:text-slate-500 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                Pagamento 100% Seguro
              </p>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
