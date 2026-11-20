import { describe, expect, it } from "vitest";
import { INACTIVE_CUSTOMER_DAYS, daysSince, inactiveCutoff, isInactive, lastPurchaseLabel } from "./customer-activity";

const now = new Date("2026-11-20T15:00:00-03:00");

describe("cliente sumido", () => {
  it("limite é 60 dias", () => {
    expect(INACTIVE_CUSTOMER_DAYS).toBe(60);
  });

  it("conta dias de calendário em Brasília", () => {
    expect(daysSince(new Date("2026-11-20T01:00:00-03:00"), now)).toBe(0);
    expect(daysSince(new Date("2026-11-19T23:30:00-03:00"), now)).toBe(1);
    expect(daysSince(new Date("2026-09-21T10:00:00-03:00"), now)).toBe(60);
  });

  it("nunca devolve dias negativos", () => {
    expect(daysSince(new Date("2026-11-25T10:00:00-03:00"), now)).toBe(0);
  });

  it("sumido só depois de 60 dias", () => {
    expect(isInactive(new Date("2026-09-21T10:00:00-03:00"), now)).toBe(false);
    expect(isInactive(new Date("2026-09-20T23:59:00-03:00"), now)).toBe(true);
    expect(isInactive(null, now)).toBe(false);
  });

  it("corte é o início do dia de 60 dias atrás, em Brasília", () => {
    expect(inactiveCutoff(now).toISOString()).toBe(new Date("2026-09-21T00:00:00-03:00").toISOString());
  });

  it("rótulos da última compra", () => {
    expect(lastPurchaseLabel(new Date("2026-11-20T08:00:00-03:00"), now)).toBe("hoje");
    expect(lastPurchaseLabel(new Date("2026-11-19T08:00:00-03:00"), now)).toBe("ontem");
    expect(lastPurchaseLabel(new Date("2026-09-01T08:00:00-03:00"), now)).toBe("há 80 dias");
    expect(lastPurchaseLabel(null, now)).toBe("Nunca comprou");
  });
});
