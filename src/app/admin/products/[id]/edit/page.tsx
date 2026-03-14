import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductForm from "../../new/ProductForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: { variants: true }
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  if (!product) {
    notFound();
  }

  // Convert Decimals to string/number to safely pass to Client Components
  const serializedProduct = {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map(v => ({
      ...v,
      price: Number(v.price)
    }))
  };

  return (
    <AdminLayout>
      <ProductForm categories={categories} initialData={serializedProduct} />
    </AdminLayout>
  );
}
