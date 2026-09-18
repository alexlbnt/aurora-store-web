"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
}

export default function AdminSearchBar({
  placeholder = "Buscar...",
  paramName = "q",
}: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get(paramName) || "");

  const handleSearch = (term: string) => {
    setQuery(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set(paramName, term.trim());
    } else {
      params.delete(paramName);
    }
    params.delete("page"); // Reset page when searching

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
        {isPending ? "sync" : "search"}
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 ${
          isPending ? "opacity-75" : ""
        }`}
      />
      {query && (
        <button
          onClick={() => handleSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Limpar busca"
        >
          <span className="material-symbols-outlined text-xs">close</span>
        </button>
      )}
    </div>
  );
}
