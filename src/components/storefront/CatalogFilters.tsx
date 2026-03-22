"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CatalogFilters({ categories, initialQuery, initialCategory, initialSort }: any) {
  const router = useRouter();

  const [q, setQ] = useState(initialQuery || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [sort, setSort] = useState(initialSort || "newest");

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort && sort !== "newest") params.set("sort", sort);
    
    router.push(`/catalog?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setSort("newest");
    router.push("/catalog");
  };

  return (
    <form onSubmit={applyFilters} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Filtros</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Buscar</label>
          <div className="relative">
            <input 
               type="text" 
               value={q} 
               onChange={(e) => setQ(e.target.value)} 
               placeholder="Buscar produtos..." 
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none" 
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Categoria</label>
           <select 
             value={category} 
             onChange={(e) => setCategory(e.target.value)} 
             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none cursor-pointer"
           >
             <option value="">Todas as Categorias</option>
             {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
             ))}
           </select>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ordenar por</label>
           <select 
             value={sort} 
             onChange={(e) => setSort(e.target.value)} 
             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none cursor-pointer"
           >
             <option value="newest">Mais recentes</option>
             <option value="price_asc">Menor Preço</option>
             <option value="price_desc">Maior Preço</option>
           </select>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm focus:ring-4 focus:ring-primary/20">
          Aplicar Filtros
        </button>
        {(q || category || sort !== 'newest') && (
          <button type="button" onClick={clearFilters} className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
            Limpar Filtros
          </button>
        )}
      </div>
    </form>
  );
}
