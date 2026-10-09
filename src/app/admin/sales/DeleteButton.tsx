"use client";

import { useTransition } from "react";
import { deleteOrder } from "./actions";
import { showToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";

export default function DeleteButton({ orderId, orderNumber }: { orderId: string; orderNumber?: string }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: orderNumber ? `Excluir o pedido ${orderNumber}?` : "Excluir este pedido?",
      description:
        "O pedido sai da lista e, se ainda não estava cancelado, as peças voltam para o estoque. Não dá para desfazer.",
      confirmLabel: "Excluir pedido",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteOrder(orderId);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Pedido excluído.", "success");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={orderNumber ? `Excluir o pedido ${orderNumber}` : "Excluir pedido"}
      title="Excluir pedido"
      className="inline-flex size-10 items-center justify-center rounded-lg text-primary/70 transition-colors hover:bg-dawn/20 hover:text-dawn-ink disabled:opacity-50"
    >
      <span className={`material-symbols-outlined text-[20px] ${isPending ? "animate-spin" : ""}`} aria-hidden="true">
        {isPending ? "progress_activity" : "delete"}
      </span>
    </button>
  );
}
