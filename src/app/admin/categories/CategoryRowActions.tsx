"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";

export default function CategoryRowActions({ categoryId }: { categoryId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    setIsDeleting(true);
    const result = await deleteCategory(categoryId);
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/categories/${categoryId}`}
        className="w-8 h-8 rounded bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
        title="Editar Categoria"
      >
        <span className="material-symbols-outlined text-sm">edit</span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="w-8 h-8 rounded bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors disabled:opacity-50"
        title="Excluir Categoria"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  );
}
