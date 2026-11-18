// Busca do topo do painel: procura no assunto da tela aberta (produtos, clientes);
// fora deles, procura pedidos. Usada no computador e no celular.

export interface AdminSearchTarget {
  /** Lista que recebe ?q= */
  href: string;
  /** Texto do campo: "Buscar pedidos…" */
  placeholder: string;
}

const PRODUCTS: AdminSearchTarget = { href: "/admin/products", placeholder: "Buscar produtos…" };
const CUSTOMERS: AdminSearchTarget = { href: "/admin/customers", placeholder: "Buscar clientes…" };
const ORDERS: AdminSearchTarget = { href: "/admin/sales", placeholder: "Buscar pedidos…" };

export function adminSearchTarget(pathname: string): AdminSearchTarget {
  if (pathname.startsWith("/admin/products")) return PRODUCTS;
  if (pathname.startsWith("/admin/customers")) return CUSTOMERS;
  return ORDERS;
}

/** Endereço da busca; null quando o texto está vazio. */
export function adminSearchUrl(pathname: string, query: string): string | null {
  const q = query.trim();
  if (!q) return null;
  return `${adminSearchTarget(pathname).href}?q=${encodeURIComponent(q)}`;
}
