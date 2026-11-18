import { describe, expect, it } from "vitest";
import { buildVariantMatrix, fromSavedVariant, sameMatrixShape } from "./variant-matrix";
import { toStock } from "./product-input";

const sku = (s: string, c: string) => `SKU-${s}-${c}`;

describe("grade de variações", () => {
  it("cria tamanho × cor com SKU sugerido e estoque 0", () => {
    const m = buildVariantMatrix(["P", "M"], ["Azul"], [], sku);
    expect(m).toEqual([
      { _id: "P-Azul", size: "P", color: "Azul", sku: "SKU-P-Azul", price: "", stockA: 0, stockV: 0 },
      { _id: "M-Azul", size: "M", color: "Azul", sku: "SKU-M-Azul", price: "", stockA: 0, stockV: 0 },
    ]);
  });

  it("mantém o que já foi digitado ao acrescentar uma cor", () => {
    const before = buildVariantMatrix(["P"], ["Azul"], [], sku).map((r) => ({ ...r, stockA: "5", price: "99" }));
    const after = buildVariantMatrix(["P"], ["Azul", "Rosa"], before, sku);
    expect(after[0]).toMatchObject({ _id: "P-Azul", stockA: "5", price: "99" });
    expect(after[1]).toMatchObject({ _id: "P-Rosa", stockA: 0, price: "" });
  });

  it("reaproveita variação salva (sem _id) pelo tamanho e cor", () => {
    const saved = fromSavedVariant({ size: "G", color: "Preto", sku: "X1", price: null, stockA: 2, stockV: 1 });
    expect(saved).toEqual({ _id: "G-Preto", size: "G", color: "Preto", sku: "X1", price: "", stockA: 2, stockV: 1 });
    const m = buildVariantMatrix(["G"], ["Preto"], [saved], sku);
    expect(m[0]).toMatchObject({ sku: "X1", stockA: 2, stockV: 1 });
  });

  it("compara o formato da grade", () => {
    const a = buildVariantMatrix(["P"], ["Azul"], [], sku);
    expect(sameMatrixShape(a, buildVariantMatrix(["P"], ["Azul"], a, sku))).toBe(true);
    expect(sameMatrixShape(a, buildVariantMatrix(["P", "M"], ["Azul"], a, sku))).toBe(false);
  });

  it("estoque vazio ou inválido vira 0", () => {
    expect(toStock("7")).toBe(7);
    expect(toStock(3)).toBe(3);
    expect(toStock("")).toBe(0);
    expect(toStock(null)).toBe(0);
    expect(toStock("abc")).toBe(0);
  });
});
