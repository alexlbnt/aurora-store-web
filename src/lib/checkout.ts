// Regras do pedido feito pelo site, sem acesso ao banco: dá para testar isoladamente.
// A action do checkout (src/app/checkout/actions.ts) lê o banco e aplica estas regras.

export type StockLocation = "ESTOQUE_A" | "ESTOQUE_V";

/** Ordem de preferência quando os dois estoques conseguem atender o pedido inteiro. */
export const LOCATION_PRIORITY: StockLocation[] = ["ESTOQUE_A", "ESTOQUE_V"];

export const LOCATION_LABEL: Record<StockLocation, string> = {
  ESTOQUE_A: "Estoque A",
  ESTOQUE_V: "Estoque V",
};

/** Pedidos do site começam com este prefixo; os lançados no painel usam "PED-". */
export const SITE_ORDER_PREFIX = "AUR-";

/** Pedido do site pendente e sem nenhuma alteração há mais que isso é cancelado e libera o estoque. */
export const STALE_SITE_ORDER_DAYS = 7;

/** Limite de pedidos pendentes do site por telefone nas últimas 24 horas (contra robôs e cliques repetidos). */
export const MAX_PENDING_SITE_ORDERS_PER_PHONE = 3;

export const MAX_CART_LINES = 30;
export const MAX_QTY_PER_LINE = 20;

/** Nome do campo escondido que pessoas não veem nem preenchem; robôs costumam preencher. */
export const HONEYPOT_FIELD = "website";

// ---------------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------------

export interface CartLine {
  /** Identificador da linha no carrinho do navegador (produto-cor-tamanho). */
  id: string;
  productId: string;
  color: string;
  size: string;
  qty: number;
  /** Preço que o cliente viu. Só serve para avisar se mudou; o valor cobrado vem do banco. */
  clientPrice: number | null;
}

const text = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida o carrinho enviado pelo navegador. Nunca confia em preço ou nome vindos dele. */
export function parseCartLines(raw: unknown): { lines: CartLine[] } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Seu carrinho está vazio." };
  if (raw.length > MAX_CART_LINES) {
    return { error: `O pedido pelo site aceita até ${MAX_CART_LINES} itens diferentes. Para mais, fale com a equipe.` };
  }

  const merged = new Map<string, CartLine>();
  for (const item of raw) {
    if (!item || typeof item !== "object") return { error: "Não foi possível ler o carrinho. Atualize a página." };
    const r = item as Record<string, unknown>;
    const productId = text(r.productId);
    const color = text(r.color);
    const size = text(r.size);
    const qty = Number(r.qty);
    if (!productId || !color || !size || !Number.isInteger(qty) || qty < 1) {
      return { error: "Há um item inválido na sacola. Remova-o e adicione de novo." };
    }
    const price = Number(r.numericPrice);
    const key = `${productId}|${color}|${size}`;
    const existing = merged.get(key);
    if (existing) {
      existing.qty += qty;
    } else {
      merged.set(key, {
        id: text(r.id, 300) || `${productId}-${color}-${size}`,
        productId,
        color,
        size,
        qty,
        clientPrice: Number.isFinite(price) ? price : null,
      });
    }
  }

  for (const line of merged.values()) {
    if (line.qty > MAX_QTY_PER_LINE) {
      return { error: `O pedido pelo site aceita até ${MAX_QTY_PER_LINE} unidades da mesma peça. Para mais, fale com a equipe.` };
    }
  }
  return { lines: [...merged.values()] };
}

// ---------------------------------------------------------------------------
// Preço
// ---------------------------------------------------------------------------

/** Converte reais para centavos inteiros, evitando erro de arredondamento nas somas. */
export const toCents = (value: number) => Math.round(value * 100);

/** Preço cobrado: o da variação, quando cadastrado; senão o preço base do produto. */
export function unitPriceCents(variantPrice: number | null | undefined, basePrice: number): number {
  return toCents(variantPrice ?? basePrice);
}

/** O preço que o cliente viu difere do preço atual? (tolerância de meio centavo) */
export function priceChanged(clientPrice: number | null, currentCents: number): boolean {
  if (clientPrice === null) return true;
  return Math.abs(toCents(clientPrice) - currentCents) >= 1;
}

// ---------------------------------------------------------------------------
// Divisão entre os estoques A e V
// ---------------------------------------------------------------------------

