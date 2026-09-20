"use client";

import React, { useState, useMemo, useTransition, useCallback } from "react";
import Link from "next/link";
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
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [, startTransition] = useTransition();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Produtos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie o catálogo de produtos, preços e estoque.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/api/admin/export/products"
            target="_blank"
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Baixar CSV do catálogo"
          >
            <span className="material-symbols-outlined text-base text-slate-500">download</span>
            Exportar CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nome, SKU ou descrição..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
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

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary outline-none cursor-pointer"
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

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {totalItems === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
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
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
              >
                Limpar Filtros
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-bold text-sm"
              >
                Cadastrar Produto
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        <ProductRowActions productId={product.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
