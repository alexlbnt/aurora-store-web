import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import ProductRowActions from "./ProductRowActions";
import AdminProductImage from "@/components/admin/AdminProductImage";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminFilterSelect from "@/components/admin/AdminFilterSelect";
import AdminPagination from "@/components/admin/AdminPagination";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const revalidate = 0; // Force dynamic fetching to always show the latest products

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function ProductsListPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q?.trim() || "";
  const categoryId = resolvedParams.categoryId?.trim();
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 10;

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoryId && categoryId !== "ALL") {
    where.categoryId = categoryId;
  }

  // Parallel data fetching: products, count and categories
  const [products, totalProductsCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  return (
    <AdminLayout>
      <div className="flex-1">
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
            <AdminSearchBar placeholder="Buscar por nome, SKU ou descrição..." />
          </div>
          <div className="flex items-center gap-3">
            <AdminFilterSelect
              paramName="categoryId"
              defaultValue="ALL"
              placeholder="Todas as Categorias"
              options={categoryOptions}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
              <p className="text-slate-500 mb-6 max-w-sm">
                {q || categoryId
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Adicione seu primeiro produto para começar a vender online."}
              </p>
              <Link
                href="/admin/products/new"
                className="px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-bold text-sm"
              >
                Cadastrar Produto
              </Link>
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
                  {products.map((product) => {
                    const totalStockA = product.variants.reduce((acc, variant) => acc + variant.stockA, 0);
                    const totalStockV = product.variants.reduce((acc, variant) => acc + variant.stockV, 0);

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
                            {product.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                totalStockA === 0 ? "bg-red-500" : "bg-purple-500"
                              }`}
                            ></div>
                            <span className={`font-semibold ${totalStockA === 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
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
                            <span className={`font-semibold ${totalStockV === 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
                              {totalStockV} un
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          R$ {Number(product.basePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

          {/* Real Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalItems={totalProductsCount}
            pageSize={pageSize}
            itemLabel="produtos"
            searchParams={{ q, categoryId }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
