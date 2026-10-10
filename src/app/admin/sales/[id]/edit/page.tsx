import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/formatters";
import { toBRLInput } from "@/lib/format";
import OrderForm, { type EditableOrder } from "../../new/OrderForm";
import { loadOrderFormData } from "../../new/data";
import type { DiscountType, OrderLine, PaymentMethod } from "../../new/types";

export const revalidate = 0;

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, { products, customers }] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: true },
    }),
    loadOrderFormData(),
  ]);

  if (!order) notFound();

  // Junta itens repetidos da mesma variação (o formulário antigo permitia) numa linha só.
  const lineMap = new Map<string, OrderLine>();
  for (const item of order.items) {
    const key = item.variantId ?? item.productId;
    const existing = lineMap.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      lineMap.set(key, {
        key,
        productId: item.productId,
        variantId: item.variantId ?? "",
        quantity: item.quantity,
        price: toBRLInput(Number(item.price)),
      });
    }
  }

  // Peças que o pedido devolve ao estoque ao salvar (pedido cancelado já devolveu).
  const returnedStock: Record<string, number> = {};
  if (order.status !== "CANCELED") {
    for (const item of order.items) {
      if (item.variantId) returnedStock[item.variantId] = (returnedStock[item.variantId] ?? 0) + item.quantity;
    }
  }

  const discountType: DiscountType =
    order.discountType === "FIXED" || order.discountType === "PERCENTAGE" ? order.discountType : "NONE";

  const editing: EditableOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    lines: [...lineMap.values()],
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: formatPhone(order.customer.phone),
      email: order.customer.email ?? "",
      socialMedia: order.customer.socialMedia ?? "",
    },
    stockLocation: order.stockLocation,
    paymentMethod: (order.paymentMethod ?? "PIX") as PaymentMethod,
    shippingType: order.shippingType,
    discountType,
    discountValue:
      discountType === "NONE" || order.discountValue === null
        ? ""
        : discountType === "FIXED"
          ? toBRLInput(Number(order.discountValue))
          : String(Number(order.discountValue)).replace(".", ","),
    notes: order.notes ?? "",
    returnedStock,
  };

  return (
    <AdminLayout pageTitle="Editar pedido">
      <OrderForm products={products} customers={customers} editing={editing} />
    </AdminLayout>
  );
}
