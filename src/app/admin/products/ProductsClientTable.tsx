"use client";

import React, { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminProductImage from "@/components/admin/AdminProductImage";
import ProductRowActions from "./ProductRowActions";
import AdminPagination from "@/components/admin/AdminPagination";

export interface SerializedProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  basePrice: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  variants: Array<{
    stockA: number;
    stockV: number;
  }>;
  images: Array<{
    url: string;
  }>;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductsClientTableProps {
  initialProducts: SerializedProduct[];
  categories: CategoryOption[];
  initialQuery?: string;
  initialCategory?: string;
  initialPage?: number;
}

export default function ProductsClientTable({
  initialProducts,
  categories,
  initialQuery = "",
  initialCategory = "ALL",
  initialPage = 1,
}: ProductsClientTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const pageSize = 10;

  // Filter in memory for instant response
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory && selectedCategory !== "ALL") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, search, selectedCategory]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page does not exceed totalPages when filters reduce results
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  // Sync URL in background without causing page reloads
  const updateUrl = useCallback(
    (page: number, q: string, cat: string) => {
      startTransition(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (cat && cat !== "ALL") params.set("categoryId", cat);
        if (page > 1) params.set("page", String(page));

        const qs = params.toString();
        const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      });
    },
    []
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(newPage, search, selectedCategory);
    // Smooth scroll to table top if user is far down
    if (typeof window !== "undefined" && window.scrollY > 200) {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    updateUrl(1, val, selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    updateUrl(1, search, cat);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Produtos</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Gerencie o catálogo de produtos, preços e estoque.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/api/admin/export/products"
            target="_blank"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Baixar CSV do catálogo"
          >
            <span className="material-symbols-outlined text-base text-slate-500">download</span>
            <span>Exportar CSV</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 w-full min-w-0">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nome, SKU..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-base sm:text-sm transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                title="Limpar busca"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-2 pl-3 pr-8 text-base sm:text-sm focus:ring-primary focus:border-primary outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Content Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {totalItems === 0 ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-slate-400">inventory_2</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-sm">
              {search || selectedCategory !== "ALL"
                ? "Tente ajustar os filtros ou termo de busca."
                : "Adicione seu primeiro produto para começar a vender online."}
            </p>
            {search || selectedCategory !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                  setCurrentPage(1);
                  updateUrl(1, "", "ALL");
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-xs sm:text-sm hover:bg-slate-200 transition-colors"
              >
                Limpar Filtros
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="px-5 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-bold text-xs sm:text-sm"
              >
                Cadastrar Produto
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Product Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.map((product) => {
                const totalStockA = (product.variants || []).reduce(
                  (acc, variant) => acc + (variant.stockA || 0),
                  0
                );
                const totalStockV = (product.variants || []).reduce(
                  (acc, variant) => acc + (variant.stockV || 0),
                  0
                );

                return (
                  <div key={product.id} className="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <AdminProductImage
                          src={product.images && product.images.length > 0 ? product.images[0].url : ""}
                          alt={product.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <ProductRowActions
                            productId={product.id}
                            productName={product.name}
                            onProductDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
                            onStockUpdated={() => router.refresh()}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {product.sku}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                            {product.category?.name || "Geral"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock & Price info */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
                          <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Est. A</span>
                          <span className={`font-bold text-xs ${totalStockA === 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{totalStockA}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-200/50 dark:border-fuchsia-800/40">
                          <span className="text-[10px] uppercase font-bold text-fuchsia-600 dark:text-fuchsia-400">Est. V</span>
                          <span className={`font-bold text-xs ${totalStockV === 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{totalStockV}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          R$ {product.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {product.variants.length} {product.variants.length === 1 ? 'variação' : 'variações'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Produto</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">SKU</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Categoria</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Estoque A</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Estoque V</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Preço</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedProducts.map((product) => {
                    const totalStockA = (product.variants || []).reduce(
                      (acc, variant) => acc + (variant.stockA || 0),
                      0
                    );
                    const totalStockV = (product.variants || []).reduce(
                      (acc, variant) => acc + (variant.stockV || 0),
                      0
                    );

                    return (
                      <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                              <AdminProductImage
                                src={product.images && product.images.length > 0 ? product.images[0].url : ""}
                                alt={product.name}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{product.name}</p>
                              <p className="text-xs text-slate-500">{product.variants.length} variações</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {product.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {product.category?.name || "Geral"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                totalStockA === 0 ? "bg-red-500" : "bg-purple-500"
                              }`}
                            ></div>
                            <span
                              className={`font-semibold ${
                                totalStockA === 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {totalStockA} un
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                totalStockV === 0 ? "bg-red-500" : "bg-fuchsia-500"
                              }`}
                            ></div>
                            <span
                              className={`font-semibold ${
                                totalStockV === 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {totalStockV} un
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          R$ {product.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ProductRowActions
                            productId={product.id}
                            productName={product.name}
                            onProductDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
                            onStockUpdated={() => router.refresh()}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Real Pagination with Instant Client-Side Switching */}
        <AdminPagination
          currentPage={safePage}
          totalItems={totalItems}
          pageSize={pageSize}
          itemLabel="produtos"
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
