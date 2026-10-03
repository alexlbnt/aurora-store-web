"use client";

import React, { useState } from "react";
import SalesExportModal from "./SalesExportModal";

export default function SalesExportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-primary/20 bg-white dark:bg-slate-900 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all shadow-sm active:scale-95 cursor-pointer"
        title="Baixar vendas em planilha (.csv) ou PDF ilustrado"
      >
        <span className="material-symbols-outlined text-base sm:text-lg text-primary">download</span>
        <span>Baixar Vendas</span>
      </button>

      <SalesExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
