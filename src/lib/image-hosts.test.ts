import { describe, expect, it } from "vitest";
import { canOptimizeImage } from "./image-hosts";

describe("canOptimizeImage", () => {
  it("aceita arquivos do site e origens liberadas", () => {
    expect(canOptimizeImage("/hero-banner.jpg")).toBe(true);
    expect(canOptimizeImage("https://i.ibb.co/abc/foto.jpg")).toBe(true);
  });

  it("não otimiza outras origens, http ou endereço inválido", () => {
    expect(canOptimizeImage("https://lh3.googleusercontent.com/x")).toBe(false);
    expect(canOptimizeImage("http://i.ibb.co/abc/foto.jpg")).toBe(false);
    expect(canOptimizeImage("//i.ibb.co/abc.jpg")).toBe(false);
    expect(canOptimizeImage("foto.jpg")).toBe(false);
  });
});
