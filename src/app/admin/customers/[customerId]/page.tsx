import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import CustomerForm from "../new/CustomerForm";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, "") : "";
  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  const validOrders = customer.orders.filter((o) => o.status !== "CANCELED");
  const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalOrders = customer.orders.length;
  const averageTicket = validOrders.length > 0 ? totalSpent / validOrders.length : 0;
  const lastOrderDate = customer.orders[0]?.createdAt
    ? new Date(customer.orders[0].createdAt).toLocaleDateString("pt-BR")
    : "Nenhuma compra";

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "DELIVERED":
        return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
      case "PENDING":
      case "SHIPPED":
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
      case "CANCELED":
        return "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Pago";
      case "DELIVERED":
        return "Entregue";
      case "PENDING":
        return "Pendente";
      case "SHIPPED":
        return "Enviado";
      case "CANCELED":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <AdminLayout pageTitle={`Cliente: ${customer.name}`}>
      <div className="flex-1 pb-16">
        {/* Header Breadcrumbs & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/customers"
              className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              title="Voltar para clientes"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {customer.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cliente desde {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
                title="Conversar no WhatsApp"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>WhatsApp</span>
              </a>
            )}
            <Link
              href={`/admin/sales/new?customerId=${customer.id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
              title="Registrar nova venda para este cliente"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              <span>+ Nova Venda</span>
            </Link>
          </div>
        </div>

        {/* Customer Metrics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Total Gasto (LTV)
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {totalSpent.toFixed(2).replace(".", ",")}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Vendas aprovadas</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Total de Pedidos
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalOrders} {totalOrders === 1 ? "pedido" : "pedidos"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">{validOrders.length} concluídos</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Ticket Médio
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              R$ {averageTicket.toFixed(2).replace(".", ",")}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Média por pedido</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Última Compra
            </p>
            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">
              {lastOrderDate}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Recorrência do cliente</p>
          </div>
        </div>

        {/* Two Column Layout: Purchase History & Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Purchase History */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Histórico de Pedidos ({customer.orders.length})
                  </h3>
                </div>
                <Link
                  href={`/admin/sales/new?customerId=${customer.id}`}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Novo Pedido
                </Link>
              </div>

              {customer.orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_bag</span>
                  <p className="text-xs font-medium">Este cliente ainda não realizou compras.</p>
                  <Link
                    href={`/admin/sales/new?customerId=${customer.id}`}
                    className="inline-block mt-3 text-xs font-bold text-primary hover:underline"
                  >
                    Registrar a primeira venda →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {customer.orders.map((order) => {
                    const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);
                    const formattedDate = new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <Link
                        key={order.id}
                        href={`/admin/sales/${order.id}`}
                        className="p-3 sm:p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center justify-between gap-3 group block"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              Pedido {order.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(
                                order.status
                              )}`}
                            >
                              {statusLabel(order.status)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1">
                            {formattedDate} • {totalItems} {totalItems === 1 ? "item" : "itens"}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-1">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[160px]"
                              >
                                {item.quantity}x {item.product.name}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{order.items.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white block">
                            R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-[11px] text-primary font-medium group-hover:underline flex items-center justify-end gap-0.5 mt-0.5">
                            Ver pedido
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Edit Customer Form */}
          <div className="lg:col-span-5">
            <CustomerForm initialData={customer} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
