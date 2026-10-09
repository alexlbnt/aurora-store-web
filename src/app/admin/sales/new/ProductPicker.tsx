"use client";

import React, { useMemo, useState } from "react";
import AdminProductImage from "@/components/admin/AdminProductImage";
import { formatBRL } from "@/lib/format";
import { STOCK_LABEL } from "@/lib/order-meta";
import { normalize, stockOf, type OrderLine, type PickerProduct, type PickerVariant, type StockLocation } from "./types";

const VISIBLE_WITHOUT_SEARCH = 6;

interface ProductPickerProps {
  products: PickerProduct[];
  location: StockLocation;
  lines: OrderLine[];
  onAdd: (product: PickerProduct, variant: PickerVariant | null) => void;
}

export default function ProductPicker({ products, location, lines, onAdd }: ProductPickerProps) {
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
        <ul className="mt-3 divide-y divide-primary/10 rounded-lg border border-primary/10">
          {visible.map((product) => {
            const variants = product.variants;
            const available = variants.filter((v) => stockOf(v, location) - inCart(v.id) > 0);
            const totalStock = variants.reduce((acc, v) => acc + stockOf(v, location), 0);
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
              <li key={product.id}>
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={soldOut}
                  aria-expanded={single ? undefined : isOpen}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent-cream disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-accent-soft">
                    <AdminProductImage src={product.images[0]?.url ?? ""} alt={product.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-primary">{product.name}</p>
                    <p className="text-sm text-primary/70">
                      {formatBRL(product.basePrice)}
                      {product.sku && <span className="text-primary/50"> · {product.sku}</span>}
                    </p>
                    <p className={`text-sm ${soldOut ? "text-dawn-ink" : "text-primary/60"}`}>
                      {soldOut
                        ? `Sem estoque no ${locationLabel}`
                        : `${totalStock} ${totalStock === 1 ? "unidade" : "unidades"} no ${locationLabel}`}
                    </p>
                  </div>
                  {!soldOut && (
                    <span
                      className="material-symbols-outlined shrink-0 text-[24px] text-primary/70"
                      aria-hidden="true"
                    >
                      {single ? "add_circle" : isOpen ? "expand_less" : "expand_more"}
                    </span>
                  )}
                  {!soldOut && single && <span className="sr-only">Adicionar à venda</span>}
                </button>

                {isOpen && !single && (
                  <div className="border-t border-primary/10 bg-accent-cream px-3 pb-3 pt-2">
                    <p className="mb-2 text-sm text-primary/70">Escolha cor e tamanho:</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => {
                        const left = stockOf(v, location) - inCart(v.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={left <= 0}
                            onClick={() => add(product, v)}
                            className="flex min-h-12 flex-col items-start justify-center rounded-lg border border-primary/25 bg-white px-3 py-1.5 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
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
