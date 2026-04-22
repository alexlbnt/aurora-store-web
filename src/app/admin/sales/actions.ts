"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED") {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar status do pedido." };
  }
}

interface OrderItemParams {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: string;
}

export async function createOrder(formData: FormData) {
  try {
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const itemsJson = formData.get("items") as string;
    const items: OrderItemParams[] = itemsJson ? JSON.parse(itemsJson) : [];

    if (!customerEmail || !customerName || items.length === 0) {
      throw new Error("Campos obrigatórios ausentes");
    }

    const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const orderNumber = `PED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Find or create Customer
      let customer = await tx.customer.findUnique({
        where: { email: customerEmail }
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || null
          }
        });
      } else if (customerPhone && !customer.phone) {
        // Optionally update phone if newly provided
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { phone: customerPhone }
        });
      }

      // 2. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: "PENDING",
          totalAmount: totalAmount,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });

      // 3. Deduct stock from Variants if applicable
      for (const item of items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity }
            }
          });
        }
      }

      return newOrder;
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Error creating order:", error);
    return { error: "Erro ao criar pedido manual." };
  }
}
