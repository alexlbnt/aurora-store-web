import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/admin/DashboardCharts";
import Link from "next/link";
import MetricCard from "@/components/admin/ui/MetricCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { formatBRL } from "@/lib/format";
import { STOCK_LABEL } from "@/lib/order-meta";

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

  let pendingCount = 0;
  let lowStockCount = 0;
  try {
    [pendingCount, lowStockCount] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.variant.count({ where: { OR: [{ stockA: { lte: 2 } }, { stockV: { lte: 2 } }] } }),
    ]);
  } catch (err) {
    console.error("Error loading dashboard alerts:", err);
  }

  const periods = [
    { label: "7 dias", href: "/admin", active: is7Days },
    { label: "30 dias", href: "/admin?period=30d", active: is30Days },
    { label: "12 meses", href: "/admin?period=365d", active: is365Days },
  ];

  return (
    <AdminLayout pageTitle="Visão Geral">
      {/* O que precisa de atenção */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <MetricCard
          label="Pedidos pendentes"
          value={pendingCount}
          hint={pendingCount > 0 ? "Confirmar pagamento e combinar a entrega" : "Nenhum pedido esperando"}
          href="/admin/sales?status=PENDING"
          attention={pendingCount > 0}
        />
        <MetricCard
          label="Variações com estoque baixo"
          value={lowStockCount}
          hint={lowStockCount > 0 ? "Duas unidades ou menos em algum estoque" : "Estoque em dia"}
          href="/admin/products"
          attention={lowStockCount > 0}
        />
      </div>

      {/* Números gerais */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Vendas totais" value={formatBRL(totalSales)} hint="Sem pedidos cancelados" />
        <MetricCard label="Pedidos" value={totalOrdersCount} hint="Todos, desde o início" />
        <MetricCard label="Clientes" value={customersCount} />
        <MetricCard label="Ticket médio" value={formatBRL(ticketMedio)} hint="Vendas totais ÷ nº de pedidos" />
      </div>

      {/* Evolução das vendas */}
      <section className="mb-8 rounded-lg border border-primary/10 bg-white p-4 sm:p-6" aria-labelledby="evolucao">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="evolucao" className="text-lg font-semibold text-primary">Evolução das vendas</h2>
            <p className="mt-0.5 text-sm text-primary/70">{periodDescription}</p>
          </div>
          <nav aria-label="Período do gráfico" className="flex items-center gap-1.5">
            {periods.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={p.active ? "page" : undefined}
                className={`min-h-10 inline-flex items-center rounded-lg px-4 text-sm font-medium transition-colors ${
                  p.active ? "bg-primary text-white" : "bg-accent-soft text-primary hover:bg-primary/15"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="relative h-[250px] w-full sm:h-[300px]">
          <DashboardCharts data={chartData} />
        </div>
      </section>

      {/* Pedidos recentes */}
      <section className="overflow-hidden rounded-lg border border-primary/10 bg-white" aria-labelledby="recentes">
        <div className="flex items-center justify-between border-b border-primary/10 p-4 sm:p-6">
          <h2 id="recentes" className="text-lg font-semibold text-primary">Pedidos recentes</h2>
          <Link href="/admin/sales" className="text-sm font-medium text-accent-blue underline underline-offset-4 hover:text-primary">
            Ver todos os pedidos
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="p-8 text-center text-sm text-primary/70">
            Nenhum pedido ainda. Quando um pedido chegar pelo site, ele aparece aqui.
          </p>
        ) : (
          <ul className="divide-y divide-primary/10">
            {recentOrders.map((order) => {
              const first = order.items?.[0]?.product?.name || "Produto";
              const extra = (order.items?.length || 0) - 1;
              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/sales/${order.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 p-4 transition-colors hover:bg-accent-cream sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_auto_7rem] sm:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-primary">{order.customer?.name || "Cliente não informado"}</span>
                      <span className="block text-sm text-primary/60">{order.orderNumber} · {STOCK_LABEL[order.stockLocation] ?? order.stockLocation}</span>
                    </span>
                    <span className="hidden truncate text-sm text-primary/70 sm:block">
                      {first}
                      {extra > 0 && ` e mais ${extra}`}
                    </span>
                    <span className="justify-self-end"><StatusBadge status={order.status} /></span>
                    <span className="col-span-2 text-sm font-semibold text-primary sm:col-span-1 sm:text-right">
                      {formatBRL(order.totalAmount)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminLayout>
  );
}