export interface StockLine {
  key: string;
  qty: number;
  stockA: number;
  stockV: number;
  /** false = produto sem variações cadastradas: não há estoque para conferir nem baixar. */
  tracked: boolean;
}

export interface AllocatedLine {
  key: string;
  qty: number;
}

export type Allocation =
  | { ok: true; byLocation: Partial<Record<StockLocation, AllocatedLine[]>> }
  | { ok: false; shortages: { key: string; requested: number; available: number }[] };

const stockAt = (line: StockLine, loc: StockLocation) => (loc === "ESTOQUE_A" ? line.stockA : line.stockV);

/**
 * Decide de qual estoque sai cada peça.
 * 1. Se um estoque sozinho atende tudo, o pedido inteiro sai dele (preferência: A, depois V).
 * 2. Se não, cada peça sai inteira do estoque que a tiver (A primeiro); se nenhum tiver a
 *    quantidade toda, divide: o máximo do A e o resto do V.
 * O resultado vira um pedido por estoque, porque no painel cada pedido pertence a um estoque
 * (cancelar, excluir e editar devolvem as peças ao estoque do pedido).
 */
export function allocateStock(lines: StockLine[]): Allocation {
  const shortages = lines
    .filter((l) => l.tracked && l.stockA + l.stockV < l.qty)
    .map((l) => ({ key: l.key, requested: l.qty, available: Math.max(0, l.stockA) + Math.max(0, l.stockV) }));
  if (shortages.length > 0) return { ok: false, shortages };

  const tracked = lines.filter((l) => l.tracked);
  const untracked = lines.filter((l) => !l.tracked);
  const byLocation: Partial<Record<StockLocation, AllocatedLine[]>> = {};
  const push = (loc: StockLocation, key: string, qty: number) => {
    if (qty <= 0) return;
    (byLocation[loc] ??= []).push({ key, qty });
  };

  const single = LOCATION_PRIORITY.find((loc) => tracked.every((l) => stockAt(l, loc) >= l.qty));
  if (single) {
    for (const l of tracked) push(single, l.key, l.qty);
  } else {
    const [first, second] = LOCATION_PRIORITY;
    for (const l of tracked) {
      if (stockAt(l, first) >= l.qty) push(first, l.key, l.qty);
      else if (stockAt(l, second) >= l.qty) push(second, l.key, l.qty);
      else {
        const fromFirst = Math.max(0, stockAt(l, first));
        push(first, l.key, fromFirst);
        push(second, l.key, l.qty - fromFirst);
      }
    }
  }

  // Peças sem controle de estoque acompanham o primeiro pedido criado.
  const home = LOCATION_PRIORITY.find((loc) => byLocation[loc]?.length) ?? LOCATION_PRIORITY[0];
  for (const l of untracked) push(home, l.key, l.qty);

  return { ok: true, byLocation };
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export type CustomerDecision =
  /** Cliente logado: usa (ou cria) o cadastro do e-mail da conta e atualiza contato/endereço. */
  | "session"
  /** E-mail informado pertence a uma conta: precisa entrar para usar esse e-mail. */
  | "login-required"
  /** Visitante com e-mail sem conta: vincula ao cadastro desse e-mail, sem alterar os dados dele. */
  | "by-email"
  /** Visitante sem e-mail: vincula ao cadastro sem e-mail com o mesmo telefone, ou cria um novo. */
  | "by-phone";

/**
 * Quem é o cliente do pedido. Visitante nunca altera os dados de um cadastro existente:
 * o endereço de entrega fica gravado no próprio pedido.
 */
export function decideCustomer(input: {
  sessionEmail: string | null;
  formEmail: string | null;
  formEmailHasAccount: boolean;
}): CustomerDecision {
  if (input.sessionEmail) return "session";
  if (input.formEmail) return input.formEmailHasAccount ? "login-required" : "by-email";
  return "by-phone";
}

// ---------------------------------------------------------------------------
// Diversos
// ---------------------------------------------------------------------------

/** Número do pedido do site: AUR- seguido de 6 dígitos. Repetição é tratada por nova tentativa. */
export function generateSiteOrderNumber(randomInt: (min: number, max: number) => number): string {
  return `${SITE_ORDER_PREFIX}${randomInt(100000, 1000000)}`;
}

/** true quando o campo escondido veio preenchido (sinal de robô). */
export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function appendNote(current: string | null, note: string): string {
  return current?.trim() ? `${current.trim()}\n${note}` : note;
}
