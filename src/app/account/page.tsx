import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import OrderCard from "./OrderCard";

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
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Serialize orders for Client Components
  const serializedOrders = customer?.orders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount),
    discountValue: order.discountValue ? Number(order.discountValue) : null,
    items: order.items.map(item => ({
      ...item,
      price: Number(item.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        images: item.product.images.map(img => ({ url: img.url }))
      }
    }))
  })) || [];

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[70vh]">
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
                  <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition-colors mt-4 text-left cursor-pointer">
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

            {serializedOrders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-slate-300">shopping_bag</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Você ainda não tem pedidos</h3>
                <p className="text-slate-500 mb-6">Quando você fizer compras, elas aparecerão aqui.</p>
                <Link href="/catalog" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Explorar Produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {serializedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}
