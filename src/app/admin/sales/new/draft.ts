// Leitura tolerante dos campos novos do rascunho: rascunhos de versões antigas (ou estragados)
// não podem travar o formulário de venda.
import type { InstallmentInput } from "@/lib/installments";

const isInstallment = (x: unknown): x is InstallmentInput => {
  const i = x as Partial<InstallmentInput> | null;
  return (
    !!i &&
    Number.isInteger(i.number) &&
    typeof i.dueDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) &&
    typeof i.amount === "number" &&
    Number.isFinite(i.amount)
  );
};

export function readDraftExtras(raw: unknown): { resellerName: string; installments: InstallmentInput[] } {
  const draft = (raw && typeof raw === "object" ? raw : {}) as { resellerName?: unknown; installments?: unknown };
  const installments =
    Array.isArray(draft.installments) && draft.installments.every(isInstallment) ? draft.installments : [];
  return {
    resellerName: typeof draft.resellerName === "string" ? draft.resellerName : "",
    installments,
  };
}
