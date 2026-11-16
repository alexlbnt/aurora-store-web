// Endereço público do site, usado em prévias de link (WhatsApp, Instagram), sitemap e SEO.
// Ordem: valor configurado → domínio de produção que a Vercel informa → URL do login → local.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export const SITE_NAME = "Aurora Sleepwear";
