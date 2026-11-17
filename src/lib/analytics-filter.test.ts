import { describe, expect, it } from "vitest";
import { analyticsUrl } from "./analytics-filter";

const site = "https://aurora-store-web.vercel.app";

describe("analyticsUrl", () => {
  it("conta páginas da vitrine sem a parte ?...", () => {
    expect(analyticsUrl(`${site}/catalog?q=pijama&page=2`)).toBe(`${site}/catalog`);
    expect(analyticsUrl(`${site}/product/conjunto-luna`)).toBe(`${site}/product/conjunto-luna`);
    expect(analyticsUrl(`${site}/`)).toBe(`${site}/`);
  });

  it("não conta painel nem páginas pessoais", () => {
    expect(analyticsUrl(`${site}/admin`)).toBeNull();
    expect(analyticsUrl(`${site}/admin/sales/abc`)).toBeNull();
    expect(analyticsUrl(`${site}/account/settings`)).toBeNull();
    expect(analyticsUrl(`${site}/checkout/success?orderNumber=AUR-123456`)).toBeNull();
    expect(analyticsUrl(`${site}/login`)).toBeNull();
  });

  it("não confunde páginas parecidas", () => {
    expect(analyticsUrl(`${site}/admin-sw.js`)).toBe(`${site}/admin-sw.js`);
    expect(analyticsUrl(`${site}/checkout`)).toBe(`${site}/checkout`);
  });

  it("ignora endereço inválido", () => {
    expect(analyticsUrl("não é url")).toBeNull();
  });
});
