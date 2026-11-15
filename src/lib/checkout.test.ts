import { describe, expect, it } from "vitest";
import {
  allocateStock,
  decideCustomer,
  generateSiteOrderNumber,
  isHoneypotFilled,
  parseCartLines,
  priceChanged,
  unitPriceCents,
  appendNote,
  MAX_QTY_PER_LINE,
  type StockLine,
} from "./checkout";

const line = (key: string, qty: number, stockA: number, stockV: number, tracked = true): StockLine => ({
  key,
  qty,
  stockA,
  stockV,
  tracked,
});

describe("parseCartLines", () => {
  const item = { id: "p1-Azul-M", productId: "p1", color: "Azul", size: "M", qty: 1, numericPrice: 89.9 };

  it("aceita um carrinho válido e guarda o preço visto pelo cliente", () => {
    const r = parseCartLines([item]);
    expect(r).toEqual({ lines: [{ id: "p1-Azul-M", productId: "p1", color: "Azul", size: "M", qty: 1, clientPrice: 89.9 }] });
  });

  it("recusa carrinho vazio ou que não é lista", () => {
    expect(parseCartLines([])).toHaveProperty("error");
    expect(parseCartLines("x")).toHaveProperty("error");
    expect(parseCartLines(null)).toHaveProperty("error");
  });

  it("recusa quantidade zero, negativa ou fracionada", () => {
    expect(parseCartLines([{ ...item, qty: 0 }])).toHaveProperty("error");
    expect(parseCartLines([{ ...item, qty: -2 }])).toHaveProperty("error");
    expect(parseCartLines([{ ...item, qty: 1.5 }])).toHaveProperty("error");
  });

  it("junta linhas repetidas da mesma peça e respeita o limite por peça", () => {
    const r = parseCartLines([item, { ...item, qty: 2 }]);
    expect("lines" in r && r.lines[0].qty).toBe(3);
    expect(parseCartLines([{ ...item, qty: MAX_QTY_PER_LINE + 1 }])).toHaveProperty("error");
  });
});

describe("preço", () => {
  it("usa o preço da variação quando existe, senão o preço base", () => {
    expect(unitPriceCents(99.9, 79.9)).toBe(9990);
    expect(unitPriceCents(null, 79.9)).toBe(7990);
  });

  it("detecta preço adulterado ou desatualizado", () => {
    expect(priceChanged(0.01, 7990)).toBe(true);
    expect(priceChanged(79.9, 7990)).toBe(false);
    expect(priceChanged(null, 7990)).toBe(true);
  });
});

describe("allocateStock", () => {
  it("pedido inteiro sai do Estoque A quando ele atende tudo", () => {
    const r = allocateStock([line("x", 2, 5, 5), line("y", 1, 1, 0)]);
    expect(r).toEqual({ ok: true, byLocation: { ESTOQUE_A: [{ key: "x", qty: 2 }, { key: "y", qty: 1 }] } });
  });

  it("pedido inteiro sai do Estoque V quando só ele atende tudo", () => {
    const r = allocateStock([line("x", 2, 1, 3), line("y", 1, 0, 1)]);
    expect(r).toEqual({ ok: true, byLocation: { ESTOQUE_V: [{ key: "x", qty: 2 }, { key: "y", qty: 1 }] } });
  });

  it("divide entre os estoques quando nenhum atende sozinho", () => {
    const r = allocateStock([line("x", 1, 1, 0), line("y", 1, 0, 1)]);
    expect(r).toEqual({
      ok: true,
      byLocation: { ESTOQUE_A: [{ key: "x", qty: 1 }], ESTOQUE_V: [{ key: "y", qty: 1 }] },
    });
  });

  it("divide a mesma peça quando nenhum estoque tem a quantidade toda", () => {
    const r = allocateStock([line("x", 3, 2, 1)]);
    expect(r).toEqual({
      ok: true,
      byLocation: { ESTOQUE_A: [{ key: "x", qty: 2 }], ESTOQUE_V: [{ key: "x", qty: 1 }] },
    });
  });

  it("acusa falta quando a soma dos dois estoques não basta", () => {
    const r = allocateStock([line("x", 4, 2, 1), line("y", 1, 1, 0)]);
    expect(r).toEqual({ ok: false, shortages: [{ key: "x", requested: 4, available: 3 }] });
  });

  it("ignora saldo negativo ao informar o disponível", () => {
    const r = allocateStock([line("x", 1, -2, 0)]);
    expect(r).toEqual({ ok: false, shortages: [{ key: "x", requested: 1, available: 0 }] });
  });

  it("peça sem controle de estoque acompanha o primeiro pedido", () => {
    const r = allocateStock([line("x", 1, 0, 1), line("livre", 2, 0, 0, false)]);
    expect(r).toEqual({ ok: true, byLocation: { ESTOQUE_V: [{ key: "x", qty: 1 }, { key: "livre", qty: 2 }] } });
  });

  it("pedido só com peças sem controle de estoque vai para o Estoque A", () => {
    const r = allocateStock([line("livre", 1, 0, 0, false)]);
    expect(r).toEqual({ ok: true, byLocation: { ESTOQUE_A: [{ key: "livre", qty: 1 }] } });
  });
});

describe("decideCustomer", () => {
  it("cliente logado usa o próprio cadastro, mesmo se digitar outro e-mail", () => {
    expect(decideCustomer({ sessionEmail: "a@a.com", formEmail: "b@b.com", formEmailHasAccount: true })).toBe("session");
  });

  it("visitante com e-mail de uma conta precisa entrar", () => {
    expect(decideCustomer({ sessionEmail: null, formEmail: "b@b.com", formEmailHasAccount: true })).toBe("login-required");
  });

  it("visitante com e-mail sem conta é vinculado pelo e-mail", () => {
    expect(decideCustomer({ sessionEmail: null, formEmail: "b@b.com", formEmailHasAccount: false })).toBe("by-email");
  });

  it("visitante sem e-mail é vinculado pelo telefone", () => {
    expect(decideCustomer({ sessionEmail: null, formEmail: null, formEmailHasAccount: false })).toBe("by-phone");
  });
});

describe("diversos", () => {
  it("gera número de pedido no formato AUR-000000", () => {
    expect(generateSiteOrderNumber(() => 123456)).toBe("AUR-123456");
  });

  it("detecta o campo escondido preenchido", () => {
    expect(isHoneypotFilled("http://spam")).toBe(true);
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled(null)).toBe(false);
  });

  it("acrescenta observação sem apagar a existente", () => {
    expect(appendNote(null, "b")).toBe("b");
    expect(appendNote("a", "b")).toBe("a\nb");
  });
});
