import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminFilterSelect from "@/components/admin/AdminFilterSelect";
import AdminPagination from "@/components/admin/AdminPagination";
import { OrderStatus, Prisma } from "@prisma/client";

export const revalidate = 0; // Don't cache admin pages

interface SalesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    period?: string;
    page?: string;
  }>;
}

export default async function Sales({ searchParams }: SalesPageProps) {
  const resolvedParams = (await searchParams) || {};
  const q = resolvedParams.q?.trim() || "";
  const statusParam = resolvedParams.status?.trim();
  const periodParam = resolvedParams.period?.trim();
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 10;

  // Build where filter
  const where: Prisma.OrderWhereInput = {};

  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
    where.status = statusParam as OrderStatus;
  }

  if (periodParam) {
    const now = new Date();
    if (periodParam === "7d") {
      where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (periodParam === "30d") {
      where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (periodParam === "month") {
      where.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (periodParam === "year") {
      where.createdAt = { gte: new Date(now.getFullYear(), 0, 1) };
    }
  }

  // Fetch paginated orders & total count in parallel with global metrics
  const [orders, totalOrdersCount, allOrdersForMetrics] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.order.findMany({
      select: {
        status: true,
        totalAmount: true,
      },
    }),
  ]);

  const totalSalesLifetime = allOrdersForMetrics
    .filter((o) => o.status !== "CANCELED")
    .reduce((acc, order) => acc + Number(order.totalAmount), 0);

  const nonCanceledCount = allOrdersForMetrics.filter((o) => o.status !== "CANCELED").length;
  const pendingCount = allOrdersForMetrics.filter((o) => o.status === "PENDING").length;
  const ticketMedio = nonCanceledCount > 0 ? totalSalesLifetime / nonCanceledCount : 0;

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* Header Override for title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-primary">Vendas</h2>
            <p className="text-slate-500 text-sm mt-1">Gerencie os pedidos, fretes e acompanhe o faturamento real.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/api/admin/export/sales"
              target="_blank"
              className="flex items-center gap-2 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Baixar CSV de vendas"
            >
              <span className="material-symbols-outlined text-base text-slate-500">download</span>
              Exportar CSV
            </Link>
            <Link
              href="/admin/sales/new"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Novo Pedido
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total de Vendas</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              R$ {totalSalesLifetime.toFixed(2).replace(".", ",")}
            </h3>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-semibold dark:text-emerald-400">
              <span className="material-symbols-outlined text-xs">trending_up</span> Base Real
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Pedidos</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{allOrdersForMetrics.length}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-xs">inventory_2</span> Lifetime
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ticket Médio</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              R$ {ticketMedio.toFixed(2).replace(".", ",")}
            </h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">Base Real</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm hover:border-primary/20 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pendente</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{pendingCount}</h3>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-semibold dark:text-amber-400">
              Aguardando pagamento
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px]">
            <AdminSearchBar placeholder="Buscar por cliente, ID do pedido, e-mail ou telefone..." />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <AdminFilterSelect
              paramName="period"
              defaultValue="ALL"
              placeholder="Todo o Período"
              options={[
                { label: "Últimos 7 dias", value: "7d" },
                { label: "Últimos 30 dias", value: "30d" },
                { label: "Este mês", value: "month" },
                { label: "Ano atual", value: "year" },
              ]}
            />
            <AdminFilterSelect
              paramName="status"
              defaultValue="ALL"
              placeholder="Todos os Status"
              options={[
                { label: "Pago", value: "PAID" },
                { label: "Pendente", value: "PENDING" },
                { label: "Enviado", value: "SHIPPED" },
                { label: "Entregue", value: "DELIVERED" },
                { label: "Cancelado", value: "CANCELED" },
              ]}
            />
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Frete</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                      Nenhum pedido encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    let statusColor = "slate";
                    let statusText = "Desconhecido";

                    switch (order.status) {
                      case "PAID":
                        statusColor = "green";
                        statusText = "Pago";
                        break;
                      case "PENDING":
                        statusColor = "orange";
                        statusText = "Pendente";
                        break;
                      case "CANCELED":
                        statusColor = "red";
                        statusText = "Cancelado";
                        break;
                      case "SHIPPED":
                        statusColor = "blue";
                        statusText = "Enviado";
                        break;
                      case "DELIVERED":
                        statusColor = "slate";
                        statusText = "Entregue";
                        break;
                    }

                    const initials = order.customer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-primary dark:text-primary/90">
                              {order.orderNumber}
                            </span>
                            {order.notes && (
                              <span
                                className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate"
                                title={order.notes}
                              >
                                <span className="material-symbols-outlined text-[14px] text-amber-500 shrink-0">
                                  edit_note
                                </span>
                                {order.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {initials}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {order.customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </td>
                        <td className="px-6 py-4">
                          {order.shippingType === "PAGO_AURORA" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Pago Aurora
                            </span>
                          ) : order.shippingType === "PAGO_CLIENTE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                              Cliente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Sem Frete
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                          R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${
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
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                              statusColor === "green"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : statusColor === "orange"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : statusColor === "red"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                                : statusColor === "blue"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/sales/${order.id}`}
                              className="text-slate-400 hover:text-primary transition-colors p-2 md:p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 inline-flex items-center justify-center cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </Link>
                            <DeleteButton orderId={order.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Real Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalItems={totalOrdersCount}
            pageSize={pageSize}
            itemLabel="pedidos"
            searchParams={{
              q,
              status: statusParam,
              period: periodParam,
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
