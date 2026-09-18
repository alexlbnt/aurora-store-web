import React from "react";
import Link from "next/link";

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  searchParams?: Record<string, string | undefined>;
}

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  itemLabel = "resultados",
  searchParams = {},
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") params.set(key, val);
    });
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  if (totalItems === 0) {
    return (
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Nenhum registro encontrado</span>
      </div>
    );
  }

  // Page numbers calculation (up to 5 pages around current)
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    }
  }

  return (
    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Mostrando <span className="font-bold text-slate-700 dark:text-slate-200">{startItem} a {endItem}</span> de{" "}
        <span className="font-bold text-slate-700 dark:text-slate-200">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        {/* Botão Anterior */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Página Anterior"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </Link>
        ) : (
          <button
            disabled
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
        )}

        {/* Números das Páginas */}
        {pages.map((p, idx) => {
          const prevPage = pages[idx - 1];
          const showEllipsis = prevPage && p - prevPage > 1;

          return (
            <React.Fragment key={p}>
              {showEllipsis && <span className="text-xs text-slate-400 px-1">...</span>}
              {p === currentPage ? (
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                  {p}
                </span>
              ) : (
                <Link
                  href={createPageUrl(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {p}
                </Link>
              )}
            </React.Fragment>
          );
        })}

        {/* Botão Próximo */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Próxima Página"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        ) : (
          <button
            disabled
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        )}
      </div>
    </div>
  );
}
