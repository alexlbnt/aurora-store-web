import { describe, expect, it } from "vitest";
import { parseWishlist } from "./WishlistContext";

describe("parseWishlist", () => {
  it("aceita o formato atual e converte o antigo (preço número, categoria/imagem objeto)", () => {
    expect(
      parseWishlist([
        { id: "1", name: "Pijama", price: "R$ 10,00", category: "Pijamas", imageUrl: "/a.jpg" },
        { id: 2, name: "Robe", price: 89.9, category: { name: "Robes" }, imageUrl: { url: "/b.jpg" } },
      ]),
    ).toEqual([
      { id: "1", name: "Pijama", price: "R$ 10,00", category: "Pijamas", imageUrl: "/a.jpg" },
      { id: "2", name: "Robe", price: "R$ 89,90", category: "Robes", imageUrl: "/b.jpg" },
    ]);
  });

  it("descarta lixo", () => {
    expect(parseWishlist([null, "x", { name: "sem id" }])).toEqual([]);
    expect(parseWishlist({ nao: "lista" })).toEqual([]);
  });
});
