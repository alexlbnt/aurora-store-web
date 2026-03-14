import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function Sales() {
  return (
    <AdminLayout>
      <div className="flex-1">
        {/* Header Override for title */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-primary">Vendas</h2>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-sm">add</span>
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total de Vendas</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">R$ 45.230,00</h3>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-semibold dark:text-emerald-400">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12% vs mês anterior
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pedidos Hoje</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">24</h3>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-semibold dark:text-emerald-400">
              <span className="material-symbols-outlined text-xs">trending_up</span> +5% vs ontem
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ticket Médio</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">R$ 1.884,58</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">Estável no período</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pendente</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">08</h3>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-semibold dark:text-amber-400">
              Aguardando pagamento
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Buscar por cliente ou ID do pedido..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400" 
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary outline-none cursor-pointer">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Este mês</option>
              <option>Ano atual</option>
            </select>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary outline-none cursor-pointer">
              <option>Todos Status</option>
              <option>Pago</option>
              <option>Pendente</option>
              <option>Cancelado</option>
              <option>Enviado</option>
            </select>
            <button className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/10">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID do Pedido</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {[
                  { id: "#8821", name: "Ana Silva", initials: "AS", date: "12 Out 2023, 14:30", value: "R$ 250,00", method: "Cartão de Crédito", status: "Pago", color: "green" },
                  { id: "#8822", name: "Marcos Souza", initials: "MS", date: "12 Out 2023, 11:15", value: "R$ 1.120,50", method: "Pix", status: "Pendente", color: "orange" },
                  { id: "#8823", name: "Carla Dias", initials: "CD", date: "11 Out 2023, 18:45", value: "R$ 89,90", method: "Boleto Bancário", status: "Cancelado", color: "red" },
                  { id: "#8824", name: "Roberto Lima", initials: "RL", date: "11 Out 2023, 10:20", value: "R$ 450,00", method: "Cartão de Crédito", status: "Enviado", color: "blue" },
                  { id: "#8825", name: "Julia Costa", initials: "JC", date: "10 Out 2023, 22:10", value: "R$ 125,00", method: "Pix", status: "Entregue", color: "slate" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm font-semibold text-primary dark:text-primary/90">{row.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{row.initials}</div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{row.value}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.method}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide
                        ${row.color === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        row.color === 'orange' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                        row.color === 'red' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                        row.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-primary/10 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mostrando 1 a 5 de 128 resultados</p>
            <div className="flex items-center gap-2">
              <button disabled className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800 disabled:opacity-50 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs font-medium text-slate-600 dark:text-slate-300">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs font-medium text-slate-600 dark:text-slate-300">3</button>
              <span className="text-xs text-slate-400 mx-1">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs font-medium text-slate-600 dark:text-slate-300">25</button>
              <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
