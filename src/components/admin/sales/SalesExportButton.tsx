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
        className="flex-1 sm:flex-none min-h-11 flex items-center justify-center gap-1.5 border border-primary/25 bg-white rounded-lg px-4 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        title="Baixar vendas em planilha (.csv) ou PDF ilustrado"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
        <span>Baixar vendas</span>
      </button>

      <SalesExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
