import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "SKU;Nome;Categoria;Preco_Base_R$;Estoque_A;Estoque_V;Total_Variacoes\n";
  const rows = products.map((p) => {
    const stockA = p.variants.reduce((acc, v) => acc + v.stockA, 0);
    const stockV = p.variants.reduce((acc, v) => acc + v.stockV, 0);
    const price = Number(p.basePrice).toFixed(2);
    const name = p.name.replace(/"/g, '""');
    const category = p.category.name.replace(/"/g, '""');

    return `"${p.sku}";"${name}";"${category}";${price};${stockA};${stockV};${p.variants.length}`;
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = "\uFEFF" + header + rows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produtos_aurora_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
