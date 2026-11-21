# Produzido automático — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O estoque do cadastro de produto vira lançamento de produção, e um script de uso único preenche o produzido dos produtos existentes com estoque + vendido.

**Architecture:** As contas ficam em funções puras em `src/lib/production-seed.ts`, testadas com Vitest. O `createProduct` e o script `scripts/backfill-production.ts` só chamam essas funções e gravam `ProductionEntry` **sem** mexer no estoque.

**Tech Stack:** Next.js 16.4 (server actions), Prisma 6, Vitest, Playwright, tsx.

**Spec:** `docs/superpowers/specs/2026-11-21-produzido-automatico-design.md`

## Global Constraints
- Observações exatas: `"Estoque inicial do cadastro"` (cadastro) e `"Carga inicial (estoque + vendido)"` (script).
- Lançamentos com quantidade 0 não são criados. Nenhum caminho deste plano altera `stockA`/`stockV`.
- Vendido = soma de `OrderItem.quantity` de pedidos com `status != CANCELED`, no estoque `Order.stockLocation`.
- Data dos lançamentos: agora (cadastro) e `Product.createdAt` (script).
- O script, sem `--apply`, só mostra o que faria. Com `--apply`, pula produtos que já tenham qualquer `ProductionEntry`.
- Versão: commit final `Aurora-v1.9.4 feat: ...`, com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Sem mudança de schema. A carga em produção só acontece com o ok do Alexandre e com o endereço do banco informado por ele, nunca gravado em arquivo.

## Review Focus
1. Produto antigo com pedido de item sem variação (`variantId` nulo) → conta na variação, se ela for única; senão fica de fora e é listado. Teste na Task 1.
2. Variação com estoque zerado, mas com vendas → o produzido é igual ao vendido, e não zero. Teste na Task 1.
3. Pedido cancelado → não conta como vendido. Teste na Task 1.
4. Rodar o script duas vezes → a segunda não duplica nada. Verificação na Task 3.
5. Produto cadastrado sem variações (uma variação "Único / Padrão") → o lançamento entra nela. E2E na Task 2.

---

### Task 1: Contas da produção inicial

**Files:**
- Create: `src/lib/production-seed.ts`
- Test: `src/lib/production-seed.test.ts`

**Interfaces — Produces:**
```ts
export type StockLocation = "ESTOQUE_A" | "ESTOQUE_V";
export interface VariantStock { id: string; stockA: number; stockV: number }
export interface SoldLine { variantId: string | null; stockLocation: StockLocation; quantity: number }
export interface SeedEntry { variantId: string; stockLocation: StockLocation; quantity: number }
export const INITIAL_STOCK_NOTE = "Estoque inicial do cadastro";
export const BACKFILL_NOTE = "Carga inicial (estoque + vendido)";
export function initialStockEntries(variants: VariantStock[]): SeedEntry[];
export function backfillEntries(variants: VariantStock[], sold: SoldLine[]): { entries: SeedEntry[]; unattributed: number };
```
Ordem de saída: na ordem das variações, primeiro `ESTOQUE_A` e depois `ESTOQUE_V`.

- [ ] **Step 1:** Escrever os testes:
  - `initialStockEntries([{id:"v1",stockA:5,stockV:3},{id:"v2",stockA:0,stockV:2}])` → `[{v1,A,5},{v1,V,3},{v2,V,2}]`.
  - Tudo zero → `[]`.
  - `backfillEntries([{id:"v1",stockA:12,stockV:22}], [{variantId:"v1",stockLocation:"ESTOQUE_A",quantity:4},{variantId:"v1",stockLocation:"ESTOQUE_V",quantity:7}])` → entries `[{v1,A,16},{v1,V,29}]`, `unattributed: 0`.
  - Estoque zerado com vendas: `[{id:"v1",stockA:0,stockV:0}]` + vendido A 3 → `[{v1,A,3}]`.
  - Item sem variação, produto com 1 variação → soma nela. Com 2 variações → não soma, e `unattributed` = quantidade.
  - Item de variação que não está na lista → conta em `unattributed`.

  O "cancelado fora" é responsabilidade da consulta do script (Task 3), não desta função.
