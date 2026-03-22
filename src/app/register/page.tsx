"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer } from "./actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerCustomer, null);

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
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Acesse aqui
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-100">
          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Nome completo
              </label>
              <div className="mt-2 text-slate-800">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="João da Silva"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                E-mail
              </label>
              <div className="mt-2 text-slate-800">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="joao@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                Celular (Opcional)
              </label>
              <div className="mt-2 text-slate-800">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="(11) 99999-9999"
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
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            {state?.error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {state.error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70"
              >
                {isPending ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
