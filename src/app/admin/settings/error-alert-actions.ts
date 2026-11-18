"use server";

import { adminGuard } from "@/lib/require-admin";

/**
 * Erro de propósito, para conferir o alerta de erros (Rollbar) de ponta a ponta:
 * ele passa pelo mesmo caminho de um erro real (onRequestError em src/instrumentation.ts).
 */
export async function triggerTestServerError(): Promise<{ success: false; error: string }> {
  const denied = await adminGuard();
  if (denied) return denied;
  throw new Error(`Teste do alerta de erros (servidor) — pode ignorar. ${new Date().toISOString()}`);
}
