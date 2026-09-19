"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const method = searchParams.get("method");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyPix = () => {
    navigator.clipboard.writeText("pix@aurorastore.com.br");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="py-16 md:py-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-emerald-100/60 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <span className="material-symbols-outlined text-5xl font-bold">check_circle</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-3">
        Pedido Confirmado!
      </h1>
      
      {orderNumber && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-sm font-bold mb-6">
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Pedido #{orderNumber}
        </div>
      )}

      {method === "PIX" ? (
        <div className="w-full bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl mb-8 text-left space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
            <span className="material-symbols-outlined">qr_code_2</span>
            <span>Instruções do PIX:</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Realize o pagamento transferindo o valor total do pedido para a chave PIX abaixo:
          </p>
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">pix@aurorastore.com.br</span>
            <button
              type="button"
              onClick={handleCopyPix}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">{copied ? "done" : "content_copy"}</span>
              {copied ? "Copiado!" : "Copiar Chave"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Assim que a transferência for identificada, o status do pedido será atualizado automaticamente em sua conta.
          </p>
        </div>
      ) : (
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
          Muito obrigado pela sua compra. Seu pedido foi processado com sucesso e já estamos preparando tudo para envio.
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/account" className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
          <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          Acompanhar na Minha Conta
        </Link>
        <Link href="/catalog" className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-primary dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors w-full sm:w-auto">
          Continuar Comprando
        </Link>
      </div>
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
