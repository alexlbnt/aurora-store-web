import { describe, expect, it } from "vitest";
import { adminSearchTarget, adminSearchUrl } from "./admin-search";

describe("busca do painel", () => {
  it("procura no assunto da tela", () => {
    expect(adminSearchTarget("/admin/products/123/edit").placeholder).toBe("Buscar produtos…");
    expect(adminSearchTarget("/admin/customers").placeholder).toBe("Buscar clientes…");
    expect(adminSearchTarget("/admin").placeholder).toBe("Buscar pedidos…");
    expect(adminSearchTarget("/admin/finance").placeholder).toBe("Buscar pedidos…");
  });

  it("monta o endereço e ignora busca vazia", () => {
    expect(adminSearchUrl("/admin/customers", "  Ana Souza ")).toBe("/admin/customers?q=Ana%20Souza");
    expect(adminSearchUrl("/admin", "AUR-12")).toBe("/admin/sales?q=AUR-12");
    expect(adminSearchUrl("/admin", "   ")).toBeNull();
  });
});
