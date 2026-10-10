import AdminLayout from "@/components/admin/AdminLayout";
import OrderForm from "./OrderForm";
import { loadOrderFormData } from "./data";

export const revalidate = 0;

interface NewOrderPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const resolvedParams = (await searchParams) || {};
  const initialCustomerId = resolvedParams.customerId || "";
  const { products, customers } = await loadOrderFormData();

  return (
    <AdminLayout pageTitle="Novo pedido">
      <OrderForm products={products} customers={customers} initialCustomerId={initialCustomerId} />
    </AdminLayout>
  );
}
