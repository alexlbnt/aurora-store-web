// Revendedora que fez a venda: só uma anotação no pedido (sem cadastro, comissão ou relatório).

export const RESELLER_NAME_MAX = 80;

/** Texto do campo → nome gravado no pedido, ou null quando vazio. */
export function parseResellerName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().slice(0, RESELLER_NAME_MAX).trim();
  return name || null;
}

/** "Ána  Paula " e "ana paula" contam como o mesmo nome. */
const sameNameKey = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Sugestões do campo: nomes já usados, sem vazios nem grafias repetidas (fica a 1ª), em ordem alfabética. */
export function uniqueResellerNames(names: (string | null)[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of names) {
    const name = parseResellerName(raw);
    if (name && !byKey.has(sameNameKey(name))) byKey.set(sameNameKey(name), name);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
