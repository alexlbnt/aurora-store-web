// Formatadores compartilhados. Datas sempre no fuso de Brasília: com UTC, um pedido feito
// às 22h em Goiânia aparecia no dia seguinte.
const TZ = "America/Sao_Paulo";

export function formatBRL(value: number | string | { toString(): string } | null | undefined): string {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: TZ });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
}

/**
 * Lê um valor digitado em reais ("389,90", "R$ 1.234,50", "389.90"). Retorna NaN se não der.
 * Campos de valor usam texto com teclado decimal: `type="number"` recusa a vírgula em
 * muitos teclados brasileiros.
 */
export function parseBRL(input: string): number {
  const s = (input ?? "").replace(/[^\d,.-]/g, "");
  if (!s) return NaN;
  return s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
}

/** Número para o formato de campo ("389,90"), sem o "R$". */
export function toBRLInput(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2).replace(".", ",") : "";
}

/** Link do WhatsApp para um telefone brasileiro (aceita com ou sem DDI 55). */
export function whatsappToCustomer(phone: string | null | undefined, message?: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
