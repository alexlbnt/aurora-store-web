"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function processPaymentAndCreateOrder(prevState: any, formData: FormData) {
  const rawCart = formData.get("cartItems") as string;
  const address = formData.get("address") as string;
  const cep = formData.get("cep") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const name = formData.get("name") as string;
  
  if (!rawCart) return { error: "Carrinho vazio." };
  
  let cartItems: any[];
  try {
    cartItems = JSON.parse(rawCart);
  } catch (e) {
    return { error: "Erro ao ler carrinho" };
  }

  if (!phone || !name || !address || !cep || !city || !state) {
    return { error: "Preencha todos os dados obrigatórios de identificação e entrega." };
  }

  if (!cartItems || cartItems.length === 0) {
    return { error: "Seu carrinho está vazio." };
  }

  let createdOrderNumber: string | null = null;

  try {
    // 1. Validar e resolver variantes e estoque
    const resolvedItems: {
      item: any;
      variant: any;
    }[] = [];

    for (const item of cartItems) {
      let variant = null;
      if (item.productId && item.color && item.size) {
        variant = await prisma.variant.findUnique({
          where: {
            productId_color_size: {
              productId: item.productId,
              color: item.color,
              size: item.size,
            }
          }
        });
      }

      if (!variant && item.productId) {
        variant = await prisma.variant.findFirst({
          where: { productId: item.productId }
        });
      }

      if (variant && variant.stockA < item.qty) {
        return {
          error: `Estoque insuficiente para "${item.name}" (${item.color} - ${item.size}). Disponível em estoque: ${variant.stockA} un.`
        };
      }

      resolvedItems.push({ item, variant });
    }

    // 2. Transação atômica
    const totalAmount = cartItems.reduce((acc, item) => acc + (Number(item.numericPrice) * Number(item.qty)), 0);
    const orderNumber = `AUR-${Math.floor(Math.random() * 900000) + 100000}`;

    await prisma.$transaction(async (tx) => {
      // Cliente
      let customer = email ? await tx.customer.findUnique({ where: { email } }) : null;
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name,
            email: email || null,
            phone,
            address,
            city,
            state,
            cep
          }
        });
      } else {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name,
            phone,
            address,
            city,
            state,
            cep
          }
        });
      }

      // Baixa de estoque
      for (const { item, variant } of resolvedItems) {
        if (variant) {
          await tx.variant.update({
            where: { id: variant.id },
            data: {
              stockA: {
                decrement: item.qty
              }
            }
          });
        }
      }

      // Criação do pedido com endereço e itens vinculados à variante
      await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          stockLocation: "ESTOQUE_A",
          status: "PAID",
          shippingType: "SEM_FRETE",
          shippingAddress: address,
          shippingCity: city,
          shippingState: state,
          shippingCep: cep,
          totalAmount,
          paymentMethod: "CREDIT_CARD",
          items: {
            create: resolvedItems.map(({ item, variant }) => ({
              productId: item.productId,
              variantId: variant ? variant.id : null,
              quantity: item.qty,
              price: item.numericPrice
            }))
          }
        }
      });
    });

    createdOrderNumber = orderNumber;

    // Simulação de e-mail transacional
    console.log(`\n📧 [SIMULADOR EMAIL] Enviando confirmação para: ${email || name}`);
    console.log(`Assunto: Aurora Store - Seu pedido #${orderNumber} foi confirmado!`);
    console.log(`Entrega para: ${address}, ${city} - ${state} (${cep})\n`);

  } catch (error: any) {
    console.error("Erro no processamento do pedido:", error);
    return { error: "Erro ao processar o pagamento e gerar o pedido. Tente novamente." };
  }

  // Redirecionamento após o bloco try/catch para evitar interceptação de NEXT_REDIRECT
  if (createdOrderNumber) {
    redirect(`/checkout/success?orderNumber=${createdOrderNumber}`);
  }
}
