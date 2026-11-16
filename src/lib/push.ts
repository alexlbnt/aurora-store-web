import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { newOrderPayload, wantsLocation, type NewOrderInfo } from "@/lib/push-message";

/** Chave pública que o navegador usa para se inscrever. null se os avisos não estiverem configurados. */
export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

let configured: boolean | null = null;
function configure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:auroraadm25@gmail.com";
  configured = !!(pub && priv);
  if (configured) webpush.setVapidDetails(subject, pub!, priv!);
  return configured;
}

/**
 * Avisa os aparelhos do painel sobre pedidos novos do site.
 * Nunca lança erro: um aviso que falha não pode atrapalhar o pedido do cliente.
 * Aparelhos que cancelaram a inscrição (resposta 404/410) são removidos.
 */
export async function notifyNewSiteOrders(
  orders: NewOrderInfo[],
  opts: { onlyEndpoint?: string } = {}
): Promise<void> {
  try {
    if (orders.length === 0 || !configure()) return;
    const subs = await prisma.pushSubscription.findMany(
      opts.onlyEndpoint ? { where: { endpoint: opts.onlyEndpoint } } : undefined
    );
    if (subs.length === 0) return;

    const gone: string[] = [];
    await Promise.all(
      orders.flatMap((order) => {
        const payload = JSON.stringify(newOrderPayload(order));
        return subs
          .filter((s) => wantsLocation(s.location, order.stockLocation))
          .map((s) =>
            webpush
              .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
                TTL: 60 * 60 * 24,
                urgency: "high",
              })
              .catch((err: { statusCode?: number }) => {
                if (err?.statusCode === 404 || err?.statusCode === 410) gone.push(s.endpoint);
                else console.error("Falha ao enviar aviso de pedido:", err?.statusCode ?? err);
              })
          );
      })
    );

    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } });
  } catch (e) {
    console.error("Falha nos avisos de pedido novo:", e);
  }
}
