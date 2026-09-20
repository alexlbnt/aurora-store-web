import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsClientTable, { SerializedProduct } from "./ProductsClientTable";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; // Force dynamic fetching to always show the latest products

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function ProductsListPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = (await searchParams) || {};
  const initialQuery = resolvedParams.q?.trim() || "";
  const initialCategory = resolvedParams.categoryId?.trim() || "ALL";
  const initialPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  let products: any[] = [];
  let categories: Array<{ id: string; name: string }> = [];

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          basePrice: true,
          categoryId: true,
          category: {
            select: { id: true, name: true },
          },
          variants: {
            select: { stockA: true, stockV: true },
          },
          images: {
            select: { url: true },
            orderBy: { order: "asc" },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
  } catch (err) {
    console.error("Error loading products:", err);
  }

  // Convert Decimal fields to regular numbers for React Client Component
  const serializedProducts: SerializedProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description || "",
    basePrice: Number(p.basePrice),
    categoryId: p.categoryId,
    category: p.category,
    variants: p.variants || [],
    images: p.images || [],
  }));

  return (
    <AdminLayout pageTitle="Produtos">
      <div className="flex-1">
        <ProductsClientTable
          initialProducts={serializedProducts}
          categories={categories}
          initialQuery={initialQuery}
          initialCategory={initialCategory}
          initialPage={initialPage}
        />
      </div>
    </AdminLayout>
  );
}
