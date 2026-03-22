"use client";

import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { useCart } from "@/context/CartContext";
import { useActionState, useEffect } from "react";
import { processPaymentAndCreateOrder } from "./actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, cartTotal } = useCart();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(processPaymentAndCreateOrder, null);

  useEffect(() => {
    // Redirecionar se carrinho vazio
    if (items.length === 0 && !isPending) {
       router.replace("/cart");
    }
  }, [items, isPending, router]);

  const formattedSubtotal = `R$ ${cartTotal.toFixed(2).replace('.', ',')}`;

  if (items.length === 0) return null;

  return (
    <StorefrontLayout>
      <div className="py-8 md:py-12 min-h-screen">
        <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-10 text-center">Pagamento Seguro</h1>

        <div className="flex flex-col-reverse lg:flex-row gap-12 max-w-6xl mx-auto items-start">
          
          {/* Checkout Form */}
          <div className="w-full lg:w-[60%]">
            <form action={formAction} className="space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-10 rounded-2xl shadow-sm">
              <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
              
              {/* Identificação */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Seus Dados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="João Silva" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                    <input type="email" name="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="joao@gmail.com" />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 pb-2 mt-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Endereço de Entrega
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Rua, Número</label>
                    <input type="text" name="address" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="Av Paulista, 1000" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">CEP</label>
                    <input type="text" name="cep" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
                    <input type="text" name="city" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                    <input type="text" name="state" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none" placeholder="SP" />
                  </div>
                </div>
              </div>

              {/* Pagamento Falso */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 pb-2 mt-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                  Pagamento Fictício
                </h2>
                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Número do Cartão de Crédito</label>
                    <input type="text" maxLength={19} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-400 font-mono" placeholder="4111 1111 1111 1111 (Livre)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Validade</label>
                       <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-400 font-mono" placeholder="12/30" />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">CVV</label>
                       <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-400 font-mono" placeholder="123" />
                    </div>
                  </div>
                </div>
              </div>

              {state?.error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <span className="material-symbols-outlined">error</span>
                  {state.error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full py-4 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl uppercase tracking-widest shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isPending ? (
                  <><span className="material-symbols-outlined animate-spin">refresh</span> Processando...</>
                ) : (
                  <><span className="material-symbols-outlined">lock</span> Confirmar e Pagar</>
                )}
              </button>

            </form>
          </div>

          {/* Resumo */}
          <div className="w-full lg:w-[40%] bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 sticky top-28 shadow-sm">
             <h3 className="text-xl font-serif text-primary dark:text-white font-bold pb-4 mb-4">Resumo do Pedido</h3>
             <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2">
               {items.map(item => (
                 <div key={item.id} className="flex gap-4 items-center border-b border-primary/5 pb-4 last:border-0">
                    <div className="w-16 h-20 rounded bg-primary/5 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Tam: {item.size} | Cor: {item.color}</p>
                      <p className="text-xs text-slate-500">Qtd: {item.qty}</p>
                    </div>
                    <div className="font-bold text-primary text-sm whitespace-nowrap">
                       R$ {(item.numericPrice * item.qty).toFixed(2).replace('.', ',')}
                    </div>
                 </div>
               ))}
             </div>
             <div className="border-t border-primary/10 pt-6 mt-4 mb-8 flex flex-col gap-2">
                <div className="flex justify-between font-medium text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between font-medium text-sm text-slate-600">
                  <span>Frete Expresso</span>
                  <span className="text-emerald-600 font-bold">Grátis</span>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary dark:text-white">{formattedSubtotal}</span>
                </div>
              </div>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}
