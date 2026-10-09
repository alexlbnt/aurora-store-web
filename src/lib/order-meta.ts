// Fonte única dos rótulos de pedido. Antes, o mapeamento de status estava copiado em cinco telas.
export type OrderStatusKey = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

export const ORDER_STATUS: Record<OrderStatusKey, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Pendente", badge: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  PAID: { label: "Pago", badge: "bg-dew/25 text-primary", dot: "bg-dew" },
  SHIPPED: { label: "Enviado", badge: "bg-accent-blue/15 text-accent-blue", dot: "bg-accent-blue" },
  DELIVERED: { label: "Entregue", badge: "bg-primary/10 text-primary", dot: "bg-primary/60" },
  CANCELED: { label: "Cancelado", badge: "bg-dawn/20 text-dawn-ink", dot: "bg-dawn-ink" },
};

export const ORDER_STATUS_OPTIONS = (Object.keys(ORDER_STATUS) as OrderStatusKey[]).map((value) => ({
  value,
  label: ORDER_STATUS[value].label,
}));

export const PAYMENT_LABEL: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
};

export const SHIPPING_LABEL: Record<string, string> = {
  SEM_FRETE: "Sem frete",
  PAGO_AURORA: "Aurora paga o frete",
  PAGO_CLIENTE: "Cliente paga o frete",
};

export const STOCK_LABEL: Record<string, string> = {
  ESTOQUE_A: "Estoque A",
  ESTOQUE_V: "Estoque V",
};
