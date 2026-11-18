import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStore } from "./local-store";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
  });
  vi.stubGlobal("window", { addEventListener: () => {}, removeEventListener: () => {} });
});
afterEach(() => vi.unstubAllGlobals());

const EMPTY: string[] = [];
const parse = (raw: unknown) => (Array.isArray(raw) ? raw.map(String) : EMPTY);

describe("createLocalStore", () => {
  it("servidor sempre vê o valor vazio", () => {
    memory.set("k", JSON.stringify(["a"]));
    expect(createLocalStore("k", parse, EMPTY).getServerSnapshot()).toBe(EMPTY);
  });

  it("lê o salvo e devolve a mesma referência enquanto nada muda", () => {
    memory.set("k", JSON.stringify(["a", "b"]));
    const s = createLocalStore("k", parse, EMPTY);
    const first = s.getSnapshot();
    expect(first).toEqual(["a", "b"]);
    expect(s.getSnapshot()).toBe(first);
  });

  it("JSON inválido vira vazio", () => {
    memory.set("k", "{quebrado");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(createLocalStore("k", parse, EMPTY).getSnapshot()).toBe(EMPTY);
  });

  it("set grava, atualiza a leitura e avisa quem ouve", () => {
    const s = createLocalStore("k", parse, EMPTY);
    const onChange = vi.fn();
    const unsubscribe = s.subscribe(onChange);
    s.set(["x"]);
    expect(s.getSnapshot()).toEqual(["x"]);
    expect(memory.get("k")).toBe('["x"]');
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
    s.set(["y"]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
