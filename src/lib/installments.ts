// Venda parcelada: as parcelas guardam só número, vencimento e valor. Se cada uma está paga, parcial,
// atrasada ou em aberto é calculado aqui, distribuindo o total das baixas (OrderPayment) da 1ª para a
// última. Assim um estorno ou uma edição corrigem as parcelas sozinhos. Testado em installments.test.ts.
import { todayInput } from "./finance";

export const MIN_INSTALLMENTS = 2;
export const MAX_INSTALLMENTS = 24;

export interface InstallmentInput {
  number: number;
  /** "AAAA-MM-DD" */
  dueDate: string;
  amount: number;
}

export type InstallmentStatus = "PAID" | "PARTIAL" | "OVERDUE" | "OPEN";

export interface InstallmentView extends InstallmentInput {
  paid: number;
  remaining: number;
  status: InstallmentStatus;
}

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;
const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (s: unknown): s is string =>
  typeof s === "string" && DATE_RE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/** "2026-01-31" + 1 mês = "2026-02-28": dia que não existe vira o último dia do mês. */
export function addMonthsClamped(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const monthIndex = m - 1 + months;
  const year = y + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/** Hoje (Brasília) + 30 dias. */
export function defaultFirstDueDate(now = new Date()): string {
  const today = new Date(`${todayInput(now)}T00:00:00Z`);
  return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Partes iguais; os centavos que sobram ficam na 1ª. */
export function splitAmounts(total: number, count: number): number[] {
  const cents = toCents(total);
  const base = Math.floor(cents / count);
  return Array.from({ length: count }, (_, i) => fromCents(i === 0 ? cents - base * (count - 1) : base));
}

export function buildInstallments(total: number, count: number, firstDueDate: string): InstallmentInput[] {
  return splitAmounts(total, count).map((amount, i) => ({
    number: i + 1,
    dueDate: addMonthsClamped(firstDueDate, i),
    amount,
  }));
}

/** Total do pedido mudou: valores iguais de novo, datas mantidas. */
export function resplitInstallments(current: InstallmentInput[], total: number): InstallmentInput[] {
  const amounts = splitAmounts(total, current.length);
  return current.map((inst, i) => ({ ...inst, amount: amounts[i] }));
}

/** Confere as parcelas enviadas pelo formulário contra o total calculado no servidor. */
export function validateInstallments(
  raw: unknown,
  total: number,
  opts: { exact?: boolean } = {},
): { ok: true; data: InstallmentInput[] } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!Array.isArray(raw)) return fail("Não foi possível ler as parcelas. Recarregue a página e tente de novo.");
  if (raw.length < MIN_INSTALLMENTS || raw.length > MAX_INSTALLMENTS) {
    return fail(`O parcelamento precisa ter de ${MIN_INSTALLMENTS} a ${MAX_INSTALLMENTS} parcelas.`);
  }
  const data: InstallmentInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Partial<InstallmentInput> | null;
    if (!item || item.number !== i + 1) return fail("As parcelas estão fora de ordem. Recarregue a página e tente de novo.");
    if (!isValidDate(item.dueDate)) return fail(`Confira o vencimento da parcela ${i + 1}.`);
    if (typeof item.amount !== "number" || !Number.isFinite(item.amount) || toCents(item.amount) <= 0) {
      return fail(`Confira o valor da parcela ${i + 1}.`);
    }
    data.push({ number: item.number, dueDate: item.dueDate, amount: fromCents(toCents(item.amount)) });
  }
  // O formulário exige soma exata. O servidor tolera 1 centavo de arredondamento e o põe na 1ª parcela,
  // para que o que fica gravado sempre feche com o total do pedido.
  const sumCents = data.reduce((acc, d) => acc + toCents(d.amount), 0);
  const diffCents = toCents(total) - sumCents;
  if (Math.abs(diffCents) > (opts.exact ? 0 : 1)) {
    return fail(`As parcelas somam ${brl(fromCents(sumCents))}, mas o total é ${brl(total)}.`);
  }
  if (diffCents !== 0) data[0] = { ...data[0], amount: fromCents(toCents(data[0].amount) + diffCents) };
  return { ok: true, data };
}

/**
 * Distribui o total já recebido da 1ª para a última parcela.
 * Atrasada = vencimento antes de hoje e não quitada (nunca em pedido cancelado).
 */
export function allocateInstallments(
  installments: InstallmentInput[],
  totalPaid: number,
  today: string,
  canceled: boolean,
): InstallmentView[] {
  let leftCents = Math.max(0, toCents(totalPaid));
  return [...installments]
    .sort((a, b) => a.number - b.number)
    .map((inst) => {
      const amountCents = toCents(inst.amount);
      const paidCents = Math.min(leftCents, amountCents);
      leftCents -= paidCents;
      const remainingCents = amountCents - paidCents;
      let status: InstallmentStatus;
      if (remainingCents <= 0) status = "PAID";
      else if (!canceled && inst.dueDate < today) status = "OVERDUE";
      else if (paidCents > 0) status = "PARTIAL";
      else status = "OPEN";
      return { ...inst, paid: fromCents(paidCents), remaining: fromCents(remainingCents), status };
    });
}

/** O que falta da parcela mais antiga ainda não quitada (nunca mais que o restante do pedido), ou null. */
export function suggestedPaymentAmount(views: InstallmentView[], orderRemaining?: number): number | null {
  const next = views.find((v) => v.remaining > 0)?.remaining;
  if (next === undefined) return null;
  return orderRemaining === undefined ? next : Math.min(next, orderRemaining);
}

/** "AAAA-MM-DD" → Date para a coluna @db.Date (meia-noite UTC, sem fuso). */
export const toDbDate = (s: string): Date => new Date(`${s}T00:00:00Z`);

/** Date lida de uma coluna @db.Date → "AAAA-MM-DD". */
export const fromDbDate = (d: Date): string => d.toISOString().slice(0, 10);

/** "3x de R$ 100,00" quando as parcelas são iguais; "3x" quando os valores diferem. */
export function installmentsLabel(installments: InstallmentInput[]): string {
  const n = installments.length;
  const first = installments[0]?.amount;
  const allEqual = installments.every((i) => toCents(i.amount) === toCents(first ?? 0));
  return allEqual && first !== undefined ? `${n}x de ${brl(first)}` : `${n}x`;
}
