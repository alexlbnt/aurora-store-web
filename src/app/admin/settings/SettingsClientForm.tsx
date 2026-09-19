"use client";

import React, { useActionState, useState } from "react";
import { updateAdminProfile } from "./actions";

interface SettingsClientFormProps {
  initialData: {
    name: string;
    email: string;
    role: string;
    productsCount: number;
    ordersCount: number;
    customersCount: number;
  };
}

export default function SettingsClientForm({ initialData }: SettingsClientFormProps) {
  const [state, formAction, isPending] = useActionState(updateAdminProfile, null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Alertas de Retorno */}
      {state?.error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500">error</span>
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          {state.success}
        </div>
      )}

      {/* Formulário de Perfil e Credenciais */}
      <form action={formAction} className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-primary/10 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-primary/10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                Perfil Administrativo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Altere os dados de identificação e as credenciais de acesso ao painel.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
              {initialData.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Nome do Administrador
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={initialData.name}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none transition-colors text-sm text-slate-900 dark:text-white"
              placeholder="Ex: Alexandre Lopes"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              E-mail de Acesso (Login)
            </label>
            <input
              type="email"
              disabled
              value={initialData.email}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed outline-none"
              title="O e-mail principal é o identificador único do login."
            />
          </div>
        </div>

        {/* Seção de Troca de Senha */}
        <div className="pt-4 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-slate-400">lock_reset</span>
                Segurança & Senha
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showPasswordChange
                  ? "Preencha a senha atual e a nova para redefinir."
                  : "Mantenha a senha atual ou clique para alterar."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              {showPasswordChange ? "Cancelar alteração" : "Alterar Senha"}
            </button>
          </div>

          {showPasswordChange && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repita a nova senha"
                  minLength={6}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                Salvando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      {/* Dados Institucionais da Loja */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-primary/10 shadow-sm space-y-6">
        <div className="pb-3 border-b border-primary/10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">storefront</span>
            Informações da Loja
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dados de contato e parâmetros visíveis para os clientes no catálogo e checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Comercial</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Aurora Sleepwear</p>
            <p className="text-xs text-slate-500 mt-1">Pijamas e Sleepwear Premium</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp de Vendas</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">(11) 98765-4321</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Atendimento Ativo
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail de Suporte</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">contato@aurora.com.br</p>
            <p className="text-xs text-slate-500 mt-1">SAC & Dúvidas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Operação de Estoques</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Estoque-A & Estoque-V</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">Duplo Centro de Distribuição</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Frete e Entregas</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Sem Frete | Aurora | Cliente</p>
            <p className="text-xs text-slate-500 mt-1">Configurado em Vendas</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Localidade Principal</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">São Paulo, SP</p>
            <p className="text-xs text-slate-500 mt-1">Brasil</p>
          </div>
        </div>
      </div>

      {/* Diagnóstico do Sistema & Banco de Dados */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-primary/10 shadow-sm space-y-6">
        <div className="pb-3 border-b border-primary/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">database</span>
              Infraestrutura & Banco de Dados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estado dos serviços integrados em nuvem e métricas consolidadas.
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operacional
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">inventory_2</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialData.productsCount}</p>
            <p className="text-xs text-slate-500 font-medium">Produtos Cadastrados</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">shopping_cart</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialData.ordersCount}</p>
            <p className="text-xs text-slate-500 font-medium">Pedidos Realizados</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">group</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialData.customersCount}</p>
            <p className="text-xs text-slate-500 font-medium">Clientes Registrados</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center border border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">deployed_code</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">v1.3.4</p>
            <p className="text-xs text-slate-500 font-medium">Versão da Plataforma</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-100 dark:border-slate-800">
          <p className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Banco de Dados:</span>
            PostgreSQL Serverless (Neon Cloud - AWS us-east-2)
          </p>
          <p className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Hospedagem & Deploy:</span>
            Vercel Edge & Serverless Functions
          </p>
          <p className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Autenticação:</span>
            NextAuth.js v5 (JWT & Credentials)
          </p>
        </div>
      </div>
    </div>
  );
}
