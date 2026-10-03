"use client";

import React, { useState, useEffect } from "react";
import { getProductVariants, quickUpdateProductVariantStock } from "@/app/admin/products/actions";
import { showToast } from "@/components/ui/Toast";

interface VariantState {
  id: string;
  size: string;
  color: string;
  stockA: number;
  stockV: number;
}

interface QuickStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onStockSaved?: () => void;
}

export default function QuickStockModal({
  isOpen,
  onClose,
  productId,
  productName,
  onStockSaved,
}: QuickStockModalProps) {
  const [variants, setVariants] = useState<VariantState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      getProductVariants(productId)
        .then((res) => {
          if (res.product?.variants) {
            setVariants(
              res.product.variants.map((v) => ({
                id: v.id,
                size: v.size,
                color: v.color,
                stockA: v.stockA || 0,
                stockV: v.stockV || 0,
              }))
            );
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const handleStockChange = (variantId: string, field: "stockA" | "stockV", deltaOrValue: number, isAbsolute = false) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const currentVal = v[field];
        const nextVal = isAbsolute ? Math.max(0, deltaOrValue) : Math.max(0, currentVal + deltaOrValue);
        return { ...v, [field]: nextVal };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = variants.map((v) =>
        quickUpdateProductVariantStock(v.id, v.stockA, v.stockV)
      );
      await Promise.all(updates);
      showToast(`Estoque de "${productName}" atualizado com sucesso!`, "success");
      if (onStockSaved) onStockSaved();
      onClose();
    } catch {
      showToast("Erro ao salvar estoque.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">tune</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Ajuste Rápido de Estoque
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-sm mt-0.5 font-medium">
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="py-4 max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
              <span className="text-xs">Carregando variações...</span>
            </div>
          ) : variants.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma variação encontrada para este produto.
            </div>
          ) : (
            <div className="space-y-3.5">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {v.size} - {v.color}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total: {v.stockA + v.stockV} unidades
                    </span>
                  </div>

                  {/* Steppers */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Estoque A */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 w-10 text-right">
                        Est. A
                      </span>
                      <div className="flex items-center border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleStockChange(v.id, "stockA", -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={v.stockA}
                          onChange={(e) =>
                            handleStockChange(v.id, "stockA", parseInt(e.target.value) || 0, true)
                          }
                          className="w-10 h-7 text-center text-xs font-bold text-slate-900 dark:text-white border-0 p-0 focus:ring-0 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockChange(v.id, "stockA", 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Estoque V */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-fuchsia-600 dark:text-fuchsia-400 w-10 text-right">
                        Est. V
                      </span>
                      <div className="flex items-center border border-fuchsia-200 dark:border-fuchsia-800 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleStockChange(v.id, "stockV", -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={v.stockV}
                          onChange={(e) =>
                            handleStockChange(v.id, "stockV", parseInt(e.target.value) || 0, true)
                          }
                          className="w-10 h-7 text-center text-xs font-bold text-slate-900 dark:text-white border-0 p-0 focus:ring-0 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockChange(v.id, "stockV", 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || variants.length === 0}
            className="px-5 py-2.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Salvar Estoque</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
