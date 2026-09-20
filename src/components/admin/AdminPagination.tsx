"use client";

import React, { useTransition, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  searchParams?: Record<string, string | undefined>;
}

function AdminPaginationInner({
  currentPage,
  totalItems,
  pageSize,
  itemLabel = "resultados",
  searchParams = {},
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [targetPage, setTargetPage] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Reset targetPage when server rendered currentPage changes
  useEffect(() => {
    setTargetPage(null);
  }, [currentPage]);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") params.set(key, val);
    });
    if (page > 1) {
      params.set("page", String(page));
    }
    const qs = params.toString();
    const base = pathname || "";
    return qs ? `${base}?${qs}` : (base || "/");
  };

  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (page === currentPage || isPending) return;

    setTargetPage(page);
    startTransition(() => {
      router.push(createPageUrl(page));
    });
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
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      pages.push(i);
    }
  }

  return (
    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Mostrando{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {startItem} a {endItem}
          </span>{" "}
          de{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </p>

        {isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2.5 py-0.5 rounded-full animate-pulse">
            <span className="material-symbols-outlined text-[13px] animate-spin">
              sync
            </span>
            Carregando página {targetPage}...
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Botão Anterior */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            prefetch={true}
            onClick={(e) => handlePageClick(e, currentPage - 1)}
            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center ${
              isPending ? "opacity-60 cursor-wait" : ""
            }`}
            title="Página Anterior"
          >
            {targetPage === currentPage - 1 ? (
              <span className="material-symbols-outlined text-sm animate-spin text-primary">
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined text-sm">
                chevron_left
              </span>
            )}
          </Link>
        ) : (
          <button
            disabled
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>
        )}

        {/* Números das Páginas */}
        {pages.map((p, idx) => {
          const prevPage = pages[idx - 1];
          const showEllipsis = prevPage && p - prevPage > 1;
          const isTarget = targetPage === p;

          return (
            <React.Fragment key={p}>
              {showEllipsis && (
                <span className="text-xs text-slate-400 px-1">...</span>
              )}
              {p === currentPage && !isPending ? (
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                  {p}
                </span>
              ) : (
                <Link
                  href={createPageUrl(p)}
                  prefetch={true}
                  onClick={(e) => handlePageClick(e, p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                    isTarget
                      ? "bg-primary/20 text-primary border-primary/30 font-bold animate-pulse"
                      : p === currentPage
                      ? "bg-primary text-white font-bold shadow-sm border-transparent"
                      : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  } ${isPending ? "cursor-wait" : ""}`}
                >
                  {isTarget ? (
                    <span className="material-symbols-outlined text-xs animate-spin text-primary">
                      sync
                    </span>
                  ) : (
                    p
                  )}
                </Link>
              )}
            </React.Fragment>
          );
        })}

        {/* Botão Próximo */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            prefetch={true}
            onClick={(e) => handlePageClick(e, currentPage + 1)}
            className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center ${
              isPending ? "opacity-60 cursor-wait" : ""
            }`}
            title="Próxima Página"
          >
            {targetPage === currentPage + 1 ? (
              <span className="material-symbols-outlined text-sm animate-spin text-primary">
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            )}
          </Link>
        ) : (
          <button
            disabled
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-800 opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPagination(props: AdminPaginationProps) {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 h-14 animate-pulse" />
      }
    >
      <AdminPaginationInner {...props} />
    </Suspense>
  );
}
