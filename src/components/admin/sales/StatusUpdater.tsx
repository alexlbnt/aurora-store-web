"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/sales/actions";
import { showToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";
import { ORDER_STATUS, ORDER_STATUS_OPTIONS, type OrderStatusKey } from "@/lib/order-meta";

export default function StatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [isPending, setIsPending] = useState(false);
  const confirm = useConfirm();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatusKey;
    if (newStatus === currentStatus) return;

    // Cancelar devolve as peças ao estoque; reativar tira de novo. Vale confirmar.
    if (newStatus === "CANCELED") {
      const ok = await confirm({
        title: "Cancelar este pedido?",
        description: "As peças voltam para o estoque. Você pode reativar o pedido depois, se ainda houver estoque.",
        confirmLabel: "Cancelar pedido",
        cancelLabel: "Manter pedido",
        tone: "danger",
      });
      if (!ok) return;
    } else if (currentStatus === "CANCELED") {
      const ok = await confirm({
        title: "Reativar este pedido?",
        description: "As peças saem do estoque de novo. Se não houver estoque suficiente, a reativação não é feita.",
        confirmLabel: "Reativar pedido",
      });
      if (!ok) return;
    }

    setIsPending(true);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(`Status alterado para ${ORDER_STATUS[newStatus].label.toLowerCase()}.`, "success");
    }
    setIsPending(false);
  };

  const selected = ORDER_STATUS[currentStatus as OrderStatusKey] ?? ORDER_STATUS.PENDING;

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="order-status" className="sr-only">
        Status do pedido
      </label>
      <select
        id="order-status"
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className={`min-h-11 w-full cursor-pointer rounded-lg border border-primary/15 py-2 pl-4 pr-10 text-sm font-semibold disabled:opacity-60 sm:w-auto ${selected.badge}`}
      >
        {ORDER_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} className="bg-white font-medium text-primary">
            {s.label}
          </option>
        ))}
      </select>
      {isPending && (
        <span role="status" className="text-sm text-primary/60">
          Atualizando…
        </span>
      )}
    </div>
  );
}
