// Lista única das telas do painel. A barra lateral (computador) e a barra inferior (celular)
// são montadas a partir daqui: uma tela nova entra só nesta lista e aparece nos dois menus.

export type AdminNavGroup = "main" | "footer";
/** Onde a tela fica no celular: na barra inferior ou dentro de "Mais". */
export type AdminNavMobileSlot = "tab" | "more";

export interface AdminNavItem {
  id: string;
  label: string;
  /** Nome curto para a barra inferior, quando o nome completo não cabe. */
  shortLabel?: string;
  href: string;
  /** Nome do ícone Material Symbols. */
  icon: string;
  /** Na barra lateral: "main" fica em cima, "footer" fica junto do perfil. */
  group: AdminNavGroup;
  mobile: AdminNavMobileSlot;
  /** Ativa só no endereço exato (sem subpáginas). */
  exact?: boolean;
  /** Subpáginas que pertencem a outro item (ex.: "Novo pedido" não acende "Vendas"). */
  excludes?: string[];
}

export const NEW_ORDER_HREF = "/admin/sales/new";

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { id: "home", label: "Dashboard", shortLabel: "Início", href: "/admin", icon: "dashboard", group: "main", mobile: "tab", exact: true },
  { id: "sales", label: "Vendas", href: "/admin/sales", icon: "shopping_cart", group: "main", mobile: "tab", excludes: [NEW_ORDER_HREF] },
  { id: "finance", label: "Financeiro", href: "/admin/finance", icon: "account_balance_wallet", group: "main", mobile: "more" },
  { id: "products", label: "Produtos", href: "/admin/products", icon: "inventory_2", group: "main", mobile: "tab" },
  { id: "categories", label: "Categorias", href: "/admin/categories", icon: "category", group: "main", mobile: "more" },
  { id: "customers", label: "Clientes", href: "/admin/customers", icon: "group", group: "main", mobile: "more" },
  { id: "reports", label: "Relatórios", href: "/admin/reports", icon: "bar_chart", group: "main", mobile: "more" },
  { id: "settings", label: "Configurações", href: "/admin/settings", icon: "settings", group: "footer", mobile: "more" },
];

/** Ordem da barra inferior: as abas ficam dos dois lados do botão "Novo pedido". */
export const MOBILE_TABS_BEFORE_NEW = ["home", "sales"];
export const MOBILE_TABS_AFTER_NEW = ["products"];

export function isNavItemActive(pathname: string, item: Pick<AdminNavItem, "href" | "exact" | "excludes">): boolean {
  if (item.excludes?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const navItemsByGroup = (group: AdminNavGroup) => ADMIN_NAV.filter((i) => i.group === group);

export const mobileTabs = (ids: readonly string[]) =>
  ids.map((id) => ADMIN_NAV.find((i) => i.id === id && i.mobile === "tab")).filter((i): i is AdminNavItem => !!i);

export const mobileMoreItems = () => ADMIN_NAV.filter((i) => i.mobile === "more");

/** "Mais" fica aceso quando a tela aberta é uma das que moram dentro dele. */
export const isMoreActive = (pathname: string) => mobileMoreItems().some((i) => isNavItemActive(pathname, i));
