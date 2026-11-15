import { prisma } from "@/lib/prisma";
import { appendNote, SITE_ORDER_PREFIX, STALE_SITE_ORDER_DAYS } from "@/lib/checkout";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cancela pedidos do site (prefixo AUR-) que continuam pendentes e sem nenhuma alteração
 * há mais de STALE_SITE_ORDER_DAYS dias, devolvendo as peças ao estoque do pedido.
 * "Sem alteração" usa updatedAt: se a vendedora mexeu no pedido (observação, frete, edição),
 * o prazo recomeça. Se o cliente aparecer depois, a vendedora reativa o pedido no painel
 * e o estoque é baixado de novo (regra já existente em updateOrderStatus).
 *
 * Roda de forma oportunista: a cada pedido novo no site e quando o painel busca notificações.
 */
export async function releaseStaleSiteOrders(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_SITE_ORDER_DAYS * DAY_MS);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", orderNumber: { startsWith: SITE_ORDER_PREFIX }, updatedAt: { lt: cutoff } },
    include: { items: true },
    take: 20,
  });

  const date = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  let released = 0;

  for (const order of stale) {
    const done = await prisma.$transaction(async (tx) => {
      // Condição no próprio update: se duas execuções rodarem juntas, só uma devolve o estoque.
      const res = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING", updatedAt: { lt: cutoff } },
        data: {
          status: "CANCELED",
          notes: appendNote(
            order.notes,
            `Cancelado automaticamente em ${date}: pedido do site sem confirmação em ${STALE_SITE_ORDER_DAYS} dias. As peças voltaram ao estoque.`
          ),
        },
      });
      if (res.count === 0) return false;

      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.variant.updateMany({
          where: { id: item.variantId },
          data:
            order.stockLocation === "ESTOQUE_A"
              ? { stockA: { increment: item.quantity } }
              : { stockV: { increment: item.quantity } },
        });
      }
      return true;
    });
    if (done) released++;
  }

  return released;
}
