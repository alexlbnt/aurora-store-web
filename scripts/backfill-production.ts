// Uso único (v1.9.4): preenche o "Produzido" dos produtos que ainda não têm nenhum lançamento de
// produção, com estoque atual + vendido (pedidos não cancelados), por variação e por estoque.
// Os lançamentos ficam com a data de cadastro do produto e NÃO mexem no estoque.
// Pode rodar de novo sem duplicar: produto que já tem produção é pulado.
//   npx tsx scripts/backfill-production.ts          -> mostra o que faria
//   npx tsx scripts/backfill-production.ts --apply  -> grava
import { PrismaClient } from "@prisma/client";
import { BACKFILL_NOTE, backfillEntries, type StockLocation } from "../src/lib/production-seed";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

/** Host, banco e schema do DATABASE_URL em uso, sem a senha: para conferir dev x produção. */
function describeDatabase(): string {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.host}${url.pathname} (schema ${url.searchParams.get("schema") ?? "public"})`;
  } catch {
    return "DATABASE_URL inválido ou ausente";
  }
}

async function main() {
  console.log(`Banco: ${describeDatabase()}`);
  console.log("Rode um de cada vez: duas execuções ao mesmo tempo podem duplicar lançamentos.");

  const skippedProducts = await prisma.product.findMany({
    where: { productions: { some: {} } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const [skippedProduced, skippedSold] = await Promise.all([
    prisma.productionEntry.groupBy({
      by: ["productId"],
      where: { productId: { in: skippedProducts.map((p) => p.id) } },
      _sum: { quantity: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: skippedProducts.map((p) => p.id) }, order: { status: { not: "CANCELED" } } },
      _sum: { quantity: true },
    }),
  ]);
  const skipped = skippedProducts.length;
  const products = await prisma.product.findMany({
    where: { productions: { none: {} } },
    select: {
      id: true,
      name: true,
      createdAt: true,
      variants: { select: { id: true, stockA: true, stockV: true } },
    },
    orderBy: { name: "asc" },
  });
  const sold = await prisma.orderItem.findMany({
    where: { productId: { in: products.map((p) => p.id) }, order: { status: { not: "CANCELED" } } },
    select: { productId: true, variantId: true, quantity: true, order: { select: { stockLocation: true } } },
  });

  console.log(`${skipped} produto(s) já com produção (pulados):`);
  const producedOf = new Map(skippedProduced.map((g) => [g.productId, g._sum.quantity ?? 0]));
  const soldOf = new Map(skippedSold.map((g) => [g.productId, g._sum.quantity ?? 0]));
  for (const p of skippedProducts) {
    const produced = producedOf.get(p.id) ?? 0;
    const soldQty = soldOf.get(p.id) ?? 0;
    console.log(`  ${p.name} — produzido ${produced} / vendido ${soldQty}${produced < soldQty ? "  ⚠ produzido menor que vendido: ajustar à mão" : ""}`);
  }
  console.log(`${products.length} produto(s) sem produção:`);
  let totalProduced = 0;
  let totalUnattributed = 0;
  const plans = products.map((p) => {
    const lines = sold
      .filter((s) => s.productId === p.id)
      .map((s) => ({ variantId: s.variantId, stockLocation: s.order.stockLocation as StockLocation, quantity: s.quantity }));
    const { entries, unattributed } = backfillEntries(p.variants, lines);
    const sum = (loc: StockLocation, xs: { stockLocation: StockLocation; quantity: number }[]) =>
      xs.filter((x) => x.stockLocation === loc).reduce((a, x) => a + x.quantity, 0);
    const stockA = p.variants.reduce((a, v) => a + Math.max(0, v.stockA), 0);
    const stockV = p.variants.reduce((a, v) => a + Math.max(0, v.stockV), 0);
    console.log(
      `  ${p.name} — produzido A ${sum("ESTOQUE_A", entries)} / V ${sum("ESTOQUE_V", entries)}` +
        ` (estoque ${stockA}/${stockV} + vendido ${sum("ESTOQUE_A", lines)}/${sum("ESTOQUE_V", lines)})` +
        (unattributed > 0 ? ` · ${unattributed} vendida(s) sem variação, fora da conta` : ""),
    );
    totalProduced += entries.reduce((a, e) => a + e.quantity, 0);
    totalUnattributed += unattributed;
    return { product: p, entries };
  });
  console.log(`Total: ${totalProduced} peça(s) produzida(s)${totalUnattributed ? `; ${totalUnattributed} fora da conta` : ""}.`);

  if (!apply) {
    console.log("Nada gravado. Rode com --apply para gravar.");
    return;
  }

  let created = 0;
  for (const { product, entries } of plans) {
    if (entries.length === 0) continue;
    await prisma.$transaction(async (tx) => {
      // Confere de novo dentro da transação: outro lançamento pode ter entrado no meio.
      if ((await tx.productionEntry.count({ where: { productId: product.id } })) > 0) return;
      const r = await tx.productionEntry.createMany({
        data: entries.map((e) => ({ ...e, productId: product.id, producedAt: product.createdAt, notes: BACKFILL_NOTE })),
      });
      created += r.count;
    });
  }
  console.log(`Gravado: ${created} lançamento(s) de produção.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
