"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado no Painel Administrativo:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar o Painel Admin</h2>
        <p className="text-slate-400 text-sm mb-6">
          Ocorreu uma falha ao sincronizar as informações administrativas. Verifique sua conexão e tente novamente.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
          <Link
            href="/admin/login"
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-sm transition-colors"
          >
            Ir para Login Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
