"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleDatabaseError } from "@/lib/error-handler";

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED") {
  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!currentOrder) {
      return { error: "Pedido não encontrado." };
    }

    if (currentOrder.status === status) {
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      // Se estava CANCELADO e agora vai para outro status (reativação): debitar do estoque
      if (currentOrder.status === "CANCELED" && status !== "CANCELED") {
        for (const item of currentOrder.items) {
          if (item.variantId) {
            const v = await tx.variant.findUnique({ where: { id: item.variantId }, include: { product: true } });
            if (v) {
              const currentStock = currentOrder.stockLocation === "ESTOQUE_A" ? v.stockA : v.stockV;
              if (currentStock < item.quantity) {
                const stockName = currentOrder.stockLocation === "ESTOQUE_A" ? "Estoque Principal (A)" : "Estoque Secundário (V)";
                throw new Error(
                  `Estoque insuficiente no ${stockName} para reativar "${v.product.name}" (${v.color} - ${v.size}). Disponível: ${currentStock} un., Solicitado: ${item.quantity} un.`
                );
              }
              await tx.variant.update({
                where: { id: item.variantId },
                data: currentOrder.stockLocation === "ESTOQUE_A"
                  ? { stockA: { decrement: item.quantity } }
                  : { stockV: { decrement: item.quantity } }
              });
            }
          }
        }
      }

      // Se NÃO estava cancelado e agora está sendo CANCELADO: devolver ao estoque
      if (currentOrder.status !== "CANCELED" && status === "CANCELED") {
        for (const item of currentOrder.items) {
          if (item.variantId) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: currentOrder.stockLocation === "ESTOQUE_A"
                ? { stockA: { increment: item.quantity } }
                : { stockV: { increment: item.quantity } }
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status }
      });
    });

    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { error: handleDatabaseError(error, "Não foi possível alterar o status deste pedido.") };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return { error: "Pedido não encontrado." };
    }

    await prisma.$transaction(async (tx) => {
      // Se o pedido não estava cancelado, devolver os itens ao estoque antes de excluir
      if (order.status !== "CANCELED") {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: order.stockLocation === "ESTOQUE_A"
                ? { stockA: { increment: item.quantity } }
                : { stockV: { increment: item.quantity } }
            });
          }
        }
      }

      await tx.order.delete({
        where: { id: orderId }
      });
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return { error: handleDatabaseError(error, "Não foi possível excluir o pedido. Verifique se existem dependências.") };
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
    const paymentMethodRaw = formData.get("paymentMethod") as string | null;
    const validPaymentMethods = ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO", "CASH"];
    const paymentMethod = paymentMethodRaw && validPaymentMethods.includes(paymentMethodRaw)
      ? (paymentMethodRaw as "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BOLETO" | "CASH")
      : (paymentMethodRaw === "BANK_TRANSFER" ? "PIX" : "PIX");

    const shippingTypeRaw = formData.get("shippingType") as string | null;
    const validShippingTypes = ["SEM_FRETE", "PAGO_AURORA", "PAGO_CLIENTE"];
    const shippingType = shippingTypeRaw && validShippingTypes.includes(shippingTypeRaw)
      ? (shippingTypeRaw as "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE")
      : "SEM_FRETE";
    const notes = (formData.get("notes") as string)?.trim() || null;
    
    // Discount fields
    const discountType = formData.get("discountType") as string | null;
    const discountValueStr = formData.get("discountValue") as string | null;
    let discountValue = discountValueStr ? parseFloat(discountValueStr.replace(/\./g, "").replace(",", ".")) : null;
    if (isNaN(discountValue as number)) discountValue = null;

    const items: OrderItemParams[] = itemsJson ? JSON.parse(itemsJson) : [];

    if (!customerPhone || !customerName) {
      return { error: "O nome e o telefone do cliente são obrigatórios." };
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

      // 2. Validate Variants & Stock Availability
      for (const item of items) {
        if (!item.variantId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { variants: true }
          });
          if (product && product.variants.length > 0) {
            throw new Error(`Por favor, selecione o tamanho e a cor para o produto "${product.name}".`);
          }
        } else {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            include: { product: true }
          });
          if (!variant) {
            throw new Error("Variação do produto não encontrada.");
          }
          const availableStock = stockLocation === "ESTOQUE_A" ? variant.stockA : variant.stockV;
          if (availableStock < item.quantity) {
            const stockName = stockLocation === "ESTOQUE_A" ? "Estoque Principal (A)" : "Estoque Secundário (V)";
            throw new Error(
              `Estoque insuficiente no ${stockName} para "${variant.product.name}" (${variant.color} - ${variant.size}). Disponível: ${availableStock} un., Solicitado: ${item.quantity} un.`
            );
          }
          await tx.variant.update({
            where: { id: item.variantId },
            data: stockLocation === "ESTOQUE_A" 
              ? { stockA: { decrement: item.quantity } }
              : { stockV: { decrement: item.quantity } }
          });
        }
      }

      // 3. Create Order
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
          paymentMethod: paymentMethod,
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
    return { error: handleDatabaseError(error, "Não foi possível criar o pedido manual. Verifique os dados e tente novamente.") };
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
    return { error: handleDatabaseError(error, "Não foi possível atualizar as observações do pedido.") };
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
    return { error: handleDatabaseError(error, "Não foi possível atualizar o frete do pedido.") };
  }
}
