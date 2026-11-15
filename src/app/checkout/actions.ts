"use server";

import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatPhone } from "@/lib/formatters";
import { releaseStaleSiteOrders } from "@/lib/stale-orders";
import {
  allocateStock,
  appendNote,
  decideCustomer,
  generateSiteOrderNumber,
  HONEYPOT_FIELD,
  isHoneypotFilled,
  LOCATION_LABEL,
  LOCATION_PRIORITY,
  MAX_PENDING_SITE_ORDERS_PER_PHONE,
  parseCartLines,
  priceChanged,
  SITE_ORDER_PREFIX,
  unitPriceCents,
  type CartLine,
  type StockLine,
  type StockLocation,
} from "@/lib/checkout";

export type CheckoutState = {
  error?: string;
  /** Preços atuais (em reais) por linha do carrinho, quando mudaram desde que o cliente adicionou. */
  priceUpdates?: Record<string, number>;
} | null;

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const SHIPPING_TYPES = ["SEM_FRETE", "PAGO_CLIENTE"] as const;
const PAYMENT_METHODS = ["PIX", "CREDIT_CARD"] as const;
const GENERIC_ERROR = "Não foi possível enviar o pedido. Tente novamente em instantes ou fale com a equipe pelo WhatsApp.";

/** Erro com mensagem pronta para o cliente; desfaz a transação inteira. */
class CheckoutError extends Error {}

const isOrderNumberCollision = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError &&
  e.code === "P2002" &&
  String(e.meta?.target ?? "").includes("orderNumber");

