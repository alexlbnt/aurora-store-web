// Cliente "sumido": comprou alguma vez, mas a última compra (não cancelada) foi há mais de 60 dias.
// Os dias são contados no calendário de Brasília. Funções puras, testadas em customer-activity.test.ts.
import { todayInput } from "./finance";

export const INACTIVE_CUSTOMER_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-11-20" → dias desde 1970, sem fuso (o dia já foi resolvido em Brasília). */
const dayNumber = (ymd: string) => Math.round(Date.parse(`${ymd}T00:00:00Z`) / DAY_MS);

/** Dias de calendário (em Brasília) entre a data e hoje. 0 = hoje; nunca negativo. */
export function daysSince(date: Date, now = new Date()): number {
  return Math.max(0, dayNumber(todayInput(now)) - dayNumber(todayInput(date)));
}

/** Início do dia (00:00 em Brasília) de 60 dias atrás. Compra antes disso = cliente sumido. */
export function inactiveCutoff(now = new Date()): Date {
  const cutoffDay = new Date((dayNumber(todayInput(now)) - INACTIVE_CUSTOMER_DAYS) * DAY_MS);
  return new Date(`${cutoffDay.toISOString().slice(0, 10)}T00:00:00-03:00`);
}

export function isInactive(lastPurchase: Date | null, now = new Date()): boolean {
  return lastPurchase !== null && daysSince(lastPurchase, now) > INACTIVE_CUSTOMER_DAYS;
}

export function lastPurchaseLabel(lastPurchase: Date | null, now = new Date()): string {
  if (!lastPurchase) return "Nunca comprou";
  const days = daysSince(lastPurchase, now);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}
