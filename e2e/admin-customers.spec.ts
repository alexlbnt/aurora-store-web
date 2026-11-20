import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { E2E_PRICE, cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";

// Clientes sumidos: última compra (não cancelada) há mais de 60 dias.
let shop: ShopFixture | undefined;

const DAY = 24 * 60 * 60 * 1000;

async function customerWithOrder(f: ShopFixture, label: string, daysAgo: number, status: "PAID" | "CANCELED") {
  const customer = await prisma.customer.create({
    data: { name: `E2E Cliente ${f.runId} ${label}`, phone: `119${String(Date.now()).slice(-8)}` },
  });
  await prisma.order.create({
    data: {
      orderNumber: `E2E-${f.runId}-${label}`,
      customerId: customer.id,
      status,
      totalAmount: E2E_PRICE,
      createdAt: new Date(Date.now() - daysAgo * DAY),
      items: { create: { productId: f.productId, variantId: f.variantId, quantity: 1, price: E2E_PRICE } },
    },
  });
}

test.beforeAll(async () => {
  shop = await createShopFixture();
  await customerWithOrder(shop, "Sumida", 90, "PAID");
  await customerWithOrder(shop, "Recente", 0, "PAID");
  await customerWithOrder(shop, "SoCancelado", 90, "CANCELED");
});

test.afterAll(async () => {
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test.beforeEach(async ({ context, baseURL }) => {
  const f = shop!;
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
});

test("card de clientes sumidos leva à lista filtrada", async ({ page }) => {
  await page.goto("/admin/customers");
  const card = page.getByRole("link", { name: /Sem comprar há \+60 dias/ });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", "/admin/customers?sumidos=1");
});

test("filtro mostra só quem comprou há mais de 60 dias, sem contar cancelados", async ({ page }) => {
  const f = shop!;
  await page.goto(`/admin/customers?sumidos=1&q=${encodeURIComponent(`E2E Cliente ${f.runId}`)}`);
  const main = page.locator("body");
  await expect(main.getByText(`E2E Cliente ${f.runId} Sumida`).filter({ visible: true })).toHaveCount(1);
  await expect(main.getByText("há 90 dias").filter({ visible: true })).toHaveCount(1);
  await expect(main.getByText(`E2E Cliente ${f.runId} Recente`)).toHaveCount(0);
  await expect(main.getByText(`E2E Cliente ${f.runId} SoCancelado`)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ver todos" })).toBeVisible();
});
