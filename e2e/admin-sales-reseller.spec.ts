import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";
import { startNewOrder, submitNewOrder } from "./support/order-form";

// Revendedora: só uma anotação no pedido, sugerida a partir das vendas anteriores.
let shop: ShopFixture | undefined;

test.beforeAll(async () => {
  shop = await createShopFixture();
});

test.afterAll(async () => {
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test.beforeEach(async ({ context, baseURL }) => {
  const f = shop!;
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
});

test("venda com revendedora: gravada, exibida no pedido e na lista, e sugerida depois", async ({ page }) => {
  const f = shop!;
  const customerName = `E2E Cliente ${f.runId}`;
  const reseller = `E2E Revendedora ${f.runId}`;

  await startNewOrder(page, f, { customerName });
  await page.getByLabel("Revendedora (opcional)").fill(`  ${reseller} `);
  const orderId = await submitNewOrder(page);

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  expect(order.resellerName).toBe(reseller);

  await page.goto(`/admin/sales/${orderId}`);
  await expect(page.getByText(`Revendedora: ${reseller}`).filter({ visible: true })).toHaveCount(1);

  await page.goto(`/admin/sales?q=${encodeURIComponent(customerName)}`);
  await expect(page.getByText(`via ${reseller}`).filter({ visible: true }).first()).toBeVisible();

  await page.goto("/admin/sales/new");
  await expect(page.locator(`datalist#reseller-names option[value="${reseller}"]`)).toHaveCount(1);
});
