"use client";

import React, { useState, useEffect } from "react";

interface SalesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalesExportModal({ isOpen, onClose }: SalesExportModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<"csv" | "pdf" | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setDownloadingFormat(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = (format: "csv" | "pdf") => {
    setDownloadingFormat(format);

    // Create a temporary hidden link to trigger file download
    const link = document.createElement("a");
    link.href = `/api/admin/export/sales?format=${format}`;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset loading state and close after a short grace period
    setTimeout(() => {
      setDownloadingFormat(null);
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sales-export-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar janela"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="size-11 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">file_download</span>
          </div>
          <div>
            <h3 id="sales-export-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Baixar Vendas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecione o formato desejado para exportar todas as vendas:
            </p>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          {/* 1. Planilha (.CSV / Excel) */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("csv")}
            className="w-full bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 p-4 rounded-xl flex items-start gap-3.5 text-left transition-all group active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              {downloadingFormat === "csv" ? (
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-2xl">table_chart</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Baixar em planilha
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                  .CSV / Excel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Planilha com todos os dados brutos de clientes, itens, valores e endereços. Ideal para análise no Excel ou Google Sheets.
              </p>
              {downloadingFormat === "csv" && (
                <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                  Gerando e baixando planilha...
                </span>
              )}
            </div>
          </button>

          {/* 2. PDF Ilustrado */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("pdf")}
            className="w-full bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-200/80 dark:border-amber-800/40 hover:border-amber-500 dark:hover:border-amber-500 p-4 rounded-xl flex items-start gap-3.5 text-left transition-all group active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              {downloadingFormat === "pdf" ? (
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Baixar em PDF
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                  Ilustrativo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Relatório executivo ilustrado com resumo de métricas (Faturamento, Total de Pedidos, Ticket Médio) e tabela diagramada com status coloridos.
              </p>
              {downloadingFormat === "pdf" && (
                <span className="inline-block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">
                  Gerando relatório ilustrado em PDF...
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
