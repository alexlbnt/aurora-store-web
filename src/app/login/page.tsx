"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticateCustomer } from "./actions";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticateCustomer, undefined);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-white text-2xl">flare</span>
            </div>
          </Link>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ou{" "}
          <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
            crie uma nova conta gratuitamente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-100">
          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Endereço de e-mail
              </label>
              <div className="mt-2 text-slate-800">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Senha
              </label>
              <div className="mt-2 text-slate-800">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className="font-semibold text-primary hover:text-primary/80">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {errorMessage}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70"
              >
                {isPending ? 'Entrando...' : 'Entrar'}
                {!isPending && <span className="material-symbols-outlined text-[18px]">login</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
