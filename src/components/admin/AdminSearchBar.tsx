"use client";

import React, { useEffect, useRef, useState, useTransition, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
}

function AdminSearchBarInner({ placeholder = "Buscar", paramName = "q" }: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState(searchParams.get(paramName) || "");

  const apply = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set(paramName, term.trim());
    } else {
      params.delete(paramName);
    }
    params.delete("page"); // volta para a primeira página ao buscar

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Espera a pessoa parar de digitar: antes, cada tecla disparava uma consulta ao banco.
  const handleChange = (term: string) => {
    setQuery(term);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(term), 300);
  };

  const handleClear = () => {
    if (timer.current) clearTimeout(timer.current);
    setQuery("");
    apply("");
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="relative w-full" role="search">
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-primary/50" aria-hidden="true">
        {isPending ? "sync" : "search"}
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`min-h-11 w-full rounded-lg border border-primary/20 bg-accent-cream pl-10 pr-11 text-sm text-primary placeholder:text-primary/50 ${
          isPending ? "opacity-75" : ""
        }`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar a busca"
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-primary/60 hover:bg-primary/10 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
        </button>
      )}
    </div>
  );
}

export default function AdminSearchBar(props: AdminSearchBarProps) {
  return (
    <Suspense fallback={<div className="h-11 w-full animate-pulse rounded-lg border border-primary/10 bg-accent-cream" />}>
      <AdminSearchBarInner {...props} />
    </Suspense>
  );
}
