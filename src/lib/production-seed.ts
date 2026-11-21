// "Produzido" é a soma dos lançamentos de produção (ProductionEntry). Estas funções montam os
// lançamentos que vêm do estoque do cadastro e da carga inicial (estoque atual + vendido).
// Nenhum desses lançamentos mexe no estoque: as peças já estão contadas nele.

export type StockLocation = "ESTOQUE_A" | "ESTOQUE_V";

export interface VariantStock {
  id: string;
  stockA: number;
  stockV: number;
}

export interface SoldLine {
  variantId: string | null;
  stockLocation: StockLocation;
  quantity: number;
}

export interface SeedEntry {
  variantId: string;
  stockLocation: StockLocation;
  quantity: number;
}

export const INITIAL_STOCK_NOTE = "Estoque inicial do cadastro";
export const BACKFILL_NOTE = "Carga inicial (estoque + vendido)";

/** Um lançamento por variação e estoque com quantidade > 0 (A antes de V). */
function toEntries(variants: VariantStock[], extra: Map<string, { a: number; v: number }>): SeedEntry[] {
  return variants.flatMap((v) => {
    const sold = extra.get(v.id) ?? { a: 0, v: 0 };
    const a = Math.max(0, v.stockA) + sold.a;
    const b = Math.max(0, v.stockV) + sold.v;
    return [
      ...(a > 0 ? [{ variantId: v.id, stockLocation: "ESTOQUE_A" as const, quantity: a }] : []),
      ...(b > 0 ? [{ variantId: v.id, stockLocation: "ESTOQUE_V" as const, quantity: b }] : []),
    ];
  });
}

/** Estoque informado no cadastro do produto, como produção. */
export function initialStockEntries(variants: VariantStock[]): SeedEntry[] {
  return toEntries(variants, new Map());
}

/**
 * Carga inicial: estoque atual + vendido de cada estoque. Item vendido sem variação conta na variação
 * única do produto; com várias variações (ou variação que não existe mais) fica em `unattributed`.
 */
export function backfillEntries(
  variants: VariantStock[],
  sold: SoldLine[],
): { entries: SeedEntry[]; unattributed: number } {
  const ids = new Set(variants.map((v) => v.id));
  const only = variants.length === 1 ? variants[0].id : null;
  const soldBy = new Map<string, { a: number; v: number }>();
  let unattributed = 0;
  for (const line of sold) {
    const id = line.variantId === null ? only : ids.has(line.variantId) ? line.variantId : null;
    if (!id) {
      unattributed += line.quantity;
      continue;
    }
    const acc = soldBy.get(id) ?? { a: 0, v: 0 };
    if (line.stockLocation === "ESTOQUE_A") acc.a += line.quantity;
    else acc.v += line.quantity;
    soldBy.set(id, acc);
  }
  return { entries: toEntries(variants, soldBy), unattributed };
}
