"use client";

import { useEffect } from "react";
import Link from "next/link";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-between">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold tracking-wider text-primary dark:text-white">
          AURORA
        </Link>
        <Link href="/catalog" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
          Explorar Catálogo
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ops! Algo deu errado ao carregar sua conta</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
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
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Voltar para o início
          </Link>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Aurora Store. Todos os direitos reservados.
      </footer>
    </div>
  );
}
