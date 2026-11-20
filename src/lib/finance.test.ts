import { describe, expect, it } from "vitest";
import {
  monthKeyOf,
  monthRange,
  normalizeMonthKey,
  parseDateInput,
  paymentBalance,
  shiftMonth,
  statusAfterPayments,
  todayInput,
  validatePaymentAmount,
  monthLabel,
  orderTotal,
} from "./finance";

describe("meses no fuso de Brasília", () => {
  it("22h do dia 31 em Brasília ainda é o mesmo mês (já é dia 1º em UTC)", () => {
    expect(monthKeyOf(new Date("2026-11-01T01:00:00Z"))).toBe("2026-10");
  });

  it("monthRange cobre do dia 1º 00h ao dia 1º seguinte, em Brasília", () => {
    const { start, end } = monthRange("2026-12");
    expect(start.toISOString()).toBe("2026-12-01T03:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });

  it("normalizeMonthKey recusa valores inválidos", () => {
    const now = new Date("2026-11-16T15:00:00Z");
    expect(normalizeMonthKey("2026-13", now)).toBe("2026-11");
    expect(normalizeMonthKey("abc", now)).toBe("2026-11");
    expect(normalizeMonthKey("2025-02", now)).toBe("2025-02");
  });

  it("shiftMonth atravessa o ano", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("monthLabel em português", () => {
    expect(monthLabel("2026-03")).toBe("março de 2026");
  });

  it("parseDateInput fixa meio-dia de Brasília e recusa lixo", () => {
    expect(parseDateInput("2026-11-30")?.toISOString()).toBe("2026-11-30T15:00:00.000Z");
    expect(parseDateInput("30/11/2026")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });

  it("todayInput usa a data de Brasília", () => {
    expect(todayInput(new Date("2026-11-17T02:00:00Z"))).toBe("2026-11-16");
  });
});

describe("recebimentos", () => {
  it("soma parcelas sem erro de ponto flutuante", () => {
    const b = paymentBalance(100.3, [{ amount: 0.1 }, { amount: 0.2 }, { amount: 100 }]);
    expect(b.paid).toBe(100.3);
    expect(b.remaining).toBe(0);
    expect(b.isSettled).toBe(true);
  });

  it("parcial deixa saldo", () => {
    const b = paymentBalance(250, [{ amount: 100 }]);
    expect(b.remaining).toBe(150);
    expect(b.isSettled).toBe(false);
  });

  it("status: quitar move Pendente para Pago; estornar volta", () => {
    expect(statusAfterPayments("PENDING", paymentBalance(50, [{ amount: 50 }]))).toBe("PAID");
    expect(statusAfterPayments("PAID", paymentBalance(50, [{ amount: 20 }]))).toBe("PENDING");
  });

  it("status: Enviado, Entregue e Cancelado não mudam sozinhos", () => {
    const open = paymentBalance(50, []);
    expect(statusAfterPayments("SHIPPED", open)).toBe("SHIPPED");
    expect(statusAfterPayments("DELIVERED", open)).toBe("DELIVERED");
    expect(statusAfterPayments("CANCELED", paymentBalance(50, [{ amount: 50 }]))).toBe("CANCELED");
  });

  it("valida o valor do recebimento", () => {
    expect(validatePaymentAmount(0, 10)).toMatch(/Informe/);
    expect(validatePaymentAmount(NaN, 10)).toMatch(/Informe/);
    expect(validatePaymentAmount(10.01, 10)).toMatch(/passa/);
    expect(validatePaymentAmount(10, 10)).toBeNull();
  });
});

describe("total do pedido", () => {
  it("sai já arredondado em centavos (como o banco guarda)", () => {
    // 5% de desconto sobre R$ 47,90 dá 45.504999999999995 em ponto flutuante.
    const t = orderTotal(47.9, (47.9 * 5) / 100);
    expect(t).toBe(Number(t.toFixed(2)));
    expect(t).toBe(45.51); // 47,90 × 0,95 = 45,505 → 45,51 (e é isso que vai para o banco)
  });
  it("nunca negativo", () => {
    expect(orderTotal(10, 15)).toBe(0);
  });
});
