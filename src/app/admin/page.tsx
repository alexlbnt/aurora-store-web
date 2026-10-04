import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/admin/DashboardCharts";
import Link from "next/link";

export const revalidate = 0;

interface DashboardProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const resolvedParams = (await searchParams) || {};
  const periodParam = resolvedParams?.period?.trim().toLowerCase();
  const is365Days = periodParam === "365d" || periodParam === "1y" || periodParam === "year";
  const is30Days = periodParam === "30d";
  const is7Days = !is30Days && !is365Days;

  const periodDescription = is365Days
    ? "Desempenho dos últimos 365 dias (12 meses) baseado em pedidos reais"
    : is30Days
    ? "Desempenho dos últimos 30 dias baseado em pedidos reais"
    : "Desempenho dos últimos 7 dias baseado em pedidos reais";

  let totalSales = 0;
  let totalOrdersCount = 0;
  let ticketMedio = 0;
  let customersCount = 0;
  let recentOrders: any[] = [];
  let chartData: Array<{ name: string; total: number }> = [];

  try {
    const chartStartDate = new Date();
    if (is365Days) {
      chartStartDate.setDate(chartStartDate.getDate() - 365);
    } else if (is30Days) {
      chartStartDate.setDate(chartStartDate.getDate() - 29);
    } else {
      chartStartDate.setDate(chartStartDate.getDate() - 6);
    }
    chartStartDate.setHours(0, 0, 0, 0);

    const [
      salesAgg,
      totalOrders,
      customers,
      fetchedRecentOrders,
      periodOrders,
    ] = await Promise.all([
      // 1. Aggregated sales lifetime (non-canceled)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { _all: true },
        where: { status: { not: "CANCELED" } },
      }),
      // 2. Total orders count
      prisma.order.count(),
      // 3. Total customers count
      prisma.customer.count(),
      // 4. Only the 5 most recent orders for display
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          stockLocation: true,
          totalAmount: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
          items: {
            select: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      }),
      // 5. Lean data for chart only for selected period
      prisma.order.findMany({
        where: {
          createdAt: { gte: chartStartDate },
          status: { not: "CANCELED" },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
    ]);

    totalSales = Number(salesAgg._sum.totalAmount || 0);
    const nonCanceledOrdersCount = salesAgg._count._all || 0;
    ticketMedio = nonCanceledOrdersCount > 0 ? totalSales / nonCanceledOrdersCount : 0;
    totalOrdersCount = totalOrders;
    customersCount = customers;
    recentOrders = fetchedRecentOrders;

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

      periodOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        const slot = monthlySlots.find((s) => s.key === orderKey);
        if (slot) {
          slot.total += Number(order.totalAmount);
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

      periodOrders.forEach((order) => {
        const dateStr = new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
        const dayData = dailySlots.find((d) => d.name === dateStr);
        if (dayData) {
          dayData.total += Number(order.totalAmount);
        }
      });

      chartData = dailySlots;
    }
  } catch (dbErr) {
    console.error("Error loading dashboard data:", dbErr);
  }

  return (
    <AdminLayout pageTitle="Visão Geral">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-slate-900 justify-between flex-col p-3.5 sm:p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex w-full justify-between items-start mb-2.5 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-2xl">payments</span>
            </div>
            <span className="text-emerald-500 text-[10px] sm:text-xs font-bold flex items-center gap-0.5">Base Real</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">Vendas Totais</p>
          <p className="text-lg sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-800 dark:text-slate-100">
            R$ {totalSales.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-2.5 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-2xl">shopping_cart</span>
            </div>
            <span className="text-emerald-500 text-[10px] sm:text-xs font-bold flex items-center gap-0.5">Lifetime</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">Pedidos</p>
          <p className="text-lg sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-800 dark:text-slate-100">{totalOrdersCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-2.5 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-2xl">person_add</span>
            </div>
            <span className="text-emerald-500 text-[10px] sm:text-xs font-bold flex items-center gap-0.5">Lifetime</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">Clientes</p>
          <p className="text-lg sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-800 dark:text-slate-100">{customersCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex justify-between items-start mb-2.5 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg sm:text-2xl">receipt_long</span>
            </div>
            <span className="text-emerald-500 text-[10px] sm:text-xs font-bold flex items-center gap-0.5">Base Real</span>
          </div>
          <div className="relative group inline-flex items-center gap-1 cursor-help">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">Ticket Médio</p>
            <span className="material-symbols-outlined text-[13px] sm:text-[15px] text-slate-400 group-hover:text-primary transition-colors">
              help_outline
            </span>

            {/* Tooltip Pop-up */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col w-60 sm:w-64 p-3 bg-slate-900/95 dark:bg-slate-800 text-white text-xs rounded-xl shadow-xl border border-slate-700/50 z-50 pointer-events-none backdrop-blur-sm">
              <span className="font-bold text-primary dark:text-primary/90 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                O que é Ticket Médio?
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                É o valor médio gasto pelos clientes em cada compra confirmada na sua loja.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Cálculo:</span>
                <span className="font-mono text-slate-200 font-semibold">Total Faturado ÷ Nº Pedidos</span>
              </div>
              <div className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-800 dark:text-slate-100">
            R$ {ticketMedio.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      {/* Sales Chart Section */}
      <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Evolução das Vendas</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {periodDescription}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
              <Link
                href="/admin"
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-lg transition-colors ${
                  is7Days
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                7 Dias
              </Link>
              <Link
                href="/admin?period=30d"
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-lg transition-colors ${
                  is30Days
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                30 Dias
              </Link>
              <Link
                href="/admin?period=365d"
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-lg transition-colors ${
                  is365Days
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Último ano (365 dias)"
              >
                365 Dias
              </Link>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full relative">
            <DashboardCharts data={chartData} />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/5 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Pedidos Recentes</h3>
          <Link href="/admin/sales" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
            Ver todos <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum pedido recente.
          </div>
        ) : (
          <>
            {/* Mobile Order Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((order) => {
                let statusColor = "slate";
                let statusText = "Desconhecido";

                switch (order.status) {
                  case "PAID":
                    statusColor = "emerald";
                    statusText = "PAGO";
                    break;
                  case "PENDING":
                    statusColor = "amber";
                    statusText = "PENDENTE";
                    break;
                  case "CANCELED":
                    statusColor = "red";
                    statusText = "CANCELADO";
                    break;
                  case "SHIPPED":
                    statusColor = "blue";
                    statusText = "ENVIADO";
                    break;
                  case "DELIVERED":
                    statusColor = "slate";
                    statusText = "ENTREGUE";
                    break;
                }

                return (
                  <Link
                    key={order.id}
                    href={`/admin/sales/${order.id}`}
                    className="block p-4 space-y-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          statusColor === "emerald"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : statusColor === "amber"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : statusColor === "red"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {statusText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {order.customer?.name || "Cliente não informado"}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.stockLocation === "ESTOQUE_A"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                            : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-400"
                        }`}
                      >
                        {order.stockLocation === "ESTOQUE_A" ? "Estoque-A" : "Estoque-V"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      <span className="text-slate-500 truncate max-w-[180px]">
                        {order.items?.length > 0 ? (order.items[0].product?.name || "Produto") : "Vários itens"}
                        {(order.items?.length || 0) > 1 && ` (+${order.items.length - 1})`}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID Pedido</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {recentOrders.map((order) => {
                    let statusColor = "slate";
                    let statusText = "Desconhecido";

                    switch (order.status) {
                      case "PAID":
                        statusColor = "emerald";
                        statusText = "PAGO";
                        break;
                      case "PENDING":
                        statusColor = "amber";
                        statusText = "PENDENTE";
                        break;
                      case "CANCELED":
                        statusColor = "red";
                        statusText = "CANCELADO";
                        break;
                      case "SHIPPED":
                        statusColor = "blue";
                        statusText = "ENVIADO";
                        break;
                      case "DELIVERED":
                        statusColor = "slate";
                        statusText = "ENTREGUE";
                        break;
                    }

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">
                          <Link href={`/admin/sales/${order.id}`} className="hover:text-primary transition-colors">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {order.customer?.name || "Cliente não informado"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {order.items?.length > 0 ? (order.items[0].product?.name || "Produto") : "Vários itens"}
                          {(order.items?.length || 0) > 1 && ` (+${order.items.length - 1})`}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                          R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              order.stockLocation === "ESTOQUE_A"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                                : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-400"
                            }`}
                          >
                            {order.stockLocation === "ESTOQUE_A" ? "Estoque-A" : "Estoque-V"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              statusColor === "emerald"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : statusColor === "amber"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : statusColor === "red"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
