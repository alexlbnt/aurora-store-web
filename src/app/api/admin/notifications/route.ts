import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const [pendingOrders, lowStockVariants, recentPaidOrders] = await Promise.all([
      // 1. Pedidos pendentes de pagamento / confirmação
      prisma.order.findMany({
        where: { status: "PENDING" },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      }),

      // 2. Variantes com estoque baixo ou zerado (estoque A ou V <= 2)
      prisma.variant.findMany({
        where: {
          OR: [{ stockA: { lte: 2 } }, { stockV: { lte: 2 } }],
        },
        take: 8,
        orderBy: [{ stockA: "asc" }, { stockV: "asc" }],
        select: {
          id: true,
          color: true,
          size: true,
          stockA: true,
          stockV: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      }),

      // 3. Vendas recentes confirmadas (últimas 4)
      prisma.order.findMany({
        where: {
          status: { in: ["PAID", "DELIVERED"] },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    type AlertItem = {
      id: string;
      category: "order" | "stock" | "sale";
      type: "pending_order" | "low_stock" | "recent_sale";
      severity: "warning" | "danger" | "success";
      title: string;
      description: string;
      timeAgo: string;
      createdAt: string;
      href: string;
    };

    const alerts: AlertItem[] = [];

    // Formatar pedidos pendentes
    pendingOrders.forEach((o) => {
      alerts.push({
        id: `pending-${o.id}`,
        category: "order",
        type: "pending_order",
        severity: "warning",
        title: `Pedido ${o.orderNumber} aguardando pagamento`,
        description: `${o.customer?.name || "Cliente"} • R$ ${Number(o.totalAmount).toFixed(2).replace(".", ",")}`,
        timeAgo: getTimeAgo(o.createdAt),
        createdAt: o.createdAt.toISOString(),
        href: `/admin/sales?q=${encodeURIComponent(o.orderNumber)}`,
      });
    });

    // Formatar alertas de estoque baixo
    lowStockVariants.forEach((v) => {
      const totalStock = (v.stockA || 0) + (v.stockV || 0);
      const isZero = totalStock === 0;

      alerts.push({
        id: `stock-${v.id}`,
        category: "stock",
        type: "low_stock",
        severity: isZero ? "danger" : "warning",
        title: isZero ? `Estoque Esgotado: ${v.product.name}` : `Estoque Baixo: ${v.product.name}`,
        description: `Cor: ${v.color} | Tam: ${v.size} • Restam ${totalStock} un. (A: ${v.stockA}, V: ${v.stockV})`,
        timeAgo: "Crítico",
        createdAt: new Date().toISOString(),
        href: `/admin/products/${v.product.id}/edit`,
      });
    });

    // Formatar vendas recentes aprovadas
    recentPaidOrders.forEach((o) => {
      alerts.push({
        id: `sale-${o.id}`,
        category: "sale",
        type: "recent_sale",
        severity: "success",
        title: `Venda aprovada ${o.orderNumber}`,
        description: `${o.customer?.name || "Cliente"} • R$ ${Number(o.totalAmount).toFixed(2).replace(".", ",")}`,
        timeAgo: getTimeAgo(o.createdAt),
        createdAt: o.createdAt.toISOString(),
        href: `/admin/sales?q=${encodeURIComponent(o.orderNumber)}`,
      });
    });

    const unreadCount = pendingOrders.length + lowStockVariants.length;

    return NextResponse.json({
      alerts,
      counts: {
        total: alerts.length,
        unread: unreadCount,
        pending: pendingOrders.length,
        stock: lowStockVariants.length,
        recent: recentPaidOrders.length,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
    return new NextResponse("Erro ao buscar notificações", { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffInSeconds < 60) return "Agora mesmo";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Há ${diffInDays}d`;
}
