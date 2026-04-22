"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createCustomer } from "../actions";

export default function CustomerForm() {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createCustomer(formData);
      if (result.error) {
        alert(result.error);
        setIsPending(false);
      } else {
        window.location.href = '/admin/customers';
      }
    } catch (error) {
      alert("Erro ao cadastrar cliente.");
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/admin/customers" className="text-slate-500 hover:text-primary transition-colors">Clientes</Link>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
            <span className="text-slate-900 dark:text-white border-b-2 border-primary pb-0.5">Novo Cliente</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
           <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'person_add'}</span>
              {isPending ? 'Salvando...' : 'Cadastrar Cliente'}
           </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Informações Pessoais</h3>
                <p className="text-sm text-slate-500">Dados cadastrais do cliente</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="Ex: Carlos Eduardo Silva" 
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="carlos@email.com" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Telefone <span className="text-slate-400 font-normal">(Opcional)</span></label>
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder="(00) 00000-0000" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  />
                </div>
              </div>
            </div>
        </div>
      </div>
    </form>
  )
}