export async function processPaymentAndCreateOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) return { error: GENERIC_ERROR };

  const field = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const name = field("name", 120);
  const phone = formatPhone(field("phone", 30));
  const address = field("address", 200);
  const city = field("city", 100);
  const state = field("state", 2).toUpperCase();
  const cepDigits = field("cep", 9).replace(/\D/g, "");
  const notes = field("notes", 500) || null;
  const formEmail = field("email", 160) || null;
  const shippingRaw = field("shippingType", 20);
  const paymentRaw = field("paymentMethod", 20);
  const shippingType = (SHIPPING_TYPES as readonly string[]).includes(shippingRaw) ? (shippingRaw as (typeof SHIPPING_TYPES)[number]) : "SEM_FRETE";
  const paymentMethod = (PAYMENT_METHODS as readonly string[]).includes(paymentRaw) ? (paymentRaw as (typeof PAYMENT_METHODS)[number]) : "PIX";

  if (!name || !address || !city || !state) {
    return { error: "Preencha todos os dados obrigatórios de identificação e entrega." };
  }
  if (phone.replace(/\D/g, "").length < 10) return { error: "Informe um telefone com DDD." };
  if (cepDigits.length !== 8) return { error: "Informe um CEP com 8 números." };
  if (!UFS.includes(state)) return { error: "Selecione o estado." };
  if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) return { error: "Confira o e-mail informado." };
  const cep = `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`;

  let cartRaw: unknown;
  try {
    cartRaw = JSON.parse(String(formData.get("cartItems") ?? ""));
  } catch {
    return { error: "Não foi possível ler o carrinho. Atualize a página e tente de novo." };
  }
  const cart = parseCartLines(cartRaw);
  if ("error" in cart) return { error: cart.error };

  const session = await auth();
  // Sem converter maiúsculas: a área do cliente busca o cadastro pelo e-mail exatamente como está na conta.
  const sessionEmail = session?.user?.email ?? null;

  let orderNumbers: string[] = [];

  try {
    // Pedidos parados há muitos dias liberam estoque antes de conferir este.
    await releaseStaleSiteOrders().catch((e) => console.error("Falha ao liberar pedidos antigos do site:", e));

    // 1. Limite de pedidos pendentes por telefone (cliques repetidos e robôs).
    const recentPending = await prisma.order.count({
      where: {
        status: "PENDING",
        orderNumber: { startsWith: SITE_ORDER_PREFIX },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        customer: { phone },
      },
    });
    if (recentPending >= MAX_PENDING_SITE_ORDERS_PER_PHONE) {
      return { error: "Já recebemos outros pedidos deste telefone hoje. Fale com a equipe pelo WhatsApp para completar ou ajustar o pedido." };
    }

    // 2. Cliente: visitante não pode usar o e-mail de uma conta existente.
    const formEmailHasAccount =
      !sessionEmail && formEmail ? !!(await prisma.user.findFirst({ where: { email: { equals: formEmail, mode: "insensitive" } }, select: { id: true } })) : false;
    const decision = decideCustomer({ sessionEmail, formEmail, formEmailHasAccount });
    if (decision === "login-required") {
      return { error: "Este e-mail já tem cadastro na Aurora. Entre na sua conta para finalizar, ou deixe o e-mail em branco." };
    }

    // 3. Preço e variação vêm do banco, nunca do navegador.
    const productIds = [...new Set(cart.lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { variants: true } });
    const productById = new Map(products.map((p) => [p.id, p]));

    type ProductRow = (typeof products)[number];
    const resolved: { line: CartLine; product: ProductRow; variant: ProductRow["variants"][number] | null; priceCents: number }[] = [];
    const priceUpdates: Record<string, number> = {};
    for (const line of cart.lines) {
      const product = productById.get(line.productId);
      if (!product) {
        return { error: "Uma das peças da sacola não está mais à venda. Remova-a e tente de novo." };
      }
      const variant = product.variants.find((v) => v.color === line.color && v.size === line.size) ?? null;
      if (product.variants.length > 0 && !variant) {
        return { error: `A opção ${line.color}, tamanho ${line.size} de "${product.name}" não está mais disponível. Remova-a da sacola.` };
      }
      const priceCents = unitPriceCents(variant?.price != null ? Number(variant.price) : null, Number(product.basePrice));
      if (priceChanged(line.clientPrice, priceCents)) priceUpdates[line.id] = priceCents / 100;
      resolved.push({ line, product, variant, priceCents });
    }
    if (Object.keys(priceUpdates).length > 0) {
      return {
        error: "O preço de algumas peças mudou. Atualizamos a sua sacola: confira o total e envie o pedido de novo.",
        priceUpdates,
      };
    }

    const keyOf = (r: (typeof resolved)[number]) => `${r.line.productId}|${r.line.color}|${r.line.size}`;
    const byKey = new Map(resolved.map((r) => [keyOf(r), r]));
    const variantIds = resolved.flatMap((r) => (r.variant ? [r.variant.id] : []));

    // 4. Estoque conferido e baixado dentro da mesma transação. Se o número do pedido repetir, tenta de novo.
    for (let attempt = 0; ; attempt++) {
      try {
        orderNumbers = await prisma.$transaction(
          async (tx) => {
            const fresh = await tx.variant.findMany({ where: { id: { in: variantIds } } });
            const freshById = new Map(fresh.map((v) => [v.id, v]));

            const stockLines: StockLine[] = resolved.map((r) => {
              const v = r.variant ? freshById.get(r.variant.id) : undefined;
              if (r.variant && !v) throw new CheckoutError(`"${r.product.name}" acabou de sair do catálogo. Remova-o da sacola.`);
              return { key: keyOf(r), qty: r.line.qty, stockA: v?.stockA ?? 0, stockV: v?.stockV ?? 0, tracked: !!v };
            });

            const allocation = allocateStock(stockLines);
            if (!allocation.ok) {
              const msgs = allocation.shortages.map((s) => {
                const r = byKey.get(s.key)!;
                return s.available > 0
                  ? `"${r.product.name}" (${r.line.color}, ${r.line.size}): restam ${s.available} un.`
                  : `"${r.product.name}" (${r.line.color}, ${r.line.size}) esgotou.`;
              });
              throw new CheckoutError(`Estoque insuficiente. ${msgs.join(" ")} Ajuste a sacola e tente de novo.`);
            }

            // Cliente
            let customerId: string;
            if (decision === "session") {
              const existing = await tx.customer.findUnique({ where: { email: sessionEmail! } });
              const data = { name, phone, address, city, state, cep };
              customerId = existing
                ? (await tx.customer.update({ where: { id: existing.id }, data })).id
                : (await tx.customer.create({ data: { ...data, email: sessionEmail } })).id;
            } else if (decision === "by-email") {
              const existing = await tx.customer.findFirst({ where: { email: { equals: formEmail!, mode: "insensitive" } } });
              customerId = existing
                ? existing.id
                : (await tx.customer.create({ data: { name, email: formEmail, phone, address, city, state, cep } })).id;
            } else {
              const existing = await tx.customer.findFirst({ where: { phone, email: null } });
              customerId = existing
                ? existing.id
                : (await tx.customer.create({ data: { name, phone, address, city, state, cep } })).id;
            }

            // Um pedido por estoque
            const locations = LOCATION_PRIORITY.filter((loc) => allocation.byLocation[loc]?.length);
            const numbers = new Map<StockLocation, string>(
              locations.map((loc) => [loc, generateSiteOrderNumber((min, max) => randomInt(min, max))])
            );
            const splitNote =
              locations.length > 1
                ? `[Site] Pedido dividido entre os estoques: ${locations.map((l) => `${numbers.get(l)} (${LOCATION_LABEL[l]})`).join(" e ")}.`
                : null;

            for (const loc of locations) {
              const allocated = allocation.byLocation[loc]!;
              for (const a of allocated) {
                const r = byKey.get(a.key)!;
                if (!r.variant) continue;
                // Baixa só se ainda houver saldo: protege contra duas compras ao mesmo tempo.
                const res =
                  loc === "ESTOQUE_A"
                    ? await tx.variant.updateMany({ where: { id: r.variant.id, stockA: { gte: a.qty } }, data: { stockA: { decrement: a.qty } } })
                    : await tx.variant.updateMany({ where: { id: r.variant.id, stockV: { gte: a.qty } }, data: { stockV: { decrement: a.qty } } });
                if (res.count === 0) {
                  throw new CheckoutError(`O estoque de "${r.product.name}" acabou de mudar. Atualize a página e tente de novo.`);
                }
              }

              const totalCents = allocated.reduce((acc, a) => acc + byKey.get(a.key)!.priceCents * a.qty, 0);
              await tx.order.create({
                data: {
                  orderNumber: numbers.get(loc)!,
                  customerId,
                  stockLocation: loc,
                  status: "PENDING",
                  shippingType,
                  paymentMethod,
                  shippingAddress: address,
                  shippingCity: city,
                  shippingState: state,
                  shippingCep: cep,
                  notes: splitNote ? appendNote(notes, splitNote) : notes,
                  totalAmount: new Prisma.Decimal(totalCents).div(100),
                  items: {
                    create: allocated.map((a) => {
                      const r = byKey.get(a.key)!;
                      return {
                        productId: r.product.id,
                        variantId: r.variant?.id ?? null,
                        quantity: a.qty,
                        price: new Prisma.Decimal(r.priceCents).div(100),
                      };
                    }),
                  },
                },
              });
            }

            return locations.map((l) => numbers.get(l)!);
          },
          { timeout: 20000 }
        );
        break;
      } catch (e) {
        if (isOrderNumberCollision(e) && attempt < 2) continue;
        throw e;
      }
    }
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message };
    console.error("Erro ao criar pedido do site:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin");
  for (const id of new Set(cart.lines.map((l) => l.productId))) revalidatePath(`/product/${id}`);

  redirect(`/checkout/success?orderNumber=${encodeURIComponent(orderNumbers.join(","))}`);
}
