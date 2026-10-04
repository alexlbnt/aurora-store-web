import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/admin/DashboardCharts";
import Link from "next/link";
import ReportsClientActions from "./ReportsClientActions";
import AdminProductImage from "@/components/admin/AdminProductImage";

export const revalidate = 0;

interface ReportsProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function Reports({ searchParams }: ReportsProps) {
  const resolvedParams = (await searchParams) || {};
  const periodParam = resolvedParams?.period?.trim().toLowerCase();
  const is365Days = periodParam === "365d" || periodParam === "1y" || periodParam === "year";
  const is30Days = periodParam === "30d";
  const is7Days = !is30Days && !is365Days;

  // Fetch real data for reports including product images
  let orders: any[] = [];
  try {
    const reportStartDate = new Date();
    if (is365Days) {
      reportStartDate.setDate(reportStartDate.getDate() - 365);
    } else if (is30Days) {
      reportStartDate.setDate(reportStartDate.getDate() - 29);
    } else {
      reportStartDate.setDate(reportStartDate.getDate() - 6);
    }
    reportStartDate.setHours(0, 0, 0, 0);

    orders = await prisma.order.findMany({
      where: {
        status: { not: "CANCELED" },
        createdAt: { gte: reportStartDate },
      },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        stockLocation: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                variants: {
                  select: { stockA: true, stockV: true },
                },
                images: {
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Error loading reports data:", err);
  }

  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Real payment methods breakdown
  const paymentMethodsStats = [
    { key: "PIX", label: "PIX", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", count: 0, total: 0 },
    { key: "CREDIT_CARD", label: "Cartão de Crédito", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", count: 0, total: 0 },
    { key: "DEBIT_CARD", label: "Cartão de Débito", color: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", count: 0, total: 0 },
    { key: "CASH", label: "Dinheiro", color: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", count: 0, total: 0 },
    { key: "OTHER", label: "Outros / Transferência", color: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", count: 0, total: 0 },
  ];

  const stockLocationStats = {
    ESTOQUE_A: { count: 0, total: 0, label: "Estoque-A (Principal)" },
    ESTOQUE_V: { count: 0, total: 0, label: "Estoque-V (Showroom)" },
  };

  orders.forEach((o) => {
    const pm = (o as any).paymentMethod || "OTHER";
    const found = paymentMethodsStats.find((p) => p.key === pm) || paymentMethodsStats[4];
    found.count += 1;
    found.total += Number(o.totalAmount || 0);

    const loc = (o as any).stockLocation === "ESTOQUE_V" ? "ESTOQUE_V" : "ESTOQUE_A";
    stockLocationStats[loc].count += 1;
    stockLocationStats[loc].total += Number(o.totalAmount || 0);
  });

  // Generate chart data for selected period
  let chartData: Array<{ name: string; total: number }> = [];

  if (is365Days) {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlySlots = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(currentYear, currentMonth - (11 - i), 1);
      const m = monthNames[d.getMonth()];
      const y = String(d.getFullYear()).slice(-2);
      const label = `${m}/${y}`;
      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { name: label, key: yearMonthKey, total: 0 };
    });

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      const slot = monthlySlots.find((s) => s.key === orderKey);
      if (slot) {
        slot.total += Number(order.totalAmount || 0);
      }
    });

    chartData = monthlySlots.map(({ name, total }) => ({ name, total }));
  } else {
    const numDays = is30Days ? 30 : 7;
    const dailySlots = Array.from({ length: numDays }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (numDays - 1 - i));
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
      return { name: dateStr, total: 0 };
    });

    orders.forEach((order) => {
      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "";
      const dayData = dailySlots.find((d) => d.name === dateStr);
      if (dayData) {
        dayData.total += Number(order.totalAmount || 0);
      }
    });

    chartData = dailySlots;
  }

  // Calculate top products with real photos
  const productSales: Record<
    string,
    { name: string; quantity: number; revenue: number; stock: number; img: string; categoryId: string }
  > = {};

  orders.forEach((order) => {
    (order.items || []).forEach((item: any) => {
      const pid = item.productId || item.product?.id;
      if (!pid) return;
      if (!productSales[pid]) {
        const firstImg = item.product?.images?.[0]?.url || "";
        productSales[pid] = {
          name: item.product?.name || "Produto",
          quantity: 0,
          revenue: 0,
          stock: (item.product?.variants || []).reduce(
            (acc: number, v: any) => acc + (v.stockA || 0) + (v.stockV || 0),
            0
          ),
          img: firstImg,
          categoryId: item.product?.categoryId || "",
        };
      }
      productSales[pid].quantity += item.quantity || 0;
      productSales[pid].revenue += Number(item.price || 0) * (item.quantity || 0);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <AdminLayout pageTitle="Relatórios">
      <div className="flex-1">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Relatórios</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
              Análise detalhada do desempenho da Aurora em tempo real.
            </p>
          </div>
          <ReportsClientActions />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">Receita Total</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                R$ {totalRevenue.toFixed(2).replace(".", ",")}
              </h3>
              <span className="text-emerald-600 text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-xs">database</span> Tempo Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">Ticket Médio</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                R$ {averageTicket.toFixed(2).replace(".", ",")}
              </h3>
              <span className="text-emerald-600 text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-xs">database</span> Tempo Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">Total Pedidos Válidos</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{orders.length}</h3>
              <span className="text-slate-400 text-xs font-bold flex items-center">Base Real</span>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desempenho de Vendas */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Desempenho de Vendas</h4>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/admin/reports"
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    is7Days
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  7 Dias
                </Link>
                <Link
                  href="/admin/reports?period=30d"
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    is30Days
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  30 Dias
                </Link>
                <Link
                  href="/admin/reports?period=365d"
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    is365Days
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                  title="Último ano (365 dias)"
                >
                  365 Dias
                </Link>
              </div>
            </div>
            <div className="flex-1 min-h-[240px] sm:min-h-[250px] relative flex items-end gap-2 px-2">
              <DashboardCharts data={chartData} />
            </div>
          </div>

          {/* Métodos de Pagamento e Estoque */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Formas de Pagamento
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">No período</span>
              </div>

              <div className="space-y-3">
                {paymentMethodsStats.map((item) => {
                  const percent = totalRevenue > 0 ? (item.total / totalRevenue) * 100 : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${item.color}`}></span>
                          {item.label} ({item.count})
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white">
                            R$ {item.total.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divisão por Origem de Estoque */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Vendas por Origem de Estoque
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                    Estoque-A (Loja)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                    R$ {stockLocationStats.ESTOQUE_A.total.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {stockLocationStats.ESTOQUE_A.count} vendas
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-200/50 dark:border-fuchsia-800/40">
                  <span className="text-[10px] uppercase font-bold text-fuchsia-700 dark:text-fuchsia-300 block">
                    Estoque-V (Showroom)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                    R$ {stockLocationStats.ESTOQUE_V.total.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {stockLocationStats.ESTOQUE_V.count} vendas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-primary/10 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Produtos Mais Vendidos</h4>
              <Link
                href="/admin/products"
                className="text-primary text-xs sm:text-sm font-bold hover:underline flex items-center gap-1"
              >
                Ver catálogo <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Nenhum dado de vendas disponível ainda.
              </div>
            ) : (
              <>
                {/* Mobile Cards for Top Products (< md) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {topProducts.map((product, idx) => (
                    <div key={idx} className="py-3.5 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                          {product.img ? (
                            <AdminProductImage src={product.img} alt={product.name} />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-base">inventory_2</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{product.quantity} vendidos</span>
                            <span className="text-[11px] text-slate-400">• Estoque: {product.stock} un</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            R$ {product.revenue.toFixed(2).replace(".", ",")}
                          </p>
                          {product.stock > 10 ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">
                              Em alta
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded uppercase">
                              Baixo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead>
                      <tr className="text-left border-b border-primary/10">
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Produto</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                          Vendas
                        </th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                          Estoque Total
                        </th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                          Receita
                        </th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {topProducts.map((product, idx) => (
                        <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                {product.img ? (
                                  <AdminProductImage
                                    src={product.img}
                                    alt={product.name}
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-slate-400 text-base">
                                    inventory_2
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  ID Categoria: {product.categoryId.split("-")[0]}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center text-sm font-medium">{product.quantity} un</td>
                          <td className="py-4 text-center text-sm">
                            <div
                              className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full mx-auto overflow-hidden relative"
                              title={`Estoque total: ${product.stock} un`}
                            >
                              <div
                                className={`h-full rounded-full ${
                                  product.stock > 10 ? "bg-primary" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">{product.stock} un</span>
                          </td>
                          <td className="py-4 text-right text-sm font-bold">
                            R$ {product.revenue.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="py-4 text-right">
                            {product.stock > 10 ? (
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wide">
                                Em alta
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded uppercase tracking-wide">
                                Estoque baixo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
