import { auth } from "@/auth";

// As server actions são endpoints públicos (POST): o middleware protege as páginas, não elas.
// Toda action que mexe no banco pelo painel confere a sessão de administrador antes.
export async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    throw new Error("Sua sessão expirou ou você não tem permissão. Entre de novo no painel.");
  }
}

export const NOT_ADMIN_MESSAGE = "Sua sessão expirou ou você não tem permissão. Entre de novo no painel.";

/**
 * Versão que não lança erro, para actions que devolvem { error }:
 *   const denied = await adminGuard(); if (denied) return denied;
 */
export async function adminGuard(): Promise<{ success: false; error: string } | null> {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return { success: false, error: NOT_ADMIN_MESSAGE };
  }
  return null;
}
