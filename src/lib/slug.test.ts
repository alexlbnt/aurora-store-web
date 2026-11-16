import { describe, expect, it } from "vitest";
import { isUuid, productPath, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("tira acentos e símbolos", () => {
    expect(slugify("Sleep Dress Curto Ísis ")).toBe("sleep-dress-curto-isis");
    expect(slugify("Camisola Algodão & Renda (P)")).toBe("camisola-algodao-renda-p");
    expect(slugify("  --  ")).toBe("");
  });

  it("limita o tamanho sem terminar em hífen", () => {
    const s = slugify("a ".repeat(100));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("isUuid", () => {
  it("reconhece o id interno", () => {
    expect(isUuid("3240a894-9af4-40ae-a930-9e0000000000")).toBe(true);
    expect(isUuid("pijama-curto-linho")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("acrescenta número quando já existe", async () => {
    const taken = new Set(["pijama", "pijama-2"]);
    expect(await uniqueSlug("pijama", async (s) => taken.has(s))).toBe("pijama-3");
    expect(await uniqueSlug("camisola", async (s) => taken.has(s))).toBe("camisola");
    expect(await uniqueSlug("", async () => false)).toBe("produto");
  });
});

describe("productPath", () => {
  it("prefere o slug", () => {
    expect(productPath({ id: "abc", slug: "pijama" })).toBe("/product/pijama");
    expect(productPath({ id: "abc", slug: null })).toBe("/product/abc");
  });
});
