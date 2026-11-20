import { describe, expect, it } from "vitest";
import {
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  addMonthsClamped,
  allocateInstallments,
  buildInstallments,
  defaultFirstDueDate,
  resplitInstallments,
  splitAmounts,
  suggestedPaymentAmount,
  validateInstallments,
  type InstallmentInput,
} from "./installments";

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

describe("divisão do valor", () => {
  it("centavos que sobram ficam na 1ª parcela", () => {
    expect(splitAmounts(100, 3)).toEqual([33.34, 33.33, 33.33]);
  });
  it("valores pequenos", () => {
    expect(splitAmounts(0.05, 2)).toEqual([0.03, 0.02]);
  });
  it("divisão exata", () => {
    expect(splitAmounts(250, 2)).toEqual([125, 125]);
  });
  it("a soma sempre fecha com o total", () => {
    for (const [total, n] of [[389.9, 7], [1234.57, 12], [99.99, 24]] as const) {
      expect(sum(splitAmounts(total, n))).toBe(total);
    }
  });
});

describe("vencimentos mês a mês", () => {
  it("31/01 + 1 mês = último dia de fevereiro", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("dia que existe no mês seguinte fica igual", () => {
    expect(addMonthsClamped("2026-11-30", 1)).toBe("2026-12-30");
    expect(addMonthsClamped("2026-01-31", 2)).toBe("2026-03-31");
  });
  it("vira o ano", () => {
    expect(addMonthsClamped("2026-12-15", 1)).toBe("2027-01-15");
  });
  it("1º vencimento padrão é daqui a 30 dias (Brasília)", () => {
    expect(defaultFirstDueDate(new Date("2026-11-20T15:00:00-03:00"))).toBe("2026-12-20");
    expect(defaultFirstDueDate(new Date("2026-11-20T23:30:00-03:00"))).toBe("2026-12-20");
  });
});

describe("montar e refazer parcelas", () => {
  it("monta números, datas e valores", () => {
    expect(buildInstallments(300, 3, "2026-12-20")).toEqual([
      { number: 1, dueDate: "2026-12-20", amount: 100 },
      { number: 2, dueDate: "2027-01-20", amount: 100 },
      { number: 3, dueDate: "2027-02-20", amount: 100 },
    ]);
  });
  it("total novo: refaz os valores e mantém as datas", () => {
    const current: InstallmentInput[] = [
      { number: 1, dueDate: "2026-12-05", amount: 150 },
      { number: 2, dueDate: "2027-01-10", amount: 100 },
      { number: 3, dueDate: "2027-03-01", amount: 50 },
    ];
    expect(resplitInstallments(current, 200)).toEqual([
      { number: 1, dueDate: "2026-12-05", amount: 66.68 },
      { number: 2, dueDate: "2027-01-10", amount: 66.66 },
      { number: 3, dueDate: "2027-03-01", amount: 66.66 },
    ]);
  });
});

describe("validação no servidor", () => {
  const ok = buildInstallments(300, 3, "2026-12-20");
  it("aceita parcelas montadas pelo formulário", () => {
    expect(validateInstallments(ok, 300)).toEqual({ ok: true, data: ok });
  });
  it("limites de quantidade", () => {
    expect(MIN_INSTALLMENTS).toBe(2);
    expect(MAX_INSTALLMENTS).toBe(24);
    expect(validateInstallments(buildInstallments(300, 1, "2026-12-20"), 300).ok).toBe(false);
    expect(validateInstallments(buildInstallments(300, 25, "2026-12-20"), 300).ok).toBe(false);
  });
  it("recusa números fora de sequência", () => {
    expect(validateInstallments([{ ...ok[0] }, { ...ok[1], number: 3 }, { ...ok[2], number: 2 }], 300).ok).toBe(false);
  });
  it("recusa data inexistente", () => {
    expect(validateInstallments([ok[0], { ...ok[1], dueDate: "2026-02-30" }, ok[2]], 300).ok).toBe(false);
  });
  it("recusa valor zero ou negativo", () => {
    expect(validateInstallments([{ ...ok[0], amount: 0 }, ok[1], { ...ok[2], amount: 200 }], 300).ok).toBe(false);
    expect(validateInstallments([{ ...ok[0], amount: -10 }, ok[1], { ...ok[2], amount: 210 }], 300).ok).toBe(false);
  });
  it("recusa o que não é lista", () => {
    expect(validateInstallments("x", 300).ok).toBe(false);
    expect(validateInstallments([{}, {}], 300).ok).toBe(false);
  });
  it("recusa soma diferente do total, com mensagem clara", () => {
    expect(validateInstallments([ok[0], ok[1], { ...ok[2], amount: 90 }], 300)).toEqual({
      ok: false,
      error: "As parcelas somam R$ 290,00, mas o total é R$ 300,00.",
    });
  });
  it("aceita diferença de um centavo (arredondamento)", () => {
    expect(validateInstallments([ok[0], ok[1], { ...ok[2], amount: 99.99 }], 300).ok).toBe(true);
  });
});

describe("situação de cada parcela", () => {
  const three = buildInstallments(300, 3, "2026-12-20"); // 20/12, 20/01, 20/02
  const today = "2027-01-25";
  const statuses = (paid: number, canceled = false) =>
    allocateInstallments(three, paid, today, canceled).map((v) => v.status);

  it("nada pago: vencidas ficam atrasadas", () => {
    expect(statuses(0)).toEqual(["OVERDUE", "OVERDUE", "OPEN"]);
  });
  it("baixa quita a mais antiga primeiro", () => {
    expect(statuses(100)).toEqual(["PAID", "OVERDUE", "OPEN"]);
  });
  it("pagamento parcial de uma parcela vencida", () => {
    const views = allocateInstallments(three, 150, today, false);
    expect(views.map((v) => v.status)).toEqual(["PAID", "OVERDUE", "OPEN"]);
    expect(views[1]).toMatchObject({ paid: 50, remaining: 50 });
  });
  it("pagamento parcial de parcela ainda no prazo fica parcial", () => {
    expect(allocateInstallments(three, 250, today, false).map((v) => v.status)).toEqual(["PAID", "PAID", "PARTIAL"]);
  });
  it("tudo pago", () => {
    expect(statuses(300)).toEqual(["PAID", "PAID", "PAID"]);
  });
  it("pedido cancelado nunca mostra atraso", () => {
    expect(statuses(0, true)).toEqual(["OPEN", "OPEN", "OPEN"]);
  });
  it("estorno: a parcela volta a ficar em aberto/atrasada", () => {
    expect(statuses(200)[1]).toBe("PAID");
    expect(statuses(100)[1]).toBe("OVERDUE");
  });
  it("ordena pelo número da parcela", () => {
    const shuffled = [three[2], three[0], three[1]];
    expect(allocateInstallments(shuffled, 100, today, false).map((v) => v.number)).toEqual([1, 2, 3]);
  });
});

describe("valor sugerido para a próxima baixa", () => {
  const three = buildInstallments(300, 3, "2026-12-20");
  it("o que falta da parcela mais antiga em aberto", () => {
    expect(suggestedPaymentAmount(allocateInstallments(three, 150, "2027-01-25", false))).toBe(50);
  });
  it("nada a sugerir quando tudo foi pago", () => {
    expect(suggestedPaymentAmount(allocateInstallments(three, 300, "2027-01-25", false))).toBeNull();
  });
});
