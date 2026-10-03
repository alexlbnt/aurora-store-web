"use client";

import React from "react";
import Link from "next/link";

export default function ReportsClientActions() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <button
        onClick={handlePrint}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary/10 text-primary dark:text-primary/90 border border-primary/20 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-primary/20 transition-all cursor-pointer"
        title="Imprimir relatório em PDF"
      >
        <span className="material-symbols-outlined text-base sm:text-lg">print</span>
        <span>Imprimir / PDF</span>
      </button>
      <Link
        href="/api/admin/export/sales"
        target="_blank"
        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm hover:opacity-90 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        title="Baixar planilha de vendas em CSV"
      >
        <span className="material-symbols-outlined text-base sm:text-lg">download</span>
        <span>Exportar CSV</span>
      </Link>
    </div>
  );
}
