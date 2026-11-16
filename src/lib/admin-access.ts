// Quem pode entrar no painel. O acesso de administrador é só pelo Google, com e-mail desta lista.
// Para incluir alguém (ex.: uma vendedora), adicione o Gmail em ADMIN_EMAILS, separado por vírgula.

export const DEFAULT_ADMIN_EMAILS = "auroraadm25@gmail.com";

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw?.trim() ? raw : DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, allowed: string[]): boolean {
  return !!email && allowed.includes(email.trim().toLowerCase());
}

/** O Google só é aceito com e-mail confirmado pelo próprio Google. */
export function isVerifiedGoogleProfile(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") return false;
  const p = profile as { email?: unknown; email_verified?: unknown };
  return typeof p.email === "string" && p.email.length > 0 && p.email_verified === true;
}

/** Mensagens para os códigos de erro que o NextAuth coloca em ?error= na volta do Google. */
export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "AccessDenied":
      return "O Google não confirmou este e-mail. Use uma conta Google com e-mail verificado.";
    case "Configuration":
      return "O login com Google ainda não está configurado no servidor. Avise quem cuida do sistema.";
    case "OAuthCallbackError":
    case "OAuthSignin":
    case "CallbackRouteError":
      return "Não foi possível concluir o login com o Google. Tente de novo.";
    default:
      return "Não foi possível entrar. Tente de novo.";
  }
}
