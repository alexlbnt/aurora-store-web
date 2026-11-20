import { expect, test, type Page } from "@playwright/test";
import { signInAsAdmin } from "./support/admin-session";
import { cleanupShopFixture, createShopFixture, prisma, type ShopFixture } from "./support/db";
import { startNewOrder, submitNewOrder } from "./support/order-form";

// Venda parcelada: 3 peças de R$ 99,90 = R$ 299,70 em 3x, com entrada; baixa, atraso, estorno e edição.
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

const row = (page: Page, n: number) => page.getByTestId(`installment-${n}`);

/** Ontem, no calendário de Brasília, como data de coluna @db.Date. */
function yesterdayDbDate(): Date {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) - 24 * 60 * 60 * 1000);
}

test("venda parcelada: entrada, baixa, atraso, estorno e edição", async ({ page }) => {
  const f = shop!;

  // 1. Venda nova em 3x com a 1ª paga
  await startNewOrder(page, f, { customerName: `E2E Cliente ${f.runId}`, quantity: 3 });
  await page.getByRole("radio", { name: "Sim" }).check({ force: true });
  await page.getByLabel("Quantas parcelas").selectOption("3");
  await page.getByRole("checkbox", { name: /A 1ª parcela já foi paga/ }).check();
  const orderId = await submitNewOrder(page);

  const saved = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { installments: { orderBy: { number: "asc" } }, payments: true },
  });
  expect(saved.installments.map((i) => Number(i.amount))).toEqual([99.9, 99.9, 99.9]);
  expect(saved.payments.map((p) => Number(p.amount))).toEqual([99.9]);
  expect(saved.status).toBe("PENDING");

  // 2. Tela do pedido
  await page.goto(`/admin/sales/${orderId}`);
  await expect(page.getByRole("heading", { name: "Parcelas (3x de R$ 99,90)" })).toBeVisible();
  await expect(row(page, 1)).toContainText("Paga");
  await expect(row(page, 2)).toContainText("Em aberto");
  await expect(row(page, 3)).toContainText("Em aberto");

  // 3. Baixa: o valor sugerido é o da próxima parcela
  await page.getByRole("button", { name: /^Receber R\$\s?99,90$/ }).click();
  await expect(page.getByLabel("Valor recebido (R$)")).toHaveValue("99,90");
  await page.getByRole("button", { name: "Dar baixa" }).click();
  await expect(row(page, 2)).toContainText("Paga");

  // 4. Parcela vencida aparece como atrasada
  await prisma.orderInstallment.update({
    where: { orderId_number: { orderId, number: 3 } },
    data: { dueDate: yesterdayDbDate() },
  });
  await page.reload();
  await expect(row(page, 3)).toContainText("Atrasada");

  // 5. Estorno do último recebimento: a 2ª volta a ficar em aberto
  await page.getByRole("button", { name: /Excluir recebimento de/ }).last().click();
  await page.getByRole("button", { name: "Excluir recebimento", exact: true }).click();
  await expect(row(page, 2)).toContainText("Em aberto");

  // 6. Edição mantém as parcelas
  await page.goto(`/admin/sales/${orderId}/edit`);
  await expect(page.getByLabel("Quantas parcelas")).toHaveValue("3");
  await page.getByRole("button", { name: "Salvar alterações" }).filter({ visible: true }).first().click();
  await expect
    .poll(async () => (await prisma.orderInstallment.count({ where: { orderId } })), { timeout: 30_000 })
    .toBe(3);
  await expect.poll(async () => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).updatedAt > saved.updatedAt).toBe(true);
});
