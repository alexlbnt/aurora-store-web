"use client";

import React, { useMemo, useState } from "react";
import AdminProductImage from "@/components/admin/AdminProductImage";
import { formatBRL } from "@/lib/format";
import { STOCK_LABEL } from "@/lib/order-meta";
import { normalize, type OrderLine, type PickerProduct, type PickerVariant, type StockLocation } from "./types";

const VISIBLE_WITHOUT_SEARCH = 12; // divisível por 2 e 3: completa as linhas da grade

interface ProductPickerProps {
  products: PickerProduct[];
  location: StockLocation;
  /** Estoque disponível da variação no estoque escolhido (na edição, já conta o que o pedido devolve). */
  getStock: (variant: PickerVariant) => number;
  lines: OrderLine[];
  onAdd: (product: PickerProduct, variant: PickerVariant | null) => void;
}

export default function ProductPicker({ products, location, getStock, lines, onAdd }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const inCart = (variantId: string) =>
    lines.filter((l) => l.variantId === variantId).reduce((acc, l) => acc + l.quantity, 0);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return products;
    return products.filter((p) => normalize(p.name).includes(q) || normalize(p.sku ?? "").includes(q));
  }, [products, query]);

  const visible = query.trim() ? filtered : filtered.slice(0, VISIBLE_WITHOUT_SEARCH);
  const locationLabel = STOCK_LABEL[location];

  const add = (product: PickerProduct, variant: PickerVariant | null) => {
    onAdd(product, variant);
    setOpenId(null);
    setAnnouncement(
      `${product.name}${variant ? ` (${variant.color}, ${variant.size})` : ""} adicionado à venda.`
    );
  };

  return (
    <div>
      <div className="relative" role="search">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-primary/50" aria-hidden="true">
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto por nome ou código"
          aria-label="Buscar produto por nome ou código"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-lg border border-primary/20 bg-accent-cream pl-10 pr-4 text-base text-primary placeholder:text-primary/50"
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-lg bg-accent-cream p-4 text-sm text-primary/70">
          Nenhum produto com “{query}”. Confira o nome ou busque pelo código.
        </p>
      ) : (
        // Cartões compactos em grade: cabem mais produtos na tela antes de precisar buscar.
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => {
            const variants = product.variants;
            const available = variants.filter((v) => getStock(v) - inCart(v.id) > 0);
            const totalStock = variants.reduce((acc, v) => acc + getStock(v), 0);
            const single = variants.length <= 1;
            const isOpen = openId === product.id;
            const soldOut = variants.length > 0 && available.length === 0;

            const handleClick = () => {
              if (soldOut) return;
              if (single) {
                add(product, variants[0] ?? null);
              } else {
                setOpenId(isOpen ? null : product.id);
              }
            };

            return (
              <li
                key={product.id}
                className={`overflow-hidden rounded-lg border ${
                  isOpen ? "border-primary/30 sm:col-span-2 xl:col-span-3" : "border-primary/10"
                }`}
              >
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={soldOut}
                  aria-expanded={single ? undefined : isOpen}
                  title={product.sku ? `Código ${product.sku}` : undefined}
                  className="flex min-h-14 w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-accent-cream disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-accent-soft">
                    <AdminProductImage src={product.images[0]?.url ?? ""} alt={product.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{product.name}</p>
                    <p className="truncate text-xs text-primary/70">
                      {formatBRL(product.basePrice)}
                      <span className="text-primary/40"> · </span>
                      <span className={soldOut ? "text-dawn-ink" : undefined}>
                        {soldOut ? `Sem estoque no ${locationLabel}` : `${totalStock} no ${locationLabel}`}
                      </span>
                    </p>
                  </div>
                  {!soldOut && (
                    <span
                      className="material-symbols-outlined shrink-0 text-[20px] text-primary/60"
                      aria-hidden="true"
                    >
                      {single ? "add_circle" : isOpen ? "expand_less" : "expand_more"}
                    </span>
                  )}
                  {!soldOut && single && <span className="sr-only">Adicionar à venda</span>}
                </button>

                {isOpen && !single && (
                  <div className="border-t border-primary/10 bg-accent-cream px-2.5 pb-2.5 pt-2">
                    <p className="mb-2 text-xs text-primary/70">Escolha cor e tamanho:</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => {
                        const left = getStock(v) - inCart(v.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={left <= 0}
                            onClick={() => add(product, v)}
                            className="flex min-h-11 flex-col items-start justify-center rounded-lg border border-primary/25 bg-white px-3 py-1 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="text-sm font-semibold text-primary">
                              {v.size} · {v.color}
                            </span>
                            <span className={`text-xs ${left <= 0 ? "text-dawn-ink" : "text-primary/60"}`}>
                              {left <= 0 ? "Sem estoque" : `${left} disponíve${left === 1 ? "l" : "is"}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!query.trim() && filtered.length > VISIBLE_WITHOUT_SEARCH && (
        <p className="mt-2 text-sm text-primary/60">
          Mostrando {VISIBLE_WITHOUT_SEARCH} de {filtered.length} produtos. Busque para encontrar os outros.
        </p>
      )}
    </div>
  );
}
