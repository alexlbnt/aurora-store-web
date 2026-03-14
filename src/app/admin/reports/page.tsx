import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function Reports() {
  // Fetch real data for reports
  const orders = await prisma.order.findMany({
    where: { status: { not: 'CANCELED' } },
    include: { items: { include: { product: { include: { variants: true } } } } }
  });

  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Calculate top products
  const productSales: Record<string, { name: string, quantity: number, revenue: number, stock: number, img: string, categoryId: string }> = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const pid = item.productId;
      if (!productSales[pid]) {
        productSales[pid] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          stock: item.product.variants.reduce((acc, v) => acc + v.stock, 0),
          img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsjWA-9jRbZBTqH41MzeOowOGtiZ1sC-BP2BT5AkrxzZqxjWTTQpu6tnukP-tVz7qiAlOeXg8lwWu4UC4BGLzczGV7EItI2THH65CaQLbZTdKUOXCCyxBvi26c-BXCeTY5T1b_xBNThB6DApdheWFQvTvmKeuF2tmeiqoOuc5_6BSb3_7qsdvEIyc61vbxpapLFGG1ICVUQcN07yJuzPt8zCzMyQYTqk1QkX-HMuKuDZRhgAm3OIUyxL38FAhuMuw2ui1IqJXkiqs", // Default image as we don't have images in schema yet
          categoryId: item.product.categoryId
        };
      }
      productSales[pid].quantity += item.quantity;
      productSales[pid].revenue += Number(item.price) * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  return (
    <AdminLayout>
      <div className="flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Relatórios</h2>
            <p className="text-slate-500 dark:text-slate-400">Análise detalhada do desempenho da Aurora em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-primary/10 text-primary dark:text-primary/90 border border-primary/20 px-4 py-2 rounded font-bold text-sm hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined text-lg">description</span>
              Baixar PDF
            </button>
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">csv</span>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Receita Total</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">R$ {totalRevenue.toFixed(2).replace('.', ',')}</h3>
              <span className="text-emerald-600 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-xs">database</span> Tempo Real</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Ticket Médio</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">R$ {averageTicket.toFixed(2).replace('.', ',')}</h3>
              <span className="text-emerald-600 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-xs">database</span> Tempo Real</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Pedidos</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{orders.length}</h3>
              <span className="text-slate-400 text-xs font-bold flex items-center">Aprovados/Pendentes</span>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Desempenho de Vendas */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Desempenho de Vendas</h4>
              <select className="bg-slate-50 dark:bg-slate-800 border-none text-xs rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:ring-primary/30 outline-none cursor-pointer">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
              </select>
            </div>
            <div className="flex-1 min-h-[250px] relative flex items-end gap-2 px-2">
              {/* Mock Bar Chart */}
              <div className="flex-1 bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40" style={{ height: "60%" }}></div>
              <div className="flex-1 bg-primary/40 rounded-t-lg transition-all hover:bg-primary/60" style={{ height: "45%" }}></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40" style={{ height: "80%" }}></div>
              <div className="flex-1 bg-primary/60 rounded-t-lg transition-all hover:bg-primary/80" style={{ height: "55%" }}></div>
              <div className="flex-1 bg-primary/30 rounded-t-lg transition-all hover:bg-primary/50" style={{ height: "95%" }}></div>
              <div className="flex-1 bg-primary rounded-t-lg transition-all" style={{ height: "70%" }}></div>
              <div className="flex-1 bg-primary/50 rounded-t-lg transition-all hover:bg-primary/70" style={{ height: "85%" }}></div>
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
            </div>
          </div>

          {/* Origem do Tráfego */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Origem do Tráfego</h4>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-48 h-48 rounded-full flex items-center justify-center" style={{ background: "conic-gradient(#5d4a3c 0% 45%, #8a7364 45% 75%, #c5b4a7 75% 90%, #efedec 90% 100%)" }}>
                <div className="absolute w-32 h-32 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">8.4k</span>
                  <span className="text-[10px] text-slate-400 uppercase">Visitas</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Orgânico (45%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8a7364]"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Social (30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#c5b4a7]"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Direto (15%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#efedec]"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Outros (10%)</span>
              </div>
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Produtos Mais Vendidos</h4>
              <button className="text-primary text-sm font-bold hover:underline">Ver catálogo completo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="text-left border-b border-primary/10">
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Produto</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Vendas</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Estoque</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Receita</th>
                    <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500">Nenhum dado de vendas disponível ainda.</td>
                    </tr>
                  ) : topProducts.map((product, idx) => (
                    <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                      <td className="py-4 cursor-pointer" title={product.categoryId}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${product.img}')` }}></div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{product.name}</p>
                            <p className="text-[10px] text-slate-500">ID Categoria: {product.categoryId.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center text-sm font-medium">{product.quantity}</td>
                      <td className="py-4 text-center text-sm">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mx-auto overflow-hidden relative" title={`Estoque: ${product.stock}`}>
                          <div className={`h-full rounded-full ${product.stock > 10 ? 'bg-primary' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}></div>
                        </div>
                      </td>
                      <td className="py-4 text-right text-sm font-bold">R$ {product.revenue.toFixed(2).replace('.', ',')}</td>
                      <td className="py-4 text-right">
                        {product.stock > 10 ? (
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wide">Em alta</span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded uppercase tracking-wide">Estoque baixo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Comparison Trend Chart Section */}
        <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/10 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Comparativo de Crescimento</h4>
              <p className="text-xs text-slate-500">Faturamento Mensal: Ano Atual vs. Anterior</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-primary rounded"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">2024</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-primary/30 rounded"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">2023</span>
              </div>
            </div>
          </div>
          <div className="h-48 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200">
              <path d="M0,150 Q100,140 200,160 T400,130 T600,145 T800,120 T1000,140" fill="none" stroke="#5d4a3c33" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M0,120 Q100,100 200,130 T400,80 T600,100 T800,50 T1000,70" fill="none" stroke="#5d4a3c" strokeLinecap="round" strokeWidth="4"></path>
              <circle cx="400" cy="80" fill="#5d4a3c" r="5"></circle>
              <circle cx="800" cy="50" fill="#5d4a3c" r="5"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none opacity-20 px-2">
              <div className="h-full border-r border-slate-300"></div>
              <div className="h-full border-r border-slate-300"></div>
              <div className="h-full border-r border-slate-300"></div>
              <div className="h-full border-r border-slate-300"></div>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
            <span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Set</span><span>Nov</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
