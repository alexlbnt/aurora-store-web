"use client";

import { useTransition } from "react";
import { deleteOrder } from "./actions";

export default function DeleteButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) {
      startTransition(async () => {
        await deleteOrder(orderId);
      });
    }
  };

  return (
    <button 
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-slate-400 hover:text-rose-600 transition-colors p-2 md:p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 inline-flex items-center justify-center cursor-pointer disabled:opacity-50" 
      title="Excluir Pedido"
    >
      <span className={`material-symbols-outlined ${isPending ? 'animate-spin' : ''}`}>
        {isPending ? "progress_activity" : "delete"}
      </span>
    </button>
  );
}
