import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";

// Painel no celular: tudo o que a barra lateral oferece precisa ser alcançável pela barra inferior.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

let shop: ShopFixture | undefined;

test.beforeAll(async () => {
  shop = await createShopFixture();
});

test.afterAll(async () => {
  await cleanupShopFixture(shop);
  await prisma.$disconnect();
});

test("barra inferior: atalhos, Mais com as demais telas e sem menu ☰", async ({ page, context, baseURL }) => {
  const f = shop!;
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
  await page.goto("/admin");

  const nav = page.getByRole("navigation", { name: "Navegação do painel" });
  await expect(nav).toBeVisible();
  for (const name of ["Início", "Vendas", "Novo pedido", "Produtos"]) {
    await expect(nav.getByRole("link", { name })).toBeVisible();
  }
  // Navegação única no celular: sem botão ☰ nem barra lateral.
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Seções do painel" })).toBeHidden();

  // Mais → lista todas as outras telas, perfil e Sair
  await nav.getByRole("button", { name: "Mais" }).click();
  const sheet = page.getByRole("dialog", { name: "Mais opções" });
  await expect(sheet).toBeVisible();
  for (const name of ["Financeiro", "Categorias", "Clientes", "Relatórios", "Configurações", /Ver a loja/]) {
    await expect(sheet.getByRole("link", { name })).toBeVisible();
  }
  await expect(sheet.getByRole("button", { name: "Sair" })).toBeVisible();
  await expect(sheet.getByText(f.adminEmail)).toBeVisible();

  // Esc fecha
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  // Abre uma tela de dentro do Mais: a folha fecha e "Mais" fica aceso
  await nav.getByRole("button", { name: "Mais" }).click();
  await sheet.getByRole("link", { name: "Financeiro" }).click();
  await page.waitForURL(/\/admin\/finance/);
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Financeiro" })).toBeVisible();

  // Toque fora da folha também fecha
  await nav.getByRole("button", { name: "Mais" }).click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(195, 40);
  await expect(sheet).toBeHidden();
});

test("busca no celular: a lupa procura no assunto da tela", async ({ page, context, baseURL }) => {
  const f = shop!;
  await signInAsAdmin(context, baseURL!, { id: f.adminUserId, email: f.adminEmail, name: `E2E Admin ${f.runId}` });
  await page.goto("/admin/products");

  const lupa = page.getByRole("button", { name: "Buscar produtos" });
  await expect(lupa).toBeVisible();

  // Esc fecha sem buscar e devolve o foco para a lupa
  await lupa.click();
  const campo = page.getByRole("searchbox", { name: "Buscar produtos" }).last();
  await expect(campo).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("search")).toHaveCount(0);
  await expect(lupa).toBeFocused();

  // Busca de verdade: vai para a lista filtrada e o campo fecha
  await lupa.click();
  await campo.fill(f.productName);
  await campo.press("Enter");
  await page.waitForURL(new RegExp(`/admin/products\\?q=`));
  await expect(page.getByRole("search")).toHaveCount(0);
  await expect(page.getByText(f.productName).first()).toBeVisible();

  // Em outra tela, a mesma lupa procura pedidos
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Buscar pedidos" })).toBeVisible();
});
