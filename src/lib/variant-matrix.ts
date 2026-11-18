// Grade de variações do formulário de produto (tamanho × cor), sem React: fácil de testar.

/** Uma linha da grade como o formulário a edita (campos de texto podem vir como string). */
export interface VariantMatrixItem {
  _id: string;
  size: string;
  color: string;
  sku: string;
  price: string | number;
  stockA: string | number;
  stockV: string | number;
}

/** Variação já salva, como chega da página de edição. */
export interface SavedVariant {
  size: string;
  color: string;
  sku?: string | null;
  price?: number | null;
  stockA: number;
  stockV: number;
}

export const matrixId = (size: string, color: string) => `${size}-${color}`;

const randomSku = (size: string, color: string) =>
  `AUR-${size.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

export function fromSavedVariant(v: SavedVariant): VariantMatrixItem {
  return {
    _id: matrixId(v.size, v.color),
    size: v.size,
    color: v.color,
    sku: v.sku ?? "",
    price: v.price ?? "",
    stockA: v.stockA,
    stockV: v.stockV,
  };
}

/**
 * Monta a grade para os tamanhos e cores escolhidos, reaproveitando o que já foi digitado
 * na combinação (SKU, preço, estoques). Combinação nova ganha SKU sugerido e estoque 0.
 */
export function buildVariantMatrix(
  sizes: readonly string[],
  colors: readonly string[],
  current: readonly VariantMatrixItem[],
  makeSku: (size: string, color: string) => string = randomSku,
): VariantMatrixItem[] {
  const rows: VariantMatrixItem[] = [];
  for (const size of sizes) {
    for (const color of colors) {
      const id = matrixId(size, color);
      const existing = current.find((v) => v._id === id || (v.size === size && v.color === color));
      rows.push({
        _id: id,
        size,
        color,
        sku: existing?.sku || makeSku(size, color),
        price: existing?.price || "",
        stockA: existing?.stockA || 0,
        stockV: existing?.stockV || 0,
      });
    }
  }
  return rows;
}

/** Mesmas linhas na mesma ordem: não precisa trocar a grade (mantém o foco do campo). */
export const sameMatrixShape = (a: readonly { _id: string }[], b: readonly { _id: string }[]) =>
  a.length === b.length && a.every((row, i) => row._id === b[i]?._id);
