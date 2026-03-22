import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StatusUpdater from "@/components/admin/sales/StatusUpdater";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const param = await params;
  const order = await prisma.order.findUnique({
    where: { id: param.id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: { images: true }
          }
        }
      }
    }
  });

  if (!order) return notFound();

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin/sales" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2 w-max transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Voltar para vendas
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            Pedido #{order.orderNumber}
            <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {new Date(order.createdAt).toLocaleString('pt-BR')}
            </span>
          </h1>
        </div>
        <StatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Itens do Pedido
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {order.items.map(item => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-slate-400">image</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.product.name}</p>
                    <p className="text-sm text-slate-500">Qtd: <span className="font-medium text-slate-700 dark:text-slate-300">{item.quantity}</span></p>
                  </div>
                  <div className="sm:text-right mt-2 sm:mt-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100">R$ {Number(item.price).toFixed(2).replace('.', ',')}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Total: R$ {((Number(item.price) * item.quantity)).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 bg-slate-50 dark:bg-slate-800/20 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-lg font-bold">
              <span className="text-slate-700 dark:text-slate-300">Total do Pedido</span>
              <span className="text-primary text-2xl tracking-tight">R$ {Number(order.totalAmount).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Cliente
            </h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                {order.customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{order.customer.name}</p>
                <p className="text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer">{order.customer.email}</p>
              </div>
            </div>
            {order.customer.phone && (
              <div className="text-sm flex items-center gap-3 text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <span className="material-symbols-outlined text-[18px] text-slate-400">call</span>
                <span className="font-medium">{order.customer.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
