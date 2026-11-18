import { describe, expect, it } from "vitest";
import { SIZE_GUIDE, hasSizeGuide, isSameSize } from "./size-guide";

describe("SIZE_GUIDE", () => {
  it("não repete tamanho e tem todas as medidas preenchidas", () => {
    const sizes = SIZE_GUIDE.map((r) => r.size);
    expect(new Set(sizes).size).toBe(sizes.length);
    for (const row of SIZE_GUIDE) {
      for (const value of Object.values(row)) expect(value.trim()).not.toBe("");
    }
  });
});

describe("hasSizeGuide", () => {
  it("mostra o guia quando algum tamanho está na tabela", () => {
    expect(hasSizeGuide(["P", "M"])).toBe(true);
    expect(hasSizeGuide(["Único", "gg "])).toBe(true);
  });

  it("não mostra para produto de tamanho único ou sem tamanho conhecido", () => {
    expect(hasSizeGuide(["Único"])).toBe(false);
    expect(hasSizeGuide(["36", "38"])).toBe(false);
    expect(hasSizeGuide([])).toBe(false);
  });
});

describe("isSameSize", () => {
  it("ignora maiúsculas e espaços", () => {
    expect(isSameSize(" gg", "GG")).toBe(true);
    expect(isSameSize("G", "GG")).toBe(false);
  });
});
