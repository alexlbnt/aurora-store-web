import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Dados de teste: tudo leva o prefixo "e2e-" (ou "E2E ") e um código da execução, para a limpeza
// apagar só o que o teste criou.

const DEV_SCHEMA = process.env.E2E_DATABASE_SCHEMA || "aurora_store";

/**
 * Trava de segurança: o teste cria e apaga dados, então só roda no banco de desenvolvimento.
 * O banco da loja publicada usa outro schema ("public"); qualquer coisa diferente do esperado para tudo.
 */
export function assertDevDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  let schema: string | null = null;
  try {
    schema = new URL(url).searchParams.get("schema");
  } catch {
    /* URL inválida: cai na recusa abaixo */
  }
  if (schema !== DEV_SCHEMA) {
    throw new Error(
      `Teste de ponta a ponta recusado: o DATABASE_URL não aponta para o banco de desenvolvimento ` +
        `(schema esperado "${DEV_SCHEMA}", encontrado "${schema ?? "nenhum"}"). Nada foi alterado.`,
    );
  }
}

export const prisma = new PrismaClient();

export const runId = () => randomBytes(3).toString("hex");

export interface ShopFixture {
  runId: string;
  categoryId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  adminUserId: string;
  adminEmail: string;
}

export const E2E_PRICE = 99.9;
export const E2E_STOCK_A = 3;

/** Cria categoria, produto (1 variação no Estoque A) e um administrador de teste. */
export async function createShopFixture(): Promise<ShopFixture> {
  assertDevDatabase();
  const id = runId();
  const category = await prisma.category.create({
    data: { name: `E2E Categoria ${id}`, slug: `e2e-categoria-${id}` },
  });
  const productName = `E2E Pijama Teste ${id}`;
  const product = await prisma.product.create({
    data: {
      name: productName,
      slug: `e2e-pijama-teste-${id}`,
      sku: `E2E-${id}`,
      description: "Produto criado pelo teste automático. Pode ser apagado.",
      basePrice: E2E_PRICE,
      categoryId: category.id,
      visible: true,
      variants: { create: { color: "Azul", size: "M", stockA: E2E_STOCK_A, stockV: 0 } },
    },
    include: { variants: true },
  });
  const adminEmail = `e2e-admin-${id}@aurora.test`;
  const admin = await prisma.user.create({ data: { email: adminEmail, name: `E2E Admin ${id}`, role: "ADMIN" } });

  return {
    runId: id,
    categoryId: category.id,
    productId: product.id,
    productSlug: product.slug,
    productName,
    variantId: product.variants[0].id,
    adminUserId: admin.id,
    adminEmail,
  };
}

/** Apaga tudo o que a execução criou. Roda mesmo se o teste falhar no meio. */
export async function cleanupShopFixture(f: ShopFixture | undefined): Promise<void> {
  if (!f) return;
  assertDevDatabase();
  const orders = await prisma.order.findMany({
    where: { items: { some: { productId: f.productId } } },
    select: { id: true, customerId: true },
  });
  const customerIds = [...new Set(orders.map((o) => o.customerId))];
  await prisma.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } }); // itens e pagamentos vão junto
  // Só apaga o cliente de teste que ficou sem nenhum pedido.
  await prisma.customer.deleteMany({
    where: { id: { in: customerIds }, name: { startsWith: "E2E " }, orders: { none: {} } },
  });
  await prisma.product.deleteMany({ where: { id: f.productId } }); // variações vão junto
  await prisma.category.deleteMany({ where: { id: f.categoryId } });
  await prisma.user.deleteMany({ where: { id: f.adminUserId } });
}

export async function deleteE2EAnnouncements(id: string): Promise<void> {
  assertDevDatabase();
  await prisma.announcement.deleteMany({ where: { message: { contains: `E2E ${id}` } } });
}
