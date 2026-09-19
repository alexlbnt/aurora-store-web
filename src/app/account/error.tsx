"use client";

import { useEffect } from "react";
import Link from "next/link";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado na página de conta:", error);
  }, [error]);

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado ao carregar sua conta</h2>
        <p className="text-slate-600 mb-6 max-w-md">
          Não conseguimos carregar seus dados no momento. Por favor, tente recarregar ou volte para a página inicial.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Tentar novamente
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </StorefrontLayout>
  );
}
