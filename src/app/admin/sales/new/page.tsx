import AdminLayout from "@/components/admin/AdminLayout";
import OrderForm from "./OrderForm";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

interface NewOrderPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const resolvedParams = (await searchParams) || {};
  const initialCustomerId = resolvedParams.customerId || "";

  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize objects to fix Prisma Decimal and Date issues
  const serializedProducts = products.map((p) => ({
    ...p,
    basePrice: p.basePrice ? p.basePrice.toString() : "0",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map((v) => ({
      ...v,
      price: v.price ? v.price.toString() : null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    images: p.images.map((img) => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
    })),
  }));

  return (
    <AdminLayout pageTitle="Novo pedido">
      <OrderForm
        products={serializedProducts}
        customers={customers}
        initialCustomerId={initialCustomerId}
      />
    </AdminLayout>
  );
}
