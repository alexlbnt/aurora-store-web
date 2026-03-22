"use client";

import { useState } from "react";
import Link from "next/link";
import { createCategory, updateCategory } from "@/app/admin/categories/actions";

type CategoryData = { id?: string; name: string; slug: string; description: string | null };

export default function CategoryForm({ initialData }: { initialData?: CategoryData }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!initialData) {
      setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const formAction = async (formData: FormData) => {
    setPending(true);
    setError(null);
    let result;
    if (initialData?.id) {
      result = await updateCategory(initialData.id, formData);
    } else {
      result = await createCategory(formData);
    }
    
    // Server action throws redirect on success, so if it returns it's an error
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  };

  return (
    <form action={formAction} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 w-full max-w-2xl">
      {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg text-sm">{error}</div>}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome da Categoria</label>
          <input 
            type="text" id="name" name="name" required
            value={name} onChange={handleNameChange}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white transition-colors"
            placeholder="Ex: Eletrônicos"
          />
        </div>

        <div>
           <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Slug (URL)</label>
          <input 
            type="text" id="slug" name="slug" required
            value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-mono text-sm transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descrição (Opcional)</label>
          <textarea 
            id="description" name="description" rows={4}
            defaultValue={initialData?.description || ""}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white transition-colors"
            placeholder="Breve descrição dos produtos limitados a esta categoria"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        <Link href="/admin/categories" className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {pending ? "Salvando..." : "Salvar Categoria"}
        </button>
      </div>
    </form>
  );
}
