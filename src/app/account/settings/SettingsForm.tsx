"use client";

import React, { useActionState, useState } from "react";
import { updateCustomerProfile } from "./actions";
import { formatPhone } from "@/lib/formatters";

interface SettingsFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    cep: string;
    city: string;
    state: string;
  };
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateCustomerProfile, null);
  const [phone, setPhone] = useState(initialData.phone || "");

  return (
    <form action={formAction} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Informações Pessoais</h2>
      </div>

      {state?.error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500">error</span>
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          {state.success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={initialData.name}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
          <input
            type="email"
            disabled
            value={initialData.email}
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
            title="O e-mail não pode ser alterado"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            name="phone"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Endereço Padrão de Entrega</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Rua, Número e Complemento</label>
            <input
              type="text"
              name="address"
              defaultValue={initialData.address}
              placeholder="Ex: Av. Paulista, 1000 - Apto 42"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">CEP</label>
            <input
              type="text"
              name="cep"
              defaultValue={initialData.cep}
              placeholder="00000-000"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
            <input
              type="text"
              name="city"
              defaultValue={initialData.city}
              placeholder="Ex: São Paulo"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Estado (UF)</label>
            <input
              type="text"
              name="state"
              defaultValue={initialData.state}
              placeholder="SP"
              maxLength={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary outline-none transition-colors uppercase"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
        >
          {isPending ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
              Salvando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">save</span>
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  );
}
