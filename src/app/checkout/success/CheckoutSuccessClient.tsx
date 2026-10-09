"use client";

import Link from "next/link";
import { useEffect, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import { useSearchParams } from "next/navigation";
import { whatsappLink } from "@/lib/contact";

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const message = orderNumber
    ? `Olá! Acabei de enviar o pedido ${orderNumber} pelo site da Aurora. Podemos combinar o pagamento e a entrega?`
    : "Olá! Acabei de enviar um pedido pelo site da Aurora. Podemos combinar o pagamento e a entrega?";

  return (
    <div className="py-16 md:py-24 min-h-[60vh] px-4 max-w-2xl mx-auto">
      <span className="material-symbols-outlined text-5xl text-primary mb-6 block" aria-hidden="true">check_circle</span>
      <h1 className="text-4xl md:text-5xl font-serif text-primary dark:text-slate-100 mb-4">
        Recebemos o seu pedido
      </h1>

      {orderNumber && (
        <p className="text-primary/80 dark:text-slate-300 mb-6">
          Número do pedido: <span className="font-semibold text-primary dark:text-white">{orderNumber}</span>
        </p>
      )}

      <p className="text-primary/80 dark:text-slate-300 text-lg leading-relaxed max-w-xl mb-8">
        Nossa equipe vai entrar em contato pelo telefone que você informou para combinar pagamento, frete e prazo de entrega.
        Se preferir, fale com a gente agora pelo WhatsApp.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-12 px-8 bg-primary text-white font-semibold rounded-full hover:bg-accent-blue transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat</span>
          Falar no WhatsApp
        </a>
        <Link
          href="/catalog"
          className="min-h-12 px-8 border border-primary/40 text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors flex items-center justify-center"
        >
          Continuar comprando
        </Link>
      </div>

      <p className="mt-8 text-sm text-primary/70">
        Tem conta na Aurora? <Link href="/account" className="text-accent-blue underline underline-offset-4 hover:text-primary">Veja seus pedidos</Link>.
      </p>
    </div>
  );
}

export default function CheckoutSuccessClient() {
  return (
    <Suspense fallback={
      <div className="py-20 flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">refresh</span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
