"use client";

import { useState } from "react";
import { updateOrderShipping } from "@/app/admin/sales/actions";

interface ShippingUpdaterProps {
  orderId: string;
  currentShipping: "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE";
}

export default function ShippingUpdater({ orderId, currentShipping }: ShippingUpdaterProps) {
  const [isPending, setIsPending] = useState(false);

  const options = [
    { value: "SEM_FRETE", label: "1 - Sem Frete", color: "text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
    { value: "PAGO_AURORA", label: "2 - Pago Aurora", color: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
    { value: "PAGO_CLIENTE", label: "3 - Cliente (Pago pelo Cliente)", color: "text-sky-700 bg-sky-100 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800" },
  ];

  const handleShippingChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShipping = e.target.value as "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE";
    setIsPending(true);
    const result = await updateOrderShipping(orderId, newShipping);
    if (result.error) alert(result.error);
    setIsPending(false);
  };

  const selected = options.find(o => o.value === currentShipping) || options[0];

  return (
    <div className="flex items-center gap-2">
      <select 
        value={currentShipping}
        onChange={handleShippingChange}
        disabled={isPending}
        className={`font-semibold text-xs rounded-lg px-3 py-1.5 border cursor-pointer outline-none appearance-none pr-8 bg-no-repeat transition-colors ${selected.color}`}
        style={{ 
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', 
          backgroundPosition: 'right 0.5rem center', 
          backgroundSize: '1em 1em' 
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white font-medium">
            {o.label}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400 font-medium">Salvando...</span>}
    </div>
  );
}
