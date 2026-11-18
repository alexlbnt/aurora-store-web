import { describe, expect, it } from "vitest";
import { DEFAULT_WHATSAPP_MESSAGE, productWhatsappMessage, whatsappLink } from "./contact";

describe("productWhatsappMessage", () => {
  it("cita o produto e o endereço", () => {
    expect(productWhatsappMessage("Conjunto Luna", "https://loja.test/product/conjunto-luna")).toBe(
      'Olá! Tenho interesse no produto "Conjunto Luna". Pode me ajudar?\nhttps://loja.test/product/conjunto-luna',
    );
  });

  it("limpa espaços e funciona sem endereço", () => {
    expect(productWhatsappMessage("  Pijama   Áurea ")).toBe('Olá! Tenho interesse no produto "Pijama Áurea". Pode me ajudar?');
  });

  it("encurta nome muito longo", () => {
    const msg = productWhatsappMessage("A".repeat(200));
    expect(msg).toContain(`"${"A".repeat(79)}…"`);
  });

  it("sem nome usa a mensagem padrão", () => {
    expect(productWhatsappMessage("   ")).toBe(DEFAULT_WHATSAPP_MESSAGE);
  });
});

describe("whatsappLink", () => {
  it("codifica acentos e quebras de linha", () => {
    expect(whatsappLink("Olá!\nTeste")).toMatch(/\?text=Ol%C3%A1!%0ATeste$/);
  });
});
