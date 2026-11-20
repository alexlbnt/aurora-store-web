import { auth } from "@/auth";
import { isAdminUser } from "@/lib/roles";
import { NextResponse } from "next/server";
import { loadMonthlyClosing } from "@/app/admin/finance/data";
import { monthLabel, normalizeMonthKey } from "@/lib/finance";
import { PAYMENT_LABEL } from "@/lib/order-meta";

export const dynamic = "force-dynamic";

// Valores com vírgula decimal e ";" como separador: abre direto no Excel em português.
const money = (n: number) => n.toFixed(2).replace(".", ",");
const text = (s: string) => `"${s.replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdminUser(session.user)) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const monthKey = normalizeMonthKey(new URL(request.url).searchParams.get("month"));
  const d = await loadMonthlyClosing(monthKey);

  const lines: string[] = [
    `${text(`Fechamento de ${monthLabel(monthKey)}`)}`,
    "",
    "Resumo;Valor_R$",
    `Vendas do mês (sem cancelados);${money(d.sold.total)}`,
    `Pedidos;${d.sold.orders}`,
    `Peças vendidas;${d.sold.pieces}`,
    `Descontos dados;${money(d.sold.discount)}`,
    `Recebido no mês;${money(d.received.total)}`,
    `Recebido de vendas deste mês;${money(d.received.fromThisMonth)}`,
    `Recebido de vendas de outros meses;${money(d.received.fromEarlierMonths)}`,
    `Pendente das vendas do mês;${money(d.pendingFromMonth)}`,
    `Total a receber (todos os meses);${money(d.pendingOverall)}`,
    "",
    "Forma de pagamento;Recebimentos;Valor_R$",
    ...d.received.byMethod.map((m) => `${text(PAYMENT_LABEL[m.method] ?? m.method)};${m.count};${money(m.amount)}`),
    "",
    "Produto;Produzido;Vendido;Em_estoque;Faturado_R$",
    ...d.products.map((p) => `${text(p.name)};${p.produced};${p.sold};${p.stock};${money(p.revenue)}`),
    "",
    "Pedido;Cliente;Data;Total_R$;Pago_R$;Falta_R$",
    ...d.openOrders.map(
      (o) =>
        `${text(o.orderNumber)};${text(o.customerName)};${o.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })};${money(o.total)};${money(o.paid)};${money(o.remaining)}`
    ),
  ];

  return new NextResponse("﻿" + lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fechamento_aurora_${monthKey}.csv"`,
    },
  });
}
