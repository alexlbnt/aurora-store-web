// Como o cliente vê o andamento do pedido em "Minha conta".
// No modelo da Aurora, o pedido do site não é pago na hora: a vendedora entra em contato
// para combinar pagamento e frete. Por isso "PENDING" é "recebido", não "aguardando pagamento".

export type OrderStatusCode = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

export const ORDER_STEPS = [
  { code: "PENDING", label: "Recebido" },
  { code: "PAID", label: "Pagamento confirmado" },
  { code: "SHIPPED", label: "Enviado" },
  { code: "DELIVERED", label: "Entregue" },
] as const;

export type CustomerStatus = {
  label: string;
  hint: string;
  tone: "amber" | "emerald" | "blue" | "rose" | "slate";
  /** Índice da etapa atual em ORDER_STEPS; -1 quando cancelado. */
  step: number;
};

export function customerOrderStatus(status: string): CustomerStatus {
  switch (status) {
    case "PENDING":
      return {
        label: "Pedido recebido",
        hint: "A vendedora vai falar com você pelo WhatsApp para combinar pagamento e entrega.",
        tone: "amber",
        step: 0,
      };
    case "PAID":
      return { label: "Pagamento confirmado", hint: "Estamos separando as suas peças.", tone: "emerald", step: 1 };
    case "SHIPPED":
      return { label: "Enviado", hint: "O pedido está a caminho.", tone: "blue", step: 2 };
    case "DELIVERED":
      return { label: "Entregue", hint: "Esperamos que você durma muito bem!", tone: "emerald", step: 3 };
    case "CANCELED":
      return { label: "Cancelado", hint: "Este pedido foi cancelado. Se tiver dúvida, fale com a equipe.", tone: "rose", step: -1 };
    default:
      return { label: "Em andamento", hint: "", tone: "slate", step: 0 };
  }
}

export function shippingLabel(type: string): string {
  switch (type) {
    case "PAGO_AURORA":
      return "Frete por conta da Aurora";
    case "PAGO_CLIENTE":
      return "Envio com frete pago por você";
    default:
      return "Entrega ou retirada, combinada com a vendedora";
  }
}
