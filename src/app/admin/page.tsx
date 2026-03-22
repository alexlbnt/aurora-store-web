import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/admin/DashboardCharts";

export const revalidate = 0;

export default async function Dashboard() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const customers = await prisma.customer.count();

  const totalSales = orders
    .filter(o => o.status !== 'CANCELED')
    .reduce((acc, order) => acc + Number(order.totalAmount), 0);

  const ticketMedio = orders.length > 0 ? totalSales / orders.filter(o => o.status !== 'CANCELED').length : 0;

  // Generate chart data for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return { name: dateStr, total: 0 };
  });

  orders.forEach(order => {
    if (order.status === 'CANCELED') return;
    const dateStr = order.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dayData = chartData.find(d => d.name === dateStr);
    if (dayData) {
      dayData.total += Number(order.totalAmount);
    }
  });

  return (
    <AdminLayout pageTitle="Visão Geral">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 justify-between flex-col p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex w-full justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">Base Real</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Vendas Totais</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">R$ {totalSales.toFixed(2).replace('.', ',')}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">Lifetime</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Pedidos</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">{orders.length}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">Lifetime</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Clientes Geração</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">{customers}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">Base Real</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Ticket Médio</p>
          <p className="text-2xl font-bold mt-1 tracking-tight text-slate-800 dark:text-slate-100">R$ {ticketMedio.toFixed(2).replace('.', ',')}</p>
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
            <DashboardCharts data={chartData} />
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">Nenhum pedido recente.</td>
                </tr>
              ) : orders.slice(0, 5).map((order) => {
                let statusColor = 'slate';
                let statusText = 'Desconhecido';

                switch(order.status) {
                  case 'PAID': statusColor = 'emerald'; statusText = 'PAGO'; break;
                  case 'PENDING': statusColor = 'amber'; statusText = 'PENDENTE'; break;
                  case 'CANCELED': statusColor = 'red'; statusText = 'CANCELADO'; break;
                  case 'SHIPPED': statusColor = 'blue'; statusText = 'ENVIADO'; break;
                  case 'DELIVERED': statusColor = 'slate'; statusText = 'ENTREGUE'; break;
                }
                
                return (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{order.customer.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {order.items.length > 0 ? order.items[0].product.name : 'Vários itens'}
                    {order.items.length > 1 && ` (+${order.items.length - 1})`}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">R$ {Number(order.totalAmount).toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      statusColor === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      statusColor === 'red' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {statusText}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
