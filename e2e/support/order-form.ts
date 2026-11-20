import { expect, type Page } from "@playwright/test";
import type { ShopFixture } from "./db";

/** Telefone único por chamada: não esbarra em cadastros de execuções anteriores. */
export const uniquePhone = () => `119${String(Date.now()).slice(-8)}`;

/**
 * Abre /admin/sales/new, coloca o produto da fixture (`quantity` vezes) e preenche o cliente.
 * Não registra: o teste completa o que precisar (revendedora, parcelas...) e chama submitNewOrder.
 */
export async function startNewOrder(page: Page, f: ShopFixture, opts: { customerName: string; quantity?: number }) {
  await page.goto("/admin/sales/new");
  await page.getByLabel("Buscar produto por nome ou código").fill(f.productName);
  const add = page.getByRole("button", { name: new RegExp(f.productName) });
  for (let i = 0; i < (opts.quantity ?? 1); i++) await add.click();
  await page.getByLabel("Nome", { exact: true }).fill(opts.customerName);
  await page.getByLabel("Telefone ou WhatsApp").fill(uniquePhone());
}

/** Registra a venda e espera a tela de sucesso. Devolve o id do pedido (do link "Ver o pedido"). */
export async function submitNewOrder(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Registrar pedido" }).filter({ visible: true }).first().click();
  const link = page.getByRole("link", { name: "Ver o pedido" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  const id = href?.split("/").pop();
  if (!id) throw new Error("Link do pedido não encontrado na tela de sucesso.");
  return id;
}
