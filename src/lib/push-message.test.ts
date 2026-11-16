import { describe, expect, it } from "vitest";
import { newOrderPayload, wantsLocation } from "./push-message";

describe("newOrderPayload", () => {
  it("resume o pedido com primeiro nome, peças, total e estoque", () => {
    expect(
      newOrderPayload({
        id: "o1",
        orderNumber: "AUR-123456",
        stockLocation: "ESTOQUE_V",
        totalCents: 25980,
        customerName: "  Maria Oliveira ",
        itemCount: 2,
      })
    ).toEqual({
      title: "Pedido novo no site: AUR-123456",
      body: "Maria, 2 peças, R$ 259,80. Estoque V.",
      url: "/admin/sales/o1",
      tag: "pedido-AUR-123456",
    });
  });

  it("usa singular para uma peça", () => {
    const p = newOrderPayload({ id: "o", orderNumber: "AUR-1", stockLocation: "ESTOQUE_A", totalCents: 100, customerName: "Ana", itemCount: 1 });
    expect(p.body).toBe("Ana, 1 peça, R$ 1,00. Estoque A.");
  });
});

describe("wantsLocation", () => {
  it("quem acompanha os dois recebe tudo; quem escolheu um estoque recebe só o dele", () => {
    expect(wantsLocation(null, "ESTOQUE_A")).toBe(true);
    expect(wantsLocation("ESTOQUE_A", "ESTOQUE_A")).toBe(true);
    expect(wantsLocation("ESTOQUE_V", "ESTOQUE_A")).toBe(false);
  });
});
