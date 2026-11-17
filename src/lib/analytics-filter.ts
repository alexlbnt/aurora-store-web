// Quais visitas entram nas estatísticas (Vercel Web Analytics, sem cookies).
// Ficam de fora: o painel (uso interno) e páginas pessoais. Também tiramos a parte "?..."
// do endereço, que pode ter número de pedido ou termo de busca.

const EXCLUDED_PREFIXES = ["/admin", "/account", "/checkout/success", "/login", "/register"];

/** Devolve o endereço que pode ser contado, ou null para não contar a visita. */
export function analyticsUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const path = url.pathname;
  if (EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return `${url.origin}${path}`;
}
