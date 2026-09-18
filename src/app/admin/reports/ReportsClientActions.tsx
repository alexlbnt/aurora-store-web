"use client";

import React from "react";
import Link from "next/link";

export default function ReportsClientActions() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-primary/10 text-primary dark:text-primary/90 border border-primary/20 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/20 transition-all cursor-pointer"
        title="Imprimir relatório em PDF"
      >
        <span className="material-symbols-outlined text-lg">print</span>
        Imprimir / PDF
      </button>
      <Link
        href="/api/admin/export/sales"
        target="_blank"
        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-sm cursor-pointer"
        title="Baixar planilha de vendas em CSV"
      >
        <span className="material-symbols-outlined text-lg">download</span>
        Exportar CSV
      </Link>
    </div>
  );
}
