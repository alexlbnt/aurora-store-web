import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductForm from "./ProductForm";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function NewProduct() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <AdminLayout>
      <ProductForm categories={categories} />
    </AdminLayout>
  );
}
