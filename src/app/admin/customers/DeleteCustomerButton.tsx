"use client";

import { useState } from "react";
import { deleteCustomer } from "./actions";
import { showToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";

export default function DeleteCustomerButton({ id, name }: { id: string; name?: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: name ? `Excluir ${name}?` : "Excluir este cliente?",
      description: "O cadastro some da lista. Clientes com pedidos podem não poder ser excluídos. Não dá para desfazer.",
      confirmLabel: "Excluir cliente",
      tone: "danger",
    });
    if (!ok) return;

    setIsDeleting(true);
    const result = await deleteCustomer(id);
    
    if (result.error) {
      showToast(result.error, "error");
      setIsDeleting(false);
    } else {
      showToast("Cliente excluído.", "success");
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="size-10 inline-flex items-center justify-center hover:bg-dawn/20 rounded-lg text-primary/70 hover:text-dawn-ink transition-colors disabled:opacity-50"
      title="Excluir cliente"
      aria-label={name ? `Excluir ${name}` : "Excluir cliente"}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{isDeleting ? 'sync' : 'delete'}</span>
    </button>
  );
}
