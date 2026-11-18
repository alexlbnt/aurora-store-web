// Linha da grade de variações que o formulário de produto envia (JSON em "variantsMatrix").
// Os números podem chegar como texto (campo do formulário) ou número.
export interface VariantMatrixRow {
  size: string;
  color: string;
  sku?: string;
  price?: string | number | null;
  stockA?: string | number | null;
  stockV?: string | number | null;
}

/** Converte para inteiro; vazio ou inválido vira 0 (mesma regra de antes: parseInt || 0). */
export const toStock = (value: VariantMatrixRow["stockA"]): number => parseInt(String(value ?? ""), 10) || 0;
