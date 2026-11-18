import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV,
  MOBILE_TABS_AFTER_NEW,
  MOBILE_TABS_BEFORE_NEW,
  isMoreActive,
  isNavItemActive,
  mobileMoreItems,
  mobileTabs,
} from "./admin-nav";

const byId = (id: string) => ADMIN_NAV.find((i) => i.id === id)!;

describe("navegação do painel", () => {
  it("toda tela do painel pode ser aberta pelo celular (aba ou Mais)", () => {
    const tabs = mobileTabs([...MOBILE_TABS_BEFORE_NEW, ...MOBILE_TABS_AFTER_NEW]);
    const reachable = new Set([...tabs, ...mobileMoreItems()].map((i) => i.id));
    for (const item of ADMIN_NAV) expect(reachable, item.label).toContain(item.id);
  });

  it("barra inferior tem no máximo 4 abas + Novo pedido (o 5º espaço é o Mais)", () => {
    expect(MOBILE_TABS_BEFORE_NEW.length + MOBILE_TABS_AFTER_NEW.length).toBeLessThanOrEqual(3);
    // abas listadas precisam existir e estar marcadas como aba
    expect(mobileTabs(MOBILE_TABS_BEFORE_NEW)).toHaveLength(MOBILE_TABS_BEFORE_NEW.length);
    expect(mobileTabs(MOBILE_TABS_AFTER_NEW)).toHaveLength(MOBILE_TABS_AFTER_NEW.length);
  });

  it("ids e endereços não se repetem", () => {
    expect(new Set(ADMIN_NAV.map((i) => i.id)).size).toBe(ADMIN_NAV.length);
    expect(new Set(ADMIN_NAV.map((i) => i.href)).size).toBe(ADMIN_NAV.length);
  });

  it("marca a tela ativa", () => {
    expect(isNavItemActive("/admin", byId("home"))).toBe(true);
    expect(isNavItemActive("/admin/sales", byId("home"))).toBe(false);
    expect(isNavItemActive("/admin/sales/abc", byId("sales"))).toBe(true);
    expect(isNavItemActive("/admin/sales/new", byId("sales"))).toBe(false);
    expect(isNavItemActive("/admin/salesx", byId("sales"))).toBe(false);
    expect(isNavItemActive("/admin/products/1/edit", byId("products"))).toBe(true);
  });

  it("Mais acende nas telas que moram dentro dele", () => {
    expect(isMoreActive("/admin/finance")).toBe(true);
    expect(isMoreActive("/admin/customers/123")).toBe(true);
    expect(isMoreActive("/admin/settings")).toBe(true);
    expect(isMoreActive("/admin/products")).toBe(false);
    expect(isMoreActive("/admin")).toBe(false);
  });
});
