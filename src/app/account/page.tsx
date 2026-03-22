import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/auth";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const customer = await prisma.customer.findUnique({
    where: { email: session.user.email },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: true }
          }
        }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-tight">{session.user.name}</p>
                <p className="text-xs text-slate-500 truncate w-32">{session.user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              <Link href="/account" className="flex items-center gap-3 px-4 py-3 bg-primary/5 text-primary rounded-xl font-bold text-sm transition-colors">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                Meus Pedidos
              </Link>
              <Link href="/account/settings" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
                Meus Dados
              </Link>
              
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition-colors mt-4">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Sair
                </button>
              </form>
            </nav>
          </div>
        </div>

        {/* Main Content (Orders History) */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Meus Pedidos
          </h1>

          {!customer || customer.orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-300">shopping_bag</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Você ainda não tem pedidos</h3>
              <p className="text-slate-500 mb-6">Quando você fizer compras, elas aparecerão aqui.</p>
              <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                Explorar Produtos
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.orders.map(order => {
                let statusColor = 'slate';
                let statusText = 'Em processamento';
                switch(order.status) {
                  case 'PENDING': statusColor = 'amber'; statusText = 'Aguardando Pagamento'; break;
                  case 'PAID': statusColor = 'emerald'; statusText = 'Pagamento Aprovado'; break;
                  case 'SHIPPED': statusColor = 'blue'; statusText = 'Enviado'; break;
                  case 'DELIVERED': statusColor = 'emerald'; statusText = 'Entregue'; break;
                  case 'CANCELED': statusColor = 'rose'; statusText = 'Cancelado'; break;
                }

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-slate-900 text-lg">Pedido #{order.orderNumber}</span>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                           statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                           statusColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                           statusColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                           statusColor === 'rose' ? 'bg-rose-100 text-rose-700' :
                           'bg-slate-100 text-slate-700'
                        }`}>
                          {statusText}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                      <div className="flex -space-x-2">
                         {order.items.slice(0, 3).map(item => (
                           <div key={item.id} className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm" title={item.product.name}>
                             <span className="material-symbols-outlined text-[16px] text-slate-400">inventory_2</span>
                           </div>
                         ))}
                         {order.items.length > 3 && (
                           <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold text-slate-500">
                             +{order.items.length - 3}
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-3 md:gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Pago</p>
                        <p className="text-xl font-extrabold text-primary">R$ {Number(order.totalAmount).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        Ver detalhes <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
