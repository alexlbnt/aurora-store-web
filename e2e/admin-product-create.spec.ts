import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";

// Cadastro de produto: o estoque informado (A e V) entra como produzido, sem dobrar o estoque.
let shop: ShopFixture | undefined;
let productName = "";

test.beforeAll(async () => {
  shop = await createShopFixture();
  productName = `E2E Produto Novo ${shop.runId}`;
});

test.afterAll(async () => {
  // O produto criado pela tela não é o da fixture: apaga antes (variações e produção vão junto).
  await prisma.product.deleteMany({ where: { name: productName } });
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test.beforeEach(async ({ context, baseURL }) => {
  const f = shop!;
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
});

test("produto novo: estoque A e V viram produzido", async ({ page }) => {
  const f = shop!;
  await page.goto("/admin/products/new");
  await page.locator('input[name="name"]').fill(productName);
  await page.locator('textarea[name="description"]').fill("Produto criado pelo teste automático.");
  await page.locator('select[name="categoryId"]').selectOption(f.categoryId);
  await page.locator('input[name="price"]').fill("50");
  await page.getByText("Produto com Variações").click(); // desliga as variações
  await page.locator('input[name="stockA"]').fill("5");
  await page.locator('input[name="stockV"]').fill("3");
  await page.getByRole("button", { name: "Publicar Produto" }).first().click();
  await page.waitForURL(/\/admin\/products$/);

  const product = await prisma.product.findFirstOrThrow({
    where: { name: productName },
    include: { variants: true, productions: true },
  });
  expect(product.variants).toHaveLength(1);
  expect(product.variants[0]).toMatchObject({ stockA: 5, stockV: 3 });
  expect(
    product.productions.map((p) => [p.stockLocation, p.quantity, p.notes]).sort(),
  ).toEqual([
    ["ESTOQUE_A", 5, "Estoque inicial do cadastro"],
    ["ESTOQUE_V", 3, "Estoque inicial do cadastro"],
  ]);

  await page.goto(`/admin/products?q=${encodeURIComponent(productName)}`);
  await expect(page.getByText("8 / 0").filter({ visible: true }).first()).toBeVisible();
});
