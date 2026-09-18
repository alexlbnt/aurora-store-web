import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        where: { status: { not: "CANCELED" } },
        select: { totalAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "ID;Nome;Email;Telefone;Endereco;Cidade;Estado;CEP;Qtd_Pedidos;Total_Gasto_R$;Data_Cadastro\n";
  const rows = customers.map((c) => {
    const totalSpent = c.orders.reduce((acc, o) => acc + Number(o.totalAmount), 0).toFixed(2);
    const date = new Date(c.createdAt).toLocaleDateString("pt-BR");
    return `"${c.id}";"${c.name}";"${c.email || ""}";"${c.phone}";"${c.address || ""}";"${c.city || ""}";"${c.state || ""}";"${c.cep || ""}";${c.orders.length};${totalSpent};"${date}"`;
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = "\uFEFF" + header + rows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes_aurora_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
