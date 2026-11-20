# Clientes sumidos, revendedora e venda parcelada — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Três entregas no painel: card e filtro de clientes sem comprar há +60 dias; campo "Revendedora" no pedido; venda parcelada com vencimentos e situação de cada parcela na tela do pedido.

**Architecture:** As regras ficam em funções puras em `src/lib/` (testadas com Vitest), e as telas e actions do App Router só as chamam. As parcelas ficam numa tabela própria (`OrderInstallment`). A situação de cada parcela (paga, parcial, atrasada, em aberto) **não é gravada**: é calculada distribuindo o total das baixas (`OrderPayment`) em ordem de número.

**Tech Stack:** Next.js 16.4 (App Router, server actions), Prisma 6 + Postgres (Neon), Tailwind 4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-20-parcelas-revendedora-clientes-sumidos-design.md`

## Global Constraints

- Ordem e versões: Entrega 1 = **Aurora-v1.9.0** (Tasks 1–2) · Entrega 2 = **Aurora-v1.9.1** (Tasks 3–4) · Entrega 3 = **Aurora-v1.9.2** (Tasks 5–8). Cada entrega é publicada sozinha (Task de publicação ao fim de cada uma).
- Mensagem de commit: `Aurora-vX.Y.Z feat: ...` em inglês, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commits intermediários de cada task podem usar `wip(<entrega>): ...`; o último commit da entrega leva a versão.
- Textos da interface em português do Brasil, simples, sem jargão (é o padrão do painel).
- Limite de cliente sumido: **60 dias** (`INACTIVE_CUSTOMER_DAYS`). Contar só pedidos **não cancelados**; quem nunca comprou não entra.
- Revendedora: texto opcional, `trim`, máximo **80** caracteres, vazio → `null`.
- Parcelas: **2 a 24**; 1º vencimento padrão = hoje (Brasília) + 30 dias; seguintes mês a mês, com dia inexistente ajustado para o **último dia do mês**; valores iguais sobre o **total com desconto**, com os centavos que sobram **na 1ª**; soma tem de fechar com o total (tolerância de R$ 0,01).
- Datas "de hoje" sempre em Brasília: use `todayInput()` de `src/lib/finance.ts` (formato `AAAA-MM-DD`). `OrderInstallment.dueDate` é `@db.Date`: grave com `new Date(\`${s}T00:00:00Z\`)` e leia com `d.toISOString().slice(0, 10)`. Compare datas como strings `AAAA-MM-DD`.
- Toda action nova ou alterada continua começando por `requireAdmin()` / `adminGuard()`.
- Mudanças no banco **só acrescentam**. Antes de publicar as Entregas 2 e 3, o schema vai primeiro para o banco de dev e depois para o de produção, nesta ordem: endereço fornecido pelo Alexandre → `prisma migrate diff` → `db push` → deploy. Nunca chame o banco local de "produção".
- Verificação antes de cada publicação: `npm run typecheck`, `npm run lint` (0 avisos), `npm test`, `npm run build`, `npm run test:e2e` — todos verdes. Se o `next dev` travar por falta de memória: encerrar os node do projeto e apagar `.next`.

## Review Focus

1. **Rascunho antigo no navegador** (salvo antes da versão nova, sem `resellerName`/`installments`): o formulário tem que abrir normalmente, com "Parcelado: Não" e a revendedora vazia → teste em Task 7 (`readDraftExtras`).
2. **Total que não divide redondo** (R$ 100,00 em 3x; R$ 0,05 em 2x... e desconto em %): a soma das parcelas fecha exatamente com o total → testes em Task 5.
3. **Vencimento num dia 29–31** (31/01 → 28 ou 29/02; 30/11 → 30/12; virada de ano): o dia é ajustado sem pular mês → testes em Task 5.
4. **Baixa estornada ou pedido editado depois de baixas**: as parcelas recalculam a situação e nenhuma fica "Paga" sem dinheiro → testes de `allocateInstallments` em Task 5; o servidor recusa salvar parcelas cuja soma ≠ total (Task 6).
5. **Cliente cujos pedidos estão todos cancelados, ou que comprou hoje**: não aparece como sumido nem entra na contagem → e2e da Task 2.

---

## Entrega 1 — Clientes sumidos (v1.9.0)

### Task 1: Regras de "cliente sumido"

**Files:**
- Create: `src/lib/customer-activity.ts`
- Test: `src/lib/customer-activity.test.ts`

**Interfaces:**
- Produces:
  - `export const INACTIVE_CUSTOMER_DAYS = 60`
  - `export function daysSince(date: Date, now?: Date): number` — dias de calendário em Brasília entre a data e hoje (0 = hoje); nunca negativo.
  - `export function inactiveCutoff(now?: Date): Date` — instante a partir do qual uma compra ainda é "recente": início do dia (00:00 de Brasília) de `hoje − 60 dias`. Uma compra com `createdAt < inactiveCutoff()` está sumida.
  - `export function isInactive(lastPurchase: Date | null, now?: Date): boolean` — `false` para `null`; `true` quando `daysSince(lastPurchase, now) > INACTIVE_CUSTOMER_DAYS` (o mesmo que `lastPurchase < inactiveCutoff(now)`).
  - `export function lastPurchaseLabel(lastPurchase: Date | null, now?: Date): string` — `"hoje"`, `"ontem"`, `"há N dias"`; `null` → `"Nunca comprou"`.

- [ ] **Step 1: Escrever os testes**

```ts
// now fixo: 2026-11-20T15:00:00-03:00
it("conta dias de calendário em Brasília", () => {
  expect(daysSince(new Date("2026-11-20T01:00:00-03:00"), now)).toBe(0);
  expect(daysSince(new Date("2026-11-19T23:30:00-03:00"), now)).toBe(1);
  expect(daysSince(new Date("2026-09-21T10:00:00-03:00"), now)).toBe(60);
});
it("sumido só depois de 60 dias", () => {
  expect(isInactive(new Date("2026-09-21T10:00:00-03:00"), now)).toBe(false); // 60 dias
  expect(isInactive(new Date("2026-09-20T23:59:00-03:00"), now)).toBe(true);  // 61 dias
  expect(isInactive(null, now)).toBe(false);
});
it("corte coincide com isInactive", () => {
  expect(inactiveCutoff(now).toISOString()).toBe(new Date("2026-09-21T00:00:00-03:00").toISOString());
});
it("rótulos", () => {
  expect(lastPurchaseLabel(new Date("2026-11-20T08:00:00-03:00"), now)).toBe("hoje");
  expect(lastPurchaseLabel(new Date("2026-11-19T08:00:00-03:00"), now)).toBe("ontem");
  expect(lastPurchaseLabel(new Date("2026-09-01T08:00:00-03:00"), now)).toBe("há 80 dias");
  expect(lastPurchaseLabel(null, now)).toBe("Nunca comprou");
});
```

- [ ] **Step 2:** `npx vitest run src/lib/customer-activity.test.ts` → FAIL (módulo não existe)
- [ ] **Step 3:** Implementar `src/lib/customer-activity.ts`. Dia em Brasília: `todayInput(d)` de `src/lib/finance.ts` para as duas datas, depois diferença em dias entre as strings (tratadas como UTC).
- [ ] **Step 4:** `npx vitest run src/lib/customer-activity.test.ts` → PASS
- [ ] **Step 5:** Commit `wip(inactive): customer activity rules`

### Task 2: Card, filtro e coluna na tela de clientes

**Files:**
- Create: `src/app/admin/customers/data.ts`
- Modify: `src/app/admin/customers/page.tsx` (card na linha 131; cálculo `averageLTV` nas linhas 54–95 sai; "Último Pedido" nas linhas ~151 e ~286)
- Test: `e2e/admin-customers.spec.ts`

**Interfaces:**
- Consumes: `INACTIVE_CUSTOMER_DAYS`, `inactiveCutoff`, `isInactive`, `lastPurchaseLabel` (Task 1).
- Produces (em `data.ts`, só servidor):
  - `export async function countInactiveCustomers(now?: Date): Promise<number>`
  - `export async function loadInactiveCustomerIds(opts: { q: string; page: number; pageSize: number; now?: Date }): Promise<{ ids: string[]; total: number }>` — ids na ordem "sumido há mais tempo primeiro".

- [ ] **Step 1: Escrever o e2e** `e2e/admin-customers.spec.ts`. Usa `createShopFixture`/`cleanupShopFixture`/`signInAsAdmin` e cria pelo `prisma` de `e2e/support/db.ts` três clientes `E2E Cliente <runId> ...` com pedidos do produto da fixture:
  - **Sumida:** pedido não cancelado de 90 dias atrás (`createdAt` explícito).
  - **Recente:** pedido de hoje.
  - **Só cancelado:** pedido CANCELED de 90 dias atrás.

  Asserções:
  - em `/admin/customers?sumidos=1&q=E2E Cliente <runId>`, a lista mostra a Sumida (com `"há 90 dias"`) e **não** mostra Recente nem Só cancelado;
  - em `/admin/customers` aparece o card com o texto `"Sem comprar há +60 dias"`, que é um link para `?sumidos=1`;
  - no filtro aparece o link `"ver todos"`.

  A limpeza da fixture já apaga pedidos do produto e clientes "E2E " sem pedido.
- [ ] **Step 2:** `npx playwright test e2e/admin-customers.spec.ts` → FAIL
- [ ] **Step 3: Implementar `data.ts`** com `prisma.order.groupBy`:
  - `by: ["customerId"]`;
  - `where: { status: { not: "CANCELED" }, ...(q ? { customer: { OR: [...mesmos 4 campos da busca atual] } } : {}) }`;
  - `_max: { createdAt: true }`;
  - `having: { createdAt: { _max: { lt: inactiveCutoff(now) } } }`;
  - `orderBy: { _max: { createdAt: "asc" } }`.

  `total` = tamanho do resultado sem paginar; `ids` = recorte `skip/take`. `countInactiveCustomers` é o mesmo cálculo sem `q`.
- [ ] **Step 4: Alterar `page.tsx`:**
  - `searchParams` ganha `sumidos?: string`.
  - Com `sumidos === "1"`: buscar os ids com `loadInactiveCustomerIds`, depois `findMany({ where: { id: { in: ids } }, include: customerListInclude })`, reordenar na ordem dos ids e usar `total` na paginação. Sem o filtro, a lista fica como hoje.
  - Trocar o card de "Gasto médio por cliente" por `<MetricCard label="Sem comprar há +60 dias" value={inactiveCount} hint="Última compra há mais de 60 dias" href="/admin/customers?sumidos=1" attention={inactiveCount > 0} />` e remover `averageLTV`/`totalLifetimeSpent`.
  - Com o filtro ativo, mostrar acima da lista uma linha "Mostrando clientes sem comprar há +60 dias · ver todos" (link para `/admin/customers` mantendo `q`).
  - "Último pedido" (cartões e tabela): `lastPurchaseLabel(...)` com a data em `title`; quando `isInactive`, usar o tom âmbar do `attention` do `MetricCard` (`text-amber-700`).
  - Os links de paginação (`AdminPagination`) mantêm `sumidos=1`: conferir se o componente preserva os parâmetros e passar o parâmetro se não preservar.
- [ ] **Step 5:** `npx playwright test e2e/admin-customers.spec.ts` → PASS
- [ ] **Step 6: Verificação completa** (Global Constraints) → tudo verde
- [ ] **Step 7:** Commit `Aurora-v1.9.0 feat: inactive customers card and filter on /admin/customers`
- [ ] **Step 8: Publicar** — sem mudança no banco. Pedir o ok do Alexandre, fazer `git push`, acompanhar o deploy na Vercel até READY e conferir os erros de runtime da última hora.

---

## Entrega 2 — Revendedora (v1.9.1)

### Task 3: Coluna e regra do nome da revendedora

**Files:**
- Modify: `prisma/schema.prisma` (model `Order`: `resellerName String?` depois de `notes`)
- Create: `src/lib/reseller.ts`
- Test: `src/lib/reseller.test.ts`

**Interfaces:**
- Produces:
  - `export const RESELLER_NAME_MAX = 80`
  - `export function parseResellerName(raw: unknown): string | null` — não-string ou vazio após `trim` → `null`; corta em 80 caracteres e aplica `trim` de novo.
  - `export function uniqueResellerNames(names: (string | null)[]): string[]` — sem vazios, sem repetidos que diferem só por maiúsculas/acentos/espaços (fica a 1ª grafia), em ordem alfabética `pt-BR`.

- [ ] **Step 1: Testes:**
  - `parseResellerName("  Ana Paula ")` → `"Ana Paula"`;
  - `parseResellerName("   ")` → `null`;
  - `parseResellerName(null)` → `null`;
  - 100×"a" → string de 80;
  - `uniqueResellerNames(["Ana", "ana ", "Bruna", null, "", "Ána"])` → `["Ana", "Bruna"]`.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar (comparação com `normalize` de `src/app/admin/sales/new/types.ts`; ou mover `normalize` para `src/lib/` se o import ficar cruzado). **Step 4:** rodar → PASS
- [ ] **Step 5:** `npx prisma db push` (banco de **dev**, do `.env`) e `npx prisma generate`; `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` → migração vazia
- [ ] **Step 6:** Commit `wip(reseller): resellerName column and parsing`

### Task 4: Revendedora no formulário, no pedido, na lista e na planilha

**Files:**
- Modify: `src/app/admin/sales/actions.ts` (`createOrder` ~linha 166; `parseOrderForm` ~399 + `ParsedOrderForm`; `updateOrder` grava o campo)
- Modify: `src/app/admin/sales/new/data.ts` (`loadOrderFormData` devolve também `resellerNames: string[]`)
- Modify: `src/app/admin/sales/new/OrderForm.tsx` (`Draft`, `EditableOrder`, estado, envio, campo)
- Modify: `src/app/admin/sales/new/page.tsx`, `src/app/admin/sales/[id]/edit/page.tsx` (passar `resellerNames`; edição preenche `editing.resellerName`)
- Modify: `src/app/admin/sales/new/OrderSuccess.tsx` (`SuccessSnapshot.resellerName?: string`; linha "Revendedora: X" na mensagem quando houver)
- Modify: `src/app/admin/sales/[id]/page.tsx`, `src/app/admin/sales/page.tsx`, `src/app/api/admin/export/sales/route.ts`
- Test: `e2e/admin-sales-reseller.spec.ts`

**Interfaces:**
- Consumes: `parseResellerName`, `uniqueResellerNames` (Task 3).
- Produces: campo de formulário `resellerName`; `EditableOrder.resellerName: string`; `Draft.resellerName?: string`; prop `resellerNames: string[]` no `OrderForm`.

- [ ] **Step 1: Escrever o e2e:**
  - Admin abre `/admin/sales/new`, adiciona o produto da fixture, preenche cliente `E2E Cliente <runId>` e telefone único, digita `E2E Revendedora <runId>` no campo **"Revendedora (opcional)"** e registra.
  - No banco: o pedido tem `resellerName === "E2E Revendedora <runId>"`.
  - Em `/admin/sales/<id>` aparece `"Revendedora: E2E Revendedora <runId>"`.
  - Em `/admin/sales?q=E2E Cliente <runId>` aparece o nome da revendedora.
  - Numa segunda venda nova, o `<datalist>` do campo contém essa opção.

  Para os seletores do formulário, seguir os passos de `e2e/admin-mobile-nav.spec.ts` e de `e2e/checkout.spec.ts`.
- [ ] **Step 2:** rodar → FAIL
- [ ] **Step 3: Servidor:**
  - `createOrder` e `parseOrderForm` leem `parseResellerName(formData.get("resellerName"))`.
  - `order.create` e o `update` de `updateOrder` gravam `resellerName`. Na edição, campo vazio limpa o valor.
- [ ] **Step 4: `data.ts`:** `prisma.order.findMany({ where: { resellerName: { not: null } }, select: { resellerName: true }, distinct: ["resellerName"], take: 500 })` → `uniqueResellerNames`.
- [ ] **Step 5: `OrderForm`:**
  - Estado `resellerName`, que entra no rascunho e no `touch()`.
  - Input de texto com `<label>` **"Revendedora (opcional)"**, dica "Preencha só quando a venda foi feita por uma revendedora.", `maxLength={80}`, `list="reseller-names"` + `<datalist id="reseller-names">`. Vai no fim da seção do cliente (seção 2), depois do `CustomerPicker`.
  - Envio: `formData.append("resellerName", resellerName.trim())`.
  - Resumo lateral: linha "Revendedora" quando preenchida.
  - Rascunho antigo sem o campo → `""`.
- [ ] **Step 6: Exibição:**
  - **Tela do pedido:** "Revendedora: Nome" no card do cliente.
  - **Lista de vendas:** "via Nome", abaixo do nome do cliente, em cartões e tabela. Incluir `resellerName` no `select`/`include` da lista.
  - **CSV:** coluna `Revendedora` depois de `Cliente`, com o mesmo escape de aspas.
  - **PDF da exportação:** não muda.
- [ ] **Step 7:** rodar o e2e → PASS; **verificação completa** → verde
- [ ] **Step 8:** Commit `Aurora-v1.9.1 feat: reseller name on orders`
- [ ] **Step 9: Publicar** — pedir ao Alexandre o endereço do banco de **produção** (console da Neon). `DATABASE_URL=<prod> npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` deve mostrar **só** `ALTER TABLE "Order" ADD COLUMN "resellerName" TEXT`. Depois `DATABASE_URL=<prod> npx prisma db push`, ok do Alexandre, `git push`, deploy READY, conferir erros. Não gravar o endereço em arquivo.

---

## Entrega 3 — Venda parcelada (v1.9.2)

### Task 5: Regras das parcelas

**Files:**
- Create: `src/lib/installments.ts`
- Test: `src/lib/installments.test.ts`

**Interfaces:**
- Consumes: `roundMoney`, `todayInput` de `src/lib/finance.ts`.
- Produces:
  ```ts
  export const MIN_INSTALLMENTS = 2;
  export const MAX_INSTALLMENTS = 24;
  export interface InstallmentInput { number: number; dueDate: string /* AAAA-MM-DD */; amount: number }
  export type InstallmentStatus = "PAID" | "PARTIAL" | "OVERDUE" | "OPEN";
  export interface InstallmentView extends InstallmentInput { paid: number; remaining: number; status: InstallmentStatus }

  export function addMonthsClamped(date: string, months: number): string;
  export function defaultFirstDueDate(now?: Date): string;                 // todayInput(now) + 30 dias
  export function splitAmounts(total: number, count: number): number[];  // centavos que sobram na 1ª
  export function buildInstallments(total: number, count: number, firstDueDate: string): InstallmentInput[];
  export function resplitInstallments(current: InstallmentInput[], total: number): InstallmentInput[]; // mantém datas
  export function validateInstallments(raw: unknown, total: number):
    { ok: true; data: InstallmentInput[] } | { ok: false; error: string };
  export function allocateInstallments(
    installments: InstallmentInput[], totalPaid: number, today: string, canceled: boolean,
  ): InstallmentView[];
  export function suggestedPaymentAmount(views: InstallmentView[]): number | null; // remaining da 1ª não quitada
  ```
  Regras de `allocateInstallments`:
  - Ordena por `number` e distribui `totalPaid` em sequência.
  - `remaining <= 0` → `PAID`.
  - `paid > 0` e `remaining > 0` → `PARTIAL`, ou `OVERDUE` se a data passou.
  - Não quitada com `dueDate < today` e pedido não cancelado → `OVERDUE`.
  - Demais → `OPEN`. Pedido cancelado nunca dá `OVERDUE`.

- [ ] **Step 1: Escrever os testes** (cada linha vira um `it` com nome próprio):
  - `splitAmounts(100, 3)` → `[33.34, 33.33, 33.33]`; `splitAmounts(0.05, 2)` → `[0.03, 0.02]`; `splitAmounts(250, 2)` → `[125, 125]`; soma sempre = total.
  - `addMonthsClamped("2026-01-31", 1)` → `"2026-02-28"`; `("2028-01-31", 1)` → `"2028-02-29"`; `("2026-11-30", 1)` → `"2026-12-30"`; `("2026-12-15", 1)` → `"2027-01-15"`; `("2026-01-31", 2)` → `"2026-03-31"`.
  - `buildInstallments(300, 3, "2026-12-20")` → números 1..3, datas `2026-12-20`, `2027-01-20`, `2027-02-20`, valores 100 cada.
  - `resplitInstallments` com 3 parcelas de datas diferentes e total novo 200 → mesmas datas, valores `[66.68, 66.66, 66.66]`.
  - `defaultFirstDueDate(new Date("2026-11-20T15:00:00-03:00"))` → `"2026-12-20"`.
  - `validateInstallments`:
    - aceita a saída de `buildInstallments`;
    - recusa 1 parcela, 25 parcelas, número fora de sequência, data `"2026-02-30"`, valor `0`, valor negativo e JSON que não é lista;
    - recusa soma diferente do total (`"As parcelas somam R$ 290,00, mas o total é R$ 300,00."`);
    - aceita diferença de R$ 0,01.
  - `allocateInstallments` (3×100 com vencimentos `2026-12-20`, `2027-01-20` e `2027-02-20`; today `"2027-01-25"`):
    - totalPaid 0 → `OVERDUE, OVERDUE, OPEN`;
    - 100 → `PAID, OVERDUE, OPEN`;
    - 150 → `PAID, OVERDUE` com remaining 50 e paid 50, `OPEN`;
    - 300 → todas `PAID`;
    - `canceled=true` com 0 → `OPEN, OPEN, OPEN`.
    - **Estorno:** o mesmo pedido com totalPaid 200 e depois 100 → a 2ª volta de `PAID` para `OVERDUE`.
  - `suggestedPaymentAmount` com 150 pagos → `50`; com tudo pago → `null`.
- [ ] **Step 2:** `npx vitest run src/lib/installments.test.ts` → FAIL
- [ ] **Step 3:** Implementar. Fazer as contas em centavos inteiros e converter só no fim. Validar a data por ida e volta (`new Date(s+"T00:00:00Z").toISOString().slice(0,10) === s`).
- [ ] **Step 4:** rodar → PASS
- [ ] **Step 5:** Commit `wip(installments): installment rules`

### Task 6: Tabela de parcelas e gravação nas actions

**Files:**
- Modify: `prisma/schema.prisma`: model `OrderInstallment` exatamente como no spec, seção 3 "Banco", e `installments OrderInstallment[]` em `Order`.
- Modify: `src/app/admin/sales/actions.ts` (`createOrder`, `parseOrderForm`/`ParsedOrderForm`, `updateOrder`)

**Interfaces:**
- Consumes: `validateInstallments`, `InstallmentInput` (Task 5).
- Produces:
  - Campos de formulário: `installments` (JSON de `InstallmentInput[]`, ausente ou `"[]"` = venda sem parcelas) e `paid` (no modo parcelado, `"true"` = entrada da 1ª parcela).
  - Helper exportado de `src/lib/installments.ts`: `export function toDbDate(s: string): Date` e `export function fromDbDate(d: Date): string`.

- [ ] **Step 1:** Schema + `npx prisma db push` (dev) + `npx prisma generate`; o `migrate diff` contra o dev dá migração vazia.
- [ ] **Step 2:** Testes de `toDbDate`/`fromDbDate` em `installments.test.ts` (ida e volta `"2027-02-28"`) → FAIL → implementar → PASS.
- [ ] **Step 3: `createOrder`:**
  - Ler `installments`. Se vier lista não vazia, `validateInstallments(raw, totalAmount)`; erro → `{ error }`.
  - Na transação, `order.create` ganha `installments: { create: data.map(i => ({ number, dueDate: toDbDate(i.dueDate), amount: i.amount })) }`.
  - **Modo parcelado com `paid=true`:**
    - status `PENDING`;
    - payment com `amount = data[0].amount`, `method = paymentMethod` e `paidAt` agora, substituindo o pagamento do valor cheio;
    - status = `statusAfterPayments("PENDING", paymentBalance(total, [{ amount: data[0].amount }]))`.
  - **Sem parcelas:** comportamento atual intacto.
- [ ] **Step 4: `updateOrder`:**
  - `parseOrderForm` valida `installments` contra `parsed.totalAmount`.
  - Na transação: `orderInstallment.deleteMany({ where: { orderId } })` e, se houver parcelas, `createMany`.
  - As baixas não são tocadas, e a regra "novo total menor que o já recebido" continua.
- [ ] **Step 5:** `npm run typecheck` e `npm test` → verdes. Commit `wip(installments): OrderInstallment table and order actions`.

### Task 7: Bloco de parcelas no formulário de venda

**Files:**
- Create: `src/app/admin/sales/new/InstallmentsEditor.tsx` (client)
- Create: `src/app/admin/sales/new/draft.ts` (leitura tolerante do rascunho)
- Test: `src/app/admin/sales/new/draft.test.ts`
- Modify: `src/app/admin/sales/new/OrderForm.tsx` (seção 3, linhas ~619–664; envio ~290–320; resumo ~775–790; `Draft`; `EditableOrder`)
- Modify: `src/app/admin/sales/[id]/edit/page.tsx` (carrega `installments` ordenadas por `number` → `EditableOrder.installments: InstallmentInput[]` via `fromDbDate`)
- Modify: `src/app/admin/sales/new/OrderSuccess.tsx` (`SuccessSnapshot.installments?: { count: number; amount: number }`; mensagem "Pagamento: Pix, 3x de R$ 100,00 (1ª recebida)")

**Interfaces:**
- Consumes: `buildInstallments`, `resplitInstallments`, `defaultFirstDueDate`, `validateInstallments`, `MIN/MAX_INSTALLMENTS`, `InstallmentInput` (Task 5).
- Produces:
  - `InstallmentsEditor` props: `{ total: number; value: InstallmentInput[]; onChange(next: InstallmentInput[]): void }`. Lista vazia = não parcelado.
  - `export function readDraftExtras(raw: unknown): { resellerName: string; installments: InstallmentInput[] }` em `draft.ts`.

- [ ] **Step 1: Testes de `readDraftExtras`:**
  - rascunho antigo `{ lines: [], paid: true }` → `{ resellerName: "", installments: [] }`;
  - rascunho com `installments` válidas → mantidas;
  - com `installments` corrompidas (`"x"`, `[{}]`) → `[]`.

  Rodar → FAIL → implementar → PASS. O `OrderForm` passa a ler `resellerName` do rascunho por esta função; trocar o que a Task 4 tiver feito.
- [ ] **Step 2: `InstallmentsEditor`:**
  - `ChoiceChips` **"Parcelado?"** com as opções `Não`/`Sim`.
  - **Com Sim:**
    - campo número **"Quantas parcelas"** (2–24, padrão 2);
    - campo data **"1º vencimento"** (padrão `defaultFirstDueDate()`).
    - Mudar quantidade ou 1º vencimento → `buildInstallments(total, n, first)`.
    - Lista de parcelas, cada uma com `input type="date"` e valor (`parseBRL`/`toBRLInput`) editáveis.
    - Rodapé: "Soma: R$ X — falta/sobra R$ Y" quando a soma ≠ total, em âmbar.
  - **Com Não:** `onChange([])`.
  - **Total muda com parcelas ativas:** `onChange(resplitInstallments(value, total))`, num efeito que compara o total anterior em centavos.
  - Acessível: `fieldset`/`legend`, labels "Vencimento da parcela N" e "Valor da parcela N".
- [ ] **Step 3: `OrderForm`:**
  - estado `installments`, que entra no `Draft` e no `touch()`;
  - editor logo abaixo da forma de pagamento;
  - **parcelado + venda nova:** o checkbox de pagamento mostra **"A 1ª parcela já foi paga (entrada)"** com a dica "Registra o valor da 1ª parcela como recebido hoje.";
  - envio: `formData.append("installments", JSON.stringify(installments))`, inclusive na edição;
  - `missing` ganha "As parcelas precisam somar o total do pedido." quando `installments.length > 0` e `validateInstallments` falha;
  - resumo lateral: "Pagamento: Pix · 3x de R$ 100,00";
  - snapshot de sucesso preenche `installments`.
- [ ] **Step 4:** `npm run typecheck`, `npm run lint`, `npm test` → verdes. Commit `wip(installments): installments editor in order form`.

### Task 8: Parcelas na tela do pedido + e2e

**Files:**
- Create: `src/components/admin/sales/InstallmentsList.tsx` (server component, só exibe)
- Modify: `src/app/admin/sales/[id]/page.tsx` (include `installments: { orderBy: { number: "asc" } }`; calcula as views; renderiza acima do `PaymentsCard`)
- Modify: `src/components/admin/sales/PaymentsCard.tsx` (prop opcional `suggestedAmount?: number`; `openForm` usa ela no lugar de `remaining` quando vier)
- Test: `e2e/admin-sales-installments.spec.ts`

**Interfaces:**
- Consumes: `allocateInstallments`, `suggestedPaymentAmount`, `fromDbDate`, `InstallmentView` (Task 5); `todayInput` (finance).
- Produces: `InstallmentsList` props `{ views: InstallmentView[]; canceled: boolean }`.

- [ ] **Step 1: Escrever o e2e:**
  - Admin cria uma venda nova com o produto da fixture (`E2E_PRICE` 99,90 × 3 unidades = 299,70), cliente de teste, **Parcelado: Sim**, 3 parcelas, 1º vencimento com a data padrão e **"A 1ª parcela já foi paga (entrada)"** marcada.
  - Banco: 3 `OrderInstallment` com valores `[99.90, 99.90, 99.90]`, 1 `OrderPayment` de 99.90 e pedido `PENDING`.
  - Na tela do pedido: título "Parcelas (3x de R$ 99,90)"; parcela 1 "Paga"; 2 e 3 "Em aberto".
  - Registrar recebimento: o campo de valor vem preenchido com "99,90" → salvar → parcela 2 "Paga".
  - Pela fixture no banco, mudar o vencimento da parcela 3 para ontem e recarregar → "Atrasada".
  - Excluir o último recebimento (estorno) → parcela 2 volta a "Em aberto".
  - **Edição:** abrir `/admin/sales/<id>/edit`, conferir que as 3 parcelas vêm preenchidas e salvar sem mudar nada → continuam 3 parcelas.
  - Estoque A da fixture (3) dá para as 3 unidades. Se faltar, ajustar `E2E_STOCK_A` só neste spec, criando a variação com mais estoque.
- [ ] **Step 2:** rodar → FAIL
- [ ] **Step 3: `InstallmentsList`:**
  - título "Parcelas (Nx de R$ V)". Com valores diferentes: "Parcelas (Nx)".
  - Cada linha: "N/T", vencimento (`formatDate`), valor e selo de situação:
    - **Paga:** verde;
    - **Parcial:** "faltam R$ X";
    - **Atrasada:** âmbar/vermelho;
    - **Em aberto:** neutro.
  - Pedido cancelado → todos os selos neutros.
  - No celular a lista empilha sem rolagem horizontal.
- [ ] **Step 4: `page.tsx`:**
  - `views = allocateInstallments(order.installments.map(...fromDbDate...), balance.paid, todayInput(), order.status === "CANCELED")`;
  - renderizar `InstallmentsList` só quando houver parcelas;
  - passar `suggestedAmount={suggestedPaymentAmount(views) ?? undefined}` ao `PaymentsCard`.
- [ ] **Step 5:** rodar o e2e → PASS; **verificação completa** → verde
- [ ] **Step 6:** Commit `Aurora-v1.9.2 feat: installment sales with due dates and per-installment status`
- [ ] **Step 7: Publicar**, como na Task 4, Step 9. O `migrate diff` contra a produção deve mostrar **só** `CREATE TABLE "OrderInstallment"`, a chave estrangeira, o índice único e o índice de `dueDate`. Depois `db push` em produção, ok do Alexandre, `git push`, deploy READY e conferir erros.
