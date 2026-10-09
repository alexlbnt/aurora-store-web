"use client";

import React, { useTransition, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  searchParams?: Record<string, string | undefined>;
  onPageChange?: (page: number) => void;
}

function AdminPaginationInner({
  currentPage,
  totalItems,
  pageSize,
  itemLabel = "resultados",
  searchParams = {},
  onPageChange,
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [targetPage, setTargetPage] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  useEffect(() => {
    setTargetPage(null);
  }, [currentPage]);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") params.set(key, val);
    });
    // Explicitly set page so that Next.js detects changes even when returning to page 1
    params.set("page", String(page));
    const qs = params.toString();
    const base = pathname || "";
    return qs ? `${base}?${qs}` : (base || "/");
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number
  ) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (page === currentPage) {
      e.preventDefault();
      return;
    }

    setTargetPage(page);
    startTransition(() => {
      router.push(createPageUrl(page));
    });
  };

  if (totalItems === 0) {
    return (
      <div className="px-6 py-4 bg-accent-cream border-t border-primary/10 flex items-center justify-between text-sm text-primary/70">
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
    <div className="px-6 py-4 bg-accent-cream border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-primary/70">
          Mostrando{" "}
          <span className="font-semibold text-primary">
            {startItem} a {endItem}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-primary">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </p>

        {isPending && !onPageChange && (
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
          onPageChange ? (
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              className="size-10 rounded-lg border border-primary/20 bg-white text-primary hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer"
              title="Página anterior"
              aria-label="Página anterior"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_left
              </span>
            </button>
          ) : (
            <Link
              href={createPageUrl(currentPage - 1)}
              prefetch={true}
              onClick={(e) => handleLinkClick(e, currentPage - 1)}
              className={`size-10 rounded-lg border border-primary/20 bg-white text-primary hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer ${
                isPending ? "opacity-60 cursor-wait" : ""
              }`}
              title="Página anterior"
              aria-label="Página anterior"
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
          )
        ) : (
          <button
            type="button"
            disabled
            aria-label="Página anterior"
            className="size-10 rounded-lg border border-primary/10 text-primary/40 bg-white opacity-50 cursor-not-allowed flex items-center justify-center"
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
                <span className="text-sm text-primary/50 px-1" aria-hidden="true">…</span>
              )}
              {p === currentPage && (!isPending || onPageChange) ? (
                <span className="size-10 flex items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold select-none" aria-current="page">
                  {p}
                </span>
              ) : onPageChange ? (
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className="size-10 flex items-center justify-center rounded-lg border border-transparent hover:border-primary/20 hover:bg-white text-primary text-sm font-medium transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ) : (
                <Link
                  href={createPageUrl(p)}
                  prefetch={true}
                  onClick={(e) => handleLinkClick(e, p)}
                  className={`size-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    isTarget
                      ? "bg-primary/20 text-primary border-primary/30 font-bold animate-pulse"
                      : "border-transparent hover:border-primary/20 hover:bg-white text-primary"
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
          onPageChange ? (
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              className="size-10 rounded-lg border border-primary/20 bg-white text-primary hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer"
              title="Próxima página"
              aria-label="Próxima página"
            >
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </button>
          ) : (
            <Link
              href={createPageUrl(currentPage + 1)}
              prefetch={true}
              onClick={(e) => handleLinkClick(e, currentPage + 1)}
              className={`size-10 rounded-lg border border-primary/20 bg-white text-primary hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer ${
                isPending ? "opacity-60 cursor-wait" : ""
              }`}
              title="Próxima página"
              aria-label="Próxima página"
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
          )
        ) : (
          <button
            type="button"
            disabled
            aria-label="Próxima página"
            className="size-10 rounded-lg border border-primary/10 text-primary/40 bg-white opacity-50 cursor-not-allowed flex items-center justify-center"
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
        <div className="px-6 py-4 bg-accent-cream border-t border-primary/10 h-14 animate-pulse" />
      }
    >
      <AdminPaginationInner {...props} />
    </Suspense>
  );
}
