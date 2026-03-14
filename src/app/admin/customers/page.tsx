import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function Customers() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        where: { status: { not: 'CANCELED' } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalSpentByCustomer = customers.map(c => {
    return c.orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  });

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* Header Override for title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clientes</h2>
            <p className="text-slate-500 text-sm mt-1">Gerencie sua base de clientes e acompanhe o engajamento.</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm">
            <span className="material-symbols-outlined text-base">person_add</span>
            Adicionar Cliente
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          {/* Search and Filters Bar */}
          <div className="p-4 border-b border-primary/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail ou CPF..." 
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:text-white" 
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button className="flex flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-lg text-slate-500">filter_list</span>
                Filtros
              </button>
              <button className="flex flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-lg text-slate-500">download</span>
                Exportar
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto @container">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-left border-b border-primary/10">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Pedidos</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Gasto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Pedido</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Nenhum cliente cadastrado no banco de dados.</td>
                  </tr>
                ) : customers.map((customer, i) => {
                  const spent = totalSpentByCustomer[i];
                  const lastOrder = customer.orders.length > 0 ? new Date(customer.orders[0].createdAt).toLocaleDateString('pt-BR') : 'N/A';
                  const initials = customer.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase();

                  return (
                  <tr key={customer.id} className="hover:bg-primary/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-inner">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                          <p className="text-xs text-slate-500">ID: {customer.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{customer.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {customer.orders.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">R$ {spent.toFixed(2).replace('.', ',')}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{lastOrder}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-primary/10 rounded text-slate-400 hover:text-primary transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button className="p-1.5 hover:bg-primary/10 rounded text-slate-400 hover:text-primary transition-colors" title="Ver detalhes">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-primary/10 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <p className="text-xs text-slate-500 dark:text-slate-400">Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">1-5</span> de <span className="font-bold text-slate-700 dark:text-slate-300">84</span> clientes</p>
            <div className="flex items-center gap-1">
              <button disabled className="p-2 border border-primary/10 rounded-lg bg-white dark:bg-slate-900 text-slate-400 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="size-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">1</button>
              <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-primary/10 text-xs font-medium text-slate-600 dark:text-slate-300">2</button>
              <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-primary/10 text-xs font-medium text-slate-600 dark:text-slate-300">3</button>
              <span className="text-slate-400 px-1">...</span>
              <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-primary/10 text-xs font-medium text-slate-600 dark:text-slate-300">17</button>
              <button className="p-2 border border-primary/10 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Clientes Base</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">database</span> Base Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LTV Médio (Life Time Value)</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                R$ {customers.length > 0 ? (totalSpentByCustomer.reduce((acc, curr) => acc + curr, 0) / customers.length).toFixed(2).replace('.', ',') : '0,00'}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Base Real</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes Ativos</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{customers.filter(c => c.orders.length > 0).length}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">person_check</span> Compras
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
