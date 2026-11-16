"use client";

import React, { useEffect, useState } from "react";
import { addProduction, deleteProduction, getProductionOverview } from "@/app/admin/products/production-actions";
import { showToast } from "@/components/ui/Toast";
import ChoiceChips from "@/components/admin/ui/ChoiceChips";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";
import { formatDate } from "@/lib/format";
import { todayInput } from "@/lib/finance";

type Location = "ESTOQUE_A" | "ESTOQUE_V";

interface VariantRow {
  id: string;
  size: string;
  color: string;
  stockA: number;
  stockV: number;
  produced: number;
  sold: number;
}

interface HistoryRow {
  id: string;
  quantity: number;
  stockLocation: Location;
  producedAt: string;
  notes: string | null;
  variantLabel: string;
}

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSaved?: () => void;
}

/**
 * Lançamento de produção: quantas peças de cada cor/tamanho ficaram prontas.
 * As peças entram no estoque escolhido e o histórico mostra produzido x vendido.
 */
export default function ProductionModal(props: ProductionModalProps) {
  // Monta o conteúdo só quando abre: cada abertura começa com o formulário limpo.
  if (!props.isOpen) return null;
  return <ProductionModalBody {...props} />;
}

function ProductionModalBody({ onClose, productId, productName, onSaved }: ProductionModalProps) {
  const confirm = useConfirm();
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [stockLocation, setStockLocation] = useState<Location>("ESTOQUE_A");
  const [producedAt, setProducedAt] = useState(() => todayInput());
  const [notes, setNotes] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProductionOverview(productId).then((res) => {
      if (cancelled) return;
      if ("error" in res && res.error) {
        showToast(res.error, "error");
      } else if ("product" in res && res.product) {
        setVariants(res.product.variants);
        setHistory(res.history);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const qty = (id: string) => {
    const n = parseInt(quantities[id] ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const setQty = (id: string, value: number) =>
    setQuantities((prev) => ({ ...prev, [id]: value > 0 ? String(value) : "" }));
  const totalPieces = variants.reduce((acc, v) => acc + qty(v.id), 0);

  const totals = variants.reduce(
    (acc, v) => ({ produced: acc.produced + v.produced, sold: acc.sold + v.sold }),
    { produced: 0, sold: 0 }
  );

  const handleSave = async () => {
    if (totalPieces === 0) {
      showToast("Informe a quantidade produzida de pelo menos uma cor/tamanho.", "warning");
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append("stockLocation", stockLocation);
    formData.append("producedAt", producedAt);
    formData.append("notes", notes);
    formData.append(
      "entries",
      JSON.stringify(variants.filter((v) => qty(v.id) > 0).map((v) => ({ variantId: v.id, quantity: qty(v.id) })))
    );
    try {
      const res = await addProduction(productId, formData);
      if (res.error) {
        showToast(res.error, "error");
        return;
      }
      showToast(
        `${res.total} ${res.total === 1 ? "peça lançada" : "peças lançadas"} no ${stockLocation === "ESTOQUE_A" ? "Estoque A" : "Estoque V"}.`,
        "success"
      );
      setQuantities({});
      setNotes("");
      setReloadKey((k) => k + 1);
      onSaved?.();
    } catch {
      showToast("A conexão falhou. Confira o histórico antes de lançar de novo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async (row: HistoryRow) => {
    const ok = await confirm({
      title: "Desfazer este lançamento?",
      description: `${row.quantity} peça(s) de ${row.variantLabel} saem do ${
        row.stockLocation === "ESTOQUE_A" ? "Estoque A" : "Estoque V"
      } e o lançamento some do histórico.`,
      confirmLabel: "Desfazer lançamento",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteProduction(row.id);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    showToast("Lançamento desfeito.", "success");
    setReloadKey((k) => k + 1);
    onSaved?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="production-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-primary/10 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 id="production-title" className="text-lg font-semibold text-primary">
              Lançar produção
            </h2>
            <p className="truncate text-sm text-primary/70">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary/60 hover:bg-primary/5 hover:text-primary"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-primary/60" role="status">
              Carregando cores e tamanhos…
            </p>
          ) : variants.length === 0 ? (
            <p className="rounded-lg bg-accent-cream p-4 text-sm text-primary/80">
              Este produto não tem cores/tamanhos cadastrados. Cadastre as variações em Editar produto para lançar a produção.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-accent-cream p-3">
                  <dt className="text-xs text-primary/60">Produzido</dt>
                  <dd className="text-xl font-semibold text-primary">{totals.produced}</dd>
                </div>
                <div className="rounded-lg bg-accent-cream p-3">
                  <dt className="text-xs text-primary/60">Vendido</dt>
                  <dd className="text-xl font-semibold text-primary">{totals.sold}</dd>
                </div>
                <div className="rounded-lg bg-accent-cream p-3">
                  <dt className="text-xs text-primary/60">Em estoque</dt>
                  <dd className="text-xl font-semibold text-primary">
                    {variants.reduce((acc, v) => acc + v.stockA + v.stockV, 0)}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <ChoiceChips<Location>
                  name="productionStock"
                  legend="Entra no estoque"
                  value={stockLocation}
                  onChange={setStockLocation}
                  options={[
                    { value: "ESTOQUE_A", label: "Estoque A" },
                    { value: "ESTOQUE_V", label: "Estoque V" },
                  ]}
                />
                <div>
                  <label htmlFor="produced-at" className="mb-2 block text-sm font-semibold text-primary">
                    Data
                  </label>
                  <input
                    id="produced-at"
                    type="date"
                    value={producedAt}
                    max={todayInput()}
                    onChange={(e) => setProducedAt(e.target.value)}
                    className="min-h-11 rounded-lg border border-primary/20 bg-accent-cream px-3 text-base text-primary"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-primary">Peças prontas</legend>
                <ul className="divide-y divide-primary/10 rounded-lg border border-primary/15">
                  {variants.map((v) => {
                    const label = `${v.size} · ${v.color}`;
                    return (
                      <li key={v.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-primary">{label}</p>
                          <p className="text-xs text-primary/60">
                            Produzido {v.produced} · Vendido {v.sold} · Estoque A {v.stockA} / V {v.stockV}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center rounded-lg border border-primary/20">
                          <button
                            type="button"
                            onClick={() => setQty(v.id, qty(v.id) - 1)}
                            disabled={qty(v.id) === 0}
                            aria-label={`Diminuir ${label}`}
                            className="flex size-11 items-center justify-center text-xl text-primary hover:bg-primary/5 disabled:opacity-30"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label={`Quantidade produzida de ${label}`}
                            value={quantities[v.id] ?? ""}
                            placeholder="0"
                            onChange={(e) =>
                              setQuantities((prev) => ({ ...prev, [v.id]: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                            }
                            className="w-12 border-0 bg-transparent p-0 text-center text-base font-semibold text-primary placeholder:text-primary/30 focus:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(v.id, qty(v.id) + 1)}
                            aria-label={`Aumentar ${label}`}
                            className="flex size-11 items-center justify-center text-xl text-primary hover:bg-primary/5"
                          >
                            +
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>

              <div>
                <label htmlFor="production-notes" className="mb-1.5 block text-sm font-semibold text-primary">
                  Observação <span className="font-normal text-primary/60">(opcional)</span>
                </label>
                <input
                  id="production-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lote, costureira, tecido…"
                  className="min-h-11 w-full rounded-lg border border-primary/20 bg-accent-cream px-3 text-base text-primary placeholder:text-primary/40"
                />
              </div>

              <section aria-labelledby="production-history">
                <h3 id="production-history" className="mb-2 text-sm font-semibold text-primary">
                  Últimos lançamentos
                </h3>
                {history.length === 0 ? (
                  <p className="text-sm text-primary/60">Nenhuma produção lançada ainda.</p>
                ) : (
                  <ul className="divide-y divide-primary/10 rounded-lg border border-primary/15 text-sm">
                    {history.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-primary">
                            <strong className="font-semibold">+{h.quantity}</strong> {h.variantLabel}
                          </p>
                          <p className="truncate text-xs text-primary/60">
                            {formatDate(h.producedAt)} · {h.stockLocation === "ESTOQUE_A" ? "Estoque A" : "Estoque V"}
                            {h.notes ? ` · ${h.notes}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUndo(h)}
                          className="min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-dawn-ink hover:bg-dawn/20"
                        >
                          Desfazer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-primary/10 p-4 sm:p-5">
          <p className="text-sm text-primary/70">
            {totalPieces > 0 ? `${totalPieces} ${totalPieces === 1 ? "peça" : "peças"} a lançar` : "Nada a lançar ainda"}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || totalPieces === 0}
            className="flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>
            )}
            {saving ? "Lançando…" : "Lançar produção"}
          </button>
        </div>
      </div>
    </div>
  );
}
