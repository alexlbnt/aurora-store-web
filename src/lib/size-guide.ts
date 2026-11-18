// Tabela de medidas da Aurora: fonte única para o FAQ e a página do produto.
// Medidas do corpo (não da peça). Para mudar um valor, mude só aqui.

export interface SizeGuideRow {
  size: string;
  busto: string;
  cintura: string;
  quadril: string;
  manequim: string;
}

export const SIZE_GUIDE: readonly SizeGuideRow[] = [
  { size: "P", busto: "84 - 88 cm", cintura: "66 - 70 cm", quadril: "92 - 96 cm", manequim: "36 - 38" },
  { size: "M", busto: "89 - 94 cm", cintura: "71 - 76 cm", quadril: "97 - 102 cm", manequim: "40 - 42" },
  { size: "G", busto: "95 - 100 cm", cintura: "77 - 82 cm", quadril: "103 - 108 cm", manequim: "44 - 46" },
  { size: "GG", busto: "101 - 108 cm", cintura: "83 - 90 cm", quadril: "109 - 116 cm", manequim: "48" },
];

/** Endereço da tabela completa (usado quando a janela não abre). */
export const SIZE_GUIDE_HREF = "/faq#tamanhos";

const normalize = (s: string) => s.trim().toUpperCase();

/** O produto tem algum tamanho que aparece na tabela? Produto "Único" não precisa do guia. */
export function hasSizeGuide(sizes: readonly string[]): boolean {
  const known = new Set(SIZE_GUIDE.map((r) => r.size));
  return sizes.some((s) => known.has(normalize(s)));
}

/** Compara o tamanho escolhido com a linha da tabela, sem diferenciar maiúsculas e espaços. */
export const isSameSize = (a: string, b: string) => normalize(a) === normalize(b);
