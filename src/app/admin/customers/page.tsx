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

  const [customers, totalCustomersCount, allCustomers] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        orders: {
          where: { status: { not: "CANCELED" } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      include: {
        orders: {
          where: { status: { not: "CANCELED" } },
          select: { totalAmount: true },
        },
      },
    }),
  ]);

  const totalSpentByCustomer = customers.map((c) => {
    return c.orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  });

  const allSpentArray = allCustomers.map((c) =>
    c.orders.reduce((acc, o) => acc + Number(o.totalAmount), 0)
  );
  const totalLifetimeSpent = allSpentArray.reduce((acc, curr) => acc + curr, 0);
  const averageLTV = allCustomers.length > 0 ? totalLifetimeSpent / allCustomers.length : 0;
  const activeCustomersCount = allCustomers.filter((c) => c.orders.length > 0).length;

  return (
    <AdminLayout>
      <div className="flex-1">
        {/* Header Override for title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clientes</h2>
            <p className="text-slate-500 text-sm mt-1">Gerencie sua base de clientes e acompanhe o engajamento.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/api/admin/export/customers"
              target="_blank"
              className="flex items-center justify-center gap-2 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Baixar CSV de clientes"
            >
              <span className="material-symbols-outlined text-lg text-slate-500">download</span>
              Exportar CSV
            </Link>
            <Link
              href="/admin/customers/new"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Adicionar Cliente
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

          {/* Table Container */}
          <div className="overflow-x-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Clientes Base</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{allCustomers.length}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">database</span> Base Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LTV Médio (Life Time Value)</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                R$ {averageLTV.toFixed(2).replace(".", ",")}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                Base Real
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes Ativos</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeCustomersCount}</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded flex items-center">
                <span className="material-symbols-outlined text-sm">person_check</span> Compras
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
