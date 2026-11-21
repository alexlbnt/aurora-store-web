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

test("editar produto mantém a variação e a produção já lançada", async ({ page }) => {
  const f = shop!;
  const before = await prisma.variant.findFirstOrThrow({ where: { productId: f.productId, color: "Azul", size: "M" } });
  await prisma.productionEntry.create({
    data: { productId: f.productId, variantId: before.id, quantity: 2, stockLocation: "ESTOQUE_A", notes: "E2E produção" },
  });

  await page.goto(`/admin/products/${f.productId}/edit`);
  await page.locator('textarea[name="description"]').fill(`Descrição editada ${f.runId}`);
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
  await page.waitForURL(/\/admin\/products$/);

  // A variação continua a mesma (pedidos antigos apontam para ela) e a produção não some.
  const azul = await prisma.variant.findFirst({ where: { productId: f.productId, color: "Azul", size: "M" } });
  expect(azul?.id).toBe(before.id);
  expect(await prisma.productionEntry.count({ where: { productId: f.productId, notes: "E2E produção" } })).toBe(1);
});

test("lançar produção: quantidades do Estoque A e do Estoque V são independentes", async ({ page }) => {
  const f = shop!;
  const variant = await prisma.variant.findFirstOrThrow({ where: { productId: f.productId, color: "Azul", size: "M" } });

  await page.goto(`/admin/products?q=${encodeURIComponent(f.productName)}`);
  await page.getByRole("button", { name: "Ações do produto" }).first().click();
  await page.getByRole("button", { name: "Lançar produção" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Peças prontas")).toBeVisible();

  const field = dialog.getByLabel(/Quantidade produzida de M · Azul/);
  await field.fill("2"); // Estoque A (padrão)
  await dialog.getByText("Estoque V", { exact: true }).click();
  await expect(field).toHaveValue(""); // não copia o valor do A
  await field.fill("3");
  await dialog.getByText("Estoque A", { exact: true }).click();
  await expect(field).toHaveValue("2"); // o A continua com 2
  await expect(dialog.getByText("5 peças a lançar: 2 no A · 3 no V")).toBeVisible();

  await dialog.getByRole("button", { name: "Lançar produção" }).click();
  await expect
    .poll(async () =>
      (await prisma.productionEntry.findMany({ where: { variantId: variant.id, notes: null }, orderBy: { stockLocation: "asc" } })).map(
        (e) => [e.stockLocation, e.quantity],
      ),
    )
    .toEqual([
      ["ESTOQUE_A", 2],
      ["ESTOQUE_V", 3],
    ]);
  const after = await prisma.variant.findUniqueOrThrow({ where: { id: variant.id } });
  expect([after.stockA - variant.stockA, after.stockV - variant.stockV]).toEqual([2, 3]);
});
