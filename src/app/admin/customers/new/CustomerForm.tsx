"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createCustomer, updateCustomer } from "../actions";
import { formatPhone } from "@/lib/formatters";

export default function CustomerForm({ initialData }: { initialData?: any }) {
  const [isPending, setIsPending] = useState(false);
  const [phone, setPhone] = useState(initialData?.phone || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await (initialData ? updateCustomer(initialData.id, formData) : createCustomer(formData));
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
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/admin/customers" className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium truncate">
            <Link href="/admin/customers" className="text-slate-500 hover:text-primary transition-colors shrink-0">Clientes</Link>
            <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-400 shrink-0">chevron_right</span>
            <span className="text-slate-900 dark:text-white border-b-2 border-primary pb-0.5 truncate font-bold">{initialData ? 'Editar' : 'Novo'}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : (initialData ? 'save' : 'person_add')}</span>
              <span>{isPending ? 'Salvando...' : 'Salvar'}</span>
           </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="size-10 sm:size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-2xl">account_circle</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Informações Pessoais</h3>
                <p className="text-xs sm:text-sm text-slate-500">Dados cadastrais do cliente</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  defaultValue={initialData?.name}
                  placeholder="Ex: Carlos Eduardo Silva" 
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-mail <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                  <input 
                    type="email" 
                    name="email"
                    defaultValue={initialData?.email || ""}
                    placeholder="carlos@email.com" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm font-mono" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Redes Sociais <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                <input 
                  type="text" 
                  name="socialMedia"
                  defaultValue={initialData?.socialMedia || ""}
                  placeholder="Ex: @carlos.silva" 
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" 
                />
              </div>

              {/* Botão no Rodapé do Card */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">{isPending ? 'sync' : (initialData ? 'save' : 'person_add')}</span>
                  <span>{isPending ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Cadastrar Cliente')}</span>
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Barra Fixa Flutuante Inferior no Mobile (acima da Bottom Nav) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
          {initialData ? 'Editando cadastro' : 'Novo cadastro'}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'save'}</span>
          <span>{isPending ? 'Salvando...' : 'Salvar Cliente'}</span>
        </button>
      </div>
    </form>
  )
}
