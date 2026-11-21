import { describe, expect, it } from "vitest";
import { BACKFILL_NOTE, INITIAL_STOCK_NOTE, backfillEntries, initialStockEntries } from "./production-seed";

describe("estoque do cadastro vira produzido", () => {
  it("um lançamento por variação e estoque, sem zeros", () => {
    expect(
      initialStockEntries([
        { id: "v1", stockA: 5, stockV: 3 },
        { id: "v2", stockA: 0, stockV: 2 },
      ]),
    ).toEqual([
      { variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 5 },
      { variantId: "v1", stockLocation: "ESTOQUE_V", quantity: 3 },
      { variantId: "v2", stockLocation: "ESTOQUE_V", quantity: 2 },
    ]);
  });

  it("tudo zerado não gera lançamento", () => {
    expect(initialStockEntries([{ id: "v1", stockA: 0, stockV: 0 }])).toEqual([]);
  });

  it("observações", () => {
    expect(INITIAL_STOCK_NOTE).toBe("Estoque inicial do cadastro");
    expect(BACKFILL_NOTE).toBe("Carga inicial (estoque + vendido)");
  });
});

describe("carga inicial: estoque + vendido", () => {
  it("soma o vendido de cada estoque ao estoque atual", () => {
    expect(
      backfillEntries(
        [{ id: "v1", stockA: 12, stockV: 22 }],
        [
          { variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 4 },
          { variantId: "v1", stockLocation: "ESTOQUE_V", quantity: 7 },
        ],
      ),
    ).toEqual({
      entries: [
        { variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 16 },
        { variantId: "v1", stockLocation: "ESTOQUE_V", quantity: 29 },
      ],
      unattributed: 0,
    });
  });

  it("estoque zerado com vendas: produzido = vendido", () => {
    expect(
      backfillEntries([{ id: "v1", stockA: 0, stockV: 0 }], [{ variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 3 }]),
    ).toEqual({ entries: [{ variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 3 }], unattributed: 0 });
  });

  it("item sem variação conta na variação única", () => {
    expect(
      backfillEntries([{ id: "v1", stockA: 1, stockV: 0 }], [{ variantId: null, stockLocation: "ESTOQUE_A", quantity: 2 }]),
    ).toEqual({ entries: [{ variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 3 }], unattributed: 0 });
  });

  it("item sem variação fica de fora quando há várias variações", () => {
    const r = backfillEntries(
      [
        { id: "v1", stockA: 1, stockV: 0 },
        { id: "v2", stockA: 0, stockV: 0 },
      ],
      [{ variantId: null, stockLocation: "ESTOQUE_A", quantity: 2 }],
    );
    expect(r).toEqual({ entries: [{ variantId: "v1", stockLocation: "ESTOQUE_A", quantity: 1 }], unattributed: 2 });
  });

  it("item de variação que não existe mais fica de fora", () => {
    expect(
      backfillEntries([{ id: "v1", stockA: 0, stockV: 0 }], [{ variantId: "apagada", stockLocation: "ESTOQUE_V", quantity: 5 }]),
    ).toEqual({ entries: [], unattributed: 5 });
  });
});
