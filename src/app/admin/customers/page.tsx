import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import DeleteCustomerButton from "./DeleteCustomerButton";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { Prisma } from "@prisma/client";

export const revalidate = 0;

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function Customers({ searchParams }: CustomersPageProps) {
  const resolvedParams = (await searchParams) || {};
  const q = resolvedParams.q?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 10;

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  let customers: any[] = [];
  let totalCustomersCount = 0;
  let totalCustomersAll = 0;
  let totalLifetimeSpent = 0;
  let activeCustomersCount = 0;
  let averageLTV = 0;

  try {
    const [
      fetchedCustomers,
      fetchedCount,
      countAll,
      salesAgg,
      activeCount,
    ] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: {
            where: { status: { not: "CANCELED" } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
      prisma.customer.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "CANCELED" } },
      }),
      prisma.customer.count({
        where: {
          orders: {
            some: { status: { not: "CANCELED" } },
          },
        },
      }),
    ]);

    customers = fetchedCustomers;
    totalCustomersCount = fetchedCount;
    totalCustomersAll = countAll;
    totalLifetimeSpent = Number(salesAgg._sum.totalAmount || 0);
    activeCustomersCount = activeCount;
    averageLTV = totalCustomersAll > 0 ? totalLifetimeSpent / totalCustomersAll : 0;
  } catch (err) {
    console.error("Error loading customers:", err);
  }

  const totalSpentByCustomer = customers.map((c) => {
    return (c.orders || []).reduce((acc: number, order: any) => acc + Number(order.totalAmount || 0), 0);
  });

  return (
    <AdminLayout pageTitle="Clientes">
      <div className="flex-1">
        {/* Header Override for title */}
        {/* Header Override for title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clientes</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Gerencie sua base de clientes e acompanhe o engajamento.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/api/admin/export/customers"
              target="_blank"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Baixar CSV de clientes"
            >
              <span className="material-symbols-outlined text-base text-slate-500">download</span>
              <span>CSV</span>
            </Link>
            <Link
              href="/admin/customers/new"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Novo Cliente</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
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
                    ? new Date(customer.orders[0].createdAt).toLocaleDateString("pt-BR")
                    : "N/A";
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
                        <DeleteCustomerButton id={customer.id} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Pedidos</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {customer.orders.length} pedidos
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Última Compra</span>
                        <span className="font-medium text-slate-600 dark:text-slate-400">{lastOrder}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Gasto</span>
                        <span className="font-bold text-primary dark:text-rose-300">
                          R$ {spent.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>

                    {(customer.phone || customer.email) && (
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    Total Pedidos
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Gasto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Pedido</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
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
                        ? new Date(customer.orders[0].createdAt).toLocaleDateString("pt-BR")
                        : "N/A";
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
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {customer.orders.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                          R$ {spent.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{lastOrder}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="p-1.5 hover:bg-primary/10 rounded text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              title="Editar / Ver Detalhes"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </Link>
                            <DeleteCustomerButton id={customer.id} />
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
            searchParams={{ q }}
          />
        </div>

        {/* Summary Cards Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-6 sm:mt-8">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Clientes Base</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalCustomersAll}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">database</span> Base Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LTV Médio (Life Time Value)</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                R$ {averageLTV.toFixed(2).replace(".", ",")}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                Base Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes Ativos</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{activeCustomersCount}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">person_check</span> Compras
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
