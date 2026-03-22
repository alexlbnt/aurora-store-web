"use client";

import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StorefrontLayout>
      <div className="py-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-28 h-28 bg-emerald-100/50 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <span className="material-symbols-outlined text-6xl font-bold">check_circle</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-4">
          Pagamento Aprovado!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          Muito obrigado pela sua compra. Seu pedido foi processado com sucesso e já estamos cuidando para que chegue com segurança em suas mãos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/account" className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            Acompanhar Pedido
          </Link>
          <Link href="/catalog" className="px-8 py-4 bg-slate-100 text-primary font-bold rounded-xl hover:bg-slate-200 transition-colors w-full sm:w-auto">
            Continuar Comprando
          </Link>
        </div>
      </div>
    </StorefrontLayout>
  );
}
