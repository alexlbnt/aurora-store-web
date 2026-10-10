"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleDatabaseError } from "@/lib/error-handler";
import { auth } from "@/auth";

// As actions são endpoints públicos (POST): o middleware protege as páginas, não elas.
// Toda action de vendas confere a sessão de administrador antes de mexer no banco.
async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    throw new Error("Sua sessão expirou ou você não tem permissão. Entre de novo no painel.");
  }
}

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED") {
  try {
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    // Venda na rua costuma ser paga na hora: a vendedora marca e o pedido já entra como pago.
    const markAsPaid = formData.get("paid") === "true";
    
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
          status: markAsPaid ? "PAID" : "PENDING",
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
    await requireAdmin();
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
    await requireAdmin();
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

// ---------------------------------------------------------------------------
// Edição de pedido
// ---------------------------------------------------------------------------

type PaymentMethodKey = "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BOLETO" | "CASH";
type ShippingTypeKey = "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE";
type StockLocationKey = "ESTOQUE_A" | "ESTOQUE_V";

interface ParsedOrderForm {
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  stockLocation: StockLocationKey;
  paymentMethod: PaymentMethodKey;
  shippingType: ShippingTypeKey;
  notes: string | null;
  discountType: "FIXED" | "PERCENTAGE" | null;
  discountValue: number | null;
  discountAmount: number;
  totalAmount: number;
  items: { productId: string; variantId: string | null; quantity: number; price: number }[];
}

function parseOrderForm(formData: FormData): ParsedOrderForm | { error: string } {
  const customerId = (formData.get("customerId") as string)?.trim() || null;
  const customerName = (formData.get("customerName") as string)?.trim() || "";
  const customerEmail = (formData.get("customerEmail") as string)?.trim() || null;
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || "";
  if (!customerName || !customerPhone) {
    return { error: "O nome e o telefone do cliente são obrigatórios." };
  }

  const stockLocation: StockLocationKey = formData.get("stockLocation") === "ESTOQUE_V" ? "ESTOQUE_V" : "ESTOQUE_A";
  const paymentRaw = formData.get("paymentMethod") as string | null;
  const paymentMethod: PaymentMethodKey = ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO", "CASH"].includes(paymentRaw ?? "")
    ? (paymentRaw as PaymentMethodKey)
    : "PIX";
  const shippingRaw = formData.get("shippingType") as string | null;
  const shippingType: ShippingTypeKey = ["SEM_FRETE", "PAGO_AURORA", "PAGO_CLIENTE"].includes(shippingRaw ?? "")
    ? (shippingRaw as ShippingTypeKey)
    : "SEM_FRETE";
  const notes = (formData.get("notes") as string)?.trim() || null;

  let items: ParsedOrderForm["items"];
  try {
    const raw = JSON.parse((formData.get("items") as string) || "[]") as {
      productId?: string;
      variantId?: string | null;
      quantity?: number;
      price?: string | number;
    }[];
    items = raw.map((i) => ({
      productId: String(i.productId ?? ""),
      variantId: i.variantId ? String(i.variantId) : null,
      quantity: Number(i.quantity),
      price: Number(i.price),
    }));
  } catch {
    return { error: "Não foi possível ler os itens do pedido. Recarregue a página e tente de novo." };
  }
  if (items.length === 0) return { error: "O pedido precisa de pelo menos um produto." };
  for (const i of items) {
    if (!i.productId || !Number.isInteger(i.quantity) || i.quantity < 1) {
      return { error: "Há um item com quantidade inválida. Confira as quantidades." };
    }
    if (!Number.isFinite(i.price) || i.price < 0) {
      return { error: "Há um item com preço inválido. Confira os preços." };
    }
  }

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountTypeRaw = formData.get("discountType") as string | null;
  const discountType = discountTypeRaw === "FIXED" || discountTypeRaw === "PERCENTAGE" ? discountTypeRaw : null;
  const discountValueRaw = formData.get("discountValue") as string | null;
  let discountValue: number | null = discountValueRaw
    ? parseFloat(discountValueRaw.replace(/\./g, "").replace(",", "."))
    : null;
  if (discountValue !== null && !Number.isFinite(discountValue)) discountValue = null;

  let discountAmount = 0;
  if (discountType === "FIXED" && discountValue) discountAmount = discountValue;
  if (discountType === "PERCENTAGE" && discountValue) discountAmount = (subtotal * discountValue) / 100;
  if (discountAmount > subtotal) return { error: "O desconto é maior que o valor das peças." };

  return {
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    stockLocation,
    paymentMethod,
    shippingType,
    notes,
    discountType,
    discountValue: discountType ? discountValue : null,
    discountAmount,
    totalAmount: Math.max(0, subtotal - discountAmount),
    items,
  };
}

/**
 * Salva as alterações de um pedido já registrado. Tudo numa transação:
 * as peças antigas voltam para o estoque de origem e as novas saem do estoque escolhido.
 * Se faltar estoque em qualquer item, nada é alterado.
 * Pedido cancelado não segura estoque, então só os dados mudam.
 * O status não muda aqui (é alterado na página do pedido).
 */
export async function updateOrder(orderId: string, formData: FormData) {
  try {
    await requireAdmin();
    const parsed = parseOrderForm(formData);
    if ("error" in parsed) return { error: parsed.error };

    await prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!current) throw new Error("Pedido não encontrado. Ele pode ter sido excluído.");

        const holdsStock = current.status !== "CANCELED";

        // 1. Devolve as peças antigas ao estoque de onde saíram.
        if (holdsStock) {
          for (const item of current.items) {
            if (!item.variantId) continue;
            // updateMany: não falha se a variação foi removida do cadastro.
            await tx.variant.updateMany({
              where: { id: item.variantId },
              data:
                current.stockLocation === "ESTOQUE_A"
                  ? { stockA: { increment: item.quantity } }
                  : { stockV: { increment: item.quantity } },
            });
          }
        }

        // 2. Confere e tira as peças novas do estoque escolhido.
        const stockName = parsed.stockLocation === "ESTOQUE_A" ? "Estoque A" : "Estoque V";
        for (const item of parsed.items) {
          if (!item.variantId) {
            const product = await tx.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
            if (!product) throw new Error("Um dos produtos do pedido não existe mais.");
            if (product.variants.length > 0) {
              throw new Error(`Escolha a cor e o tamanho de "${product.name}".`);
            }
            continue;
          }

          const variant = await tx.variant.findUnique({ where: { id: item.variantId }, include: { product: true } });
          if (!variant || variant.productId !== item.productId) {
            throw new Error("Uma das cores/tamanhos do pedido foi removida do cadastro. Tire o item e adicione de novo.");
          }
          if (!holdsStock) continue;

          // Baixa só se houver saldo (evita estoque negativo mesmo com duas vendas ao mesmo tempo).
          const result =
            parsed.stockLocation === "ESTOQUE_A"
              ? await tx.variant.updateMany({
                  where: { id: variant.id, stockA: { gte: item.quantity } },
                  data: { stockA: { decrement: item.quantity } },
                })
              : await tx.variant.updateMany({
                  where: { id: variant.id, stockV: { gte: item.quantity } },
                  data: { stockV: { decrement: item.quantity } },
                });
          if (result.count === 0) {
            const available = parsed.stockLocation === "ESTOQUE_A" ? variant.stockA : variant.stockV;
            throw new Error(
              `Estoque insuficiente no ${stockName} para "${variant.product.name}" (${variant.color} - ${variant.size}). Disponível: ${available} un., pedido: ${item.quantity} un.`
            );
          }
        }

        // 3. Cliente: mesmo critério do novo pedido (cadastro escolhido, e-mail ou telefone).
        let customer = parsed.customerId ? await tx.customer.findUnique({ where: { id: parsed.customerId } }) : null;
        if (!customer && parsed.customerEmail) {
          customer = await tx.customer.findUnique({ where: { email: parsed.customerEmail } });
        }
        if (!customer) customer = await tx.customer.findFirst({ where: { phone: parsed.customerPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: { name: parsed.customerName, email: parsed.customerEmail, phone: parsed.customerPhone },
          });
        } else {
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: parsed.customerName,
              phone: parsed.customerPhone,
              ...(parsed.customerEmail ? { email: parsed.customerEmail } : {}),
            },
          });
        }

        // 4. Troca os itens e os dados do pedido.
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.update({
          where: { id: orderId },
          data: {
            customerId: customer.id,
            stockLocation: parsed.stockLocation,
            paymentMethod: parsed.paymentMethod,
            shippingType: parsed.shippingType,
            notes: parsed.notes,
            discountType: parsed.discountType,
            discountValue: parsed.discountValue,
            discountAmount: parsed.discountAmount,
            totalAmount: parsed.totalAmount,
            items: {
              create: parsed.items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          },
        });
      },
      { timeout: 20000 }
    );

    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating order:", error);
    return { error: handleDatabaseError(error, "Não foi possível salvar as alterações do pedido.") };
  }
}
