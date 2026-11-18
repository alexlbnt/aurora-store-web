import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import {
  E2E_PRICE,
  E2E_STOCK_A,
  cleanupShopFixture,
  createShopFixture,
  prisma,
  type ShopFixture,
} from "./support/db";

// Caminho principal da loja: produto → sacola → pedido → aparece no painel.
let shop: ShopFixture | undefined;

test.beforeAll(async () => {
  shop = await createShopFixture();
});

test.afterAll(async () => {
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test("cliente faz um pedido pelo site e ele aparece no painel", async ({ page, context, baseURL }) => {
  const f = shop!;
  // Telefone único por execução: não esbarra no limite de pedidos pendentes por telefone.
  const phoneDigits = `119${String(Date.now()).slice(-8)}`;
  const customerName = `E2E Cliente ${f.runId}`;

  // Busca de CEP sem depender do serviço externo.
  await page.route("https://viacep.com.br/**", (route) =>
    route.fulfill({
      json: { cep: "74000-000", logradouro: "Rua de Teste", localidade: "Goiânia", uf: "GO" },
    }),
  );

  // 1. Produto → sacola
  await page.goto(`/product/${f.productSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: f.productName })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await expect(page.getByText("Adicionado à sacola")).toBeVisible();

  // 2. Checkout
  await page.goto("/checkout");
  await page.getByLabel("Nome completo").fill(customerName);
  await page.getByLabel("Telefone ou WhatsApp").fill(phoneDigits);
  await page.getByLabel("CEP").fill("74000000");
  await expect(page.getByLabel("Cidade")).toHaveValue("Goiânia");
  await page.getByLabel("Rua, número e complemento").fill("Rua de Teste, 123");
  await page.getByLabel("Estado").selectOption("GO");
  await page.getByRole("button", { name: /Enviar pedido/ }).click();

  // 3. Tela de sucesso com o número do pedido
  await page.waitForURL(/\/checkout\/success\?orderNumber=/);
  const orderNumber = new URL(page.url()).searchParams.get("orderNumber")!;
  expect(orderNumber).toMatch(/^AUR-/);
  await expect(page.getByText(orderNumber)).toBeVisible();

  // 4. Banco: pedido certo e estoque baixado
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, customer: true },
  });
  expect(order).not.toBeNull();
  expect(order!.status).toBe("PENDING");
  expect(order!.stockLocation).toBe("ESTOQUE_A");
  expect(Number(order!.totalAmount)).toBeCloseTo(E2E_PRICE, 2);
  expect(order!.items).toHaveLength(1);
  expect(order!.items[0]).toMatchObject({ productId: f.productId, variantId: f.variantId, quantity: 1 });
  expect(order!.customer.name).toBe(customerName);
  expect(order!.shippingCity).toBe("Goiânia");

  const variant = await prisma.variant.findUniqueOrThrow({ where: { id: f.variantId } });
  expect(variant.stockA).toBe(E2E_STOCK_A - 1);

  // 5. Painel: a vendedora encontra o pedido em Vendas
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
  await page.goto(`/admin/sales?q=${encodeURIComponent(orderNumber)}`);
  await expect(page).toHaveURL(/\/admin\/sales/);
  await expect(page.getByText(orderNumber).first()).toBeVisible();
  await expect(page.getByText(customerName).first()).toBeVisible();
});
