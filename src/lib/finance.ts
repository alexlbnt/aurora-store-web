// Regras do financeiro (recebimentos e fechamento do mês). Funções puras, testadas em finance.test.ts.
// Datas no fuso de Brasília (UTC-3, sem horário de verão desde 2019): um pagamento das 22h do
// dia 31 pertence a esse mês, não ao seguinte.

const BR_OFFSET = "-03:00";

/** Arredonda para centavos, evitando 0,1 + 0,2 = 0,30000000000000004. */
export const roundMoney = (n: number) => Math.round(n * 100) / 100;

/** "2026-11" do momento informado, no fuso de Brasília. */
export function monthKeyOf(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

/** Aceita "AAAA-MM" válido; qualquer outra coisa vira o mês atual. */
export function normalizeMonthKey(raw: string | null | undefined, now = new Date()): string {
  if (raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw;
  return monthKeyOf(now);
}

/** Início (inclusivo) e fim (exclusivo) do mês, em instantes UTC. */
export function monthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    start: new Date(`${monthKey}-01T00:00:00${BR_OFFSET}`),
    end: new Date(`${next}-01T00:00:00${BR_OFFSET}`),
  };
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
}

/**
 * Data de um campo `<input type="date">` ("2026-11-16") como meio-dia em Brasília.
 * Meio-dia evita que a data "pule" de dia ao ser exibida em outro fuso.
 */
export function parseDateInput(raw: string | null | undefined): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00${BR_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-11-16" de hoje em Brasília, para o valor padrão dos campos de data. */
export function todayInput(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export interface PaymentBalance {
  total: number;
  paid: number;
  remaining: number;
  isSettled: boolean;
}

export function paymentBalance(total: number, payments: { amount: number }[]): PaymentBalance {
  const paid = roundMoney(payments.reduce((acc, p) => acc + p.amount, 0));
  const remaining = roundMoney(Math.max(0, total - paid));
  return { total: roundMoney(total), paid, remaining, isSettled: remaining <= 0 };
}

type Status = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

/**
 * Status depois de um recebimento entrar ou sair. Só mexe entre Pendente e Pago:
 * Enviado, Entregue e Cancelado são decisões da vendedora e não mudam sozinhos.
 */
export function statusAfterPayments(status: Status, balance: PaymentBalance): Status {
  if (status === "PENDING" && balance.isSettled) return "PAID";
  if (status === "PAID" && !balance.isSettled) return "PENDING";
  return status;
}

/** Confere um novo recebimento. Retorna a mensagem de erro, ou null se estiver tudo certo. */
export function validatePaymentAmount(amount: number, remaining: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Informe o valor recebido.";
  if (roundMoney(amount) > roundMoney(remaining)) {
    return `O valor passa do que falta receber (${remaining.toFixed(2).replace(".", ",")}).`;
  }
  return null;
}

/**
 * Total do pedido já em centavos. Tela e servidor usam a mesma conta, e o banco (Decimal 10,2)
 * guarda exatamente esse valor: sem isso, 45.504999… podia virar 45,51 na tela e 45,50 no banco.
 */
export const orderTotal = (subtotal: number, discountAmount: number) => roundMoney(Math.max(0, subtotal - discountAmount));
