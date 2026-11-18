import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { E2E_STOCK_A, cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";

// Cadastro de produto no painel: ajuste rápido de estoque e grade de variações (tamanho × cor).
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

test("ajuste rápido de estoque carrega as variações do produto", async ({ page }) => {
  const f = shop!;
  await page.goto(`/admin/products?q=${encodeURIComponent(f.productName)}`);
  await page.getByRole("button", { name: "Ações do produto" }).first().click();
  await page.getByRole("button", { name: "Ajustar Estoque" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(f.productName);
  await expect(dialog.getByText("Carregando variações...")).toBeHidden();
  await expect(dialog).toContainText("Azul");
  await expect(dialog.locator('input[type="number"]').first()).toHaveValue(String(E2E_STOCK_A));
});

test("editar produto: nova cor entra na grade sem perder o que já existia", async ({ page }) => {
  const f = shop!;
  await page.goto(`/admin/products/${f.productId}/edit`);

  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(1);
  const azul = rows.filter({ hasText: "Azul" });
  await expect(azul.locator('input[type="number"]').nth(1)).toHaveValue(String(E2E_STOCK_A)); // Estoque A

  await page.getByPlaceholder("Ex: Preto, Branco, Azul").fill("Rosa");
  await page.getByPlaceholder("Ex: Preto, Branco, Azul").press("Enter");
  await expect(rows).toHaveCount(2);
  await expect(azul.locator('input[type="number"]').nth(1)).toHaveValue(String(E2E_STOCK_A)); // não zerou

  const rosa = rows.filter({ hasText: "Rosa" });
  await rosa.locator('input[type="number"]').nth(1).fill("4");
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
  await page.waitForURL(/\/admin\/products$/);

  const variants = await prisma.variant.findMany({ where: { productId: f.productId }, orderBy: { color: "asc" } });
  expect(variants.map((v) => ({ color: v.color, size: v.size, stockA: v.stockA }))).toEqual([
    { color: "Azul", size: "M", stockA: E2E_STOCK_A },
    { color: "Rosa", size: "M", stockA: 4 },
  ]);
});
