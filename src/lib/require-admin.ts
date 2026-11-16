import { auth } from "@/auth";

// As server actions são endpoints públicos (POST): o middleware protege as páginas, não elas.
// Toda action que mexe no banco pelo painel confere a sessão de administrador antes.
export async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    throw new Error("Sua sessão expirou ou você não tem permissão. Entre de novo no painel.");
  }
}
