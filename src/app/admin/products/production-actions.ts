"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleDatabaseError } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/require-admin";
import { parseDateInput } from "@/lib/finance";

type Location = "ESTOQUE_A" | "ESTOQUE_V";

function revalidateProduction() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/sales/new");
  revalidatePath("/admin/finance");
}

/** Variações com estoque, produzido e vendido de cada uma, e os últimos lançamentos de produção. */
export async function getProductionOverview(productId: string) {
  try {
    await requireAdmin();
    const [product, produced, sold, history] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          variants: {
            orderBy: [{ size: "asc" }, { color: "asc" }],
            select: { id: true, size: true, color: true, stockA: true, stockV: true },
          },
        },
      }),
      prisma.productionEntry.groupBy({
        by: ["variantId"],
        where: { productId },
        _sum: { quantity: true },
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        where: { productId, order: { status: { not: "CANCELED" } } },
        _sum: { quantity: true },
      }),
      prisma.productionEntry.findMany({
        where: { productId },
        orderBy: [{ producedAt: "desc" }, { createdAt: "desc" }],
        take: 30,
        select: {
          id: true,
          quantity: true,
          stockLocation: true,
          producedAt: true,
          notes: true,
          variant: { select: { size: true, color: true } },
        },
      }),
    ]);
    if (!product) return { error: "Produto não encontrado." };

    const producedBy = new Map(produced.map((p) => [p.variantId, p._sum.quantity ?? 0]));
    const soldBy = new Map(sold.map((s) => [s.variantId ?? "", s._sum.quantity ?? 0]));

    return {
      product: {
        id: product.id,
        name: product.name,
        variants: product.variants.map((v) => ({
          ...v,
          produced: producedBy.get(v.id) ?? 0,
          sold: soldBy.get(v.id) ?? 0,
        })),
      },
      history: history.map((h) => ({
        id: h.id,
        quantity: h.quantity,
        stockLocation: h.stockLocation as Location,
        producedAt: h.producedAt.toISOString(),
        notes: h.notes,
        variantLabel: `${h.variant.size} · ${h.variant.color}`,
      })),
    };
  } catch (error) {
    console.error("Error loading production overview:", error);
    return { error: handleDatabaseError(error, "Não foi possível carregar a produção deste produto.") };
  }
}

/**
 * Lança a produção de várias cores/tamanhos de uma vez. Cada lançamento soma no estoque escolhido.
 * `entries` chega como JSON: [{ variantId, quantity }].
 */
export async function addProduction(productId: string, formData: FormData) {
  try {
    await requireAdmin();
    const stockLocation: Location = formData.get("stockLocation") === "ESTOQUE_V" ? "ESTOQUE_V" : "ESTOQUE_A";
    const producedAt = parseDateInput(String(formData.get("producedAt") ?? "")) ?? new Date();
    if (producedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { error: "A data da produção não pode ser no futuro." };
    }
    const notes = String(formData.get("notes") ?? "").trim() || null;

    let entries: { variantId: string; quantity: number }[];
    try {
      const raw = JSON.parse(String(formData.get("entries") ?? "[]")) as { variantId?: unknown; quantity?: unknown }[];
      entries = raw
        .map((e) => ({ variantId: String(e.variantId ?? ""), quantity: Number(e.quantity) }))
        .filter((e) => e.variantId && e.quantity !== 0);
    } catch {
      return { error: "Não foi possível ler as quantidades. Recarregue a página e tente de novo." };
    }
    if (entries.length === 0) return { error: "Informe a quantidade produzida de pelo menos uma cor/tamanho." };
    if (entries.some((e) => !Number.isInteger(e.quantity) || e.quantity < 1 || e.quantity > 10000)) {
      return { error: "As quantidades precisam ser números inteiros a partir de 1." };
    }

    const total = await prisma.$transaction(async (tx) => {
      const variants = await tx.variant.findMany({
        where: { id: { in: entries.map((e) => e.variantId) }, productId },
        select: { id: true },
      });
      if (variants.length !== new Set(entries.map((e) => e.variantId)).size) {
        throw new Error("Uma das cores/tamanhos não existe mais neste produto. Recarregue a página.");
      }
      for (const e of entries) {
        await tx.productionEntry.create({
          data: { productId, variantId: e.variantId, quantity: e.quantity, stockLocation, producedAt, notes },
        });
        await tx.variant.update({
          where: { id: e.variantId },
          data: stockLocation === "ESTOQUE_A" ? { stockA: { increment: e.quantity } } : { stockV: { increment: e.quantity } },
        });
      }
      return entries.reduce((acc, e) => acc + e.quantity, 0);
    });

    revalidateProduction();
    return { success: true, total };
  } catch (error) {
    console.error("Error adding production:", error);
    return { error: handleDatabaseError(error, "Não foi possível lançar a produção.") };
  }
}

/** Desfaz um lançamento de produção: tira as peças do estoque de novo, se elas ainda estiverem lá. */
export async function deleteProduction(entryId: string) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      const entry = await tx.productionEntry.findUnique({
        where: { id: entryId },
        include: { variant: { select: { stockA: true, stockV: true, size: true, color: true } } },
      });
      if (!entry) throw new Error("Lançamento não encontrado. Ele pode já ter sido excluído.");

      const field = entry.stockLocation === "ESTOQUE_A" ? "stockA" : "stockV";
      const result = await tx.variant.updateMany({
        where: { id: entry.variantId, [field]: { gte: entry.quantity } },
        data: { [field]: { decrement: entry.quantity } },
      });
      if (result.count === 0) {
        const available = entry.variant[field];
        throw new Error(
          `Não dá para desfazer: só restam ${available} peça(s) de ${entry.variant.size} · ${entry.variant.color} no ${
            entry.stockLocation === "ESTOQUE_A" ? "Estoque A" : "Estoque V"
          } (o lançamento foi de ${entry.quantity}). Parte já foi vendida.`
        );
      }
      await tx.productionEntry.delete({ where: { id: entryId } });
    });

    revalidateProduction();
    return { success: true };
  } catch (error) {
    console.error("Error deleting production:", error);
    return { error: handleDatabaseError(error, "Não foi possível desfazer o lançamento.") };
  }
}
