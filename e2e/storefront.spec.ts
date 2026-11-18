import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import {
  cleanupShopFixture,
  createShopFixture,
  deleteE2EAnnouncements,
  prisma,
  type ShopFixture,
} from "./support/db";

// Recursos da vitrine: guia de tamanhos, botão de WhatsApp e faixa de aviso editada pelo painel.
let shop: ShopFixture | undefined;

test.beforeAll(async () => {
  shop = await createShopFixture();
});

test.afterAll(async () => {
  if (shop) await deleteE2EAnnouncements(shop.runId);
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test("guia de tamanhos abre sobre a página e destaca o tamanho escolhido", async ({ page }) => {
  await page.goto(`/product/${shop!.productSlug}`);
  await page.getByRole("main").getByRole("link", { name: "Guia de tamanhos" }).click();

  const dialog = page.getByRole("dialog", { name: "Guia de tamanhos" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/product/${shop!.productSlug}$`)); // não saiu da página
  await expect(dialog.locator('tr[aria-current="true"] th')).toHaveText(/^M/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("botão de WhatsApp cita o produto e some na sacola", async ({ page }) => {
  await page.goto(`/product/${shop!.productSlug}`);
  const fab = page.getByRole("link", { name: /Falar com a equipe no WhatsApp/ });
  await expect(fab).toBeVisible();
  const href = decodeURIComponent((await fab.getAttribute("href")) ?? "");
  expect(href).toContain(shop!.productName);
  expect(href).toContain(`/product/${shop!.productSlug}`);

  await page.goto("/cart");
  await expect(page.getByRole("link", { name: /Falar com a equipe no WhatsApp/ })).toHaveCount(0);
});

test("faixa de aviso: publicada no painel, aparece na loja e a cliente pode fechar", async ({ page, context, baseURL }) => {
  const f = shop!;
  const message = `Frete grátis nesta semana E2E ${f.runId}`;

  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
  await page.goto("/admin/settings");
  await page.getByLabel("Texto do aviso").fill(message);
  await page.getByLabel("Link (opcional)").fill("/catalog");
  await page.getByRole("button", { name: "Publicar aviso" }).click();
  await expect(page.getByText("Aviso salvo.")).toBeVisible();

  // A loja mostra a versão nova logo depois de salvar (cache limpo pelo painel).
  await page.goto("/faq");
  const bar = page.getByRole("region", { name: "Aviso da loja" });
  await expect(bar).toContainText(message);
  await expect(bar.getByRole("link")).toHaveAttribute("href", "/catalog");

  await bar.getByRole("button", { name: "Fechar aviso" }).click();
  await expect(bar).toBeHidden();
  await page.reload();
  await expect(page.getByRole("region", { name: "Aviso da loja" })).toBeHidden();

  // Desligado no painel, some da loja para todo mundo.
  await page.goto("/admin/settings");
  const row = page.getByRole("listitem").filter({ hasText: message });
  await row.getByRole("button", { name: "Desligar" }).click();
  await expect(row.getByText("Desligado")).toBeVisible();
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto("/faq");
  await expect(page.getByText(message)).toHaveCount(0);
});
