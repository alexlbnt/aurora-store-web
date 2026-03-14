import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import Image from "next/image";

export default function Cart() {
  const cartItems = [
    {
      id: "1",
      name: "Conjunto Seda Pura Noturno",
      color: "Pérola",
      size: "M",
      price: "R$ 489,00",
      numericPrice: 489,
      qty: 1,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBItmN9eB11w_Z6UoMv_D24Z4f-GjO55Q322H00bM5F_2Q6P5zG6I52hP8Zk9dG4B1g3J5U7c_f8U4k180u1K46R-tZ2eY56f9s6b5C8Xz85g1B7Hh8X9C_T5t8y_q7O5N34m4M_F1Z-0j-lZ0p_M-QvE93D_E_Z_A_H_A_z_oV"
    },
    {
      id: "2",
      name: "Roupão Aveludado Premium",
      color: "Argila",
      size: "Único",
      price: "R$ 529,00",
      numericPrice: 529,
      qty: 1,
      image: "https://images.unsplash.com/photo-1588665796035-1a3b90f55e5b?q=80&w=1587&auto=format&fit=crop"
    }
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + (item.numericPrice * item.qty), 0);
  const formattedSubtotal = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

  const phoneNumber = "5562999742701"; // Substitua pelo número real da loja
  const cartSummaryText = cartItems.map(item => `- ${item.qty}x ${item.name} (${item.color}, tamanho ${item.size})`).join('%0A');
  const message = `Olá, gostaria de finalizar meu pedido da Aurora:%0A%0A${cartSummaryText}%0A%0A*Total: ${formattedSubtotal}*`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <StorefrontLayout>
      <div className="py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-10 text-center">Sua Sacola</h1>

        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto items-start">

          {/* Cart Items List */}
          <div className="w-full lg:w-[65%] gap-8 flex flex-col">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-primary/10 text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-slate-400">
              <div className="col-span-6">Produto</div>
              <div className="col-span-3 text-center">Quantidade</div>
              <div className="col-span-3 text-right">Subtotal</div>
            </div>

            <div className="flex flex-col divide-y divide-primary/5">
              {cartItems.map(item => (
                <div key={item.id} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">

                  {/* Product Info Mobile & Desktop */}
                  <div className="flex gap-4 md:col-span-6 items-start">
                    <div className="relative aspect-[3/4] w-24 rounded bg-primary/5 overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                    <div className="flex flex-col gap-1 py-1 flex-1">
                      <Link href={`/product/${item.id}`} className="text-sm md:text-base font-serif font-bold text-primary dark:text-slate-100 hover:underline">{item.name}</Link>
                      <p className="text-xs text-primary/60 dark:text-slate-400 font-medium">Cor: {item.color}</p>
                      <p className="text-xs text-primary/60 dark:text-slate-400 font-medium pb-2">Tamanho: {item.size}</p>
                      <div className="md:hidden flex items-center justify-between mt-auto">
                        <span className="text-sm font-bold text-primary dark:text-white">{item.price}</span>
                        {/* Mobile Qty placeholder */}
                        <div className="flex items-center border border-primary/20 rounded-full h-8">
                          <button className="px-3 hover:bg-primary/5 h-full rounded-l-full text-primary">-</button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button className="px-3 hover:bg-primary/5 h-full rounded-r-full text-primary">+</button>
                        </div>
                      </div>
                      <button className="text-xs text-primary/40 hover:text-red-500 font-bold uppercase tracking-wider transition-colors w-fit flex items-center gap-1 mt-1">
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Qty & Price Desktop */}
                  <div className="hidden md:flex flex-col items-center justify-center col-span-3">
                    <div className="flex items-center border border-primary/20 rounded-full h-10 w-28 bg-white dark:bg-transparent">
                      <button className="flex-1 hover:bg-primary/5 h-full rounded-l-full text-primary dark:text-slate-300 transition-colors">-</button>
                      <span className="text-sm font-bold flex-1 text-center text-primary dark:text-white">{item.qty}</span>
                      <button className="flex-1 hover:bg-primary/5 h-full rounded-r-full text-primary dark:text-slate-300 transition-colors">+</button>
                    </div>
                  </div>

                  <div className="hidden md:flex justify-end col-span-3">
                    <span className="text-base font-bold text-primary dark:text-white">{item.price}</span>
                  </div>

                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-primary/10">
              <Link href="/catalog" className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Continuar Comprando
              </Link>
            </div>
          </div>

          {/* Order Summary Checkout WhatsApp Box */}
          <div className="w-full lg:w-[35%] bg-primary/5 dark:bg-slate-900 rounded-xl p-6 md:p-8 border border-primary/10 sticky top-28">
            <h3 className="text-xl font-serif text-primary dark:text-white font-bold border-b border-primary/10 pb-4 mb-6">Resumo do Pedido</h3>

            <div className="space-y-4 mb-6 text-sm text-primary/80 dark:text-slate-300 font-medium">
              <div className="flex justify-between items-center">
                <span>Subtotal ({cartItems.length} itens)</span>
                <span>{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Frete</span>
                <span className="text-emerald-600 font-bold">Grátis</span>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-6 mb-8 flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary dark:text-white">{formattedSubtotal}</span>
              </div>
              <p className="text-right text-xs text-primary/60 dark:text-slate-400">em até 6x sem juros</p>
            </div>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold uppercase tracking-widest py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
              </svg>
              Finalizar via WhatsApp
            </a>
            <p className="text-center text-[10px] uppercase font-bold tracking-widest text-primary/50 dark:text-slate-500 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              Pagamento 100% Seguro
            </p>
          </div>
        </div>

      </div>
    </StorefrontLayout>
  );
}
