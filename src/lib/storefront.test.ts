import { describe, expect, it } from "vitest";
import { availableFirst, availableStock, formatBRL, metaDescription, toProductCard } from "./storefront";

describe("availableStock", () => {
  it("soma os dois estoques e ignora valores negativos", () => {
    expect(availableStock([{ stockA: 2, stockV: 1 }, { stockA: 0, stockV: 3 }])).toBe(6);
    expect(availableStock([{ stockA: -2, stockV: 1 }])).toBe(1);
    expect(availableStock([])).toBe(0);
  });
});

describe("toProductCard", () => {
  const base = {
    id: "p1",
    name: "Pijama",
    basePrice: "129.9",
    isNew: true,
    category: { name: "Pijamas" },
    images: [{ url: "https://i.ibb.co/x.jpg" }],
    variants: [{ stockA: 0, stockV: 1 }],
  };

  it("monta o card com preço em reais", () => {
    expect(toProductCard(base)).toEqual({
      id: "p1",
      name: "Pijama",
      price: "R$ 129,90",
      category: "Pijamas",
      imageUrl: "https://i.ibb.co/x.jpg",
      isNew: true,
      soldOut: false,
    });
  });

  it("marca esgotado sem estoque e sem variação", () => {
    expect(toProductCard({ ...base, variants: [{ stockA: 0, stockV: 0 }] }).soldOut).toBe(true);
    expect(toProductCard({ ...base, variants: [] }).soldOut).toBe(true);
  });

  it("usa null quando não há foto", () => {
    expect(toProductCard({ ...base, images: [] }).imageUrl).toBeNull();
  });
});

describe("availableFirst", () => {
  it("leva os esgotados para o fim mantendo a ordem", () => {
    const items = [
      { id: "a", soldOut: true },
      { id: "b", soldOut: false },
      { id: "c", soldOut: true },
      { id: "d", soldOut: false },
    ];
    expect(availableFirst(items).map((i) => i.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("metaDescription", () => {
  it("mantém textos curtos e junta espaços", () => {
    expect(metaDescription("  Pijama   de cetim\n azul ")).toBe("Pijama de cetim azul");
  });

  it("corta textos longos sem quebrar palavra", () => {
    const long = "palavra ".repeat(40);
    const out = metaDescription(long);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("palavra…")).toBe(true);
  });
});

describe("formatBRL", () => {
  it("formata com vírgula", () => {
    expect(formatBRL(59)).toBe("R$ 59,00");
  });
});
