// Regras da vitrine compartilhadas por home, catálogo e categorias.

/** Inclusão do Prisma que traz o necessário para montar um card de produto. */
export const productCardInclude = {
  category: true,
  images: {
    orderBy: [{ isDisplay: "desc" as const }, { order: "asc" as const }],
    take: 1,
  },
  variants: { select: { stockA: true, stockV: true } },
};

export type StockCounts = { stockA: number; stockV: number };

export type ProductCardData = {
  id: string;
  name: string;
  price: string;
  category: string;
  /** null quando o produto ainda não tem foto: o card mostra um espaço neutro. */
  imageUrl: string | null;
  isNew: boolean;
  soldOut: boolean;
};

type ProductForCard = {
  id: string;
  name: string;
  basePrice: unknown;
  isNew: boolean;
  category: { name: string };
  images: { url: string }[];
  variants: StockCounts[];
};

export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/** O site vende dos dois estoques (A e V): o disponível é a soma, ignorando negativos. */
export function availableStock(variants: StockCounts[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stockA) + Math.max(0, v.stockV), 0);
}

export function toProductCard(p: ProductForCard): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    price: formatBRL(Number(p.basePrice)),
    category: p.category.name,
    imageUrl: p.images[0]?.url || null,
    isNew: p.isNew,
    soldOut: availableStock(p.variants) === 0,
  };
}

/** Resumo curto para buscadores e prévias de link (até ~160 caracteres, sem cortar palavra). */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
}

/** Esgotados vão para o fim, mantendo a ordem original dentro de cada grupo. */
export function availableFirst<T extends { soldOut: boolean }>(items: T[]): T[] {
  return [...items.filter((i) => !i.soldOut), ...items.filter((i) => i.soldOut)];
}
