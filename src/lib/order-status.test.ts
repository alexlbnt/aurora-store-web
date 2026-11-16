import { describe, expect, it } from "vitest";
import { customerOrderStatus, shippingLabel } from "./order-status";

describe("customerOrderStatus", () => {
  it("pedido novo do site é 'recebido', não 'aguardando pagamento'", () => {
    const s = customerOrderStatus("PENDING");
    expect(s.label).toBe("Pedido recebido");
    expect(s.hint).toMatch(/WhatsApp/);
    expect(s.step).toBe(0);
  });

  it("avança as etapas e marca cancelado fora da linha do tempo", () => {
    expect(customerOrderStatus("PAID").step).toBe(1);
    expect(customerOrderStatus("SHIPPED").step).toBe(2);
    expect(customerOrderStatus("DELIVERED").step).toBe(3);
    expect(customerOrderStatus("CANCELED").step).toBe(-1);
    expect(customerOrderStatus("OUTRO").label).toBe("Em andamento");
  });
});

describe("shippingLabel", () => {
  it("explica o frete em linguagem simples", () => {
    expect(shippingLabel("SEM_FRETE")).toMatch(/combinada/);
    expect(shippingLabel("PAGO_CLIENTE")).toMatch(/pago por você/);
    expect(shippingLabel("PAGO_AURORA")).toMatch(/Aurora/);
  });
});
