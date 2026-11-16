// Regras da vitrine compartilhadas por home, catálogo e categorias.
import { productPath } from "./slug";

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
  /** Endereço da página do produto (usa o slug legível quando existe). */
  href: string;
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
  slug?: string | null;
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
    href: productPath(p),
    name: p.name.trim(),
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

const SIZE_ORDER = ["RN", "PP", "P", "M", "G", "GG", "XG", "XGG", "G1", "G2", "G3", "G4", "EXG"];

/** Tamanhos em ordem de vestir (PP, P, M, G...), depois números, depois o resto (ex.: Único). */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.trim().toUpperCase());
    if (i >= 0) return [0, i] as const;
    const n = Number(s.replace(",", "."));
    if (!Number.isNaN(n)) return [1, n] as const;
    return [2, 0] as const;
  };
  return [...new Set(sizes)].sort((a, b) => {
    const [ga, va] = rank(a);
    const [gb, vb] = rank(b);
    return ga - gb || va - vb || a.localeCompare(b, "pt-BR");
  });
}

/** Cores para o filtro: sem repetição, sem a cor genérica "Padrão", em ordem alfabética. */
export function filterableColors(colors: string[]): string[] {
  return [...new Set(colors.map((c) => c.trim()).filter((c) => c && c.toLowerCase() !== "padrão"))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export const CATALOG_PAGE_SIZE = 24;

/** Recorta uma página da lista. Página fora do intervalo vira a mais próxima válida. */
export function paginate<T>(items: T[], rawPage: unknown, pageSize = CATALOG_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const n = Number.parseInt(String(rawPage ?? "1"), 10);
  const page = Number.isFinite(n) ? Math.min(Math.max(n, 1), totalPages) : 1;
  return { page, totalPages, items: items.slice((page - 1) * pageSize, page * pageSize) };
}

/** Esgotados vão para o fim, mantendo a ordem original dentro de cada grupo. */
export function availableFirst<T extends { soldOut: boolean }>(items: T[]): T[] {
  return [...items.filter((i) => !i.soldOut), ...items.filter((i) => i.soldOut)];
}
