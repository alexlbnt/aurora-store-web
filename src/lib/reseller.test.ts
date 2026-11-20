import { describe, expect, it } from "vitest";
import { RESELLER_NAME_MAX, parseResellerName, uniqueResellerNames } from "./reseller";

describe("nome da revendedora", () => {
  it("tira espaços das pontas", () => {
    expect(parseResellerName("  Ana Paula ")).toBe("Ana Paula");
  });

  it("vazio ou não texto vira null", () => {
    expect(parseResellerName("   ")).toBeNull();
    expect(parseResellerName(null)).toBeNull();
    expect(parseResellerName(42)).toBeNull();
  });

  it("corta em 80 caracteres", () => {
    expect(RESELLER_NAME_MAX).toBe(80);
    expect(parseResellerName("a".repeat(100))).toHaveLength(80);
  });

  it("sugestões sem repetir grafias parecidas, em ordem alfabética", () => {
    expect(uniqueResellerNames(["Bruna", "Ana", "ana ", null, "", "Ána"])).toEqual(["Ana", "Bruna"]);
  });
});
