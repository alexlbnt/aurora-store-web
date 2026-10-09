"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";
import { showToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";

export default function CategoryRowActions({ categoryId }: { categoryId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Excluir esta categoria?",
      description: "Só dá para excluir categorias sem produtos. Não dá para desfazer.",
      confirmLabel: "Excluir categoria",
      tone: "danger",
    });
    if (!ok) return;
    setIsDeleting(true);
    const result = await deleteCategory(categoryId);
    if (result.error) {
      showToast(result.error, "error");
      setIsDeleting(false);
    } else {
      showToast("Categoria excluída.", "success");
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/categories/${categoryId}`}
        className="size-10 rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
        title="Editar categoria"
        aria-label="Editar categoria"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="size-10 rounded-lg text-primary/70 hover:bg-dawn/20 hover:text-dawn-ink flex items-center justify-center transition-colors disabled:opacity-50"
        title="Excluir categoria"
        aria-label="Excluir categoria"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
      </button>
    </div>
  );
}
