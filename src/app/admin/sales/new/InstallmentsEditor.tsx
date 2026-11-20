"use client";

import React from "react";
import ChoiceChips from "@/components/admin/ui/ChoiceChips";
import { formatBRL, parseBRL, toBRLInput } from "@/lib/format";
import {
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  buildInstallments,
  defaultFirstDueDate,
  type InstallmentInput,
} from "@/lib/installments";

const fieldClass =
  "min-h-12 w-full rounded-lg border border-primary/20 bg-accent-cream px-3.5 text-base text-primary";
const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

const COUNT_OPTIONS = Array.from({ length: MAX_INSTALLMENTS - MIN_INSTALLMENTS + 1 }, (_, i) => i + MIN_INSTALLMENTS);

/**
 * Parcelado sim/não, quantidade, 1º vencimento e cada parcela (data e valor editáveis).
 * Lista vazia = venda sem parcelas. Quando o total do pedido muda, quem refaz os valores é o OrderForm.
 */
export default function InstallmentsEditor({
  total,
  value,
  onChange,
}: {
  total: number;
  value: InstallmentInput[];
  onChange: (next: InstallmentInput[]) => void;
}) {
  const enabled = value.length > 0;
  const count = value.length || MIN_INSTALLMENTS;
  const firstDueDate = value[0]?.dueDate || defaultFirstDueDate();

  const sumCents = value.reduce((acc, i) => acc + Math.round(i.amount * 100), 0);
  const diffCents = Math.round(total * 100) - sumCents;

  const updateRow = (number: number, patch: Partial<InstallmentInput>) =>
    onChange(value.map((i) => (i.number === number ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-4">
      <ChoiceChips<"NO" | "YES">
        name="installmentsEnabled"
        legend="Parcelado?"
        value={enabled ? "YES" : "NO"}
        onChange={(v) => onChange(v === "YES" ? buildInstallments(total, MIN_INSTALLMENTS, defaultFirstDueDate()) : [])}
        options={[
          { value: "NO", label: "Não" },
          { value: "YES", label: "Sim" },
        ]}
      />

      {enabled && (
        <fieldset className="space-y-4 rounded-lg border border-primary/15 p-3.5">
          <legend className="px-1 text-sm font-semibold text-primary">Parcelas</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="installments-count" className={labelClass}>
                Quantas parcelas
              </label>
              <select
                id="installments-count"
                value={count}
                onChange={(e) => onChange(buildInstallments(total, Number(e.target.value), firstDueDate))}
                className={fieldClass}
              >
                {COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="installments-first-due" className={labelClass}>
                1º vencimento
              </label>
              <input
                id="installments-first-due"
                type="date"
                value={firstDueDate}
                onChange={(e) => e.target.value && onChange(buildInstallments(total, count, e.target.value))}
                className={fieldClass}
              />
            </div>
          </div>

          <ol className="space-y-2">
            {value.map((inst) => (
              <li key={inst.number} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
                <span className="text-sm font-semibold text-primary/70">
                  {inst.number}/{value.length}
                </span>
                <input
                  type="date"
                  aria-label={`Vencimento da parcela ${inst.number}`}
                  value={inst.dueDate}
                  onChange={(e) => e.target.value && updateRow(inst.number, { dueDate: e.target.value })}
                  className={`${fieldClass} px-2.5`}
                />
                <input
                  // Remonta quando o valor muda por fora (nova divisão), para mostrar o número novo.
                  key={`${inst.number}-${inst.amount}`}
                  type="text"
                  inputMode="decimal"
                  aria-label={`Valor da parcela ${inst.number}`}
                  defaultValue={toBRLInput(inst.amount)}
                  onBlur={(e) => {
                    const n = parseBRL(e.target.value);
                    if (Number.isFinite(n) && n > 0) updateRow(inst.number, { amount: Math.round(n * 100) / 100 });
                    else e.target.value = toBRLInput(inst.amount);
                  }}
                  className={`${fieldClass} px-2.5 text-right`}
                />
              </li>
            ))}
          </ol>

          <p className={`text-sm ${diffCents === 0 ? "text-primary/70" : "font-semibold text-amber-700"}`} aria-live="polite">
            Soma: {formatBRL(sumCents / 100)}
            {diffCents > 0 && ` — faltam ${formatBRL(diffCents / 100)} para o total`}
            {diffCents < 0 && ` — passa ${formatBRL(-diffCents / 100)} do total`}
          </p>
        </fieldset>
      )}
    </div>
  );
}