- [ ] **Step 2:** `npx vitest run src/lib/production-seed.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar → PASS.
- [ ] **Step 5:** Commit `wip(production): initial production seed rules`.

### Task 2: Cadastro de produto gera os lançamentos

**Files:**
- Modify: `src/app/admin/products/new/actions.ts` (o `prisma.product.create` em ~linha 91)
- Test: `e2e/admin-product-create.spec.ts`

**Interfaces — Consumes:** `initialStockEntries`, `INITIAL_STOCK_NOTE` (Task 1).

- [ ] **Step 1: E2E** (fixture e login como em `e2e/admin-products.spec.ts`):
  - Em `/admin/products/new`: nome `E2E Produto <runId>`, descrição, categoria da fixture, preço `50`.
  - Desligar "Produto com Variações". Estoque A `5`, estoque V `3`. Clicar em "Publicar Produto".
  - No banco:
    - variação única com `stockA=5`, `stockV=3`;
    - 2 `ProductionEntry` (A=5, V=3) com `notes = "Estoque inicial do cadastro"`;
    - soma 8.
  - Em `/admin/products?q=<nome>` aparece `8 / 0`.
  - A limpeza apaga o produto criado (os lançamentos saem em cascata).
  - Se algum campo do formulário for obrigatório e não estiver listado aqui, preencher o mínimo e registrar a decisão no ledger.
- [ ] **Step 2:** Rodar → FAIL (sem lançamentos).
- [ ] **Step 3:** Transformar a criação em `prisma.$transaction(async (tx) => …)`:
  - `tx.product.create({ …, include: { variants: { select: { id, stockA, stockV } } } })`;
  - em seguida, `tx.productionEntry.createMany` com `initialStockEntries(product.variants)`, mais `productId`, `notes: INITIAL_STOCK_NOTE` e `producedAt` = agora.
  - Sem `increment` de estoque.
- [ ] **Step 4:** Rodar o e2e → PASS. `npm run typecheck`, `npm run lint` e `npm test` → verdes.
- [ ] **Step 5:** Commit `wip(production): product creation records initial stock as produced`.

### Task 3: Script de carga inicial

**Files:**
- Create: `scripts/backfill-production.ts`. Cabeçalho de uso como em `scripts/backfill-payments.ts`: sem argumento só mostra; `--apply` grava.

**Interfaces — Consumes:** `backfillEntries`, `BACKFILL_NOTE` (Task 1).

- [ ] **Step 1: Implementar:**
  - Produtos com `productions: { none: {} }`, incluindo as variações. Contar e listar os pulados, que são os que já têm produção.
  - Vendido: `prisma.orderItem.findMany({ where: { productId: { in: ids }, order: { status: { not: "CANCELED" } } }, select: { productId, variantId, quantity, order: { select: { stockLocation: true } } } })`.
  - Por produto, `backfillEntries` → `createMany` com `productId`, `producedAt: product.createdAt` e `notes: BACKFILL_NOTE`, numa transação por produto.
  - Saída:
    - uma linha por produto: `nome — produzido A x / V y (estoque a/b + vendido c/d)`;
    - os itens sem variação que ficaram de fora;
    - os totais.
- [ ] **Step 2:** No banco de dev (o `.env`, schema `aurora_store`): `npx tsx scripts/backfill-production.ts` → lista os produtos e mostra "Nada gravado". Conferir um produto à mão contra o estoque e as vendas.
- [ ] **Step 3:** `npx tsx scripts/backfill-production.ts --apply` → grava. Rodar de novo com `--apply` → "0 produto(s)" e todos pulados (não duplica).
- [ ] **Step 4:** Verificação completa: `typecheck`, `lint`, `npm test`, `build`, `test:e2e` → verdes.
- [ ] **Step 5:** Commit `Aurora-v1.9.4 feat: produced count from product stock (new products and one-off backfill)`.
- [ ] **Step 6: Publicação** (só com o ok do Alexandre):
  1. `git push` e conferir o deploy.
  2. Cópia de segurança no Neon.
  3. `DATABASE_URL=<prod> npx tsx scripts/backfill-production.ts`: simulação, mostrar o resultado ao Alexandre.
  4. Com o ok dele, `--apply`.
  5. Conferir a lista de produtos e os erros.
