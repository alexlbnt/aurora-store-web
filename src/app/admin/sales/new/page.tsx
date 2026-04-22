import AdminLayout from "@/components/admin/AdminLayout";
import OrderForm from "./OrderForm";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      images: {
        where: { isDisplay: true },
        take: 1
      }
    },
    orderBy: { name: 'asc' }
  });

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: 'asc' }
  });

  // Serialize objects to fix Prisma Decimal and Date issues
  const serializedProducts = products.map(p => ({
    ...p,
    basePrice: p.basePrice ? p.basePrice.toString() : '0',
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map(v => ({
      ...v,
      price: v.price ? v.price.toString() : null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    images: p.images.map(img => ({
      ...img,
      createdAt: img.createdAt.toISOString()
    }))
  }));

  return (
    <AdminLayout>
      <OrderForm products={serializedProducts} customers={customers} />
    </AdminLayout>
  );
}
