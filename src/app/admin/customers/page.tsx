import React from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import MetricCard from "@/components/admin/ui/MetricCard";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DeleteCustomerButton from "./DeleteCustomerButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { Prisma } from "@prisma/client";
import { INACTIVE_CUSTOMER_DAYS, isInactive, lastPurchaseLabel } from "@/lib/customer-activity";
import { countInactiveCustomers, customerSearchWhere, loadInactiveCustomerIds } from "./data";

export const revalidate = 0;

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    /** "1" = só clientes sem comprar há mais de 60 dias */
    sumidos?: string;
  }>;
}

/** Última compra: "há N dias" com a data no título; em âmbar quando a cliente sumiu. */
function LastPurchase({ date, className }: { date: Date | null; className: string }) {
  const inactive = isInactive(date);
  return (
    <span
      className={inactive ? `${className} font-semibold text-amber-700` : className}
      title={date ? date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : undefined}
    >
      {lastPurchaseLabel(date)}
    </span>
  );
}

const customerListInclude = {
  orders: {
    where: { status: { not: "CANCELED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      totalAmount: true,
      createdAt: true,
    },
  },
} satisfies Prisma.CustomerInclude;

export default async function Customers({ searchParams }: CustomersPageProps) {
  const resolvedParams = (await searchParams) || {};
  const q = resolvedParams.q?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 10;

  const onlyInactive = resolvedParams.sumidos === "1";
  const where = customerSearchWhere(q);

  let customers: Prisma.CustomerGetPayload<{ include: typeof customerListInclude }>[] = [];
  let totalCustomersCount = 0;
  let totalCustomersAll = 0;
  let activeCustomersCount = 0;
  let inactiveCount = 0;

  try {
    const loadList = async () => {
      if (!onlyInactive) {
        const [list, count] = await Promise.all([
          prisma.customer.findMany({
            where,
            include: customerListInclude,
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
          }),
          prisma.customer.count({ where }),
        ]);
        return { list, count };
      }
      // Sumidos: a ordem (quem sumiu há mais tempo primeiro) vem da consulta dos ids.
      const { ids, total } = await loadInactiveCustomerIds({ q, page: currentPage, pageSize });
      const found = await prisma.customer.findMany({ where: { id: { in: ids } }, include: customerListInclude });
      const byId = new Map(found.map((c) => [c.id, c]));
      return { list: ids.flatMap((id) => byId.get(id) ?? []), count: total };
    };

    const [{ list, count }, countAll, activeCount, inactive] = await Promise.all([
      loadList(),
      prisma.customer.count(),
      prisma.customer.count({
        where: {
          orders: {
            some: { status: { not: "CANCELED" } },
          },
        },
      }),
      countInactiveCustomers(),
    ]);

    customers = list;
    totalCustomersCount = count;
    totalCustomersAll = countAll;
    activeCustomersCount = activeCount;
    inactiveCount = inactive;
  } catch (err) {
    console.error("Error loading customers:", err);
  }

  const totalSpentByCustomer = customers.map((c) => {
    return (c.orders || []).reduce((acc: number, order) => acc + Number(order.totalAmount || 0), 0);
  });

  return (
    <AdminLayout pageTitle="Clientes">
      <div className="flex-1">
        <PageHeader
          description="Veja quem compra com você e quanto cada pessoa já gastou."
          actions={
            <>
              <Link
                href="/api/admin/export/customers"
                target="_blank"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 sm:flex-none"
                title="Baixar a lista de clientes em planilha"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
                Baixar planilha (CSV)
              </Link>
              <Link
                href="/admin/customers/new"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-blue sm:flex-none"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">person_add</span>
                Novo cliente
              </Link>
            </>
          }
        />

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <MetricCard label="Clientes cadastrados" value={totalCustomersAll} />
          <MetricCard label="Já compraram" value={activeCustomersCount} hint="Com ao menos um pedido não cancelado" />
          <MetricCard
            label={`Sem comprar há +${INACTIVE_CUSTOMER_DAYS} dias`}
            value={inactiveCount}
            hint={`Última compra há mais de ${INACTIVE_CUSTOMER_DAYS} dias`}
            href="/admin/customers?sumidos=1"
            attention={inactiveCount > 0}
          />
        </div>

        {onlyInactive && (
          <p className="mb-3 text-sm text-primary/80">
            Mostrando clientes sem comprar há +{INACTIVE_CUSTOMER_DAYS} dias, quem sumiu há mais tempo primeiro ·{" "}
            <Link
              href={q ? `/admin/customers?q=${encodeURIComponent(q)}` : "/admin/customers"}
              className="font-semibold text-primary underline underline-offset-2"
            >
              ver todos
            </Link>
          </p>
        )}

        <div className="bg-white rounded-lg border border-primary/10 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-primary/10 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="max-w-md">
              <AdminSearchBar placeholder="Buscar por nome, e-mail, telefone ou cidade..." />
            </div>
          </div>

          {/* Mobile Cards (md:hidden) */}
          <div className="md:hidden divide-y divide-primary/5">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhum cliente encontrado.
              </div>
            ) : (
              customers.map((customer, i) => {
                const spent = totalSpentByCustomer[i];
                const lastOrder =
                  customer.orders.length > 0
                    ? new Date(customer.orders[0].createdAt)
                    : null;
                const initials = customer.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() || "CL";
                const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";
                const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

                return (
                  <div key={`mob-${customer.id}`} className="p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {customer.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            ID: {customer.id.split("-")[0]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <span className="material-symbols-outlined text-base">forum</span>
                          </a>
                        )}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="size-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center hover:bg-sky-100 transition-colors"
                          title="Ligar para cliente"
                        >
                          <span className="material-symbols-outlined text-base">call</span>
                        </a>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="size-8 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </Link>
                        <DeleteCustomerButton id={customer.id} name={customer.name} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      <div>
                        <span className="text-primary/60 text-xs block">Pedidos</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {customer.orders.length} pedidos
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-primary/60 text-xs block">Última compra</span>
                        <LastPurchase date={lastOrder} className="font-medium text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="text-right">
                        <span className="text-primary/60 text-xs block">Total gasto</span>
                        <span className="font-bold text-primary dark:text-rose-300">
                          R$ {spent.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>

                    {(customer.phone || customer.email || customer.city) && (
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                        {customer.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">phone</span>
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">mail</span>
                            {customer.email}
                          </span>
                        )}
                        {customer.city && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">location_on</span>
                            {customer.city}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Table Container Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-left border-b border-primary/10">
                  <th className="px-6 py-4 text-sm font-medium text-primary/70 w-[30%]">Nome</th>
                  <th className="px-6 py-4 text-sm font-medium text-primary/70">Contato</th>
                  <th className="px-6 py-4 text-sm font-medium text-primary/70 text-center">
                    Total Pedidos
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-primary/70">Valor Gasto</th>
                  <th className="px-6 py-4 text-sm font-medium text-primary/70">Última compra</th>
                  <th className="px-6 py-4 text-sm font-medium text-primary/70 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, i) => {
                    const spent = totalSpentByCustomer[i];
                    const lastOrder =
                      customer.orders.length > 0
                        ? new Date(customer.orders[0].createdAt)
                        : null;
                    const initials = customer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-primary/5 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-inner">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                              <p className="text-xs text-slate-500">ID: {customer.id.split("-")[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">{customer.phone}</div>
                          <div className="text-xs text-slate-400">{customer.email || "Sem e-mail"}</div>
                          {customer.city && <div className="text-xs text-slate-500">{customer.city}</div>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {customer.orders.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                          R$ {spent.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4 text-sm"><LastPurchase date={lastOrder} className="text-slate-500" /></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="p-1.5 hover:bg-primary/10 rounded text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              title="Editar / Ver Detalhes"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </Link>
                            <DeleteCustomerButton id={customer.id} name={customer.name} />
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
            totalItems={totalCustomersCount}
            pageSize={pageSize}
            itemLabel="clientes"
            searchParams={{ q, sumidos: onlyInactive ? "1" : undefined }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
