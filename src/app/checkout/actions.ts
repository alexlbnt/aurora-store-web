"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function processPaymentAndCreateOrder(prevState: any, formData: FormData) {
  const rawCart = formData.get("cartItems") as string;
  const address = formData.get("address") as string;
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  
  if (!rawCart) return { error: "Carrinho vazio." };
  
  let cartItems: any[];
  try {
    cartItems = JSON.parse(rawCart);
  } catch (e) {
    return { error: "Erro ao ler carrinho" };
  }

  if (!email || !name || !address) {
    return { error: "Preencha todos os dados obrigatórios." };
  }

  try {
    // Simulando delay natural de processamento de cartão (Gateway fake)
    await new Promise(r => setTimeout(r, 2000)); 

    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, email }
      });
    }

    const totalAmount = cartItems.reduce((acc, item) => acc + (item.numericPrice * item.qty), 0);
    const orderNumber = `AUR-${Math.floor(Math.random() * 900000) + 100000}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PAID",
        totalAmount,
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.qty,
            price: item.numericPrice
          }))
        }
      }
    });

    // Simulador de Envio de E-mail Transacional
    console.log(`\n📧 [SIMULADOR EMAIL] Enviando confirmação para: ${email}`);
    console.log(`Assunto: Aurora Store - Seu pedido #${orderNumber} foi confirmado!`);
    console.log(`Corpo: Olá ${name}, aprovamos seu pagamento de R$ ${totalAmount.toFixed(2)}. Estamos separando seu pedido com carinho!\n`);

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar o pagamento com o banco falso. Tente novamente." };
  }

  // Redirecionamento após o bloco try/catch para evitar interceptação de erro do Next.js
  redirect("/checkout/success");
}
