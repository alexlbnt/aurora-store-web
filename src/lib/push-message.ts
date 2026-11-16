// Texto e destino do aviso de pedido novo (sem dependência de banco, para poder testar).
import type { StockLocation } from "./checkout";
import { LOCATION_LABEL } from "./checkout";

export type NewOrderInfo = {
  id: string;
  orderNumber: string;
  stockLocation: StockLocation;
  totalCents: number;
  customerName: string;
  itemCount: number;
};

export type PushPayload = { title: string; body: string; url: string; tag: string };

export function newOrderPayload(o: NewOrderInfo): PushPayload {
  const total = `R$ ${(o.totalCents / 100).toFixed(2).replace(".", ",")}`;
  const firstName = o.customerName.trim().split(/\s+/)[0] || "Cliente";
  const pecas = o.itemCount === 1 ? "1 peça" : `${o.itemCount} peças`;
  return {
    title: `Pedido novo no site: ${o.orderNumber}`,
    body: `${firstName}, ${pecas}, ${total}. ${LOCATION_LABEL[o.stockLocation]}.`,
    url: `/admin/sales/${o.id}`,
    tag: `pedido-${o.orderNumber}`,
  };
}

/** O aparelho recebe o aviso se acompanha os dois estoques ou o estoque do pedido. */
export function wantsLocation(subscribed: StockLocation | null, orderLocation: StockLocation): boolean {
  return subscribed === null || subscribed === orderLocation;
}
