"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyNewSiteOrders, vapidPublicKey } from "@/lib/push";

type Location = "ESTOQUE_A" | "ESTOQUE_V" | null;

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function validLocation(v: unknown): Location {
  return v === "ESTOQUE_A" || v === "ESTOQUE_V" ? v : null;
}

/** Inscreve (ou atualiza) este aparelho para receber aviso de pedido novo do site. */
export async function savePushSubscription(sub: SubscriptionInput, location: Location) {
  try {
    await requireAdmin();
    const session = await auth();
    const endpoint = String(sub?.endpoint || "");
    const p256dh = String(sub?.keys?.p256dh || "");
    const authKey = String(sub?.keys?.auth || "");
    if (!endpoint.startsWith("https://") || !p256dh || !authKey || endpoint.length > 1000) {
      return { success: false as const, error: "O navegador não enviou uma inscrição válida." };
    }
    const data = {
      p256dh,
      auth: authKey,
      userEmail: session?.user?.email ?? "admin",
      location: validLocation(location),
    };
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, ...data },
      update: data,
    });
    return { success: true as const };
  } catch (e) {
    console.error("Falha ao salvar inscrição de aviso:", e);
    return { success: false as const, error: "Não foi possível ativar os avisos. Tente de novo." };
  }
}

export async function removePushSubscription(endpoint: string) {
  try {
    await requireAdmin();
    await prisma.pushSubscription.deleteMany({ where: { endpoint: String(endpoint || "") } });
    return { success: true as const };
  } catch (e) {
    console.error("Falha ao remover inscrição de aviso:", e);
    return { success: false as const, error: "Não foi possível desativar os avisos." };
  }
}

/** Manda um aviso de teste só para este aparelho. */
export async function sendTestPush(endpoint: string) {
  try {
    await requireAdmin();
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint: String(endpoint || "") } });
    if (!sub) return { success: false as const, error: "Este aparelho não está inscrito." };
    if (!vapidPublicKey()) return { success: false as const, error: "Os avisos ainda não estão configurados no servidor." };
    // Reaproveita o envio real com um pedido fictício, mirando só esta inscrição.
    await notifyNewSiteOrders(
      [
        {
          id: "",
          orderNumber: "AUR-TESTE",
          stockLocation: sub.location ?? "ESTOQUE_A",
          totalCents: 0,
          customerName: "Teste",
          itemCount: 1,
        },
      ],
      { onlyEndpoint: sub.endpoint }
    );
    return { success: true as const };
  } catch (e) {
    console.error("Falha no aviso de teste:", e);
    return { success: false as const, error: "Não foi possível enviar o aviso de teste." };
  }
}
