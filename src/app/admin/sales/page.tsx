import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminFilterSelect from "@/components/admin/AdminFilterSelect";
import AdminPagination from "@/components/admin/AdminPagination";
import SalesExportButton from "@/components/admin/sales/SalesExportButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import MetricCard from "@/components/admin/ui/MetricCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { formatBRL, formatDate, whatsappToCustomer } from "@/lib/format";
import { ORDER_STATUS_OPTIONS, SHIPPING_LABEL, STOCK_LABEL } from "@/lib/order-meta";
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
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      where.createdAt = { gte: d };
    } else if (periodParam === "30d") {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      where.createdAt = { gte: d };
    } else if (periodParam === "month") {
      where.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0) };
    } else if (periodParam === "year") {
      where.createdAt = { gte: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0) };
    }
  }

  // Fetch paginated orders & total count in parallel with global metrics
  let orders: any[] = [];
  let totalOrdersCount = 0;
  let totalSalesLifetime = 0;
  let pendingCount = 0;
  let ticketMedio = 0;

  try {
    const [fetchedOrders, fetchedTotal, salesAgg, fetchedPending] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { _all: true },
        where: { status: { not: "CANCELED" } },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

    orders = fetchedOrders;
    totalOrdersCount = fetchedTotal;
    totalSalesLifetime = Number(salesAgg._sum.totalAmount || 0);
    const nonCanceledCount = salesAgg._count._all || 0;
    ticketMedio = nonCanceledCount > 0 ? totalSalesLifetime / nonCanceledCount : 0;
    pendingCount = fetchedPending;
  } catch (err) {
    console.error("Error fetching sales data:", err);
  }

  const hasFilters = Boolean(q || statusParam || periodParam);

  return (
    <AdminLayout pageTitle="Vendas">
      <PageHeader
        description="Acompanhe os pedidos, o frete e o faturamento."
        actions={
          <>
            <SalesExportButton />
            <Link
              href="/admin/sales/new"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-blue"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
              Novo pedido
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Vendas totais" value={formatBRL(totalSalesLifetime)} hint="Sem pedidos cancelados" />
        <MetricCard
          label={hasFilters ? "Pedidos encontrados" : "Pedidos"}
          value={totalOrdersCount}
          hint={hasFilters ? "Com os filtros aplicados" : "Todos, desde o início"}
        />
        <MetricCard label="Ticket médio" value={formatBRL(ticketMedio)} hint="Vendas totais ÷ nº de pedidos" />
        <MetricCard
          label="Pendentes"
          value={pendingCount}
          hint="Esperando pagamento"
          href="/admin/sales?status=PENDING"
          attention={pendingCount > 0}
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col items-stretch gap-3 rounded-lg border border-primary/10 bg-white p-3 sm:p-4 md:flex-row md:items-center">
        <div className="flex-1">
          <AdminSearchBar placeholder="Buscar por cliente, nº do pedido ou telefone" />
        </div>
        <div className="grid grid-cols-2 items-center gap-2 sm:gap-3 md:flex">
          <AdminFilterSelect
            paramName="period"
            defaultValue="ALL"
            placeholder="Período"
            options={[
              { label: "Últimos 7 dias", value: "7d" },
              { label: "Últimos 30 dias", value: "30d" },
              { label: "Este mês", value: "month" },
              { label: "Este ano", value: "year" },
            ]}
          />
          <AdminFilterSelect paramName="status" defaultValue="ALL" placeholder="Status" options={ORDER_STATUS_OPTIONS} />
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="overflow-hidden rounded-lg border border-primary/10 bg-white">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,1.6fr)_6rem_10rem_7rem_8rem_6rem] gap-4 border-b border-primary/10 bg-accent-cream px-6 py-3 text-sm font-medium text-primary/70 lg:grid"
        >
          <span>Cliente e pedido</span>
          <span>Data</span>
          <span>Frete</span>
          <span className="text-right">Valor</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-primary/70">
            {hasFilters
              ? "Nenhum pedido com esses filtros. Remova um filtro ou mude a busca."
              : "Nenhum pedido ainda. Crie um pelo botão Novo pedido, ou aguarde os pedidos do site."}
          </p>
        ) : (
          <ul className="divide-y divide-primary/10">
            {orders.map((order) => {
              const customerName = order.customer?.name || "Cliente não informado";
              const waLink = whatsappToCustomer(
                order.customer?.phone,
                `Olá, ${customerName}! Sobre o seu pedido ${order.orderNumber} na Aurora…`
              );
              const shipping = SHIPPING_LABEL[order.shippingType] ?? order.shippingType;
              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-accent-cream lg:grid lg:grid-cols-[minmax(0,1.6fr)_6rem_10rem_7rem_8rem_6rem] lg:items-center lg:gap-4 lg:px-6"
                >
                  <div className="flex items-start justify-between gap-3 lg:block">
                    <Link href={`/admin/sales/${order.id}`} className="min-w-0 hover:underline">
                      <span className="block truncate font-medium text-primary">{customerName}</span>
                      <span className="block text-sm text-primary/60">
                        {order.orderNumber} · {STOCK_LABEL[order.stockLocation] ?? order.stockLocation}
                      </span>
                    </Link>
                    <span className="lg:hidden"><StatusBadge status={order.status} /></span>
                  </div>
                  {order.notes && (
                    <p className="flex items-center gap-1.5 truncate text-sm text-primary/70 lg:hidden" title={order.notes}>
                      <span className="material-symbols-outlined text-[16px] text-amber-600" aria-hidden="true">edit_note</span>
                      <span className="truncate">{order.notes}</span>
                    </p>
                  )}

                  <span className="hidden text-sm text-primary/80 lg:block">{formatDate(order.createdAt)}</span>
                  <span className="hidden text-sm text-primary/80 lg:block">{shipping}</span>
                  <span className="hidden text-right font-semibold text-primary lg:block">{formatBRL(order.totalAmount)}</span>
                  <span className="hidden lg:block"><StatusBadge status={order.status} /></span>

                  <div className="flex items-center justify-between text-sm text-primary/70 lg:hidden">
                    <span>{formatDate(order.createdAt)} · {shipping}</span>
                    <span className="text-base font-semibold text-primary">{formatBRL(order.totalAmount)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Chamar ${customerName} no WhatsApp`}
                        title="Chamar no WhatsApp"
                        className="inline-flex size-10 items-center justify-center rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">forum</span>
                      </a>
                    )}
                    <Link
                      href={`/admin/sales/${order.id}`}
                      aria-label={`Ver o pedido ${order.orderNumber}`}
                      title="Ver pedido"
                      className="inline-flex size-10 items-center justify-center rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">visibility</span>
                    </Link>
                    <DeleteButton orderId={order.id} orderNumber={order.orderNumber} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalItems={totalOrdersCount}
          pageSize={pageSize}
          itemLabel="pedidos"
          searchParams={{ q, status: statusParam, period: periodParam }}
        />
      </div>
    </AdminLayout>
  );
}
