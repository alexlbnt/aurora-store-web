import { describe, expect, it } from "vitest";
import { parseProductionEntries, productionEntriesFromForm, qtyKey } from "./production-form";

describe("quantidades do lançamento por estoque", () => {
  it("A e V de cada variação são independentes", () => {
    const q = { [qtyKey("v1", "ESTOQUE_A")]: "2", [qtyKey("v1", "ESTOQUE_V")]: "3", [qtyKey("v2", "ESTOQUE_V")]: "1" };
    expect(productionEntriesFromForm(q, ["v1", "v2"])).toEqual([
      { variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 2 },
      { variantId: "v1", stockLocation: "ESTOQUE_V", quantity: 3 },
      { variantId: "v2", stockLocation: "ESTOQUE_V", quantity: 1 },
    ]);
  });

  it("ignora vazio, zero e texto", () => {
    const q = { [qtyKey("v1", "ESTOQUE_A")]: "", [qtyKey("v1", "ESTOQUE_V")]: "0", [qtyKey("v2", "ESTOQUE_A")]: "abc" };
    expect(productionEntriesFromForm(q, ["v1", "v2"])).toEqual([]);
  });
});

describe("leitura dos itens no servidor", () => {
  it("usa o estoque de cada item", () => {
    expect(
      parseProductionEntries(
        JSON.stringify([
          { variantId: "v1", quantity: 2, stockLocation: "ESTOQUE_A" },
          { variantId: "v1", quantity: 3, stockLocation: "ESTOQUE_V" },
        ]),
        "ESTOQUE_A",
      ),
    ).toEqual({
      entries: [
        { variantId: "v1", quantity: 2, stockLocation: "ESTOQUE_A" },
        { variantId: "v1", quantity: 3, stockLocation: "ESTOQUE_V" },
      ],
    });
  });

  it("item sem estoque usa o estoque do formulário (telas antigas)", () => {
    expect(parseProductionEntries(JSON.stringify([{ variantId: "v1", quantity: 4 }]), "ESTOQUE_V")).toEqual({
      entries: [{ variantId: "v1", quantity: 4, stockLocation: "ESTOQUE_V" }],
    });
  });

  it("recusa quantidade inválida e lista vazia", () => {
    expect(parseProductionEntries(JSON.stringify([{ variantId: "v1", quantity: 1.5 }]), "ESTOQUE_A")).toHaveProperty("error");
    expect(parseProductionEntries(JSON.stringify([{ variantId: "v1", quantity: 0 }]), "ESTOQUE_A")).toHaveProperty("error");
    expect(parseProductionEntries("[]", "ESTOQUE_A")).toHaveProperty("error");
    expect(parseProductionEntries("x", "ESTOQUE_A")).toHaveProperty("error");
  });
});
