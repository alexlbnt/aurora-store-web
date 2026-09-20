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
    const customerId = (formData.get("customerId") as string)?.trim() || null;
    const customerName = (formData.get("customerName") as string)?.trim();
    const customerEmailRaw = (formData.get("customerEmail") as string)?.trim();
    const customerEmail = customerEmailRaw && customerEmailRaw.length > 0 ? customerEmailRaw : null;
    const customerPhone = (formData.get("customerPhone") as string)?.trim();
    const itemsJson = formData.get("items") as string;
    const stockLocation = (formData.get("stockLocation") as "ESTOQUE_A" | "ESTOQUE_V") || "ESTOQUE_A";
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const shippingTypeRaw = formData.get("shippingType") as string | null;
    const validShippingTypes = ["SEM_FRETE", "PAGO_AURORA", "PAGO_CLIENTE"];
    const shippingType = shippingTypeRaw && validShippingTypes.includes(shippingTypeRaw)
      ? (shippingTypeRaw as "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE")
      : "SEM_FRETE";
    const notes = (formData.get("notes") as string)?.trim() || null;
    
    // Discount fields
    const discountType = formData.get("discountType") as string | null;
    const discountValueStr = formData.get("discountValue") as string | null;
    let discountValue = discountValueStr ? parseFloat(discountValueStr.replace(',', '.')) : null;
    if (isNaN(discountValue as number)) discountValue = null;

    const items: OrderItemParams[] = itemsJson ? JSON.parse(itemsJson) : [];

    if (!customerPhone || !customerName) {
      return { error: "Nome e telefone do cliente são obrigatórios." };
    }

    if (items.length === 0) {
      return { error: "Adicione pelo menos um produto com quantidade válida ao pedido." };
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
      let customer = null;
      if (customerId) {
        customer = await tx.customer.findUnique({ where: { id: customerId } });
      }
      if (!customer && customerEmail) {
        customer = await tx.customer.findUnique({ where: { email: customerEmail } });
      }
      if (!customer && customerPhone) {
        customer = await tx.customer.findFirst({ where: { phone: customerPhone } });
      }

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone
          }
        });
      } else {
        // Atualiza dados do cliente se fornecidos
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            phone: customerPhone,
            ...(customerEmail ? { email: customerEmail } : {})
          }
        });
      }

      // 2. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          stockLocation,
          status: "PENDING",
          shippingType,
          notes,
          discountType,
          discountValue,
          discountAmount,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod as any,
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
          const variantExists = await tx.variant.findUnique({ where: { id: item.variantId } });
          if (variantExists) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: stockLocation === "ESTOQUE_A" 
                ? { stockA: { decrement: item.quantity } }
                : { stockV: { decrement: item.quantity } }
            });
          }
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
      customerPhone: customerPhone,
      shippingType: order.shippingType,
      notes: order.notes
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { error: error?.message || "Erro ao criar pedido manual. Verifique os dados e tente novamente." };
  }
}

export async function updateOrderNotes(orderId: string, notes: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { notes: notes.trim() || null }
    });
    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    return { success: true };
  } catch (error) {
    console.error("Error updating order notes:", error);
    return { error: "Erro ao atualizar observações do pedido." };
  }
}

export async function updateOrderShipping(orderId: string, shippingType: "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE") {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { shippingType }
    });
    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    return { success: true };
  } catch (error) {
    console.error("Error updating order shipping:", error);
    return { error: "Erro ao atualizar frete do pedido." };
  }
}

