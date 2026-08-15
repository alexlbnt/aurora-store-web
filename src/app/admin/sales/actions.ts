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

export async function deleteOrder(orderId: string) {
  try {
    await prisma.order.delete({
      where: { id: orderId }
    });
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { error: "Erro ao excluir pedido." };
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
    const stockLocation = (formData.get("stockLocation") as "ESTOQUE_A" | "ESTOQUE_V") || "ESTOQUE_A";
    
    // Discount fields
    const discountType = formData.get("discountType") as string | null;
    const discountValueStr = formData.get("discountValue") as string | null;
    let discountValue = discountValueStr ? parseFloat(discountValueStr.replace(',', '.')) : null;
    if (isNaN(discountValue as number)) discountValue = null;

    const items: OrderItemParams[] = itemsJson ? JSON.parse(itemsJson) : [];

    if (!customerPhone || !customerName || items.length === 0) {
      throw new Error("Nome, telefone e itens são obrigatórios");
    }

    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    
    let discountAmount = 0;
    if (discountType === "FIXED" && discountValue) {
      discountAmount = discountValue;
    } else if (discountType === "PERCENTAGE" && discountValue) {
      discountAmount = (subtotal * discountValue) / 100;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const orderNumber = `PED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Find or create Customer
      let customer = customerEmail ? await tx.customer.findUnique({
        where: { email: customerEmail }
      }) : null;

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            email: customerEmail || null,
            phone: customerPhone
          }
        });
      } else if (customerPhone && customer.phone !== customerPhone) {
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
          stockLocation,
          status: "PENDING",
          discountType,
          discountValue,
          discountAmount,
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
            data: stockLocation === "ESTOQUE_A" 
              ? { stockA: { decrement: item.quantity } }
              : { stockV: { decrement: item.quantity } }
          });
        }
      }

      return newOrder;
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount.toNumber(),
      customerPhone: customerPhone
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { error: "Erro ao criar pedido manual." };
  }
}
