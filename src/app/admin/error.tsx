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
    <div className="min-h-screen bg-background-light text-primary flex items-center justify-center p-6">
      <div role="alert" className="max-w-md w-full bg-white border border-primary/10 rounded-lg p-8">
        <h1 className="text-3xl font-serif mb-2">Não foi possível carregar esta página</h1>
        <p className="text-primary/80 text-sm mb-6">
          Os dados não chegaram. Verifique a conexão com a internet e tente de novo. Se o problema continuar, entre em contato com quem cuida do sistema.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="min-h-11 px-5 bg-primary hover:bg-accent-blue text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
          <Link
            href="/admin/login"
            className="min-h-11 px-5 inline-flex items-center border border-primary/30 hover:bg-primary/5 text-primary font-semibold rounded-lg text-sm transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
