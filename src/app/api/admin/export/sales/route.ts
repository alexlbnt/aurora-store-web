import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "Numero_Pedido;Cliente;Telefone;Email;Data;Status;Tipo_Frete;Endereco_Entrega;Cidade;Estado;CEP;Qtd_Itens;Total_R$;Observacoes\n";
  const rows = orders.map((o) => {
    const date = new Date(o.createdAt).toLocaleDateString("pt-BR");
    const total = Number(o.totalAmount).toFixed(2);
    const totalItems = o.items.reduce((acc, i) => acc + i.quantity, 0);
    const notes = (o.notes || "").replace(/"/g, '""');
    const address = (o.shippingAddress || "").replace(/"/g, '""');

    return `"${o.orderNumber}";"${o.customer.name}";"${o.customer.phone}";"${o.customer.email || ""}";"${date}";"${o.status}";"${o.shippingType}";"${address}";"${o.shippingCity || ""}";"${o.shippingState || ""}";"${o.shippingCep || ""}";${totalItems};${total};"${notes}"`;
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = "\uFEFF" + header + rows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas_aurora_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
