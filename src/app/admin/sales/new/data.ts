// Só para páginas do servidor (usa o Prisma diretamente).
import { prisma } from "@/lib/prisma";
import { uniqueResellerNames } from "@/lib/reseller";
import type { PickerCustomer, PickerProduct } from "./types";

/** Produtos, clientes e nomes de revendedoras já usados, para o formulário de pedido (novo e edição). */
export async function loadOrderFormData(): Promise<{
  products: PickerProduct[];
  customers: PickerCustomer[];
  resellerNames: string[];
}> {
  const [products, customers, resellerRows] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: true,
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, email: true, phone: true, socialMedia: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where: { resellerName: { not: null } },
      select: { resellerName: true },
      distinct: ["resellerName"],
      take: 500,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      basePrice: p.basePrice ? p.basePrice.toString() : "0",
      images: p.images.map((img) => ({ url: img.url })),
      variants: p.variants.map((v) => ({
        id: v.id,
        color: v.color,
        size: v.size,
        price: v.price ? v.price.toString() : null,
        stockA: v.stockA,
        stockV: v.stockV,
      })),
    })),
    customers,
    resellerNames: uniqueResellerNames(resellerRows.map((r) => r.resellerName)),
  };
}
