"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import Link from "next/link";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 font-display text-4xl font-black text-primary tracking-tighter">aurora.</Link>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-primary/5 w-full max-w-md border border-primary/10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Painel Administrativo</h1>
        <p className="text-slate-500 mb-8 text-sm">Faça login com suas credenciais de acesso para gerenciar a loja.</p>

        <form action={formAction} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
              E-mail
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                id="email"
                type="email"
                name="email"
                placeholder="admin@aurora.com.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-rose-100 mb-2">
              <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
              <p>{errorMessage}</p>
            </div>
          )}

          <button
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg w-full transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin hidden sm:inline-block">progress_activity</span>
            ) : (
              <>
                Entrar no Painel
                <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-12 text-center text-slate-400 text-xs">
        <p>© 2024 Aurora Sleepwear. Todos os direitos reservados.</p>
        <p className="mt-1">Ambiente Seguro</p>
      </div>
    </div>
  );
}
