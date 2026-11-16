import { prisma } from "@/lib/prisma";
import { monthRange, paymentBalance, roundMoney } from "@/lib/finance";

export interface MonthlyClosing {
  monthKey: string;
  /** Pedidos feitos no mês (sem cancelados). */
  sold: { total: number; orders: number; pieces: number; discount: number };
  /** Dinheiro que entrou no mês, pela data do recebimento. */
  received: {
    total: number;
    fromThisMonth: number;
    fromEarlierMonths: number;
    byMethod: { method: string; amount: number; count: number }[];
  };
  /** Quanto das vendas do mês ainda falta receber (hoje). */
  pendingFromMonth: number;
  /** Tudo o que falta receber, de qualquer mês. */
  pendingOverall: number;
  openOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    createdAt: Date;
    total: number;
    paid: number;
    remaining: number;
  }[];
  products: {
    id: string;
    name: string;
    produced: number;
    sold: number;
    revenue: number;
    stock: number;
  }[];
}

export async function loadMonthlyClosing(monthKey: string): Promise<MonthlyClosing> {
  const { start, end } = monthRange(monthKey);
  const inMonth = { gte: start, lt: end };

  const [monthOrders, monthPayments, activeOrders, production, catalog] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: inMonth, status: { not: "CANCELED" } },
      select: {
        totalAmount: true,
        discountAmount: true,
        payments: { select: { amount: true } },
        items: { select: { productId: true, quantity: true, price: true } },
      },
    }),
    prisma.orderPayment.findMany({
      where: { paidAt: inMonth, order: { status: { not: "CANCELED" } } },
      select: { amount: true, method: true, order: { select: { createdAt: true } } },
    }),
    prisma.order.findMany({
      where: { status: { not: "CANCELED" } },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        customer: { select: { name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.productionEntry.groupBy({
      by: ["productId"],
      where: { producedAt: inMonth },
      _sum: { quantity: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, variants: { select: { stockA: true, stockV: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Vendido no mês
  let soldTotal = 0;
  let pieces = 0;
  let discount = 0;
  let pendingFromMonth = 0;
  const soldByProduct = new Map<string, { qty: number; revenue: number }>();
  for (const o of monthOrders) {
    const total = Number(o.totalAmount);
    soldTotal += total;
    discount += Number(o.discountAmount);
    pendingFromMonth += paymentBalance(total, o.payments.map((p) => ({ amount: Number(p.amount) }))).remaining;
    for (const i of o.items) {
      pieces += i.quantity;
      const cur = soldByProduct.get(i.productId) ?? { qty: 0, revenue: 0 };
      cur.qty += i.quantity;
      cur.revenue += Number(i.price) * i.quantity;
      soldByProduct.set(i.productId, cur);
    }
  }

  // Recebido no mês
  let receivedTotal = 0;
  let fromThisMonth = 0;
  const byMethod = new Map<string, { amount: number; count: number }>();
  for (const p of monthPayments) {
    const amount = Number(p.amount);
    receivedTotal += amount;
    if (p.order.createdAt >= start && p.order.createdAt < end) fromThisMonth += amount;
    const cur = byMethod.get(p.method) ?? { amount: 0, count: 0 };
    cur.amount += amount;
    cur.count += 1;
    byMethod.set(p.method, cur);
  }

  // Em aberto (de qualquer mês)
  const openOrders: MonthlyClosing["openOrders"] = [];
  let pendingOverall = 0;
  for (const o of activeOrders) {
    const b = paymentBalance(Number(o.totalAmount), o.payments.map((p) => ({ amount: Number(p.amount) })));
    if (b.remaining <= 0) continue;
    pendingOverall += b.remaining;
    openOrders.push({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      createdAt: o.createdAt,
      total: b.total,
      paid: b.paid,
      remaining: b.remaining,
    });
  }

  const producedBy = new Map(production.map((p) => [p.productId, p._sum.quantity ?? 0]));
  const products = catalog
    .map((p) => ({
      id: p.id,
      name: p.name,
      produced: producedBy.get(p.id) ?? 0,
      sold: soldByProduct.get(p.id)?.qty ?? 0,
      revenue: roundMoney(soldByProduct.get(p.id)?.revenue ?? 0),
      stock: p.variants.reduce((acc, v) => acc + v.stockA + v.stockV, 0),
    }))
    .filter((p) => p.produced > 0 || p.sold > 0)
    .sort((a, b) => b.sold - a.sold || b.produced - a.produced);

  return {
    monthKey,
    sold: { total: roundMoney(soldTotal), orders: monthOrders.length, pieces, discount: roundMoney(discount) },
    received: {
      total: roundMoney(receivedTotal),
      fromThisMonth: roundMoney(fromThisMonth),
      fromEarlierMonths: roundMoney(receivedTotal - fromThisMonth),
      byMethod: [...byMethod.entries()]
        .map(([method, v]) => ({ method, amount: roundMoney(v.amount), count: v.count }))
        .sort((a, b) => b.amount - a.amount),
    },
    pendingFromMonth: roundMoney(pendingFromMonth),
    pendingOverall: roundMoney(pendingOverall),
    openOrders,
    products,
  };
}
