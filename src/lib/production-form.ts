// Lançar produção: cada cor/tamanho tem uma quantidade para o Estoque A e outra para o Estoque V.
// Funções puras, usadas pelo modal (navegador) e pela action (servidor). Testadas em production-form.test.ts.

export type StockLocation = "ESTOQUE_A" | "ESTOQUE_V";
export const STOCK_LOCATIONS: StockLocation[] = ["ESTOQUE_A", "ESTOQUE_V"];

export interface ProductionItem {
  variantId: string;
  stockLocation: StockLocation;
  quantity: number;
}

/** Chave do campo de quantidade de uma variação num estoque. */
export const qtyKey = (variantId: string, location: StockLocation) => `${variantId}:${location}`;

/** Quantidade digitada (texto) como número inteiro ≥ 0. */
export function readQty(quantities: Record<string, string>, key: string): number {
  const n = parseInt(quantities[key] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Itens a lançar, na ordem das variações e com A antes de V. */
export function productionEntriesFromForm(quantities: Record<string, string>, variantIds: string[]): ProductionItem[] {
  return variantIds.flatMap((variantId) =>
    STOCK_LOCATIONS.flatMap((stockLocation) => {
      const quantity = readQty(quantities, qtyKey(variantId, stockLocation));
      return quantity > 0 ? [{ variantId, stockLocation, quantity }] : [];
    }),
  );
}

/**
 * Itens enviados pelo modal (JSON). Cada item traz o seu estoque; item sem estoque (tela aberta antes
 * desta versão) usa o estoque do formulário.
 */
export function parseProductionEntries(
  raw: string,
  fallback: StockLocation,
): { entries: ProductionItem[] } | { error: string } {
  let list: { variantId?: unknown; quantity?: unknown; stockLocation?: unknown }[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not a list");
    list = parsed;
  } catch {
    return { error: "Não foi possível ler as quantidades. Recarregue a página e tente de novo." };
  }
  const entries = list
    .map((e) => ({
      variantId: String(e?.variantId ?? ""),
      quantity: Number(e?.quantity),
      stockLocation: (e?.stockLocation === "ESTOQUE_V" ? "ESTOQUE_V" : e?.stockLocation === "ESTOQUE_A" ? "ESTOQUE_A" : fallback) as StockLocation,
    }))
    .filter((e) => e.variantId && e.quantity !== 0);
  if (entries.length === 0) return { error: "Informe a quantidade produzida de pelo menos uma cor/tamanho." };
  if (entries.some((e) => !Number.isInteger(e.quantity) || e.quantity < 1 || e.quantity > 10000)) {
    return { error: "As quantidades precisam ser números inteiros a partir de 1." };
  }
  return { entries };
}
