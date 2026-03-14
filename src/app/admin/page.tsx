import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function Dashboard() {
  return (
    <AdminLayout pageTitle="Visão Geral">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 justify-between flex-col p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex w-full justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">+12.5% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Vendas Totais</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">R$ 124.500,00</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">+5.2% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Pedidos</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">1.240</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">+18.1% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Novos Clientes</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">185</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="text-rose-500 text-xs font-bold flex items-center gap-0.5">-2.4% <span className="material-symbols-outlined text-[14px]">trending_down</span></span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Ticket Médio</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">R$ 100,40</p>
        </div>
      </div>

      {/* Sales Chart Section (Mock) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Evolução das Vendas</h3>
              <p className="text-sm text-slate-500">Desempenho da última semana comparado ao período anterior</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-xs font-bold rounded bg-primary text-white">7 Dias</button>
              <button className="px-4 py-2 text-xs font-bold rounded bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-300">30 Dias</button>
            </div>
          </div>
          <div className="h-[300px] w-full relative">
            {/* SVG Chart Placeholder */}
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#5d4a3c" stopOpacity="0.15"></stop>
                  <stop offset="100%" stopColor="#5d4a3c" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <line stroke="#f1f1f1" strokeDasharray="4" x1="0" x2="800" y1="0" y2="0"></line>
              <line stroke="#f1f1f1" strokeDasharray="4" x1="0" x2="800" y1="75" y2="75"></line>
              <line stroke="#f1f1f1" strokeDasharray="4" x1="0" x2="800" y1="150" y2="150"></line>
              <line stroke="#f1f1f1" strokeDasharray="4" x1="0" x2="800" y1="225" y2="225"></line>
              <line stroke="#f1f1f1" x1="0" x2="800" y1="300" y2="300"></line>
              <path d="M0,200 Q100,180 200,220 T400,150 T600,100 T800,50 V300 H0 Z" fill="url(#chartGradient)"></path>
              <path d="M0,200 Q100,180 200,220 T400,150 T600,100 T800,50" fill="none" stroke="#5d4a3c" strokeLinecap="round" strokeWidth="3"></path>
              <circle cx="200" cy="220" fill="white" r="4" stroke="#5d4a3c" strokeWidth="2"></circle>
              <circle cx="400" cy="150" fill="white" r="4" stroke="#5d4a3c" strokeWidth="2"></circle>
              <circle cx="600" cy="100" fill="white" r="4" stroke="#5d4a3c" strokeWidth="2"></circle>
            </svg>
            <div className="flex justify-between mt-4 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Seg</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Ter</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Qua</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Qui</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Sex</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Sáb</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Dom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pedidos Recentes</h3>
          <button className="text-primary text-xs font-bold hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background-light dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID Pedido</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {[
                { id: "#ORD-2384", client: "Ana Beatriz Silva", product: "Relógio Minimal Gold", value: "R$ 450,00", status: "ENTREGUE", color: "emerald" },
                { id: "#ORD-2385", client: "Marcos Oliveira", product: "Cadeira Eames Wood", value: "R$ 1.290,00", status: "PROCESSANDO", color: "amber" },
                { id: "#ORD-2386", client: "Clara Mendes", product: "Luminária Industrial Lux", value: "R$ 285,00", status: "EM ROTA", color: "blue" },
                { id: "#ORD-2387", client: "Roberto Fontana", product: "Mesa Lateral Aurora", value: "R$ 780,00", status: "ENTREGUE", color: "emerald" },
              ].map((order, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{order.client}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{order.product}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">{order.value}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      order.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      order.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
