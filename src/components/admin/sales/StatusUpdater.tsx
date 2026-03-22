"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/sales/actions";

export default function StatusUpdater({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [isPending, setIsPending] = useState(false);

  const statuses = [
    { value: 'PENDING', label: 'Pendente', color: 'text-amber-700 bg-amber-100 border-amber-200' },
    { value: 'PAID', label: 'Pago', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
    { value: 'SHIPPED', label: 'Enviado', color: 'text-blue-700 bg-blue-100 border-blue-200' },
    { value: 'DELIVERED', label: 'Entregue', color: 'text-slate-700 bg-slate-100 border-slate-200' },
    { value: 'CANCELED', label: 'Cancelado', color: 'text-rose-700 bg-rose-100 border-rose-200' },
  ];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as any;
    setIsPending(true);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.error) alert(result.error);
    setIsPending(false);
  };

  const selected = statuses.find(s => s.value === currentStatus) || statuses[0];

  return (
    <div className="flex items-center gap-3">
      <select 
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className={`font-bold text-sm rounded-lg px-4 py-2 border cursor-pointer outline-none appearance-none pr-10 bg-no-repeat transition-colors ${selected.color}`}
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em 1.2em' }}
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value} className="bg-white text-slate-800 font-medium">{s.label}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400 font-medium">Atualizando...</span>}
    </div>
  );
}
