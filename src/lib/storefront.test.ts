import { describe, expect, it } from "vitest";
import {
  availableFirst,
  availableStock,
  filterableColors,
  formatBRL,
  metaDescription,
  paginate,
  sortSizes,
  toProductCard,
} from "./storefront";

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
    slug: "pijama",
    name: "Pijama ",
    basePrice: "129.9",
    isNew: true,
    category: { name: "Pijamas" },
    images: [{ url: "https://i.ibb.co/x.jpg" }],
    variants: [{ stockA: 0, stockV: 1 }],
  };

  it("monta o card com preço em reais", () => {
    expect(toProductCard(base)).toEqual({
      id: "p1",
      href: "/product/pijama",
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

describe("sortSizes", () => {
  it("ordena como na arara e põe números e outros depois", () => {
    expect(sortSizes(["G", "Único", "PP", "42", "M", "38", "GG", "P", "M"])).toEqual([
      "PP", "P", "M", "G", "GG", "38", "42", "Único",
    ]);
  });
});

describe("filterableColors", () => {
  it("remove repetidas e a cor genérica", () => {
    expect(filterableColors(["Rosa", "Azul", "Padrão", "Rosa ", "azul marinho"])).toEqual([
      "Azul", "azul marinho", "Rosa",
    ]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 50 }, (_, i) => i);

  it("recorta a página pedida", () => {
    const r = paginate(items, "2", 24);
    expect(r).toMatchObject({ page: 2, totalPages: 3 });
    expect(r.items[0]).toBe(24);
    expect(r.items).toHaveLength(24);
  });

  it("corrige página inválida ou fora do intervalo", () => {
    expect(paginate(items, "abc", 24).page).toBe(1);
    expect(paginate(items, "0", 24).page).toBe(1);
    expect(paginate(items, "99", 24).page).toBe(3);
    expect(paginate([], undefined, 24)).toMatchObject({ page: 1, totalPages: 1, items: [] });
  });
});

describe("formatBRL", () => {
  it("formata com vírgula", () => {
    expect(formatBRL(59)).toBe("R$ 59,00");
  });
});
