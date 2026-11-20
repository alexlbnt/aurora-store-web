import { describe, expect, it } from "vitest";
import { readDraftExtras } from "./draft";

describe("rascunho salvo no navegador", () => {
  it("rascunho de antes da versão nova abre sem revendedora e sem parcelas", () => {
    expect(readDraftExtras({ lines: [], paid: true })).toEqual({ resellerName: "", installments: [] });
  });

  it("mantém revendedora e parcelas válidas", () => {
    const installments = [
      { number: 1, dueDate: "2026-12-20", amount: 50 },
      { number: 2, dueDate: "2027-01-20", amount: 50 },
    ];
    expect(readDraftExtras({ resellerName: "Ana", installments })).toEqual({ resellerName: "Ana", installments });
  });

  it("parcelas corrompidas viram lista vazia", () => {
    expect(readDraftExtras({ installments: "x" }).installments).toEqual([]);
    expect(readDraftExtras({ installments: [{}] }).installments).toEqual([]);
    expect(readDraftExtras(null)).toEqual({ resellerName: "", installments: [] });
  });
});
